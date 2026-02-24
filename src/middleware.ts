import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME_ADMIN = "trackten_admin";
const COOKIE_NAME_STAFF = "trackten_staff";
const SESSION_PAYLOAD = "trackten-admin-session";
const STAFF_PAYLOAD_PREFIX = "trackten-staff-";
const DEFAULT_DEV_PASSWORD = "admin123";

function getAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return DEFAULT_DEV_PASSWORD;
  return "";
}

function getStaffSessionSecret(): string {
  return process.env.STAFF_SESSION_SECRET || process.env.ADMIN_PASSWORD || "trackten-staff-secret";
}

async function getAdminTokenEdge(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(SESSION_PAYLOAD)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStaffCookieEdge(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue || !cookieValue.includes(".")) return false;
  const [staffId, sig] = cookieValue.split(".");
  if (!staffId || !sig) return false;
  const secret = getStaffSessionSecret();
  const payload = STAFF_PAYLOAD_PREFIX + staffId;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expectedHex = Array.from(new Uint8Array(expectedSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return sig === expectedHex;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const password = getAdminPassword();

  // Staff: home page requires staff login
  if (pathname === "/") {
    const staffCookie = request.cookies.get(COOKIE_NAME_STAFF)?.value;
    const valid = await verifyStaffCookieEdge(staffCookie);
    if (!valid) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Staff: login page - if already logged in, redirect to home
  if (pathname === "/login") {
    const staffCookie = request.cookies.get(COOKIE_NAME_STAFF)?.value;
    const valid = await verifyStaffCookieEdge(staffCookie);
    if (valid) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Admin login: redirect to unified login page with mode=admin
  if (pathname === "/admin/login") {
    const login = new URL("/login", request.url);
    login.searchParams.set("mode", "admin");
    const from = request.nextUrl.searchParams.get("from");
    if (from) login.searchParams.set("from", from);
    return NextResponse.redirect(login);
  }

  // Admin pages (except login)
  if (pathname.startsWith("/admin")) {
    if (!password) {
      return NextResponse.next();
    }
    const cookie = request.cookies.get(COOKIE_NAME_ADMIN)?.value;
    const expected = await getAdminTokenEdge(password);
    if (!cookie || cookie !== expected) {
      const login = new URL("/login", request.url);
      login.searchParams.set("mode", "admin");
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  // Admin API routes that modify data (require auth)
  const isStaffMutation =
    request.nextUrl.pathname === "/api/staff" && request.method !== "GET";
  const isStaffDelete = request.nextUrl.pathname.match(/^\/api\/staff\/[^/]+$/) && request.method === "DELETE";
  const isApplicationPatch =
    request.nextUrl.pathname.match(/^\/api\/applications\/[^/]+$/) && request.method === "PATCH";

  if ((isStaffMutation || isStaffDelete || isApplicationPatch) && password) {
    const cookie = request.cookies.get(COOKIE_NAME_ADMIN)?.value;
    const expected = await getAdminTokenEdge(password);
    if (!cookie || cookie !== expected) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/api/staff", "/api/staff/:path*", "/api/applications/:path*"],
};
