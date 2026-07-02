import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'
import type { DtypeRung, ModelStatus, ModelTier } from './types'
import { DEFAULT_TIER } from './registry'
// Baked in at build time. The offscreen document exposes only a subset of
// chrome.runtime (getURL and messaging work, getManifest does not), so the
// extension version cannot be read at runtime here.
import { version as EXTENSION_VERSION } from '../../manifest.json'

// Force local WASM — MV3 blocks external CDN scripts.
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('')
  // Single-thread: SharedArrayBuffer needs COEP, which breaks tabCapture in offscreen
  env.backends.onnx.wasm.numThreads = 1
}

const BAD_RUNGS_KEY = 'auralang_asr_bad_rungs'

type StatusListener = (status: ModelStatus) => void

let transcriber: AutomaticSpeechRecognitionPipeline | null = null
let loading: Promise<AutomaticSpeechRecognitionPipeline> | null = null
let listener: StatusListener = () => {}

export function onModelStatus(fn: StatusListener): void {
  listener = fn
}

function rungKey(tier: ModelTier, rung: DtypeRung): string {
  // Keyed by extension version so an update (which may bump transformers.js
  // and fix a previously broken export) retries rungs marked bad in the past.
  return `${tier.modelId}|${rung.device}|${rung.encoderDtype}|${rung.decoderDtype}|${EXTENSION_VERSION}`
}

// localStorage, not chrome.storage: this module runs in the offscreen
// document, where the only extension API available is chrome.runtime —
// chrome.storage is undefined there. localStorage on the extension origin
// persists across offscreen document recreations just the same.
function getBadRungs(): string[] {
  try {
    const raw = localStorage.getItem(BAD_RUNGS_KEY)
    const value: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(value) ? (value as string[]) : []
  } catch {
    return []
  }
}

function markBad(key: string): void {
  try {
    const bad = getBadRungs()
    if (!bad.includes(key)) {
      localStorage.setItem(BAD_RUNGS_KEY, JSON.stringify([...bad, key]))
    }
  } catch {
    // Persistence is an optimization; failing to remember a bad rung only
    // costs a retry on next startup.
  }
}

interface ProgressEvent {
  status: string
  progress?: number
}

function reportProgress(event: ProgressEvent): void {
  if (event.status === 'progress' && typeof event.progress === 'number') {
    listener({ phase: 'downloading', progress: Math.round(event.progress) })
  }
}

async function loadRung(
  tier: ModelTier,
  rung: DtypeRung,
): Promise<AutomaticSpeechRecognitionPipeline> {
  return (await pipeline('automatic-speech-recognition', tier.modelId, {
    dtype: {
      encoder_model: rung.encoderDtype,
      decoder_model_merged: rung.decoderDtype,
    },
    device: rung.device,
    progress_callback: reportProgress,
  })) as AutomaticSpeechRecognitionPipeline
}

async function loadTier(tier: ModelTier): Promise<AutomaticSpeechRecognitionPipeline> {
  const bad = getBadRungs()
  let lastError: unknown = null

  for (const rung of tier.ladder) {
    const key = rungKey(tier, rung)
    if (bad.includes(key)) continue
    try {
      listener({ phase: 'probing' })
      const loaded = await loadRung(tier, rung)
      listener({ phase: 'ready', tier: tier.id })
      return loaded
    } catch (err) {
      lastError = err
      markBad(key)
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'Model load failed'
  listener({ phase: 'error', message })
  throw new Error(message)
}

export async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber
  loading ??= loadTier(DEFAULT_TIER).then((loaded) => {
    transcriber = loaded
    return loaded
  })
  try {
    return await loading
  } finally {
    // A rejected load must not poison future attempts (e.g. transient network
    // failure on first download) — allow retry on the next call.
    if (!transcriber) loading = null
  }
}
