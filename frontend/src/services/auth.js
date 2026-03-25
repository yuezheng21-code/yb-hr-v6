/**
 * Auth service — thin wrappers around the V7 auth endpoints.
 * Token and user are stored in localStorage under hr7_token / hr7_user.
 */
import { api, resetSessionGuard } from './api.js';

const TOKEN_KEY = 'hr7_token';
const USER_KEY  = 'hr7_user';

/** Retrieve the stored token, or null. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

/** Retrieve the stored user object, or null. */
export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}

/** Persist token + user. */
export function persistSession(token, user) {
  resetSessionGuard();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clear persisted session data. */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  // Also clear legacy V6 keys
  localStorage.removeItem('hr6_token');
  localStorage.removeItem('hr6_user');
}

/** Admin login (username + password). Returns { token, user }. */
export async function loginAdmin(username, password) {
  const data = await api('/api/v1/auth/login', { method: 'POST', body: { username, password } });
  // V7 returns { access_token, token_type, user } — normalise to { token, user }
  return { token: data.access_token, user: data.user };
}

/** Worker PIN login — V7 PIN endpoint (may not be implemented yet). */
export async function loginPin(pin) {
  const data = await api('/api/v1/auth/pin', { method: 'POST', body: { pin } });
  return { token: data.access_token, user: data.user };
}

/** Logout — best-effort server call; always clears local session. */
export async function logout(token) {
  try {
    await api('/api/v1/auth/logout', { method: 'POST', token });
  } catch {
    // ignore errors
  } finally {
    clearSession();
  }
}
