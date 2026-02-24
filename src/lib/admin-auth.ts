import { createHmac } from "crypto";

const COOKIE_NAME = "trackten_admin";
const SESSION_PAYLOAD = "trackten-admin-session";

export function getAdminToken(password: string): string {
  return createHmac("sha256", password).update(SESSION_PAYLOAD).digest("hex");
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function isAdminAuthenticated(cookieValue: string | undefined, password: string): boolean {
  if (!cookieValue || !password) return false;
  const expected = getAdminToken(password);
  return cookieValue.length > 0 && expected.length > 0 && cookieValue === expected;
}
