"""
Auth router: login, PIN login, logout
"""
import bcrypt as _bcrypt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import backend.database as database
from backend.deps import TOKENS, make_token, one

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginReq(BaseModel):
    username: str
    password: str


class PinReq(BaseModel):
    pin: str


@router.post("/login")
def login(req: LoginReq):
    db = database.get_db()
    u = one(db, "SELECT * FROM users WHERE username=? AND active=1", (req.username,))
    db.close()
    if not u or not _bcrypt.checkpw(
        req.password.encode(),
        u["password_hash"].encode() if isinstance(u["password_hash"], str) else u["password_hash"],
    ):
        raise HTTPException(401, "用户名或密码错误")
    token = make_token(u["username"], u["role"])
    user_info = {k: u[k] for k in ["username", "display_name", "role", "biz_line", "warehouse_code", "supplier_id"]}
    TOKENS[token] = user_info
    return {"token": token, "user": user_info}


@router.post("/pin")
def pin_login(req: PinReq):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE pin=? AND status='在职'", (req.pin,))
    db.close()
    if not emp:
        raise HTTPException(401, "PIN错误或员工不在职")
    token = make_token(f"w_{emp['id']}", "worker")
    user_info = {
        "username": f"w_{emp['id']}",
        "display_name": emp["name"],
        "role": "worker",
        "biz_line": emp["biz_line"],
        "warehouse_code": emp["warehouse_code"],
        "supplier_id": emp["supplier_id"],
        "_emp_id": emp["id"],
    }
    TOKENS[token] = user_info
    return {"token": token, "user": user_info}


@router.post("/logout")
def logout(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    TOKENS.pop(token, None)
    return {"ok": True}
