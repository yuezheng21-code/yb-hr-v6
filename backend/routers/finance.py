"""
渊博579 HR V7 — 财务中心 /api/v1/finance

工资条      /payslips…        生成（已入账工时）→ 录入/导入法定扣款 → 签发（PDF 存入员工档案）→ 工人自助查看
供应商结算单 /supplier-statements…  每个供应商每月的人员工时明细 + PDF/CSV，供应商账号可下载自己的
甲方账单    /customers…  /invoices…  按工时 / 装卸柜 / 计件作业生成草稿 → 编辑 → 开具（连续编号、PDF 存档、XRechnung）
           → 收款 / 作废（红字发票）
DATEV/税务  /datev/buchungsstapel  /datev/lodas  /datev/lohn-csv  /datev/check  /tax/ustva
"""
from __future__ import annotations
import csv
import io
import json
from collections import defaultdict
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional
from fastapi import APIRouter, Body, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.user import User
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.timesheet import Timesheet
from backend.models.container import ContainerRecord
from backend.models.warehouse import Warehouse
from backend.models.operation import OperationLog, OperationType
from backend.models.settlement import SupplierSettlement
from backend.models.finance import Payslip, Customer, Invoice
from backend.models.personnel import EmployeeDocument, FileBlob
from backend.services import settings_store
from backend.services.file_store import store_bytes, file_response
from backend.services.finance_pdf import payslip_pdf, supplier_statement_pdf, invoice_pdf, STAT_LABELS
from backend.services.finance_exports import (
    datev_buchungsstapel, lodas_ascii, xrechnung_xml, xrechnung_missing,
)
from backend.services.sequence import next_sequence_no, make_prefix

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])

FIN_ROLES = {"admin", "fin"}
PAYROLL_ROLES = {"admin", "fin", "hr"}
CUSTOMER_READ = {"admin", "fin", "mgr"}
STAT_KEYS = [k for k, _ in STAT_LABELS]
PDF = "application/pdf"


def _need(user: User, roles: set) -> None:
    if user.role not in roles:
        raise HTTPException(403, "Forbidden")


def _period(period: str) -> tuple[date, date]:
    try:
        y, m = int(period[:4]), int(period[5:7])
        start = date(y, m, 1)
    except (ValueError, IndexError):
        raise HTTPException(400, "period 格式应为 YYYY-MM")
    end = date(y + (m == 12), m % 12 + 1, 1) - timedelta(days=1)
    return start, end


def _r(v) -> float:
    """Kaufmännisch runden (half up, symmetrisch für negative Beträge — Storno = exakt −Original)."""
    return float(Decimal(str(float(v or 0))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def _company() -> dict:
    return settings_store.get_all()


def _pdf_response(data: bytes, filename: str, inline: bool = True) -> Response:
    disp = "inline" if inline else "attachment"
    return Response(data, media_type=PDF, headers={"Content-Disposition": f'{disp}; filename="{filename}"',
                                                    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff"})


def _file(data: bytes, filename: str, media: str) -> Response:
    return Response(data, media_type=media, headers={"Content-Disposition": f'attachment; filename="{filename}"',
                                                      "Cache-Control": "private, no-store"})


# ═════════════════════════════════════════════════════════════════════
#  工资条
# ═════════════════════════════════════════════════════════════════════
def _slip_dict(s: Payslip, emp: Optional[Employee] = None) -> dict:
    d = {c.name: getattr(s, c.name) for c in Payslip.__table__.columns}
    for k in ("earnings", "statutory", "other_deductions"):
        d[k] = json.loads(d[k]) if d[k] else ([] if k != "statutory" else {})
    if emp is not None:
        iban = (emp.iban or "").replace(" ", "")
        d["employee"] = {"id": emp.id, "name": emp.name, "emp_no": emp.emp_no, "datev_pnr": emp.datev_pnr,
                         "iban_tail": iban[-4:] if iban else None, "address": emp.address, "status": emp.status}
    return d


def _recalc(s: Payslip) -> None:
    earnings = json.loads(s.earnings or "[]")
    stat = json.loads(s.statutory or "{}")
    other = json.loads(s.other_deductions or "[]")
    s.gross = _r(sum(float(e.get("amount") or 0) for e in earnings))
    s.statutory_total = _r(sum(float(stat.get(k) or 0) for k in STAT_KEYS))
    s.net = _r(s.gross - s.statutory_total)
    s.payout = _r(s.net - sum(float(o.get("amount") or 0) for o in other))


def _earnings_from_timesheets(rows: list[Timesheet]) -> tuple[list, list, float, int]:
    groups: dict[tuple, dict] = {}
    deduction = 0.0
    for t in rows:
        if t.settlement_type == "container":
            g = groups.setdefault(("container", t.warehouse_code, None), {"label": f"Container-Akkord {t.warehouse_code}",
                                                                          "qty": 0, "unit": "Einsätze", "rate": None, "amount": 0})
            g["qty"] += 1
            g["amount"] += float(t.amount_hourly or 0) + float(t.amount_piece or 0)
        else:
            if t.amount_hourly:
                g = groups.setdefault(("hourly", t.warehouse_code, round(t.base_rate or 0, 2)),
                                      {"label": f"Grundlohn {t.warehouse_code}", "qty": 0, "unit": "Std.",
                                       "rate": round(t.base_rate or 0, 2), "amount": 0})
                g["qty"] += float(t.hours or 0)
                g["amount"] += float(t.amount_hourly)
            if t.amount_piece:
                g = groups.setdefault(("piece", t.warehouse_code, round(t.piece_rate or 0, 4)),
                                      {"label": f"Stücklohn {t.warehouse_code}", "qty": 0, "unit": "Stk.",
                                       "rate": round(t.piece_rate or 0, 4), "amount": 0})
                g["qty"] += float(t.pieces or 0)
                g["amount"] += float(t.amount_piece)
        if t.amount_kpi:
            g = groups.setdefault(("kpi",), {"label": "Leistungsprämie (KPI)", "qty": None, "unit": "", "rate": None, "amount": 0})
            g["amount"] += float(t.amount_kpi)
        if t.amount_bonus:
            g = groups.setdefault(("bonus",), {"label": "Zulagen / Schichtbonus", "qty": None, "unit": "", "rate": None, "amount": 0})
            g["amount"] += float(t.amount_bonus)
        deduction += float(t.amount_deduction or 0)
    earnings = []
    for g in groups.values():
        g["amount"] = _r(g["amount"])
        if g["qty"] is not None:
            g["qty"] = round(g["qty"], 2)
        if g["amount"]:
            earnings.append(g)
    other = [{"label": "Abzüge laut Arbeitszeitnachweis", "amount": _r(deduction), "auto": True}] if round(deduction, 2) else []
    return earnings, other, round(sum(float(t.hours or 0) for t in rows), 2), len({t.work_date for t in rows})


@router.get("/payslips")
def list_payslips(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, PAYROLL_ROLES)
    _period(period)
    slips = db.scalars(select(Payslip).where(Payslip.period == period).order_by(Payslip.emp_no)).all()
    emps = {e.id: e for e in db.scalars(select(Employee).where(Employee.id.in_([s.employee_id for s in slips] or [0]))).all()}
    return [_slip_dict(s, emps.get(s.employee_id)) for s in slips]


@router.post("/payslips/generate")
def generate_payslips(period: str = Body(..., embed=True), user: User = Depends(get_current_user),
                      db: Session = Depends(get_db)):
    """按已入账（booked）的自有员工工时生成工资条草稿；已签发的不动，草稿保留已录入的法定扣款与手工扣款。"""
    _need(user, PAYROLL_ROLES)
    start, end = _period(period)
    ts = db.scalars(select(Timesheet).where(Timesheet.approval_status == "booked", Timesheet.source_type == "own",
                                            Timesheet.work_date >= start, Timesheet.work_date <= end)).all()
    by_emp: dict[int, list] = defaultdict(list)
    for t in ts:
        by_emp[t.employee_id].append(t)
    created = updated = skipped = 0
    for emp_id, rows in by_emp.items():
        emp = db.get(Employee, emp_id)
        if emp is None:
            continue
        earnings, auto_other, hours, days = _earnings_from_timesheets(rows)
        s = db.scalar(select(Payslip).where(Payslip.period == period, Payslip.employee_id == emp_id))
        if s is not None and s.status != "draft":
            skipped += 1
            continue
        if s is None:
            s = Payslip(slip_no=next_sequence_no(db, Payslip, Payslip.slip_no, f"LA-{period.replace('-', '')}-"),
                        period=period, employee_id=emp_id, emp_no=emp.emp_no, emp_name=emp.name,
                        statutory="{}", statutory_source="none")
            db.add(s)
            created += 1
            manual = []
        else:
            manual = [o for o in json.loads(s.other_deductions or "[]") if not o.get("auto")]
            updated += 1
        s.emp_name = emp.name
        s.earnings = json.dumps(earnings, ensure_ascii=False)
        s.other_deductions = json.dumps(auto_other + manual, ensure_ascii=False)
        s.total_hours, s.work_days = hours, days
        _recalc(s)
    db.commit()
    return {"period": period, "created": created, "updated": updated, "skipped_issued": skipped, "employees": len(by_emp)}


class SlipUpdate(BaseModel):
    statutory: Optional[dict[str, float]] = None
    other_deductions: Optional[list[dict]] = None
    notes: Optional[str] = Field(None, max_length=1000)


def _get_slip(db: Session, sid: int) -> Payslip:
    s = db.get(Payslip, sid)
    if s is None:
        raise HTTPException(404, "工资条不存在")
    return s


@router.get("/payslips/{sid}")
def get_payslip(sid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, PAYROLL_ROLES)
    s = _get_slip(db, sid)
    return _slip_dict(s, db.get(Employee, s.employee_id))


@router.put("/payslips/{sid}")
def update_payslip(sid: int, body: SlipUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, PAYROLL_ROLES)
    s = _get_slip(db, sid)
    if s.status != "draft":
        raise HTTPException(400, "已签发的工资条不能修改")
    if body.statutory is not None:
        bad = [k for k in body.statutory if k not in STAT_KEYS]
        if bad or any(v < 0 for v in body.statutory.values()):
            raise HTTPException(400, f"法定扣款字段无效：{bad or '金额不能为负'}")
        s.statutory = json.dumps({k: _r(v) for k, v in body.statutory.items() if v}, ensure_ascii=False)
        s.statutory_source = "manual" if any(body.statutory.values()) else "none"
    if body.other_deductions is not None:
        clean = []
        for o in body.other_deductions:
            label = str(o.get("label") or "").strip()[:100]
            amt = float(o.get("amount") or 0)
            if label and amt:
                clean.append({"label": label, "amount": _r(amt), **({"auto": True} if o.get("auto") else {})})
        s.other_deductions = json.dumps(clean, ensure_ascii=False)
    if body.notes is not None:
        s.notes = body.notes.strip() or None
    _recalc(s)
    db.commit()
    return _slip_dict(s, db.get(Employee, s.employee_id))


def _de_float(v) -> float:
    """'1.234,56' / '1234.56' / '' → float"""
    v = (v or "").strip().replace("€", "").replace(" ", "")
    if "," in v:
        v = v.replace(".", "").replace(",", ".")
    try:
        return float(v or 0)
    except ValueError:
        return 0.0


@router.post("/payslips/import-statutory")
async def import_statutory(period: str = Query(...), file: UploadFile = File(...), user: User = Depends(get_current_user),
                           db: Session = Depends(get_db)):
    """导入工资核算结果（CSV，分号或逗号分隔）：列 pnr 或 emp_no，lst, soli, kist, kv, rv, av, pv。"""
    _need(user, PAYROLL_ROLES)
    _period(period)
    raw = (await file.read(2 * 1024 * 1024)).decode("utf-8-sig", errors="replace")
    delim = ";" if raw.count(";") >= raw.count(",") else ","
    reader = csv.DictReader(io.StringIO(raw), delimiter=delim)
    alias = {"lohnsteuer": "lst", "solidaritätszuschlag": "soli", "kirchensteuer": "kist", "krankenversicherung": "kv",
             "rentenversicherung": "rv", "arbeitslosenversicherung": "av", "pflegeversicherung": "pv",
             "personalnummer": "pnr", "pers.-nr.": "pnr", "工号": "emp_no"}
    matched, unmatched, locked = 0, [], 0
    for row in reader:
        r = {alias.get((k or "").strip().lower(), (k or "").strip().lower()): (v or "").strip() for k, v in row.items()}
        key = r.get("emp_no") or r.get("pnr")
        emp = None
        if r.get("emp_no"):
            emp = db.scalar(select(Employee).where(Employee.emp_no == r["emp_no"]))
        if emp is None and r.get("pnr"):
            emp = db.scalar(select(Employee).where(Employee.datev_pnr == r["pnr"]))
        s = db.scalar(select(Payslip).where(Payslip.period == period, Payslip.employee_id == emp.id)) if emp else None
        if s is None:
            unmatched.append(key)
            continue
        if s.status != "draft":
            locked += 1
            continue
        stat = {}
        for k in STAT_KEYS:
            v = _de_float(r.get(k))
            if v:
                stat[k] = _r(abs(v))
        s.statutory = json.dumps(stat)
        s.statutory_source = "import"
        _recalc(s)
        matched += 1
    db.commit()
    return {"matched": matched, "unmatched": unmatched, "skipped_issued": locked}


@router.get("/payslips/{sid}/pdf")
def payslip_file(sid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, PAYROLL_ROLES)
    s = _get_slip(db, sid)
    return _pdf_response(_render_slip(db, s), f"Entgeltabrechnung_{s.emp_no}_{s.period}.pdf")


def _render_slip(db: Session, s: Payslip) -> bytes:
    if s.status == "issued" and s.document_id:
        d = db.get(EmployeeDocument, s.document_id)
        if d is not None:
            return db.get(FileBlob, d.file_id).data
    return payslip_pdf(_company(), s, db.get(Employee, s.employee_id), json.loads(s.earnings or "[]"),
                       json.loads(s.statutory or "{}"), json.loads(s.other_deductions or "[]"))


@router.post("/payslips/issue")
def issue_payslips(ids: list[int] = Body(..., embed=True), user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """签发：锁定、生成 PDF 存入员工档案（薪资类），工人可在「我的工资条」查看。"""
    _need(user, PAYROLL_ROLES)
    issued = 0
    for sid in ids:
        s = db.get(Payslip, sid)
        if s is None or s.status != "draft":
            continue
        s.status, s.issued_by, s.issued_at = "issued", user.display_name, datetime.utcnow()
        emp = db.get(Employee, s.employee_id)
        data = payslip_pdf(_company(), s, emp, json.loads(s.earnings or "[]"), json.loads(s.statutory or "{}"),
                           json.loads(s.other_deductions or "[]"))
        blob = store_bytes(db, data, f"Entgeltabrechnung_{s.emp_no}_{s.period}.pdf", PDF, user.display_name)
        doc = EmployeeDocument(employee_id=s.employee_id, category="salary", title=f"Entgeltabrechnung {s.period}",
                               file_id=blob.id, source="generated", uploaded_by=user.display_name, notes=s.slip_no)
        db.add(doc)
        db.flush()
        s.document_id = doc.id
        issued += 1
    db.commit()
    return {"issued": issued}


@router.post("/payslips/{sid}/revoke")
def revoke_payslip(sid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """撤回签发（仅管理员）：档案中的 PDF 软删除，工资条回到草稿。"""
    _need(user, {"admin"})
    s = _get_slip(db, sid)
    if s.status != "issued":
        raise HTTPException(400, "只有已签发的工资条可以撤回")
    if s.document_id and (d := db.get(EmployeeDocument, s.document_id)):
        d.is_deleted, d.deleted_by, d.deleted_at = True, user.display_name, datetime.utcnow()
    s.status, s.document_id, s.issued_at, s.issued_by = "draft", None, None, None
    db.commit()
    return _slip_dict(s)


def _my_employee(user: User, db: Session) -> Employee:
    emp = db.scalar(select(Employee).where(Employee.user_id == user.id)) or \
        db.scalar(select(Employee).where(Employee.name == user.display_name))
    if emp is None:
        raise HTTPException(404, "账号未关联员工档案")
    return emp


@router.get("/my/payslips")
def my_payslips(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "client":
        raise HTTPException(403, "Forbidden")
    emp = _my_employee(user, db)
    slips = db.scalars(select(Payslip).where(Payslip.employee_id == emp.id, Payslip.status == "issued")
                       .order_by(Payslip.period.desc())).all()
    return [{"id": s.id, "period": s.period, "gross": s.gross, "net": s.net, "payout": s.payout,
             "total_hours": s.total_hours, "work_days": s.work_days, "issued_at": s.issued_at,
             "has_statutory": s.statutory_source in ("manual", "import")} for s in slips]


@router.get("/my/payslips/{sid}/pdf")
def my_payslip_pdf(sid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "client":
        raise HTTPException(403, "Forbidden")
    emp = _my_employee(user, db)
    s = db.get(Payslip, sid)
    if s is None or s.employee_id != emp.id or s.status != "issued":
        raise HTTPException(404, "工资条不存在")
    return _pdf_response(_render_slip(db, s), f"Entgeltabrechnung_{s.period}.pdf")


# ═════════════════════════════════════════════════════════════════════
#  供应商结算单
# ═════════════════════════════════════════════════════════════════════
def _supplier_scope(user: User, ss: SupplierSettlement) -> None:
    if user.role == "sup":
        if ss.supplier_id != user.bound_supplier_id:
            raise HTTPException(404, "结算单不存在")
    elif user.role not in FIN_ROLES | {"hr", "mgr"}:
        raise HTTPException(403, "Forbidden")


def _supplier_workers(db: Session, ss: SupplierSettlement) -> list[dict]:
    start, end = _period(ss.period)
    rows = db.scalars(select(Timesheet).where(Timesheet.approval_status == "booked", Timesheet.source_type == "supplier",
                                              Timesheet.supplier_id == ss.supplier_id, Timesheet.work_date >= start,
                                              Timesheet.work_date <= end)).all()
    agg: dict[int, dict] = {}
    for t in rows:
        a = agg.setdefault(t.employee_id, {"emp_no": t.emp_no, "name": t.emp_name, "dates": set(), "hours": 0.0, "amount": 0.0})
        a["dates"].add(t.work_date)
        a["hours"] += float(t.hours or 0)
        a["amount"] += float(t.amount_total or 0)
    return sorted([{"emp_no": a["emp_no"], "name": a["name"], "days": len(a["dates"]), "hours": round(a["hours"], 2),
                    "amount": _r(a["amount"])} for a in agg.values()], key=lambda x: x["name"])


@router.get("/supplier-statements")
def list_supplier_statements(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in FIN_ROLES | {"hr", "mgr", "sup"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(SupplierSettlement).where(SupplierSettlement.period == period).order_by(SupplierSettlement.supplier_name)
    if user.role == "sup":
        stmt = stmt.where(SupplierSettlement.supplier_id == user.bound_supplier_id)
    vat = float(settings_store.get("vat_rate") or 0)
    return [{"id": s.id, "settle_no": s.settle_no, "period": s.period, "supplier_id": s.supplier_id,
             "supplier_name": s.supplier_name, "employee_count": s.employee_count, "total_hours": s.total_hours,
             "net": s.total_amount, "vat": _r(s.total_amount * vat), "gross": _r(s.total_amount * (1 + vat)),
             "status": s.status, "invoice_no": s.invoice_no, "invoice_date": s.invoice_date}
            for s in db.scalars(stmt).all()]


@router.get("/supplier-statements/{settle_id}")
def supplier_statement(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.get(SupplierSettlement, settle_id)
    if ss is None:
        raise HTTPException(404, "结算单不存在")
    _supplier_scope(user, ss)
    return {"settle_no": ss.settle_no, "period": ss.period, "supplier_name": ss.supplier_name,
            "total_amount": ss.total_amount, "total_hours": ss.total_hours, "workers": _supplier_workers(db, ss)}


@router.get("/supplier-statements/{settle_id}/pdf")
def supplier_statement_file(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.get(SupplierSettlement, settle_id)
    if ss is None:
        raise HTTPException(404, "结算单不存在")
    _supplier_scope(user, ss)
    data = supplier_statement_pdf(_company(), ss, db.get(Supplier, ss.supplier_id), _supplier_workers(db, ss),
                                  float(settings_store.get("vat_rate") or 0))
    return _pdf_response(data, f"Leistungsabrechnung_{ss.settle_no}.pdf")


@router.get("/supplier-statements/{settle_id}/csv")
def supplier_statement_csv(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.get(SupplierSettlement, settle_id)
    if ss is None:
        raise HTTPException(404, "结算单不存在")
    _supplier_scope(user, ss)
    start, end = _period(ss.period)
    rows = db.scalars(select(Timesheet).where(Timesheet.approval_status == "booked", Timesheet.source_type == "supplier",
                                              Timesheet.supplier_id == ss.supplier_id, Timesheet.work_date >= start,
                                              Timesheet.work_date <= end).order_by(Timesheet.work_date, Timesheet.emp_name)).all()
    buf = io.StringIO()
    buf.write("﻿")
    w = csv.writer(buf, delimiter=";")
    w.writerow(["Datum", "Pers.-Nr.", "Name", "Lager", "Beginn", "Ende", "Stunden", "Betrag"])
    for t in rows:
        w.writerow([t.work_date.strftime("%d.%m.%Y"), t.emp_no, t.emp_name, t.warehouse_code, t.start_time or "",
                    t.end_time or "", f"{t.hours:.2f}".replace(".", ","), f"{t.amount_total:.2f}".replace(".", ",")])
    return _file(buf.getvalue().encode("utf-8"), f"Leistungsnachweis_{ss.settle_no}.csv", "text/csv; charset=utf-8")


# ═════════════════════════════════════════════════════════════════════
#  甲方客户
# ═════════════════════════════════════════════════════════════════════
class CustomerIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    address: Optional[str] = Field(None, max_length=500)
    country: str = Field("DE", min_length=2, max_length=2)
    vat_id: Optional[str] = Field(None, max_length=30)
    email: Optional[str] = Field(None, max_length=120)
    contact: Optional[str] = Field(None, max_length=100)
    payment_days: Optional[int] = Field(None, ge=0, le=365)
    reverse_charge: bool = False
    buyer_reference: Optional[str] = Field(None, max_length=100)
    warehouse_codes: list[str] = []
    datev_account: Optional[str] = Field(None, max_length=10)
    is_active: bool = True
    notes: Optional[str] = None


def _cust_dict(c: Customer) -> dict:
    d = {col.name: getattr(c, col.name) for col in Customer.__table__.columns}
    d["warehouse_codes"] = [x for x in (c.warehouse_codes or "").split(",") if x]
    d["debitor"] = c.datev_account or str(int(settings_store.get("datev_debitor_start") or 10000) + c.id)
    return d


@router.get("/customers")
def list_customers(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, CUSTOMER_READ)
    return [_cust_dict(c) for c in db.scalars(select(Customer).order_by(Customer.is_active.desc(), Customer.name)).all()]


def _apply_customer(c: Customer, body: CustomerIn) -> None:
    data = body.model_dump()
    data["warehouse_codes"] = ",".join(sorted({w.strip().upper() for w in body.warehouse_codes if w.strip()})) or None
    data["country"] = body.country.upper()
    for k, v in data.items():
        setattr(c, k, v.strip() if isinstance(v, str) else v)


@router.post("/customers", status_code=201)
def create_customer(body: CustomerIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    c = Customer()
    _apply_customer(c, body)
    db.add(c)
    db.commit()
    return _cust_dict(c)


@router.put("/customers/{cid}")
def update_customer(cid: int, body: CustomerIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    c = db.get(Customer, cid)
    if c is None:
        raise HTTPException(404, "客户不存在")
    _apply_customer(c, body)
    db.commit()
    return _cust_dict(c)


# ═════════════════════════════════════════════════════════════════════
#  甲方账单
# ═════════════════════════════════════════════════════════════════════
def _inv_dict(i: Invoice) -> dict:
    d = {c.name: getattr(i, c.name) for c in Invoice.__table__.columns}
    d["lines"] = json.loads(i.lines or "[]")
    return d


def _totals(inv: Invoice, lines: list[dict]) -> None:
    for l in lines:
        l["qty"] = round(float(l.get("qty") or 0), 4)
        l["unit_price"] = round(float(l.get("unit_price") or 0), 4)
        l["amount"] = _r(l["qty"] * l["unit_price"])
    inv.lines = json.dumps(lines, ensure_ascii=False)
    inv.net = _r(sum(l["amount"] for l in lines))
    inv.vat = 0.0 if inv.reverse_charge else _r(inv.net * inv.vat_rate)
    inv.gross = _r(inv.net + inv.vat)


_CN_RATE = {("20GP", "load"): "rate_load_20gp", ("20GP", "unload"): "rate_unload_20gp",
            ("40GP", "load"): "rate_load_40gp", ("40GP", "unload"): "rate_unload_40gp",
            ("40HC", "load"): "rate_load_40gp", ("40HC", "unload"): "rate_unload_40gp",
            ("45HC", "load"): "rate_45hc", ("45HC", "unload"): "rate_45hc"}


def build_invoice_lines(db: Session, codes: list[str], start: date, end: date, include: dict) -> tuple[list, list]:
    lines, warnings = [], []
    whs = {w.code: w for w in db.scalars(select(Warehouse).where(Warehouse.code.in_(codes))).all()}
    if include.get("hours", True):
        rows = db.execute(select(Timesheet.warehouse_code, func.sum(Timesheet.hours), func.count(Timesheet.id))
                          .where(Timesheet.warehouse_code.in_(codes), Timesheet.work_date >= start, Timesheet.work_date <= end,
                                 Timesheet.approval_status.in_(["fin_pending", "booked"]),
                                 Timesheet.settlement_type != "container")
                          .group_by(Timesheet.warehouse_code)).all()
        for code, hours, n in rows:
            w = whs.get(code)
            rate = float(w.rate_hourly or 0) if w else 0.0
            if not rate:
                warnings.append(f"{code} 未配置客户时薪（仓库价格配置）")
            lines.append({"description": f"Personaldienstleistung Lager {w.name if w else code} ({n} Einsätze)",
                          "qty": round(float(hours or 0), 2), "unit": "Std.", "unit_price": rate, "source": "hours",
                          "warehouse": code})
        pending = db.scalar(select(func.count(Timesheet.id)).where(
            Timesheet.warehouse_code.in_(codes), Timesheet.work_date >= start, Timesheet.work_date <= end,
            Timesheet.approval_status.in_(["draft", "wh_pending"])))
        if pending:
            warnings.append(f"另有 {pending} 条工时尚未经仓库审批，未计入")
    if include.get("containers", True):
        groups: dict[tuple, dict] = {}
        for c in db.scalars(select(ContainerRecord).where(
                ContainerRecord.warehouse_code.in_(codes), ContainerRecord.work_date >= start, ContainerRecord.work_date <= end,
                ContainerRecord.approval_status.in_(["wh_approved", "fin_approved"]))).all():
            g = groups.setdefault((c.warehouse_code, c.container_type, c.load_type), {"n": 0, "sum": 0.0, "priced": 0})
            w = whs.get(c.warehouse_code)
            price = float(c.client_revenue or 0) or float(getattr(w, _CN_RATE.get((c.container_type, c.load_type), ""), 0) or 0) if w else float(c.client_revenue or 0)
            g["n"] += 1
            g["sum"] += price
            g["priced"] += 1 if price else 0
        for (code, ctype, ltype), g in sorted(groups.items()):
            if g["priced"] < g["n"]:
                warnings.append(f"{code} {ctype} {'装柜' if ltype == 'load' else '卸柜'}：{g['n'] - g['priced']} 个柜未配置单价")
            lines.append({"description": f"Container {ctype} {'Beladung' if ltype == 'load' else 'Entladung'} – Lager {code}",
                          "qty": g["n"], "unit": "Container", "unit_price": round(g["sum"] / g["n"], 4) if g["n"] else 0,
                          "source": "containers", "warehouse": code})
    if include.get("operations", False):
        rows = db.execute(select(OperationLog.op_type_id, OperationLog.warehouse_code, func.sum(OperationLog.qty))
                          .where(OperationLog.warehouse_code.in_(codes), OperationLog.work_date >= start,
                                 OperationLog.work_date <= end, OperationLog.status == "confirmed",
                                 OperationLog.source != "container", OperationLog.op_type_id.isnot(None))
                          .group_by(OperationLog.op_type_id, OperationLog.warehouse_code)).all()
        for tid, code, qty in rows:
            t = db.get(OperationType, tid)
            if t is None or not t.client_rate:
                continue
            lines.append({"description": f"{t.name_de or t.name} – Lager {code}", "qty": round(float(qty or 0), 2),
                          "unit": t.unit or "Stk.", "unit_price": float(t.client_rate), "source": "operations", "warehouse": code})
    return lines, warnings


class DraftIn(BaseModel):
    customer_id: int
    period_from: date
    period_to: date
    include: dict = {"hours": True, "containers": True, "operations": False}


@router.get("/invoices")
def list_invoices(status: Optional[str] = None, customer_id: Optional[int] = None, user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    _need(user, CUSTOMER_READ)
    stmt = select(Invoice).order_by(Invoice.created_at.desc()).limit(500)
    if status:
        stmt = stmt.where(Invoice.status == status)
    if customer_id:
        stmt = stmt.where(Invoice.customer_id == customer_id)
    today = date.today()
    out = []
    for i in db.scalars(stmt).all():
        d = _inv_dict(i)
        d.pop("lines")
        d["overdue"] = i.status == "issued" and i.kind == "invoice" and bool(i.due_date) and i.due_date < today
        out.append(d)
    return out


@router.post("/invoices/draft", status_code=201)
def create_draft(body: DraftIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    c = db.get(Customer, body.customer_id)
    if c is None:
        raise HTTPException(404, "客户不存在")
    if body.period_to < body.period_from:
        raise HTTPException(400, "结束日期早于开始日期")
    codes = [x for x in (c.warehouse_codes or "").split(",") if x]
    lines, warnings = build_invoice_lines(db, codes, body.period_from, body.period_to, body.include) if codes else ([], ["客户未关联仓库，请手工添加明细"])
    inv = Invoice(customer_id=c.id, customer_name=c.name, customer_address=c.address, customer_vat_id=c.vat_id,
                  period_from=body.period_from, period_to=body.period_to, reverse_charge=c.reverse_charge,
                  vat_rate=float(settings_store.get("vat_rate") or 0), status="draft", created_by=user.display_name)
    _totals(inv, lines)
    db.add(inv)
    db.commit()
    return {**_inv_dict(inv), "warnings": warnings}


class InvoiceUpdate(BaseModel):
    lines: Optional[list[dict]] = None
    notes: Optional[str] = Field(None, max_length=2000)
    period_from: Optional[date] = None
    period_to: Optional[date] = None
    vat_rate: Optional[float] = Field(None, ge=0, le=0.5)


def _get_inv(db: Session, iid: int) -> Invoice:
    i = db.get(Invoice, iid)
    if i is None:
        raise HTTPException(404, "账单不存在")
    return i


@router.get("/invoices/{iid}")
def get_invoice(iid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, CUSTOMER_READ)
    return _inv_dict(_get_inv(db, iid))


@router.put("/invoices/{iid}")
def update_invoice(iid: int, body: InvoiceUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    inv = _get_inv(db, iid)
    if inv.status != "draft":
        raise HTTPException(400, "已开具的账单不能修改，请作废后重开")
    for k in ("notes", "period_from", "period_to", "vat_rate"):
        v = getattr(body, k)
        if v is not None:
            setattr(inv, k, v.strip() or None if isinstance(v, str) else v)
    lines = json.loads(inv.lines or "[]")
    if body.lines is not None:
        lines = []
        for l in body.lines:
            desc = str(l.get("description") or "").strip()[:300]
            if not desc:
                continue
            lines.append({"description": desc, "qty": l.get("qty") or 0, "unit": str(l.get("unit") or "")[:20],
                          "unit_price": l.get("unit_price") or 0, "source": l.get("source") or "manual",
                          "warehouse": l.get("warehouse")})
    _totals(inv, lines)
    db.commit()
    return _inv_dict(inv)


@router.delete("/invoices/{iid}")
def delete_draft(iid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    inv = _get_inv(db, iid)
    if inv.status != "draft":
        raise HTTPException(400, "只能删除草稿；已开具的账单请作废")
    db.delete(inv)
    db.commit()
    return {"ok": True}


def _company_missing(company: dict) -> list[str]:
    miss = [label for key, label in (("company_name", "公司名称"), ("company_address", "公司地址"))
            if not (company.get(key) or "").strip()]
    if not (company.get("company_tax_number") or company.get("company_vat_id")):
        miss.append("Steuernummer 或 USt-IdNr.")
    return miss


def _next_invoice_no(db: Session, d: date) -> str:
    return next_sequence_no(db, Invoice, Invoice.invoice_no, f"RE-{d.year}-", width=5)


def _issue(db: Session, inv: Invoice, user: User, issue_date: date, customer: Optional[Customer]) -> None:
    inv.invoice_no = _next_invoice_no(db, issue_date)
    inv.issue_date = issue_date
    days = (customer.payment_days if customer and customer.payment_days is not None
            else int(settings_store.get("invoice_payment_days") or 14))
    inv.due_date = issue_date + timedelta(days=days) if inv.kind == "invoice" else None
    inv.status = "issued"
    inv.issued_by = user.display_name
    data = invoice_pdf(_company(), inv, json.loads(inv.lines or "[]"), customer)
    inv.file_id = store_bytes(db, data, f"{inv.invoice_no}.pdf", PDF, user.display_name).id


@router.post("/invoices/{iid}/issue")
def issue_invoice(iid: int, issue_date: Optional[date] = Body(None, embed=True), user: User = Depends(get_current_user),
                  db: Session = Depends(get_db)):
    """开具：分配连续发票号（RE-年份-序号）、锁定、PDF 存档。"""
    _need(user, FIN_ROLES)
    inv = _get_inv(db, iid)
    if inv.status != "draft":
        raise HTTPException(400, "账单已开具")
    lines = json.loads(inv.lines or "[]")
    if not lines or not inv.net:
        raise HTTPException(400, "账单没有金额，无法开具")
    if any(not l.get("unit_price") for l in lines):
        raise HTTPException(400, "有明细行单价为 0，请补充单价或删除该行")
    miss = _company_missing(_company())
    if miss:
        raise HTTPException(400, f"发票必备信息缺失（系统设置 → 公司/财务）：{'、'.join(miss)}")
    c = db.get(Customer, inv.customer_id)
    if not (c and c.address):
        raise HTTPException(400, "客户地址缺失（§ 14 UStG 要求完整地址）")
    if inv.reverse_charge and not (c and c.vat_id):
        raise HTTPException(400, "反向征收需要客户的 USt-IdNr.")
    inv.customer_name, inv.customer_address, inv.customer_vat_id = c.name, c.address, c.vat_id
    _issue(db, inv, user, issue_date or date.today(), c)
    db.commit()
    return _inv_dict(inv)


@router.post("/invoices/{iid}/cancel")
def cancel_invoice(iid: int, reason: str = Body(..., embed=True, min_length=2), user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    """作废：生成红字发票（Stornorechnung，金额取负、引用原发票号），原发票标记为已作废。"""
    _need(user, FIN_ROLES)
    inv = _get_inv(db, iid)
    if inv.kind != "invoice" or inv.status not in ("issued", "paid"):
        raise HTTPException(400, "只有已开具的账单可以作废")
    lines = [{**l, "qty": -float(l.get("qty") or 0)} for l in json.loads(inv.lines or "[]")]
    st = Invoice(kind="storno", cancels_id=inv.id, customer_id=inv.customer_id, customer_name=inv.customer_name,
                 customer_address=inv.customer_address, customer_vat_id=inv.customer_vat_id, period_from=inv.period_from,
                 period_to=inv.period_to, vat_rate=inv.vat_rate, reverse_charge=inv.reverse_charge,
                 notes=f"Storno zur Rechnung {inv.invoice_no} vom {inv.issue_date:%d.%m.%Y}. Grund: {reason.strip()}",
                 created_by=user.display_name)
    _totals(st, lines)
    db.add(st)
    db.flush()
    _issue(db, st, user, date.today(), db.get(Customer, inv.customer_id))
    inv.status = "cancelled"
    db.commit()
    return {"cancelled": inv.invoice_no, "storno": _inv_dict(st)}


@router.post("/invoices/{iid}/paid")
def mark_paid(iid: int, paid_at: date = Body(..., embed=True), amount: Optional[float] = Body(None, embed=True),
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, FIN_ROLES)
    inv = _get_inv(db, iid)
    if inv.status != "issued" or inv.kind != "invoice":
        raise HTTPException(400, "只有已开具未收款的账单可以登记收款")
    inv.paid_at, inv.paid_amount = paid_at, _r(amount if amount is not None else inv.gross)
    inv.status = "paid"
    db.commit()
    return _inv_dict(inv)


@router.get("/invoices/{iid}/pdf")
def invoice_file(iid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, CUSTOMER_READ)
    inv = _get_inv(db, iid)
    if inv.file_id:
        return _pdf_response(db.get(FileBlob, inv.file_id).data, f"{inv.invoice_no}.pdf")
    data = invoice_pdf(_company(), inv, json.loads(inv.lines or "[]"), db.get(Customer, inv.customer_id))
    return _pdf_response(data, f"Rechnung_Entwurf_{inv.id}.pdf")


@router.get("/invoices/{iid}/xrechnung")
def invoice_xrechnung(iid: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, CUSTOMER_READ)
    inv = _get_inv(db, iid)
    if not inv.invoice_no:
        raise HTTPException(400, "请先开具账单")
    c = db.get(Customer, inv.customer_id)
    miss = xrechnung_missing(_company(), inv, c)
    if miss:
        raise HTTPException(400, f"XRechnung 缺少必填信息：{'、'.join(miss)}")
    orig = db.get(Invoice, inv.cancels_id).invoice_no if inv.cancels_id else None
    return _file(xrechnung_xml(_company(), inv, json.loads(inv.lines or "[]"), c, orig), f"{inv.invoice_no}_xrechnung.xml",
                 "application/xml")


# ═════════════════════════════════════════════════════════════════════
#  DATEV / 税务
# ═════════════════════════════════════════════════════════════════════
def _range(period: Optional[str], date_from: Optional[date], date_to: Optional[date]) -> tuple[date, date]:
    if period:
        return _period(period)
    if not (date_from and date_to) or date_to < date_from:
        raise HTTPException(400, "请提供 period 或 date_from/date_to")
    return date_from, date_to


def _bookings(db: Session, start: date, end: date) -> tuple[list[dict], dict]:
    s = settings_store.get_all()
    deb0, kred0 = int(s.get("datev_debitor_start") or 10000), int(s.get("datev_kreditor_start") or 70000)
    out, counts = [], {"invoices": 0, "supplier_settlements": 0, "skipped_supplier_drafts": 0}
    for inv in db.scalars(select(Invoice).where(Invoice.invoice_no.isnot(None), Invoice.issue_date >= start,
                                                Invoice.issue_date <= end).order_by(Invoice.invoice_no)).all():
        c = db.get(Customer, inv.customer_id)
        out.append({"amount": inv.gross, "konto": (c.datev_account if c and c.datev_account else deb0 + inv.customer_id),
                    "gegenkonto": s["datev_revenue_rc_account"] if inv.reverse_charge else s["datev_revenue_account"],
                    "bu": "", "belegdatum": inv.issue_date, "beleg1": inv.invoice_no,
                    "beleg2": inv.due_date.strftime("%d%m%y") if inv.due_date else "", "text": inv.customer_name})
        counts["invoices"] += 1
    vat = float(s.get("vat_rate") or 0)
    for ss in db.scalars(select(SupplierSettlement)).all():
        p_start, p_end = _period(ss.period)
        if not (start <= p_end and p_start <= end):
            continue
        if ss.status == "draft":
            counts["skipped_supplier_drafts"] += 1
            continue
        net = float(ss.invoice_amount or ss.total_amount or 0)
        out.append({"amount": -_r(net * (1 + vat)), "konto": kred0 + ss.supplier_id, "gegenkonto": s["datev_expense_account"],
                    "bu": s.get("datev_expense_bu") or "", "belegdatum": ss.invoice_date or p_end,
                    "beleg1": ss.invoice_no or ss.settle_no, "beleg2": "", "text": f"{ss.supplier_name} {ss.period}"})
        counts["supplier_settlements"] += 1
    return out, counts


@router.get("/datev/buchungsstapel")
def datev_export(period: Optional[str] = None, date_from: Optional[date] = None, date_to: Optional[date] = None,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """DATEV Buchungsstapel（EXTF）：已开具账单（应收）+ 已开票/已付供应商结算（应付）。"""
    _need(user, FIN_ROLES)
    start, end = _range(period, date_from, date_to)
    s = settings_store.get_all()
    if not (s.get("datev_berater_nr") and s.get("datev_mandant_nr")):
        raise HTTPException(400, "请先在系统设置中填写 DATEV Beraternummer 与 Mandantennummer")
    bookings, _ = _bookings(db, start, end)
    return _file(datev_buchungsstapel(s, bookings, start, end), f"EXTF_Buchungsstapel_{start:%Y%m%d}_{end:%Y%m%d}.csv",
                 "text/csv; charset=windows-1252")


def _payroll_rows(db: Session, period: str) -> tuple[list[dict], list[dict]]:
    start, end = _period(period)
    ts = db.scalars(select(Timesheet).where(Timesheet.approval_status == "booked", Timesheet.source_type == "own",
                                            Timesheet.work_date >= start, Timesheet.work_date <= end)).all()
    agg: dict[int, dict] = {}
    for t in ts:
        a = agg.setdefault(t.employee_id, {"hours": 0.0, "piece": 0.0, "bonus": 0.0, "deduction": 0.0, "gross": 0.0,
                                           "wh": defaultdict(float)})
        if t.settlement_type == "container":
            a["piece"] += float(t.amount_hourly or 0) + float(t.amount_piece or 0)
        else:
            a["hours"] += float(t.hours or 0)
            a["piece"] += float(t.amount_piece or 0)
        a["bonus"] += float(t.amount_bonus or 0) + float(t.amount_kpi or 0)
        a["deduction"] += float(t.amount_deduction or 0)
        a["gross"] += float(t.amount_total or 0)
        a["wh"][t.warehouse_code] += float(t.hours or 0)
    rows, missing = [], []
    for emp_id, a in agg.items():
        e = db.get(Employee, emp_id)
        if e is None:
            continue
        r = {"pnr": e.datev_pnr, "emp_no": e.emp_no, "name": e.name, "hours": round(a["hours"], 2), "piece": _r(a["piece"]),
             "bonus": _r(a["bonus"]), "deduction": _r(a["deduction"]), "gross": _r(a["gross"]),
             "kostenstelle": max(a["wh"], key=a["wh"].get) if a["wh"] else ""}
        (rows if e.datev_pnr else missing).append(r)
    return sorted(rows, key=lambda r: str(r["pnr"])), missing


@router.get("/datev/check")
def datev_check(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    _need(user, PAYROLL_ROLES)
    s = settings_store.get_all()
    rows, missing = _payroll_rows(db, period)
    start, end = _period(period)
    _, counts = _bookings(db, start, end)
    settings_missing = [k for k in ("datev_berater_nr", "datev_mandant_nr") if not s.get(k)]
    lodas_missing = [k for k in ("lodas_la_hours",) if not s.get(k)]
    return {"payroll_employees": len(rows) + len(missing),
            "missing_pnr": [{"emp_no": m["emp_no"], "name": m["name"]} for m in missing],
            "settings_missing": settings_missing, "lodas_missing": lodas_missing, "bookings": counts,
            "company_missing": _company_missing(s)}


@router.get("/datev/lodas")
def datev_lodas(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """DATEV LODAS ASCII 工资录入数据（无 DATEV 人员编号的员工不导出，见 /datev/check）。"""
    _need(user, PAYROLL_ROLES)
    s = settings_store.get_all()
    if not (s.get("datev_berater_nr") and s.get("datev_mandant_nr") and s.get("lodas_la_hours")):
        raise HTTPException(400, "请先在系统设置中填写 DATEV Berater/Mandant 与 LODAS Lohnart（至少工时）")
    rows, _ = _payroll_rows(db, period)
    return _file(lodas_ascii(s, period, rows), f"LODAS_{period}.txt", "text/plain; charset=windows-1252")


@router.get("/datev/lohn-csv")
def payroll_csv(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """通用工资录入 CSV（DATEV Lohn und Gehalt / 其他工资软件 / 税务师手工录入）。"""
    _need(user, PAYROLL_ROLES)
    rows, missing = _payroll_rows(db, period)
    buf = io.StringIO()
    buf.write("﻿")
    w = csv.writer(buf, delimiter=";")
    w.writerow(["Personalnummer DATEV", "Pers.-Nr.", "Name", "Zeitraum", "Stunden", "Stück-/Containerlohn", "Zulagen/Prämien",
                "Abzüge", "Brutto lt. Zeiterfassung", "Kostenstelle"])
    for r in rows + missing:
        w.writerow([r["pnr"] or "", r["emp_no"], r["name"], period, *[f"{r[k]:.2f}".replace(".", ",") for k in
                    ("hours", "piece", "bonus", "deduction", "gross")], r["kostenstelle"]])
    return _file(buf.getvalue().encode("utf-8"), f"Lohnvorerfassung_{period}.csv", "text/csv; charset=utf-8")


@router.get("/tax/ustva")
def ustva(period: str = Query(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """增值税预申报预估（按开票日期）：Kz 81（19% 应税收入）、Kz 60（§13b 反向征收）、Kz 66（进项税：供应商结算）。"""
    _need(user, FIN_ROLES)
    start, end = _period(period)
    kz81 = tax81 = kz60 = other_net = other_tax = 0.0
    for inv in db.scalars(select(Invoice).where(Invoice.invoice_no.isnot(None), Invoice.issue_date >= start,
                                                Invoice.issue_date <= end)).all():
        if inv.reverse_charge:
            kz60 += inv.net
        elif abs(inv.vat_rate - 0.19) < 1e-6:
            kz81 += inv.net
            tax81 += inv.vat
        else:
            other_net += inv.net
            other_tax += inv.vat
    vat = float(settings_store.get("vat_rate") or 0)
    kz66 = sum(_r(float(ss.invoice_amount or ss.total_amount or 0) * vat) for ss in db.scalars(
        select(SupplierSettlement).where(SupplierSettlement.period == period, SupplierSettlement.status != "draft")).all())
    out_tax = _r(tax81 + other_tax)
    return {"period": period, "kz81_net": _r(kz81), "kz81_tax": _r(tax81), "kz60_net": _r(kz60),
            "other_rates_net": _r(other_net), "other_rates_tax": _r(other_tax), "kz66_input_tax": _r(kz66),
            "payable": _r(out_tax - kz66),
            "note": "预估值：仅包含本系统开具的账单与已开票的供应商结算，不含其他收入与费用；正式申报请以税务师/DATEV 为准。"}
