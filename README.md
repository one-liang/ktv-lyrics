# KTV 練唱

自己在家練唱用的本機工具：搜尋 YouTube 上的歌，AI 去掉人聲，配上同步歌詞，用 KTV 式雙行歌詞跟著唱。

- **KTV 雙行歌詞**：上行是正在唱的、下行是下一句，兩行輪流替換，唱過的字從左到右變色
- **導唱音量**：人聲從 0%（純伴奏）到 100%（原唱）隨時調
- **日文羅馬拼音**：原文／原文＋上方小字拼音／只有拼音，三段切換
- **間奏倒數**：前奏、間奏太長時，下一句上方出現「0 0 0 0 |」逐拍倒數
- **歌詞時間微調**：每首歌各自記住；歌詞配錯可以換一份或自己貼 LRC
- **快取**：處理過的歌留在本機，第二次點直接開唱

> 僅供個人自用。用 yt-dlp 下載 YouTube 音訊違反 YouTube 服務條款，請不要做成公開服務。

## 需求

- Windows（其他系統也行，只是啟動腳本是 PowerShell）
- [uv](https://docs.astral.sh/uv/)（會自動安裝 Python 3.12）
- Node.js 20 以上（前端建置用，也是 yt-dlp 解析 YouTube 需要的 JS 執行環境）
- [ffmpeg](https://ffmpeg.org/)（要在 PATH 裡）
- NVIDIA 顯卡（選用）：有 CUDA 時一首歌分離約 10–20 秒；只有 CPU 也能跑，但會慢很多

## 啟動

第一次先安裝後端套件（PyTorch CUDA 版約 2.5GB）：

```bash
cd backend
uv sync
```

之後每次雙擊 `start.bat`，或在 PowerShell 執行：

```powershell
.\start.ps1
```

第一次會自動建置前端，然後啟動後端並開啟 <http://127.0.0.1:8000>。改過前端程式碼後用 `.\start.ps1 -Rebuild` 重新建置。

### 開發模式

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

前端開發伺服器在 <http://localhost:5173>，`/api` 會轉給後端。

## 快捷鍵

| 按鍵 | 功能 |
|---|---|
| 空白鍵 | 播放／暫停 |
| ← → | 倒退／快轉 5 秒 |
| ↑ ↓ | 導唱音量 ±10% |
| V | 導唱／純伴奏切換 |
| R | 羅馬拼音模式切換（日文歌） |
| [ ] | 歌詞提早／延後 0.2 秒（按住 Shift 一次 1 秒） |
| F | 全螢幕 |
| Esc | 回選歌 |

## 運作方式

```
搜尋 ──▶ yt-dlp 搜 YouTube（同時搜「歌名＋official audio」；和多數結果同長度的排前面）
點歌 ──▶ yt-dlp 下載音訊 ──▶ Demucs htdemucs 拆成人聲／伴奏兩軌（mp3）
     ──▶ LRCLIB 依歌名、歌手找同步歌詞，挑時長最接近的版本
     ──▶ 日文歌用 cutlet 產生羅馬拼音
播放 ──▶ 瀏覽器用 Web Audio 同時播兩軌（取樣級同步），導唱滑桿只調人聲軌音量
```

資料存在 `data/songs/<影片 ID>/`：`vocals.mp3`、`inst.mp3`、`meta.json`（歌詞、拼音、時間偏移）。刪掉資料夾就會重新處理。

## 已知限制

- LRCLIB 大多只有逐行時間，變色是依整行長度平均推進，不會完全貼合實際唱法。
- MV 版本常有前奏劇情，歌詞時間會對不上；盡量選官方音訊，或用 `[` `]` 微調。
- 還沒有：升降 Key、邊分離邊播、中文注音、韓文羅馬拼音。
