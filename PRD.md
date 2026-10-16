# Product Requirements Document (PRD)

**Product Name:** Zedu Contributor Helper

**Document Version:** 1.0.0

**Target Delivery:** Sunday, 18th October, 2026.

**Status:** Approved 

---


## 1. Executive Summary

The **Zedu Contributor Helper** is a dedicated web application hosted on a subdomain designed to onboard, unblock, and clarify technical and operational workflows for contributors.

By ingesting real-time project documentation, meeting transcripts, sprint roadmaps, and PRD specifications, the Helper provides up-to-date answers on project state, active deliverables, submission guidelines, and sprint context. The system relies on large-context LLM models via **OpenRouter** using full in-context passing, coupled with automated document cleaning/filtering and an administrative review lifecycle to maximize context efficiency without losing critical detail.

**Architecture constraint:** The system integrates authentication and relational data patterns utilizing secure server-side routes, relational database storage (PostgreSQL/MySQL), and OpenRouter API integration. Client-side handling respects role-based boundaries, ensuring complete separation of administrative actions and contributor query sessions.

---

## 2. Problem Statement

Analysis of feedback from zedu contributors identifies four key onboarding and collaboration friction points:

1. Critical project instructions,  documents, and submission links become lost or buried in chat channels.
2. Mentors and maintainers and team leads spend excessive manual time answering repetitive onboarding questions and reconciling fragmented updates.
3. New and returning contributors cannot easily determine the current state of the project, what deliverables are open, or how to resume work.
4. There is no unified, searchable real-time context bridge capturing alignment outcomes from ongoing sync calls.

---

## 3. Goals

### 3.1 Product Goals

* Provide contributors with a centralized, intelligent workspace to get immediate clarity on project status, active tasks, and execution guidelines.
* Establish an automated preprocessing pipeline that strips away meeting chatter while preserving 100% of technical specs, deadlines, and action items.
* Implement a robust administrative workflow for document ingestion, human-in-the-loop review, and active context lifecycle management.
* Maintain session persistence so users can track and revisit past conversation threads.
* Implement a quality feedback loop via response upvoting/downvoting to track model performance.

### 3.2 Sprint 1 Success Criteria

* Contributors can authenticate, open chat sessions, use pre-configured quick prompts, and receive contextual answers based on active documentation.
* Admins can upload raw transcripts (`.txt`, `.vtt`, `.md`, `.pdf`, `.docx`), run noise reduction, preview processed text, and toggle documents between active and archived states.
* Chat sessions and messages are reliably persisted in the relational database.
* The system gracefully handles OpenRouter rate limits or token boundary errors with clean user-facing fallback messages and retry options.
* The UI is visually polished, responsive, and ready for future translation into a floating edge widget.


---

## 4. Users and Permissions

### 4.1 Contributor

* **Can:** Authenticate securely, access the chat interface, view active knowledge base state (list of active documents), execute quick prompt queries, review past chat sessions via session history, and upvote/downvote responses.
* **Cannot:** Upload raw documents, alter the processing pipeline, archive/activate core knowledge base files, or access admin analytics.

### 4.2 Administrator

* **Can:** Perform all contributor capabilities, upload raw documents and transcripts, trigger the pre-processing engine, review and approve cleaned text before it hits active context, toggle document active/archived states, and view feedback analytics.
* **Cannot:** Bypass database-level constraints or expose server-side OpenRouter API keys to the client.

### 4.3 Server-Side Enforcement

* Every protected API route must authenticate requests using backend validation checks.
* Role-based access control (RBAC) must restrict document uploads and state changes strictly to users with `admin` or `lead` roles.
* Client attempts to manipulate protected database fields or spoof roles must be rejected at the API boundary.

---

## 5. Scope

### 5.1 Sprint 1: Committed Scope

* Subdomain-hosted web application with a modern, responsive layout.
* User Authentication & RBAC (Contributor vs. Admin/Lead).
* Document Upload module supporting multiple file formats (`.txt`, `.vtt`, `.md`, `.pdf`, `.docx`).
* Automated Pre-Processing Engine for noise reduction (retaining core decisions, specs, and deadlines without lossy summaries).
* Human-in-the-Loop review checkpoint for admins to preview/approve processed transcripts.
* Knowledge Base Lifecycle Management (Active vs. Archived toggles to control token budgets).
* In-Context Ingestion pipeline sending active documents directly to OpenRouter large-context LLM models.
* Persistent Chat Sessions & Message History stored in a relational database.
* Pre-configured quick-prompt buttons for fast onboarding.
* Response voting (Upvote/Downvote) with optional feedback comments.
* Error handling and fallback states for OpenRouter timeouts or token limit violations.

### 5.2 Explicitly Deferred

* Vector embeddings and RAG vector search indexing.
* Floating edge widget embed script on the main landing page.

---

## 6. User Journeys

### 6.1 Contributor asks an onboarding question

1. The contributor opens the Zedu Contributor Helper subdomain and signs in.
2. The user views their past session history in the sidebar or initiates a new chat session.
3. The user clicks a pre-configured quick prompt (e.g., *"What deliverables are open and how do I submit my work?"*) or types a custom question.
4. The system assembles the active knowledge base documents in-context and submits the prompt to OpenRouter.
5. The chat interface streams the response in real-time with code highlighting and markdown support.
6. The user rates the response using the upvote/downvote buttons if needed.

### 6.2 Admin processes a post-meeting transcript

1. An admin logs into the dashboard immediately following a team sync call.
2. The admin uploads the raw transcript file (`.vtt` or `.txt`).
3. The automated processing engine strips out small talk and setup delays while preserving all decisions, action items, and technical specs.
4. The admin reviews the processed text side-by-side with the raw upload using the human-in-the-loop preview interface.
5. The admin approves the document and marks it as **Active**.
6. The document is instantly factored into subsequent contributor chat context windows.
7. To prevent token bloat from older meetings, the admin toggles outdated sprint documents to **Archived**.

---

## 7. High-Level Architecture & System Boundaries

```
 ┌────────────────────────┐       ┌───────────────────────────┐
 │   Frontend (Web App)   │       │   Admin Dashboard / KB    │
 │ Subdomain / Edge UI    │       │ Document Upload & State   │
 └───────────┬────────────┘       └─────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
 ┌────────────────────────────────────────────────────────────┐
 │                  Backend Service / API                     │
 │  • Auth & User Management                                  │
 │  • Transcript / Doc Pre-Processing Engine                  │
 │  • Dynamic Context Assembler                               │
 │  • OpenRouter LLM Gateway                                  │
 └───────────┬──────────────────────────────────┬─────────────┘
             │                                  │
             ▼                                  ▼
 ┌────────────────────────┐       ┌───────────────────────────┐
 │   Relational DB        │       │    OpenRouter API         │
 │ Users, Raw & Clean Docs│       │ Large-Context LLM         │
 │ Feedback / Ratings     │       │ (In-Context Ingestion)    │
 └────────────────────────┘       └───────────────────────────┘

```

---

## 8. Functional Requirements

### FR-01: Authentication & Access Control

* Secure authentication required for all routes.
* Role-based checks separating standard contributors from administrative users.

### FR-02: Document Ingestion & Pre-Processing

* Support file uploads (`.txt`, `.vtt`, `.md`, `.pdf`, `.docx`).
* Automated noise reduction stripping filler words while preserving decisions, action items, deadlines, and technical specifications without lossy summarization.
* Human review interface allowing admins to inspect and approve processed text prior to activation.

### FR-03: Knowledge Base Lifecycle Management

* Display a comprehensive index of ingested documents indicating Title, Date Added, Active/Archived Status, and Original vs. Processed Token/Character counts.
* Enable admins to toggle documents between active and archived states to manage token budgets.

### FR-04: Context-Aware Chat Interface & Persistence

* Dynamic assembly of active documents into the OpenRouter model's context window per query session.
* Relational persistence of `ChatSessions` and `ChatMessages` allowing users to switch between historical threads.
* Quick-prompt workflow templates for instant unblocking.
* Responsive, visually polished UI supporting dark/light themes and markdown rendering.

### FR-05: Quality Control & Feedback Loop

* Thumbs up / thumbs down voting on individual assistant responses.
* Optional text input prompt on downvote to capture qualitative failure context for prompt tuning.
* Admin analytics view tracking response ratings over time.

---

## 9. Data Model Proposal

The architecture uses a relational database (PostgreSQL / MySQL) structured around five core entities:

### 9.2 `Documents`

* `id` (Primary Key)
* `title` (String)
* `raw_content` (Text)
* `processed_content` (Text)
* `source_type` (String)
* `status` (Enum: `active`, `archived`)
* `created_at` (Timestamp)

### 9.3 `ChatSessions`

* `id` (Primary Key)
* `user_id` (Foreign Key referencing `Users.id`)
* `title` (String)
* `created_at` (Timestamp)

### 9.4 `ChatMessages`

* `id` (Primary Key)
* `session_id` (Foreign Key referencing `ChatSessions.id`)
* `sender` (Enum: `user`, `assistant`)
* `content` (Text)
* `created_at` (Timestamp)

### 9.5 `Feedback`

* `id` (Primary Key)
* `message_id` (Foreign Key referencing `ChatMessages.id`)
* `user_id` (Foreign Key referencing `Users.id`)
* `rating` (Enum: `up`, `down`)
* `comment` (Text, Nullable)
* `created_at` (Timestamp)

---

## 10. API Requirements

* **Authentication Endpoint:** Handles secure user session initialization and token claims.
* **Document Upload (`POST /api/upload`):** Handles raw file reception, file-type validation (`.txt`, `.vtt`, `.md`, `.pdf`, `.docx`), and initial staging.
* **Document Ingestion & Processing (`POST /api/ingest`):** Manages asynchronous document parsing, noise-reduction/filtering (stripping chatter while preserving specs and deadlines), human review flagging, and active context pipeline integration.
* **Document State Management (`PATCH /api/documents/:id/status`):** Toggles documents between active and archived states to manage the token budget.
* **Chat Session Endpoints (`GET /api/sessions`, `POST /api/sessions`, `GET /api/sessions/:id/messages`):** Manages user conversation history and persistence.
* **LLM Proxy Gateway (`POST /api/chat`):** Assembles active context documents server-side, interacts securely with OpenRouter using environment-stored API keys, and streams responses to the client.
* **Feedback Endpoint (`POST /api/feedback`):** Records upvote/downvote ratings and optional comments.


---

## 11. Non-Functional Requirements

* **Latency:** Transcript pre-processing completion within $< 5$ minutes. LLM chat response streaming initialized with standard responsiveness matching large-context model capabilities.
* **Error Handling:** Gracefully display a clear retry button or fallback message in the chat UI if OpenRouter requests fail or encounter token/rate limit exceptions.
* **UI Polish:** Modern, responsive component styling adhering strictly to Zedu design standards.
* **Security:** OpenRouter API keys and sensitive credentials stored strictly server-side in secure environment variables.

---

## 12. Out of Scope for MVP

* Vector embeddings and RAG vector store indexing.
* Floating edge widget embed script on the main landing page.

