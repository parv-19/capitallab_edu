"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Trash2, Zap, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

interface DocFile { _id: string; name: string; fileType: string; size: number; processedForAI: boolean; chunksCount: number; processingError?: string; uploadedAt: string; }

const formatSize = (bytes: number) => bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function DocumentsPage({ params }: { params: { courseId: string } }) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [draggingOver, setDraggingOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/admin/courses/${params.courseId}/documents`).then(r => { if (r.data?.documents) setDocs(r.data.documents); }).catch(() => {});
  }, [params.courseId]);

  const uploadFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { toast.error("File must be smaller than 20 MB."); return; }
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    if (!allowed.includes(file.type)) { toast.error("Only PDF, DOCX, and TXT files are allowed."); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await api.post(`/admin/courses/${params.courseId}/documents/upload`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setDocs(prev => [r.data.document, ...prev]);
      toast.success(`${file.name} uploaded.`);
    } catch { toast.error("Upload failed."); }
    setUploading(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault(); setDraggingOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { await uploadFile(file); e.target.value = ""; }
  };

  const processDoc = async (id: string) => {
    setProcessing(prev => new Set([...prev, id]));
    try {
      const r = await api.post(`/admin/documents/${id}/process`);
      setDocs(prev => prev.map(d => d._id === id ? { ...d, processedForAI: true, chunksCount: r.data.chunksStored } : d));
      toast.success(`Processed — ${r.data.chunksStored} chunks stored.`);
    } catch { toast.error("Processing failed."); setDocs(prev => prev.map(d => d._id === id ? { ...d, processingError: "Processing failed." } : d)); }
    setProcessing(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const deleteDoc = async (id: string) => {
    try {
      await api.delete(`/admin/courses/${params.courseId}/documents/${id}`);
      setDocs(prev => prev.filter(d => d._id !== id));
      toast.success("Document deleted.");
    } catch { toast.error("Delete failed."); }
  };

  const getAIStatus = (doc: DocFile) => {
    if (processing.has(doc._id)) return { label: "Processing...", color: "bg-blue-100 text-blue-700", icon: Loader2 };
    if (doc.processingError) return { label: "Error", color: "bg-red-100 text-red-700", icon: AlertCircle };
    if (doc.processedForAI) return { label: `Ready (${doc.chunksCount} chunks)`, color: "bg-green-100 text-green-700", icon: CheckCircle };
    return { label: "Pending", color: "bg-gray-100 text-gray-500", icon: FileText };
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Document Manager</h1>

      {/* Upload Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
        onDragLeave={() => setDraggingOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer ${draggingOver ? "border-brand-gold bg-brand-gold/5" : "border-gray-200 bg-white hover:border-brand-navy/30"}`}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFileInput} />
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-brand-navy animate-spin" />
            <p className="text-brand-navy font-medium">Uploading...</p>
          </div>
        ) : (
          <>
            <Upload className={`w-10 h-10 mx-auto mb-3 ${draggingOver ? "text-brand-gold" : "text-gray-300"}`} />
            <p className="font-semibold text-gray-600 mb-1">Drop file here or click to upload</p>
            <p className="text-sm text-gray-400">PDF, DOCX, or TXT — max 20 MB</p>
          </>
        )}
      </div>

      {/* Documents List */}
      {docs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide grid grid-cols-12 gap-4">
            <span className="col-span-4">Filename</span>
            <span className="col-span-2">Type</span>
            <span className="col-span-2">Size</span>
            <span className="col-span-2">AI Status</span>
            <span className="col-span-2">Actions</span>
          </div>
          <div className="divide-y divide-gray-50">
            {docs.map(doc => {
              const ai = getAIStatus(doc);
              const AiIcon = ai.icon;
              const isProcessing = processing.has(doc._id);
              return (
                <div key={doc._id} className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-brand-navy shrink-0" />
                    <span className="text-sm font-medium text-brand-navy truncate">{doc.name}</span>
                  </div>
                  <div className="col-span-2 text-xs text-gray-400 uppercase">{doc.fileType}</div>
                  <div className="col-span-2 text-sm text-gray-500">{formatSize(doc.size)}</div>
                  <div className="col-span-2">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${ai.color}`}>
                      <AiIcon className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                      {ai.label}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    {!doc.processedForAI && (
                      <button onClick={() => processDoc(doc._id)} disabled={isProcessing}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold text-xs font-medium hover:bg-brand-gold/20 transition-colors disabled:opacity-60">
                        <Zap className="w-3.5 h-3.5" /> Process
                      </button>
                    )}
                    <button onClick={() => deleteDoc(doc._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {docs.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-400 text-sm">No documents uploaded yet.</div>
      )}
    </div>
  );
}
