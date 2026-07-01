export interface ApiConfig {
  openaiKey: string
  whisperModel: 'whisper-1'
  targetLanguage: string
}

export interface TranslationState {
  isActive: boolean
  isLoading: boolean
  error: string | null
}

export type MessageType =
  | 'START_CAPTURE'
  | 'STOP_CAPTURE'
  | 'AUDIO_CHUNK'
  | 'TRANSLATION_RESULT'
  | 'ERROR'

export interface ExtensionMessage {
  type: MessageType
  payload?: unknown
}

export interface StartCapturePayload {
  streamId: string
  config: ApiConfig
}

export interface TranslationResultPayload {
  text: string
}

export interface ErrorPayload {
  message: string
}
