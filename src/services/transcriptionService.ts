import { getTranscriber } from '../asr/modelManager'

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
  return (text ?? '').trim()
}
