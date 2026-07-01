// Manages the AudioContext lifecycle and tab stream capture inside the offscreen document.
// The offscreen doc stays alive as long as Chrome keeps it — this is intentional (MV3 pattern).

export interface AudioCaptureHandlers {
  onChunk: (blob: Blob) => void
  onError: (message: string) => void
}

const CHUNK_INTERVAL_MS = 4000
const MIME_TYPE = 'audio/webm;codecs=opus'

let mediaRecorder: MediaRecorder | null = null
let audioContext: AudioContext | null = null

export async function startAudioCapture(
  streamId: string,
  handlers: AudioCaptureHandlers,
): Promise<void> {
  if (mediaRecorder) return // already running

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

  // Mute the original tab output so user only hears the translation
  audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  source.connect(audioContext.destination) // keep graph alive; volume handled via GainNode below

  const gain = audioContext.createGain()
  gain.gain.value = 0 // silence original audio
  source.connect(gain)
  gain.connect(audioContext.destination)

  if (!MediaRecorder.isTypeSupported(MIME_TYPE)) {
    handlers.onError(`MIME type not supported: ${MIME_TYPE}`)
    return
  }

  mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_TYPE })

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      handlers.onChunk(event.data)
    }
  }

  mediaRecorder.onerror = () => {
    handlers.onError('MediaRecorder encountered an error')
  }

  mediaRecorder.start(CHUNK_INTERVAL_MS)
}

export function stopAudioCapture(): void {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  mediaRecorder = null

  if (audioContext) {
    void audioContext.close()
    audioContext = null
  }
}
