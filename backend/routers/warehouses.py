"""
渊博579 HR V7 — Warehouses Router
Supports lookup by both integer ID and warehouse code string.
"""
from __future__ import annotations
import math
from typing import Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.warehouse import Warehouse
from backend.models.user import User
from backend.schemas.warehouse import WarehouseCreate, WarehouseUpdate, WarehouseOut
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/warehouses", tags=["warehouses"])


def _validate_geofence(latitude: Optional[float], longitude: Optional[float], radius_m: Optional[int]) -> None:
    if (latitude is None) != (longitude is None):
        raise HTTPException(400, "仓库纬度和经度必须同时填写或同时清空")
    if latitude is not None and (not math.isfinite(latitude) or not -90 <= latitude <= 90):
        raise HTTPException(400, "仓库纬度无效")
    if longitude is not None and (not math.isfinite(longitude) or not -180 <= longitude <= 180):
        raise HTTPException(400, "仓库经度无效")
    if radius_m is None or not 50 <= radius_m <= 10_000:
        raise HTTPException(400, "打卡半径必须在 50 到 10000 米之间")


def _get_by_id_or_code(db: Session, id_or_code: str) -> Optional[Warehouse]:
    """Resolve warehouse by integer ID or string code."""
    try:
        wh_id = int(id_or_code)
        return db.get(Warehouse, wh_id)
    except ValueError:
        return db.scalar(select(Warehouse).where(Warehouse.code == id_or_code.upper()))


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
    _validate_geofence(body.latitude, body.longitude, body.clock_radius_m)
    wh = Warehouse(**body.model_dump())
    db.add(wh)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/{wh_ref}", response_model=WarehouseOut)
def get_warehouse(
    wh_ref: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Look up a warehouse by integer ID or warehouse code (e.g. 'UNA')."""
    wh = _get_by_id_or_code(db, wh_ref)
    if wh is None:
        raise HTTPException(404, "Warehouse not found")
    return wh


@router.put("/{wh_ref}", response_model=WarehouseOut)
def update_warehouse(
    wh_ref: str,
    body: WarehouseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a warehouse identified by integer ID or warehouse code."""
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    wh = _get_by_id_or_code(db, wh_ref)
    if wh is None:
        raise HTTPException(404, "Warehouse not found")
    updates = body.model_dump(exclude_unset=True)
    _validate_geofence(
        updates.get("latitude", wh.latitude),
        updates.get("longitude", wh.longitude),
        updates.get("clock_radius_m", wh.clock_radius_m),
    )
    for k, v in updates.items():
        setattr(wh, k, v)
    db.commit()
    db.refresh(wh)
    return wh
