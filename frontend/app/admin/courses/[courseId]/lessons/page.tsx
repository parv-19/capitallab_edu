"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, GripVertical, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Lesson { _id: string; title: string; sectionName: string; videoUrl: string; duration: string; isFreePreview: boolean; order: number; description: string; }

const emptyForm = { title: "", sectionName: "", videoUrl: "", duration: "", isFreePreview: false, description: "" };

export default function LessonsPage({ params }: { params: { courseId: string } }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLesson, setEditLesson] = useState<Lesson | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/admin/courses/${params.courseId}/lessons`)
      .then(r => { if (r.data?.lessons) setLessons(r.data.lessons.sort((a: Lesson, b: Lesson) => a.order - b.order)); })
      .catch(() => {});
  }, [params.courseId]);

  const openAdd = () => { setEditLesson(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (l: Lesson) => { setEditLesson(l); setForm({ title: l.title, sectionName: l.sectionName, videoUrl: l.videoUrl, duration: l.duration, isFreePreview: l.isFreePreview, description: l.description }); setDialogOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editLesson) {
        await api.put(`/admin/courses/${params.courseId}/lessons/${editLesson._id}`, form);
        setLessons(prev => prev.map(l => l._id === editLesson._id ? { ...l, ...form } : l));
        toast.success("Lesson updated.");
      } else {
        const r = await api.post(`/admin/courses/${params.courseId}/lessons`, { ...form, order: lessons.length + 1 });
        setLessons(prev => [...prev, r.data.lesson]);
        toast.success("Lesson created.");
      }
      setDialogOpen(false);
    } catch { toast.error("Failed to save lesson."); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/courses/${params.courseId}/lessons/${id}`);
      setLessons(prev => prev.filter(l => l._id !== id));
      toast.success("Lesson deleted.");
    } catch { toast.error("Delete failed."); }
  };

  // Simple drag-and-drop via mouse events
  const handleDragStart = (id: string) => setDragging(id);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragging || dragging === targetId) return;
    setLessons(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(l => l._id === dragging);
      const toIdx = arr.findIndex(l => l._id === targetId);
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr.map((l, i) => ({ ...l, order: i + 1 }));
    });
  };
  const handleDrop = async () => {
    setDragging(null);
    const orderedIds = lessons.map(l => l._id);
    try {
      await api.patch(`/admin/courses/${params.courseId}/lessons/reorder`, { orderedIds });
    } catch { toast.error("Reorder save failed."); }
  };

  const sections = [...new Set(lessons.map(l => l.sectionName))];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Lesson Manager</h1>
          <p className="text-gray-400 text-sm mt-1">Drag rows to reorder. Changes save automatically.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-navy text-white rounded-xl text-sm font-medium hover:bg-brand-navyDark transition-colors">
          <Plus className="w-4 h-4" /> Add Lesson
        </button>
      </div>

      {sections.map(section => (
        <div key={section} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <span className="font-semibold text-brand-navy text-sm">{section}</span>
            <span className="ml-2 text-xs text-gray-400">({lessons.filter(l => l.sectionName === section).length} lessons)</span>
          </div>
          <div>
            {lessons.filter(l => l.sectionName === section).map(lesson => (
              <div key={lesson._id} draggable
                onDragStart={() => handleDragStart(lesson._id)}
                onDragOver={e => handleDragOver(e, lesson._id)}
                onDrop={handleDrop}
                className={`flex flex-col items-start gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center ${dragging === lesson._id ? "opacity-40" : ""}`}>
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-brand-navy text-sm">{lesson.title}</span>
                    {lesson.isFreePreview && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Free Preview</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{lesson.duration}{lesson.videoUrl ? ` · ${lesson.videoUrl.slice(0, 40)}...` : ""}</div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button onClick={() => openEdit(lesson)} className="p-1.5 rounded-lg hover:bg-brand-navy/5 text-gray-400 hover:text-brand-navy transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(lesson._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {lessons.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-gray-100">
          <p className="text-gray-400">No lessons yet. Click &ldquo;Add Lesson&rdquo; to get started.</p>
        </div>
      )}

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDialogOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold text-brand-navy text-lg">{editLesson ? "Edit Lesson" : "Add Lesson"}</h2>
              <button onClick={() => setDialogOpen(false)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Section Name *</label>
                <input required value={form.sectionName} onChange={e => setForm(f => ({ ...f, sectionName: e.target.value }))} placeholder="e.g. Group I — Accounting"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Video URL (YouTube / Vimeo)</label>
                <input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Duration</label>
                <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 45 min"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isFreePreview} onChange={e => setForm(f => ({ ...f, isFreePreview: e.target.checked }))} className="w-4 h-4 accent-brand-navy" />
                <span className="text-sm text-gray-700">Free Preview (visible without enrollment)</span>
              </label>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button type="button" onClick={() => setDialogOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navyDark flex items-center justify-center gap-2 disabled:opacity-70">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editLesson ? "Update" : "Create Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
