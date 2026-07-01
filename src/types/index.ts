export interface UserConfig {
  targetLanguage: string
}

export interface TranslationState {
  isActive: boolean
  isLoading: boolean
  isModelReady: boolean
  error: string | null
}

export type MessageType =
  | 'START_CAPTURE'
  | 'STOP_CAPTURE'
  | 'AUDIO_CHUNK'
  | 'TRANSLATION_RESULT'
  | 'MODEL_READY'
  | 'ERROR'

export interface ExtensionMessage {
  type: MessageType
  payload?: unknown
}

export interface StartCapturePayload {
  streamId: string
  targetLanguage: string
}

export interface TranslationResultPayload {
  text: string
}

export interface ErrorPayload {
  message: string
}
