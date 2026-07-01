export interface UserConfig {
  targetLanguage: string
  sourceLanguage: string
}

export interface TranslationState {
  isActive: boolean
  isLoading: boolean
  isModelReady: boolean
  error: string | null
}

export type MessageType =
  | 'START_CAPTURE'       // popup → background
  | 'STOP_CAPTURE'        // popup → background
  | 'BEGIN_STREAM'        // background → offscreen (includes streamId)
  | 'END_STREAM'          // background → offscreen
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
  sourceLanguage: string
}

export interface TranslationResultPayload {
  text: string
}

export interface ErrorPayload {
  message: string
}
