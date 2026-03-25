/**
 * Auth service — thin wrappers around the auth endpoints.
 * Token and user are stored in localStorage under hr6_token / hr6_user.
 */
import { api, resetSessionGuard } from './api.js';

const TOKEN_KEY = 'hr6_token';
const USER_KEY  = 'hr6_user';

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

/** Persist token + user returned by login/pin endpoints. */
export function persistSession(token, user) {
  resetSessionGuard();
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Clear persisted session data. */
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Admin login (username + password). Returns { token, user }. */
export async function loginAdmin(username, password) {
  return api('/api/auth/login', { method: 'POST', body: { username, password } });
}

/** Worker PIN login. Returns { token, user }. */
export async function loginPin(pin) {
  return api('/api/auth/pin', { method: 'POST', body: { pin } });
}

/** Logout — best-effort server call; always clears local session. */
export async function logout(token) {
  try {
    await api('/api/auth/logout', { method: 'POST', token });
  } catch {
    // ignore errors
  } finally {
    clearSession();
  }
}
