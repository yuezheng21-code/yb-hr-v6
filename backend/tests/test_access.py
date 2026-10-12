import unittest
from types import SimpleNamespace

from fastapi import HTTPException
from sqlalchemy import select

from backend.models.employee import Employee
from backend.services.access import require_permission, scoped_employees


class EmployeeAccessTests(unittest.TestCase):
    def test_supplier_scope_is_constrained_to_its_supplier(self):
        user = SimpleNamespace(role="sup", bound_supplier_id=12, bound_warehouse=None, bound_biz_line=None, permissions=None)
        statement = scoped_employees(select(Employee), user)
        compiled = str(statement.compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("employees.supplier_id = 12", compiled)

    def test_unbound_supplier_has_empty_scope(self):
        user = SimpleNamespace(role="sup", bound_supplier_id=None, bound_warehouse=None, bound_biz_line=None, permissions=None)
        compiled = str(scoped_employees(select(Employee), user).compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("employees.id = -1", compiled)

    def test_custom_permission_replaces_role_default(self):
        user = SimpleNamespace(role="hr", permissions='["employees.read"]')
        require_permission(user, "employees.read")
        with self.assertRaises(HTTPException):
            require_permission(user, "personnel.approve")

    def test_all_configured_scope_dimensions_are_combined(self):
        user = SimpleNamespace(
            role="hr",
            bound_supplier_id=12,
            bound_warehouse="UNA",
            bound_biz_line="579",
            bound_zone=None,
            permissions=None,
        )
        compiled = str(scoped_employees(select(Employee), user).compile(compile_kwargs={"literal_binds": True}))
        self.assertIn("employees.supplier_id = 12", compiled)
        self.assertIn("employees.primary_warehouse = 'UNA'", compiled)
        self.assertIn("employees.biz_line = '579'", compiled)


if __name__ == "__main__":
    unittest.main()
