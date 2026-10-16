# [2026-10-16] HNG / ZEDU — Call 9 Meeting: Deadlines, Sales Auth, Outbound Strategy & Issue Tracker

- **Date:** 2026-10-16
- **Speakers:** Mark Essien (Chief Mentor), Mickey (Sales Lead), Bishop (Marketing), Mercy, Goodness, Daniel J, Kenneth, Start.ng Team
- **Target Product:** Zedu Chat (`zedu.chat`), Sales Dashboard (`sales.zedu.chat`), Issue Tracker (`issues.zedu.chat`), Start.ng
- **Standardized Name:** `2026-10-16_call_9_deadlines_auth_sales_issues_tracker.md`

---

## Session Overview & Context

Periodic alignment and Q&A call focused on the upcoming Sunday major review deadline, strict security guidelines for internal dashboards (Google Auth only, no custom SMTP or passwords), outbound cold sales architecture for targeting bootcamps, and the launch of the centralized issue tracker on `issues.zedu.chat`.

---

## Key Highlights & Directives

1. **Sunday Judgments & Deadlines:**
   - Sunday is the official evaluation and judgment day.
   - Filter/elimination of inactive members occurs following Sunday submissions.
   - All pending deliverables (individual tasks, game submissions, desktop fixes) must be submitted.
2. **Auth & Security Architecture (Sales Dashboard):**
   - Strictly prohibit email/password or custom SMTP logins. Use **Google Auth only** for maximum security.
   - Remove any public "Request Access" buttons from the login page.
   - Initial admin is manually promoted directly in the database; subsequent users require explicit admin approval via an internal, unadvertised request URL.
3. **Sales & Cold Outbound Pipeline:**
   - Target audience: Coding and tech bootcamps.
   - Workflow: Free-form entry first (add company name with zero friction), followed by AI enrichment (Parallel / Exa) and contact discovery (LinkedIn, email, phone).
   - Domain safety: Never mass-blast emails from the primary server. Validate email DNS/MX records first, warm up through subdomains, and distribute manual sends via rep personal Gmails with varied templates.
4. **Issue Tracking System (`issues.zedu.chat`):**
   - Clean domain: `issues.zedu.chat`.
   - Used for internal upvoting and prioritization. Admins can boost critical bugs (e.g. notifications) by +50 points.
   - Once a ticket accumulates 10+ upvotes, link/mirror it to the corresponding GitHub repository issue.
5. **Marketing Dashboard Metrics (Inputs vs. Outputs):**
   - Focus on tracking effort inputs rather than complex traffic analytics:
     - **Press:** Articles and media mentions (TechCabal, TechCrunch).
     - **Directories:** Listings on Product Hunt, Reddit, Hacker News, AlternativeTo.
     - **Content / SEO:** Dedicated keyword-targeted articles published on Zedu.
6. **Start.ng Games Platform:**
   - Creators can build 3JS browser games that consume the start.ng API or host external playable URLs displayed within the start.ng directory.

---

## Verbatim Transcript & Segments

### `[00:00]` **Mark Essien** (Chief Mentor)
> "Um, yeah. Hi everyone. Welcome to the ninth call. Hope you can hear me... Today is a very minor call. Basically, we are going to judge you on Sunday. So, I think everybody by now has acclimated to the program, they know what's happening. Everyone has a bunch of things that they need to deliver. Some are pending from the first week, some were given recently on Wednesday. Everything will be judged on Sunday most likely. So, there'll be some kind of submission form where you probably have to provide everything sometime before then. The teams are now in competition mode... If anybody has any questions or needs help with anything or is unclear on something, feel free to raise your hand."

### `[01:15]` **Mickey** (Sales Team Lead) & **Mark Essien**
> **Mickey:** "Hi, Mark. Please, we need access to SMTP credentials because for the sales dashboard, we built it in a way such that new users can be invite-only. The reason is that we don't want it public. So if we can get SMTP credentials, we will phase out Google Auth. But at the moment, Google Auth works, the dashboard works, cold works basically, but we need access for SMTP."  
> **Mark Essien:** "We don't want that. The reason is for security. What I would prefer as a flow is that there is a predefined admin. Let's say I log in and you see my Google Auth details; then you go to the database and manually make me admin. Now, after that, if anybody tries to log in, they just see nothing—it is just like your login is pending. But if I go as admin, I can see all the people who tried to log in, and then I can enable the ones that are supposed to have access to this... I don't want people just getting invited randomly, and I want all our logins to stay as Google Auth. The reason is that Google has its own extra layer of security, but a username and password anybody can just give to anybody else, and they can start entering your portal. And these are very sensitive portals."

### `[03:40]` **Mark Essien** (Chief Mentor) — Cold Outreach Strategy
> "Now, let me give you the very specific guideline because you guys have broken through; everything you need to get done is done. Let me explain to you exactly how we will use this app. We need to pitch people. We are sending a cold pitch saying we have Zedu, Zedu is better than Slack, you can use Zedu.  
> There are two aspects to this: First, you need to research the companies you are going to target. We are targeting bootcamps, right? So you have to go somewhere and start adding bootcamps one after the other. It shouldn't be a complicated structured form initially. I should be able to just say 'Add Company', type in 'SheLeads Africa', and press save. Just because you have an idea for a company doesn't mean you have done the research yet. You can't force people to do research before they can even start using your tool... Then, when I want to dig into a company, I click on it, go to their website, find contact info and description. You guys can use AI tools (like Parallel or Exa) to fetch company info...  
> Now, an important note about emails: Emails bounce. The more you send cold emails to bouncing addresses, the worse your domain reputation gets, and the harder it is to do sales. You need a script that validates if an email is working—first checking DNS/MX records on the domain. Because we own our email server, we can have another subdomain for initial test sends... Also, we are not going to mass send emails from the platform. With cold email, automation easily gets flagged by spam checkers. Since we have thousands of people in HNG, we can share out the work: assign 10 companies to different sales reps. They take varied templates, copy and paste into their private Gmail, and send from there."

### `[08:10]` **Bishop** & **Mark Essien** — Marketing Metrics
> **Bishop:** "Regarding the marketing dashboard, we got your feedback that it shouldn't be structured input, but freeform where we can input directories. Will article submissions be inserted inside the platform, or is traffic monitored per directory?"  
> **Mark Essien:** "Leave the whole traffic monitoring thing. You are counting how many pieces of content we have written. Traffic monitoring is secondary. Marketing has two components: input is effort, output is traffic/sales. Focus on input: what we did, not what we measured. There are three concrete marketing pillars: 1. Press (TechCabal, TechCrunch), 2. Directories (Reddit, Product Hunt, Hacker News), 3. SEO/Content (articles, titles, URLs on our own site)."

### `[10:30]` **Goodness**, **Kenneth** & **Mark Essien** — Issue Tracker
> **Goodness:** "You mentioned reminding you about the bug/issue tracker."  
> **Mark Essien:** "Yes. Let's make sure the URL is clean: `issues.zedu.chat` rather than a long subpath. Everyone should sign up, add bugs/issues, and upvote tickets to establish priority. For critical bugs (like notifications), admins should have an option to boost priority by +50 points. Also provide a direct input field for GitHub links rather than arbitrary 'proof' links."  
> **Kenneth:** "Has the previous process for creating issues changed?"  
> **Mark Essien:** "Yes, log issues on the issue tracker first (`issues.zedu.chat`). When an issue receives 10+ upvotes or is prioritized, link it to the corresponding GitHub repository issue."

---

## Key Action Items & Ground Rules

- **Auth Security:** Internal apps must use Google OAuth only. No password inputs. First admin is set via SQL database.
- **Outbound Emailing:** Validate emails via DNS/MX before sending. Do not send bulk blasts; distribute personalized sends across team members' Gmail accounts.
- **Issue Workflow:** Post to `issues.zedu.chat` -> Upvote to 10+ votes -> Mirror to GitHub repo.
- **Evaluation:** Sunday is the hard cutoff for stage survival.
