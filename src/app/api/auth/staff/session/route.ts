import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStaffCookie, getStaffCookieName } from "@/lib/staff-auth";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(getStaffCookieName())?.value;
  const staffId = verifyStaffCookie(cookie);

  if (!staffId) {
    return NextResponse.json({ staff: null }, { status: 200 });
  }

  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { id: true, name: true, email: true, department: true },
  });

  if (!staff) {
    return NextResponse.json({ staff: null }, { status: 200 });
  }

  return NextResponse.json({ staff });
}
