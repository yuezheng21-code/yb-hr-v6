"""
渊博579 HR V7 — System Messages Router
/api/v1/messages
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import select, func, and_, or_, not_, exists
from backend.database import get_db
from backend.models.message import SystemMessage, MessageRead
from backend.models.user import User
from backend.middleware.auth import get_current_user

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


def _is_visible(msg: SystemMessage, user: User) -> bool:
    """Check if a message should be visible to this user."""
    if msg.is_broadcast:
        return True
    if msg.recipient == user.username:
        return True
    if msg.recipient_role and msg.recipient_role == user.role:
        return True
    if msg.sender == user.username:
        return True
    return False


@router.get("")
def list_messages(
    unread_only: bool = Query(False),
    skip: int = 0, limit: int = 100,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List messages visible to current user, newest first."""
    read_subq = select(MessageRead.message_id).where(
        MessageRead.username == user.username
    ).scalar_subquery()

    stmt = select(SystemMessage).where(
        or_(
            SystemMessage.is_broadcast == True,  # noqa: E712
            SystemMessage.recipient == user.username,
            SystemMessage.recipient_role == user.role,
            SystemMessage.sender == user.username,
        )
    ).order_by(SystemMessage.created_at.desc())

    msgs = db.scalars(stmt.offset(skip).limit(limit)).all()
    read_ids = set(db.scalars(
        select(MessageRead.message_id).where(MessageRead.username == user.username)
    ).all())

    result = []
    for m in msgs:
        d = _msg_dict(m)
        d["is_read"] = m.id in read_ids
        if unread_only and d["is_read"]:
            continue
        result.append(d)
    return result


@router.get("/unread-count")
def unread_count(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return count of unread messages for badge display."""
    total = db.scalar(
        select(func.count(SystemMessage.id)).where(
            or_(
                SystemMessage.is_broadcast == True,  # noqa: E712
                SystemMessage.recipient == user.username,
                SystemMessage.recipient_role == user.role,
            )
        )
    ) or 0
    read = db.scalar(
        select(func.count(MessageRead.id)).where(
            MessageRead.username == user.username
        )
    ) or 0
    return {"unread": max(0, total - read), "total": total}


@router.post("", status_code=201)
def send_message(
    body: dict = Body(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message. admin/hr can broadcast or send to a role."""
    if user.role not in {"admin", "hr", "mgr"}:
        raise HTTPException(403, "Forbidden")
    if not body.get("body"):
        raise HTTPException(400, "body required")

    is_broadcast = body.get("is_broadcast", False)
    recipient_role = body.get("recipient_role") or None
    recipient = body.get("recipient") or None

    if user.role not in {"admin", "hr"} and is_broadcast:
        raise HTTPException(403, "Broadcast requires admin or hr role")

    msg = SystemMessage(
        sender=user.username,
        sender_display=user.display_name,
        subject=body.get("subject", ""),
        body=body["body"],
        msg_type=body.get("msg_type", "notice"),
        priority=body.get("priority", "normal"),
        is_broadcast=is_broadcast,
        recipient=recipient,
        recipient_role=recipient_role,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return _msg_dict(msg)


@router.post("/{msg_id}/read")
def mark_read(
    msg_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a single message as read."""
    msg = db.get(SystemMessage, msg_id)
    if not msg:
        raise HTTPException(404, "Not found")
    existing = db.scalar(
        select(MessageRead).where(
            and_(MessageRead.message_id == msg_id, MessageRead.username == user.username)
        )
    )
    if not existing:
        db.add(MessageRead(message_id=msg_id, username=user.username))
        db.commit()
    return {"read": True}


@router.post("/read-all")
def mark_all_read(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all visible messages as read."""
    msgs = db.scalars(
        select(SystemMessage.id).where(
            or_(
                SystemMessage.is_broadcast == True,  # noqa: E712
                SystemMessage.recipient == user.username,
                SystemMessage.recipient_role == user.role,
            )
        )
    ).all()
    existing_ids = set(db.scalars(
        select(MessageRead.message_id).where(MessageRead.username == user.username)
    ).all())
    for mid in msgs:
        if mid not in existing_ids:
            db.add(MessageRead(message_id=mid, username=user.username))
    db.commit()
    return {"marked": len(msgs)}


@router.delete("/{msg_id}", status_code=204)
def delete_message(
    msg_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin can delete any message; sender can delete their own."""
    msg = db.get(SystemMessage, msg_id)
    if not msg:
        raise HTTPException(404, "Not found")
    if user.role != "admin" and msg.sender != user.username:
        raise HTTPException(403, "Forbidden")
    db.delete(msg)
    db.commit()


def _msg_dict(m: SystemMessage) -> dict:
    return {
        "id": m.id,
        "sender": m.sender,
        "sender_display": m.sender_display,
        "recipient": m.recipient,
        "recipient_role": m.recipient_role,
        "subject": m.subject,
        "body": m.body,
        "msg_type": m.msg_type,
        "priority": m.priority,
        "is_broadcast": m.is_broadcast,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }
