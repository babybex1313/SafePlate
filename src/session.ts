// Client-side session management.
// Reads/writes the safeplate_session cookie and provides a simple API
// for pages to check login state.

import type { AuthUser } from "~/db/auth";

const COOKIE_NAME = "safeplate_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function setSessionCookie(token: string, rememberMe?: boolean): void {
  if (typeof document === "undefined") return;
  let cookieString = `${COOKIE_NAME}=${token}; path=/; SameSite=Lax`;
  if (rememberMe) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    cookieString += `; expires=${expires}`;
  }
  document.cookie = cookieString;
}

export function getSessionToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === COOKIE_NAME) {
      return valueParts.join("=");
    }
  }
  return null;
}

export function clearSession(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

// Cache the current user so multiple components don't re-fetch
let cachedUser: AuthUser | null | undefined;

export function getCachedUser(): AuthUser | null | undefined {
  return cachedUser;
}

export function setCachedUser(user: AuthUser | null): void {
  cachedUser = user;
}

export function clearCachedUser(): void {
  cachedUser = undefined;
}
