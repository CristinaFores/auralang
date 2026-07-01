export type UiLanguage = 'en' | 'es'
export type UiTheme = 'dark' | 'light'

export interface UserConfig {
  targetLanguage: string
  sourceLanguage: string
  uiLanguage: UiLanguage
  uiTheme: UiTheme
}

export interface TranslationState {
  isActive: boolean
  isLoading: boolean
  isModelReady: boolean
  error: string | null
  transcript: TranscriptUpdatePayload | null
}

export type MessageType =
  | 'START_CAPTURE'       // popup → background
  | 'STOP_CAPTURE'        // popup → background
  | 'BEGIN_STREAM'        // background → offscreen (includes streamId)
  | 'END_STREAM'          // background → offscreen
  | 'MODEL_READY'
  | 'GET_CAPTURE_STATE'
  | 'CAPTURE_ENDED'       // offscreen → background/popup (source tab closed or stream lost)
  | 'TRANSCRIPT_UPDATE'   // offscreen → popup (live transcription/translation text)
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

export interface TranscriptUpdatePayload {
  original: string
  translated: string | null
}

export interface ErrorPayload {
  message: string
}
