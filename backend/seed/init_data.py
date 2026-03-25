"""
渊博579 HR V7 — Seed Data
7 users + 5 suppliers + 10 warehouses
"""
from __future__ import annotations
import bcrypt
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models.user import User
from backend.models.supplier import Supplier
from backend.models.warehouse import Warehouse


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


USERS = [
    {"username": "admin",    "password": "admin123",  "display_name": "系统管理员",   "role": "admin"},
    {"username": "hr",       "password": "hr123",     "display_name": "HR王芳",        "role": "hr"},
    {"username": "finance",  "password": "fin123",    "display_name": "财务李梅",      "role": "fin"},
    {"username": "wh_una",   "password": "una123",    "display_name": "UNA仓管李强",   "role": "wh",  "bound_warehouse": "UNA"},
    {"username": "sup001",   "password": "sup123",    "display_name": "德信负责人",    "role": "sup"},
    {"username": "mgr",      "password": "mgr123",    "display_name": "运营经理陈杰",  "role": "mgr"},
    {"username": "worker01", "password": "worker123", "display_name": "张三",          "role": "worker"},
]

SUPPLIERS = [
    {"code": "SUP-001", "name": "德信人力",  "supplier_type": "labor", "biz_line": "渊博", "contact_person": "张总", "phone": "+49-201-111111", "status": "active", "rating": "A"},
    {"code": "SUP-002", "name": "Yaro团队", "supplier_type": "labor", "biz_line": "579",  "contact_person": "Yaro", "phone": "+49-201-222222", "status": "active", "rating": "B"},
    {"code": "SUP-003", "name": "Oldi团队", "supplier_type": "labor", "biz_line": "579",  "contact_person": "Oldi", "phone": "+49-201-333333", "status": "active", "rating": "B"},
    {"code": "SUP-004", "name": "Bobi团队", "supplier_type": "labor", "biz_line": "渊博", "contact_person": "Bobi", "phone": "+49-201-444444", "status": "active", "rating": "C"},
    {"code": "SUP-005", "name": "Kamal分支","supplier_type": "mixed", "biz_line": "579",  "contact_person": "Kamal","phone": "+49-201-555555", "status": "active", "rating": "B"},
]

WAREHOUSES = [
    {"code": "UNA", "name": "UNA仓 (Unna)",        "zone": "鲁尔东", "biz_line": "渊博", "rate_hourly": 17.50, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,  "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 150.0},
    {"code": "DHL", "name": "DHL仓 (Dortmund)",    "zone": "鲁尔东", "biz_line": "渊博", "rate_hourly": 18.00, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,  "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 150.0},
    {"code": "BGK", "name": "BGK仓 (Bottrop)",     "zone": "鲁尔西", "biz_line": "渊博", "rate_hourly": 17.50, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,  "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "ESN", "name": "ESN仓 (Essen)",       "zone": "鲁尔西", "biz_line": "渊博", "rate_hourly": 17.50, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,  "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "DBG", "name": "DBG仓 (Duisburg)",    "zone": "鲁尔西", "biz_line": "579",  "rate_hourly": 17.00, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,  "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "BOC", "name": "BOC仓 (Bochum)",      "zone": "鲁尔东", "biz_line": "579",  "rate_hourly": 17.00, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,  "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "KLN", "name": "KLN仓 (Köln)",        "zone": "南部",   "biz_line": "渊博", "rate_hourly": 18.00, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,  "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 155.0},
    {"code": "DUS", "name": "DUS仓 (Düsseldorf)",  "zone": "鲁尔西", "biz_line": "渊博", "rate_hourly": 18.50, "rate_load_20gp": 95.0,  "rate_unload_20gp": 85.0,  "rate_load_40gp": 135.0, "rate_unload_40gp": 125.0, "rate_45hc": 160.0},
    {"code": "WPT", "name": "WPT仓 (Wuppertal)",   "zone": "南部",   "biz_line": "579",  "rate_hourly": 17.00, "rate_load_20gp": 82.0,  "rate_unload_20gp": 72.0,  "rate_load_40gp": 122.0, "rate_unload_40gp": 112.0, "rate_45hc": 142.0},
    {"code": "MGL", "name": "MGL仓 (Mönchengladbach)", "zone": "南部", "biz_line": "579", "rate_hourly": 17.00, "rate_load_20gp": 82.0, "rate_unload_20gp": 72.0, "rate_load_40gp": 122.0, "rate_unload_40gp": 112.0, "rate_45hc": 142.0},
]


def run_seed(db: Session) -> None:
    # Seed users
    for u in USERS:
        existing = db.scalar(select(User).where(User.username == u["username"]))
        if existing is None:
            user = User(
                username=u["username"],
                password_hash=_hash(u["password"]),
                display_name=u["display_name"],
                role=u["role"],
                bound_warehouse=u.get("bound_warehouse"),
            )
            db.add(user)
        else:
            existing.password_hash = _hash(u["password"])
            existing.is_active = True

    # Seed suppliers
    for s in SUPPLIERS:
        existing = db.scalar(select(Supplier).where(Supplier.code == s["code"]))
        if existing is None:
            sup = Supplier(**s)
            db.add(sup)

    # Seed warehouses
    for w in WAREHOUSES:
        existing = db.scalar(select(Warehouse).where(Warehouse.code == w["code"]))
        if existing is None:
            wh = Warehouse(**w)
            db.add(wh)
