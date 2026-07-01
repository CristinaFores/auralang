# AuraLang

Real-time audio translation Chrome extension. Captures the active tab's audio, transcribes it with Whisper, translates it with GPT-4o-mini, and reads the result aloud via TTS — all using your own OpenAI API key (BYOK).

## How it works

```
Tab audio → Whisper (transcription) → GPT-4o-mini (translation) → TTS-1 (speech)
```

The original tab audio is silenced. You only hear the translated version.

## Requirements

- Google Chrome 116+
- OpenAI API key with access to `whisper-1`, `gpt-4o-mini`, and `tts-1`

## Local setup

```bash
npm install
npm run build
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `dist/` folder
4. Open the extension popup, paste your OpenAI API key, and click **Save**
5. Navigate to any tab with audio and click **Start Translation**

## Development

```bash
npm run dev        # Vite HMR dev server (reload extension manually after changes)
npm run type-check # TypeScript check without building
npm run zip        # Build + create dist.zip for Chrome Web Store upload
```

## Tech stack

| Layer | Tool |
|---|---|
| Extension API | Chrome MV3 — tabCapture, offscreen, storage |
| Build | Vite + @crxjs/vite-plugin |
| UI | React 18 + TypeScript strict |
| Styles | Tailwind CSS |
| Transcription | OpenAI Whisper (`whisper-1`) |
| Translation | OpenAI Chat (`gpt-4o-mini`) |
| Speech | OpenAI TTS (`tts-1`, voice: nova) |

## Project structure

```
src/
  background/     # Service worker — tabCapture + offscreen lifecycle
  offscreen/      # Persistent AudioContext + AI pipeline orchestration
  popup/          # React UI — BYOK config + translation toggle
    components/   # ApiKeyInput, StatusBadge
    hooks/        # useApiConfig, useTranslation
  services/       # whisperService, translatorService, ttsService
  types/          # Shared TypeScript interfaces
```

## Publishing to Chrome Web Store

```bash
npm run zip
```

Upload `dist.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole). One-time $5 developer registration required.

## Notes

- Audio chunks are sent every 4 seconds. Latency depends on OpenAI API response time.
- The extension never stores your API key anywhere except `chrome.storage.local` on your own machine.
- No backend, no telemetry, no data leaves your browser except to OpenAI's API.
