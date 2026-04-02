"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEPARTMENTS = ["CSO", "CSI", "PMO", "CST", "CMT", "Training", "CBA"] as const;

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          department,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/login?registered=1");
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
          Create your staff account
        </p>
        <form onSubmit={handleSubmit} className="card p-6 sm:p-8 ring-1 ring-white/10">
          <h2 className="heading-section mb-5 flex items-center gap-3">
            <span className="w-1 h-5 bg-[var(--accent)] rounded-full" />
            Register
          </h2>
          <p className="text-[var(--text-muted)] text-[0.8125rem] mb-5">
            Sign up with your name and work email to clock in/out and submit leave or MC.
          </p>
          <div className="space-y-5">
            <div>
              <label htmlFor="reg-name" className="label block mb-1.5 text-[var(--text)]">
                Name
              </label>
              <input
                id="reg-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                className="input-base"
                required
              />
            </div>
            <div>
              <label htmlFor="reg-email" className="label block mb-1.5 text-[var(--text)]">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                className="input-base"
                required
              />
            </div>
            <div>
              <label htmlFor="reg-password" className="label block mb-1.5 text-[var(--text)]">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                autoComplete="new-password"
                className="input-base"
                minLength={4}
                required
              />
            </div>
            <div>
              <label htmlFor="reg-department" className="label block mb-1.5 text-[var(--text)]">
                Department
              </label>
              <select
                id="reg-department"
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
            {error && (
              <p className="text-[0.8125rem] font-medium text-[var(--error)]">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-press w-full py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 shadow-lg shadow-black/10"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </div>
        </form>
        <p className="text-center text-[var(--text-on-red-muted)] text-[0.8125rem] mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
