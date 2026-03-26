/**
 * Unified API client for YB-HR-V7 backend.
 * Uses Axios with JWT interceptor.
 */
import axios from 'axios';

// ── Axios instance ─────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: '/',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hr7_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth error response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hr7_token');
      localStorage.removeItem('hr7_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// ── Legacy fetch-based api() for backward compatibility ────────────
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

/** Reset session-expired guard */
export function resetSessionGuard() {
  _sessionExpired = false;
}

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
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadBlob(path, token, filename) {
  const headers = {};
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
  a.download = filename || 'export';
  a.click();
  URL.revokeObjectURL(url);
}

export function pollHealth(onReady, onStatusUpdate) {
  let attempts = 0;
  const MAX = 120;
  const INTERVAL = 3000;
  let timer;

  const check = async () => {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      if (data.db_ready !== false) {
        onReady();
        return;
      }
      onStatusUpdate(data.db_status || 'starting');
    } catch {
      onStatusUpdate('connecting...');
    }
    if (++attempts < MAX) {
      timer = setTimeout(check, INTERVAL);
    } else {
      onStatusUpdate('Server did not become ready after 6 minutes');
      onReady(); // show login page anyway so users are not stuck forever
    }
  };

  timer = setTimeout(check, 500);
  return () => clearTimeout(timer);
}
