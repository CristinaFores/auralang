const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

export interface TranslationResult {
  translatedText: string
}

export async function translateText(
  text: string,
  targetLanguage: string,
  apiKey: string,
): Promise<TranslationResult> {
  if (!text.trim()) return { translatedText: '' }

  const response = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional real-time interpreter. Translate the following spoken text into ${targetLanguage}. Output ONLY the translation — no explanations, no notes.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Translation API error ${response.status}: ${detail}`)
  }

  interface ChatResponse {
    choices: Array<{ message: { content: string } }>
  }

  const data = (await response.json()) as ChatResponse
  const translatedText = data.choices[0]?.message?.content?.trim() ?? ''
  return { translatedText }
}
