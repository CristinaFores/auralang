# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

AuraLang is a Manifest V3 Chrome extension that translates the active tab's audio in real time: it captures tab audio, transcribes it locally with Whisper, translates the text, and reads it back aloud. No backend, no API key.

`AGENTS.md` is the authoritative contract for stack, TypeScript, service boundaries, testing and accessibility conventions — read it before extending the code. This file focuses on commands and the cross-cutting architecture that isn't obvious from any single file.

## Commands

```bash
npm run dev         # Vite dev server (reload the extension manually after changes)
npm run build       # tsc + vite build → dist/
npm run type-check  # tsc --noEmit
npm run lint        # eslint .
npm run test        # Jest + React Testing Library (jsdom / node per file)
npm run zip         # package existing dist/ into dist.zip (run `build` first)
```

Run a single test file or pattern:

```bash
npm run test -- src/services/translationService.test.ts
npm run test -- -t "returns translated text"
```

**Loading the extension:** `npm run build`, then in `chrome://extensions` (Developer mode) → Load unpacked → select `dist/`. For the store, `npm run build && npm run zip` and upload `dist.zip` (Chrome requires a higher `manifest.json` version than the published one for each new upload).

Pre-release gate: `type-check`, `lint`, `test`, `build` must all pass (also enforced by CI in `.github/workflows/ci.yml`).

## Architecture: three execution contexts

The extension runs across three isolated JS contexts that communicate **only** via typed messages (`ExtensionMessage` / `MessageType` in `src/types/index.ts`). Understanding this boundary is essential:

- **`src/popup/`** — React UI, rendered in the **side panel** (not a popup window). Reads/writes user config via `chrome.storage.local`. Sends `START_CAPTURE`/`STOP_CAPTURE`; receives `MODEL_STATUS`, `TRANSCRIPT_UPDATE`, `SPEAKING`, `CAPTURE_ENDED`, `ERROR`.
- **`src/background/index.ts`** — service worker. Opens the side panel **per-tab** on toolbar-icon click (grants `activeTab` for that exact tab), redeems the `tabCapture` stream id, ensures the offscreen document exists, and relays `BEGIN_STREAM`/`END_STREAM`.
- **`src/offscreen/`** — the only context with `AudioContext`, WASM inference and `speechSynthesis` (a service worker has none of these). Runs the whole audio pipeline.

Pipeline (offscreen): `audioCapture.ts` captures tab audio and cuts it into chunks on natural speech pauses (VAD, not a fixed clock) → `inferenceQueue.ts` runs one chunk at a time (dropping oldest if it falls behind) → `pipeline.ts` calls transcription → translation → TTS.

### Critical constraint: the offscreen document has almost no extension APIs

The offscreen document exposes **only** `chrome.runtime.getURL` and messaging. It does **not** have `chrome.storage` or `chrome.runtime.getManifest`. Consequences already baked in — do not reintroduce these:
- `src/asr/modelManager.ts` persists its bad-rung cache in `localStorage`, not `chrome.storage`.
- The extension version is imported from `manifest.json` at build time, not read via `getManifest()`.
- The user's model-mode preference lives in `chrome.storage` (popup only); the offscreen learns it from the `START_CAPTURE` payload, never by reading storage.

WASM is single-threaded on purpose (`numThreads = 1`): multi-thread WASM needs `SharedArrayBuffer`/COEP, which breaks `tabCapture` in the offscreen document.

## Architecture: ASR model tiers (`src/asr/`)

Model selection is data-driven via `registry.ts` (tiers) and `modelManager.ts` (loader). Two verified tiers ship today, both **fp32-only**:
- **Light** = `onnx-community/whisper-tiny` (~150 MB)
- **Balanced** = `onnx-community/whisper-base` (~290 MB)
- **Auto** picks between them from `navigator.hardwareConcurrency`/`deviceMemory`.

`modelManager` loads a tier via a **probe ladder**: it tries each dtype rung in order and falls through on session-creation failure, remembering broken rungs per machine + extension version.

**Do not add a quantized rung (q8/int8/q4) without verifying that specific export actually creates a session.** Both the `q8` and `int8` decoders of whisper-tiny/base are broken upstream (`Missing required scale: model.decoder.embed_tokens.weight_merged_0_scale`, a MatMulNBits error); a rung that always throws is worse than not offering it. See `docs/ASR_ARCHITECTURE.md` for the full rationale and the (unshipped) Phase 3 plan.

The model downloads **on first Start**, never on panel open — that click is the user's consent, and the idle screen shows the model + size beforehand.

## Model & translation specifics

- Whisper weights are fetched once from Hugging Face and cached by transformers.js (browser Cache Storage). This is the "remote code" the store listing must justify — it's model data run in isolation via ONNX Runtime WASM, not executable code.
- Translation uses Google's free, unofficial `translate.googleapis.com` endpoint. The source language is passed explicitly (Whisper already knows it) rather than auto-detected.
- `tabCapture` unavoidably triggers Chrome's generic "read and change all your data on all websites" warning for any extension; the extension only captures the chosen tab's audio and sends nothing to a backend.
