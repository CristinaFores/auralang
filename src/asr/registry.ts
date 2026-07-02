import type { AsrMode, ModelTier } from './types'

// Single source of truth for available ASR models. All models multilingual —
// `.en` variants are banned (see docs/ASR_ARCHITECTURE.md).
//
// onnx-community/whisper-tiny ships BOTH a broken q8 decoder AND a broken int8
// decoder: loading either fails at session creation with
// "Missing required scale: model.decoder.embed_tokens.weight_merged_0_scale"
// (a MatMulNBits/DequantizeLinear error). Only fp32 loads reliably for this
// model, so the light tier is fp32-only. Do NOT add a quantized rung here
// without first verifying that specific export actually creates a session —
// a rung that always throws is worse than not offering it.
export const LIGHT_TIER: ModelTier = {
  id: 'light',
  modelId: 'onnx-community/whisper-tiny',
  approxDownloadMB: 150,
  ladder: [{ encoderDtype: 'fp32', decoderDtype: 'fp32', device: 'wasm' }],
}

// Balanced tier: whisper-base hears noticeably better than tiny (names, technical
// terms), at the cost of a larger download and higher latency. fp32-only for the
// same reason as the light tier — this model's quantized decoder exports are not
// verified to load, and shipping an unverified rung caused stuck loads before.
export const BALANCED_TIER: ModelTier = {
  id: 'balanced',
  modelId: 'onnx-community/whisper-base',
  approxDownloadMB: 290,
  ladder: [{ encoderDtype: 'fp32', decoderDtype: 'fp32', device: 'wasm' }],
}

export const DEFAULT_TIER = LIGHT_TIER

export function tierForMode(mode: AsrMode): ModelTier {
  return mode === 'balanced' ? BALANCED_TIER : LIGHT_TIER
}
