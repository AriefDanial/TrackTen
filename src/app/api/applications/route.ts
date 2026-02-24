import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffIdFromRequest } from "@/lib/staff-session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    const where = staffId ? { staffId } : {};

    const applications = await prisma.application.findMany({
      where,
      include: { staff: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(applications);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const staffId = getStaffIdFromRequest(request);
    if (!staffId) {
      return NextResponse.json(
        { error: "You must be logged in to submit an application" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, startDate, endDate, reason } = body;

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    if (!["leave", "mc"].includes(type)) {
      return NextResponse.json(
        { error: "type must be leave or mc" },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    if (end < start) {
      return NextResponse.json(
        { error: "End date must be on or after start date" },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        staffId, // from session
        type,
        startDate: start,
        endDate: end,
        reason: reason?.trim() || null,
      },
      include: { staff: true },
    });

    return NextResponse.json(application);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}
