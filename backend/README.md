# DecisionIQ — Backend

FastAPI decision-intelligence API: real research, source verification,
transparent weighted comparison, and explainable recommendations.

## Stack

- **FastAPI** + Pydantic v2
- **SQLAlchemy 2.0** + Alembic (SQLite by default, PostgreSQL in production)
- **JWT auth** (access + refresh tokens, hashed refresh sessions) with bcrypt
- **Research**: keyless Wikipedia API by default; Tavily when `SEARCH_API_KEY` is set
- **Optional LLM** (OpenAI-compatible) for richer parsing/follow-up chat; the
  engine is fully functional without it and never fabricates facts either way

## Run

```bash
cd backend
python -m venv venv            # if not already present
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # optional — defaults work out of the box
uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

## Key endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → access + refresh tokens |
| POST | `/api/auth/refresh` | Rotate refresh token |
| GET | `/api/auth/me` | Current user |
| GET/PATCH | `/api/users/preferences` | Personalization preferences |
| POST | `/api/decisions` | Create + (auto) analyze a decision |
| GET | `/api/decisions` | List your decisions |
| GET | `/api/decisions/{id}` | Full decision report (polls during analysis) |
| POST | `/api/decisions/{id}/answers` | Answer clarifying questions |
| POST | `/api/decisions/{id}/follow-up` | Chat — budget changes, "compare A and B only", etc. |
| POST/DELETE | `/api/decisions/{id}/save` | Save / unsave |
| GET | `/api/analytics/summary` | Insights dashboard data |

## How the decision engine works

```
Prompt -> Planner (domain, criteria, weights, questions)
       -> Researcher (real sources via Wikipedia/Tavily + curated knowledge base)
       -> Verifier (freshness, authority, conflicts, claim-to-source mapping)
       -> Comparator (weighted, evidence-traceable scores)
       -> Analyst (pros/cons/risks per option)
       -> Synthesizer (recommendation + confidence + what could change)
```

Every score in a report is traceable: criteria and weights are shown, each
option's scores carry notes, and every claim maps to a source. The system
never claims absolute certainty — confidence is capped and hedged.

## Security notes

- Secrets only via environment variables — never in code.
- Passwords hashed with bcrypt; refresh tokens stored hashed and revocable.
- Rate limiting on auth/research/decision endpoints; request-ID logging.
- CORS restricted via `CORS_ORIGINS`.