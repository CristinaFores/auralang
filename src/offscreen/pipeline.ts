import { transcribeAudio } from '../services/transcriptionService'
import { translateText } from '../services/translationService'
import { speak, stopSpeech } from '../services/ttsService'
import { isSilent } from '../utils/audioLevel'

let lastTranscription = ''

export function resetPipelineState(): void {
  lastTranscription = ''
  stopSpeech()
}

export async function processAudioChunk(
  samples: Float32Array,
  targetLang: string,
  sourceLang: string,
): Promise<void> {
  if (isSilent(samples)) return

  console.log('[AuraLang] Transcribing chunk...')
  const transcription = await transcribeAudio(samples, sourceLang)
  console.log('[AuraLang] Transcription:', transcription)
  if (!transcription || transcription === lastTranscription) return

  lastTranscription = transcription

  console.log('[AuraLang] Translating to', targetLang, '...')
  const translation = await translateText(transcription, targetLang)
  console.log('[AuraLang] Translation:', translation)
  if (!translation) return

  console.log('[AuraLang] Speaking...')
  speak(translation, targetLang)
}
