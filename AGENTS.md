# AGENTS.md — DevKofi Coding Guidelines

## Principles

- Precision over fluff. Production-grade code only (no placeholders).
- JavaScript ONLY (no TypeScript).
- Arrow functions ONLY (components, hooks, services, controllers, utils).
- Components must be default exports.
- Small, focused PRs. Use feature branches. Never push directly to main.

## Stack & Structure

- MERN stack.
- Monorepo layout: `client/` and `server/` at the project root. Root `package.json` exists.
- Backend uses **CommonJS** and strict **MVC** inside `/server`:
  - `/server/server.js` = app entry (no `src/` folder).
  - `/server/models`, `/server/controllers`, `/server/routes`, `/server/utils` as needed.
- Frontend uses Vite + React in `/client`.

## Frontend Rules

- Styling: **SCSS Modules** per component named `<Component>.styles.scss`.
- Import the component’s SCSS at the component root.
- No Tailwind. No UI frameworks unless explicitly requested later.
- State: **React Query + custom hooks** for server state.
- Content: Must be driven from a single JSON source file; no hard-coded page text. Each page/section reads from its section in the JSON.
- Vite dev server runs on **port 5000**.
- Include `/client/src/constants/` with a `BASE_URL` constant that points to `http://localhost:5000` for development.

## Backend Rules

- Node.js + Express + MongoDB. **CommonJS** modules.
- No `src/` directory. All inside `/server`.
- Use `cors` with wildcard origin (for now).
- Do NOT include Helmet or Morgan **by default**.
- Environment variables come from `.env`. Never hard-code secrets.
- Provide a `start` script at the root that starts the server (`node server/server.js` or equivalent).

## Testing

- **Server tests (only in /server)**: Jest + Supertest.
- **Client tests (only in /client)**: Vitest (jsdom environment).
- Ensure test configurations never bleed across client/server.

## Tooling & Scripts (root package.json)

- Must exist in repo root.
- Scripts:
  - `"start"`: starts backend directly from `/server`.
  - `"dev"`: uses `concurrently` to run **both** client (Vite) and server.
  - `"test"`: runs **server** tests with Jest only (watch or CI modes as appropriate).
- Optionally add `"dev:client"` and `"dev:server"` to run each side.

## CORS & Networking

- CORS: wildcard during development.
- Keep network/credential scope minimal. Use `.env`.

## Git Hygiene

- `.gitignore` must ignore: `node_modules`, `.env`, `notes.txt`.
- Branching: feature branches only. Protected main.

## Deployment (context)

- Typical targets: Vercel (client), Render/Heroku (server). Prepare for these but don’t add platform-specific files unless asked.

## Enforcement

- If a requested change conflicts with these rules, explain the conflict and follow AGENTS.md.
- Prefer meaningful filenames, cohesive modules, and consistent exports/imports.
