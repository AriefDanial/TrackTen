import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const DEFAULT_STAFF_PASSWORD = "password123";

export async function POST() {
  try {
    const count = await prisma.staff.count();
    if (count > 0) {
      return NextResponse.json({
        message: "Database already has staff. Skip seed.",
      });
    }

    const passwordHash = hashPassword(DEFAULT_STAFF_PASSWORD);
    await prisma.staff.createMany({
      data: [
        { name: "John Doe", email: "john@trackten.com", department: "CSO", passwordHash },
        { name: "Jane Smith", email: "jane@trackten.com", department: "CSI", passwordHash },
        { name: "Bob Wilson", email: "bob@trackten.com", department: "PMO", passwordHash },
      ],
    });

    return NextResponse.json({
      message: `Seeded 3 sample staff. They can log in with their email and password "${DEFAULT_STAFF_PASSWORD}".`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Seed failed" },
      { status: 500 }
    );
  }
}
