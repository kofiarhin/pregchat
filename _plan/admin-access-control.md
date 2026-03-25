# Admin Access Control

## Summary

Standardize and centralize admin-only access control across the full stack. The app has admin functionality (dashboard, user management, order management) but the access control system has gaps: mixed identity checks (`isAdmin` vs `role`), no client-side admin route guard, an unprotected write endpoint, and a redundant JWT claim. This spec fixes all of these into a single, consistent, maintainable pattern.

## Goal

- One clear source of truth for admin identity: `User.isAdmin` Boolean
- Backend authorization is the real enforcement layer
- Frontend route protection is centralized via a route guard, not handled inside page components
- Admin UI visibility follows the same rule as backend authorization
- The structure is maintainable for future admin pages and routes

## Problem Statement

1. **Mixed admin identity** — `requireAdmin` middleware checks both `req.user.isAdmin === true` and `req.user.role === "admin"`. The User schema has no `role` field, so the second check is dead code that creates confusion.
2. **No client-side admin route guard** — The `/admin` route in `App.jsx` sits inside `ProtectedRoute` + `OnboardingGuard` but has no admin-specific guard. Any authenticated user navigates to `/admin`, the component mounts, hooks fire, and only then does a late `<Navigate>` redirect kick in.
3. **Duplicated admin detection** — `AdminDashboard.jsx` re-derives admin status with its own `useMemo` that also checks `role === "admin"`, duplicating and diverging from the sidebar's simpler `isAdmin === true` check.
4. **Unprotected write endpoint** — `server/routes/store.js` exposes `POST /` (createStoreItem) with no `requireAuth` or `requireAdmin` middleware.
5. **Redundant JWT claim** — `authController.js` signs `{ id, isAdmin }` into the JWT. The auth middleware loads the full user from DB and never reads this claim. It is unused but could cause stale-claim confusion if ever relied upon.

## User Stories

- As an admin, I want to access the admin dashboard and admin APIs so I can manage users, orders, daily content, and products.
- As a non-admin authenticated user, I want to be cleanly redirected away from admin routes without seeing admin UI flash or triggering admin API calls.
- As a developer, I want a single admin route guard so I can add future admin pages without duplicating access logic in every component.
- As the system, I want all admin write endpoints protected by backend middleware so that no unprotected mutation routes exist.

## Scope

### In Scope

- Standardize admin identity to `isAdmin` Boolean only (remove all `role === "admin"` checks)
- Create a centralized `AdminRoute` client route guard
- Remove self-guarding logic from `AdminDashboard.jsx`
- Protect `POST /store` with `requireAuth` + `requireAdmin`
- Tests for all changed layers

### Out of Scope

- Role-based access control (RBAC) beyond admin/non-admin
- Adding a `role` field to the User schema
- Admin audit logging
- Admin user management (promoting/demoting users)
- Rate limiting on admin endpoints

## UX/UI Requirements

- Non-admin users who navigate to `/admin` (e.g. via URL bar) are redirected to `/dashboard` before any admin UI renders
- The sidebar admin link remains visible only to admin users (already working correctly via `Sidebar.jsx`)
- While admin status is loading, a loading indicator displays (consistent with the existing loading pattern in `OnboardingGuard`)
- No new UI components, styles, or pages are needed beyond the route guard

## Frontend Requirements

- Create `AdminRoute` route guard component in `client/src/routes/` following the same pattern as `ProtectedRoute` and `OnboardingGuard`
  - Uses `useCurrentUserQuery()` to get current user
  - If user is loading, renders a loading indicator
  - If `currentUser.isAdmin !== true`, renders `<Navigate to="/dashboard" replace />`
  - Otherwise renders `<Outlet />`
- In `App.jsx`, wrap the `/admin` route (and any future admin routes) inside `AdminRoute`, nested within the existing `OnboardingGuard` group
- In `AdminDashboard.jsx`, remove:
  - The `isAdmin` `useMemo` derivation
  - The `if (!isAdmin) return <Navigate>` self-guard
  - The `{ enabled: isAdmin }` option from `useAdminUsersQuery` and `useAdminOrdersQuery` (queries should always be enabled when the component mounts, since the route guard guarantees admin access)
  - The `Navigate` import (no longer used)

## Backend Requirements

- Simplify `requireAdmin.js` to check only `req.user.isAdmin === true`. Remove the `req.user.role === "admin"` fallback. Preserve the existing status code behavior: the `!req.user` defensive guard and the `!isAdmin` rejection both return 403, consistent with the current middleware. In practice `!req.user` is unreachable because `requireAuth` always runs first and returns 401, but the guard is kept as a safety net with its original status code.
- In `server/routes/store.js`, add `requireAuth` and `requireAdmin` middleware to the `POST /` route. The `GET` routes remain public.
- **Optional cleanup (deferred):** The `isAdmin` claim in the JWT payload (`authController.js` `signToken`) is redundant — the auth middleware loads the full user from DB and no code reads this claim. It may be removed in a future pass once confirmed no external consumer depends on it. This spec does not require its removal.

## Data Model Changes

None. The `User` schema already has `isAdmin: Boolean` as the correct source of truth. No fields are added, removed, or renamed.

## API Changes

### New Endpoints

None.

### Updated Endpoints

| Endpoint | Change |
|---|---|
| `POST /store` (`server/routes/store.js`) | Add `requireAuth` + `requireAdmin` middleware. Previously unprotected. |

All existing admin endpoints (`/admin/*`, `/api/admin/*`) remain unchanged — they are already correctly protected at mount level in `server/server.js`.

## Validation Rules

- `requireAdmin` must reject requests where `req.user` is missing (403 — existing defensive guard, unreachable in normal flow)
- `requireAdmin` must reject requests where `req.user.isAdmin` is `false`, `undefined`, or any non-`true` value (403)
- `requireAdmin` must NOT grant access based on `role === "admin"` (regression guard)
- `AdminRoute` must redirect before rendering child components — no admin UI should mount for non-admin users

## Edge Cases

- **User with `role: "admin"` set directly in MongoDB but `isAdmin: false`** — After removing the `role` fallback, these users lose admin access. Requires a pre-deploy migration check (see Risks).
- **Existing JWT tokens with `isAdmin` claim** — Harmless. The auth middleware loads user from DB and never reads the token claim. No forced logout or token rotation needed.
- **Admin status revoked during active session** — Client retains access until `useCurrentUserQuery` refetches. Acceptable because backend is the real enforcement layer — API calls will fail with 403.
- **Non-admin user bookmarks `/admin` URL** — `AdminRoute` guard redirects to `/dashboard` before any admin component mounts or API call fires.
- **Client-side store item creation without auth** — If any client code calls `POST /store` without an auth token, it will receive 401 after this change. Review client store feature to confirm creation is admin-only.

## Security / Authorization

- **Backend is authoritative** — `requireAuth` (JWT verification + DB user lookup) and `requireAdmin` (`isAdmin === true` check) are the real enforcement layer. Client guards are UX conveniences only.
- **DB-backed authorization** — `auth.js` middleware loads the full user from DB on every request, so admin status is always current. The JWT is only used for identity (`id`), not authorization.
- **No privilege escalation path** — `isAdmin` defaults to `false` in the schema and is not settable via any public API endpoint (registration, profile update). Admin status can only be granted via direct DB access or the seed script (`server/seedAdmin.js`).
- **`POST /store` fix closes a real vulnerability** — Currently any unauthenticated request can create store items.

## Testing Requirements

### Frontend

1. **`AdminRoute` component**
   - Redirects to `/dashboard` when `currentUser.isAdmin` is `false`
   - Redirects to `/dashboard` when `currentUser.isAdmin` is `undefined`
   - Renders `<Outlet />` when `currentUser.isAdmin` is `true`
   - Shows loading state while `currentUser` is loading

2. **`AdminDashboard`**
   - Renders correctly when user is admin (no self-guard logic)
   - Query hooks fire unconditionally (no `enabled` condition)

3. **`Sidebar`**
   - Admin nav item visible when `user.isAdmin === true`
   - Admin nav item hidden when `user.isAdmin` is `false` or `undefined`
   - (Existing behavior — verify no regression)

### Backend

1. **`requireAdmin` middleware**
   - Returns 403 when `req.user` is missing
   - Returns 403 when `req.user.isAdmin` is `false`
   - Returns 403 when `req.user.isAdmin` is `undefined`
   - Calls `next()` when `req.user.isAdmin` is `true`
   - Does NOT grant access for `req.user.role === "admin"` with `isAdmin: false` (regression test)

2. **`POST /store` endpoint**
   - Returns 401 with no auth token
   - Returns 403 with non-admin auth token
   - Returns 201 with admin auth token

3. **Admin routes (`/admin/*`, `/api/admin/*`)**
   - Existing tests pass with simplified `requireAdmin`
   - Returns 403 for non-admin authenticated users
   - Returns 401 for unauthenticated requests

## File Impact

### Files Confirmed To Exist

| File | Purpose |
|---|---|
| `server/models/User.js` | User schema — has `isAdmin` Boolean, no `role` field |
| `server/middleware/auth.js` | JWT verification, loads user from DB |
| `server/middleware/requireAdmin.js` | Admin authorization check |
| `server/controllers/authController.js` | JWT signing, user response building |
| `server/server.js` | Admin route mounting with middleware |
| `server/routes/adminRoutes.js` | Admin CRUD routes (daily content, products) |
| `server/routes/adminManagementRoutes.js` | Admin user/order management routes |
| `server/routes/store.js` | Store routes — `POST /` is unprotected |
| `client/src/App.jsx` | Route definitions |
| `client/src/routes/ProtectedRoute.jsx` | Auth-only route guard |
| `client/src/routes/OnboardingGuard.jsx` | Onboarding completion guard |
| `client/src/pages/admin/AdminDashboard.jsx` | Admin dashboard page with self-guarding |
| `client/src/components/Sidebar/Sidebar.jsx` | Nav with admin visibility filter (no change needed) |

### Files To Create

| File | Purpose |
|---|---|
| `client/src/routes/AdminRoute.jsx` | Centralized admin route guard component |

### Files To Update

| File | Change |
|---|---|
| `server/middleware/requireAdmin.js` | Remove `role === "admin"` fallback, check `isAdmin === true` only, preserve existing status codes |
| `server/routes/store.js` | Add `requireAuth` + `requireAdmin` to `POST /` |
| `client/src/App.jsx` | Wrap `/admin` route in new `AdminRoute` guard |
| `client/src/pages/admin/AdminDashboard.jsx` | Remove self-guarding logic (`isAdmin` useMemo, Navigate redirect, `enabled: isAdmin` on queries) |

## Step-by-Step Implementation Plan

1. **Create `client/src/routes/AdminRoute.jsx`** — New route guard component using `useCurrentUserQuery`, redirecting non-admins to `/dashboard`. Follow the pattern of `OnboardingGuard.jsx`.

2. **Update `client/src/App.jsx`** — Import `AdminRoute`. Nest the `/admin` route (and future admin routes) inside an `AdminRoute` wrapper element, within the existing `OnboardingGuard` group.

3. **Update `client/src/pages/admin/AdminDashboard.jsx`** — Remove the `isAdmin` useMemo, the `if (!isAdmin) return <Navigate>` block, the `{ enabled: isAdmin }` from both query hooks, and the `Navigate` import.

4. **Update `server/middleware/requireAdmin.js`** — Remove the `req.user.role === "admin"` branch. Keep only `req.user.isAdmin === true`. Preserve existing 403 status codes.

5. **Update `server/routes/store.js`** — Import `requireAuth` and `requireAdmin`. Add both as middleware to the `POST /` route.

6. **Write tests** — Add unit tests for `AdminRoute`, `requireAdmin` regression, and `POST /store` protection.

7. **Pre-deploy migration check** — Run `db.users.find({ role: "admin", isAdmin: { $ne: true } })` against the production database to identify any users relying on the `role` fallback. Update those documents to set `isAdmin: true` before deploying.

## Acceptance Criteria

- [ ] Non-admin authenticated users are redirected away from `/admin` before any admin component mounts
- [ ] Admin users can access `/admin` and see the admin dashboard with users and orders tabs
- [ ] Sidebar shows admin link only for admin users (existing behavior preserved)
- [ ] `POST /store` returns 401 for unauthenticated requests and 403 for non-admin users
- [ ] `requireAdmin` middleware rejects users with `role: "admin"` but `isAdmin: false`
- [ ] All admin routes (`/admin/*`, `/api/admin/*`) continue to enforce auth + admin
- [ ] All new and existing tests pass

## Risks / Unknowns

**Risk: Users with `role: "admin"` in MongoDB but `isAdmin: false`**
The User schema has no `role` field, but documents could have been manually given one. Removing the `role` fallback would lock these users out. **Mitigation:** Run `db.users.find({ role: "admin", isAdmin: { $ne: true } })` before deploying. Update matching documents to set `isAdmin: true`.

**Risk: `POST /store` currently unprotected**
If any client code creates store items without sending an auth token, it will break. Review client store feature to confirm creation is only used from admin contexts.

**Risk: Stale `currentUser` on client**
If admin status is revoked mid-session, the client retains access until the query refetches. Acceptable — backend is the enforcement layer and will return 403 on API calls.

**Unknown: Existing test coverage for admin flows**
The extent of existing test coverage for admin middleware and admin routes is not fully audited. New tests should be written regardless, but existing tests may need updating if they rely on the `role` fallback.

## Notes

- The `server/server.js` admin route mounting (`requireAuth` + `requireAdmin` at the `app.use` level) is already solid and requires no changes.
- `client/src/components/Sidebar/Sidebar.jsx` already correctly filters on `isAdmin === true` only — no changes needed.
- `server/middleware/auth.js` loads the full user from DB on every request, making DB-backed authorization current by default.
- The `adminManagementController.js` derives a display `role` string from `isAdmin` for the users table UI (`user.isAdmin === true ? "admin" : "user"`). This is a presentation concern and is unaffected by this spec.
- **JWT `isAdmin` claim (optional cleanup):** The `isAdmin` field in the JWT payload is redundant since no code reads it. It is safe to remove but is deferred as optional cleanup to avoid risk if any external consumer depends on the token shape. The auth middleware always loads the full user from DB regardless.
