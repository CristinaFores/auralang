import { pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

// whisper-tiny multilingual — ~75MB, cached after first load
const MODEL_ID = 'onnx-community/whisper-tiny'

let transcriber: AutomaticSpeechRecognitionPipeline | null = null

export async function getTranscriber(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (transcriber) return transcriber

  transcriber = await pipeline('automatic-speech-recognition', MODEL_ID, {
    dtype: 'q8', // quantized — smaller and faster
  }) as AutomaticSpeechRecognitionPipeline

  return transcriber
}

export async function transcribeBlob(blob: Blob): Promise<string> {
  const asr = await getTranscriber()
  const arrayBuffer = await blob.arrayBuffer()
  const float32 = blobToFloat32Array(arrayBuffer)

  const result = await asr(float32, {
    language: 'auto',
    task: 'transcribe',
  })

  const text = Array.isArray(result) ? result[0]?.text : result.text
  return (text ?? '').trim()
}

function blobToFloat32Array(buffer: ArrayBuffer): Float32Array {
  // Convert raw PCM-like buffer — Transformers.js handles WebM/opus internally
  return new Float32Array(buffer)
}
