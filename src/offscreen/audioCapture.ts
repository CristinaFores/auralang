// Manages the AudioContext lifecycle and tab stream capture inside the offscreen document.
// The offscreen doc stays alive as long as Chrome keeps it — this is intentional (MV3 pattern).

export interface AudioCaptureHandlers {
  onChunk: (samples: Float32Array) => void
  onError: (message: string) => void
}

const CHUNK_INTERVAL_MS = 4000
const WHISPER_SAMPLE_RATE = 16000
const SAMPLES_PER_CHUNK = WHISPER_SAMPLE_RATE * (CHUNK_INTERVAL_MS / 1000)

const CAPTURE_WORKLET = `
class CaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]
    if (!input?.[0]) return true
    const left = input[0]
    const right = input[1] ?? left
    const mono = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) mono[i] = (left[i] + right[i]) / 2
    this.port.postMessage(mono)
    return true
  }
}
registerProcessor('capture-processor', CaptureProcessor)
`

let captureNode: AudioWorkletNode | null = null
let workletUrl: string | null = null
let audioContext: AudioContext | null = null
let pendingSamples: Float32Array[] = []
let pendingLength = 0

function pushSamples(samples: Float32Array, handlers: AudioCaptureHandlers): void {
  pendingSamples.push(samples)
  pendingLength += samples.length

  while (pendingLength >= SAMPLES_PER_CHUNK) {
    const chunk = new Float32Array(SAMPLES_PER_CHUNK)
    let offset = 0
    while (offset < SAMPLES_PER_CHUNK) {
      const head = pendingSamples[0]
      const take = Math.min(head.length, SAMPLES_PER_CHUNK - offset)
      chunk.set(head.subarray(0, take), offset)
      offset += take
      if (take === head.length) pendingSamples.shift()
      else pendingSamples[0] = head.subarray(take)
    }
    pendingLength -= SAMPLES_PER_CHUNK
    handlers.onChunk(chunk)
  }
}

export async function startAudioCapture(
  streamId: string,
  handlers: AudioCaptureHandlers,
): Promise<void> {
  if (captureNode) return // already running

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // @ts-expect-error — Chrome-specific constraint for tab capture
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  })

  // Resample to 16 kHz mono — Whisper expects raw PCM Float32Array
  audioContext = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE })
  const source = audioContext.createMediaStreamSource(stream)

  const gain = audioContext.createGain()
  gain.gain.value = 0 // silence original tab audio
  source.connect(gain)
  gain.connect(audioContext.destination)

  workletUrl = URL.createObjectURL(
    new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }),
  )
  await audioContext.audioWorklet.addModule(workletUrl)

  captureNode = new AudioWorkletNode(audioContext, 'capture-processor')
  captureNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
    pushSamples(event.data, handlers)
  }

  source.connect(captureNode)
  captureNode.connect(audioContext.destination)
}

export function stopAudioCapture(): void {
  if (captureNode) {
    captureNode.port.onmessage = null
    captureNode.disconnect()
  }
  captureNode = null
  pendingSamples = []
  pendingLength = 0

  if (workletUrl) {
    URL.revokeObjectURL(workletUrl)
    workletUrl = null
  }

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
