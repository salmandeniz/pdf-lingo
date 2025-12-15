type TtsCallback = () => void

interface TtsOptions {
  rate?: number
  voice?: SpeechSynthesisVoice | null
  onStart?: TtsCallback
  onEnd?: TtsCallback
  onPause?: TtsCallback
  onResume?: TtsCallback
}

class TtsService {
  private utterance: SpeechSynthesisUtterance | null = null
  private voices: SpeechSynthesisVoice[] = []

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.loadVoices()
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices()
    }
  }

  private loadVoices() {
    this.voices = window.speechSynthesis.getVoices()
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices
  }

  getVoicesByLanguage(lang: string): SpeechSynthesisVoice[] {
    return this.voices.filter(v => v.lang.startsWith(lang))
  }

  speak(text: string, options: TtsOptions = {}): void {
    this.stop()

    this.utterance = new SpeechSynthesisUtterance(text)

    if (options.rate) {
      this.utterance.rate = options.rate
    }

    if (options.voice) {
      this.utterance.voice = options.voice
    }

    this.utterance.onstart = () => {
      options.onStart?.()
    }

    this.utterance.onend = () => {
      options.onEnd?.()
    }

    this.utterance.onpause = () => {
      options.onPause?.()
    }

    this.utterance.onresume = () => {
      options.onResume?.()
    }

    window.speechSynthesis.speak(this.utterance)
  }

  pause(): void {
    window.speechSynthesis.pause()
  }

  resume(): void {
    window.speechSynthesis.resume()
  }

  stop(): void {
    window.speechSynthesis.cancel()
    this.utterance = null
  }

  get isPaused(): boolean {
    return window.speechSynthesis.paused
  }

  get isSpeaking(): boolean {
    return window.speechSynthesis.speaking
  }
}

export const ttsService = new TtsService()
