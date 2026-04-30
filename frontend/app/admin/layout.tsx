"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, Star, Settings,
  Menu, X, GraduationCap, LogOut, ChevronRight,
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
    <div className={`flex flex-col h-full ${mobile ? "" : ""}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-gold flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Capital<span className="text-brand-gold">Lab</span></span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-brand-gold text-white" : "text-white/70 hover:text-white hover:bg-white/10"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0) ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name ?? "Admin"}</div>
            <div className="text-white/40 text-xs truncate">{user?.email ?? ""}</div>
          </div>
          <button onClick={handleLogout} className="text-white/40 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-brand-navy flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-brand-navy flex flex-col z-10">
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
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1 text-sm text-gray-400">
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                  <span className={`capitalize ${i === crumbs.length - 1 ? "text-brand-navy font-semibold" : ""}`}>{crumb}</span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 hidden sm:block">{user?.name ?? "Admin"}</div>
            <div className="w-8 h-8 rounded-full bg-brand-navy flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) ?? "A"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
