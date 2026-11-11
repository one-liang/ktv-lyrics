---
name: KTV 練唱
description: 本機自用的 KTV 練唱：墨綠黑板上的兩行簡譜歌詞，唱過的字被粉筆黃描過。
colors:
  board: "#0e1411"
  board-2: "#151d19"
  board-3: "#1c2621"
  rule: "#26322c"
  rule-strong: "#3a4842"
  chalk: "#eceae1"
  chalk-soft: "#b8bdb3"
  chalk-dim: "#949d97"
  yellow: "#f3d55b"
  yellow-hover: "#f7e083"
  yellow-ink: "#1b1a0e"
  pink: "#f29bb4"
  blue: "#93cbe9"
  red: "#f4a091"
typography:
  display:
    fontFamily: "Huninn, M PLUS Rounded 1c, Microsoft JhengHei UI, sans-serif"
    fontSize: "clamp(34px, 5.2vw, 104px)"
    fontWeight: 400
    lineHeight: 1.22
    letterSpacing: "0.02em"
  display-ja:
    fontFamily: "M PLUS Rounded 1c, Huninn, Yu Gothic UI, sans-serif"
    fontSize: "clamp(34px, 5.2vw, 104px)"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "0.02em"
  lyric-latin:
    fontFamily: "M PLUS Rounded 1c, Huninn, Yu Gothic UI, sans-serif"
    fontSize: "calc(clamp(34px, 5.2vw, 104px) * 0.82)"
    fontWeight: 800
    lineHeight: 1.22
    letterSpacing: "0.01em"
  lyric-ruby:
    fontFamily: "M PLUS Rounded 1c, Huninn, Yu Gothic UI, sans-serif"
    fontSize: "calc(clamp(34px, 5.2vw, 104px) * 0.38)"
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "0.03em"
  beats:
    fontFamily: "M PLUS Rounded 1c, Huninn, Microsoft JhengHei UI, system-ui, sans-serif"
    fontSize: "max(16px, calc(clamp(34px, 5.2vw, 104px) * 0.3))"
    fontWeight: 800
    lineHeight: 1
    fontFeature: "'tnum'"
  headline:
    fontFamily: "M PLUS Rounded 1c, Huninn, Microsoft JhengHei UI, system-ui, sans-serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0.01em"
  title:
    fontFamily: "M PLUS Rounded 1c, Huninn, Microsoft JhengHei UI, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 800
    lineHeight: 1.6
  body:
    fontFamily: "M PLUS Rounded 1c, Huninn, Microsoft JhengHei UI, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "M PLUS Rounded 1c, Huninn, Microsoft JhengHei UI, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
  mono:
    fontFamily: "ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  pill: "999px"
  dialog: "20px"
  field: "16px"
  field-sm: "12px"
  thumb: "8px"
  focus: "6px"
  handle: "2px"
spacing:
  control-gap: "10px"
  row: "12px"
  mobile-inset: "18px"
  dialog-inset: "22px"
  player-edge: "28px"
  page-inset: "32px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hover}"
  button-primary-search:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    rounded: "{rounded.field}"
    padding: "0 26px"
    height: "56px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "40px"
  button-ghost-hover:
    backgroundColor: "{colors.board-2}"
  button-play:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.yellow-ink}"
    rounded: "{rounded.pill}"
    size: "48px"
  button-play-hover:
    backgroundColor: "{colors.yellow-hover}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    rounded: "{rounded.pill}"
    size: "32px"
  button-icon-hover:
    textColor: "{colors.chalk}"
  link:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    padding: "6px 4px"
  link-hover:
    textColor: "{colors.chalk}"
  chip-vocal:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-soft}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "32px"
  chip-vocal-on:
    backgroundColor: "color-mix(in oklab, #f29bb4 14%, transparent)"
    textColor: "{colors.pink}"
  tag:
    textColor: "{colors.chalk-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "20px"
  tag-ready:
    textColor: "{colors.yellow}"
  tag-blue:
    textColor: "{colors.blue}"
  tag-warn:
    textColor: "{colors.pink}"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.chalk-dim}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "28px"
  segmented-option-selected:
    backgroundColor: "color-mix(in oklab, #93cbe9 18%, transparent)"
    textColor: "{colors.blue}"
  input-search:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.field}"
    padding: "0 20px"
    height: "56px"
  input-search-sm:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.field-sm}"
    padding: "0 20px"
    height: "42px"
  textarea-lrc:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chalk}"
    typography: "{typography.mono}"
    rounded: "{rounded.field-sm}"
    padding: "14px 16px"
  tab:
    textColor: "{colors.chalk-dim}"
    padding: "10px 0"
  tab-selected:
    textColor: "{colors.chalk}"
  track-row:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    padding: "12px 10px 12px 0"
  track-row-hover:
    backgroundColor: "{colors.board-2}"
  track-thumb:
    backgroundColor: "{colors.board-3}"
    rounded: "{rounded.thumb}"
    width: "112px"
  dialog:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.dialog}"
    width: "min(660px, calc(100vw - 32px))"
  toast:
    backgroundColor: "{colors.board-2}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  lyric-unsung:
    textColor: "{colors.chalk}"
    typography: "{typography.display}"
  lyric-sung:
    textColor: "{colors.yellow}"
  lyric-next:
    textColor: "{colors.chalk-soft}"
  lyric-ruby:
    textColor: "{colors.blue}"
    typography: "{typography.lyric-ruby}"
  beat:
    textColor: "{colors.chalk-dim}"
    typography: "{typography.beats}"
  beat-on:
    textColor: "{colors.yellow}"
---

# Design System: KTV 練唱

## Overview

**Creative North Star: "黑板簡譜"**

練唱就像音樂課跟著黑板上的簡譜唱。整個介面是一塊平的墨綠黑板：還沒唱的字是粉筆白，唱過的字被粉筆黃由左到右描過，底下同時長出一條粉筆黃底線。兩行歌詞釘在黑板上的固定位置，上行靠左、下行靠右，換句時只換內容，不捲動。

裝飾只有簡譜記號：拍點「0」、1px 小節線「|」、細粗雙線的終止線。播放進度是一條畫滿小節線的橫線，間奏時下一句上方的「0 0 0 0 |」逐拍倒數，選歌頁品牌旁的「1 2 3 4 |」也是同一套記號。這塊黑板是拿來用的，不是畫出來的：沒有粉筆字體、黑板材質貼圖或粉筆筆觸。

密度兩極：開唱後畫面上只剩歌名和兩行最大約 104px 的大字，控制列閒置 2.6 秒就淡出；控制列與清單則收在 14px 一個字級，層級靠字重和三階粉筆明度。同一套圓頭黑體從舞台大字一路用到 12px 標籤，畫面有唱歌的溫度，但不搶歌詞。明確拒絕兩種類別慣例：以模糊專輯封面背景配捲動高亮歌詞當作主畫面，以及老 KTV 機台的藍底描邊字。右側的「全部歌詞」清單是使用者自己叫出來找段落用的工具，舞台本身永遠是兩行大字。

**Key Characteristics:**
- 平面墨綠黑板底，中性色全部偏綠；四支彩色粉筆各有固定意義。
- 粉筆黃代表已唱、已播放、主要動作；已唱的字一定同時有底線，不只靠顏色。
- 兩行歌詞位置固定（上行靠左、下行靠右），句子太長就縮字，不換行、不捲動。
- 簡譜記號（拍點 0、1px 小節線、終止線）是唯一的裝飾語彙。
- 一個圓頭黑體字族通用所有大小；所有數字用等寬數字。
- 能按的東西是 1px 框線膠囊；只有 toast 和對話框有陰影。
- 動作很少：新句子由左而右寫上去（360ms），其餘只是短的狀態過渡與淡入淡出。

## Colors

一塊墨綠黑板加四支彩色粉筆：中性色全部帶一點綠，彩色只用在字、細框線和很淡的底，用來標記意義。

### Primary
- **粉筆黃** (#f3d55b)：「已經唱過、已經播過、現在按這個」。唱過的歌詞與拼音、歌詞底線、進度條填色與把手、主要按鈕與播放鍵、亮起的拍點、終止線、對話框分頁底線、「已備好，直接開唱」「目前使用」標籤、±2 秒內的歌詞長度差值、焦點外框、文字選取底色與輸入游標。
- **亮粉筆黃** (#f7e083)：主要按鈕與播放鍵的 hover 底色與框線。程式碼裡是兩處寫死的字面值，沒有對應的 custom property。
- **黃底墨字** (#1b1a0e)：粉筆黃底上的文字與圖示（主要按鈕、播放鍵、文字選取）。

### Secondary
- **粉紅** (#f29bb4)：導唱人聲狀態。導唱 chip 開啟時的字色，配 14% 粉紅底與 70% 粉紅框線。警示也用粉紅：「沒有歌詞」「現場版」「伴奏版」「時間對不上」標籤，以及練唱畫面上「這份歌詞的時間可能對不上」提示裡的「換一份歌詞」連結（方向契約原本只把粉紅指給導唱，這是建置裡多出來的用法）。

### Tertiary
- **粉藍** (#93cbe9)：羅馬拼音與提示。疊在原文上方的拼音、三段切換的選中態（拼音模式、搜尋來源；18% 粉藍底）、「標準長度」「時間吻合」「已自動對準」這類歌詞時間的提示標籤、品牌旁的「1 2 3 4 |」。下一句的拼音改用 70% 粉藍混黑板，略暗。
- **粉筆紅** (#f4a091)：錯誤文字，只用在搜尋失敗、歌詞搜尋或套用失敗、伴奏處理失敗的訊息。

### Neutral
- **墨綠黑板** (#0e1411)：頁面與練唱畫面的底、控制列漸層的實色端、LRC 貼上框的底。
- **黑板二** (#151d19)：抬起一層的面：搜尋框、對話框、toast，以及清單列與 ghost 按鈕的 hover 底。
- **黑板三** (#1c2621)：縮圖載入前的佔位底。
- **淡格線** (#26322c)：清單列之間的分隔線、對話框分頁列的底線。
- **格線** (#3a4842)：所有控制項的 1px 框線、區塊標題底線、進度條的中線與小節刻度、捲軸。
- **粉筆白** (#eceae1)：主要文字與未唱的歌詞。
- **淡粉筆** (#b8bdb3)：次要文字：下一句歌詞、左上角歌名、時間數字、連結、小圓鈕圖示、「唱完了」。
- **暗粉筆** (#949d97)：提示文字：歌手、說明、熄滅的拍點、placeholder、快捷鍵提示、未開始的步驟。

### Named Rules
**The 粉筆黃描過 Rule.** 粉筆黃只標記「已經發生」或「現在按這個」：唱過的字、已播放的長度、主要動作、焦點。未唱的字永遠是粉筆白，粉筆黃不拿來當裝飾。

**The 不只靠色相 Rule.** 唱過的歌詞變黃的同時，底下長出一條粉筆黃底線（max(3px, 0.055em)）；進度填色是 3px，比 1px 底線粗。已唱和未唱不能只靠色相區分。

**The 四支粉筆 Rule.** 黃、粉紅、粉藍、紅各有職責。彩色只出現在字、細框線和 14–18% 的淡底；實心的彩色面只有粉筆黃的主要按鈕與播放鍵。

## Typography

**Display Font:** 粉圓 Huninn（中文舞台，退到 M PLUS Rounded 1c、Microsoft JhengHei UI）；M PLUS Rounded 1c（日文舞台與拼音，退到粉圓、Yu Gothic UI）
**Body Font:** M PLUS Rounded 1c（缺字退到粉圓 Huninn、Microsoft JhengHei UI、system-ui）
**Label/Mono Font:** 系統等寬（ui-monospace、Cascadia Mono、Consolas），只用在 LRC 貼上框

**Character:** 兩套圓頭黑體像工整的板書，筆畫圓潤但不是粉筆字體；同一字族從舞台大字用到 12px 標籤，靠大小和字重分層。字型透過 @fontsource 自架：M PLUS Rounded 1c 載入 400、500、700、800，粉圓只有 400 一個字重。

### Hierarchy
- **Display** (中文 400／日文 800, clamp(34px, 5.2vw, 104px), 1.22)：舞台歌詞大字，字距 0.02em。字級上限隨視窗縮放，再以「88vw ÷ 句子視覺寬度」縮到一行放得下，永不換行。中文舞台用粉圓優先：粉圓只有 400 一個字重，關掉瀏覽器假粗體（font-synthesis: none），只加 0.012em 同色描邊補一點份量。假粗體加粗描邊會把「晴」「邊」「鬱」這種筆畫多的繁體字糊成一團，筆畫多的字要看得清楚比字重更重要。日文舞台用 M PLUS Rounded 1c 優先，用字型本身的 800，不加描邊。
- **Lyric Latin** (800, 0.82 倍舞台字級, 1.22)：「只有拼音」模式下的羅馬拼音主行，字距 0.01em。
- **Lyric Ruby** (700, 0.38 倍舞台字級, 1.22)：「原文＋拼音」時疊在原文上方的拼音，字距 0.03em，沒有底線；窄螢幕最小 11px。
- **Beats** (800, max(16px, 0.3 倍舞台字級), 1)：間奏拍點倒數，等寬數字。
- **Headline** (800, clamp(30px, 4vw, 48px), 1.2)：選歌頁的「想唱哪首歌？」。同一層級還有準備伴奏頁標題（clamp(28px, 3.4vw, 40px)，1.25）與終止畫面的「唱完了」（clamp(28px, 3.2vw, 52px)）。
- **Title** (800, 20px)：對話框標題。練唱畫面中央的狀態大字用 clamp(22px, 2.4vw, 34px)。
- **Body** (400, 14px, 1.6)：控制列、清單、說明、品牌列全部用這一級，強調靠 500 / 700 / 800。唯一放大的是搜尋框內文（18px，500）。
- **Label** (700, 12px, 1)：標籤與歌詞長度差值。快捷鍵提示同樣 12px，但 400、字距 0.04em。

### Named Rules
**The 一個字族 Rule.** 圓頭黑體從百 px 級的舞台大字用到 12px 標籤。不引入第二個展示字體，也不用粉筆或手寫字體；唯一例外是 LRC 貼上框的系統等寬字。

**The 小字靠字重 Rule.** 控制列與清單只有 14px 一級（標籤 12px）。層級靠字重（500 / 700 / 800）和粉筆白、淡粉筆、暗粉筆三階明度拉開，不靠放大。

**The 數字對齊 Rule.** 時間、百分比、歌詞偏移秒數、步驟百分比、拍點與品牌拍號一律用 tabular-nums，數字跳動時不晃。

## Layout

**練唱畫面**是 fixed 全螢幕。歌名與歌手在左上角（距頂 20px、左右 28px），單行省略。舞台垂直置中，左右 6vw、底部留 9vh；兩行之間 clamp(20px, 5vh, 64px)，每行最小高度是兩倍字級上限、內容貼底，所以換句時位置不跳。上行整塊靠左、下行整塊靠右，但下行塊內的拍點、拼音、歌詞仍然左緣對齊。控制列貼底（上 40px、左右 28px、下 16px）：第一列是「目前時間｜進度條｜總長」三欄，第二列是控制群組，左右分散、可換行，第三列是快捷鍵提示。打開「全部歌詞」時，清單佔右側 clamp(300px, 25vw, 400px) 的全高，歌名、舞台、控制列、toast 都只用左邊剩下的寬度；舞台字級上限降為 clamp(30px, 4.4vw, 88px)，「一行放得下」的寬度也扣掉清單寬。

**選歌頁**內容最寬 1200px 置中，內距 40px 32px 80px。品牌列下方 56px 是搜尋區（最寬 760px）：搜尋列下方 16px 是「從哪裡找」來源切換（YouTube Music／YouTube）與一行暗粉筆說明，可換行。再下方 56px 分兩欄：左欄搜尋結果彈性寬，右欄最近唱過 280–360px，欄距 56px。清單列沒有框也沒有底，用 grid 排「縮圖｜標題與副標｜時間」，列與列之間一條 1px 淡格線。

**準備伴奏頁**內容最寬 560px，距頂 18vh；三個步驟用「6.5em｜進度條｜4em」三欄 grid，步驟間 18px。

**對話框**寬 min(660px, 100vw − 32px)、高 min(760px, 100vh − 48px)，內距 22px，結果清單最高 44vh 自己捲動。

**間距節奏**：控制項之間 10px、清單列上下 12px、對話框內距 22px、練唱畫面邊距 28px、選歌頁側距 32px、大區塊間 56px；窄螢幕側距收到 18px。

**響應式**：
- ≤860px：選歌頁改單欄，區塊間 40px，側距 18px；影片縮圖縮成 88px、專輯封面 50px。舞台字級上限改為 clamp(26px, 7.2vw, 56px)，舞台左右 18px、底部 18vh。控制列改靠左換行（間距 10px 18px），隱藏快捷鍵提示，導唱滑桿 96px。「按空白鍵或點一下畫面開始」移到畫面 18% 高處，歌詞對不上的提示接在它下方。「全部歌詞」改成從底部拉起的半張紙（高 min(64vh, 560px)、上方 20px 圓角），蓋在舞台和控制列上；點一句就收起，進頁面時一律先收著。
- ≤520px：清單副標只留有顏色的標籤（隱藏「官方頻道」），搜尋按鈕左右 18px，準備頁內距 20px 18px。

### Named Rules
**The 兩行固定 Rule.** 歌詞只有兩個固定位置：上行靠左、下行靠右。換句時只換內容，不捲動、不位移；句子放不下就縮字，不換行。

**The 只剩歌詞 Rule.** 播放中閒置 2.6 秒，控制列淡出（420ms、下移 10px）並隱藏游標，畫面上只剩歌名和兩行歌詞。暫停或開著對話框時控制列不隱藏。「全部歌詞」清單是使用者自己打開的，閒置時不跟著淡出。

## Elevation & Depth

黑板是平的。深度靠黑板三階明度（墨綠黑板 → 黑板二 → 黑板三）和 1px 格線表達，不靠陰影。只有三樣東西暫時浮在黑板前面並帶陰影：toast、換歌詞對話框，以及窄螢幕上從底部拉起的歌詞清單；桌面版的歌詞清單是黑板二的平面加 1px 左格線，不帶陰影。對話框背後的遮罩是 rgb(6 9 7 / 0.72) 的黑板色。控制列不是浮起來的面板，而是從黑板實色（55% 處）漸層到透明的遮擋，讓歌詞在它後面淡出。

### Shadow Vocabulary
- **Toast** (`box-shadow: 0 6px 20px rgb(0 0 0 / 0.35)`)：頂部置中的操作回饋（導唱音量、歌詞時間、拼音模式、已換歌詞）。
- **Dialog** (`box-shadow: 0 24px 60px rgb(0 0 0 / 0.5)`)：換歌詞對話框。
- **Sheet** (`box-shadow: 0 -18px 48px rgb(0 0 0 / 0.5)`)：窄螢幕從底部拉起的「全部歌詞」清單。

### Named Rules
**The 黑板是平的 Rule.** 寫在黑板上的東西（清單、控制列、搜尋框、按鈕）一律平面；陰影只屬於暫時浮在黑板前面的 toast、對話框與窄螢幕的歌詞清單。

## Shapes

兩種形狀語言。能按的控制項是膠囊（999px）加 1px 格線框：按鈕、播放鍵、小圓鈕、導唱 chip、標籤、拼音三段切換、toast。裝內容的容器是圓角矩形：搜尋框 16px、對話框 20px、小搜尋框與 LRC 貼上框 12px、縮圖 8px。刻度與分隔線一律是直角的 1px 線；粉筆黃的填色線（歌詞底線、進度填色、步驟條）兩端圓頭。焦點外框是 2px 粉筆黃、外推 3px、圓角 6px。

簡譜記號的幾何：
- **小節線軌道**：14px 高，1px 中線加上等距的 1px 小節刻度，已播放部分疊一條 3px 粉筆黃。播放進度條分成 16 小節，準備頁的步驟條分成 4 小節。
- **把手**：4×22px 的直立短棒（圓角 2px），像一條加粗的小節線，不是圓點。
- **拍點小節線**：SVG 1px 直線，高 1.2em。
- **終止線**：SVG 細 1px 加粗 3px 兩條直線（中間空 8px），高 1.1em，粉筆黃。

### Named Rules
**The 1px 刻度 Rule.** 所有刻度、小節線、分隔線都是 1px。用 SVG 畫的記號加 `shapeRendering="crispEdges"` 對齊整數像素，不能糊成 2px 的灰線。

**The 膠囊是按鈕 Rule.** 能按的是膠囊，裝內容的才是圓角矩形。唯一例外是選歌頁搜尋列的送出鈕：它借用搜尋框的 16px 圓角與 56px 高度，和輸入框並排成一組。

## Components

### Buttons
親切、扎實，像黑板槽裡的粉筆盒：圓頭膠囊，字重 700。
- **Shape:** 膠囊（999px），高 40px，左右 18px，圖示與文字間 8px。
- **Primary:** 粉筆黃底、黃底墨字（搜尋、找歌詞、使用這份歌詞、再試一次）。在選歌頁搜尋列裡改成 56px 高、16px 圓角、16px 字、左右 26px。
- **Hover / Focus:** 160ms ease-out。Primary 變亮粉筆黃；ghost 框線從格線變暗粉筆、底變黑板二。鍵盤焦點用全域 2px 粉筆黃外框。Disabled 時 40% 不透明、not-allowed 游標。
- **Ghost:** 透明底、1px 格線框、粉筆白字，用於次要動作（換一首、回選歌、對話框內搜尋）。
- **Play:** 48px 實心粉筆黃圓鈕，裡面是播放三角或暫停雙槓。
- **Icon button:** 32px 圓、1px 格線框、淡粉筆圖示；hover 時框線變暗粉筆、圖示變粉筆白。用於歌詞時間 ±、關閉對話框、清除搜尋（清除鈕框線透明）。
- **Link:** 無框文字按鈕，淡粉筆、500；hover 時字變粉筆白，並淡入一條 1px 暗粉筆底線（距字 5px）。用於「選歌」「換歌詞」「全螢幕」「回選歌」。
- **圖示:** 24 格線稿 SVG、2px 圓頭線條、跟隨文字顏色，尺寸 16–20px；播放三角實心，暫停雙槓 3px。

### Chips
- **導唱 chip:** 32px 高膠囊、最小寬 76px、700。關閉（純伴奏）時透明底、格線框、淡粉筆字；開啟（導唱）時粉紅字、14% 粉紅底、70% 粉紅框線。旁邊接導唱滑桿（132px）與百分比。
- **標籤:** 20px 高膠囊、12px / 700，只有框線和字色，沒有底色。預設是格線框配淡粉筆（「官方頻道」）；ready 是粉筆黃（「已備好，直接開唱」「目前使用」）；blue 是粉藍（「標準長度」「時間吻合」「吻合，延後 0.5 秒」「已自動對準」）；warn 是粉紅（「沒有歌詞」「現場版」「伴奏版」「時間對不上」）。彩色標籤的框線是同色 55–60% 混透明。
- **歌詞時間標籤:** 練唱控制列在歌詞時間 ± 後面、「換歌詞」前面放一個標籤，說明後端用人聲軌核對的結果。使用者手動改過 offset 後，吻合類的標籤就拿掉，不再宣稱吻合；對不上的標籤一直留著。

### Cards / Containers
沒有卡片。內容容器只有清單列、對話框和 toast。
- **清單列:** 整列是一個按鈕，無框無底，列間 1px 淡格線；hover 底變黑板二（140ms），disabled 50% 不透明。YouTube 結果是 112px、16:9 的影片縮圖；YouTube Music 結果是 63px 正方形的專輯封面（和影片縮圖同高，從音軌縮圖中央裁出），一律 8px 圓角，載入前是黑板三。YouTube Music 的副標是「歌手 · 專輯」（專輯和歌名相同就省略）。標題 700、行高 1.45、最多兩行；副標暗粉筆，夾帶標籤；右側時間淡粉筆、靠右。精簡版（最近唱過、歌詞候選）沒有縮圖；歌詞候選在時間下方加長度差值，±2 秒內粉筆黃，其餘暗粉筆。
- **區塊標題:** 14px / 800、字距 0.06em，下方一條 1px 格線。
- **對話框:** 原生 dialog，黑板二底、1px 格線框、20px 圓角、Dialog 陰影；220ms 由下方 8px 淡入。由上而下是標題列（20px 標題＋關閉鈕）、暗粉筆說明、分頁、內容。
- **Toast:** 頂部置中的膠囊，黑板二底、1px 格線框、700 字、內距 6px 16px；200ms 由上方 4px 淡入，1.4 秒後消失。

### Inputs / Fields
- **Style:** 搜尋框 56px 高、16px 圓角、黑板二底、1px 格線框、18px / 500；placeholder 暗粉筆 400。原生清除鈕隱藏，改用框線透明的小圓鈕。對話框內的小搜尋框 42px、12px 圓角、14px。LRC 貼上框是黑板底、12px 圓角、等寬 13px / 行高 1.7、最小高 240px、可垂直拉長。
- **Focus:** 文字輸入不畫外框，框線直接變粉筆黃（160ms）。全頁輸入游標是粉筆黃。
- **Range:** 進度條與導唱滑桿見下方「小節線進度條」；停用時 50% 不透明。

### Navigation
- **分頁（換歌詞對話框）:** 無框文字、700、暗粉筆，間距 22px；選中時字變粉筆白，底下 2px 粉筆黃線壓在分頁列的 1px 淡格線上。
- **分段切換:** 外框是 1px 格線膠囊、內距 3px；選項是 28px 高的膠囊、500、暗粉筆，hover 變粉筆白；選中是 18% 粉藍底、粉藍字、700。用在練唱畫面的拼音三段切換（只在日文歌出現）和選歌頁的搜尋來源切換。
- **返回:** 用 link 樣式的「‹ 選歌」「‹ 回選歌」。練唱中按 Esc 也回選歌頁。

### 歌詞舞台（Signature）
- **擦色:** 每句是同一段文字疊兩層：底層粉筆白，上層粉筆黃依進度由左而右用 clip-path 露出；同時底下一條粉筆黃底線依進度長出。進度依整行時間平均推進。
- **句子狀態:** 正在唱的句子部分變黃；唱過的整句黃；下一句底層改成淡粉筆，拼音改成 70% 粉藍混黑板。
- **拼音:** 「原文＋拼音」時拼音疊在原文上方，粉藍、700、沒有底線，唱過的部分同樣變粉筆黃；「只有拼音」時拼音取代原文成為主行。
- **狀態訊息:** 載入、沒有歌詞、載入失敗時，舞台中央改放置中訊息（暗粉筆說明＋粉筆白 800 大字＋按鈕）。開播前在歌詞下方顯示「按空白鍵或點一下畫面開始」，暗粉筆、字距 0.08em。

**The 粉筆寫上去 Rule.** 歌詞舞台只有一個進場動作：新的一句以 360ms 由左而右的 clip-path 顯現，像粉筆寫上去。介面層另有 toast 與對話框的淡入、控制列的淡出，都是狀態回饋，不是表演；`prefers-reduced-motion: reduce` 時全部關閉。

### 全部歌詞清單
- **開關:** 控制列最右群組、全螢幕前面的「全部歌詞」文字連結（三條長短不一的線當圖示），快捷鍵 L。打開時連結變粉藍（和分段切換的選中態同色）。桌面版記住上次開關。
- **結構:** 黑板二底；標題「全部歌詞」14px / 800、字距 0.06em，右邊 32px 圓形關閉鈕；下方一行 12px 暗粉筆說明「點一句，從那裡接著唱」，再一條 1px 格線。清單上下緣用 mask 淡出。
- **每一句:** 整句是一個按鈕，grid 排「時間 3em｜歌詞」，內距 8px 12px、10px 圓角。時間是 12px 暗粉筆等寬數字（已加上歌詞時間偏移，對得上進度條）；歌詞 17px，字型跟舞台走（中文粉圓 400、日文 M PLUS Rounded 1c），可換行。唱過的句子暗粉筆、還沒唱的淡粉筆、hover 黑板三底配粉筆白。日文歌依拼音模式在下一行加 13px 粉藍拼音，或直接換成拼音。
- **正在唱:** 粉筆黃字、10% 粉筆黃底，不加左邊色條。正在唱的那句自動捲到清單 40% 高的位置；使用者自己捲動後 4 秒內不搶回來。
- **間奏:** 兩句之間空超過 8 秒，插一行 12px 暗粉筆「間奏 N 秒」，右邊接一條 1px 格線。
- **跳句:** 點一句就跳到那句開始前 1 秒（留時間換氣跟拍），沒在播就直接開始；那 1 秒內清單先標亮點的那句，不會閃回上一句。

### 休止符倒數（Signature）
下一句上方四個「0」加一條 1px 小節線，簡譜的休止符小節。剩幾拍就亮幾個，從最左邊開始熄：亮起是粉筆黃，熄滅是暗粉筆 32% 不透明。整組平時透明，只在倒數時以 240ms 淡入；單拍切換 120ms linear。

### 小節線進度條（Signature）
控制列第一列：左邊目前時間、中間進度條、右邊總長，時間是淡粉筆等寬數字。進度條是 24px 高的觸控區，裡面是小節線軌道（見 Shapes）與 4×22px 粉筆黃把手。導唱滑桿用同一套軌道，但填色與把手是粉紅（導唱人聲的顏色），軌道分 4 小節。

### 終止畫面
整首唱完時，兩行歌詞換成置中的「唱完了」（淡粉筆、800），左邊一個粉筆黃的簡譜終止線。

## Do's and Don'ts

### Do:
- **Do** 用粉筆黃表示「唱過、播過、按這個」，並搭配粉筆黃底線或比底線粗的填色，讓已唱和未唱不只靠色相區分。
- **Do** 讓新的可點控制項沿用膠囊形（999px）、1px 格線框、700 字重；hover 時框線變暗粉筆，160ms ease-out。
- **Do** 控制列與清單維持 14px 單一字級，用字重和三階粉筆明度做層級。
- **Do** 所有時間、百分比、計數用 tabular-nums。
- **Do** 新的刻度與分隔線用 1px；SVG 記號加 `shapeRendering="crispEdges"`。
- **Do** 文字輸入的焦點用框線變粉筆黃；其他元素用全域 2px 粉筆黃外框（外推 3px）。
- **Do** 所有動畫在 `prefers-reduced-motion: reduce` 下關閉。

### Don't:
- **Don't** 用模糊專輯封面當背景配捲動高亮歌詞當主畫面，也不要做成老 KTV 機台的藍底描邊字。
- **Don't** 用粉筆字體、手寫字體、黑板材質貼圖或粉筆筆觸紋理；黑板是一塊平的墨綠。
- **Don't** 加簡譜記號（拍點 0、小節線、終止線）以外的裝飾。
- **Don't** 讓舞台上的歌詞換行、捲動，或改變兩行的固定位置；放不下就縮字（換行、捲動只屬於「全部歌詞」清單）。
- **Don't** 把粉筆黃用在未唱的字或純裝飾上。
- **Don't** 在寫在黑板上的平面元素（清單列、控制列、搜尋框、按鈕）加陰影；陰影只屬於 toast、對話框與窄螢幕的歌詞清單。
