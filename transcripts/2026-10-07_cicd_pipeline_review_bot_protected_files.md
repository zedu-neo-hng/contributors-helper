# [2026-10-07] Session 3: CI/CD Pipeline, The Review Bot & Protected Files Survival

- **Date:** 2026-10-07
- **Duration:** 42:10
- **Speakers:** Sarah Connor (DevOps Lead), Eric V. (Review Bot Architect), Alex M. (Lead Reviewer)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-07_cicd_pipeline_review_bot_protected_files.md`

---

## Session Overview & Context

Comprehensive examination of automated PR checks, Gitleaks secret scanning, Semgrep security scans, live preview hosting, and the list of protected files.

---

## Verbatim Transcript & Segments

### `[00:20]` **Sarah Connor** (DevOps Lead)

> "When you open a PR, automated checks trigger: Prettier (check-format), ESLint (check-lint), TypeScript (check-types), pnpm build, Gitleaks, Semgrep, and ClamAV. In addition, PR rules checks your branch name, PR title, single author, and protected files. If ANY of these fails, your PR is blocked."

### `[04:40]` **Eric V.** (Review Bot Architect)

> "This is the number one cause of tears for new contributors: PROTECTED FILES! The bot strictly forbids editing: .github/, AGENTS.md, CONTRIBUTING.md, eslint.config.mjs, .prettierrc, tsconfig.json, next.config.mjs, postcss.config.*, tailwind.config.*, commitlint.config.cjs, .gitleaks.toml, .semgrepignore, .husky/, or .npmrc. Unless a reviewer added config-change-approved, editing these will immediately fail your PR."

### `[10:20]` **Sarah Connor** (DevOps Lead)

> "Every PR gets an automatic preview URL at https://<pr-number>.preview.groups.zedu.chat pointing to api.zedu.chat. If your frontend depends on unmerged backend work, add 'Backend URL: https://api.<team>.groups.zedu.chat' in the PR body. This safely blocks merging until the backend goes live."

### `[16:20]` **Eric V.** (Review Bot Architect)

> "PRs are squash merged into dev, so your PR title becomes the commit message on dev! It MUST follow Conventional Commits: <type>(<scope>): <subject in lowercase with no trailing period>. If you write 'Added button.', commitlint will fail the PR immediately."

---

## Key Action Items & Ground Rules

- **Protected Files:** NEVER modify `.github/`, `AGENTS.md`, `CONTRIBUTING.md`, `tsconfig.json`, `next.config.mjs`, `eslint.config.mjs`, or styling configs without maintainer approval.
- **PR Titles & Commits:** Squash-merged into `dev`. Follow Conventional Commits: `<type>(<scope>): <lowercase subject>` with no trailing period.
- **Live Previews:** Hosted at `https://<pr-number>.preview.groups.zedu.chat`. Use `Backend URL: ...` in PR body if blocked on unmerged backend.
