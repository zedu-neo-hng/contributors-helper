# [2026-10-14] ZEDU Internship — Lesson 2 | Week 3: Individual Checks, Desktop Fix & The 8 Team Projects

- **Date:** 2026-10-14
- **Duration:** 39:20
- **Source URL:** `https://www.youtube.com/watch/K00Ed98fch8`
- **Speakers:** Mark Essien (Chief Mentor), AI and data scientist (Team Neo Lead), Dave Tulu (Team Satan), Benjamin (Team Endor), Michael (Team Vadar), Bishop (Team Vulcan), Faith (Team Yoda), Umar Python (Team Zumando), DG (Team Groot)
- **Target Product:** Zedu Chat (`zedu.chat`), Start.ng, Contributors Helper, Issue Tracker
- **Standardized Name:** `2026-10-14_lesson_2_week_3_individual_checks_8_team_projects.md`

---

## Session Overview & Context

Critical roadmap session setting the requirements for the mid-week checkpoint and Sunday review. Outlines individual checks (merged PRs with video recordings, desktop application fixes, start.ng 3JS game) and officially distributes the 8 major team projects across the surviving cohort squads. Notably, **Team Neo is assigned Project #7: Contributors Help Platform**.

---

## Key Highlights & Directives

1. **Individual Verification Checks (Wednesday Deadline):**
   - Every contributor must have a PR merged into their team fork.
   - The PR must include a video demonstration showing the contributor testing the fix on their team's deployment.
   - The team must bundle approved fixes into a squad PR directed to central staging.
2. **Upcoming Individual Deliverables (Sunday Goal):**
   - **Desktop App Fix:** Implement and land a verified bug fix in the Zedu desktop application (not web).
   - **Prioritized Ticket Fix:** Select and resolve a ticket with 10+ upvotes from the new community issue tracker (`issues.zedu.chat`).
   - **3JS Browser Game:** Build a Three.js game published to `start.ng`, consuming the start.ng character/auth API.
3. **The 8 Team Projects Allocation:**
   - **Project 1 (Bug Tracking Interface):** Assigned to **Team Endor** (`issues.zedu.chat`). Allows Google sign-in, ticket submission, and community upvoting.
   - **Project 2 (Marketing Metric Dashboard):** Assigned to **Team Vulcan** & **Team Mando**.
   - **Project 3 (Android Push Notifications):** Assigned to **Team Mando** (migrating off OneSignal to Firebase/FCM).
   - **Project 4 (iOS Push Notifications):** Assigned to **Team Groot** (native APNs configuration).
   - **Project 5 (Start.ng Platform):** Assigned to **Team Cybertron / Satan** (central game directory, authentication, character API).
   - **Project 6 (Sales Dashboard):** Assigned to **Team Vadar** (`marketing.zedu.chat` sales pipeline).
   - **Project 7 (Contributors Help Platform):** Assigned to **Team Neo**. AI assistant answering contributor questions based on all internship call transcripts.
   - **Project 8 (Pre-Release Automated Tester):** Assigned to **Team Yoda** (blackbox end-to-end regression testing framework).
4. **Architectural Directives for Team Neo (Project #7):**
   - Mark Essien specifically advises Team Neo against over-engineering with complex vector databases or RAG pipelines.
   - Clean, compact, and structure the call transcripts directly into the system prompt context.
   - Implement Google OAuth for authentication, stream responses with standard LLM SDKs, and focus on fast, accurate answers to contributor operational questions.

---

## Verbatim Transcript & Segments

### `[00:00]` **Mark Essien** (Chief Mentor) — Individual Checks for the Week
> "By the end of the day today, we're going to check that your PR is in your team's repo and it has been merged in. That means that it's actually working. The PR should now include a video showing you testing it on your team's repo... Then we will check that your PR has been included in a PR going to the central staging...  
> Then for the coming week, our goal of Sunday: you are going to deliver a fix to the desktop app. So get a fix to the desktop app, not the web any longer. Then you are to assign yourself a ticket with more than 10 votes that is on a new ticketing dashboard that will be built and then you are to get it fixed and live... Further individual tasks: you have to build a game based on 3JS and publish it on start.ng... You have to use the API of start.ng and actually build your characters based on that API."

### `[02:56]` **Mark Essien** (Chief Mentor) — Overview of the 8 Team Tasks
> "The team tasks for the week. Each team as a whole needs to deliver the following... There are eight teams:  
> 1. Bug tracking interface (`issues.zedu.chat`). It allows people authenticate and vote for which ticket they feel has the highest priority.  
> 2. Marketing dashboard (metric tracker).  
> 3. Android push notifications (exit OneSignal).  
> 4. iOS push notifications.  
> 5. Start.ng platform (base authentication and character API).  
> 6. Marketing dashboard (sales).  
> 7. Contributors help platform: which is an AI that explains everything based on transcripts from this internship.  
> 8. Pre-release automated tester."

### `[10:41]` **AI and data scientist** (Team Neo Lead) & **Mark Essien** — Claiming Project #7
> **AI and data scientist:** "Hi. Um so I wanted to pick for my team, Team Neo. But before we pick I'd like to ask how and when we'll get the transcript if we're going with that option and if we're limited to just using the transcripts for the AI platform."  
> **Mark Essien:** "Uh no, you know that part is not like the difficult part and it's not what will be judged. It's basically because we'll just provide a bunch of document. The idea is that anybody can just ask anything about this internship... on YouTube, everything is online. So just like it's not a difficult thing to get the documents."  
> **AI and data scientist:** "So we go with number seven."  
> **Mark Essien:** "Which team is that? Team Neo? That's a good choice by the way because it may look complicated but it's actually very simple platform."  
> **AI and data scientist:** "I think it's RAG based. So—"  
> **Mark Essien:** "You don't need RAG. It just does context! Like why do you need RAG? Just do an AI call! Let me explain what you do: replicate ChatGPT or Gemini... in the AI call, in the system prompt, add the entire document you have. Maybe what you could do is paste that document into AI ahead of time and ask it to remove all the unnecessary words and all the repeated things, then put that document as the system prompt so anybody can just chat with it and it has the whole document in there. You don't need RAG or database... authentication is quite easy with Google. Use Google, put this in the system prompt, that's it."

### `[24:20]` **Benjamin** & **Mark Essien** — Project #1 (Team Endor)
> **Benjamin:** "We want to choose a project for our team... we'll go for number one."  
> **Mark Essien:** "Which team is that? Team Endor. Can your team deliver quickly because this thing will block everybody if it's not done within a day? You have to have highly technical guys in there."  
> **Benjamin:** "Yes, we can get this done rapidly."

---

## Key Action Items & Ground Rules

- **Team Neo Mandate:** Deliver Project #7 (Contributors Help Platform) using full transcript compactions, Google Auth, and fast AI responses.
- **Desktop Requirement:** Every individual contributor must find, reproduce, and submit a fix for the desktop version of Zedu.
- **Voting Threshold:** Work only on tickets from `issues.zedu.chat` that achieve 10+ community upvotes.
