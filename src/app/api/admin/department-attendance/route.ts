import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated, getAdminCookieName } from "@/lib/admin-auth";

const DEPARTMENTS = ["CSO", "CSI", "PMO", "CST", "CMT", "Training", "CBA"] as const;

function getAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "admin123";
  return "";
}

export async function GET(request: Request) {
  const password = getAdminPassword();
  const cookieName = getAdminCookieName();
  const cookieValue = request.headers.get("cookie")?.split(";").find((c) => c.trim().startsWith(`${cookieName}=`))?.split("=")[1]?.trim();
  if (!isAdminAuthenticated(cookieValue, password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const staffByDept = await prisma.staff.groupBy({
      by: ["department"],
      _count: { id: true },
      where: { department: { in: [...DEPARTMENTS] } },
    });

    const staffWhoAttendedToday = await prisma.attendance.findMany({
      where: {
        timestamp: { gte: startOfToday, lt: endOfToday },
        type: "check_in",
      },
      distinct: ["staffId"],
      select: { staffId: true },
    });
    const presentStaffIds = new Set(staffWhoAttendedToday.map((a) => a.staffId));

    const staffWithDept = await prisma.staff.findMany({
      where: { id: { in: [...presentStaffIds] } },
      select: { id: true, department: true },
    });
    const presentByDept = new Map<string, number>();
    for (const s of staffWithDept) {
      presentByDept.set(s.department, (presentByDept.get(s.department) ?? 0) + 1);
    }

    const result = DEPARTMENTS.map((department) => {
      const total = staffByDept.find((x) => x.department === department)?._count.id ?? 0;
      const present = presentByDept.get(department) ?? 0;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return { department, total, present, percentage };
    }).filter((row) => row.total > 0);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch department attendance" },
      { status: 500 }
    );
  }
}
