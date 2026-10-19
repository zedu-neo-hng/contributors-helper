# 2026-10-07 - Lesson 5 | Week 2: Squad Consolidation, Redesign Mandate & PR Review Gates

- **Clean transcript:** `clean-transcripts/transcripts/2026-10-07_lesson_5_week_2_reorg_redesign_contributions.cleaned.md`
- **Raw transcript:** `transcripts/2026-10-07_lesson_5_week_2_reorg_redesign_contributions.md`
- **Date:** 2026-10-07
- **Source URL:** <https://www.youtube.com/watch/h_xLAOhDnsw> [?]
- **Ticket:** #8 (neo-008)

## Meeting Summary
Lesson 5 of the Zedu internship, run by the mentor addressed as Mark. He ruled that only Zedu contribution counts from now on, cut ~20 teams to 10 active-only teams with new Telegram channels, set five deliverables for the week, and covered ticket approval, design tickets, redesign, marketing and PR gates; an unnamed contributor then described a revised PR flow using central-dev PRs and per-PR preview links.

## People & Roles
- **Mark** — host; only mentor (will not help); approves "ready for dev" and work-on claims; second-level reviewer.
- **Tiffany** — first reviewer; "valid format" label; preapproves tickets to Mark; collates non-product marketing submissions.
- **Avi** — team consolidation: active list, 10 teams, Telegram channels, notices, triage names, catch-all channel.
- **Annie** [?] — co-reviews tickets; **Victor** — explained the local-dev/.env fix; **Moneyo** [?] — "in charge of all the payment".
- **Python Umar** [?] — lead of "team Zedu Jakana" after its lead disappeared; merge/author errors; **Purple queen lab** [?] — ticket approved, implementation not approved.
- **Faith Dumbbe** — non-technical, unfixed errors, laptop problems; **Hashi Shags** [?] — product designer, joined 3 days ago; **Paul** — product management finalist, joined yesterday; **Welcome** — product manager into AI engineering, tickets rejected as taken; **99 + 1** [?] — early mobile/desktop tickets, blocked by missing .env; **Tech 9** [?] — React Native demo; **Damas** — non-coder, out of credits.
- Askers: **Abdul Moise** (desktop build vs download), **Dean Hana** (cross-platform tickets), **Hamzat** (PR flow; design/marketing process), **Roy** (unviewed tickets), **Gift** (PR timing; payments), **Kaka** (approval wait), **Aunt Okoro Kelvin** (repo restricted), **Solomon** (shadcn), **Secondat** (main Zedu vs group), **Daniel** (implement), **Elijah** (issue #98), **Rabia Usman** (comment timing), **Sata** (desktop/web mix-up), **Snow** (PR process), **Bishop Abraham** (previews; shuffling).
- Also: **Tim** (deleted group; no team), **Emanuel** ("puffing" group; communication), **Divine** (repeated PR process), **Mans** (more reviewers), **AI and data scientist** (sources; criteria; duplicates; offered curriculum help), **Favor** (web-to-app trouble), **GP** [?], **John / Jojo** [?] (silent reviewers), **ade** [?].

## Key Decisions
- Only Zedu contribution counts from now on.
- Teams cut ~20 → 10, active people only, new Telegram channels led by the new leads; a catch-all "no team" group for inactive members, who can request a team after catching up.
- Doing nothing now means "no longer in the program"; nobody is removed from channels yet.
- Tickets: approved + labelled "ready for dev", then comment to claim and get assigned; approval is of the ticket, not the person (100+ approved, none claimed).
- Design tickets are old-vs-new screenshots; approval means approved to implement.
- Each team specs one small one-week feature (no implementation), host-approved; examples: cohorts (like HNG 15), bingo, shareholders page, Zedu City, radio.
- Everyone does code, design, marketing and mobile-or-desktop; nobody exempt.
- Marketing: product changes (SEO, titles) are repo tickets; non-product (directories) go to Tiffany in a document; design goes in the surface's repo.
- New PR flow: PRs straight to central dev, each with a preview link; team lead reviews first, then reviewers; previews capped at 30 and destroyed if unlooked at; a backend URL in the PR builds the preview against it (central backend, not team DBs).
- PRs missing from the shared tracker (failed checks / no lead review) are ignored; large PRs need a size label.
- >5 changed files ≈ 3% acceptance; no wholesale shadcn porting; duplicate AI notices must be respected.

## Guidelines & Process
- Flow: ticket approved → comment to claim → implement → verify locally → test on the team URL → PR to central → staging → production; ladder = team Zedu (own DB/code) → staging Zedu (5–10 reviewers) → production Zedu, each group with its own testers.
- Ask inside your team, not the host; announcements/recordings channel is the only information source; find approved tickets in the org's repos/Issues; pre-check duplicates by pasting tickets into AI.
- Assignment videos via Loom/YouTube/any social; the form's second page holds the upload field.
- Tiffany checks format; Mark approves "ready for dev" and claims (130+ a day); 166 open FE PRs but only ~10 valid; "the least lenient HNG ever", ~30 people expected left.

## Deadlines & Dates
- Teams set up "before end of day today"; assignment "Today. As soon as Avi gets around to it" → *2026-10-07 (computed)*.
- Week's tasks "from now till Saturday... let's just say Sunday"; hard stop "the coming Sunday" → *2026-10-11 (computed)*.
- Eligibility "our Monday checkpoint" → *2026-10-05 (computed)*.
- Recording shared "end of today" → *2026-10-07 (computed)*; extra PR call "this evening today and sometime tomorrow" → *2026-10-07 / 2026-10-08 (computed)*.

## Action Items
- [ ] Avi: active list, 10 teams + Telegram channels before end of day, notices via announcements, ~10 triage names, catch-all monitoring.
- [ ] Everyone: claim an approved ticket (comment first) and implement it; submit a redesign (old vs new screenshots).
- [ ] Teams: pick, design and spec one small new feature; get host approval.
- [ ] Everyone: submit and implement a marketing ticket (SEO, virality, email, directories, OG/social); deliver a mobile or desktop fix; pass PR checks and get the team lead's review first.
- [ ] Tiffany: formats + marketing collation. Mark: approve "ready for dev"/claims, review another hour, publish today's recording.
- [ ] Unnamed organisers: evening/next-day PR-focused call. Duplicate holders: pick something else. Reviewers: drop the guide's wrong "production" line.

## Q&A
**Q (Tim): Implement the mobile/desktop fix after approval? No team for the feature task?**
Approved and assigned first, then follow the process; all active people past the Monday checkpoint get a team.

**Q (99 + 1): We lack the ENV values for mobile/desktop.**
(Victor) Change only the API base URL to your local URL; .gitignore the config files; keep Docker and config local.

**Q (Welcome): Where can I see approved tickets?**
Issues on any repo of the Zedu GitHub org (`github.com/zu chatart` [?]); or paste tickets into AI and ask.

**Q (Secondat): Main Zedu app or our group?**
Tickets only on the main Zedu GitHub (`github.com/zo chat zoo-f` [?]); fixes go local → group PR → staging → production.

**Q (Rabia Usman): Wait for "ready for dev" before commenting to work on a ticket?**
No — comment already so you get it immediately if approved.

**Q (final): Who are the mentors?**
None; the host is the only mentor and will not help — ask within your team.

## Unresolved / Needs Verification
- Source URL malformed (`youtube.com/watch/h_xLAOhDnsw`, no `?v=`) [?].
- Uncertain names: Avi vs "Abby" [?]; Annie [?]; Jojo/John [?]; "Jeffrey" [?] (credited with the new PR flow the host did not introduce); GP [?]; ade [?].
- The preview-link PR flow contradicts the team-dev → staging → production flow in the same call; authority unsettled.
- The deleted Telegram group appears as "offing", "Coffin Zoffin" and "puffing" [?]; cause unknown.
- "Production" branch line confirmed wrong with no replacement; "one word change" and "ticket of 18" unexplained.
- Team formation "before end of day today" but mechanism/notification channel undecided; counts vary (145/147 tickets, 100+/130+/150+ approvals, 166 open FE PRs, 20 → 10 teams).
- Free curriculum help not explicitly accepted; laptop upgrades got only disk-cleanup advice / Tree Size Pro.
