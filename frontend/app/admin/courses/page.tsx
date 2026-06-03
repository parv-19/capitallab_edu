"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, BookOpen, X, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Course { _id: string; title: string; slug: string; instructor: string; level: string; status: string; duration: string; shortDescription: string; description: string; }

const emptyForm = { title: "", slug: "", instructor: "", duration: "", level: "Beginner", shortDescription: "", description: "", status: "draft" };

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/courses").then(r => { setCourses(r.data?.courses ?? []); }).catch(() => {});
  }, []);

  const openAdd = () => { setEditCourse(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Course) => { setEditCourse(c); setForm({ title: c.title, slug: c.slug, instructor: c.instructor, duration: c.duration, level: c.level, shortDescription: c.shortDescription, description: c.description, status: c.status }); setDialogOpen(true); };
  const autoSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCourse) {
        const r = await api.put(`/admin/courses/${editCourse._id}`, form);
        setCourses(prev => prev.map(c => c._id === editCourse._id ? { ...c, ...r.data.course } : c));
        toast.success("Course updated.");
      } else {
        const r = await api.post("/admin/courses", form);
        setCourses(prev => [...prev, r.data.course]);
        toast.success("Course created.");
      }
      setDialogOpen(false);
    } catch { toast.error("Failed to save course."); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/courses/${id}`);
      setCourses(prev => prev.filter(c => c._id !== id));
      toast.success("Course deleted.");
    } catch { toast.error("Failed to delete course."); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Courses</h1>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-sm font-medium hover:bg-brand-navyDark transition-colors">
          <Plus className="w-4 h-4" /> Add Course
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-100 md:hidden">
          {courses.map((c) => (
            <div key={c._id} className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10">
                  <BookOpen className="h-4 w-4 text-brand-navy" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-brand-navy">{c.title}</div>
                  <div className="truncate text-xs text-gray-400">{c.slug}</div>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {c.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-gray-400">Instructor</div><div className="text-gray-700">{c.instructor}</div></div>
                <div><div className="text-gray-400">Duration</div><div className="text-gray-700">{c.duration}</div></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openEdit(c)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">Edit</button>
                <Link href={`/admin/courses/${c._id}/lessons`} className="rounded-lg bg-brand-navy/5 px-3 py-1.5 text-xs font-medium text-brand-navy">Lessons</Link>
                <Link href={`/admin/courses/${c._id}/documents`} className="rounded-lg bg-brand-gold/10 px-3 py-1.5 text-xs font-medium text-brand-gold">Docs</Link>
                <button onClick={() => setDeleteId(c._id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
              <th className="px-6 py-3 text-left">Course</th>
              <th className="px-6 py-3 text-left">Instructor</th>
              <th className="px-6 py-3 text-left">Duration</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {courses.map(c => (
              <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-navy/10 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-brand-navy" />
                    </div>
                    <div>
                      <div className="font-semibold text-brand-navy">{c.title}</div>
                      <div className="text-xs text-gray-400">{c.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{c.instructor}</td>
                <td className="px-6 py-4 text-gray-500">{c.duration}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-brand-navy/5 text-gray-500 hover:text-brand-navy transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <Link href={`/admin/courses/${c._id}/lessons`} className="px-3 py-1.5 rounded-lg bg-brand-navy/5 text-brand-navy text-xs font-medium hover:bg-brand-navy/10 transition-colors">
                      Lessons
                    </Link>
                    <Link href={`/admin/courses/${c._id}/documents`} className="px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-xs font-medium hover:bg-brand-gold/20 transition-colors">
                      Docs
                    </Link>
                    <button onClick={() => setDeleteId(c._id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 ? <div className="px-6 py-12 text-center text-sm text-gray-400">No courses created yet.</div> : null}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-brand-navy text-lg">{editCourse ? "Edit Course" : "Add New Course"}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Title *</label>
                  <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: autoSlug(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Slug</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Instructor *</label>
                  <input required value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Duration</label>
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 6 Months"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Level</label>
                  <div className="relative">
                    <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none appearance-none bg-white">
                      <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Status</label>
                  <div className="relative">
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none appearance-none bg-white">
                      <option value="draft">Draft</option><option value="published">Published</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Short Description</label>
                  <input value={form.shortDescription} onChange={e => setForm(f => ({ ...f, shortDescription: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Full Description</label>
                  <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 resize-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setDialogOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navyDark transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editCourse ? "Update Course" : "Create Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy mb-2">Delete Course?</h2>
            <p className="text-gray-500 text-sm mb-6">This will delete the course, all lessons, and all documents. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
