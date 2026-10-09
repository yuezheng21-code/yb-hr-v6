"""
渊博579 HR V7 — 作业记录 & 绩效 (Labor Operations / Performance)

独立运行：手工报工 / 工人扫码报工 / Excel 导入，不依赖任何仓储系统。
融入集成：马帮 / 领星 / 易仓 等 WMS 通过 API Key 推送或导出文件导入，
          WMS 操作员账号通过 OperatorAlias 映射到本系统员工。
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from backend.database import Base


class OperationType(Base):
    """作业类型 + 工效标准（标准UPH）+ 计件单价"""
    __tablename__ = "operation_types"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_de: Mapped[Optional[str]] = mapped_column(String(100))
    # inbound/putaway/picking/packing/outbound/returns/labeling/container/project/other
    category: Mapped[str] = mapped_column(String(20), default="other")
    unit: Mapped[str] = mapped_column(String(10), default="件")   # 件/单/行/箱/托/柜/m³/小时
    client: Mapped[Optional[str]] = mapped_column(String(50))     # Amazon / TEMU / 空=通用
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))  # 空=全部仓库
    standard_uph: Mapped[float] = mapped_column(Float, default=0.0)  # 标准每小时产量；0=不计效率
    piece_rate: Mapped[float] = mapped_column(Float, default=0.0)    # 员工计件单价 €/unit
    client_rate: Mapped[float] = mapped_column(Float, default=0.0)   # 客户结算单价 €/unit
    keywords: Mapped[Optional[str]] = mapped_column(Text)  # 导入匹配关键词，逗号分隔
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class OperationLog(Base):
    """单条作业记录（一个员工在某天某作业类型上的产出）"""
    __tablename__ = "operation_logs"
    __table_args__ = (UniqueConstraint("source", "external_ref", name="uq_oplog_source_ref"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    op_no: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    employee_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("employees.id"), nullable=True, index=True)
    emp_no: Mapped[Optional[str]] = mapped_column(String(20))
    emp_name: Mapped[Optional[str]] = mapped_column(String(100))
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    operator_ref: Mapped[Optional[str]] = mapped_column(String(100))  # WMS 原始操作员账号

    op_type_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("operation_types.id"), nullable=True, index=True)
    op_code: Mapped[Optional[str]] = mapped_column(String(30))
    op_label: Mapped[Optional[str]] = mapped_column(String(100))  # 原始作业名称（导入时）

    work_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10), index=True)
    client: Mapped[Optional[str]] = mapped_column(String(50), index=True)
    ref_no: Mapped[Optional[str]] = mapped_column(String(60))  # 订单号/波次/柜号/项目号

    qty: Mapped[float] = mapped_column(Float, default=0.0)
    error_qty: Mapped[float] = mapped_column(Float, default=0.0)
    start_time: Mapped[Optional[str]] = mapped_column(String(5))
    end_time: Mapped[Optional[str]] = mapped_column(String(5))
    hours: Mapped[float] = mapped_column(Float, default=0.0)

    # manual / scan / import / api / container
    source: Mapped[str] = mapped_column(String(20), default="manual", index=True)
    source_system: Mapped[Optional[str]] = mapped_column(String(20))  # mabang/lingxing/eccang/generic
    external_ref: Mapped[Optional[str]] = mapped_column(String(120))

    # pending → confirmed | rejected ; unmatched = 员工或作业类型未识别
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    match_issue: Mapped[Optional[str]] = mapped_column(String(200))
    confirmed_by: Mapped[Optional[str]] = mapped_column(String(100))
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class QualityEvent(Base):
    """质量/异常事件：错拣、破损、漏扫、安全违规、客户投诉等"""
    __tablename__ = "quality_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    emp_name: Mapped[str] = mapped_column(String(100), nullable=False)
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    event_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    warehouse_code: Mapped[Optional[str]] = mapped_column(String(10))
    client: Mapped[Optional[str]] = mapped_column(String(50))
    # mispick / damage / missing_scan / label_error / safety / complaint / praise
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    severity: Mapped[str] = mapped_column(String(10), default="minor")  # minor/major/critical/positive
    qty: Mapped[float] = mapped_column(Float, default=1.0)
    deduction: Mapped[float] = mapped_column(Float, default=0.0)  # 扣款 €
    ref_no: Mapped[Optional[str]] = mapped_column(String(60))
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class OperatorAlias(Base):
    """WMS 操作员账号 → 本系统员工 映射"""
    __tablename__ = "operator_aliases"
    __table_args__ = (UniqueConstraint("system", "alias", name="uq_operator_alias"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    system: Mapped[str] = mapped_column(String(20), nullable=False)  # mabang/lingxing/eccang/generic/*
    alias: Mapped[str] = mapped_column(String(100), nullable=False)
    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())


class IngestSource(Base):
    """外部系统推送凭证（API Key 仅保存哈希）"""
    __tablename__ = "ingest_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    system: Mapped[str] = mapped_column(String(20), nullable=False, default="generic")
    key_prefix: Mapped[str] = mapped_column(String(12), nullable=False)
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    default_warehouse: Mapped[Optional[str]] = mapped_column(String(10))
    default_client: Mapped[Optional[str]] = mapped_column(String(50))
    field_mapping: Mapped[Optional[str]] = mapped_column(Text)  # JSON {canonical_field: "their_field"}
    auto_confirm: Mapped[bool] = mapped_column(Boolean, default=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    # 权限范围，逗号分隔：ops:write（推送作业记录）/ containers:write（推送卸柜记录）/ employees:read（读取人员信息）
    # 旧记录为空时按 ops:write 处理
    scopes: Mapped[Optional[str]] = mapped_column(String(200))
    last_used_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    total_received: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.utcnow())
