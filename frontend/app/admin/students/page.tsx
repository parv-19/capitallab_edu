"use client";

import { useState, useEffect } from "react";
import { Search, Shield, ShieldOff, BookOpen, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Student { _id: string; name: string; email: string; phone?: string; enrollments: string[]; isBlocked: boolean; createdAt: string; }

const mockStudents: Student[] = [];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [courses, setCourses] = useState<{_id: string, title: string}[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    api.get("/admin/students").then(r => { if (r.data?.students?.length) setStudents(r.data.students); }).catch(() => {});
    api.get("/admin/courses").then(r => { if (r.data?.courses?.length) setCourses(r.data.courses); }).catch(() => {});
  }, []);

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const toggleBlock = async (id: string, blocked: boolean) => {
    try {
      await api.patch(`/admin/students/${id}/${blocked ? "unblock" : "block"}`);
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isBlocked: !blocked } : s));
      if (selectedStudent?._id === id) setSelectedStudent(prev => prev ? { ...prev, isBlocked: !blocked } : null);
      toast.success(blocked ? "Student unblocked." : "Student blocked.");
    } catch { toast.error("Failed to update student."); }
  };

  const handleEnroll = async () => {
    if (!selectedStudent || !enrollCourseId) return;
    setEnrolling(true);
    try {
      await api.post(`/admin/students/${selectedStudent._id}/enroll`, { courseId: enrollCourseId });
      setStudents(prev => prev.map(s => s._id === selectedStudent._id ? { ...s, enrollments: [...s.enrollments, enrollCourseId] } : s));
      setSelectedStudent(prev => prev ? { ...prev, enrollments: [...prev.enrollments, enrollCourseId] } : null);
      toast.success("Student enrolled.");
    } catch { toast.error("Enroll failed."); }
    setEnrolling(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Student Management</h1>
        <div className="text-sm text-gray-400">{students.length} total students</div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 bg-white" />
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Student</th>
              <th className="px-6 py-3 text-left">Courses</th>
              <th className="px-6 py-3 text-left">Joined</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedStudent(s)}>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-navy flex items-center justify-center text-white text-sm font-bold">{s.name.charAt(0)}</div>
                    <div>
                      <div className="font-medium text-brand-navy">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500">{s.enrollments.length > 0 ? `${s.enrollments.length} course(s)` : "None"}</td>
                <td className="px-6 py-4 text-gray-400">{new Date(s.createdAt).toLocaleDateString("en-IN")}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.isBlocked ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                    {s.isBlocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleBlock(s._id, s.isBlocked)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${s.isBlocked ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                    {s.isBlocked ? <><Shield className="w-3.5 h-3.5" /> Unblock</> : <><ShieldOff className="w-3.5 h-3.5" /> Block</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No students found.</div>}
      </div>

      {/* Student Drawer */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedStudent(null)} />
          <div className="relative bg-white w-full max-w-sm shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white">
              <div>
                <h2 className="font-bold text-brand-navy">{selectedStudent.name}</h2>
                <p className="text-sm text-gray-400">{selectedStudent.email}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                {[["Phone", selectedStudent.phone || "—"], ["Joined", new Date(selectedStudent.createdAt).toLocaleDateString("en-IN")],
                  ["Status", selectedStudent.isBlocked ? "Blocked" : "Active"], ["Courses", `${selectedStudent.enrollments.length} enrolled`]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                    <div className="text-sm font-medium text-brand-navy">{v}</div>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-semibold text-brand-navy text-sm mb-3">Manual Enroll</h3>
                <div className="flex gap-2">
                  <select value={enrollCourseId} onChange={e => setEnrollCourseId(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none bg-white">
                    <option value="">Select course...</option>
                    {courses.filter(c => !selectedStudent.enrollments.includes(c._id)).map(c => (
                      <option key={c._id} value={c._id}>{c.title}</option>
                    ))}
                  </select>
                  <button onClick={handleEnroll} disabled={!enrollCourseId || enrolling}
                    className="px-4 py-2.5 bg-brand-navy text-white rounded-xl text-sm font-medium hover:bg-brand-navyDark transition-colors disabled:opacity-60 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" /> Enroll
                  </button>
                </div>
              </div>

              <div>
                <button onClick={() => toggleBlock(selectedStudent._id, selectedStudent.isBlocked)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${selectedStudent.isBlocked ? "bg-green-500 text-white hover:bg-green-600" : "bg-red-500 text-white hover:bg-red-600"}`}>
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
