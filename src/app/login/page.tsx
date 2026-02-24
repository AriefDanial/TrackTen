"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type LoginMode = "staff" | "admin";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<LoginMode>("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "admin") setMode("admin");
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("registered") === "1") setRegisteredNotice(true);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "staff") {
        const res = await fetch("/api/auth/staff/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Login failed");
          return;
        }
        router.push("/");
      } else {
        const from = searchParams.get("from") || "/admin";
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
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[22rem]">
        <h1
          className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-on-red)] text-center"
          style={{ letterSpacing: "-0.03em" }}
        >
          TrackTen
        </h1>
        <p className="text-[var(--text-on-red-muted)] text-[0.8125rem] font-medium text-center mt-1.5 mb-8">
          Staff attendance & leave
        </p>

        {/* Staff / Admin toggle */}
        <div className="flex rounded-lg border border-[var(--border)] bg-white/5 p-0.5 mb-6">
          <button
            type="button"
            onClick={() => setMode("staff")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
              mode === "staff"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-on-red-muted)] hover:text-white"
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 py-2.5 rounded-md text-sm font-medium transition ${
              mode === "admin"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-on-red-muted)] hover:text-white"
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
          <h2 className="heading-section mb-5 flex items-center gap-3">
            <span className="w-1 h-5 bg-[var(--accent)] rounded-full" />
            {mode === "staff" ? "Staff login" : "Admin login"}
          </h2>
          <p className="text-[var(--text-muted)] text-[0.8125rem] mb-5">
            {mode === "staff"
              ? "Sign in with your work email and password to clock in/out and submit leave or MC."
              : "Enter the admin password to manage staff and applications."}
          </p>
          {registeredNotice && mode === "staff" && (
            <p className="text-[var(--success)] text-[0.8125rem] mb-5 font-medium">
              Account created. Sign in below.
            </p>
          )}
          <div className="space-y-5">
            {mode === "staff" && (
              <div>
                <label htmlFor="staff-email" className="label block mb-1.5 text-[var(--text)]">
                  Email
                </label>
                <input
                  id="staff-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  className="input-base"
                />
              </div>
            )}
            <div>
              <label htmlFor="login-password" className="label block mb-1.5 text-[var(--text)]">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "admin" ? "Admin password" : "Password"}
                autoComplete={mode === "staff" ? "current-password" : "off"}
                className="input-base"
              />
            </div>
            {error && (
              <p className="text-[0.8125rem] font-medium text-[var(--error)]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        {mode === "staff" ? (
          <p className="text-center text-[var(--text-on-red-muted)] text-[0.8125rem] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-white font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        ) : (
          <p className="text-center text-[var(--text-on-red-muted)] text-[0.8125rem] mt-6">
            Staff?{" "}
            <Link href="/login" className="text-white font-semibold hover:underline">
              Log in as staff
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
