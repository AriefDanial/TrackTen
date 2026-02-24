import { NextResponse } from "next/server";
import { getStaffCookieName } from "@/lib/staff-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(getStaffCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
