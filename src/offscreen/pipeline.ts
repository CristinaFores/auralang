import { transcribeBlob } from '../services/transcriptionService'
import { translateText } from '../services/translationService'
import { speak } from '../services/ttsService'

export async function processAudioChunk(blob: Blob, targetLang: string): Promise<void> {
  console.log('[AuraLang] Transcribing chunk...')
  const transcription = await transcribeBlob(blob)
  console.log('[AuraLang] Transcription:', transcription)
  if (!transcription) return

  console.log('[AuraLang] Translating to', targetLang, '...')
  const translation = await translateText(transcription, targetLang)
  console.log('[AuraLang] Translation:', translation)
  if (!translation) return

  console.log('[AuraLang] Speaking...')
  speak(translation, targetLang)
}
