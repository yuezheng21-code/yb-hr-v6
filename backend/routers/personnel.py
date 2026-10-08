"""
渊博579 HR V7 — 人事档案 / 文书模板 / SOP
/api/v1/personnel

人事档案仅 admin / hr 可访问（含证件、合同、工资等敏感个人数据）。
SOP 学习资料：所有内部账号可阅读并确认学习；admin / hr / mgr 可维护。
"""
from __future__ import annotations
import json
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from urllib.parse import quote
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.dispatch import TalentPool
from backend.models.personnel import (
    FileBlob, EmployeeDocument, EmployeeContract, LeaveRecord, EmployeeEvent, DocTemplate, SopDocument, SopAck,
)
from backend.services import settings_store
from backend.services.doc_render import fields_of, build_context, fill, to_html, to_docx, AUTO_FIELDS
from backend.services.file_store import store_upload, store_bytes, file_response, blob_meta
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services.performance import compute_performance

router = APIRouter(prefix="/api/v1/personnel", tags=["personnel"])

HR_ROLES = {"admin", "hr"}
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
    if user.role not in HR_ROLES:
        raise HTTPException(403, "仅 HR / 管理员可访问人事档案")


def _emp(db: Session, emp_id: int) -> Employee:
    emp = db.get(Employee, emp_id)
    if emp is None:
        raise HTTPException(404, "员工不存在")
    return emp


def _row(obj) -> dict:
    return {c.name: getattr(obj, c.name) for c in obj.__table__.columns}


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


def _active_contract(db: Session, emp_id: int) -> Optional[EmployeeContract]:
    return db.scalar(select(EmployeeContract).where(EmployeeContract.employee_id == emp_id,
                                                    EmployeeContract.status == "active")
                     .order_by(EmployeeContract.start_date.desc(), EmployeeContract.id.desc()))


def _doc_dict(d: EmployeeDocument, blob: Optional[FileBlob]) -> dict:
    return {**_row(d), "file": blob_meta(blob)}


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
    emp = _emp(db, emp_id)
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
    names = {e.id: (e.name, e.emp_no) for e in db.scalars(select(Employee)).all()}
    out = []
    for c in db.scalars(select(EmployeeContract).where(EmployeeContract.status == "active")).all():
        for kind, d in (("contract_end", c.end_date), ("probation_end", c.probation_end)):
            if d and today - timedelta(days=7) <= d <= horizon:
                out.append({"kind": kind, "date": d, "employee_id": c.employee_id,
                            "employee": names.get(c.employee_id, ("?", ""))[0], "ref": c.contract_no})
    for d in db.scalars(select(EmployeeDocument).where(EmployeeDocument.is_deleted == False,  # noqa: E712
                                                        EmployeeDocument.valid_until.is_not(None),
                                                        EmployeeDocument.valid_until <= horizon)).all():
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
    emp = _emp(db, emp_id)
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
    doc = db.get(EmployeeDocument, doc_id)
    if doc is None or doc.is_deleted:
        raise HTTPException(404, "文件不存在")
    return file_response(db.get(FileBlob, doc.file_id), inline=inline)


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """软删除：文件仍保留在数据库中以备审计，档案中不再显示。"""
    _hr(user)
    doc = db.get(EmployeeDocument, doc_id)
    if doc is None or doc.is_deleted:
        raise HTTPException(404, "文件不存在")
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
    emp = _emp(db, emp_id)
    _check_contract(body)
    if body.status not in ("draft", "active"):
        raise HTTPException(400, "status 只能是 draft 或 active")
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
    old = db.get(EmployeeContract, contract_id)
    if old is None:
        raise HTTPException(404, "合同不存在")
    if old.status != "active":
        raise HTTPException(400, "只能修改生效中的合同")
    emp = _emp(db, old.employee_id)
    changes = body.model_dump(exclude_unset=True, exclude={"effective_date", "change_summary"})
    data = {c.name: getattr(old, c.name) for c in EmployeeContract.__table__.columns
            if c.name not in ("id", "contract_no", "parent_id", "status", "created_at", "created_by", "change_summary",
                              "signed_date")}
    data.update({k: v for k, v in changes.items() if v is not None})
    new = EmployeeContract(**data, contract_no=f"{old.contract_no}-N{db.scalar(select(func.count(EmployeeContract.id)).where(EmployeeContract.parent_id == old.id)) + 1}",
                           parent_id=old.id, status="active", change_summary=body.change_summary,
                           created_by=user.display_name)
    old.status = "amended"
    if new.hourly_rate != old.hourly_rate:
        emp.hourly_rate = new.hourly_rate
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


@router.post("/employees/{emp_id}/salary", status_code=201)
def salary_change(emp_id: int, body: SalaryIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    emp = _emp(db, emp_id)
    old = emp.hourly_rate
    emp.hourly_rate = body.new_rate
    active = _active_contract(db, emp_id)
    pct = round((body.new_rate - old) / old * 100, 1) if old else None
    ev = _event(db, emp, "salary", f"调薪：{old or '—'} → {body.new_rate} €/h" + (f"（{pct:+}%）" if pct is not None else ""),
                user, event_date=body.effective_date, contract_id=active.id if active else None,
                details={"from": old, "to": body.new_rate, "percent": pct, "reason": body.reason})
    db.commit()
    return {"ok": True, "event_id": ev.id}


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
    emp = _emp(db, emp_id)
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
    status: str = "approved"
    notes: Optional[str] = None


@router.post("/employees/{emp_id}/leaves", status_code=201)
def create_leave(emp_id: int, body: LeaveIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    emp = _emp(db, emp_id)
    if body.leave_type not in LEAVE_TYPES:
        raise HTTPException(400, f"未知请假类型 {body.leave_type}")
    if body.end_date < body.start_date:
        raise HTTPException(400, "结束日期早于开始日期")
    if body.status not in ("requested", "approved", "rejected"):
        raise HTTPException(400, "状态无效")
    overlap = db.scalar(select(LeaveRecord.id).where(
        LeaveRecord.employee_id == emp_id, LeaveRecord.status != "rejected",
        LeaveRecord.start_date <= body.end_date, LeaveRecord.end_date >= body.start_date))
    if overlap:
        raise HTTPException(409, "与已有请假时间重叠")
    days = body.days if body.days is not None else _workdays(body.start_date, body.end_date)
    lv = LeaveRecord(employee_id=emp_id, leave_type=body.leave_type, start_date=body.start_date, end_date=body.end_date,
                     days=days, status=body.status, notes=body.notes, created_by=user.display_name,
                     certificate_required=body.leave_type in ("krank", "kind_krank") and (body.end_date - body.start_date).days >= 3,
                     decided_by=user.display_name if body.status != "requested" else None)
    db.add(lv)
    db.flush()
    ev = _event(db, emp, "leave", f"请假（{body.leave_type}）{body.start_date:%m-%d}—{body.end_date:%m-%d}，{days:g} 天", user,
                event_date=body.start_date, leave_id=lv.id, details={"status": body.status, "notes": body.notes})
    db.commit()
    return {**_row(lv), "event_id": ev.id}


class LeaveStatusIn(BaseModel):
    status: str


@router.put("/leaves/{leave_id}")
def update_leave(leave_id: int, body: LeaveStatusIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    lv = db.get(LeaveRecord, leave_id)
    if lv is None:
        raise HTTPException(404, "请假记录不存在")
    if body.status not in ("requested", "approved", "rejected"):
        raise HTTPException(400, "状态无效")
    lv.status, lv.decided_by = body.status, user.display_name
    _event(db, _emp(db, lv.employee_id), "leave", f"请假 {lv.start_date:%m-%d} 状态改为 {body.status}", user, leave_id=lv.id)
    db.commit()
    return _row(lv)


class WarningIn(BaseModel):
    incident_date: date
    reason: str
    description: Optional[str] = None


@router.post("/employees/{emp_id}/warnings", status_code=201)
def create_warning(emp_id: int, body: WarningIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    emp = _emp(db, emp_id)
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
    _hr(user)
    emp = _emp(db, emp_id)
    if body.termination_type not in TERMINATION_TYPES:
        raise HTTPException(400, f"未知离职类型 {body.termination_type}")
    emp.leave_date = body.last_day
    if body.last_day <= date.today():
        emp.status = "inactive"
    for c in db.scalars(select(EmployeeContract).where(EmployeeContract.employee_id == emp_id,
                                                       EmployeeContract.status == "active")).all():
        c.status = "ended"
        if not c.end_date or c.end_date > body.last_day:
            c.end_date = body.last_day
    if body.deactivate_login and emp.user_id and body.last_day <= date.today():
        u = db.get(User, emp.user_id)
        if u:
            u.is_active = False
    ev = _event(db, emp, "termination", f"离职（{body.termination_type}），最后工作日 {body.last_day:%Y-%m-%d}", user,
                event_date=body.notice_date or date.today(), details=body.model_dump())
    db.commit()
    return {"ok": True, "event_id": ev.id}


class NoteIn(BaseModel):
    title: str
    text: Optional[str] = None
    event_date: Optional[date] = None


@router.post("/employees/{emp_id}/notes", status_code=201)
def add_note(emp_id: int, body: NoteIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _hr(user)
    ev = _event(db, _emp(db, emp_id), "note", body.title, user, event_date=body.event_date, details={"text": body.text})
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
    emp = _emp(db, body.employee_id)
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
