"""
渊博+579 HR V6 — FastAPI Backend (main entry point)
PostgreSQL (Railway) / SQLite (本地开发) 自动切换
"""
import os, time, threading
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import backend.database as database
from backend.routers import (
    auth,
    analytics,
    employees,
    timesheets,
    zeitkonto,
    abmahnung,
    werkvertrag,
    containers,
    warehouses,
    settlement,
    clock,
    logs,
)

# ── Startup readiness flag ────────────────────────────────────────────
_db_lock = threading.Lock()
_db_ready = False
_db_error: str = ""
_db_status: str = "starting"

_MAX_DB_ATTEMPTS = 20


def _init_db_background():
    """Run DB wait → init_db → seed_data in a background thread so uvicorn
    can start immediately and respond to Railway health checks."""
    global _db_ready, _db_error, _db_status
    try:
        db_url = os.environ.get("DATABASE_URL", "")
        if db_url:
            import psycopg2

            url = db_url.replace("postgres://", "postgresql://", 1)
            print("⏳ Waiting for database to become reachable...")
            with _db_lock:
                _db_status = "waiting_for_database"
            for attempt in range(_MAX_DB_ATTEMPTS):
                try:
                    conn = psycopg2.connect(url, connect_timeout=10)
                    conn.close()
                    print(f"✅ Database reachable (attempt {attempt + 1})")
                    break
                except Exception as exc:
                    print(f"⚠  DB not ready (attempt {attempt + 1}/{_MAX_DB_ATTEMPTS}): {exc}")
                    time.sleep(3)
            else:
                with _db_lock:
                    _db_error = "Database unavailable after 20 attempts"
                    _db_status = _db_error
                print(f"❌ {_db_error}")
                return

        with _db_lock:
            _db_status = "initializing_schema"
        print("🗄️  Initialising schema...")
        database.init_db()
        print("✅ Schema ready")

        with _db_lock:
            _db_status = "seeding_data"
        print("🌱 Seeding default data...")
        database.seed_data()
        print("✅ Seed data applied")

        with _db_lock:
            _db_ready = True
            _db_status = "ok"
        print("🚀 Application fully ready")
    except Exception as exc:
        with _db_lock:
            _db_error = str(exc)
            _db_status = str(exc)
        print(f"❌ Startup error: {exc}")


# ── Lifespan ─────────────────────────────────────────────────────────
_init_thread: threading.Thread | None = None


@asynccontextmanager
async def lifespan(application: FastAPI):
    global _init_thread
    _init_thread = threading.Thread(target=_init_db_background, daemon=True)
    _init_thread.start()
    try:
        yield
    finally:
        if _init_thread is not None and _init_thread.is_alive():
            print("⏳ Waiting for DB init thread to finish before shutdown...")
            _init_thread.join(timeout=30)


# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(title="渊博+579 HR V6", version="6.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── DB-readiness gate ────────────────────────────────────────────────
@app.middleware("http")
async def db_readiness_gate(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        with _db_lock:
            ready = _db_ready
        if not ready:
            return JSONResponse(
                status_code=503,
                headers={"Retry-After": "5"},
                content={"detail": "系统正在启动，请稍候…"},
            )
    return await call_next(request)


# ── Health ───────────────────────────────────────────────────────────
@app.get("/health")
def health():
    with _db_lock:
        ready = _db_ready
        status = _db_status
    if not ready:
        return JSONResponse(
            status_code=503,
            headers={"Retry-After": "5"},
            content={"status": status, "version": "6.0.0"},
        )
    return {"status": "ok", "version": "6.0.0", "time": datetime.now().isoformat()}


# ── Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(employees.router)
app.include_router(timesheets.router)
app.include_router(zeitkonto.router)
app.include_router(abmahnung.router)
app.include_router(werkvertrag.router)
app.include_router(containers.router)
app.include_router(warehouses.router)
app.include_router(settlement.router)
app.include_router(clock.router)
app.include_router(logs.router)

# ── Static files + catch-all ─────────────────────────────────────────
_REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
_DIST_DIR = os.path.join(_REPO_ROOT, "frontend", "dist")
_LEGACY_DIR = os.path.join(_REPO_ROOT, "static")

# Prefer the Vite-built frontend (frontend/dist) when it exists; fall back to legacy static/
STATIC_DIR = _DIST_DIR if os.path.isdir(_DIST_DIR) else _LEGACY_DIR
os.makedirs(STATIC_DIR, exist_ok=True)
_ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
app.mount("/assets", StaticFiles(directory=_ASSETS_DIR if os.path.isdir(_ASSETS_DIR) else STATIC_DIR), name="assets")
app.mount("/static", StaticFiles(directory=_LEGACY_DIR), name="static")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
