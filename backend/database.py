"""
渊博579 HR V7 — Database Layer
SQLAlchemy 2.0+ — PostgreSQL (prod) / SQLite (dev)
"""
from __future__ import annotations
import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Session
from typing import Generator

DATABASE_URL = os.environ.get("DATABASE_URL", "")

def _build_url() -> str:
    if not DATABASE_URL:
        db_path = os.path.join(os.path.dirname(__file__), "hr_v7.db")
        return f"sqlite:///{db_path}"
    return DATABASE_URL.replace("postgres://", "postgresql://", 1)

_url = _build_url()
_is_sqlite = _url.startswith("sqlite")

_connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine = create_engine(
    _url,
    connect_args=_connect_args,
    pool_pre_ping=True,
    echo=False,
)

if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(conn, _record):
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (if not exist). Called at startup."""
    from backend.models import user, employee, supplier, warehouse, timesheet, container, clock  # noqa: F401
    Base.metadata.create_all(bind=engine)


def seed_data() -> None:
    """Seed default data (7 users, 5 suppliers, 10 warehouses)."""
    from backend.seed.init_data import run_seed
    db = SessionLocal()
    try:
        run_seed(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
