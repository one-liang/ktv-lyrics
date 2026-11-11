"""用 Demucs (htdemucs) 把歌曲拆成「人聲」與「伴奏」兩軌。

不走 demucs 的 CLI 與 torchaudio 讀寫，直接用 ffmpeg 解碼、soundfile 寫檔，
避免不同 torchaudio 版本的 I/O 相容問題。
"""

from __future__ import annotations

import subprocess
import threading
import types
from pathlib import Path
from typing import Callable

import numpy as np
import soundfile as sf
import torch

SAMPLE_RATE = 44100
MODEL_NAME = "htdemucs"
MP3_BITRATE = "320k"  # 192k 會把 19kHz 以上切掉、波形誤差也大一截（實測 26.5dB → 37.5dB）
PEAK_CEILING = 0.89  # 約 −1 dBFS：留給 mp3 編碼的過衝，兩軌疊起來也不會爆音

_model = None
_model_lock = threading.Lock()


def device() -> str:
    return "cuda" if torch.cuda.is_available() else "cpu"


def _get_model():
    global _model
    with _model_lock:
        if _model is None:
            from demucs.pretrained import get_model

            m = get_model(MODEL_NAME)
            m.eval()
            _model = m
        return _model


def _decode(path: Path) -> np.ndarray:
    """ffmpeg 解碼成 44.1kHz 立體聲 float32，形狀 (2, samples)。"""
    cmd = [
        "ffmpeg", "-v", "error", "-i", str(path),
        "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "2", "-ar", str(SAMPLE_RATE), "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    audio = np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).T
    return np.ascontiguousarray(audio)


def _encode_mp3(wav: Path, out: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(wav), "-codec:a", "libmp3lame", "-b:a", MP3_BITRATE, str(out)],
        check=True,
    )


class _ProgressTqdm:
    """替換 demucs.apply 裡的 tqdm，把分段處理進度回報出去。"""

    def __init__(self, on_progress: Callable[[float], None]):
        self.on_progress = on_progress

    def tqdm(self, iterable, *args, **kwargs):
        items = list(iterable)
        total = max(1, len(items))
        for i, item in enumerate(items):
            yield item
            self.on_progress((i + 1) / total)


def separate(source: Path, out_dir: Path, on_progress: Callable[[float], None]) -> None:
    """產生 out_dir/vocals.mp3 與 out_dir/inst.mp3。"""
    import demucs.apply as demucs_apply
    from demucs.apply import apply_model

    model = _get_model()
    audio = _decode(source)
    mix = torch.from_numpy(audio)

    # 依 demucs 慣例做標準化，分離完再還原
    ref = mix.mean(0)
    mean, std = ref.mean(), ref.std() + 1e-8
    mix_n = (mix - mean) / std

    original_tqdm = demucs_apply.tqdm
    demucs_apply.tqdm = types.SimpleNamespace(tqdm=_ProgressTqdm(on_progress).tqdm)
    try:
        with torch.no_grad():
            sources = apply_model(
                model, mix_n[None], device=device(), split=True, overlap=0.25, progress=True, shifts=1
            )[0]
    finally:
        demucs_apply.tqdm = original_tqdm
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

    sources = sources * std  # 直流偏移 mean 不分給各軌，下面算人聲時會從原曲帶回來
    vocal_idx = model.sources.index("vocals")
    # 伴奏 = 鼓＋貝斯＋其他三軌相加，保持乾淨；
    # 人聲 = 原曲 − 伴奏，把模型沒分到任何一軌的殘差也收進人聲，
    # 這樣導唱開到 100% 時兩軌相加就是原曲，不會少東西
    inst = sources.sum(0) - sources[vocal_idx]
    vocals = mix.to(inst.device) - inst

    # 原曲常常壓到 0dBFS 以上（YouTube 的 opus 解出來會過衝），兩軌用同一個倍率降一點避免爆音
    peak = max(float(t.abs().max()) for t in (inst, vocals, inst + vocals))
    if peak > PEAK_CEILING:
        gain = PEAK_CEILING / peak
        inst, vocals = inst * gain, vocals * gain

    out_dir.mkdir(parents=True, exist_ok=True)
    for name, data in (("vocals", vocals), ("inst", inst)):
        wav = out_dir / f"{name}.wav"
        sf.write(wav, data.cpu().numpy().T, SAMPLE_RATE, subtype="FLOAT")
        _encode_mp3(wav, out_dir / f"{name}.mp3")
        wav.unlink(missing_ok=True)
