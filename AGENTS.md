# AGENTS.md

Instructions for AI coding agents working in `contributor-helper` — the Zedu
contributor assistant ("Zoe"): Next.js 14 (App Router), React 18, TypeScript 5, Groq,
NextAuth, Prisma, deployed to Coolify via Docker.

This repo has **no `CONTRIBUTING.md`**. The workflow below (from
`.github/PULL_REQUEST_TEMPLATE.md` and the branch history) is the source of truth, and an
explicit user instruction overrides everything in this file. Human-facing setup and
architecture notes live in [`README.md`](./README.md); product scope lives in
[`PRD.md`](./PRD.md).

## Hard rules

- **Never commit secrets.** `.env` is gitignored and holds real keys. Only ever commit
  `.env.example`, and keep it free of values.
- **Keep keys server-side.** `AI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` and
  `INGEST_SECRET` must only be read in route handlers or `src/lib/`. Anything prefixed
  `NEXT_PUBLIC_` is shipped to the browser; the app needs none today.
- **Keep the change to what the ticket asks.** No drive-by refactors, renames or
  dependency bumps. Reviewers reject unnecessary changes.
- **Never push to `main` or `dev`** and never target the upstream Zedu repos. Work on a
  ticket branch in the team fork and open a PR into `dev`.
- **Conventional Commits only**, with the ticket as the scope:
  `type(scope): description` — e.g. `fix(neo-020): auto-scroll chat to latest message`.
  Branch names follow `<type>/<ticket-id>-<short-description>`.
- **Don't commit or push unless the user asks.**
- **Report a green build, not a hopeful one.** Run `npx tsc --noEmit` and `npm run build`
  before saying a change is done, and state the commands you ran.

## Commands

```sh
Copy-Item .env.example .env   # Windows PowerShell (cp on macOS/Linux)
npm install
npm run dev                   # http://localhost:3000
npm run lint                  # next lint
npx tsc --noEmit              # type-check (not covered by npm scripts)
npm run build                 # next build
npm start                     # next start -p ${PORT:-3000}
```

There is **no test runner** in this repo and no lint/type step in CI — the only workflow
that gates a merge is the malware scan. Type-checking and the production build are
therefore on you.

### Verifying locally

The build succeeds with no secrets, but almost nothing runs without them. To exercise the
routes against a production build:

```powershell
$env:NEXTAUTH_SECRET='dev-secret'; $env:GOOGLE_CLIENT_ID='x'; $env:GOOGLE_CLIENT_SECRET='x'; $env:INGEST_SECRET='dev-ingest'
npm run build; npx next start -p 3111
```

Working with no session: `/api/health`, `/api/auth/providers`, `/api/auth/session`,
`/api/upload` (multipart `file` field) and `/api/ingest` (send `x-ingest-secret`).
`/api/chat` answers `401` until there is a real browser session, so its Groq path cannot
be checked with `curl` alone. Note that `npm install` rewrites `package-lock.json` under
npm 11 — revert it unless the ticket is about dependencies.

## Layout

| Path | Holds |
| --- | --- |
| `src/app/page.tsx` | The whole chat UI: messages, input, sign-in controls, and `DocumentUpload`. |
| `src/app/layout.tsx` | Root layout and metadata. Wraps children in `AuthProvider` (`SessionProvider`). |
| `src/app/api/chat/route.ts` | Zoe's Groq proxy and the hardcoded `zeduDocContent` context. |
| `src/app/api/chat/history/route.ts` | Session history — **a stub today**. |
| `src/app/api/upload/route.ts` | Stages one `.pdf` / `.md` / `.txt` file. |
| `src/app/api/ingest/route.ts` | `x-ingest-secret`-gated cleaning of staged files. |
| `src/app/api/auth/[...nextauth]/route.ts` | NextAuth handlers. |
| `src/app/api/health/route.ts` | Liveness probe. |
| `src/components/DocumentUpload.tsx` (+ `.module.css`) | Upload UI. |
| `src/components/auth-provider.tsx`, `auth-controls.tsx` | Session provider and buttons. |
| `src/lib/auth.ts` | NextAuth options (Google, JWT sessions). |
| `src/lib/storage.ts` | Filesystem staging under `DATA_DIR` and `knowledge.md`. |
| `src/lib/upload.ts` | Client-side validation and the XHR upload transport. |
| `prisma/migrations/` | Committed migrations — note `schema.prisma` is **missing**. |
| `HNG 15 Task Document.txt` | Source text behind the hardcoded context. |
| `route-old.ts` | Dead DB-coupled chat route, excluded from `tsconfig.json`. |

## Conventions

- **Imports:** use the `@/` alias (maps to `src/`), as the existing files do.
- **Client vs server:** interactive components need `"use client"`; route handlers and
  `src/lib/*` are server-only. Never import `src/lib/storage.ts` (it uses `node:fs`) into
  a client component.
- **Styling:** `page.tsx` uses inline `style` objects and `globals.css`; newer components
  (`DocumentUpload`) use CSS modules. Match the file you are editing rather than
  introducing a styling system.
- **Markdown:** render assistant output with `react-markdown`, keeping the custom
  renderers for links, lists and paragraphs. Never `dangerouslySetInnerHTML` model output.
- **Groq:** construct one `Groq` client from `process.env.AI_API_KEY` per route module, as
  the existing routes do. Model is `qwen/qwen3.8-27b`; ingestion pins `max_tokens: 800`
  because of the account's 1000 tokens-per-minute limit — raise it only with a reason.
- **Knowledge base:** the chat context is a literal in `src/app/api/chat/route.ts` copied
  from `HNG 15 Task Document.txt`. If you change one, change both.
- **Accessibility:** `DocumentUpload` sets the bar — labelled controls, `role="status"`
  announcements, visible focus, 44px targets and `prefers-reduced-motion`. Match it in
  new UI rather than regressing it.

## Current state (do not assume otherwise)

- The chat context is **hardcoded**; `DATA_DIR/knowledge.md` is written by ingestion but
  never read by the chat route.
- `/api/chat` requires a signed-in session (`getUnauthorizedResponse()` →
  `getServerSession`) and returns `401` without one, but there is **no RBAC** — any
  authenticated Google user can chat. When `NEXTAUTH_SECRET` is unset, NextAuth throws and
  the route returns a misleading `500`.
- `/api/chat/history` returns `{ messages: [], persisted: false }`, and is **prerendered as
  static content** at build time, so it needs `export const dynamic = "force-dynamic"`
  before it can ever return live data. Prisma models exist in `prisma/migrations/` but no
  route uses them, and `prisma/schema.prisma` is not committed (so `prisma generate` in
  `postinstall` has nothing to work from).
- `prisma` and `next-auth` are dependencies; `src/lib/prisma.ts` no longer exists even
  though `route-old.ts` imports it.
- Only `.pdf`, `.md` and `.txt` uploads are accepted — not the `.vtt` / `.docx` the PRD
  lists.
- Replies are not streamed; the client waits for a full JSON response.

If a ticket asks to build on any of the above, fix the gap as part of that ticket rather
than assuming the feature already works.

## Pull requests

- Branch off `main`, open the PR into `dev`, one ticket per PR, and fill in every section of
  `.github/PULL_REQUEST_TEMPLATE.md` (ticket link, team lead, what changed, why, how to
  test, what to expect, evidence, AI-usage line).
- Deploys are **not** part of a PR: `main` triggers the malware gate and then Coolify.
- Reference code as `path/to/file.ts:line` so reviewers can navigate.

## References

- [`README.md`](./README.md) — setup, environment variables, deployment, status.
- [`PRD.md`](./PRD.md) — product scope and requirements.
- [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) — the PR
  checklist every change must satisfy.
- `.github/workflows/` — malware gate, Coolify deploy, project-board automation.
