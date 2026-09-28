# DecisionIQ — Research less. Decide better.

DecisionIQ is an AI decision intelligence platform: it understands your decision,
researches real information, verifies evidence, compares options with transparent
weighted scoring, and explains a recommendation — while you make the final call.

## Stack

- **Frontend** — Next.js 14 (App Router), TypeScript, Tailwind, Framer Motion, Lucide icons.
  Cinematic dark-navy + neon cyan/purple design system with glassmorphism, the DecisionIQ
  robot, glowing globe and handwritten annotations.
- **Backend** — FastAPI + SQLAlchemy 2.0 (SQLite by default, PostgreSQL ready), Alembic,
  JWT auth (access + refresh, bcrypt), rate limiting, request-ID logging.
  Research via the keyless Wikipedia API by default; optional Tavily (`SEARCH_API_KEY`)
  and optional LLM (`AI_API_KEY`, OpenAI-compatible) to enhance parsing/follow-up chat.

## Quick start

### 1. Backend (port 8000)

```bash
cd backend
python -m venv venv                    # optional — a ready venv exists at
                                       # ../decisioniq-scaffold/decisioniq/backend/venv
venv\Scripts\activate                  # (Windows) / source venv/bin/activate (macOS/Linux)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Default DB is `backend/decisioniq.db` (SQLite). Set `DATABASE_URL` for Postgres.

### 2. Frontend (port 3000)

```bash
cp .env.local.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
npm install
npm run dev
```

Open http://localhost:3000

## Try the flagship flow

1. **Get Started** → create an account (then set preferences, or skip).
2. Enter: **"Which laptop should I buy under ₹70,000 for coding and AI?"**
3. DecisionIQ detects the category, extracts the budget and use case, runs real research,
   scores 6–7 real laptops against weighted criteria, and recommends one with
   evidence, trade-offs and confidence.
4. Ask follow-ups in the report: *"why this one?"*, *"compare the top two only"*,
   *"what if my budget is ₹60,000?"* — scores and the recommendation recompute.
5. Save the decision; it appears in **My Decisions** and **Saved**.

## How the decision engine works

```
Prompt -> Planner (domain, criteria weights, clarifying questions)
       -> Researcher (Wikipedia/Tavily + curated knowledge base — real, attributed sources)
       -> Verifier (freshness, authority, relevance, conflict flags)
       -> Comparator (weighted, evidence-traceable scores per criterion)
       -> Analyst (pros / trade-offs / risks)
       -> Synthesizer (recommendation + confidence + what could change)
```

Design rules honored throughout:

- **Never fabricated.** Every researched claim maps to a source you can open.
  Prices are labeled approximate street prices; nothing is presented as official.
- **Transparent.** Criteria, weights, per-criterion scores and notes are visible.
- **Honest confidence.** Confidence comes from evidence coverage + source quality;
  capped, hedged, and never absolute certainty.
- **Real states.** The UI shows live backend pipeline stages (understanding →
  priorities → researching → verifying → comparing → insights → ready) by polling
  the actual decision record — no fake progress.

## Project layout

```
app/            Next.js pages (home, explore, how-it-works, use-cases, about,
                pricing, login, register, get-started, dashboard, decision/new,
                decision/[id], history, saved, insights, community, settings)
components/     layout (Header/Footer/AppShell/Sidebar), ui (glass, buttons,
                robot), decision (wizard, report, comparison, chat, progress),
                auth (AuthProvider, ProtectedRoute)
services/       API client (JWT refresh, typed endpoints)
lib/            api-types, utils, design-system css (globals.css)
backend/        FastAPI app: app/api, app/services, app/agents, app/models,
                app/schemas, app/core; alembic scaffolding; requirements.txt
public/assets/  Cinematic room, holographic globe, robot (from references)
```

## Verification checklist (after a fresh run)

- `npm run build` passes (frontend)
- `uvicorn app.main:app` boots; `/health` returns ok
- Register → login → create decision → follow-up → save → list → revisit all work
  end to end (see acceptance flow in `backend/README.md`)