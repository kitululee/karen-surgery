import { useEffect, useState } from "react";
import { RefreshCw, Save, Search } from "lucide-react";
import { apiRequest } from "../lib/api";

interface AppointmentRow {
  id: number;
  reference_code: string;
  full_name: string;
  phone: string;
  email: string;
  patient_type: string;
  service_slug: string;
  service_label: string;
  practitioner_name: string | null;
  preferred_date: string;
  preferred_time: string;
  preferred_contact: string;
  message: string;
  status: string;
  assigned_to_user_id: number | null;
  assigned_staff_name: string | null;
  routed_email: string;
  email_status: string;
  internal_notes: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface StaffOption {
  id: number;
  full_name: string;
  email: string;
  role_code: string;
}

const STATUSES = [
  "new",
  "under_review",
  "assigned",
  "awaiting_patient_response",
  "confirmed",
  "completed",
  "cancelled",
];

const STATUS_BADGE: Record<string, string> = {
  new: "bg-amber-100 text-amber-900",
  under_review: "bg-blue-100 text-blue-900",
  assigned: "bg-indigo-100 text-indigo-900",
  awaiting_patient_response: "bg-purple-100 text-purple-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  completed: "bg-slate-200 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
};

export function AppointmentsView({ canWrite }: { canWrite: boolean }) {
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AppointmentRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editAssignee, setEditAssignee] = useState<string>("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const qs = new URLSearchParams();
    if (statusFilter !== "all") qs.set("status", statusFilter);
    if (search.trim()) qs.set("search", search.trim());
    const [apts, staffList] = await Promise.all([
      apiRequest<AppointmentRow[]>(`/api/admin/appointments?${qs.toString()}`),
      apiRequest<StaffOption[]>("/api/admin/staff-options"),
    ]);
    setRows(apts);
    setStaff(staffList);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [statusFilter]);

  function openRow(row: AppointmentRow) {
    setSelected(row);
    setEditStatus(row.status);
    setEditAssignee(row.assigned_to_user_id ? String(row.assigned_to_user_id) : "");
    setEditNotes(row.internal_notes || "");
    setMsg("");
  }

  async function saveSelected() {
    if (!selected || !canWrite) return;
    setSaving(true);
    setMsg("");
    try {
      const updated = await apiRequest<AppointmentRow>(`/api/admin/appointments/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: editStatus,
          assignedToUserId: editAssignee ? Number(editAssignee) : null,
          internalNotes: editNotes,
        }),
      });
      setSelected(updated);
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setMsg("Saved changes and recorded audit log.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Appointment Requests</h2>
          <p className="text-sm text-slate-500">
            Review patient preferences, assign staff, record private internal notes, and update lifecycle status.
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search reference, patient name, email, practitioner..."
            className="w-full min-h-[40px] rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-sm"
          />
        </div>
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
        {/* Table */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Ref / Patient</th>
                <th className="px-4 py-3">Service / Practitioner</th>
                <th className="px-4 py-3">Preferred</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No appointment requests match the current filter.
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
                      <p className="text-xs text-slate-500">{r.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{r.service_label}</p>
                      <p className="text-xs text-slate-500">{r.practitioner_name || "Any available"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums">
                      <p className="font-medium text-slate-800">{r.preferred_date}</p>
                      <p className="text-slate-500">{r.preferred_time || "Flexible"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_BADGE[r.status] || "bg-slate-100"}`}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail & Lifecycle Editor */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4 self-start">
          {!selected ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Select an appointment request to view patient preferences, routing details, and manage status.
            </p>
          ) : (
            <>
              <div className="border-b border-slate-200 pb-3">
                <p className="font-mono text-xs font-bold text-[#2F4A2C]">{selected.reference_code}</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selected.full_name}</h3>
                <p className="text-xs text-slate-500">
                  {selected.patient_type === "existing" ? "Existing patient" : "New patient"} · Submitted{" "}
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-slate-500">Telephone</dt>
                  <dd className="font-semibold text-slate-900">{selected.phone}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-semibold text-slate-900 break-all">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Service</dt>
                  <dd className="font-semibold text-slate-900">{selected.service_label}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Practitioner</dt>
                  <dd className="font-semibold text-slate-900">{selected.practitioner_name || "Any available"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Preferred Date &amp; Time</dt>
                  <dd className="font-semibold text-slate-900">
                    {selected.preferred_date} {selected.preferred_time ? `· ${selected.preferred_time}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Preferred Contact</dt>
                  <dd className="font-semibold text-slate-900 capitalize">{selected.preferred_contact}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">Notification Routing</dt>
                  <dd className="font-mono text-[11px] text-slate-700">
                    {selected.routed_email} ({selected.email_status})
                  </dd>
                </div>
                {selected.message ? (
                  <div className="col-span-2 rounded-lg bg-slate-50 p-3 border border-slate-200">
                    <dt className="text-slate-500 mb-1">Optional Patient Note</dt>
                    <dd className="text-slate-800 whitespace-pre-wrap">{selected.message}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="border-t border-slate-200 pt-4 space-y-3">
                <div>
                  <label htmlFor="apt-status" className="block text-xs font-semibold text-slate-700 mb-1">
                    Request Status (only authorised staff confirm appointments)
                  </label>
                  <select
                    id="apt-status"
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
                  <label htmlFor="apt-assignee" className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Staff Member
                  </label>
                  <select
                    id="apt-assignee"
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
                  <label htmlFor="apt-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                    Private Internal Notes (never exposed publicly or in emails)
                  </label>
                  <textarea
                    id="apt-notes"
                    rows={3}
                    disabled={!canWrite}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
                  />
                </div>

                {msg ? <p role="status" className="text-xs font-medium text-[#2F4A2C]">{msg}</p> : null}

                {canWrite ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveSelected}
                    className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-lg bg-[#121713] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2F4A2C] disabled:opacity-60 cursor-pointer"
                  >
                    <Save className="h-4 w-4" aria-hidden="true" />
                    <span>{saving ? "Saving..." : "Save Appointment Update"}</span>
                  </button>
                ) : (
                  <p className="text-xs text-slate-500 italic">Read-only access: editing disabled.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
