"use client";

import { useEffect, useState, useCallback } from "react";

type Application = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  createdAt: string;
  staff: { id: string; name: string; email: string; department?: string };
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Update failed" });
        return;
      }
      setMessage({ type: "ok", text: `Application ${status}.` });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? data : a))
      );
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = applications.filter((a) => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--text)] tracking-tight mb-2">Leave & MC applications</h1>
        <p className="text-[var(--text-muted)] text-sm max-w-2xl leading-relaxed">
          Approve or reject staff leave and medical certificate applications.
          {pendingCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-[var(--admin-accent)] ring-1 ring-red-200/80">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>

      {message && (
        <div
          role="status"
          className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-300 ${
            message.type === "ok"
              ? "border-emerald-200/80 bg-emerald-50 text-emerald-800"
              : "border-red-200/80 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6 p-1 rounded-2xl bg-gray-100/90 ring-1 ring-gray-200/80 w-fit max-w-full">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`btn-press px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)] focus-visible:ring-offset-2 ${
              filter === f
                ? "bg-white text-[var(--admin-accent)] shadow-md shadow-black/5 ring-1 ring-gray-200/80"
                : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/60"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <section className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-[var(--text-muted)] text-sm p-6">
            No {filter === "all" ? "" : filter} applications.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-[var(--text-muted)] font-medium">
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Reason</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-red-50/40 transition-colors duration-150">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--text)]">{a.staff.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{a.staff.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={a.type === "mc" ? "text-[var(--admin-accent)] font-medium" : "text-[var(--text-muted)]"}>
                        {a.type === "mc" ? "MC" : "Leave"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {new Date(a.startDate).toLocaleDateString()} – {new Date(a.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)] max-w-[12rem] truncate" title={a.reason ?? undefined}>
                      {a.reason || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          a.status === "approved"
                            ? "bg-[var(--admin-card-green)] text-[var(--admin-card-green-text)]"
                            : a.status === "rejected"
                              ? "bg-[var(--admin-card-red)] text-[var(--admin-card-red-text)]"
                              : "bg-[var(--admin-card-yellow)] text-[var(--admin-card-yellow-text)]"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {a.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => updateStatus(a.id, "approved")}
                            disabled={updatingId === a.id}
                            className="btn-press px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--admin-accent)] text-white shadow-md shadow-red-500/20 hover:brightness-105 disabled:opacity-50 transition-all duration-200"
                          >
                            {updatingId === a.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(a.id, "rejected")}
                            disabled={updatingId === a.id}
                            className="btn-press px-3 py-1.5 rounded-lg text-sm font-semibold bg-red-600 text-white shadow-md shadow-red-900/10 hover:brightness-105 disabled:opacity-50 transition-all duration-200"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={fetchApplications}
              className="group inline-flex items-center gap-2 text-sm font-semibold text-[var(--admin-accent)] rounded-lg px-2 py-1 hover:bg-red-50 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]"
            >
              <svg className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        )}
      </section>
    </>
  );
}
