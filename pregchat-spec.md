# PREGCHAT — Product Spec

## 1. Overview

PREGCHAT is a pregnancy support app that gives users day-by-day pregnancy updates, AI-assisted answers, and structured guidance throughout the pregnancy journey.

The app should help a pregnant user understand:

- what is happening with the baby each day
- what changes to expect in their own body
- what actions, precautions, and milestones matter next

The experience should feel simple, reassuring, informative, and personalized.

---

## 2. Core Goal

Build a full-stack app that:

1. asks the user how many days pregnant they are, or calculates it from LMP / due date
2. shows daily updates for both baby and mother
3. provides a chat interface for pregnancy-related questions
4. stores progress, history, and saved conversations
5. presents medically safe, non-alarmist, non-diagnostic information

---

## 3. Target Users

### Primary

- pregnant women who want daily guidance
- first-time mothers needing simple explanations
- users who want quick answers without digging through forums

### Secondary

- partners following the pregnancy journey
- caregivers supporting someone pregnant

---

## 4. User Problems

Users need:

- a clear understanding of what is happening today in pregnancy
- reliable, structured daily information
- a way to ask natural-language questions
- reminders about milestones, symptoms, and care
- a calmer and more personalized experience than generic pregnancy blogs

---

## 5. Product Vision

A pregnancy companion that combines:

- timeline tracking
- daily education
- conversational AI
- milestone awareness
- simple journaling / saved history

---

## 6. Success Criteria

### MVP success

- user can create account
- user can enter pregnancy start info
- app computes current pregnancy day/week
- app shows baby update + mother update for the day
- user can ask questions in chat
- user history persists

### Post-MVP success

- reminders and weekly summaries
- symptom tracking
- appointment and checklist support
- partner mode
- export/share summaries

---

## 7. Scope

## MVP Features

### 7.1 Authentication

- register
- login
- logout
- protected dashboard
- JWT-based auth
- password hashing

### 7.2 Pregnancy Setup

User can provide one of:

- days pregnant
- weeks + days pregnant
- last menstrual period (LMP)
- due date

System should calculate:

- current pregnancy day
- current pregnancy week
- trimester
- estimated due date if needed

### 7.3 Daily Update Engine

For each pregnancy day, app returns:

- `babyUpdate`
- `motherUpdate`
- optional `tips`
- optional `watchOutFor`
- optional `nutritionTip`
- optional `appointmentHint`

### 7.4 Dashboard

Dashboard should show:

- current week/day
- trimester
- baby today
- mother today
- key milestone
- recent chat history
- next recommended action

### 7.5 AI Chat

Chat should support:

- pregnancy-related Q&A
- contextual answers based on user stage
- safe response boundaries
- fallback disclaimer for emergencies

### 7.6 Saved History

- save daily viewed updates
- save past chat sessions
- allow reopening conversation threads

---

## 8. Post-MVP Features

- symptom tracker
- medication / supplement reminders
- appointment planner
- fetal milestone timeline
- contraction tracker
- partner dashboard
- push/email notifications
- voice mode
- multilingual support
- printable weekly reports

---

## 9. Safety Requirements

This app is **not** a replacement for a doctor.

The system must:

- avoid diagnosis
- avoid treatment instructions beyond basic general guidance
- encourage medical consultation for concerning symptoms
- display emergency escalation guidance for severe symptoms
- avoid hallucinated medical certainty
- clearly label AI-generated answers

High-risk symptoms should trigger escalation messaging, such as:

- heavy bleeding
- severe abdominal pain
- severe headache with vision changes
- decreased fetal movement later in pregnancy
- chest pain
- shortness of breath
- seizures

---

## 10. User Stories

### Auth

- As a user, I want to create an account so my pregnancy data is saved.
- As a user, I want to log in securely.

### Pregnancy Tracking

- As a user, I want to enter how far along I am.
- As a user, I want the app to tell me my current week and trimester.

### Daily Updates

- As a user, I want to see what is happening with my baby today.
- As a user, I want to know what changes I may feel in my body today.

### Chat

- As a user, I want to ask pregnancy questions in plain language.
- As a user, I want answers adapted to my pregnancy stage.

### History

- As a user, I want to revisit previous chats and updates.

---

## 11. Functional Requirements

## 11.1 Auth

- user registration with name, email, password
- secure login
- token-based session
- password reset later

## 11.2 Pregnancy Profile

Store:

- userId
- pregnancyStartDate or equivalent input
- dueDate
- gestationalDay
- gestationalWeek
- trimester
- pregnancyStatus (active, completed, archived)

## 11.3 Daily Content Retrieval

System must:

- map current day to pregnancy content
- return exact daily record if available
- fallback to weekly summary if daily record is missing

## 11.4 Chat

System must:

- accept user message
- enrich prompt with current pregnancy stage
- return safe, concise answer
- persist conversation thread

## 11.5 History

System must:

- save chat messages
- store timestamps
- allow retrieval by thread
- show recent activity on dashboard

---

## 12. Non-Functional Requirements

- responsive UI
- fast dashboard load
- secure auth
- clear error handling
- scalable backend structure
- maintainable content system
- accessible forms and navigation
- medically careful copy tone

---

## 13. Suggested Tech Stack

## Frontend

- React + Vite
- Tailwind CSS
- React Router
- Redux Toolkit for auth/UI only
- TanStack Query for server state
- Axios
- Vitest + Testing Library

## Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT auth
- bcrypt
- Jest + Supertest

## AI

- OpenAI or Groq for chat responses
- prompt guardrails for medical safety

---

## 14. Suggested Folder Structure

```txt
package.json
client/
server/
```

### Client

```txt
client/
  src/
    app/
    components/
    features/
    hooks/
      queries/
      mutations/
    lib/
    pages/
    routes/
    services/
    utils/
  test/
```

### Server

```txt
server/
  config/
  controllers/
  middleware/
  models/
  routes/
  utils/
  tests/
```

---

## 15. Core Data Models

## User

```js
{
  (name, email, password, role, createdAt, updatedAt);
}
```

## PregnancyProfile

```js
{
  (userId,
    lmpDate,
    dueDate,
    gestationalDay,
    gestationalWeek,
    trimester,
    isActive,
    createdAt,
    updatedAt);
}
```

## DailyPregnancyContent

```js
{
  (dayNumber,
    weekNumber,
    trimester,
    babyUpdate,
    motherUpdate,
    tips,
    watchOutFor,
    nutritionTip,
    appointmentHint);
}
```

## ChatThread

```js
{
  (userId, title, createdAt, updatedAt);
}
```

## ChatMessage

```js
{
  (threadId,
    userId,
    role, // user | assistant | system
    content,
    createdAt);
}
```

---

## 16. Main Screens

### Public

- landing page
- login
- register

### Private

- dashboard
- daily update page
- chat page
- history page
- profile/settings page

---

## 17. Dashboard Layout

Dashboard should include:

1. top summary card
   - week
   - day
   - trimester
   - due date

2. baby today card
3. mother today card
4. quick tips card
5. recent chats
6. milestone / next step panel

---

## 18. API Requirements

## Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

## Pregnancy Profile

- `POST /api/pregnancy-profile`
- `GET /api/pregnancy-profile`
- `PATCH /api/pregnancy-profile`

## Daily Updates

- `GET /api/daily-updates/today`
- `GET /api/daily-updates/:dayNumber`

## Chat

- `POST /api/chat/thread`
- `GET /api/chat/threads`
- `GET /api/chat/threads/:threadId`
- `POST /api/chat/threads/:threadId/message`

---

## 19. Validation Rules

- email must be valid
- password minimum length enforced
- pregnancy dates must be logical
- day/week values must be within pregnancy range
- unauthorized access blocked
- malformed chat requests rejected
- AI responses sanitized before return if needed

---

## 20. Edge Cases

- user enters only due date
- user enters invalid future LMP
- pregnancy day exceeds expected range
- no daily content exists for exact day
- AI provider fails
- user asks emergency medical question
- inactive / completed pregnancy state
- multiple pregnancies later support

---

## 21. UX Rules

- keep copy calm and clear
- avoid dense medical jargon
- always show week/day prominently
- use reassuring visual hierarchy
- error messages must be simple and actionable
- emergency guidance must be visually distinct

---

## 22. Design Direction

Suggested design tone:

- warm
- calm
- clean
- premium but gentle

Suggested palette:

- soft rose / blush
- warm neutrals
- muted purple or sage accents
- clean cards with generous spacing

---

## 23. MVP Delivery Plan

### Phase 1

- auth
- pregnancy setup
- dashboard shell
- static daily data

### Phase 2

- persistent pregnancy profile
- daily update retrieval
- history storage

### Phase 3

- AI chat integration
- safe prompt framework
- thread persistence

### Phase 4

- polish
- testing
- validation
- deploy

---

## 24. Testing Requirements

### Frontend

- auth flows
- protected routes
- pregnancy setup form
- dashboard rendering
- empty/error/loading states
- chat interaction

### Backend

- auth controller tests
- pregnancy profile validation tests
- daily update retrieval tests
- chat endpoint tests
- unauthorized/forbidden/error cases

---

## 25. Deployment Targets

### Frontend

- Vercel

### Backend

- Render

### Database

- MongoDB Atlas

---

## 26. Open Questions

- will daily content be manually curated, AI-generated, or hybrid?
- should chat answers use only internal content or general AI knowledge too?
- should users be able to switch from day-based view to week-based view?
- do we need notification reminders in MVP?
- do we want partner access in v1 or later?

---

## 27. Final MVP Definition

A user can:

- sign up
- enter pregnancy timing info
- see today’s baby and mother update
- ask questions in chat
- save and revisit their activity

That is the first complete usable version of PREGCHAT.
