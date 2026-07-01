import { LOCALE_MAP } from '../constants/languages'

let speaking = false
let pendingText: string | null = null
let pendingLang = 'es'
let lastSpoken = ''

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices()
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const locale = LOCALE_MAP[lang] ?? lang
  const voices = window.speechSynthesis.getVoices()
  const matches = voices.filter(
    (v) => v.lang.startsWith(lang) || v.lang.startsWith(locale),
  )
  return (
    matches.find((v) => /google|natural|neural|premium/i.test(v.name))
    ?? matches.find((v) => !v.localService)
    ?? matches[0]
  )
}

function speakNow(text: string, lang: string): void {
  const utterance = new SpeechSynthesisUtterance(text)
  const locale = LOCALE_MAP[lang] ?? lang
  utterance.lang = locale
  utterance.rate = 0.95
  utterance.pitch = 1.0

  const voice = pickVoice(lang)
  if (voice) utterance.voice = voice

  utterance.onend = () => {
    speaking = false
    if (pendingText && pendingText !== lastSpoken) {
      const next = pendingText
      const nextLang = pendingLang
      pendingText = null
      speakNow(next, nextLang)
    }
  }

  utterance.onerror = () => {
    speaking = false
    pendingText = null
  }

  speaking = true
  lastSpoken = text
  window.speechSynthesis.speak(utterance)
}

export function speak(text: string, lang: string = 'es'): void {
  const trimmed = text.trim()
  if (!trimmed || trimmed === lastSpoken) return

  if (speaking) {
    pendingText = trimmed
    pendingLang = lang
    return
  }

  speakNow(trimmed, lang)
}

export function stopSpeech(): void {
  pendingText = null
  speaking = false
  lastSpoken = ''
  window.speechSynthesis.cancel()
}
