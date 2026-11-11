/**
 * 雙軌播放引擎：人聲與伴奏各解碼成 AudioBuffer，用 Web Audio 在同一個時間點啟動，
 * 兩軌取樣級同步；切換導唱只調人聲軌的音量。
 */
export class DualTrackEngine {
  private ctx: AudioContext
  private vocalGain: GainNode
  private instGain: GainNode
  private master: GainNode
  private buffers: { vocals: AudioBuffer; inst: AudioBuffer } | null = null
  private sources: AudioBufferSourceNode[] = []
  private startedAt = 0 // ctx.currentTime 對應到 offsetAtStart 的那一刻
  private offsetAtStart = 0
  private _playing = false
  onEnded: (() => void) | null = null

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'playback' })
    this.master = this.ctx.createGain()
    this.master.connect(this.ctx.destination)
    this.vocalGain = this.ctx.createGain()
    this.instGain = this.ctx.createGain()
    this.vocalGain.connect(this.master)
    this.instGain.connect(this.master)
  }

  async load(vocalsUrl: string, instUrl: string, onProgress?: (p: number) => void): Promise<void> {
    let done = 0
    const fetchDecode = async (url: string) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`音訊載入失敗（${res.status}）`)
      const data = await res.arrayBuffer()
      done += 0.5
      onProgress?.(done * 0.7)
      const buf = await this.ctx.decodeAudioData(data)
      return buf
    }
    const [vocals, inst] = await Promise.all([fetchDecode(vocalsUrl), fetchDecode(instUrl)])
    onProgress?.(1)
    this.buffers = { vocals, inst }
  }

  get duration(): number {
    return this.buffers ? Math.min(this.buffers.vocals.duration, this.buffers.inst.duration) : 0
  }

  get playing(): boolean {
    return this._playing
  }

  get currentTime(): number {
    if (!this._playing) return this.offsetAtStart
    return Math.min(this.duration, this.offsetAtStart + (this.ctx.currentTime - this.startedAt))
  }

  /** 人聲音量 0~1（0 = 純伴奏） */
  setVocalVolume(v: number) {
    this.vocalGain.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.03)
  }

  setMasterVolume(v: number) {
    this.master.gain.setTargetAtTime(Math.max(0, Math.min(1, v)), this.ctx.currentTime, 0.03)
  }

  async play() {
    if (!this.buffers || this._playing) return
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    if (this.offsetAtStart >= this.duration - 0.05) this.offsetAtStart = 0
    const when = this.ctx.currentTime + 0.05
    const offset = this.offsetAtStart
    const make = (buf: AudioBuffer, gain: GainNode) => {
      const src = this.ctx.createBufferSource()
      src.buffer = buf
      src.connect(gain)
      src.start(when, offset)
      return src
    }
    const v = make(this.buffers.vocals, this.vocalGain)
    const i = make(this.buffers.inst, this.instGain)
    i.onended = () => {
      // 只有自然播完才觸發（stop() 時已先移除 sources）
      if (this.sources.includes(i)) {
        this.sources = []
        this._playing = false
        this.offsetAtStart = this.duration
        this.onEnded?.()
      }
    }
    this.sources = [v, i]
    this.startedAt = when
    this._playing = true
  }

  pause() {
    if (!this._playing) return
    this.offsetAtStart = this.currentTime
    this.stopSources()
    this._playing = false
  }

  seek(t: number) {
    const target = Math.max(0, Math.min(this.duration, t))
    const wasPlaying = this._playing
    if (wasPlaying) this.stopSources()
    this._playing = false
    this.offsetAtStart = target
    if (wasPlaying) void this.play()
  }

  private stopSources() {
    const old = this.sources
    this.sources = []
    for (const s of old) {
      try {
        s.stop()
      } catch {
        /* 已停止 */
      }
      s.disconnect()
    }
  }

  dispose() {
    this.stopSources()
    void this.ctx.close()
  }
}
