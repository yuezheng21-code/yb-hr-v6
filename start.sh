#!/bin/sh
# Startup script: wait for DB → init schema → start uvicorn
set -e

# ── 1. Wait for PostgreSQL (production only) ────────────────────────────────
if [ -n "$DATABASE_URL" ]; then
    echo "⏳ Waiting for database to become reachable..."
    python3 - <<'PYEOF'
import os, sys, time
import psycopg2

url = os.environ["DATABASE_URL"].replace("postgres://", "postgresql://", 1)
# 20 attempts × (connect_timeout=5s + 3s sleep) = ≤160s max wait,
# well within Railway's healthcheckTimeout of 300s.
for attempt in range(20):
    try:
        conn = psycopg2.connect(url, connect_timeout=5)
        conn.close()
        print(f"✅ Database reachable (attempt {attempt + 1})")
        sys.exit(0)
    except Exception as exc:
        print(f"⚠  DB not ready (attempt {attempt + 1}/20): {exc}")
        time.sleep(3)

print("❌ Database unavailable after 20 attempts — aborting")
sys.exit(1)
PYEOF
fi

# ── 2. Initialise schema and seed default data ──────────────────────────────
echo "🗄️  Initialising database schema..."
python3 - <<'PYEOF'
try:
    import database
    database.init_db()
    print("✅ Schema initialised")
except Exception as exc:
    import sys
    print(f"❌ Schema initialisation failed: {exc}")
    sys.exit(1)

try:
    database.seed_data()
    print("✅ Seed data applied")
except Exception as exc:
    import sys
    print(f"❌ Seed data failed: {exc}")
    sys.exit(1)
PYEOF

# ── 3. Hand off to uvicorn (exec so it receives signals directly) ───────────
echo "🚀 Starting server on port ${PORT:-8000}..."
exec uvicorn app:app --host 0.0.0.0 --port "${PORT:-8000}"
