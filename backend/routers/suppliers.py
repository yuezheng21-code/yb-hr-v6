"""
渊博579 HR V7 — Suppliers Router
"""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from backend.database import get_db
from backend.models.supplier import Supplier
from backend.models.user import User
from backend.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierOut])
def list_suppliers(
    status: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = 0, limit: int = 100,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Supplier)
    if status:
        stmt = stmt.where(Supplier.status == status)
    if q:
        stmt = stmt.where(Supplier.name.ilike(f"%{q}%") | Supplier.code.ilike(f"%{q}%"))
    return db.scalars(stmt.offset(skip).limit(limit)).all()


@router.post("", response_model=SupplierOut, status_code=201)
def create_supplier(
    body: SupplierCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    sup = Supplier(**body.model_dump())
    db.add(sup)
    db.commit()
    db.refresh(sup)
    return sup


@router.get("/{sup_id}", response_model=SupplierOut)
def get_supplier(sup_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sup = db.get(Supplier, sup_id)
    if sup is None:
        raise HTTPException(404, "Supplier not found")
    return sup


@router.put("/{sup_id}", response_model=SupplierOut)
def update_supplier(
    sup_id: int, body: SupplierUpdate,
    user: User = Depends(get_current_user), db: Session = Depends(get_db),
):
    if user.role not in {"admin", "hr"}:
        raise HTTPException(403, "Forbidden")
    sup = db.get(Supplier, sup_id)
    if sup is None:
        raise HTTPException(404, "Supplier not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sup, k, v)
    db.commit()
    db.refresh(sup)
    return sup


@router.delete("/{sup_id}", status_code=204)
def delete_supplier(sup_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin":
        raise HTTPException(403, "Forbidden")
    sup = db.get(Supplier, sup_id)
    if sup is None:
        raise HTTPException(404, "Supplier not found")
    db.delete(sup)
    db.commit()
