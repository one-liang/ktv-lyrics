import { memo, useEffect, useRef } from 'react'
import { formatTime } from './api'
import { CloseIcon } from './icons'
import type { LyricLine } from './lrc'
import type { RomajiMode } from './Lyrics'

type Props = {
  lines: LyricLine[]
  /** 正在唱（或剛點下去、馬上要唱）的那一句；-1 = 還沒開始 */
  current: number
  offset: number
  romaji: Record<string, string> | null
  mode: RomajiMode
  lang: string
  onJump: (index: number) => void
  onClose: () => void
}

/** 上一句唱完到下一句開始超過這麼久，就在中間標一條「間奏」 */
const GAP = 8
/** 使用者自己捲動後，這段時間內不自動捲回正在唱的那句 */
const HOLD_MS = 4000

function LyricsPanel({ lines, current, offset, romaji, mode, lang, onJump, onClose }: Props) {
  const listRef = useRef<HTMLOListElement>(null)
  const holdUntil = useRef(0)
  const opened = useRef(false)

  // 正在唱的那句停在清單 40% 高的地方；剛打開時直接跳過去，之後平滑捲動
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (opened.current && Date.now() < holdUntil.current) return
    const el = list.querySelector<HTMLElement>(`[data-i="${Math.max(current, 0)}"]`)
    if (!el) return
    list.scrollTo({
      top: el.offsetTop - list.clientHeight * 0.4 + el.offsetHeight / 2,
      behavior: opened.current ? 'smooth' : 'auto',
    })
    opened.current = true
  }, [current])

  const hold = () => {
    holdUntil.current = Date.now() + HOLD_MS
  }

  const ja = lang === 'ja' && !!romaji

  return (
    <aside className="lyrics-panel" lang={lang === 'ja' ? 'ja' : undefined} aria-label="全部歌詞">
      <div className="lyrics-panel__head">
        <h2 className="lyrics-panel__title">全部歌詞</h2>
        <button className="icon-btn" onClick={onClose} aria-label="收起全部歌詞" title="L">
          <CloseIcon size={16} />
        </button>
      </div>
      <p className="lyrics-panel__hint">點一句，從那裡接著唱</p>
      <ol className="lyrics-panel__list" ref={listRef} onWheel={hold} onTouchMove={hold}>
        {lines.map((line, i) => {
          const ro = ja ? romaji?.[line.text] : undefined
          const showRo = ro && ro !== line.text
          const prev = lines[i - 1]
          const gap = prev ? line.start - prev.end : 0
          return (
            <li key={i}>
              {gap > GAP && (
                <p className="pgap" aria-hidden>
                  間奏 {Math.round(gap)} 秒
                </p>
              )}
              <button
                className={`pline ${i < current ? 'pline--past' : ''}`}
                data-i={i}
                aria-current={i === current ? 'true' : undefined}
                onClick={() => onJump(i)}
              >
                <span className="pline__time">{formatTime(line.start + offset)}</span>
                <span className="pline__text">{mode === 'romaji' && showRo ? ro : line.text}</span>
                {mode === 'both' && showRo && <span className="pline__ro">{ro}</span>}
              </button>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

export default memo(LyricsPanel)
