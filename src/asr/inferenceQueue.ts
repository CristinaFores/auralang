// Chunks arrive from the audio worklet faster than a slow machine can
// transcribe them. Processing them unawaited (the previous behavior) meant
// concurrent inferences piling up: memory spikes, out-of-order transcripts,
// and compounding latency. Single-flight with a small drop-oldest buffer
// keeps playback close to live instead of drifting ever further behind.
const MAX_PENDING = 2

let pending: Float32Array[] = []
let running = false

export function enqueueChunk(
  samples: Float32Array,
  process: (samples: Float32Array) => Promise<void>,
): void {
  pending.push(samples)
  while (pending.length > MAX_PENDING) pending.shift()

  if (running) return
  running = true
  void (async () => {
    try {
      let next: Float32Array | undefined
      while ((next = pending.shift())) {
        // `process` is expected to handle its own errors; a defensive catch
        // here keeps one bad chunk from stalling the whole queue regardless.
        await process(next).catch(() => {})
      }
    } finally {
      running = false
    }
  })()
}

export function clearQueue(): void {
  pending = []
}
