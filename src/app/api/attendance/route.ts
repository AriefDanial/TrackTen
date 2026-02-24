import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStaffIdFromRequest } from "@/lib/staff-session";

export async function GET() {
  try {
    const records = await prisma.attendance.findMany({
      include: { staff: true },
      orderBy: { timestamp: "desc" },
      take: 100,
    });
    return NextResponse.json(records);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const staffId = getStaffIdFromRequest(request);
    if (!staffId) {
      return NextResponse.json(
        { error: "You must be logged in to submit attendance" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, latitude, longitude, address } = body;

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    if (!["check_in", "check_out"].includes(type)) {
      return NextResponse.json(
        { error: "type must be check_in or check_out" },
        { status: 400 }
      );
    }

    const record = await prisma.attendance.create({
      data: {
        staffId,
        type,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        address: address ?? null,
      },
      include: { staff: true },
    });

    return NextResponse.json(record);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to submit attendance" },
      { status: 500 }
    );
  }
}
