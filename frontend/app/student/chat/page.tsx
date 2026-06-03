"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import StudentChatPanel from "@/components/student/StudentChatPanel";
import api from "@/lib/axios";

interface RagOption {
  courseId: string;
  courseName: string;
  subjects: string[];
  chapters: string[];
}

const starterQuestions = [
  "What is risk governance?",
  "Define investment risk",
  "What is the role of a code of ethics in a profession?",
  "Explain risk management in simple language",
];

export default function ChatPage() {
  const [options, setOptions] = useState<RagOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await api.get("/rag/options");
        const nextOptions = response.data?.options ?? [];
        setOptions(nextOptions);
        setSelectedCourseId("");
        setSelectedSubject("");
        setSelectedChapter("");
      } catch {
        toast.error("Failed to load available course material.");
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, []);

  const activeCourse = useMemo(
    () => options.find((option) => option.courseId === selectedCourseId) ?? null,
    [options, selectedCourseId],
  );

  useEffect(() => {
    if (!selectedCourseId || !activeCourse) {
      setSelectedSubject("");
      setSelectedChapter("");
      return;
    }

    if (selectedSubject && !activeCourse.subjects.includes(selectedSubject)) {
      setSelectedSubject("");
    }

    if (selectedChapter && !activeCourse.chapters.includes(selectedChapter)) {
      setSelectedChapter("");
    }
  }, [activeCourse, selectedChapter, selectedCourseId, selectedSubject]);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <BookOpen className="h-4 w-4 text-slate-600" />
              Ask From Uploaded Class Material
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Answers come only from admin-uploaded class PDFs and documents. If the uploaded material does not
              support the answer, the assistant will clearly say so.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedCourseId}
              onChange={(event) => {
                setSelectedCourseId(event.target.value);
                setSelectedSubject("");
                setSelectedChapter("");
              }}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">{loadingOptions ? "Loading courses..." : "All enrolled courses"}</option>
              {options.map((option) => (
                <option key={option.courseId} value={option.courseId}>
                  {option.courseName}
                </option>
              ))}
            </select>

            <select
              value={selectedSubject}
              onChange={(event) => setSelectedSubject(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">All subjects</option>
              {(activeCourse?.subjects ?? []).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>

            <select
              value={selectedChapter}
              onChange={(event) => setSelectedChapter(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
            >
              <option value="">All chapters</option>
              {(activeCourse?.chapters ?? []).map((chapter) => (
                <option key={chapter} value={chapter}>
                  {chapter}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <StudentChatPanel
        courseId={selectedCourseId}
        courseName={activeCourse?.courseName ?? "All enrolled courses"}
        subject={selectedSubject || undefined}
        chapterName={selectedChapter || undefined}
        suggestedQuestions={starterQuestions}
      />
    </div>
  );
}
