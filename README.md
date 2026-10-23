# Contributors Helper

Simple chat page where contributors ask questions about our team calls. No database or auth.
The AI reply (based on call transcripts) is a placeholder in `src/app/api/chat/route.ts`.

```bash
npm install && npm run dev
```

## Deploy (Coolify)

Dockerfile build pack, port 3000. GitHub secrets: `COOLIFY_WEBHOOK_URL` (optional `COOLIFY_TOKEN`).
The `Deploy (Coolify)` workflow runs only after `Malware Scan (CI Gate)` passes on `main`.

## Live

https://contributors.zedu.chat

## Multiline composer checks

Run `npm ci`, `npx playwright install chromium`, then `npm run test:e2e`.
The current `dev` snapshot is missing `prisma/schema.prisma`, so its existing
postinstall step fails. For composer-only checks, use `npm ci --ignore-scripts`
until the database schema is restored; this does not validate database setup.
The tests start the local app on port 3024 and mock Google session and chat
responses, so no account, AI credentials, or paid requests are required.
They cover multiline payloads, keyboard/IME handling, duplicate submissions,
failure recovery, and desktop/narrow-screen layout. To use an installed Edge
browser locally, set `PLAYWRIGHT_CHANNEL=msedge` instead of installing Chromium.
