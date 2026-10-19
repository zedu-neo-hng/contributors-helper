# Contributors Helper

Contributors can ask Zoe questions about Zedu project tasks and rate assistant replies. Administrators can review persisted ratings, approval rate, recent trends, and optional downvote comments in the feedback dashboard. The overview shows the latest seven ratings; the Feedback page contains the full history with rating filters and pagination.

## Run locally

```bash
npm install
copy .env.example .env
```

Set `AI_API_KEY` for chat and replace the admin username, password, and session secret in `.env`. Next.js loads `.env` for local development, and Git ignores it. `ADMIN_SESSION_SECRET` must contain at least 32 characters. Then run:

```bash
npm run dev
```

Open http://localhost:3000 for chat and http://localhost:3000/admin/feedback for the admin dashboard. Admin credentials are configured by the server environment; no public registration or client-side admin role is used.

## Feedback persistence

Ratings are written to the JSON file configured by `FEEDBACK_DATA_FILE` (default `./data/feedback.json`). The file is excluded from Git. On Coolify, mount a persistent volume at `/app/data` and set `FEEDBACK_DATA_FILE=/app/data/feedback.json` so records survive container replacement. This file store is designed for a single app instance; use a shared transactional database before scaling to multiple instances.

Feedback records contain a response ID, rating, optional downvote comment, and timestamps. The dashboard API requires a signed, HttpOnly admin session. Sessions expire after eight hours. Configure `ADMIN_ROLE=admin` or `lead` to identify the configured account's role; `admin` is the default.

## Deployment

The existing Dockerfile and Coolify workflow are preserved. The app listens on port 3000. Set `AI_API_KEY`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` as server-side environment variables in Coolify. Configure the persistent volume described above. Deployment continues to run only after the existing Malware Scan (CI Gate) succeeds on `main`.

Live: https://contributors.zedu.chat
