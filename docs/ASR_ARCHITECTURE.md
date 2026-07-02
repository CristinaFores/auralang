# ASR Architecture — Local, Multilingual, Tiered

Status: **proposal** · Owner: Cristina · Scope: replace the single hardcoded `whisper-tiny fp32` with a tiered, device-aware, fallback-capable ASR subsystem. No backend, no external ASR APIs, models downloaded on demand and cached.

---

## 1. Why

The current setup (`onnx-community/whisper-tiny`, `fp32`, single-thread WASM, hardcoded) has three problems observed in real use:

1. **Accuracy** — tiny mishears technical terms and proper nouns ("Claude" → "Cloud", "sub-agent" → "sub-aging"). Translation then faithfully translates the error.
2. **Latency** — fp32 is the slowest possible variant of the smallest model; there is no adaptive behavior for capable machines.
3. **Nonsense phrases** — mostly downstream of (1), plus dropped TTS queue items.

A bigger model helps (1) but hurts (2) on weak machines. The only honest answer is **tiers + device detection + graceful fallback** — never a single default that's wrong for half the users.

## 2. Model matrix (verified against onnx-community on Hugging Face)

| Tier | Model | dtype (WASM) | Download | Expected RTF* (WASM 1-thread) | Notes |
|---|---|---|---|---|---|
| **Light** | `whisper-tiny` | int8 | ~40 MB | ~0.3–0.6 | Current accuracy level, much faster than fp32 |
| **Balanced** | `whisper-base` | int8 | ~77 MB (enc 23.2 + dec 53.7) | ~0.5–1.0 | Meaningfully better accuracy; default recommendation on modern machines |
| **Accuracy** | `whisper-small` | int8 | ~249 MB (enc 92.3 + dec 157) | often > 1.0 on WASM | Realistic only with WebGPU; gated behind an explicit warning |
| Experimental | `whisper-large-v3-turbo` | — | > 800 MB | not viable on WASM | Not a mode. Revisit only if WebGPU path proves stable |

\* RTF = processing time / audio duration. RTF > 1.0 means falling permanently behind live audio — unusable for this product. Numbers are estimates to be replaced by the benchmark (§6); the architecture never trusts them.

**All models are multilingual. `.en` variants are banned.**

### Known landmine (already hit in production)

`whisper-tiny` `dtype: 'q8'` (`*_quantized.onnx`) fails to load: `Missing required scale: model.decoder.embed_tokens...`. Individual quantized exports **can be broken per repo, per file**. Consequence: quantization choices are never hardcoded assumptions — they are a **probe ladder** (§7) that tries each rung and falls through on load failure.

**Update (confirmed in production):** for `onnx-community/whisper-tiny`, the `int8` decoder export is broken in the *same* way as `q8` — same `weight_merged_0_scale` / `MatMulNBits` session-creation error. So the light tier now ships **fp32-only** (~150 MB): the only export of this model verified to create a session. A quantized rung is only added back after verifying that specific export loads. Before trusting the ladder's fall-through for other models, reproduce a broken-rung → good-rung fall-through end to end — it has not yet been observed working in the browser.

## 3. Modes (user-facing)

| Mode | Behavior |
|---|---|
| **Auto (default)** | Detect device → pick Light or Balanced → benchmark → downgrade if slow. Never auto-picks Accuracy. |
| **Light** | tiny/int8. Lowest latency, lowest accuracy. For modest machines. |
| **Balanced** | base/int8. Better accuracy, still live-capable on most modern machines. |
| **Accuracy** | small/int8 (WebGPU: fp16). Shown with an explicit cost warning before download. |

Mode is stored in `UserConfig.asrMode: 'auto' | 'light' | 'balanced' | 'accuracy'` and changed from the settings panel. Changing mode while capturing stops capture first (model swap mid-stream is not supported).

## 4. Module layout

```
src/asr/
  types.ts            # shared types below — no logic
  registry.ts         # MODEL_TIERS, dtype ladders, thresholds. Pure data, one screen long.
  deviceProfile.ts    # WebGPU / memory / cores detection. Pure functions.
  benchmark.ts        # RTF measurement on a bundled fixture clip.
  modelManager.ts     # THE state machine: select → download → probe → benchmark → ready/fallback.
  inferenceQueue.ts   # single-flight chunk queue (see §8 — fixes an existing defect).
public/fixtures/
  benchmark-speech.wav  # ~4s public-domain speech clip (~130 KB) for the benchmark
```

`src/services/transcriptionService.ts` becomes a thin facade over `modelManager` — its public API (`transcribeAudio`, readiness signal) does not change, so `pipeline.ts` and the message flow stay untouched in phase 1.

## 5. Types

```ts
// src/asr/types.ts
export type AsrMode = 'auto' | 'light' | 'balanced' | 'accuracy'
export type AsrTierId = 'light' | 'balanced' | 'accuracy'

export interface DtypeRung {
  encoder_model: string          // 'int8' | 'fp16' | 'fp32' | 'q4' ...
  decoder_model_merged: string
  device: 'wasm' | 'webgpu'
}

export interface ModelTier {
  id: AsrTierId
  modelId: string                // e.g. 'onnx-community/whisper-base'
  approxDownloadMB: number       // for the pre-download warning UI
  ladder: DtypeRung[]            // ordered: best first, safest last
}

export interface DeviceProfile {
  webgpu: boolean
  deviceMemoryGB: number | null  // navigator.deviceMemory — Chrome only, capped at 8
  cores: number                  // navigator.hardwareConcurrency
}

export interface BenchmarkResult {
  modelId: string
  rungKey: string                // serialized DtypeRung
  rtf: number
  at: number                     // Date.now()
  extensionVersion: string
}

export type ModelStatus =
  | { phase: 'idle' }
  | { phase: 'downloading'; file: string; progress: number }  // 0..1
  | { phase: 'probing' }
  | { phase: 'benchmarking' }
  | { phase: 'ready'; tier: AsrTierId; slow: boolean }        // slow → show warning
  | { phase: 'fallback'; from: AsrTierId; to: AsrTierId }
  | { phase: 'unsupported' }
```

New extension message: `MODEL_STATUS` (offscreen → panel) carrying `ModelStatus`, replacing today's boolean `MODEL_READY` (kept as an alias during migration). The panel renders download progress, the slow-mode warning, and fallback notices from this single stream.

## 6. Device detection + benchmark

```ts
// deviceProfile.ts — runs in the offscreen document (full DOM context, WebGPU available there)
export async function detectDevice(): Promise<DeviceProfile> {
  let webgpu = false
  try {
    webgpu = !!(navigator.gpu && (await navigator.gpu.requestAdapter()))
  } catch { /* no adapter → false */ }
  return {
    webgpu,
    deviceMemoryGB: (navigator as { deviceMemory?: number }).deviceMemory ?? null,
    cores: navigator.hardwareConcurrency ?? 4,
  }
}
```

Static gate for **Auto**: `webgpu || (cores >= 8 && (deviceMemoryGB ?? 0) >= 8)` → candidate **Balanced**, else **Light**. The static gate only picks the *candidate*; the benchmark has the final word.

```ts
// benchmark.ts — after the model loads, before declaring it ready
export async function measureRtf(transcribe: (pcm: Float32Array) => Promise<string>): Promise<number> {
  const pcm = await loadFixture()            // bundled ~4s speech clip, decoded to 16kHz mono
  const t0 = performance.now()
  await transcribe(pcm)
  return (performance.now() - t0) / 4000     // wall time / audio duration
}
```

- A **real speech clip** (not noise/silence) so decode length is realistic.
- Thresholds in `registry.ts`: `rtf <= 0.6` → ready; `0.6 < rtf <= 1.0` → ready + `slow: true` (UI warning); `rtf > 1.0` → **downgrade** one tier (Auto) or warn hard (manual mode).
- Results cached in `chrome.storage.local` keyed by `{modelId, rungKey, extensionVersion}` — re-benchmarked only on version change or explicit re-test from settings.

## 7. Download, cache, probe ladder

**Download & cache**: transformers.js already downloads from the HF Hub on demand and caches in **browser Cache Storage** (`env.useBrowserCache`, on by default). No model bytes in the bundle — install stays light. What we add:

- `progress_callback` on `pipeline(...)` → `MODEL_STATUS { phase: 'downloading', file, progress }` → progress bar in the panel.
- A "Delete downloaded models" button in settings that clears the transformers cache (free up to ~250 MB).
- Pre-download confirmation for Balanced/Accuracy showing `approxDownloadMB` — never silently pull 250 MB.

**Probe ladder** (the q8 lesson institutionalized):

```ts
// registry.ts (illustrative)
const BALANCED: ModelTier = {
  id: 'balanced',
  modelId: 'onnx-community/whisper-base',
  approxDownloadMB: 77,
  ladder: [
    { encoder_model: 'fp16', decoder_model_merged: 'fp16', device: 'webgpu' }, // only offered if profile.webgpu
    { encoder_model: 'int8', decoder_model_merged: 'int8', device: 'wasm' },
    { encoder_model: 'fp32', decoder_model_merged: 'fp32', device: 'wasm' },   // last resort, always loads
  ],
}
```

```ts
// modelManager.ts — core loop (pseudocode)
async function loadTier(tier: ModelTier, profile: DeviceProfile): Promise<Loaded | null> {
  for (const rung of tier.ladder) {
    if (rung.device === 'webgpu' && !profile.webgpu) continue
    if (isMarkedBad(tier.modelId, rung)) continue          // failed on this machine before
    try {
      return await loadPipeline(tier.modelId, rung)        // transformers.js pipeline(..., { dtype, device })
    } catch (err) {
      markBad(tier.modelId, rung, String(err))             // chrome.storage.local — never retry a broken export
    }
  }
  return null                                              // whole tier unusable on this machine
}

async function activate(mode: AsrMode): Promise<void> {
  const profile = await detectDevice()
  let tier = resolveTier(mode, profile)                    // Auto → static gate; manual → as chosen
  while (tier) {
    const loaded = await loadTier(tier, profile)
    if (loaded) {
      const rtf = await measureRtf(loaded.transcribe)
      if (rtf <= 1.0 || mode !== 'auto') {
        emit({ phase: 'ready', tier: tier.id, slow: rtf > 0.6 })
        return
      }
    }
    const lower = nextLighterTier(tier)                    // accuracy → balanced → light → null
    if (lower) emit({ phase: 'fallback', from: tier.id, to: lower.id })
    tier = lower
  }
  emit({ phase: 'unsupported' })
}
```

**Runtime failures** (OOM during inference, WebGPU device-lost): caught in the facade, the offending rung is marked bad, and `activate` re-runs — same ladder, one rung lower. The user sees one toast (`autoFallback`), not a crash.

## 8. Not blocking anything (and an existing defect)

Inference already runs in the offscreen document, isolated from the panel UI. Two required changes:

1. **Single-flight inference queue** (`inferenceQueue.ts`). Today `onChunk` fires `processAudioChunk` **unawaited** — on a slow machine chunks pile up as concurrent inferences: memory spikes, out-of-order transcripts, compounding latency. This is a live defect independent of this proposal. Fix: a queue that processes one chunk at a time and keeps at most 2 pending, dropping the oldest (same drop-oldest policy as the TTS queue — stay live, don't drift).
2. **ORT worker proxy** (`env.backends.onnx.wasm.proxy = true`) so ONNX Runtime runs in a worker inside the offscreen document, keeping its event loop free for message routing and TTS. Must be verified compatible with our single-thread constraint (COEP/tabCapture conflict forbids `numThreads > 1` — that constraint stands).

## 9. UI copy (i18n keys)

| Key | es | en |
|---|---|---|
| `asr.mode.auto` | Automático (recomendado) | Auto (recommended) |
| `asr.mode.light` | Modo ligero | Light mode |
| `asr.mode.balanced` | Modo equilibrado | Balanced mode |
| `asr.mode.accuracy` | Modo precisión | Accuracy mode |
| `asr.mode.lightHint` | Más rápido, menos preciso. Para equipos justos. | Fastest, least accurate. For modest machines. |
| `asr.mode.balancedHint` | Mejor precisión. Recomendado en la mayoría de equipos. | Better accuracy. Recommended for most machines. |
| `asr.mode.accuracyHint` | Máxima precisión local. Descarga grande y más consumo. | Best local accuracy. Large download, heavier on your machine. |
| `asr.downloading` | Descargando modelo para uso offline… {progress}% | Downloading model for offline use… {progress}% |
| `asr.downloadConfirm` | Este modo descargará ~{mb} MB (una sola vez). ¿Continuar? | This mode downloads ~{mb} MB (one time). Continue? |
| `asr.slowWarning` | Este modo puede ir lento en tu dispositivo. | This mode may run slowly on your device. |
| `asr.unsupported` | Tu dispositivo no parece compatible con este modo. | Your device doesn't seem to support this mode. |
| `asr.autoFallback` | Cambiamos automáticamente a un modo más ligero. | We automatically switched to a lighter mode. |

## 10. Risks

1. **Broken quantized exports** (proven: tiny q8). Mitigated by the probe ladder + per-machine bad-rung memory. Residual: first-run UX pays one failed load (~seconds) per bad rung.
2. **WebGPU variability** — ORT WebGPU EP with Whisper decoders has device-specific bugs. WebGPU is treated strictly as an optimization rung; WASM int8 is the contract. Never require WebGPU.
3. **`small` on WASM single-thread is likely RTF > 1** — Accuracy mode is honest only on WebGPU machines; the warning copy and the benchmark protect the user, but expectations should be set: this mode is niche.
4. **Multi-thread WASM is off the table** — SharedArrayBuffer needs COEP, which breaks `tabCapture` in the offscreen document (already proven in this repo). Do not plan around threads.
5. **First run needs network** — models come from the HF Hub. Offline-first only after first download. CDN outage = degraded first-run; cached users unaffected.
6. **Quota** — up to ~370 MB if a user tries every tier. Cache Storage quotas are generous (% of disk), but settings must expose cleanup (§7).
7. **Latency honesty** — a better model does **not** reduce latency; base costs more compute than tiny. Latency levers remain chunking, queues and TTS rate. Tiers trade *accuracy vs latency*; Auto exists to pick the right point per machine.

## 11. Rollout

- **Phase 1 (foundation, no behavior change)**: `src/asr/` skeleton, registry with tiny only, probe ladder, inference queue, `MODEL_STATUS` with download progress. Switch tiny fp32 → tiny int8 via the ladder (fp32 stays as the last rung — so worst case equals today).
- **Phase 2 (the product change)**: base/Balanced tier, mode picker in settings, Auto gate + benchmark, fallback UX, download confirmation.
- **Phase 3 (optional)**: small/Accuracy tier, WebGPU rungs, "re-test my device" in settings.

Each phase is one PR, independently shippable, `main` stays releasable.
