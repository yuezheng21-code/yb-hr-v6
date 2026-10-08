"""
渊博579 HR V7 — 官网（公开页面）与客户线索

公开接口（无需登录）  /api/v1/public
  GET  /info       公司联系方式 + 正在招聘的岗位
  POST /inquiry    企业询价 → leads（潜在客户）
  POST /apply      求职投递（multipart，可附简历）→ talent_pool（source=website）

内部接口  /api/v1/leads
  GET  ""                 线索列表（admin / hr / mgr / fin）
  PUT  /{id}              跟进：状态、负责人、内部备注（admin / hr / mgr）
  POST /{id}/quote        按需求生成报价单草稿并关联
  GET  /talent/{tid}/cv   查看人才库候选人投递的简历

防滥用：每 IP 限流、蜜罐字段、必须同意隐私条款；不返回任何内部数据。
"""
from __future__ import annotations
import re
import threading
import time
from collections import defaultdict, deque
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.website import Lead
from backend.models.dispatch import DispatchDemand, TalentPool
from backend.models.quotation import Quotation
from backend.models.personnel import FileBlob
from backend.services import settings_store
from backend.services.file_store import store_upload, file_response
from backend.services.sequence import next_sequence_no, make_prefix

public_router = APIRouter(prefix="/api/v1/public", tags=["public"])
leads_router = APIRouter(prefix="/api/v1/leads", tags=["leads"])

SERVICES = {
    "amazon": "Amazon 仓内作业 / FBA",
    "temu": "TEMU / 跨境电商仓",
    "container": "装卸柜 Container Be- & Entladung",
    "warehouse": "仓内综合作业（收货/拣货/打包/出库）",
    "project": "项目承包 Werkvertrag",
    "leasing": "人员派遣 Arbeitnehmerüberlassung",
    "operations": "驻场运营管理（IWO）",
}
LEAD_STATUSES = ["new", "contacted", "quoting", "quoted", "won", "lost", "spam"]
READ_ROLES = {"admin", "hr", "mgr", "fin"}
WRITE_ROLES = {"admin", "hr", "mgr"}
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# ── 简单限流：每 IP 每 10 分钟最多 5 次提交（单实例内存即可） ──
_WINDOW, _MAX = 600, 5
_hits: dict[str, deque] = defaultdict(deque)
_lock = threading.Lock()


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for", "")
    return (fwd.split(",")[0].strip() if fwd else "") or (request.client.host if request.client else "?")


def _throttle(request: Request, bucket: str) -> None:
    key = f"{bucket}:{_client_ip(request)}"
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > _WINDOW:
            q.popleft()
        if len(q) >= _MAX:
            raise HTTPException(429, "提交过于频繁，请稍后再试 / Zu viele Anfragen, bitte später erneut versuchen.")
        q.append(now)
        if len(_hits) > 10000:  # bound memory
            for k in [k for k, v in _hits.items() if not v][:5000]:
                _hits.pop(k, None)


def _clean(v: Optional[str], n: int) -> Optional[str]:
    v = (v or "").strip()
    return v[:n] or None


# ═════════════════════════════════════════════════════════════════════
#  公开接口
# ═════════════════════════════════════════════════════════════════════
@public_router.get("/info")
def public_info(db: Session = Depends(get_db)):
    s = settings_store.get_all()
    jobs = db.scalars(select(DispatchDemand).where(DispatchDemand.status.in_(["open", "recruiting"]))
                      .order_by(DispatchDemand.created_at.desc()).limit(30)).all()
    return {
        "company": {k: s.get(f"company_{k}") or "" for k in ("name", "address", "email", "phone")},
        "services": SERVICES,
        # 只公开岗位、地点、人数、开始日期与班次，不含客户、价格
        "jobs": [{"id": j.id, "position": j.position, "location": j.warehouse_code,
                  "headcount": max((j.headcount or 0) - (j.matched_count or 0), 1),
                  "start_date": j.start_date, "shift": j.shift_pattern} for j in jobs],
    }


class InquiryIn(BaseModel):
    company: str = Field(..., min_length=2, max_length=150)
    contact_name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=120)
    phone: Optional[str] = Field(None, max_length=40)
    location: Optional[str] = Field(None, max_length=150)
    services: list[str] = []
    headcount: Optional[int] = Field(None, ge=1, le=10000)
    volume: Optional[str] = Field(None, max_length=200)
    start_date: Optional[date] = None
    duration: Optional[str] = Field(None, max_length=50)
    shifts: Optional[str] = Field(None, max_length=100)
    message: Optional[str] = Field(None, max_length=4000)
    language: Optional[str] = Field(None, max_length=5)
    consent: bool = False
    website: Optional[str] = None  # honeypot: humans never fill this

    @field_validator("email")
    @classmethod
    def _email(cls, v: str) -> str:
        v = v.strip()
        if not _EMAIL.match(v):
            raise ValueError("invalid email")
        return v


@public_router.post("/inquiry", status_code=201)
def submit_inquiry(body: InquiryIn, request: Request, db: Session = Depends(get_db)):
    if body.website:  # bot — pretend success, store nothing
        return {"ok": True}
    if not body.consent:
        raise HTTPException(400, "请同意隐私条款 / Bitte stimmen Sie der Datenschutzerklärung zu.")
    _throttle(request, "inquiry")
    services = [s for s in body.services if s in SERVICES]
    lead = Lead(
        lead_no=next_sequence_no(db, Lead, Lead.lead_no, make_prefix("LD")),
        company=body.company.strip(), contact_name=body.contact_name.strip(), email=body.email,
        phone=_clean(body.phone, 40), location=_clean(body.location, 150), services=",".join(services) or None,
        headcount=body.headcount, volume=_clean(body.volume, 200), start_date=body.start_date,
        duration=_clean(body.duration, 50), shifts=_clean(body.shifts, 100), message=_clean(body.message, 4000),
        language=_clean(body.language, 5), status="new", source="website",
    )
    db.add(lead)
    db.commit()
    return {"ok": True, "ref": lead.lead_no}


@public_router.post("/apply", status_code=201)
async def submit_application(
    request: Request,
    name: str = Form(..., min_length=2, max_length=100),
    phone: str = Form(..., min_length=5, max_length=30),
    email: Optional[str] = Form(None),
    nationality: Optional[str] = Form(None),
    languages: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    available_from: Optional[str] = Form(None),
    forklift: bool = Form(False),
    work_permit: Optional[str] = Form(None),
    experience: Optional[str] = Form(None),
    job_id: Optional[int] = Form(None),
    consent: bool = Form(False),
    website: Optional[str] = Form(None),  # honeypot
    cv: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    if website:
        return {"ok": True}
    if not consent:
        raise HTTPException(400, "请同意隐私条款 / Bitte stimmen Sie der Datenschutzerklärung zu.")
    email = _clean(email, 120)
    if email and not _EMAIL.match(email):
        raise HTTPException(422, "邮箱格式不正确 / Ungültige E-Mail-Adresse")
    _throttle(request, "apply")
    job = db.get(DispatchDemand, job_id) if job_id else None
    lines = [f"官网投递 {date.today():%Y-%m-%d}"]
    if job:
        lines.append(f"应聘岗位：{job.demand_no} {job.position or ''} {job.warehouse_code or ''}")
    for label, v in (("期望地点", location), ("可到岗", available_from), ("工作许可", work_permit),
                     ("经验", experience)):
        if v and v.strip():
            lines.append(f"{label}：{v.strip()[:1000]}")
    skills = ", ".join(x for x in [("Staplerschein 叉车证" if forklift else None)] if x) or None
    cv_id = (await store_upload(db, cv, "官网投递")).id if cv is not None and cv.filename else None

    phone_n = re.sub(r"[^\d+]", "", phone)
    existing = next((t for t in db.scalars(select(TalentPool).where(func.lower(TalentPool.name) == name.strip().lower())).all()
                     if re.sub(r"[^\d+]", "", t.phone or "") == phone_n), None)
    if existing:  # 重复投递：更新而不是重复建档
        existing.notes = ((existing.notes + "\n") if existing.notes else "") + "\n".join(lines)
        existing.email = email or existing.email
        existing.cv_file_id = cv_id or existing.cv_file_id
        if existing.pool_status in ("rejected",):
            existing.pool_status = "available"
        db.commit()
        return {"ok": True}
    db.add(TalentPool(
        name=name.strip(), phone=phone.strip(), email=email, nationality=_clean(nationality, 50),
        languages=_clean(languages, 100), position=_clean(position or (job.position if job else None), 30),
        skills=skills, pool_status="available", source="website", source_type="own", cv_file_id=cv_id,
        notes="\n".join(lines), created_by="官网",
    ))
    db.commit()
    return {"ok": True}


# ═════════════════════════════════════════════════════════════════════
#  内部：线索管理
# ═════════════════════════════════════════════════════════════════════
def _lead_dict(l: Lead) -> dict:
    return {c.name: getattr(l, c.name) for c in Lead.__table__.columns} | {
        "service_labels": [SERVICES.get(s, s) for s in (l.services or "").split(",") if s]}


@leads_router.get("")
def list_leads(status: Optional[str] = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in READ_ROLES:
        raise HTTPException(403, "Forbidden")
    stmt = select(Lead).order_by(Lead.created_at.desc()).limit(500)
    if status:
        stmt = stmt.where(Lead.status == status)
    counts = dict(db.execute(select(Lead.status, func.count(Lead.id)).group_by(Lead.status)).all())
    return {"items": [_lead_dict(l) for l in db.scalars(stmt).all()], "counts": counts,
            "services": SERVICES, "statuses": LEAD_STATUSES}


class LeadUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=8000)


@leads_router.put("/{lead_id}")
def update_lead(lead_id: int, body: LeadUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in WRITE_ROLES:
        raise HTTPException(403, "Forbidden")
    l = db.get(Lead, lead_id)
    if l is None:
        raise HTTPException(404, "线索不存在")
    if body.status is not None:
        if body.status not in LEAD_STATUSES:
            raise HTTPException(400, "未知状态")
        l.status = body.status
    if body.assigned_to is not None:
        l.assigned_to = body.assigned_to or None
    if body.notes is not None:
        l.notes = body.notes
    db.commit()
    return _lead_dict(l)


@leads_router.post("/{lead_id}/quote", status_code=201)
def lead_to_quote(lead_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """按客户需求生成报价单草稿；之后在「工程报价」中测算成本、定价、审批、导出。"""
    if user.role not in WRITE_ROLES:
        raise HTTPException(403, "Forbidden")
    l = db.get(Lead, lead_id)
    if l is None:
        raise HTTPException(404, "线索不存在")
    if l.quotation_id and db.get(Quotation, l.quotation_id):
        raise HTTPException(400, "该线索已生成报价单")
    svc = set((l.services or "").split(","))
    project_type = "werkvertrag" if svc & {"project", "container", "operations"} and "leasing" not in svc else "dispatch"
    notes = [f"来自官网线索 {l.lead_no}", f"服务：{'、'.join(SERVICES.get(s, s) for s in svc if s) or '—'}"]
    for label, v in (("地点", l.location), ("业务量", l.volume), ("开始", l.start_date), ("期限", l.duration),
                     ("班次", l.shifts), ("需求说明", l.message)):
        if v:
            notes.append(f"{label}：{v}")
    q = Quotation(
        quote_no=next_sequence_no(db, Quotation, Quotation.quote_no, make_prefix("QT")),
        client_name=l.company[:100], client_contact=f"{l.contact_name} · {l.email}{' · ' + l.phone if l.phone else ''}"[:100],
        project_type=project_type, headcount_estimate=l.headcount, avg_grade="P1",
        notes="\n".join(notes), status="draft", created_by=user.username,
    )
    db.add(q)
    db.flush()
    l.quotation_id = q.id
    if l.status in ("new", "contacted"):
        l.status = "quoting"
    db.commit()
    return {"quotation_id": q.id, "quote_no": q.quote_no, "lead": _lead_dict(l)}


@leads_router.get("/talent/{talent_id}/cv")
def talent_cv(talent_id: int, inline: bool = False, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in WRITE_ROLES:
        raise HTTPException(403, "Forbidden")
    t = db.get(TalentPool, talent_id)
    if t is None or not t.cv_file_id:
        raise HTTPException(404, "没有简历")
    return file_response(db.get(FileBlob, t.cv_file_id), inline=inline)
