"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/staff", label: "Staff", icon: "staff" },
  { href: "/admin/applications", label: "Applications", icon: "applications" },
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
    case "staff":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case "applications":
      return (
        <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/login?mode=admin";
  };

  return (
    <div className="admin-dashboard min-h-screen bg-[var(--admin-main-bg)]">
      {/* Dark header */}
      <header className="bg-[var(--admin-header)] text-white h-14 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <Link href="/admin" className="text-lg font-semibold tracking-tight hover:opacity-90">
          TrackTen
        </Link>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-64 lg:w-80">
            <input
              type="search"
              placeholder="Search staff or applications…"
              className="w-full rounded-lg border-0 bg-white/10 text-white placeholder-white/60 text-sm px-3 py-2 focus:ring-2 focus:ring-[var(--admin-accent)] focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-sm text-white/80 hover:text-white transition"
            >
              Attendance
            </Link>
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-white/90 hover:text-white"
              >
                <span className="w-8 h-8 rounded-full bg-[var(--admin-accent)] flex items-center justify-center text-sm font-semibold">
                  A
                </span>
                <span>Admin</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 top-full mt-1 py-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link
                  href="/"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Staff attendance
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left sidebar */}
        <aside className="w-56 shrink-0 bg-[var(--admin-sidebar-bg)] border-r border-[var(--border)] min-h-[calc(100vh-3.5rem)] py-4">
          <nav className="px-3 space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--admin-accent)] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Attendance
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
