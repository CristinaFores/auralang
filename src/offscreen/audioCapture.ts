// Manages the AudioContext lifecycle and tab stream capture inside the offscreen document.
// The offscreen doc stays alive as long as Chrome keeps it — this is intentional (MV3 pattern).

export interface AudioCaptureHandlers {
  onChunk: (samples: Float32Array) => void
  onError: (message: string) => void
  onEnded: () => void
}

const CHUNK_INTERVAL_MS = 4000
const WHISPER_SAMPLE_RATE = 16000
const SAMPLES_PER_CHUNK = WHISPER_SAMPLE_RATE * (CHUNK_INTERVAL_MS / 1000)

const WORKLET_URL = chrome.runtime.getURL('capture-worklet.js')

let captureNode: AudioWorkletNode | null = null
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

  // Chrome ends this track when the captured tab closes or navigates away —
  // without this, captureNode stays alive and blocks any new capture attempt
  // with "Cannot capture a tab with an active stream".
  stream.getAudioTracks()[0]?.addEventListener('ended', () => {
    if (!captureNode) return // already stopped via STOP_CAPTURE
    stopAudioCapture()
    handlers.onEnded()
  })

  // Resample to 16 kHz mono — Whisper expects raw PCM Float32Array
  audioContext = new AudioContext({ sampleRate: WHISPER_SAMPLE_RATE })
  const source = audioContext.createMediaStreamSource(stream)

  const gain = audioContext.createGain()
  gain.gain.value = 0 // silence original tab audio
  source.connect(gain)
  gain.connect(audioContext.destination)

  await audioContext.audioWorklet.addModule(WORKLET_URL)

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

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
