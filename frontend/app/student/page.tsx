"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Clock, Flame, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

const quotes = [
  "Every expert was once a beginner.", "Discipline is the bridge between goals and achievement.",
  "Small progress is still progress.", "Study now, shine later.", "Your future self will thank you.",
  "One concept at a time.", "Believe in the process.", "Success is the sum of small efforts repeated daily.",
  "Hard work beats talent when talent doesn't work hard.", "The CA journey is tough — so are you.",
];

const mockDashboard = {
  enrolledCourses: [
    { _id: "1", title: "CA Foundation", instructor: "CA Priya Mehta", progress: 45, totalLessons: 20, completedLessons: 9, slug: "ca-foundation" },
    { _id: "2", title: "CA Intermediate", instructor: "CA Rajesh Patel", progress: 15, totalLessons: 35, completedLessons: 5, slug: "ca-intermediate" },
  ],
  stats: { lessonsCompleted: 14, coursesEnrolled: 2, streak: 7 },
  recentActivity: [
    { lessonTitle: "Journal Entries & Ledger", courseTitle: "CA Foundation", timestamp: "2026-04-28T18:00:00Z" },
    { lessonTitle: "Ratio and Proportion", courseTitle: "CA Foundation", timestamp: "2026-04-27T17:30:00Z" },
    { lessonTitle: "Company Accounts", courseTitle: "CA Intermediate", timestamp: "2026-04-26T16:00:00Z" },
  ],
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(mockDashboard);
  const quote = quotes[new Date().getDay() % quotes.length];

  useEffect(() => {
    api.get("/student/dashboard").then(r => { if (r.data) setData(r.data); }).catch(() => {});
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Student";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-7 text-white relative overflow-hidden">
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
          <BookOpen className="w-32 h-32" />
        </div>
        <div className="relative">
          <div className="text-indigo-300 text-sm mb-1">{new Date().toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 className="text-2xl font-extrabold mb-2">Welcome back, {firstName}! 👋</h1>
          <p className="text-indigo-200 text-sm italic">&ldquo;{quote}&rdquo;</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, label: "Lessons Done", value: data.stats.lessonsCompleted, color: "text-green-600", bg: "bg-green-50" },
          { icon: BookOpen, label: "Courses", value: data.stats.coursesEnrolled, color: "text-indigo-600", bg: "bg-indigo-50" },
          { icon: Flame, label: "Day Streak", value: data.stats.streak, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100 text-center">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className="text-2xl font-extrabold text-brand-navy">{value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* My Courses */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-4">My Courses</h2>
        {data.enrolledCourses.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {data.enrolledCourses.map(course => (
              <div key={course._id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-xs text-gray-400">{course.completedLessons}/{course.totalLessons} lessons</span>
                </div>
                <h3 className="font-bold text-brand-navy mb-1">{course.title}</h3>
                <p className="text-gray-400 text-xs mb-4">{course.instructor}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Progress</span><span className="text-indigo-600 font-semibold">{course.progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                <Link href={`/student/courses/${course._id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                  Continue Learning <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center shadow-soft border border-gray-100">
            <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-600 mb-2">No Courses Yet</h3>
            <p className="text-gray-400 text-sm mb-5">You aren&apos;t enrolled in any courses. Browse our programmes and enquire.</p>
            <Link href="/courses" className="px-6 py-2.5 bg-brand-navy text-white rounded-xl text-sm font-semibold hover:bg-brand-navyDark transition-colors">
              Browse Courses →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {data.recentActivity.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-brand-navy flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-500" /> Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <div className="text-sm font-medium text-brand-navy">{a.lessonTitle}</div>
                  <div className="text-xs text-gray-400">{a.courseTitle}</div>
                </div>
                <div className="text-xs text-gray-400">{new Date(a.timestamp).toLocaleDateString("en-IN")}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
