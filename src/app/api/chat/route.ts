import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { buildKnowledgeContext, isKnowledgeBaseError } from "@/lib/knowledge";
import { prisma } from "@/lib/prisma";

function verifyServiceToken(req: Request): boolean {
  const serviceToken = req.headers.get("x-zoe-service-token");
  const expected = process.env.ZOE_SERVICE_TOKEN;
  return Boolean(serviceToken && expected && serviceToken === expected);
}

async function getAuthenticatedUser(req: Request) {
  // 1. Service-token auth (for server-to-server calls from FE proxy)
  if (verifyServiceToken(req)) {
    const userId = req.headers.get("x-user-id");
    const orgId = req.headers.get("x-user-org");
    if (userId) {
      return { id: userId, orgId: orgId ?? null };
    }
  }

  // 2. Fallback: NextAuth session (existing behavior for direct browser access)
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

const zeduDocContent = `
=== ZEDU TASK DOCUMENTATION ===
- ≡ƒô¥ Stage 1 Submission Form


This is the submission form for the Stage 1 task below. Submit your work here ≡ƒæë https://forms.gle/XCeh6TcKjwnFtTCW6 


Tasks to complete before Wednesday:
1. Join a team and ensure you are in their telegram chat
2. Build a todo list with AI
3. Make your todo list go live on the web
4. (Advanced) Make an agents.md file and make it structure your work
5. (Advanced) Push your code to your private GitHub


ΓÅ░ Deadline: Tuesday, 29th, 11:59pm WAT


≡ƒÄÑ Lesson 1 call recording (this morning): https://drive.google.com/file/d/1bJQ-DSdi8cx5WkA9DBRCKnEsyM_7mx5z/view?usp=sharing  
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


≡ƒôî HNG15 | Lesson 2 Submission


Submit your Stage Two work here ≡ƒæç≡ƒÅ╛
https://docs.google.com/forms/d/e/1FAIpQLSewMLKjMDSvoEIIlaPVi3HxVN9Y1ijz1MTBiBjpx5Y1k2GuEw/viewform


ΓÅ░ Deadline: Friday, 11:59 PM (WAT). Late submissions won't be accepted.


ΓÇó Task 1 (Individual): everyone submits their shop website.
ΓÇó Task 2 (Team): the dev who did the Zedu group setup submits for the team. 
Lesson 3 Task
Deadline: Monday, 5 October 2026, at 11:59 PM (WAT).
Individual Task: Build a Mobile App for Your Shop
Create a mobile app for your existing shop website using the same API endpoints.
Your app must meet these requirements:
* Users must be able to log in to both the website and mobile app using the same account.
* When a user adds an item to their cart on the website, it must instantly appear in their cart on the mobile app.
* Test the mobile app on a physical phone to confirm that login and cart synchronisation work correctly.
________________




Team Task: Present Your TeamΓÇÖs Version of Zedu
Present your teamΓÇÖs version of Zedu. Every team member must edit at least one piece of text and ensure their change is merged into the central staging branch and deployed to production.
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
   * The cart must synchronize in both directions: Web ΓåÆ Mobile and Mobile ΓåÆ Web.
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
Screenshot existing UI ΓåÆ give it to Claude/another AI ΓåÆ generate an improved design ΓåÆ submit the design as a ticket ΓåÆ get approval ΓåÆ implement it.


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
The fix can be very small.Γ£î∩╕Å




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

function buildSystemPrompt(knowledgeContext: string) {
  return `
You are  Zoe, the official Zedu Contributor Assistant. Your job is to help interns find tasks, guidelines, and resources from the official Zedu project document and the cohort's own calls.

Strict Rules you MUST follow:
1. **Source of Truth:** Answer questions based ONLY on the content provided below. Never invent, guess, or bring in external bootcamp information (e.g., do not talk about shop websites, mobile APKs, or external tech stacks unless they are explicitly in the text).
2. **Clarification First:** If a user asks about something ambiguous or a timeframe (like "Week 2") that does not have an exact match in the provided context, do not guess or map it arbitrarily. Instead, briefly ask a clarifying question (e.g., "I couldn't find an exact match for 'Week 2' in the provided context. Did you mean Task X or Tab Y?").
3. **Clean Formatting:** Always use structured Markdown (headings, bullet points, bold text) for readability. Never output a dense wall of text.
4. **Rich Resource Links:** Whenever a video, slide deck, or submission link appears in the text relative to the answer, format it cleanly as a clickable Markdown link (e.g., [Submission Form](URL), [Video Guide](URL), [Slide Deck](URL)).
5. **Two Sources, Both Authoritative:** The "OFFICIAL ZEDU DOCUMENTATION" section holds the task specs and submission requirements. The "COHORT CALL KNOWLEDGE" section holds what was actually said and decided on the cohort's calls (team assignments, process changes, deadlines and Q&A from the meetings). Use the documentation for task requirements and the call knowledge for anything discussed on a call - which team is doing what, what was announced, what was decided. Consult BOTH sections before answering, and never report that a topic is missing or unavailable without searching the cohort call knowledge as well. If the two disagree, say so plainly instead of silently choosing one. If a "CALL TRANSCRIPT — EXACT WORDING" section is present, quote it when the user needs the exact words that were used.
6. **Answer Only What Was Asked:** Keep the reply proportional to the question. A greeting, small talk, or a simple question gets a short conversational reply (one or two sentences) plus an offer to help - never a summary of tasks, deadlines, or knowledge-base content the user did not ask for. Save structured, detailed answers for substantive questions about tasks, deadlines, teams, or processes.

=== OFFICIAL ZEDU DOCUMENTATION ===
${zeduDocContent}

${knowledgeContext}
`;
}

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Method not allowed" },
      { status: 405, headers: { Allow: "POST" } },
    );
  } catch (error) {
    console.error("Chat API authentication failed:", error);

    return NextResponse.json(
      { error: "Unable to authenticate chat request." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.AI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 503 },
      );
    }

    const openRouter = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://contributors.zedu.chat",
        "X-Title": "Zedu Contributors Helper",
      },
    });

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("messages" in body) ||
      !Array.isArray(body.messages)
    ) {
      return NextResponse.json(
        { error: "Expected a messages array." },
        { status: 400 },
      );
    }

    const messages = body.messages;

    const validMessages = messages.every(
      (message: unknown) =>
        typeof message === "object" &&
        message !== null &&
        "role" in message &&
        "content" in message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string",
    );

    if (!validMessages) {
      return NextResponse.json(
        { error: "Invalid messages." },
        { status: 400 },
      );
    }

    const lastUserMessage = [...messages]
      .reverse()
      .find((message) => message?.role === "user");

    let knowledgeContext: string;

    try {
      knowledgeContext = await buildKnowledgeContext(
        typeof lastUserMessage?.content === "string" ? lastUserMessage.content : "",
      );
    } catch (error) {
      if (isKnowledgeBaseError(error)) {
        console.error("Chat API knowledge base unavailable:", error.message);

        return NextResponse.json(
          { error: "Knowledge base is unavailable." },
          { status: 503 },
        );
      }

      throw error;
    }

    const systemPrompt = buildSystemPrompt(knowledgeContext);

    // Restored history makes requests grow without bound; the model only needs the recent tail.
    const recentMessages = messages.slice(-30);

    // Persistence is best-effort: a database outage must never block a reply.
    let chatId: string | null = null;

    if (user.id && lastUserMessage) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {},
          create: { id: user.id },
        });

        const chat =
          (await prisma.chat.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
          })) ?? (await prisma.chat.create({ data: { userId: user.id } }));

        await prisma.message.create({
          data: {
            chatId: chat.id,
            role: "user",
            content: lastUserMessage.content,
          },
        });

        chatId = chat.id;
      } catch (error) {
        console.error("Chat API could not persist the user message:", error);
      }
    }

    let completion;

    try {
      completion = await openRouter.chat.completions.create(
        {
          model: "deepseek/deepseek-v4-flash-0731",
          messages: [
            { role: "system", content: systemPrompt },
            ...recentMessages,
          ],
          stream: true,
        },
        { signal: req.signal },
      );
    } catch (error) {
      console.error("Chat API model request failed:", error);

      return NextResponse.json(
        { error: "Unable to process your chat request." },
        { status: 502 },
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: { delta?: string; error?: string }) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        };

        let reply = "";

        try {
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;

            if (delta) {
              reply += delta;
              send({ delta });
            }
          }

          if (chatId && reply) {
            try {
              await prisma.message.create({
                data: { chatId, role: "assistant", content: reply },
              });
            } catch (error) {
              console.error("Chat API could not persist the assistant reply:", error);
            }
          }
        } catch (error) {
          if (!req.signal?.aborted) {
            console.error("Chat API stream interrupted:", error);

            try {
              send({ error: "The response was interrupted. Please try again." });
            } catch {
              // The client already disconnected.
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat API request failed:", error);

    return NextResponse.json(
      { error: "Unable to process your chat request." },
      { status: 500 },
    );
  }
}
