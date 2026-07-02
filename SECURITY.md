# Security Policy

## Reporting a vulnerability

If you find a security issue in AuraLang, please **do not open a public GitHub issue**. Instead, report it privately via [GitHub Security Advisories](https://github.com/CristinaFores/auralang/security/advisories/new) for this repository, or by email to cristinaforescampos1992@gmail.com.

Please include:

- A description of the issue and its potential impact
- Steps to reproduce it
- The extension version and Chrome version you tested with

We'll acknowledge reports as soon as possible and aim to ship a fix before any public disclosure.

## Scope

AuraLang runs entirely client-side (no backend, see [PRIVACY.md](./PRIVACY.md)). Relevant reports include, but aren't limited to:

- Manifest permission or CSP misconfigurations
- Ways audio, transcribed text, or settings could leak outside the intended flow (local storage, the translation endpoint)
- Message-passing vulnerabilities between the popup/side panel, background service worker, and offscreen document

## Supported versions

Only the latest published version on the Chrome Web Store / `main` branch is supported with security fixes.
