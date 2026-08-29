# Campus Gig Marketplace

A hyper-local, peer-to-peer micro-economy for campus gigs — verified by
`.edu` email — meant to replace fragmented coordination over WhatsApp or
Instagram stories.

```
Campus-Gig-App/
├── campus-gig-backend/    Express + MongoDB API
└── campus-gig-frontend/   React + Vite + Tailwind client
```

## Prerequisites

- Node.js 18+
- A MongoDB connection string (local `mongod`, or a free Atlas cluster)

## Backend setup

```bash
cd campus-gig-backend
npm install
```

Edit `.env` and set `MONGO_URI` to your own connection string (the
`<username>:<password>` placeholders need real values, or point it at a
local Mongo instance instead):

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus-gig?retryWrites=true&w=majority
```

Then run it:

```bash
npm run dev      # nodemon, restarts on change
# or
npm start
```

The API listens on `http://localhost:5000` — `GET /` should respond with
`Campus Gig API is active.`, and the routes are mounted at `/api/users`
and `/api/gigs`.

## Frontend setup

```bash
cd campus-gig-frontend
npm install
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`).
`.env` already points it at the backend:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

`npm run build` has been verified to produce a clean production build.

## Where things stand

**Backend** — complete: `User` and `Gig` models, registration, gig
posting/browsing with category and text-search filters, availability and
gig-status toggles.

**Frontend** — the file that was shared (`StudentGigApp.jsx`) cut off
partway through the account-creation flow, mid-way through the "Select
Skills" step. Everything up to that point is reproduced as given:

- `OnboardingView` — 3-step flow: `.edu` verification → role selection
  (Seller / Buyer / Both) → skill tags → finish. This is complete and
  syntactically closed out so the app builds and runs.
- Supporting pieces already defined but not yet wired into a screen:
  `FREELANCERS` and `CONVERSATIONS` mock data, `estimatePrice()`, and
  the `Avatar` / `Pill` / `CategoryTag` / `Stars` / `Toggle` / `Toast`
  components.
- Once `OnboardingView` finishes, the app currently just shows a
  "Onboarding complete" placeholder screen — see the comment directly
  above `export default function StudentGigApp()` in the file.

Based on the icon imports at the top of `StudentGigApp.jsx` (`Home`,
`LayoutGrid`, `MessageSquareWarning`, `Wallet`, `Search`, `MapPin`, …),
the missing pieces are most likely:

- a gig marketplace/browse view (search, category filter, gig cards)
- a "post a gig" form using `estimatePrice()` for a live price range
- a messaging view built from `CONVERSATIONS` (escrow status, chat thread)
- a freelancer/profile view built from `FREELANCERS`

None of that was in the file that was shared, so none of it was invented —
happy to build any of it out next.
