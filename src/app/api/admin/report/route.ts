import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated, getAdminCookieName } from "@/lib/admin-auth";
import { buildReportPdf } from "@/lib/report-pdf";

export const runtime = "nodejs";

function getAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (process.env.NODE_ENV !== "production") return "admin123";
  return "";
}

function parseCookie(request: Request): string | undefined {
  const cookieName = getAdminCookieName();
  return request.headers
    .get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith(`${cookieName}=`))
    ?.split("=")[1]
    ?.trim();
}

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toIsoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { from: toIsoDay(start), to: toIsoDay(now) };
}

export async function GET(request: Request) {
  const password = getAdminPassword();
  const cookieValue = parseCookie(request);
  if (!isAdminAuthenticated(cookieValue, password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "json";
  const defaults = defaultRange();
  const fromStr = searchParams.get("from") ?? defaults.from;
  const toStr = searchParams.get("to") ?? defaults.to;

  const start = new Date(`${fromStr}T00:00:00.000Z`);
  const end = new Date(`${toStr}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid from or to date (use YYYY-MM-DD)" }, { status: 400 });
  }
  if (start > end) {
    return NextResponse.json({ error: "from must be on or before to" }, { status: 400 });
  }

  try {
    const [staffCount, attendance, applications] = await Promise.all([
      prisma.staff.count(),
      prisma.attendance.findMany({
        where: { timestamp: { gte: start, lte: end } },
        include: { staff: true },
        orderBy: { timestamp: "desc" },
      }),
      prisma.application.findMany({
        where: {
          AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }],
        },
        include: { staff: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const generatedAt = new Date().toISOString();

    if (format === "pdf") {
      const pdf = await buildReportPdf({
        fromStr,
        toStr,
        generatedAt,
        staffCount,
        attendance,
        applications,
      });
      const filename = `trackten-report_${fromStr}_${toStr}.pdf`;
      return new NextResponse(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "csv") {
      const lines: string[] = [];
      lines.push(`${csvEscape("Key")},${csvEscape("Value")}`);
      lines.push(`${csvEscape("Report period")},${csvEscape(`${fromStr} to ${toStr}`)}`);
      lines.push(`${csvEscape("Generated at (UTC)")},${csvEscape(generatedAt)}`);
      lines.push(`${csvEscape("Total staff (all time)")},${csvEscape(staffCount)}`);
      lines.push(`${csvEscape("Attendance records (in range)")},${csvEscape(attendance.length)}`);
      lines.push(`${csvEscape("Leave / MC applications (overlapping range)")},${csvEscape(applications.length)}`);
      lines.push("");
      lines.push("ATTENDANCE");
      lines.push(
        [
          "Date (UTC)",
          "Staff name",
          "Email",
          "Department",
          "Type",
          "Timestamp (UTC)",
          "Latitude",
          "Longitude",
          "Address",
        ]
          .map(csvEscape)
          .join(",")
      );
      for (const a of attendance) {
        const ts = a.timestamp.toISOString();
        const day = ts.slice(0, 10);
        lines.push(
          [
            day,
            a.staff.name,
            a.staff.email,
            a.staff.department,
            a.type,
            ts,
            a.latitude ?? "",
            a.longitude ?? "",
            a.address ?? "",
          ]
            .map(csvEscape)
            .join(",")
        );
      }
      lines.push("");
      lines.push("APPLICATIONS");
      lines.push(
        [
          "Staff name",
          "Email",
          "Department",
          "Type",
          "Start date (UTC)",
          "End date (UTC)",
          "Status",
          "Reason",
          "Created at (UTC)",
        ]
          .map(csvEscape)
          .join(",")
      );
      for (const app of applications) {
        lines.push(
          [
            app.staff.name,
            app.staff.email,
            app.staff.department,
            app.type,
            app.startDate.toISOString(),
            app.endDate.toISOString(),
            app.status,
            app.reason ?? "",
            app.createdAt.toISOString(),
          ]
            .map(csvEscape)
            .join(",")
        );
      }

      const body = "\ufeff" + lines.join("\r\n");
      const filename = `trackten-report_${fromStr}_${toStr}.csv`;
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({
      summary: {
        generatedAt,
        from: fromStr,
        to: toStr,
        staffCount,
        attendanceRecords: attendance.length,
        applicationsOverlapping: applications.length,
      },
      attendance: attendance.map((a) => ({
        id: a.id,
        type: a.type,
        timestamp: a.timestamp.toISOString(),
        latitude: a.latitude,
        longitude: a.longitude,
        address: a.address,
        staff: {
          name: a.staff.name,
          email: a.staff.email,
          department: a.staff.department,
        },
      })),
      applications: applications.map((app) => ({
        id: app.id,
        type: app.type,
        startDate: app.startDate.toISOString(),
        endDate: app.endDate.toISOString(),
        status: app.status,
        reason: app.reason,
        createdAt: app.createdAt.toISOString(),
        staff: {
          name: app.staff.name,
          email: app.staff.email,
          department: app.staff.department,
        },
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to build report" }, { status: 500 });
  }
}
