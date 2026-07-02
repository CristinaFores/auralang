# Privacy Policy — AuraLang

Last updated: 2026-07-01

AuraLang is a Chrome extension that translates the audio of your active browser tab in real time. This policy describes what data the extension accesses and how it is used.

## What AuraLang accesses

- **Tab audio**: when you click "Start translation," the extension captures the audio stream of your active tab (`tabCapture` permission) in order to transcribe and translate it. The original tab audio is muted while capturing.
- **Settings**: your source/target language, interface language, and theme (dark/light) are stored locally via `chrome.storage.local`.

## What AuraLang does NOT do

- It does not collect personal identification data, health data, financial data, authentication credentials, personal communications, location, browsing history, or user activity (clicks, keystrokes).
- It does not have a backend server. There is no account, no login, no analytics, no telemetry.
- It does not sell or share user data with third parties for advertising or any purpose unrelated to providing the translation feature.

## How audio is processed

1. **Transcription**: audio is transcribed locally, on your own device, using a Whisper model (`@huggingface/transformers`, ONNX Runtime WASM). The model weights (~40–150 MB depending on the variant) are downloaded once from Hugging Face (huggingface.co) and cached locally. Audio never leaves your device for transcription.
2. **Translation**: the transcribed text is sent to Google's public translation endpoint (`translate.googleapis.com`) solely to obtain the translated text. No other data accompanies this request.
3. **Speech**: the translated text is read aloud locally using the browser's built-in Web Speech API (`speechSynthesis`). This does not leave your device.

## Data retention

Nothing is stored outside your browser. Settings persist in `chrome.storage.local` until you uninstall the extension or clear it manually. Audio and transcribed text are processed in memory and are not saved anywhere.

## Contact

Questions about this policy can be raised via [GitHub Issues](https://github.com/CristinaFores/auralang/issues).
