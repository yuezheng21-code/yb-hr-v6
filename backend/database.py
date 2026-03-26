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
        # Check if employees.id is TEXT/VARCHAR instead of INTEGER.
        # This happened when an older schema version created the table with a text PK.
        row = conn.execute(text(
            "SELECT data_type FROM information_schema.columns "
            "WHERE table_name='employees' AND column_name='id'"
        )).fetchone()
        if row is None or row[0].lower() in ("integer", "bigint", "smallint"):
            return  # employees table missing or already correct

        print(f"⚠  employees.id is '{row[0]}' — checking data before migration …")

        # Guard: if any existing id values are non-numeric (e.g. "YB-001") they
        # cannot be cast to INTEGER.  The old schema is fundamentally incompatible
        # with V7, so drop employees and every table that depends on it via
        # foreign keys, then return.  create_all() will recreate them all with
        # the correct V7 schema, and seed data is re-applied on the same startup.
        non_numeric_count = conn.execute(text(
            "SELECT COUNT(*) FROM employees WHERE id IS NOT NULL AND id !~ '^[0-9]+$'"
        )).scalar() or 0

        if non_numeric_count > 0:
            print(
                f"⚠  employees.id has {non_numeric_count} non-castable value(s) "
                f"(e.g. 'YB-001').  Dropping incompatible tables for a clean V7 rebuild …"
            )
            # Drop dependent child tables first so their own schemas are also
            # recreated cleanly by create_all() (they may have TEXT employee_id
            # columns from the old deployment).
            # NOTE: this list mirrors the child_columns list used in the numeric-cast
            # branch below; update both if new employee-dependent tables are added.
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
            return

        print(f"⚠  employees.id is '{row[0]}' — migrating numeric values to INTEGER …")

        # Drop dependent foreign-key constraints on other tables before altering.
        # We only drop constraints that reference employees(id); the tables themselves stay.
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

        # Convert employees.id column from TEXT to INTEGER.
        conn.execute(text(
            "ALTER TABLE employees ALTER COLUMN id TYPE INTEGER USING id::integer"
        ))

        # Re-create the sequence / default for the PK if needed (SERIAL equivalent).
        seq_exists = conn.execute(text(
            "SELECT 1 FROM pg_sequences WHERE schemaname='public' AND sequencename='employees_id_seq'"
        )).fetchone()
        if not seq_exists:
            conn.execute(text("CREATE SEQUENCE IF NOT EXISTS employees_id_seq OWNED BY employees.id"))
            conn.execute(text(
                "SELECT setval('employees_id_seq', COALESCE((SELECT MAX(id) FROM employees), 0) + 1, false)"
            ))
            conn.execute(text("ALTER TABLE employees ALTER COLUMN id SET DEFAULT nextval('employees_id_seq')"))

        # Also fix employee_id (or equivalent) columns in child tables that were created as TEXT.
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

        print("✅ Schema migration complete")


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
