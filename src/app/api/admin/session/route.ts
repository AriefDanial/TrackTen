import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated, getAdminCookieName } from "@/lib/admin-auth";

const DEFAULT_DEV_PASSWORD = "admin123";

export async function GET(request: NextRequest) {
  const password =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV !== "production" ? DEFAULT_DEV_PASSWORD : "");
  if (!password) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  const cookie = request.cookies.get(getAdminCookieName())?.value;
  const ok = isAdminAuthenticated(cookie, password);
  return NextResponse.json({ authenticated: ok });
}
