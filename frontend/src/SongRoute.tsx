import { useEffect, useState } from 'react'
import { api, type JobStatus } from './api'
import { go } from './App'
import Player from './Player'
import { BackIcon } from './icons'

const STAGES: { key: JobStatus['stage']; label: string }[] = [
  { key: 'downloading', label: '下載音訊' },
  { key: 'separating', label: '分離人聲' },
  { key: 'lyrics', label: '配對歌詞' },
]

export default function SongRoute({ id }: { id: string }) {
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    let timer: number | undefined

    const poll = async () => {
      try {
        const s = await api.status(id)
        if (!alive) return
        setStatus(s)
        if (s.stage === 'done' || s.stage === 'error') return
        timer = window.setTimeout(poll, 600)
      } catch (e) {
        if (alive) setStatus({ id, stage: 'error', progress: 0, error: (e as Error).message })
      }
    }

    ;(async () => {
      try {
        const s = await api.status(id)
        if (!alive) return
        if (s.stage === 'idle' || (s.stage === 'error' && attempt > 0)) {
          setStatus(await api.process(id))
        } else {
          setStatus(s)
        }
        if (s.stage !== 'done') poll()
      } catch (e) {
        if (alive) setStatus({ id, stage: 'error', progress: 0, error: (e as Error).message })
      }
    })()

    return () => {
      alive = false
      window.clearTimeout(timer)
    }
  }, [id, attempt])

  if (status?.stage === 'done') return <Player id={id} />

  const currentIdx = STAGES.findIndex((s) => s.key === status?.stage)

  return (
    <main className="prep">
      <button className="prep__back link" onClick={() => go('/')}>
        <BackIcon /> 回選歌
      </button>
      <div className="prep__body">
        {status?.stage === 'error' ? (
          <>
            <h1 className="prep__title">這首歌處理失敗</h1>
            <p className="prep__error">{status.error}</p>
            <div className="prep__actions">
              <button className="btn btn--primary" onClick={() => setAttempt((a) => a + 1)}>
                再試一次
              </button>
              <button className="btn" onClick={() => go('/')}>
                換一首
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="prep__title">準備伴奏中</h1>
            <p className="prep__hint">第一次唱這首歌要先下載、去人聲，大約半分鐘；之後再點就會直接開始。</p>
            <ol className="steps" aria-live="polite">
              {STAGES.map((s, i) => {
                const state = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'todo'
                const p = state === 'done' ? 1 : state === 'active' ? status?.progress ?? 0 : 0
                return (
                  <li key={s.key} className={`step step--${state}`}>
                    <span className="step__label">{s.label}</span>
                    <span className="step__bar" style={{ '--p': p } as React.CSSProperties} aria-hidden />
                    <span className="step__pct">
                      {state === 'done' ? '完成' : state === 'active' ? `${Math.round(p * 100)}%` : ''}
                    </span>
                  </li>
                )
              })}
            </ol>
            {(!status || status.stage === 'queued') && <p className="prep__hint">排隊中…</p>}
          </>
        )}
      </div>
    </main>
  )
}
