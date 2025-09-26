# AGENTS

## Overview
- PregChat orchestrates a pregnancy wellness chat that enriches user prompts with profile context, enforces red-flag triage rules, and streams Groq replies while persisting conversations for review.

## Agents / Modules
### Chat Session Context (client/src/features/chats/context/ChatSessionContext.jsx)
- **Name & Role**: ChatSessionProvider — exposes a setter registry so components can register a message-state updater for the active chat session.
- **Inputs → Outputs**: Accepts a React state setter (`setMessagesSetter(setter)`) and exposes the current setter plus a reset helper.
- **Core logic & dependencies**: Plain React context built with `useState`, `useCallback`, and `useMemo`; no network calls.
- **System prompts/instructions**: None.
- **Memory/session keys**: Stores the setter function in component memory only; no persistence.
- **Safety rails**: N/A — defers to downstream hooks.
- **Failure modes & retries**: If `setter` is falsy it clears the registry; otherwise downstream hooks handle mutation errors.

### Local History Service (client/src/features/messages/hooks/useChatMessages.js & client/src/utils/chatHistory.js)
- **Name & Role**: useChatMessages — TanStack Query wrapper that keeps an append-only local history for the lightweight ChatBox experience.
- **Inputs → Outputs**: `appendMessages(message|array)` appends structured messages `{ id, role, content, timestamp }`; `clearMessages(userId?)` purges both localStorage (`pregchat:chats`) and, when a `userId` is provided, calls `DELETE /api/messages/:userId` to clear the server record.
- **Core logic & dependencies**: Uses React Query `useQuery` + `useMutation`, localStorage helpers, and optional server clear via `fetch(BASE_URL)`.
- **System prompts/instructions**: None.
- **Memory/session keys**: Persists under the localStorage key `pregchat:chats` and mirrors payloads returned by `/chat/ask`.
- **Safety rails**: Falls back to empty arrays on JSON parse errors; server clears require matching `userId` auth on the backend.
- **Failure modes & retries**: Logs warnings if storage read/write fails; server delete failures are swallowed with `console.warn` so the UI stays responsive.

### Message Delivery Orchestrator (client/src/features/messages/hooks/useSendMessageMutation.js)
- **Name & Role**: useSendMessageMutation — central mutation that optimistically appends user messages, reconciles assistant replies, and triggers React Query cache updates.
- **Inputs → Outputs**: Accepts `{ chatId, text, dayData?, stream? }`; outputs assistant payload `{ content|message, triage? }` while tagging messages with `meta.triage` when the server flags urgent content.
- **Core logic & dependencies**: Uses the shared `http.post` helper, Redux `enqueueToast`, and multiple React Query cache writes (`messagesKeys.list`, `messagesKeys.infinite`, `chatsKeys.detail/list`). Optimistically adds a user bubble, replaces it on success, or rolls back on failure.
- **System prompts/instructions**: None directly; forwards `dayData` so the backend can expand the system prompt.
- **Memory/session keys**: Works with chat identifiers from `/chat/conversations/:id`; also saves merged chats back to localStorage via `saveChatsToStorage`.
- **Safety rails**: Dispatches warning toasts when the backend returns `triage: true`; invalidates caches on settle to ensure reconciliation with the server state.
- **Failure modes & retries**: If the mutation throws, it removes the optimistic user message and pushes an error toast; HTTP helper retries 5xx responses up to two times.

### Conversation Service (server/controllers/chatController.js & server/models/Conversation.js)
- **Name & Role**: ask / getConversations / getConversationMessages — Express handlers that manage persistent chat threads per user.
- **Inputs → Outputs**: `POST /chat/ask` accepts `{ text, stream? }`, returns `{ content }` or `{ triage, message }`; non-stream calls append paired `{ role, content, timestamp }` messages to the MongoDB `Conversation` document keyed by `userId`.
- **Core logic & dependencies**: Authenticated routes (`middleware/auth.js`) fetch pregnancy/day context, fan out to `askAya`, and upsert conversations; listing endpoints paginate messages with `page` & `limit` query params and map metadata for the client.
- **System prompts/instructions**: Pulls day summaries to pass through `askAya` so the system prompt can interpolate pregnancy context.
- **Memory/session keys**: Mongo `_id` as `chatId`; arrays of message objects stored under `conversation.messages`; `Flag` entries log urgent requests.
- **Safety rails**: Early `triageCheck` run blocks AI calls for red-flag text and logs `Flag` entries (`reason: "red_flag"`).
- **Failure modes & retries**: Returns 404 for missing chats or invalid IDs, 500 on DB/AI errors; rate-limited to 20 requests/minute/IP.

### Aya Assistant Proxy (server/config/ai.js & server/config/prompts.js)
- **Name & Role**: askAya — wraps Groq chat completions using the Aya persona prompt and optional streaming.
- **Inputs → Outputs**: Accepts `{ text, region, dayData, stream }`; emits `{ content }`, `{ rawStream }`, or `{ triage, message }` when red-flag detection fires.
- **Core logic & dependencies**: Fills `SYSTEM_PROMPT_AYA` template with day context, instantiates `Groq` using `GROQ_API_KEY`, and enforces `CHAT_MAX_TOKENS`; appends the disclaimer “Educational only — not a diagnosis.” and optional sign-off (`personaAya.signOff`).
- **System prompts/instructions**: Persona prompt defines tone, boundaries, triage messaging, and output rules.
- **Memory/session keys**: No persistent storage; depends on env vars (`GROQ_MODEL`, `AI_SIGN_OFF`).
- **Safety rails**: Regex `RED_FLAG_PATTERNS` short-circuit to `triageLine(region)`; trims fenced code blocks.
- **Failure modes & retries**: Throws if `GROQ_API_KEY` is missing; upstream HTTP helper retries 5xx; streaming callers must consume `result.rawStream`.

### Pregnancy Context Provider (server/models/Pregnancy.js & server/controllers/chatController.js)
- **Name & Role**: Pregnancy profile + DailyContent lookup — enriches chat requests with gestational day insights.
- **Inputs → Outputs**: Reads the authenticated user’s `Pregnancy` document, derives `dayIndex`, and loads `DailyContent` (baby update, mom update, tips) before invoking Aya.
- **Core logic & dependencies**: `Pregnancy.calculateDayIndex()` clamps LMP-based day counts; `DailyContent` stores unique day records with copy and reference URLs.
- **System prompts/instructions**: Values feed the Aya system prompt placeholders (`{{dayIndex}}`, `{{babyUpdate}}`, etc.).
- **Memory/session keys**: `Pregnancy.userId` (unique per user) and `DailyContent.day` (0–280) anchor lookups.
- **Safety rails**: If either profile or content is missing, the chat proceeds without `dayData` and the updates endpoints return 404 guidance.
- **Failure modes & retries**: Missing profile or content logs warnings; `updateProfile` recalculates day index on LMP/due date updates.

### Safety Flag Logger (server/models/Flag.js)
- **Name & Role**: Flag — persistent record when red-flag conversations occur.
- **Inputs → Outputs**: Stores `{ userId, text, reason }` when triage trips; later reviewable by ops tooling.
- **Core logic & dependencies**: Simple Mongoose schema with `timestamps` and index on `{ userId, createdAt }`.
- **System prompts/instructions**: Triage reason hard-coded as `"red_flag"` in `chatController`.
- **Memory/session keys**: `Flag` documents keyed by Mongo `_id` with user reference.
- **Safety rails**: Ensures repeated urgent phrases are captured even if the AI call is skipped.
- **Failure modes & retries**: Errors bubble to `/chat/ask` handler; no automatic retry.

## Events & Flows
- **Start chat**: `useChatsQuery` pulls `/chat/conversations` (falls back to localStorage) → Chat list sorted client-side by `updatedAt` → selecting a chat registers a setter with `ChatSessionProvider`.
- **Load history (infinite scroll)**: `useInfiniteMessagesQuery` pages `/chat/conversations/:id/messages?page=N&limit=20`, seeding localStorage with `allMessages` from the first page → caches under `messagesKeys.infinite(chatId)`.
- **Send message**: ChatBox submits text → `useSendMessageMutation.onMutate` adds an optimistic user bubble → server either flags triage (toast + warning bubble) or responds with assistant copy → caches persist via `saveChatsToStorage`.
- **Receive assistant reply**: Non-stream responses append to caches immediately; streaming callers iterate over `rawStream` chunks and flush partial text, then persist full message on completion.

## Extensibility
- To add a new tool/agent in the assistant response, extend `SYSTEM_PROMPT_AYA` (server/config/prompts.js) and handle payload flags in `askAya`; update `mapChatDetailFromApi` and `appendToMessagesCache` if the response adds new `meta` fields.
- To attach message metadata (e.g., sources), extend the message shape in `Conversation` schema and update client mappers in `client/src/features/chats/mappers.js` plus cache writers in `useSendMessageMutation`.
- New safety checks belong in `triageCheck` (server/config/ai.js); mirror them on the client if the UI needs to react optimistically.
