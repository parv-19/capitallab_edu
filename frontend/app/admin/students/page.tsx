"use client";

import { useEffect, useState } from "react";
import { Search, Shield, ShieldOff, BookOpen, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Student {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  enrollments: string[];
  isBlocked: boolean;
  createdAt: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<{ _id: string; title: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    api.get("/admin/students").then((r) => { setStudents(r.data?.students ?? []); }).catch(() => {});
    api.get("/admin/courses").then((r) => { setCourses(r.data?.courses ?? []); }).catch(() => {});
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/admin/students/${id}/${blocked ? "unblock" : "block"}`);
      setStudents((prev) => prev.map((s) => (s._id === id ? { ...s, isBlocked: !blocked } : s)));
      if (selectedStudent?._id === id) {
        setSelectedStudent((prev) => (prev ? { ...prev, isBlocked: !blocked } : null));
      }
      toast.success(blocked ? "Student unblocked." : "Student blocked.");
    } catch {
      toast.error("Failed to update student.");
    }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !enrollCourseId) return;
    setEnrolling(true);
    try {
      await api.post(`/admin/students/${selectedStudent._id}/enroll`, { courseId: enrollCourseId });
      setStudents((prev) =>
        prev.map((s) =>
          s._id === selectedStudent._id ? { ...s, enrollments: [...s.enrollments, enrollCourseId] } : s,
        ),
      );
      setSelectedStudent((prev) =>
        prev ? { ...prev, enrollments: [...prev.enrollments, enrollCourseId] } : null,
      );
      toast.success("Student enrolled.");
      setEnrollCourseId("");
    } catch {
      toast.error("Enroll failed.");
    }
    setEnrolling(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Student Management</h1>
        <div className="text-sm text-gray-400">{students.length} total students</div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
        />
      </div>

      <div className="space-y-4 md:hidden">
        {filtered.map((s) => (
          <button
            key={s._id}
            type="button"
            onClick={() => setSelectedStudent(s)}
            className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-brand-navy">{s.name}</div>
                  <div className="truncate text-xs text-gray-400">{s.email}</div>
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${s.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                {s.isBlocked ? "Blocked" : "Active"}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Courses</div>
                <div className="mt-1 text-sm font-medium text-brand-navy">
                  {s.enrollments.length > 0 ? `${s.enrollments.length} enrolled` : "None"}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-gray-400">Joined</div>
                <div className="mt-1 text-sm font-medium text-brand-navy">
                  {new Date(s.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            </div>

            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => toggleBlock(s._id, s.isBlocked)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${s.isBlocked ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
              >
                {s.isBlocked ? (
                  <>
                    <Shield className="h-3.5 w-3.5" /> Unblock
                  </>
                ) : (
                  <>
                    <ShieldOff className="h-3.5 w-3.5" /> Block
                  </>
                )}
              </button>
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-400">
            No students found.
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="px-6 py-3">Student</th>
              <th className="px-6 py-3">Courses</th>
              <th className="px-6 py-3">Joined</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((s) => (
              <tr
                key={s._id}
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => setSelectedStudent(s)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-brand-navy">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {s.enrollments.length > 0 ? `${s.enrollments.length} course(s)` : "None"}
                </td>
                <td className="px-6 py-4 text-gray-400">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {s.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleBlock(s._id, s.isBlocked)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${s.isBlocked ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
                  >
                    {s.isBlocked ? (
                      <>
                        <Shield className="h-3.5 w-3.5" /> Unblock
                      </>
                    ) : (
                      <>
                        <ShieldOff className="h-3.5 w-3.5" /> Block
                      </>
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-gray-400">No students found.</div>}
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedStudent(null)} />
          <div className="relative flex w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
              <div>
                <h2 className="font-bold text-brand-navy">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-400">{selectedStudent.email}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Phone", selectedStudent.phone || "-"],
                  ["Joined", new Date(selectedStudent.createdAt).toLocaleDateString("en-IN")],
                  ["Status", selectedStudent.isBlocked ? "Blocked" : "Active"],
                  ["Courses", `${selectedStudent.enrollments.length} enrolled`],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-gray-50 p-3">
                    <div className="mb-0.5 text-xs text-gray-400">{k}</div>
                    <div className="text-sm font-medium text-brand-navy">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-brand-navy">Manual Enroll</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none"
                  >
                    <option value="">Select course...</option>
                    {courses
                      .filter((c) => !selectedStudent.enrollments.includes(c._id))
                      .map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={handleEnroll}
                    disabled={!enrollCourseId || enrolling}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-navyDark disabled:opacity-60 sm:justify-start"
                  >
                    <BookOpen className="h-4 w-4" /> Enroll
                  </button>
                </div>
              </div>

              <div>
                <button
                  onClick={() => toggleBlock(selectedStudent._id, selectedStudent.isBlocked)}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${selectedStudent.isBlocked ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  {selectedStudent.isBlocked ? "Unblock Student" : "Block Student"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
