"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type LoginMode = "staff" | "admin";

function LoginForm() {
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
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-white/[0.08] blur-3xl motion-safe:animate-fade-in-slow" />
        <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/4 translate-y-1/4 rounded-full bg-black/10 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-64 w-64 -translate-x-1/2 rounded-full bg-red-900/20 blur-3xl" />
      </div>
      <div className="w-full max-w-[22rem] motion-safe:animate-fade-in">
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
        <div className="flex rounded-xl border border-white/10 bg-black/10 p-1 mb-6 shadow-inner backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setMode("staff")}
            className={`btn-press flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mode === "staff"
                ? "bg-[var(--accent)] text-white shadow-md shadow-black/20"
                : "text-[var(--text-on-red-muted)] hover:text-white hover:bg-white/5"
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`btn-press flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              mode === "admin"
                ? "bg-[var(--accent)] text-white shadow-md shadow-black/20"
                : "text-[var(--text-on-red-muted)] hover:text-white hover:bg-white/5"
            }`}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 ring-1 ring-white/10">
          <h2 className="heading-section mb-5 flex items-center gap-3">
            <span className="w-1 h-5 bg-[var(--accent)] rounded-full" />
            {mode === "staff" ? "Staff login" : "Admin login"}
          </h2>
          <p className="text-[var(--text-muted)] text-[0.8125rem] mb-5">
            {mode === "staff"
              ? "Sign in with the email and password your administrator gave you to clock in/out and submit leave or MC."
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
              className="btn-primary btn-press w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 shadow-lg shadow-black/10"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </form>

        {mode === "admin" && (
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

function LoginFallback() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-[22rem]">
        <h1 className="text-[1.75rem] font-semibold tracking-tight text-[var(--text-on-red)] text-center" style={{ letterSpacing: "-0.03em" }}>
          TrackTen
        </h1>
        <p className="text-[var(--text-on-red-muted)] text-[0.8125rem] font-medium text-center mt-1.5 mb-8">
          Staff attendance & leave
        </p>
        <div className="card p-6 sm:p-8 text-center text-[var(--text-muted)] text-sm">
          Loading…
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
