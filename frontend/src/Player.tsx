import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, formatTime, syncLabel, type SongMeta } from './api'
import { go } from './App'
import { DualTrackEngine } from './engine'
import { parseLrc } from './lrc'
import Lyrics, { type RomajiMode } from './Lyrics'
import LyricsPanel from './LyricsPanel'
import LyricsPicker from './LyricsPicker'
import { BackIcon, FullscreenIcon, LyricsIcon, MinusIcon, PauseIcon, PlayIcon, PlusIcon } from './icons'

const ROMAJI_MODES: { key: RomajiMode; label: string }[] = [
  { key: 'orig', label: '原文' },
  { key: 'both', label: '原文＋拼音' },
  { key: 'romaji', label: '只有拼音' },
]

/** 點全部歌詞裡的一句時，往前多留這麼多秒，讓人有時間換氣、跟上拍子 */
const JUMP_LEAD = 1
const NARROW = '(max-width: 860px)'

function stored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v === null ? fallback : (JSON.parse(v) as T)
  } catch {
    return fallback
  }
}
function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 私密模式等情況，忽略 */
  }
}

export default function Player({ id }: { id: string }) {
  const engineRef = useRef<DualTrackEngine | null>(null)
  const [meta, setMeta] = useState<SongMeta | null>(null)
  const [loadP, setLoadP] = useState(0)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [vocal, setVocal] = useState<number>(() => stored('ktv.vocal', 0.15))
  const lastVocal = useRef<number>(stored('ktv.lastVocal', 0.6))
  const [mode, setMode] = useState<RomajiMode>(() => stored('ktv.romajiMode', 'both'))
  const [offset, setOffset] = useState(0)
  const [idle, setIdle] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  // 記住上次有沒有打開；窄螢幕的歌詞清單會蓋住舞台，一律先收起來
  const [panelOpen, setPanelOpen] = useState<boolean>(
    () => stored('ktv.lyricsPanel', false) && !window.matchMedia(NARROW).matches,
  )
  const jumpRef = useRef<{ index: number; start: number } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const idleTimer = useRef<number | undefined>(undefined)
  const toastTimer = useRef<number | undefined>(undefined)
  const offsetSave = useRef<number | undefined>(undefined)

  // 載入歌曲資訊與兩軌音訊
  useEffect(() => {
    const engine = new DualTrackEngine()
    engineRef.current = engine
    let alive = true
    engine.onEnded = () => setPlaying(false)
    ;(async () => {
      try {
        const m = await api.song(id)
        if (!alive) return
        setMeta(m)
        setOffset(m.offset ?? 0)
        await engine.load(api.audioUrl(id, 'vocals'), api.audioUrl(id, 'inst'), (p) => alive && setLoadP(p))
        if (!alive) return
        engine.setVocalVolume(stored('ktv.vocal', 0.15))
        setReady(true)
      } catch (e) {
        if (alive) setError((e as Error).message)
      }
    })()
    return () => {
      alive = false
      engine.dispose()
      engineRef.current = null
    }
  }, [id])

  // 每一格畫面更新時間
  useEffect(() => {
    if (!ready) return
    let raf = 0
    const tick = () => {
      const e = engineRef.current
      if (e) setTime(e.currentTime)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ready])

  const lines = useMemo(() => (meta?.lrc ? parseLrc(meta.lrc) : []), [meta?.lrc])
  const duration = engineRef.current?.duration || meta?.duration || 0
  const isJa = meta?.language === 'ja' && !!meta.romaji

  const flash = useCallback((msg: string) => {
    setToast(msg)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1400)
  }, [])

  const togglePlay = useCallback(async () => {
    const e = engineRef.current
    if (!e || !ready) return
    if (e.playing) {
      e.pause()
      setPlaying(false)
    } else {
      await e.play()
      setPlaying(true)
    }
  }, [ready])

  const seek = useCallback((t: number) => {
    const e = engineRef.current
    if (!e) return
    e.seek(t)
    setTime(e.currentTime)
  }, [])

  const applyVocal = useCallback((v: number) => {
    const clamped = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100
    setVocal(clamped)
    store('ktv.vocal', clamped)
    if (clamped > 0) {
      lastVocal.current = clamped
      store('ktv.lastVocal', clamped)
    }
    engineRef.current?.setVocalVolume(clamped)
  }, [])

  const toggleVocal = useCallback(() => {
    const next = vocal > 0 ? 0 : lastVocal.current || 0.6
    applyVocal(next)
    flash(next > 0 ? `導唱 ${Math.round(next * 100)}%` : '純伴奏')
  }, [vocal, applyVocal, flash])

  const changeMode = useCallback(
    (m: RomajiMode) => {
      setMode(m)
      store('ktv.romajiMode', m)
    },
    [],
  )

  const nudgeOffset = useCallback(
    (delta: number) => {
      setOffset((o) => {
        const next = Math.round((o + delta) * 10) / 10
        window.clearTimeout(offsetSave.current)
        offsetSave.current = window.setTimeout(() => void api.patch(id, { offset: next }).catch(() => {}), 500)
        flash(next === 0 ? '歌詞時間：原始' : `歌詞${next > 0 ? '延後' : '提早'} ${Math.abs(next).toFixed(1)} 秒`)
        return next
      })
    },
    [id, flash],
  )

  const togglePanel = useCallback(() => {
    setPanelOpen((open) => {
      store('ktv.lyricsPanel', !open)
      return !open
    })
  }, [])

  // 點全部歌詞裡的一句：跳到那句前一點點，沒在播就直接開始
  const jumpTo = useCallback(
    (index: number) => {
      const line = lines[index]
      const e = engineRef.current
      if (!line || !e) return
      jumpRef.current = { index, start: line.start }
      seek(Math.max(0, line.start + offset - JUMP_LEAD))
      if (!e.playing) void togglePlay()
      // 窄螢幕的歌詞清單蓋住舞台，點完就收起來
      if (window.matchMedia(NARROW).matches) setPanelOpen(false)
    },
    [lines, offset, seek, togglePlay],
  )

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => {})
  }, [])

  // 控制列閒置自動隱藏
  const wake = useCallback(() => {
    setIdle(false)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setIdle(true), 2600)
  }, [])

  useEffect(() => {
    wake()
    return () => window.clearTimeout(idleTimer.current)
  }, [wake])

  // 鍵盤快捷鍵
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pickerOpen) return
      const target = e.target as HTMLElement
      if (target.closest('input[type="text"], input[type="search"], textarea')) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const key = e.key
      let handled = true
      if (key === ' ') void togglePlay()
      else if (key === 'ArrowLeft') seek((engineRef.current?.currentTime ?? 0) - 5)
      else if (key === 'ArrowRight') seek((engineRef.current?.currentTime ?? 0) + 5)
      else if (key === 'ArrowUp') {
        applyVocal(vocal + 0.1)
        flash(`導唱 ${Math.round(Math.min(1, vocal + 0.1) * 100)}%`)
      } else if (key === 'ArrowDown') {
        const n = Math.max(0, vocal - 0.1)
        applyVocal(n)
        flash(n > 0.001 ? `導唱 ${Math.round(n * 100)}%` : '純伴奏')
      } else if (key === 'v' || key === 'V') toggleVocal()
      else if ((key === 'r' || key === 'R') && isJa) {
        const i = ROMAJI_MODES.findIndex((m) => m.key === mode)
        const next = ROMAJI_MODES[(i + 1) % ROMAJI_MODES.length]
        changeMode(next.key)
        flash(next.label)
      } else if (key === '[' || key === '{') nudgeOffset(e.shiftKey ? -1 : -0.2)
      else if (key === ']' || key === '}') nudgeOffset(e.shiftKey ? 1 : 0.2)
      else if (key === 'f' || key === 'F') toggleFullscreen()
      else if ((key === 'l' || key === 'L') && lines.length > 0) togglePanel()
      else if (key === 'Escape' && panelOpen && window.matchMedia(NARROW).matches) setPanelOpen(false)
      else if (key === 'Escape' && !document.fullscreenElement) go('/')
      else handled = false
      if (handled) {
        e.preventDefault()
        wake()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pickerOpen, togglePlay, seek, applyVocal, vocal, toggleVocal, isJa, mode, changeMode, nudgeOffset, toggleFullscreen, togglePanel, panelOpen, lines.length, wake, flash])

  const title = meta?.track || meta?.title || ''
  const lyricTime = time - offset
  const chromeHidden = idle && playing && !pickerOpen
  const showPanel = panelOpen && lines.length > 0

  // 全部歌詞裡要標亮的那句：正在唱的；剛點下去、還在前導的那一秒就先標點的那句
  let current = -1
  for (let i = 0; i < lines.length && lines[i].start <= lyricTime; i++) current = i
  const jump = jumpRef.current
  if (jump && lyricTime < jump.start && lyricTime >= jump.start - JUMP_LEAD - 0.5) current = jump.index

  return (
    <div
      className={`player ${chromeHidden ? 'player--idle' : ''} ${showPanel ? 'player--panel' : ''}`}
      onMouseMove={wake}
      onPointerDown={wake}
    >
      <p className="player__title">
        <span className="player__song">{title}</span>
        {meta?.artist && <span className="player__artist">{meta.artist}</span>}
      </p>

      <div className="player__stage" onClick={() => void togglePlay()}>
        {error ? (
          <div className="stage-msg">
            <p>音訊載入失敗：{error}</p>
            <button className="btn" onClick={() => go('/')}>
              回選歌
            </button>
          </div>
        ) : !ready ? (
          <div className="stage-msg" aria-live="polite">
            <p className="stage-msg__big">載入伴奏 {Math.round(loadP * 100)}%</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="stage-msg" onClick={(e) => e.stopPropagation()}>
            <p className="stage-msg__big">這首歌沒有配到同步歌詞</p>
            <p>還是可以播放練習；或者自己挑一份歌詞。</p>
            <button className="btn btn--primary" onClick={() => setPickerOpen(true)}>
              找歌詞
            </button>
          </div>
        ) : (
          <Lyrics lines={lines} time={lyricTime} romaji={meta?.romaji ?? null} mode={mode} lang={meta?.language ?? ''} />
        )}
        {ready && !playing && lines.length > 0 && time < 0.1 && (
          <p className="press-play">按空白鍵或點一下畫面開始</p>
        )}
        {ready && !playing && lines.length > 0 && meta?.sync?.status === 'poor' && (
          <p className="stage-warn" onClick={(e) => e.stopPropagation()}>
            這份歌詞和音訊的時間可能對不上（也許是不同版本）。
            <button className="link link--warn" onClick={() => setPickerOpen(true)}>
              換一份歌詞
            </button>
          </p>
        )}
      </div>

      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}

      <div className="controls" onClick={(e) => e.stopPropagation()}>
        <div className="measure">
          <span className="measure__time">{formatTime(time)}</span>
          <input
            className="measure__range"
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(time, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="播放進度"
            disabled={!ready}
            style={{ '--p': duration ? time / duration : 0 } as React.CSSProperties}
          />
          <span className="measure__time">{formatTime(duration)}</span>
        </div>

        <div className="controls__row">
          <div className="controls__group">
            <button className="link" onClick={() => go('/')}>
              <BackIcon /> 選歌
            </button>
            <button className="btn btn--play" onClick={() => void togglePlay()} disabled={!ready} aria-label={playing ? '暫停' : '播放'}>
              {playing ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>

          <div className="controls__group">
            <button
              className={`chip ${vocal > 0 ? 'chip--on' : ''}`}
              onClick={toggleVocal}
              aria-pressed={vocal > 0}
              title="V"
            >
              {vocal > 0 ? '導唱' : '純伴奏'}
            </button>
            <input
              className="vocal"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={vocal}
              onChange={(e) => applyVocal(Number(e.target.value))}
              aria-label="導唱音量"
              style={{ '--p': vocal } as React.CSSProperties}
            />
            <span className="controls__val">{Math.round(vocal * 100)}%</span>
          </div>

          {isJa && (
            <div className="seg" role="radiogroup" aria-label="羅馬拼音">
              {ROMAJI_MODES.map((m) => (
                <button
                  key={m.key}
                  role="radio"
                  aria-checked={mode === m.key}
                  className="seg__btn"
                  onClick={() => changeMode(m.key)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="controls__group">
            <span className="controls__label">歌詞時間</span>
            <button className="icon-btn" onClick={() => nudgeOffset(-0.2)} aria-label="歌詞提早 0.2 秒" title="[">
              <MinusIcon />
            </button>
            <span className="controls__val controls__val--offset">
              {offset === 0 ? '±0.0' : `${offset > 0 ? '+' : '−'}${Math.abs(offset).toFixed(1)}`}
            </span>
            <button className="icon-btn" onClick={() => nudgeOffset(0.2)} aria-label="歌詞延後 0.2 秒" title="]">
              <PlusIcon />
            </button>
            <SyncBadge meta={meta} offset={offset} />
            <button className="link" onClick={() => setPickerOpen(true)} disabled={!meta}>
              換歌詞
            </button>
          </div>

          <div className="controls__group">
            <button
              className="link"
              onClick={togglePanel}
              aria-pressed={showPanel}
              disabled={lines.length === 0}
              title="L"
            >
              <LyricsIcon /> 全部歌詞
            </button>
            <button className="link" onClick={toggleFullscreen} title="F">
              <FullscreenIcon /> 全螢幕
            </button>
          </div>
        </div>
        <p className="keys">空白 播放 · ← → 快轉 · ↑ ↓ 導唱 · V 純伴奏 · {isJa ? 'R 拼音 · ' : ''}[ ] 歌詞時間（加 Shift 一次 1 秒）· L 全部歌詞 · F 全螢幕</p>
      </div>

      {showPanel && (
        <LyricsPanel
          lines={lines}
          current={current}
          offset={offset}
          romaji={meta?.romaji ?? null}
          mode={isJa ? mode : 'orig'}
          lang={meta?.language ?? ''}
          onJump={jumpTo}
          onClose={togglePanel}
        />
      )}

      {meta && (
        <LyricsPicker
          song={meta}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onApplied={(m) => {
            setMeta(m)
            // 後端換歌詞時會核對時間，對得上就直接給好 offset
            setOffset(m.offset ?? 0)
            const s = m.sync?.status
            flash(
              s === 'shifted'
                ? `已換歌詞，自動${(m.offset ?? 0) > 0 ? '延後' : '提早'} ${Math.abs(m.offset ?? 0).toFixed(1)} 秒`
                : s === 'poor'
                  ? '已換歌詞，但時間可能對不上'
                  : '已換歌詞',
            )
          }}
        />
      )}
    </div>
  )
}

/** 歌詞時間核對結果：自動調過 offset 後使用者又手動改過，就不再宣稱「吻合」 */
function SyncBadge({ meta, offset }: { meta: SongMeta | null; offset: number }) {
  const sync = meta?.sync
  const label = syncLabel(sync)
  if (!sync || !label) return null
  const touched = Math.abs(offset - (sync.offset ?? 0)) > 0.05
  if (touched && label.tone === 'ok') return null
  const title =
    sync.status === 'poor'
      ? '用人聲軌比對過，這份歌詞的句子和歌聲對不起來'
      : sync.status === 'shifted'
        ? '用人聲軌比對過，已自動調整歌詞時間'
        : '用人聲軌比對過，每句開頭都對得上歌聲'
  return (
    <span className={`tag ${label.tone === 'ok' ? 'tag--blue' : 'tag--warn'}`} title={title}>
      {sync.status === 'shifted' ? '已自動對準' : label.text}
    </span>
  )
}
