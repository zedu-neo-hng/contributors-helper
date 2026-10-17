# Contributors Helper

**Zoe**, the Zedu contributor assistant: a small chat app that answers contributor
questions about the HNG15 internship — tasks, deadlines, submission links and call
transcripts — instead of making people dig through chat channels.

| | |
| --- | --- |
| Live | <https://contributors.zedu.chat> |
| Repo | <https://github.com/zedu-neo-hng/contributors-helper> |
| Team | Neo (HNG15) |
| Product spec | [`PRD.md`](./PRD.md) |

## What it does

- **Ask Zoe a question** and get a Markdown answer assembled from the project context,
  with clickable submission links.
- **Sign in with Google** so sessions can be attributed to a person.
- **Upload transcripts and documents** (`.pdf`, `.md`, `.txt`, up to 5 MiB), which are
  then reduced to structured notes (`Key Decisions`, `Action Items`, `Q&A`) and appended
  to the knowledge base.

The chat itself is not streamed: the browser sends the whole conversation to
`POST /api/chat` and renders the reply with `react-markdown`.

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript 5**
- **Groq** (`groq-sdk`, model `qwen/qwen3.8-27b`) for chat and ingestion
- **NextAuth v4** with the Google provider for sign-in
- **Prisma 6 / PostgreSQL** for persistence (in progress — see [Status](#status))
- **unpdf** for PDF text extraction
- **react-markdown** for rendering, inline styles + CSS modules for styling
- **npm** (`package-lock.json`) — this app is independent of the `pnpm` frontend

## Prerequisites

- **Node.js 20+**
- **npm** (the repo commits `package-lock.json`)
- A **Groq API key** — <https://console.groq.com/keys>. The free tier's tokens-per-minute
  limit is why ingestion caps its output (see `src/app/api/ingest/route.ts`).
- A **Google OAuth client** (only needed to try sign-in)
- **PostgreSQL** (only needed for the persistence work in progress)

## Getting started

```sh
git clone https://github.com/zedu-neo-hng/contributors-helper.git
cd contributors-helper

Copy-Item .env.example .env   # Windows PowerShell
# cp .env.example .env        # macOS / Linux

npm install
npm run dev
```

Open <http://localhost:3000>. Confirm the server is up at
<http://localhost:3000/api/health>, which returns `{"status":"ok"}`.

## Environment variables

Create `.env` from `.env.example`. `.env` is gitignored — never commit it, and never
put these values in a client component (only `NEXT_PUBLIC_*` variables reach the
browser, and this app currently needs none).

| Variable | Required | Used by | Notes |
| --- | --- | --- | --- |
| `AI_API_KEY` | Yes | `src/app/api/chat/route.ts`, `src/app/api/ingest/route.ts` | Groq API key. Server-only. |
| `GOOGLE_CLIENT_ID` | For sign-in | `src/lib/auth.ts` | Google OAuth client. |
| `GOOGLE_CLIENT_SECRET` | For sign-in | `src/lib/auth.ts` | Server-only. |
| `NEXTAUTH_SECRET` | For sign-in | NextAuth | Read by NextAuth itself, not by app code. Required in production. |
| `NEXTAUTH_URL` | For sign-in | NextAuth | Set to the deployed origin in production. |
| `INGEST_SECRET` | For ingestion | `src/app/api/ingest/route.ts` | Sent as the `x-ingest-secret` header. Ingestion returns `503` when unset. |
| `DATA_DIR` | No | `src/lib/storage.ts` | Where staged uploads and `knowledge.md` live. Defaults to `./data`. |
| `DATABASE_URL` | Persistence | Prisma | Postgres connection string. Not yet wired to the chat routes. |

## API routes

App Router route handlers live under `src/app/api/**/route.ts`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/chat` | `POST` | Zoe's reply. Sends the conversation to Groq with the project context. |
| `/api/chat/history` | `GET` | Session history. **Currently a stub returning `{ messages: [], persisted: false }`.** |
| `/api/upload` | `POST` | Validates and stages one `.pdf` / `.md` / `.txt` file (≤ 5 MiB). |
| `/api/ingest` | `POST` | Gated by `x-ingest-secret`. Extracts text, structures it with Groq, appends to `knowledge.md`. |
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth sign-in / session endpoints. |
| `/api/health` | `GET` | Liveness probe for the deploy target. |

## Project structure

```txt
.
├── src/
│   ├── app/
│   │   ├── page.tsx                     # the entire chat UI (client component)
│   │   ├── layout.tsx                   # root layout / metadata
│   │   ├── globals.css
│   │   └── api/
│   │       ├── chat/route.ts            # Groq chat proxy + hardcoded knowledge base
│   │       ├── chat/history/route.ts    # session history (stub)
│   │       ├── upload/route.ts          # stage an upload
│   │       ├── ingest/route.ts          # clean + structure staged documents
│   │       ├── auth/[...nextauth]/route.ts
│   │       └── health/route.ts
│   ├── components/
│   │   ├── DocumentUpload.tsx           # upload UI (drag & drop, progress, a11y)
│   │   ├── DocumentUpload.module.css
│   │   ├── auth-provider.tsx            # NextAuth SessionProvider wrapper
│   │   └── auth-controls.tsx            # sign-in / sign-out buttons
│   ├── lib/
│   │   ├── auth.ts                      # NextAuth options (Google, JWT sessions)
│   │   ├── storage.ts                   # filesystem staging + knowledge.md
│   │   └── upload.ts                    # client-side validation + XHR transport
│   └── next-auth.d.ts                   # Session / JWT type augmentation
├── prisma/migrations/                   # committed migrations (schema.prisma is missing)
├── .github/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/                       # malware gate, Coolify deploy, board automation
├── HNG 15 Task Document.txt             # source text behind the hardcoded context
├── route-old.ts                         # dead DB-coupled chat route, excluded from tsconfig
└── Dockerfile                           # node:20-alpine, port 3000
```

## How the pieces fit

- **Chat** (`src/app/api/chat/route.ts`) — the project documentation is a single
  template literal (`zeduDocContent`) copied from `HNG 15 Task Document.txt` and paired
  with a "Zoe" system prompt that forbids inventing answers. The route requires a
  signed-in session (`getUnauthorizedResponse()` calls `getServerSession`) and answers
  `401 {"error":"Unauthorized"}` without one.
- **Upload → ingest** (`/api/upload` → `/api/ingest`) — `/api/upload` writes the file to
  `DATA_DIR` with a `<uuid>.json` sidecar (`status: STAGED`). `/api/ingest` parses the
  file (unpdf for PDFs), asks Groq for the three-section summary, appends it to
  `DATA_DIR/knowledge.md` and marks the sidecar `INGESTED`. Ingestion runs only when you
  call it with the shared secret; the upload UI does **not** trigger it. `knowledge.md`
  is **not yet read by the chat route**.
- **Auth** — NextAuth Google provider with JWT sessions (`src/lib/auth.ts`), wrapped around
  the app by `src/app/layout.tsx` through `SessionProvider`
  (`src/components/auth-provider.tsx`). **`NEXTAUTH_SECRET` is required** — without it
  NextAuth throws `MissingSecretError`, and because the chat route catches that, users see
  a `500` instead of a `401`.
- **Persistence** — migrations exist under `prisma/migrations/` (`User`, `Chat`,
  `Message`), but the chat routes do not read or write them yet.

## Deploy

Deployment is **Coolify** using the `Dockerfile` build pack on port 3000, driven by
`.github/workflows/deploy.yml`.

1. Push to `main`.
2. `Malware Scan (CI Gate)` runs on the push.
3. Only if that scan succeeds does `Deploy (Coolify)` fire the webhook.

Fork/repo secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `COOLIFY_WEBHOOK_URL` | Yes | Deploy webhook. The workflow fails when it is unset. |
| `COOLIFY_TOKEN` | No | Sent as a bearer token when present. |
| `PROJECT_AUTOMATION_TOKEN` | For the board | Lets `assign-to-ready.yml` move assigned issues to the project's Ready column. |

Run the check CI runs for the malware gate locally before pushing workflow-adjacent
changes: the scan fails a PR if changed files match its signature list
(see `.github/workflows/malware-ci-gate.yml`).

## Contributing

Work is tracked as tickets on the team board and lands through a PR into **`dev`**;
`main` is the deploy branch. `AGENTS.md` has the agent-facing version of these rules.

- **Branch:** `<type>/<ticket-id>-<short-description>`, e.g. `feat/neo-018-copy-chat-responses`.
- **Commits:** Conventional Commits with the ticket as scope, e.g. `fix(neo-20): auto-scroll chat to latest message`.
- **One ticket per PR**, from a branch off `dev`. Don't push to `main` or `dev`.
- **Fill in `.github/PULL_REQUEST_TEMPLATE.md`** — ticket link, what changed, why, how to
  test, expected behaviour, evidence, and the AI-usage line.
- **Secrets stay out of git.** `.env` is gitignored; never commit API keys or tokens.

## Status

Shipped: the chat UI and Groq proxy, Google sign-in, upload with a solid accessible UI,
and the ingest pipeline.

Not done yet (see `PRD.md` for the full scope):

- [ ] Knowledge-base lifecycle: active/archived documents and token counts.
- [ ] Feed `knowledge.md` into the chat context instead of the hardcoded string.
- [ ] Admin review step before an ingested document becomes active.
- [ ] Chat sessions and messages persisted (`/api/chat/history` is a stub).
- [ ] Quick-prompt buttons and upvote/downvote feedback.
- [ ] RBAC (contributor vs admin). `/api/chat` already requires a session, but it does not
      check roles.
- [ ] `.vtt` and `.docx` uploads; streaming replies.

Known issues: `prisma/schema.prisma` is not committed (only its migrations are), so
`npm install`'s `prisma generate` step has nothing to generate from; `route-old.ts` is a
dead file kept only for reference; and `/api/chat/history` is prerendered as static
content at build time, so it cannot return live data without `dynamic = "force-dynamic"`.
Run `npm install --ignore-scripts` (or add the missing `prisma/schema.prisma`) to get past
the broken `postinstall`.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Chat returns `Error: ...` | `AI_API_KEY` is set and has quota. The error text is the Groq message. |
| Chat returns `401 {"error":"Unauthorized"}` | Expected with no session. Sign in with Google first. |
| Chat returns `500 {"error":"Unable to process your chat request."}` | Almost always a missing or invalid `NEXTAUTH_SECRET` — NextAuth throws before the request reaches Groq. Look for `NO_SECRET` in the server log. |
| `/api/auth/*` returns `500` | Same cause: `NEXTAUTH_SECRET` is not set. |
| `npm install` fails at `prisma generate` | `prisma/schema.prisma` is missing from the repo. Use `npm install --ignore-scripts`. |
| Ingestion returns `503` | `INGEST_SECRET` (and `AI_API_KEY`) are set. Send the secret in the `x-ingest-secret` header. |
| Sign-in does nothing | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET` and `NEXTAUTH_URL`; the redirect URI must be registered on the Google client. |
| Upload says "could not be confirmed" | Check the service owner before retrying — the file may already be staged on the server, and retrying can duplicate it. |
| `npm start` complains about the port | The script uses `${PORT:-3000}`, which `cmd.exe` does not expand. Run `npx next start -p 3000` instead. |

## Related projects

The rest of Zedu lives beside this repo: `zedu-fe` (web), `zedu-be` (API),
`zedu-mobile` and `zedu-desktop`. Each has its own `CONTRIBUTING.md`; test and branch
against your team's fork, not production.
