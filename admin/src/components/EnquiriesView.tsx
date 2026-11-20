import { useEffect, useState } from "react";
import { Bot, RefreshCw, Save, Search } from "lucide-react";
import { apiRequest } from "../lib/api";

interface EnquiryRow {
  id: number;
  reference_code: string;
  full_name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  preferred_contact: string;
  source: "contact_form" | "chatbot";
  original_question: string;
  conversation_summary: string;
  status: string;
  assigned_to_user_id: number | null;
  routed_email: string;
  email_status: string;
  internal_notes: string;
  follow_up_notes: string;
  created_at: string;
}

interface StaffOption {
  id: number;
  full_name: string;
  role_code: string;
}

const STATUSES = ["new", "open", "assigned", "awaiting_response", "resolved", "archived"];

export function EnquiriesView({ canWrite }: { canWrite: boolean }) {
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<EnquiryRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAssignee, setEditAssignee] = useState("");
  const [editInternal, setEditInternal] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const qs = new URLSearchParams();
    if (statusFilter !== "all") qs.set("status", statusFilter);
    if (sourceFilter !== "all") qs.set("source", sourceFilter);
    if (search.trim()) qs.set("search", search.trim());
    const [enqs, staffList] = await Promise.all([
      apiRequest<EnquiryRow[]>(`/api/admin/enquiries?${qs.toString()}`),
      apiRequest<StaffOption[]>("/api/admin/staff-options"),
    ]);
    setRows(enqs);
    setStaff(staffList);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [statusFilter, sourceFilter]);

  function openRow(row: EnquiryRow) {
    setSelected(row);
    setEditStatus(row.status);
    setEditAssignee(row.assigned_to_user_id ? String(row.assigned_to_user_id) : "");
    setEditInternal(row.internal_notes || "");
    setEditFollowUp(row.follow_up_notes || "");
    setMsg("");
  }

  async function saveSelected() {
    if (!selected || !canWrite) return;
    setSaving(true);
    setMsg("");
    try {
      const updated = await apiRequest<EnquiryRow>(`/api/admin/enquiries/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          assignedToUserId: editAssignee ? Number(editAssignee) : null,
          internalNotes: editInternal,
          followUpNotes: editFollowUp,
        }),
      });
      setSelected(updated);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setMsg("Saved enquiry update.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">General &amp; Chatbot Enquiries</h2>
          <p className="text-sm text-slate-500">
            Track reception enquiries, identify chatbot-generated drafts, assign follow-up, and resolve records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search reference, sender, subject, category..."
            className="w-full min-h-[40px] rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
        <select
          aria-label="Filter by source"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All Sources</option>
          <option value="contact_form">Contact Form</option>
          <option value="chatbot">Chatbot-Generated</option>
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
        >
          <option value="all">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => load()}
          className="min-h-[40px] rounded-lg bg-[#121713] px-4 py-1.5 text-xs font-semibold text-white cursor-pointer"
        >
          Search
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Ref / Sender</th>
                <th className="px-4 py-3">Subject &amp; Category</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No enquiries found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => openRow(r)}
                    className={`cursor-pointer hover:bg-slate-50 ${selected?.id === r.id ? "bg-emerald-50/50" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-semibold text-[#2F4A2C]">{r.reference_code}</p>
                      <p className="font-medium text-slate-900">{r.full_name}</p>
                      <p className="text-xs text-slate-500">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.subject}</p>
                      <p className="text-xs text-slate-500">{r.category}</p>
                    </td>
                    <td className="px-4 py-3">
                      {r.source === "chatbot" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                          <Bot className="h-3 w-3" aria-hidden="true" /> Chatbot
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                          Contact Form
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold capitalize">{r.status.replace(/_/g, " ")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 self-start">
          {!selected ? (
            <p className="text-sm text-slate-500 py-8 text-center">Select an enquiry to view details and record follow-up.</p>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs font-bold text-[#2F4A2C]">{selected.reference_code}</p>
                  {selected.source === "chatbot" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                      <Bot className="h-3 w-3" aria-hidden="true" /> Chatbot-Generated Enquiry
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selected.subject}</h3>
                <p className="text-xs text-slate-500">
                  {selected.full_name} · {selected.email} {selected.phone ? `· ${selected.phone}` : ""}
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                {selected.message}
              </div>

              {selected.source === "chatbot" && (selected.original_question || selected.conversation_summary) ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-xs space-y-1">
                  <p className="font-semibold text-emerald-900">Chatbot Context</p>
                  {selected.original_question ? <p><strong>Original question:</strong> {selected.original_question}</p> : null}
                  {selected.conversation_summary ? <p><strong>Summary:</strong> {selected.conversation_summary}</p> : null}
                </div>
              ) : null}

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div>
                  <label htmlFor="enq-status" className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    id="enq-status"
                    disabled={!canWrite}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:bg-slate-100"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enq-assignee" className="block text-xs font-semibold text-slate-700 mb-1">Assigned Staff</label>
                  <select
                    id="enq-assignee"
                    disabled={!canWrite}
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name} ({s.role_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="enq-followup" className="block text-xs font-semibold text-slate-700 mb-1">Follow-Up Record</label>
                  <textarea
                    id="enq-followup"
                    rows={2}
                    disabled={!canWrite}
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label htmlFor="enq-notes" className="block text-xs font-semibold text-slate-700 mb-1">Private Internal Notes</label>
                  <textarea
                    id="enq-notes"
                    rows={2}
                    disabled={!canWrite}
                    value={editInternal}
                    onChange={(e) => setEditInternal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
                  />
                </div>

                {msg ? <p role="status" className="text-xs font-medium text-[#2F4A2C]">{msg}</p> : null}

                {canWrite ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveSelected}
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#121713] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F4A2C] cursor-pointer"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>{saving ? "Saving..." : "Save Enquiry Update"}</span>
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
