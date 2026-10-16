# [2026-10-04] Session 2: Frontend Architecture: Next.js 16, Agora Buzz & Centrifugo

- **Date:** 2026-10-04
- **Duration:** 56:15
- **Speakers:** David Chen (Frontend Architect), Tunde O. (Audio/Video Lead), Alex M. (Lead Reviewer)
- **Target Product:** Zedu Chat (`zedu.chat` / `zedu-fe`)
- **Standardized Name:** `2026-10-04_frontend_architecture_agora_centrifugo.md`

---

## Session Overview & Context

Technical deep dive covering Next.js 16 App Router conventions, instant voice/video calls via Agora RTC/RTM (Buzz), WebSocket subscriptions with Centrifugo, and RBAC permission boundaries.

---

## Verbatim Transcript & Segments

### `[00:30]` **David Chen** (Frontend Architect)

> "All app routes live under src/app/. Route-local components MUST go into a private _components/ folder inside that route. Shared UI primitives from shadcn live in src/components/ui/. Shared custom hooks live in src/hooks/. Global state is strictly React Context + useReducer inside src/store/. Do NOT bring in Redux or Zustand!"

### `[05:10]` **Tunde O.** (Audio/Video Lead)

> "Buzz is Zedu's instant voice and video meetings. Client hooks live in src/hooks/buzz/. When a user joins Buzz, the frontend calls the server API route src/app/api/agora/token/route.ts which uses AGORA_APP_ID and AGORA_APP_CERTIFICATE to generate an Agora RTC/RTM token. Note: Buzz calls do not work in PR previews because credentials are not shared in preview runners; always test Buzz locally with your team .env."

### `[10:50]` **David Chen** (Frontend Architect)

> "For live messaging, typing indicators, and presence, Zedu uses Centrifugo WebSocket server (NEXT_PUBLIC_CONNECT_URL). Channel subscriptions follow org:<org-id>:channel:<channel-id>. Always use optimistic UI updates for smooth chat experience."

### `[17:00]` **David Chen** (Frontend Architect)

> "Two hard conventions: Wrap sensitive actions in <PermissionBoundary> from src/components/rbac/. Second, Toast notifications: Use Sonner wrappers from src/components/toast/sonner.tsx (showSuccess, showError). Do NOT use react-toastify or cogo-toast!"

---

## Key Action Items & Ground Rules

- **Component Structure:** Next.js 16 App Router under `src/app/`. Route-local components in private `_components/` directory. Shared primitives in `src/components/ui/`.
- **State & Networking:** React Context + useReducer in `src/store/` (no Redux/Zustand). Use `GetRequest` / `PostRequest` from `~/utils/new-request`.
- **Real-time & Video:** Centrifugo for WebSockets (`NEXT_PUBLIC_CONNECT_URL`). Agora for Buzz instant voice/video calls.
