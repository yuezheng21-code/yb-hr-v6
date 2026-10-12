"""
渊博579 HR V7 — 人事档案 / 文书模板 / SOP
/api/v1/personnel

人事档案仅 admin / hr 可访问（含证件、合同、工资等敏感个人数据）。
SOP 学习资料：所有内部账号可阅读并确认学习；admin / hr / mgr 可维护。
"""
from __future__ import annotations
import io
import json
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from urllib.parse import quote
from pydantic import BaseModel, Field
from sqlalchemy import or_, select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.clock import ClockEvent
from backend.models.timesheet import Timesheet
from backend.models.dispatch import TalentPool
from backend.models.personnel import (
    FileBlob, EmployeeDocument, EmployeeContract, LeaveRecord, EmployeeEvent, PersonnelApproval, PersonnelApprovalAudit, DocTemplate, SopDocument, SopAck,
)
from backend.models.audit_log import AuditLog
from backend.services import settings_store
from backend.services.doc_render import fields_of, build_context, fill, to_html, to_docx, AUTO_FIELDS
from backend.services.file_store import store_upload, store_bytes, file_response, blob_meta
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services.performance import compute_performance
from backend.services.access import (
    approval_types,
    require_approval_permission,
    require_employee_access,
    require_employee_assignment_scope,
    require_permission,
    scoped_employees,
)
from backend.routers.exports import Column, TableIn, _pdf, _xlsx

router = APIRouter(prefix="/api/v1/personnel", tags=["personnel"])

SOP_EDIT_ROLES = {"admin", "hr", "mgr"}
DOC_CATEGORIES = ["id_doc", "work_permit", "application", "contract", "amendment", "salary", "performance",
                  "leave", "warning", "termination", "certificate", "training", "other"]
LEAVE_TYPES = ["urlaub", "krank", "kind_krank", "unbezahlt", "sonderurlaub", "elternzeit", "sonstiges"]
CONTRACT_TYPES = ["befristet", "unbefristet", "minijob", "werkstudent", "aushilfe"]
TERMINATION_TYPES = ["ordentlich", "fristlos", "aufhebung", "befristung_ende", "eigenkuendigung", "probezeit"]
TEMPLATE_CATEGORIES = ["contract", "amendment", "warning", "termination", "certificate", "other"]
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
SOP_CATEGORIES = ["safety", "process", "quality", "client", "onboarding", "other"]


def _hr(user: User) -> None:
    require_permission(user, "personnel.read")


def _emp(db: Session, emp_id: int) -> Employee:
    emp = db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(404, "员工不存在")
    return emp


def _scoped_emp(db: Session, emp_id: int, user: User, permission: str = "personnel.read") -> Employee:
    return require_employee_access(db, emp_id, user, permission)


def _row(obj) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


APPROVAL_LABELS = {"leave": "请假", "salary": "调薪", "termination": "离职"}
PENDING_APPROVAL_STATUSES = {"pending", "requested"}


def _actor(user: User) -> str:
    return user.display_name or user.username


def _approval_audit(db: Session, approval: PersonnelApproval, action: str, user: User, note: Optional[str] = None) -> None:
    """Write both a workflow audit entry and the shared administrator audit log."""
    actor = _actor(user)
    db.add(PersonnelApprovalAudit(approval_id=approval.id, action=action, actor=actor, note=note))
    db.add(AuditLog(
        username=user.username,
        user_display=user.display_name,
        action=f"personnel_{action}",
        target_table="personnel_approvals",
        target_id=str(approval.id),
        detail=f"{approval.approval_type}: {note or ''}".strip(),
    ))


def _approval_status_filter(status: str):
    return PersonnelApproval.status.in_(PENDING_APPROVAL_STATUSES) if status in PENDING_APPROVAL_STATUSES else PersonnelApproval.status == status


def _approval_payload(approval: PersonnelApproval) -> dict:
    try:
        return json.loads(approval.payload)
    except (TypeError, json.JSONDecodeError):
        return {}


def _event(db: Session, emp: Employee, event_type: str, title: str, user: User, event_date: Optional[date] = None,
           details: Optional[dict] = None, contract_id=None, leave_id=None) -> EmployeeEvent:
    ev = EmployeeEvent(employee_id=emp.id, event_type=event_type, event_date=event_date or date.today(), title=title[:200],
                       details=json.dumps(details, ensure_ascii=False, default=str) if details else None,
                       contract_id=contract_id, leave_id=leave_id, created_by=user.display_name)
    db.add(ev)
    db.flush()
    return ev


def _workdays(start: date, end: date) -> float:
    days, d = 0, start
    while d <= end:
        if d.weekday() < 5:
            days += 1
        d += timedelta(days=1)
    return float(days)


CHANGE_TYPES = {"hired", "contract", "amendment", "salary", "performance", "warning", "leave", "termination"}
GRADE_STANDARDS = {
    "P1": {"title": "新员工", "minimum_months": 0, "requirements": ["完成入职与安全培训", "连续 20 个排班日出勤率 ≥ 95%"]},
    "P2": {"title": "熟练工", "minimum_months": 3, "requirements": ["近 3 个月出勤率 ≥ 96%", "无有效纪律处分", "岗位技能核验通过"]},
    "P3": {"title": "高级熟练工", "minimum_months": 6, "requirements": ["近 3 个月出勤率 ≥ 97%", "质量/效率达到仓库目标", "可独立带教"]},
    "P4": {"title": "组长", "minimum_months": 9, "requirements": ["近 6 个月无重大安全事故", "带班与交接核验通过", "主管审批"]},
    "P5": {"title": "高级组长", "minimum_months": 12, "requirements": ["近 6 个月团队出勤率 ≥ 97%", "可处理异常与排班", "HR 与运营联合审批"]},
    "P6": {"title": "主管", "minimum_months": 18, "requirements": ["负责仓库 KPI 达标", "成本与工时核验通过", "区域经理审批"]},
    "P7": {"title": "高级主管", "minimum_months": 24, "requirements": ["跨仓调度能力核验", "连续两个季度 KPI 达标", "区域经理与 HR 审批"]},
    "P8": {"title": "区域经理", "minimum_months": 36, "requirements": ["区域成本与合规达标", "人才梯队与客户满意度核验", "管理层审批"]},
    "P9": {"title": "运营负责人", "minimum_months": 48, "requirements": ["年度经营目标达标", "全区域合规与风险核验", "管理员最终审批"]},
}


@router.get("/promotion-standards")
def promotion_standards(user: User = Depends(get_current_user)):
    require_permission(user, "personnel.read")
    return GRADE_STANDARDS


@router.get("/attendance-cost")
def attendance_cost(month: str = Query(..., pattern=r"^\d{4}-\d{2}$"), warehouse: Optional[str] = Query(None),
                    user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Monthly attendance, no-show and paid-absence cost; restricted to the caller's employee scope."""
    require_permission(user, "changes.read")
    try:
        month_start = date.fromisoformat(month + "-01")
    except ValueError:
        raise HTTPException(400, "月份格式应为 YYYY-MM")
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    employees = db.scalars(scoped_employees(select(Employee).where(Employee.status == "active"), user)).all()
    if warehouse:
        employees = [emp for emp in employees if emp.primary_warehouse == warehouse]
    employee_ids = [emp.id for emp in employees]
    if not employee_ids:
        return {"month": month, "employees": [], "summary": {"scheduled_days": 0, "attended_days": 0, "no_show_days": 0, "paid_absence_cost": 0, "late_paperwork_days": 0}}
    clocked = {(row.employee_id, row.work_date) for row in db.scalars(select(ClockEvent).where(
        ClockEvent.employee_id.in_(employee_ids), ClockEvent.clock_type == "in", ClockEvent.work_date >= month_start, ClockEvent.work_date < next_month)).all()}
    documented = {(row.employee_id, row.work_date) for row in db.scalars(select(Timesheet).where(
        Timesheet.employee_id.in_(employee_ids), Timesheet.work_date >= month_start, Timesheet.work_date < next_month)).all()}
    approved_leave = {(row.employee_id, day) for row in db.scalars(select(LeaveRecord).where(
        LeaveRecord.employee_id.in_(employee_ids), LeaveRecord.status == "approved", LeaveRecord.start_date < next_month, LeaveRecord.end_date >= month_start)).all()
        for day in (row.start_date + timedelta(days=n) for n in range((row.end_date - row.start_date).days + 1))}
    workdays = [month_start + timedelta(days=n) for n in range((next_month - month_start).days) if (month_start + timedelta(days=n)).weekday() < 5]
    output, totals = [], {"scheduled_days": 0, "attended_days": 0, "no_show_days": 0, "paid_absence_cost": 0.0, "late_paperwork_days": 0}
    for emp in employees:
        scheduled = [day for day in workdays if not emp.join_date or day >= emp.join_date]
        attended = sum((emp.id, day) in clocked for day in scheduled)
        no_show = sum((emp.id, day) not in clocked and (emp.id, day) not in approved_leave for day in scheduled)
        late = sum((emp.id, day) in clocked and (emp.id, day) not in documented for day in scheduled)
        cost = round(no_show * 8 * (emp.hourly_rate or 0), 2)
        row = {"employee_id": emp.id, "employee": emp.name, "emp_no": emp.emp_no, "warehouse": emp.primary_warehouse,
               "grade": emp.grade, "scheduled_days": len(scheduled), "attended_days": attended, "no_show_days": no_show,
               "attendance_rate": round(attended / len(scheduled) * 100, 1) if scheduled else 0, "paid_absence_cost": cost,
               "late_paperwork_days": late}
        output.append(row)
        for key in ("scheduled_days", "attended_days", "no_show_days", "late_paperwork_days"): totals[key] += row[key]
        totals["paid_absence_cost"] += cost
    totals["paid_absence_cost"] = round(totals["paid_absence_cost"], 2)
    return {"month": month, "employees": output, "summary": totals}


def _change_rows(db: Session, user: User, employee_id: Optional[int] = None, warehouse: Optional[str] = None,
                 supplier_id: Optional[int] = None, biz_line: Optional[str] = None, event_type: Optional[str] = None,
                 date_from: Optional[date] = None, date_to: Optional[date] = None,
                 approval_status: Optional[str] = None) -> list[dict]:
    stmt = scoped_employees(
        select(EmployeeEvent, Employee, PersonnelApproval)
        .join(Employee, Employee.id == EmployeeEvent.employee_id)
        .outerjoin(
            PersonnelApproval,
            or_(
               PersonnelApproval.request_event_id == EmployeeEvent.id,
               PersonnelApproval.event_id == EmployeeEvent.id,
            ),
        ),
        user,
    )
    stmt = stmt.where(EmployeeEvent.event_type.in_(CHANGE_TYPES))
    if employee_id: stmt = stmt.where(Employee.id == employee_id)
    if warehouse: stmt = stmt.where(Employee.primary_warehouse == warehouse)
    if supplier_id: stmt = stmt.where(Employee.supplier_id == supplier_id)
    if biz_line: stmt = stmt.where(Employee.biz_line == biz_line)
    if event_type: stmt = stmt.where(EmployeeEvent.event_type == event_type)
    if date_from: stmt = stmt.where(EmployeeEvent.event_date >= date_from)
    if date_to: stmt = stmt.where(EmployeeEvent.event_date <= date_to)
    if approval_status:
        stmt = stmt.where(_approval_status_filter(approval_status))
    rows = []
    for event, emp, approval in db.execute(stmt.order_by(EmployeeEvent.event_date.desc(), EmployeeEvent.id.desc())).all():
        rows.append({
            "id": event.id,
            "date": event.event_date,
            "type": event.event_type,
            "title": event.title,
            "employee_id": emp.id,
            "employee": emp.name,
            "emp_no": emp.emp_no,
            "warehouse": emp.primary_warehouse,
            "supplier_id": emp.supplier_id,
            "biz_line": emp.biz_line,
            "created_by": event.created_by,
            "approval_status": "pending" if approval and approval.status == "requested" else (approval.status if approval else None),
            "details": json.loads(event.details) if event.details else None,
        })
    return rows


@router.get("/changes")
def change_summary(employee_id: Optional[int] = Query(None), warehouse: Optional[str] = Query(None),
                   supplier_id: Optional[int] = Query(None), biz_line: Optional[str] = Query(None),
                   event_type: Optional[str] = Query(None), date_from: Optional[date] = Query(None),
                   date_to: Optional[date] = Query(None), approval_status: Optional[str] = Query(None),
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_permission(user, "changes.read")
    return _change_rows(db, user, employee_id, warehouse, supplier_id, biz_line, event_type, date_from, date_to, approval_status)


@router.get("/changes/export")
def export_changes(format: str = Query("xlsx", pattern="^(xlsx|pdf)$"), employee_id: Optional[int] = Query(None),
                   warehouse: Optional[str] = Query(None), supplier_id: Optional[int] = Query(None),
                   biz_line: Optional[str] = Query(None), event_type: Optional[str] = Query(None),
                   date_from: Optional[date] = Query(None), date_to: Optional[date] = Query(None),
                   approval_status: Optional[str] = Query(None),
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    require_permission(user, "changes.export")
    rows = _change_rows(db, user, employee_id, warehouse, supplier_id, biz_line, event_type, date_from, date_to, approval_status)
    table = TableIn(title="工人变更汇总", subtitle="服务端按当前账户授权范围生成",
                   columns=[Column(label=x) for x in ["日期", "员工", "工号", "类别", "审批状态", "变更内容", "仓库", "供应商", "业务线", "操作人"]],
                   rows=[[str(r["date"]), r["employee"], r["emp_no"], r["type"], r["approval_status"], r["title"], r["warehouse"], r["supplier_id"], r["biz_line"], r["created_by"]] for r in rows])
    data = _xlsx(table, user) if format == "xlsx" else _pdf(table, user)
    media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" if format == "xlsx" else "application/pdf"
    ext = "xlsx" if format == "xlsx" else "pdf"
    return Response(data, media_type=media, headers={"Content-Disposition": f'attachment; filename="employee_changes.{ext}"', "Cache-Control": "private, no-store"})


def _active_contract(db: Session, emp_id: int) -> Optional[EmployeeContract]:
    return db.scalar(select(EmployeeContract).where(EmployeeContract.employee_id == emp_id,
                                                    EmployeeContract.status == "active")
                     .order_by(EmployeeContract.start_date.desc(), EmployeeContract.id.desc()))


def _doc_dict(d: EmployeeDocument, blob: Optional[FileBlob]) -> dict:
    return {**_row(d), "file": blob_meta(blob)}


def _scoped_document(db: Session, doc_id: int, user: User) -> EmployeeDocument:
    doc = db.scalar(scoped_employees(
        select(EmployeeDocument)
        .join(Employee, Employee.id == EmployeeDocument.employee_id)
        .where(EmployeeDocument.id == doc_id),
        user,
    ))
    if doc is None or doc.is_deleted:
        raise HTTPException(404, "文件不存在")
    return doc


# ═════════════════════════════════════════════════════════════════════
#  档案总览
# ═════════════════════════════════════════════════════════════════════
@router.get("/meta")
def meta(user: User = Depends(get_current_user)):
    return {"doc_categories": DOC_CATEGORIES, "leave_types": LEAVE_TYPES, "contract_types": CONTRACT_TYPES,
            "termination_types": TERMINATION_TYPES, "template_categories": TEMPLATE_CATEGORIES,
            "sop_categories": SOP_CATEGORIES, "auto_fields": AUTO_FIELDS}


@router.get("/employees/{emp_id}")
def employee_file(emp_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    emp = _scoped_emp(db, emp_id, user)
    docs = db.execute(select(EmployeeDocument, FileBlob).join(FileBlob, FileBlob.id == EmployeeDocument.file_id)
                      .where(EmployeeDocument.employee_id == emp_id, EmployeeDocument.is_deleted == False)  # noqa: E712
                      .order_by(EmployeeDocument.created_at.desc())).all()
    contracts = db.scalars(select(EmployeeContract).where(EmployeeContract.employee_id == emp_id)
                           .order_by(EmployeeContract.start_date.desc(), EmployeeContract.id.desc())).all()
    events = db.scalars(select(EmployeeEvent).where(EmployeeEvent.employee_id == emp_id)
                        .order_by(EmployeeEvent.event_date.desc(), EmployeeEvent.id.desc())).all()
    leaves = db.scalars(select(LeaveRecord).where(LeaveRecord.employee_id == emp_id)
                        .order_by(LeaveRecord.start_date.desc())).all()
    year = date.today().year
    active = _active_contract(db, emp_id)
    used = sum(l.days for l in leaves if l.leave_type == "urlaub" and l.status == "approved" and l.start_date.year == year)
    sick = sum(l.days for l in leaves if l.leave_type in ("krank", "kind_krank") and l.status == "approved" and l.start_date.year == year)
    month_start = date.today().replace(day=1)
    perf = compute_performance(db, month_start, date.today(), group_by="employee", employee_id=emp_id)
    events_by_id = {}
    for d, b in docs:
        if d.event_id:
            events_by_id.setdefault(d.event_id, []).append({"id": d.id, "title": d.title})
    return {
        "employee": _row(emp),
        "active_contract": _row(active) if active else None,
        "contracts": [_row(c) for c in contracts],
        "documents": [_doc_dict(d, b) for d, b in docs],
        "events": [{**_row(e), "details": json.loads(e.details) if e.details else None,
                    "documents": events_by_id.get(e.id, [])} for e in events],
        "leaves": [_row(l) for l in leaves],
        "leave_summary": {"year": year, "vacation_entitlement": active.vacation_days if active else None,
                          "vacation_used": used, "sick_days": sick},
        "performance_month": perf[0] if perf else None,
    }


@router.get("/reminders")
def reminders(days: int = Query(60, ge=1, le=365), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """即将到期：合同结束、试用期结束、证件/工作许可到期。"""
    _hr(user)
    today = date.today()
    horizon = today + timedelta(days=days)
    employees = db.scalars(scoped_employees(select(Employee), user)).all()
    names = {e.id: (e.name, e.emp_no) for e in employees}
    employee_ids = list(names)
    if not employee_ids:
        return []
    out = []
    for c in db.scalars(select(EmployeeContract).where(
        EmployeeContract.employee_id.in_(employee_ids),
        EmployeeContract.status == "active",
    )).all():
        for kind, d in (("contract_end", c.end_date), ("probation_end", c.probation_end)):
            if d and today - timedelta(days=7) <= d <= horizon:
                out.append({"kind": kind, "date": d, "employee_id": c.employee_id,
                            "employee": names.get(c.employee_id, ("?", ""))[0], "ref": c.contract_no})
    for d in db.scalars(select(EmployeeDocument).where(
        EmployeeDocument.employee_id.in_(employee_ids),
        EmployeeDocument.is_deleted == False,  # noqa: E712
        EmployeeDocument.valid_until.is_not(None),
        EmployeeDocument.valid_until <= horizon,
    )).all():
        out.append({"kind": "document_expiry", "date": d.valid_until, "employee_id": d.employee_id,
                    "employee": names.get(d.employee_id, ("?", ""))[0], "ref": d.title})
    return sorted(out, key=lambda r: r["date"])


# ═════════════════════════════════════════════════════════════════════
#  档案文件
# ═════════════════════════════════════════════════════════════════════
@router.post("/employees/{emp_id}/documents", status_code=201)
async def upload_document(
    emp_id: int,
    file: UploadFile = File(...),
    category: str = Form("other"),
    title: Optional[str] = Form(None),
    valid_until: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    event_id: Optional[int] = Form(None),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    _hr(user)
    require_permission(user, "employees.write")
    emp = _scoped_emp(db, emp_id, user)
    if category not in DOC_CATEGORIES:
        raise HTTPException(400, f"未知文件类别 {category}")
    if event_id:
        ev = db.get(EmployeeEvent, event_id)
        if ev is None or ev.employee_id != emp.id:
            raise HTTPException(400, "关联的事件不属于该员工")
    blob = await store_upload(db, file, user.display_name)
    doc = EmployeeDocument(employee_id=emp.id, category=category, title=(title or blob.filename)[:200], file_id=blob.id,
                           source="upload", event_id=event_id, notes=notes, uploaded_by=user.display_name,
                           valid_until=date.fromisoformat(valid_until) if valid_until else None)
    db.add(doc)
    db.flush()
    if not event_id:
        _event(db, emp, "document", f"上传文件：{doc.title}", user, details={"category": category, "document_id": doc.id})
    db.commit()
    return _doc_dict(doc, blob)


@router.get("/documents/{doc_id}/file")
def download_document(doc_id: int, inline: bool = False, user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    _hr(user)
    doc = _scoped_document(db, doc_id, user)
    return file_response(db.get(FileBlob, doc.file_id), inline=inline)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """软删除：文件仍保留在数据库中以备审计，档案中不再显示。"""
    _hr(user)
    require_permission(user, "employees.write")
    doc = _scoped_document(db, doc_id, user)
    doc.is_deleted, doc.deleted_by, doc.deleted_at = True, user.display_name, datetime.utcnow()
    _event(db, db.get(Employee, doc.employee_id), "note", f"删除文件：{doc.title}", user, details={"document_id": doc.id})
    db.commit()
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════
#  录用 / 合同 / 修订 / 调薪 / 绩效 / 请假 / 警告 / 离职 / 备注
# ═════════════════════════════════════════════════════════════════════
class HireIn(BaseModel):
    join_date: date
    position: Optional[str] = None
    primary_warehouse: Optional[str] = None
    grade: str = "P1"
    hourly_rate: Optional[float] = None
    source_type: str = "own"
    supplier_id: Optional[int] = None
    biz_line: str = "渊博"


@router.post("/talent/{talent_id}/hire", status_code=201)
def hire_from_talent(talent_id: int, body: HireIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """人才库候选人 → 员工档案（招聘与人事打通）。"""
    _hr(user)
    require_permission(user, "employees.write")
    require_employee_assignment_scope(
        db,
        user,
        supplier_id=body.supplier_id,
        warehouse=body.primary_warehouse,
        biz_line=body.biz_line,
    )
    t = db.get(TalentPool, talent_id)
    if t is None:
        raise HTTPException(404, "候选人不存在")
    if t.pool_status == "hired" and "→ 员工" in (t.notes or ""):
        raise HTTPException(400, "该候选人已转为员工")
    from backend.routers.employees import _next_emp_no
    emp = Employee(emp_no=_next_emp_no(db), name=t.name, phone=t.phone, nationality=t.nationality,
                   languages=t.languages, skills=t.skills, position=body.position or t.position,
                   primary_warehouse=body.primary_warehouse, grade=body.grade,
                   hourly_rate=body.hourly_rate or t.expected_rate, source_type=body.source_type,
                   supplier_id=body.supplier_id, biz_line=body.biz_line, status="active", join_date=body.join_date)
    db.add(emp)
    db.flush()
    t.pool_status = "hired"
    t.notes = ((t.notes + "\n") if t.notes else "") + f"→ 员工 {emp.emp_no}（{date.today():%Y-%m-%d} {user.display_name}）"
    ev = _event(db, emp, "hired", "录用入职", user, event_date=body.join_date,
                details={"from_talent_id": t.id, "referrer": t.referrer, "position": emp.position, "source": t.source})
    if t.cv_file_id:  # 官网投递的简历归入员工档案
        db.add(EmployeeDocument(employee_id=emp.id, category="application", title="简历 / Lebenslauf",
                                file_id=t.cv_file_id, event_id=ev.id, uploaded_by=user.display_name))
    emp.email = emp.email or t.email
    db.commit()
    return {"employee_id": emp.id, "emp_no": emp.emp_no}


class ContractIn(BaseModel):
    contract_type: str = "befristet"
    position: Optional[str] = None
    warehouse_code: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    probation_end: Optional[date] = None
    weekly_hours: float = Field(40.0, gt=0, le=60)
    hourly_rate: float = Field(..., gt=0)
    vacation_days: int = Field(24, ge=0, le=60)
    notice_period: Optional[str] = None
    signed_date: Optional[date] = None
    status: str = "active"  # draft / active
    notes: Optional[str] = None


def _check_contract(body) -> None:
    if body.contract_type not in CONTRACT_TYPES:
        raise HTTPException(400, f"未知合同类型 {body.contract_type}")
    if body.end_date and body.end_date < body.start_date:
        raise HTTPException(400, "结束日期早于开始日期")
    if body.contract_type == "befristet" and not body.end_date:
        raise HTTPException(400, "定期合同需填写结束日期")
    if body.hourly_rate < settings_store.get("p1_hourly_rate") * 0.9:
        raise HTTPException(400, f"时薪 {body.hourly_rate} 低于系统设置的最低时薪参考，请核对（MiLoG）")


@router.post("/employees/{emp_id}/contracts", status_code=201)
def create_contract(emp_id: int, body: ContractIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    emp = _scoped_emp(db, emp_id, user, "employees.write")
    _check_contract(body)
    if body.status not in ("draft", "active"):
        raise HTTPException(400, "status 只能是 draft 或 active")
    require_employee_assignment_scope(
        db,
        user,
        supplier_id=emp.supplier_id,
        warehouse=body.warehouse_code or emp.primary_warehouse,
        biz_line=emp.biz_line,
    )
    active_contract = _active_contract(db, emp.id)
    if body.status == "active" and active_contract and body.hourly_rate != emp.hourly_rate:
        raise HTTPException(409, "已有生效合同的调薪必须先提交并执行调薪审批")
    data = body.model_dump()
    data["probation_end"] = body.probation_end or (body.start_date + timedelta(days=182))  # default: 6 months
    c = EmployeeContract(employee_id=emp.id, created_by=user.display_name,
                         contract_no=next_sequence_no(db, EmployeeContract, EmployeeContract.contract_no, make_prefix("AV")),
                         **data)
    if c.status == "active":
        for old in db.scalars(select(EmployeeContract).where(EmployeeContract.employee_id == emp.id,
                                                             EmployeeContract.status == "active")).all():
            old.status = "ended"
        emp.hourly_rate = c.hourly_rate
        emp.position = c.position or emp.position
        emp.primary_warehouse = c.warehouse_code or emp.primary_warehouse
        emp.join_date = emp.join_date or c.start_date
        emp.status = "active"
    db.add(c)
    db.flush()
    ev = _event(db, emp, "contract", f"签订{'（草稿）' if c.status == 'draft' else ''}劳动合同 {c.contract_no}", user,
                event_date=c.signed_date or c.start_date, contract_id=c.id,
                details={"type": c.contract_type, "start": c.start_date, "end": c.end_date, "hourly_rate": c.hourly_rate,
                         "weekly_hours": c.weekly_hours})
    db.commit()
    return {**_row(c), "event_id": ev.id}


class AmendIn(BaseModel):
    effective_date: date
    change_summary: str
    position: Optional[str] = None
    warehouse_code: Optional[str] = None
    end_date: Optional[date] = None
    weekly_hours: Optional[float] = Field(None, gt=0, le=60)
    hourly_rate: Optional[float] = Field(None, gt=0)
    vacation_days: Optional[int] = Field(None, ge=0, le=60)
    notice_period: Optional[str] = None


@router.post("/contracts/{contract_id}/amend", status_code=201)
def amend_contract(contract_id: int, body: AmendIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """合同修改：生成新版本（parent_id 指向原合同），原合同标记为已修订。"""
    _hr(user)
    require_permission(user, "employees.write")
    old = db.get(EmployeeContract, contract_id)
    if old is None:
        raise HTTPException(404, "合同不存在")
    if old.status != "active":
        raise HTTPException(400, "只能修改生效中的合同")
    emp = _scoped_emp(db, old.employee_id, user, "employees.write")
    if body.hourly_rate is not None and body.hourly_rate != old.hourly_rate:
        raise HTTPException(409, "调薪必须先提交并执行调薪审批")
    require_employee_assignment_scope(
        db,
        user,
        supplier_id=emp.supplier_id,
        warehouse=body.warehouse_code or emp.primary_warehouse,
        biz_line=emp.biz_line,
    )
    changes = body.model_dump(exclude_unset=True, exclude={"effective_date", "change_summary"})
    data = {c.name: getattr(old, c.name) for c in EmployeeContract.__table__.columns
            if c.name not in ("id", "contract_no", "parent_id", "status", "created_at", "created_by", "change_summary",
                              "signed_date")}
    data.update({k: v for k, v in changes.items() if v is not None})
    new = EmployeeContract(**data, contract_no=f"{old.contract_no}-N{db.scalar(select(func.count(EmployeeContract.id)).where(EmployeeContract.parent_id == old.id)) + 1}",
                           parent_id=old.id, status="active", change_summary=body.change_summary,
                           created_by=user.display_name)
    old.status = "amended"
    if new.position:
        emp.position = new.position
    db.add(new)
    db.flush()
    diff = {k: {"from": getattr(old, k), "to": v} for k, v in changes.items() if v is not None and getattr(old, k) != v}
    ev = _event(db, emp, "amendment", f"合同修订 {new.contract_no}：{body.change_summary[:80]}", user,
                event_date=body.effective_date, contract_id=new.id, details={"changes": diff, "parent": old.contract_no})
    db.commit()
    return {**_row(new), "event_id": ev.id}


class SalaryIn(BaseModel):
    new_rate: float = Field(..., gt=0)
    effective_date: date
    reason: Optional[str] = None


def _request_approval(db: Session, emp: Employee, approval_type: str, payload: dict, user: User) -> PersonnelApproval:
    approval = PersonnelApproval(
        employee_id=emp.id,
        approval_type=approval_type,
        status="pending",
        payload=json.dumps(payload, ensure_ascii=False),
        requested_by=_actor(user),
    )
    db.add(approval)
    db.flush()
    request_event = _event(
        db,
        emp,
        approval_type,
        f"{APPROVAL_LABELS[approval_type]}申请待审批",
        user,
        details={"approval_id": approval.id, "approval_status": "pending"},
    )
    approval.request_event_id = request_event.id
    _approval_audit(db, approval, "requested", user)
    return approval


def _scoped_approval_row(db: Session, approval_id: int, user: User):
    stmt = scoped_employees(
        select(PersonnelApproval, Employee)
        .join(Employee, Employee.id == PersonnelApproval.employee_id)
        .where(PersonnelApproval.id == approval_id),
        user,
    )
    return db.execute(stmt).first()


def _require_approval_view(user: User, approval: PersonnelApproval) -> None:
    if approval.approval_type in approval_types(user):
        return
    require_permission(user, "personnel.request")
    if approval.requested_by != _actor(user):
        raise HTTPException(404, "审批不存在")


def _approval_documents(db: Session, approval_ids: list[int]) -> dict[int, list[dict]]:
    if not approval_ids:
        return {}
    documents: dict[int, list[dict]] = {}
    rows = db.execute(
        select(EmployeeDocument, FileBlob)
        .join(FileBlob, FileBlob.id == EmployeeDocument.file_id)
        .where(EmployeeDocument.approval_id.in_(approval_ids), EmployeeDocument.is_deleted == False)  # noqa: E712
        .order_by(EmployeeDocument.created_at)
    ).all()
    for document, blob in rows:
        documents.setdefault(document.approval_id, []).append(_doc_dict(document, blob))
    return documents


def _approval_dict(
    approval: PersonnelApproval,
    employee: Employee,
    *,
    attachments: Optional[list[dict]] = None,
    audits: Optional[list[PersonnelApprovalAudit]] = None,
) -> dict:
    return {
        **_row(approval),
        "status": "pending" if approval.status == "requested" else approval.status,
        "payload": _approval_payload(approval),
        "employee_name": employee.name,
        "emp_no": employee.emp_no,
        "attachments": attachments or [],
        "audit": [{**_row(audit)} for audit in (audits or [])],
    }


@router.post("/employees/{emp_id}/salary", status_code=201)
def salary_change(emp_id: int, body: SalaryIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = _scoped_emp(db, emp_id, user, "personnel.request")
    approval = _request_approval(db, emp, "salary", body.model_dump(mode="json"), user)
    db.commit()
    return {"ok": True, "approval_id": approval.id, "status": approval.status}


class ReviewIn(BaseModel):
    period_from: date
    period_to: date
    rating: int = Field(..., ge=1, le=5)
    summary: Optional[str] = None
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    goals: Optional[str] = None
    include_ops: bool = True


@router.post("/employees/{emp_id}/reviews", status_code=201)
def performance_review(emp_id: int, body: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    emp = _scoped_emp(db, emp_id, user, "employees.write")
    ops = None
    if body.include_ops:
        rows = compute_performance(db, body.period_from, body.period_to, group_by="employee", employee_id=emp_id)
        if rows:
            r = rows[0]
            ops = {k: r.get(k) for k in ("efficiency", "quality_score", "score", "grade", "total_hours", "qty", "error_rate", "days")}
    ev = _event(db, emp, "performance", f"绩效评估 {body.period_from:%Y-%m-%d}—{body.period_to:%Y-%m-%d}：{body.rating}/5", user,
                event_date=body.period_to, details={**body.model_dump(exclude={"include_ops"}), "ops": ops})
    db.commit()
    return {"ok": True, "event_id": ev.id, "ops": ops}


class LeaveIn(BaseModel):
    leave_type: str
    start_date: date
    end_date: date
    days: Optional[float] = Field(None, ge=0)
    status: str = "pending"
    notes: Optional[str] = None


@router.post("/employees/{emp_id}/leaves", status_code=201)
def create_leave(emp_id: int, body: LeaveIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = _scoped_emp(db, emp_id, user, "personnel.request")
    if body.leave_type not in LEAVE_TYPES:
        raise HTTPException(400, f"未知请假类型 {body.leave_type}")
    if body.end_date < body.start_date:
        raise HTTPException(400, "结束日期早于开始日期")
    if body.status not in PENDING_APPROVAL_STATUSES:
        raise HTTPException(400, "状态无效")
    overlap = db.scalar(select(LeaveRecord.id).where(
        LeaveRecord.employee_id == emp_id, LeaveRecord.status != "rejected",
        LeaveRecord.start_date <= body.end_date, LeaveRecord.end_date >= body.start_date))
    if overlap:
        raise HTTPException(409, "与已有请假时间重叠")
    payload = body.model_dump(mode="json")
    payload.pop("status", None)
    payload["days"] = body.days if body.days is not None else _workdays(body.start_date, body.end_date)
    approval = _request_approval(db, emp, "leave", payload, user)
    db.commit()
    return {"ok": True, "approval_id": approval.id, "status": approval.status}


class LeaveStatusIn(BaseModel):
    status: str


@router.put("/leaves/{leave_id}")
def update_leave(leave_id: int, body: LeaveStatusIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    raise HTTPException(410, "请通过审批中心处理请假申请")


class WarningIn(BaseModel):
    incident_date: date
    reason: str
    description: Optional[str] = None


@router.post("/employees/{emp_id}/warnings", status_code=201)
def create_warning(emp_id: int, body: WarningIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    emp = _scoped_emp(db, emp_id, user, "employees.write")
    prior = db.scalar(select(func.count(EmployeeEvent.id)).where(EmployeeEvent.employee_id == emp_id,
                                                                 EmployeeEvent.event_type == "warning")) or 0
    ev = _event(db, emp, "warning", f"Abmahnung #{prior + 1}：{body.reason[:80]}", user, event_date=body.incident_date,
                details={**body.model_dump(), "count": prior + 1})
    db.commit()
    return {"ok": True, "event_id": ev.id, "warning_count": prior + 1}


class TerminateIn(BaseModel):
    last_day: date
    termination_type: str
    notice_date: Optional[date] = None
    reason: Optional[str] = None
    deactivate_login: bool = True


@router.post("/employees/{emp_id}/terminate", status_code=201)
def terminate(emp_id: int, body: TerminateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = _scoped_emp(db, emp_id, user, "personnel.request")
    if body.termination_type not in TERMINATION_TYPES:
        raise HTTPException(400, f"未知离职类型 {body.termination_type}")
    approval = _request_approval(db, emp, "termination", body.model_dump(mode="json"), user)
    db.commit()
    return {"ok": True, "approval_id": approval.id, "status": approval.status}


class ApprovalDecisionIn(BaseModel):
    status: str
    note: Optional[str] = None


@router.get("/approvals")
def list_approvals(status: Optional[str] = Query(None), employee_id: Optional[int] = Query(None),
                   user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed_types = approval_types(user)
    stmt = scoped_employees(select(PersonnelApproval, Employee).join(Employee, Employee.id == PersonnelApproval.employee_id), user)
    if allowed_types:
        stmt = stmt.where(PersonnelApproval.approval_type.in_(allowed_types))
    else:
        require_permission(user, "personnel.request")
        stmt = stmt.where(PersonnelApproval.requested_by == _actor(user))
    if status:
        stmt = stmt.where(_approval_status_filter(status))
    if employee_id:
        stmt = stmt.where(PersonnelApproval.employee_id == employee_id)
    rows = db.execute(stmt.order_by(PersonnelApproval.requested_at.desc())).all()
    attachments = _approval_documents(db, [approval.id for approval, _ in rows])
    return [_approval_dict(approval, employee, attachments=attachments.get(approval.id)) for approval, employee in rows]


@router.get("/approvals/{approval_id}")
def get_approval(approval_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _scoped_approval_row(db, approval_id, user)
    if row is None:
        raise HTTPException(404, "审批不存在")
    approval, employee = row
    _require_approval_view(user, approval)
    audits = db.scalars(
        select(PersonnelApprovalAudit)
        .where(PersonnelApprovalAudit.approval_id == approval.id)
        .order_by(PersonnelApprovalAudit.created_at, PersonnelApprovalAudit.id)
    ).all()
    return _approval_dict(
        approval,
        employee,
        attachments=_approval_documents(db, [approval.id]).get(approval.id),
        audits=audits,
    )


@router.post("/approvals/{approval_id}/attachments", status_code=201)
async def upload_approval_attachment(
    approval_id: int,
    file: UploadFile = File(...),
    category: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    require_permission(user, "personnel.request")
    row = _scoped_approval_row(db, approval_id, user)
    if row is None:
        raise HTTPException(404, "审批不存在")
    approval, employee = row
    if approval.status not in PENDING_APPROVAL_STATUSES:
        raise HTTPException(409, "只能为待审批申请添加附件")
    if approval.requested_by != _actor(user):
        raise HTTPException(403, "只有申请人可以添加附件")
    document_category = category or approval.approval_type
    if document_category not in DOC_CATEGORIES:
        raise HTTPException(400, f"未知文件类别 {document_category}")
    blob = await store_upload(db, file, _actor(user))
    document = EmployeeDocument(
        employee_id=employee.id,
        approval_id=approval.id,
        category=document_category,
        title=(title or blob.filename)[:200],
        file_id=blob.id,
        source="upload",
        event_id=approval.request_event_id,
        notes=notes,
        uploaded_by=_actor(user),
    )
    db.add(document)
    db.flush()
    _approval_audit(db, approval, "attachment_added", user, document.title)
    db.commit()
    return _doc_dict(document, blob)


def _execute_approval(db: Session, approval: PersonnelApproval, emp: Employee, user: User) -> EmployeeEvent:
    p = _approval_payload(approval)
    if approval.approval_type == "salary":
        old, new = emp.hourly_rate, float(p["new_rate"])
        emp.hourly_rate = new
        active = _active_contract(db, emp.id)
        pct = round((new - old) / old * 100, 1) if old else None
        return _event(db, emp, "salary", f"调薪：{old or '—'} → {new} €/h", user,
                      event_date=date.fromisoformat(p["effective_date"]), contract_id=active.id if active else None,
                      details={"from": old, "to": new, "percent": pct, "reason": p.get("reason"), "approval_id": approval.id,
                               "approval_status": "executed"})
    if approval.approval_type == "leave":
        start, end = date.fromisoformat(p["start_date"]), date.fromisoformat(p["end_date"])
        overlap = db.scalar(select(LeaveRecord.id).where(LeaveRecord.employee_id == emp.id, LeaveRecord.status != "rejected",
                            LeaveRecord.start_date <= end, LeaveRecord.end_date >= start))
        if overlap:
            raise HTTPException(409, "与已有请假时间重叠")
        leave = LeaveRecord(employee_id=emp.id, leave_type=p["leave_type"], start_date=start, end_date=end, days=float(p["days"]),
                            status="approved", notes=p.get("notes"), created_by=approval.requested_by, decided_by=user.display_name,
                            certificate_required=p["leave_type"] in ("krank", "kind_krank") and (end - start).days >= 3)
        db.add(leave); db.flush()
        return _event(db, emp, "leave", f"请假（{p['leave_type']}）{start:%m-%d}—{end:%m-%d}，{float(p['days']):g} 天", user,
                      event_date=start, leave_id=leave.id, details={"status": "approved", "approval_id": approval.id,
                                                                      "approval_status": "executed", "notes": p.get("notes")})
    if approval.approval_type == "termination":
        last_day = date.fromisoformat(p["last_day"])
        emp.leave_date = last_day
        if last_day <= date.today():
            emp.status = "inactive"
        for contract in db.scalars(select(EmployeeContract).where(EmployeeContract.employee_id == emp.id, EmployeeContract.status == "active")):
            contract.status = "ended"
            if not contract.end_date or contract.end_date > last_day:
                contract.end_date = last_day
        if p.get("deactivate_login") and emp.user_id and last_day <= date.today():
            linked = db.get(User, emp.user_id)
            if linked:
                linked.is_active = False
        return _event(db, emp, "termination", f"离职（{p['termination_type']}），最后工作日 {last_day:%Y-%m-%d}", user,
                      event_date=date.fromisoformat(p["notice_date"]) if p.get("notice_date") else date.today(),
                      details={**p, "approval_id": approval.id, "approval_status": "executed"})
    raise HTTPException(400, "未知审批类型")


@router.post("/approvals/{approval_id}/decision")
def decide_approval(approval_id: int, body: ApprovalDecisionIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _scoped_approval_row(db, approval_id, user)
    if row is None:
        raise HTTPException(404, "审批不存在")
    approval, emp = row
    require_approval_permission(user, approval.approval_type)
    if approval.status not in PENDING_APPROVAL_STATUSES:
        raise HTTPException(409, "该申请已处理")
    if approval.requested_by == _actor(user):
        raise HTTPException(403, "申请人不能审批自己的申请")
    if body.status not in {"approved", "rejected"}:
        raise HTTPException(400, "状态只能是 approved 或 rejected")
    if body.status == "rejected" and not (body.note or "").strip():
        raise HTTPException(400, "驳回时必须填写审批意见")
    now = datetime.utcnow()
    approval.decided_by, approval.decided_at, approval.decision_note = _actor(user), now, body.note
    if body.status == "approved":
        approval.status, approval.approved_by, approval.approved_at = "approved", _actor(user), now
        _approval_audit(db, approval, "approved", user, body.note)
        event = _execute_approval(db, approval, emp, user)
        approval.event_id = event.id
        approval.status, approval.executed_by, approval.executed_at = "executed", _actor(user), datetime.utcnow()
        _approval_audit(db, approval, "executed", user)
    else:
        approval.status = "rejected"
        event = _event(
            db,
            emp,
            approval.approval_type,
            f"{APPROVAL_LABELS[approval.approval_type]}申请被驳回",
            user,
            details={"approval_id": approval.id, "approval_status": "rejected", "note": body.note},
        )
        approval.event_id = event.id
        _approval_audit(db, approval, "rejected", user, body.note)
    db.commit()
    return _approval_dict(approval, emp, attachments=_approval_documents(db, [approval.id]).get(approval.id))


class NoteIn(BaseModel):
    title: str
    text: Optional[str] = None
    event_date: Optional[date] = None


@router.post("/employees/{emp_id}/notes", status_code=201)
def add_note(emp_id: int, body: NoteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    ev = _event(db, _scoped_emp(db, emp_id, user, "employees.write"), "note", body.title, user, event_date=body.event_date, details={"text": body.text})
    db.commit()
    return {"ok": True, "event_id": ev.id}


# ═════════════════════════════════════════════════════════════════════
#  文书模板
# ═════════════════════════════════════════════════════════════════════
class TemplateIn(BaseModel):
    code: str
    name: str
    category: str = "other"
    language: str = "de"
    description: Optional[str] = None
    body: str
    is_active: bool = True


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    description: Optional[str] = None
    body: Optional[str] = None
    is_active: Optional[bool] = None


def _tpl_dict(t: DocTemplate) -> dict:
    return {**_row(t), "fields": fields_of(t.body)}


@router.get("/templates")
def list_templates(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    return [_tpl_dict(t) for t in db.scalars(select(DocTemplate).order_by(DocTemplate.category, DocTemplate.name)).all()]


@router.post("/templates", status_code=201)
def create_template(body: TemplateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    if body.category not in TEMPLATE_CATEGORIES:
        raise HTTPException(400, "未知模板类别")
    code = body.code.strip().upper()
    if db.scalar(select(DocTemplate).where(DocTemplate.code == code)):
        raise HTTPException(409, f"模板代码已存在：{code}")
    t = DocTemplate(**{**body.model_dump(), "code": code}, updated_by=user.display_name)
    db.add(t)
    db.commit()
    return _tpl_dict(t)


@router.put("/templates/{tpl_id}")
def update_template(tpl_id: int, body: TemplateUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    require_permission(user, "employees.write")
    t = db.get(DocTemplate, tpl_id)
    if t is None:
        raise HTTPException(404, "模板不存在")
    data = body.model_dump(exclude_unset=True)
    if "category" in data and data["category"] not in TEMPLATE_CATEGORIES:
        raise HTTPException(400, "未知模板类别")
    if "body" in data and data["body"] != t.body:
        t.version = (t.version or 1) + 1
    for k, v in data.items():
        setattr(t, k, v)
    t.updated_by = user.display_name
    db.commit()
    return _tpl_dict(t)


class RenderIn(BaseModel):
    employee_id: int
    contract_id: Optional[int] = None
    values: dict = {}
    mode: str = "preview"  # preview / save / docx
    title: Optional[str] = None
    event_id: Optional[int] = None


@router.post("/templates/{tpl_id}/render")
def render_template(tpl_id: int, body: RenderIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """按模板为员工生成文书：preview 返回 HTML；docx 直接下载；save 生成 DOCX 存入员工档案。"""
    _hr(user)
    t = db.get(DocTemplate, tpl_id)
    if t is None:
        raise HTTPException(404, "模板不存在")
    emp = _scoped_emp(db, body.employee_id, user)
    contract = db.get(EmployeeContract, body.contract_id) if body.contract_id else (
        _active_contract(db, emp.id) or db.scalar(  # 离职员工：用最近一份合同
            select(EmployeeContract).where(EmployeeContract.employee_id == emp.id)
            .order_by(EmployeeContract.start_date.desc(), EmployeeContract.id.desc())))
    if contract is not None and contract.employee_id != emp.id:
        raise HTTPException(400, "合同不属于该员工")
    ctx = build_context(emp, contract, settings_store.get_all())
    values = {k: str(v) for k, v in (body.values or {}).items() if v not in (None, "")}
    text, missing = fill(t.body, ctx, values)
    title = (body.title or f"{t.name.split('（')[0]} – {emp.name}")[:200]
    if body.mode == "preview":
        return {"html": to_html(text), "missing": missing, "title": title,
                "fields": [{**f, "value": values.get(f["key"]) or ctx.get(f["key"], "")} for f in fields_of(t.body)]}
    data = to_docx(text, title)
    fname = f"{t.code}_{emp.emp_no}_{date.today():%Y%m%d}.docx"
    if body.mode == "docx":
        return Response(content=data, media_type=DOCX_MIME,
                        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(fname)}",
                                 "Cache-Control": "private, no-store"})
    if body.mode != "save":
        raise HTTPException(400, "mode 只能是 preview / docx / save")
    require_permission(user, "employees.write")
    if missing:
        raise HTTPException(400, f"还有未填写的字段：{', '.join(missing)}")
    blob = store_bytes(db, data, fname, None, user.display_name)
    category = t.category if t.category in DOC_CATEGORIES else "other"
    event_id = body.event_id
    if event_id:
        ev = db.get(EmployeeEvent, event_id)
        if ev is None or ev.employee_id != emp.id:
            raise HTTPException(400, "关联的事件不属于该员工")
    doc = EmployeeDocument(employee_id=emp.id, category=category, title=title, file_id=blob.id, source="generated",
                           template_id=t.id, event_id=event_id, uploaded_by=user.display_name,
                           notes=f"模板 {t.code} v{t.version}")
    db.add(doc)
    db.flush()
    if not event_id:
        _event(db, emp, "document", f"生成文书：{title}", user, details={"template": t.code, "version": t.version, "document_id": doc.id})
    db.commit()
    return _doc_dict(doc, blob)


# ═════════════════════════════════════════════════════════════════════
#  SOP 学习资料
# ═════════════════════════════════════════════════════════════════════
def _sop_reader(user: User) -> None:
    if user.role == "client":
        raise HTTPException(403, "Forbidden")


@router.get("/sop")
def list_sop(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _sop_reader(user)
    stmt = select(SopDocument).order_by(SopDocument.required.desc(), SopDocument.category, SopDocument.title)
    if user.role not in SOP_EDIT_ROLES:
        stmt = stmt.where(SopDocument.is_active == True)  # noqa: E712
    sops = db.scalars(stmt).all()
    mine = {(a.sop_id, a.version) for a in db.scalars(select(SopAck).where(SopAck.user_id == user.id)).all()}
    # 只统计当前版本的确认人数（SOP 更新版本后需重新学习）
    counts = {(sid, ver): n for sid, ver, n in db.execute(
        select(SopAck.sop_id, SopAck.version, func.count(SopAck.id)).group_by(SopAck.sop_id, SopAck.version)).all()}
    out = []
    for s in sops:
        blob = db.get(FileBlob, s.file_id) if s.file_id else None
        out.append({**_row(s), "file": blob_meta(blob), "acked": (s.id, s.version) in mine,
                    "ack_count": counts.get((s.id, s.version), 0) if user.role in SOP_EDIT_ROLES else None})
    return out


async def _sop_save(db: Session, user: User, s: SopDocument, title, category, language, warehouse_code, description,
                    content, version, required, file: Optional[UploadFile]) -> None:
    if category not in SOP_CATEGORIES:
        raise HTTPException(400, "未知 SOP 类别")
    s.title, s.category, s.language = title.strip()[:200], category, language
    s.warehouse_code = (warehouse_code or "").strip().upper() or None
    s.description, s.content, s.version, s.required = description, content, (version or "1.0")[:20], required
    if file is not None and file.filename:
        s.file_id = (await store_upload(db, file, user.display_name)).id
    if not s.file_id and not (s.content or "").strip():
        raise HTTPException(400, "请上传文件或填写正文")


@router.post("/sop", status_code=201)
async def create_sop(
    title: str = Form(...), category: str = Form("process"), language: str = Form("zh"),
    warehouse_code: Optional[str] = Form(None), description: Optional[str] = Form(None),
    content: Optional[str] = Form(None), version: str = Form("1.0"), required: bool = Form(False),
    file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role not in SOP_EDIT_ROLES:
        raise HTTPException(403, "Forbidden")
    s = SopDocument(created_by=user.display_name)
    await _sop_save(db, user, s, title, category, language, warehouse_code, description, content, version, required, file)
    db.add(s)
    db.commit()
    return _row(s)


@router.put("/sop/{sop_id}")
async def update_sop(
    sop_id: int,
    title: str = Form(...), category: str = Form("process"), language: str = Form("zh"),
    warehouse_code: Optional[str] = Form(None), description: Optional[str] = Form(None),
    content: Optional[str] = Form(None), version: str = Form("1.0"), required: bool = Form(False),
    is_active: bool = Form(True), file: Optional[UploadFile] = File(None),
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role not in SOP_EDIT_ROLES:
        raise HTTPException(403, "Forbidden")
    s = db.get(SopDocument, sop_id)
    if s is None:
        raise HTTPException(404, "SOP 不存在")
    await _sop_save(db, user, s, title, category, language, warehouse_code, description, content, version, required, file)
    s.is_active = is_active
    db.commit()
    return _row(s)


@router.get("/sop/{sop_id}/file")
def sop_file(sop_id: int, inline: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _sop_reader(user)
    s = db.get(SopDocument, sop_id)
    if s is None or not s.file_id or (not s.is_active and user.role not in SOP_EDIT_ROLES):
        raise HTTPException(404, "文件不存在")
    return file_response(db.get(FileBlob, s.file_id), inline=inline)


@router.post("/sop/{sop_id}/ack")
def ack_sop(sop_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """确认已学习（按版本记录；SOP 更新版本后需重新确认）。"""
    _sop_reader(user)
    s = db.get(SopDocument, sop_id)
    if s is None or not s.is_active:
        raise HTTPException(404, "SOP 不存在")
    exists = db.scalar(select(SopAck.id).where(SopAck.sop_id == sop_id, SopAck.user_id == user.id, SopAck.version == s.version))
    if not exists:
        emp = db.scalar(select(Employee).where(Employee.user_id == user.id)) or \
            db.scalar(select(Employee).where(Employee.name == user.display_name))
        db.add(SopAck(sop_id=sop_id, user_id=user.id, employee_id=emp.id if emp else None,
                      display_name=user.display_name, version=s.version))
        db.commit()
    return {"ok": True}


@router.get("/sop/{sop_id}/acks")
def sop_acks(sop_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in SOP_EDIT_ROLES:
        raise HTTPException(403, "Forbidden")
    return [_row(a) for a in db.scalars(select(SopAck).where(SopAck.sop_id == sop_id).order_by(SopAck.acked_at.desc())).all()]
