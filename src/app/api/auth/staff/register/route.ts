import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const DEPARTMENTS = ["CSO", "CSI", "PMO", "CST", "CMT", "Training", "CBA"] as const;

export async function POST(request: NextRequest) {
  let body: { name?: string; email?: string; password?: string; department?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const password = body.password;
  const department = body.department;

  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  if (!password || String(password).length < 4) {
    return NextResponse.json(
      { error: "Password is required (min 4 characters)" },
      { status: 400 }
    );
  }

  const dept =
    department && DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number])
      ? department
      : "CSO";

  try {
    const staff = await prisma.staff.create({
      data: {
        name,
        email,
        department: dept,
        passwordHash: hashPassword(String(password)),
      },
      select: { id: true, name: true, email: true, department: true, createdAt: true },
    });
    return NextResponse.json({
      success: true,
      staff,
      message: "Account created. You can now sign in.",
    });
  } catch (e: unknown) {
    console.error("Register error:", e);
    const err = e as { code?: string; message?: string };
    const isUniqueViolation = err?.code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    const message =
      process.env.NODE_ENV === "development" && err?.message
        ? err.message
        : "Failed to create account. Please try again or contact support.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
