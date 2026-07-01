import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

// Force local WASM — MV3 blocks external CDN scripts
// Point to public/ files copied at build time — MV3 blocks external CDN scripts
if (env.backends.onnx.wasm) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('')
  // Single-thread: SharedArrayBuffer needs COEP, which breaks tabCapture in offscreen
  env.backends.onnx.wasm.numThreads = 1
}

// whisper-tiny multilingual — ~75MB, cached after first load
const MODEL_ID = 'onnx-community/whisper-tiny'

let transcriber: AutomaticSpeechRecognitionPipeline | null = null

export async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber

  transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, {
    dtype: 'fp32',
  }) as AutomaticSpeechRecognitionPipeline

  return transcriber
}

export async function transcribeAudio(samples: Float32Array): Promise<string> {
  const asr = await getTranscriber()

  const result = await asr(samples, {
    task: 'transcribe',
  })

  const text = Array.isArray(result) ? result[0]?.text : result.text
  return (text ?? '').trim()
}
