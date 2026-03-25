"""
渊博579 HR V7 — Warehouses Router
"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.warehouse import Warehouse
from backend.models.user import User
from backend.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseOut
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseOut])
def list_warehouses(
    status: Optional[str] = Query(None),
    biz_line: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Warehouse)
    if status:
        stmt = stmt.where(Warehouse.status == status)
    if biz_line:
        stmt = stmt.where(Warehouse.biz_line == biz_line)
    return db.scalars(stmt).all()


@router.post("", response_model=WarehouseOut, status_code=201)
def create_warehouse(
    body: WarehouseCreate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    wh = Warehouse(**body.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/{wh_id}", response_model=WarehouseOut)
def get_warehouse(wh_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    wh = db.get(Warehouse, wh_id)
    if wh is None:
        raise HTTPException(404, "Warehouse not found")
    return wh


@router.put("/{wh_id}", response_model=WarehouseOut)
def update_warehouse(
    wh_id: int, body: WarehouseUpdate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    wh = db.get(Warehouse, wh_id)
    if wh is None:
        raise HTTPException(404, "Warehouse not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh
