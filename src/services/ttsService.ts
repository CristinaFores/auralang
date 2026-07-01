// Web Speech API — native to Chrome, no API key, no cost
export function speak(text: string, lang: string = 'es'): void {
  if (!text.trim()) return

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 1.0
  utterance.pitch = 1.0

  // Cancel any ongoing speech before starting new one
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
