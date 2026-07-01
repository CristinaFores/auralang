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

  const transcription = await transcribeAudio(samples, sourceLang)
  if (!transcription || transcription === lastTranscription) return

  lastTranscription = transcription

  const translation = await translateText(transcription, targetLang)
  if (!translation) return

  speak(translation, targetLang)
}
