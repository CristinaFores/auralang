# Contributing to AuraLang

## Setup

```bash
npm install
npm run build
```

Load `dist/` as an unpacked extension in `chrome://extensions` (Developer mode → Load unpacked).

## Development

```bash
npm run dev        # Vite HMR dev server (reload extension manually after changes)
npm run type-check
npm run lint
npm run test
npm run build
```

All four must pass before opening a PR — this is the same gate CI runs.

## Branching and commits

- Branch names: `feat/…`, `fix/…`, `docs/…`, `chore/…` — matches the commit type they carry.
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `type: short summary`, body explaining *why* when the change isn't self-evident.
- Keep PRs scoped to one concern; split unrelated changes into separate PRs.

## Code conventions

Read [AGENTS.md](./AGENTS.md) before contributing — it's the source of truth for architecture, TypeScript strictness, service boundaries, testing, and accessibility rules in this repo.

## Reporting bugs / requesting features

Open a [GitHub issue](https://github.com/CristinaFores/auralang/issues). For security issues, see [SECURITY.md](./SECURITY.md) instead — don't file those publicly.
