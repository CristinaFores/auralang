import { getTranscriber } from '../asr/modelManager'

export async function transcribeAudio(
  samples: Float32Array,
  sourceLanguage: string,
): Promise<string> {
  const asr = await getTranscriber()

  // 'auto' → let Whisper detect the language itself (omit the option). Any
  // explicit ISO code is still honored for users who want to pin the source.
  const result = await asr(samples, {
    language: sourceLanguage === 'auto' ? undefined : sourceLanguage,
    task: 'transcribe',
  })

  const text = Array.isArray(result) ? result[0]?.text : result.text
  return (text ?? '').trim()
}
