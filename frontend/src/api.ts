export type Source = 'ytmusic' | 'youtube'

export type SearchResult = {
  id: string
  title: string
  channel?: string | null
  artist?: string | null
  album?: string | null
  duration?: number | null
  thumbnail?: string | null
  source: Source
  official: boolean
  studioLength: boolean
  recommended: boolean
  live?: boolean
  karaoke?: boolean
  cached: boolean
}

/** 後端拿人聲軌核對歌詞時間的結果 */
export type SyncCheck = {
  /** 建議的 offset（秒）；不確定時是 0 */
  offset: number
  measured?: number
  z?: number
  contrast?: number
  /** ok 時間吻合／shifted 吻合但調了 offset／poor 對不上／unknown 沒核對 */
  status: 'ok' | 'shifted' | 'poor' | 'unknown'
}

export type LibraryItem = {
  id: string
  title: string
  artist?: string | null
  track?: string | null
  duration?: number | null
  thumbnail?: string | null
  hasLyrics: boolean
  lastPlayed: number
}

export type Stage = 'idle' | 'queued' | 'downloading' | 'separating' | 'lyrics' | 'done' | 'error'

export type JobStatus = {
  id: string
  stage: Stage
  progress: number
  error: string | null
}

export type SongMeta = {
  id: string
  title: string
  channel?: string | null
  artist?: string | null
  track?: string | null
  album?: string | null
  duration?: number | null
  thumbnail?: string | null
  offset?: number
  lrc?: string | null
  sync?: SyncCheck | null
  romaji?: Record<string, string> | null
  language?: string | null
  lyricsSource?: { id?: number; manual?: boolean } | null
}

export type LyricsCandidate = {
  id: number
  track: string
  artist: string
  album?: string | null
  duration?: number | null
  synced: boolean
  lrc: string | null
  sync?: SyncCheck | null
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    let detail = `${res.status}`
    try {
      const body = await res.json()
      if (body?.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail)
    } catch {
      /* 不是 JSON 就用狀態碼 */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

const q = (s: string) => encodeURIComponent(s)

export const api = {
  search: (query: string, source: Source) => request<SearchResult[]>(`/api/search?q=${q(query)}&source=${source}`),
  library: () => request<LibraryItem[]>('/api/library'),
  process: (id: string) => request<JobStatus>(`/api/songs/${id}/process`, { method: 'POST' }),
  status: (id: string) => request<JobStatus>(`/api/songs/${id}/status`),
  song: (id: string) => request<SongMeta>(`/api/songs/${id}`),
  patch: (id: string, body: Partial<Pick<SongMeta, 'offset' | 'lrc'>> & { lyricsSource?: unknown }) =>
    request<SongMeta>(`/api/songs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  /** 給 songId 時，後端會用這首歌的人聲軌核對每份歌詞的時間，對得上的排前面 */
  lyricsSearch: (query: string, songId?: string) =>
    request<LyricsCandidate[]>(`/api/lyrics/search?q=${q(query)}${songId ? `&song=${songId}` : ''}`),
  lyricsSuggest: (id: string) => request<{ q: string }>(`/api/lyrics/suggest-query/${id}`),
  audioUrl: (id: string, track: 'vocals' | 'inst') => `/api/songs/${id}/audio/${track}`,
}

export function formatTime(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec)) return '--:--'
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** 歌詞時間核對結果的短標籤 */
export function syncLabel(sync: SyncCheck | null | undefined): { text: string; tone: 'ok' | 'warn' } | null {
  if (!sync) return null
  if (sync.status === 'ok') return { text: '時間吻合', tone: 'ok' }
  if (sync.status === 'shifted') {
    const s = sync.offset
    return { text: `吻合，${s > 0 ? '延後' : '提早'} ${Math.abs(s).toFixed(1)} 秒`, tone: 'ok' }
  }
  if (sync.status === 'poor') return { text: '時間對不上', tone: 'warn' }
  return null
}
