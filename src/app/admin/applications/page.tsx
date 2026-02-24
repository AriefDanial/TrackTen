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
      <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight mb-1">
        Leave & MC applications
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Approve or reject staff leave and medical certificate applications.
        {pendingCount > 0 && (
          <span className="ml-1 font-semibold text-[var(--admin-accent)]">{pendingCount} pending</span>
        )}
      </p>

      {message && (
        <p
          className={`mb-4 text-sm ${
            message.type === "ok" ? "text-[var(--success)]" : "text-[var(--error)]"
          }`}
        >
          {message.text}
        </p>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === f
                ? "bg-[var(--admin-accent)] text-white"
                : "bg-white border border-[var(--border)] text-[var(--text-muted)] hover:bg-gray-50"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        {loading ? (
          <p className="text-[var(--text-muted)] text-sm p-6">Loading…</p>
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
                  <tr key={a.id} className="border-t border-[var(--border)] hover:bg-gray-50/50">
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
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--admin-accent)] text-white hover:opacity-90 disabled:opacity-50 transition"
                          >
                            {updatingId === a.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateStatus(a.id, "rejected")}
                            disabled={updatingId === a.id}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:opacity-90 disabled:opacity-50 transition"
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
              className="text-sm text-[var(--admin-accent)] font-medium hover:underline"
            >
              Refresh
            </button>
          </div>
        )}
      </section>
    </>
  );
}
