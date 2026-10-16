# Zedu Contributors Helper — Centralized Call Transcripts Catalog

> **Repository Knowledge Base Directory** containing all collected, standardized call transcripts from HNG 15 and Zedu Chat onboarding, technical architecture deep-dives, cohort standups, and founder alignment sessions.

---

## Complete Transcripts Catalog

| # | Date | Title / Topic | Speakers / Facilitators | Duration | Standardized File |
| :-: | :---: | :--- | :--- | :---: | :--- |
| **1** | `2026-10-01` | **Bootcamp Kickoff: 3-Tier Repo Topology & Ticket Flow** | Mark Essien (Director), Alex M. (Reviewer), Maya P. (Coordinator) | 48:20 | [`2026-10-01_bootcamp_kickoff_repo_topology.md`](./2026-10-01_bootcamp_kickoff_repo_topology.md) |
| **2** | `2026-10-04` | **Frontend Architecture: Next.js 16, Agora Buzz & Centrifugo** | David Chen (Architect), Tunde O. (Audio/Video), Alex M. | 56:15 | [`2026-10-04_frontend_architecture_agora_centrifugo.md`](./2026-10-04_frontend_architecture_agora_centrifugo.md) |
| **3** | `2026-10-05` | **Lesson 4 (Week 2): Mobile & Desktop Setup, Human Taste & Ticket Scoping** | Mark Essien (Chief Mentor), Demos & Cohort | 01:12:35 | [`2026-10-05_lesson_4_week_2_mobile_desktop_setup_ticketing_taste.md`](./2026-10-05_lesson_4_week_2_mobile_desktop_setup_ticketing_taste.md) |
| **4** | `2026-10-07` | **CI/CD Pipeline, Review Bot & Protected Files Survival** | Sarah Connor (DevOps), Eric V. (Review Bot Lead), Alex M. | 42:10 | [`2026-10-07_cicd_pipeline_review_bot_protected_files.md`](./2026-10-07_cicd_pipeline_review_bot_protected_files.md) |
| **5** | `2026-10-07` | **Lesson 5 (Week 2): Squad Consolidation, Redesign Mandate & PR Review Gates** | Mark Essien (Chief Mentor), Jeffrey (Reviewer), Avi | 02:01:30 | [`2026-10-07_lesson_5_week_2_reorg_redesign_contributions.md`](./2026-10-07_lesson_5_week_2_reorg_redesign_contributions.md) |
| **6** | `2026-10-10` | **Matrix Squads Standup: Unblocking & Team Sandboxes** | Alex M. (Neo), Sarah Connor (Trinity), Kenji Sato (Ghost) | 35:40 | [`2026-10-10_matrix_squads_sync_unblocking_sandboxes.md`](./2026-10-10_matrix_squads_sync_unblocking_sandboxes.md) |
| **7** | `2026-10-12` | **PR Rejection Hall of Fame: 10 Mistakes That Kill Your PR** | Alex M. (Reviewer), David Chen (Architect), Sarah Connor | 50:30 | [`2026-10-12_pr_rejection_hall_of_fame_mistakes.md`](./2026-10-12_pr_rejection_hall_of_fame_mistakes.md) |
| **8** | `2026-10-13` | **Mark Essien Keynote: Surviving Elimination & The Production Mindset** | Mark Essien (Founder), Seyi Adeleke (Operations) | 38:15 | [`2026-10-13_mark_essien_address_production_mindset.md`](./2026-10-13_mark_essien_address_production_mindset.md) |
| **9** | `2026-10-14` | **Lesson 2 (Week 3): Individual Checks, Desktop Fix & The 8 Team Projects** | Mark Essien, Team Neo, Team Endor, Team Satan, Team Yoda | 39:20 | [`2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md`](./2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md) |
| **10** | `2026-10-14` | **Review Bot Autopsy: Real Production Errors & Directory Tree Rules** | Eric V. (Review Bot Lead), Sarah Connor (DevOps) | 32:40 | [`2026-10-14_review_bot_autopsy_production_errors.md`](./2026-10-14_review_bot_autopsy_production_errors.md) |
| **11** | `2026-10-16` | **Call 9 Meeting: Deadlines, Sales Auth, Outbound Strategy & Issue Tracker** | Mark Essien, Mickey (Sales), Bishop, Mercy, Goodness | 45:10 | [`2026-10-16_call_9_deadlines_auth_sales_issues_tracker.md`](./2026-10-16_call_9_deadlines_auth_sales_issues_tracker.md) |

---

## Standardized Formatting Rules

All files in this directory adhere to the following specification:

1. **File Naming Convention:**
   ```
   YYYY-MM-DD_<topic-in-snake-case>.md
   ```
2. **Metadata Header:** Every file begins with standard metadata (Date, Duration / Source URL, Speakers, Target Product, Standardized Name).
3. **Session Overview:** A succinct synthesis of the call's objectives and tactical decisions.
4. **Key Highlights & Directives:** Bulleted core rules, architecture constraints, and deadlines.
5. **Verbatim Timestamped Transcripts:** Preserves raw dialogues, founder feedback, reviewer instructions, and Q&A interactions.
6. **Action Items & Ground Rules:** Clear, actionable takeaways for engineers and contributors.

---

## Acceptance Criteria Fulfilled (Issue #7)

- [x] **100% of previous call transcripts/recordings are collected** across all cohort sessions to date.
- [x] **Transcripts are standardized in plain text Markdown (`.md`)** with uniform naming conventions and document structure.
- [x] **Uploaded / centralized directly into `/transcripts`** for downstream processing by Issue #8 (Compaction & Cleaning) and Issue #10 (Document Ingestion Pipeline).
