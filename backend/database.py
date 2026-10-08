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
    url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    # Pin the psycopg2 driver explicitly: SQLAlchemy 2.1 changed the default
    # PostgreSQL driver to psycopg (v3), which is not installed.
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url

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
                    f"(e.g. 'YB-001').  Archiving incompatible tables for a clean V7 rebuild …"
                )
                _LEGACY_CHILD_TABLES = [
                    "commission_monthly",
                    "commission_records",
                    "referral_records",
                    "employee_settlements",
                    "clock_events",
                    "timesheets",
                ]
                for tbl in _LEGACY_CHILD_TABLES + ["employees"]:
                    _archive_table(conn, tbl)
                print("✅ Incompatible tables archived (*_legacy) — create_all() will rebuild with correct V7 schema")
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
        # employees.referrer_emp_id — self-referential FK for referral tracking
        _add_column_if_missing(conn, "employees", "referrer_emp_id", "INTEGER")
        # suppliers.tax_handle — supplier tax-handling mode
        _add_column_if_missing(conn, "suppliers", "tax_handle", "VARCHAR(50)")
        # users.pin — 4-digit PIN for worker clock-in login
        _add_column_if_missing(conn, "users", "pin", "VARCHAR(4)")
        # users.lang — user interface language preference
        _add_column_if_missing(conn, "users", "lang", "VARCHAR(5) DEFAULT 'zh'")
        # users.avatar_color — avatar display colour
        _add_column_if_missing(conn, "users", "avatar_color", "VARCHAR(20) DEFAULT '#4f6ef7'")
        # users.bound_biz_line — restrict user to a specific business line
        _add_column_if_missing(conn, "users", "bound_biz_line", "VARCHAR(10)")

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


def _archive_table(conn, table: str) -> None:
    """
    Rename an incompatible legacy table to <table>_legacy (keeping its data) so create_all()
    can build the current schema. Indexes and owned sequences are renamed too, because their
    names are schema-global in PostgreSQL and would clash with the new table's.
    """
    exists = conn.execute(text(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = :t"
    ), {"t": table}).fetchone()
    if not exists:
        return
    taken = {r[0] for r in conn.execute(text("SELECT relname FROM pg_class")).fetchall()}
    suffix, n = "_legacy", 1
    while f"{table}{suffix}" in taken:
        n += 1
        suffix = f"_legacy{n}"
    q = engine.dialect.identifier_preparer.quote
    seqs = [r[0] for r in conn.execute(text(
        "SELECT s.relname FROM pg_class s JOIN pg_depend d ON d.objid = s.oid "
        "JOIN pg_class t ON d.refobjid = t.oid WHERE s.relkind = 'S' AND t.relname = :t"
    ), {"t": table}).fetchall()]
    idxs = [r[0] for r in conn.execute(text(
        "SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = :t"
    ), {"t": table}).fetchall()]
    conn.execute(text(f"ALTER TABLE {q(table)} RENAME TO {q(table + suffix)}"))
    for name in idxs:
        conn.execute(text(f"ALTER INDEX {q(name)} RENAME TO {q((name + suffix)[:63])}"))
    for name in seqs:
        conn.execute(text(f"ALTER SEQUENCE {q(name)} RENAME TO {q((name + suffix)[:63])}"))
    print(f"   archived incompatible legacy table {table} → {table + suffix} (data kept)")


def _archive_incompatible_tables() -> None:
    """Archive existing tables whose integer primary key is stored as another type (e.g. TEXT ids)."""
    if _is_sqlite:
        return
    from sqlalchemy import Integer, inspect
    insp = inspect(engine)
    existing = set(insp.get_table_names())
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing:
                continue
            db_cols = {c["name"]: c for c in insp.get_columns(table.name)}
            for col in table.primary_key.columns:
                info = db_cols.get(col.name)
                if isinstance(col.type, Integer) and (info is None or "INT" not in str(info["type"]).upper()):
                    _archive_table(conn, table.name)
                    break


def _column_default_sql(col):
    """Server-side DEFAULT used when adding a missing column, so existing rows get a value."""
    from sqlalchemy import Boolean, Date, DateTime, Float, Integer, Numeric, String, Text
    d = col.default
    if d is not None and getattr(d, "is_scalar", False):
        v = d.arg
        if isinstance(v, bool):
            return ("1" if v else "0") if _is_sqlite else ("TRUE" if v else "FALSE")
        if isinstance(v, (int, float)):
            return repr(v)
        if isinstance(v, str):
            return "'" + v.replace("'", "''") + "'"
    if isinstance(col.type, DateTime) and d is not None:
        return "CURRENT_TIMESTAMP"
    if col.nullable:
        return None
    # NOT NULL without a scalar default: pick a neutral value so the column can be added to a populated table
    if isinstance(col.type, Boolean):
        return "0" if _is_sqlite else "FALSE"
    if isinstance(col.type, (Integer, Float, Numeric)):
        return "0"
    if isinstance(col.type, (String, Text)):
        return "''"
    if isinstance(col.type, DateTime):
        return "CURRENT_TIMESTAMP"
    if isinstance(col.type, Date):
        return "CURRENT_DATE"
    return None


def _sync_columns() -> None:
    """
    Bring tables created by older versions (or other tools) in line with the models:
      · add every model column that is missing (existing rows are back-filled with a default)
      · relax NOT NULL on leftover legacy columns the models don't know, so inserts don't fail
    Nothing is dropped or renamed; existing data is kept.
    """
    from sqlalchemy import inspect
    insp = inspect(engine)
    existing = set(insp.get_table_names())
    q = engine.dialect.identifier_preparer.quote
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if table.name not in existing:
                continue
            db_cols = {c["name"]: c for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in db_cols or col.primary_key:
                    continue
                ddl = f"ALTER TABLE {q(table.name)} ADD COLUMN {q(col.name)} {col.type.compile(dialect=engine.dialect)}"
                default = _column_default_sql(col)
                if default is not None:
                    ddl += f" DEFAULT {default}"
                conn.execute(text(ddl))
                print(f"   added missing column {table.name}.{col.name}")
            if _is_sqlite:
                continue  # SQLite cannot ALTER COLUMN; dev databases are always created fresh
            model_cols = {c.name for c in table.columns}
            for name, info in db_cols.items():
                if name not in model_cols and not info.get("nullable", True) and info.get("default") is None:
                    conn.execute(text(f"ALTER TABLE {q(table.name)} ALTER COLUMN {q(name)} DROP NOT NULL"))
                    print(f"   relaxed NOT NULL on legacy column {table.name}.{name}")


def init_db() -> None:
    """Create all tables (if not exist) and reconcile existing ones. Called at startup."""
    from backend.models import user, employee, supplier, warehouse, timesheet, container, clock, settlement, referral, commission, quotation, dispatch, message, integration, audit_log, operation, system_setting, personnel  # noqa: F401
    _migrate_schema()
    _archive_incompatible_tables()
    _sync_columns()
    Base.metadata.create_all(bind=engine)


def seed_data() -> None:
    """Seed default data (7 users, 5 suppliers, 10 warehouses)."""
    from backend.seed.init_data import run_seed
    db = SessionLocal()
    try:
        run_seed(db)
        db.commit()
        from backend.services import settings_store
        settings_store.load(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
