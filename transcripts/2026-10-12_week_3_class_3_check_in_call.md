# [2026-10-12] HNG 15 — Week 3, Class 3 / Check-In Call

- **Date:** 2026-10-12
- **Source:** HNG 15 Cohort Call
- **Original Source File:** check in call.txt
- **Standardized File Name:** 2026-10-12_week_3_class_3_check_in_call.md
- **Target Product:** Zedu Chat (zedu.chat)

---

## Verbatim Call Transcript

﻿Date: 12,Oct,2026
================================================================================ HNG 15 - WEEK 3, CLASS 3 / CHECK-IN CALL




--- EXECUTIVE SUMMARY & KEY POINTS ---
1. Live Deployments vs. Local Progress:
   * Mark firmly reiterated that work existing only on localhost receives zero points.
   * Deployments hosted on arbitrary third-party platforms (e.g., Vercel) are rejected. Deployments must run on internal infrastructure set up via Coolify / GitHub repositories.
2. Infrastructure & Database Setup (Coolify):
   * Sodiq has set up repositories and auto-deployment pipelines on Coolify for all teams.
   * Database credentials and connection parameters are injected via Coolify environment variables (refer to .env.example).
   * Teams must not connect external/remote cloud databases (like Neon DB) for production; they must utilize the internally provisioned infrastructure.
3. Team Progress & Scoring:
   * Team Cybatron (Start.ng project): Scored 0 due to having only local implementations without a deployed repository link.
   * Team Endor (Zedu Bugs / Bug Tracker): Scored points for deploying the issue submission interface to contributors.zedu.chat/zedubugs. Mark requested the removal of regular password login in favor of Google OAuth.
   * Team Volkan (Marketing Dashboard): Received points for live deployment and working Google authentication. Content producing and directory submissions were clarified.
   * Team Yoda: Received zero points due to presenting a Vercel preview deployment instead of an internal Coolify deployment.
4. Requirements for Upcoming Check-ins:
   * "New Feature Alert": Teams earn points by dropping merged PR notices under the designated channel in Zedu.
   * CRUD Operations: By the next check-in (scheduled for 7:00 PM), teams are expected to demonstrate working "Create" and "Read" functionality tied to the live database.
================================================================================ VERBATIM TRANSCRIPT
Speaker 1 / Mark: Uh, hi everyone. Can you hear me?
Speaker 1 / Mark: Okay. Uh, was the link shared with everybody? Because this is supposed to be a general call with everybody interested. Yeah. Okay. Um, so, is any team ready? Like, has any team achieved, kind of, like the first stage of everything and would like to show me so I can give feedback?
Yeah, Hamzat.
Hamzat: Okay, hi Mark. Um, I am in team Cybatron. So what we did is we kind of have it running locally...
Speaker 1 / Mark: Which project? Just tell me the project.
Hamzat: Okay, Start.ng. Start.ng.
Speaker 1 / Mark: Okay, all right.
Hamzat: So let me share my screen...
Speaker 1 / Mark: No, no, no. Sorry. I don't—I'm not interested in anything local.
Hamzat: Okay. Um, yeah. So, the reason why we have it local was because Sodiq has not given us access to Cloudflare where we could host, so we just basically had to, um, do that locally and then test what we have. So that was like the reason why.
Speaker 1 / Mark: Okay. Uh, you guys could have told me this before now. So you guys are going to score zero for this check-in. Um, we are supposed to break through this problem. Like, Sodiq is not on this call, right?
Uh, you should have told me before now.
Hamzat: Um, first of all, I'm not the team lead. Then secondly, it was immediately after the call we had earlier today, that was when, like, oh, we began to figure out things and then, yeah.
Speaker 1 / Mark: Mhm. What do you need? Like, you should have access to the GitHub repo. This has nothing to do with Cloudflare right now.
Hamzat: Um, we need to host, um, the site there, right?
Speaker 1 / Mark: Not on Cloudflare. The site isn't hosted on Cloudflare. It's hosted on our own servers, which have been set up since yesterday.
Hamzat: Um, okay, I think it has to do with the worker then.
Speaker 1 / Mark: The worker, yeah, sure. I mean, the worker is one thing, but that worker is—like, you guys have like four parts to the project. You could have done three; only one remaining is Cloudflare.
Speaker 1 / Mark: Uh, Sodiq. Hi, Sodiq.
Speaker 1 / Mark: Yeah, we are trying—like, I'm trying to understand this Start.ng team. They say that they have not been able to get any progress. Now, but you have GitHub up and running—that is, sorry, you have Coolify up and running. You have their GitHub stuff. Have you not granted them access to that?
Sodiq: For which team?
Speaker 1 / Mark: Start.ng, to the GitHub and Coolify so they can push.
Sodiq: They have access. I already invited, um, Dave to the repo, so they can push. Once they push, it will go live.
Speaker 1 / Mark: Okay. So, you guys just haven't gotten yourself sorted. Then, um, so Sodiq, this thing with R2 now, like, you told me it's free.
Sodiq: Yes. So, they have, um—even from here, it's showing 10 GB, um, per month for free, but it's not allowing me, since you said something was removed before.
Speaker 1 / Mark: R2 subscription was removed. Let me check it. Okay, but irrespective of that, these guys should be able to just normally push like their home page and all that, right?
Hi, Sodiq. They should—Sodiq?
Sodiq: I'm with you.
Speaker 1 / Mark: Yeah, they should have been able to push their home page, right?
Sodiq: Sorry, what did you say? My headset was off.
Speaker 1 / Mark: I said irrespective of Cloudflare, they should have been able to push their home page and the API.
Sodiq: Yes, they can push their home page. The Cloudflare is just for the, um, worker...
Speaker 1 / Mark: I understand. Okay, so, and you say you invited Dave?
Sodiq: Yes, I invited him this morning to both the frontend and backend.
Speaker 1 / Mark: Okay. So, Dave, what happened? What's wrong?
Dave: Sorry, I'm just joining the call, but, yeah, we're already working on it. We've worked on everything locally...
Sodiq: Hello, can you hear me? My headset just turned off.
Speaker 1 / Mark: Yeah. Okay, which team are you guys?
Dave: Team Cybatron.
Dave: We've been working locally. We have not pushed anything to the, um, the repo yet, but we have...
Speaker 1 / Mark: Uh, yeah, that is the problem now. I'm not looking at anything local.
Speaker 1 / Mark: So, Team Task Live, Cybatron: zero. Team Task Working: zero.
Dave: But we've been waiting on, on...
Speaker 1 / Mark: You have not been waiting. He said he invited you. There are two different things. Number one is Cloudflare access, right? Number two is your actual app. You don't need Cloudflare access to get your app up and running. Like, you could have gotten that one; they are not tied together. You get?
Dave: Yes, sir.
Speaker 1 / Mark: Yeah, like one didn't stop the other one. All right. Is there any other team that, uh, wants to show their work or anything they have live or online? Or wants to ask any questions?
Yeah, Alexin.
[Alexin]: Hello, good afternoon. I wanted to ask how we are, um, expected to host the, the team task?
Speaker 1 / Mark: Which team is that, and which project is it?
[Alexin]: Um, this is Veda, and we are working on the CRM dashboard.
Speaker 1 / Mark: Okay. Sodiq, you have set it up, right?
Sodiq: Sorry, I didn't hear you. What did you say?
Speaker 1 / Mark: The dashboard, the team dashboard, you have set it up for them, right?
Sodiq: Yes, yes. All the organizations, all the teams, I've set up their repository and deployments, like auto-deployment is for all of them. I've done that.
Speaker 1 / Mark: And you invited their team leads?
Sodiq: I, um, sent the link and asked all the team leads to message me. So, I think about four messaged me with their email, which I invited. Anyone that does not have access means they did not send me a message for the invite.
Speaker 1 / Mark: Okay. So Alexin, have you heard? It's been set up. It's just you guys need to gain access to it. Is there any team who has their stuff, who has just pushed even one word live? You get your one point. Otherwise, I give you zero.
Any other team?
So, we have set up all the environments for every single team. Yeah, it's just, and the team leads have been invited, they've been told how to access it. All I need from you is that you have pushed something live and we can view it.
Nobody? Or any questions?
Okay, so I guess we'll move on. I guess all teams get zero. In the next check-in, the same thing will be repeated again. My expectation is that you have pushed something to your repo, no matter how small, no matter how trivial, and that thing has reflected on the actual homepage of your team's project, so we can have a look at it. Like, I don't really care what it is, just that it's working. You know, that you have gotten—there are two different points: there's the team task being live, and then there's the team task actually working.
Uh, so if nobody has that, then I'll just assign zero to everybody.
[Goodness / Mickey]: We have something... We have actually pushed, but it's not live yet. Okay, Goodness, you can shoot.
Speaker 1 / Mark: Yeah, I won't look on local. Like, you need to send me the URL and I'll have a look there. Is that what you have?
Goodness: Yeah, Goodness has something like that.
Speaker 1 / Mark: Okay, send me the link. You refer to yourself in the third person?
Goodness: Oh, yeah. I have something like that.
Speaker 1 / Mark: No, I mean it's fine. Mark appreciates you. [Laughs] Go ahead, send the link.
contributors.zedu.chat/zedubugs
Okay. Did you guys do this or somebody else did it? Like, was it pre-defined?
Goodness: It was pre-defined.
Speaker 1 / Mark: That is, Sodiq was the one who did this?
Speaker 1 / Mark: What did you guys do then? Send me the URL.
Goodness: Oh, so, this is—we did all of this. What he did was, um, a Google—signing in Google that wasn't actually working. So, because I reached out to you if we should start a stand-alone app already, though before you replied, Avi actually replied and we already had the stand-alone app, which is all of this and was working. So when Sodiq now reached out with the repo, what we just did now was get it from the, um, the other repos...
Speaker 1 / Mark: Sorry, sorry, I'm just not understanding you. Look, this thing I'm looking at right now, yeah, this sign-in form, was that done by Sodiq or was it done by you guys?
Goodness: By us, by us. Yes, the sign-in form.
Speaker 1 / Mark: And it went live. What made it go live? How did it go live?
Goodness: Okay, so what we did was that...
Speaker 1 / Mark: Long story. I can see that you have a repository here. This stuff on this repository, that is zeduchat/bugtracker, is that the code I'm looking at?
Goodness: Yes, it is.
Speaker 1 / Mark: And you guys did it, it wasn't Sodiq, so I can give you the point?
Goodness: Yes, it is. We did it.
Speaker 1 / Mark: Okay, but that long story—is there something you need me to know, that you keep telling me about that long story? There's something in there you're trying to communicate, right?
Goodness: Yeah, we are stressed, but we are going to keep pushing.
Speaker 1 / Mark: So, can Mark give you the point?
Goodness: Yes, please. Mark should give us all the points he can, and salt.
Speaker 1 / Mark: Okay. What is the team?
Goodness: Team Endor. Zedu Endor.
Speaker 1 / Mark: Okay, so I'll give you one point there. Uh, now, is it working? No, well, it's not because I couldn't log in. I couldn't, uh, sign in with Google. Can you remove the normal sign in, please?
Goodness: Uh, we should remove the normal sign in?
Speaker 1 / Mark: Yeah, we don't want normal sign in.
Goodness: Okay then, no problem.
Speaker 1 / Mark: And, yeah. Uh, so you guys get your one point for that, that's Team Endor, so you have two points total. So I can see that you have a repository, I can see that you have some pushes to the repository, you have a working URL. Um, if maybe it's somebody else that pushed to the repository, that's fine.
Okay. Um, yeah, so it looks good, it looks good. Um, just, just like push. So do you understand what you are doing next after this?
Goodness: Uh, yes, I understand.
Speaker 1 / Mark: Okay. So just for clarity: first of all, Google login isn't working right now. You get the credentials from Sodiq, yeah? So I can click and I can log in. At this point in time, you don't need any restriction; everybody can just log in.
When I log in, I can just add a ticket. I can click "Add issue," uh, I'll just type description, type title, and press save, and it will show up on a list. The list is like news.ycombinator.com or Reddit, that is, it's that type of just 1-1-1-1-1 in a long list. And I can go there and I can vote it up and vote it down. Uh, yeah, I can vote up the ticket or vote it down. Yeah, that's the only requirement that I need of you right now. I know it can be better, I know you can do more, but that's all that is actually in this first requirement set. Clear?
Goodness: Um, yes, that's actually clear. Uh, though we had gone beyond that, um, from what we've built, now the only issue is fixing the authentication from when we got the access to make everything accessible to use on production.
Speaker 1 / Mark: Yeah, I don't mind if you go beyond that, but let me tell you the reason we have this thing. It's not that we want a full bug tracker. Primarily, we want to know what the most important bugs are to work on right now, and we want there to be a group consensus around those bugs. Yeah, that is feature one. So that people can basically go ahead and say, "I worked on something important." Do you understand?
And I know that we can make a full bug tracker, and that is ultimately our vision, but I don't want us to go further than, like, like further than—I don't want you to solve so many other problems and then fail to solve the core problem that we're actually trying to address. Yeah?
Goodness: Yes, understood. Thank you.
Speaker 1 / Mark: All right. So, um, can I set a 6:00 or 7:00 PM review where you would basically show that this thing is now working?
Goodness: Um, yes, Mark can do that.
Speaker 1 / Mark: [Laughs] Is that still third person? All right, fair enough. Uh, okay, great. Uh, so we'll try and go for 6:00 PM if we have enough people that have at least reached, uh, that level, like where you guys are.
Okay, great. Um, so, do you have access to your database? Like, are you able to connect to the database that we have in Coolify?
Goodness: No, not yet. I'm not able to.
Speaker 1 / Mark: But you know how to?
Goodness: Not yet. That's what we are still trying to figure out.
Speaker 1 / Mark: You need to log into Coolify. That is, the way that Coolify works is that you have to log in and you have to set the environment variables in Coolify, not in a .env. Uh, Sodiq, that's correct, right?
Sodiq: Yes. What you have to do is, after creating the string of the database, you add it to the... but it's already connected to their env, if their...
Speaker 1 / Mark: Hold on, Sodiq. Hold on, Sodiq. For one container to connect to another container normally, you use Coolify environment variables. Are you doing it in a different way?
Sodiq: Yeah, that's what I'm using, the internal ports. That's the internal environment variables, that's what I'm using. The database is not accessible publicly, it's only from the container.
Speaker 1 / Mark: I know, but like the username and password, normally it's in like those environment variables that you actually have to log into Coolify to set.
Sodiq: Yes, that's...
Speaker 1 / Mark: Are you doing something else, or are you using a .env file?
Sodiq: I just set it directly. After I created it directly, but it was added to their own dot env, that's ENV. It's not a .env file, but the, um, environment—there's an environment section on Coolify which I added the env to. Or is that not what you're asking?
Speaker 1 / Mark: Yeah, that's what I'm asking, because how are they supposed to know how to connect to the database? Do they know how to access those variables?
Sodiq: Okay, the variable from the, um, like boilerplate I created for them, the variables are already there. If they check the env.example, they will see the variable name that is required and used to connect. So I did the connection when I... But then they cannot access our own database, they will just test with their local using the same variable name.
Speaker 1 / Mark: Yeah, but if they push it, is it going to work so that they have access to the Coolify DB?
Sodiq: Yes, once they push it to—once they push to GitHub, it will deploy and also, anything they want to add to their database, if it's migration, whatever, it's going to work directly.
Speaker 1 / Mark: Okay. All right, well, Goodness, you guys should, uh, sort that out.
[Goodness / Mickey]: Okay. Sodiq, check your WhatsApp, Sodiq, please. This is Mickey.
Speaker 1 / Mark: Okay, great. Uh, who—Bishop has his hand up?
Bishop: Um, okay. Good afternoon, Mark.
Bishop: Yeah, we've been able to get our changes to our live URL, so I've sent it in the chat.
Speaker 1 / Mark: Okay. All right, you even have login. "Published content. Can one add content?" No, clicking on content doesn't work.
You know what, like I'm going to change the criteria so that you guys have more points because your login works. Which team is that?
Bishop: Um, Volkan.
Speaker 1 / Mark: Okay. So I'll put authentication. And I'll also put DB. Let's, let's, so that we can...
So Volkan is going to get: Team Task Live, you get one point; Authentication, you get one point. Are you connecting to the DB?
Bishop: No, I used the Neon DB. So...
Speaker 1 / Mark: What do you mean Neon DB? Okay, like a remote thing? No, you are not allowed to do that. You have to use our own.
Bishop: No, I think we have to set it locally. We don't have access to the database. That, I think that's what Sodiq was saying right now.
Speaker 1 / Mark: Yeah, you guys don't know how to, but you actually have access, but you just don't know how to do it.
Sodiq: Okay, um, I want to ask Bishop a question. Like, the Neon DB you use, is it just for your own local testing, not for the production?
Bishop: Yes, it's for my local testing. So I just use the—you know, you are going to have your own environment variable, so once you push...
Sodiq: Yeah, so our own environment is already—if you check your env.example, you'll see that, um, the connection variable that was added. So the database is already set up directly. So if you deploy, if you did not change the database, um, variable, if you are not hardcoding it, if you're still following the env, it will pick it up automatically, even though you add a migration file. The Dockerfile already has steps for migration, it will migrate to the DB and everything is working directly. It's just for you—if you want to use Neon, maybe for your local testing, but for the regular deployments, the database is set up. It's going to work.
Bishop: Okay, I thought that was a demo value, so I'll use it. Thank you.
Speaker 1 / Mark: Um, yeah, Bishop, also just for clarity what you guys are going to show there: we need to understand like the different marketing metrics that we are kind of interested in, and typically we track quantity, yeah? The quantities that you would track right now is: how many pages, how many, uh, like kind of blog or resource pages do we have? That's one quantity you track.
Speaker 1 / Mark: That's one. Number two: how many directories have we submitted to? So a directory is submitted by you kind of like, in this platform you would say, uh, "Add new," enter the URL of the directory, and then save.
Bishop: All right.
Speaker 1 / Mark: Yeah? Then, if you want—this is optional, but it'll be nice to have this—if we can kind of, uh, track the amount of traffic, that is we would like edit maybe probably in-line, like how much traffic did this thing actually bring us, like three or four or whatever.
Bishop: Okay. All right, so for clarity, I don't really understand what you mean by directory.
Speaker 1 / Mark: A directory is like all this, uh, Reddit, or um, those places that you list your SaaS, AlternativeTo, those kind of places.
Bishop: So just like a published content online, a public published content?
Speaker 1 / Mark: Yes. Or, or like a press thing, you know? That is, uh, like a TechCrunch or TechCabal, like we are listed there.
Bishop: All right, no problem. Thank you.
Speaker 1 / Mark: You get? So, so what you are doing is basically a list of items, yeah? That, that's actually what you have in there, a list of like, um, places or, or different pieces of things. Uh, start off with content. Content is the clearest.
Bishop: All right.
Speaker 1 / Mark: Okay, great. So, uh... That was Team Volkan. So DB you don't have, and Team Task working, not yet.
Okay, any other team?
Uh, Avi, there's not supposed to be sign up, oh. Don't confuse them. Like it's an internal thing, so you can't really sign up for it.
[Avi]: Yeah, yeah, you know you said that, um, you're giving them points for authentication, but then...
Speaker 1 / Mark: [Laughs] Okay, okay, okay, okay.
[Avi]: It's just dummy.
Speaker 1 / Mark: All right, um, any other team ready?
[Participant]: Mark, there's no other team. Let's call it a day and wait for 7:00 PM. [Laughs]
Speaker 1 / Mark: Oh, somebody has raised their hand. Ifechukwu.
Ifechukwu?
Ifechukwu: Okay, hello. Can you hear me?
Ifechukwu: All right, okay. So I'm from Team Yoda. My team lead is currently not available, but we have the link to the app, like for the demo. I don't know if I can just paste it in the chat.
Speaker 1 / Mark: You can, you can, but then you'll defend it.
Ifechukwu: Oh. Okay.
Speaker 1 / Mark: You're dropping it?
Ifechukwu: Yes, I am.
Speaker 1 / Mark: [Laughs] No, no. That's a zero. You have failed already, so.
Ifechukwu: Okay, sir, can I know why?
Speaker 1 / Mark: It's Vercel now. Like, vercel.app. And what is Zedu Preflight? What does Preflight even mean?
Speaker 1 / Mark: "Know if Zedu is ready to ship." Okay, that. Yeah, no, you can't do that. We don't accept Vercel. Like we—the point is to, to actually show that you have it on our infrastructure, you are pushing everything. Like it's not, um, it's not like that it's working somewhere else.
Ifechukwu: Okay, okay. I understand. Thank you.
Speaker 1 / Mark: All right. Okay, great, so that's it, yeah? Let's, uh, let's just schedule the next one right now. Let me check. Can we do 7:00? Let's do 7:00.
So next check-in: Check-in, the teams by 7:00.
So I drop the link here in the chat, you guys can register. Uh, so let me push up the difficulty a bit for the next one. So definitely PR, PR merge. Okay, yeah, it's this PR merge, uh, PR submitted thing. By the way, all of you are missing these points. All you need to do is go to Zedu and drop it under "New Feature Alert."
That's all. Like I'm not even—like only one team has done that so far. You have to basically go in there and like say, "We are, we are getting this, uh, group of PRs live," and then you get your points for that. And each one you drop will give you more points. So you can drop several; you're allowed to drop up to 10 in a day.
So DB... Um, so I'll say Team Task working, uh, so create—let's call it CR, which will be Create, Read list. So out of the CRUD, CR plus L, will be Create and Read. If I can see those two, then you'll get, um, I'll give you like, uh, three points for that.
And then, uh, the... Then, uh, Team Task You: one point. That's uh, updates.
Okay. Thanks everyone for attending. So we meet again by 7:00 PM, where the next set of points will be evaluated.
So check-in to 15:10... So this is one... This Team Endor. Thank you, Price. All right.
Avi, they're asking you about the game thing.
[Avi]: Oh, I thought Sodiq already handled that with them.
Speaker 1 / Mark: Sodiq did it? He showed them how to do it?
[Avi]: No, I thought that was what the call earlier this morning was about.
Speaker 1 / Mark: Um, I don't know. Uh, but I mean you should go ahead and do it now. I think you know how to make games.
[Avi]: I will actually have to go check first because I've not done—I've only done one, like two years ago, and that's all. So, I have to go check.
Speaker 1 / Mark: It's super simple. Just say, like, "Make a Three.js game," and then give the concept. Like, it actually knows how to do it.
[Avi]: Yeah, sure.
Speaker 1 / Mark: Okay. Thanks, everyone. Bye.
