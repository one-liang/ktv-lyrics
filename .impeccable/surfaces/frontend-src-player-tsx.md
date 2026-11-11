---
version: 1
slug: "frontend-src-player-tsx"
primary_target: "frontend/src/Player.tsx"
related_targets: ["frontend/src/Home.tsx","frontend/src/SongRoute.tsx"]
---

# 練唱畫面＋選歌頁（KTV 練唱）

Scope: 練唱畫面（Player：歌詞舞台、控制列、換歌詞對話框）、選歌頁（Home）、準備伴奏頁（SongRoute）。Mode: operate。

Audience/job: 專案擁有者本人，電腦桌前 50–80 公分，搜歌 → 等分離 → 跟著 KTV 雙行歌詞練唱。Constraints: 黑底（使用者指定）；不要太花俏干擾看歌詞；不要冷冰冰像工具。

## Direction contract

THESIS: 練唱像音樂課跟著黑板上的簡譜唱：兩行歌詞固定在黑板上，唱過的字被粉筆黃描過。拒絕類別預設的模糊封面背景＋捲動高亮歌詞，也拒絕老 KTV 機台藍底描邊字。

OWN-WORLD: 墨綠黑板底 #0e1411，粉筆白未唱字、粉筆黃已唱字與主要動作、粉紅表示導唱人聲狀態、粉藍表示羅馬拼音與提示；1px 髮絲線的小節線；圓頭黑體（M PLUS Rounded 1c＋粉圓 Huninn）從舞台大字到清單小字一路用到底；簡譜記號（拍點 0、小節線 |）是唯一的裝飾語彙，從不使用粉筆字體或黑板材質貼圖。

STORY: 一打開就知道要搜歌；結果裡哪一首時間最準一眼可見；開唱後畫面上只剩兩行歌詞，間奏時休止符逐拍倒數，讓人知道什麼時候開口；導唱音量隨手調。

FIRST VIEWPORT: 練唱畫面全螢幕墨綠黑：左上角 14px 歌名＋歌手；畫面中段兩行大字，上行靠左、下行靠右（字級依句長自動縮放，最大約 5.2vw），唱過的部分變粉筆黃且下方長出一條粉筆黃底線；下一句略暗。間奏時下一句上方出現「0 0 0 0 |」逐拍點亮。底部控制列：小節線進度條、播放、導唱滑桿、拼音三段切換、歌詞時間 ±、全螢幕，閒置 2.6 秒淡出且隱藏游標。

FORM: 黑板簡譜（音樂課黑板上的簡譜與歌詞），grounded list 第 4 名；seed key 7b30b6c8。Signature move：簡譜休止符拍點倒數＋小節線進度條。Motion：新的一句以由左而右的 clip-path 顯現（像粉筆寫上去），僅此一處；reduced motion 時直接出現。Raises：控制列與清單用單一小字級、層級靠字重與反白（取自時刻表幻燈片）；所有刻度 1px 精準（取自中軸註解版面）；兩行位置固定、只換內容不捲動（取自翻牌看板）；同一字族大小通用（取自點陣字型樣本）。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- 無。
