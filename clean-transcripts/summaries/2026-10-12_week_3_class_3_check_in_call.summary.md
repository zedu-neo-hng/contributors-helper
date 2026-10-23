# 2026-10-12 - HNG 15 Week 3, Class 3 / Check-In Call

- **Clean transcript:** `clean-transcripts/transcripts/2026-10-12_week_3_class_3_check_in_call.cleaned.md`
- **Raw transcript:** `transcripts/2026-10-12_week_3_class_3_check_in_call.md`
- **Date:** 2026-10-12
- **Source URL:** not published
- **Ticket:** #8 (neo-008)

## Meeting Summary

Week-3 check-in run by Mark, with Sodiq as infrastructure owner; teams presented deployed work to be scored. Only live work scored: Cybatron (Start.ng) and Yoda zero; Endor (Bug Tracker) and Volkan (Marketing Dashboard) scored. Work must now run on internal Coolify/GitHub infra (Vercel rejected) and the internal DB; password sign-in becomes Google OAuth, and 7:00 PM scores Create/Read on the live DB.

## People & Roles

- **Mark** - ran the call; set criteria, awarded/refused points.
- **Sodiq** - infra owner; set up all team repos, Coolify auto-deploy, team-lead invites and DB vars; invited Dave to the Cybatron repos.
- **Alexin** - Team Veda (CRM dashboard); asked how to host the team task.
- **Hamzat** - Team Cybatron (Start.ng); not team lead; ran locally for lack of Cloudflare access.
- **Dave** - Team Cybatron; joined mid-call; worked locally, pushed nothing.
- **Goodness / Mickey** - Team Endor ("Zedu Endor"); presented `contributors.zedu.chat/zedubugs`, said the sign-in form was their work.
- **Bishop** - Team Volkan; live URL with working login; used Neon DB locally only.
- **Avi** - replied to Goodness; questioned authentication points; asked about a "game thing".
- **Ifechukwu** - Team Yoda; team lead unavailable; presented a demo link, got zero.

## Key Decisions

- Localhost-only work and Vercel (`vercel.app`) deployments score zero; work must be live on internal Coolify/GitHub infrastructure.
- External cloud DBs (e.g. Neon) not allowed in production; use the internal DB (Neon ok locally only).
- Cybatron (Start.ng): Team Task Live 0, Working 0.
- Endor (Bug Tracker): 1 point Team Task Live, 2 total; remove normal sign-in, Google sign-in only.
- Volkan (Marketing Dashboard): 1 point Team Task Live, 1 point Authentication; DB and Team Task Working not yet.
- Yoda: zero - Vercel preview, not internal Coolify.
- Next session needs a merged/submitted PR; "CR" (Create and Read list, from CRUD) = 3 points; "Team Task You[?]" (updates) = 1.
- PR notices under Zedu's "New Feature Alert" earn points, up to 10 per day.

## Guidelines & Process

- Push to the team's GitHub repo; a push deploys live. Env vars go in Coolify, not `.env`.
- DB variable names are in `env.example`; teams that do not hardcode connect to the Coolify DB automatically. The Dockerfile has migration steps.
- Repo access goes to team leads who message Sodiq their email.
- No public sign-up; the tooling is internal.
- Bug tracker (Endor): Google login for anyone; a ticket (description, title, save) appears in a long list (like news.ycombinator.com or Reddit) and can be voted up/down. Purpose: group consensus on the most important bugs, not a full tracker.
- Marketing dashboard (Volkan): track quantities - pages, directories submitted to, optionally traffic per item. A "directory" is where you list your SaaS (Reddit, AlternativeTo) or press (TechCrunch, TechCabal).

## Deadlines & Dates

- Next check-in: "by 7:00 PM" - *2026-10-12, 7:00 PM (computed)*; registration link dropped in chat, next points evaluated then.
- Possible earlier review: "6:00 PM if we have enough people" - *2026-10-12, 6:00 PM (computed)*, for teams at Endor's level.
- PR drops: "up to 10 in a day" - *per day (computed)*.
- An earlier call the same day ("the call we had earlier today" / "this morning") has no stated time.

## Action Items

- [ ] Sodiq: provide Google login credentials for the bug tracker.
- [ ] Endor (Goodness): remove normal sign-in, fix Google auth, connect the Coolify DB, show add-ticket/vote list.
- [ ] Volkan (Bishop): use the Coolify DB instead of Neon; build content/directory quantity tracking.
- [ ] Cybatron (Dave, Hamzat): get repo access and push the home page and API live.
- [ ] Avi: handle the "game thing" (Mark: prompt for a Three.js game with a concept).
- [ ] All teams: drop merged-PR notices under "New Feature Alert".

## Q&A

**Q (Alexin, Veda): How do we host the team task?**
Set up already; team leads invited, they only need access.

**Q (Hamzat, Cybatron): Why is the work only local?**
Mark is not interested in local work; Hamzat blamed missing Cloudflare access, but Mark said the repo is unrelated to Cloudflare, the site sits on their own servers, and the worker is only one of four parts.

**Q (Goodness, Endor): Can Mark give the point?**
Yes - the `zeduchat/bugtracker` code was judged the team's work; 1 point Team Task Live, then drop normal sign-in.

**Q (Goodness, Endor): Can you connect to the Coolify DB?**
Not yet. Mark: set env vars in Coolify, not `.env`. Sodiq: follow `env.example`; it connects on deploy.

**Q (Bishop, Volkan): I used Neon DB.**
Mark: not allowed for production; use our own. Sodiq: fine locally only.

**Q (Bishop, Volkan): What is a "directory"?**
A place to list your SaaS (Reddit, AlternativeTo) or press (TechCrunch, TechCabal).

**Q (Ifechukwu, Yoda): Why is it a zero?**
Vercel (`vercel.app`) not accepted - show it on their own infrastructure.

**Q (Avi): I thought Sodiq already handled that with them?**
Mark does not know; told Avi to go ahead now.

## Unresolved / Needs Verification

- "Goodness / Mickey": one person or two not stated; the speaker calls himself "Mickey" [?].
- "Team Task You" (described as "that's, updates") - garbled [?].
- "Thank you, Price" - "Price" unexplained [?].
- The "game thing" exchange has no clear referent; who asked Avi is unstated [?].
- "Zedu Preflight" (the Vercel app name): Mark asks what "Preflight" means; never explained.
- Start.ng Cloudflare worker / R2: "free at 10 GB" per month but not allowing Sodiq because "something was removed" / "R2 subscription was removed".
- Hamzat says Sodiq withheld Cloudflare access, Sodiq says he invited Dave; not reconciled.
- Whether the 6:00 PM review and the 7:00 PM check-in are one or two events is ambiguous.
