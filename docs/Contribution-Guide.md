# Contribution Guide

Short: Fork → branch → PR. Small, focused commits. Tests and lint before submitting.

Workflow
- Fork the repo, create a branch named `feat/xxx` or `fix/xxx`.
- Make changes, run `npm ci` and `npm run dev` locally.
- Run linters: `npm run lint` (if configured) and type-check: `npm run typecheck`.
- Open a PR with a clear description and link to any demo screenshots.

Code style
- TypeScript + React. Follow existing patterns (`src/components/*`).
- Keep components small. No inline CSS; use Tailwind classes.

Issue templates
- File issues for bugs or feature requests and tag them with severity.

Contact
- For major changes, open an issue first to discuss.
