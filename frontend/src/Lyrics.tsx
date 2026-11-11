import { memo } from 'react'
import { ktvView, visualWidth, type LyricLine, type Slot } from './lrc'

export type RomajiMode = 'orig' | 'both' | 'romaji'

type Props = {
  lines: LyricLine[]
  time: number
  romaji: Record<string, string> | null
  mode: RomajiMode
  lang: string
}

function Wipe({ text, progress, className }: { text: string; progress: number; className: string }) {
  return (
    <span
      className={`wipe ${className}`}
      style={{ '--p': progress, '--w': visualWidth(text) } as React.CSSProperties}
    >
      <span className="wipe__base">{text}</span>
      <span className="wipe__fill" aria-hidden>
        {text}
      </span>
    </span>
  )
}

function Row({ slot, pos, romaji, mode }: { slot: Slot; pos: 'top' | 'bottom'; romaji: Props['romaji']; mode: RomajiMode }) {
  const line = slot.line
  const ro = line && romaji ? romaji[line.text] : undefined
  const main = line ? (mode === 'romaji' && ro ? ro : line.text) : ''
  const state = !line ? 'empty' : slot.progress >= 1 ? 'sung' : slot.progress > 0 ? 'singing' : 'next'

  return (
    <div className={`row row--${pos} row--${state}`}>
      {line && (
        <div className="row__inner" key={slot.index}>
          <div className="beats" aria-hidden data-on={slot.countdown > 0}>
            {[4, 3, 2, 1].map((n) => (
              <span key={n} className={`beat ${slot.countdown >= n ? 'beat--on' : ''}`}>
                0
              </span>
            ))}
            <svg className="beat__bar" viewBox="0 0 1 10" preserveAspectRatio="none" shapeRendering="crispEdges">
              <rect width="1" height="10" />
            </svg>
          </div>
          {mode === 'both' && ro && ro !== line.text && <Wipe text={ro} progress={slot.progress} className="wipe--ruby" />}
          <Wipe text={main} progress={slot.progress} className={mode === 'romaji' && ro ? 'wipe--latin' : 'wipe--main'} />
        </div>
      )}
    </div>
  )
}

function Lyrics({ lines, time, romaji, mode, lang }: Props) {
  const view = ktvView(lines, time)
  const effectiveRomaji = lang === 'ja' ? romaji : null
  const effectiveMode = effectiveRomaji ? mode : 'orig'

  return (
    <div className="stage" lang={lang === 'ja' ? 'ja' : undefined}>
      {view.finished ? (
        <p className="stage__end">
          <svg className="stage__end-mark" viewBox="0 0 12 40" preserveAspectRatio="none" shapeRendering="crispEdges" aria-hidden>
            <rect x="0" width="1" height="40" />
            <rect x="9" width="3" height="40" />
          </svg>
          唱完了
        </p>
      ) : (
        <>
          <Row slot={view.top} pos="top" romaji={effectiveRomaji} mode={effectiveMode} />
          <Row slot={view.bottom} pos="bottom" romaji={effectiveRomaji} mode={effectiveMode} />
        </>
      )}
    </div>
  )
}

export default memo(Lyrics)
