// Whisper stutters on short or near-silent fragments: it repeats a single
// token many times ("tu tu tu tu…"). Collapse any run of 3+ identical
// consecutive words down to one. Natural language almost never repeats the
// same word 3+ times in a row, so this removes the hallucinated stutter while
// leaving legitimate doubles ("no no", "muy muy") untouched.
export function collapseRepeats(text: string): string {
  const words = text.split(/\s+/).filter(Boolean)
  const normalize = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

  const out: string[] = []
  let i = 0
  while (i < words.length) {
    const key = normalize(words[i])
    let j = i + 1
    while (j < words.length && key !== '' && normalize(words[j]) === key) j++

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
