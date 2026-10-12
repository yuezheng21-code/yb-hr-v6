import bcrypt
import math
import unittest
from datetime import date
from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from backend.database import Base
from backend.models.clock import ClockEvent
from backend.models.employee import Employee
from backend.models.supplier import Supplier
from backend.models.user import User
from backend.models.warehouse import Warehouse
from backend.routers.clock import EARTH_RADIUS_M, clock_punch, list_clock_records, today_clocks
from backend.routers.employees import create_employee
from backend.schemas.clock import ClockPunchIn
from backend.schemas.employee import EmployeeCreate


def scoped_user(*, supplier_id=None):
    return SimpleNamespace(
        role="sup",
        permissions=None,
        bound_supplier_id=supplier_id,
        bound_warehouse=None,
        bound_biz_line=None,
        bound_zone=None,
    )


class ClockGeofenceTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.db.add(Warehouse(
            code="TEST",
            name="Test Warehouse",
            latitude=50.0,
            longitude=8.0,
            clock_radius_m=1000,
            status="active",
        ))
        self.user = User(
            username="worker",
            password_hash="hash",
            display_name="Linked Worker",
            role="worker",
            account_category="employee",
            is_active=True,
        )
        self.db.add(self.user)
        self.db.flush()
        self.employee = Employee(
            emp_no="E-LINKED",
            name="Linked Worker",
            primary_warehouse="TEST",
            status="active",
            user_id=self.user.id,
        )
        self.db.add(self.employee)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def punch(self, clock_type, *, latitude=50.0, longitude=8.0, accuracy_m=20):
        return clock_punch(
            ClockPunchIn(
                clock_type=clock_type,
                latitude=latitude,
                longitude=longitude,
                accuracy_m=accuracy_m,
            ),
            user=self.user,
            db=self.db,
        )

    def test_linked_employee_can_clock_at_geofence_boundary_and_audits_location(self):
        boundary_latitude = 50.0 + math.degrees(1000 / EARTH_RADIUS_M)
        result = self.punch("in", latitude=boundary_latitude)

        event = self.db.get(ClockEvent, result["id"])
        self.assertEqual(result["warehouse_code"], "TEST")
        self.assertLessEqual(result["distance_m"], 1000)
        self.assertEqual(event.accuracy_m, 20)
        self.assertIsNotNone(event.latitude)
        self.assertIsNotNone(event.distance_m)

    def test_new_employee_without_credentials_gets_a_linked_account(self):
        admin = SimpleNamespace(
            role="admin",
            permissions=None,
            bound_supplier_id=None,
            bound_warehouse=None,
            bound_biz_line=None,
            bound_zone=None,
        )
        response = create_employee(
            EmployeeCreate(name="Generated Account", primary_warehouse="TEST"),
            user=admin,
            db=self.db,
        )
        employee = self.db.get(Employee, response["id"])
        account = self.db.get(User, employee.user_id)

        self.assertEqual(account.username, f"employee_{employee.id}")
        self.assertEqual(account.account_category, "employee")
        self.assertTrue(account.is_active)

    def test_employee_account_link_is_unique(self):
        duplicate = Employee(
            emp_no="E-DUPLICATE",
            name="Duplicate Link",
            primary_warehouse="TEST",
            status="active",
            user_id=self.user.id,
        )
        self.db.add(duplicate)

        with self.assertRaises(IntegrityError):
            self.db.commit()
        self.db.rollback()

    def test_clock_rejects_missing_inaccurate_or_out_of_range_location(self):
        with self.assertRaises(HTTPException) as missing:
            clock_punch(ClockPunchIn(clock_type="in"), user=self.user, db=self.db)
        self.assertEqual(missing.exception.status_code, 400)

        with self.assertRaises(HTTPException) as inaccurate:
            self.punch("in", accuracy_m=201)
        self.assertEqual(inaccurate.exception.status_code, 400)

        with self.assertRaises(HTTPException) as outside:
            self.punch("in", latitude=50.02)
        self.assertEqual(outside.exception.status_code, 403)

    def test_clock_enforces_in_out_order(self):
        with self.assertRaises(HTTPException) as no_start:
            self.punch("out")
        self.assertEqual(no_start.exception.status_code, 409)

        self.punch("in")
        with self.assertRaises(HTTPException) as duplicate_start:
            self.punch("in")
        self.assertEqual(duplicate_start.exception.status_code, 409)

        result = self.punch("out")
        self.assertEqual(result["clock_type"], "out")

    def test_clock_never_falls_back_to_matching_display_name(self):
        unlinked = User(
            username="unlinked",
            password_hash="hash",
            display_name=self.employee.name,
            role="worker",
            account_category="employee",
            is_active=True,
        )
        self.db.add(unlinked)
        self.db.commit()

        with self.assertRaises(HTTPException) as error:
            today_clocks(user=unlinked, db=self.db)
        self.assertEqual(error.exception.status_code, 404)

    def test_records_obey_employee_scope_and_hide_raw_coordinates(self):
        self.db.add_all([
            Supplier(id=1, code="SUP-1", name="Supplier One"),
            Supplier(id=2, code="SUP-2", name="Supplier Two"),
        ])
        self.employee.supplier_id = 1
        other = Employee(
            emp_no="E-OTHER",
            name="Other",
            primary_warehouse="TEST",
            supplier_id=2,
            status="active",
        )
        self.db.add(other)
        self.db.flush()
        self.db.add_all([
            ClockEvent(
                employee_id=self.employee.id,
                emp_name=self.employee.name,
                work_date=date.today(),
                clock_type="in",
                clock_time="08:00:00",
                warehouse_code="TEST",
                latitude=50.0,
                longitude=8.0,
                accuracy_m=10,
                distance_m=0,
            ),
            ClockEvent(
                employee_id=other.id,
                emp_name=other.name,
                work_date=date.today(),
                clock_type="in",
                clock_time="08:00:00",
                warehouse_code="TEST",
                latitude=50.0,
                longitude=8.0,
                accuracy_m=10,
                distance_m=0,
            ),
        ])
        self.db.commit()

        rows = list_clock_records(
            date_from=None,
            date_to=None,
            warehouse_code=None,
            employee_id=None,
            skip=0,
            limit=200,
            user=scoped_user(supplier_id=1),
            db=self.db,
        )
        self.assertEqual([row["employee_id"] for row in rows], [self.employee.id])
        self.assertNotIn("latitude", rows[0])
        self.assertNotIn("longitude", rows[0])

    def test_new_employee_gets_bound_normal_login_account(self):
        admin = SimpleNamespace(
            role="admin",
            permissions=None,
            bound_supplier_id=None,
            bound_warehouse=None,
            bound_biz_line=None,
            bound_zone=None,
        )
        response = create_employee(
            EmployeeCreate(
                name="New Employee",
                primary_warehouse="TEST",
                account_username="new.employee",
                account_password="safe-pass",
            ),
            user=admin,
            db=self.db,
        )
        employee = self.db.get(Employee, response["id"])
        account = self.db.get(User, employee.user_id)

        self.assertIsNotNone(account)
        self.assertEqual(account.username, "new.employee")
        self.assertEqual(account.account_category, "employee")
        self.assertTrue(bcrypt.checkpw(b"safe-pass", account.password_hash.encode()))


if __name__ == "__main__":
    unittest.main()
