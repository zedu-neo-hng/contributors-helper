# [2026-10-07] ZEDU Internship — Lesson 5 | Week 2: Squad Consolidation, Redesign Mandate & PR Review Gates

- **Date:** 2026-10-07
- **Duration:** 02:01:30
- **Source URL:** `https://www.youtube.com/watch/h_xLAOhDnsw`
- **Speakers:** Mark Essien (Chief Mentor), Avi (Coordinator), Jeffrey (Lead Reviewer), Student Demos (Bundi, Mean Eam, Tech 9, Damas), Q&A Participants
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-07_lesson_5_week_2_reorg_redesign_contributions.md`

---

## Session Overview & Context

Major cohort milestone marking the end of solo intro tasks and transitioning 100% of the cohort into direct Zedu production contributions. Introduces the consolidation of squads into 10 active teams, equity ownership allocations for contributors, the mandatory UI/UX redesign task for all tracks, and the multi-tier review bot and PR preview infrastructure.

---

## Key Highlights & Directives

1. **Squad Reorganization (10 Active Teams):**
   - Disbanding inactive and ghost squads; consolidating active contributors into 10 high-performing squads.
   - Establishing a temporary "no-team" holding pool for contributors catching up on previous milestones.
2. **Equity & Ownership in Zedu:**
   - Zedu is structured as a community project. Contributors whose PRs merge into production receive points converted into equity shares.
   - A public shareholders ledger will document contributor equity stakes.
3. **The 5 Deliverables for the Week:**
   - **Task 1 (Implement Approved Ticket):** Minimal, laser-focused fixes. Avoid broad AI refactors; large diffs will be rejected.
   - **Task 2 (Redesign Something in Zedu):** Mandatory for *all* participants regardless of background (developers, backend engineers, and designers alike). Screenshot existing UI, generate an improved mockup with Claude/ChatGPT, submit as a design ticket, and implement.
   - **Task 3 (Team Feature Spec):** Squads collaborate to design and spec out a small new feature (e.g., Cohorts, Bingo, Shareholders page, Zedu City).
   - **Task 4 (Marketing Contribution):** Product changes (SEO keywords, metadata, OG tags, viral invite links) or directory submissions (Reddit, Product Hunt).
   - **Task 5 (Mobile or Desktop Fix):** Submit a bug fix specifically targeting the Mobile or Desktop clients to rebalance away from web-only PRs.
4. **Pull Request Workflow & Review Gates (Jeffrey & Mark):**
   - PRs target `zedu-hng/zedu-fe:dev`.
   - Each PR automatically generates an isolated live preview URL at `https://<pr-number>.preview.groups.zedu.chat` (capped at 30 concurrent runners).
   - For frontend changes requiring unmerged backend endpoints, add `Backend URL: https://api.<team>.groups.zedu.chat` in the PR body.
   - Team lead must review and approve first before the ticket enters the main reviewer triage queue.

---

## Verbatim Transcript & Segments

### `[20:05]` **Mark Essien** (Chief Mentor) — Ending Solo Tasks & Transitioning to Zedu
> "You should have completed all your personal work as of last week. We are moving on now. What we are going to be working on moving forward is only Zedu contribution. Every other thing, we don't want to see it anymore. It's not relevant to us any longer. Right now, everybody's going to be working on Zedu... The ticket that most people were given was to prepare basically what they are going to work on. So you are supposed to get a ticket approved that you can work on for Zedu on the repository. We have approved a lot of them. When you see 'ready for dev', that means it's approved... It does not mean that that flaw is assigned to you. You can write a comment saying 'I would like to work on this particular ticket'. Please do not work on a ticket if it has not actually been assigned to you."

### `[24:45]` **Mark Essien** (Chief Mentor) — Zedu Shares & Reducing to 10 Teams
> "Zedu is a community project. We are cloning Slack. We're making a better Slack for educational bootcamps. If you contribute and your contribution is accepted, you're going to gain some points and those points will be rewarded with Zedu shares. That means you are going to be a co-owner of Zedu...  
> Point number two: we are going to reduce the number of teams to 10. That means the new leaders will be creating brand new Telegram channels for only active people, so that we don't have those silent people in the teams. There should be one catch-all team for people still behind until they catch up."

### `[32:05]` **Mark Essien** (Chief Mentor) — The Redesign Mandate
> "Now we are doing design, but the twist is: everybody is becoming a designer. Just like everybody became a coder, now everybody will become a designer. Nobody is exempt. Whether you were backend coder before, DevOps, systems engineer, you are now a designer. AI is giving all of us the same footing.  
> You are going to make a design enhancement of the existing app. Pick the mobile app, desktop app, or web app, find something small and very specific, and redesign it. Take a screenshot of the app, paste it into Claude, describe the redesign you want, and submit a screenshot of how it was and how it should become. Design is about taste and making things easier for humans."

### `[01:40:20]` **Jeffrey** (Lead Reviewer) & **Mark Essien** — Preview URLs & Review Gates
> **Jeffrey:** "The process that we feel is going to be simpler is that everything comes into `zedu-hng` as a PR, and on each PR you get a preview URL. So the builds run and you get a preview link... Automatically the PR is going to ask your team lead to review this PR. If your team lead approves it, it comes into the reviewers' hands to take a look... If you put 'Backend URL: <link>' in the PR description, it will build the preview using that backend URL... Out of 166 open PRs on FE, we just have like 10 valid. The rest fail builds, fail security checks, or haven't been reviewed by team leads."

---

## Key Action Items & Ground Rules

- **Minimal Changes:** Never let AI touch dozens of files. PRs exceeding ~400 lines or changing unrelated components face immediate rejection.
- **Two-Step Ticket Assignment:** Ticket must have `ready for dev` label AND you must claim it via comment before writing code.
- **Preview URL Validation:** Verify your UI changes visually on your PR preview link before requesting squad lead signoff.
