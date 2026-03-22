#!/bin/sh
# Startup script: start uvicorn immediately.
# DB wait, schema init, and seed data are handled by the app's background
# startup thread so the health-check port is open from the very first second.
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
