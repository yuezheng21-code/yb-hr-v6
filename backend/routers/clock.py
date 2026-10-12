"""
Geofenced attendance endpoints.

Employees clock in and out through their normal authenticated account. The
server determines the time and validates the browser-provided position against
the employee's assigned warehouse geofence.
"""
from __future__ import annotations

from datetime import date, datetime
import json
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.middleware.auth import get_current_user
from backend.models.clock import ClockEvent
from backend.models.employee import Employee
from backend.models.user import User
from backend.models.warehouse import Warehouse
from backend.schemas.clock import ClockPunchIn
from backend.services.access import require_permission, scoped_employee_related

router = APIRouter(prefix="/api/v1/clock", tags=["clock"])

EARTH_RADIUS_M = 6_371_000.0
MAX_LOCATION_ACCURACY_M = 200.0


def _resolve_employee(user: User, db: Session, *, lock: bool = False) -> Employee:
    """Return the active employee explicitly linked to this authenticated account."""
    stmt = select(Employee).where(Employee.user_id == user.id, Employee.status == "active")
    if lock:
        stmt = stmt.with_for_update()
    employee = db.scalar(stmt)
    if employee is None:
        raise HTTPException(
            status_code=404,
            detail="当前账号未关联在职员工档案，请联系管理员在用户管理中关联员工账号。",
        )
    return employee


def _assigned_warehouse_codes(employee: Employee) -> set[str]:
    codes = {employee.primary_warehouse.upper()} if employee.primary_warehouse else set()
    raw = employee.secondary_warehouses
    if not raw:
        return codes
    try:
        secondary = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        secondary = raw.split(",")
    if isinstance(secondary, list):
        codes.update(
            str(code).strip().upper()
            for code in secondary
            if isinstance(code, (str, int)) and str(code).strip()
        )
    return codes


def _validate_location(body: ClockPunchIn) -> tuple[float, float, float]:
    values = (body.latitude, body.longitude, body.accuracy_m)
    if any(value is None for value in values):
        raise HTTPException(400, "需要获取当前位置后才能打卡")
    latitude, longitude, accuracy_m = (float(value) for value in values)
    if not all(math.isfinite(value) for value in (latitude, longitude, accuracy_m)):
        raise HTTPException(400, "定位数据无效")
    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        raise HTTPException(400, "定位坐标超出有效范围")
    if not 0 <= accuracy_m <= MAX_LOCATION_ACCURACY_M:
        raise HTTPException(
            400,
            f"定位精度不足（需不大于 {int(MAX_LOCATION_ACCURACY_M)} 米），请开启高精度定位后重试",
        )
    return latitude, longitude, accuracy_m


def _distance_m(latitude: float, longitude: float, target_latitude: float, target_longitude: float) -> float:
    """Return the great-circle distance between two coordinates in metres."""
    lat1, lon1, lat2, lon2 = map(
        math.radians, (latitude, longitude, target_latitude, target_longitude)
    )
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return EARTH_RADIUS_M * 2 * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1 - a)))


def _resolve_clock_warehouse(
    db: Session,
    employee: Employee,
    latitude: float,
    longitude: float,
) -> tuple[Warehouse, float]:
    assigned_codes = _assigned_warehouse_codes(employee)
    if not assigned_codes:
        raise HTTPException(409, "员工未分配打卡仓库，请先维护员工档案")

    warehouses = db.scalars(
        select(Warehouse).where(
            Warehouse.code.in_(assigned_codes),
            Warehouse.status == "active",
        )
    ).all()
    configured = [
        warehouse
        for warehouse in warehouses
        if (
            warehouse.latitude is not None
            and warehouse.longitude is not None
            and math.isfinite(float(warehouse.latitude))
            and math.isfinite(float(warehouse.longitude))
        )
    ]
    if not configured:
        raise HTTPException(409, "所属仓库尚未配置打卡坐标，请联系管理员")

    candidates: list[tuple[Warehouse, float]] = []
    nearest_distance: Optional[float] = None
    for warehouse in configured:
        distance = _distance_m(
            latitude,
            longitude,
            float(warehouse.latitude),
            float(warehouse.longitude),
        )
        nearest_distance = distance if nearest_distance is None else min(nearest_distance, distance)
        if distance <= (warehouse.clock_radius_m or 1000) + 0.01:
            candidates.append((warehouse, distance))

    if not candidates:
        distance_text = f"最近距离 {round(nearest_distance)} 米" if nearest_distance is not None else ""
        raise HTTPException(403, f"当前位置不在已分配仓库的打卡范围内。{distance_text}")
    return min(candidates, key=lambda candidate: candidate[1])


def _event_dict(event: ClockEvent, *, employee: Optional[Employee] = None) -> dict:
    item = {
        "id": event.id,
        "clock_type": event.clock_type,
        "clock_time": event.clock_time,
        "work_date": event.work_date.isoformat(),
        "warehouse_code": event.warehouse_code,
        "accuracy_m": round(event.accuracy_m, 1) if event.accuracy_m is not None else None,
        "distance_m": round(event.distance_m, 1) if event.distance_m is not None else None,
        "created_at": event.created_at.isoformat() if event.created_at else None,
    }
    if employee is not None:
        item.update({"employee_id": employee.id, "emp_no": employee.emp_no, "emp_name": employee.name})
    return item


@router.get("/today")
def today_clocks(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get today's attendance events for the authenticated employee account."""
    employee = _resolve_employee(user, db)
    events = db.scalars(
        select(ClockEvent)
        .where(ClockEvent.employee_id == employee.id, ClockEvent.work_date == date.today())
        .order_by(ClockEvent.id)
    ).all()
    return [_event_dict(event) for event in events]


@router.post("")
def clock_punch(
    body: ClockPunchIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record an in/out event after validating account linkage, position, and sequence."""
    if body.clock_type not in {"in", "out"}:
        raise HTTPException(400, "打卡类型必须为 in 或 out")
    latitude, longitude, accuracy_m = _validate_location(body)
    employee = _resolve_employee(user, db, lock=True)
    warehouse, distance_m = _resolve_clock_warehouse(db, employee, latitude, longitude)

    now = datetime.utcnow()
    last_event = db.scalar(
        select(ClockEvent)
        .where(ClockEvent.employee_id == employee.id, ClockEvent.work_date == now.date())
        .order_by(ClockEvent.id.desc())
    )
    expected_type = "out" if last_event and last_event.clock_type == "in" else "in"
    if body.clock_type != expected_type:
        expected_label = "下班" if expected_type == "out" else "上班"
        raise HTTPException(409, f"当前打卡顺序无效，请先进行{expected_label}打卡")

    event = ClockEvent(
        employee_id=employee.id,
        emp_name=employee.name,
        work_date=now.date(),
        clock_type=body.clock_type,
        clock_time=now.strftime("%H:%M:%S"),
        warehouse_code=warehouse.code,
        latitude=latitude,
        longitude=longitude,
        accuracy_m=accuracy_m,
        distance_m=distance_m,
        created_at=now,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_dict(event)


@router.get("/records")
def list_clock_records(
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    warehouse_code: Optional[str] = Query(None),
    employee_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List attendance records within the caller's existing employee data scope."""
    require_permission(user, "employees.read")
    stmt = (
        select(ClockEvent, Employee)
        .join(Employee, Employee.id == ClockEvent.employee_id)
        .order_by(ClockEvent.work_date.desc(), ClockEvent.id.desc())
    )
    stmt = scoped_employee_related(stmt, user, ClockEvent.employee_id)
    if date_from:
        stmt = stmt.where(ClockEvent.work_date >= date_from)
    if date_to:
        stmt = stmt.where(ClockEvent.work_date <= date_to)
    if warehouse_code:
        stmt = stmt.where(ClockEvent.warehouse_code == warehouse_code.upper())
    if employee_id:
        stmt = stmt.where(ClockEvent.employee_id == employee_id)
    rows = db.execute(stmt.offset(skip).limit(limit)).all()
    return [_event_dict(event, employee=employee) for event, employee in rows]
