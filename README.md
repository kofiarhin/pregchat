# PregChat

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](#) [![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](#) [![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](#) [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

PregChat is a MERN-based pregnancy wellness companion that combines Groq-powered chat guidance, daily fetal development updates, journaling, commerce, and midwife appointment scheduling in one secure experience.

## 📸 Screenshots & Media
Add UI captures under `docs/` (for example, `docs/dashboard.png`) and embed them here:

```markdown
![Dashboard](docs/dashboard.png)
```

## ✨ Features
- **AI chat coach** – Authenticated users converse with Aya, a Groq-backed assistant that enriches prompts with pregnancy context and applies safety guardrails.【F:client/src/components/ChatBox/ChatBox.jsx†L27-L215】【F:server/controllers/chatController.js†L7-L91】
- **Daily pregnancy insights** – React Query hooks fetch day-specific updates, baby imagery, and profile-driven content from Express endpoints.【F:client/src/features/pregnancy/hooks/usePregnancy.js†L1-L64】【F:server/routes/updatesRoutes.js†L1-L18】
- **Midwife marketplace** – Browse midwives, check availability in London time, and create or cancel appointments with conflict detection.【F:client/src/pages/AppointmentMidwife.jsx†L1-L270】【F:server/controllers/appointmentController.js†L1-L200】
- **Personal journals** – CRUD journals scoped to the authenticated user with server-side validation and ownership checks.【F:client/src/pages/JournalDetail.jsx†L1-L131】【F:server/controllers/journalController.js†L1-L200】
- **Pregnancy store** – React storefront backed by MongoDB items with detail pages and cart context.【F:client/src/pages/Store/Store.jsx†L1-L143】【F:server/controllers/storeController.js†L1-L36】
- **Profile onboarding** – Guided onboarding flow persists pregnancy profile and household details via secure APIs.【F:client/src/pages/Onboarding/Onboarding.jsx†L1-L209】【F:server/routes/onboarding.routes.js†L1-L12】

## 🧰 Tech Stack
### Frontend
- React 18 with Vite toolchain and JSX arrow-function components.【F:client/src/App.jsx†L1-L109】
- React Router v6 for routing and protected routes.【F:client/src/App.jsx†L40-L109】
- React Query + custom hooks for server state and caching.【F:client/src/features/chats/hooks/useChatsQuery.js†L1-L39】
- Redux Toolkit slice for auth token persistence and UI state.【F:client/src/store/ui/uiSlice.js†L1-L121】
- SCSS Modules for component-scoped styling (legacy global styles will be migrated).【F:client/src/pages/AppointmentBrowse.styles.module.scss†L1-L20】

### Backend
- Express server with CommonJS modules and wildcard CORS.【F:server/app.js†L1-L49】【F:server/server.js†L1-L25】
- MongoDB via Mongoose models for users, conversations, content, journals, midwives, and appointments.【F:server/models/User.js†L1-L82】【F:server/models/Appointment.js†L1-L93】
- Groq SDK for LLM chat completion and huggingface image service for baby renders.【F:server/config/ai.js†L1-L110】【F:server/services/hfGenerate.js†L1-L33】
- Rate limiting, JWT auth, and centralized error handling middleware.【F:server/app.js†L19-L47】【F:server/middleware/auth.js†L1-L26】【F:server/middleware/error.js†L1-L30】

## 🏗️ Architecture Overview
```
pregchat/
├── client/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── content/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   └── server.js
├── package.json
├── .env.example
└── README.md
```

### Data Flow
1. The Vite client reads copy from `client/src/content/appContent.json`, manages auth state via Redux, and fetches resources with React Query.
2. API calls route through `client/src/api/http.js`, which attaches bearer tokens and retries transient failures before hitting Express.【F:client/src/api/http.js†L1-L87】
3. Express routes authenticate requests (where required), delegate to controllers, and persist data with Mongoose models.【F:server/routes/chatRoutes.js†L1-L24】【F:server/controllers/chatController.js†L7-L91】
4. Responses hydrate React Query caches to keep chat, appointments, store, and journals consistent across views.【F:client/src/features/messages/hooks/useSendMessageMutation.js†L249-L337】

## ⚡ Quick Start
### 1. Prerequisites
- Node.js 20.x (see `package.json` engines).【F:package.json†L37-L39】
- npm 9+ (ships with Node 20).
- Running MongoDB instance (local or remote).

### 2. Clone & Install
```bash
git clone https://github.com/kofiarhin/pregchat.git
cd pregchat

# root dependencies (Express utilities, shared tooling)
npm install

# backend dependencies
cd server
npm install
cd ..

# frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Variables
Copy `.env.example` to `.env` and adjust values. Only configure keys that the code consumes.

```env
# server
PORT=5001
MONGO_URI=mongodb://localhost:27017/pregchat
JWT_SECRET=change_me
GROQ_API_KEY=change_me
GROQ_MODEL=llama-3.1-8b-instant
CHAT_MAX_TOKENS=1024
AI_SIGN_OFF=true
HUGGING_FACE_API_KEY=
REGION=UK

# client
VITE_API_BASE=http://localhost:5001
```

### 4. Useful Scripts
| Location | Command | Description |
| --- | --- | --- |
| root | `npm run dev` | Start server (nodemon) and client (Vite on port 5000) concurrently.【F:package.json†L7-L13】 |
| root | `npm run start:server` | Run the Express API with nodemon for local development.【F:package.json†L9-L10】 |
| root | `npm run start:client` | Run the Vite dev server on port 5000.【F:package.json†L10-L11】 |
| root | `npm start` | Launch the Express server in production mode (no client).【F:package.json†L7-L8】 |
| root | `npm run test:server` | Execute Jest + Supertest against `/server`.【F:package.json†L11-L12】 |
| root | `npm run test:client` | Execute Vitest against `/client`.【F:package.json†L12-L13】 |
| root | `npm run test:unit` / `npm run test:integration` | Targeted backend Jest suites.【F:package.json†L13-L15】 |
| root | `npm run e2e` | Run end-to-end Jest config (`jest.e2e.config.js`).【F:package.json†L15-L16】 |
| client | `npm run dev` | Start Vite dev server (port 5000).【F:client/package.json†L6-L9】 |
| client | `npm run build` | Create production bundle in `client/dist`.【F:client/package.json†L6-L10】 |
| client | `npm run preview` | Preview the built bundle locally.【F:client/package.json†L6-L10】 |
| client | `npm test` | Run Vitest in watch or CI mode.【F:client/package.json†L6-L10】 |
| server | `npm run dev` | Nodemon hot-reload for the Express server.【F:server/package.json†L7-L10】 |
| server | `npm test` | Run server Jest suite from `/server`.【F:server/package.json†L7-L10】 |

### 5. Run Locally
```bash
# from repo root with .env configured
npm run dev
```
The client runs on `http://localhost:5000` and proxies API calls to `http://localhost:5001` (configure `PORT` and `VITE_API_BASE` if you choose different ports).

## ✅ Testing
- `npm run test:client` – runs Vitest against the React app from the repository root.【F:package.json†L12-L13】
- `npm run test:server` – runs Jest + Supertest suites under `server/tests`.【F:package.json†L11-L12】
- `npm run e2e` – executes the full-stack Jest end-to-end scenarios defined at the repo root.【F:package.json†L15-L16】

## 🏗️ Build & Production
- Frontend: `npm --prefix client run build` outputs static assets to `client/dist`. Deploy that folder to Vercel or any static host.【F:client/package.json†L6-L10】
- Backend: `npm start` (root) or `npm --prefix server start` boots Express after environment setup. Ensure MongoDB and Groq/HuggingFace keys are configured.【F:package.json†L7-L8】【F:server/server.js†L1-L25】

## 🚀 Deployment Playbook
### Vercel (Frontend)
1. Import the repo into Vercel and select the `client` directory as the project root.
2. Set build command to `npm run build` and output directory to `dist`.
3. Provide environment variables prefixed with `VITE_` (e.g., `VITE_API_BASE=https://your-api.onrender.com`).
4. Trigger a deployment; Vercel serves the generated static bundle.

### Render or Heroku (Backend)
1. Provision a Node service and connect to this repo.
2. Install dependencies (`npm install && npm --prefix server install` in build steps or use a monorepo script).
3. Set environment variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `GROQ_API_KEY`, etc.).
4. Use `npm start` as the start command (Heroku will pick up `Procfile` if configured).【F:Procfile†L1-L1】
5. Ensure MongoDB and any AI providers are reachable from the platform.

## 🔌 API Reference
Replace `<API_BASE>` with your server origin (e.g., `http://localhost:5001`). Authenticated routes require `Authorization: Bearer <token>`.

### Auth
```bash
curl -X POST "<API_BASE>/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"secret123","region":"UK"}'

curl -X POST "<API_BASE>/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123"}'

curl -X GET "<API_BASE>/auth/me" \
  -H "Authorization: Bearer <token>"
```

### Chat
```bash
curl -X GET "<API_BASE>/chat/conversations" \
  -H "Authorization: Bearer <token>"

curl -X POST "<API_BASE>/chat/ask" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"<id>","message":"How is baby doing today?"}'
```

### Pregnancy Updates & Profile
```bash
curl -X GET "<API_BASE>/updates/today" \
  -H "Authorization: Bearer <token>"

curl -X GET "<API_BASE>/updates/100" \
  -H "Authorization: Bearer <token>"

curl -X PUT "<API_BASE>/updates/profile" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"lmpDate":"2024-01-01","dueDate":"2024-10-07","weeks":10,"days":3}'
```

### Admin Content
```bash
curl -X POST "<API_BASE>/admin/content" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"day":100,"babyUpdate":"...","momUpdate":"..."}'
```

### Onboarding
```bash
curl -X GET "<API_BASE>/api/onboarding/me" \
  -H "Authorization: Bearer <token>"

curl -X POST "<API_BASE>/api/onboarding/me" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"occupation":"Designer","supportCircle":["Partner"]}'
```

### Chat History
```bash
curl -X DELETE "<API_BASE>/api/messages/<userId>" \
  -H "Authorization: Bearer <token>"
```

### Store
```bash
curl -X GET "<API_BASE>/api/store"

curl -X GET "<API_BASE>/api/store/<itemId>"

curl -X POST "<API_BASE>/api/store" \
  -H "Content-Type: application/json" \
  -d '{"name":"Prenatal Vitamins","price":19.99,"stock":10}'
```

### Midwives & Appointments
```bash
curl -X GET "<API_BASE>/api/midwives"

curl -X GET "<API_BASE>/api/midwives/<midwifeId>"

curl -X POST "<API_BASE>/api/appointments/availability" \
  -H "Content-Type: application/json" \
  -d '{"midwifeId":"<midwifeId>","fromISO":"2024-07-01T09:00:00.000Z","toISO":"2024-07-02T09:00:00.000Z"}'

curl -X GET "<API_BASE>/api/appointments/my" \
  -H "Authorization: Bearer <token>"

curl -X POST "<API_BASE>/api/appointments" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","midwifeId":"<midwifeId>","startISO":"2024-07-01T10:00:00.000Z"}'

curl -X DELETE "<API_BASE>/api/appointments/<appointmentId>"
```

### Journals
```bash
curl -X GET "<API_BASE>/api/journals?userId=<userId>"

curl -X GET "<API_BASE>/api/journals/<journalId>?userId=<userId>"

curl -X POST "<API_BASE>/api/journals" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","title":"Entry","content":"Feeling great!"}'

curl -X PUT "<API_BASE>/api/journals/<journalId>" \
  -H "Content-Type: application/json" \
  -d '{"userId":"<userId>","title":"Updated","content":"Still feeling great"}'

curl -X DELETE "<API_BASE>/api/journals/<journalId>?userId=<userId>"
```

### Names & Baby Image
```bash
curl -X GET "<API_BASE>/api/names"

curl -X GET "<API_BASE>/api/baby-image/today" \
  -H "Authorization: Bearer <token>"
```

### Health
```bash
curl -X GET "<API_BASE>/health"
```

## 🤝 Contributing
1. Create a feature branch following `feature/<scope>` naming.
2. Adhere to the coding standards in [AGENTS.md](AGENTS.md) (JavaScript only, arrow functions, SCSS modules, CommonJS backend).
3. Keep commits scoped and use the `<type>: <summary>` convention.
4. Run `npm run test:client` and `npm run test:server` before opening a PR.
5. Submit a focused PR with context, screenshots (for UI), and updated docs where needed.

## 📄 License
This project is released under the ISC License (see `package.json`).【F:package.json†L3-L35】

## 🛠️ Troubleshooting
- **Port conflicts** – Set `PORT` to `5001` (or another open port) in `.env` so the API and Vite dev server do not clash.【F:.env.example†L1-L13】【F:package.json†L9-L11】
- **CORS errors** – Ensure the frontend points to the correct API origin via `VITE_API_BASE`; the server defaults to wildcard CORS but incorrect origins will still fail auth.【F:client/src/constants/baseUrl.js†L1-L4】【F:server/app.js†L1-L28】
- **Environment not loading** – Confirm `.env` is at the repo root and that `dotenv` loads before server start (see `server/server.js`). Missing `MONGO_URI` or `GROQ_API_KEY` will crash startup.【F:server/server.js†L1-L25】【F:server/config/db.js†L1-L17】
- **MongoDB connection issues** – Verify the database URI and that MongoDB is reachable; connection failures exit the process with a descriptive error.【F:server/config/db.js†L1-L17】

Run into something else? Open an issue with logs and reproduction steps so we can harden PregChat.
