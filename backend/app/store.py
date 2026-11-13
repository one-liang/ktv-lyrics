"""歌曲快取：每首歌一個資料夾 data/songs/<video_id>/，內含 meta.json 與兩軌音訊。"""

from __future__ import annotations

import json
import re
import threading
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"
SONGS_DIR = DATA_DIR / "songs"
SONGS_DIR.mkdir(parents=True, exist_ok=True)

TRACKS = {"vocals": "vocals.mp3", "inst": "inst.mp3"}

_VIDEO_ID = re.compile(r"^[A-Za-z0-9_-]{6,20}$")
_lock = threading.Lock()


def valid_id(video_id: str) -> bool:
    return bool(_VIDEO_ID.match(video_id))


def song_dir(video_id: str) -> Path:
    if not valid_id(video_id):
        raise ValueError("invalid video id")
    return SONGS_DIR / video_id


def track_path(video_id: str, track: str) -> Path:
    return song_dir(video_id) / TRACKS[track]


def is_ready(video_id: str) -> bool:
    d = song_dir(video_id)
    return (d / "meta.json").exists() and all((d / f).exists() for f in TRACKS.values())


def load_meta(video_id: str) -> dict[str, Any] | None:
    p = song_dir(video_id) / "meta.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def save_meta(video_id: str, meta: dict[str, Any]) -> None:
    d = song_dir(video_id)
    d.mkdir(parents=True, exist_ok=True)
    tmp = d / "meta.json.tmp"
    with _lock:
        tmp.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(d / "meta.json")


def update_meta(video_id: str, **fields: Any) -> dict[str, Any]:
    meta = load_meta(video_id) or {"id": video_id}
    meta.update(fields)
    save_meta(video_id, meta)
    return meta


def touch_played(video_id: str) -> None:
    if load_meta(video_id) is not None:
        update_meta(video_id, lastPlayed=time.time())


def library() -> list[dict[str, Any]]:
    items = []
    for d in SONGS_DIR.iterdir():
        if not d.is_dir() or not is_ready(d.name):
            continue
        meta = load_meta(d.name) or {}
        items.append(
            {
                "id": d.name,
                "title": meta.get("title", d.name),
                "artist": meta.get("artist"),
                "track": meta.get("track"),
                "duration": meta.get("duration"),
                "thumbnail": meta.get("thumbnail"),
                "hasLyrics": bool(meta.get("lrc")),
                "lastPlayed": meta.get("lastPlayed") or meta.get("createdAt") or 0,
            }
        )
    items.sort(key=lambda m: m["lastPlayed"], reverse=True)
    return items
