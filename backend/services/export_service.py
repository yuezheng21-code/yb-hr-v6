"""
渊博579 HR V7 — Export Service

Uses openpyxl to generate Excel workbooks.
All amounts in EUR. Dates formatted as YYYY-MM-DD.
"""
from __future__ import annotations
import io
from typing import List
from datetime import datetime


def _make_wb_title(ws, title: str, col_count: int) -> None:
    """Add a merged title cell at the top of a worksheet."""
    from openpyxl.styles import Font, Alignment, PatternFill
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=col_count)
    cell = ws.cell(row=1, column=1, value=title)
    cell.font = Font(bold=True, size=13)
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.fill = PatternFill("solid", fgColor="4F6EF7")
    cell.font = Font(bold=True, size=13, color="FFFFFF")
    ws.row_dimensions[1].height = 28


def _add_header_row(ws, headers: list, row: int = 2) -> None:
    from openpyxl.styles import Font, Alignment, PatternFill
    for col_idx, header in enumerate(headers, start=1):
        cell = ws.cell(row=row, column=col_idx, value=header)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
        cell.fill = PatternFill("solid", fgColor="E8EDF7")
    ws.row_dimensions[row].height = 20


def _auto_col_width(ws) -> None:
    """Auto-fit column widths based on content. Skips merged cells."""
    from openpyxl.cell.cell import MergedCell
    for col in ws.columns:
        max_len = 0
        col_letter = None
        for cell in col:
            if isinstance(cell, MergedCell):
                continue
            if col_letter is None:
                col_letter = cell.column_letter
            if cell.value is not None:
                max_len = max(max_len, len(str(cell.value)))
        if col_letter:
            ws.column_dimensions[col_letter].width = min(max_len + 4, 40)


def export_employee_settlements_xlsx(rows: list, period: str) -> bytes:
    """Export employee settlement list to Excel."""
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = f"员工结算_{period}"

    headers = [
        "结算单号", "月份", "工号", "姓名", "职级", "仓库", "结算类型",
        "工时条数", "总工时(h)", "基础工资(€)", "班次补贴(€)", "扣款(€)",
        "税前工资(€)", "社保(€)", "综合成本(€)", "状态",
    ]
    _make_wb_title(ws, f"渊博579 员工月度结算 — {period}", len(headers))
    _add_header_row(ws, headers)

    for row_idx, r in enumerate(rows, start=3):
        ws.cell(row=row_idx, column=1, value=r.settle_no)
        ws.cell(row=row_idx, column=2, value=r.period)
        ws.cell(row=row_idx, column=3, value=r.emp_no)
        ws.cell(row=row_idx, column=4, value=r.emp_name)
        ws.cell(row=row_idx, column=5, value=r.grade)
        ws.cell(row=row_idx, column=6, value=r.warehouse_code)
        ws.cell(row=row_idx, column=7, value=r.settlement_type)
        ws.cell(row=row_idx, column=8, value=r.timesheet_count)
        ws.cell(row=row_idx, column=9, value=round(r.total_hours, 2))
        ws.cell(row=row_idx, column=10, value=round(r.base_pay, 2))
        ws.cell(row=row_idx, column=11, value=round(r.bonus_pay, 2))
        ws.cell(row=row_idx, column=12, value=round(r.deduction, 2))
        ws.cell(row=row_idx, column=13, value=round(r.gross_pay, 2))
        ws.cell(row=row_idx, column=14, value=round(r.social_cost, 2))
        ws.cell(row=row_idx, column=15, value=round(r.total_cost, 2))
        ws.cell(row=row_idx, column=16, value=r.status)

    _auto_col_width(ws)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_supplier_settlements_xlsx(rows: list, period: str) -> bytes:
    """Export supplier settlement list to Excel."""
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = f"供应商结算_{period}"

    headers = [
        "结算单号", "月份", "供应商", "业务线", "员工人数", "工时条数",
        "总工时(h)", "应付金额(€)", "发票号", "发票日期", "发票金额(€)", "状态",
    ]
    _make_wb_title(ws, f"渊博579 供应商月度结算 — {period}", len(headers))
    _add_header_row(ws, headers)

    for row_idx, r in enumerate(rows, start=3):
        ws.cell(row=row_idx, column=1, value=r.settle_no)
        ws.cell(row=row_idx, column=2, value=r.period)
        ws.cell(row=row_idx, column=3, value=r.supplier_name)
        ws.cell(row=row_idx, column=4, value=r.biz_line)
        ws.cell(row=row_idx, column=5, value=r.employee_count)
        ws.cell(row=row_idx, column=6, value=r.timesheet_count)
        ws.cell(row=row_idx, column=7, value=round(r.total_hours, 2))
        ws.cell(row=row_idx, column=8, value=round(r.total_amount, 2))
        ws.cell(row=row_idx, column=9, value=r.invoice_no or "")
        ws.cell(row=row_idx, column=10, value=r.invoice_date.strftime('%Y-%m-%d') if r.invoice_date else "")
        ws.cell(row=row_idx, column=11, value=round(r.invoice_amount, 2))
        ws.cell(row=row_idx, column=12, value=r.status)

    _auto_col_width(ws)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_project_settlements_xlsx(rows: list, period: str) -> bytes:
    """Export project gross profit analysis to Excel."""
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = f"项目毛利_{period}"

    headers = [
        "结算单号", "月份", "仓库", "业务线",
        "客户收入(€)", "自有人力成本(€)", "供应商成本(€)",
        "总成本(€)", "毛利(€)", "毛利率(%)", "状态",
    ]
    _make_wb_title(ws, f"渊博579 项目毛利分析 — {period}", len(headers))
    _add_header_row(ws, headers)

    for row_idx, r in enumerate(rows, start=3):
        ws.cell(row=row_idx, column=1, value=r.settle_no)
        ws.cell(row=row_idx, column=2, value=r.period)
        ws.cell(row=row_idx, column=3, value=r.warehouse_code)
        ws.cell(row=row_idx, column=4, value=r.biz_line)
        ws.cell(row=row_idx, column=5, value=round(r.client_revenue, 2))
        ws.cell(row=row_idx, column=6, value=round(r.own_labor_cost, 2))
        ws.cell(row=row_idx, column=7, value=round(r.supplier_labor_cost, 2))
        ws.cell(row=row_idx, column=8, value=round(r.total_labor_cost, 2))
        ws.cell(row=row_idx, column=9, value=round(r.gross_profit, 2))
        ws.cell(row=row_idx, column=10, value=round(r.gross_margin * 100, 1))
        ws.cell(row=row_idx, column=11, value=r.status)

    _auto_col_width(ws)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


def export_commissions_xlsx(rows: list, monthly_map: dict, period: str) -> bytes:
    """Export commission agreements with monthly details to Excel.
    rows: list of CommissionRecord ORM objects
    monthly_map: {commission_id: [CommissionMonthly]} dict
    """
    from openpyxl import Workbook
    wb = Workbook()

    # Sheet 1: Commission agreements summary
    ws1 = wb.active
    ws1.title = f"返佣协议_{period}"
    headers1 = [
        "协议编号", "推荐人", "类型", "客户名称", "仓库",
        "层级", "返佣率(%)", "生效日期", "到期日期",
        "已付(€)", "待付(€)", "状态",
    ]
    _make_wb_title(ws1, f"渊博579 返佣协议汇总 — {period}", len(headers1))
    _add_header_row(ws1, headers1)
    for row_idx, r in enumerate(rows, start=3):
        ws1.cell(row=row_idx, column=1, value=r.commission_no)
        ws1.cell(row=row_idx, column=2, value=r.referrer_name)
        ws1.cell(row=row_idx, column=3, value="个人" if r.referrer_type == "individual" else "机构")
        ws1.cell(row=row_idx, column=4, value=r.client_name)
        ws1.cell(row=row_idx, column=5, value=r.client_warehouse or "")
        ws1.cell(row=row_idx, column=6, value=r.tier.upper())
        ws1.cell(row=row_idx, column=7, value=round(r.commission_rate, 1))
        ws1.cell(row=row_idx, column=8, value=r.validity_start.strftime('%Y-%m-%d') if r.validity_start else "")
        ws1.cell(row=row_idx, column=9, value=r.validity_end.strftime('%Y-%m-%d') if r.validity_end else "")
        ws1.cell(row=row_idx, column=10, value=round(r.total_paid, 2))
        ws1.cell(row=row_idx, column=11, value=round(r.total_pending, 2))
        ws1.cell(row=row_idx, column=12, value=r.status)
    _auto_col_width(ws1)

    # Sheet 2: Monthly details for the requested period
    ws2 = wb.create_sheet(title=f"月度明细_{period}")
    headers2 = [
        "协议编号", "推荐人", "客户名称", "月份",
        "发票额(€)", "返佣率(%)", "返佣额(€)", "付款状态", "付款日期",
    ]
    _make_wb_title(ws2, f"渊博579 返佣月度明细 — {period}", len(headers2))
    _add_header_row(ws2, headers2)
    row_idx = 3
    for r in rows:
        for m in monthly_map.get(r.id, []):
            ws2.cell(row=row_idx, column=1, value=r.commission_no)
            ws2.cell(row=row_idx, column=2, value=r.referrer_name)
            ws2.cell(row=row_idx, column=3, value=r.client_name)
            ws2.cell(row=row_idx, column=4, value=m.period)
            ws2.cell(row=row_idx, column=5, value=round(m.client_invoice_amount, 2))
            ws2.cell(row=row_idx, column=6, value=round(m.commission_rate, 1))
            ws2.cell(row=row_idx, column=7, value=round(m.commission_amount, 2))
            ws2.cell(row=row_idx, column=8, value=m.payment_status)
            ws2.cell(row=row_idx, column=9, value=m.payment_date.strftime('%Y-%m-%d') if m.payment_date else "")
            row_idx += 1
    _auto_col_width(ws2)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
