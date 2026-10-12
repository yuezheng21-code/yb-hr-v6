import bcrypt
import unittest

from fastapi import Response
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from starlette.requests import Request

from backend.database import Base
from backend.middleware.auth import SESSION_COOKIE_NAME, get_current_user
from backend.models.user import User
from backend.routers.auth import login, logout, refresh_token
from backend.schemas.user import LoginIn

TEST_PASSWORD = "safe-password"


def request_with_cookie(path="/api/v1/auth/login", cookie=None):
    headers = [(b"cookie", cookie.encode())] if cookie else []
    return Request({
        "type": "http",
        "http_version": "1.1",
        "method": "POST",
        "scheme": "https",
        "path": path,
        "raw_path": path.encode(),
        "query_string": b"",
        "headers": headers,
        "client": ("127.0.0.1", 12345),
        "server": ("testserver", 443),
    })


class AuthCookieTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine)()
        self.user = User(
            username="cookie-user",
            password_hash=bcrypt.hashpw(TEST_PASSWORD.encode(), bcrypt.gensalt()).decode(),
            display_name="Cookie User",
            role="worker",
            account_category="employee",
            is_active=True,
        )
        self.db.add(self.user)
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_login_sets_httponly_cookie_and_cookie_authenticates(self):
        response = Response()
        credentials = LoginIn.model_validate({"username": "cookie-user", "password": TEST_PASSWORD})
        result = login(
            credentials,
            request_with_cookie(),
            response,
            self.db,
        )

        cookie = response.headers["set-cookie"]
        self.assertIn(f"{SESSION_COOKIE_NAME}=", cookie)
        self.assertIn("HttpOnly", cookie)
        self.assertIn("Secure", cookie)
        token = cookie.split(f"{SESSION_COOKIE_NAME}=", 1)[1].split(";", 1)[0]
        resolved = get_current_user(
            request_with_cookie("/api/v1/auth/me", f"{SESSION_COOKIE_NAME}={token}"),
            credentials=None,
            db=self.db,
        )

        self.assertEqual(result.user.id, self.user.id)
        self.assertEqual(resolved.id, self.user.id)

    def test_refresh_and_logout_update_session_cookie(self):
        refresh_response = Response()
        refresh_token(
            request_with_cookie("/api/v1/auth/refresh"),
            refresh_response,
            user=self.user,
        )
        self.assertIn(f"{SESSION_COOKIE_NAME}=", refresh_response.headers["set-cookie"])

        logout_response = Response()
        logout(request_with_cookie("/api/v1/auth/logout"), logout_response)
        self.assertIn("Max-Age=0", logout_response.headers["set-cookie"])


if __name__ == "__main__":
    unittest.main()
