"""
渊博+579 HR V6 — FastAPI Backend
PostgreSQL (Railway) / SQLite (本地开发) 自动切换
"""
import os, json, uuid, hashlib, time, threading
from contextlib import asynccontextmanager
from datetime import datetime, date, timedelta
from fastapi import FastAPI, HTTPException, Depends, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bcrypt as _bcrypt
import database

# ── Startup readiness flag ────────────────────────────────────────────
# Set to True once DB wait + init_db + seed_data all complete.
_db_lock = threading.Lock()
_db_ready = False
_db_error: str = ""
_db_status: str = "starting"

# Max attempts × (connect_timeout=5s + sleep=3s) = ~240s, safely within
# Railway's healthcheckTimeout of 300s.
_MAX_DB_ATTEMPTS = 30

def _init_db_background():
    """Run DB wait → init_db → seed_data in a background thread so uvicorn
    can start immediately and respond to Railway health checks."""
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
                    conn = psycopg2.connect(url, connect_timeout=5)
                    conn.close()
                    print(f"✅ Database reachable (attempt {attempt + 1})")
                    break
                except Exception as exc:
                    print(f"⚠  DB not ready (attempt {attempt + 1}/{_MAX_DB_ATTEMPTS}): {exc}")
                    time.sleep(3)
            else:
                with _db_lock:
                    _db_error = "Database unavailable after 30 attempts"
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
        print("🚀 Application fully ready")
    except Exception as exc:
        with _db_lock:
            _db_error = str(exc)
            _db_status = str(exc)
        print(f"❌ Startup error: {exc}")

# ── Lifespan ─────────────────────────────────────────────────────────
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

# ── App ──────────────────────────────────────────────────────────────
app = FastAPI(title="渊博+579 HR V6", version="6.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# ── Token Store ──────────────────────────────────────────────────────
TOKENS: dict = {}

def make_token(username: str, role: str) -> str:
    return hashlib.sha256(f"{username}:{role}:{time.time()}:{uuid.uuid4()}".encode()).hexdigest()

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
    database.execute(conn,
        "INSERT INTO audit_logs(username,user_display,action,target_table,target_id,detail) VALUES(?,?,?,?,?,?)",
        (user.get("username",""), user.get("display_name",""), action, table, tid, detail))

# ══════════════════════════════════════════
# HEALTH
# ══════════════════════════════════════════
@app.get("/health")
def health():
    with _db_lock:
        ready = _db_ready
        status = _db_status
    if not ready:
        return JSONResponse(
            status_code=503,
            headers={"Retry-After": "5"},
            content={"status": status, "version": "6.0.0"},
        )
    return {"status": "ok", "version": "6.0.0", "time": datetime.now().isoformat()}

# ══════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════
class LoginReq(BaseModel):
    username: str
    password: str

class PinReq(BaseModel):
    pin: str

@app.post("/api/auth/login")
def login(req: LoginReq):
    db = database.get_db()
    u = one(db, "SELECT * FROM users WHERE username=? AND active=1", (req.username,))
    db.close()
    if not u or not _bcrypt.checkpw(req.password.encode(), u["password_hash"].encode() if isinstance(u["password_hash"], str) else u["password_hash"]):
        raise HTTPException(401, "用户名或密码错误")
    token = make_token(u["username"], u["role"])
    user_info = {k: u[k] for k in ["username","display_name","role","biz_line","warehouse_code","supplier_id"]}
    TOKENS[token] = user_info
    return {"token": token, "user": user_info}

@app.post("/api/auth/pin")
def pin_login(req: PinReq):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE pin=? AND status='在职'", (req.pin,))
    db.close()
    if not emp:
        raise HTTPException(401, "PIN错误或员工不在职")
    token = make_token(f"w_{emp['id']}", "worker")
    user_info = {"username": f"w_{emp['id']}", "display_name": emp["name"],
                 "role": "worker", "biz_line": emp["biz_line"],
                 "warehouse_code": emp["warehouse_code"], "supplier_id": emp["supplier_id"],
                 "_emp_id": emp["id"]}
    TOKENS[token] = user_info
    return {"token": token, "user": user_info}

@app.post("/api/auth/logout")
def logout(request: Request):
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    TOKENS.pop(token, None)
    return {"ok": True}

# ══════════════════════════════════════════
# ANALYTICS
# ══════════════════════════════════════════
@app.get("/api/analytics/dashboard")
def dashboard(u: dict = Depends(get_user)):
    db = database.get_db()
    wf = f"AND warehouse_code='{u['warehouse_code']}'" if u.get("warehouse_code") else ""
    bf = f"AND biz_line='{u['biz_line']}'" if u.get("biz_line") and u["role"] not in ("admin","hr","fin") else ""
    sf = f"AND supplier_id='{u['supplier_id']}'" if u.get("supplier_id") else ""

    emp_count = one(db, f"SELECT COUNT(*) as c FROM employees WHERE status='在职' {bf} {sf}")["c"]
    ts_pending = one(db, f"SELECT COUNT(*) as c FROM timesheets WHERE status IN ('待仓库审批','待财务确认') {wf}")["c"]
    ts_hrs = one(db, f"SELECT COALESCE(SUM(hours),0) as h FROM timesheets {('WHERE '+wf.strip('AND ')) if wf else ''}")["h"]
    abm_active = one(db, "SELECT COUNT(*) as c FROM abmahnungen WHERE status='有效'")["c"]
    zk_alerts = one(db, "SELECT COUNT(*) as c FROM zeitkonto WHERE plus_hours > 150")["c"]
    wv_active = one(db, "SELECT COUNT(*) as c FROM wv_projects WHERE closed=0")["c"]
    daily = rows(db, f"SELECT work_date, ROUND(SUM(hours),1) as total_hours FROM timesheets WHERE work_date >= CURRENT_DATE - INTERVAL '7 days' {bf} {sf} GROUP BY work_date ORDER BY work_date" if database.DATABASE_URL else f"SELECT work_date, ROUND(SUM(hours),1) as total_hours FROM timesheets WHERE work_date >= date('now','-7 days') {bf} {sf} GROUP BY work_date ORDER BY work_date")
    db.close()
    return {"employee_count": emp_count, "ts_pending": ts_pending, "ts_total_hours": round(float(ts_hrs), 1),
            "abmahnung_active": abm_active, "zeitkonto_alerts": zk_alerts,
            "wv_active_projects": wv_active, "daily_hours": daily}

# ══════════════════════════════════════════
# EMPLOYEES
# ══════════════════════════════════════════
@app.get("/api/employees")
def list_employees(u: dict = Depends(get_user), search: str = "", status: str = "",
                   warehouse: str = "", biz: str = "", source: str = ""):
    db = database.get_db()
    conds = ["1=1"]; params = []
    if u.get("supplier_id"): conds.append("supplier_id=?"); params.append(u["supplier_id"])
    if u.get("biz_line") and u["role"] not in ("admin","hr","fin"): conds.append("biz_line=?"); params.append(u["biz_line"])
    if u.get("warehouse_code") and u["role"] == "wh": conds.append("warehouse_code=?"); params.append(u["warehouse_code"])
    if search: conds.append("(name LIKE ? OR id LIKE ? OR phone LIKE ?)"); params += [f"%{search}%"]*3
    if status: conds.append("status=?"); params.append(status)
    if warehouse: conds.append("warehouse_code=?"); params.append(warehouse)
    if biz: conds.append("biz_line=?"); params.append(biz)
    if source: conds.append("source=?"); params.append(source)
    result = rows(db, f"SELECT * FROM employees WHERE {' AND '.join(conds)} ORDER BY id", params)
    db.close(); return result

@app.post("/api/employees")
def create_employee(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    biz = data.get("biz_line","渊博"); prefix = "YB" if biz == "渊博" else "W5"
    existing = [r["id"] for r in rows(db, f"SELECT id FROM employees WHERE id LIKE '{prefix}-%'")]
    nums = [int(x.split("-")[1]) for x in existing if len(x.split("-"))>1 and x.split("-")[1].isdigit()]
    emp_id = f"{prefix}-{max(nums,default=0)+1:03d}"
    data["id"] = emp_id
    cols = ",".join(data.keys()); phs = ",".join(["?"]*len(data))
    database.execute(db, f"INSERT INTO employees({cols}) VALUES({phs})", list(data.values()))
    database.execute(db, "INSERT INTO zeitkonto(employee_id,employee_name) VALUES(?,?) ON CONFLICT(employee_id) DO NOTHING" if database.DATABASE_URL else "INSERT OR IGNORE INTO zeitkonto(employee_id,employee_name) VALUES(?,?)", (emp_id, data.get("name","")))
    auditlog(db, u, "CREATE", "employees", emp_id, data.get("name",""))
    database.commit(db); db.close(); return {"id": emp_id}

@app.put("/api/employees/{emp_id}")
def update_employee(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    data.pop("id", None)
    db = database.get_db()
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE employees SET {sets} WHERE id=?", list(data.values())+[emp_id])
    auditlog(db, u, "UPDATE", "employees", emp_id)
    database.commit(db); db.close(); return {"ok": True}

@app.delete("/api/employees/{emp_id}")
def delete_employee(emp_id: str, u: dict = Depends(get_user)):
    if u["role"] != "admin": raise HTTPException(403)
    db = database.get_db()
    database.execute(db, "UPDATE employees SET status='离职' WHERE id=?", (emp_id,))
    auditlog(db, u, "DEACTIVATE", "employees", emp_id)
    database.commit(db); db.close(); return {"ok": True}

# ══════════════════════════════════════════
# TIMESHEETS
# ══════════════════════════════════════════
@app.get("/api/timesheets")
def list_timesheets(u: dict = Depends(get_user), date_from: str = "", date_to: str = "",
                    status: str = "", warehouse: str = "", employee_id: str = ""):
    db = database.get_db()
    conds = ["1=1"]; params = []
    if u.get("supplier_id"): conds.append("supplier_id=?"); params.append(u["supplier_id"])
    if u.get("warehouse_code") and u["role"]=="wh": conds.append("warehouse_code=?"); params.append(u["warehouse_code"])
    if u.get("biz_line") and u["role"] not in ("admin","hr","fin"): conds.append("biz_line=?"); params.append(u["biz_line"])
    if u.get("_emp_id"): conds.append("employee_id=?"); params.append(u["_emp_id"])
    if date_from: conds.append("work_date>=?"); params.append(date_from)
    if date_to: conds.append("work_date<=?"); params.append(date_to)
    if status: conds.append("status=?"); params.append(status)
    if warehouse: conds.append("warehouse_code=?"); params.append(warehouse)
    if employee_id: conds.append("employee_id=?"); params.append(employee_id)
    result = rows(db, f"SELECT * FROM timesheets WHERE {' AND '.join(conds)} ORDER BY work_date DESC,id DESC LIMIT 500", params)
    db.close(); return result

@app.post("/api/timesheets")
def create_timesheet(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (data.get("employee_id",""),))
    if not emp: raise HTTPException(404, "员工不存在")
    sh = int(data.get("start_time","08:00").split(":")[0])
    eh = int(data.get("end_time","16:00").split(":")[0])
    hrs = max(0, eh - sh)
    wh_code = data.get("warehouse_code") or emp["warehouse_code"]
    shift = data.get("shift","白班")
    pay = database.calc_timesheet_pay(db, dict(emp), wh_code, shift, hrs)
    ts_id = f"WT-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    database.execute(db, """INSERT INTO timesheets(id,employee_id,employee_name,source,supplier_id,biz_line,
        work_date,warehouse_code,shift,start_time,end_time,hours,position,settlement_type,grade,
        base_rate,shift_bonus,effective_rate,gross_pay,perf_bonus,ssi_deduct,tax_deduct,net_pay,status)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (ts_id,emp["id"],emp["name"],emp["source"],emp["supplier_id"],emp["biz_line"],
         data.get("work_date",str(date.today())),wh_code,shift,
         data.get("start_time","08:00"),data.get("end_time","16:00"),hrs,
         emp["position"],emp["settlement_type"],emp["grade"],
         pay["base_rate"],pay["shift_bonus"],pay["effective_rate"],
         pay["gross_pay"],pay["perf_bonus"],pay["ssi_deduct"],pay["tax_deduct"],pay["net_pay"],"待仓库审批"))
    overtime = max(0, hrs - float(emp.get("contract_hours") or 8))
    if overtime > 0:
        database.execute(db, "UPDATE zeitkonto SET plus_hours=ROUND(CAST(plus_hours+? AS NUMERIC),1) WHERE employee_id=?", (overtime, emp["id"]))
    auditlog(db, u, "CREATE", "timesheets", ts_id, f"{emp['name']} {hrs}h")
    database.commit(db); db.close()
    return {"id": ts_id, "hours": hrs, "gross_pay": pay["gross_pay"]}

@app.put("/api/timesheets/{ts_id}/approve")
def approve_timesheet(ts_id: str, u: dict = Depends(get_user)):
    db = database.get_db()
    ts = one(db, "SELECT * FROM timesheets WHERE id=?", (ts_id,))
    if not ts: raise HTTPException(404)
    now = datetime.now().isoformat()
    if ts["status"] == "待仓库审批" and u["role"] in ("admin","wh","mgr"):
        database.execute(db, "UPDATE timesheets SET status='待财务确认',wh_approver=?,wh_approved_at=? WHERE id=?", (u["display_name"],now,ts_id))
    elif ts["status"] == "待财务确认" and u["role"] in ("admin","fin"):
        database.execute(db, "UPDATE timesheets SET status='已入账',fin_approver=?,fin_approved_at=? WHERE id=?", (u["display_name"],now,ts_id))
    else:
        raise HTTPException(400, "状态错误或无权限")
    auditlog(db, u, "APPROVE", "timesheets", ts_id)
    database.commit(db); db.close(); return {"ok": True}

@app.put("/api/timesheets/batch-approve")
def batch_approve(data: dict = Body(...), u: dict = Depends(get_user)):
    for ts_id in data.get("ids", []):
        try: approve_timesheet(ts_id, u)
        except: pass
    return {"ok": True}

# ══════════════════════════════════════════
# ZEITKONTO
# ══════════════════════════════════════════
@app.get("/api/zeitkonto")
def list_zeitkonto(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, """SELECT z.*, e.warehouse_code, e.position, e.grade, e.biz_line,
        (SELECT COALESCE(MAX(hours),0) FROM timesheets t WHERE t.employee_id=z.employee_id) as daily_max
        FROM zeitkonto z LEFT JOIN employees e ON e.id=z.employee_id
        WHERE e.status='在职' ORDER BY z.plus_hours DESC""")
    db.close(); return result

@app.post("/api/zeitkonto/{emp_id}/log")
def add_zk_log(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    hrs = float(data.get("hours",0)); entry_type = data.get("entry_type","plus")
    database.execute(db, "INSERT INTO zeitkonto_logs(employee_id,log_date,entry_type,hours,reason,approved_by) VALUES(?,?,?,?,?,?)",
        (emp_id, data.get("log_date",str(date.today())), entry_type, hrs, data.get("reason",""), u["display_name"]))
    col = "plus_hours" if entry_type == "plus" else "minus_hours"
    database.execute(db, f"UPDATE zeitkonto SET {col}=ROUND(CAST({col}+? AS NUMERIC),1) WHERE employee_id=?", (hrs, emp_id))
    auditlog(db, u, "ZK_LOG", "zeitkonto", emp_id, f"{entry_type} {hrs}h")
    database.commit(db); db.close(); return {"ok": True}

@app.get("/api/zeitkonto/{emp_id}/logs")
def get_zk_logs(emp_id: str, u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM zeitkonto_logs WHERE employee_id=? ORDER BY created_at DESC LIMIT 100", (emp_id,))
    db.close(); return result

@app.put("/api/zeitkonto/{emp_id}/freizeitausgleich")
def freizeitausgleich(emp_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    hrs = float(data.get("hours",0))
    db = database.get_db()
    database.execute(db, "UPDATE zeitkonto SET plus_hours=GREATEST(0,ROUND(CAST(plus_hours-? AS NUMERIC),1)) WHERE employee_id=?" if database.DATABASE_URL else "UPDATE zeitkonto SET plus_hours=MAX(0,ROUND(CAST(plus_hours-? AS NUMERIC),1)) WHERE employee_id=?", (hrs, emp_id))
    database.execute(db, "INSERT INTO zeitkonto_logs(employee_id,log_date,entry_type,hours,reason,approved_by) VALUES(?,?,?,?,?,?)",
        (emp_id, str(date.today()), "freizeitausgleich", hrs, "Freizeitausgleich", u["display_name"]))
    database.commit(db); db.close(); return {"ok": True}

# ══════════════════════════════════════════
# ABMAHNUNG
# ══════════════════════════════════════════
@app.get("/api/abmahnungen")
def list_abmahnungen(u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    result = rows(db, "SELECT * FROM abmahnungen ORDER BY issued_date DESC")
    emp_counts = {}
    for a in result:
        if a["status"] == "有效": emp_counts[a["employee_id"]] = emp_counts.get(a["employee_id"],0)+1
    for a in result: a["_valid_count"] = emp_counts.get(a["employee_id"],0)
    db.close(); return result

@app.post("/api/abmahnungen")
def create_abmahnung(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (data.get("employee_id",""),))
    if not emp: raise HTTPException(404)
    issued = data.get("issued_date", str(date.today()))
    expiry = str((datetime.strptime(issued,"%Y-%m-%d") + timedelta(days=730)).date())
    abm_id = f"ABM-{emp['id']}-{date.today().strftime('%Y')}-{uuid.uuid4().hex[:4].upper()}"
    database.execute(db, """INSERT INTO abmahnungen(id,employee_id,employee_name,abmahnung_type,incident_date,
        issued_date,issued_by,incident_description,internal_notes,status,expiry_date,delivery_method)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?)""",
        (abm_id,emp["id"],emp["name"],data.get("abmahnung_type","旷工"),
         data.get("incident_date",issued),issued,data.get("issued_by",u["display_name"]),
         data.get("incident_description",""),data.get("internal_notes",""),"有效",expiry,data.get("delivery_method","面交")))
    auditlog(db, u, "CREATE_ABM", "abmahnungen", abm_id)
    database.commit(db); db.close(); return {"id": abm_id, "expiry_date": expiry}

@app.put("/api/abmahnungen/{abm_id}/revoke")
def revoke_abmahnung(abm_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr"): raise HTTPException(403)
    db = database.get_db()
    database.execute(db, "UPDATE abmahnungen SET status='已撤销',revoked_at=?,revoked_by=?,revoke_reason=? WHERE id=?",
        (datetime.now().isoformat(), u["display_name"], data.get("reason",""), abm_id))
    database.commit(db); db.close(); return {"ok": True}

# ══════════════════════════════════════════
# WERKVERTRAG
# ══════════════════════════════════════════
@app.get("/api/werkvertrag")
def list_wv(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM wv_projects ORDER BY created_at DESC")
    for p in result:
        if isinstance(p.get("cost_data"), str): p["cost_data"] = json.loads(p["cost_data"] or "{}")
        if isinstance(p.get("comp_data"), str): p["comp_data"] = json.loads(p["comp_data"] or "{}")
    db.close(); return result

@app.post("/api/werkvertrag")
def create_wv(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    wv_id = f"WV-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    cost_default = json.dumps({"workers":[{"label":"P1-P2","rate":13.9,"count":5,"hoursDay":8,"days":20}],"soc":21,"hol":8,"mgmt":18,"equip":0,"travel":0,"overhead":5,"margin":15})
    database.execute(db, """INSERT INTO wv_projects(id,name,client,address,service_type,region,project_manager,
        start_date,end_date,description,phase,cost_data,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,0,?,?)""",
        (wv_id,data.get("name",""),data.get("client",""),data.get("address",""),
         data.get("service_type",""),data.get("region",""),data.get("project_manager",""),
         data.get("start_date",""),data.get("end_date",""),data.get("description",""),
         cost_default,u["display_name"]))
    auditlog(db, u, "CREATE_WV", "wv_projects", wv_id)
    database.commit(db); db.close(); return {"id": wv_id}

@app.put("/api/werkvertrag/{wv_id}")
def update_wv(wv_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr","mgr"): raise HTTPException(403)
    db = database.get_db()
    if "cost_data" in data and isinstance(data["cost_data"], dict): data["cost_data"] = json.dumps(data["cost_data"])
    if "comp_data" in data and isinstance(data["comp_data"], dict): data["comp_data"] = json.dumps(data["comp_data"])
    data.pop("id",None)
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE wv_projects SET {sets} WHERE id=?", list(data.values())+[wv_id])
    database.commit(db); db.close(); return {"ok": True}

# ══════════════════════════════════════════
# CONTAINERS
# ══════════════════════════════════════════
@app.get("/api/containers")
def list_containers(u: dict = Depends(get_user)):
    db = database.get_db()
    conds = ["1=1"]; params = []
    if u.get("warehouse_code") and u["role"]=="wh": conds.append("warehouse_code=?"); params.append(u["warehouse_code"])
    result = rows(db, f"SELECT * FROM containers WHERE {' AND '.join(conds)} ORDER BY work_date DESC,id DESC LIMIT 200", params)
    db.close(); return result

@app.post("/api/containers")
def create_container(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    ct_id = f"CT-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    workers = data.get("worker_ids",[])
    database.execute(db, """INSERT INTO containers(id,container_no,container_type,load_type,warehouse_code,biz_line,
        work_date,start_time,seal_no,worker_ids,worker_count,client_revenue,team_pay,split_method,status,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (ct_id,data.get("container_no",""),data.get("container_type","40GP"),data.get("load_type","卸"),
         data.get("warehouse_code",""),data.get("biz_line","渊博"),data.get("work_date",str(date.today())),
         data.get("start_time","08:00"),data.get("seal_no",""),json.dumps(workers),len(workers),
         data.get("client_revenue",0),data.get("team_pay",0),"平均","进行中",data.get("notes","")))
    database.commit(db); db.close(); return {"id": ct_id}

@app.put("/api/containers/{ct_id}/complete")
def complete_container(ct_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    ct = one(db, "SELECT * FROM containers WHERE id=?", (ct_id,))
    if not ct: raise HTTPException(404)
    end_time = data.get("end_time", datetime.now().strftime("%H:%M"))
    sh = int((ct["start_time"] or "08:00").split(":")[0])
    dur = max(0, int(end_time.split(":")[0]) - sh)
    database.execute(db, "UPDATE containers SET end_time=?,duration_hours=?,status='已完成',video_recorded=?,wh_approved=1,wh_approver=? WHERE id=?",
        (end_time, dur, data.get("video_recorded",1), u["display_name"], ct_id))
    database.commit(db); db.close(); return {"ok": True, "duration_hours": dur}

# ══════════════════════════════════════════
# WAREHOUSES / GRADES / COST
# ══════════════════════════════════════════
@app.get("/api/warehouses")
def list_warehouses(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM warehouses WHERE active=1 ORDER BY code")
    db.close(); return result

@app.put("/api/warehouses/{code}")
def update_warehouse(code: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin","mgr"): raise HTTPException(403)
    db = database.get_db()
    data.pop("code",None)
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE warehouses SET {sets} WHERE code=?", list(data.values())+[code])
    database.commit(db); db.close(); return {"ok": True}

@app.get("/api/warehouses/{code}/rates")
def warehouse_rates(code: str, u: dict = Depends(get_user)):
    db = database.get_db()
    wh = one(db, "SELECT * FROM warehouses WHERE code=?", (code,))
    db.close()
    if not wh: raise HTTPException(404)
    return dict(wh)

@app.get("/api/suppliers")
def list_suppliers(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM suppliers ORDER BY name")
    db.close(); return result

@app.get("/api/grades")
def get_grades(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM grade_salaries ORDER BY grade")
    db.close(); return result

@app.get("/api/kpi-levels")
def get_kpi(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM kpi_levels ORDER BY level")
    db.close(); return result

@app.post("/api/cost-calc")
def cost_calc(data: dict = Body(...), u: dict = Depends(get_user)):
    br = float(data.get("brutto_rate",14.0))
    wh = float(data.get("weekly_hours",40.0))
    mh = round(wh*4.333,1); gross = round(br*mh,2)
    ssi_emp = round(gross*0.2065,2); hol = round(gross*0.0833,2); mgmt = round(gross*0.05,2)
    total = round(gross+ssi_emp+hol+mgmt,2); true_h = round(total/mh,2) if mh>0 else 0
    is_mj = data.get("emp_type")=="Minijob" or gross<=538
    e_ssi = round(gross*0.205,2) if not is_mj else 0
    e_tax = round(gross*0.08,2) if not is_mj else 0
    return {"brutto_rate":br,"weekly_hours":wh,"monthly_hours":mh,"gross_monthly":gross,
            "employer_ssi":ssi_emp,"holiday_provision":hol,"mgmt_cost":mgmt,
            "total_employer_cost":total,"true_hourly_cost":true_h,
            "employee_ssi":e_ssi,"income_tax":e_tax,"net_pay":round(gross-e_ssi-e_tax,2),"is_minijob":is_mj}

@app.get("/api/salary-lookup")
def salary_lookup(employee_id: str, warehouse_code: str, shift: str = "白班", hours: float = 8.0, u: dict = Depends(get_user)):
    db = database.get_db()
    emp = one(db, "SELECT * FROM employees WHERE id=?", (employee_id,))
    if not emp: raise HTTPException(404)
    pay = database.calc_timesheet_pay(db, dict(emp), warehouse_code, shift, hours)
    wh = one(db, "SELECT name FROM warehouses WHERE code=?", (warehouse_code,))
    db.close()
    return {**pay, "employee_name": emp["name"], "warehouse_name": wh["name"] if wh else warehouse_code}

# ══════════════════════════════════════════
# SETTLEMENT
# ══════════════════════════════════════════
@app.get("/api/settlement/monthly")
def monthly_settlement(month: str = "", u: dict = Depends(get_user)):
    if not month: month = date.today().strftime("%Y-%m")
    db = database.get_db()
    conds = [f"work_date LIKE '{month}%'"]
    if u.get("supplier_id"): conds.append(f"supplier_id='{u['supplier_id']}'")
    if u.get("biz_line") and u["role"] not in ("admin","hr","fin"): conds.append(f"biz_line='{u['biz_line']}'")
    sql = f"""SELECT employee_id,employee_name,warehouse_code,biz_line,source,supplier_id,
        ROUND(CAST(SUM(hours) AS NUMERIC),1) as total_hours,
        ROUND(CAST(SUM(gross_pay) AS NUMERIC),2) as gross_total,
        ROUND(CAST(SUM(ssi_deduct) AS NUMERIC),2) as ssi_total,
        ROUND(CAST(SUM(tax_deduct) AS NUMERIC),2) as tax_total,
        ROUND(CAST(SUM(net_pay) AS NUMERIC),2) as net_total,
        COUNT(*) as record_count
        FROM timesheets WHERE {' AND '.join(conds)} AND status='已入账'
        GROUP BY employee_id,warehouse_code ORDER BY employee_name"""
    result = rows(db, sql)
    summary = {"total_gross": sum(r["gross_total"] for r in result),
               "total_net": sum(r["net_total"] for r in result),
               "total_hours": sum(r["total_hours"] for r in result),
               "employee_count": len(result)}
    db.close(); return {"month": month, "rows": result, "summary": summary}

# ══════════════════════════════════════════
# CLOCK
# ══════════════════════════════════════════
@app.post("/api/clock")
def clock(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    emp_id = u.get("_emp_id") or data.get("employee_id")
    cl_id = f"CL-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"
    database.execute(db, "INSERT INTO clock_records(id,employee_id,employee_name,clock_type,clock_time,work_date) VALUES(?,?,?,?,?,?)",
        (cl_id, emp_id, u.get("display_name",""), data.get("clock_type","in"), datetime.now().strftime("%H:%M"), str(date.today())))
    database.commit(db); db.close(); return {"ok": True, "time": datetime.now().strftime("%H:%M")}

@app.get("/api/clock/today")
def today_clocks(u: dict = Depends(get_user)):
    db = database.get_db()
    emp_id = u.get("_emp_id")
    result = rows(db, "SELECT * FROM clock_records WHERE work_date=? AND employee_id=? ORDER BY clock_time", (str(date.today()), emp_id)) if emp_id else []
    db.close(); return result

# ══════════════════════════════════════════
# AUDIT LOGS
# ══════════════════════════════════════════
@app.get("/api/logs")
def get_logs(u: dict = Depends(get_user)):
    if u["role"] not in ("admin","hr"): raise HTTPException(403)
    db = database.get_db()
    result = rows(db, "SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500")
    db.close(); return result

# ══════════════════════════════════════════
# STATIC + CATCH-ALL
# ══════════════════════════════════════════
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return FileResponse(index)
    return JSONResponse({"status": "ok"})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT",8000)))
