# [2026-10-12] Session 5: PR Rejection Hall of Fame: 10 Mistakes That Kill Your PR

- **Date:** 2026-10-12
- **Duration:** 50:30
- **Speakers:** Alex M. (Lead Reviewer), David Chen (Frontend Architect), Sarah Connor (DevOps Lead)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-12_pr_rejection_hall_of_fame_mistakes.md`

---

## Session Overview & Context

Post-mortem review of rejected PRs, covering single author failures, committing .env secrets, missing test recordings in UI PRs, and drive-by refactoring.

---

## Verbatim Transcript & Segments

### `[00:50]` **Alex M.** (Lead Reviewer)

> "Mistake #1: Single Author check failure. A contributor committed with two different emails from home and school. Fix: Add all commit emails to your GitHub profile or squash commits into one verified author. Credit helpers with 'Co-authored-by: Name <email>' trailers."

### `[06:20]` **Sarah Connor** (DevOps Lead)

> "Mistake #2: Committing .env or secrets. Gitleaks checks full git history, so deleting the secret in a later commit still fails. Also, never bypass Husky hooks using git commit --no-verify! If Husky fails locally, CI will fail on GitHub anyway."

### `[11:50]` **David Chen** (Frontend Architect)

> "Mistake #3: Missing video proof in PR template. If your ticket touches UI, attaching a screen recording is mandatory. Reviewers will not guess how your UI looks; missing media results in immediate rejection."

### `[17:30]` **Alex M.** (Lead Reviewer)

> "Mistake #4: Scope creep and drive-by refactors. Only touch what your ticket asked for. Do not rename unrelated files or update packages. Open separate tickets for unrelated bugs."

---

## Key Action Items & Ground Rules

- **Single Author Rule:** Ensure all commit emails match your GitHub account or squash commits before review.
- **Secrets Scanning:** Gitleaks scans entire history. Never commit `.env` or API keys. Never bypass Husky hooks with `--no-verify`.
- **PR Evidence:** Mandatory test recordings/screenshots for UI changes in PR descriptions.
