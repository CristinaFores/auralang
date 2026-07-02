// Manages the AudioContext lifecycle and tab stream capture inside the offscreen document.
// The offscreen doc stays alive as long as Chrome keeps it — this is intentional (MV3 pattern).

import { isSilent } from '../utils/audioLevel'

export interface AudioCaptureHandlers {
  onChunk: (samples: Float32Array) => void
  onError: (message: string) => void
  onEnded: () => void
}

const WHISPER_SAMPLE_RATE = 16000

// Cutting on a fixed clock (old: every 4s) slices sentences mid-word and feeds
// Whisper near-silent fragments that make it hallucinate repeated words. Instead,
// buffer continuously and cut on natural speech pauses, so each chunk is a whole
// phrase. MAX is a safety net for continuous speech with no pauses.
//
// 600ms was too short: normal mid-sentence breathing/comma pauses are often
// 300-600ms, so it was cutting sentences in half, not just between them.
// 900ms sits past that range while still catching real between-sentence pauses.
//
// MAX at 8s made latency blow up on produced content (talks, YouTube) where
// narration can run for long stretches with no 900ms pause: 8s of buffering
// before Whisper even starts, plus inference time that grows with chunk
// length. 5s bounds that worst case at the cost of occasional mid-sentence
// cuts on non-stop speech.
const PAUSE_MS = 900
const MIN_CHUNK_MS = 600
const MAX_CHUNK_MS = 5000

const PAUSE_SAMPLES = WHISPER_SAMPLE_RATE * (PAUSE_MS / 1000)
const MIN_CHUNK_SAMPLES = WHISPER_SAMPLE_RATE * (MIN_CHUNK_MS / 1000)
const MAX_CHUNK_SAMPLES = WHISPER_SAMPLE_RATE * (MAX_CHUNK_MS / 1000)

const WORKLET_URL = chrome.runtime.getURL('capture-worklet.js')

let captureNode: AudioWorkletNode | null = null
let audioContext: AudioContext | null = null
let mediaStream: MediaStream | null = null
let pendingSamples: Float32Array[] = []
let pendingLength = 0
let silenceRunSamples = 0
let hasSpeechInBuffer = false

function flush(handlers: AudioCaptureHandlers): void {
  const chunk = new Float32Array(pendingLength)
  let offset = 0
  for (const part of pendingSamples) {
    chunk.set(part, offset)
    offset += part.length
  }
  pendingSamples = []
  pendingLength = 0
  silenceRunSamples = 0
  const shouldEmit = hasSpeechInBuffer
  hasSpeechInBuffer = false

  // Don't bother sending an all-silence buffer to Whisper — it has nothing to
  // transcribe and near-empty audio is exactly what triggers hallucinated output.
  if (shouldEmit) handlers.onChunk(chunk)
}

function pushSamples(samples: Float32Array, handlers: AudioCaptureHandlers): void {
  pendingSamples.push(samples)
  pendingLength += samples.length

  if (isSilent(samples)) {
    silenceRunSamples += samples.length
  } else {
    silenceRunSamples = 0
    hasSpeechInBuffer = true
  }

  const hitPause = silenceRunSamples >= PAUSE_SAMPLES && pendingLength >= MIN_CHUNK_SAMPLES
  const hitMax = pendingLength >= MAX_CHUNK_SAMPLES

  if (hitPause || hitMax) flush(handlers)
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
  mediaStream = stream

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

  // Release the capture stream. While a tab-capture track is live, Chrome
  // keeps the tab captured — and a captured tab stays muted. Disconnecting
  // the audio graph alone left the track running, so the original tab audio
  // never came back after Stop (and restarting hit "Cannot capture a tab
  // with an active stream").
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) track.stop()
    mediaStream = null
  }

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
