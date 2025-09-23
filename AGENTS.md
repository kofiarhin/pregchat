# AGENTS

## Overview
PregChat runs a Groq-backed pregnancy wellness assistant named Aya. The frontend opens a chat session, bootstraps day-specific context, and relays each user question to the backend, which enriches it with pregnancy data, enforces medical safety rules, and returns Aya's reply for display in the UI.【F:client/src/components/ChatBox/ChatBox.jsx†L1-L218】【F:server/controllers/chatController.js†L7-L91】【F:server/config/ai.js†L60-L111】

## Quick Actions
- **Design me a meal plan**  
  Prompt: "Design a 1-day pregnancy-safe meal plan. Assume user provides weeks/days when asked. Include breakfast, lunch, dinner, 2 snacks, hydration targets, and simple prep notes. Consider common aversions and nausea. Avoid high-mercury fish, unpasteurized dairy, deli meats, and alcohol."【F:client/src/components/ChatBox/ChatBox.jsx†L114-L121】
- **Share health tips for me**  
  Prompt: "Share 3 concise, evidence-based pregnancy health tips for today. Cover movement, hydration/supplements, and rest. Add 1 red-flag symptom to watch and when to seek care. Keep it under 120 words total."【F:client/src/components/ChatBox/ChatBox.jsx†L122-L127】
- **Help me relax today**  
  Prompt: "Lead a 5-minute relaxation routine safe for pregnancy: brief breathwork (box or 4-7-8), a short body scan, and one simple stretch sequence with clear cues. Offer a 30-second TL;DR option."【F:client/src/components/ChatBox/ChatBox.jsx†L128-L133】

## System Prompt / Role
Aya's system prompt positions her as a warm, concise pregnancy wellness assistant. She must stay within wellness guidance, refuse diagnosis or dosing, escalate red-flag symptoms with region-specific triage lines, weave in pregnancy day context when available, keep replies under ~180 words with plain text formatting, include reputable references when relevant, end with "Educational only — not a diagnosis," and optionally sign as "– Aya, your pregnancy guide."【F:server/config/prompts.js†L1-L42】【F:server/config/ai.js†L45-L108】【F:server/config/persona.js†L1-L9】

## APIs / Tools
- **Groq Chat Completions** via `groq-sdk`, using model `process.env.GROQ_MODEL` (default `llama-3.1-8b-instant`) with `max_tokens` from `process.env.CHAT_MAX_TOKENS`. Requires `process.env.GROQ_API_KEY` and supports optional streaming responses. Optional sign-off controlled by `process.env.AI_SIGN_OFF`.【F:server/config/ai.js†L1-L110】
- **MongoDB (Mongoose)** stores conversations, pregnancy profiles, daily content, and triage flags; connection string sourced from `process.env.MONGO_URI`.【F:server/models/Conversation.js†L1-L36】【F:server/models/Pregnancy.js†L3-L46】【F:server/models/DailyContent.js†L3-L45】【F:server/models/Flag.js†L3-L29】【F:server/config/db.js†L1-L17】

## Message Flow
1. The chat UI loads or creates a conversation, subscribes to infinite message queries, and captures quick action input before sending. Day summaries are injected into outgoing payloads when available.【F:client/src/components/ChatBox/ChatBox.jsx†L27-L160】【F:client/src/features/chats/hooks/useChatsQuery.js†L10-L43】【F:client/src/features/chats/hooks/useCreateChatMutation.js†L29-L57】
2. `useSendMessageMutation` optimistically appends the user message, POSTs to `/chat/ask` (optionally `/chat/ask?stream=1`), retries transient failures, and updates React Query + localStorage caches for chats and messages.【F:client/src/features/messages/hooks/useSendMessageMutation.js†L249-L337】【F:client/src/api/http.js†L1-L115】【F:client/src/features/chats/storage.js†L1-L39】
3. The request passes through JWT auth and a per-minute rate limiter on `/chat/ask`, plus a global rate limiter on the Express app.【F:server/routes/chatRoutes.js†L1-L20】【F:server/middleware/auth.js†L1-L26】【F:server/app.js†L24-L41】
4. The controller fetches pregnancy + daily content context, performs a red-flag screen (logging `Flag` entries when triggered), and either returns a triage message or forwards the enriched prompt to Groq. Streaming responses flush chunks directly; non-streaming replies are saved to the user's `Conversation` document before returning JSON to the client.【F:server/controllers/chatController.js†L7-L87】【F:server/config/ai.js†L8-L110】【F:server/models/Flag.js†L3-L29】【F:server/models/Conversation.js†L3-L36】
5. Upon success, the client replaces optimistic entries, appends Aya's reply, flags triage responses, and surfaces a warning toast when necessary.【F:client/src/features/messages/hooks/useSendMessageMutation.js†L282-L337】
6. The booking pages query `/api/midwives` for profiles, `/api/appointments/availability` for slot grids, and `/api/appointments` to book or cancel visits, keeping the calendar in sync with London time.【F:client/src/pages/AppointmentBrowse.jsx†L1-L91】【F:client/src/pages/AppointmentMidwife.jsx†L1-L270】【F:client/src/pages/MyAppointments.jsx†L1-L164】

## Chat History
- **Frontend**: Conversations and paginated messages are cached in React Query and mirrored in `localStorage` under `pregchat:chats`, with fallbacks when the API returns 404 or no payload.【F:client/src/features/chats/storage.js†L1-L39】【F:client/src/features/chats/hooks/useChatsQuery.js†L10-L33】【F:client/src/features/messages/hooks/useMessagesQuery.js†L10-L82】
- **Backend**: Mongo `Conversation` documents persist the chronological message list per user; `Flag` documents store red-flag events.【F:server/models/Conversation.js†L3-L36】【F:server/models/Flag.js†L3-L29】【F:server/controllers/chatController.js†L68-L84】
- **Reset**: The avatar dropdown prompts for confirmation, clears UI state, wipes `pregchat:chats`, and (when a `userId` is provided) calls `DELETE /api/messages/:userId` to empty the server conversation after verifying ownership.【F:client/src/components/AvatarDropdown.jsx†L5-L52】【F:client/src/utils/chatHistory.js†L3-L24】【F:server/routes/messages.js†L1-L7】【F:server/controllers/messageController.js†L3-L20】【F:client/src/components/ChatBox/ChatBox.jsx†L75-L90】

## Safety / Validation
- Red-flag regex screening halts normal responses, stores a `Flag`, and returns region-aware triage guidance before hitting the LLM.【F:server/config/ai.js†L8-L34】【F:server/controllers/chatController.js†L30-L43】
- Aya's system prompt enforces medical boundaries, mandatory disclaimers, and formatting limits; the backend also strips code fences and appends the disclaimer/sign-off when missing.【F:server/config/prompts.js†L1-L42】【F:server/config/ai.js†L92-L108】
- JWT auth guards chat endpoints, while Express rate limiters cap total requests and chat-specific bursts.【F:server/middleware/auth.js†L1-L26】【F:server/routes/chatRoutes.js†L8-L20】【F:server/app.js†L32-L41】
- Chat clearing verifies the requester owns the conversation before deleting server messages.【F:server/controllers/messageController.js†L3-L20】

## Adding New Quick Actions
1. Open `client/src/components/ChatBox/ChatBox.jsx` and locate the `quickPrompts` array inside `useMemo`. Each entry needs a stable `id`, a button `label`, and the full prompt `text`.【F:client/src/components/ChatBox/ChatBox.jsx†L114-L138】
2. Add the new object to the array; the chip list renders every entry automatically on the welcome screen, and clicking one fills the composer via `onAction`. No additional wiring is required unless the prompt should auto-send (current behavior only pre-fills the input).【F:client/src/components/ChatBox/ChatBox.jsx†L138-L215】

## Env & Config
- `GROQ_API_KEY` (required), `GROQ_MODEL`, `CHAT_MAX_TOKENS`, `AI_SIGN_OFF` tune LLM behavior.【F:server/config/ai.js†L5-L108】
- `MONGO_URI` configures the database connection; `PORT` sets the Express listener; `NODE_ENV` toggles dotenv loading; `JWT_SECRET` secures auth tokens.【F:server/config/db.js†L1-L17】【F:server/server.js†L1-L26】【F:server/middleware/auth.js†L14-L24】
- Frontend calls default to `import.meta.env.VITE_API_BASE` (fallback `http://localhost:5000`) for API requests.【F:client/src/constants/baseUrl.js†L1-L4】

## Error Handling
- The HTTP helper retries 5xx responses with exponential delays, auto-attaches bearer tokens, and surfaces structured errors for mutation handlers.【F:client/src/api/http.js†L20-L107】
- Mutation hooks roll back optimistic user messages on failure and emit toasts to notify the user.【F:client/src/features/messages/hooks/useSendMessageMutation.js†L313-L337】
- Express' global error handler normalizes validation, duplicate key, and JWT errors before falling back to a 500 response.【F:server/middleware/error.js†L1-L30】
- Chat controller catches upstream exceptions and returns `500` with a generic message; Mongo connection failures exit the process during startup.【F:server/controllers/chatController.js†L87-L91】【F:server/config/db.js†L1-L17】

## Testing
- Run backend tests with `npm run test:server` (Jest) or the more specific `npm run test:unit` / `npm run test:integration`; frontend tests run via `npm run test:client`. End-to-end coverage is available through `npm run e2e` at the repo root.【F:package.json†L6-L16】
