import { transcribeAudio } from '../services/whisperService'
import { translateText } from '../services/translatorService'
import { speakText } from '../services/ttsService'
import type { ApiConfig } from '../types'

export async function processAudioChunk(blob: Blob, config: ApiConfig): Promise<void> {
  const { text } = await transcribeAudio(blob, config.openaiKey, config.whisperModel)
  if (!text.trim()) return

  const { translatedText } = await translateText(text, config.targetLanguage, config.openaiKey)
  if (!translatedText) return

  await speakText(translatedText, config.openaiKey)
}
