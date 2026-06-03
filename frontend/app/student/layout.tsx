"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, User, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "My Courses", href: "/student/courses", icon: BookOpen },
  { label: "AI Study Chat", href: "/student/chat", icon: MessageSquare },
  { label: "Profile", href: "/student/profile", icon: User },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); router.push("/login"); };
  const crumbs = pathname.split("/").filter(Boolean);

  const Sidebar = () => (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_transparent_28%),linear-gradient(180deg,_#2b2c7f_0%,_#1f235e_100%)]">
      <div className="border-b border-indigo-200/12 px-6 py-6">
        <Link href="/student" className="flex items-center gap-3">
          <img
            src="/api/site-assets/logo"
            alt="Capital Lab Education"
            className="h-11 w-auto rounded-md bg-white/95 p-1 shadow-[0_12px_30px_rgba(12,18,54,0.28)]"
          />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
              Student Portal
            </div>
            <div className="text-xl font-extrabold tracking-tight text-white">
              Capital<span className="text-indigo-300">Lab</span>
            </div>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1.5 overflow-y-auto px-4 py-5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/student" ? pathname === "/student" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_30px_rgba(11,17,46,0.35)] ring-1 ring-white/10"
                  : "text-white/90 hover:bg-white/8 hover:text-white"
              }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isActive ? "bg-indigo-400 text-white shadow-[0_10px_24px_rgba(129,140,248,0.28)]" : "bg-white/6 text-white/90"
              }`}>
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-indigo-200/12 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-400 text-sm font-bold text-white shadow-[0_10px_24px_rgba(129,140,248,0.24)]">
            {user?.name?.charAt(0) ?? "S"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold text-white">{user?.name ?? "Student"}</div>
            <div className="text-xs text-white/70">Student</div>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef2fb]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex w-72 flex-col overflow-hidden">
            <div className="absolute top-4 right-4"><button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button></div>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-slate-400">
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  <span className={`truncate capitalize ${i === crumbs.length - 1 ? "font-semibold text-slate-900" : ""}`}>{crumb}</span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:block">Welcome, {user?.name?.split(" ")[0] ?? "Student"}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-sm font-bold text-white shadow-[0_10px_24px_rgba(79,70,229,0.18)]">
              {user?.name?.charAt(0) ?? "S"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
