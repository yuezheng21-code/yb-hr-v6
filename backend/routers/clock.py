"""
Clock (punch in/out) router
"""
import uuid
from datetime import date, datetime
from fastapi import APIRouter, Depends, Body
import backend.database as database
from backend.deps import get_user, rows

router = APIRouter(prefix="/api/clock", tags=["clock"])


@router.post("")
def clock(data: dict = Body(...), u: dict = Depends(get_user)):
    db = database.get_db()
    emp_id = u.get("_emp_id") or data.get("employee_id")
    cl_id = f"CL-{datetime.now().strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4]}"
    database.execute(
        db,
        "INSERT INTO clock_records(id,employee_id,employee_name,clock_type,clock_time,work_date) VALUES(?,?,?,?,?,?)",
        (
            cl_id,
            emp_id,
            u.get("display_name", ""),
            data.get("clock_type", "in"),
            datetime.now().strftime("%H:%M"),
            str(date.today()),
        ),
    )
    database.commit(db)
    db.close()
    return {"ok": True, "time": datetime.now().strftime("%H:%M")}


@router.get("/today")
def today_clocks(u: dict = Depends(get_user)):
    db = database.get_db()
    emp_id = u.get("_emp_id")
    result = (
        rows(
            db,
            "SELECT * FROM clock_records WHERE work_date=? AND employee_id=? ORDER BY clock_time",
            (str(date.today()), emp_id),
        )
        if emp_id
        else []
    )
    db.close()
    return result
