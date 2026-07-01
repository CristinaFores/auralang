// Manages the AudioContext lifecycle and tab stream capture inside the offscreen document.
// The offscreen doc stays alive as long as Chrome keeps it — this is intentional (MV3 pattern).

export interface AudioCaptureHandlers {
  onChunk: (samples: Float32Array) => void
  onError: (message: string) => void
}

const CHUNK_INTERVAL_MS = 4000
const WHISPER_SAMPLE_RATE = 16000
const SAMPLES_PER_CHUNK = WHISPER_SAMPLE_RATE * (CHUNK_INTERVAL_MS / 1000)

let scriptProcessor: ScriptProcessorNode | null = null
let audioContext: AudioContext | null = null
let pendingSamples: Float32Array[] = []
let pendingLength = 0

export async function startAudioCapture(
  streamId: string,
  handlers: AudioCaptureHandlers,
): Promise<void> {
  if (scriptProcessor) return // already running

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

  scriptProcessor = audioContext.createScriptProcessor(4096, 2, 1)
  scriptProcessor.onaudioprocess = (event) => {
    const left = event.inputBuffer.getChannelData(0)
    const right =
      event.inputBuffer.numberOfChannels > 1
        ? event.inputBuffer.getChannelData(1)
        : left
    const mono = new Float32Array(left.length)
    for (let i = 0; i < left.length; i++) {
      mono[i] = (left[i] + right[i]) / 2
    }

    pendingSamples.push(mono)
    pendingLength += mono.length

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

  source.connect(scriptProcessor)
  scriptProcessor.connect(audioContext.destination)
}

export function stopAudioCapture(): void {
  if (scriptProcessor) {
    scriptProcessor.disconnect()
    scriptProcessor.onaudioprocess = null
  }
  scriptProcessor = null
  pendingSamples = []
  pendingLength = 0

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
