"""檢查歌詞時間對不對得上：拿分離出來的人聲軌和歌詞的時間軸比對。

兩個證據：
1. 粗對：把人聲軌切成 50ms 一格，標出「有人在唱」的格子。時間對的話，歌詞句子裡幾乎都有人聲、
   前奏間奏幾乎沒有。把歌詞整體往前後挪（±90 秒），「句內有聲比例 − 句外有聲比例」最高的地方
   就是大概的位置。MV 多一段劇情前奏這種大位移靠它找。
2. 細對：每一句的開頭，人聲應該剛好「冒出來」（音量往上衝）。以 10ms 為單位把所有句首對上
   音量上衝的位置，這個加總在正確位置會明顯比其他位置高（用 z 分數衡量）。

用 5 首歌、70 組正確／錯誤歌詞（加上人工接前奏、剪前奏）校正過門檻：正確歌詞的句首 z 分數
大多 > 5，錯誤的最高約 4.3、對比最高約 0.54；人聲很密的歌（例如饒舌）z 偏低，靠對比補判。
"""

from __future__ import annotations

import re
import subprocess
import threading
from pathlib import Path
from typing import Any

import numpy as np

FPS = 20  # 粗對：一格 50ms
ONSET_FPS = 100  # 細對：一格 10ms
_SR = 16000
MAX_SHIFT = 90.0  # 最多往前後找 90 秒（MV 版常多一段劇情前奏）
NEAR_ZERO = 2.0  # 先在 ±2 秒內找：長度相同的版本，位移不會更大

# 判定「對得上」（三選一）：句首很清楚、兩者都不錯、或句內外對比非常明顯
RULES = ((5.0, 0.3), (3.5, 0.5), (2.5, 0.6))  # (句首 z 至少, 對比至少)
MIN_SHIFT = 0.3  # 小於這個的位移當作誤差，不自動調
FAR_PEAKS = 5  # 遠處位移要細看的粗對高峰數

_TIME_TAG = re.compile(r"\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]")
_OFFSET_TAG = re.compile(r"\[offset:\s*([+-]?\d+)\s*\]", re.I)
_WORD_TAG = re.compile(r"<\d+:\d+(?:\.\d+)?>")
_CJK = re.compile(r"[぀-ヿ㐀-鿿가-힯]")


def _estimate_duration(text: str) -> float:
    cjk = len(_CJK.findall(text))
    words = len(re.findall(r"[A-Za-z0-9']+", _CJK.sub(" ", text)))
    return max(2.0, min(8.0, cjk * 0.32 + words * 0.42 + 0.8))


def parse_lines(lrc: str) -> list[tuple[float, float]]:
    """和前端 lrc.ts 的 parseLrc 同一套規則，回傳每一句的 (開始, 結束) 秒數。"""
    m = _OFFSET_TAG.search(lrc)
    tag_offset = int(m.group(1)) / 1000 if m else 0.0
    entries: list[tuple[float, str]] = []
    for raw in lrc.splitlines():
        stamps = [int(a) * 60 + float(b.replace(":", ".")) - tag_offset for a, b in _TIME_TAG.findall(raw)]
        if not stamps:
            continue
        text = _WORD_TAG.sub("", _TIME_TAG.sub("", raw)).strip()
        entries += [(max(0.0, t), text) for t in stamps]
    entries.sort(key=lambda e: e[0])

    lines: list[tuple[float, float]] = []
    for i, (t, text) in enumerate(entries):
        if not text:
            continue
        est = _estimate_duration(text)
        if i + 1 >= len(entries):
            end = t + est
        else:
            gap = entries[i + 1][0] - t
            end = t + gap - min(0.3, gap * 0.08) if gap <= 8 else t + min(gap, est)
        lines.append((t, max(end, t + 0.3)))
    return lines


# ---- 人聲軌 → 特徵 ----


class Features:
    """act：每 50ms 有沒有人聲（0/1）；onset：每 10ms 人聲「冒出來」的強度。"""

    def __init__(self, act: np.ndarray, onset: np.ndarray):
        self.act = act
        self.onset = onset


_cache: dict[str, tuple[float, Features]] = {}
_cache_lock = threading.Lock()


def _decode_mono(path: Path) -> np.ndarray:
    cmd = ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(_SR), "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def _frame_db(mono: np.ndarray, fps: int) -> np.ndarray:
    hop = _SR // fps
    n = len(mono) // hop
    frames = mono[: n * hop].reshape(n, hop).astype(np.float64)
    return 20 * np.log10(np.sqrt((frames**2).mean(axis=1)) + 1e-9)


def features_from_audio(mono: np.ndarray) -> Features:
    if len(mono) < _SR:
        return Features(np.zeros(0, dtype=np.float32), np.zeros(0))

    # 粗：每 50ms 有沒有在唱。門檻跟著這首歌走：比人聲最大聲的段落小 26dB 以上就當作沒在唱
    db = _frame_db(mono, FPS)
    on = (db > max(float(np.percentile(db, 95)) - 26.0, -55.0)).astype(np.float32)
    k = int(0.3 * FPS)  # 補掉換氣造成的短暫空檔（< 0.3 秒）
    act = (np.convolve(on, np.ones(k, dtype=np.float32), mode="same") > 0).astype(np.float32)

    # 細：音量在 30ms 內往上衝的量（只算有聲的地方），再稍微抹平
    db2 = np.convolve(_frame_db(mono, ONSET_FPS), np.ones(3) / 3, mode="same")
    rise = np.zeros_like(db2)
    rise[3:] = db2[3:] - db2[:-3]
    onset = np.where(db2 > float(np.percentile(db2, 95)) - 30.0, np.maximum(rise, 0.0), 0.0)
    g = np.exp(-0.5 * (np.arange(-12, 13) / 4.0) ** 2)
    onset = np.convolve(onset, g / g.sum(), mode="same")
    return Features(act, onset)


def features(vocals: Path) -> Features:
    key = str(vocals)
    mtime = vocals.stat().st_mtime
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] == mtime:
            return hit[1]
    feats = features_from_audio(_decode_mono(vocals))
    with _cache_lock:
        _cache[key] = (mtime, feats)
    return feats


# ---- 歌詞時間軸 vs 人聲 ----


def _coarse(act: np.ndarray, lines: list[tuple[float, float]]) -> tuple[np.ndarray, np.ndarray]:
    """每個位移（格）的對比分數：句內有聲比例 − 句外有聲比例。"""
    n = act.size
    starts = np.array([round(s * FPS) for s, _ in lines])
    ends = np.array([max(round(e * FPS), round(s * FPS) + 1) for s, e in lines])
    cum = np.concatenate([[0.0], np.cumsum(act, dtype=np.float64)])
    shifts = np.arange(-int(MAX_SHIFT * FPS), int(MAX_SHIFT * FPS) + 1)
    s = np.clip(starts[None, :] + shifts[:, None], 0, n)
    e = np.clip(ends[None, :] + shifts[:, None], 0, n)
    inside_on = (cum[e] - cum[s]).sum(axis=1)
    inside_len = (e - s).sum(axis=1).astype(np.float64)
    outside_len = n - inside_len
    # 歌詞大半被推出歌曲範圍的位移不算
    valid = (inside_len >= 0.6 * (ends - starts).sum()) & (outside_len > FPS)
    with np.errstate(divide="ignore", invalid="ignore"):
        score = inside_on / inside_len - (cum[-1] - inside_on) / outside_len
    return shifts, np.where(valid, score, -1.0)


def _onset_z(onset: np.ndarray, lines: list[tuple[float, float]]) -> tuple[np.ndarray, np.ndarray]:
    """每個位移（10ms）下，所有句首的人聲上衝量加總，換成 z 分數。"""
    pos = np.array([round(s * ONSET_FPS) for s, _ in lines])
    ks = np.arange(-int(MAX_SHIFT * ONSET_FPS), int(MAX_SHIFT * ONSET_FPS) + 1)
    total = np.zeros(ks.size)
    for p in pos:  # 逐句累加，避免一次開出（位移 × 句數）的大陣列
        idx = p + ks
        ok = (idx >= 0) & (idx < onset.size)
        total[ok] += onset[idx[ok]]
    z = (total - np.median(total)) / (total.std() + 1e-9)
    return ks / ONSET_FPS, z


def analyze(feats: Features, lrc: str | None) -> dict[str, Any] | None:
    """找出最對得上的時間位移，並判斷這份歌詞是不是這個版本。

    回傳：
      offset    建議的 offset（秒；歌詞時間 = 播放時間 − offset）。不確定時是 0
      measured  量到的位移（不管確不確定）
      z         句首對齊的 z 分數（越高越確定）
      contrast  粗對的對比分數（句內有聲比例 − 句外有聲比例）
      status    ok（時間吻合）／shifted（吻合，但要調 offset）／poor（對不上，多半是別的版本）
    """
    if not lrc or feats.act.size == 0:
        return None
    lines = parse_lines(lrc)
    if len(lines) < 4:
        return None

    shifts, contrast = _coarse(feats.act, lines)
    ks, z = _onset_z(feats.onset, lines)

    def contrast_at(sec: float) -> float:
        return float(contrast[int(np.argmin(np.abs(shifts - round(sec * FPS))))])

    def best_near(center: float, win: float) -> float:
        near = np.abs(ks - center) <= win
        return float(ks[near][int(np.argmax(z[near]))])

    def z_at(sec: float) -> float:
        return float(z[int(round((sec + MAX_SHIFT) * ONSET_FPS))])

    def sure(sec: float) -> bool:
        zz, c = z_at(sec), contrast_at(sec)
        return any(zz >= z_min and c >= c_min for z_min, c_min in RULES)

    # 先看 0 附近（長度相同的版本）
    near_zero = best_near(0.0, NEAR_ZERO)
    if sure(near_zero):
        measured, ok = near_zero, True
    else:
        # 再看遠處（MV、加長版）：粗對的前幾個高峰、句首對齊最強的位置，各自細調後挑最好的
        far: list[float] = []
        order = np.argsort(contrast)[::-1]
        for i in order:
            sec = float(shifts[i]) / FPS
            if contrast[i] <= -1 or len(far) >= FAR_PEAKS:
                break
            if all(abs(sec - f) > 3 for f in far):
                far.append(sec)
        spots = [best_near(sec, 1.5) for sec in far] + [float(ks[int(np.argmax(z))])]
        good = [s for s in spots if sure(s)]
        pool = good or spots + [near_zero]
        measured = max(pool, key=lambda s: z_at(s) + 5 * contrast_at(s))
        ok = bool(good)

    if not ok:
        status = "poor"
    elif abs(measured) >= MIN_SHIFT:
        status = "shifted"
    else:
        status = "ok"
    return {
        "offset": round(measured, 2) if status == "shifted" else 0.0,
        "measured": round(measured, 2),
        "z": round(float(z[int(round((measured + MAX_SHIFT) * ONSET_FPS))]), 2),
        "contrast": round(contrast_at(measured), 3),
        "status": status,
    }


def rank(result: dict[str, Any] | None) -> float:
    """比較多份歌詞用：對得上的優先，其次句首越清楚、句內外對比越大越好。"""
    if not result:
        return -1e9
    return (100.0 if result["status"] != "poor" else 0.0) + result["z"] + 5 * result["contrast"]


def check(vocals: Path, lrc: str | None) -> dict[str, Any] | None:
    try:
        return analyze(features(vocals), lrc)
    except (OSError, subprocess.CalledProcessError, ValueError):
        return None
