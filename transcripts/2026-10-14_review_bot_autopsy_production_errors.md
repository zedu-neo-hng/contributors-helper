# [2026-10-14] Session 7: Review Bot Autopsy: Real Errors from Production Batches

- **Date:** 2026-10-14
- **Duration:** 32:40
- **Speakers:** Eric V. (Review Bot Architect), Sarah Connor (DevOps Lead)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-14_review_bot_autopsy_production_errors.md`

---

## Session Overview & Context

Examination of real-world failures from review-report.md in the zedu-fe codebase, explaining component tree violations, hardcoded CDN URLs, and ESLint on changed files.

---

## Verbatim Transcript & Segments

### `[00:45]` **Eric V.** (Review Bot Architect)

> "In review-report.json, an intern added channel-management.tsx directly inside src/app/(client)/[org]/home/channels/[id]/settings/. The bot immediately failed: 'New component outside allowed trees. Use src/components/ui/, _components/, or settings components.' Route-local components MUST live in private _components/ folders!"

### `[05:20]` **Sarah Connor** (DevOps Lead)

> "The second error in review-report.md was src/utils/apple-emoji.tsx having a hardcoded CDN URL: 'https://cdn.jsdelivr.net/...'. The bot flagged: 'Put base URLs and secrets in environment variables (process.env.NEXT_PUBLIC_BASE_URL)'. Raw CDN URLs violate Content Security Policies and break offline testing."

### `[09:40]` **Eric V.** (Review Bot Architect)

> "The third finding was 'ESLint reported issues in changed files'. An intern bypassed Husky locally using --no-verify. When the PR hit GitHub runners, the automated lint check failed and blocked the merge. Fix code locally with pnpm lint:fix instead of bypassing Husky."

---

## Key Action Items & Ground Rules

- **Component Trees:** Bot rejects loose component files outside `_components/` or `src/components/ui/`.
- **Environment Variables:** Never hardcode external CDN URLs; configure via `NEXT_PUBLIC_*`.
- **Lint Compliance:** Run `pnpm lint:fix` and `pnpm check-lint` locally to avoid automated CI rejections.
