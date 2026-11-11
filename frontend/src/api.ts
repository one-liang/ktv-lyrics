export type SearchResult = {
  id: string
  title: string
  channel?: string | null
  duration?: number | null
  thumbnail?: string | null
  official: boolean
  studioLength: boolean
  recommended: boolean
  cached: boolean
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
  duration?: number | null
  thumbnail?: string | null
  offset?: number
  lrc?: string | null
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
  search: (query: string) => request<SearchResult[]>(`/api/search?q=${q(query)}`),
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
  lyricsSearch: (query: string) => request<LyricsCandidate[]>(`/api/lyrics/search?q=${q(query)}`),
  lyricsSuggest: (id: string) => request<{ q: string }>(`/api/lyrics/suggest-query/${id}`),
  audioUrl: (id: string, track: 'vocals' | 'inst') => `/api/songs/${id}/audio/${track}`,
}

export function formatTime(sec: number | null | undefined): string {
  if (sec == null || !isFinite(sec)) return '--:--'
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
