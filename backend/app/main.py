from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.database import close_connection
from app.auth.routes import router as auth_router
from app.routes.employees import router as employees_router
from app.routes.shifts import router as shifts_router
from app.routes.absences import router as absences_router
from app.routes.replacements import router as replacements_router
from app.routes.availabilities import router as availabilities_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="SmartShift Board API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url=None,
    redirect_slashes=False,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In dev: accept any localhost/127.0.0.1 port so Vite port changes don't break CORS.
# In prod: restrict to the exact FRONTEND_URL only.
import re as _re

_frontend = settings.frontend_url.rstrip("/")
_is_local = _re.match(r"https?://(localhost|127\.0\.0\.1)(:\d+)?$", _frontend) is not None

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _is_local else [_frontend],
    allow_credentials=False if _is_local else True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["Content-Length"],
    max_age=600,
)

API_PREFIX = "/api"
app.include_router(auth_router,           prefix=API_PREFIX)
app.include_router(employees_router,      prefix=API_PREFIX)
app.include_router(shifts_router,         prefix=API_PREFIX)
app.include_router(absences_router,       prefix=API_PREFIX)
app.include_router(replacements_router,   prefix=API_PREFIX)
app.include_router(availabilities_router, prefix=API_PREFIX)
app.include_router(dashboard_router,      prefix=API_PREFIX)
app.include_router(reports_router,        prefix=API_PREFIX)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.on_event("shutdown")
async def shutdown():
    await close_connection()
