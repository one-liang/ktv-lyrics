"""處理佇列：下載 → 分離 → 抓歌詞。只有一張顯卡，所以一次處理一首。"""

from __future__ import annotations

import logging
import queue
import shutil
import threading
import time
from dataclasses import asdict, dataclass, field
from typing import Any

from . import lyrics, romaji, separate, store, youtube

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
    if store.is_ready(video_id):
        return {"id": video_id, "stage": "done", "progress": 1.0, "error": None}
    with _lock:
        job = _jobs.get(video_id)
    if job is None:
        return {"id": video_id, "stage": "idle", "progress": 0.0, "error": None}
    return asdict(job)


def enqueue(video_id: str) -> dict[str, Any]:
    if store.is_ready(video_id):
        return status(video_id)
    with _lock:
        job = _jobs.get(video_id)
        if job is None or job.stage == "error":
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


def attach_lyrics(video_id: str, lrc: str | None, source: dict[str, Any] | None = None) -> dict[str, Any]:
    """寫入歌詞，日文歌順便產生羅馬拼音。"""
    fields: dict[str, Any] = {"lrc": lrc, "lyricsSource": source}
    if lrc and romaji.is_japanese(lrc):
        fields["romaji"] = romaji.lrc_romaji(lrc)
        fields["language"] = "ja"
    else:
        fields["romaji"] = None
        fields["language"] = None
    return store.update_meta(video_id, **fields)


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
    best = lyrics.find_best(meta)
    if best:
        attach_lyrics(vid, best["lrc"], {k: best.get(k) for k in ("id", "track", "artist", "duration")})
    else:
        store.update_meta(vid, lrc=None, romaji=None)
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
