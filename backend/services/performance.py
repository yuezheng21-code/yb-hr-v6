"""
渊博579 HR V7 — 绩效计算引擎（工效标准法 / Engineered Labor Standards）

效率% = 标准工时 ÷ 实际工时 × 100
  标准工时(earned hours) = Σ 数量 ÷ 作业类型标准UPH
  实际工时：优先取作业记录自身工时；没填工时的记录（如 WMS 只推送扫描时间），
           用当天 工时记录(Timesheet) → 打卡(ClockEvent) 的班次工时减去已填工时，
           按标准工时比例分摊；无可分摊工时的记录只计产量、不计入效率。
  → 无论数据来自 WMS 扫描还是纸质工时单，都能算出同口径效率，
    多种作业（拣货/打包/卸柜…）可以合并比较。

质量分 = 100 − 事件扣分 − 差错率扣分（详见 QUALITY_POINTS / ERROR_RATE_PENALTY）
综合分 = 效率分 × 效率权重 + 质量分 × 质量权重，效率分 = min(效率%, 125) × 0.8
等级：A ≥ 90（超出标准） · B ≥ 75（达标） · C ≥ 60（待改进） · D < 60
"""
from __future__ import annotations
from collections import defaultdict
from datetime import date
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.models.operation import OperationLog, OperationType, QualityEvent
from backend.models.timesheet import Timesheet
from backend.models.clock import ClockEvent
from backend.models.employee import Employee
from backend.models.supplier import Supplier

QUALITY_POINTS = {"minor": 5, "major": 15, "critical": 40, "positive": -5}
ERROR_RATE_PENALTY = 10  # 每 1% 差错率扣 10 分
EFFICIENCY_CAP = 125.0
GRADE_THRESHOLDS = [(90, "A"), (75, "B"), (60, "C")]
GROUP_BY_OPTIONS = ("employee", "supplier", "op_type", "client", "warehouse", "date")


def grade_for(score: Optional[float]) -> str:
    if score is None:
        return "-"
    for threshold, g in GRADE_THRESHOLDS:
        if score >= threshold:
            return g
    return "D"


def _clock_hours(events: list[ClockEvent]) -> float:
    total, start = 0.0, None
    for e in sorted(events, key=lambda x: x.clock_time):
        h, m, *rest = (int(p) for p in e.clock_time.split(":"))
        minutes = h * 60 + m
        if e.clock_type == "in":
            start = minutes
        elif e.clock_type == "out" and start is not None:
            total += max(0, minutes - start) / 60
            start = None
    return round(total, 2)


def _fallback_hours(db: Session, emp_ids: set, date_from: date, date_to: date) -> dict:
    """{(employee_id, date): (hours, source)} from timesheets, then clock events."""
    out: dict = {}
    if not emp_ids:
        return out
    for ts in db.scalars(select(Timesheet).where(
            Timesheet.employee_id.in_(emp_ids), Timesheet.work_date >= date_from,
            Timesheet.work_date <= date_to, Timesheet.approval_status != "rejected")).all():
        key = (ts.employee_id, ts.work_date)
        h = out.get(key, (0.0, "timesheet"))[0]
        out[key] = (h + (ts.hours or 0.0), "timesheet")
    clocks: dict = defaultdict(list)
    for ce in db.scalars(select(ClockEvent).where(
            ClockEvent.employee_id.in_(emp_ids), ClockEvent.work_date >= date_from,
            ClockEvent.work_date <= date_to)).all():
        clocks[(ce.employee_id, ce.work_date)].append(ce)
    for key, evs in clocks.items():
        if key not in out or out[key][0] <= 0:
            h = _clock_hours(evs)
            if h > 0:
                out[key] = (h, "clock")
    return out


def compute_performance(
    db: Session,
    date_from: date,
    date_to: date,
    *,
    group_by: str = "employee",
    warehouse_code: Optional[str | list] = None,  # one code or a list (client portal)
    client: Optional[str] = None,
    supplier_id: Optional[int] = None,
    employee_id: Optional[int] = None,
    confirmed_only: bool = False,
    w_efficiency: float = 0.7,
    w_quality: float = 0.3,
) -> list[dict]:
    if group_by not in GROUP_BY_OPTIONS:
        group_by = "employee"
    statuses = ["confirmed"] if confirmed_only else ["confirmed", "pending"]
    stmt = select(OperationLog).where(
        OperationLog.work_date >= date_from, OperationLog.work_date <= date_to,
        OperationLog.status.in_(statuses), OperationLog.employee_id.is_not(None))
    if isinstance(warehouse_code, (list, tuple, set)):
        stmt = stmt.where(OperationLog.warehouse_code.in_(list(warehouse_code) or [""]))
    elif warehouse_code:
        stmt = stmt.where(OperationLog.warehouse_code == warehouse_code)
    if client:
        stmt = stmt.where(OperationLog.client == client)
    if supplier_id:
        stmt = stmt.where(OperationLog.supplier_id == supplier_id)
    if employee_id:
        stmt = stmt.where(OperationLog.employee_id == employee_id)
    logs = db.scalars(stmt).all()

    types = {t.id: t for t in db.scalars(select(OperationType)).all()}
    emp_ids = {l.employee_id for l in logs}
    fallback = _fallback_hours(db, emp_ids, date_from, date_to)

    # ── 1. Allocate actual hours per log (employee-day level) ────────────
    by_day: dict = defaultdict(list)
    for l in logs:
        by_day[(l.employee_id, l.work_date)].append(l)
    enriched = []
    for key, day_logs in by_day.items():
        own_hours = sum(l.hours or 0.0 for l in day_logs)
        earned = {}
        for l in day_logs:
            t = types.get(l.op_type_id)
            earned[l.id] = (l.qty / t.standard_uph) if (t and t.standard_uph > 0) else 0.0
        # 没填工时的记录分摊「班次工时 − 已填工时」；没有可分摊的工时则不计入效率
        fb_hours, fb_src = fallback.get(key, (0.0, None))
        missing = [l for l in day_logs if not l.hours]
        spare = max(0.0, fb_hours - own_hours)
        missing_earned = sum(earned[l.id] for l in missing)
        for l in day_logs:
            if l.hours:
                alloc, src = l.hours, "log"
            elif spare > 0:
                share = (earned[l.id] / missing_earned) if missing_earned > 0 else 1 / len(missing)
                alloc, src = spare * share, fb_src
            else:
                alloc, src = 0.0, "none"
            t = types.get(l.op_type_id)
            measured = bool(t and t.standard_uph > 0 and alloc > 0)
            enriched.append({
                "log": l, "type": t, "earned": earned[l.id] if measured else 0.0, "hours": alloc,
                "measured": measured, "hours_source": src,
            })

    # ── 2. Group ─────────────────────────────────────────────────────────
    def key_of(l: OperationLog, t: Optional[OperationType]):
        return {
            "employee": l.employee_id,
            "supplier": l.supplier_id or 0,
            "op_type": l.op_type_id,
            "client": l.client or "-",
            "warehouse": l.warehouse_code or "-",
            "date": str(l.work_date),
        }[group_by]

    groups: dict = {}
    for e in enriched:
        l, t = e["log"], e["type"]
        k = key_of(l, t)
        g = groups.setdefault(k, {
            "key": k, "qty": 0.0, "error_qty": 0.0, "earned_hours": 0.0, "measured_hours": 0.0,
            "total_hours": 0.0, "piece_amount": 0.0, "client_amount": 0.0, "employees": set(),
            "days": set(), "ops": defaultdict(float), "units": set(), "hours_sources": set(), "records": 0,
        })
        g["records"] += 1
        g["qty"] += l.qty or 0.0
        g["error_qty"] += l.error_qty or 0.0
        g["earned_hours"] += e["earned"]
        g["total_hours"] += e["hours"]
        if e["measured"]:
            g["measured_hours"] += e["hours"]
        if t:
            g["piece_amount"] += (l.qty or 0.0) * (t.piece_rate or 0.0)
            g["client_amount"] += (l.qty or 0.0) * (t.client_rate or 0.0)
            g["units"].add(t.unit)
        g["employees"].add(l.employee_id)
        g["days"].add(l.work_date)
        g["ops"][l.op_code or "?"] += l.qty or 0.0
        g["hours_sources"].add(e["hours_source"])

    # ── 3. Quality events ────────────────────────────────────────────────
    qstmt = select(QualityEvent).where(QualityEvent.event_date >= date_from, QualityEvent.event_date <= date_to)
    if isinstance(warehouse_code, (list, tuple, set)):
        qstmt = qstmt.where(QualityEvent.warehouse_code.in_(list(warehouse_code) or [""]))
    elif warehouse_code:
        qstmt = qstmt.where(QualityEvent.warehouse_code == warehouse_code)
    if client:
        qstmt = qstmt.where(QualityEvent.client == client)
    if supplier_id:
        qstmt = qstmt.where(QualityEvent.supplier_id == supplier_id)
    if employee_id:
        qstmt = qstmt.where(QualityEvent.employee_id == employee_id)
    qpoints: dict = defaultdict(float)
    qcount: dict = defaultdict(int)
    qdeduct: dict = defaultdict(float)
    for q in db.scalars(qstmt).all():
        k = {
            "employee": q.employee_id, "supplier": q.supplier_id or 0, "op_type": None,
            "client": q.client or "-", "warehouse": q.warehouse_code or "-", "date": str(q.event_date),
        }[group_by]
        if k is None:
            continue
        qpoints[k] += QUALITY_POINTS.get(q.severity, 5)
        qcount[k] += 1
        qdeduct[k] += q.deduction or 0.0

    # ── 4. Labels ────────────────────────────────────────────────────────
    labels: dict = {}
    if group_by == "employee":
        for emp in db.scalars(select(Employee).where(Employee.id.in_(list(groups.keys()) or [-1]))).all():
            labels[emp.id] = {"label": emp.name, "emp_no": emp.emp_no, "supplier_id": emp.supplier_id,
                              "source_type": emp.source_type, "grade": emp.grade}
    sup_names = {s.id: s.name for s in db.scalars(select(Supplier)).all()}
    if group_by == "supplier":
        for k in groups:
            labels[k] = {"label": sup_names.get(k, "自有员工") if k else "自有员工"}
    if group_by == "op_type":
        for k in groups:
            t = types.get(k)
            labels[k] = {"label": t.name if t else "?", "code": t.code if t else None,
                         "unit": t.unit if t else None, "standard_uph": t.standard_uph if t else None}

    # ── 5. Scores ────────────────────────────────────────────────────────
    out = []
    for k, g in groups.items():
        headcount = len(g["employees"]) or 1
        efficiency = round(g["earned_hours"] / g["measured_hours"] * 100, 1) if g["measured_hours"] > 0 else None
        error_rate = (g["error_qty"] / g["qty"] * 100) if g["qty"] > 0 else 0.0
        points = qpoints.get(k, 0.0) / (headcount if group_by in ("supplier", "client", "warehouse", "date") else 1)
        quality = max(0.0, min(100.0, 100 - points - error_rate * ERROR_RATE_PENALTY))
        score = None
        if efficiency is not None:
            eff_score = min(efficiency, EFFICIENCY_CAP) * (100 / EFFICIENCY_CAP)
            wsum = (w_efficiency + w_quality) or 1
            score = round((eff_score * w_efficiency + quality * w_quality) / wsum, 1)
        row = {
            "key": k,
            **labels.get(k, {"label": str(k)}),
            "records": g["records"],
            "headcount": len(g["employees"]),
            "days": len(g["days"]),
            "qty": round(g["qty"], 2),
            "error_qty": round(g["error_qty"], 2),
            "error_rate": round(error_rate, 2),
            "earned_hours": round(g["earned_hours"], 2),
            "measured_hours": round(g["measured_hours"], 2),
            "total_hours": round(g["total_hours"], 2),
            "uph": round(g["qty"] / g["total_hours"], 1) if g["total_hours"] > 0 else None,
            "efficiency": efficiency,
            "quality_events": qcount.get(k, 0),
            "quality_score": round(quality, 1),
            "score": score,
            "grade": grade_for(score),
            "piece_amount": round(g["piece_amount"], 2),
            "client_amount": round(g["client_amount"], 2),
            "deductions": round(qdeduct.get(k, 0.0), 2),
            "hours_sources": sorted(s for s in g["hours_sources"] if s),
            "ops": {c: round(v, 2) for c, v in g["ops"].items()},
        }
        if group_by == "employee":
            row["supplier_name"] = sup_names.get(row.get("supplier_id")) if row.get("supplier_id") else "自有"
        out.append(row)

    if group_by == "date":
        out.sort(key=lambda r: r["key"])
    else:
        out.sort(key=lambda r: (r["score"] is None, -(r["score"] or 0), -r["qty"]))
    for i, r in enumerate(out, start=1):
        r["rank"] = i
    return out
