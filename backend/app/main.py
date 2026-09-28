from contextlib import asynccontextmanager
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging, get_logger
from app.db.base import init_db
from app.api import auth, decisions, research, comparisons, sources, users, saved, analytics, subscriptions

configure_logging()
logger = get_logger("decisioniq.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database…")
    init_db()
    logger.info("DecisionIQ API ready (environment=%s)", settings.ENVIRONMENT)
    yield


app = FastAPI(
    title="DecisionIQ API",
    description="AI Decision Intelligence Platform — research-first, source-grounded.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Unhandled error on %s %s (rid=%s)", request.method, request.url.path, request_id)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "request_id": request_id},
        )
    elapsed_ms = round((time.perf_counter() - start) * 1000, 1)
    response.headers["x-request-id"] = request_id
    response.headers["x-response-time-ms"] = str(elapsed_ms)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(decisions.router)
app.include_router(research.router)
app.include_router(comparisons.router)
app.include_router(sources.router)
app.include_router(saved.router)
app.include_router(analytics.router)
app.include_router(subscriptions.router)


@app.get("/")
def root():
    return {
        "name": "DecisionIQ API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "missing_keys": settings.missing_keys,
        "database": "connected" if _db_ok() else "unavailable",
    }


def _db_ok() -> bool:
    try:
        from sqlalchemy import text
        from app.db.base import engine

        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001
        return False