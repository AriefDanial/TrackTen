import { NextRequest, NextResponse } from "next/server";
import { getAdminToken, getAdminCookieName } from "@/lib/admin-auth";

const DEFAULT_DEV_PASSWORD = "admin123";

export async function POST(request: NextRequest) {
  const password =
    process.env.ADMIN_PASSWORD ??
    (process.env.NODE_ENV !== "production" ? DEFAULT_DEV_PASSWORD : "");
  if (!password) {
    return NextResponse.json(
      { error: "Admin login not configured. Set ADMIN_PASSWORD in .env" },
      { status: 500 }
    );
  }

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }

  const submitted = body.password;
  if (!submitted || submitted !== password) {
    return NextResponse.json(
      { error: "Invalid password" },
      { status: 401 }
    );
  }

  const token = getAdminToken(password);
  const cookieName = getAdminCookieName();
  const res = NextResponse.json({ success: true });
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
  return res;
}
