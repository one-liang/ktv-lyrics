"""從 LRCLIB 取得同步歌詞（LRC 格式）。"""

from __future__ import annotations

import re
from typing import Any

import httpx

API = "https://lrclib.net/api"
HEADERS = {"User-Agent": "ktv-lyrics-practice/0.1 (personal use)"}

# 清掉 YouTube 標題裡常見的雜訊
_NOISE = re.compile(
    r"[\(\[【（「『]?\s*(official\s*(music\s*)?(video|audio|mv|lyric video)|music video|lyric video|lyrics?|"
    r"mv|pv|audio|full\s*ver\.?|hd|4k|歌詞|中字|中日字幕|日本語字幕|動態歌詞)\s*[\)\]】）」』]?",
    re.I,
)
_BRACKETS = re.compile(r"[\(\[【（][^\)\]】）]*[\)\]】）]")


def clean_title(title: str) -> str:
    t = _NOISE.sub(" ", title)
    t = _BRACKETS.sub(" ", t)
    t = re.sub(r"[「」『』\"“”/|｜]", " ", t)
    t = re.sub(r"\s*-\s*Topic\b", " ", t)
    return re.sub(r"\s+", " ", t).strip(" -・")


def _norm(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": r.get("id"),
        "track": r.get("trackName"),
        "artist": r.get("artistName"),
        "album": r.get("albumName"),
        "duration": r.get("duration"),
        "synced": bool(r.get("syncedLyrics")),
        "lrc": r.get("syncedLyrics"),
    }


def search(query: str) -> list[dict[str, Any]]:
    with httpx.Client(headers=HEADERS, timeout=15) as client:
        resp = client.get(f"{API}/search", params={"q": query})
        resp.raise_for_status()
        return [_norm(r) for r in resp.json()]


def search_fields(track: str, artist: str | None) -> list[dict[str, Any]]:
    params = {"track_name": track}
    if artist:
        params["artist_name"] = artist
    with httpx.Client(headers=HEADERS, timeout=15) as client:
        resp = client.get(f"{API}/search", params=params)
        resp.raise_for_status()
        return [_norm(r) for r in resp.json()]


def find_best(meta: dict[str, Any]) -> dict[str, Any] | None:
    """依影片資訊找最可能的同步歌詞：優先 track+artist，其次清理後的標題；選時長最接近的。"""
    duration = meta.get("duration") or 0
    candidates: list[dict[str, Any]] = []
    try:
        if meta.get("track"):
            candidates += search_fields(meta["track"], meta.get("artist"))
        if not any(c["synced"] for c in candidates):
            q = clean_title(meta.get("title") or "")
            if q:
                candidates += search(q)
    except httpx.HTTPError:
        return None

    synced = [c for c in candidates if c["synced"]]
    if not synced:
        return None
    if duration:
        synced.sort(key=lambda c: abs((c.get("duration") or 0) - duration))
        best = synced[0]
        # 時長差太多多半是不同版本，寧可讓使用者自己挑
        if abs((best.get("duration") or 0) - duration) > 20:
            return None
        return best
    return synced[0]
