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

  const downloadPdf = () => {
    const q = new URLSearchParams({ from, to, format: "pdf" });
    window.location.href = `/api/admin/report?${q}`;
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight mb-1">Reports</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Choose a date range and download a CSV or PDF summary of attendance and leave/MC applications, or preview counts below.
      </p>

      <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-5 mb-6 max-w-3xl">
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
            className="rounded-lg bg-gray-100 text-[var(--text)] px-4 py-2 text-sm font-medium hover:bg-gray-200 disabled:opacity-60"
          >
            {loading ? "Loading…" : "Refresh preview"}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-lg bg-[var(--admin-accent)] text-white px-4 py-2 text-sm font-medium hover:opacity-95"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            className="rounded-lg border border-[var(--admin-accent)] text-[var(--admin-accent)] px-4 py-2 text-sm font-medium hover:bg-[var(--admin-accent)]/10"
          >
            Download PDF
          </button>
        </div>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </section>

      {data && !error && (
        <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden max-w-3xl">
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
