"""
Containers router
"""
import json
import uuid
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("")
def list_containers(u: dict = Depends(get_user)):
    db = database.get_db()
    conds = ["1=1"]
    params = []
    if u.get("warehouse_code") and u["role"] == "wh":
        conds.append("warehouse_code=?")
        params.append(u["warehouse_code"])
    result = rows(
        db,
        f"SELECT * FROM containers WHERE {' AND '.join(conds)} ORDER BY work_date DESC,id DESC LIMIT 200",
        params,
    )
    db.close()
    return result


@router.post("")
def create_container(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    ct_id = f"CT-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    workers = data.get("worker_ids", [])
    database.execute(
        db,
        """INSERT INTO containers(id,container_no,container_type,load_type,warehouse_code,biz_line,
        work_date,start_time,seal_no,worker_ids,worker_count,client_revenue,team_pay,split_method,status,notes)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            ct_id,
            data.get("container_no", ""),
            data.get("container_type", "40GP"),
            data.get("load_type", "卸"),
            data.get("warehouse_code", ""),
            data.get("biz_line", "渊博"),
            data.get("work_date", str(date.today())),
            data.get("start_time", "08:00"),
            data.get("seal_no", ""),
            json.dumps(workers),
            len(workers),
            data.get("client_revenue", 0),
            data.get("team_pay", 0),
            "平均",
            "进行中",
            data.get("notes", ""),
        ),
    )
    database.commit(db)
    db.close()
    return {"id": ct_id}


@router.put("/{ct_id}/complete")
def complete_container(ct_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    ct = one(db, "SELECT * FROM containers WHERE id=?", (ct_id,))
    if not ct:
        raise HTTPException(404)
    end_time = data.get("end_time", datetime.now().strftime("%H:%M"))
    sh = int((ct["start_time"] or "08:00").split(":")[0])
    dur = max(0, int(end_time.split(":")[0]) - sh)
    database.execute(
        db,
        "UPDATE containers SET end_time=?,duration_hours=?,status='已完成',video_recorded=?,wh_approved=1,wh_approver=? WHERE id=?",
        (end_time, dur, data.get("video_recorded", 1), u["display_name"], ct_id),
    )
    database.commit(db)
    db.close()
    return {"ok": True, "duration_hours": dur}
