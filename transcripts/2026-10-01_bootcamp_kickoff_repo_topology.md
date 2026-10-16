# [2026-10-01] Session 1: Bootcamp Kickoff & 3-Tier Repo Topology

- **Date:** 2026-10-01
- **Duration:** 48:20
- **Speakers:** Mark Essien (Program Director), Alex M. (Lead Reviewer), Maya P. (Squad Coordinator)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-01_bootcamp_kickoff_repo_topology.md`

---

## Session Overview & Context

Explains the foundational three-tier GitHub repository hierarchy, ticket traceability, strict branch naming, and the ~400 lines shippable slice rule.

---

## Verbatim Transcript & Segments

### `[00:45]` **Mark Essien** (Program Director)

> "Welcome everyone to HNG 15! In this cohort, you are working on Zedu Chat, an education-first collaboration workspace. We are operating at scale with hundreds of contributors, so process is everything. If you violate the workflow, your PR will not be merged, period."

### `[02:30]` **Alex M.** (Lead Reviewer)

> "Let me explain the 3 repositories so no one gets confused. At the top is zeduchat/zedu-fe. That is the core production repository owned by in-house maintainers. You will NEVER touch it or open a PR against it. Underneath is zedu-hng/zedu-fe. That is the review organization where all HNG work is reviewed and landed into the dev branch. At the bottom is your team fork, like zedu-neo-hng/clean-zedu-fe. Your team lead created this fork once. You clone your team fork. You do NOT create personal forks!"

### `[06:20]` **Alex M.** (Lead Reviewer)

> "Every single line of code must trace back to an approved ticket in ClickUp or Linear. Your branch must follow the exact syntax: <type>/<ticket-id>-<short-description>. Types are feat, fix, hotfix, test, docs, refactor, chore, perf, security. If your branch name deviates, the automated PR check will immediately fail."

### `[10:10]` **Maya P.** (Squad Coordinator)

> "Pay attention to PR size! We enforce ~400 lines of meaningful code max. Why? Because reviewers cannot review a 3,000 line PR in detail. Also, Zedu has NO feature-flag system! Whatever merges into dev must immediately work and have no half-finished broken UI exposed to users. Break large features into sequential shippable slices."

---

## Key Action Items & Ground Rules

- **Repository Topology:** Upstream `zeduchat/zedu-fe` (production) -> `zedu-hng/zedu-fe` (review org dev branch) -> Squad Fork (clone locally). Never create personal forks.
- **Branch Naming:** Strictly `<type>/<ticket-id>-<short-description>` (e.g., `feat/neo-010-upload-ingest`, `chore/neo-007-collect-transcripts`).
- **PR Size Limit:** Max ~400 lines of meaningful code. No feature flags; every merge must be an atomic shippable slice.
