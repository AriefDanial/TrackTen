"use client";

import { useEffect, useState, useCallback } from "react";

type Staff = { id: string; name: string; email: string; department?: string };
type AttendanceRecord = {
  id: string;
  type: string;
  timestamp: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  staff: Staff;
};
type ApplicationRecord = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  staff: Staff;
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
  const days: (number | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const isToday = (d: number | null) =>
    d !== null && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-[var(--text)] text-sm">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setDate(new Date(year, month - 1))} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button type="button" onClick={() => setDate(new Date(year, month + 1))} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-[var(--text-muted)] font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d}>{d}</div>))}
        {days.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d === null ? <span /> : (
              <span className={`w-7 h-7 flex items-center justify-center rounded-full ${isToday(d) ? "bg-[var(--staff-accent)] text-white font-semibold" : "text-[var(--text)] hover:bg-gray-100 rounded-full"}`}>
                {d}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StaffDashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [liveTime, setLiveTime] = useState("");
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [type, setType] = useState<"check_in" | "check_out">("check_in");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [appType, setAppType] = useState<"leave" | "mc">("leave");
  const [appStartDate, setAppStartDate] = useState("");
  const [appEndDate, setAppEndDate] = useState("");
  const [appReason, setAppReason] = useState("");
  const [appLoading, setAppLoading] = useState(false);
  const [appMessage, setAppMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const tick = () => setLiveTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mounted]);

  const fetchSession = useCallback(async () => {
    const res = await fetch("/api/auth/staff/session");
    if (res.ok) {
      const data = await res.json();
      if (!data.staff) { window.location.href = "/login"; return; }
      setCurrentStaff(data.staff);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    const res = await fetch("/api/attendance");
    if (res.ok) { const data = await res.json(); setAttendance(data); }
  }, []);

  const fetchApplications = useCallback(async () => {
    const res = await fetch("/api/applications");
    if (res.ok) { const data = await res.json(); setApplications(data); }
  }, []);

  useEffect(() => {
    fetchSession();
    fetchAttendance();
    fetchApplications();
  }, [fetchSession, fetchAttendance, fetchApplications]);

  const getCurrentLocation = useCallback((): Promise<{ lat: number; lng: number; address: string | null } | null> => {
    if (!navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude, lng = pos.coords.longitude;
          let address: string | null = null;
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, { headers: { "User-Agent": "TrackTen-Attendance/1.0" } });
            const d = await r.json();
            address = d.display_name || null;
          } catch { address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`; }
          resolve({ lat, lng, address });
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  const submitAttendance = async () => {
    if (!currentStaff) { setMessage({ type: "err", text: "Session expired. Please log in again." }); return; }
    setLoading(true);
    setMessage(null);
    try {
      const location = await getCurrentLocation();
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, latitude: location?.lat ?? null, longitude: location?.lng ?? null, address: location?.address ?? null }),
      });
      const data = await res.json();
      if (!res.ok) { setMessage({ type: "err", text: data.error || "Submit failed" }); return; }
      setMessage({ type: "ok", text: `${type === "check_in" ? "Check-in" : "Check-out"} recorded${location ? " (location captured)" : " (location unavailable)"}` });
      setAttendance((prev) => [data, ...prev]);
    } catch { setMessage({ type: "err", text: "Network error" }); }
    finally { setLoading(false); }
  };

  const submitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStaff) { setAppMessage({ type: "err", text: "Session expired. Please log in again." }); return; }
    if (!appStartDate || !appEndDate) { setAppMessage({ type: "err", text: "Please select start and end date" }); return; }
    setAppLoading(true);
    setAppMessage(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: appType, startDate: appStartDate, endDate: appEndDate, reason: appReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setAppMessage({ type: "err", text: data.error || "Submit failed" }); return; }
      setAppMessage({ type: "ok", text: `${appType === "mc" ? "MC" : "Leave"} application submitted.` });
      setAppStartDate("");
      setAppEndDate("");
      setAppReason("");
      setApplications((prev) => [data, ...prev]);
    } catch { setAppMessage({ type: "err", text: "Network error" }); }
    finally { setAppLoading(false); }
  };

  const myApplications = currentStaff ? applications.filter((a) => a.staff.id === currentStaff.id) : applications;
  const today = new Date().toDateString();
  const myTodayCount = currentStaff ? attendance.filter((a) => a.staff.id === currentStaff.id && new Date(a.timestamp).toDateString() === today).length : 0;
  const myPendingCount = myApplications.filter((a) => a.status === "pending").length;

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight mb-1">Staff Attendance</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Clock in/out and submit leave or MC. Logged in as {currentStaff ? `${currentStaff.name} (${currentStaff.email})` : "…"}.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live time */}
          <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6 text-center">
            <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest font-medium mb-2">Live time</p>
            <p className="text-3xl font-semibold text-[var(--staff-accent)] tabular-nums tracking-tight">
              {liveTime || "—:—:—"}
            </p>
            <p className="text-[var(--text-muted)] text-sm mt-2 font-medium" suppressHydrationWarning>
              {mounted ? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "\u00A0"}
            </p>
          </section>

          {/* Record attendance */}
          <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="font-semibold text-[var(--text)] mb-4">Record attendance</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Type</p>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text)] text-sm">
                    <input type="radio" name="type" checked={type === "check_in"} onChange={() => setType("check_in")} className="accent-[var(--staff-accent)] w-4 h-4" />
                    Check in
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text)] text-sm">
                    <input type="radio" name="type" checked={type === "check_out"} onChange={() => setType("check_out")} className="accent-[var(--staff-accent)] w-4 h-4" />
                    Check out
                  </label>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-sm">Your location will be captured when you submit.</p>
              {message && <p className={`text-sm font-medium ${message.type === "ok" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{message.text}</p>}
              <button onClick={submitAttendance} disabled={loading} className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--staff-accent)] hover:bg-[var(--staff-accent-hover)] disabled:opacity-50 transition">
                {loading ? "Getting location & submitting…" : "Submit attendance"}
              </button>
            </div>
          </section>

          {/* Recent attendance */}
          <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text)]">Recent attendance</h2>
              <button type="button" onClick={fetchAttendance} className="text-sm font-medium text-[var(--staff-accent)] hover:underline">Refresh</button>
            </div>
            <div className="overflow-x-auto max-h-64">
              {attendance.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm p-5">No records yet.</p>
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
                    {attendance.slice(0, 15).map((r) => (
                      <tr key={r.id} className="border-t border-[var(--border)] hover:bg-gray-50/50">
                        <td className="px-5 py-3"><p className="font-medium text-[var(--text)]">{r.staff.name}</p><p className="text-xs text-[var(--text-muted)]">{r.staff.email}</p></td>
                        <td className="px-5 py-3 text-[var(--text-muted)]">{new Date(r.timestamp).toLocaleString()}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${r.type === "check_in" ? "bg-[var(--staff-card-green)] text-[var(--staff-card-green-text)]" : "bg-[var(--staff-card-yellow)] text-[var(--staff-card-yellow-text)]"}`}>
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

          {/* Leave / MC */}
          <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6">
            <h2 className="font-semibold text-[var(--text)] mb-1">Leave / MC application</h2>
            <p className="text-[var(--text-muted)] text-sm mb-4">Apply for leave or medical certificate (MC).</p>
            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)] mb-2">Type</p>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text)] text-sm">
                    <input type="radio" name="appType" checked={appType === "leave"} onChange={() => setAppType("leave")} className="accent-[var(--staff-accent)] w-4 h-4" />
                    Leave
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-[var(--text)] text-sm">
                    <input type="radio" name="appType" checked={appType === "mc"} onChange={() => setAppType("mc")} className="accent-[var(--staff-accent)] w-4 h-4" />
                    MC
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="app-start" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Start date</label>
                  <input id="app-start" type="date" value={appStartDate} onChange={(e) => setAppStartDate(e.target.value)} className="input-base" />
                </div>
                <div>
                  <label htmlFor="app-end" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">End date</label>
                  <input id="app-end" type="date" value={appEndDate} onChange={(e) => setAppEndDate(e.target.value)} className="input-base" />
                </div>
              </div>
              <div>
                <label htmlFor="app-reason" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Reason (optional)</label>
                <textarea id="app-reason" value={appReason} onChange={(e) => setAppReason(e.target.value)} placeholder="e.g. Medical appointment" rows={2} className="input-base resize-none" />
              </div>
              {appMessage && <p className={`text-sm font-medium ${appMessage.type === "ok" ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{appMessage.text}</p>}
              <button type="submit" disabled={appLoading} className="w-full py-3 rounded-lg font-semibold text-white bg-[var(--staff-accent)] hover:bg-[var(--staff-accent-hover)] disabled:opacity-50 transition">
                {appLoading ? "Submitting…" : "Submit application"}
              </button>
            </form>
          </section>

          {/* My applications */}
          <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)]">
              <h2 className="font-semibold text-[var(--text)]">My applications</h2>
              <button type="button" onClick={fetchApplications} className="text-sm font-medium text-[var(--staff-accent)] hover:underline">Refresh</button>
            </div>
            <div className="p-5 max-h-64 overflow-y-auto">
              {myApplications.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No applications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myApplications.map((a) => (
                    <li key={a.id} className="p-3 rounded-lg border border-[var(--border)] bg-gray-50/50">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-[var(--text)] text-sm">{a.type === "mc" ? "MC" : "Leave"}</p>
                          <p className="text-xs text-[var(--text-muted)]">{new Date(a.startDate).toLocaleDateString()} – {new Date(a.endDate).toLocaleDateString()}</p>
                          {a.reason && <p className="text-xs text-[var(--text-muted)] mt-1">{a.reason}</p>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.status === "approved" ? "bg-[var(--staff-card-green)] text-[var(--staff-card-green-text)]" : a.status === "rejected" ? "bg-[var(--staff-card-red)] text-[var(--staff-card-red-text)]" : "bg-[var(--staff-card-yellow)] text-[var(--staff-card-yellow-text)]"}`}>{a.status}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">Submitted {new Date(a.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <MiniCalendar />
          <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--staff-card-green)] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--staff-card-green-text)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--staff-card-green-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--staff-card-green-text)]">{myTodayCount}</p>
              <p className="text-sm font-medium text-[var(--staff-card-green-text)]/80">My records today</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border)] bg-[var(--staff-card-yellow)] shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--staff-card-yellow-text)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--staff-card-yellow-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--staff-card-yellow-text)]">{myPendingCount}</p>
              <p className="text-sm font-medium text-[var(--staff-card-yellow-text)]/80">Pending applications</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
