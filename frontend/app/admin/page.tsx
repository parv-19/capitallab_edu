"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import api from "@/lib/axios";

const emptyStats = {
  totalLeads: 0,
  newLeadsThisMonth: 0,
  totalStudents: 0,
  activeCourses: 0,
  pendingTestimonials: 0,
  weeklyLeads: [] as Array<{ week: string; count: number }>,
};

type LeadRow = {
  _id: string;
  name: string;
  phone: string;
  courseInterest: string;
  createdAt: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-sky-100 text-sky-700",
  contacted: "bg-amber-100 text-amber-700",
  visit_scheduled: "bg-violet-100 text-violet-700",
  enrolled: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-500",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(emptyStats);
  const [recentLeads, setRecentLeads] = useState<LeadRow[]>([]);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((response) => {
        if (response.data) {
          setStats({
            ...emptyStats,
            ...response.data,
            weeklyLeads: response.data.weeklyLeads ?? [],
          });
        }
      })
      .catch(() => {});

    api
      .get("/admin/leads?limit=10")
      .then((response) => {
        setRecentLeads(response.data?.leads ?? []);
      })
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: "Leads This Month",
      value: stats.newLeadsThisMonth,
      icon: MessageSquare,
      tint: "from-sky-500/16 via-white to-sky-50/70",
      iconWrap: "bg-sky-500/12 text-sky-700",
    },
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      tint: "from-emerald-500/16 via-white to-emerald-50/70",
      iconWrap: "bg-emerald-500/12 text-emerald-700",
    },
    {
      label: "Active Courses",
      value: stats.activeCourses,
      icon: BookOpen,
      tint: "from-brand-navy/12 via-white to-indigo-50/70",
      iconWrap: "bg-brand-navy/10 text-brand-navy",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingTestimonials,
      icon: Star,
      tint: "from-amber-500/14 via-white to-amber-50/70",
      iconWrap: "bg-amber-500/12 text-amber-700",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[34px] border border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(30,58,138,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(214,164,67,0.14),_transparent_22%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_55%,_#eef4ff_100%)] px-7 py-7 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Admin Command Center
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
              Dashboard Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Track lead momentum, student growth, and course operations from one
              focused workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Total Leads
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{stats.totalLeads}</div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Monthly New
              </div>
              <div className="mt-1 text-2xl font-extrabold text-slate-950">{stats.newLeadsThisMonth}</div>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Today
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, tint, iconWrap }) => (
          <article
            key={label}
            className={`overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br ${tint} p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-white/80 bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Synced
              </span>
            </div>
            <div className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950">
              {value}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-500">{label}</div>
            <div className="mt-4 h-px bg-gradient-to-r from-slate-200/80 to-transparent" />
            <div className="mt-3 text-xs text-slate-400">
              Live operational signal from current backend data
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,0.95fr)]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
                <TrendingUp className="h-4 w-4 text-brand-gold" />
                Weekly Leads
              </h2>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Demand pulse
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              Last 4 weeks
            </span>
          </div>

          <div className="px-6 py-6">
            {stats.weeklyLeads.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.weeklyLeads} barSize={34}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "14px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
                    }}
                  />
                  <Bar dataKey="count" fill="#1d3f91" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-400">
                No lead trend data yet.
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-500">
              Jump straight into the work that moves the institute forward.
            </p>
          </div>

          <div className="space-y-3 px-5 py-5">
            <Link
              href="/admin/courses"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-md"
            >
              Add New Course <ArrowRight className="h-4 w-4 text-brand-gold" />
            </Link>
            <Link
              href="/admin/leads"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-md"
            >
              View All Leads <ArrowRight className="h-4 w-4 text-brand-gold" />
            </Link>
            <Link
              href="/admin/students"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-md"
            >
              Manage Students <ArrowRight className="h-4 w-4 text-brand-gold" />
            </Link>
            <Link
              href="/admin/testimonials"
              className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-brand-gold/50 hover:shadow-md"
            >
              Review Testimonials <ArrowRight className="h-4 w-4 text-brand-gold" />
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Leads</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest incoming enquiries from the CRM.
            </p>
          </div>
          <Link href="/admin/leads" className="text-sm font-medium text-brand-gold transition hover:underline">
            View all {"->"}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-400">
                <th className="px-6 py-3 text-left font-semibold">Name</th>
                <th className="px-6 py-3 text-left font-semibold">Phone</th>
                <th className="px-6 py-3 text-left font-semibold">Course</th>
                <th className="px-6 py-3 text-left font-semibold">Date</th>
                <th className="px-6 py-3 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentLeads.map((lead) => (
                <tr key={lead._id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-900">{lead.name}</td>
                  <td className="px-6 py-4 text-slate-500">{lead.phone}</td>
                  <td className="px-6 py-4 text-slate-600">{lead.courseInterest}</td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        STATUS_COLORS[lead.status] ?? "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {lead.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentLeads.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-slate-400">
              No recent leads yet.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
