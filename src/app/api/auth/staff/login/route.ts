import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signStaffId, getStaffCookieName } from "@/lib/staff-auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  const staff = await prisma.staff.findUnique({
    where: { email },
  });

  if (!staff || !staff.passwordHash || !verifyPassword(password, staff.passwordHash)) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  const token = signStaffId(staff.id);
  const res = NextResponse.json({
    success: true,
    staff: {
      id: staff.id,
      name: staff.name,
      email: staff.email,
      department: staff.department,
    },
  });
  res.cookies.set(getStaffCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}
