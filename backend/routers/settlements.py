"""
渊博579 HR V7 — Settlements Router
/api/v1/settlements

Three sub-resources:
  /employee  — direct (own) employee monthly settlement
  /supplier  — supplier monthly settlement
  /project   — project gross profit analysis
"""
from __future__ import annotations
from datetime import datetime, date
from typing import Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.settlement import EmployeeSettlement, SupplierSettlement, ProjectSettlement
from backend.models.timesheet import Timesheet
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.container import ContainerRecord
from backend.models.user import User
from backend.schemas.settlement import EmployeeSettlementOut, SupplierSettlementOut, ProjectSettlementOut
from backend.middleware.auth import get_current_user
from backend.services.sequence import next_sequence_no, make_prefix
from backend.services import export_service
from backend.config import SOCIAL_RATE, VACATION_RATE, SICK_RATE, MGMT_OVERHEAD

router = APIRouter(prefix="/api/v1/settlements", tags=["settlements"])


# ── Helper: parse period string to date range ─────────────────────────

def _period_range(period: str) -> Tuple[date, date]:
    """Return (date_from, date_to_exclusive) for a period string like '2026-03'."""
    try:
        year, month = int(period[:4]), int(period[5:7])
        if not (1 <= month <= 12):
            raise ValueError
    except (ValueError, IndexError):
        raise HTTPException(400, f"Invalid period format '{period}'. Expected YYYY-MM.")
    date_from = date(year, month, 1)
    if month == 12:
        date_to = date(year + 1, 1, 1)
    else:
        date_to = date(year, month + 1, 1)
    return date_from, date_to


# ── Helper: sequence numbers ─────────────────────────────────────────

def _next_es_no(db: Session) -> str:
    return next_sequence_no(db, EmployeeSettlement, EmployeeSettlement.settle_no, make_prefix("ES"))

def _next_ss_no(db: Session) -> str:
    return next_sequence_no(db, SupplierSettlement, SupplierSettlement.settle_no, make_prefix("SS"))

def _next_ps_no(db: Session) -> str:
    return next_sequence_no(db, ProjectSettlement, ProjectSettlement.settle_no, make_prefix("PS"))


def _compute_costs(gross: float) -> dict:
    """Compute cost breakdown from gross pay using configured rates."""
    social = round(gross * SOCIAL_RATE, 2)
    vacation = round(gross * VACATION_RATE, 2)
    sick = round(gross * SICK_RATE, 2)
    mgmt = round(gross * MGMT_OVERHEAD, 2)
    total_cost = round(gross + social + vacation + sick + mgmt, 2)
    return {
        "social_cost": social,
        "vacation_cost": vacation,
        "sick_cost": sick,
        "mgmt_cost": mgmt,
        "total_cost": total_cost,
    }


# ── Employee Settlement ─────────────────────────────────────────────

@router.get("/employee", response_model=list[EmployeeSettlementOut])
def list_employee_settlements(
    period: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    warehouse_code: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(EmployeeSettlement).order_by(EmployeeSettlement.period.desc(), EmployeeSettlement.emp_name)
    if period:
        stmt = stmt.where(EmployeeSettlement.period == period)
    if status:
        stmt = stmt.where(EmployeeSettlement.status == status)
    if warehouse_code:
        stmt = stmt.where(EmployeeSettlement.warehouse_code == warehouse_code)
    # Supplier users only see supplier settlements, not employee ones
    if user.role == "sup":
        return []
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("/employee/generate")
def generate_employee_settlements(
    period: str = Body(..., embed=True),
    overwrite: bool = Body(False, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate (or regenerate) employee monthly settlements from booked timesheets.
    period format: "2026-03"
    """
    if user.role not in {"admin", "hr", "fin"}:
        raise HTTPException(403, "Forbidden")

    date_from, date_to = _period_range(period)

    if overwrite:
        existing_drafts = db.scalars(
            select(EmployeeSettlement).where(
                EmployeeSettlement.period == period,
                EmployeeSettlement.status == "draft",
            )
        ).all()
        for es in existing_drafts:
            db.delete(es)
        db.flush()

    ts_rows = db.execute(
        select(
            Timesheet.employee_id,
            Timesheet.emp_no,
            Timesheet.emp_name,
            Timesheet.warehouse_code,
            Timesheet.biz_line,
            Timesheet.settlement_type,
            func.count(Timesheet.id).label("ts_count"),
            func.sum(Timesheet.hours).label("total_hours"),
            func.sum(Timesheet.pieces).label("total_pieces"),
            func.sum(Timesheet.amount_hourly + Timesheet.amount_piece + Timesheet.amount_kpi).label("base_pay"),
            func.sum(Timesheet.amount_bonus).label("bonus_pay"),
            func.sum(Timesheet.amount_deduction).label("deduction"),
            func.sum(Timesheet.amount_total).label("gross_pay"),
        )
        .where(
            Timesheet.approval_status == "booked",
            Timesheet.work_date >= date_from,
            Timesheet.work_date < date_to,
            Timesheet.source_type == "own",
        )
        .group_by(
            Timesheet.employee_id, Timesheet.emp_no, Timesheet.emp_name,
            Timesheet.warehouse_code, Timesheet.biz_line, Timesheet.settlement_type,
        )
    ).mappings().all()

    created = 0
    for row in ts_rows:
        existing = db.scalar(
            select(EmployeeSettlement).where(
                EmployeeSettlement.period == period,
                EmployeeSettlement.employee_id == row["employee_id"],
                EmployeeSettlement.warehouse_code == row["warehouse_code"],
            )
        )
        if existing and existing.status != "draft":
            continue

        emp = db.get(Employee, row["employee_id"])
        grade = emp.grade if emp else "P1"

        gross = float(row["gross_pay"] or 0)
        costs = _compute_costs(gross)

        if existing:
            existing.timesheet_count = int(row["ts_count"] or 0)
            existing.total_hours = round(float(row["total_hours"] or 0), 2)
            existing.total_pieces = int(row["total_pieces"] or 0)
            existing.base_pay = round(float(row["base_pay"] or 0), 2)
            existing.bonus_pay = round(float(row["bonus_pay"] or 0), 2)
            existing.deduction = round(float(row["deduction"] or 0), 2)
            existing.gross_pay = round(gross, 2)
            existing.grade = grade
            for k, v in costs.items():
                setattr(existing, k, v)
        else:
            es = EmployeeSettlement(
                settle_no=_next_es_no(db),
                period=period,
                employee_id=row["employee_id"],
                emp_no=row["emp_no"],
                emp_name=row["emp_name"],
                grade=grade,
                biz_line=row["biz_line"],
                warehouse_code=row["warehouse_code"],
                settlement_type=row["settlement_type"],
                timesheet_count=int(row["ts_count"] or 0),
                total_hours=round(float(row["total_hours"] or 0), 2),
                total_pieces=int(row["total_pieces"] or 0),
                base_pay=round(float(row["base_pay"] or 0), 2),
                bonus_pay=round(float(row["bonus_pay"] or 0), 2),
                deduction=round(float(row["deduction"] or 0), 2),
                gross_pay=round(gross, 2),
                status="draft",
                **costs,
            )
            db.add(es)
            created += 1

    db.commit()
    return {"generated": created, "period": period}


@router.get("/employee/export/xlsx")
def export_employee_xlsx(
    period: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "hr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(EmployeeSettlement).order_by(EmployeeSettlement.emp_name)
    if period:
        stmt = stmt.where(EmployeeSettlement.period == period)
    rows = db.scalars(stmt).all()
    xlsx_bytes = export_service.export_employee_settlements_xlsx(rows, period or "all")
    filename = f"employee_settlement_{period or 'all'}.xlsx"
    return StreamingResponse(
        iter([xlsx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/employee/{settle_id}", response_model=EmployeeSettlementOut)
def get_employee_settlement(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    es = db.get(EmployeeSettlement, settle_id)
    if es is None:
        raise HTTPException(404, "Settlement not found")
    return es


@router.put("/employee/{settle_id}/confirm", response_model=EmployeeSettlementOut)
def confirm_employee_settlement(
    settle_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    es = db.get(EmployeeSettlement, settle_id)
    if es is None:
        raise HTTPException(404, "Settlement not found")
    if es.status != "draft":
        raise HTTPException(400, "Only draft settlements can be confirmed")
    es.status = "confirmed"
    es.confirmed_by = user.display_name
    es.confirmed_at = datetime.utcnow()
    db.commit()
    db.refresh(es)
    return es


@router.put("/employee/{settle_id}/mark-paid", response_model=EmployeeSettlementOut)
def mark_employee_paid(
    settle_id: int,
    paid_at: Optional[str] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    es = db.get(EmployeeSettlement, settle_id)
    if es is None:
        raise HTTPException(404, "Settlement not found")
    if es.status != "confirmed":
        raise HTTPException(400, "Only confirmed settlements can be marked paid")
    es.status = "paid"
    try:
        es.paid_at = date.fromisoformat(paid_at) if paid_at else date.today()
    except ValueError:
        raise HTTPException(400, f"Invalid date format '{paid_at}'. Expected YYYY-MM-DD.")
    db.commit()
    db.refresh(es)
    return es


# ── Supplier Settlement ─────────────────────────────────────────────

@router.get("/supplier", response_model=list[SupplierSettlementOut])
def list_supplier_settlements(
    period: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(SupplierSettlement).order_by(SupplierSettlement.period.desc(), SupplierSettlement.supplier_name)
    if period:
        stmt = stmt.where(SupplierSettlement.period == period)
    if status:
        stmt = stmt.where(SupplierSettlement.status == status)
    if user.role == "sup" and user.bound_supplier_id:
        stmt = stmt.where(SupplierSettlement.supplier_id == user.bound_supplier_id)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("/supplier/generate")
def generate_supplier_settlements(
    period: str = Body(..., embed=True),
    overwrite: bool = Body(False, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate supplier settlements from booked timesheets for supplier employees."""
    if user.role not in {"admin", "hr", "fin"}:
        raise HTTPException(403, "Forbidden")

    date_from, date_to = _period_range(period)

    if overwrite:
        existing_drafts = db.scalars(
            select(SupplierSettlement).where(
                SupplierSettlement.period == period,
                SupplierSettlement.status == "draft",
            )
        ).all()
        for ss in existing_drafts:
            db.delete(ss)
        db.flush()

    ts_rows = db.execute(
        select(
            Timesheet.supplier_id,
            Timesheet.biz_line,
            func.count(Timesheet.employee_id.distinct()).label("emp_count"),
            func.count(Timesheet.id).label("ts_count"),
            func.sum(Timesheet.hours).label("total_hours"),
            func.sum(Timesheet.amount_total).label("total_amount"),
        )
        .where(
            Timesheet.approval_status == "booked",
            Timesheet.work_date >= date_from,
            Timesheet.work_date < date_to,
            Timesheet.source_type == "supplier",
            Timesheet.supplier_id.isnot(None),
        )
        .group_by(Timesheet.supplier_id, Timesheet.biz_line)
    ).mappings().all()

    created = 0
    for row in ts_rows:
        sup = db.get(Supplier, row["supplier_id"])
        if sup is None:
            continue

        existing = db.scalar(
            select(SupplierSettlement).where(
                SupplierSettlement.period == period,
                SupplierSettlement.supplier_id == row["supplier_id"],
            )
        )
        if existing and existing.status != "draft":
            continue

        total_amount = round(float(row["total_amount"] or 0), 2)
        if existing:
            existing.employee_count = int(row["emp_count"] or 0)
            existing.timesheet_count = int(row["ts_count"] or 0)
            existing.total_hours = round(float(row["total_hours"] or 0), 2)
            existing.total_amount = total_amount
        else:
            ss = SupplierSettlement(
                settle_no=_next_ss_no(db),
                period=period,
                supplier_id=row["supplier_id"],
                supplier_name=sup.name,
                biz_line=row["biz_line"],
                employee_count=int(row["emp_count"] or 0),
                timesheet_count=int(row["ts_count"] or 0),
                total_hours=round(float(row["total_hours"] or 0), 2),
                total_amount=total_amount,
                invoice_amount=total_amount,
                status="draft",
            )
            db.add(ss)
            created += 1

    db.commit()
    return {"generated": created, "period": period}


@router.get("/supplier/export/xlsx")
def export_supplier_xlsx(
    period: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "hr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(SupplierSettlement).order_by(SupplierSettlement.supplier_name)
    if period:
        stmt = stmt.where(SupplierSettlement.period == period)
    rows = db.scalars(stmt).all()
    xlsx_bytes = export_service.export_supplier_settlements_xlsx(rows, period or "all")
    filename = f"supplier_settlement_{period or 'all'}.xlsx"
    return StreamingResponse(
        iter([xlsx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/supplier/{settle_id}", response_model=SupplierSettlementOut)
def get_supplier_settlement(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ss = db.get(SupplierSettlement, settle_id)
    if ss is None:
        raise HTTPException(404, "Settlement not found")
    return ss


@router.put("/supplier/{settle_id}/invoice", response_model=SupplierSettlementOut)
def update_supplier_invoice(
    settle_id: int,
    invoice_no: str = Body(..., embed=True),
    invoice_date: Optional[str] = Body(None, embed=True),
    invoice_amount: Optional[float] = Body(None, embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "hr"}:
        raise HTTPException(403, "Forbidden")
    ss = db.get(SupplierSettlement, settle_id)
    if ss is None:
        raise HTTPException(404, "Settlement not found")
    ss.invoice_no = invoice_no
    if invoice_date:
        try:
            ss.invoice_date = date.fromisoformat(invoice_date)
        except ValueError:
            raise HTTPException(400, f"Invalid date format '{invoice_date}'. Expected YYYY-MM-DD.")
    if invoice_amount is not None:
        ss.invoice_amount = invoice_amount
    ss.status = "invoiced"
    db.commit()
    db.refresh(ss)
    return ss


# ── Project Settlement ─────────────────────────────────────────────

@router.get("/project", response_model=list[ProjectSettlementOut])
def list_project_settlements(
    period: Optional[str] = Query(None),
    warehouse_code: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(ProjectSettlement).order_by(ProjectSettlement.period.desc(), ProjectSettlement.warehouse_code)
    if period:
        stmt = stmt.where(ProjectSettlement.period == period)
    if warehouse_code:
        stmt = stmt.where(ProjectSettlement.warehouse_code == warehouse_code)
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("/project/generate")
def generate_project_settlements(
    period: str = Body(..., embed=True),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate project gross profit analysis per warehouse for the given period.
    Revenue = sum(container_records.client_revenue) for the period.
    Cost = sum(employee_settlements.total_cost) + sum(supplier timesheets.amount_total)
    """
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")

    date_from, date_to = _period_range(period)

    emp_costs = db.execute(
        select(
            EmployeeSettlement.warehouse_code,
            EmployeeSettlement.biz_line,
            func.sum(EmployeeSettlement.total_cost).label("own_cost"),
        )
        .where(EmployeeSettlement.period == period)
        .group_by(EmployeeSettlement.warehouse_code, EmployeeSettlement.biz_line)
    ).mappings().all()

    revenue_rows = db.execute(
        select(
            ContainerRecord.warehouse_code,
            ContainerRecord.biz_line,
            func.sum(ContainerRecord.client_revenue).label("revenue"),
        )
        .where(
            ContainerRecord.work_date >= date_from,
            ContainerRecord.work_date < date_to,
        )
        .group_by(ContainerRecord.warehouse_code, ContainerRecord.biz_line)
    ).mappings().all()

    rev_map: dict[tuple, float] = {
        (r["warehouse_code"], r["biz_line"]): float(r["revenue"] or 0)
        for r in revenue_rows
    }

    created = 0
    for row in emp_costs:
        wh = row["warehouse_code"]
        biz = row["biz_line"]
        own_cost = float(row["own_cost"] or 0)
        revenue = rev_map.get((wh, biz), 0.0)

        sup_cost = db.scalar(
            select(func.sum(Timesheet.amount_total))
            .where(
                Timesheet.work_date >= date_from,
                Timesheet.work_date < date_to,
                Timesheet.approval_status == "booked",
                Timesheet.source_type == "supplier",
                Timesheet.warehouse_code == wh,
                Timesheet.biz_line == biz,
            )
        ) or 0.0

        total_cost = round(own_cost + float(sup_cost), 2)
        gross_profit = round(revenue - total_cost, 2)
        gross_margin = round(gross_profit / revenue, 4) if revenue > 0 else 0.0

        existing = db.scalar(
            select(ProjectSettlement).where(
                ProjectSettlement.period == period,
                ProjectSettlement.warehouse_code == wh,
                ProjectSettlement.biz_line == biz,
            )
        )
        if existing:
            existing.client_revenue = round(revenue, 2)
            existing.own_labor_cost = round(own_cost, 2)
            existing.supplier_labor_cost = round(float(sup_cost), 2)
            existing.total_labor_cost = total_cost
            existing.gross_profit = gross_profit
            existing.gross_margin = gross_margin
        else:
            ps = ProjectSettlement(
                settle_no=_next_ps_no(db),
                period=period,
                warehouse_code=wh,
                biz_line=biz,
                client_revenue=round(revenue, 2),
                own_labor_cost=round(own_cost, 2),
                supplier_labor_cost=round(float(sup_cost), 2),
                total_labor_cost=total_cost,
                gross_profit=gross_profit,
                gross_margin=gross_margin,
            )
            db.add(ps)
            created += 1

    db.commit()
    return {"generated": created, "period": period}


@router.get("/project/export/xlsx")
def export_project_xlsx(
    period: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "fin"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(ProjectSettlement).order_by(ProjectSettlement.warehouse_code)
    if period:
        stmt = stmt.where(ProjectSettlement.period == period)
    rows = db.scalars(stmt).all()
    xlsx_bytes = export_service.export_project_settlements_xlsx(rows, period or "all")
    filename = f"project_settlement_{period or 'all'}.xlsx"
    return StreamingResponse(
        iter([xlsx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/project/{settle_id}", response_model=ProjectSettlementOut)
def get_project_settlement(settle_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"admin", "fin", "mgr"}:
        raise HTTPException(403, "Forbidden")
    ps = db.get(ProjectSettlement, settle_id)
    if ps is None:
        raise HTTPException(404, "Settlement not found")
    return ps


# ── Summary endpoint ────────────────────────────────────────────────

@router.get("/summary")
def settlement_summary(
    period: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Quick summary of all settlement types for the given period."""
    p = period or datetime.utcnow().strftime("%Y-%m")
    emp_rows = db.scalars(
        select(EmployeeSettlement).where(EmployeeSettlement.period == p)
    ).all()
    sup_rows = db.scalars(
        select(SupplierSettlement).where(SupplierSettlement.period == p)
    ).all()
    proj_rows = db.scalars(
        select(ProjectSettlement).where(ProjectSettlement.period == p)
    ).all()

    return {
        "period": p,
        "employee": {
            "count": len(emp_rows),
            "total_hours": round(sum(r.total_hours for r in emp_rows), 1),
            "total_gross": round(sum(r.gross_pay for r in emp_rows), 2),
            "total_cost": round(sum(r.total_cost for r in emp_rows), 2),
        },
        "supplier": {
            "count": len(sup_rows),
            "total_amount": round(sum(r.total_amount for r in sup_rows), 2),
        },
        "project": {
            "count": len(proj_rows),
            "total_revenue": round(sum(r.client_revenue for r in proj_rows), 2),
            "total_profit": round(sum(r.gross_profit for r in proj_rows), 2),
        },
    }
