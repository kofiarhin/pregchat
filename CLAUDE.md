# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PregChat is a MERN-stack pregnancy wellness chatbot. Users chat with "Aya" (a Groq-powered AI assistant), track pregnancy progress, book midwife appointments, journal, and browse a store. The AI layer enforces red-flag triage rules and appends medical disclaimers.

## Commands

```bash
# Install all dependencies (root + server + client)
npm install && cd server && npm install && cd ../client && npm install

# Run full dev stack (concurrent client + server)
npm run dev

# Run server only (nodemon, port from PORT env or 5000)
npm run server

# Run client only (Vite on port 4000)
npm run client

# Tests
npm run test:server          # All Jest server tests (--runInBand)
npm run test:client          # Vitest client tests
npm run test:unit            # Jest unit tests only
npm run test:integration     # Jest integration tests only
npm run e2e                  # Jest E2E tests (90s timeout)

# Database seeding
npm run seed:store
node server/seed/seedAdmin.js
node server/seed/seedMidwives.js

# Production
npm start                    # node server/server.js
```

## Architecture

**Monorepo** with two packages: `client/` (React SPA) and `server/` (Express API). Root `package.json` orchestrates concurrent dev via `concurrently`.

### Client (`client/`)
- **React 18 + Vite** (ESM). Entry: `src/main.jsx` → `src/App.jsx`.
- **State**: Redux Toolkit (`store/store.js` — auth token, toasts, UI) + React Query (server cache). Three context providers: Cart, Booking, Voice.
- **Features pattern**: Each domain (`features/{auth,chats,messages,appointments,journals,store,...}/`) contains `hooks/` (React Query queries/mutations), `queryKeys.js`, and optional `storage.js` (localStorage fallback).
- **HTTP layer**: `api/http.js` — fetch wrapper with Bearer token injection, exponential backoff retry on 5xx, typed response handling.
- **Routing**: React Router v7. `ProtectedRoute` redirects unauthenticated users; `PublicOnlyRoute` redirects logged-in users. Two layout trees: `PublicLayout` (marketing pages) and `AppLayout` (authenticated app).
- **Vite proxy**: `/api`, `/auth`, `/updates`, `/admin` → backend (target configurable via `VITE_SERVER_PROXY_TARGET`).

### Server (`server/`)
- **Express**. Entry: `server.js` → `index.js` (startup) → `app.js` (route registration, middleware).
- **AI**: `config/ai.js` wraps Groq SDK. `askAya(text, region, dayData, stream)` runs red-flag triage first, then calls `llama-3.1-8b-instant`. System prompt in `config/prompts.js`, persona in `config/persona.js`.
- **Auth**: JWT in `Authorization` header. Middleware: `middleware/auth.js` (verify token), `middleware/requireAdmin.js` (role check).
- **Models**: 14 Mongoose schemas. Key ones: `User`, `Conversation` (chat history with message arrays), `Pregnancy` (LMP/due date, day index calculation), `DailyContent` (day 0–280 pregnancy updates), `Flag` (triage audit log).
- **Controllers**: One per domain in `controllers/`. Chat controller enriches requests with pregnancy context before calling Aya.
- **Safety**: `triageCheck` regex patterns short-circuit AI calls for emergency keywords, log `Flag` entries, and return region-specific emergency numbers. All AI responses get "Educational only — not a diagnosis" disclaimer.

### Key Data Flow (Chat)
1. Client sends `POST /chat/ask` with `{ text }` (optimistic UI via React Query mutation)
2. Server auth middleware verifies JWT, loads user's `Pregnancy` profile and `DailyContent`
3. `triageCheck` scans for red-flag patterns → if matched, logs `Flag`, returns triage message (no AI call)
4. Otherwise `askAya` calls Groq with system prompt + day context, appends disclaimer, persists to `Conversation`
5. Client reconciles response into React Query cache + localStorage fallback

## Environment Variables

Copy `.env.example` to `.env`. Key vars:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — signing key for auth tokens
- `GROQ_API_KEY` — required for AI chat
- `GROQ_MODEL` — defaults to `llama-3.1-8b-instant`
- `VITE_API_BASE` — client-side API base URL
- `REGION` — controls triage emergency numbers (UK/US/etc.)

## Testing

- **Server**: Jest with separate configs for unit (`jest.unit.config.js`), integration (`jest.integration.config.js`), and E2E (`jest.e2e.config.js`). Test files in `server/__tests__/` and `tests/e2e/`.
- **Client**: Vitest + @testing-library/react, jsdom environment. Config in `vite.config.js`.

## Important Patterns

- Chat messages use optimistic updates with rollback on failure (`useSendMessageMutation`)
- localStorage mirrors server chat state for offline resilience (`features/*/storage.js`)
- Rate limiting: 300 req/15min global, 20 req/min on chat endpoint
- SCSS for styling (sass-embedded), no CSS framework
- The `AGENTS.md` file documents the chat agent architecture in detail — consult it when modifying chat/AI flows
