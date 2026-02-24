import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function GET() {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, department: true, createdAt: true },
    });
    return NextResponse.json(staff);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 }
    );
  }
}

const DEPARTMENTS = ["CSO", "CSI", "PMO", "CST", "CMT", "Training", "CBA"] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, department, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "name and email are required" },
        { status: 400 }
      );
    }

    if (!password || String(password).length < 4) {
      return NextResponse.json(
        { error: "password is required (min 4 characters)" },
        { status: 400 }
      );
    }

    const dept = department && DEPARTMENTS.includes(department) ? department : "CSO";
    const passwordHash = hashPassword(String(password));

    const staff = await prisma.staff.create({
      data: { name, email, department: dept, passwordHash },
      select: { id: true, name: true, email: true, department: true, createdAt: true },
    });

    return NextResponse.json(staff);
  } catch (e: unknown) {
    console.error(e);
    const isUniqueViolation =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "A staff member with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create staff" },
      { status: 500 }
    );
  }
}
