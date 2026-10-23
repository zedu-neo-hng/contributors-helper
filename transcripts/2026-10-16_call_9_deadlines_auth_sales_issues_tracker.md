# [2026-10-16] HNG / ZEDU — Call 9 Meeting: Deadlines, Sales Auth, Outbound Strategy & Issue Tracker

- **Date:** 2026-10-16
- **Source:** HNG / ZEDU Internal Alignment
- **Original Source File:** lesson 9.txt
- **Standardized File Name:** 2026-10-16_call_9_deadlines_auth_sales_issues_tracker.md
- **Target Product:** Zedu Chat (zedu.chat)

---

## Verbatim Call Transcript

﻿================================================================================ HNG / ZEDU - CALL 9 MEETING 
Date: 16/oct/2026
TRANSCRIPT & ACTION SUMMARY
--- SUMMARY OF KEY HIGHLIGHTS & DIRECTIVES ---
1. Deadlines & Judgments:
   * Official judgment day is Sunday.
   * Elimination/filtering of inactive participants will occur following Sunday's submissions.
   * All pending deliverables (individual tasks, game submissions, desktop fixes) must be completed by Sunday.
2. Auth & Admin Flow (Sales Dashboard):
   * Do NOT use custom SMTP/email password logins; rely strictly on Google Auth for security.
   * Do not display an open "Request Access" button on the front page. Keep access request endpoints discrete/internal.
   * Hardcode initial admin access manually in the database; subsequent users are approved/enabled by an admin.
3. Sales & Outbound Strategy:
   * Target Bootcamps: Research companies first in free-form entry, then enrich with AI/manual contact data.
   * Avoid mass automated emailing directly from company mail servers to prevent spam flagging and domain degradation.
   * Utilize a tiered approach (warmup / bounce verification via subdomains, personalized LinkedIn outreach, and individual manual Gmail/workspace sends using varied templates).
4. Issue Tracking System:
   * Issue tracker URL moving to: issues.zedu.chat
   * Use the internal tracker for upvoting, task assignments, and priority boosting (admins can boost critical tickets by +50 points).
   * Once an issue gains sufficient upvotes (10+), link/mirror the formal technical issue to GitHub.
5. Marketing Dashboard Metrics:
   * Track Inputs vs Outputs: a) Press: Coverage mentions/articles (TechCabal, TechCrunch, etc.). b) Directories: Submission tracking (Reddit, Product Hunt, Hacker News, etc.). c) Content/SEO: Number of unique resource pages/articles created.
6. Game & Desktop Tasks (Start.ng):
   * Games: Build playable browser games consuming the start.ng APIs. External games can be submitted via URL directory listings on Start.ng.
   * Desktop App: Submit bugs/fixes via the new issue tracker and push PRs to the desktop repository.
================================================================================ FULL TRANSCRIPT
[Speaker 1 / Mark]: Um, yeah. Hi everyone. Welcome to the ninth call. Hope you can hear me.
[Participant]: Yes, we can.
[Speaker 1 / Mark]: Okay, great. Today is a very minor call. Basically, we are going to judge you on Sunday. So, I think everybody by now has acclimated to the program, they know what's happening.
Everyone has a bunch of things that they need to deliver. Some are pending from the first week, some were given recently on Wednesday. Everything will be judged on Sunday most likely. So, there'll be some kind of submission form where you probably have to provide everything sometime before then.
The teams are now in competition mode. That means there are regular check-ins where a team has to gain points, and there's an overall winner. I'm not going to do any check-in on this call; this is just a periodic call. And there's actually nothing new right now because we already specified everything on Wednesday and the deadline coming is on Sunday.
So, I would like to have this call just open for any questions that you may have. If anybody has any questions or needs help with anything or is unclear on something, feel free to raise your hand. We'll talk one at a time.
All right. Hi, Mickey.
[Mickey]: Hi, Mark. Please, we need access to SMTP credentials because for the sales dashboard, we built it in a way such that new users can be invite-only. The reason is that we don't want it public. So if we can get SMTP credentials, we will phase out Google Auth. But at the moment, Google Auth works, the dashboard works, cold works basically, but we need access for SMTP.
[Speaker 1 / Mark]: We don't want that. The reason is for security. What I would prefer as a flow is that there is a predefined admin. Let's say I log in and you see my Google Auth details; then you go to the database and manually make me admin. Now, after that, if anybody tries to log in, they just see nothing—it is just like your login is pending. But if I go as admin, I can see all the people who tried to log in, and then I can enable the ones that are supposed to have access to this.
[Mickey]: Okay, I think we've done that as well.
[Speaker 1 / Mark]: Yeah, I don't want people just getting invited randomly, and I want all our logins to stay as Google Auth. The reason is that Google has its own extra layer of security, but a username and password anybody can just give to anybody else, and they can start entering your portal. And these are very sensitive portals.
[Mickey]: Okay. If you don't mind, can you just check out how the authentication is right now so you can give us feedback?
[Speaker 1 / Mark]: Okay, sure. What was it again? sales.zedu.chat?
[Mickey]: Yes, that's correct.
[Speaker 1 / Mark]: This email and password should go away. I don't want anybody logging in via password.
[Mickey]: Okay. What about requesting access?
[Speaker 1 / Mark]: No. Except, yes, you can do it so that the normal login is just "Continue with Google," and then you end up somewhere and it says you don't have access to this, without it even requesting access. But then if you want to request access, you can go here. But I would even prefer—just so that no hacker comes and says "I'm Mickey" and then somebody just approves it—I'd prefer on this page if there's not even the ability to request access, but there'll be some secret URL. You have to go to that URL and from there request access. Something that people cannot easily find, because it's just an internal tool.
[Mickey]: Yeah, so the URL is just going to be accessible to the internal team that wants to be part of the sales team basically.
[Speaker 1 / Mark]: Yes, just something that is not obvious. They can go there, try and log in with Google, and that logs their request so the admin can approve it.
Now, let me give you the very specific guideline because you guys have broken through; everything you need to get done is done. Let me explain to you exactly how we will use this app.
We need to pitch people. We are sending a cold pitch saying we have Zedu, Zedu is better than Slack, you can use Zedu.
There are two aspects to this: First, you need to research the companies you are going to target. We can pay somebody or find people to go find our potential target companies. We are targeting bootcamps, right? So you have to go somewhere and start adding bootcamps one after the other. It shouldn't be a complicated structured form initially. I should be able to just say "Add Company", type in "SheLeads Africa", and press save.
Just because you have an idea for a company doesn't mean you have done the research yet. You can't force people to do research before they can even start using your tool. Separate out the individual from the business. All these structured form inputs shouldn't be upfront.
Then, when I want to dig into a company, I click on it, go to their website, find contact info and description. You guys can use AI tools (like Parallel or Exa) to fetch company info. But a company is not a contact yet.
Next, you find a particular person—usually a mix of LinkedIn, phone number, and email. Sometimes you know the person's name (like Mark Essien at HNG) but don't have the email yet. Keep the flow simple: add the person, then research contact details later.
Now, an important note about emails: Emails bounce. The more you send cold emails to bouncing addresses, the worse your domain reputation gets, and the harder it is to do sales. You need a script that validates if an email is working—first checking DNS/MX records on the domain.
Because we own our email server, we can have another subdomain for initial test sends. That send will tell us if it's going through. If it succeeds, use your main sender to send the real email. The first email might hit spam, but if it doesn't bounce, you know the address is alive.
Also, we are not going to mass send emails from the platform. With cold email, automation easily gets flagged by spam checkers. Since we have thousands of people in HNG, we can share out the work: assign 10 companies to different sales reps. They take varied templates, copy and paste into their private Gmail, and send from there.
And for LinkedIn: LinkedIn sales is extremely effective. You list target profiles on a LinkedIn tab. Sales reps with optimized profiles send connection requests. Once accepted, they send direct outreach messages.
Keep the pipeline simple and intuitive. Use a clear visual progress bar across the standard sales stages so we know exactly who is in progress at any point.
[Bishop]: Good morning, Mark. Regarding the marketing dashboard, we got your feedback that it shouldn't be structured input, but freeform where we can input directories. Will article submissions be inserted inside the platform, or is traffic monitored per directory?
[Speaker 1 / Mark]: Leave the whole traffic monitoring thing. You are counting how many pieces of content we have written. Traffic monitoring is secondary. Marketing has two components: input is effort, output is traffic/sales. Focus on input: what we did, not what we measured.
There are three concrete marketing pillars:
1. Press: Mentions in TechCabal, TechCrunch, newspapers, etc. Track links to published coverage.
2. Directories: Where we submitted the site (Reddit, Product Hunt, Hacker News, AlternativeTo).
3. SEO/Content: Content production addressing target topics on our own site (tracking articles, titles, URLs).
[Mercy]: Good afternoon, Mark. I had marketing tickets that were marked "ready for dev," but haven't been assigned to me.
[Speaker 1 / Mark]: We don't assign marketing tickets right now. "Ready for dev" means the ticket is approved, but we are not working on marketing tasks yet.
[Mercy]: Could you please share a brief for the game task?
[Speaker 1 / Mark]: Go to start.ng and inspect what others have done. There are API instructions documented at start.ng. You can paste the page instructions into an AI tool and prompt: "We have been asked to make a game using start.ng, how do I get started with this?"
[Goodness]: Good afternoon, sir. You mentioned reminding you about the bug/issue tracker.
[Speaker 1 / Mark]: Yes. Let's make sure the URL is clean: issues.zedu.chat rather than a long subpath. Everyone should sign up, add bugs/issues, and upvote tickets to establish priority. For critical bugs (like notifications), admins should have an option to boost priority by +50 points. Also provide a direct input field for GitHub links rather than arbitrary "proof" links.
[Daniel J]: I feel like some of us are being left behind. My previous group (Zedu Marco) was disbanded, and I haven't been assigned to a new group or PR.
[Speaker 1 / Mark]: Reach out to Sodiq or Mickey on Zedu to get slotted into an active group immediately so you can contribute before Sunday's review.
[Kenneth]: Has the previous process for creating issues changed?
[Speaker 1 / Mark]: Yes, log issues on the issue tracker first (issues.zedu.chat). When an issue receives 10+ upvotes or is prioritized, link it to the corresponding GitHub repository issue.
[Start.ng Team]: Can creators submit games hosted outside start.ng?
[Speaker 1 / Mark]: Yes. Allow creators to submit external playable URLs with metadata (title, description, thumbnail). Start.ng will serve as a directory page that launches the game in a new tab.
[Speaker 1 / Mark]: Thanks everyone. Remember, Sunday is our major review and evaluation. Ensure your games, issue tickets, and desktop contributions are completed. Have a great weekend.
