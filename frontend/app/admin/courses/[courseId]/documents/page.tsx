"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Loader2,
  RefreshCcw,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";

interface DocumentRow {
  _id: string;
  title: string;
  originalFileName: string;
  fileType: string;
  size: number;
  subject?: string;
  chapterName?: string;
  status: "uploaded" | "processing" | "completed" | "indexed" | "failed";
  totalChunks: number;
  chunkCount?: number;
  processedForAI: boolean;
  chunksCount: number;
  embeddingProvider?: string;
  errorMessage?: string;
  processingError?: string;
  uploadedAt: string;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const emptyUploadForm = {
  title: "",
  subject: "Mathematics",
  chapterName: "",
};

export default function DocumentsPage({ params }: { params: { courseId: string } }) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [draggingOver, setDraggingOver] = useState(false);
  const [form, setForm] = useState(emptyUploadForm);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      const response = await api.get(`/admin/courses/${params.courseId}/documents`);
      setDocuments(response.data?.documents ?? []);
    } catch {
      toast.error("Failed to load documents.");
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, [params.courseId]);

  useEffect(() => {
    const hasProcessingDocuments = documents.some((document) => document.status === "processing");
    if (!hasProcessingDocuments) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadDocuments();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [documents, params.courseId]);

  const uploadFile = async (file: File) => {
    if (!form.subject.trim()) {
      toast.error("Subject is required.");
      return;
    }

    setUploading(true);
    const payload = new FormData();
    payload.append("file", file);
    payload.append("title", form.title.trim());
    payload.append("subject", form.subject.trim());
    payload.append("chapterName", form.chapterName.trim());

    try {
      const response = await api.post(
        `/admin/courses/${params.courseId}/documents/upload`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const uploadedDocument = response.data.document as DocumentRow;
      setDocuments((current) => [uploadedDocument, ...current]);
      toast.success(`${file.name} uploaded and queued for processing.`);
      setForm((current) => ({ ...current, title: "", chapterName: "" }));
      void loadDocuments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const processDocument = async (id: string, mode: "process" | "reindex") => {
    setBusyIds((current) => new Set(current).add(id));
    try {
      const endpoint =
        mode === "reindex"
          ? `/admin/documents/${id}/reindex`
          : `/admin/documents/${id}/process`;
      const response = await api.post(endpoint);
      const updatedDocument = response.data?.document as DocumentRow | undefined;

      setDocuments((current) =>
        current.map((document) =>
          document._id === id
            ? updatedDocument ?? document
            : document,
        ),
      );

      toast.success(
        response.data?.alreadyRunning
          ? "Document is already processing."
          : `${mode === "reindex" ? "Re-index" : "Processing"} started in background.`,
      );
      void loadDocuments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Processing failed.");
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await api.delete(`/admin/courses/${params.courseId}/documents/${id}`);
      setDocuments((current) => current.filter((document) => document._id !== id));
      toast.success("Document deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  const getStatusChip = (document: DocumentRow) => {
    if (busyIds.has(document._id) || document.status === "processing") {
      return { label: "processing", className: "bg-blue-100 text-blue-700", icon: Loader2 };
    }
    if (document.status === "failed") {
      return { label: "failed", className: "bg-red-100 text-red-700", icon: AlertCircle };
    }
    if (document.status === "completed" || document.status === "indexed") {
      return { label: "completed", className: "bg-green-100 text-green-700", icon: CheckCircle };
    }
    return { label: "uploaded", className: "bg-gray-100 text-gray-600", icon: FileText };
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDraggingOver(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      await uploadFile(file);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Course Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload syllabus materials, assign a subject and chapter, then process them for the tutor.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Title
            </label>
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Chapter 6 - Triangles"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Subject
            </label>
            <input
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              placeholder="Mathematics"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Chapter Name
            </label>
            <input
              value={form.chapterName}
              onChange={(event) => setForm((current) => ({ ...current, chapterName: event.target.value }))}
              placeholder="Triangles"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/20"
            />
          </div>
        </div>
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDraggingOver(true);
        }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
          draggingOver
            ? "border-brand-gold bg-brand-gold/5"
            : "border-gray-200 bg-white hover:border-brand-navy/30"
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) {
              await uploadFile(file);
              event.target.value = "";
            }
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-brand-navy" />
            <p className="font-medium text-brand-navy">Uploading document...</p>
          </div>
        ) : (
          <>
            <Upload
              className={`mx-auto mb-3 h-10 w-10 ${draggingOver ? "text-brand-gold" : "text-gray-300"}`}
            />
            <p className="mb-1 font-semibold text-gray-700">Drop file here or click to upload</p>
            <p className="text-sm text-gray-400">PDF, DOCX, TXT, or Markdown. Metadata above will be saved with the file.</p>
          </>
        )}
      </div>

      {documents.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
          <div className="divide-y divide-gray-100 md:hidden">
            {documents.map((document) => {
              const status = getStatusChip(document);
              const StatusIcon = status.icon;

              return (
                <div key={document._id} className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-brand-navy">{document.title}</div>
                      <div className="truncate text-xs text-gray-400">{document.originalFileName}</div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                      <StatusIcon className={`h-3.5 w-3.5 ${busyIds.has(document._id) ? "animate-spin" : ""}`} />
                      {status.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><div className="text-gray-400">Subject</div><div className="text-gray-700">{document.subject || "-"}</div></div>
                    <div><div className="text-gray-400">Chapter</div><div className="text-gray-700">{document.chapterName || "-"}</div></div>
                    <div><div className="text-gray-400">Chunks</div><div className="text-gray-700">{document.chunkCount || document.totalChunks || document.chunksCount || 0}</div></div>
                    <div><div className="text-gray-400">Embeddings</div><div className="text-gray-700">{document.embeddingProvider || "-"}</div></div>
                  </div>
                  {(document.errorMessage || document.processingError) ? (
                    <p className="text-xs text-red-500">{document.errorMessage || document.processingError}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    {document.status === "completed" || document.status === "indexed" ? (
                      <button onClick={() => void processDocument(document._id, "reindex")} disabled={busyIds.has(document._id)} className="inline-flex items-center gap-1 rounded-lg bg-brand-gold/10 px-3 py-1.5 text-xs font-medium text-brand-gold disabled:opacity-60">
                        <RefreshCcw className="h-3.5 w-3.5" /> Re-index
                      </button>
                    ) : (
                      <button onClick={() => void processDocument(document._id, "process")} disabled={busyIds.has(document._id)} className="inline-flex items-center gap-1 rounded-lg bg-brand-gold/10 px-3 py-1.5 text-xs font-medium text-brand-gold disabled:opacity-60">
                        <Zap className="h-3.5 w-3.5" /> Process
                      </button>
                    )}
                    <button onClick={() => void deleteDocument(document._id)} className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500">
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-4 border-b border-gray-100 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span className="col-span-3">Document</span>
            <span className="col-span-2">Subject</span>
            <span className="col-span-2">Chapter</span>
            <span className="col-span-2">Status</span>
            <span className="col-span-1">Chunks</span>
            <span className="col-span-2">Actions</span>
          </div>
          <div className="divide-y divide-gray-50">
            {documents.map((document) => {
              const status = getStatusChip(document);
              const StatusIcon = status.icon;

              return (
                <div
                  key={document._id}
                  className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50"
                >
                  <div className="col-span-3 min-w-0">
                    <div className="truncate text-sm font-semibold text-brand-navy">{document.title}</div>
                    <div className="truncate text-xs text-gray-400">{document.originalFileName}</div>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">{document.subject || "-"}</div>
                  <div className="col-span-2 text-sm text-gray-600">{document.chapterName || "-"}</div>
                  <div className="col-span-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      <StatusIcon className={`h-3.5 w-3.5 ${busyIds.has(document._id) ? "animate-spin" : ""}`} />
                      {status.label}
                    </span>
                    {document.errorMessage || document.processingError ? (
                      <p className="mt-1 text-xs text-red-500">{document.errorMessage || document.processingError}</p>
                    ) : null}
                    {document.embeddingProvider ? (
                      <p className="mt-1 text-xs text-gray-400">Embeddings: {document.embeddingProvider}</p>
                    ) : null}
                  </div>
                  <div className="col-span-1 text-sm text-gray-500">
                    {document.chunkCount || document.totalChunks || document.chunksCount || 0}
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {document.status === "completed" || document.status === "indexed" ? (
                      <button
                        onClick={() => void processDocument(document._id, "reindex")}
                        disabled={busyIds.has(document._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-gold/10 px-3 py-1.5 text-xs font-medium text-brand-gold transition-colors hover:bg-brand-gold/20 disabled:opacity-60"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        Re-index
                      </button>
                    ) : (
                      <button
                        onClick={() => void processDocument(document._id, "process")}
                        disabled={busyIds.has(document._id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-gold/10 px-3 py-1.5 text-xs font-medium text-brand-gold transition-colors hover:bg-brand-gold/20 disabled:opacity-60"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Process
                      </button>
                    )}
                    <button
                      onClick={() => void deleteDocument(document._id)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-sm text-gray-400">No documents uploaded yet.</div>
      )}

      <div className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 px-5 py-4 text-sm text-gray-600">
        Only completed documents are used by the syllabus tutor. If a file changes, re-index it so the chatbot uses the latest content.
      </div>
    </div>
  );
}
