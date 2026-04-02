"use client";

import { useCallback, useEffect, useState } from "react";

type ReportJson = {
  summary: {
    generatedAt: string;
    from: string;
    to: string;
    staffCount: number;
    attendanceRecords: number;
    applicationsOverlapping: number;
  };
  attendance: Array<{
    id: string;
    type: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    staff: { name: string; email: string; department: string };
  }>;
  applications: Array<{
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string | null;
    createdAt: string;
    staff: { name: string; email: string; department: string };
  }>;
};

function defaultDates() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(d)}` };
}

export default function AdminReportPage() {
  const [from, setFrom] = useState(() => defaultDates().from);
  const [to, setTo] = useState(() => defaultDates().to);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReportJson | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({ from, to, format: "json" });
      const res = await fetch(`/api/admin/report?${q}`, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError((j as { error?: string }).error ?? `Request failed (${res.status})`);
        setData(null);
        return;
      }
      setData((await res.json()) as ReportJson);
    } catch {
      setError("Could not load report.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    loadPreview();
    // Initial preview only; user changes dates and uses Refresh or Download
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const downloadCsv = () => {
    const q = new URLSearchParams({ from, to, format: "csv" });
    window.location.href = `/api/admin/report?${q}`;
  };

  return (
    <>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight mb-2">Reports</h1>
        <p className="text-[var(--text-muted)] text-sm leading-relaxed">
          Choose a date range and download a CSV summary of attendance and leave/MC applications, or preview counts below.
        </p>
      </div>

      <section className="surface-card p-5 sm:p-6 mb-6 max-w-3xl">
        <h2 className="font-semibold text-[var(--text)] mb-4">Date range</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="report-from" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              From
            </label>
            <input
              id="report-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="report-to" className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              To
            </label>
            <input
              id="report-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text)] focus:ring-2 focus:ring-[var(--admin-accent)] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => loadPreview()}
            disabled={loading}
            className="btn-press rounded-xl bg-gray-100 text-[var(--text)] px-4 py-2.5 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin motion-reduce:animate-none" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading…
              </span>
            ) : (
              "Refresh preview"
            )}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="btn-press rounded-xl bg-[var(--admin-accent)] text-white px-4 py-2.5 text-sm font-semibold shadow-lg shadow-red-500/25 hover:brightness-105 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)] focus-visible:ring-offset-2"
          >
            Download CSV
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </section>

      {data && !error && (
        <section className="surface-card overflow-hidden max-w-3xl">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h2 className="font-semibold text-[var(--text)]">Summary</h2>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              Generated {new Date(data.summary.generatedAt).toLocaleString()} (browser local time)
            </p>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 text-sm">
            <div>
              <dt className="text-[var(--text-muted)]">Total staff</dt>
              <dd className="font-semibold text-[var(--text)] text-lg">{data.summary.staffCount}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Attendance records in range</dt>
              <dd className="font-semibold text-[var(--text)] text-lg">{data.summary.attendanceRecords}</dd>
            </div>
            <div>
              <dt className="text-[var(--text-muted)]">Leave / MC (overlapping range)</dt>
              <dd className="font-semibold text-[var(--text)] text-lg">{data.summary.applicationsOverlapping}</dd>
            </div>
          </dl>
        </section>
      )}
    </>
  );
}
