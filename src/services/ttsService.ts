const TTS_ENDPOINT = 'https://api.openai.com/v1/audio/speech'

export type TtsVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'

export async function speakText(
  text: string,
  apiKey: string,
  voice: TtsVoice = 'nova',
): Promise<void> {
  if (!text.trim()) return

  const response = await fetch(TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice,
      response_format: 'mp3',
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`TTS API error ${response.status}: ${detail}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)

  const audio = new Audio(url)
  await audio.play()

  audio.onended = () => URL.revokeObjectURL(url)
}
