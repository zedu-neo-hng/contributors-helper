# 2026-10-16 — HNG / ZEDU Call 9: Deadlines, Sales Auth, Outbound Strategy & Issue Tracker

- **Clean transcript:** `clean-transcripts/transcripts/2026-10-16_call_9_deadlines_auth_sales_issues_tracker.cleaned.md`
- **Raw transcript:** `transcripts/2026-10-16_call_9_deadlines_auth_sales_issues_tracker.md`
- **Date:** 2026-10-16
- **Source:** internal alignment call (no published recording)
- **Ticket:** #8 (neo-008)

## Meeting Summary

Periodic alignment call, explicitly not a check-in, ahead of the Sunday judgment. Mark confirms Sunday is the evaluation day and that all pending deliverables — individual tasks, game submissions and desktop fixes — must be finished by then. Most of the call is Q&A: sales-dashboard authentication is locked to Google Auth, the outbound sales and email-deliverability process is specified in detail, the issue tracker moves to a clean `issues.zedu.chat` URL, and the marketing dashboard is scoped to counting inputs rather than monitoring traffic.

## People & Roles

- **Mark** — runs the call and issues every directive. The transcript also names "Mark Essien at HNG" as a real person while discussing sales targets; the call lead is referred to only as "Mark" `[?]`.
- **Mickey** — sales; raises the SMTP-credentials question for the sales dashboard.
- **Bishop** — marketing; asks whether article submissions live in the platform or traffic is monitored per directory.
- **Mercy** — asks why "ready for dev" marketing tickets are not assigned to her.
- **Goodness** — reminds about the bug/issue tracker.
- **Daniel J** — has no team ("Zedu Marco" was disbanded) and no PR; told to reach out to Sodiq or Mickey.
- **Kenneth** — asks whether the issue-creation process has changed.
- **Start.ng Team** — asks whether creators can submit games hosted outside Start.ng.
- **Sodiq** — mentioned as a person to contact (alongside Mickey) to be placed in an active team.

## Key Decisions

- The sales dashboard keeps **Google Auth only**; custom SMTP / email-and-password login is rejected for security.
- Access must not be publicly discoverable: no open "Request Access" button, instead a discreet internal URL.
- The **first admin is hardcoded in the database**; that admin enables everyone else who logs in.
- The issue tracker moves to a clean URL: **`issues.zedu.chat`** rather than a long subpath.
- Admins can **boost a critical issue by +50 points**.
- Issues are logged on the tracker first; a GitHub issue is created or linked once an issue reaches **10+ upvotes** or is prioritised.
- The marketing dashboard tracks **inputs, not traffic** — "input is effort, output is traffic/sales".
- The platform will **not mass-send cold email** from its own mail servers.
- Games hosted outside Start.ng may be submitted as **URL listings** that open in a new tab.

## Guidelines & Process

- Sales pipeline: add a company free-form ("Add Company" → "SheLeads Africa") and research it later, enrich with AI tools (Parallel or Exa), then add a person and research contact details afterwards. Do not force structured form input up front; separate the individual from the business.
- Cold-email deliverability: validate an address before sending (check the domain's DNS/MX records first, then a test send from a separate subdomain). A bounce means the address is dead; repeated bounces degrade domain reputation.
- Outreach execution: split target companies (~10 each) across sales reps, who send individually from private Gmail using varied templates; LinkedIn outreach (list profiles → connect → message once accepted) is described as extremely effective.
- Keep a clear visual progress bar across the standard sales stages.
- Marketing has three pillars to track: **Press** (TechCabal, TechCrunch, newspapers), **Directories** (Reddit, Product Hunt, Hacker News, AlternativeTo) and **SEO/Content** (articles, titles, URLs).
- Desktop work: file bugs/fixes on the tracker and raise PRs to the desktop repository.
- Game task: read the start.ng API instructions first (paste the page into an AI and ask how to get started).
- "Ready for dev" means the ticket is approved, not assigned — marketing tickets are deliberately not being assigned yet.

## Deadlines & Dates

- **Sunday** is the official judgment/evaluation day; elimination of inactive participants follows the Sunday submissions. *(computed: the call is dated 2026-10-16, so this Sunday is 2026-10-18)*
- All pending deliverables — including items from week 1 and the recent Wednesday tasks — are judged together on Sunday, submitted through a form before then.

## Action Items

- [ ] Sales dashboard: drop email/password login, keep Google Auth, make access requests non-public.
- [ ] Ship the issue tracker at `issues.zedu.chat` with an admin +50 priority boost and a direct GitHub-link input field.
- [ ] Implement email validation (DNS/MX) and subdomain test-sends before any cold outreach.
- [ ] Marketing dashboard: track Press / Directories / SEO-Content inputs.
- [ ] Start.ng: accept external game submissions as URLs with title, description and thumbnail metadata.
- [ ] Daniel J: contact Sodiq or Mickey to be placed in an active team before Sunday's review.

## Q&A

**Q (Mickey): can we get SMTP credentials for the sales dashboard?**
No. Password logins are a security risk; stay on Google Auth with a manually seeded admin.

**Q (Mickey): what about a "request access" button?**
Preferably not even that in public — use a non-obvious internal URL that logs the request for an admin to approve.

**Q (Bishop): are article submissions inserted inside the platform, or is traffic monitored per directory?**
Drop traffic monitoring; count the content produced. Focus on inputs, not measured outputs.

**Q (Mercy): my marketing tickets say "ready for dev" but aren't assigned to me.**
Marketing tickets are not being assigned yet; "ready for dev" only means approved.

**Q (Mercy): can you share a brief for the game task?**
Go to start.ng, inspect what others have built, read the documented API instructions and prompt an AI with them to get started.

**Q (Kenneth): has the previous process for creating issues changed?**
Yes — log the issue on the tracker first; link it to a GitHub issue once it has 10+ upvotes or is prioritised.

**Q (Start.ng Team): can creators submit games hosted outside start.ng?**
Yes, as external playable URLs with metadata; Start.ng acts as a directory page that launches the game in a new tab.

## Unresolved / Needs Verification

- The tracker is referred to as `issues.zedu.chat`; the move away from a long subpath was still in progress at the time of the call.
- "Mark" is never given a surname on this call `[?]`.
- "Sunday" is spoken without a date; the 2026-10-18 figure above is computed from the call date, not stated.
