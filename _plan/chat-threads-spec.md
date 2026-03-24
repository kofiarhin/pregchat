# Chat Threads

## Summary

Users can start multiple named chat sessions with Aya, view all their threads in a collapsible sidebar, switch between them freely, and continue each conversation independently with its own preserved message history. The `/chat` page is restructured into a two-panel layout: a left thread sidebar and a main chat panel. A "New Chat" button creates a thread immediately on the server before any message is typed. The active thread is persisted to localStorage so it is restored on page refresh and re-login. The server is the single source of truth for message history; local `ChatBox` state exists only for immediate UI responsiveness.

---

## Goal

- Give every user a persistent, organised multi-thread chat experience with Aya, where each thread stores its own message history independently and is always restorable.

---

## Problem Statement

- `chatController.ask` uses `findOneAndUpdate({ userId }, ..., { upsert: true })` — every message is pushed into one document per user with no concept of separate threads.
- `ChatBox` holds all messages in local React state initialised to `[]`. Refreshing the page wipes the conversation.
- There is no thread sidebar; `/chat` presents a blank chat box on every visit.
- Four client-side hooks (`useCreateChatMutation`, `useUpdateChatMutation`, `useDeleteChatMutation`, `useMessagesQuery`) already call the correct server endpoints, but none of those routes exist on the server yet — every call silently falls back to localStorage.

---

## User Stories

- As a user, I want to click "New Chat" to start a fresh conversation thread so I can keep different topics separate.
- As a user, I want to see all my previous threads in a sidebar so I can find and reopen them.
- As a user, I want to click a thread and see its message history restored so I can continue where I left off.
- As a user, I want the last thread I was in to be open automatically when I come back so I do not have to reselect it.
- As a user, I want to rename a thread so I can remember what it was about.
- As a user, I want to delete a thread I no longer need.

---

## Scope

### In Scope

- Multi-thread persistence: one `Conversation` document per thread, not one per user.
- Immediate thread creation on "New Chat" click — thread exists on the server before the first message.
- Thread sidebar: list, select, create, rename, delete.
- Active thread highlighted in sidebar.
- `ChatBox` hydrates messages from the server when a thread is opened.
- `activeThreadId` persisted to localStorage per user; restored on page load and re-login.
- Fallback when the restored thread no longer exists: most recently updated thread, or `null`.
- Auto-title a thread from the first message sent into it (first 60 chars, "…" if truncated).
- Rename thread inline.
- Delete thread with a simple inline confirm.
- Mobile: sidebar collapsible via CSS toggle (no re-mount).
- `POST /chat/conversations`, `PATCH /chat/conversations/:id`, `DELETE /chat/conversations/:id` server endpoints.
- `POST /chat/` and `POST /chat/ask` updated to accept `conversationId` and return it in response.

### Out of Scope

- Deep-link routing (`/chat/:threadId`) — active thread is restored via localStorage only.
- Thread search or filtering.
- Sharing or exporting threads.
- Pinning or starring threads.
- Streaming response changes.
- Pagination of messages beyond page 0 on initial load.

---

## UX / UI Requirements

- `/chat` is split into two columns: left sidebar (~260 px) and main chat panel.
- Sidebar header contains a "New Chat" button (icon + label). Clicking it creates a thread on the server immediately and activates it. The button is disabled while the create mutation is in flight to prevent double-creates.
- Each thread item shows: title (or date fallback for legacy threads), relative timestamp (e.g. "2 days ago"), and hover actions for rename and delete.
- The active thread is visually distinguished (highlighted row).
- Clicking a thread clears the current message view, shows a loading state, and loads that thread's messages.
- Sidebar empty state: "No conversations yet. Start a new chat."
- Sidebar loading state: skeleton rows while `useChatsQuery` resolves.
- Sidebar error state: inline banner if the thread list fails to load.
- `ChatBox` welcome/suggestions screen is shown only when `activeThreadId` is null or the active thread has no messages.
- Rename: click thread title → inline `<input>` → Enter or blur to save, Escape to cancel.
- Delete: simple inline confirm before removing.
- On mobile (< 768 px): sidebar is hidden by default; a toggle button shows and hides it without unmounting it.
- All new component styles use SCSS; no CSS framework.

---

## Frontend Requirements

### Pages

- `client/src/pages/Chat.jsx` — replace `<ChatBox dayData={todaySummary} />` with `<ChatLayout dayData={todaySummary} />`.

### Components to Create

**`client/src/components/ChatLayout/ChatLayout.jsx`**
- Two-panel wrapper.
- Owns `activeThreadId` (string | null) in local state.
- On mount: reads `loadActiveThreadId(userId)` from storage; after `useChatsQuery` resolves, validates the stored id against the thread list — keeps it if found, falls back to `threads[0].id` or `null` otherwise.
- Calls `saveActiveThreadId(userId, id)` whenever `activeThreadId` changes.
- On thread switch: calls `ChatSessionContext.messagesSetter([])` immediately to clear stale messages before the new query resolves.
- Wraps children in `ChatSessionProvider`.
- Passes `activeThreadId`, `onSelectThread`, and `onNewThread` props to `ThreadSidebar`.

**`client/src/components/ChatLayout/chatLayout.styles.scss`**

**`client/src/components/ThreadSidebar/ThreadSidebar.jsx`**
- Calls `useChatsQuery` for the thread list.
- "New Chat" button calls `useCreateChatMutation.mutate({})` and, on success, passes `chat.id` to `onNewThread`.
- Renders a `<ThreadItem>` for each thread.
- Accepts props: `activeThreadId`, `onSelectThread`, `onNewThread`.
- Handles loading (skeleton), error (banner), and empty states.

**`client/src/components/ThreadSidebar/threadSidebar.styles.scss`**

**`client/src/components/ThreadItem/ThreadItem.jsx`**
- Renders a single thread row.
- Calls `useUpdateChatMutation` on rename save.
- Calls `useDeleteChatMutation` on delete confirm.
- Accepts props: `chat`, `isActive`, `onSelect`.
- Inline rename: click title → `<input>` pre-filled with current title → Enter/blur saves, Escape cancels.
- Delete: shows "Delete this chat? Yes / No" inline before calling the mutation.
- Falls back to `"Chat – <formatted createdAt>"` for threads where `title` is empty (legacy documents).

### Components to Update

**`client/src/components/ChatBox/ChatBox.jsx`**
- Accept `conversationId` prop.
- Call `useMessagesQuery({ chatId: conversationId, page: 0 })`.
- Seed local `messages` state from query data the first time it arrives, when `messages.length === 0` (via `useEffect`). Do not overwrite live state on subsequent renders.
- Register `setMessages` with `ChatSessionContext` on mount; unregister on unmount. This allows `ChatLayout` to clear messages when switching threads.
- Pass `conversationId` into `useChatMutation`.
- On a successful send: after appending the assistant reply to local `messages` state, also write both new messages into the React Query cache via `queryClient.setQueryData(messagesKeys.list({ chatId: conversationId, page: 0 }), ...)`. Do **not** invalidate or refetch — this avoids a UI flash and keeps the cache in sync.
- When `conversationId` is null: show the welcome/suggestions screen; do not call `useMessagesQuery`.

### Hooks to Update

**`client/src/hooks/useChatMutation.js`**
- Accept `conversationId` in the mutation payload and include it in the POST body alongside `text`.
- Expose an `onNewThread(conversationId)` option callback for the edge-case fallback path (server auto-creates a thread when no `conversationId` is supplied).

**`client/src/features/chats/storage.js`**
- Add `saveActiveThreadId(userId, threadId)` — writes to localStorage key `pregchat:activeThreadId:<userId>`.
- Add `loadActiveThreadId(userId)` — reads from the same key; returns the stored string or `null`.
- The `userId` is sourced from `loadStoredUser()` (from `features/auth/storage.js`), which returns the cached user object including `_id`.

**`client/src/features/messages/queryKeys.js`**
- Currently exports `chatMessageKeys`. `useMessagesQuery` imports `messagesKeys` — a pre-existing mismatch that must be fixed here.
- Rename the export to `messagesKeys` and add a `.list({ chatId, page })` factory:
  ```
  messagesKeys.all     → ["chatMessages"]
  messagesKeys.list    → ["chatMessages", chatId, page]
  ```

### Hooks That Require No Changes

The following hooks already call the correct server endpoints and handle localStorage fallback. They need no changes once the server routes exist:

- `client/src/features/chats/hooks/useChatsQuery.js` — `GET /chat/conversations`; `chatsKeys.list()`.
- `client/src/features/chats/hooks/useCreateChatMutation.js` — `POST /chat/conversations`; updates `chatsKeys.list()` and sets `chatsKeys.detail(chat.id)`.
- `client/src/features/chats/hooks/useDeleteChatMutation.js` — `DELETE /chat/conversations/:chatId`; removes from cache and localStorage.
- `client/src/features/chats/hooks/useUpdateChatMutation.js` — `PATCH /chat/conversations/:chatId` with `{ title }`; updates list and detail cache.
- `client/src/features/messages/hooks/useMessagesQuery.js` — `GET /chat/conversations/:chatId/messages?page=0&limit=20`; localStorage fallback on 404. (Requires the `messagesKeys` export fix above.)

### State Architecture

| Concern | Owner | Persistence |
|---|---|---|
| `activeThreadId` | `ChatLayout` local state | localStorage via `saveActiveThreadId(userId, id)` |
| Thread list | React Query `chatsKeys.list()` | localStorage via `saveChatsToStorage` (existing) |
| Thread messages | React Query `messagesKeys.list({ chatId, page: 0 })` | localStorage via `saveChatsToStorage` (existing); written on send via `setQueryData` |
| In-flight message UI | `ChatBox` local `messages` state | None — ephemeral only |
| `setMessages` reference | `ChatSessionContext` | None — ref only, reset on mount |

### Routing

- No new routes. `/chat` is the only route for this feature.
- Active thread is never encoded in the URL. Restoration is handled entirely by localStorage.

---

## Backend Requirements

### Model Changes

`server/models/Conversation.js` — add:

```
title: { type: String, default: "" }
```

Existing fields (`userId`, `messages[]`, `timestamps: true`) and the existing index `{ userId: 1, createdAt: -1 }` are unchanged. No migration script is needed — existing documents receive `title: ""` as the Mongoose default.

### Controllers

`server/controllers/chatController.js` — add three new handlers and update three existing ones:

**Add `createConversation(req, res)`**
- Creates a new empty `Conversation` for `req.user._id` with optional `title` from the request body.
- Returns `{ id, title, createdAt, updatedAt }` with status 201.

**Add `updateConversation(req, res)`**
- Finds `{ _id: conversationId, userId: req.user._id }`.
- Updates `title` from request body.
- Returns `{ id, title, updatedAt }`.
- Returns 404 if not found or not owned.

**Add `deleteConversation(req, res)`**
- Finds `{ _id: conversationId, userId: req.user._id }` and deletes it.
- Returns 204 No Content.
- Returns 404 if not found or not owned.

**Update `ask(req, res)`**
- Read `conversationId` from `req.body`.
- If provided: validate it is a valid ObjectId and belongs to `req.user._id` — return 400 for invalid ObjectId, 404 if not owned.
- If absent (fallback path): create a new `Conversation`; set `title` to the first 60 chars of the user message + "…" if trimmed.
- In both cases: `$push` the user and assistant messages into the target document (replace the current `findOneAndUpdate({ userId }, ..., { upsert: true })`).
- Non-streaming response: add `conversationId` to the response shape — `{ content, conversationId }`.

**Update `getConversations(req, res)`**
- Return `title: conv.title || ""` from the database. Remove the hardcoded `"Pregnancy Assistant"` string.

**Update `getConversationMessages(req, res)`**
- Return `title: conversation.title || ""` in the `chat` sub-object. Remove the hardcoded `"Pregnancy Assistant"` string.

### Routes

`server/routes/chatRoutes.js` — add (no chat rate limiter on these; they make no AI calls):

```
POST   /chat/conversations             → createConversation  (requireAuth)
PATCH  /chat/conversations/:conversationId → updateConversation  (requireAuth)
DELETE /chat/conversations/:conversationId → deleteConversation  (requireAuth)
```

Existing routes are unchanged:
```
GET  /chat/conversations
GET  /chat/conversations/:conversationId/messages
POST /chat/
POST /chat/ask
```

---

## Data Model

### `Conversation` (updated)

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto |
| `userId` | ObjectId (ref User) | Required |
| `title` | String | Default `""` |
| `messages` | Array | `[{ role, content, timestamp }]` |
| `createdAt` | Date | Managed by Mongoose timestamps |
| `updatedAt` | Date | Managed by Mongoose timestamps |

Index: `{ userId: 1, createdAt: -1 }` — unchanged.

### Migration

No script required. Existing single-thread documents receive `title: ""` on next read via the Mongoose default. In the sidebar they are displayed as `"Chat – <formatted createdAt date>"`.

---

## API Changes

### New Endpoints

**`POST /chat/conversations`**
- Auth: requireAuth
- Request body: `{ title?: string }` (optional, max 120 chars)
- Response 201: `{ id, title, createdAt, updatedAt }`
- Errors: 500 on DB failure.

**`PATCH /chat/conversations/:conversationId`**
- Auth: requireAuth (ownership enforced)
- Request body: `{ title: string }` (required, max 120 chars)
- Response 200: `{ id, title, updatedAt }`
- Errors: 400 if title missing or too long; 404 if not found or not owned; 500 on DB failure.

**`DELETE /chat/conversations/:conversationId`**
- Auth: requireAuth (ownership enforced)
- Request body: none
- Response: 204 No Content
- Errors: 404 if not found or not owned; 500 on DB failure.

### Updated Endpoints

**`POST /chat/` and `POST /chat/ask`**
- Change: accept optional `conversationId` in body; create new thread if absent.
- Non-streaming response shape changes from `{ content }` to `{ content, conversationId }`.
- New error cases: 400 for invalid ObjectId; 404 for unowned `conversationId`.

**`GET /chat/conversations`**
- Change: `title` now comes from the database instead of the hardcoded string `"Pregnancy Assistant"`.

**`GET /chat/conversations/:conversationId/messages`**
- Change: `chat.title` now comes from the database instead of the hardcoded string.

---

## Validation Rules

- `title` on create: optional string, max 120 chars; absent or empty defaults to `""`.
- `title` on rename: required non-empty string, max 120 chars.
- Auto-title: derived from the first user message text; truncated to 60 chars with "…" appended if the text exceeds that length.
- `conversationId` in `ask`: if present, must be a valid Mongoose ObjectId; must belong to `req.user._id`; return 400 for malformed id, 404 for unowned id.
- All delete and update operations: ownership enforced via `{ _id, userId }` query — never query by `_id` alone.

---

## Persistence Strategy

### Thread list

`useChatsQuery` writes the thread list to `localStorage` under `pregchat:chats` after every successful fetch (existing behaviour in `useChatsQuery.js`). Served as fallback when the network is unavailable.

### Active thread id

- Stored under `pregchat:activeThreadId:<userId>` in localStorage.
- Namespaced per user so switching accounts never exposes a previous user's selection.
- `userId` is read from `loadStoredUser()._id` (from `features/auth/storage.js`) at `ChatLayout` mount time.
- Written by `saveActiveThreadId(userId, id)` on every `activeThreadId` change.
- Read by `loadActiveThreadId(userId)` to seed `ChatLayout` initial state.

### Restoration logic on page load

1. `ChatLayout` mounts; `activeThreadId` is initialised to `loadActiveThreadId(userId)`.
2. `useChatsQuery` resolves with the thread list.
3. `ChatLayout` validates the stored id:
   - Found in list → keep it.
   - Not found → fall back to `threads[0].id` (most recently updated, since the list is sorted `updatedAt: -1`) or `null` if the list is empty.
4. The validated id is persisted back with `saveActiveThreadId`.

### Message state lifecycle

1. Thread activated → `ChatLayout` calls `ChatSessionContext.messagesSetter([])` (clears stale UI messages).
2. `useMessagesQuery({ chatId, page: 0 })` fetches server messages.
3. `ChatBox`: when query data first arrives and `messages.length === 0`, seeds local state via `useEffect`.
4. User sends a message → optimistic append to local `messages` state.
5. Mutation succeeds → append assistant reply to local state; write both messages into the React Query cache via `queryClient.setQueryData(messagesKeys.list({ chatId, page: 0 }), ...)`. No invalidation or refetch.
6. Mutation fails → roll back the optimistic user message from local state.

The server holds the authoritative record. The cache write in step 5 keeps local UI and cache consistent without triggering a re-fetch flash. On the next hard refresh or window-focus refetch, `useMessagesQuery` overwrites the cache with the latest server state.

---

## Edge Cases

- **"New Chat" clicked while mutation is pending** — button is disabled while `useCreateChatMutation.isPending` is true; prevents duplicate empty threads.
- **Restored thread no longer exists** — `useChatsQuery` data does not include the stored id; fall back to `threads[0].id` or `null`; call `saveActiveThreadId` with the fallback.
- **Active thread is deleted** — `useDeleteChatMutation.onSuccess` fires; `ChatLayout` detects that the deleted id matches `activeThreadId`; sets `activeThreadId` to `threads[0].id` (after filtering) or `null`.
- **Thread deleted on another device** — `useMessagesQuery` returns 404; sidebar refetches `useChatsQuery`; stale item is removed; active thread falls back as above.
- **All threads deleted** — sidebar shows empty state; `activeThreadId` is `null`; welcome/suggestions screen is shown.
- **First message is very long** — auto-title truncates to 60 chars + "…".
- **Network failure on thread list load** — `useChatsQuery` serves localStorage fallback and shows sidebar error banner; restored `activeThreadId` may still be valid if messages are in localStorage too.
- **User sends a message without a `conversationId`** (server fallback path) — server creates a new thread; response includes `conversationId`; `useChatMutation` fires `onNewThread(id)`; `ChatLayout` sets and persists it. This path is a safety net, not a supported user flow — it should only be reached in unexpected states.
- **Cache write on send races with a refetch** — a concurrent window-focus refetch may overwrite the optimistic cache entry. This is acceptable; the refetch returns authoritative server state. The 15 s `staleTime` on `useMessagesQuery` makes this rare.
- **Legacy single-thread documents** — `title` is `""`; `ThreadItem` displays `"Chat – <formatted createdAt>"` as the fallback label. The thread remains accessible via its existing `_id`.

---

## Security / Authorization

- All new routes require the existing `requireAuth` middleware.
- Ownership enforced server-side on every find/update/delete using `{ _id: conversationId, userId: req.user._id }` — users cannot read or modify other users' threads.
- `title` is stored and returned as plain text; no HTML rendering.
- Management routes (`POST/PATCH/DELETE /chat/conversations`) must **not** be placed under the `chatLimiter` middleware — they make no AI calls. The rate limiter applies only to `POST /chat/` and `POST /chat/ask`.

---

## Testing Requirements

### Backend

- `POST /chat/conversations` creates a conversation and returns `{ id, title, createdAt, updatedAt }`.
- `POST /chat/ask` without `conversationId` creates a new conversation and returns `conversationId` in the response.
- `POST /chat/ask` with a valid owned `conversationId` appends messages to that conversation.
- `POST /chat/ask` with another user's `conversationId` returns 404.
- `POST /chat/ask` with a malformed `conversationId` returns 400.
- `PATCH /chat/conversations/:id` updates the title and returns the updated object for the owner.
- `PATCH /chat/conversations/:id` returns 404 for a non-owner.
- `DELETE /chat/conversations/:id` removes the document; a subsequent fetch returns 404.
- `GET /chat/conversations` returns `title` from the database (not a hardcoded string).
- `GET /chat/conversations/:id/messages` returns `chat.title` from the database.
- Auto-title is applied when a new thread is created through `ask`.
- Auto-title truncates at 60 chars and appends "…".

### Frontend

- `ChatLayout` initialises `activeThreadId` from `loadActiveThreadId(userId)` on mount.
- `ChatLayout` falls back to `threads[0].id` when the stored id is absent from the thread list.
- `ChatLayout` falls back to `null` when the thread list is empty.
- `ChatLayout` calls `saveActiveThreadId` on every `activeThreadId` change.
- `ChatLayout` calls `messagesSetter([])` when `activeThreadId` changes.
- `ThreadSidebar` renders thread items from a mocked `useChatsQuery`.
- `ThreadSidebar` shows the empty state when the list is `[]`.
- `ThreadSidebar` shows skeleton rows while loading.
- "New Chat" button calls `useCreateChatMutation.mutate({})` and passes the returned id to `onNewThread`.
- "New Chat" button is disabled while `isPending` is true.
- Clicking a `ThreadItem` calls `onSelectThread` with the correct `chatId`.
- Inline rename saves on Enter and on blur; cancels on Escape without saving.
- Delete confirm flow removes the item from the rendered list.
- `ChatBox` seeds `messages` state from `useMessagesQuery` data when query resolves and `messages.length === 0`.
- `ChatBox` shows the welcome/suggestions screen when `conversationId` is null.
- `ChatBox` writes both new messages into the React Query cache on a successful send (no refetch fired).

---

## File Impact

### Files Confirmed To Exist

- `server/models/Conversation.js`
- `server/controllers/chatController.js`
- `server/routes/chatRoutes.js`
- `client/src/pages/Chat.jsx`
- `client/src/components/ChatBox/ChatBox.jsx`
- `client/src/components/ChatBox/chatBox.styles.scss`
- `client/src/hooks/useChatMutation.js`
- `client/src/features/chats/hooks/useChatsQuery.js`
- `client/src/features/chats/hooks/useCreateChatMutation.js`
- `client/src/features/chats/hooks/useDeleteChatMutation.js`
- `client/src/features/chats/hooks/useUpdateChatMutation.js`
- `client/src/features/chats/context/ChatSessionContext.jsx`
- `client/src/features/chats/queryKeys.js`
- `client/src/features/chats/mappers.js`
- `client/src/features/chats/storage.js`
- `client/src/features/auth/storage.js`
- `client/src/features/messages/hooks/useMessagesQuery.js`
- `client/src/features/messages/queryKeys.js`

### Files To Create

- `client/src/components/ChatLayout/ChatLayout.jsx`
- `client/src/components/ChatLayout/chatLayout.styles.scss`
- `client/src/components/ThreadSidebar/ThreadSidebar.jsx`
- `client/src/components/ThreadSidebar/threadSidebar.styles.scss`
- `client/src/components/ThreadItem/ThreadItem.jsx`

### Files To Update

- `server/models/Conversation.js` — add `title` field
- `server/controllers/chatController.js` — add `createConversation`, `updateConversation`, `deleteConversation`; update `ask`, `getConversations`, `getConversationMessages`
- `server/routes/chatRoutes.js` — register the three new management routes
- `client/src/pages/Chat.jsx` — swap `<ChatBox>` for `<ChatLayout>`
- `client/src/components/ChatBox/ChatBox.jsx` — accept `conversationId`; hydrate from server; register with `ChatSessionContext`; write cache on send
- `client/src/hooks/useChatMutation.js` — pass `conversationId` in body; add `onNewThread` callback
- `client/src/features/chats/storage.js` — add `saveActiveThreadId` and `loadActiveThreadId`
- `client/src/features/messages/queryKeys.js` — fix export name (`chatMessageKeys` → `messagesKeys`); add `.list()` factory

---

## Step-by-Step Implementation Plan

1. **Server — model**: Add `title` field to `Conversation.js`.
2. **Server — management handlers**: Add `createConversation`, `updateConversation`, `deleteConversation` to `chatController.js`; export all three.
3. **Server — routes**: Register `POST`, `PATCH`, `DELETE` on `/chat/conversations[/:id]` in `chatRoutes.js`, without the chat rate limiter.
4. **Server — ask refactor**: Remove single-user upsert; accept and validate `conversationId`; auto-create + auto-title when absent; return `conversationId` in non-streaming response.
5. **Server — title fix**: Replace hardcoded strings in `getConversations` and `getConversationMessages` with `conv.title || ""`.
6. **Client — storage helpers**: Add `saveActiveThreadId` and `loadActiveThreadId` to `features/chats/storage.js`.
7. **Client — queryKeys fix**: Rename export in `features/messages/queryKeys.js`; add `.list({ chatId, page })` factory.
8. **Client — useChatMutation**: Include `conversationId` in POST body; add `onNewThread` option callback.
9. **Client — ChatBox**: Accept `conversationId`; hydrate from `useMessagesQuery`; write cache on send; register with `ChatSessionContext`.
10. **Client — ThreadItem**: Inline rename and delete confirm using existing `useUpdateChatMutation` and `useDeleteChatMutation`.
11. **Client — ThreadSidebar**: Thread list, "New Chat" button, loading/error/empty states.
12. **Client — ChatLayout**: Compose panels; own and persist `activeThreadId`; restore on load; clear messages on thread switch.
13. **Client — Chat page**: Replace `<ChatBox>` with `<ChatLayout>`.
14. **Tests**: Add unit and integration tests per the Testing Requirements section.

---

## Acceptance Criteria

- Visiting `/chat` automatically restores the last active thread and shows its message history.
- If the last active thread no longer exists, the most recently updated thread is selected; if none exist, the welcome screen is shown.
- Clicking "New Chat" creates a thread on the server immediately, adds it to the sidebar, and activates it before any message is sent.
- Sending a message in a thread appends to that thread only; other threads are unaffected.
- Switching threads clears the current message view and loads the selected thread's messages from the server.
- Active thread is always visually highlighted in the sidebar.
- Thread titles persist after page refresh.
- Renaming a thread inline persists the new title after refresh.
- Deleting a thread removes it from the sidebar immediately; it cannot be accessed again.
- No user can read, rename, or delete another user's thread.
- On mobile, the sidebar can be toggled without destroying the thread list cache.

---

## Risks

- **`useChatMutation` consumers**: The hook is currently called only from `ChatBox`. Adding a new option argument is backwards-compatible, but all call sites should be checked before implementation.
- **Messages cache write vs. refetch race**: A window-focus refetch may overwrite the optimistic cache entry written on send. This is safe — the server value wins — but if it causes a visible flash, adjusting `refetchOnWindowFocus: false` on `useMessagesQuery` is a targeted fix.
- **Streaming path is untouched**: The `ask` controller currently does not persist streamed messages. Streaming responses will not appear in message history until a follow-up task addresses server-side persistence for the streaming path.
- **`chatLimiter` placement**: The rate limiter is defined inline in `chatRoutes.js` and currently wraps only the two `POST` chat routes. Adding new routes in the wrong position could accidentally rate-limit management calls — verify route order carefully.
