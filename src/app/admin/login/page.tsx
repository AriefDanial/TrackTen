"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      router.push(from);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[22rem] mx-auto">
      <h1 className="heading-page mb-1.5 flex items-center gap-3">
        <span className="w-1 h-7 bg-white rounded-full" />
        Admin login
      </h1>
      <p className="text-[var(--text-on-red-muted)] text-[0.8125rem] mb-6 font-medium">
        Enter the admin password to manage staff and applications.
      </p>
      <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
        <label htmlFor="admin-password" className="label block mb-1.5 text-[var(--text)]">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          autoFocus
          className="input-base"
        />
        {error && (
          <p className="mt-2 text-[0.8125rem] font-medium text-[var(--error)]">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-5 w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
