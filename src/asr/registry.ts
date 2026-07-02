import type { ModelTier } from './types'

// Single source of truth for available ASR models. All models multilingual —
// `.en` variants are banned (see docs/ASR_ARCHITECTURE.md).
//
// int8 rungs use the *_int8.onnx exports, which are distinct files from the
// *_quantized.onnx (q8) exports that proved broken for whisper-tiny's decoder.
// fp32 is the last rung: it always loads, so the worst case equals the
// pre-ladder behavior.
export const LIGHT_TIER: ModelTier = {
  id: 'light',
  modelId: 'onnx-community/whisper-tiny',
  approxDownloadMB: 40,
  ladder: [
    { encoderDtype: 'int8', decoderDtype: 'int8', device: 'wasm' },
    { encoderDtype: 'fp32', decoderDtype: 'fp32', device: 'wasm' },
  ],
}

// Phase 2 adds BALANCED_TIER (whisper-base) and ACCURACY_TIER (whisper-small).
export const DEFAULT_TIER = LIGHT_TIER
