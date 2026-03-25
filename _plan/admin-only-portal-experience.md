# Admin-Only Portal Experience

## Summary

Separate the app into two mutually exclusive authenticated experiences: a **user portal** (pregnancy app) and an **admin portal** (management dashboard). Admin users land in the admin portal and cannot access user-only pages. Regular users land in the user portal and cannot access admin pages. Public and auth pages remain shared.

## Goal

- Admin users see only admin functionality after login — no pregnancy dashboard, chat, store, journals, appointments, voice, faceoff, cart, checkout, onboarding, or profile
- Regular users see only the pregnancy app — no admin dashboard or admin nav
- Login is shared; post-login redirect is role-dependent
- Each portal has its own layout, nav, and default landing page
- Backend enforcement already exists via `requireAuth` + `requireAdmin` on `/admin/*` and `/api/admin/*`; this spec adds client-side route isolation and a new `UserOnlyRoute` guard to block admins from user pages

## Problem Statement

Currently, admin users have full access to the normal user app **plus** the admin dashboard. An admin who logs in lands on `/dashboard` (the pregnancy dashboard), sees the full user sidebar (profile, chat, store, journals, appointments, etc.), and has an extra "Admin" link at the bottom. This means:

1. **Admins see irrelevant user features** — An admin is not a pregnant user. Pregnancy onboarding, daily updates, chat with Aya, journals, appointments, baby name faceoff, store, and cart are meaningless for an admin account.
2. **No role-based landing page** — Both roles land on `/dashboard` after login. Admins must manually navigate to `/admin`.
3. **No enforcement blocking admins from user routes** — An admin can freely use `/chat`, `/store`, `/journals`, etc. The `OnboardingGuard` would even force an admin into pregnancy onboarding flow if they haven't completed it.
4. **Sidebar shows combined navigation** — The sidebar merges user links and admin link into one list, implying admins are power-users rather than a separate role.

## User Stories

- As an admin, when I log in I want to land directly on the admin dashboard, not the pregnancy app.
- As an admin, I should not see pregnancy-specific navigation (chat, journals, store, appointments, profile, dashboard, etc.).
- As an admin, if I try to navigate to a user-only page via URL, I should be redirected back to the admin dashboard.
- As a regular user, my experience should remain unchanged — I should never see or reach admin pages.
- As a developer, I want the role split to be enforced by route guards, not scattered across individual page components.

## Scope

### In Scope

- Role-dependent post-login redirect (`/admin` for admins, `/dashboard` or `/onboarding` for users)
- New `UserOnlyRoute` guard that blocks admin users from user-only pages
- Update `AdminRoute` to redirect to `/admin` (already redirects to `/dashboard`, needs to change)
- Separate admin route tree from user route tree in `App.jsx`
- Admin-specific layout (`AdminLayout`) with admin-only header/nav and no user sidebar
- Update sidebar to only render user nav items (remove admin link entirely — admins will have their own nav)
- Skip onboarding for admin users (admins should never enter pregnancy onboarding)
- Update `PublicOnlyRoute` to redirect admins to `/admin` instead of `/dashboard`
- Update catch-all redirect to be role-aware

### Out of Scope

- Separate login pages per role (login remains shared)
- Separate registration flow for admins (admins are created via seed script / DB)
- Backend route changes (already enforced correctly)
- New admin pages beyond the existing `AdminDashboard`
- Redesigning the admin dashboard UI
- RBAC beyond admin/user binary

## UX/UI Requirements

- **Admin login flow:** Login → resolve user → `isAdmin === true` → redirect to `/admin`
- **User login flow:** Login → resolve user → `isAdmin !== true` → redirect to `/dashboard` or `/onboarding` (existing behavior)
- **Admin portal navigation:** A minimal admin header with brand name, admin nav links (currently just "Dashboard"), and logout. No pregnancy sidebar, no user nav items, no cart, no pregnancy branding.
- **Admin layout:** Uses the existing `app dark` wrapper for visual consistency but with an admin-specific header/nav component instead of the user `Header`/`Sidebar`. Footer is optional (can use `Footer variant="app"` or omit).
- **User portal:** Completely unchanged. The "Admin" sidebar link is removed because admins never enter this portal.
- **Styling:** SCSS modules, consistent with the existing repo pattern. The admin layout/nav component gets its own `.module.scss` file.

## Frontend Requirements

### New route guard: `UserOnlyRoute`

- Create `client/src/routes/UserOnlyRoute.jsx`
- Uses `useCurrentUserQuery()` to get current user
- If loading or no user, shows loading indicator
- If `currentUser.isAdmin === true`, redirects to `/admin`
- Otherwise renders `<Outlet />`

### Update `AdminRoute`

- Change redirect target from `/dashboard` to `/admin` for the catch-all (already redirects non-admins — but the fallback destination when an admin hits a non-admin page should go to `/admin`)
- Actually: `AdminRoute` currently redirects non-admins to `/dashboard`. This is correct and stays. The new `UserOnlyRoute` handles the reverse (redirects admins to `/admin`).

### New layout: `AdminLayout`

- Create `client/src/layouts/AdminLayout/AdminLayout.jsx`
- Contains an admin-specific header/nav (brand, admin nav links, logout button)
- Renders `<Outlet />` for child routes
- Does NOT include the user `Header`, `Sidebar`, or `Footer`
- Create `client/src/layouts/AdminLayout/admin-layout.module.scss` for styling

### Update `App.jsx` route structure

Restructure the authenticated route tree into two branches:

**Admin branch** (inside `ProtectedRoute` → `AdminRoute` → `AdminLayout`):
- `/admin` → `AdminDashboard`
- Future admin pages nest here

**User branch** (inside `ProtectedRoute` → `UserOnlyRoute` → `AppLayout`):
- `/onboarding` → `Onboarding` (outside `OnboardingGuard`, as currently)
- All existing user routes inside `OnboardingGuard` (dashboard, chat, voice, faceoff, store, cart, checkout, appointments, journals, profile, etc.)

**Shared:**
- Public routes remain unchanged (`/`, `/about`, `/privacy`, `/terms`, `/contact`)
- Auth routes remain unchanged (`/login`, `/register`) — but `PublicOnlyRoute` becomes role-aware
- Catch-all `*` redirect becomes role-aware

### Update `PublicOnlyRoute`

- Currently redirects authenticated users to `/dashboard` or `/onboarding`
- Add admin-awareness: if `currentUser.isAdmin === true`, redirect to `/admin` instead

### Update `Sidebar`

- Remove the admin nav item entirely (`{ id: "admin", path: "/admin", requiresAdmin: true }`)
- Remove the `requiresAdmin` filtering logic
- Sidebar now only contains user nav items — it is never rendered for admins (admins use `AdminLayout` which has its own nav)

### Update catch-all redirect

- Currently: `<Navigate to={isAuthenticated ? "/dashboard" : "/"} />`
- Change to: `<Navigate to={isAuthenticated ? (currentUser?.isAdmin ? "/admin" : "/dashboard") : "/"} />`

### Skip onboarding for admins

- `OnboardingGuard` currently redirects to `/onboarding` if `onboardingCompletedAt` is null
- Admins will never reach `OnboardingGuard` because the admin route branch does not include it
- No change needed to `OnboardingGuard` itself — the route structure handles it

## Backend Requirements

No backend changes required as part of this spec.

- `/admin/*` and `/api/admin/*` are already protected by `requireAuth` + `requireAdmin` (in `server/server.js`)
- All user-facing API routes (`/chat`, `/api/messages`, `/api/journals`, etc.) are protected by `requireAuth` only — they remain general authenticated-user endpoints and do not distinguish between admin and non-admin callers
- This feature enforces role separation primarily at the client route, layout, and navigation level
- If stricter backend user-only enforcement is needed later (e.g., a `requireNonAdmin` middleware on user endpoints), that should be scoped as a separate follow-up audit — it is not required for this spec

## Data Model Changes

None.

## API Changes

### New Endpoints

None.

### Updated Endpoints

None.

## Validation Rules

- `UserOnlyRoute` must redirect `isAdmin === true` users to `/admin` before rendering user page components
- `AdminRoute` must redirect `isAdmin !== true` users to `/dashboard` before rendering admin page components (existing behavior, unchanged)
- `PublicOnlyRoute` must redirect authenticated admin users to `/admin`, not `/dashboard`
- Catch-all `*` route must redirect based on role
- Admins must never see the user `Sidebar` or `Header`
- Users must never see admin navigation

## Edge Cases

- **Admin with no `onboardingCompletedAt`** — Not a problem. Admins route through `AdminRoute` → `AdminLayout`, which does not include `OnboardingGuard`. They never hit the onboarding flow.
- **Admin navigates to `/dashboard` via URL** — `UserOnlyRoute` catches this and redirects to `/admin`.
- **Admin navigates to `/chat`, `/store`, etc. via URL** — Same: `UserOnlyRoute` redirects to `/admin`.
- **User navigates to `/admin` via URL** — `AdminRoute` catches this and redirects to `/dashboard` (existing behavior).
- **Admin tries to use user APIs directly (e.g., via curl)** — User-facing APIs remain general authenticated-user endpoints and will accept the request. This is acceptable for this spec — role separation is enforced at the client route/layout level. If stricter backend enforcement is needed, it should be a separate follow-up audit.
- **User whose `isAdmin` is toggled mid-session** — On next `useCurrentUserQuery` refetch, the route guard will redirect them. Acceptable latency.
- **Login page redirect after login** — `PublicOnlyRoute` checks `isAdmin` to decide redirect target. Since `currentUser` is available from `useCurrentUserQuery` after login, the redirect is immediate.
- **Shared pages (about, privacy, terms, contact, home)** — Accessible by both roles, unaffected.
- **Admin accessing `/onboarding` via URL** — `UserOnlyRoute` wraps the onboarding route too, so admin is redirected to `/admin`.

## Security / Authorization

- **Backend is authoritative** — Admin API endpoints are protected by `requireAuth` + `requireAdmin`. User API endpoints are protected by `requireAuth`. Client-side guards are UX conveniences, not security boundaries.
- **User APIs remain authenticated-user APIs** — User-facing endpoints do not currently reject admin callers. This spec enforces role separation at the client route, layout, and navigation level. If stricter backend user-only enforcement is needed later, that should be a separate follow-up audit.
- **Route guards are defense-in-depth** — `UserOnlyRoute` and `AdminRoute` prevent UI access but are not the security boundary. The backend is.
- **No privilege escalation** — `isAdmin` is not settable via any public API. Only seed script or direct DB access can grant it.

## Testing Requirements

### Frontend

1. **`UserOnlyRoute` component**
   - Redirects to `/admin` when `currentUser.isAdmin` is `true`
   - Renders `<Outlet />` when `currentUser.isAdmin` is `false`
   - Shows loading state while `currentUser` is loading

2. **`AdminRoute` component**
   - Redirects to `/dashboard` when `currentUser.isAdmin` is not `true` (existing behavior, verify no regression)
   - Renders `<Outlet />` when `currentUser.isAdmin` is `true`

3. **`PublicOnlyRoute` component**
   - Redirects admin users to `/admin`
   - Redirects non-admin users to `/dashboard` or `/onboarding` (existing behavior)

4. **`AdminLayout` component**
   - Renders admin nav with logout
   - Does NOT render user `Header`, `Sidebar`, or `Footer`
   - Renders `<Outlet />`

5. **`Sidebar` component**
   - No longer contains admin nav item
   - No `requiresAdmin` filtering logic

6. **Route integration**
   - Admin user logging in lands on `/admin`
   - Admin user navigating to `/dashboard` is redirected to `/admin`
   - Admin user navigating to `/chat` is redirected to `/admin`
   - Regular user logging in lands on `/dashboard` or `/onboarding`
   - Regular user navigating to `/admin` is redirected to `/dashboard`
   - Catch-all `*` redirects admin to `/admin`, user to `/dashboard`

### Backend

No new backend tests required. Existing `requireAdmin` middleware tests remain valid.

## File Impact

### Files Confirmed To Exist

| File | Purpose |
|---|---|
| `client/src/App.jsx` | Route definitions — currently one merged authenticated tree |
| `client/src/routes/ProtectedRoute.jsx` | Auth-only route guard |
| `client/src/routes/OnboardingGuard.jsx` | Redirects to onboarding if not completed |
| `client/src/routes/AdminRoute.jsx` | Redirects non-admins away from admin routes |
| `client/src/routes/PublicOnlyRoute.jsx` | Redirects authenticated users away from login/register |
| `client/src/layouts/AppLayout/AppLayout.jsx` | User app layout (Header + Footer + Outlet) |
| `client/src/layouts/PublicLayout/PublicLayout.jsx` | Public pages layout |
| `client/src/components/Header/Header.jsx` | App header with sidebar toggle, avatar, brand |
| `client/src/components/Sidebar/Sidebar.jsx` | Nav sidebar with user + admin links |
| `client/src/components/Footer/Footer.jsx` | Footer with public/app variants |
| `client/src/pages/admin/AdminDashboard.jsx` | Admin dashboard page |
| `client/src/pages/admin/adminDashboard.module.scss` | Admin dashboard styles |
| `server/server.js` | Admin route mounting (no change needed) |
| `server/middleware/requireAdmin.js` | Admin middleware (no change needed) |
| `server/middleware/auth.js` | Auth middleware (no change needed) |

### Files To Create

| File | Purpose |
|---|---|
| `client/src/routes/UserOnlyRoute.jsx` | Route guard that blocks admin users from user-only pages |
| `client/src/layouts/AdminLayout/AdminLayout.jsx` | Admin portal layout with admin-specific header/nav |
| `client/src/layouts/AdminLayout/admin-layout.module.scss` | Styles for admin layout |

### Files To Update

| File | Change |
|---|---|
| `client/src/App.jsx` | Split authenticated routes into admin branch (`AdminRoute` → `AdminLayout`) and user branch (`UserOnlyRoute` → `AppLayout`). Pass `currentUser` to catch-all for role-aware redirect. |
| `client/src/routes/PublicOnlyRoute.jsx` | Add admin-aware redirect: `isAdmin` users go to `/admin` instead of `/dashboard` |
| `client/src/components/Sidebar/Sidebar.jsx` | Remove admin nav item and `requiresAdmin` filtering logic |

## Step-by-Step Implementation Plan

1. **Create `client/src/routes/UserOnlyRoute.jsx`** — Route guard that redirects `isAdmin === true` users to `/admin`. Pattern matches `AdminRoute` and `OnboardingGuard`.

2. **Create `client/src/layouts/AdminLayout/AdminLayout.jsx` and `admin-layout.module.scss`** — Minimal admin layout with brand, admin nav links, logout button, and `<Outlet />`. No user Header/Sidebar/Footer.

3. **Update `client/src/App.jsx`** — Restructure authenticated routes into two branches:
   - `ProtectedRoute` → `AdminRoute` → `AdminLayout` → admin pages
   - `ProtectedRoute` → `UserOnlyRoute` → `AppLayout` → `/onboarding` + `OnboardingGuard` → user pages
   - Make catch-all redirect role-aware (pass `currentUser` into `AppShell`)

4. **Update `client/src/routes/PublicOnlyRoute.jsx`** — When authenticated user is admin, redirect to `/admin` instead of `/dashboard`.

5. **Update `client/src/components/Sidebar/Sidebar.jsx`** — Remove the `{ id: "admin", ... requiresAdmin: true }` nav item and the `requiresAdmin` filter logic.

6. **Write tests** — Unit tests for `UserOnlyRoute`, `AdminLayout`, updated `PublicOnlyRoute`, updated `Sidebar`, and route integration tests for both roles.

## Acceptance Criteria

- [ ] Admin user logs in and lands on `/admin`, not `/dashboard`
- [ ] Admin user sees admin-specific navigation (admin header/nav with logout), not the user sidebar
- [ ] Admin user navigating to any user-only page (`/dashboard`, `/chat`, `/store`, `/journals`, `/appointments`, `/profile`, `/cart`, `/checkout`, `/voice`, `/faceoff`, `/onboarding`) is redirected to `/admin`
- [ ] Non-admin user behavior remains functionally unchanged except where route structure and redirects intentionally changed
- [ ] Regular user navigating to `/admin` is redirected to `/dashboard` (existing behavior preserved)
- [ ] Login page redirects admin users to `/admin` and regular users to `/dashboard` or `/onboarding`
- [ ] Admin user never sees onboarding flow
- [ ] Sidebar no longer contains an admin link
- [ ] Catch-all `*` route redirects admin to `/admin`, user to `/dashboard`
- [ ] Existing tests may be updated where redirect behavior or route structure changed intentionally

## Risks / Unknowns

**Risk: Admin users with pregnancy profiles**
If any existing admin user has completed onboarding and created a pregnancy profile, their data remains in the DB but becomes inaccessible via the UI after this change. This is acceptable — admin accounts should not have pregnancy profiles. No data deletion is needed; the data simply becomes unreachable from the admin portal.

**Risk: Single admin page**
Currently there is only one admin page (`AdminDashboard`). The admin portal will feel minimal. This is expected and correct — future admin pages will nest naturally under the `AdminRoute` → `AdminLayout` branch.

**Risk: Admin layout branding/styling**
The admin layout needs its own header/nav component. This is new UI work that must be styled to feel consistent with the app's dark theme. The `AdminDashboard` already has its own SCSS module (`adminDashboard.module.scss`), so the admin layout follows the same pattern.

**Risk: `currentUser` availability in catch-all redirect**
The catch-all route currently uses only `isAuthenticated` boolean. It needs `currentUser` to determine role. `currentUser` is already available in `AppShell` props — the change is to use `currentUser?.isAdmin` in the ternary.

**Risk: Hard-coded `/dashboard` redirects elsewhere in the codebase**
Pages, hooks, auth flows, mutation success handlers, logout handlers, or login flows may contain hard-coded redirects to `/dashboard` (e.g., `navigate("/dashboard")`, `<Navigate to="/dashboard" />`). Any of these could incorrectly send an admin user into the user portal after an action completes. These must be audited and made role-aware where applicable. Key areas to check: login success handler, logout success handler, `PublicOnlyRoute` (addressed in this spec), mutation `onSuccess` callbacks, and any component that programmatically navigates after a user action.

**Unknown: Admin-specific content strings**
The admin layout header/nav needs text labels (e.g., "Admin Portal", "Dashboard", "Logout"). These should be added to the existing `content/appContent.json` under an admin navigation section, consistent with how `content.navigation` works for the user sidebar.

## Notes

- This spec builds on the recently implemented admin access control spec (`_plan/admin-access-control.md`). That spec created `AdminRoute` and removed self-guarding from `AdminDashboard`. This spec extends that work by adding full portal separation.

- **Shared pages (accessible by both roles and unauthenticated users):**
  - `/` — Home / landing
  - `/login` — Login
  - `/register` — Register
  - `/about` — About
  - `/privacy` — Privacy policy
  - `/terms` — Terms of service
  - `/contact` — Contact
  - Logout is a shared action (triggered from both portals' nav), not a page

- **Profile / settings are NOT shared.** `/profile` is a user-only page (pregnancy profile, user details). It is routed inside the user branch (`UserOnlyRoute` → `AppLayout` → `OnboardingGuard`). If admins need a profile or settings page in the future, it should be created as a separate admin-specific page under the admin route branch.

- The `OnboardingGuard` does not need modification. Admins are routed through `AdminRoute` → `AdminLayout`, which never includes `OnboardingGuard`. The guard only runs in the user branch.
- The `Header` component (which renders the user `Sidebar`) does not need modification. It is only rendered inside `AppLayout`, which is only used in the user branch. Admins never reach `AppLayout`.
- Backend API routes remain general authenticated-user endpoints. This spec enforces role separation at the client level. If stricter backend user-only enforcement is needed later, that should be a separate follow-up audit.
- The `Footer` component can be omitted from `AdminLayout` or included with `variant="app"` — this is a design choice, not a functional requirement.
