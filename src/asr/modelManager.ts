import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'
import type { AsrTierId, DtypeRung, ModelStatus, ModelTier } from './types'
import { DEFAULT_TIER } from './registry'
// Baked in at build time. The offscreen document exposes only a subset of
// chrome.runtime (getURL and messaging work, getManifest does not), so the
// extension version cannot be read at runtime here.
import { version as EXTENSION_VERSION } from '../../manifest.json'

// Force local WASM — MV3 blocks external CDN scripts. This module now runs
// inside a Web Worker, where chrome.* APIs don't exist — derive the extension
// base URL from the worker script's own location instead.
const EXTENSION_BASE_URL =
  typeof chrome !== 'undefined' && chrome.runtime?.getURL
    ? chrome.runtime.getURL('')
    : new URL('/', self.location.href).href

if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = EXTENSION_BASE_URL
  // Single-thread: SharedArrayBuffer needs COEP, which breaks tabCapture in offscreen
  env.backends.onnx.wasm.numThreads = 1
}

const BAD_RUNGS_KEY = 'auralang_asr_bad_rungs'

type StatusListener = (status: ModelStatus) => void

let transcriber: AutomaticSpeechRecognitionPipeline | null = null
let loading: Promise<AutomaticSpeechRecognitionPipeline> | null = null
let currentTierId: AsrTierId | null = null
// Bumped on every tier switch so a slower, superseded load can't overwrite the
// active transcriber when it finally resolves.
let loadToken = 0
let listener: StatusListener = () => {}

export function onModelStatus(fn: StatusListener): void {
  listener = fn
}

function rungKey(tier: ModelTier, rung: DtypeRung): string {
  // Keyed by extension version so an update (which may bump transformers.js
  // and fix a previously broken export) retries rungs marked bad in the past.
  return `${tier.modelId}|${rung.device}|${rung.encoderDtype}|${rung.decoderDtype}|${EXTENSION_VERSION}`
}

// localStorage, not chrome.storage: chrome.storage is unavailable both in the
// offscreen document and in workers. Inside the ASR worker localStorage does
// not exist either — the try/catch below turns persistence into a no-op
// there, which only costs retrying a known-bad rung on next startup. Today
// every tier ships a single fp32 rung, so nothing is lost in practice.
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
  file?: string
  progress?: number
  loaded?: number
  total?: number
}

// transformers.js fires progress per FILE, and a Whisper model pulls several
// files — so a single per-file percentage bounces 0→100 repeatedly, which
// reads as the bar "going crazy". Track bytes across all files and only ever
// move the bar forward, for one smooth ramp to 100%.
let downloadBytes = new Map<string, { loaded: number; total: number }>()
let lastProgress = 0

function resetProgress(): void {
  downloadBytes = new Map()
  lastProgress = 0
}

function reportProgress(event: ProgressEvent): void {
  if (
    event.file &&
    typeof event.loaded === 'number' &&
    typeof event.total === 'number' &&
    event.total > 0
  ) {
    downloadBytes.set(event.file, { loaded: event.loaded, total: event.total })
  }

  if (event.status !== 'progress') return

  let loaded = 0
  let total = 0
  for (const bytes of downloadBytes.values()) {
    loaded += bytes.loaded
    total += bytes.total
  }

  // Fall back to the raw per-file percentage if byte totals aren't reported.
  const pct =
    total > 0
      ? Math.round((loaded / total) * 100)
      : typeof event.progress === 'number'
        ? Math.round(event.progress)
        : lastProgress

  // Monotonic: swallow the backward jumps as each new file restarts at 0.
  if (pct <= lastProgress) return
  lastProgress = Math.min(100, pct)
  listener({ phase: 'downloading', progress: lastProgress })
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
  resetProgress()
  const bad = getBadRungs()

  // Prefer rungs not previously known to fail, but if every rung is flagged
  // bad, try them all anyway: a stale/incorrect bad entry must never make the
  // tier permanently unloadable.
  const preferred = tier.ladder.filter((rung) => !bad.includes(rungKey(tier, rung)))
  const rungs = preferred.length > 0 ? preferred : tier.ladder

  let lastError: unknown = null
  for (const rung of rungs) {
    try {
      listener({ phase: 'probing' })
      const loaded = await loadRung(tier, rung)
      listener({ phase: 'ready', tier: tier.id })
      return loaded
    } catch (err) {
      lastError = err
      markBad(rungKey(tier, rung))
    }
  }

  const message = lastError instanceof Error ? lastError.message : 'Model load failed'
  listener({ phase: 'error', message })
  throw new Error(message)
}

// Load (or switch to) a model tier. Idempotent: selecting the tier that's
// already loaded or in flight is a no-op. Switching disposes the previous model.
export function setModelTier(tier: ModelTier): void {
  if (currentTierId === tier.id && (transcriber || loading)) return

  currentTierId = tier.id
  const myToken = ++loadToken
  const previous = transcriber
  transcriber = null

  const p = loadTier(tier).then((loaded) => {
    // A newer switch happened while this was loading — discard this result.
    if (myToken !== loadToken) {
      void loaded.dispose?.()
      return loaded
    }
    transcriber = loaded
    return loaded
  })
  loading = p
  // Prevent unhandled rejection; the error was already surfaced via listener.
  p.catch(() => {})

  void previous?.dispose?.()
}

export async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber
  // No tier selected yet (e.g. capture started before the popup set one) —
  // fall back to the default so transcription still works.
  if (!loading) setModelTier(DEFAULT_TIER)
  try {
    return await loading!
  } finally {
    // A rejected load must not poison future attempts (e.g. transient network
    // failure on first download) — allow retry on the next call.
    if (!transcriber) {
      loading = null
      currentTierId = null
    }
  }
}
