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
