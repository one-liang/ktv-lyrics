"""簡體中文轉繁體（台灣字形）。

用 OpenCC 的 s2tw：只換字，不換詞（「视频」→「視頻」而不是「影片」），
這樣每句的字數不變，歌詞變色的進度和唱的音節才對得上。
"""

from __future__ import annotations

import re
import threading

_KANA = re.compile(r"[぀-ヿ]")
_HAN = re.compile(r"[㐀-鿿]")

_conv = None
_lock = threading.Lock()


def _get():
    global _conv
    with _lock:
        if _conv is None:
            import opencc

            _conv = opencc.OpenCC("s2tw")
        return _conv


def to_traditional(text: str | None) -> str | None:
    """簡體轉繁體；日文（有假名）和本來就是繁體的不動。"""
    if not text or _KANA.search(text):
        return text
    han = _HAN.findall(text)
    if not han:
        return text
    out = _get().convert(text)
    changed = sum(a != b for a, b in zip(text, out))
    # 本來就是繁體的歌詞，頂多零星幾個字會被換（例如「後」「后」這類一對多），不值得冒險
    if len(out) != len(text) or changed < len(han) * 0.02:
        return text
    return out
