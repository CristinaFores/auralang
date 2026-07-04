// ASR runs inside a dedicated Web Worker. Whisper inference is single-thread
// WASM and Chrome hosts every extension page (side panel + offscreen) on ONE
// shared main thread — running inference there froze the panel UI for seconds
// per chunk (lost clicks, unresponsive menu). A worker gets its own thread.
import { setModelTier, onModelStatus } from '../asr/modelManager'
import { tierForMode } from '../asr/registry'
import { transcribeAudio } from '../services/transcriptionService'
import type { AsrMode, ModelStatus } from '../asr/types'

export interface AsrWorkerRequest {
  type: 'SET_TIER' | 'TRANSCRIBE'
  mode?: AsrMode
  id?: number
  samples?: Float32Array
  sourceLanguage?: string
}

export interface AsrWorkerResponse {
  type: 'MODEL_STATUS' | 'RESULT'
  status?: ModelStatus
  id?: number
  text?: string
  error?: string
}

onModelStatus((status) => {
  self.postMessage({ type: 'MODEL_STATUS', status } satisfies AsrWorkerResponse)
})

self.onmessage = async (event: MessageEvent<AsrWorkerRequest>) => {
  const msg = event.data

  if (msg.type === 'SET_TIER' && msg.mode) {
    setModelTier(tierForMode(msg.mode))
    return
  }

  if (msg.type === 'TRANSCRIBE' && msg.samples && msg.id !== undefined) {
    try {
      const text = await transcribeAudio(msg.samples, msg.sourceLanguage ?? 'en')
      self.postMessage({ type: 'RESULT', id: msg.id, text } satisfies AsrWorkerResponse)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Transcription failed'
      self.postMessage({ type: 'RESULT', id: msg.id, error } satisfies AsrWorkerResponse)
    }
  }
}
