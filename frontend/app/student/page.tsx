"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle, Clock, Flame } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

const quotes = [
  "Every expert was once a beginner.",
  "Discipline is the bridge between goals and achievement.",
  "Small progress is still progress.",
  "Study now, shine later.",
  "Your future self will thank you.",
  "One concept at a time.",
  "Believe in the process.",
  "Success is the sum of small efforts repeated daily.",
  "Hard work beats talent when talent doesn't work hard.",
  "The CA journey is tough - so are you.",
];

const emptyDashboard = {
  enrolledCourses: [] as Array<{
    _id: string;
    title: string;
    instructor: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
    slug: string;
  }>,
  stats: { lessonsCompleted: 0, coursesEnrolled: 0, streak: 0 },
  recentActivity: [] as Array<{
    courseId: string;
    lastAccessed?: string;
    percentComplete?: number;
  }>,
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(emptyDashboard);
  const quote = quotes[new Date().getDay() % quotes.length];

  useEffect(() => {
    api
      .get("/student/dashboard")
      .then((response) => {
        if (response.data) {
          setData({
            ...emptyDashboard,
            ...response.data,
            enrolledCourses: response.data.enrolledCourses ?? [],
            recentActivity: response.data.recentActivity ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  const stats = [
    {
      icon: CheckCircle,
      label: "Lessons Done",
      value: data.stats.lessonsCompleted,
      tint: "from-emerald-500/16 to-white",
      iconWrap: "bg-emerald-500/12 text-emerald-700",
    },
    {
      icon: BookOpen,
      label: "Courses",
      value: data.stats.coursesEnrolled,
      tint: "from-indigo-500/16 to-white",
      iconWrap: "bg-indigo-500/12 text-indigo-700",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: data.stats.streak,
      tint: "from-orange-500/14 to-white",
      iconWrap: "bg-orange-500/12 text-orange-700",
    },
  ];

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[24px] border border-indigo-300/15 bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.42),_transparent_22%),linear-gradient(135deg,_#1d2a63_0%,_#302d7b_52%,_#4338ca_100%)] px-5 py-6 text-white shadow-[0_24px_70px_rgba(49,46,129,0.28)] sm:rounded-[30px] sm:px-7 sm:py-8">
        <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 opacity-10 sm:right-8 lg:block">
          <BookOpen className="h-36 w-36" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/12 to-transparent" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-indigo-200/80">
              Student Dashboard
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100/90">
              Keep your coursework visible, maintain momentum, and jump straight into the
              study material that matters today.
            </p>
            <p className="mt-4 text-sm italic text-indigo-100/85">&ldquo;{quote}&rdquo;</p>
          </div>

          <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-indigo-50 backdrop-blur">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map(({ icon: Icon, label, value, tint, iconWrap }) => (
          <article
            key={label}
            className={`overflow-hidden rounded-[26px] border border-slate-200/80 bg-gradient-to-br ${tint} p-5 shadow-[0_16px_40px_rgba(15,23,42,0.06)]`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrap}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full border border-white/80 bg-white/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Live
              </span>
            </div>

            <div className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950">
              {value}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-500">{label}</div>
          </article>
        ))}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight text-brand-navy">My Courses</h2>
          <span className="text-sm text-slate-400">
            {data.enrolledCourses.length} enrolled
          </span>
        </div>

        {data.enrolledCourses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.enrolledCourses.map((course) => (
              <article
                key={course._id}
                className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]"
              >
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-500">
                    {course.completedLessons}/{course.totalLessons} lessons
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight text-brand-navy">{course.title}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
                  {course.instructor}
                </p>

                <div className="mt-6">
                  <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span className="font-semibold text-indigo-600">{course.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>

                <Link
                  href={`/student/courses/${course._id}`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  Continue Learning <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-slate-200/80 bg-white p-10 text-center shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-200" />
            <h3 className="mb-2 font-semibold text-slate-700">No Courses Yet</h3>
            <p className="mb-5 text-sm text-slate-400">
              You are not enrolled in any courses yet. Browse the available programs and
              start learning.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-navyDark"
            >
              Browse Courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {data.recentActivity.length > 0 ? (
        <section className="overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-brand-navy">
              <Clock className="h-4 w-4 text-indigo-500" />
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your latest learning progress across enrolled courses.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {data.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <div>
                  <div className="text-sm font-semibold text-brand-navy">
                    {data.enrolledCourses.find((course) => course._id === activity.courseId)?.title ??
                      "Course Activity"}
                  </div>
                  <div className="text-xs text-slate-400">
                    {typeof activity.percentComplete === "number"
                      ? `${activity.percentComplete}% complete`
                      : "Progress updated"}
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-400">
                  {activity.lastAccessed
                    ? new Date(activity.lastAccessed).toLocaleDateString("en-IN")
                    : "Recently"}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
