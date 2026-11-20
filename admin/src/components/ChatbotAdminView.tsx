import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Plus, Save, Trash2 } from "lucide-react";
import { apiRequest } from "../lib/api";

interface FaqRow {
  id: number;
  category: string;
  question: string;
  answer: string;
  keywords_json: string;
  is_published: number;
  is_approved: number;
}

interface UnansweredRow {
  id: number;
  question: string;
  detected_category: string;
  status: string;
  created_at: string;
}

interface ChatbotSettings {
  enabled: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  escalationContacts: {
    telephone: string;
    whatsapp: string;
    email: string;
    emergency: string;
  };
}

export function ChatbotAdminView({ canWrite }: { canWrite: boolean }) {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredRow[]>([]);
  const [cfg, setCfg] = useState<ChatbotSettings | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // New / Convert FAQ form
  const [convertingId, setConvertingId] = useState<number | null>(null);
  const [category, setCategory] = useState("General");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");

  async function load() {
    const [f, u, s] = await Promise.all([
      apiRequest<FaqRow[]>("/api/admin/chatbot/faqs"),
      apiRequest<UnansweredRow[]>("/api/admin/chatbot/unanswered"),
      apiRequest<{ chatbotConfig: ChatbotSettings }>("/api/admin/settings"),
    ]);
    setFaqs(f);
    setUnanswered(u);
    setCfg(s.chatbotConfig);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function saveConfig(e: FormEvent) {
    e.preventDefault();
    if (!cfg || !canWrite) return;
    setError("");
    setNotice("");
    try {
      await apiRequest("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ chatbotConfig: cfg }),
      });
      setNotice("Saved chatbot settings.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save chatbot settings.");
    }
  }

  async function submitFaq(e: FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setError("");
    setNotice("");
    const payload = {
      category,
      question,
      answer,
      keywords: keywordsStr.split(",").map((k) => k.trim()).filter(Boolean),
      isPublished: true,
      isApproved: true,
    };
    try {
      if (convertingId) {
        await apiRequest(`/api/admin/chatbot/unanswered/${convertingId}/convert`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Converted unanswered question into an approved published FAQ.");
      } else {
        await apiRequest("/api/admin/chatbot/faqs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Created approved FAQ entry.");
      }
      setConvertingId(null);
      setQuestion("");
      setAnswer("");
      setKeywordsStr("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save FAQ.");
    }
  }

  async function toggleFaq(faq: FaqRow, field: "isPublished" | "isApproved") {
    const current = field === "isPublished" ? Boolean(faq.is_published) : Boolean(faq.is_approved);
    await apiRequest(`/api/admin/chatbot/faqs/${faq.id}`, {
      method: "PATCH",
      body: JSON.stringify({ [field]: !current }),
    });
    await load();
  }

  async function deleteFaq(id: number) {
    await apiRequest(`/api/admin/chatbot/faqs/${id}`, { method: "DELETE" });
    setNotice("Removed FAQ entry.");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Chatbot Knowledge &amp; Configuration</h2>
        <p className="text-sm text-slate-500">
          Only approved and published FAQ entries are accessible to the public Karen Surgery assistant.
        </p>
      </div>

      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      {notice ? <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</div> : null}

      {/* Master Chatbot Config */}
      {cfg ? (
        <form onSubmit={saveConfig} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Assistant Controls &amp; Welcome Message</h3>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={cfg.enabled}
                onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })}
              />
              Enable Public Chatbot
            </label>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Welcome Message</label>
            <textarea
              rows={2}
              disabled={!canWrite}
              value={cfg.welcomeMessage}
              onChange={(e) => setCfg({ ...cfg, welcomeMessage: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Suggested Questions (one per line)</label>
            <textarea
              rows={3}
              disabled={!canWrite}
              value={(cfg.suggestedQuestions || []).join("\n")}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  suggestedQuestions: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                })
              }
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm disabled:bg-slate-100"
            />
          </div>
          {canWrite ? (
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#121713] px-4 py-2 text-xs font-semibold text-white cursor-pointer">
              <Save className="h-3.5 w-3.5" aria-hidden="true" /> Save Assistant Settings
            </button>
          ) : null}
        </form>
      ) : null}

      {/* Add / Convert FAQ Form */}
      {canWrite ? (
        <form onSubmit={submitFaq} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-bold text-slate-900">
            {convertingId ? `Convert Unanswered Question #${convertingId} into Approved FAQ` : "Add Approved FAQ Entry"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <input required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Retrieval Keywords (comma-separated)</label>
              <input value={keywordsStr} onChange={(e) => setKeywordsStr(e.target.value)} placeholder="e.g. parking, wheelchair, access" className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Question</label>
            <input required value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full min-h-[38px] rounded-lg border border-slate-300 px-3 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Grounded Answer</label>
            <textarea required rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2.5 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[#2F4A2C] px-4 py-2 text-xs font-semibold text-white cursor-pointer">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {convertingId ? "Publish Converted FAQ" : "Save & Approve FAQ"}
            </button>
            {convertingId ? (
              <button type="button" onClick={() => setConvertingId(null)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold cursor-pointer">Cancel</button>
            ) : null}
          </div>
        </form>
      ) : null}

      {/* Unanswered Questions Review Queue */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="font-bold text-slate-900">Unanswered Questions Queue ({unanswered.filter((u) => u.status === "open").length} open)</h3>
        {unanswered.length === 0 ? (
          <p className="text-sm text-slate-500">No unanswered visitor questions logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 text-sm">
            {unanswered.map((u) => (
              <li key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">&ldquo;{u.question}&rdquo;</p>
                  <p className="text-xs text-slate-500">
                    Category: {u.detected_category} · Status: <strong>{u.status}</strong> · {new Date(u.created_at).toLocaleString()}
                  </p>
                </div>
                {canWrite && u.status === "open" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setConvertingId(u.id);
                        setCategory(u.detected_category);
                        setQuestion(u.question);
                        setAnswer("");
                      }}
                      className="rounded-lg bg-[#2F4A2C] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                    >
                      Convert to FAQ
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/api/admin/chatbot/unanswered/${u.id}`, {
                          method: "PATCH",
                          body: JSON.stringify({ status: "dismissed" }),
                        });
                        await load();
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Published & Draft FAQ List */}
      <section className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <th className="px-4 py-3">Category / Question</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {faqs.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 max-w-xl">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2F4A2C]">{f.category}</p>
                  <p className="font-semibold text-slate-900">{f.question}</p>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{f.answer}</p>
                </td>
                <td className="px-4 py-3 space-y-1">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${f.is_published && f.is_approved ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    {f.is_published && f.is_approved ? "Live" : "Hidden / Draft"}
                  </span>
                </td>
                <td className="px-4 py-3 flex flex-wrap gap-2">
                  {canWrite ? (
                    <>
                      <button type="button" onClick={() => toggleFaq(f, "isPublished")} className="rounded border border-slate-300 px-2.5 py-1 text-xs font-semibold cursor-pointer">
                        {f.is_published ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" onClick={() => deleteFaq(f.id)} className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 cursor-pointer">
                        <Trash2 className="h-3 w-3 inline" aria-hidden="true" /> Remove
                      </button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
