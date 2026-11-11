import { useEffect, useRef, useState } from 'react'
import { api, formatTime, type LyricsCandidate, type SongMeta } from './api'
import { CloseIcon } from './icons'

type Props = {
  song: SongMeta
  open: boolean
  onClose: () => void
  onApplied: (meta: SongMeta) => void
}

export default function LyricsPicker({ song, open, onClose, onApplied }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<LyricsCandidate[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paste, setPaste] = useState('')
  const [tab, setTab] = useState<'search' | 'paste'>('search')

  const search = async (q: string) => {
    if (!q.trim()) return
    setBusy(true)
    setError(null)
    try {
      const found = await api.lyricsSearch(q.trim())
      const d = song.duration ?? 0
      setResults(d ? [...found].sort((a, b) => Math.abs((a.duration ?? 0) - d) - Math.abs((b.duration ?? 0) - d)) : found)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      api
        .lyricsSuggest(song.id)
        .then(({ q }) => {
          setQuery(q)
          void search(q)
        })
        .catch(() => {})
    } else if (!open && d.open) {
      d.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, song.id])

  const apply = async (lrc: string, source: unknown) => {
    setBusy(true)
    setError(null)
    try {
      const meta = await api.patch(song.id, { lrc, lyricsSource: source })
      onApplied(meta)
      onClose()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const validPaste = /\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\]/.test(paste)

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onCancel={onClose}>
      <header className="dialog__head">
        <h2 className="dialog__title">換一份歌詞</h2>
        <button className="icon-btn" onClick={onClose} aria-label="關閉">
          <CloseIcon />
        </button>
      </header>
      <p className="dialog__hint">
        影片長度 {formatTime(song.duration)}。時長最接近的歌詞版本，時間通常最準。
      </p>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'search'} className="tab" onClick={() => setTab('search')}>
          從 LRCLIB 挑
        </button>
        <button role="tab" aria-selected={tab === 'paste'} className="tab" onClick={() => setTab('paste')}>
          貼上 LRC
        </button>
      </div>

      {tab === 'search' ? (
        <div className="dialog__body">
          <form
            className="search__row"
            onSubmit={(e) => {
              e.preventDefault()
              void search(query)
            }}
          >
            <input
              className="search__input search__input--sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="歌名 歌手"
              aria-label="搜尋歌詞"
            />
            <button className="btn" type="submit" disabled={busy}>
              搜尋
            </button>
          </form>
          {error && <p className="note note--error">{error}</p>}
          {busy && !results && <p className="note">搜尋中…</p>}
          {results?.length === 0 && <p className="note">找不到有時間軸的歌詞。可以改關鍵字，或切到「貼上 LRC」。</p>}
          {results && results.length > 0 && (
            <ol className="tracks tracks--compact lyric-results">
              {results.map((r) => {
                const diff = song.duration && r.duration ? Math.round(r.duration - song.duration) : null
                return (
                  <li key={r.id}>
                    <button className="track" disabled={busy || !r.lrc} onClick={() => r.lrc && apply(r.lrc, r)}>
                      <span className="track__main">
                        <span className="track__title">{r.track}</span>
                        <span className="track__sub">
                          {r.artist}
                          {r.album ? ` · ${r.album}` : ''}
                          {song.lyricsSource?.id === r.id && <span className="tag tag--ready">目前使用</span>}
                        </span>
                      </span>
                      <span className="track__time">
                        {formatTime(r.duration)}
                        {diff !== null && (
                          <span className={`diff ${Math.abs(diff) <= 2 ? 'diff--ok' : ''}`}>
                            {diff === 0 ? '長度相同' : `${diff > 0 ? '+' : ''}${diff} 秒`}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      ) : (
        <div className="dialog__body">
          <textarea
            className="paste"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={'[00:12.30] 第一句歌詞\n[00:16.85] 第二句歌詞'}
            spellCheck={false}
            aria-label="LRC 歌詞"
          />
          {error && <p className="note note--error">{error}</p>}
          <div className="dialog__actions">
            <span className="note">{paste && !validPaste ? '要有 [分:秒] 時間標記才能同步。' : ''}</span>
            <button className="btn btn--primary" disabled={!validPaste || busy} onClick={() => apply(paste, { manual: true })}>
              使用這份歌詞
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
