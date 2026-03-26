"""
渊博579 HR V7 — Database Layer
SQLAlchemy 2.0+ — PostgreSQL (prod) / SQLite (dev)
"""
from __future__ import annotations
import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.sql import quoted_name
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


def _migrate_schema() -> None:
    """Fix schema mismatches from older deployments before create_all()."""
    if _is_sqlite:
        return  # SQLite does not support ALTER COLUMN TYPE; fresh DB always correct
    with engine.begin() as conn:
        # ── 1. Fix employees.id TEXT → INTEGER (legacy V6 schema) ─────────────
        row = conn.execute(text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name='employees' AND column_name='id'"
        )).fetchone()

        if row is not None and row[0].lower() not in ("integer", "bigint", "smallint"):
            print(f"⚠  employees.id is '{row[0]}' — checking data before migration …")

            non_numeric_count = conn.execute(text(
                "SELECT COUNT(*) FROM employees WHERE id IS NOT NULL AND id !~ '^[0-9]+$'"
            )).scalar() or 0

            if non_numeric_count > 0:
                print(
                    f"⚠  employees.id has {non_numeric_count} non-castable value(s) "
                    f"(e.g. 'YB-001').  Dropping incompatible tables for a clean V7 rebuild …"
                )
                _LEGACY_CHILD_TABLES = [
                    "commission_monthly",
                    "commission_records",
                    "referral_records",
                    "employee_settlements",
                    "clock_events",
                    "timesheets",
                ]
                for tbl in _LEGACY_CHILD_TABLES:
                    conn.execute(text(f"DROP TABLE IF EXISTS {quoted_name(tbl, quote=True)} CASCADE"))
                    print(f"   dropped {tbl}")
                conn.execute(text("DROP TABLE IF EXISTS employees CASCADE"))
                print("   dropped employees")
                print("✅ Incompatible tables dropped — create_all() will rebuild with correct V7 schema")
                return  # Early return; create_all() will build from scratch

            print(f"⚠  employees.id is '{row[0]}' — migrating numeric values to INTEGER …")

            fk_rows = conn.execute(text(
                "SELECT tc.table_name, tc.constraint_name "
                "FROM information_schema.table_constraints tc "
                "JOIN information_schema.referential_constraints rc "
                "  ON tc.constraint_name = rc.constraint_name "
                "JOIN information_schema.key_column_usage kcu "
                "  ON rc.unique_constraint_name = kcu.constraint_name "
                "WHERE kcu.table_name = 'employees' AND kcu.column_name = 'id'"
            )).fetchall()
            for tbl, constraint in fk_rows:
                print(f"   dropping FK {constraint} on {tbl}")
                safe_tbl = quoted_name(tbl, quote=True)
                safe_constraint = quoted_name(constraint, quote=True)
                conn.execute(text(f"ALTER TABLE {safe_tbl} DROP CONSTRAINT IF EXISTS {safe_constraint}"))

            conn.execute(text(
                "ALTER TABLE employees ALTER COLUMN id TYPE INTEGER USING id::integer"
            ))

            seq_exists = conn.execute(text(
                "SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='employees_id_seq'"
            )).fetchone()
            if not seq_exists:
                conn.execute(text("CREATE SEQUENCE IF NOT EXISTS employees_id_seq OWNED BY employees.id"))
                conn.execute(text(
                    "SELECT setval('employees_id_seq', COALESCE((SELECT MAX(id) FROM employees), 0) + 1, false)"
                ))
                conn.execute(text("ALTER TABLE employees ALTER COLUMN id SET DEFAULT nextval('employees_id_seq')"))

            child_columns = [
                ("timesheets", "employee_id"),
                ("clock_events", "employee_id"),
                ("employee_settlements", "employee_id"),
                ("referral_records", "referrer_emp_id"),
                ("referral_records", "referee_emp_id"),
                ("commission_records", "employee_id"),
                ("commission_monthly", "employee_id"),
            ]
            for tbl, col in child_columns:
                col_row = conn.execute(text(
                    "SELECT data_type FROM information_schema.columns "
                    "WHERE table_name=:tbl AND column_name=:col"
                ), {"tbl": tbl, "col": col}).fetchone()
                if col_row and col_row[0].lower() not in ("integer", "bigint", "smallint"):
                    print(f"   fixing {tbl}.{col} TEXT → INTEGER")
                    safe_tbl = quoted_name(tbl, quote=True)
                    safe_col = quoted_name(col, quote=True)
                    conn.execute(text(
                        f"ALTER TABLE {safe_tbl} ALTER COLUMN {safe_col} TYPE INTEGER USING {safe_col}::integer"
                    ))

            print("✅ employees.id migration complete")

        # ── 2. Add missing columns to existing tables ─────────────────────────
        # timesheets.emp_grade — added to store employee grade at time of record
        _add_column_if_missing(conn, "timesheets", "emp_grade", "VARCHAR(5)")
        # employees.tax_mode — tax-handling mode (我方报税 / 供应商报税)
        _add_column_if_missing(conn, "employees", "tax_mode", "VARCHAR(50)")
        # suppliers.tax_handle — supplier tax-handling mode
        _add_column_if_missing(conn, "suppliers", "tax_handle", "VARCHAR(50)")

        print("✅ Schema migration complete")


def _add_column_if_missing(conn, table: str, column: str, col_type: str) -> None:
    """Add a column to a table if it doesn't already exist (PostgreSQL only)."""
    exists = conn.execute(text(
        "SELECT 1 FROM information_schema.columns "
        "WHERE table_name = :tbl AND column_name = :col"
    ), {"tbl": table, "col": column}).fetchone()
    if exists is None:
        # Check the table itself exists before trying to alter it
        tbl_exists = conn.execute(text(
            "SELECT 1 FROM information_schema.tables WHERE table_name = :tbl"
        ), {"tbl": table}).fetchone()
        if tbl_exists:
            safe_tbl = quoted_name(table, quote=True)
            safe_col = quoted_name(column, quote=True)
            conn.execute(text(f"ALTER TABLE {safe_tbl} ADD COLUMN IF NOT EXISTS {safe_col} {col_type}"))
            print(f"   added column {table}.{column} ({col_type})")


def init_db() -> None:
    """Create all tables (if not exist). Called at startup."""
    from backend.models import user, employee, supplier, warehouse, timesheet, container, clock, settlement, referral, commission, quotation, dispatch, message, integration  # noqa: F401
    _migrate_schema()
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
