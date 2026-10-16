import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { prisma } from '@/lib/prisma';

const groq = new Groq({ apiKey: process.env.AI_API_KEY });

const zeduDocContent = `
=== ZEDU TASK DOCUMENTATION ===
- 📝 Stage 1 Submission Form


This is the submission form for the Stage 1 task below. Submit your work here 👉 https://forms.gle/XCeh6TcKjwnFtTCW6 


Tasks to complete before Wednesday:
1. Join a team and ensure you are in their telegram chat
2. Build a todo list with AI
3. Make your todo list go live on the web
4. (Advanced) Make an agents.md file and make it structure your work
5. (Advanced) Push your code to your private GitHub


⏰ Deadline: Tuesday, 29th, 11:59pm WAT


🎥 Lesson 1 call recording (this morning): https://drive.google.com/file/d/1bJQ-DSdi8cx5WkA9DBRCKnEsyM_7mx5z/view?usp=sharing  
HNG15 | Lesson 2
Deadline: Friday, 11:59 PM (WAT)

Task 1: Individual Task
Build a website for a shop.
* Add a checkout page.
* Persist everything in a database using Supabase/Neon.
* Send confirmation emails using Mailgun.
* Do Google auth using Google Cloud Console.
Deadline: Friday, 11:59 PM
________________




Task 2: Team Task (
Should be done by a professional Dev in your team)
Set up the group version of Zedu.
* Create a Zedu Org on your team version and send messages.
* Do one group PR where you add zedu.chat/contributors/<teamname>
* List all team members there.
Deadline: Friday, 11:59 PM


📌 HNG15 | Lesson 2 Submission


Submit your Stage Two work here 👇🏾
https://docs.google.com/forms/d/e/1FAIpQLSewMLKjMDSvoEIIlaPVi3HxVN9Y1ijz1MTBiBjpx5Y1k2GuEw/viewform


⏰ Deadline: Friday, 11:59 PM (WAT). Late submissions won't be accepted.


• Task 1 (Individual): everyone submits their shop website.
• Task 2 (Team): the dev who did the Zedu group setup submits for the team. 
Lesson 3 Task
Deadline: Monday, 5 October 2026, at 11:59 PM (WAT).
Individual Task: Build a Mobile App for Your Shop
Create a mobile app for your existing shop website using the same API endpoints.
Your app must meet these requirements:
* Users must be able to log in to both the website and mobile app using the same account.
* When a user adds an item to their cart on the website, it must instantly appear in their cart on the mobile app.
* Test the mobile app on a physical phone to confirm that login and cart synchronisation work correctly.
________________




Team Task: Present Your Team’s Version of Zedu
Present your team’s version of Zedu. Every team member must edit at least one piece of text and ensure their change is merged into the central staging branch and deployed to production.
Stage 2 eligibility: Only team members whose text changes are live in production will qualify to advance to Stage 2 of HNG15.
You have two things to submit. 
First is a github PR link of your contribution in your team, and then the mobile application version of your eCommerce website from lesson 2.
For the Mobile Application Submission here is what you are required to submit :
1. APK download link
Upload your APK to Google Drive (or another accessible file-sharing service) and provide a link that allows us to download it.
2. Repository link
Provide the GitHub/Git repository containing the source code for your mobile application.
3. Video demonstration
Record a single, continuous video demonstrating that your mobile application works correctly with your existing e-commerce website.
In the video, demonstrate the following:
   1. Open your web application and sign in a new account.
   2. Show that you are successfully logged in.
   3. Add an item/product to your cart on the web application.
   4. Open your mobile application.
   5. Log in to the mobile application using the same account/credentials.
   6. Show that the item you added to the cart on the website is also visible in the mobile application's cart.
   7. Add another item to the cart from the mobile application.
   8. Return to the web application.
   9. Show that the item added from the mobile application is now also visible in the web application's cart.
Important
   * The video should clearly show the web application and mobile application during the demonstration.
   * The login must use the same user account on both platforms.
   * The cart must synchronize in both directions: Web → Mobile and Mobile → Web.
   * Please demonstrate the application running on a physical mobile device.
   * Keep the video focused on the required functionality. No long introductions or explanations are necessary.
   * Submit one continuous recording where possible; avoid editing together separate clips.

Submission Link: https://docs.google.com/forms/d/e/1FAIpQLSeAkkPmPHtuHhP7JIUnXmMxv4lxARw1GOjvuWMAdxpAqX5CBQ/viewform?usp=header




Lesson 4 Task

Individual & Team Task
      * Each team will get points for each person who successfully achieves tasks. The tasks involve two things - setup + judgement/taste
Each person has a maximum of 4 points. A team has to achieve 60 points to survive as a team. The highest points team wins N50k. Each person gets 1 point per task and 1 point extra for helping others. Only 5 people can earn the extra 1 point. All teams will fire the 10 least productive members.

Ticket Approval Method
      * Teams are allowed to suggest tickets. All tickets should be pre-vetted by Tifanni (BigTiff). Once pre-approved, you can add to GitHub for approval.
Wait till it is approved in GitHub before you start work on it.

Task 1 (Mobile Setup)

Setup Zedu mobile on your local and run it on your phone. Your video should show a fix specific to your team. One person from your team should make a singular fix and it should only be available to the group. All team members should show it running with that fix. After the video, the fix is to be pushed to live.
The fix should be a ticket in the standard format in GitHub of Zedu mobile (the central one, not the staging one). It should be approved there.

Task 2 (Desktop Setup)

Setup Zedu desktop and get the app to run on your desktop. Just like mobile, one member of each team should fix something and share to all team members. You are free to merge to central if it helps you run it.

Task 3 (Ticketing + Taste)

Open Zedu Web and identify something small that you can work on. If you are non-technical, choose something on one of the external pages. Create a ticket for it after approval by Tifanni. As part of your ticket creation, write up WHY this thing needs to exist. How does it help the app.

Focus on marketing (the external pages mostly) or focus on technicals (how it makes the app better).

The ticket has to be small enough that you can realistically do it. You do not need to actually work on it, but you can start work on it and open a PR if you want (advanced). 


Guide to submission: https://media.zedu.chat/telexprodbucket/public/file-uploads/f9db8e2716dd85903ad0b0f9b17d1021515b33ff336b2b89b8918050bc05638f.pdf 




Deliverables for Task 5
The deadline is Sunday.
Task 1: Deliver a Zedu ticket
         * Pick an approved Zedu ticket and implement it.
         * The preference is for very small, focused changes.
         * Because AI can easily make huge changes, contributors should avoid asking AI to broadly modify the codebase.
Minimal change that completely fixes the issue is preferred.
         * Reviewers will reject unnecessary changes.
________________


Task 2: Redesign something in Zedu
Everyone is now expected to participate in design, regardless of their previous role.
You can choose:
            * Web
            * Mobile
            * Desktop
Find something small and specific and redesign/improve it.

The suggested workflow is:
Screenshot existing UI → give it to Claude/another AI → generate an improved design → submit the design as a ticket → get approval → implement it.


Task 3: Team task
Design/spec a new feature - One step harder, small
Work with your team to:
            * Identify a small new feature
            * Define/spec it
            * Get it approved
            * Design it and get it reviewed by Mark & Reviewers
            * Eventually, introduce it to Zedu
The feature should remain small enough to be realistically implemented.
________________


Task 4: Make a marketing contribution
Everyone must think like a marketer, not just a developer.
Create a marketing-related contribution that can potentially drive traffic or users to Zedu.
Examples include:
            * SEO
            * New SEO pages
            * Improving page titles/meta information
            * Viral/invite functionality
            * Shareable pages
            * Email campaigns
            * Social media/OG improvements
            * Directory submissions
            * Other traffic-generation ideas

Not every marketing activity needs to be a code ticket.
For example,
If you submit Zedu to a directory, you can document the activity as your report,
If it's an actual product/code change, such as an SEO improvement, it should become a normal repository ticket.
________________


Task 5: Mobile or desktop contribution
Everyone must make at least one contribution to either mobile or desktop.
There have been too many web tickets and too few mobile/desktop tickets, so contributions now need to be distributed across platforms.
The fix can be very small.✌️




Individual Checks for the week
            * We will check by end of the day today that your PR is in your team's repo and merged in (you stay in the program). PR includes video showing you testing it on your teams repo (url should be visible)
            * We will check that your PR has been included in a PR to the central staging, even if it is not merged yet (you gain 1 point for the week)
            * You are to deliver a fix to the desktop app, get it merged in and live (Sunday goal)
            * You are to assign yourself a ticket with more than 10 votes (on our new ticketing dashboard - issues.zedu.chat), get it fixed and live (Sunday goal).
Individual Tasks for the week
            * You are to build a game based on threejs and publish it on the start.ng platform. Your game must use the logged in users of start.ng. Styling centrally must affect the look of your character in your game
            * We will check by end of the day today that your PR is in your teams repo and merged in
            * You are to deliver a fix to the desktop app, get it merged in and live. Any small fix is fine.
            * You are to assign yourself a ticket with more than 10 votes (on our new ticketing dashboard), get it fixed
Team Tasks for the week
            * Each team gets one mini-project to deliver:
            * 1. Bug tracking interface (Team Endor)
            * 2. Marketing dashboard (metric tracker) - Team Vulcan
            * 3. Android Push notifications (exit onesignal) - Team Mando
            * 4. iOS Push notifications (exit onesignal) - Team Groot
            * 5. Start.ng platform (Team Cybertron)
            * 6. Marketing dashboard (sales) - marketing.zedu.chat, Team Vadar
            * 7. Build Contributors help platform, which is an AI that explains everything based on transcripts (from this internship) - Team Neo
            * 8. Pre-release automated tester - Team Yoda
            * Each team should get 20 priority tickets live on central staging before Sunday.
Recap of process
            * All teams should validate PRs and test within the team
            * Once a team is ready, they make a branch with all the PRs, and send in Zedu for review. Add a review video. Add a link to the team version showing that this feature is working
            * The testing script will run on their own version and give a report (regression testing, new feature, not available yet)
            * A PR is opened to central staging, who review and merge if all is well
            * Central staging opens to prod
Addition to the process moving forward
            * Tickets should be added to our own issue tracker and everyone should vote for them


Slide link: https://docs.google.com/presentation/d/1kvzASBYU2ywPQlQxlsbPG75MXStg0nf8oclJMWRrTTM/edit?usp=drivesdk
`;


const systemPrompt = `
You are  Zoe, the official Zedu Contributor Assistant. Your job is to help interns find tasks, guidelines, and resources from the official Zedu project document.

Strict Rules you MUST follow:
1. **Source of Truth:** Answer questions based ONLY on the document content provided below. Never invent, guess, or bring in external bootcamp information (e.g., do not talk about shop websites, mobile APKs, or external tech stacks unless they are explicitly in the text).
2. **Clarification First:** If a user asks about something ambiguous or a timeframe (like "Week 2") that does not have an exact match in the document, do not guess or map it arbitrarily. Instead, briefly ask a clarifying question (e.g., "I couldn't find an exact match for 'Week 2' in the tabs. Did you mean Task X or Tab Y?").
3. **Clean Formatting:** Always use structured Markdown (headings, bullet points, bold text) for readability. Never output a dense wall of text.
4. **Rich Resource Links:** Whenever a video, slide deck, or submission link appears in the text relative to the answer, format it cleanly as a clickable Markdown link (e.g., [Submission Form](URL), [Video Guide](URL), [Slide Deck](URL)).

=== OFFICIAL ZEDU DOCUMENTATION ===
${zeduDocContent}
`;
export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();

    const validSessionId =
      typeof sessionId === 'string' && sessionId.length >= 1 && sessionId.length <= 100
        ? sessionId
        : null;

    let chatId: string | null = null;
    if (validSessionId) {
      try {
        const user = await prisma.user.upsert({
          where: { sessionId: validSessionId },
          update: {},
          create: { sessionId: validSessionId },
        });
        const existingChat = await prisma.chat.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'asc' },
        });
        const chat =
          existingChat ?? (await prisma.chat.create({ data: { userId: user.id } }));
        chatId = chat.id;
        const lastMessage = Array.isArray(messages) ? messages[messages.length - 1] : null;
        if (lastMessage && typeof lastMessage.content === 'string') {
          await prisma.message.create({
            data: { chatId, role: 'user', content: lastMessage.content },
          });
        }
      } catch (dbError) {
        console.error('Failed to save user message:', dbError);
        chatId = null;
      }
    }

    const chatCompletion = await groq.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    });

    const reply = chatCompletion.choices[0]?.message?.content || "No response.";

    if (chatId) {
      try {
        await prisma.message.create({
          data: { chatId, role: 'assistant', content: reply },
        });
      } catch (dbError) {
        console.error('Failed to save assistant reply:', dbError);
      }
    }

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}