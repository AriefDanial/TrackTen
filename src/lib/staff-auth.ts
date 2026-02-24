import { createHmac } from "crypto";

const COOKIE_NAME = "trackten_staff";
const SESSION_PAYLOAD_PREFIX = "trackten-staff-";

export function getStaffSessionSecret(): string {
  const secret = process.env.STAFF_SESSION_SECRET || process.env.ADMIN_PASSWORD || "trackten-staff-secret";
  return secret;
}

export function signStaffId(staffId: string): string {
  const secret = getStaffSessionSecret();
  const payload = SESSION_PAYLOAD_PREFIX + staffId;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${staffId}.${sig}`;
}

export function getStaffCookieName(): string {
  return COOKIE_NAME;
}

export function verifyStaffCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue || !cookieValue.includes(".")) return null;
  const [staffId, sig] = cookieValue.split(".");
  if (!staffId || !sig) return null;
  const expected = signStaffId(staffId);
  if (cookieValue !== expected) return null;
  return staffId;
}
