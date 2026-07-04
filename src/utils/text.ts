const normalizeWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

// Whisper's documented silence/noise hallucinations: on audio with no real
// speech (background music, game ambience, outros) it emits one of a small,
// well-known set of filler phrases. Only ever matched against the ENTIRE
// chunk — "you" inside a real sentence is never touched.
const SILENCE_HALLUCINATIONS = new Set([
  'you',
  'thank you',
  'thankyou',
  'thanks for watching',
  'thank you for watching',
  'please subscribe',
  'bye',
])

export function isSilenceHallucination(text: string): boolean {
  const normalized = text.split(/\s+/).filter(Boolean).map(normalizeWord).join(' ')
  return SILENCE_HALLUCINATIONS.has(normalized)
}

// Chunks are cut mid-stream, so Whisper often re-emits the tail of the
// previous chunk at the start of the next one ("…creo que sí" | "sí, y
// además…"). Drop the longest run of leading words in `text` that matches the
// trailing words of `previous` (checked longest-first, up to 4 words).
export function stripSeamRepeat(previous: string, text: string): string {
  if (!previous) return text

  const prevWords = previous.split(/\s+/).filter(Boolean).map(normalizeWord)
  const words = text.split(/\s+/).filter(Boolean)
  const maxOverlap = Math.min(4, prevWords.length, words.length)

  for (let k = maxOverlap; k >= 1; k--) {
    const tail = prevWords.slice(-k)
    const head = words.slice(0, k).map(normalizeWord)
    if (tail.every((w, idx) => w !== '' && w === head[idx])) {
      return words.slice(k).join(' ')
    }
  }
  return text
}

// Whisper stutters on short or near-silent fragments: it repeats a single
// token many times ("tu tu tu tu…"). Collapse any run of 3+ identical
// consecutive words down to one. Natural language almost never repeats the
// same word 3+ times in a row, so this removes the hallucinated stutter while
// leaving legitimate doubles ("no no", "muy muy") untouched.
export function collapseRepeats(text: string): string {
  const words = text.split(/\s+/).filter(Boolean)

  const out: string[] = []
  let i = 0
  while (i < words.length) {
    const key = normalizeWord(words[i])
    let j = i + 1
    while (j < words.length && key !== '' && normalizeWord(words[j]) === key) j++

    const runLength = j - i
    if (runLength >= 3) {
      out.push(words[i]) // stutter run → keep a single occurrence
    } else {
      for (let k = i; k < j; k++) out.push(words[k])
    }
    i = j
  }

  return out.join(' ')
}
