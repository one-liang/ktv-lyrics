"""處理佇列：下載 → 分離 → 抓歌詞。只有一張顯卡，所以一次處理一首。"""

from __future__ import annotations

import logging
import queue
import shutil
import threading
import time
from dataclasses import asdict, dataclass, field
from typing import Any

from . import lyrics, romaji, separate, store, sync, youtube, zh

log = logging.getLogger("ktv.jobs")


@dataclass
class Job:
    id: str
    stage: str = "queued"  # queued | downloading | separating | lyrics | done | error
    progress: float = 0.0  # 該階段進度 0~1
    error: str | None = None
    updated: float = field(default_factory=time.time)


_jobs: dict[str, Job] = {}
_queue: "queue.Queue[str]" = queue.Queue()
_lock = threading.Lock()


def status(video_id: str) -> dict[str, Any]:
    with _lock:
        job = _jobs.get(video_id)
        # 正在處理中就照實回報：音檔寫好了但還在配歌詞時，不能先說 done，
        # 否則播放頁會在歌詞掛上之前就載入，顯示「沒有配到歌詞」
        if job is not None and job.stage not in ("done", "error"):
            return asdict(job)
    if store.is_ready(video_id):
        return {"id": video_id, "stage": "done", "progress": 1.0, "error": None}
    if job is None or job.stage == "done":
        return {"id": video_id, "stage": "idle", "progress": 0.0, "error": None}
    return asdict(job)


def enqueue(video_id: str) -> dict[str, Any]:
    if store.is_ready(video_id):
        return status(video_id)
    with _lock:
        job = _jobs.get(video_id)
        # done 但檔案不見了（使用者刪掉資料夾要重做）也要重新排隊
        if job is None or job.stage in ("error", "done"):
            _jobs[video_id] = Job(video_id)
            _queue.put(video_id)
    return status(video_id)


def _set(job: Job, stage: str | None = None, progress: float | None = None) -> None:
    with _lock:
        if stage is not None:
            job.stage = stage
        if progress is not None:
            job.progress = progress
        job.updated = time.time()


def _source_info(c: dict[str, Any]) -> dict[str, Any]:
    return {k: c.get(k) for k in ("id", "track", "artist", "album", "duration")}


def attach_lyrics(
    video_id: str,
    lrc: str | None,
    source: dict[str, Any] | None = None,
    checked: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """寫入歌詞：簡體轉繁體、核對時間（對得上就順便把 offset 調好）、日文歌產生羅馬拼音。"""
    lrc = zh.to_traditional(lrc)
    fields: dict[str, Any] = {"lrc": lrc, "lyricsSource": source}
    if lrc and checked is None:
        checked = sync.check(store.track_path(video_id, "vocals"), lrc)
    fields["sync"] = checked if lrc else None
    # 換了歌詞，舊的 offset 就不適用了：對得上用建議值，對不上歸零讓使用者自己調
    fields["offset"] = checked["offset"] if checked and checked["status"] != "poor" else 0.0
    if lrc and romaji.is_japanese(lrc):
        fields["romaji"] = romaji.lrc_romaji(lrc)
        fields["language"] = "ja"
    else:
        fields["romaji"] = None
        fields["language"] = None
    return store.update_meta(video_id, **fields)


def ensure_current(video_id: str) -> dict[str, Any] | None:
    """舊版處理的歌第一次打開時補做：簡體歌詞轉繁體、核對時間。使用者自己調過 offset 就不動它。"""
    meta = store.load_meta(video_id)
    if not meta or not meta.get("lrc"):
        return meta
    fields: dict[str, Any] = {}
    traditional = zh.to_traditional(meta["lrc"])
    if traditional != meta["lrc"]:
        fields["lrc"] = traditional
    if "sync" not in meta:
        checked = sync.check(store.track_path(video_id, "vocals"), meta["lrc"])
        fields["sync"] = checked
        if checked and checked["status"] == "shifted" and not meta.get("offset"):
            fields["offset"] = checked["offset"]
    return store.update_meta(video_id, **fields) if fields else meta


def choose_lyrics(video_id: str, meta: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any] | None] | None:
    """從 LRCLIB 的候選裡，挑和人聲軌最對得上的一份。"""
    cands = lyrics.candidates(meta)
    if not cands:
        return None
    duration = meta.get("duration") or 0
    try:
        feats = sync.features(store.track_path(video_id, "vocals"))
    except Exception:  # noqa: BLE001 — 核對失敗就退回只看長度
        log.exception("讀取人聲軌失敗：%s", video_id)
        feats = None

    scored = []
    for c in cands:
        checked = sync.analyze(feats, c["lrc"]) if feats is not None else None
        diff = abs((c.get("duration") or duration) - duration)
        scored.append((sync.rank(checked), -diff, c, checked))
    scored.sort(key=lambda x: (x[0], x[1]), reverse=True)
    _, neg_diff, best, checked = scored[0]
    if checked and checked["status"] != "poor":
        return best, checked
    # 都對不上時：長度幾乎一樣才先掛上（畫面會提示可能對不上），否則讓使用者自己挑
    if -neg_diff <= 3:
        return best, checked
    return None


def _process(job: Job) -> None:
    vid = job.id
    work = store.song_dir(vid)
    work.mkdir(parents=True, exist_ok=True)

    _set(job, "downloading", 0.0)
    source, info = youtube.download_audio(vid, work, lambda p: _set(job, progress=p))
    store.update_meta(vid, id=vid, createdAt=time.time(), offset=0.0, **info)

    _set(job, "separating", 0.0)
    separate.separate(source, work, lambda p: _set(job, progress=p))
    source.unlink(missing_ok=True)

    _set(job, "lyrics", 0.0)
    meta = store.load_meta(vid) or {}
    picked = choose_lyrics(vid, meta)
    if picked:
        best, checked = picked
        attach_lyrics(vid, best["lrc"], _source_info(best), checked or {"status": "unknown", "offset": 0.0})
    else:
        store.update_meta(vid, lrc=None, romaji=None, lyricsSource=None, sync=None)
    _set(job, "done", 1.0)


def _worker() -> None:
    while True:
        vid = _queue.get()
        with _lock:
            job = _jobs.get(vid)
        if job is None:
            continue
        try:
            _process(job)
        except Exception as exc:  # noqa: BLE001 — 錯誤要回報到前端
            log.exception("處理 %s 失敗", vid)
            with _lock:
                job.stage = "error"
                job.error = str(exc) or exc.__class__.__name__
            # 清掉半成品，下次重來
            shutil.rmtree(store.song_dir(vid), ignore_errors=True)
        finally:
            _queue.task_done()


threading.Thread(target=_worker, name="ktv-worker", daemon=True).start()
