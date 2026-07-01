import { transcribeBlob } from '../services/transcriptionService'
import { translateText } from '../services/translationService'
import { speak } from '../services/ttsService'

export async function processAudioChunk(blob: Blob, targetLang: string): Promise<void> {
  const transcription = await transcribeBlob(blob)
  if (!transcription) return

  const translation = await translateText(transcription, targetLang)
  if (!translation) return

  speak(translation, targetLang)
}
