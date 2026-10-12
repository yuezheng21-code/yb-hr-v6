/**
 * Auth service — thin wrappers around the V7 auth endpoints.
 * Token and user are retained only in memory. The browser restores sessions
 * through the HttpOnly server cookie, which JavaScript cannot read.
 */
import { api, resetSessionGuard } from './api.js';

let sessionToken = null;
let sessionUser = null;

/** Retrieve the stored token, or null. */
export function getToken() {
  return sessionToken;
}

/** Retrieve the stored user object, or null. */
export function getUser() {
  return sessionUser;
}

/** Persist token + user. */
export function persistSession(token, user) {
  resetSessionGuard();
  sessionToken = token;
  sessionUser = user;
}

/** Clear current session data. */
export function clearSession() {
  sessionToken = null;
  sessionUser = null;
  localStorage.removeItem('hr7_token');
  localStorage.removeItem('hr7_user');
  // Also clear legacy V6 keys
  localStorage.removeItem('hr6_token');
  localStorage.removeItem('hr6_user');
}

/** Username/password login. Returns { token, user }. */
export async function loginWithPassword(username, password) {
  const data = await api('/api/v1/auth/login', { method: 'POST', body: { username, password } });
  // V7 returns { access_token, token_type, user } — normalise to { token, user }
  return { token: data.access_token, user: data.user };
}

/** Logout — best-effort server call; always clears the in-memory session. */
export async function logout(token) {
  try {
    await api('/api/v1/auth/logout', { method: 'POST', token });
  } catch {
    // ignore errors
  } finally {
    clearSession();
  }
}
