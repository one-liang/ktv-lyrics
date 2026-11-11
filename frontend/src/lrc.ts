export type LyricLine = {
  start: number
  end: number
  text: string
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g
const OFFSET_TAG = /\[offset:\s*([+-]?\d+)\s*\]/i

/** 長間奏的門檻：上一句唱完到下一句開始超過這麼久，就先把唱完的那句收掉 */
const INTERLUDE_GAP = 6
/** 前奏／間奏超過這麼久，就在下一句前顯示倒數圓點 */
const COUNTDOWN_GAP = 5
const COUNTDOWN_DOTS = 4

/** 粗估一句的唱完時間：只有下一句隔很久時才用得到 */
function estimateDuration(text: string): number {
  const cjk = (text.match(/[぀-ヿ㐀-鿿가-힯]/g) || []).length
  const words = (text.replace(/[぀-ヿ㐀-鿿가-힯]/g, ' ').match(/[A-Za-z0-9']+/g) || []).length
  return Math.max(2, Math.min(8, cjk * 0.32 + words * 0.42 + 0.8))
}

export function parseLrc(lrc: string): LyricLine[] {
  const offsetMatch = lrc.match(OFFSET_TAG)
  const tagOffset = offsetMatch ? Number(offsetMatch[1]) / 1000 : 0
  const entries: { t: number; text: string }[] = []

  for (const raw of lrc.split(/\r?\n/)) {
    const stamps: number[] = []
    let m: RegExpExecArray | null
    TIME_TAG.lastIndex = 0
    while ((m = TIME_TAG.exec(raw))) {
      const sec = Number(m[2].replace(':', '.'))
      stamps.push(Number(m[1]) * 60 + sec - tagOffset)
    }
    if (!stamps.length) continue
    // 去掉逐字時間標記 <mm:ss.xx>（增強版 LRC）
    const text = raw.replace(TIME_TAG, '').replace(/<\d+:\d+(?:\.\d+)?>/g, '').trim()
    for (const t of stamps) entries.push({ t: Math.max(0, t), text })
  }
  entries.sort((a, b) => a.t - b.t)

  const lines: LyricLine[] = []
  entries.forEach((e, i) => {
    if (!e.text) return // 空行只當作上一句的結束點
    const next = entries[i + 1]
    const est = estimateDuration(e.text)
    let end: number
    if (!next) {
      end = e.t + est
    } else {
      const gap = next.t - e.t
      // 一般情況：唱到下一句前一點點；下一句隔很久時（間奏），用估計長度
      end = gap <= 8 ? e.t + gap - Math.min(0.3, gap * 0.08) : e.t + Math.min(gap, est)
    }
    lines.push({ start: e.t, end: Math.max(end, e.t + 0.3), text: e.text })
  })
  return lines
}

export type Slot = {
  line: LyricLine | null
  index: number
  progress: number // 0~1 變色進度
  countdown: number // 剩幾顆倒數圓點，0 = 不顯示
}

export type KtvView = {
  top: Slot
  bottom: Slot
  finished: boolean
}

const empty = (): Slot => ({ line: null, index: -1, progress: 0, countdown: 0 })

/**
 * KTV 雙行交錯：第 i 句固定放在第 i % 2 行（偶數上行靠左、奇數下行靠右）。
 * 正在唱的那句會停在原位直到下一句開始，然後才被「再下一句」替換。
 */
export function ktvView(lines: LyricLine[], t: number): KtvView {
  const view: KtvView = { top: empty(), bottom: empty(), finished: false }
  if (!lines.length) return view

  // c = 最後一句已經開始的
  let c = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].start <= t) c = i
    else break
  }

  const put = (i: number) => {
    if (i < 0 || i >= lines.length) return
    const line = lines[i]
    const slot = i % 2 === 0 ? view.top : view.bottom
    slot.line = line
    slot.index = i
    slot.progress = Math.max(0, Math.min(1, (t - line.start) / (line.end - line.start)))
    const prevEnd = i === 0 ? 0 : lines[i - 1].end
    const remaining = line.start - t
    if (line.start - prevEnd >= COUNTDOWN_GAP && remaining > 0 && remaining <= COUNTDOWN_DOTS) {
      slot.countdown = Math.ceil(remaining)
    }
  }

  if (c === -1) {
    put(0)
    put(1)
    return view
  }

  const cur = lines[c]
  const next = lines[c + 1]
  const longBreak = next ? next.start - cur.end > INTERLUDE_GAP : true

  if (!next && t > cur.end + 3) {
    view.finished = true
    return view
  }

  if (longBreak && t > cur.end + 1) {
    // 間奏中：唱完的收掉，預先顯示接下來兩句
    put(c + 1)
    put(c + 2)
  } else {
    put(c)
    put(c + 1)
  }
  return view
}

/** 估算字串的視覺寬度（em），用來自動縮小過長的歌詞 */
export function visualWidth(text: string): number {
  let w = 0
  for (const ch of text) {
    if (/[　-ヿ㐀-鿿가-힯＀-￯]/.test(ch)) w += 1
    else if (ch === ' ') w += 0.32
    else w += 0.62
  }
  // 預留字距（0.02em）與描邊的寬度，避免長句最後一個字超出畫面
  return Math.max(w * 1.05 + 0.3, 1)
}
