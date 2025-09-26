# PregChat Agent Playbook

## Purpose & Scope for AI Assistants
- Agents exist to execute clearly scoped tasks inside this repo. Never broaden the scope or invent extra features.
- Only touch files explicitly requested by the user or required to keep the build/tests passing. Leave unrelated code, assets, and configuration untouched.
- When updating generated files (e.g., `package-lock.json`), do so only if the change is a direct result of the requested work.

## Branching, Commits, and PR Discipline
- Work on feature branches named `feature/<ticket-or-scope>` (e.g., `feature/chat-loading-state`).
- Commit messages follow `<type>: <imperative summary>` where `type` is one of `feat`, `fix`, `docs`, `refactor`, `test`, or `chore` (example: `docs: update onboarding guide`).
- Every PR must reference the related issue (if any) in the description and link to screenshots for UI changes.
- Squash merge only. Do not rewrite history on shared branches.

## Code Conventions (Non-Negotiable)
### Language & Syntax
- JavaScript only across the stack. No TypeScript, CoffeeScript, or transpiled alternatives.
- Arrow functions everywhere (React components, hooks, controllers, services, utils). Prefer explicit `const name = () => {}` definitions.
- Default exports for React components; named exports for hooks, utilities, and constants.

### Frontend (client/)
- Framework: React + Vite. Keep components colocated with their styles and tests.
- Styling: SCSS Modules named `ComponentName.styles.scss`; import them locally (`import styles from "./ComponentName.styles.scss";`). Legacy global styles may exist, but new work must use modules.
- Routing: `react-router-dom` v6+. Keep route elements lazy-loaded when screens grow.
- State: Use React Query for server state and colocated custom hooks to wrap query/mutation logic. Redux Toolkit is reserved for UI-only state that must persist across views.
- Content: Pull copy from `client/src/content/appContent.json` instead of hard-coding strings.

### Backend (server/)
- Runtime: Node.js (CommonJS). No ESM modules.
- Structure: strict MVC under `/server` (`controllers/`, `models/`, `routes/`, `services/`, `utils/`). Add feature folders if needed, but keep routing thin and controllers focused on orchestration.
- Config: Load environment variables via `.env`. Never default secrets in code.
- HTTP: Express with wildcard CORS via `cors({ origin: "*", credentials: true })`. Helmet is optional—only add when explicitly required.
- Persistence: MongoDB via Mongoose models. Reuse existing connection helper `server/config/db.js`.

## File & Folder Expectations
- `client/src/components` for shared UI, `client/src/pages` for route views, `client/src/features` for domain-specific hooks/services.
- `ComponentName.styles.scss` lives beside the component. Tests live beside the unit they validate (e.g., `ComponentName.test.jsx`).
- Shared constants live in `client/src/constants/` and `server/utils/constants.js` (create if missing rather than scattering magic strings).
- Asset pipeline: serve generated assets from `server/storage/` through `/static`. Keep CDN-ready artefacts immutable.

## React Patterns & UX Rules
- Each component renders explicit loading and error states when consuming async data. Use skeletons/spinners from shared components where available.
- Encapsulate data fetching in hooks under `client/src/features/**/hooks`. Hooks should return `{ data, isLoading, isError, error, ... }` from React Query.
- Optimistic UI updates must roll back on failure (see `useSendMessageMutation` for reference).
- Keep components lean: UI-only components stay stateless; delegate side-effects to hooks/services.

## Testing Policy
- Backend: Jest + Supertest. Place unit tests in `server/tests/unit` and integration tests in `server/tests/integration`. Run with `npm run test:server` from the repo root.
- Frontend: Vitest + Testing Library. Store specs beside the component (`*.test.jsx`) or in `client/src/__tests__`. Run with `npm run test:client` from the repo root or `npm test` inside `/client`.
- End-to-end: Jest E2E config lives at `jest.e2e.config.js`; only touch when explicitly asked.
- Always update or add tests that cover new behaviours. Never leave failing tests—fix or remove the change.

## Security, Secrets, and Environment Handling
- `.env` stays uncommitted. Use `.env.example` to document required variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, `GROQ_MODEL`, `CHAT_MAX_TOKENS`, `AI_SIGN_OFF`, `HUGGING_FACE_API_KEY`, `REGION`, `VITE_API_BASE`).
- Regenerate tokens/keys before sharing logs. Do not echo secrets in terminal output.
- `.gitignore` must cover `node_modules/`, `.env*`, build artefacts, and scratch pads (e.g., `notes.txt`).

## React Query Usage Pattern
1. Define query keys in `client/src/features/<domain>/queryKeys.js`.
2. Implement fetchers/mutations in dedicated hooks with early returns on invalid params.
3. Provide loading, empty, and error UI states in consuming components.
4. Cache writes: update or invalidate queries inside `onSuccess` to keep the UI consistent.

## CI/CD Expectations
- GitHub Actions pipeline should (at minimum) install dependencies, run `npm run test:server`, run `npm run test:client`, and build the client (`npm --prefix client run build`). Add linting once rules exist.
- Block merges on failing pipelines. Keep workflows fast (<10 minutes) by caching `node_modules`.

## Pull Request Review Checklist
- [ ] Scope limited to the issue / request.
- [ ] All relevant tests (`test:server`, `test:client`, and affected unit specs) pass locally.
- [ ] Docs updated (README, ADRs, or inline comments) when behaviour changes.
- [ ] Screenshots or Loom linked for UI tweaks.
- [ ] Environment variables documented or updated in `.env.example` when new ones are introduced.

## Do & Don't for Agents
**Do**
- Answer exactly what the user asked for.
- Run and report the required commands before delivering work.
- Use existing patterns (React Query hooks, SCSS modules, CommonJS controllers).
- Create focused commits that mirror the requested change.

**Don't**
- Introduce new technologies (TypeScript, Tailwind, alternative state managers).
- Modify unrelated files, formatting, or dependencies without explicit instruction.
- Add try/catch around imports or convert modules to default exports unless required by the task.
- Fabricate endpoints, scripts, or features that do not exist in the codebase.

Follow this playbook to keep PregChat consistent, testable, and production-ready.
