"""
渊博+579 HR V6 — Shared dependencies (token store, auth helpers, DB helpers)
"""
import hashlib, time, uuid
from fastapi import HTTPException, Request
import backend.database as database

# ── Token Store ──────────────────────────────────────────────────────
TOKENS: dict = {}


def make_token(username: str, role: str) -> str:
    return hashlib.sha256(
        f"{username}:{role}:{time.time()}:{uuid.uuid4()}".encode()
    ).hexdigest()


def get_user(request: Request) -> dict:
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if token not in TOKENS:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return TOKENS[token]


# ── DB Helpers ───────────────────────────────────────────────────────
def rows(conn, sql, params=()):
    return database.fetchall(conn, sql, params)


def one(conn, sql, params=()):
    return database.fetchone(conn, sql, params)


def auditlog(conn, user: dict, action: str, table: str, tid: str, detail: str = ""):
    database.execute(
        conn,
        "INSERT INTO audit_logs(username,user_display,action,target_table,target_id,detail) VALUES(?,?,?,?,?,?)",
        (
            user.get("username", ""),
            user.get("display_name", ""),
            action,
            table,
            tid,
            detail,
        ),
    )
