"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
];

function NavIcon({ name }: { name: string }) {
  const cls = "w-5 h-5 shrink-0";
  switch (name) {
    case "dashboard":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [staffName, setStaffName] = useState<string>("Staff");

  useEffect(() => {
    fetch("/api/auth/staff/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.staff?.name) setStaffName(data.staff.name);
      });
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/staff/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="staff-dashboard min-h-screen bg-[var(--staff-main-bg)]">
      {/* Dark header */}
      <header className="bg-[var(--staff-header)] text-white h-14 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <Link href="/" className="text-lg font-semibold tracking-tight hover:opacity-90">
          TrackTen
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-64 lg:w-80">
            <input
              type="search"
              placeholder="Search…"
              className="w-full rounded-lg border-0 bg-white/10 text-white placeholder-white/60 text-sm px-3 py-2 focus:ring-2 focus:ring-[var(--staff-accent)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login?mode=admin"
              className="text-sm text-white/80 hover:text-white transition"
            >
              Admin
            </Link>
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--staff-accent)] flex items-center justify-center text-sm font-semibold">
                  S
                </span>
                <span id="staff-header-name">{staffName}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <span className="block px-4 py-2 text-sm text-gray-500 border-b border-gray-100">{staffName}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
                <Link
                  href="/login?mode=admin"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Admin login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left sidebar */}
        <aside className="w-56 shrink-0 bg-[var(--staff-sidebar-bg)] border-r border-[var(--border)] min-h-[calc(100vh-3.5rem)] py-4">
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--staff-accent)] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login?mode=admin"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Admin
            </Link>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
