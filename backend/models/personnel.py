"""
渊博579 HR V7 — 人事档案（Personalakte）

员工从录用到离职的全过程记录：
  FileBlob          上传/生成的文件内容（存数据库：Railway 容器无持久磁盘，重新部署不丢）
  EmployeeDocument  员工档案文件（证件、合同、补充协议、请假证明、Abmahnung…），只做软删除
  EmployeeContract  合同及其修订版本（parent_id 指向被修订的合同）
  LeaveRecord       请假
  EmployeeEvent     时间线：入职/合同/修订/调薪/绩效/警告/请假/离职/备注
  DocTemplate       合同与文书模板（{{占位符}}）
  SopDocument / SopAck  SOP 学习资料与学习确认
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey, LargeBinary, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, deferred
from backend.database import Base


class FileBlob(Base):
    __tablename__ = "file_blobs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # deferred: list queries never load file bytes
    data: Mapped[bytes] = deferred(mapped_column(LargeBinary, nullable=False))
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    # id_doc / work_permit / contract / amendment / salary / performance / leave / warning /
    # termination / certificate / training / application / other
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_id: Mapped[int] = mapped_column(Integer, ForeignKey("file_blobs.id"), nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="upload")  # upload / generated
    template_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("doc_templates.id"), nullable=True)
    event_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employee_events.id"), nullable=True)
    valid_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)  # 证件/签证到期提醒
    notes: Mapped[Optional[str]] = mapped_column(Text)
    uploaded_by: Mapped[Optional[str]] = mapped_column(String(100))
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    deleted_by: Mapped[Optional[str]] = mapped_column(String(100))
    deleted_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class EmployeeContract(Base):
    __tablename__ = "employee_contracts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    contract_no: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employee_contracts.id"), nullable=True)
    # befristet / unbefristet / minijob / werkstudent / aushilfe
    contract_type: Mapped[str] = mapped_column(String(20), default="befristet")
    position: Mapped[Optional[str]] = mapped_column(String(100))
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    probation_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    weekly_hours: Mapped[float] = mapped_column(Float, default=40.0)
    hourly_rate: Mapped[float] = mapped_column(Float, default=0.0)
    vacation_days: Mapped[int] = mapped_column(Integer, default=24)
    notice_period: Mapped[Optional[str]] = mapped_column(String(100))
    # draft / active / amended (superseded by a revision) / ended
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    signed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    change_summary: Mapped[Optional[str]] = mapped_column(Text)  # for amendments
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class LeaveRecord(Base):
    __tablename__ = "leave_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    # urlaub / krank / kind_krank / unbezahlt / sonderurlaub / elternzeit / sonstiges
    leave_type: Mapped[str] = mapped_column(String(20), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    days: Mapped[float] = mapped_column(Float, default=0.0)  # working days
    status: Mapped[str] = mapped_column(String(20), default="approved")  # requested / approved / rejected
    certificate_required: Mapped[bool] = mapped_column(Boolean, default=False)  # AU-Bescheinigung
    notes: Mapped[Optional[str]] = mapped_column(Text)
    decided_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class EmployeeEvent(Base):
    __tablename__ = "employee_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    # hired / contract / amendment / salary / performance / warning / leave / termination / document / note
    event_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text)  # JSON
    contract_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employee_contracts.id"), nullable=True)
    leave_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("leave_records.id"), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class DocTemplate(Base):
    __tablename__ = "doc_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # contract / amendment / warning / termination / certificate / other — also the archive category
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="other")
    language: Mapped[str] = mapped_column(String(5), default="de")
    description: Mapped[Optional[str]] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class SopDocument(Base):
    __tablename__ = "sop_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    # safety / process / quality / client / onboarding / other
    category: Mapped[str] = mapped_column(String(30), default="process", index=True)
    language: Mapped[str] = mapped_column(String(5), default="zh")
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))  # 空 = 所有仓库
    description: Mapped[Optional[str]] = mapped_column(Text)
    content: Mapped[Optional[str]] = mapped_column(Text)  # inline text (optional)
    file_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("file_blobs.id"), nullable=True)
    version: Mapped[str] = mapped_column(String(20), default="1.0")
    required: Mapped[bool] = mapped_column(Boolean, default=False)  # 必学
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())


class SopAck(Base):
    __tablename__ = "sop_acks"
    __table_args__ = (UniqueConstraint("sop_id", "user_id", "version", name="uq_sop_ack"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sop_id: Mapped[int] = mapped_column(Integer, ForeignKey("sop_documents.id"), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    acked_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
