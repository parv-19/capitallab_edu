"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, BookOpen, Star, TrendingUp, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "@/lib/axios";

const mockStats = { totalLeads: 48, newLeadsThisMonth: 12, totalStudents: 31, activeCourses: 2, pendingTestimonials: 5,
  weeklyLeads: [{ week: "Apr 1", count: 8 }, { week: "Apr 8", count: 11 }, { week: "Apr 15", count: 7 }, { week: "Apr 22", count: 12 }] };

const mockRecentLeads = [
  { _id: "l1", name: "Arjun Mehta", phone: "9876543210", courseInterest: "CA Foundation", createdAt: "2026-04-28", status: "new" },
  { _id: "l2", name: "Priya Shah", phone: "9876543211", courseInterest: "CA Intermediate", createdAt: "2026-04-27", status: "contacted" },
  { _id: "l3", name: "Rohan Desai", phone: "9876543212", courseInterest: "Both Courses", createdAt: "2026-04-26", status: "visit_scheduled" },
  { _id: "l4", name: "Nidhi Joshi", phone: "9876543213", courseInterest: "CA Foundation", createdAt: "2026-04-25", status: "enrolled" },
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  visit_scheduled: "bg-purple-100 text-purple-700",
  enrolled: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);
  const [recentLeads, setRecentLeads] = useState(mockRecentLeads);

  useEffect(() => {
    api.get("/admin/stats").then(r => { if (r.data) setStats(r.data); }).catch(() => {});
    api.get("/admin/leads?limit=10").then(r => { if (r.data?.leads?.length) setRecentLeads(r.data.leads); }).catch(() => {});
  }, []);

  const statCards = [
    { label: "Leads This Month", value: stats.newLeadsThisMonth, icon: MessageSquare, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-green-600", bg: "bg-green-50" },
    { label: "Active Courses", value: stats.activeCourses, icon: BookOpen, color: "text-brand-navy", bg: "bg-brand-navy/5" },
    { label: "Pending Reviews", value: stats.pendingTestimonials, icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard Overview</h1>
        <div className="text-sm text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-3xl font-extrabold text-brand-navy">{value}</div>
            <div className="text-gray-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-brand-navy flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-gold" /> Weekly Leads
            </h2>
            <span className="text-xs text-gray-400">Last 4 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.weeklyLeads} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Bar dataKey="count" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <h2 className="font-bold text-brand-navy mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link href="/admin/courses" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-navy/5 transition-colors text-sm font-medium text-brand-navy">
              Add New Course <ArrowRight className="w-4 h-4 text-brand-gold" />
            </Link>
            <Link href="/admin/leads" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-navy/5 transition-colors text-sm font-medium text-brand-navy">
              View All Leads <ArrowRight className="w-4 h-4 text-brand-gold" />
            </Link>
            <Link href="/admin/students" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-navy/5 transition-colors text-sm font-medium text-brand-navy">
              Manage Students <ArrowRight className="w-4 h-4 text-brand-gold" />
            </Link>
            <Link href="/admin/testimonials" className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-brand-navy/5 transition-colors text-sm font-medium text-brand-navy">
              Review Testimonials <ArrowRight className="w-4 h-4 text-brand-gold" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-brand-navy">Recent Leads</h2>
          <Link href="/admin/leads" className="text-sm text-brand-gold hover:underline font-medium">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Phone</th>
                <th className="px-6 py-3 text-left font-semibold">Course</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLeads.map(lead => (
                <tr key={lead._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 font-medium text-brand-navy">{lead.name}</td>
                  <td className="px-6 py-3.5 text-gray-500">{lead.phone}</td>
                  <td className="px-6 py-3.5 text-gray-600">{lead.courseInterest}</td>
                  <td className="px-6 py-3.5 text-gray-400">{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
