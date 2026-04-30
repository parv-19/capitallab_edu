"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Plus, MessageSquare, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/axios";

interface Message { role: "user" | "assistant"; content: string; timestamp: string; }
interface Session { _id: string; title: string; createdAt: string; messages: Message[]; }

const STARTER_CHIPS = ["Summarise Chapter 1", "Explain this topic simply", "Give me 5 practice questions", "Key formulas to remember"];

const mockSessions: Session[] = [
  { _id: "s1", title: "CA Foundation doubts", createdAt: "2026-04-28T10:00:00Z", messages: [] },
];

export default function ChatPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>(mockSessions);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [courseContext, setCourseContext] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState<{_id: string, title: string}[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.get("/student/chat/sessions").then(r => { if (r.data?.sessions?.length) setSessions(r.data.sessions); }).catch(() => {});
    api.get("/student/dashboard").then(r => { if (r.data?.enrolledCourses) setEnrolledCourses(r.data.enrolledCourses); }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streaming]);

  const createSession = async () => {
    try {
      const r = await api.post("/student/chat/sessions");
      const s = r.data.session ?? { _id: Date.now().toString(), title: "New Chat", createdAt: new Date().toISOString(), messages: [] };
      setSessions(prev => [s, ...prev]);
      setActiveSession(s);
      setMessages([]);
    } catch { toast.error("Failed to create session."); }
  };

  const loadSession = (s: Session) => {
    setActiveSession(s);
    setMessages(s.messages ?? []);
  };

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || streaming) return;
    setInput("");

    const userMsg: Message = { role: "user", content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);

    // Add empty assistant message for streaming
    const assistantMsg: Message = { role: "assistant", content: "", timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, assistantMsg]);

    const sessionId = activeSession?._id ?? "temp";
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("capitalLabAccessToken")}` },
        body: JSON.stringify({ message: msg, courseIds: courseContext ? [courseContext] : enrolledCourses.map(c => c._id) }),
      });

      if (!response.ok) throw new Error("Stream failed");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: full } : m));
        }
      }
    } catch {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: "I encountered an error. Please try again." } : m));
    }
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-5">
      {/* Session Sidebar */}
      <div className="w-60 shrink-0 flex flex-col gap-3">
        <button onClick={createSession} className="flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Chat
        </button>
        <div className="flex-1 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-xs">No sessions yet. Start a new chat!</div>
          ) : sessions.map(s => (
            <button key={s._id} onClick={() => loadSession(s)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-indigo-50 transition-colors ${activeSession?._id === s._id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}>
              <div className="text-xs font-medium text-brand-navy truncate">{s.title}</div>
              <div className="text-xs text-gray-400 mt-0.5">{new Date(s.createdAt).toLocaleDateString("en-IN")}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-navy">
            <MessageSquare className="w-4 h-4 text-indigo-500" /> AI Study Assistant
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Asking about:</span>
            <select value={courseContext} onChange={e => setCourseContext(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none">
              <option value="">All my courses</option>
              {enrolledCourses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy mb-1">Start a study session</h3>
                <p className="text-gray-400 text-sm max-w-xs">Ask anything about your course materials. I&apos;ll answer from your uploaded documents.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-sm">
                {STARTER_CHIPS.map(chip => (
                  <button key={chip} onClick={() => { if (!activeSession) { void createSession().then(() => sendMessage(chip)); } else { void sendMessage(chip); } }}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-medium hover:bg-indigo-100 transition-colors text-left">
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 shrink-0">CL</div>
              )}
              <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                {msg.content || (msg.role === "assistant" && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-6 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
          Answers are based on your course materials. For complex doubts, ask your instructor.
        </div>

        {/* Input */}
        <div className="px-6 pb-5">
          <div className="flex gap-2 items-end">
            <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask a question about your course..." rows={2}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            <button onClick={() => sendMessage()} disabled={!input.trim() || streaming}
              className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0">
              {streaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
