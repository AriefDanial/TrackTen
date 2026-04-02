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
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-[var(--text)] text-sm">
          {date.toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setDate(new Date(year, month - 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)]"
            aria-label="Previous month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            type="button"
            onClick={() => setDate(new Date(year, month + 1))}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)]"
            aria-label="Next month"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-xs text-[var(--text-muted)] font-medium">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (<div key={d}>{d}</div>))}
        {days.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d === null ? <span /> : (
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm transition-all duration-200 ${
                  isToday(d)
                    ? "bg-[var(--staff-accent)] text-white font-semibold shadow-md shadow-red-500/30 scale-105"
                    : "text-[var(--text)] hover:bg-gray-100 hover:scale-110 active:scale-95"
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight mb-2">Staff Attendance</h1>
        <p className="text-[var(--text-muted)] text-sm max-w-2xl leading-relaxed">
          Clock in/out and submit leave or MC.{" "}
          <span className="text-[var(--text)] font-medium">
            {currentStaff ? `${currentStaff.name}` : "…"}
          </span>
          {currentStaff && <span className="text-[var(--text-muted)]"> · {currentStaff.email}</span>}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live time */}
          <section className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-white to-gray-50/80 p-8 text-center shadow-sm ring-1 ring-gray-200/60 transition-shadow duration-300 hover:shadow-accent-glow">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.06),transparent_55%)] pointer-events-none" aria-hidden />
            <p className="relative text-[var(--text-muted)] text-xs uppercase tracking-[0.2em] font-semibold mb-3">Live time</p>
            <p className="relative text-4xl sm:text-5xl font-bold text-[var(--staff-accent)] tabular-nums tracking-tight drop-shadow-sm">
              {liveTime || "—:—:—"}
            </p>
            <p className="relative text-[var(--text-muted)] text-sm mt-3 font-medium" suppressHydrationWarning>
              {mounted ? new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "\u00A0"}
            </p>
          </section>

          {/* Record attendance */}
          <section className="surface-card p-6 sm:p-8">
            <h2 className="font-semibold text-[var(--text)] text-lg mb-5">Record attendance</h2>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Type</p>
                <div className="inline-flex p-1 rounded-xl bg-gray-100/90 ring-1 ring-gray-200/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setType("check_in")}
                    className={`relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)] focus-visible:ring-offset-2 ${
                      type === "check_in"
                        ? "bg-white text-[var(--staff-accent)] shadow-md shadow-black/5 ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-[var(--text)]"
                    }`}
                  >
                    Check in
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("check_out")}
                    className={`relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)] focus-visible:ring-offset-2 ${
                      type === "check_out"
                        ? "bg-white text-[var(--staff-accent)] shadow-md shadow-black/5 ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-[var(--text)]"
                    }`}
                  >
                    Check out
                  </button>
                </div>
              </div>
              <p className="text-[var(--text-muted)] text-sm flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-bold">i</span>
                Your location will be captured when you submit.
              </p>
              {message && (
                <div
                  role="status"
                  className={`rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-300 ${
                    message.type === "ok"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                      : "bg-red-50 text-red-800 border-red-200/80"
                  }`}
                >
                  {message.text}
                </div>
              )}
              <button
                type="button"
                onClick={submitAttendance}
                disabled={loading}
                className="btn-press w-full py-3.5 rounded-xl font-semibold text-white bg-[var(--staff-accent)] hover:bg-[var(--staff-accent-hover)] disabled:opacity-50 shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200"
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin motion-reduce:animate-none" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Getting location…
                  </span>
                ) : (
                  "Submit attendance"
                )}
              </button>
            </div>
          </section>

          {/* Recent attendance */}
          <section className="surface-card overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-gray-50/50">
              <h2 className="font-semibold text-[var(--text)]">Recent attendance</h2>
              <button
                type="button"
                onClick={fetchAttendance}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--staff-accent)] rounded-lg px-2 py-1 -mr-2 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)]"
              >
                <svg
                  className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180 group-active:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
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
                      <tr key={r.id} className="border-t border-[var(--border)] hover:bg-red-50/40 transition-colors duration-150">
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
          <section className="surface-card p-6 sm:p-8">
            <h2 className="font-semibold text-[var(--text)] text-lg mb-1">Leave / MC application</h2>
            <p className="text-[var(--text-muted)] text-sm mb-6">Apply for leave or medical certificate (MC).</p>
            <form onSubmit={submitApplication} className="space-y-5">
              <div>
                <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Type</p>
                <div className="inline-flex p-1 rounded-xl bg-gray-100/90 ring-1 ring-gray-200/80 gap-1">
                  <button
                    type="button"
                    onClick={() => setAppType("leave")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)] focus-visible:ring-offset-2 ${
                      appType === "leave"
                        ? "bg-white text-[var(--staff-accent)] shadow-md shadow-black/5 ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-[var(--text)]"
                    }`}
                  >
                    Leave
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppType("mc")}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)] focus-visible:ring-offset-2 ${
                      appType === "mc"
                        ? "bg-white text-[var(--staff-accent)] shadow-md shadow-black/5 ring-1 ring-gray-200/80"
                        : "text-gray-600 hover:text-[var(--text)]"
                    }`}
                  >
                    MC
                  </button>
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
              {appMessage && (
                <div
                  role="status"
                  className={`rounded-xl px-4 py-3 text-sm font-medium border transition-all duration-300 ${
                    appMessage.type === "ok"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                      : "bg-red-50 text-red-800 border-red-200/80"
                  }`}
                >
                  {appMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={appLoading}
                className="btn-press w-full py-3.5 rounded-xl font-semibold text-white bg-[var(--staff-accent)] hover:bg-[var(--staff-accent-hover)] disabled:opacity-50 shadow-lg shadow-red-500/15 hover:shadow-xl transition-all duration-200"
              >
                {appLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin motion-reduce:animate-none" fill="none" viewBox="0 0 24 24" aria-hidden>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting…
                  </span>
                ) : (
                  "Submit application"
                )}
              </button>
            </form>
          </section>

          {/* My applications */}
          <section className="surface-card overflow-hidden">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[var(--border)] bg-gray-50/50">
              <h2 className="font-semibold text-[var(--text)]">My applications</h2>
              <button
                type="button"
                onClick={fetchApplications}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--staff-accent)] rounded-lg px-2 py-1 -mr-2 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--staff-accent)]"
              >
                <svg className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            <div className="p-5 max-h-64 overflow-y-auto">
              {myApplications.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No applications yet.</p>
              ) : (
                <ul className="space-y-3">
                  {myApplications.map((a) => (
                    <li
                      key={a.id}
                      className="p-4 rounded-xl border border-[var(--border)] bg-gray-50/50 hover:bg-white hover:border-gray-300/80 hover:shadow-md transition-all duration-200"
                    >
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
          <div className="group flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--staff-card-green)] shadow-sm transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5">
            <div className="w-10 h-10 rounded-lg bg-[var(--staff-card-green-text)]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--staff-card-green-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-[var(--staff-card-green-text)]">{myTodayCount}</p>
              <p className="text-sm font-medium text-[var(--staff-card-green-text)]/80">My records today</p>
            </div>
          </div>
          <div className="group flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--staff-card-yellow)] shadow-sm transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5">
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
