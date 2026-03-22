"""
渊博+579 HR V6 — Database Layer
自动检测 DATABASE_URL → PostgreSQL（生产/Railway）
无 DATABASE_URL → SQLite（本地开发）
"""
import os, json, re
from datetime import date
import bcrypt as _bcrypt

DATABASE_URL = os.environ.get("DATABASE_URL", "")
MIN_WAGE = 13.00

# ─── 统一连接接口 ─────────────────────────────────────────────────────
def get_db():
    if DATABASE_URL:
        import psycopg2, psycopg2.extras
        # Railway 提供的 URL 有时是 postgres:// 需转为 postgresql://
        url = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        conn = psycopg2.connect(url, connect_timeout=10, cursor_factory=psycopg2.extras.RealDictCursor)
        conn.autocommit = False
        return conn
    else:
        import sqlite3
        db_path = os.path.join(os.path.dirname(__file__), "hr_v6.db")
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

def _is_pg(conn):
    return "psycopg2" in type(conn).__module__

def _sql(conn, q):
    """将 SQLite 的 ? 占位符转换为 PostgreSQL 的 %s"""
    if _is_pg(conn):
        return q.replace("?", "%s")
    return q

def execute(conn, sql, params=()):
    c = conn.cursor()
    c.execute(_sql(conn, sql), params)
    return c

def fetchall(conn, sql, params=()):
    c = execute(conn, sql, params)
    rows = c.fetchall()
    return [dict(r) for r in rows]

def fetchone(conn, sql, params=()):
    c = execute(conn, sql, params)
    r = c.fetchone()
    return dict(r) if r else None

def commit(conn):
    conn.commit()

# ─── Schema ──────────────────────────────────────────────────────────
def _serial(conn):
    return "SERIAL" if _is_pg(conn) else "INTEGER"

def _now(conn):
    return "NOW()" if _is_pg(conn) else "datetime('now')"

def _ignore(conn):
    """INSERT OR IGNORE (SQLite) vs INSERT ... ON CONFLICT DO NOTHING (PG)"""
    return "" # handled per statement

def init_db():
    conn = get_db()
    pg = _is_pg(conn)
    S = "SERIAL" if pg else "INTEGER"
    N = 'CURRENT_TIMESTAMP'
    c = conn.cursor()

    c.execute(f"""CREATE TABLE IF NOT EXISTS users(
        id {S} PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        role TEXT DEFAULT 'worker',
        biz_line TEXT DEFAULT '',
        warehouse_code TEXT DEFAULT '',
        supplier_id TEXT DEFAULT '',
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS employees(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        nationality TEXT DEFAULT 'DE',
        gender TEXT DEFAULT '男',
        source TEXT DEFAULT '自有',
        supplier_id TEXT DEFAULT '',
        biz_line TEXT DEFAULT '渊博',
        warehouse_code TEXT DEFAULT '',
        position TEXT DEFAULT '',
        grade TEXT DEFAULT 'P1',
        settlement_type TEXT DEFAULT '按小时',
        hourly_rate NUMERIC DEFAULT 13.0,
        status TEXT DEFAULT '在职',
        join_date TEXT DEFAULT '',
        pin TEXT DEFAULT '',
        tax_mode TEXT DEFAULT '我方报税',
        tax_id TEXT DEFAULT '',
        tax_no TEXT DEFAULT '',
        tax_class TEXT DEFAULT '1',
        ssn TEXT DEFAULT '',
        iban TEXT DEFAULT '',
        address TEXT DEFAULT '',
        birth_date TEXT DEFAULT '',
        id_type TEXT DEFAULT '护照',
        id_no TEXT DEFAULT '',
        contract_hours NUMERIC DEFAULT 8.0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS warehouses(
        code TEXT PRIMARY KEY,
        name TEXT,
        client TEXT,
        biz_line TEXT DEFAULT '渊博',
        region TEXT DEFAULT '',
        manager TEXT DEFAULT '',
        address TEXT DEFAULT '',
        rate_p1 NUMERIC DEFAULT 13.00,
        rate_p2 NUMERIC DEFAULT 13.50,
        rate_p3 NUMERIC DEFAULT 14.00,
        rate_p4 NUMERIC DEFAULT 14.50,
        rate_p5 NUMERIC DEFAULT 15.00,
        night_bonus NUMERIC DEFAULT 2.50,
        weekend_bonus NUMERIC DEFAULT 3.00,
        holiday_bonus NUMERIC DEFAULT 5.00,
        load_20gp NUMERIC DEFAULT 80,
        unload_20gp NUMERIC DEFAULT 70,
        load_40gp NUMERIC DEFAULT 120,
        unload_40gp NUMERIC DEFAULT 110,
        price_45hc NUMERIC DEFAULT 140,
        perf_coeff NUMERIC DEFAULT 0.12,
        kpi_bonus_rate NUMERIC DEFAULT 0.05,
        active INTEGER DEFAULT 1
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS grade_salaries(
        grade TEXT PRIMARY KEY,
        base_salary NUMERIC,
        multiplier NUMERIC,
        gross_salary NUMERIC,
        mgmt_allowance NUMERIC DEFAULT 0,
        overtime_hours INTEGER DEFAULT 0,
        real_cost NUMERIC,
        hourly_equiv NUMERIC,
        description TEXT DEFAULT ''
    )""")

    c.execute("""CREATE TABLE IF NOT EXISTS kpi_levels(
        level TEXT PRIMARY KEY,
        base_salary NUMERIC,
        bonus_rate NUMERIC,
        kpi_bonus NUMERIC,
        total_income NUMERIC
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS timesheets(
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        employee_name TEXT,
        source TEXT DEFAULT '自有',
        supplier_id TEXT DEFAULT '',
        biz_line TEXT DEFAULT '渊博',
        work_date TEXT,
        warehouse_code TEXT,
        shift TEXT DEFAULT '白班',
        start_time TEXT DEFAULT '08:00',
        end_time TEXT DEFAULT '16:00',
        hours NUMERIC DEFAULT 0,
        position TEXT DEFAULT '',
        settlement_type TEXT DEFAULT '按小时',
        grade TEXT DEFAULT 'P1',
        base_rate NUMERIC DEFAULT 13.00,
        shift_bonus NUMERIC DEFAULT 0,
        effective_rate NUMERIC DEFAULT 13.00,
        gross_pay NUMERIC DEFAULT 0,
        perf_bonus NUMERIC DEFAULT 0,
        other_allowance NUMERIC DEFAULT 0,
        ssi_deduct NUMERIC DEFAULT 0,
        tax_deduct NUMERIC DEFAULT 0,
        net_pay NUMERIC DEFAULT 0,
        status TEXT DEFAULT '待仓库审批',
        wh_approver TEXT DEFAULT '',
        wh_approved_at TEXT DEFAULT '',
        fin_approver TEXT DEFAULT '',
        fin_approved_at TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS containers(
        id TEXT PRIMARY KEY,
        container_no TEXT,
        container_type TEXT DEFAULT '40GP',
        load_type TEXT DEFAULT '卸',
        warehouse_code TEXT,
        biz_line TEXT DEFAULT '渊博',
        work_date TEXT,
        start_time TEXT DEFAULT '08:00',
        end_time TEXT DEFAULT '',
        duration_hours NUMERIC DEFAULT 0,
        worker_ids TEXT DEFAULT '[]',
        worker_count INTEGER DEFAULT 0,
        client_revenue NUMERIC DEFAULT 0,
        team_pay NUMERIC DEFAULT 0,
        per_person_pay NUMERIC DEFAULT 0,
        split_method TEXT DEFAULT '平均',
        seal_no TEXT DEFAULT '',
        video_recorded INTEGER DEFAULT 0,
        status TEXT DEFAULT '进行中',
        wh_approved INTEGER DEFAULT 0,
        wh_approver TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS suppliers(
        id TEXT PRIMARY KEY,
        name TEXT,
        biz_line TEXT DEFAULT '渊博',
        contact_name TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        email TEXT DEFAULT '',
        tax_handle TEXT DEFAULT '供应商自行报税',
        rating TEXT DEFAULT 'B',
        status TEXT DEFAULT '合作中',
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS zeitkonto(
        id {S} PRIMARY KEY,
        employee_id TEXT UNIQUE,
        employee_name TEXT,
        contract_hours_day NUMERIC DEFAULT 8.0,
        plus_hours NUMERIC DEFAULT 0,
        minus_hours NUMERIC DEFAULT 0,
        updated_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS zeitkonto_logs(
        id {S} PRIMARY KEY,
        employee_id TEXT,
        log_date TEXT,
        entry_type TEXT,
        hours NUMERIC,
        reason TEXT DEFAULT '',
        approved_by TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS abmahnungen(
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        employee_name TEXT,
        abmahnung_type TEXT,
        incident_date TEXT,
        issued_date TEXT,
        issued_by TEXT DEFAULT '',
        incident_description TEXT DEFAULT '',
        internal_notes TEXT DEFAULT '',
        status TEXT DEFAULT '有效',
        expiry_date TEXT,
        revoked_at TEXT DEFAULT '',
        revoked_by TEXT DEFAULT '',
        revoke_reason TEXT DEFAULT '',
        delivery_method TEXT DEFAULT '面交',
        delivery_confirmed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS wv_projects(
        id TEXT PRIMARY KEY,
        name TEXT,
        client TEXT DEFAULT '',
        address TEXT DEFAULT '',
        service_type TEXT DEFAULT '',
        region TEXT DEFAULT '',
        project_manager TEXT DEFAULT '',
        start_date TEXT DEFAULT '',
        end_date TEXT DEFAULT '',
        description TEXT DEFAULT '',
        phase INTEGER DEFAULT 0,
        cost_data TEXT DEFAULT '{{}}',
        comp_data TEXT DEFAULT '{{}}',
        comp_approved INTEGER DEFAULT 0,
        quote_approved INTEGER DEFAULT 0,
        client_signed_off INTEGER DEFAULT 0,
        staff_returned INTEGER DEFAULT 0,
        equip_returned INTEGER DEFAULT 0,
        final_billed INTEGER DEFAULT 0,
        debrief TEXT DEFAULT '',
        closed INTEGER DEFAULT 0,
        created_by TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS clock_records(
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        employee_name TEXT,
        clock_type TEXT,
        clock_time TEXT,
        work_date TEXT,
        created_at TIMESTAMP DEFAULT {N}
    )""")

    c.execute(f"""CREATE TABLE IF NOT EXISTS audit_logs(
        id {S} PRIMARY KEY,
        username TEXT DEFAULT '',
        user_display TEXT DEFAULT '',
        action TEXT DEFAULT '',
        target_table TEXT DEFAULT '',
        target_id TEXT DEFAULT '',
        detail TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT {N}
    )""")

    _migrate_schema(conn, pg)
    conn.commit()
    conn.close()
    print(f"✅ DB schema OK ({'PostgreSQL' if pg else 'SQLite'})")


def _add_col(c, pg, table, col, defn):
    """Safely add a column if it does not already exist."""
    if pg:
        c.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {defn}")
    else:
        import sqlite3 as _sqlite3
        try:
            c.execute(f"ALTER TABLE {table} ADD COLUMN {col} {defn}")
        except _sqlite3.OperationalError as exc:
            if "duplicate column" not in str(exc).lower():
                raise


def _migrate_schema(conn, pg=None):
    """Ensure all current columns exist — safe to run on every startup."""
    if pg is None:
        pg = _is_pg(conn)
    c = conn.cursor()
    N = 'CURRENT_TIMESTAMP'
    S = "SERIAL" if pg else "INTEGER"

    # users
    for col, defn in [
        ("biz_line",      "TEXT DEFAULT ''"),
        ("warehouse_code","TEXT DEFAULT ''"),
        ("supplier_id",   "TEXT DEFAULT ''"),
        ("active",        "INTEGER DEFAULT 1"),
        ("created_at",    f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "users", col, defn)

    # employees
    for col, defn in [
        ("phone",            "TEXT DEFAULT ''"),
        ("nationality",      "TEXT DEFAULT 'DE'"),
        ("gender",           "TEXT DEFAULT '男'"),
        ("source",           "TEXT DEFAULT '自有'"),
        ("supplier_id",      "TEXT DEFAULT ''"),
        ("biz_line",         "TEXT DEFAULT '渊博'"),
        ("warehouse_code",   "TEXT DEFAULT ''"),
        ("position",         "TEXT DEFAULT ''"),
        ("grade",            "TEXT DEFAULT 'P1'"),
        ("settlement_type",  "TEXT DEFAULT '按小时'"),
        ("hourly_rate",      "NUMERIC DEFAULT 13.0"),
        ("status",           "TEXT DEFAULT '在职'"),
        ("join_date",        "TEXT DEFAULT ''"),
        ("pin",              "TEXT DEFAULT ''"),
        ("tax_mode",         "TEXT DEFAULT '我方报税'"),
        ("tax_id",           "TEXT DEFAULT ''"),
        ("tax_no",           "TEXT DEFAULT ''"),
        ("tax_class",        "TEXT DEFAULT '1'"),
        ("ssn",              "TEXT DEFAULT ''"),
        ("iban",             "TEXT DEFAULT ''"),
        ("address",          "TEXT DEFAULT ''"),
        ("birth_date",       "TEXT DEFAULT ''"),
        ("id_type",          "TEXT DEFAULT '护照'"),
        ("id_no",            "TEXT DEFAULT ''"),
        ("contract_hours",   "NUMERIC DEFAULT 8.0"),
        ("notes",            "TEXT DEFAULT ''"),
        ("created_at",       f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "employees", col, defn)

    # warehouses
    for col, defn in [
        ("biz_line",      "TEXT DEFAULT '渊博'"),
        ("region",        "TEXT DEFAULT ''"),
        ("manager",       "TEXT DEFAULT ''"),
        ("address",       "TEXT DEFAULT ''"),
        ("rate_p1",       "NUMERIC DEFAULT 13.00"),
        ("rate_p2",       "NUMERIC DEFAULT 13.50"),
        ("rate_p3",       "NUMERIC DEFAULT 14.00"),
        ("rate_p4",       "NUMERIC DEFAULT 14.50"),
        ("rate_p5",       "NUMERIC DEFAULT 15.00"),
        ("night_bonus",   "NUMERIC DEFAULT 2.50"),
        ("weekend_bonus", "NUMERIC DEFAULT 3.00"),
        ("holiday_bonus", "NUMERIC DEFAULT 5.00"),
        ("load_20gp",     "NUMERIC DEFAULT 80"),
        ("unload_20gp",   "NUMERIC DEFAULT 70"),
        ("load_40gp",     "NUMERIC DEFAULT 120"),
        ("unload_40gp",   "NUMERIC DEFAULT 110"),
        ("price_45hc",    "NUMERIC DEFAULT 140"),
        ("perf_coeff",    "NUMERIC DEFAULT 0.12"),
        ("kpi_bonus_rate","NUMERIC DEFAULT 0.05"),
        ("active",        "INTEGER DEFAULT 1"),
    ]:
        _add_col(c, pg, "warehouses", col, defn)

    # timesheets
    for col, defn in [
        ("employee_name",   "TEXT DEFAULT ''"),
        ("source",          "TEXT DEFAULT '自有'"),
        ("supplier_id",     "TEXT DEFAULT ''"),
        ("biz_line",        "TEXT DEFAULT '渊博'"),
        ("shift",           "TEXT DEFAULT '白班'"),
        ("start_time",      "TEXT DEFAULT '08:00'"),
        ("end_time",        "TEXT DEFAULT '16:00'"),
        ("hours",           "NUMERIC DEFAULT 0"),
        ("position",        "TEXT DEFAULT ''"),
        ("settlement_type", "TEXT DEFAULT '按小时'"),
        ("grade",           "TEXT DEFAULT 'P1'"),
        ("base_rate",       "NUMERIC DEFAULT 13.00"),
        ("shift_bonus",     "NUMERIC DEFAULT 0"),
        ("effective_rate",  "NUMERIC DEFAULT 13.00"),
        ("gross_pay",       "NUMERIC DEFAULT 0"),
        ("perf_bonus",      "NUMERIC DEFAULT 0"),
        ("other_allowance", "NUMERIC DEFAULT 0"),
        ("ssi_deduct",      "NUMERIC DEFAULT 0"),
        ("tax_deduct",      "NUMERIC DEFAULT 0"),
        ("net_pay",         "NUMERIC DEFAULT 0"),
        ("status",          "TEXT DEFAULT '待仓库审批'"),
        ("wh_approver",     "TEXT DEFAULT ''"),
        ("wh_approved_at",  "TEXT DEFAULT ''"),
        ("fin_approver",    "TEXT DEFAULT ''"),
        ("fin_approved_at", "TEXT DEFAULT ''"),
        ("notes",           "TEXT DEFAULT ''"),
        ("created_at",      f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "timesheets", col, defn)

    # containers
    for col, defn in [
        ("container_type",  "TEXT DEFAULT '40GP'"),
        ("load_type",       "TEXT DEFAULT '卸'"),
        ("biz_line",        "TEXT DEFAULT '渊博'"),
        ("start_time",      "TEXT DEFAULT '08:00'"),
        ("end_time",        "TEXT DEFAULT ''"),
        ("duration_hours",  "NUMERIC DEFAULT 0"),
        ("worker_ids",      "TEXT DEFAULT '[]'"),
        ("worker_count",    "INTEGER DEFAULT 0"),
        ("client_revenue",  "NUMERIC DEFAULT 0"),
        ("team_pay",        "NUMERIC DEFAULT 0"),
        ("per_person_pay",  "NUMERIC DEFAULT 0"),
        ("split_method",    "TEXT DEFAULT '平均'"),
        ("seal_no",         "TEXT DEFAULT ''"),
        ("video_recorded",  "INTEGER DEFAULT 0"),
        ("status",          "TEXT DEFAULT '进行中'"),
        ("wh_approved",     "INTEGER DEFAULT 0"),
        ("wh_approver",     "TEXT DEFAULT ''"),
        ("notes",           "TEXT DEFAULT ''"),
        ("created_at",      f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "containers", col, defn)

    # suppliers
    for col, defn in [
        ("biz_line",     "TEXT DEFAULT '渊博'"),
        ("contact_name", "TEXT DEFAULT ''"),
        ("phone",        "TEXT DEFAULT ''"),
        ("email",        "TEXT DEFAULT ''"),
        ("tax_handle",   "TEXT DEFAULT '供应商自行报税'"),
        ("rating",       "TEXT DEFAULT 'B'"),
        ("status",       "TEXT DEFAULT '合作中'"),
        ("notes",        "TEXT DEFAULT ''"),
        ("created_at",   f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "suppliers", col, defn)

    # zeitkonto
    for col, defn in [
        ("employee_name",      "TEXT DEFAULT ''"),
        ("contract_hours_day", "NUMERIC DEFAULT 8.0"),
        ("plus_hours",         "NUMERIC DEFAULT 0"),
        ("minus_hours",        "NUMERIC DEFAULT 0"),
        ("updated_at",         f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "zeitkonto", col, defn)

    # zeitkonto_logs
    for col, defn in [
        ("log_date",    "TEXT DEFAULT ''"),
        ("entry_type",  "TEXT DEFAULT ''"),
        ("hours",       "NUMERIC DEFAULT 0"),
        ("reason",      "TEXT DEFAULT ''"),
        ("approved_by", "TEXT DEFAULT ''"),
        ("created_at",  f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "zeitkonto_logs", col, defn)

    # abmahnungen
    for col, defn in [
        ("employee_name",        "TEXT DEFAULT ''"),
        ("abmahnung_type",       "TEXT DEFAULT ''"),
        ("incident_date",        "TEXT DEFAULT ''"),
        ("issued_date",          "TEXT DEFAULT ''"),
        ("issued_by",            "TEXT DEFAULT ''"),
        ("incident_description", "TEXT DEFAULT ''"),
        ("internal_notes",       "TEXT DEFAULT ''"),
        ("status",               "TEXT DEFAULT '有效'"),
        ("expiry_date",          "TEXT DEFAULT ''"),
        ("revoked_at",           "TEXT DEFAULT ''"),
        ("revoked_by",           "TEXT DEFAULT ''"),
        ("revoke_reason",        "TEXT DEFAULT ''"),
        ("delivery_method",      "TEXT DEFAULT '面交'"),
        ("delivery_confirmed",   "INTEGER DEFAULT 0"),
        ("created_at",           f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "abmahnungen", col, defn)

    # wv_projects
    for col, defn in [
        ("client",          "TEXT DEFAULT ''"),
        ("address",         "TEXT DEFAULT ''"),
        ("service_type",    "TEXT DEFAULT ''"),
        ("region",          "TEXT DEFAULT ''"),
        ("project_manager", "TEXT DEFAULT ''"),
        ("start_date",      "TEXT DEFAULT ''"),
        ("end_date",        "TEXT DEFAULT ''"),
        ("description",     "TEXT DEFAULT ''"),
        ("phase",           "INTEGER DEFAULT 0"),
        ("cost_data",       "TEXT DEFAULT '{}'"),
        ("comp_data",       "TEXT DEFAULT '{}'"),
        ("comp_approved",   "INTEGER DEFAULT 0"),
        ("quote_approved",  "INTEGER DEFAULT 0"),
        ("client_signed_off","INTEGER DEFAULT 0"),
        ("staff_returned",  "INTEGER DEFAULT 0"),
        ("equip_returned",  "INTEGER DEFAULT 0"),
        ("final_billed",    "INTEGER DEFAULT 0"),
        ("debrief",         "TEXT DEFAULT ''"),
        ("closed",          "INTEGER DEFAULT 0"),
        ("created_by",      "TEXT DEFAULT ''"),
        ("created_at",      f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "wv_projects", col, defn)

    # clock_records
    for col, defn in [
        ("employee_name", "TEXT DEFAULT ''"),
        ("clock_type",    "TEXT DEFAULT 'in'"),
        ("clock_time",    "TEXT DEFAULT ''"),
        ("work_date",     "TEXT DEFAULT ''"),
        ("created_at",    f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "clock_records", col, defn)

    # audit_logs
    for col, defn in [
        ("username",     "TEXT DEFAULT ''"),
        ("user_display", "TEXT DEFAULT ''"),
        ("action",       "TEXT DEFAULT ''"),
        ("target_table", "TEXT DEFAULT ''"),
        ("target_id",    "TEXT DEFAULT ''"),
        ("detail",       "TEXT DEFAULT ''"),
        ("created_at",   f"TIMESTAMP DEFAULT {N}"),
    ]:
        _add_col(c, pg, "audit_logs", col, defn)

    # grade_salaries
    for col, defn in [
        ("mgmt_allowance", "NUMERIC DEFAULT 0"),
        ("overtime_hours", "INTEGER DEFAULT 0"),
        ("description",    "TEXT DEFAULT ''"),
    ]:
        _add_col(c, pg, "grade_salaries", col, defn)


# ─── 薪资计算函数 ─────────────────────────────────────────────────────
def get_wh_rate_for_grade(conn, wh_code, grade):
    col = {'P1':'rate_p1','P2':'rate_p2','P3':'rate_p3','P4':'rate_p4','P5':'rate_p5'}.get(grade,'rate_p1')
    row = fetchone(conn, f"SELECT {col} as r FROM warehouses WHERE code=?", (wh_code,))
    rate = float(row['r']) if row and row['r'] else MIN_WAGE
    return max(rate, MIN_WAGE)

def get_shift_bonus(conn, wh_code, shift):
    col = {'夜班':'night_bonus','周末':'weekend_bonus','节假日':'holiday_bonus'}.get(shift)
    if not col: return 0.0
    row = fetchone(conn, f"SELECT {col} as b FROM warehouses WHERE code=?", (wh_code,))
    return float(row['b']) if row and row['b'] else 0.0

def get_container_price(conn, wh_code, cont_type, load_type):
    col = {('20GP','装'):'load_20gp',('20GP','卸'):'unload_20gp',('40GP','装'):'load_40gp',
           ('40GP','卸'):'unload_40gp',('40HQ','装'):'load_40gp',('40HQ','卸'):'unload_40gp',
           ('45HC','装'):'price_45hc',('45HC','卸'):'price_45hc'}.get((cont_type,load_type),'unload_40gp')
    row = fetchone(conn, f"SELECT {col} as p FROM warehouses WHERE code=?", (wh_code,))
    return float(row['p']) if row and row['p'] else 0.0

def calc_timesheet_pay(conn, emp, wh_code, shift, hours):
    grade = emp.get('grade','P1')
    base_rate = get_wh_rate_for_grade(conn, wh_code, grade)
    shift_bonus = get_shift_bonus(conn, wh_code, shift)
    effective_rate = base_rate + shift_bonus
    gross = round(effective_rate * hours, 2)
    wh_row = fetchone(conn, "SELECT perf_coeff FROM warehouses WHERE code=?", (wh_code,))
    perf_coeff = float(wh_row['perf_coeff']) if wh_row and wh_row['perf_coeff'] else 0.0
    perf_bonus = round(gross * perf_coeff, 2) if emp.get('settlement_type') == '计时+绩效' else 0.0
    is_own = emp.get('source') == '自有'
    ssi = round(gross * 0.12, 2) if is_own else 0.0
    tax = round(gross * 0.08, 2) if is_own else 0.0
    net = round(gross + perf_bonus - ssi - tax, 2)
    return {'grade':grade,'base_rate':base_rate,'shift_bonus':shift_bonus,'effective_rate':effective_rate,
            'gross_pay':gross,'perf_bonus':perf_bonus,'ssi_deduct':ssi,'tax_deduct':tax,'net_pay':net}


# ─── Seed ─────────────────────────────────────────────────────────────
def _upsert(conn, table, pk_col, pk_val, data):
    """INSERT if not exists, skip if exists"""
    pg = _is_pg(conn)
    cols = ",".join(data.keys())
    phs = ",".join(["%s" if pg else "?" for _ in data])
    vals = list(data.values())
    if pg:
        sql = f"INSERT INTO {table}({cols}) VALUES({phs}) ON CONFLICT ({pk_col}) DO NOTHING"
    else:
        sql = f"INSERT OR IGNORE INTO {table}({cols}) VALUES({phs})"
    conn.cursor().execute(sql, vals)

def seed_data():
    conn = get_db()
    if fetchone(conn, "SELECT COUNT(*) as c FROM users")['c'] > 0:
        conn.close(); return

    # Users
    for u,pw,dn,role,biz,wh,sup in [
        ("admin","admin123","系统管理员","admin","","",""),
        ("hr","hr123","赵慧（HR）","hr","渊博","",""),
        ("wh_una","una123","王磊（UNA）","wh","渊博","UNA",""),
        ("finance","fin123","孙琳（财务）","fin","","",""),
        ("mgr579","579pass","张伟（579）","mgr","579","",""),
        ("sup001","sup123","陈刚（德信）","sup","","","SUP-001"),
        ("worker","w123","工人入口","worker","","",""),
    ]:
        _upsert(conn,"users","username",u,{"username":u,"password_hash":_bcrypt.hashpw(pw.encode(),_bcrypt.gensalt(rounds=4)).decode(),"display_name":dn,"role":role,"biz_line":biz,"warehouse_code":wh,"supplier_id":sup})

    # Grade salaries
    for g in [
        ("P1",2400,1.0,2400,0,0,2924,14.31,"新人操作员"),
        ("P2",2400,1.1,2640,200,2,3186,16.65,"资深操作员"),
        ("P3",2400,1.15,2760,300,3,3390,17.15,"技能工/叉车"),
        ("P4",2400,1.2,2880,500,5,3658,17.42,"组长"),
        ("P5",2400,1.25,3000,600,6,3827,18.03,"班组长"),
        ("P6",2400,1.3,3120,700,7,4010,18.80,"副驻仓经理"),
        ("P7",2400,1.4,3360,800,8,4168,19.42,"驻仓经理"),
        ("P8",2400,1.6,3840,1000,10,4850,22.20,"区域经理"),
        ("P9",2400,1.8,4320,1200,12,5532,24.97,"运营总监"),
    ]:
        _upsert(conn,"grade_salaries","grade",g[0],dict(zip(["grade","base_salary","multiplier","gross_salary","mgmt_allowance","overtime_hours","real_cost","hourly_equiv","description"],g)))

    for kl in [("L1",2400,0.05,120,2520),("L2",2750,0.06,165,2915),("L3",3100,0.08,248,3348),("L4",3450,0.10,345,3795),("L5",3800,0.12,456,4256)]:
        _upsert(conn,"kpi_levels","level",kl[0],dict(zip(["level","base_salary","bonus_rate","kpi_bonus","total_income"],kl)))

    # Warehouses
    for w in [
        ("UNA","Unna Lager","UNA Logistics GmbH","渊博","鲁尔东","王磊","Unna, NRW",13.90,14.57,15.26,15.95,16.65,2.50,3.00,5.00,80,70,120,110,140,0.12,0.05),
        ("DHL","DHL Dortmund","DHL Supply Chain","渊博","鲁尔东","李娜","Dortmund, NRW",14.20,14.80,15.50,16.20,17.00,3.00,3.50,6.00,90,80,130,120,150,0.12,0.06),
        ("BGK","Bergkamen Hub","579 GmbH","579","鲁尔东","张伟","Bergkamen, NRW",13.90,14.57,15.26,15.95,16.65,2.00,2.50,4.50,75,65,110,100,130,0.10,0.04),
        ("ESN","Essen Zentral","Essen Logistics","渊博","鲁尔西","陈梅","Essen, NRW",14.50,15.10,15.80,16.50,17.30,3.00,3.50,6.00,95,85,135,125,155,0.15,0.07),
        ("DBG","Duisburg Port","Duisburg Hafen GmbH","渊博","鲁尔西","刘刚","Duisburg, NRW",14.20,14.80,15.50,16.20,17.00,2.80,3.20,5.50,90,80,125,115,145,0.13,0.06),
        ("BOC","Bochum Lager","Bochum Warehouse","579","鲁尔西","吴强","Bochum, NRW",13.90,14.57,15.26,15.95,16.65,2.50,3.00,5.00,85,75,115,105,135,0.11,0.05),
        ("KLN","Köln Süd","Köln Fulfillment GmbH","渊博","南部大区","周华","Köln, NRW",15.00,15.60,16.30,17.00,17.80,3.50,4.00,7.00,100,90,140,130,160,0.15,0.08),
        ("DUS","Düsseldorf Hub","DUS Logistics AG","渊博","南部大区","郑明","Düsseldorf, NRW",14.80,15.40,16.10,16.80,17.60,3.20,3.80,6.50,95,85,135,125,155,0.14,0.07),
        ("WPT","Wuppertal Depot","Wuppertal 579","579","南部大区","孙磊","Wuppertal, NRW",13.90,14.57,15.26,15.95,16.65,2.50,3.00,5.00,80,70,120,110,140,0.12,0.05),
        ("MGL","Mönchengladbach","MGL Hub GmbH","渊博","南部大区","黄芳","Mönchengladbach, NRW",14.20,14.80,15.50,16.20,17.00,2.80,3.20,5.50,88,78,125,115,145,0.13,0.06),
    ]:
        keys=["code","name","client","biz_line","region","manager","address","rate_p1","rate_p2","rate_p3","rate_p4","rate_p5","night_bonus","weekend_bonus","holiday_bonus","load_20gp","unload_20gp","load_40gp","unload_40gp","price_45hc","perf_coeff","kpi_bonus_rate"]
        _upsert(conn,"warehouses","code",w[0],dict(zip(keys,w)))

    for s in [
        ("SUP-001","德信人力","渊博","陈刚","+49-151-1111","dexin@ex.com","供应商自行报税","A","合作中",""),
        ("SUP-002","欧华劳务","渊博","赵丽","+49-151-2222","ouhua@ex.com","我方代报税","B","合作中",""),
        ("SUP-003","环球人才","579","孙明","+49-151-3333","huanqiu@ex.com","供应商自行报税","A","合作中",""),
    ]:
        _upsert(conn,"suppliers","id",s[0],dict(zip(["id","name","biz_line","contact_name","phone","email","tax_handle","rating","status","notes"],s)))

    # Employees
    emp_data = [
        ("YB-001","张三","+49-176-0001","CN","男","自有","","渊博","UNA","装卸","P2","按小时",14.57,"在职","2025-03-15","1001","我方报税","12345678","DE-TAX-001","1","SS-001","DE89370400440532013000","Hamburg Str.45","1992-05-15","护照","E12345678",8.0,""),
        ("YB-002","李四","+49-176-0002","CN","男","自有","","渊博","DHL","库内","P2","按小时",14.80,"在职","2025-06-01","1002","我方报税","23456789","DE-TAX-002","1","SS-002","DE12345678901234567890","Berlin Str.12","1995-08-20","护照","E23456789",8.0,""),
        ("YB-003","王五","+49-176-0003","VN","男","供应商","SUP-001","渊博","UNA","装卸","P1","按小时",13.90,"在职","2025-09-01","1003","供应商报税","","","","","","Hamburg Str.78","1990-03-10","身份证","VN-001",8.0,""),
        ("YB-004","阮氏花","+49-176-0004","VN","女","供应商","SUP-001","渊博","UNA","库内","P1","按小时",13.90,"在职","2025-10-15","1004","供应商报税","","","","","","Hamburg Str.90","1998-11-22","护照","VN-002",8.0,""),
        ("YB-005","陈大明","+49-176-0005","CN","男","供应商","SUP-002","渊博","DHL","装卸","P3","按小时",15.50,"在职","2024-06-01","1005","我方报税","34567890","DE-TAX-005","3","SS-005","DE55556666777788889999","Berlin Str.56","1988-01-30","护照","E34567890",8.0,""),
        ("YB-006","刘芳","+49-176-0006","CN","女","自有","","579","BGK","库内","P2","按小时",14.57,"在职","2025-08-01","1006","我方报税","45678901","DE-TAX-006","1","SS-006","DE66667777888899990000","Frankfurt Str.34","1996-07-18","护照","E45678901",8.0,""),
        ("W5-007","黄强","+49-176-0007","CN","男","供应商","SUP-003","579","BGK","装卸","P2","按小时",14.57,"在职","2026-01-10","1007","供应商报税","","","","","","Frankfurt Str.67","1993-04-25","身份证","CN-007",8.0,""),
        ("YB-008","Maria S.","+49-176-0008","PL","女","自有","","渊博","UNA","叉车","P3","按小时",15.26,"在职","2025-11-01","1008","我方报税","56789012","DE-TAX-008","1","SS-008","DE11112222333344445555","Hamburg Str.22","1991-06-15","ID-Card","PL-008",8.0,""),
        ("YB-009","Karim B.","+49-176-0009","MA","男","供应商","SUP-001","渊博","KLN","装卸","P1","计时+绩效",15.00,"在职","2025-12-01","1009","供应商报税","","","","","","Köln Str.11","1994-09-08","护照","MA-009",8.0,""),
        ("YB-010","张伟（P8）","+49-176-0010","CN","男","自有","","渊博","DUS","管理","P8","按小时",22.20,"在职","2024-01-01","1010","我方报税","67890123","DE-TAX-010","1","SS-010","DE22223333444455556666","Düsseldorf Str.5","1985-03-20","护照","E67890123",8.0,""),
    ]
    emp_keys=["id","name","phone","nationality","gender","source","supplier_id","biz_line","warehouse_code","position","grade","settlement_type","hourly_rate","status","join_date","pin","tax_mode","tax_id","tax_no","tax_class","ssn","iban","address","birth_date","id_type","id_no","contract_hours","notes"]
    for e in emp_data:
        _upsert(conn,"employees","id",e[0],dict(zip(emp_keys,e)))
        _upsert(conn,"zeitkonto","employee_id",e[0],{"employee_id":e[0],"employee_name":e[1],"contract_hours_day":8.0,"plus_hours":0,"minus_hours":0})

    # Sample timesheets
    import random; random.seed(42)
    dates=["2026-01-20","2026-01-21","2026-01-22","2026-01-27","2026-01-28","2026-02-03","2026-02-04","2026-02-10","2026-02-11","2026-02-12"]
    shifts_pool=["白班","白班","白班","夜班","周末"]
    statuses=["已入账","待财务确认","待仓库审批","已入账","已入账"]
    ts_id=1
    import uuid
    for emp_row in emp_data:
        eid,ename,biz,wh,grade,settle=emp_row[0],emp_row[1],emp_row[7],emp_row[8],emp_row[10],emp_row[11]
        emp_dict={'id':eid,'name':ename,'source':emp_row[5],'grade':grade,'settlement_type':settle}
        for d in random.sample(dates,6):
            sh,eh=8,random.choice([12,13,14,15,16]); hrs=eh-sh
            shift=random.choice(shifts_pool)
            pay=calc_timesheet_pay(conn,emp_dict,wh,shift,hrs)
            tid=f"WT-{d.replace('-','')}-{ts_id:04d}"
            ts_keys=["id","employee_id","employee_name","source","supplier_id","biz_line","work_date","warehouse_code","shift","start_time","end_time","hours","position","settlement_type","grade","base_rate","shift_bonus","effective_rate","gross_pay","perf_bonus","ssi_deduct","tax_deduct","net_pay","status"]
            _upsert(conn,"timesheets","id",tid,dict(zip(ts_keys,[tid,eid,ename,emp_row[5],emp_row[6],biz,d,wh,shift,f"{sh:02d}:00",f"{eh:02d}:00",hrs,emp_row[9],settle,grade,pay['base_rate'],pay['shift_bonus'],pay['effective_rate'],pay['gross_pay'],pay['perf_bonus'],pay['ssi_deduct'],pay['tax_deduct'],pay['net_pay'],random.choice(statuses)])))
            ts_id+=1
            overtime=max(0,hrs-8)
            if overtime>0:
                execute(conn,"UPDATE zeitkonto SET plus_hours=ROUND(CAST(plus_hours+? AS NUMERIC),1) WHERE employee_id=?",(overtime,eid))

    for ct in [
        ("CT-001","MSKU1234567","40GP","卸","UNA","渊博","2026-01-27","08:30","11:45",3.25,'["YB-001","YB-003"]',2,320,200,100,"平均","YB-SL-001",1,"已完成",1,"王磊",""),
        ("CT-002","TRIU9876543","20GP","卸","UNA","渊博","2026-01-27","13:00","14:30",1.5,'["YB-001","YB-004"]',2,160,120,60,"平均","YB-SL-002",1,"已完成",1,"王磊",""),
        ("CT-003","CGMU5551234","45HC","卸","DHL","渊博","2026-01-28","09:00","13:00",4.0,'["YB-002","YB-005"]',2,380,240,120,"平均","",0,"进行中",0,"","超大柜"),
        ("CT-004","HLXU7773210","40GP","装","BGK","579","2026-01-28","10:00","14:00",4.0,'["YB-006","W5-007"]',2,280,180,90,"平均","",0,"进行中",0,"",""),
    ]:
        ct_keys=["id","container_no","container_type","load_type","warehouse_code","biz_line","work_date","start_time","end_time","duration_hours","worker_ids","worker_count","client_revenue","team_pay","per_person_pay","split_method","seal_no","video_recorded","status","wh_approved","wh_approver","notes"]
        _upsert(conn,"containers","id",ct[0],dict(zip(ct_keys,ct)))

    cost_data=json.dumps({"workers":[{"label":"P1-P2卸柜","rate":13.9,"count":8,"hoursDay":8,"days":20},{"label":"P3叉车","rate":15.26,"count":2,"hoursDay":8,"days":20}],"soc":21,"hol":8,"mgmt":18,"equip":500,"travel":200,"overhead":5,"margin":15})
    comp_data=json.dumps({"wv1":"ok","wv2":"ok","wv3":"ok","aug1":"ok","aug2":"ok","mw1":"ok","mw2":"ok","ap1":"ok","ap2":"ok","as1":"ok","as2":"ok"})
    _upsert(conn,"wv_projects","id","WV-DEMO-001",{"id":"WV-DEMO-001","name":"UNA仓库 卸柜年度承包 2026","client":"UNA Logistics GmbH","address":"Unna, NRW","service_type":"卸柜承包","region":"鲁尔东大区","project_manager":"张伟（P8）","start_date":"2026-01-15","end_date":"2026-12-31","description":"每日卸柜6-10个40GP/45HC","phase":5,"cost_data":cost_data,"comp_data":comp_data,"comp_approved":1,"created_by":"admin"})

    conn.commit(); conn.close()
    print("✅ Seed data loaded (10 warehouses, 10 employees)")

if __name__ == "__main__":
    init_db(); seed_data()
    print("Done.")
