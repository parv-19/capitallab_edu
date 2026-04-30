"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, MessageSquare, User, LogOut, Menu, X, GraduationCap, ChevronRight } from "lucide-react";
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
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-indigo-700/30">
        <Link href="/student" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Capital<span className="text-indigo-300">Lab</span></span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/student" ? pathname === "/student" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? "bg-indigo-500 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}>
              <Icon className="w-4 h-4 shrink-0" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-indigo-700/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.charAt(0) ?? "S"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-medium truncate">{user?.name ?? "Student"}</div>
            <div className="text-white/40 text-xs">Student</div>
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
      <aside className="hidden lg:flex w-60 bg-indigo-900 flex-col shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-60 bg-indigo-900 flex flex-col z-10">
            <div className="absolute top-4 right-4"><button onClick={() => setSidebarOpen(false)} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button></div>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-500" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></button>
            <nav className="flex items-center gap-1 text-sm text-gray-400">
              {crumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
                  <span className={`capitalize ${i === crumbs.length - 1 ? "text-brand-navy font-semibold" : ""}`}>{crumb}</span>
                </span>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hidden sm:block">Welcome, {user?.name?.split(" ")[0] ?? "Student"}</span>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) ?? "S"}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
