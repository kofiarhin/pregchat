# Auth Flow Refactor

## Summary

Refactor the login, register, and routing guards so that post-auth navigation is driven by `user.onboardingCompletedAt` rather than hardcoded paths. Authenticated users visiting public-only routes are redirected to `/onboarding` or `/dashboard` based on their onboarding state. All protected app pages require both authentication and completed onboarding, except `/onboarding` itself. A second `onboardingCompletedAt` write on the backend is removed to eliminate a redundant side-effect.

**Product rule:** Onboarding is required only when a user's pregnancy details have not yet been saved. A user is considered onboarding-complete the moment valid pregnancy date data exists in the system. User preference details (baby gender, update frequency, health notes, etc.) are optional and do not gate dashboard access. `PUT /updates/profile` in `updatesController.js` is the correct and only place where `onboardingCompletedAt` should be set, because it is the endpoint that persists the pregnancy date — the one required piece of data.

## Goal

- Login and register redirect to the correct destination based on whether the user's pregnancy details exist.
- A user is onboarding-complete when `User.onboardingCompletedAt` is set, which happens exclusively when pregnancy date data is successfully saved via `PUT /updates/profile`.
- User preference details (step 1 of the onboarding flow) are optional and do not affect onboarding completion or dashboard access.
- Authenticated users who visit `/login` or `/register` are bounced to `/onboarding` if pregnancy details are missing, `/dashboard` if they are present — never unconditionally to `/dashboard`.
- No protected app page is reachable by a user whose pregnancy details have not been saved.
- `/onboarding` is not reachable by a user who has already provided pregnancy details.
- Loading states during the `currentUser` fetch do not cause route flashes.

## Problem Statement

- `Login.jsx` hardcodes `navigate("/dashboard")` on success. A user with incomplete onboarding is sent to `/dashboard`, then bounced again to `/onboarding` by `OnboardingGuard` — two redirects instead of one.
- `PublicOnlyRoute.jsx` always redirects authenticated users to `/dashboard`, ignoring onboarding state.
- `OnboardingGuard.jsx` returns `null` while `currentUser` is loading, producing a blank-page flash.
- `OnboardingGuard.jsx` does not block a completed-onboarding user from re-visiting `/onboarding`.
- `updatesController.js` sets `onboardingCompletedAt` at pregnancy date submission (step 0 of 3). `onboarding.controller.js` sets it again at step 1. Two write points for one flag create confusion and make the trigger hard to reason about.

## User Stories

- As a user returning after not finishing onboarding, I want login to take me straight to `/onboarding` so I can continue from where I left off.
- As a user who has completed onboarding, I want login to take me straight to `/dashboard`.
- As a logged-in user who accidentally visits `/login`, I want to be redirected to the correct destination without seeing the login form.
- As a user who has completed onboarding, I want visiting `/onboarding` to redirect me to `/dashboard` so I cannot accidentally re-run setup.

## Scope

### In Scope

- `Login.jsx` — onboarding-aware post-login redirect.
- `Register.jsx` — consistent post-register redirect (always `/onboarding` for new users, but driven by user state not hardcoded string).
- `PublicOnlyRoute.jsx` — onboarding-aware redirect for already-authenticated visitors.
- `OnboardingGuard.jsx` — loading state + reverse guard.
- `Onboarding.jsx` — ensure `authKeys.user()` cache is invalidated before final navigate.
- `server/controllers/onboarding.controller.js` — remove the redundant `onboardingCompletedAt` write.

### Out of Scope

- Changing what "onboarding complete" means. The product rule is confirmed: pregnancy details saved = onboarding complete. `User.onboardingCompletedAt` written in `updatesController.js:updateProfile` is the single, correct source of truth. No other endpoint should write this field.
- Gating dashboard access on user preferences (step 1 data). These are optional and not a completion requirement.
- Changes to the onboarding steps themselves or their order.
- Deleting legacy models (`Profile`, `UserDetails`) — tracked separately in the audit.
- Changes to `ProtectedRoute.jsx` — its responsibility (auth-only check) remains correct.

## UX/UI Requirements

- No visible behaviour change for users who have completed onboarding — they log in and land on `/dashboard` as before.
- Users with incomplete onboarding see a single redirect to `/onboarding`, not two.
- During the async gap while `currentUser` is loading (token exists, user not yet fetched), public-only routes render a neutral loading state rather than the login/register form.
- `OnboardingGuard`-protected pages render a loading state rather than blank white while `currentUser` resolves.

## Frontend Requirements

### `client/src/pages/Login.jsx`

Change `onSuccess` callback from:
```
onSuccess: () => navigate("/dashboard", { replace: true })
```
To: read `user.onboardingCompletedAt` from the mutation result (already present in `useLoginMutation`'s `onSuccess: ({ user })`) and navigate to `/onboarding` if falsy, `/dashboard` if truthy.

The `useLoginMutation` hook already receives `{ user }` in `onSuccess` — the `user` object comes from `buildUserResponse` on the server which includes `onboardingCompletedAt`. No hook changes needed.

### `client/src/pages/Register.jsx`

Change `onSuccess` callback from:
```
onSuccess: () => navigate("/onboarding", { replace: true })
```
To: same pattern as Login — read `user.onboardingCompletedAt`. For a brand-new registration `onboardingCompletedAt` will always be `null`, so in practice this always navigates to `/onboarding`. The change makes the logic explicit and consistent with Login.

### `client/src/routes/PublicOnlyRoute.jsx`

Current signature: `({ isAuthenticated, redirectTo = "/dashboard" })`.

Required changes:
- Accept a `currentUser` prop (passed from `App.jsx` where `useCurrentUserQuery` already runs).
- When `token` exists but `currentUser` is still `undefined` (loading): return a loading indicator, not `<Outlet />` and not a redirect. This prevents the login/register form from flashing for authenticated users.
- When `currentUser` is loaded and authenticated: redirect to `/onboarding` if `!currentUser.onboardingCompletedAt`, redirect to `/dashboard` if `currentUser.onboardingCompletedAt` is set.
- When not authenticated: render `<Outlet />` as today.

The `isAuthenticated` prop can be kept for the not-authenticated branch, or derived from `currentUser` presence. Prefer using `currentUser` directly to avoid a second derivation.

### `client/src/App.jsx`

`currentUser` is already derived here via `useCurrentUserQuery`. Pass it down to `PublicOnlyRoute` as a prop.

The existing pattern:
```jsx
<PublicOnlyRoute isAuthenticated={isAuthenticated} redirectTo="/dashboard" />
```
Becomes:
```jsx
<PublicOnlyRoute isAuthenticated={isAuthenticated} currentUser={currentUser} />
```
Remove the now-unused `redirectTo` prop.

No structural changes to the route tree are needed. `/onboarding` remains inside `ProtectedRoute` but outside `OnboardingGuard` — this is correct and stays.

### `client/src/routes/OnboardingGuard.jsx`

Three changes:

1. **Loading state**: Replace `if (!currentUser) return null` with a visible loading state (a spinner or the same loading indicator used elsewhere in the app).

2. **Reverse guard**: After the `currentUser` is loaded, if `currentUser.onboardingCompletedAt` is set AND the current pathname is `/onboarding`, redirect to `/dashboard`. Use `useLocation` from react-router-dom to read the current path.

3. **Forward guard**: The existing `if (!currentUser.onboardingCompletedAt) return <Navigate to="/onboarding" />` stays unchanged.

### `client/src/pages/Onboarding.jsx`

`handleFinish` (step 2 "Go to my dashboard" button, line 66):
```js
const handleFinish = () => {
  navigate("/dashboard", { replace: true });
};
```
Add `queryClient.invalidateQueries({ queryKey: authKeys.user() })` before the navigate call, so the React Query cache for the current user is refreshed. Without this, the stale `currentUser` in cache still has `onboardingCompletedAt: null` until the 5-minute stale window expires, which means `OnboardingGuard` would immediately send the user back to `/onboarding` on the next navigation.

`authKeys` is already imported in `Onboarding.jsx`. `queryClient` is already available via `useQueryClient()`.

## Backend Requirements

### `server/controllers/onboarding.controller.js`

Remove the `onboardingCompletedAt` write block from `upsertMyDetails` (currently lines 69–72):

```js
if (!req.user.onboardingCompletedAt) {
  req.user.onboardingCompletedAt = new Date();
  await req.user.save();
}
```

This block must be deleted. `upsertMyDetails` persists user preferences (step 1 — baby gender, update frequency, health notes). These are optional fields and do not constitute the completion condition. Writing `onboardingCompletedAt` here was incorrect from a product standpoint: a user could skip step 1 entirely and still be fully onboarded.

### `server/controllers/updatesController.js`

No changes required. The existing write in `updateProfile`:

```js
if (!req.user.onboardingCompletedAt) {
  req.user.onboardingCompletedAt = new Date();
  await req.user.save();
}
```

This is confirmed correct. `updateProfile` handles `PUT /updates/profile`, which saves the pregnancy date — the only required piece of onboarding data. This is the right place and the right trigger. It stays exactly as-is.

No other backend changes are required for this refactor.

## Data Model Changes

None. `User.onboardingCompletedAt` already exists and is already set by `updatesController.js`. No schema changes needed.

## API Changes

None. `GET /auth/me` already returns `onboardingCompletedAt` via `buildUserResponse`. `POST /auth/login` and `POST /auth/register` both return `user` with `onboardingCompletedAt` included. No endpoint changes needed.

## Validation Rules

- Post-login destination: if `user.onboardingCompletedAt` is truthy → `/dashboard`; if falsy → `/onboarding`.
- Post-register destination: same rule (always `/onboarding` in practice for new users).
- Authenticated user on `/login` or `/register`: if `currentUser` loading → show loading state; if `currentUser.onboardingCompletedAt` set → `/dashboard`; if not set → `/onboarding`.
- Authenticated user on `/onboarding` with `onboardingCompletedAt` set → `/dashboard`.
- Authenticated user on any guarded page without `onboardingCompletedAt` → `/onboarding` (existing behaviour, unchanged).

## Edge Cases

- **Token exists, currentUser still fetching** (`PublicOnlyRoute`): render loading state. Do not show login/register form. Do not redirect yet.
- **Token exists, `/auth/me` returns 401** (expired/revoked token): `useCurrentUserQuery` already handles this — it dispatches `clearAuthToken()` and clears localStorage on 401. After clearing, `isAuthenticated` becomes false and `PublicOnlyRoute` renders the public page normally.
- **User completes onboarding then navigates back to `/onboarding` via browser Back**: `OnboardingGuard` reverse guard catches this and redirects to `/dashboard`.
- **`queryClient.invalidateQueries` in `handleFinish` fails silently**: if the background refetch fails, the stale cached user (with `onboardingCompletedAt: null`) would still trigger a redirect back to `/onboarding`. This is extremely unlikely in normal conditions but can be guarded against by also calling `queryClient.setQueryData(authKeys.user(), (prev) => ({ ...prev, onboardingCompletedAt: new Date().toISOString() }))` optimistically before navigating — this is a safe enhancement but not strictly required.
- **Register with an already-registered email**: server returns 400 before the user is authenticated. No redirect occurs. Existing error display in `Register.jsx` handles this.

## Security / Authorization

- All redirect decisions are made client-side based on `user.onboardingCompletedAt` from `GET /auth/me`. The server value is authoritative — the client does not infer or compute onboarding state.
- The existing server-side `requireAuth` middleware on all protected routes is not changed. This spec only touches client-side routing logic and one backend side-effect removal.
- Removing the `onboardingCompletedAt` write from `onboarding.controller.js` does not introduce any auth weakness — it only removes a redundant write.

## Testing Requirements

### Frontend

- `Login.jsx`: user with `onboardingCompletedAt: null` → navigates to `/onboarding` on success.
- `Login.jsx`: user with `onboardingCompletedAt` set → navigates to `/dashboard` on success.
- `Register.jsx`: new user response always has `onboardingCompletedAt: null` → navigates to `/onboarding`.
- `PublicOnlyRoute`: renders loading state when `token` present but `currentUser` undefined.
- `PublicOnlyRoute`: redirects to `/onboarding` when authenticated + no `onboardingCompletedAt`.
- `PublicOnlyRoute`: redirects to `/dashboard` when authenticated + `onboardingCompletedAt` set.
- `PublicOnlyRoute`: renders `<Outlet />` when not authenticated.
- `OnboardingGuard`: redirects to `/dashboard` when `currentUser.onboardingCompletedAt` set and path is `/onboarding`.
- `OnboardingGuard`: renders loading state when `currentUser` is undefined.
- `Onboarding.jsx`: `handleFinish` calls `queryClient.invalidateQueries` before navigating.

### Backend

- `POST /api/onboarding/me`: verify `onboardingCompletedAt` is NOT written to the user document after this call.
- `PUT /updates/profile`: verify `onboardingCompletedAt` IS written to the user document on first call (existing behaviour, regression test).

## File Impact

### Files Confirmed To Exist

- `client/src/pages/Login.jsx`
- `client/src/pages/Register.jsx`
- `client/src/routes/PublicOnlyRoute.jsx`
- `client/src/routes/OnboardingGuard.jsx`
- `client/src/pages/Onboarding/Onboarding.jsx`
- `client/src/App.jsx`
- `server/controllers/onboarding.controller.js`
- `client/src/features/auth/queryKeys.js` (exports `authKeys`)
- `client/src/features/auth/hooks/useAuth.js` (exports `useLoginMutation`, `useRegisterMutation`, `useCurrentUserQuery`)

### Files To Create

None. This refactor only modifies existing files.

### Files To Update

- `client/src/pages/Login.jsx` — change `onSuccess` to navigate based on `user.onboardingCompletedAt`.
- `client/src/pages/Register.jsx` — change `onSuccess` to navigate based on `user.onboardingCompletedAt`.
- `client/src/routes/PublicOnlyRoute.jsx` — accept `currentUser` prop; add loading state; add onboarding-aware redirect logic.
- `client/src/routes/OnboardingGuard.jsx` — replace `return null` with loading state; add reverse guard for completed users on `/onboarding`.
- `client/src/pages/Onboarding/Onboarding.jsx` — add `queryClient.invalidateQueries({ queryKey: authKeys.user() })` in `handleFinish` before `navigate`.
- `client/src/App.jsx` — pass `currentUser` prop to `PublicOnlyRoute`.
- `server/controllers/onboarding.controller.js` — remove `onboardingCompletedAt` write block from `upsertMyDetails`.

## Step-by-Step Implementation Plan

1. **Backend first — remove the redundant write**: Delete the `onboardingCompletedAt` block (lines 69–72) from `server/controllers/onboarding.controller.js`. Verify `PUT /updates/profile` still sets the flag correctly by checking `updatesController.js`. Run server tests.

2. **`Login.jsx`**: Update `onSuccess` to use `user.onboardingCompletedAt` to determine destination. Test with a user who has `onboardingCompletedAt: null` and one who has it set.

3. **`Register.jsx`**: Same pattern as Login. For new users this always resolves to `/onboarding`.

4. **`App.jsx`**: Pass `currentUser` to `PublicOnlyRoute` as a prop.

5. **`PublicOnlyRoute.jsx`**: Rewrite to handle three states — loading, authenticated (with onboarding branch), not authenticated. Remove the `redirectTo` default prop.

6. **`OnboardingGuard.jsx`**: Add loading state in place of `return null`. Add `useLocation` check — if `onboardingCompletedAt` is set and path includes `/onboarding`, redirect to `/dashboard`.

7. **`Onboarding.jsx` `handleFinish`**: Add `queryClient.invalidateQueries({ queryKey: authKeys.user() })` before `navigate("/dashboard", { replace: true })`.

8. **Manual smoke test**: Register fresh user → lands at `/onboarding` ✓. Complete step 0 → `onboardingCompletedAt` set. Complete step 2 → lands at `/dashboard` ✓. Log out. Log back in → lands at `/dashboard` ✓. Log out. Clear `onboardingCompletedAt` in DB manually. Log in → lands at `/onboarding` ✓.

## Acceptance Criteria

- A user who logs in without saved pregnancy details (`onboardingCompletedAt: null`) is sent to `/onboarding` in a single redirect.
- A user who logs in with saved pregnancy details (`onboardingCompletedAt` set) is sent to `/dashboard` in a single redirect.
- An authenticated user visiting `/login` or `/register` is redirected to `/onboarding` if pregnancy details are missing, `/dashboard` if they are present — never unconditionally to `/dashboard`.
- While `currentUser` is loading, `/login` and `/register` do not flash their form content to authenticated users.
- A user whose pregnancy details are saved and who navigates to `/onboarding` is redirected to `/dashboard`.
- No protected app page is reachable by a user whose pregnancy details have not been saved.
- Saving user preferences via `POST /api/onboarding/me` does not grant dashboard access and does not write `onboardingCompletedAt`. A user who submits step 1 but has not saved pregnancy dates is still sent to `/onboarding`.
- Saving pregnancy dates via `PUT /updates/profile` sets `onboardingCompletedAt` and grants access to all protected routes.
- `PUT /updates/profile` remains the single backend location where `onboardingCompletedAt` is written.

## Risks / Unknowns

- **Loading indicator component**: `OnboardingGuard` and `PublicOnlyRoute` both need to render a loading state. There is no confirmed shared loading component in the repo. Use a minimal inline spinner or the `<div className="loading" />` pattern seen in `App.jsx` (the only confirmed loading pattern in the codebase).
- **`useLocation` in `OnboardingGuard`**: Adding a `useLocation` import pulls in a router dependency that wasn't previously in this file. This is safe — `useLocation` is part of react-router-dom which is already a dependency.
- **Stale localStorage user cache**: `useCurrentUserQuery` uses `loadStoredUser()` as `initialData` with a 5-minute stale window. If a user's `onboardingCompletedAt` was `null` in localStorage and is now set on the server, the local cache won't reflect this until the background refetch completes. The fix in step 7 (`invalidateQueries` before `handleFinish` navigate) forces a fresh fetch at the critical moment and mitigates this. No further action needed.

## Notes

- The `redirectTo` prop on `PublicOnlyRoute` is used in `App.jsx` as `redirectTo="/dashboard"`. After this refactor the prop is unused and can be removed from the component signature and the `App.jsx` JSX.
- `ProtectedRoute.jsx` is deliberately not changed. Its only job is to check `isAuthenticated`. Onboarding enforcement is entirely the responsibility of `OnboardingGuard`.
- No change is needed to `useLoginMutation` or `useRegisterMutation` in `useAuth.js`. Both already pass `{ user }` to `onSuccess`, and `user.onboardingCompletedAt` is already in the response payload from `buildUserResponse` in `authController.js`.
