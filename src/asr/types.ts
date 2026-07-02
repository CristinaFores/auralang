export type AsrTierId = 'light' | 'balanced' | 'accuracy'

// User-selectable model modes. 'accuracy'/'auto' are planned but not shipped yet.
export type AsrMode = 'light' | 'balanced'

// Subset of transformers.js dtypes we actually ship rungs for.
export type AsrDtype = 'int8' | 'fp16' | 'fp32' | 'q4'

export interface DtypeRung {
  encoderDtype: AsrDtype
  decoderDtype: AsrDtype
  device: 'wasm' | 'webgpu'
}

export interface ModelTier {
  id: AsrTierId
  modelId: string
  approxDownloadMB: number
  // Ordered probe list: best option first, safest last. Individual quantized
  // ONNX exports can be broken per repo/per file (seen with whisper-tiny q8),
  // so no rung is ever assumed to work — it's tried, and on load failure the
  // manager falls through to the next one.
  ladder: DtypeRung[]
}

export type ModelStatus =
  | { phase: 'idle' }
  | { phase: 'downloading'; progress: number } // 0..100
  | { phase: 'probing' }
  | { phase: 'ready'; tier: AsrTierId }
  | { phase: 'error'; message: string }
