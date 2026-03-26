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
from backend.config import CORS_ORIGINS

# ── Startup readiness flag ────────────────────────────────────────────
_db_lock = threading.Lock()
_db_ready = False
_db_failed = False   # True when initialisation has permanently failed
_db_error: str = ""
_db_status: str = "starting"
_MAX_DB_ATTEMPTS = 40  # 40 × (5s connect_timeout + 5s sleep) ≈ 400s max DB wait


def _init_db_background():
    global _db_ready, _db_failed, _db_error, _db_status
    import traceback as _tb

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
                    conn = psycopg2.connect(url, connect_timeout=5)
                    conn.close()
                    print(f"✅ Database reachable (attempt {attempt + 1})")
                    break
                except Exception as exc:
                    print(f"⚠  DB not ready (attempt {attempt + 1}/{_MAX_DB_ATTEMPTS}): {exc}")
                    time.sleep(5)
            else:
                with _db_lock:
                    _db_error = "Database unavailable after attempts"
                    _db_status = _db_error
                    _db_failed = True
                print(f"❌ {_db_error}")
                return

        # ── Schema init (with retry) ─────────────────────────────────────────
        _INIT_MAX_RETRIES = 3
        _INIT_RETRY_DELAY = 10  # seconds between retries

        with _db_lock:
            _db_status = "initializing_schema"
        print("🗄️  Initialising schema...")
        for attempt in range(1, _INIT_MAX_RETRIES + 1):
            try:
                database.init_db()
                print("✅ Schema ready")
                break
            except Exception as exc:
                print(f"⚠  Schema init failed (attempt {attempt}/{_INIT_MAX_RETRIES}): {exc}")
                _tb.print_exc()
                if attempt < _INIT_MAX_RETRIES:
                    time.sleep(_INIT_RETRY_DELAY)
                else:
                    raise  # re-raise on final attempt so outer except catches it

        # ── Seed data (with retry) ───────────────────────────────────────────
        with _db_lock:
            _db_status = "seeding_data"
        print("🌱 Seeding default data...")
        for attempt in range(1, _INIT_MAX_RETRIES + 1):
            try:
                database.seed_data()
                print("✅ Seed data applied")
                break
            except Exception as exc:
                print(f"⚠  Seed failed (attempt {attempt}/{_INIT_MAX_RETRIES}): {exc}")
                _tb.print_exc()
                if attempt < _INIT_MAX_RETRIES:
                    time.sleep(_INIT_RETRY_DELAY)
                else:
                    raise  # re-raise on final attempt

        with _db_lock:
            _db_ready = True
            _db_status = "ok"
        print("🚀 Application fully ready — V7.0")
    except Exception as exc:
        err_msg = str(exc)
        with _db_lock:
            _db_error = err_msg
            _db_status = err_msg
            _db_failed = True
        print(f"❌ Startup error: {exc}")
        _tb.print_exc()


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
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def db_readiness_gate(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        with _db_lock:
            ready = _db_ready
            failed = _db_failed
            err = _db_error
        if not ready:
            if failed:
                return JSONResponse(
                    status_code=503,
                    content={"detail": f"系统初始化失败，请联系管理员。错误: {err}"},
                )
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
        failed = _db_failed
        status = _db_status
    body = {
        "status": "ok" if ready else ("error" if failed else "starting"),
        "db_ready": ready,
        "db_failed": failed,
        "db_status": status,
        "version": "7.0.0",
        "time": datetime.now().isoformat(),
    }
    # Always return 200 so Railway marks the deployment healthy as soon as
    # uvicorn is accepting connections.  The db_readiness_gate middleware
    # still blocks /api/* calls with 503 + Retry-After until _db_ready is True.
    return body


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
from backend.routers import messages as messages_v7
from backend.routers import admin as admin_v7
from backend.routers import integrations as integrations_v7

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
app.include_router(messages_v7.router)
app.include_router(admin_v7.router)
app.include_router(integrations_v7.router)

# ── Static files + catch-all ─────────────────────────────────────────
_REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
_DIST_DIR = os.path.join(_REPO_ROOT, "frontend", "dist")

os.makedirs(_DIST_DIR, exist_ok=True)
_ASSETS_DIR = os.path.join(_DIST_DIR, "assets")
app.mount("/assets", StaticFiles(directory=_ASSETS_DIR if os.path.isdir(_ASSETS_DIR) else _DIST_DIR), name="assets")


@app.get("/{full_path:path}")
def catch_all(full_path: str):
    # Serve real dist files (PWA sw.js, manifest.webmanifest, icons, workbox, etc.)
    # before falling back to index.html for SPA client-side routing.
    if full_path:
        candidate = os.path.realpath(os.path.join(_DIST_DIR, full_path))
        dist_root = os.path.realpath(_DIST_DIR)
        if candidate.startswith(dist_root + os.sep) and os.path.isfile(candidate):
            return FileResponse(candidate)
    index = os.path.join(_DIST_DIR, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return JSONResponse({"status": "ok", "version": "7.0.0"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
