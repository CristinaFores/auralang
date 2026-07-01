<!-- BEGIN:agent-rules -->

# AuraLang — project conventions

Contract for reviewers, contributors and coding agents working on **AuraLang** — a real-time
audio translation Chrome extension (MV3).

| Resource        | Location                         |
| --------------- | -------------------------------- |
| Setup & stack   | [README.md](./README.md)         |
| Manifest        | [manifest.json](./manifest.json) |

This file explains the non-negotiable rules behind the codebase: stack, architecture, services,
testing, accessibility and styling. Read it together with the README when reviewing or extending
the project.

---

# Agent Rules

## 1. Project context

AuraLang captures the active tab's audio, transcribes it locally with Whisper, translates the
text, and reads the result aloud via the browser's built-in TTS. No API key required.

The project uses:

- Chrome Extension Manifest V3 (`tabCapture`, offscreen document, service worker).
- Vite + `@crxjs/vite-plugin`.
- React 18 with **TypeScript** (strict mode).
- Tailwind CSS.
- i18n for popup copy (`en` / `es`).

Use:

```txt
.ts
.tsx
.css
.html
.json
```

Do not introduce `.js`/`.jsx` source files unless required by tooling config.

---

## 2. Architecture principles

Keep the project scalable and easy to evolve. Prioritize clear separation of
responsibilities, small focused components, reusable UI pieces, isolated service logic,
predictable state, maintainable styling, accessible markup and testable behavior.

Avoid: large multi-responsibility components, duplicated logic, hardcoded credentials,
unnecessary dependencies, deeply nested JSX, non-semantic markup, business logic in UI
components, and overly rigid structure.

Keep related files close when it improves maintainability. Prefer names that explain intent.

Layout:

```txt
src/
├── background/          Service worker — tabCapture, offscreen lifecycle
├── offscreen/           AudioContext + transcription/translation/TTS pipeline
├── popup/               React UI — hooks, components, i18n
├── welcome/             First-install onboarding
├── services/            transcriptionService, translationService, ttsService
├── types/               Shared TypeScript interfaces
├── constants/           Language lists and shared constants
└── utils/               Pure helpers
```

Execution contexts (background, offscreen, popup) communicate via typed messages defined in
`src/types/`. Services hold side effects; hooks orchestrate UI state; components render.

---

## 3. TypeScript rules

Write clear, strict, well-typed TypeScript.

- `strict` mode is on. Do not disable it or weaken it per-file.
- **Never use `any`.** Prefer precise types, `unknown` with narrowing, or generics.
- Model domain types, extension messages and settings in `src/types/` and reuse them everywhere
  (services, hooks, components).
- Type component props with an explicit `interface`/`type`.
- Use discriminated unions for message/action types so each branch is exhaustively checked.
- Prefer `import type { ... }` for type-only imports.
- Avoid unnecessary abstractions and overly clever types.

---

## 4. Styling rules

Use Tailwind CSS for popup and welcome UI. Global styles are limited to tokens, reset/base,
typography defaults and layout primitives in `src/popup/index.css`.

- Mobile-first responsive styles.
- Support light/dark theme via `useTheme` and CSS variables/classes.
- Avoid inline styles in final UI unless dynamic values require them.
- User-facing strings go through i18n locale files, not hardcoded JSX.

---

## 5. Service & API rules

Use isolated services (`src/services/`, offscreen pipeline), never call external endpoints
directly from UI components.

- **Transcription:** `@huggingface/transformers` (Whisper) runs locally in the offscreen document.
- **Translation:** unofficial Google Translate endpoint via `translationService`.
- **TTS:** `speechSynthesis` via `ttsService`.

Handle errors gracefully; the UI must provide loading, error and idle states. Never expose API
keys in the extension bundle.

---

## 6. State rules

Share settings via `chrome.storage.local` (languages, theme). Do not read storage synchronously
on first render without handling the async load.

Popup hooks (`useApiConfig`, `useTranslation`, `useI18n`) own UI orchestration. Keep cart-like
persistent state logic separate from presentation. Hydrate browser-only state safely after mount.

---

## 7. Accessibility rules

Accessibility is a core requirement. Use semantic HTML; labels for controls and real buttons
for actions; links only for navigation (no clickable `div`s); `aria-label` on icon-only controls;
the real `disabled` attribute; visible focus and working keyboard navigation; sufficient
contrast; clear loading/error/empty states not signalled by color alone. The browser console
must stay free of errors and warnings.

---

## 8. Testing rules

When adding tests, use Jest and React Testing Library. Tests focus on user-facing behavior and
follow the **Given-When-Then / And** BDD structure in every `describe`/`it`.

- Do not mock business logic or services. Intercept HTTP with **MSW** when testing network calls.
- Simulate `chrome.storage.local` for settings persistence.
- Type mocks with `jest.mocked(...)` instead of casting to `any`.

Before delivery these must pass:

```bash
npm run type-check
npm run build
```

Add `npm run test` and `npm run lint` to this gate once configured.

---

## 9. Development, build and deployment

Development: `npm run dev` (reload extension manually after changes).
Production: `npm run build` → load unpacked from `dist/` or `npm run zip` for Chrome Web Store.

The extension must be free of console errors/warnings during normal use in both modes.

---

## 10. Documentation deliverables

The README explains how to run the project and the main technical decisions. Together with
this file they form the documentation package:

- **README** — setup, architecture, quality pipeline, deployment.
- **AGENTS.md** (this file) — coding conventions, service rules, testing and accessibility contract.

State clearly that MV3 + offscreen was chosen for audio capture, that TypeScript runs in strict
mode, that services isolate transcription/translation/TTS, that settings persist in
`chrome.storage.local`, and that accessibility is a core requirement.

---

## 11. Coding style & documentation

- Let types document the data; do not duplicate type information in JSDoc. Add short JSDoc
  only to explain the **why** of non-trivial logic or public helpers.
- Do not write comments that restate what the code does.
- Prioritize descriptive names for functions and variables.
- Keep the logic flow clean and modular; avoid noise.

<!-- END:agent-rules -->
