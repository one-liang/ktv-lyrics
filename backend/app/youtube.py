"""透過 yt-dlp 搜尋 YouTube 與下載音訊（僅供個人自用）。"""

from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any, Callable

import yt_dlp

# yt-dlp 解析 YouTube 需要 JS 執行環境，本機已有 Node.js
_BASE_OPTS: dict[str, Any] = {
    "quiet": True,
    "no_warnings": True,
    "noprogress": True,
    "js_runtimes": {"node": {}},
}

_PREFER = re.compile(r"official audio|audio only|topic|lyrics?|歌詞|字幕|羅馬|full ver", re.I)
_AVOID = re.compile(
    r"\b(live|tour|concert|cover(ed|s)?|remix|karaoke|instrumental|off ?vocal|shorts?|reaction|tutorial|piano|"
    r"remaster(ed)?|4k|60fps|sped ?up|slowed|nightcore|8d)\b"
    r"|翻唱|伴奏|カラオケ|歌ってみた|弾いてみた|ライブ|演唱會|現場|粵語|改編|填詞",
    re.I,
)
_MV = re.compile(r"music video|\bmv\b|\bpv\b|video clip", re.I)


def _thumb(entry: dict[str, Any]) -> str | None:
    thumbs = entry.get("thumbnails") or []
    if thumbs:
        # 取中等尺寸
        thumbs = sorted(thumbs, key=lambda t: t.get("width") or 0)
        for t in thumbs:
            if (t.get("width") or 0) >= 300:
                return t.get("url")
        return thumbs[-1].get("url")
    vid = entry.get("id")
    return f"https://i.ytimg.com/vi/{vid}/mqdefault.jpg" if vid else None


def _is_official(channel: str, query: str) -> bool:
    """頻道名稱（或其中一段，例如「Kenshi Yonezu 米津玄師」的「米津玄師」）出現在搜尋字裡。"""
    name = channel.lower().removesuffix(" - topic").strip()
    if not name:
        return False
    q = query.lower()
    return name in q or any(len(tok) >= 2 and tok in q for tok in re.split(r"[\s/|・,]+", name))


def _consensus_duration(entries: list[dict[str, Any]]) -> int | None:
    """多數結果共同的長度（±3 秒內至少 3 支）：通常就是錄音室版本的長度。"""
    durs = [int(e["duration"]) for e in entries if 90 <= (e.get("duration") or 0) <= 600]
    best, best_n = None, 0
    for d in durs:
        n = sum(1 for x in durs if abs(x - d) <= 3)
        if n > best_n:
            best, best_n = d, n
    return best if best_n >= 3 else None


def _score(entry: dict[str, Any], query: str = "", consensus: int | None = None) -> int:
    title = entry.get("title", "") or ""
    channel = (entry.get("channel") or entry.get("uploader") or "").strip()
    text = f"{title} {channel}"
    score = 0
    # 官方頻道上傳、標題沒有 MV 字樣 → 多半是錄音室版本
    if channel.endswith(" - Topic") or (_is_official(channel, query) and not _MV.search(title)):
        score += 3
    elif _PREFER.search(text):
        score += 1
    if _AVOID.search(text):
        score -= 4
    dur = entry.get("duration") or 0
    if dur and (dur < 90 or dur > 600):
        score -= 3
    # 長度和多數結果一致 → 歌詞時間軸最可能對得上；差很多（MV 前奏、加長版）就往後排
    if consensus and dur:
        if abs(dur - consensus) <= 3:
            score += 2
        elif abs(dur - consensus) > 12:
            score -= 2
    return score


def _ytsearch(query: str, n: int) -> list[dict[str, Any]]:
    opts = {**_BASE_OPTS, "extract_flat": "in_playlist", "skip_download": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"ytsearch{n}:{query}", download=False)
    return [e for e in (info or {}).get("entries") or [] if e and e.get("id")]


def search(query: str, limit: int = 10) -> list[dict[str, Any]]:
    # 一般搜尋＋「official audio」搜尋同時跑，把錄音室版本撈出來
    with ThreadPoolExecutor(max_workers=2) as pool:
        main = pool.submit(_ytsearch, query, limit + 5)
        audio = pool.submit(_ytsearch, f"{query} official audio", 6)
        entries = main.result()
        try:
            extra = audio.result()
        except Exception:  # noqa: BLE001 — 輔助搜尋失敗不影響主要結果
            extra = []
    seen: set[str] = set()
    merged = []
    for e in entries + extra:
        if e["id"] not in seen:
            seen.add(e["id"])
            merged.append(e)
    consensus = _consensus_duration(merged)
    # 穩定排序：分數高的往前，其餘維持 YouTube 原排序
    ranked = sorted(enumerate(merged), key=lambda p: (-_score(p[1], query, consensus), p[0]))
    results = []
    for _, e in ranked[:limit]:
        channel = (e.get("channel") or e.get("uploader") or "").strip()
        dur = e.get("duration")
        results.append(
            {
                "id": e["id"],
                "title": e.get("title") or e["id"],
                "channel": channel or None,
                "duration": dur,
                "thumbnail": _thumb(e),
                "official": channel.endswith(" - Topic") or _is_official(channel, query),
                "studioLength": bool(consensus and dur and abs(dur - consensus) <= 3),
                "recommended": _score(e, query, consensus) >= 3,
            }
        )
    return results


def download_audio(video_id: str, out_dir: Path, on_progress: Callable[[float], None]) -> tuple[Path, dict[str, Any]]:
    """下載最佳音訊，回傳 (檔案路徑, 影片資訊)。"""
    out_dir.mkdir(parents=True, exist_ok=True)

    def hook(d: dict[str, Any]) -> None:
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            if total:
                on_progress(min(1.0, d.get("downloaded_bytes", 0) / total))
        elif d.get("status") == "finished":
            on_progress(1.0)

    opts = {
        **_BASE_OPTS,
        "format": "bestaudio/best",
        "outtmpl": str(out_dir / "source.%(ext)s"),
        "progress_hooks": [hook],
        "overwrites": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
        path = Path(ydl.prepare_filename(info))
    if not path.exists():
        candidates = sorted(out_dir.glob("source.*"))
        if not candidates:
            raise RuntimeError("下載完成但找不到音訊檔")
        path = candidates[0]
    meta = {
        "title": info.get("title"),
        "channel": info.get("channel") or info.get("uploader"),
        "duration": info.get("duration"),
        "thumbnail": info.get("thumbnail"),
        "track": info.get("track"),
        "artist": (info.get("artist") or info.get("creator") or "").split(",")[0].strip() or None,
    }
    return path, meta
