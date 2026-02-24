"use client";

import { useEffect, useState, useCallback } from "react";

const DEPARTMENTS = ["CSO", "CSI", "PMO", "CST", "CMT", "Training", "CBA"] as const;

type Staff = { id: string; name: string; email: string; department?: string; createdAt: string };

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPasswordId, setSettingPasswordId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const fetchStaff = useCallback(async () => {
    const res = await fetch("/api/staff");
    if (res.ok) {
      const data = await res.json();
      setStaff(data);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMessage({ type: "err", text: "Name and email are required" });
      return;
    }
    if (!password || password.length < 4) {
      setMessage({ type: "err", text: "Password is required (min 4 characters)" });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, department }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Failed to add staff" });
        return;
      }
      setMessage({ type: "ok", text: `${data.name} has been added. They can log in at /login.` });
      setName("");
      setEmail("");
      setPassword("");
      setDepartment(DEPARTMENTS[0]);
      setStaff((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Seed failed" });
        return;
      }
      setMessage({ type: "ok", text: data.message || "Sample staff added." });
      fetchStaff();
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setSeeding(false);
    }
  };

  const handleSetPassword = async (id: string, staffName: string) => {
    const newPassword = window.prompt(`Set login password for ${staffName} (min 4 characters):`);
    if (newPassword == null || newPassword.length < 4) {
      if (newPassword !== null && newPassword.length > 0) setMessage({ type: "err", text: "Password must be at least 4 characters." });
      return;
    }
    setSettingPasswordId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Failed to set password" });
        return;
      }
      setMessage({ type: "ok", text: `Password set for ${staffName}. They can log in at /login.` });
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setSettingPasswordId(null);
    }
  };

  const handleRemoveStaff = async (id: string, staffName: string) => {
    if (!confirm(`Remove "${staffName}"? Their attendance records will also be deleted.`)) return;
    setDeletingId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setMessage({ type: "err", text: data.error || "Failed to remove staff" });
        return;
      }
      setMessage({ type: "ok", text: `${staffName} has been removed.` });
      setStaff((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage({ type: "err", text: "Network error" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold text-[var(--text)] tracking-tight mb-1">
        Manage staff
      </h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">
        Add new staff or remove staff. Removed staff and their attendance history will be deleted.
      </p>

      {/* Add staff form */}
      <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm p-6 sm:p-8 mb-8">
        <h2 className="font-semibold text-[var(--text)] mb-5">Add new staff</h2>
        <form onSubmit={handleAddStaff} className="space-y-5">
          <div>
            <label htmlFor="admin-name" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Name</label>
            <input
              id="admin-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="admin-email" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Email</label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@trackten.com"
              className="input-base"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 4 characters (for staff login)"
              className="input-base"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="admin-department" className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Department</label>
            <select
              id="admin-department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-base"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <p className={message.type === "ok" ? "text-[var(--success)]" : "text-[var(--error)]"}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-[var(--admin-accent)] hover:bg-[var(--admin-accent-hover)] disabled:opacity-50 transition"
          >
            {loading ? "Adding…" : "Add staff"}
          </button>
        </form>
      </section>

      {/* Staff list */}
      <section className="bg-white rounded-xl border border-[var(--border)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-[var(--text)]">All staff ({staff.length})</h2>
        </div>
        {staff.length === 0 ? (
          <div className="p-6 space-y-3">
            <p className="text-[var(--text-muted)] text-sm">No staff yet. Add someone above or seed sample staff.</p>
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--admin-accent)]/15 text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/25 disabled:opacity-50 transition"
            >
              {seeding ? "Seeding…" : "Seed 3 sample staff (password: password123)"}
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-[var(--text-muted)] font-medium">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id} className="border-t border-[var(--border)] hover:bg-gray-50/50">
                  <td className="px-5 py-3 font-medium text-[var(--text)]">{s.name}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">{s.email}</td>
                  <td className="px-5 py-3 text-[var(--text-muted)]">{s.department ?? "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetPassword(s.id, s.name)}
                        disabled={settingPasswordId === s.id}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--admin-accent)] bg-[var(--admin-accent)]/10 hover:bg-[var(--admin-accent)]/20 disabled:opacity-50 transition"
                      >
                        {settingPasswordId === s.id ? "Saving…" : "Set password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStaff(s.id, s.name)}
                        disabled={deletingId === s.id}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        {deletingId === s.id ? "Removing…" : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
