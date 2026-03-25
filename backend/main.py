"""
渊博579 HR V7 — FastAPI Backend (main entry point)
PostgreSQL (Railway) / SQLite (本地开发) 自动切换
"""
from __future__ import annotations
import os, time, threading
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import backend.database as database

# ── Startup readiness flag ────────────────────────────────────────────
_db_lock = threading.Lock()
_db_ready = False
_db_error: str = ""
_db_status: str = "starting"
_MAX_DB_ATTEMPTS = 30


def _init_db_background():
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
                    time.sleep(8)
            else:
                with _db_lock:
                    _db_error = "Database unavailable after attempts"
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
        print("🚀 Application fully ready — V7.0")
    except Exception as exc:
        with _db_lock:
            _db_error = str(exc)
            _db_status = str(exc)
        print(f"❌ Startup error: {exc}")
        import traceback
        traceback.print_exc()


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


app = FastAPI(title="渊博579 HR V7", version="7.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/health")
def health():
    with _db_lock:
        ready = _db_ready
        status = _db_status
    if not ready:
        return JSONResponse(
            status_code=503,
            headers={"Retry-After": "5"},
            content={"status": status, "version": "7.0.0"},
        )
    return {"status": "ok", "version": "7.0.0", "time": datetime.now().isoformat()}


# ── V7 Routers (/api/v1/) ────────────────────────────────────────────
from backend.routers import auth as auth_v7
from backend.routers import employees as employees_v7
from backend.routers import suppliers as suppliers_v7
from backend.routers import warehouses as warehouses_v7
from backend.routers import dashboard as dashboard_v7
from backend.routers import timesheets as timesheets_v7
from backend.routers import containers as containers_v7
from backend.routers import clock as clock_v7
from backend.routers import settlements as settlements_v7
from backend.routers import referrals as referrals_v7
from backend.routers import commissions as commissions_v7
from backend.routers.quotations import router as quotations_router, cost_router
from backend.routers.dispatch import dispatch_router, talent_router

app.include_router(auth_v7.router)
app.include_router(employees_v7.router)
app.include_router(suppliers_v7.router)
app.include_router(warehouses_v7.router)
app.include_router(dashboard_v7.router)
app.include_router(timesheets_v7.router)
app.include_router(containers_v7.router)
app.include_router(clock_v7.router)
app.include_router(settlements_v7.router)
app.include_router(referrals_v7.router)
app.include_router(commissions_v7.router)
app.include_router(quotations_router)
app.include_router(cost_router)
app.include_router(dispatch_router)
app.include_router(talent_router)

# ── Static files + catch-all ─────────────────────────────────────────
_REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
_DIST_DIR = os.path.join(_REPO_ROOT, "frontend", "dist")
_LEGACY_DIR = os.path.join(_REPO_ROOT, "static")

STATIC_DIR = _DIST_DIR if os.path.isdir(_DIST_DIR) else _LEGACY_DIR
os.makedirs(STATIC_DIR, exist_ok=True)
_ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
app.mount("/assets", StaticFiles(directory=_ASSETS_DIR if os.path.isdir(_ASSETS_DIR) else STATIC_DIR), name="assets")
if os.path.isdir(_LEGACY_DIR):
    app.mount("/static", StaticFiles(directory=_LEGACY_DIR), name="static")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return JSONResponse({"status": "ok", "version": "7.0.0"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
