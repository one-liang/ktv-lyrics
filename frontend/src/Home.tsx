import { useEffect, useRef, useState } from 'react'
import { api, formatTime, type LibraryItem, type SearchResult } from './api'
import { go } from './App'
import { CloseIcon } from './icons'

export default function Home() {
  const [query, setQuery] = useState(() => sessionStorage.getItem('ktv.lastQuery') ?? '')
  const [results, setResults] = useState<SearchResult[] | null>(() => {
    try {
      const raw = sessionStorage.getItem('ktv.lastResults')
      return raw ? (JSON.parse(raw) as SearchResult[]) : null
    } catch {
      return null
    }
  })
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [library, setLibrary] = useState<LibraryItem[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.library().then(setLibrary).catch(() => setLibrary([]))
    inputRef.current?.focus()
  }, [])

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    sessionStorage.setItem('ktv.lastQuery', q)
    setSearching(true)
    setError(null)
    try {
      const found = await api.search(q)
      setResults(found)
      try {
        sessionStorage.setItem('ktv.lastResults', JSON.stringify(found))
      } catch {
        /* 存不下就算了 */
      }
    } catch (err) {
      setError((err as Error).message)
      setResults(null)
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="home">
      <header className="home__head">
        <p className="brand">
          KTV 練唱 <span className="brand__beats" aria-hidden>1 2 3 4 |</span>
        </p>
        <form className="search" onSubmit={search} role="search">
          <label htmlFor="q" className="search__label">
            想唱哪首歌？
          </label>
          <div className="search__row">
            <div className="search__field">
              <input
                id="q"
                ref={inputRef}
                className="search__input"
                type="search"
                placeholder="歌名或歌手，例如：夜に駆ける YOASOBI"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <button
                  type="button"
                  className="icon-btn search__clear"
                  aria-label="清除"
                  onClick={() => {
                    setQuery('')
                    inputRef.current?.focus()
                  }}
                >
                  <CloseIcon size={16} />
                </button>
              )}
            </div>
            <button className="btn btn--primary" type="submit" disabled={searching || !query.trim()}>
              {searching ? '搜尋中…' : '搜尋'}
            </button>
          </div>
        </form>
      </header>

      <div className="home__cols">
        <section className="panel" aria-labelledby="results-h">
          <h2 id="results-h" className="panel__title">
            YouTube 搜尋結果
          </h2>
          {error && <p className="note note--error">搜尋失敗：{error}。確認後端有在執行，再試一次。</p>}
          {!error && results === null && !searching && (
            <p className="note">輸入歌名開始搜尋。長度和多數版本相同、官方頻道的結果會排在前面；MV 常有前奏劇情，歌詞時間容易對不上。</p>
          )}
          {searching && <p className="note">正在 YouTube 上找…</p>}
          {results && results.length === 0 && <p className="note">找不到結果，換個關鍵字試試。</p>}
          {results && results.length > 0 && (
            <ol className="tracks">
              {results.map((r) => (
                <li key={r.id}>
                  <button className="track" onClick={() => go(`/song/${r.id}`)}>
                    <img className="track__thumb" src={r.thumbnail ?? ''} alt="" loading="lazy" />
                    <span className="track__main">
                      <span className="track__title">{r.title}</span>
                      <span className="track__sub">
                        {r.channel}
                        {r.official && <span className="tag">官方頻道</span>}
                        {r.studioLength && (
                          <span className="tag tag--blue" title="和大多數上傳的長度相同，歌詞時間最可能對得上">
                            標準長度
                          </span>
                        )}
                        {r.cached && <span className="tag tag--ready">已備好，直接開唱</span>}
                      </span>
                    </span>
                    <span className="track__time">{formatTime(r.duration)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="panel" aria-labelledby="recent-h">
          <h2 id="recent-h" className="panel__title">
            最近唱過
          </h2>
          {library === null && <p className="note">載入中…</p>}
          {library?.length === 0 && <p className="note">還沒有唱過的歌。處理過的歌會留在這裡，下次點了就直接開始。</p>}
          {library && library.length > 0 && (
            <ol className="tracks tracks--compact">
              {library.map((s) => (
                <li key={s.id}>
                  <button className="track" onClick={() => go(`/song/${s.id}`)}>
                    <span className="track__main">
                      <span className="track__title">{s.track || s.title}</span>
                      <span className="track__sub">
                        {s.artist}
                        {!s.hasLyrics && <span className="tag tag--warn">沒有歌詞</span>}
                      </span>
                    </span>
                    <span className="track__time">{formatTime(s.duration)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  )
}
