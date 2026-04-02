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
    <div className="staff-dashboard min-h-screen bg-[var(--staff-main-bg)] bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(220,38,38,0.06),transparent)]">
      {/* Dark header */}
      <header className="sticky top-0 z-40 bg-[var(--staff-header)]/95 text-white h-14 flex items-center justify-between px-4 lg:px-6 shrink-0 border-b border-white/5 backdrop-blur-md shadow-sm shadow-black/10">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight hover:opacity-90 transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-md"
        >
          TrackTen
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-64 lg:w-80">
            <input
              type="search"
              placeholder="Search…"
              className="w-full rounded-xl border-0 bg-white/10 text-white placeholder-white/55 text-sm px-3 py-2.5 focus:ring-2 focus:ring-[var(--staff-accent)] focus:bg-white/15 focus:outline-none transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login?mode=admin"
              className="text-sm text-white/80 hover:text-white transition-colors duration-200 rounded-md px-2 py-1 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Admin
            </Link>
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white rounded-xl pl-1 pr-2 py-1 transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--staff-accent)] flex items-center justify-center text-sm font-semibold shadow-md shadow-black/20 ring-2 ring-white/10">
                  S
                </span>
                <span id="staff-header-name">{staffName}</span>
                <svg className="w-4 h-4 opacity-80 group-hover:translate-y-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1.5 py-1.5 w-44 bg-white rounded-xl shadow-lift border border-gray-200/80 opacity-0 invisible scale-95 origin-top-right group-hover:opacity-100 group-hover:visible group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:visible group-focus-within:scale-100 transition-all duration-200 ease-out z-50">
                <span className="block px-4 py-2 text-sm text-gray-500 border-b border-gray-100">{staffName}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  Logout
                </button>
                <Link
                  href="/login?mode=admin"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
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
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ease-out ${
                    isActive
                      ? "bg-[var(--staff-accent)] text-white shadow-md shadow-red-900/20 scale-[1.02]"
                      : "text-gray-600 hover:bg-gray-100/90 hover:translate-x-0.5"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/login?mode=admin"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100/90 transition-all duration-200 hover:translate-x-0.5"
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
          <div key={pathname} className="motion-safe:animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
