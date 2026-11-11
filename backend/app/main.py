"""KTV 練唱工具本機後端。

啟動：cd backend && uv run uvicorn app.main:app --port 8000
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import jobs, lyrics, separate, store, youtube

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="KTV Lyrics")


def _check_id(video_id: str) -> None:
    if not store.valid_id(video_id):
        raise HTTPException(400, "影片 ID 格式不對")


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "device": separate.device()}


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1, max_length=200)) -> list[dict[str, Any]]:
    try:
        results = await run_in_threadpool(youtube.search, q)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"YouTube 搜尋失敗：{exc}") from exc
    for r in results:
        r["cached"] = store.valid_id(r["id"]) and store.is_ready(r["id"])
    return results


@app.get("/api/library")
def library() -> list[dict[str, Any]]:
    return store.library()


@app.post("/api/songs/{video_id}/process")
def process(video_id: str) -> dict[str, Any]:
    _check_id(video_id)
    return jobs.enqueue(video_id)


@app.get("/api/songs/{video_id}/status")
def song_status(video_id: str) -> dict[str, Any]:
    _check_id(video_id)
    return jobs.status(video_id)


@app.get("/api/songs/{video_id}")
def song(video_id: str) -> dict[str, Any]:
    _check_id(video_id)
    if not store.is_ready(video_id):
        raise HTTPException(404, "這首歌還沒處理好")
    store.touch_played(video_id)
    return store.load_meta(video_id) or {}


@app.get("/api/songs/{video_id}/audio/{track}")
def audio(video_id: str, track: str) -> FileResponse:
    _check_id(video_id)
    if track not in store.TRACKS:
        raise HTTPException(404)
    path = store.track_path(video_id, track)
    if not path.exists():
        raise HTTPException(404)
    return FileResponse(path, media_type="audio/mpeg")


class SongPatch(BaseModel):
    offset: float | None = None
    lrc: str | None = None
    lyricsSource: dict[str, Any] | None = None


@app.patch("/api/songs/{video_id}")
async def patch_song(video_id: str, body: SongPatch) -> dict[str, Any]:
    _check_id(video_id)
    if store.load_meta(video_id) is None:
        raise HTTPException(404)
    if body.offset is not None:
        store.update_meta(video_id, offset=round(body.offset, 2))
    if "lrc" in body.model_fields_set:
        await run_in_threadpool(jobs.attach_lyrics, video_id, body.lrc, body.lyricsSource)
    return store.load_meta(video_id) or {}


@app.get("/api/lyrics/search")
async def lyrics_search(q: str = Query(..., min_length=1, max_length=200)) -> list[dict[str, Any]]:
    try:
        results = await run_in_threadpool(lyrics.search, q)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(502, f"歌詞搜尋失敗：{exc}") from exc
    return [r for r in results if r["synced"]][:20]


@app.get("/api/lyrics/suggest-query/{video_id}")
def lyrics_suggest(video_id: str) -> dict[str, str]:
    _check_id(video_id)
    meta = store.load_meta(video_id) or {}
    if meta.get("track"):
        q = f"{meta['track']} {meta.get('artist') or ''}".strip()
    else:
        q = lyrics.clean_title(meta.get("title") or "")
    return {"q": q}


# 有建置好的前端就一起提供，單一指令就能用
_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _DIST.exists():
    app.mount("/", StaticFiles(directory=_DIST, html=True), name="frontend")
