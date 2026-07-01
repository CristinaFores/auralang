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
