# Saved Chat Threads

## Summary

Users can start multiple named chat threads with Aya, save them to their account, and reopen any previous thread to continue the conversation. The chat page gains a sidebar listing all threads alongside the active chat panel. The backend is extended to support true multi-thread persistence, replacing the current single-conversation-per-user approach.

## Goal

- Allow users to maintain separate, resumable chat sessions with Aya so they can organise conversations by topic (e.g. "week 12 concerns", "nutrition questions") and return to them at any time.

## Problem Statement

- The current `Conversation` model upserts a single document per user. Every message goes into one monolithic thread with no title or way to separate topics.
- `ChatBox` holds messages in local React state only — refreshing the page loses the conversation.
- There is no UI for browsing or selecting past threads; the `/chat` route shows only a blank box every visit.

## User Stories

- As a user, I want to start a new chat thread so that different topics stay separate.
- As a user, I want to see a list of my saved chat threads so I can find and reopen a past conversation.
- As a user, I want to rename a thread so I can remember what it is about.
- As a user, I want to delete a thread I no longer need.
- As a user, I want the thread to be automatically titled from my first message so I do not have to name every chat manually.

## Scope

### In Scope

- Multi-thread support: one `Conversation` document per thread (not per user).
- `POST /chat/conversations` — create a new thread.
- `PATCH /chat/conversations/:id` — rename thread title.
- `DELETE /chat/conversations/:id` — delete thread and its messages.
- `POST /chat/ask` (and `POST /chat/`) — accept optional `conversationId`; if omitted, create a new thread.
- Auto-title a thread from the first user message (first 60 chars, truncated with ellipsis).
- Thread sidebar on the `/chat` page — list, select, create, rename, delete.
- ChatBox loads server messages when a thread is opened.
- Mobile: sidebar collapsible via toggle.

### Out of Scope

- Sharing threads with other users or exporting.
- Thread search or filtering.
- Streaming responses (already exists separately; no changes to streaming path).
- Pinning or starring threads.

## UX/UI Requirements

- `/chat` is split into two columns: a left sidebar (thread list, ~260 px) and the main chat panel.
- Sidebar header has a "New chat" button (icon + label).
- Each thread item shows: title, relative date (e.g. "2 days ago"), hover actions (rename, delete).
- Active thread is highlighted.
- Clicking a thread loads its messages into the chat panel with a loading spinner.
- Empty state: sidebar shows "No conversations yet. Start a new chat."
- ChatBox empty state shows welcome + suggestions only when the active thread has no messages.
- Rename is an inline edit (click title → editable input → blur/Enter to save).
- Delete shows a simple inline confirm before removing.
- On mobile (< 768 px): sidebar is hidden by default; a hamburger/back button toggles it.
- Loading state: skeleton rows in sidebar while threads fetch.
- Error state: banner message if threads fail to load.

## Frontend Requirements

### Pages / Layout

- `client/src/pages/Chat.jsx` — restructure to render `<ChatLayout>` instead of bare `<ChatBox>`.

### Components to Create

- `client/src/components/ChatLayout/ChatLayout.jsx` — two-panel wrapper that owns `activeThreadId` state.
- `client/src/components/ChatLayout/chatLayout.styles.scss`
- `client/src/components/ThreadSidebar/ThreadSidebar.jsx` — list of threads + new-chat button.
- `client/src/components/ThreadSidebar/threadSidebar.styles.scss`
- `client/src/components/ThreadItem/ThreadItem.jsx` — single thread row with rename/delete controls.

### Components to Update

- `client/src/components/ChatBox/ChatBox.jsx` — accept `conversationId` prop; load existing messages from `useMessagesQuery(conversationId)` on mount; pass `conversationId` to `useChatMutation`.

### Hooks to Update

- `client/src/hooks/useChatMutation.js` — include `conversationId` in POST body; on success, if thread was new (no `conversationId` passed), invalidate `chatsKeys.list()` and navigate/set active thread to returned `conversationId`.
- `client/src/features/chats/hooks/useUpdateChatMutation.js` — confirm it hits `PATCH /chat/conversations/:id` with `{ title }`.
- `client/src/features/chats/hooks/useDeleteChatMutation.js` — confirm it hits `DELETE /chat/conversations/:id`; on success, remove thread from list cache and clear active thread if it was the deleted one.

### State

- `activeThreadId` lives in `ChatLayout` local state (not Redux — it is UI-scoped).
- When `activeThreadId` is `null`, ChatBox shows the welcome/suggestions screen with no messages loaded.

### Routing

- No new route needed. `/chat` already exists.
- Optional: `/chat/:threadId` deep-link to a specific thread (out of scope for this iteration unless easy).

## Backend Requirements

### Model Changes

- `server/models/Conversation.js` — add `title: { type: String, default: "" }` field.
- Change the `ask` controller to no longer upsert a single doc per user. It must now: create a new `Conversation` if no `conversationId` is provided, or `$push` messages into the specified one.
- Auto-title: when a new conversation is created and the first message is pushed, set `title` to the first 60 characters of the user message + "…" if truncated.

### Controllers to Create / Update

- `server/controllers/chatController.js`:
  - Add `createConversation(req, res)` — create empty conversation for `req.user._id` with optional `title`.
  - Add `updateConversation(req, res)` — find by `{ _id, userId }`, update `title`.
  - Add `deleteConversation(req, res)` — find by `{ _id, userId }`, delete.
  - Update `ask(req, res)` — read `conversationId` from body; if provided, push to that doc; if absent, create a new `Conversation` and set auto-title from the first user message.
  - Update `getConversations` — include `title` field in returned objects (drop the hardcoded "Pregnancy Assistant").

### Routes to Add

- `server/routes/chatRoutes.js`:
  - `POST /chat/conversations` → `createConversation` (requireAuth)
  - `PATCH /chat/conversations/:conversationId` → `updateConversation` (requireAuth)
  - `DELETE /chat/conversations/:conversationId` → `deleteConversation` (requireAuth)

## Data Model Changes

```js
// Conversation — add field:
title: { type: String, default: "" }

// Existing index remains valid:
{ userId: 1, createdAt: -1 }
```

Migration: existing single-thread documents gain `title: ""`. The first time the user opens their old thread, the auto-title logic does not fire (no new first message). The sidebar will show "Untitled" (or a formatted date) for legacy threads. No destructive migration needed.

## API Changes

### New Endpoints

- `POST /chat/conversations`
  - Purpose: Create a new empty conversation thread.
  - Auth: requireAuth
  - Request: `{ title?: string }`
  - Response: `{ id, title, createdAt, updatedAt }`

- `PATCH /chat/conversations/:conversationId`
  - Purpose: Rename a thread.
  - Auth: requireAuth (owns conversation)
  - Request: `{ title: string }` (required, max 120 chars)
  - Response: `{ id, title, updatedAt }`

- `DELETE /chat/conversations/:conversationId`
  - Purpose: Delete a thread and all its messages.
  - Auth: requireAuth (owns conversation)
  - Request: none
  - Response: `204 No Content`

### Updated Endpoints

- `POST /chat/` and `POST /chat/ask`
  - Change: accept optional `conversationId` in body. If provided, push to that conversation. If absent, create a new `Conversation` and auto-title it.
  - Response: unchanged `{ content }` plus add `conversationId` field so client can track which thread the reply belongs to.

- `GET /chat/conversations`
  - Change: return `title` from DB (was hardcoded "Pregnancy Assistant").
  - Impact: frontend thread list now shows real titles.

## Validation Rules

- `title` on create/rename: string, max 120 characters; if empty/absent on create, default to `""`.
- Auto-title: derived from first user message, max 60 chars + "…" if trimmed.
- `conversationId` in `ask`: if provided, must be a valid ObjectId and belong to `req.user._id`; return 404 if not found.
- Delete: only the owning user can delete (`{ _id: conversationId, userId }`).

## Edge Cases

- User sends a message with no `conversationId` — a new thread is created transparently.
- User reopens a thread that has been deleted server-side — 404 from messages endpoint; sidebar should refetch and remove the stale item.
- First message is very long — auto-title truncates at 60 chars with "…".
- All threads deleted — sidebar shows empty state with "New chat" CTA.
- Network failure on load — sidebar shows error banner; existing local storage fallback in `useChatsQuery` continues to work.
- Old single-thread documents (pre-feature) — `title` field is `""`, displayed as "Untitled" in sidebar with fallback to formatted `createdAt`.

## Security / Authorization

- All new routes require `requireAuth` middleware.
- Conversation ownership is enforced server-side using `{ _id, userId }` queries — users cannot read or modify other users' threads.
- Thread title is stored as plain text; no HTML rendering server-side.

## Testing Requirements

### Frontend

- `ThreadSidebar` renders thread list items.
- `ThreadSidebar` shows empty state when list is empty.
- Clicking a thread calls `setActiveThreadId`.
- "New chat" button creates a new thread and sets it active.
- Inline rename input saves on blur/Enter.
- Delete confirm flow removes thread from list.
- `ChatBox` renders existing messages when `conversationId` is provided.

### Backend

- `POST /chat/conversations` creates a conversation and returns it.
- `POST /chat/ask` without `conversationId` creates a new conversation.
- `POST /chat/ask` with valid `conversationId` appends to that conversation.
- `POST /chat/ask` with another user's `conversationId` returns 404.
- `PATCH /chat/conversations/:id` updates the title for the owner.
- `PATCH /chat/conversations/:id` returns 404 for a non-owner.
- `DELETE /chat/conversations/:id` removes the document.
- `GET /chat/conversations` returns `title` from DB (not hardcoded).
- Auto-title is applied when a new conversation is created via `ask`.

## File Impact

### Files To Create

- `client/src/components/ChatLayout/ChatLayout.jsx`
- `client/src/components/ChatLayout/chatLayout.styles.scss`
- `client/src/components/ThreadSidebar/ThreadSidebar.jsx`
- `client/src/components/ThreadSidebar/threadSidebar.styles.scss`
- `client/src/components/ThreadItem/ThreadItem.jsx`

### Files To Update

- `server/models/Conversation.js` — add `title` field
- `server/controllers/chatController.js` — add create/update/delete handlers; update ask + getConversations
- `server/routes/chatRoutes.js` — add POST/PATCH/DELETE routes
- `client/src/pages/Chat.jsx` — render `ChatLayout`
- `client/src/components/ChatBox/ChatBox.jsx` — accept `conversationId`, load server messages
- `client/src/hooks/useChatMutation.js` — pass `conversationId`, handle new-thread response
- `client/src/features/chats/hooks/useUpdateChatMutation.js` — verify PATCH endpoint
- `client/src/features/chats/hooks/useDeleteChatMutation.js` — verify DELETE endpoint, cache update

## Step-by-Step Implementation Plan

1. **Backend — model**: Add `title` field to `server/models/Conversation.js`.
2. **Backend — controller**: Update `ask` to accept `conversationId`, create new thread if absent, auto-title on first message, return `conversationId` in response.
3. **Backend — controller**: Add `createConversation`, `updateConversation`, `deleteConversation` handlers to `chatController.js`.
4. **Backend — routes**: Register `POST /chat/conversations`, `PATCH /chat/conversations/:conversationId`, `DELETE /chat/conversations/:conversationId` in `chatRoutes.js`.
5. **Backend — getConversations**: Return real `title` (not hardcoded string).
6. **Client — hooks**: Update `useChatMutation` to send `conversationId` and capture the returned `conversationId` for new threads; update `useDeleteChatMutation` to hit the correct endpoint and update cache.
7. **Client — ThreadItem**: Build `ThreadItem` with inline rename and delete-confirm.
8. **Client — ThreadSidebar**: Build `ThreadSidebar` using `useChatsQuery`, renders `ThreadItem` list, "New chat" button calls `useCreateChatMutation`.
9. **Client — ChatBox**: Accept `conversationId` prop; call `useMessagesQuery(conversationId)` to hydrate messages on mount; seed local message state from server data.
10. **Client — ChatLayout**: Compose `ThreadSidebar` + `ChatBox`, own `activeThreadId` state, wire new-chat and thread-select interactions.
11. **Client — Chat page**: Replace `<ChatBox dayData={...} />` with `<ChatLayout dayData={...} />`.
12. **Tests**: Add unit tests for new backend handlers and frontend components.

## Acceptance Criteria

- A user can open `/chat`, see a list of their previous threads in the sidebar, and click one to see the full message history.
- Sending a message when no thread is active creates a new thread, auto-titles it, and shows it in the sidebar.
- A user can rename a thread inline; the new title persists on refresh.
- A user can delete a thread; it disappears from the sidebar immediately.
- Refreshing the page with an active thread re-loads that thread's messages from the server.
- Old single-thread conversations (pre-migration) appear as "Untitled" in the sidebar and remain accessible.
- No other user can access, rename, or delete another user's thread (server enforces ownership).

## Risks / Unknowns

- The existing `ask` endpoint sends `conversationId` back in the response — the client `useChatMutation` hook currently ignores it. Care needed to avoid a breaking change for any other consumers of that hook.
- `ChatBox` currently holds messages in local state initialised to `[]`. Loading server messages on mount could cause a flash if not handled with a proper loading state.
- Rate limiter (20 req/min) is applied per IP, not per user — creating a new conversation per message could consume additional quota if a user switches threads rapidly (low risk at current limits).

## Notes

- The sidebar width (260 px) should collapse to 0 on mobile via a CSS class toggle, not a full re-mount, to avoid losing the list query cache.
- `useMessagesQuery` in `features/messages/hooks/useMessagesQuery.js` already exists; confirm its query key and endpoint before wiring ChatBox.
- For the legacy single-thread documents: if `title` is empty, the sidebar can display a formatted `createdAt` date as a fallback label (e.g. "Chat – 15 Jan 2026").
