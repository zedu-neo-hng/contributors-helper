# [2026-10-10] Session 4: Matrix Squads Sync: Unblocking & Team Sandboxes

- **Date:** 2026-10-10
- **Duration:** 35:40
- **Speakers:** Alex M. (Squad Lead Neo), Sarah Connor (Squad Lead Trinity), Kenji Sato (Squad Lead Ghost)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-10_matrix_squads_sync_unblocking_sandboxes.md`

---

## Session Overview & Context

Practical workflow for squads (Neo, Trinity, Ghost, Dozer, Keymaker, Niobe, Oracle), team staging sandboxes on <team>.groups.zedu.chat, and unblocking protocols.

---

## Verbatim Transcript & Segments

### `[00:40]` **Alex M.** (Squad Lead Neo)

> "Never sit silently when blocked! Post in your squad channel with: 1) Ticket ID, 2) What you were trying to do, 3) Exact error/screenshot, 4) What you already tried. Without these four, nobody can help you effectively."

### `[05:10]` **Kenji Sato** (Squad Lead Ghost)

> "Your team fork has a branch called staging. This is your squad sandbox on <team>.groups.zedu.chat where your lead merges ticket branches to test them live. But NEVER open a PR into zedu-hng from staging! PRs must strictly originate from ticket branches."

### `[10:10]` **Sarah Connor** (Squad Lead Trinity)

> "Before opening a PR, always pull latest dev from your team fork and rebase. If there are merge conflicts, resolve them locally on your machine before requesting review."

---

## Key Action Items & Ground Rules

- **Unblocking Protocol:** Post in squad channel with: Ticket ID, Expected action, Exact error/screenshot, and Attempted solutions.
- **Team Sandbox:** Use squad `staging` branch for internal previews, but PRs must originate strictly from ticket branches into `zedu-hng:dev`.
