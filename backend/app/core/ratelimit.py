"""Lightweight rate limiting.

In-process fixed-window limiter. For multi-instance deployments, swap in a
Redis-backed limiter using REDIS_URL — the dependency interface stays the same.
"""
import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import HTTPException, Request, status

_buckets: dict[str, deque] = defaultdict(deque)
_lock = Lock()


def _key(request: Request, scope: str) -> str:
    client = request.client.host if request.client else "unknown"
    return f"{scope}:{client}"


def rate_limit(scope: str, limit: int, window_seconds: int = 60):
    """FastAPI dependency factory: allow `limit` calls per `window_seconds`."""

    def dependency(request: Request) -> None:
        now = time.monotonic()
        key = _key(request, scope)
        with _lock:
            bucket = _buckets[key]
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please slow down.",
                )
            bucket.append(now)

    return dependency