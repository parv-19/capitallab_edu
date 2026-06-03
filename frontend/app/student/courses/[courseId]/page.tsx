"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp, FileText, ChevronLeft, ChevronRight, Send } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface Lesson { _id: string; title: string; sectionName: string; videoUrl: string; duration: string; description: string; order: number; resources: { name: string; _id: string }[]; }
interface Progress { completedLessons: string[]; percentComplete: number; }
interface CoursePlayerResponse {
  course?: { title: string; instructor: string };
  lessons?: Lesson[];
  progress?: Progress;
}

const getEmbedUrl = (url: string) => {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
};

export default function CoursePlayerPage({ params }: { params: { courseId: string } }) {
  const [course, setCourse] = useState<{ title: string; instructor: string; lessons: Lesson[] }>({ title: "", instructor: "", lessons: [] });
  const [progress, setProgress] = useState<Progress>({ completedLessons: [], percentComplete: 0 });
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<{ question: string; askedAt: string }[]>([]);

  useEffect(() => {
    api.get(`/student/courses/${params.courseId}`).then((r) => {
      const payload = (r.data ?? {}) as CoursePlayerResponse;
      const lessons = payload.lessons ?? [];
      setCourse({
        title: payload.course?.title ?? "",
        instructor: payload.course?.instructor ?? "",
        lessons,
      });
      setActiveLesson(lessons[0] ?? null);
      setOpenSections(lessons[0]?.sectionName ? new Set([lessons[0].sectionName]) : new Set());
      if (payload.progress) setProgress(payload.progress);
    }).catch(() => {});
  }, [params.courseId]);

  const sections = [...new Set(course.lessons.map(l => l.sectionName))];
  const toggleSection = (s: string) => setOpenSections(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });

  const markComplete = async (lessonId: string) => {
    try {
      const r = await api.post(`/student/courses/${params.courseId}/lessons/${lessonId}/complete`);
      setProgress(r.data.progress ?? { completedLessons: [...progress.completedLessons, lessonId], percentComplete: progress.percentComplete + 5 });
      toast.success("Lesson marked as complete!");
    } catch { toast.error("Failed to save progress."); }
  };

  const submitQuestion = async () => {
    if (!activeLesson || !question.trim()) return;
    try {
      await api.post(`/student/lessons/${activeLesson._id}/questions`, { question });
      setQuestions(prev => [...prev, { question, askedAt: new Date().toISOString() }]);
      setQuestion("");
      toast.success("Question submitted!");
    } catch { toast.error("Failed to submit question."); }
  };

  const sortedLessons = [...course.lessons].sort((a, b) => a.order - b.order);
  const activeIdx = sortedLessons.findIndex(l => l._id === activeLesson?._id);
  const prevLesson = activeIdx > 0 ? sortedLessons[activeIdx - 1] : null;
  const nextLesson = activeIdx < sortedLessons.length - 1 ? sortedLessons[activeIdx + 1] : null;
  const isCompleted = (id: string) => progress.completedLessons.includes(id);

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Left Sidebar */}
      <div className="shrink-0 lg:w-72">
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-bold text-brand-navy text-sm">{course.title}</h2>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{progress.percentComplete ?? 0}% complete</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress.percentComplete ?? 0}%` }} />
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto lg:max-h-[60vh]">
            {sections.map(section => (
              <div key={section}>
                <button onClick={() => toggleSection(section)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section}</span>
                  {openSections.has(section) ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </button>
                {openSections.has(section) && (
                  <div>
                    {sortedLessons.filter(l => l.sectionName === section).map(lesson => (
                      <button key={lesson._id} onClick={() => setActiveLesson(lesson as unknown as Lesson)}
                        className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors border-l-2 ${activeLesson?._id === lesson._id ? "border-indigo-500 bg-indigo-50" : "border-transparent hover:bg-gray-50"}`}>
                        {isCompleted(lesson._id)
                          ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                          : <Circle className={`w-4 h-4 shrink-0 ${activeLesson?._id === lesson._id ? "text-indigo-500" : "text-gray-300"}`} />}
                        <div>
                          <div className={`text-xs font-medium leading-tight ${activeLesson?._id === lesson._id ? "text-indigo-700" : "text-gray-700"}`}>{lesson.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{lesson.duration}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="min-w-0 flex-1 space-y-4 sm:space-y-5">
        {activeLesson ? (
          <>
            {/* Video */}
            {activeLesson.videoUrl ? (
              <div className="bg-black rounded-2xl overflow-hidden aspect-video">
                <iframe src={getEmbedUrl(activeLesson.videoUrl)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            ) : (
              <div className="bg-gray-900 rounded-2xl aspect-video flex items-center justify-center">
                <p className="text-white/40">No video available for this lesson.</p>
              </div>
            )}

            {/* Info */}
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 sm:p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-xl font-bold text-brand-navy">{activeLesson.title}</h1>
                <label className="flex items-center gap-2 cursor-pointer shrink-0">
                  <input type="checkbox" checked={isCompleted(activeLesson._id)} onChange={() => !isCompleted(activeLesson._id) && markComplete(activeLesson._id)} className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm text-gray-600 whitespace-nowrap">Mark Complete</span>
                </label>
              </div>
              {activeLesson.description && <p className="text-gray-600 text-sm leading-relaxed">{activeLesson.description}</p>}

              {/* Resources */}
              {activeLesson.resources?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-brand-navy mb-3">Resources</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeLesson.resources.map(res => (
                      <a key={res._id} href={`/api/downloads/${res._id}`} className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg text-sm text-brand-navy transition-colors border border-gray-100">
                        <FileText className="w-4 h-4 text-indigo-500" />{res.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Prev/Next */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => prevLesson && setActiveLesson(prevLesson as unknown as Lesson)} disabled={!prevLesson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-brand-navy hover:text-brand-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button onClick={() => nextLesson && setActiveLesson(nextLesson as unknown as Lesson)} disabled={!nextLesson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed sm:ml-auto">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Q&A */}
            <div className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 sm:p-6">
              <h3 className="font-bold text-brand-navy mb-4">Q&amp;A</h3>
              <div className="space-y-3 mb-4">
                {questions.map((q, i) => (
                  <div key={i} className="bg-indigo-50 rounded-xl p-3">
                    <p className="text-sm text-brand-navy">{q.question}</p>
                    <span className="text-xs text-gray-400 mt-1 block">{new Date(q.askedAt).toLocaleDateString("en-IN")} · Awaiting answer</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={2} placeholder="Ask your instructor a question..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
                <button onClick={submitQuestion} disabled={!question.trim()}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 self-stretch sm:self-end">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center shadow-soft border border-gray-100">
            <p className="text-gray-400">Select a lesson from the sidebar to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
