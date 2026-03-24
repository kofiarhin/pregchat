# Tip Bookmarks

## Summary

Users can bookmark individual pregnancy tips (from daily content cards) to a personal saved list, then revisit all their bookmarks from a dedicated page. Each bookmark stores a snapshot of the tip text along with the pregnancy day it came from. Users can also add a short personal note to any bookmark.

## Goal

- Give users a way to save specific `tips`, `babyUpdate`, or `momUpdate` content from their daily pregnancy updates so they can refer back to important information without scrolling through previous days.

## Problem Statement

- Daily content appears once on the dashboard and is gone the next day. There is no way for users to flag information they find useful or want to act on later.
- The journal feature requires writing free-form text. There is no lightweight "save this" interaction for content already shown by the app.

## User Stories

- As a user, I want to tap a bookmark icon on a daily tip card so that I can save it without any friction.
- As a user, I want to see all my saved bookmarks in one place so I can review them at any time.
- As a user, I want to add a short personal note to a bookmark so I remember why I saved it.
- As a user, I want to remove a bookmark I no longer need.

## Scope

### In Scope

- Bookmark any of the three daily content fields: `tips`, `babyUpdate`, `momUpdate`.
- Bookmark icon (toggle) on the Dashboard daily content cards.
- `GET /api/bookmarks` — list all bookmarks for the authenticated user.
- `POST /api/bookmarks` — create a bookmark.
- `DELETE /api/bookmarks/:id` — remove a bookmark.
- `PATCH /api/bookmarks/:id` — update the personal note on a bookmark.
- `/bookmarks` page listing all saved bookmarks, sorted newest first.
- Optimistic toggle (filled/unfilled icon) with rollback on failure.

### Out of Scope

- Bookmarking AI chat messages (separate from daily content).
- Sharing bookmarks with other users.
- Categorising or tagging bookmarks.
- Searching across bookmarks.

## UX/UI Requirements

- Each daily content card on the Dashboard shows a small bookmark icon (e.g. `FiBookmark` / `FiBookmarkFilled` from react-icons) in its top-right corner.
- Icon is filled/active when that day+field is already bookmarked; outline when not.
- Clicking the icon bookmarks or removes the bookmark immediately (optimistic update).
- The `/bookmarks` page shows a list of bookmark cards. Each card displays:
  - The tip text (truncated to ~3 lines with "show more" if long).
  - Pregnancy day (e.g. "Day 84 — Week 12") and field label ("Tip", "Baby", "You").
  - Saved date (relative, e.g. "3 days ago").
  - Editable note field (click-to-edit inline, placeholder "Add a note…").
  - A delete (remove) button.
- Empty state: "No bookmarks yet. Save tips from your daily updates."
- Loading state: skeleton cards while fetching.
- Error state: inline error message with retry.
- Responsive: single-column list on mobile, two-column grid on wider screens.

## Frontend Requirements

### Pages to Create

- `client/src/pages/Bookmarks.jsx` — list page for all saved bookmarks.

### Components to Create

- `client/src/components/BookmarkCard/BookmarkCard.jsx` — displays a single bookmark with note editing and delete.
- `client/src/components/BookmarkCard/bookmarkCard.styles.scss`
- `client/src/components/BookmarkIcon/BookmarkIcon.jsx` — toggle icon button; receives `isBookmarked`, `onToggle`, `disabled` props.

### Feature Hooks to Create

- `client/src/features/bookmarks/hooks/useBookmarksQuery.js` — `GET /api/bookmarks` via React Query.
- `client/src/features/bookmarks/hooks/useCreateBookmarkMutation.js` — `POST /api/bookmarks` with optimistic update.
- `client/src/features/bookmarks/hooks/useDeleteBookmarkMutation.js` — `DELETE /api/bookmarks/:id` with optimistic update.
- `client/src/features/bookmarks/hooks/useUpdateBookmarkMutation.js` — `PATCH /api/bookmarks/:id` for note edits.
- `client/src/features/bookmarks/queryKeys.js` — `bookmarkKeys` object.

### Pages to Update

- `client/src/pages/Dashboard.jsx` — add `BookmarkIcon` to each daily content card (tips, babyUpdate, momUpdate cards). Wire to `useCreateBookmarkMutation` / `useDeleteBookmarkMutation`. Derive `isBookmarked` by checking `useBookmarksQuery` results for matching `dayNumber + field`.

### Routing to Update

- `client/src/App.jsx` — add `<Route path="/bookmarks" element={<Bookmarks />} />` inside the `OnboardingGuard` block.

### Navigation

- Add "Bookmarks" link to `AppLayout` sidebar/nav (wherever other protected nav items live).

## Backend Requirements

### Model to Create

- `server/models/Bookmark.js` — new Mongoose schema (see Data Model Changes).

### Controller to Create

- `server/controllers/bookmarkController.js`:
  - `getBookmarks(req, res)` — find all bookmarks for `req.user._id`, sorted by `createdAt: -1`.
  - `createBookmark(req, res)` — create a bookmark; reject duplicates (same `userId + dayNumber + field`) with 409.
  - `deleteBookmark(req, res)` — find by `{ _id, userId }`, delete.
  - `updateBookmark(req, res)` — find by `{ _id, userId }`, update `note` only.

### Routes to Create

- `server/routes/bookmarks.js`:
  - `GET /` → `getBookmarks` (requireAuth)
  - `POST /` → `createBookmark` (requireAuth)
  - `PATCH /:id` → `updateBookmark` (requireAuth)
  - `DELETE /:id` → `deleteBookmark` (requireAuth)

### App Registration

- `server/app.js` — add `app.use("/api/bookmarks", bookmarkRoutes)`.

## Data Model Changes

```js
// server/models/Bookmark.js
{
  userId:     { type: ObjectId, ref: "User", required: true },
  dayNumber:  { type: Number, required: true, min: 0, max: 280 },
  field:      { type: String, required: true, enum: ["tips", "babyUpdate", "momUpdate"] },
  content:    { type: String, required: true, trim: true },  // snapshot at time of saving
  note:       { type: String, default: "", trim: true, maxlength: 500 },
  createdAt:  { type: Date, default: Date.now },
}

// Index to enforce uniqueness and enable fast lookup:
{ userId: 1, dayNumber: 1, field: 1 }  — unique: true
{ userId: 1, createdAt: -1 }
```

No changes to any existing model. No migration needed.

## API Changes

### New Endpoints

- `GET /api/bookmarks`
  - Purpose: Return all bookmarks for the authenticated user.
  - Auth: requireAuth
  - Request: none
  - Response: `[ { id, dayNumber, field, content, note, createdAt } ]`

- `POST /api/bookmarks`
  - Purpose: Create a new bookmark.
  - Auth: requireAuth
  - Request: `{ dayNumber: number, field: "tips"|"babyUpdate"|"momUpdate", content: string, note?: string }`
  - Response: `201 { id, dayNumber, field, content, note, createdAt }`
  - Error: `409` if this `userId + dayNumber + field` combination already exists.

- `PATCH /api/bookmarks/:id`
  - Purpose: Update the personal note on a bookmark.
  - Auth: requireAuth (owner only)
  - Request: `{ note: string }`
  - Response: `{ id, note, updatedAt }`

- `DELETE /api/bookmarks/:id`
  - Purpose: Remove a bookmark.
  - Auth: requireAuth (owner only)
  - Request: none
  - Response: `204 No Content`

## Validation Rules

- `dayNumber`: integer 0–280; required on create.
- `field`: must be one of `"tips"`, `"babyUpdate"`, `"momUpdate"`; required on create.
- `content`: non-empty string; required on create; max 2000 chars.
- `note`: optional string; max 500 chars; empty string is valid.
- Duplicate `userId + dayNumber + field`: reject with 409.
- Ownership enforced server-side on PATCH and DELETE via `{ _id, userId }` query.

## Edge Cases

- User tries to bookmark the same day+field twice — `POST` returns 409; client icon should already show filled state via `useBookmarksQuery`, preventing the second request.
- `content` from `DailyContent` is long — stored as snapshot; display truncated with "show more" on the bookmarks page.
- DailyContent for a day changes after a bookmark is saved — the bookmark retains its `content` snapshot; no sync needed.
- User has no pregnancy profile yet (day is unknown) — bookmark icon should not appear until `useTodayPregnancyQuery` resolves with a `day` value.
- Network failure on optimistic create — roll back icon to unfilled state; show a toast error.
- Network failure on optimistic delete — re-add item to list; show a toast error.

## Security / Authorization

- All routes require `requireAuth` middleware.
- `userId` is taken from `req.user._id` (JWT), never from the request body.
- PATCH and DELETE look up `{ _id, userId }` — a user cannot modify another user's bookmarks.
- `content` is stored as plain text and rendered as text in the UI; no HTML injection risk.

## Testing Requirements

### Frontend

- `BookmarkIcon` renders filled when `isBookmarked` is true and outline when false.
- `BookmarkIcon` calls `onToggle` when clicked.
- `BookmarkCard` shows tip text, day, field label, and note.
- Inline note edit saves on blur.
- Delete button calls the delete mutation.
- `Bookmarks` page renders empty state when list is empty.
- Optimistic rollback restores icon state on mutation error.

### Backend

- `POST /api/bookmarks` creates a bookmark and returns 201.
- `POST /api/bookmarks` returns 409 for a duplicate `userId + dayNumber + field`.
- `GET /api/bookmarks` returns only the requesting user's bookmarks.
- `PATCH /api/bookmarks/:id` updates the note for the owner.
- `PATCH /api/bookmarks/:id` returns 404 for a non-owner.
- `DELETE /api/bookmarks/:id` removes the document.
- `DELETE /api/bookmarks/:id` returns 404 for a non-owner.
- Invalid `dayNumber` (< 0 or > 280) returns 400.
- Invalid `field` value returns 400.

## File Impact

### Files Confirmed To Exist

- `server/app.js` — register new bookmark routes here.
- `server/middleware/auth.js` — `requireAuth` middleware already in use.
- `client/src/App.jsx` — add `/bookmarks` route.
- `client/src/pages/Dashboard.jsx` — add `BookmarkIcon` to daily content cards.
- `client/src/api/http.js` — use existing `http.get/post/patch/delete` wrapper.

### Files To Create

- `server/models/Bookmark.js`
- `server/controllers/bookmarkController.js`
- `server/routes/bookmarks.js`
- `client/src/pages/Bookmarks.jsx`
- `client/src/components/BookmarkCard/BookmarkCard.jsx`
- `client/src/components/BookmarkCard/bookmarkCard.styles.scss`
- `client/src/components/BookmarkIcon/BookmarkIcon.jsx`
- `client/src/features/bookmarks/hooks/useBookmarksQuery.js`
- `client/src/features/bookmarks/hooks/useCreateBookmarkMutation.js`
- `client/src/features/bookmarks/hooks/useDeleteBookmarkMutation.js`
- `client/src/features/bookmarks/hooks/useUpdateBookmarkMutation.js`
- `client/src/features/bookmarks/queryKeys.js`

## Step-by-Step Implementation Plan

1. **Backend — model**: Create `server/models/Bookmark.js` with the schema above.
2. **Backend — controller**: Create `server/controllers/bookmarkController.js` with `getBookmarks`, `createBookmark`, `updateBookmark`, `deleteBookmark`.
3. **Backend — routes**: Create `server/routes/bookmarks.js` and register in `server/app.js` at `/api/bookmarks`.
4. **Client — queryKeys**: Create `client/src/features/bookmarks/queryKeys.js`.
5. **Client — hooks**: Create `useBookmarksQuery`, `useCreateBookmarkMutation`, `useDeleteBookmarkMutation`, `useUpdateBookmarkMutation`.
6. **Client — BookmarkIcon**: Create the toggle icon component.
7. **Client — Dashboard**: Import `BookmarkIcon`, wire it to the tips/babyUpdate/momUpdate cards; derive `isBookmarked` from the bookmarks list keyed by `dayNumber + field`.
8. **Client — BookmarkCard**: Create the bookmark list item component with inline note editing and delete.
9. **Client — Bookmarks page**: Build the full list page using `useBookmarksQuery` and `BookmarkCard`.
10. **Client — routing**: Register `/bookmarks` in `App.jsx` and add the nav link in `AppLayout`.
11. **Tests**: Add unit tests for the controller, routes, and key components.

## Acceptance Criteria

- A user can click a bookmark icon on any of the three daily content cards and the icon immediately fills to indicate the bookmark was saved.
- Clicking the filled icon removes the bookmark and the icon returns to outline state.
- Navigating to `/bookmarks` shows all saved bookmarks with tip text, day label, and save date.
- A user can click a note field, type a note, blur the field, and the note persists after a page refresh.
- A user can delete a bookmark from the bookmarks page; it disappears immediately.
- A user cannot see or modify another user's bookmarks (server-enforced).
- Bookmarking the same day+field twice is silently ignored on the client (icon is already filled) and returns 409 on the server.

## Risks / Unknowns

- `Dashboard.jsx` will need to know the current `dayNumber` (from `useTodayPregnancyQuery`) to construct the bookmark payload. If the query is loading or returns null, the bookmark icon should be hidden or disabled rather than broken.
- The daily content cards' current markup structure is unknown — the `BookmarkIcon` placement will depend on how those cards are structured inside `Dashboard.jsx` (need to review the full file before implementation).
- `DailyContent` has a `tips` field (single string). If future content has multiple tips, the schema would need to change; for now one bookmark per `tips` field per day is fine.

## Notes

- Pattern follows the `Journal` feature closely: separate model → controller → routes file → registered in `app.js`.
- `bookmarkKeys` shape should mirror existing feature query key patterns: `{ all, list, detail }`.
- On the bookmarks page, the "field" label should be human-readable: `babyUpdate` → "Baby update", `momUpdate` → "Your body", `tips` → "Tip".
