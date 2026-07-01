<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="icons/auralang_logo_pack/presentation/wordmark-dark.png">
    <img src="icons/auralang_logo_pack/presentation/wordmark-light.png" alt="AuraLang — Traducción en tiempo real" width="420">
  </picture>
</p>

Real-time audio translation Chrome extension. Captures the active tab's audio, transcribes it locally with Whisper, translates the text, and reads the result aloud via the browser's built-in TTS. No API key required.

**Docs:** [AGENTS.md](./AGENTS.md) — coding conventions, architecture, testing and accessibility contract.

---

## How it works

```
Tab audio → Whisper (local, on-device transcription) → Google Translate → Web Speech API (speech)
```

The original tab audio is muted while capturing. You only hear the translated version.

## Requirements

- Google Chrome 116+

## Local setup

```bash
npm install
npm run build
```

Then in Chrome:

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** → select the `dist/` folder
4. Open the extension popup, pick source/target languages, and click **Iniciar traducción**
5. Navigate to any tab with audio and start

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
| Transcription | Whisper (`@huggingface/transformers`, runs locally in an offscreen document) |
| Translation | Google Translate (unofficial free endpoint) |
| Speech | Web Speech API (`speechSynthesis`) |

## Project structure

```
src/
  background/     # Service worker — tabCapture + offscreen lifecycle
  offscreen/      # Persistent AudioContext + transcription/translation/TTS pipeline
  popup/          # React UI — language selectors + translation toggle
    components/   # Header, StatusHero, WaveformIndicator, LanguageSelect, SettingsPanel...
    hooks/        # useApiConfig (stores languages/theme), useTranslation, useI18n
  welcome/        # First-install onboarding page (pin the extension)
  services/       # transcriptionService, translationService, ttsService
  types/          # Shared TypeScript interfaces
```

## Quality & AGENTS.md compliance

The project follows the conventions in [AGENTS.md](./AGENTS.md). Current status:

| Area | Status | Notes |
|---|---|---|
| TypeScript strict | ✅ | `strict`, `noUnusedLocals`, `noUnusedParameters` |
| Architecture | ✅ | Services isolated; typed messages in `src/types/` |
| i18n | ✅ | `en` / `es` locale files; no hardcoded UI copy |
| Accessibility | 🟡 | Semantic markup in popup; manual audit pending |
| ESLint | ❌ | Not configured yet |
| Unit tests (Jest + RTL) | ❌ | Not configured yet |
| MSW for HTTP | ❌ | Add when testing `translationService` |
| CI (GitHub Actions) | ❌ | Not configured yet |

### How to reach full compliance

1. **Lint** — add ESLint + `eslint-plugin-react-hooks` and a `npm run lint` script. Gate PRs on zero warnings.
2. **Tests** — add Jest + React Testing Library + MSW. Structure specs with Given-When-Then. Start with popup hooks and `translationService`; mock `chrome.storage` for settings.
3. **CI** — GitHub Actions workflow running `type-check`, `lint`, `test`, and `build` on every push/PR.
4. **Accessibility pass** — keyboard navigation, focus rings, `aria-label` on icon buttons, error states not by color alone.
5. **Pre-delivery gate** — before release, all of these must pass:

```bash
npm run type-check
npm run lint      # once added
npm run test      # once added
npm run build
```

Read [AGENTS.md](./AGENTS.md) before contributing — it is the source of truth for architecture, TypeScript, services, testing and accessibility rules.

## Publishing to Chrome Web Store

```bash
npm run zip
```

Upload `dist.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole). One-time $5 developer registration required.

## Notes

- Audio chunks are processed continuously while translation is active; latency depends on the local Whisper model and network round-trip to the translation endpoint.
- No backend, no telemetry, no account. Settings (languages, theme) are stored only in `chrome.storage.local` on your own machine.
- The Google Translate endpoint used here is the free, unofficial one — fine for personal use, but not backed by an SLA. Consider a paid translation API before high-volume or commercial use.
