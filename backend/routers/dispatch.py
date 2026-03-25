"""
渊博579 HR V7 — Dispatch Demands & Talent Pool Router
/api/v1/dispatch and /api/v1/talent
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from backend.database import get_db
from backend.models.dispatch import DispatchDemand, TalentPool
from backend.models.user import User
from backend.middleware.auth import get_current_user
from backend.services.sequence import next_sequence_no, make_prefix

dispatch_router = APIRouter(prefix="/api/v1/dispatch", tags=["dispatch"])
talent_router = APIRouter(prefix="/api/v1/talent", tags=["talent"])


def _next_demand_no(db: Session) -> str:
    return next_sequence_no(db, DispatchDemand, DispatchDemand.demand_no, make_prefix("DD"))


# ─── Dispatch Demands ────────────────────────────────────────────────────────

@dispatch_router.get("")
def list_demands(
    status: Optional[str] = Query(None),
    warehouse_code: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(DispatchDemand).order_by(DispatchDemand.created_at.desc())
    if status:
        stmt = stmt.where(DispatchDemand.status == status)
    if warehouse_code:
        stmt = stmt.where(DispatchDemand.warehouse_code == warehouse_code)
    if priority:
        stmt = stmt.where(DispatchDemand.priority == priority)
    rows = db.scalars(stmt.offset(skip).limit(limit)).all()
    return [_demand_dict(r) for r in rows]


@dispatch_router.post("", status_code=201)
def create_demand(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    allowed = {
        "biz_line", "warehouse_code", "position", "headcount",
        "start_date", "end_date", "shift_pattern", "client_settlement_type",
        "client_rate", "priority", "requester", "notes",
    }
    d = DispatchDemand(
        demand_no=_next_demand_no(db),
        created_by=user.username,
        **{k: v for k, v in body.items() if k in allowed},
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return _demand_dict(d)


@dispatch_router.put("/{demand_id}")
def update_demand(
    demand_id: int,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    d = db.get(DispatchDemand, demand_id)
    if not d:
        raise HTTPException(404, "Not found")
    allowed = {
        "biz_line", "warehouse_code", "position", "headcount",
        "start_date", "end_date", "shift_pattern", "client_settlement_type",
        "client_rate", "matched_count", "status", "priority", "requester", "notes",
    }
    for k, v in body.items():
        if k in allowed:
            setattr(d, k, v)
    db.commit()
    db.refresh(d)
    return _demand_dict(d)


@dispatch_router.delete("/{demand_id}", status_code=204)
def delete_demand(
    demand_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    d = db.get(DispatchDemand, demand_id)
    if not d:
        raise HTTPException(404, "Not found")
    db.delete(d)
    db.commit()


@dispatch_router.get("/stats")
def demand_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Funnel stats for dispatch demands."""
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    rows = db.execute(
        select(DispatchDemand.status, func.count(DispatchDemand.id).label("cnt"))
        .group_by(DispatchDemand.status)
    ).all()
    status_counts = {r.status: r.cnt for r in rows}
    total_headcount = db.scalar(
        select(func.sum(DispatchDemand.headcount))
        .where(DispatchDemand.status.in_(["open", "recruiting"]))
    ) or 0
    matched = db.scalar(
        select(func.sum(DispatchDemand.matched_count))
        .where(DispatchDemand.status.in_(["open", "recruiting", "filled"]))
    ) or 0
    return {
        "by_status": status_counts,
        "open_headcount": total_headcount,
        "matched_count": matched,
        "fill_rate": round(matched / total_headcount * 100, 1) if total_headcount > 0 else 0,
    }


@dispatch_router.get("/{demand_id}")
def get_demand(
    demand_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    d = db.get(DispatchDemand, demand_id)
    if not d:
        raise HTTPException(404, "Not found")
    return _demand_dict(d)


def _demand_dict(d: DispatchDemand) -> dict:
    return {
        "id": d.id,
        "demand_no": d.demand_no,
        "biz_line": d.biz_line,
        "warehouse_code": d.warehouse_code,
        "position": d.position,
        "headcount": d.headcount,
        "start_date": d.start_date.isoformat() if d.start_date else None,
        "end_date": d.end_date.isoformat() if d.end_date else None,
        "shift_pattern": d.shift_pattern,
        "client_settlement_type": d.client_settlement_type,
        "client_rate": d.client_rate,
        "matched_count": d.matched_count,
        "status": d.status,
        "priority": d.priority,
        "requester": d.requester,
        "notes": d.notes,
        "created_by": d.created_by,
        "created_at": d.created_at.isoformat() if d.created_at else None,
        "updated_at": d.updated_at.isoformat() if d.updated_at else None,
    }


# ─── Talent Pool ─────────────────────────────────────────────────────────────

@talent_router.get("")
def list_talent(
    pool_status: Optional[str] = Query(None),
    source_type: Optional[str] = Query(None),
    biz_line: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = 0, limit: int = 200,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    stmt = select(TalentPool).order_by(TalentPool.created_at.desc())
    if pool_status:
        stmt = stmt.where(TalentPool.pool_status == pool_status)
    if source_type:
        stmt = stmt.where(TalentPool.source_type == source_type)
    if biz_line:
        stmt = stmt.where(TalentPool.preferred_biz_line == biz_line)
    if q:
        stmt = stmt.where(TalentPool.name.ilike(f"%{q}%"))
    rows = db.scalars(stmt.offset(skip).limit(limit)).all()
    return [_talent_dict(r) for r in rows]


@talent_router.post("", status_code=201)
def create_talent(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    if not body.get("name"):
        raise HTTPException(400, "name required")
    allowed = {
        "name", "phone", "nationality", "source_type", "supplier_id",
        "preferred_biz_line", "preferred_warehouses", "position",
        "expected_rate", "languages", "skills", "pool_status",
        "match_score", "referrer", "notes",
    }
    t = TalentPool(
        created_by=user.username,
        **{k: v for k, v in body.items() if k in allowed},
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return _talent_dict(t)


@talent_router.put("/{talent_id}")
def update_talent(
    talent_id: int,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    t = db.get(TalentPool, talent_id)
    if not t:
        raise HTTPException(404, "Not found")
    allowed = {
        "name", "phone", "nationality", "source_type", "supplier_id",
        "preferred_biz_line", "preferred_warehouses", "position",
        "expected_rate", "languages", "skills", "pool_status",
        "match_score", "referrer", "notes",
    }
    for k, v in body.items():
        if k in allowed:
            setattr(t, k, v)
    db.commit()
    db.refresh(t)
    return _talent_dict(t)


@talent_router.delete("/{talent_id}", status_code=204)
def delete_talent(
    talent_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Admin only")
    t = db.get(TalentPool, talent_id)
    if not t:
        raise HTTPException(404, "Not found")
    db.delete(t)
    db.commit()


@talent_router.get("/stats")
def talent_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Funnel stats for talent pool."""
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    rows = db.execute(
        select(TalentPool.pool_status, func.count(TalentPool.id).label("cnt"))
        .group_by(TalentPool.pool_status)
    ).all()
    return {
        "by_status": {r.pool_status: r.cnt for r in rows},
        "total": sum(r.cnt for r in rows),
    }


@talent_router.post("/{talent_id}/match")
def match_talent_to_demand(
    talent_id: int,
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a talent as matched to a dispatch demand."""
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    t = db.get(TalentPool, talent_id)
    if not t:
        raise HTTPException(404, "Talent not found")
    demand_id = body.get("demand_id")
    if demand_id:
        d = db.get(DispatchDemand, demand_id)
        if d:
            d.matched_count = (d.matched_count or 0) + 1
            if d.matched_count >= d.headcount:
                d.status = "filled"
    t.pool_status = "hired"
    db.commit()
    return {"message": "matched", "talent_id": talent_id, "demand_id": demand_id}


@talent_router.get("/{talent_id}")
def get_talent(
    talent_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    t = db.get(TalentPool, talent_id)
    if not t:
        raise HTTPException(404, "Not found")
    return _talent_dict(t)


def _talent_dict(t: TalentPool) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "phone": t.phone,
        "nationality": t.nationality,
        "source_type": t.source_type,
        "supplier_id": t.supplier_id,
        "preferred_biz_line": t.preferred_biz_line,
        "preferred_warehouses": t.preferred_warehouses,
        "position": t.position,
        "expected_rate": t.expected_rate,
        "languages": t.languages,
        "skills": t.skills,
        "pool_status": t.pool_status,
        "match_score": t.match_score,
        "referrer": t.referrer,
        "notes": t.notes,
        "created_by": t.created_by,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
    }
