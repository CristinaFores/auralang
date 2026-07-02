import { LOCALE_MAP } from '../constants/languages'

interface QueuedSpeech {
  text: string
  lang: string
  // Karaoke key: the original transcription this utterance corresponds to, so
  // the UI can highlight the line currently being read aloud.
  id: string
}

let speaking = false
let queue: QueuedSpeech[] = []
let lastSpoken = ''
let watchdogId: ReturnType<typeof setTimeout> | null = null
let speakingListener: (id: string | null) => void = () => {}

export function onSpeakingChange(fn: (id: string | null) => void): void {
  speakingListener = fn
}

const WATCHDOG_MS = 15000
// If translations arrive faster than they can be spoken, don't let the queue grow
// forever — that would mean falling further and further behind the live video.
// Drop the oldest backlog and catch back up instead.
const MAX_QUEUE_LENGTH = 3

function clearWatchdog(): void {
  if (watchdogId !== null) {
    clearTimeout(watchdogId)
    watchdogId = null
  }
}

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

function playNext(): void {
  const next = queue.shift()
  if (next) {
    speakNow(next.text, next.lang, next.id)
  } else {
    speakingListener(null)
  }
}

function speakNow(text: string, lang: string, id: string): void {
  speakingListener(id)
  const utterance = new SpeechSynthesisUtterance(text)
  const locale = LOCALE_MAP[lang] ?? lang
  utterance.lang = locale
  // Slightly above natural speed: while an utterance plays, new translations
  // queue behind it (and the oldest get dropped past the queue cap). Speaking
  // faster drains the queue sooner, losing fewer phrases and lagging less
  // behind the live video.
  utterance.rate = 1.1
  utterance.pitch = 1.0

  const voice = pickVoice(lang)
  if (voice) utterance.voice = voice

  utterance.onend = () => {
    clearWatchdog()
    speaking = false
    playNext()
  }

  utterance.onerror = () => {
    clearWatchdog()
    speaking = false
    playNext()
  }

  speaking = true
  lastSpoken = text
  clearWatchdog()
  // speechSynthesis in offscreen documents can silently stop firing onend/onerror,
  // leaving `speaking` stuck true and blocking the rest of the queue forever.
  watchdogId = setTimeout(() => {
    watchdogId = null
    speaking = false
    playNext()
  }, WATCHDOG_MS)
  window.speechSynthesis.speak(utterance)
}

export function speak(text: string, lang: string = 'es', id: string = ''): void {
  const trimmed = text.trim()
  if (!trimmed || trimmed === lastSpoken) return

  if (speaking) {
    queue.push({ text: trimmed, lang, id })
    // Falling behind — drop the oldest backlog so playback catches back up
    // with the live video instead of drifting further out of sync.
    while (queue.length > MAX_QUEUE_LENGTH) queue.shift()
    return
  }

  speakNow(trimmed, lang, id)
}

export function stopSpeech(): void {
  clearWatchdog()
  queue = []
  speaking = false
  lastSpoken = ''
  speakingListener(null)
  window.speechSynthesis.cancel()
}
