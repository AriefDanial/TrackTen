import { NextRequest } from "next/server";
import { verifyStaffCookie, getStaffCookieName } from "@/lib/staff-auth";

export function getStaffIdFromRequest(request: NextRequest): string | null {
  const cookie = request.cookies.get(getStaffCookieName())?.value;
  return verifyStaffCookie(cookie);
}
