/**
 * Unified API client for YB-HR-V7 backend.
 */

let _sessionExpired = false;

function clearAllAuthKeys() {
  localStorage.removeItem('hr7_token');
  localStorage.removeItem('hr7_user');
  localStorage.removeItem('hr6_token');
  localStorage.removeItem('hr6_user');
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    if (res.status === 401 && token && !_sessionExpired) {
      _sessionExpired = true;
      clearAllAuthKeys();
      window.location.reload();
      return;
    }
    const err = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(err.detail || res.statusText);
  }

  return res.json();
}

/** Reset session-expired guard (called on successful login) */
export function resetSessionGuard() {
  _sessionExpired = false;
}

/**
 * Trigger a CSV file download from the backend export endpoint.
 * Uses fetch with Authorization header and creates a blob URL.
 * @param {string} path    - e.g. '/api/timesheets/export?status=已入账'
 * @param {string} token   - Bearer token
 * @param {string} filename - suggested file name for download
 */
export async function downloadCsv(path, token, filename) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, { method: 'GET', headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Download failed' }));
    throw new Error(err.detail || res.statusText);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Poll /health until the server is ready. Returns a cleanup function. */
export function pollHealth(onReady, onStatus) {
  let cancelled = false;
  const INTERVAL = 3000;

  const check = async () => {
    try {
      const res = await fetch('/health');
      if (cancelled) return;
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        // V7 backend always returns 200 but sets db_ready:false while the DB
        // background-init thread is still running.  Only mark the frontend as
        // ready once the database is actually up.
        if (json.db_ready !== false) {
          onReady();
        } else {
          onStatus(json.db_status || 'starting');
          setTimeout(check, INTERVAL);
        }
      } else if (res.status === 503) {
        const json = await res.json().catch(() => ({}));
        onStatus(json.status || 'initializing');
        clearAllAuthKeys();
        setTimeout(check, INTERVAL);
      } else {
        onReady();
      }
    } catch {
      if (!cancelled) onReady();
    }
  };

  check();
  return () => { cancelled = true; };
}
