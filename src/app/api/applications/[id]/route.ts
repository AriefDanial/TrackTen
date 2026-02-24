import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Application id is required" },
        { status: 400 }
      );
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be approved or rejected" },
        { status: 400 }
      );
    }

    const application = await prisma.application.update({
      where: { id },
      data: { status },
      include: { staff: true },
    });

    return NextResponse.json(application);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
