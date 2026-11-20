import { useEffect, useState } from "react";
import { Activity, CalendarClock, FileText, MailQuestion, RefreshCw, Stethoscope, Users } from "lucide-react";
import { apiRequest } from "../lib/api";

interface DashboardData {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  } | null;
  enquiries: {
    total: number;
    newCount: number;
    unresolved: number;
    fromChatbot: number;
  } | null;
  content: {
    publishedPages: number;
    activePractitioners: number;
    activeServices: number;
    publishedFaqs: number;
    openUnanswered: number;
  };
  recentActivity: {
    id: number;
    actor_email: string;
    actor_role: string;
    action: string;
    entity_type: string;
    entity_id: string;
    summary: string;
    created_at: string;
  }[];
}

export function DashboardView({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await apiRequest<DashboardData>("/api/admin/dashboard"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading && !data) return <p className="text-sm text-slate-500">Loading live metrics...</p>;
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Operations Dashboard</h2>
          <p className="text-sm text-slate-500">Live database-derived practice overview — zero mock data.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Appointments KPIs */}
      {data.appointments ? (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4 text-[#2F4A2C]" aria-hidden="true" />
              Appointment Requests
            </h3>
            <button type="button" onClick={() => onNavigate("appointments")} className="text-xs font-semibold text-[#2F4A2C] hover:underline cursor-pointer">
              Manage appointments →
            </button>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
            {[
              { label: "Total Requests", val: data.appointments.total, cls: "bg-white" },
              { label: "Pending Review", val: data.appointments.pending, cls: "bg-amber-50/70 border-amber-200" },
              { label: "Confirmed", val: data.appointments.confirmed, cls: "bg-emerald-50/70 border-emerald-200" },
              { label: "Completed", val: data.appointments.completed, cls: "bg-slate-50" },
              { label: "Cancelled", val: data.appointments.cancelled, cls: "bg-red-50/60 border-red-200" },
            ].map((k) => (
              <div key={k.label} className={`rounded-xl border border-slate-200 p-4 ${k.cls}`}>
                <p className="text-xs text-slate-600">{k.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{k.val}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Enquiries KPIs */}
      {data.enquiries ? (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MailQuestion className="h-4 w-4 text-[#2F4A2C]" aria-hidden="true" />
              Patient &amp; Visitor Enquiries
            </h3>
            <button type="button" onClick={() => onNavigate("enquiries")} className="text-xs font-semibold text-[#2F4A2C] hover:underline cursor-pointer">
              Manage enquiries →
            </button>
          </div>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-600">Total Enquiries</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.enquiries.total}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs text-slate-600">New Enquiries</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.enquiries.newCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-600">Unresolved</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.enquiries.unresolved}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <p className="text-xs text-slate-600">Chatbot-Generated</p>
              <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.enquiries.fromChatbot}</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Website Content & Chatbot Knowledge */}
      <section className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-[#2F4A2C]" aria-hidden="true" />
          Published Website &amp; Knowledge Base
        </h3>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600">Published Pages</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.content.publishedPages}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600 flex items-center gap-1"><Users className="h-3.5 w-3.5" aria-hidden="true" /> Active Practitioners</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.content.activePractitioners}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600 flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" aria-hidden="true" /> Active Services</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.content.activeServices}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600">Approved FAQs</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.content.publishedFaqs}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-600">Unanswered Queue</p>
            <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{data.content.openUnanswered}</p>
          </div>
        </div>
      </section>

      {/* Recent Administrative Activity */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#2F4A2C]" aria-hidden="true" />
            Recent Administrative Activity
          </h3>
        </div>
        {data.recentActivity.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No recorded administrative activity yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {data.recentActivity.map((log) => (
              <li key={log.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="font-medium text-slate-900">{log.summary}</p>
                  <p className="text-xs text-slate-500">
                    {log.actor_email} ({log.actor_role}) · <code className="text-[11px]">{log.action}</code>
                  </p>
                </div>
                <time className="text-xs text-slate-500 tabular-nums shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
