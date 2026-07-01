const WHISPER_ENDPOINT = 'https://api.openai.com/v1/audio/transcriptions'

export interface TranscriptionResult {
  text: string
}

export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string,
  model: string = 'whisper-1',
): Promise<TranscriptionResult> {
  const form = new FormData()
  form.append('file', audioBlob, 'chunk.webm')
  form.append('model', model)
  form.append('response_format', 'json')

  const response = await fetch(WHISPER_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Whisper API error ${response.status}: ${detail}`)
  }

  return response.json() as Promise<TranscriptionResult>
}
