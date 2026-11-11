"""日文歌詞轉羅馬拼音（cutlet，Hepburn 式）。"""

from __future__ import annotations

import re
import threading

_KANA = re.compile(r"[぀-ヿ]")
_JA = re.compile(r"[぀-ヿ一-鿿々]")
_TIME = re.compile(r"\[(\d+):(\d+(?:\.\d+)?)\]")

_katsu = None
_lock = threading.Lock()


def _get():
    global _katsu
    with _lock:
        if _katsu is None:
            import cutlet

            k = cutlet.Cutlet()
            k.use_foreign_spelling = False
            _katsu = k
        return _katsu


def is_japanese(lrc: str) -> bool:
    """有假名才算日文（避免把中文歌詞誤判成日文）。"""
    return len(_KANA.findall(lrc)) >= 5


def convert_line(text: str) -> str:
    if not _JA.search(text):
        return text
    return _get().romaji(text).strip()


def lrc_romaji(lrc: str) -> dict[str, str]:
    """回傳 {原文: 羅馬拼音}，前端以原文對應。"""
    out: dict[str, str] = {}
    for raw in lrc.splitlines():
        text = _TIME.sub("", raw).strip()
        if text and text not in out:
            out[text] = convert_line(text)
    return out
