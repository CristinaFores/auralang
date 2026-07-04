import { getTranscriber } from '../asr/modelManager'
import { collapseRepeats } from '../utils/text'

export async function transcribeAudio(
  samples: Float32Array,
  sourceLanguage: string,
): Promise<string> {
  const asr = await getTranscriber()

  const result = await asr(samples, {
    language: sourceLanguage,
    task: 'transcribe',
  })

  const text = Array.isArray(result) ? result[0]?.text : result.text
  // Strip Whisper's stutter hallucinations before translating/speaking.
  return collapseRepeats((text ?? '').trim())
}
