import { transcribe } from './asrClient'
import { translateText } from '../services/translationService'
import { speak, stopSpeech } from '../services/ttsService'
import { isSilent } from '../utils/audioLevel'
import { isSilenceHallucination, stripSeamRepeat } from '../utils/text'
import type { TranscriptUpdatePayload } from '../types'

let lastTranscription = ''
// Bumped on every stop/reset so in-flight processAudioChunk calls started
// before the stop can detect they're stale and bail out instead of speaking
// translated audio for a chunk the user already stopped.
let sessionId = 0

export function resetPipelineState(): void {
  lastTranscription = ''
  sessionId += 1
  stopSpeech()
}

export async function processAudioChunk(
  samples: Float32Array,
  targetLang: string,
  sourceLang: string,
  onTranscript: (update: TranscriptUpdatePayload) => void,
): Promise<void> {
  if (isSilent(samples)) return

  const mySession = sessionId

  const raw = await transcribe(samples, sourceLang)
  if (sessionId !== mySession) return

  // A chunk that is exactly one of Whisper's known silence/noise fillers
  // ("you", "Thank you", …) is a hallucination, not speech. Drop it WITHOUT
  // touching lastTranscription — otherwise it slips between two identical
  // real lines and breaks the consecutive-duplicate check below.
  if (isSilenceHallucination(raw)) return

  // Chunks are cut mid-stream, so Whisper often re-emits the tail of the
  // previous chunk at the start of this one — drop that seam overlap.
  const transcription = stripSeamRepeat(lastTranscription, raw)
  if (!transcription || transcription === lastTranscription) return

  lastTranscription = transcription
  onTranscript({ original: transcription, translated: null })

  const translation = await translateText(transcription, targetLang, sourceLang)
  if (sessionId !== mySession) return
  if (!translation) return

  onTranscript({ original: transcription, translated: translation })
  // Pass the original transcription as the karaoke id so the UI can highlight
  // this line while it's being read aloud.
  speak(translation, targetLang, transcription)
}
