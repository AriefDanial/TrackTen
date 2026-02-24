"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type AttendanceRecord = {
  id: string;
  type: string;
  timestamp: string;
  staff: { name: string; email: string };
};
type ApplicationRecord = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  staff: { name: string };
};
type DepartmentAttendance = {
  department: string;
  total: number;
  present: number;
  percentage: number;
};

function MiniCalendar() {
  const [date, setDate] = useState(() => new Date());
  const today = new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const days = Array.from({ length: startPad }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const isToday = (d: number | null) =>
    d !== null && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-[var(--text)] text-sm">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setDate(new Date(year, month - 1))}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setDate(new Date(year, month + 1))}
            className="p-1 rounded hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-[var(--text-muted)] font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d === null ? (
              <span />
            ) : (
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full ${
                  isToday(d)
                    ? "bg-[var(--admin-accent)] text-white font-semibold"
                    : "text-[var(--text)] hover:bg-gray-100 rounded-full"
                }`}
              >
                {d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [staffCount, setStaffCount] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [departmentAttendance, setDepartmentAttendance] = useState<DepartmentAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, attRes, appRes, deptRes] = await Promise.all([
        fetch("/api/staff"),
        fetch("/api/attendance"),
        fetch("/api/applications"),
        fetch("/api/admin/department-attendance"),
      ]);
      if (staffRes.ok) {
        const staffList = await staffRes.json();
        setStaffCount(staffList.length);
      }
      if (attRes.ok) {
        const attList = await attRes.json();
        setAttendance(attList);
      }
      if (appRes.ok) {
        const appList = await appRes.json();
        setApplications(appList);
      }
      if (deptRes.ok) {
        const deptList = await deptRes.json();
        setDepartmentAttendance(deptList);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const today = new Date().toDateString();
  const todayCount = attendance.filter(
    (a) => new Date(a.timestamp).toDateString() === today
  ).length;
  const pendingApps = applications.filter((a) => a.status === "pending");
  const pendingCount = pendingApps.length;
  const recentAttendance = attendance.slice(0, 10);
  const recentPending = pendingApps.slice(0, 5);

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight mb-1">
        Staff Attendance
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Overview of staff, attendance, and leave/MC applications.
      </p>

      {loading ? (
        <p className="text-[var(--text-muted)] text-sm font-medium">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / center: tables */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent attendance table */}
            <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text)]">Recent attendance</h2>
                <Link
                  href="/"
                  className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
                >
                  View attendance
                </Link>
              </div>
              <div className="overflow-x-auto">
                {recentAttendance.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm px-5 py-6">No attendance records yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-[var(--text-muted)] font-medium">
                        <th className="px-5 py-3">Staff</th>
                        <th className="px-5 py-3">Time</th>
                        <th className="px-5 py-3">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAttendance.map((r) => (
                        <tr key={r.id} className="border-t border-[var(--border)] hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <p className="font-medium text-[var(--text)]">{r.staff.name}</p>
                            <p className="text-xs text-[var(--text-muted)]">{r.staff.email}</p>
                          </td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">
                            {new Date(r.timestamp).toLocaleString()}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                r.type === "check_in"
                                  ? "bg-[var(--admin-card-green)] text-[var(--admin-card-green-text)]"
                                  : "bg-[var(--admin-card-yellow)] text-[var(--admin-card-yellow-text)]"
                              }`}
                            >
                              {r.type === "check_in" ? "Check in" : "Check out"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Department attendance today */}
            {departmentAttendance.length > 0 && (
              <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)]">
                  <h2 className="font-semibold text-[var(--text)]">Department attendance today</h2>
                  <p className="text-[var(--text-muted)] text-xs mt-0.5">% of staff who clocked in per department</p>
                </div>
                <div className="p-5">
                  <ul className="space-y-3">
                    {departmentAttendance.map((row) => (
                      <li key={row.department} className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text)] text-sm">{row.department}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {row.present} / {row.total} staff
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--admin-accent)] transition-all"
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-[var(--text)] w-10 text-right">
                            {row.percentage}%
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Pending applications */}
            <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
              <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text)]">Pending Leave / MC</h2>
                <Link
                  href="/admin/applications"
                  className="text-sm font-medium text-[var(--admin-accent)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="overflow-x-auto">
                {recentPending.length === 0 ? (
                  <p className="text-[var(--text-muted)] text-sm px-5 py-6">No pending applications.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-[var(--text-muted)] font-medium">
                        <th className="px-5 py-3">Staff</th>
                        <th className="px-5 py-3">Type</th>
                        <th className="px-5 py-3">Dates</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPending.map((a) => (
                        <tr key={a.id} className="border-t border-[var(--border)] hover:bg-gray-50/50">
                          <td className="px-5 py-3 font-medium text-[var(--text)]">{a.staff.name}</td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">
                            {a.type === "mc" ? "MC" : "Leave"}
                          </td>
                          <td className="px-5 py-3 text-[var(--text-muted)]">
                            {new Date(a.startDate).toLocaleDateString()} – {new Date(a.endDate).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3">
                            <Link href="/admin/applications" className="text-[var(--admin-accent)] font-medium text-sm hover:underline">
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          {/* Right: calendar + summary cards */}
          <div className="space-y-4">
            <MiniCalendar />
            <Link
              href="/admin/staff"
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--admin-card-yellow)] shadow-sm hover:shadow transition"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--admin-card-yellow-text)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--admin-card-yellow-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--admin-card-yellow-text)]">
                  {staffCount ?? "—"}
                </p>
                <p className="text-sm font-medium text-[var(--admin-card-yellow-text)]/80">Total Staff</p>
              </div>
            </Link>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--admin-card-green)] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[var(--admin-card-green-text)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--admin-card-green-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--admin-card-green-text)]">{todayCount}</p>
                <p className="text-sm font-medium text-[var(--admin-card-green-text)]/80">Present Today</p>
              </div>
            </div>
            <Link
              href="/admin/applications"
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--admin-card-red)] shadow-sm hover:shadow transition"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--admin-card-red-text)]/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-[var(--admin-card-red-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[var(--admin-card-red-text)]">{pendingCount}</p>
                <p className="text-sm font-medium text-[var(--admin-card-red-text)]/80">Pending Today</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
