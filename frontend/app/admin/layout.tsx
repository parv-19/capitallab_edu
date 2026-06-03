"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, Star, Settings,
  Menu, X, LogOut, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: MessageSquare },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Testimonials", href: "/admin/testimonials", icon: Star },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const crumbs = pathname.split("/").filter(Boolean);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col bg-[radial-gradient(circle_at_top_left,_rgba(214,164,67,0.18),_transparent_24%),linear-gradient(180deg,_#112654_0%,_#0a1737_58%,_#071128_100%)]">
      {/* Logo */}
      <div className="border-b border-white/12 px-6 py-6">
        <Link href="/admin" className="flex items-center gap-3">
          <img
            src="/api/site-assets/logo"
            alt="Capital Lab Education"
            className="h-11 w-auto rounded-md bg-white/95 p-1 shadow-[0_12px_30px_rgba(15,23,42,0.28)]"
          />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">
              Admin Portal
            </div>
            <div className="text-xl font-extrabold tracking-tight text-white">
              Capital<span className="text-brand-gold">Lab</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_14px_30px_rgba(6,14,34,0.35)] ring-1 ring-white/12"
                  : "text-white/90 hover:bg-white/8 hover:text-white"
              }`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                isActive ? "bg-brand-gold text-white shadow-[0_10px_24px_rgba(214,164,67,0.28)]" : "bg-white/8 text-white/95 group-hover:bg-white/12"
              }`}>
                <Icon className="h-4 w-4 shrink-0" />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-gold text-sm font-bold text-white shadow-[0_10px_24px_rgba(214,164,67,0.24)]">
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold text-white">{user?.name ?? "Admin"}</div>
            <div className="truncate text-xs text-white/65">{user?.email ?? ""}</div>
          </div>
          <button onClick={handleLogout} className="text-white/65 transition-colors hover:text-red-300">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#eff3f9]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 lg:flex">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex w-72 flex-col overflow-hidden">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <nav className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-slate-500">
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex min-w-0 items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                  <span className={`truncate capitalize ${i === crumbs.length - 1 ? "font-semibold text-slate-900" : ""}`}>{crumb}</span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-sm font-medium text-slate-500 sm:block">{user?.name ?? "Admin"}</div>
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-navy text-sm font-bold text-white shadow-[0_10px_24px_rgba(16,35,79,0.18)]">
              {user?.name?.charAt(0) ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,_#f4f7fb_0%,_#edf2f8_100%)] p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
