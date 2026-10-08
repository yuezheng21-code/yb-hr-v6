"""
渊博579 HR V7 — Seed Data
7 users + 8 suppliers + 10 warehouses

人员来源: desinn-warehouse-records skill (YUAN BO GmbH Arbeitszeitnachweis 工时单)
  - 周阳   : 小时工 (hourly), 579 业务线, Desinn仓主力
  - 志朋   : 供应商团队负责人, biz_line=579
  - Kamal  : 供应商团队负责人, biz_line=579 (剩余结算组)
  - 中国人组: 供应商团队, biz_line=渊博

仓库分组标记映射 (team_mark → supplier.code):
  "中"  / "中国" → SUP-006 (中国人组)
  "周"  / "阳"  / "周阳" → SUP-007 (周阳组)
  "周K" / "周L"           → SUP-007 (周阳子组, 归属周阳独立结算)
  "鹏"  / "志朋"           → SUP-003 (志朋组)
  ""   (无标记)            → SUP-005 (Kamal, 剩余结算)

Environment variables (all optional):
  ADMIN_PASSWORD    Override initial admin password (default: admin123)
  FORCE_RESEED      Set to "1" to reset all seed user passwords on startup
                    (only for development/test environments)
"""
from __future__ import annotations
import os
import bcrypt
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.models.user import User
from backend.models.supplier import Supplier
from backend.models.warehouse import Warehouse
from backend.models.employee import Employee
from backend.models.operation import OperationType


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


# Allow overriding the initial admin password via env var.
_ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")

USERS = [
    {"username": "admin",    "password": _ADMIN_PASSWORD, "display_name": "系统管理员",  "role": "admin"},
    {"username": "hr",       "password": "hr123",          "display_name": "HR王芳",       "role": "hr"},
    {"username": "finance",  "password": "fin123",         "display_name": "财务李梅",     "role": "fin"},
    {"username": "wh_una",   "password": "una123",         "display_name": "UNA仓管李强",  "role": "wh",  "bound_warehouse": "UNA"},
    {"username": "sup001",   "password": "sup123",         "display_name": "德信负责人",   "role": "sup"},
    {"username": "mgr",      "password": "mgr123",         "display_name": "运营经理陈杰", "role": "mgr"},
    {"username": "worker01", "password": "worker123",      "display_name": "张三",         "role": "worker", "pin": "1001"},
    # 周阳 — 小时工登录账号 (可用 PIN 打卡)
    {"username": "zhouyang", "password": "zy2026",         "display_name": "周阳",         "role": "worker", "pin": "1002"},
]

SUPPLIERS = [
    # ── 原有供应商 ────────────────────────────────────────────────────────────
    {"code": "SUP-001", "name": "德信人力",   "supplier_type": "labor", "biz_line": "渊博",
     "contact_person": "张总",  "phone": "+49-201-111111", "status": "active", "rating": "A"},
    {"code": "SUP-002", "name": "Yaro团队",  "supplier_type": "labor", "biz_line": "579",
     "contact_person": "Yaro",  "phone": "+49-201-222222", "status": "active", "rating": "B"},
    {"code": "SUP-003", "name": "志朋组",    "supplier_type": "labor", "biz_line": "579",
     "contact_person": "志朋",  "phone": "+49-201-303030", "status": "active", "rating": "B",
     "notes": "工时单标记: 鹏 / 志朋 → 本组。独立柜数结算。"},
    {"code": "SUP-004", "name": "Bobi团队", "supplier_type": "labor", "biz_line": "渊博",
     "contact_person": "Bobi",  "phone": "+49-201-444444", "status": "active", "rating": "C"},
    {"code": "SUP-005", "name": "Kamal分支", "supplier_type": "mixed", "biz_line": "579",
     "contact_person": "Kamal", "phone": "+49-201-555555", "status": "active", "rating": "B",
     "notes": "工时单剩余结算组: 无分组标记的柜全归本组。结算公式: Kamal = 主表总折算 − 各标记组合计。"},
    # ── 新增供应商 (来源: desinn-warehouse-records skill 工时单分组规则) ────────
    {"code": "SUP-006", "name": "中国人组",  "supplier_type": "labor", "biz_line": "渊博",
     "contact_person": "中国人组负责人", "phone": "", "status": "active", "rating": "B",
     "notes": "工时单标记: 中 / 中国 → 本组。"},
    {"code": "SUP-007", "name": "周阳组",   "supplier_type": "labor", "biz_line": "579",
     "contact_person": "周阳",  "phone": "+49-201-700700", "status": "active", "rating": "A",
     "notes": "工时单标记: 周 / 阳 / 周阳 → 本组。子分组 周K / 周L 归属本组独立结算。"},
    {"code": "SUP-008", "name": "Oldi团队", "supplier_type": "labor", "biz_line": "579",
     "contact_person": "Oldi",  "phone": "+49-201-333333", "status": "active", "rating": "B"},
]

WAREHOUSES = [
    # ── 鲁尔东 ────────────────────────────────────────────────────────────────
    {"code": "UNA", "name": "UNA仓 (Unna)",
     "zone": "鲁尔东", "biz_line": "渊博",
     "rate_hourly": 17.50, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,
     "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 150.0},
    {"code": "DHL", "name": "DHL仓 (Dortmund)",
     "zone": "鲁尔东", "biz_line": "渊博",
     "rate_hourly": 18.00, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,
     "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 150.0},
    {"code": "BOC", "name": "BOC仓 (Bochum)",
     "zone": "鲁尔东", "biz_line": "579",
     "rate_hourly": 17.00, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,
     "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    # ── 鲁尔西 ────────────────────────────────────────────────────────────────
    {"code": "BGK", "name": "BGK仓 (Bottrop)",
     "zone": "鲁尔西", "biz_line": "渊博",
     "rate_hourly": 17.50, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,
     "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "ESN", "name": "ESN仓 (Essen)",
     "zone": "鲁尔西", "biz_line": "渊博",
     "rate_hourly": 17.50, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,
     "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "DBG", "name": "DBG仓 (Duisburg)",
     "zone": "鲁尔西", "biz_line": "579",
     "rate_hourly": 17.00, "rate_load_20gp": 85.0,  "rate_unload_20gp": 75.0,
     "rate_load_40gp": 125.0, "rate_unload_40gp": 115.0, "rate_45hc": 145.0},
    {"code": "DUS", "name": "DUS仓 (Düsseldorf)",
     "zone": "鲁尔西", "biz_line": "渊博",
     "rate_hourly": 18.50, "rate_load_20gp": 95.0,  "rate_unload_20gp": 85.0,
     "rate_load_40gp": 135.0, "rate_unload_40gp": 125.0, "rate_45hc": 160.0},
    # ── 南部 ──────────────────────────────────────────────────────────────────
    {"code": "KLN", "name": "KLN仓 (Köln)",
     "zone": "南部", "biz_line": "渊博",
     "rate_hourly": 18.00, "rate_load_20gp": 90.0,  "rate_unload_20gp": 80.0,
     "rate_load_40gp": 130.0, "rate_unload_40gp": 120.0, "rate_45hc": 155.0},
    {"code": "WPT", "name": "WPT仓 (Wuppertal)",
     "zone": "南部", "biz_line": "579",
     "rate_hourly": 17.00, "rate_load_20gp": 82.0,  "rate_unload_20gp": 72.0,
     "rate_load_40gp": 122.0, "rate_unload_40gp": 112.0, "rate_45hc": 142.0},
    {"code": "MGL", "name": "MGL仓 (Mönchengladbach)",
     "zone": "南部", "biz_line": "579",
     "rate_hourly": 17.00, "rate_load_20gp": 82.0,  "rate_unload_20gp": 72.0,
     "rate_load_40gp": 122.0, "rate_unload_40gp": 112.0, "rate_45hc": 142.0},
]

# ── 员工种子 (来源: 工时单 hourly_workers + daily_attendance) ─────────────────
# 仅包含在 YUAN BO GmbH Arbeitszeitnachweis 中有 Start/End/Total 记录的小时工
# 其他日常到岗工人由 HR 在系统中手动录入
EMPLOYEES = [
    {
        "emp_no": "EMP-ZY-001",
        "name": "周阳",
        "source_type": "own",           # 渊博自有员工
        "biz_line": "579",
        "settlement_type": "hourly",
        "grade": "P2",
        "primary_warehouse": "DBG",     # 主仓: Duisburg (工时单最常出现)
        "position": "仓库主管",
        "languages": "zh",
        "status": "active",
        "notes": (
            "小时工, 每日单独记录 Start/End/Pause/Total。"
            "工时单标记 '周'/'阳'/'周阳' 均指本人所带团队(周阳组, SUP-007)。"
            "周K/周L 为其招募的子组, 独立结算但归属周阳管理。"
        ),
    },
]

# ── 分组标记→供应商代码 参考表 (供前端/结算模块使用) ────────────────────────────
# 同步自 desinn-warehouse-records skill 的 team_mapping
TEAM_MARK_TO_SUPPLIER = {
    "中":   "SUP-006",   # 中国人组
    "中国": "SUP-006",
    "周":   "SUP-007",   # 周阳组
    "阳":   "SUP-007",
    "周阳": "SUP-007",
    "周K":  "SUP-007",   # 周阳子组
    "周L":  "SUP-007",
    "鹏":   "SUP-003",   # 志朋组
    "志朋": "SUP-003",
    "":     "SUP-005",   # Kamal (剩余)
}


# ── 作业类型 (工效标准) ───────────────────────────────────────────────────────
# standard_uph = 每人每小时标准产量；以下为行业经验起始值，请按各仓实测（时间研究）调整。
# 卸/装柜的单位为「柜」，标准 UPH 为 柜/人时（例如 20GP 4人约 1.7h 完成 ≈ 0.15）。
OPERATION_TYPES = [
    {"code": "RECV",  "name": "收货/入库",   "name_de": "Wareneingang",     "category": "inbound",   "unit": "件", "standard_uph": 250,
     "keywords": "收货,入库,到货,inbound,receiv,wareneingang"},
    {"code": "PUT",   "name": "上架",        "name_de": "Einlagerung",      "category": "putaway",   "unit": "件", "standard_uph": 200,
     "keywords": "上架,putaway,einlager"},
    {"code": "PICK",  "name": "拣货",        "name_de": "Kommissionierung", "category": "picking",   "unit": "件", "standard_uph": 120,
     "keywords": "拣货,配货,拣选,pick,kommission"},
    {"code": "PACK",  "name": "打包/复核",   "name_de": "Verpackung",       "category": "packing",   "unit": "件", "standard_uph": 80,
     "keywords": "打包,包装,复核,称重,pack,verpack"},
    {"code": "LABEL", "name": "贴标/换标",   "name_de": "Etikettierung",    "category": "labeling",  "unit": "件", "standard_uph": 300,
     "keywords": "贴标,换标,label,etikett"},
    {"code": "OUT",   "name": "出库/装车交接", "name_de": "Warenausgang",    "category": "outbound",  "unit": "箱", "standard_uph": 60,
     "keywords": "出库,发货,交接,outbound,ship,warenausgang"},
    {"code": "RET",   "name": "退货处理",    "name_de": "Retourenbearbeitung", "category": "returns", "unit": "件", "standard_uph": 60,
     "keywords": "退货,退件,return,retour"},
    {"code": "INV",   "name": "盘点",        "name_de": "Inventur",         "category": "inventory", "unit": "件", "standard_uph": 400,
     "keywords": "盘点,inventur,inventory,count"},
    {"code": "AMZ_FBA", "name": "Amazon FBA 备货(贴FNSKU/装箱)", "name_de": "FBA-Vorbereitung", "category": "labeling",
     "unit": "件", "client": "Amazon", "standard_uph": 150, "keywords": "fba,fnsku,备货"},
    {"code": "TEMU_SORT", "name": "TEMU 分拣打包", "name_de": "TEMU Sortierung", "category": "packing",
     "unit": "件", "client": "TEMU", "standard_uph": 150, "keywords": "temu,分拣"},
    {"code": "CNT_U20",  "name": "卸柜 20GP", "name_de": "Entladung 20'",  "category": "container", "unit": "柜", "standard_uph": 0.15},
    {"code": "CNT_U40",  "name": "卸柜 40GP/HC", "name_de": "Entladung 40'", "category": "container", "unit": "柜", "standard_uph": 0.08},
    {"code": "CNT_U45",  "name": "卸柜 45HC", "name_de": "Entladung 45'",  "category": "container", "unit": "柜", "standard_uph": 0.07},
    {"code": "CNT_ULKW", "name": "卸货 LKW",  "name_de": "Entladung LKW",  "category": "container", "unit": "柜", "standard_uph": 0.25},
    {"code": "CNT_L20",  "name": "装柜 20GP", "name_de": "Beladung 20'",   "category": "container", "unit": "柜", "standard_uph": 0.15},
    {"code": "CNT_L40",  "name": "装柜 40GP/HC", "name_de": "Beladung 40'", "category": "container", "unit": "柜", "standard_uph": 0.08},
    {"code": "CNT_L45",  "name": "装柜 45HC", "name_de": "Beladung 45'",   "category": "container", "unit": "柜", "standard_uph": 0.07},
    {"code": "CNT_LLKW", "name": "装货 LKW",  "name_de": "Beladung LKW",   "category": "container", "unit": "柜", "standard_uph": 0.25},
    {"code": "PROJ",  "name": "项目作业(计时)", "name_de": "Projektarbeit", "category": "project", "unit": "小时", "standard_uph": 0,
     "keywords": "项目,project,projekt"},
]


def run_seed(db: Session) -> None:
    force_reseed = os.environ.get("FORCE_RESEED", "").strip() == "1"

    # ── Users ────────────────────────────────────────────────────────────────
    for u in USERS:
        existing = db.scalar(select(User).where(User.username == u["username"]))
        if existing is None:
            pw_hash = _hash(u["password"])
            user = User(
                username=u["username"],
                password_hash=pw_hash,
                display_name=u["display_name"],
                role=u["role"],
                bound_warehouse=u.get("bound_warehouse"),
                pin=u.get("pin"),
            )
            db.add(user)
        else:
            # Accounts left over from an older schema may lack a password hash / role / name
            # (columns were just added by the migration). Repair them so they can log in.
            if force_reseed or not existing.password_hash:
                existing.password_hash = _hash(u["password"])
                existing.is_active = True
                existing.role = u["role"]
            if not existing.display_name:
                existing.display_name = u["display_name"]
            if u["username"] == "admin" and existing.role != "admin":
                existing.role = "admin"
            if existing.is_active is None:
                existing.is_active = True
            if u.get("bound_warehouse") and not existing.bound_warehouse:
                existing.bound_warehouse = u["bound_warehouse"]
            if u.get("pin") and not existing.pin:
                existing.pin = u["pin"]

    # ── Suppliers ────────────────────────────────────────────────────────────
    for s in SUPPLIERS:
        existing = db.scalar(select(Supplier).where(Supplier.code == s["code"]))
        if existing is None:
            # Only pass fields that exist on the Supplier model
            sup_fields = {k: v for k, v in s.items()
                          if k in ("code", "name", "supplier_type", "biz_line",
                                   "contact_person", "phone", "status", "rating", "notes")}
            sup = Supplier(**sup_fields)
            db.add(sup)

    # ── Warehouses ───────────────────────────────────────────────────────────
    for w in WAREHOUSES:
        existing = db.scalar(select(Warehouse).where(Warehouse.code == w["code"]))
        if existing is None:
            wh = Warehouse(**w)
            db.add(wh)

    # ── Employees ────────────────────────────────────────────────────────────
    for e in EMPLOYEES:
        existing = db.scalar(select(Employee).where(Employee.emp_no == e["emp_no"]))
        if existing is None:
            emp = Employee(**e)
            db.add(emp)

    # ── Operation types ─────────────────────────────────────────────────────
    for t in OPERATION_TYPES:
        if db.scalar(select(OperationType).where(OperationType.code == t["code"])) is None:
            db.add(OperationType(**t))
