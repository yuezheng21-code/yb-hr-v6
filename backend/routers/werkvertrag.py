"""
Werkvertrag (service contract) router
"""
import json
import uuid
from datetime import date
from fastapi import APIRouter, HTTPException, Depends, Body
import backend.database as database
from backend.deps import get_user, rows, one, auditlog

router = APIRouter(prefix="/api/werkvertrag", tags=["werkvertrag"])


@router.get("")
def list_wv(u: dict = Depends(get_user)):
    db = database.get_db()
    result = rows(db, "SELECT * FROM wv_projects ORDER BY created_at DESC")
    for p in result:
        if isinstance(p.get("cost_data"), str):
            p["cost_data"] = json.loads(p["cost_data"] or "{}")
        if isinstance(p.get("comp_data"), str):
            p["comp_data"] = json.loads(p["comp_data"] or "{}")
    db.close()
    return result


@router.post("")
def create_wv(data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    wv_id = f"WV-{date.today().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    cost_default = json.dumps(
        {
            "workers": [{"label": "P1-P2", "rate": 13.9, "count": 5, "hoursDay": 8, "days": 20}],
            "soc": 21,
            "hol": 8,
            "mgmt": 18,
            "equip": 0,
            "travel": 0,
            "overhead": 5,
            "margin": 15,
        }
    )
    database.execute(
        db,
        """INSERT INTO wv_projects(id,name,client,address,service_type,region,project_manager,
        start_date,end_date,description,phase,cost_data,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,0,?,?)""",
        (
            wv_id,
            data.get("name", ""),
            data.get("client", ""),
            data.get("address", ""),
            data.get("service_type", ""),
            data.get("region", ""),
            data.get("project_manager", ""),
            data.get("start_date", ""),
            data.get("end_date", ""),
            data.get("description", ""),
            cost_default,
            u["display_name"],
        ),
    )
    auditlog(db, u, "CREATE_WV", "wv_projects", wv_id)
    database.commit(db)
    db.close()
    return {"id": wv_id}


@router.put("/{wv_id}")
def update_wv(wv_id: str, data: dict = Body(...), u: dict = Depends(get_user)):
    if u["role"] not in ("admin", "hr", "mgr"):
        raise HTTPException(403)
    db = database.get_db()
    if "cost_data" in data and isinstance(data["cost_data"], dict):
        data["cost_data"] = json.dumps(data["cost_data"])
    if "comp_data" in data and isinstance(data["comp_data"], dict):
        data["comp_data"] = json.dumps(data["comp_data"])
    data.pop("id", None)
    sets = ",".join(f"{k}=?" for k in data)
    database.execute(db, f"UPDATE wv_projects SET {sets} WHERE id=?", list(data.values()) + [wv_id])
    database.commit(db)
    db.close()
    return {"ok": True}
