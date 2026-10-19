# 2026-10-14 - Week 3 Lesson 2: Individual Checks, Desktop Fix and the 8 Team Projects

- **Clean transcript:** `clean-transcripts/transcripts/2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.cleaned.md`
- **Raw transcript:** `transcripts/2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md`
- **Date:** 2026-10-14
- **Source URL:** <https://www.youtube.com/watch/K00Ed98fch8>
- **Ticket:** #8 (neo-008)

## Meeting Summary
Mark ran a short Week 3 call closing the previous week's work and setting the next stretch: individual checks due that day, the week's individual tasks (desktop fix, 3JS game on StartNG, high-vote ticket) and eight team projects claimed live by raising hands. He answered questions on StartNG, the issue tracker, the help platform and the automated tester.

## People & Roles
- **Mark** — host; presented the checks, tasks and eight projects; sole StartNG environment access; shared the slide.
- **Umar Python** (also "Omar") — asked about individual tasks; asked about project one (voting, GitHub link, fields).
- **Dave Tulu** — asked about Start.ng; spoke for **Team Satan** (project five, StartNG).
- **Elijah** — asked about the >10-vote rule and collisions.
- **AI and data scientist [?]** — asked about transcripts; team took project seven (help platform).
- **Hamzat** — asked for the slide; asked whether the game/desktop fix need tickets.
- **Emmanuel Young** — said PRs are harder than the tasks.
- **Benjamin** — **Team End** (project one).
- **Michael** — asked about the marketing dashboard; team took project six (sales).
- **Bishop** — **Team Vulcan** (project two, marketing dashboard).
- **Faith** — **Team Yoda** (project eight, automated tester); team lead **Jenny** was absent.
- **Jenny** — Team Yoda team lead, absent.
- **DG** — **Team Roots** (project four, iOS push notifications).
- **Zu Mandu** (also "Mando") — a team picking project two; "Team Zumando" [?] was later named for project three (Android push notifications).
- **Avi** — to make a video on building a game with AI.
- **Lal** — "the game master"; told to collaborate.

## Key Decisions
- Each team picks one of the eight projects; first come, first served by raising a hand.
- Project one (issue tracker) is standalone with no GitHub link; it blocks everybody if not done in a day. Team End took it.
- Tickets need more than 10 votes from fellow participants; once taken, taken.
- The desktop fix needs a ticket but does not wait for the new ticketing platform; arrange approvals (~4–5, no duplicates, team repo before central).
- The game must use the Start.ng API for characters; a logged-in user should still see their character.
- The help platform needs no RAG or database — put the cleaned document in the system prompt.

## Guidelines & Process
- Closing check: PR merged in the team repo (working), a testing video as a PR comment, and included in a PR to central staging.
- Pipeline: validate/test PRs in-team; branch all PRs to Zedu for review; the testing script runs and reports; a PR opens to central staging, which opens it to prod if okay.
- The issue tracker will collect tickets and everyone votes, so work goes to impactful things.
- OneSignal is too expensive and out of credits; use the existing official account and Firebase or platform-native methods.
- The tester is black-box: give it a self-hosted Zedu URL; it tests the API then the front end; a few endpoints and the homepage suffice now.
- StartNG teams get a VM and a per-game subdomain (ideally auto-provisioned via the Cloudflare API); talk to Mark first (sole access); keep in touch on WhatsApp for VM, DNS API and database.
- The game runs locally with no ticket but cannot go live until StartNG is ready; deploy ideally on Cloudflare Pages (free).
- Teams relay the rules themselves.

## Deadlines & Dates
- Individual checks close "by the end of the day today" — *2026-10-14 (computed)*; today closes the previous week's task, given a two- or three-day extension.
- Work runs "between today and Sunday" — *2026-10-14 to 2026-10-18 (computed)*.
- Sunday goal: the desktop fix and other individual tasks — *2026-10-18 (computed)*.
- Two deadlines: today and Sunday — *2026-10-14 and 2026-10-18 (computed)*.
- Project one must land within a day or it blocks everybody — *2026-10-15 (computed)*.

## Action Items
- [ ] Every contributor: PR merged into the team repo by end of day today, with a testing video as a PR comment and included in a PR to central staging (2026-10-14).
- [ ] Every contributor: deliver a desktop-app fix by Sunday (2026-10-18).
- [ ] Every contributor: build and publish a 3JS game on StartNG using the StartNG API.
- [ ] Every contributor: assign and fix a ticket with more than 10 votes and get it live.
- [ ] Every team: pick exactly one project.
- [ ] Team Yoda (Faith): deliver project eight, the automated tester; Mark will hold Faith to it.
- [ ] StartNG team (Team Satan): contact Mark for VM, DNS/Cloudflare API and database setup.
- [ ] Avi: a video on building a game with AI; Avi and Lal to collaborate.
- [ ] Teams: add tickets to the issue tracker and vote once it exists.

## Q&A
**Q (Umar Python): Individual tasks this week?**
Yes — merged PR today; a 3JS game on Start, a desktop fix, one significant voted-for ticket.

**Q (Dave Tulu): What is Start.ng?**
A domain they own; one team builds auth and a character API; games will be subdomains.

**Q (Elijah): What if several want the >10-vote ticket?**
First come, first served; a taken ticket can be locked; votes come from participants.

**Q (AI and data scientist [?]): How do we get transcripts, and are we limited to them?**
Documents will be provided and can keep being added; easy to get, e.g. transcribe the video.

**Q (Hamzat): Share this slide, and do the game and desktop fix need tickets?**
Slides are in a public folder; the document was shared in chat. The game can run locally; the desktop fix needs a ticket, same process as Zedu.

**Q (Umar Python): Is project one the voting platform? GitHub link or structured fields?**
Yes to voting; no to the rest — standalone, text in its own DB, deliberately simple.

**Q (follow-up): Wait for the new ticketing platform?**
No — arrange approvals among yourselves and avoid duplicates.

**Q (Faith): Explain project eight.**
DevOps skills: give the tester a self-hosted Zedu URL; it black-box-tests the API then the front end; a few endpoints and the homepage suffice now.

## Unresolved / Needs Verification
- Project two (marketing dashboard) is claimed by an unnamed team, Zu Mandu and Team Vulcan; Michael's team took sales (six), which Mark says is the same platform as two, so team two must work with "Michael's team". The owner of project two is unclear [?].
- "Team Zumando" [?] was named for project three (Android push notifications) while "Zu Mandu" picked project two; whether these are the same team is unclear.
- "Team Satan" [?] is the transcribed name of the team that took project five.
- "senior man" / "Senor Man" [?] raised a hand and stayed muted; unclear whether a name or an address.
- The "AI and data scientist" speaker is unnamed [?]; "Avi"/"Lal" [?] are first names only, described as game/AI helpers.
- "Zu Mandu"/"Mando" [?] and "Umar Python"/"Omar Python" [?] are variant renderings.
- "Iraq is completely unnecessary" / "it's rugg. It's rag" [?] look like ASR errors for "RAG"; "start.j app"/"stats.ng" [?] for start.ng; "one signal" [?] for OneSignal; "Zo"/"Zedu" [?] may be the same app.
- "written is that VA" [?] is garbled; the final project-to-team mapping is unconfirmed.
