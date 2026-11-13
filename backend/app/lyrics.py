"""從 LRCLIB 取得同步歌詞（LRC 格式）。"""

from __future__ import annotations

import re
from typing import Any

import httpx

API = "https://lrclib.net/api"
HEADERS = {"User-Agent": "ktv-lyrics-practice/0.1 (personal use)"}

# 清掉 YouTube 標題裡常見的雜訊
_NOISE = re.compile(
    r"[\(\[【（「『]?\s*(official\s*(hd\s*|4k\s*)?(music\s*)?(video|audio|mv|lyric video)|music video|lyric video|lyrics?|"
    r"mv|pv|audio|full\s*ver\.?|hd|4k|歌詞|中字|中日字幕|日本語字幕|動態歌詞)\s*[\)\]】）」』]?",
    re.I,
)
_BRACKETS = re.compile(r"[\(\[【（][^\)\]】）]*[\)\]】）]")


def _halfwidth_brackets(t: str) -> str:
    return t.translate(str.maketrans("［］〔〕", "[][]"))


def clean_title(title: str) -> str:
    t = _NOISE.sub(" ", _halfwidth_brackets(title))
    t = _BRACKETS.sub(" ", t)
    t = re.sub(r"[「」『』\"“”/|｜]", " ", t)
    t = re.sub(r"\s*-\s*Topic\b", " ", t)
    return re.sub(r"\s+", " ", t).strip(" -・")


_QUOTED = re.compile(r"[【「『\[]([^】」』\]]+)[】」』\]]")
_CJK_RUN = re.compile(r"[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af][\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\s・ー]*")


_JUNK = re.compile(r"(official|hd|4k|mv|pv|lyrics?|audio|video|live|remaster(ed)?|\d{4})(\s+\S+)?", re.I)


def title_names(title: str) -> list[str]:
    """從 MV 標題裡挖可能的歌名：「」【】裡的字，以及其中的中日韓文部分。

    例如「周杰倫 Jay Chou【晴天 Sunny Day】-Official Music Video」→ ["晴天 Sunny Day", "晴天"]，
    「YOASOBI「夜に駆ける」 Official Music Video」→ ["夜に駆ける"]。
    """
    names: list[str] = []
    for inner in _QUOTED.findall(_halfwidth_brackets(title)):
        inner = _NOISE.sub(" ", inner).strip(" -・")
        if not inner or _JUNK.fullmatch(inner):
            continue
        names.append(re.sub(r"\s+", " ", inner))
        cjk = [m.strip() for m in _CJK_RUN.findall(inner) if m.strip()]
        if cjk and cjk[0] != inner:
            names.append(cjk[0])
    return list(dict.fromkeys(names))


def _clean_album(a: Any) -> str | None:
    return a if isinstance(a, str) and a.strip() and a.strip().lower() != "null" else None


def _norm(r: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": r.get("id"),
        "track": r.get("trackName"),
        "artist": r.get("artistName"),
        "album": _clean_album(r.get("albumName")),
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


def get_exact(track: str, artist: str, album: str | None, duration: float) -> dict[str, Any] | None:
    """LRCLIB 的精確比對：歌名、歌手、（專輯）、長度 ±2 秒都要對上。"""
    params: dict[str, Any] = {"track_name": track, "artist_name": artist, "duration": round(duration)}
    if album:
        params["album_name"] = album
    with httpx.Client(headers=HEADERS, timeout=15) as client:
        resp = client.get(f"{API}/get", params=params)
        if resp.status_code == 404:
            return None
        resp.raise_for_status()
        return _norm(resp.json())


def _artist_hit(row: dict[str, Any], context: str) -> bool:
    """這份歌詞的歌手有沒有出現在影片標題／頻道／歌手欄位裡。"""
    artist = (row.get("artist") or "").lower()
    if not artist:
        return False
    if artist in context:
        return True
    return any(len(tok) >= 2 and tok in context for tok in re.split(r"[\s,&/・、]+|feat\.?", artist))


MAX_DURATION_GAP = 90  # 和 sync 的搜尋範圍一致：MV 多一段前奏也找得回來


def candidates(meta: dict[str, Any], limit: int = 25) -> list[dict[str, Any]]:
    """收集可能的同步歌詞：精確比對 → 歌名＋歌手 → 只用歌名 → MV 標題裡的歌名 → 清理過的標題。

    同一首歌在 LRCLIB 常有好幾份，時間軸品質不一，長度欄位也常標錯，
    所以多收幾份，交給 sync 用人聲軌挑。歌手對得上的排前面，其次長度接近的。
    """
    duration = meta.get("duration") or 0
    track, artist, album = meta.get("track"), meta.get("artist"), meta.get("album")
    title = meta.get("title") or ""
    context = " ".join(x for x in (title, meta.get("channel"), artist) if x).lower()
    found: dict[int, dict[str, Any]] = {}

    def add(rows: list[dict[str, Any] | None]) -> None:
        for r in rows:
            if not r or not r.get("synced") or r["id"] in found:
                continue
            if duration and r.get("duration") and abs(r["duration"] - duration) > MAX_DURATION_GAP:
                continue
            found[r["id"]] = r

    def good_enough() -> int:
        return sum(
            1
            for r in found.values()
            if _artist_hit(r, context) and (not duration or abs((r.get("duration") or 0) - duration) <= 3)
        )

    steps = []
    if track and artist and duration:
        steps.append(lambda: [get_exact(track, artist, album, duration)])
    if track:
        steps.append(lambda: search_fields(track, artist))
        # YouTube 給的歌手名常是英文拼法（Kenshi Yonezu），LRCLIB 可能是「米津玄師」，所以也只用歌名找
        steps.append(lambda: search_fields(track, None))
    for name in title_names(title):
        if name != track:
            steps.append(lambda name=name: search_fields(name, None))
    title_q = clean_title(title)
    if title_q:
        steps.append(lambda: search(title_q))

    for step in steps:
        try:
            add(step())
        except httpx.HTTPError:
            continue
        if good_enough() >= 4:
            break

    names = [n.lower() for n in ([track] if track else []) + title_names(title)]

    def name_hit(r: dict[str, Any]) -> bool:
        t = (r.get("track") or "").lower()
        return bool(t) and any(n in t or t in n for n in names)

    def order(r: dict[str, Any]) -> tuple[bool, bool, float]:
        gap = abs((r.get("duration") or 0) - duration) if duration else 0
        # 歌名對得上的優先，其次歌手對得上，最後看長度
        return (not name_hit(r), not _artist_hit(r, context), gap)

    return sorted(found.values(), key=order)[:limit]
