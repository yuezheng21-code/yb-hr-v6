import asyncio
import json
import unittest
from datetime import date
from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.audit_log import AuditLog
from backend.models.employee import Employee
from backend.models.operation import OperationLog, OperationType
from backend.models.personnel import EmployeeContract, EmployeeEvent, LeaveRecord, PersonnelApprovalAudit
from backend.models.supplier import Supplier
from backend.models.user import User
from backend.routers.employees import export_employees
from backend.routers.personnel import (
    ApprovalDecisionIn,
    _change_rows,
    _request_approval,
    decide_approval,
)
from backend.services.access import require_approval_permission, scoped_employees
from backend.services.performance import compute_performance


def account(name, permissions, *, role="hr", supplier_id=None, warehouse=None, biz_line=None, zone=None):
    return SimpleNamespace(
        username=name,
        display_name=name,
        role=role,
        permissions=json.dumps(permissions),
        bound_supplier_id=supplier_id,
        bound_warehouse=warehouse,
        bound_biz_line=biz_line,
        bound_zone=zone,
    )


class PersonnelSecurityTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.db.add_all([
            Supplier(id=1, code="SUP-1", name="Supplier One"),
            Supplier(id=2, code="SUP-2", name="Supplier Two"),
        ])
        self.own = Employee(emp_no="E-OWN", name="Own", supplier_id=1, primary_warehouse="UNA", biz_line="渊博", hourly_rate=14)
        self.other = Employee(emp_no="E-OTHER", name="Other", supplier_id=2, primary_warehouse="DHL", biz_line="579", hourly_rate=15)
        self.db.add_all([self.own, self.other])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_supplier_scope_applies_to_change_rows_and_employee_query(self):
        actor = account("supplier", ["changes.read", "changes.export"], role="sup", supplier_id=1)
        for employee in (self.own, self.other):
            self.db.add(EmployeeEvent(
                employee_id=employee.id,
                event_type="salary",
                event_date=date(2026, 10, 1),
                title=f"{employee.name} salary",
                created_by="hr",
            ))
        self.db.commit()

        visible = self.db.scalars(scoped_employees(select(Employee), actor)).all()
        changes = _change_rows(self.db, actor, None, None, None, None, None, None, None, None)

        self.assertEqual([employee.id for employee in visible], [self.own.id])
        self.assertEqual([row["employee_id"] for row in changes], [self.own.id])

    def test_supplier_roster_export_excludes_other_supplier(self):
        response = export_employees(
            status=None,
            source_type=None,
            biz_line=None,
            user=account("supplier", ["employees.export"], role="sup", supplier_id=1),
            db=self.db,
        )

        async def content():
            return b"".join([chunk async for chunk in response.body_iterator])

        exported = asyncio.run(content()).decode("utf-8-sig")
        self.assertIn("E-OWN", exported)
        self.assertNotIn("E-OTHER", exported)

    def test_performance_aggregation_respects_allowed_employee_ids(self):
        op_type = OperationType(code="PICK", name="Picking", standard_uph=100)
        self.db.add(op_type)
        self.db.flush()
        self.db.add_all([
            OperationLog(op_no="OP-OWN", employee_id=self.own.id, emp_no=self.own.emp_no, emp_name=self.own.name,
                         supplier_id=self.own.supplier_id, op_type_id=op_type.id, work_date=date(2026, 10, 1),
                         qty=100, hours=1, source="manual", status="confirmed"),
            OperationLog(op_no="OP-OTHER", employee_id=self.other.id, emp_no=self.other.emp_no, emp_name=self.other.name,
                         supplier_id=self.other.supplier_id, op_type_id=op_type.id, work_date=date(2026, 10, 1),
                         qty=100, hours=1, source="manual", status="confirmed"),
        ])
        self.db.commit()

        rows = compute_performance(
            self.db,
            date(2026, 10, 1),
            date(2026, 10, 1),
            group_by="employee",
            employee_ids={self.own.id},
        )

        self.assertEqual([row["key"] for row in rows], [self.own.id])

    def test_specific_approval_permission_only_allows_its_type(self):
        approver = account("leave-approver", ["personnel.approve.leave"])
        require_approval_permission(approver, "leave")
        with self.assertRaises(HTTPException) as error:
            require_approval_permission(approver, "salary")
        self.assertEqual(error.exception.status_code, 403)

    def test_salary_request_is_pending_then_executed_with_full_audit(self):
        requester = account("requester", ["personnel.request"])
        approver = account("approver", ["personnel.approve.salary"])
        approval = _request_approval(
            self.db,
            self.own,
            "salary",
            {"new_rate": 17.5, "effective_date": "2026-10-15", "reason": "performance"},
            requester,
        )
        self.db.commit()
        self.assertEqual(approval.status, "pending")
        self.assertEqual(self.own.hourly_rate, 14)

        result = decide_approval(
            approval.id,
            ApprovalDecisionIn(status="approved", note="approved after review"),
            approver,
            self.db,
        )
        self.db.refresh(self.own)
        audits = self.db.scalars(
            select(PersonnelApprovalAudit.action)
            .where(PersonnelApprovalAudit.approval_id == approval.id)
            .order_by(PersonnelApprovalAudit.id)
        ).all()

        self.assertEqual(result["status"], "executed")
        self.assertEqual(self.own.hourly_rate, 17.5)
        self.assertEqual(audits, ["requested", "approved", "executed"])
        self.assertEqual(
            self.db.scalar(select(EmployeeEvent).where(EmployeeEvent.id == result["event_id"])).event_type,
            "salary",
        )
        self.assertEqual(
            len(self.db.scalars(select(AuditLog).where(AuditLog.target_id == str(approval.id))).all()),
            3,
        )

    def test_rejected_leave_does_not_create_leave_record(self):
        requester = account("requester", ["personnel.request"])
        approver = account("approver", ["personnel.approve.leave"])
        approval = _request_approval(
            self.db,
            self.own,
            "leave",
            {"leave_type": "urlaub", "start_date": "2026-10-20", "end_date": "2026-10-21", "days": 2, "notes": None},
            requester,
        )
        self.db.commit()

        result = decide_approval(
            approval.id,
            ApprovalDecisionIn(status="rejected", note="staffing coverage required"),
            approver,
            self.db,
        )

        self.assertEqual(result["status"], "rejected")
        self.assertIsNone(self.db.scalar(select(LeaveRecord).where(LeaveRecord.employee_id == self.own.id)))

    def test_termination_side_effects_only_apply_after_approval(self):
        worker = User(username="worker", password_hash="x", display_name="Worker", role="worker", is_active=True)
        self.db.add(worker)
        self.db.flush()
        self.own.user_id = worker.id
        contract = EmployeeContract(
            employee_id=self.own.id,
            contract_no="AV-1",
            contract_type="unbefristet",
            start_date=date(2026, 1, 1),
            hourly_rate=14,
            status="active",
        )
        self.db.add(contract)
        requester = account("requester", ["personnel.request"])
        approval = _request_approval(
            self.db,
            self.own,
            "termination",
            {"last_day": date.today().isoformat(), "termination_type": "ordentlich", "deactivate_login": True},
            requester,
        )
        self.db.commit()

        self.assertEqual(self.own.status, "active")
        self.assertEqual(contract.status, "active")
        self.assertTrue(worker.is_active)

        decide_approval(
            approval.id,
            ApprovalDecisionIn(status="approved", note="approved"),
            account("approver", ["personnel.approve.termination"]),
            self.db,
        )
        self.db.refresh(self.own)
        self.db.refresh(contract)
        self.db.refresh(worker)

        self.assertEqual(self.own.status, "inactive")
        self.assertEqual(self.own.leave_date, date.today())
        self.assertEqual(contract.status, "ended")
        self.assertFalse(worker.is_active)


if __name__ == "__main__":
    unittest.main()
