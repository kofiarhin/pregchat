# PregChat
Pregnancy wellness companion that pairs Groq-powered chat guidance with scheduling, journaling, and commerce workflows in a MERN stack.

 **Live Demo:** [https://pregchat-tan.vercel.app](https://pregchat-tan.vercel.app)

## Key Features
- **Aya chat assistant** – Authenticated users chat with Aya, who enriches prompts with pregnancy day data and enforces red-flag triage before persisting messages. (/client/src/components/ChatBox/ChatBox.jsx, /server/controllers/chatController.js, /server/config/ai.js)
- **Daily insights & imagery** – Updates endpoints serve gestational tips, and the baby image service generates or reuses day-specific renders backed by Hugging Face. (/server/controllers/updatesController.js, /server/controllers/babyImageController.js)
- **Midwife scheduling** – Availability is computed in London time, with conflict checking and CRUD for appointments. (/server/controllers/appointmentController.js, /server/utils/slots.js)
- **Personal journals** – Users manage private journal entries with ownership checks and validation. (/server/controllers/journalController.js)
- **Storefront & names explorer** – Mongo-backed catalog endpoints feed the store UI and curated baby name suggestions. (/server/controllers/storeController.js, /server/controllers/namesController.js)

## Tech Stack
- **Frontend**: React 18, React Router, React Query, Redux Toolkit, SCSS modules, Vite dev server. (/client/src/main.jsx, /client/package.json)
- **Backend**: Express, Mongoose, Groq SDK, express-rate-limit, JWT auth via middleware. (/server/app.js, /server/controllers/authController.js)
- **Data**: MongoDB models for conversations, pregnancy profiles, daily content, appointments, journals, products, and flags. (/server/models/Conversation.js, /server/models/Pregnancy.js)

## Architecture Overview
```
React client (React Query, Redux)
        │  httpRequest (fetch + retries)
        ▼
Express API (app.js → controllers)
        │                      │
        │                      ├─ Groq LLM (askAya)
        ▼                      └─ HuggingFace image generation
MongoDB (Mongoose models)
```

### Core Data Models
| Model | Key Fields |
| --- | --- |
| Conversation | `userId`, `messages[{ role, content, timestamp }]`, timestamps. (/server/models/Conversation.js)
| Pregnancy | `userId`, `lmpDate`, `dueDate`, `dayIndex` with helper methods. (/server/models/Pregnancy.js)
| DailyContent | `day`, `babyUpdate`, `momUpdate`, `tips`, `assets`, `references`. (/server/models/DailyContent.js)
| Flag | `userId`, `text`, `reason` enum for red-flag logging. (/server/models/Flag.js)
| Appointment | `userId`, `midwifeId`, `start`, `end`, `status`. (/server/models/Appointment.js)
| Journal | `userId`, `title`, `content`, optional `date`. (/server/models/Journal.js)
| Item/Product | Catalog fields: `name`/`title`, `price`, `stock`/`inStock`, `slug`. (/server/models/Item.js, /server/models/product.model.js)

## Folder Structure
```
.
├── client/                # React app (Vite, SCSS modules, features/* hooks)
│   ├── src/api            # http helpers
│   ├── src/features       # Domain hooks, query keys, storage helpers
│   ├── src/pages          # Route-level views
│   ├── src/store          # Redux Toolkit slices
│   └── package.json
├── server/                # Express API (MVC)
│   ├── controllers        # Route handlers
│   ├── models             # Mongoose schemas
│   ├── routes             # Express routers
│   ├── services           # Baby image generator & external calls
│   └── server.js
├── tests/                 # E2E/Jest entry points
├── package.json           # Root scripts (concurrently runs client/server)
├── Procfile               # Deploys Express via `npm start`
└── .env.example           # Documented environment variables
```

## Environment Variables
| Name | Description |
| --- | --- |
| `PORT` | Express port (defaults to 5000 if unset). (/server/index.js, /.env.example)
| `ALLOWED_ORIGINS` | Comma-separated CORS allowlist. (/server/config/cors.js)
| `MONGO_URI` | MongoDB connection string. (/server/config/db.js)
| `JWT_SECRET` | Signing key for auth tokens. (/server/utils/token.js)
| `GROQ_API_KEY` / `GROQ_MODEL` | Credentials for Groq chat completions. (/server/config/ai.js)
| `CHAT_MAX_TOKENS` | Token ceiling for Aya replies. (/server/config/ai.js)
| `AI_SIGN_OFF` | Toggles persona sign-off injection. (/server/config/ai.js, /server/config/persona.js)
| `HUGGING_FACE_API_KEY` | Auth for baby image generation. (/server/services/hfGenerate.js)
| `REGION` | Default locale for triage messaging. (/.env.example)
| `VITE_API_BASE` | Client base URL for API requests. (/client/src/constants/baseUrl.js)

## Setup & Installation
1. Clone the repo and install root dependencies:
   ```bash
   git clone https://github.com/kofiarhin/pregchat.git
   cd pregchat
   npm install
   ```
2. Install backend packages:
   ```bash
   cd server
   npm install
   cd ..
   ```
3. Install frontend packages:
   ```bash
   cd client
   npm install
   cd ..
   ```
4. Copy `.env.example` to `.env` and configure the variables above (server listens on 5001 in the example while Vite runs on 5000).
5. Ensure MongoDB is running and Groq/Hugging Face keys are provisioned if you need AI responses or image generation.

## Running & Scripts
| Location | Command | Purpose |
| --- | --- | --- |
| root | `npm run dev` | Run Express (`server/index.js`) and Vite concurrently via `concurrently`. (/package.json)
| root | `npm start` | Launch Express in production mode (`server/server.js`). (/package.json)
| root | `npm run test:server` / `npm run test:client` | Execute Jest (server) and Vitest (client). (/package.json)
| root | `npm run test:unit` / `npm run test:integration` | Focused backend Jest configs. (/package.json)
| root | `npm run e2e` | Run Jest E2E suite (`jest.e2e.config.js`). (/package.json)
| client | `npm run dev` / `npm run build` / `npm run preview` | Vite dev/build/preview commands (default port 5000). (/client/package.json)
| client | `npm test` | Run Vitest for the React app. (/client/package.json)
| server | `npm run dev` / `npm start` | Nodemon dev server or plain Node entry. (/server/package.json)
| server | `npm test` | Run Jest within the server workspace. (/server/package.json)

## API Reference
| Method | Path | Controller | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | authController.register | Create a user, hash password, return JWT. (/server/routes/authRoutes.js)
| POST | `/auth/login` | authController.login | Authenticate and issue JWT. (/server/routes/authRoutes.js)
| GET | `/auth/me` | authController.me | Return authenticated profile. (/server/routes/authRoutes.js)
| GET | `/chat/conversations` | chatController.getConversations | List user chats sorted by `updatedAt`. (/server/routes/chatRoutes.js)
| GET | `/chat/conversations/:conversationId/messages` | chatController.getConversationMessages | Paginate chat history with `page`/`limit` query params. (/server/routes/chatRoutes.js)
| POST | `/chat/ask` | chatController.ask | Run triage + Aya response, optionally stream. (/server/routes/chatRoutes.js)
| GET | `/updates/today` | updatesController.getToday | Fetch today’s pregnancy summary for the user. (/server/routes/updatesRoutes.js)
| GET | `/updates/:day` | updatesController.getDay | Fetch specific day content. (/server/routes/updatesRoutes.js)
| PUT | `/updates/profile` | updatesController.updateProfile | Upsert pregnancy profile (LMP or due date). (/server/routes/updatesRoutes.js)
| POST | `/admin/content` | adminController.upsertContent | Bulk upsert DailyContent entries. (/server/routes/adminRoutes.js)
| DELETE | `/api/messages/:userId` | messageController.deleteMessagesForUser | Clear stored conversation for a user. (/server/routes/messages.js)
| GET | `/api/store/` | storeController.getStoreItems | List store items. (/server/routes/store.js)
| GET | `/api/store/:id` | storeController.getStoreItemById | Fetch a single store item. (/server/routes/store.js)
| POST | `/api/store/` | storeController.createStoreItem | Create a store item (no auth guard). (/server/routes/store.js)
| GET | `/api/midwives/` | midwifeController.getMidwives | List all midwives. (/server/routes/midwives.js)
| GET | `/api/midwives/:id` | midwifeController.getMidwifeById | Fetch midwife by id. (/server/routes/midwives.js)
| GET | `/api/appointments/my` | appointmentController.getMyAppointments | List appointments for the requester. (/server/routes/appointments.js)
| POST | `/api/appointments/availability` | appointmentController.getAvailability | Compute free slots for a midwife/date range. (/server/routes/appointments.js)
| POST | `/api/appointments/` | appointmentController.createAppointment | Book an appointment slot. (/server/routes/appointments.js)
| DELETE | `/api/appointments/:id` | appointmentController.cancelAppointment | Cancel an appointment. (/server/routes/appointments.js)
| GET | `/api/journals/` | journalController.getJournals | List journals for a user id. (/server/routes/journals.js)
| GET | `/api/journals/:id` | journalController.getJournalById | Retrieve a single journal. (/server/routes/journals.js)
| POST | `/api/journals/` | journalController.createJournal | Create a journal entry. (/server/routes/journals.js)
| PUT | `/api/journals/:id` | journalController.updateJournal | Update a journal entry. (/server/routes/journals.js)
| DELETE | `/api/journals/:id` | journalController.deleteJournal | Delete a journal entry. (/server/routes/journals.js)
| GET | `/api/names/` | namesController.getNames | Return curated baby names sample. (/server/routes/namesRoutes.js)
| GET | `/api/baby-image/today` | babyImageController.getTodayBabyImage | Generate or fetch cached daily baby image. (/server/routes/babyImageRoutes.js)
| GET | `/api/onboarding/me` | onboarding.controller.getMyDetails | Fetch onboarding details for the user. (/server/routes/onboarding.routes.js)
| POST | `/api/onboarding/me` | onboarding.controller.upsertMyDetails | Save onboarding questionnaire answers. (/server/routes/onboarding.routes.js)
| PATCH | `/api/profile/:id` | profile.controller.updateProfile | Update profile document fields. (/server/routes/profile.routes.js)

## Frontend Notes
- **HTTP layer**: `client/src/api/http.js` wraps `fetch` with retries, bearer token injection via Redux selectors, and JSON parsing fallbacks.
- **React Query keys**: `chatsKeys` (`client/src/features/chats/queryKeys.js`), `pregnancyKeys` (`client/src/features/pregnancy/queryKeys.js`), `authKeys` (`client/src/features/auth/queryKeys.js`), and local `chatMessageKeys` (`client/src/features/messages/queryKeys.js`) standardise cache namespaces.
- **Chat flows**: `useSendMessageMutation` handles optimistic updates, triage toasts, and cache invalidation; `useChatsQuery`/`useMessagesQuery` back up to localStorage for offline resilience. (/client/src/features/messages/hooks/useSendMessageMutation.js)
- **Global state**: `uiSlice` stores auth tokens, toasts, and modal state; `store/store.js` exposes typed hooks. (/client/src/store/ui/uiSlice.js)
- **Context providers**: `ChatSessionContext`, `CartContext`, and `BookingContext` wrap the app in `main.jsx` for shared UI state. (/client/src/main.jsx)
- **Styling**: Route-level screens use SCSS modules (e.g., `AppointmentBrowse.styles.module.scss`); legacy components like `ChatBox` import global SCSS while migration is in progress. (/client/src/pages/AppointmentBrowse.styles.module.scss, /client/src/components/ChatBox/chatBox.styles.scss)

## Testing
- Server: `npm run test:server` runs Jest with Supertest (configs in `server/jest.*.config.js`).
- Client: `npm run test:client` triggers Vitest (`client/vitest.config.*` via package.json script).
- No additional automated linting is configured.

## Deployment
- Procfile exposes `web: npm start`; additional deployment automation is not yet documented. (/Procfile)

## Security & Compliance
- Conversations require JWT auth (`Authorization: Bearer <token>`), and requests rate-limit at 20 chat calls per minute. (/server/middleware/auth.js, /server/routes/chatRoutes.js)
- Aya replies always end with “Educational only — not a diagnosis.” and trigger urgent-care messaging on red-flag inputs; all guidance is educational, not medical advice. (/server/config/prompts.js, /server/config/ai.js)
- Red-flag messages are persisted in the `Flag` collection for follow-up, but no PHI storage beyond user-provided details exists. (/server/models/Flag.js)

## License
Distributed under the ISC License. (/package.json)
