"use client";

import { useState, useEffect } from "react";
import { Search, Download, ChevronDown, X, Plus, StickyNote } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const STATUS_OPTIONS = ["new", "contacted", "visit_scheduled", "enrolled", "closed"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700", contacted: "bg-yellow-100 text-yellow-700",
  visit_scheduled: "bg-purple-100 text-purple-700", enrolled: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-500",
};

interface Lead { _id: string; name: string; phone: string; email?: string; courseInterest: string; preferredTime: string; message?: string; status: string; notes: { text: string; addedAt: string }[]; createdAt: string; }

const mockLeads: Lead[] = [
  { _id: "l1", name: "Arjun Mehta", phone: "9876543210", email: "arjun@example.com", courseInterest: "CA Foundation", preferredTime: "Morning (9 AM – 12 PM)", status: "new", notes: [], createdAt: "2026-04-28T10:00:00Z" },
  { _id: "l2", name: "Priya Shah", phone: "9876543211", courseInterest: "CA Intermediate", preferredTime: "Evening (5 PM – 8 PM)", status: "contacted", notes: [{ text: "Called. Will visit Thursday.", addedAt: "2026-04-27T14:00:00Z" }], createdAt: "2026-04-27T09:00:00Z" },
  { _id: "l3", name: "Rohan Desai", phone: "9876543212", courseInterest: "Both Courses", preferredTime: "Afternoon (12 PM – 5 PM)", status: "visit_scheduled", notes: [], createdAt: "2026-04-26T11:00:00Z" },
  { _id: "l4", name: "Nidhi Joshi", phone: "9876543213", courseInterest: "CA Foundation", preferredTime: "Morning (9 AM – 12 PM)", status: "enrolled", notes: [], createdAt: "2026-04-25T08:00:00Z" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    api.get("/admin/leads").then(r => { if (r.data?.leads?.length) setLeads(r.data.leads); }).catch(() => {});
  }, []);

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = statusFilter ? l.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/leads/${id}/status`, { status });
      setLeads(prev => prev.map(l => l._id === id ? { ...l, status } : l));
      if (selectedLead?._id === id) setSelectedLead(prev => prev ? { ...prev, status } : null);
      toast.success("Status updated.");
    } catch { toast.error("Failed to update status."); }
  };

  const addNote = async () => {
    if (!selectedLead || !newNote.trim()) return;
    setSavingNote(true);
    try {
      await api.post(`/admin/leads/${selectedLead._id}/notes`, { text: newNote });
      const note = { text: newNote, addedAt: new Date().toISOString() };
      setLeads(prev => prev.map(l => l._id === selectedLead._id ? { ...l, notes: [...l.notes, note] } : l));
      setSelectedLead(prev => prev ? { ...prev, notes: [...prev.notes, note] } : null);
      setNewNote("");
      toast.success("Note saved.");
    } catch { toast.error("Failed to save note."); }
    setSavingNote(false);
  };

  const exportCSV = async () => {
    try {
      const r = await api.get("/admin/leads/export", { responseType: "blob" });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a"); a.href = url; a.download = "leads.csv"; a.click();
    } catch { toast.error("Export failed."); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">Leads CRM</h1>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-brand-navy transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 bg-white" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 pr-8 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/30 appearance-none">
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Course</th>
                <th className="px-5 py-3 text-left">Preferred Time</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((lead, i) => (
                <tr key={lead._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td className="px-5 py-3.5 text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3.5 font-medium text-brand-navy">{lead.name}</td>
                  <td className="px-5 py-3.5 text-gray-600">{lead.phone}</td>
                  <td className="px-5 py-3.5 text-gray-600">{lead.courseInterest}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{lead.preferredTime}</td>
                  <td className="px-5 py-3.5 text-gray-400">{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[lead.status]}`}>{lead.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                    <div className="relative group">
                      <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-brand-navy transition-colors">
                        Actions <ChevronDown className="w-3 h-3" />
                      </button>
                      <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-10 hidden group-hover:block">
                        {STATUS_OPTIONS.filter(s => s !== lead.status).map(s => (
                          <button key={s} onClick={() => updateStatus(lead._id, s)}
                            className="w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 capitalize first:rounded-t-xl last:rounded-b-xl">
                            Mark {s.replace("_", " ")}
                          </button>
                        ))}
                        <button onClick={() => setSelectedLead(lead)} className="w-full text-left px-4 py-2.5 text-xs text-brand-navy hover:bg-brand-navy/5 border-t border-gray-100 flex items-center gap-2 rounded-b-xl">
                          <StickyNote className="w-3.5 h-3.5" /> Add Note
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No leads found.</div>}
        </div>
      </div>

      {/* Slide-over Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedLead(null)} />
          <div className="relative bg-white w-full max-w-md shadow-2xl flex flex-col overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-bold text-brand-navy">{selectedLead.name}</h2>
                <p className="text-sm text-gray-400">{selectedLead.phone}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-700 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[["Course", selectedLead.courseInterest], ["Time", selectedLead.preferredTime], ["Email", selectedLead.email || "—"], ["Date", new Date(selectedLead.createdAt).toLocaleDateString("en-IN")]].map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-0.5">{k}</div>
                    <div className="text-sm font-medium text-brand-navy">{v}</div>
                  </div>
                ))}
              </div>
              {selectedLead.message && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Message</div>
                  <p className="text-sm text-gray-700">{selectedLead.message}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-brand-navy text-sm">Status</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s} onClick={() => updateStatus(selectedLead._id, s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${selectedLead.status === s ? STATUS_COLORS[s] : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-brand-navy text-sm mb-3">Notes</h3>
                <div className="space-y-2 mb-3">
                  {selectedLead.notes.map((n, i) => (
                    <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                      <p className="text-sm text-gray-700">{n.text}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.addedAt).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                  {selectedLead.notes.length === 0 && <p className="text-xs text-gray-400">No notes yet.</p>}
                </div>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3} placeholder="Add a note..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-navy/30 resize-none" />
                <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-navy text-white text-sm font-medium rounded-xl hover:bg-brand-navyDark transition-colors disabled:opacity-60">
                  <Plus className="w-4 h-4" /> Save Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
