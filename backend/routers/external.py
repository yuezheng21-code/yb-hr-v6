"""
渊博579 HR V7 — 对外接口（ybkpi.com / 卸柜记录软件 / 其他系统）

鉴权：Header `X-API-Key`（在「作业记录 → WMS 接入」创建接入源，按需勾选权限范围）
  GET  /api/v1/ext/ping                         查看密钥所属接入源与权限
  POST /api/v1/ext/operations      ops:write     推送作业记录（同 /api/v1/ops/ingest）
  POST /api/v1/ext/containers      containers:write  推送装卸柜记录
  GET  /api/v1/ext/employees       employees:read    读取人员信息（json / csv，可增量）

人员接口只返回对接所需的最少字段（工号、姓名、状态、仓库、岗位、等级、入离职日期、
在该系统的操作员账号），不含电话、证件、税号、银行账户、薪资。
"""
from __future__ import annotations
import csv
import io
import json
import re
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.container import ContainerRecord
from backend.models.operation import OperatorAlias
from backend.routers.operations import authenticate_source, source_scopes, ingest, API_SCOPES
from backend.services.ops_ingest import Matcher, SYSTEM_PRESETS
from backend.services.sequence import next_sequence_no, make_prefix

router = APIRouter(prefix="/api/v1/ext", tags=["external"])
MAX_CONTAINERS = 500
_TIME = re.compile(r"^([01]?\d|2[0-3]):([0-5]\d)")


@router.get("/ping")
def ping(x_api_key: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """连通性测试：返回密钥所属接入源与权限范围（任何有效密钥都可调用）。"""
    src = authenticate_source(db, x_api_key, None)
    return {"source": src.name, "system": src.system, "system_label": SYSTEM_PRESETS.get(src.system, {}).get("label"),
            "scopes": {s: API_SCOPES[s] for s in source_scopes(src)}, "server_time": datetime.utcnow().isoformat() + "Z"}


@router.post("/operations")
def push_operations(payload: dict | list = Body(...), x_api_key: Optional[str] = Header(None),
                    dry_run: bool = Query(False), db: Session = Depends(get_db)):
    """推送作业记录（与 /api/v1/ops/ingest 相同的格式与幂等规则）。"""
    return ingest(payload=payload, x_api_key=x_api_key, dry_run=dry_run, db=db)


# ── 装卸柜 ────────────────────────────────────────────────────────────
def _container_type(v) -> str:
    s = str(v or "").strip().upper().replace(" ", "").replace("'", "").replace("FT", "").replace("尺", "")
    if s in ("LKW", "TRUCK", "卡车", "货车"):
        return "LKW"
    if s.startswith("45"):
        return "45HC"
    if s.startswith("40") and ("HC" in s or "HQ" in s or "高" in s):
        return "40HC"
    if s.startswith("40"):
        return "40GP"
    if s.startswith("20"):
        return "20GP"
    raise ValueError(f"未知柜型：{v}（20GP / 40GP / 40HC / 45HC / LKW）")


def _load_type(v) -> str:
    s = str(v or "unload").strip().lower()
    if s in ("unload", "卸", "卸柜", "卸货", "entladen", "entladung", "u"):
        return "unload"
    if s in ("load", "装", "装柜", "装货", "beladen", "beladung", "l"):
        return "load"
    raise ValueError(f"未知装卸类型：{v}（unload / load）")


def _time(v) -> Optional[str]:
    if v in (None, ""):
        return None
    s = str(v).strip()
    if "T" in s or " " in s:  # ISO datetime → HH:MM
        s = s.replace("T", " ").split(" ")[1]
    m = _TIME.match(s)
    if not m:
        raise ValueError(f"时间格式应为 HH:MM：{v}")
    return f"{int(m.group(1)):02d}:{m.group(2)}"


def _date(v) -> date:
    if isinstance(v, date):
        return v
    s = str(v or "").strip()
    for fmt in ("%Y-%m-%d", "%d.%m.%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s[:10], fmt).date()
        except ValueError:
            pass
    raise ValueError(f"日期格式无效：{v}")


def _g(r: dict, *keys):
    for k in keys:
        if r.get(k) not in (None, ""):
            return r[k]
    return None


@router.post("/containers")
def push_containers(payload: dict | list = Body(...), x_api_key: Optional[str] = Header(None),
                    dry_run: bool = Query(False), db: Session = Depends(get_db)):
    """
    推送装卸柜记录。Body: {"records":[{...}]} 或数组。每条：
      external_id*  对方系统的记录 ID（幂等键；同一 ID 再次推送时，未审批的记录会被更新）
      container_no* 柜号     work_date* 作业日期     warehouse_code（默认取接入源默认仓库）
      container_type 20GP/40GP/40HC/45HC/LKW    load_type unload/load（默认 unload）
      start_time / end_time  HH:MM     workers  工号或该系统操作员账号的数组
      seal_no 封条号     video_recorded 是否录像     notes 备注
    接入源勾选「推送后自动确认」时直接记为仓库已审批，否则进入卸柜记录待审批。
    """
    src = authenticate_source(db, x_api_key, "containers:write")
    records = payload.get("records") if isinstance(payload, dict) else payload
    if not isinstance(records, list) or not all(isinstance(r, dict) for r in records):
        raise HTTPException(400, "records must be a list of objects")
    if len(records) > MAX_CONTAINERS:
        raise HTTPException(413, f"单次最多 {MAX_CONTAINERS} 条")
    matcher = Matcher(db, src.system)
    created, updated, skipped, errors, warnings = 0, 0, 0, [], []
    for idx, r in enumerate(records, 1):
        try:
            ext = str(_g(r, "external_id", "id", "record_id") or "").strip()[:100]
            cno = str(_g(r, "container_no", "柜号", "container") or "").strip()[:30]
            if not ext or not cno:
                raise ValueError("缺少 external_id 或 container_no")
            wh = str(_g(r, "warehouse_code", "warehouse") or src.default_warehouse or "").strip().upper()[:10]
            if not wh:
                raise ValueError("缺少 warehouse_code（或在接入源设置默认仓库）")
            fields = dict(
                container_no=cno, work_date=_date(_g(r, "work_date", "date")), warehouse_code=wh,
                container_type=_container_type(_g(r, "container_type", "type") or "20GP"),
                load_type=_load_type(_g(r, "load_type")), start_time=_time(_g(r, "start_time", "start")),
                end_time=_time(_g(r, "end_time", "end")),
                seal_no=(str(r["seal_no"])[:50] if r.get("seal_no") else None),
                video_recorded=bool(r.get("video_recorded", False)),
                notes=(str(r["notes"])[:2000] if r.get("notes") else None),
            )
            workers = r.get("workers") or []
            if not isinstance(workers, list):
                raise ValueError("workers 应为数组")
            ids, unknown = [], []
            for w in workers:
                key = (w.get("emp_no") or w.get("operator") or w.get("name")) if isinstance(w, dict) else w
                emp = matcher.employee(str(key).strip(), str(key).strip()) if key not in (None, "") else None
                if emp is None:
                    unknown.append(str(key))
                elif emp.id not in ids:
                    ids.append(emp.id)
            if unknown:
                warnings.append({"row": idx, "external_id": ext, "unmatched_workers": unknown})
            fields["worker_ids"] = json.dumps(ids)
            fields["group_size"] = max(len(ids), 1)

            existing = db.scalar(select(ContainerRecord).where(ContainerRecord.source_system == src.system,
                                                               ContainerRecord.external_ref == ext))
            if existing is not None:
                if existing.approval_status != "pending":
                    skipped += 1  # 已审批的记录不被外部覆盖
                    continue
                for k, v in fields.items():
                    setattr(existing, k, v)
                updated += 1
            else:
                cn = ContainerRecord(**fields, cn_no=next_sequence_no(db, ContainerRecord, ContainerRecord.cn_no, make_prefix("CN")),
                                     source_system=src.system, external_ref=ext,
                                     approval_status="wh_approved" if src.auto_confirm else "pending")
                if src.auto_confirm:
                    cn.wh_approver, cn.wh_approved_at = f"API:{src.name}", datetime.utcnow()
                db.add(cn)
                db.flush()
                created += 1
        except (ValueError, TypeError) as e:
            errors.append({"row": idx, "error": str(e)})
    if dry_run:
        db.rollback()
    else:
        src.last_used_at = datetime.utcnow()
        src.total_received = (src.total_received or 0) + created
        db.commit()
    return {"received": len(records), "created": created, "updated": updated, "skipped_approved": skipped,
            "errors": errors, "warnings": warnings, "dry_run": dry_run}


# ── 人员信息 ──────────────────────────────────────────────────────────
EMP_FIELDS = ["emp_no", "name", "status", "warehouse_code", "position", "grade", "biz_line", "source_type",
              "supplier", "join_date", "leave_date", "operator_accounts", "updated_at"]


@router.get("/employees")
def export_employees(
    status: str = Query("all", pattern="^(active|inactive|all)$"),
    warehouse: Optional[str] = Query(None),
    updated_since: Optional[datetime] = Query(None, description="增量同步：只返回此时间后变更的人员（UTC）"),
    format: str = Query("json", pattern="^(json|csv)$"),
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    src = authenticate_source(db, x_api_key, "employees:read")
    stmt = select(Employee).order_by(Employee.emp_no)
    if status != "all":
        stmt = stmt.where(Employee.status == status)
    if warehouse:
        stmt = stmt.where(Employee.primary_warehouse == warehouse.upper())
    if updated_since:
        stmt = stmt.where(Employee.updated_at >= updated_since.replace(tzinfo=None))
    emps = db.scalars(stmt).all()
    suppliers = {s.id: s.name for s in db.scalars(select(Supplier)).all()}
    aliases: dict[int, list[str]] = {}
    for a in db.scalars(select(OperatorAlias).where(OperatorAlias.system.in_([src.system, "*"]))).all():
        aliases.setdefault(a.employee_id, []).append(a.alias)
    rows = [{
        "emp_no": e.emp_no, "name": e.name, "status": e.status, "warehouse_code": e.primary_warehouse,
        "position": e.position, "grade": e.grade, "biz_line": e.biz_line, "source_type": e.source_type,
        "supplier": suppliers.get(e.supplier_id) if e.supplier_id else None,
        "join_date": e.join_date.isoformat() if e.join_date else None,
        "leave_date": e.leave_date.isoformat() if e.leave_date else None,
        "operator_accounts": aliases.get(e.id, []),
        "updated_at": e.updated_at.isoformat() + "Z" if e.updated_at else None,
    } for e in emps]
    src.last_used_at = datetime.utcnow()
    db.commit()
    if format == "csv":
        buf = io.StringIO()
        buf.write("﻿")  # Excel 识别 UTF-8
        w = csv.DictWriter(buf, fieldnames=EMP_FIELDS)
        w.writeheader()
        for r in rows:
            w.writerow({**r, "operator_accounts": "|".join(r["operator_accounts"])})
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv; charset=utf-8",
                                 headers={"Content-Disposition": "attachment; filename=employees.csv"})
    return {"count": len(rows), "generated_at": datetime.utcnow().isoformat() + "Z", "employees": rows}
