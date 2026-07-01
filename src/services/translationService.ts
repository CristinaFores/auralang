// Google Translate free (unofficial) endpoint — no API key required
// Rate limit: generous for personal use; not for high-volume production
const TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!text.trim()) return ''

  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLang,
    dt: 't',
    q: text,
  })

  const response = await fetch(`${TRANSLATE_URL}?${params.toString()}`)
  if (!response.ok) throw new Error(`Translation failed: ${response.status}`)

  const data = (await response.json()) as Array<Array<Array<string>>>
  return data[0]?.map((chunk) => chunk[0]).join('') ?? ''
}
