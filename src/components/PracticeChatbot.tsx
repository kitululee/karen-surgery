"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileEdit,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import {
  askChatbot,
  DEFAULT_CHATBOT_CONFIG,
  fetchChatbotConfig,
  INQUIRY_CATEGORIES,
  submitEnquiry,
  type ChatbotConfigResponse,
  type ChatbotReply,
  type InquiryCategory,
} from "@/lib/api";
import { useAppointmentModal } from "./AppointmentContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  type?: ChatbotReply["type"];
  suggestedFollowups?: string[];
  offerEnquiryDraft?: boolean;
  draftEnquiry?: ChatbotReply["draftEnquiry"];
}

interface DraftFormState {
  originalQuestion: string;
  category: InquiryCategory;
  subject: string;
  conversationSummary: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContact: "email" | "phone" | "whatsapp";
  privacyAccepted: boolean;
  startedAt: number;
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PracticeChatbot() {
  const { openAppointmentModal } = useAppointmentModal();
  const panelId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<ChatbotConfigResponse>(DEFAULT_CHATBOT_CONFIG);
  const [open, setOpen] = useState(false);
  const [sessionId] = useState<string>(() => `ks-${makeId()}`);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      text: DEFAULT_CHATBOT_CONFIG.welcomeMessage,
      type: "answer",
      suggestedFollowups: DEFAULT_CHATBOT_CONFIG.suggestedQuestions,
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automatic reviewable/editable enquiry draft (never sent without explicit user submit)
  const [draft, setDraft] = useState<DraftFormState | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftSubmitting, setDraftSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchChatbotConfig().then((cfg) => {
      if (!active) return;
      setConfig(cfg);
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id === "welcome") {
          return [
            {
              id: "welcome",
              role: "assistant",
              text: cfg.welcomeMessage,
              type: "answer",
              suggestedFollowups: cfg.suggestedQuestions,
            },
          ];
        }
        return prev;
      });
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 60);
    }
  }, [open, messages, draft]);

  if (!config.enabled) {
    return null;
  }

  const sendQuestion = async (rawText: string) => {
    const q = rawText.trim();
    if (!q || loading) return;

    setErrorMsg(null);
    setDraft(null);
    setInput("");

    const userMsg: ChatMessage = { id: makeId(), role: "user", text: q };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setLoading(true);

    try {
      const reply = await askChatbot({
        question: q,
        sessionId,
        history: nextHistory.slice(-8).map((m) => ({ role: m.role, text: m.text.slice(0, 500) })),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          text: reply.answer,
          type: reply.type,
          suggestedFollowups: reply.suggestedFollowups,
          offerEnquiryDraft: reply.offerEnquiryDraft,
          draftEnquiry: reply.draftEnquiry,
        },
      ]);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to reach the assistant right now. Please call or WhatsApp reception directly."
      );
    } finally {
      setLoading(false);
    }
  };

  const openEditableDraft = (sourceDraft: NonNullable<ChatbotReply["draftEnquiry"]>) => {
    const validCat = INQUIRY_CATEGORIES.includes(sourceDraft.category)
      ? sourceDraft.category
      : "General enquiries";
    setDraftError(null);
    setDraft({
      originalQuestion: sourceDraft.originalQuestion,
      category: validCat,
      subject: sourceDraft.subject,
      conversationSummary: sourceDraft.conversationSummary,
      fullName: "",
      email: "",
      phone: "",
      preferredContact: "email",
      privacyAccepted: false,
      startedAt: Date.now(),
    });
  };

  const submitApprovedDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setDraftError(null);

    if (draft.fullName.trim().length < 2) {
      setDraftError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) {
      setDraftError("Please enter a valid email address.");
      return;
    }
    if (draft.subject.trim().length < 3 || draft.conversationSummary.trim().length < 8) {
      setDraftError("Please keep a clear subject and enquiry message.");
      return;
    }
    if (!draft.privacyAccepted) {
      setDraftError("Please confirm the privacy acknowledgement to send this enquiry.");
      return;
    }

    setDraftSubmitting(true);
    try {
      const res = await submitEnquiry({
        fullName: draft.fullName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        category: draft.category,
        subject: draft.subject.trim(),
        message: draft.conversationSummary.trim(),
        preferredContact: draft.preferredContact,
        privacyAccepted: true,
        source: "chatbot",
        originalQuestion: draft.originalQuestion,
        conversationSummary: draft.conversationSummary.trim(),
        websiteUrl: "",
        startedAt: draft.startedAt,
      });

      setDraft(null);
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: "assistant",
          type: "answer",
          text: res.referenceCode
            ? `Your enquiry has been sent to Karen Surgery reception under reference ${res.referenceCode}. Our reception team will reply via your preferred contact method during opening hours.`
            : res.acknowledgement,
        },
      ]);
    } catch (err) {
      setDraftError(
        err instanceof Error
          ? err.message
          : "Unable to send your enquiry right now. Please contact reception directly."
      );
    } finally {
      setDraftSubmitting(false);
    }
  };

  const handleReset = () => {
    setDraft(null);
    setErrorMsg(null);
    setDraftError(null);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: config.welcomeMessage,
        type: "answer",
        suggestedFollowups: config.suggestedQuestions,
      },
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
      {/* Compact Chat Panel */}
      {open ? (
        <section
          id={panelId}
          aria-label="Karen Surgery practice assistant"
          className="pointer-events-auto flex flex-col w-[calc(100vw-2rem)] sm:w-[23.5rem] max-h-[min(36rem,calc(100dvh-6.25rem))] overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-white shadow-[0_20px_50px_rgba(18,23,19,0.22)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-[var(--color-ink)] px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="font-[var(--font-display)] text-sm font-semibold leading-tight truncate">
                Karen Surgery Assistant
              </p>
              <p className="text-[0.7rem] text-white/75 truncate">
                Practice info only · Not medical advice
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                title="Reset conversation"
                aria-label="Reset conversation"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close assistant"
                aria-label="Close practice assistant"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3 bg-[var(--color-surface)]/70"
          >
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isEmergency = msg.type === "emergency";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[0.84rem] leading-relaxed whitespace-pre-line ${
                      isUser
                        ? "bg-[var(--color-ink)] text-white rounded-br-sm"
                        : isEmergency
                        ? "border-2 border-[var(--color-emergency)] bg-[var(--color-emergency-bg)] text-[var(--color-ink)] rounded-bl-sm"
                        : "border border-[var(--color-border)] bg-white text-[var(--color-ink)] rounded-bl-sm shadow-2xs"
                    }`}
                  >
                    {isEmergency ? (
                      <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-emergency)]">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Emergency Notice</span>
                      </p>
                    ) : null}
                    <div>{msg.text.replace(/\*\*/g, "")}</div>

                    {isEmergency ? (
                      <div className="mt-2.5 pt-2 border-t border-[var(--color-emergency-border)] flex flex-wrap gap-2">
                        <a
                          href={config.escalation.emergencyHref}
                          className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-full bg-[var(--color-emergency)] px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-[#821d21]"
                        >
                          <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Call Emergency {config.escalation.emergency}</span>
                        </a>
                      </div>
                    ) : null}

                    {/* Out-of-scope: Offer reviewable/editable enquiry draft */}
                    {msg.offerEnquiryDraft && msg.draftEnquiry && !draft ? (
                      <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] space-y-2">
                        <button
                          type="button"
                          onClick={() => openEditableDraft(msg.draftEnquiry!)}
                          className="inline-flex w-full min-h-[2.5rem] items-center justify-center gap-1.5 rounded-xl bg-[var(--color-forest)] px-3 py-2 text-xs font-semibold text-white hover:bg-[var(--color-forest-deep)] transition-colors cursor-pointer"
                        >
                          <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Review &amp; Prepare Enquiry for Reception</span>
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Suggested Question Chips */}
                  {!isUser && msg.suggestedFollowups && msg.suggestedFollowups.length > 0 && !draft ? (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                      {msg.suggestedFollowups.slice(0, 4).map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => sendQuestion(q)}
                          className="rounded-full border border-[var(--color-border-strong)] bg-white px-2.5 py-1 text-[0.72rem] font-medium text-[var(--color-ink)] hover:border-[var(--color-forest)] hover:bg-[var(--color-forest-soft)]/50 transition-colors cursor-pointer text-left"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}

            {loading ? (
              <div className="inline-flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs text-[var(--color-ink-muted)]">
                <span>Checking verified practice information...</span>
              </div>
            ) : null}

            {errorMsg ? (
              <div
                role="alert"
                className="rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-3 py-2 text-xs text-[var(--color-emergency)]"
              >
                {errorMsg}
              </div>
            ) : null}

            {/* Inline Editable & Reviewable Enquiry Draft (Requires Explicit Submit) */}
            {draft ? (
              <form
                onSubmit={submitApprovedDraft}
                noValidate
                className="rounded-2xl border border-[var(--color-forest)]/40 bg-white p-3.5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 border-b border-[var(--color-border)] pb-2">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-forest)] flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Draft Enquiry — Review &amp; Edit Before Sending</span>
                    </p>
                    <p className="text-[0.7rem] text-[var(--color-ink-muted)]">
                      Nothing is submitted until you review and click Send Enquiry.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    aria-label="Discard enquiry draft"
                    className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] cursor-pointer p-1"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {draftError ? (
                  <p role="alert" className="text-xs font-medium text-[var(--color-emergency)]">
                    {draftError}
                  </p>
                ) : null}

                <div>
                  <label htmlFor="chat_draft_name" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                    Your Name *
                  </label>
                  <input
                    id="chat_draft_name"
                    type="text"
                    required
                    autoComplete="name"
                    value={draft.fullName}
                    onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                    className="ks-input-compact"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="chat_draft_email" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                      Email *
                    </label>
                    <input
                      id="chat_draft_email"
                      type="email"
                      inputMode="email"
                      required
                      autoComplete="email"
                      value={draft.email}
                      onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                      className="ks-input-compact"
                    />
                  </div>
                  <div>
                    <label htmlFor="chat_draft_phone" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                      Phone (Opt)
                    </label>
                    <input
                      id="chat_draft_phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      className="ks-input-compact"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="chat_draft_cat" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                      Category
                    </label>
                    <select
                      id="chat_draft_cat"
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value as InquiryCategory })}
                      className="ks-input-compact"
                    >
                      {INQUIRY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="chat_draft_contact" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                      Reply Via
                    </label>
                    <select
                      id="chat_draft_contact"
                      value={draft.preferredContact}
                      onChange={(e) =>
                        setDraft({ ...draft, preferredContact: e.target.value as "email" | "phone" | "whatsapp" })
                      }
                      className="ks-input-compact"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Telephone</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="chat_draft_subject" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                    Subject *
                  </label>
                  <input
                    id="chat_draft_subject"
                    type="text"
                    required
                    value={draft.subject}
                    onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                    className="ks-input-compact"
                  />
                </div>

                <div>
                  <label htmlFor="chat_draft_msg" className="block text-[0.72rem] font-medium text-[var(--color-ink)] mb-0.5">
                    Enquiry Summary (Editable) *
                  </label>
                  <textarea
                    id="chat_draft_msg"
                    rows={3}
                    required
                    value={draft.conversationSummary}
                    onChange={(e) => setDraft({ ...draft, conversationSummary: e.target.value })}
                    className="ks-input-compact !min-h-[4.25rem] py-1.5 resize-y"
                  />
                </div>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.privacyAccepted}
                    onChange={(e) => setDraft({ ...draft, privacyAccepted: e.target.checked })}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-forest)]"
                  />
                  <span className="text-[0.7rem] leading-snug text-[var(--color-ink-muted)]">
                    I approve sending this enquiry to Karen Surgery reception for follow-up. *
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="rounded-full border border-[var(--color-border-strong)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:border-[var(--color-ink)] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={draftSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--color-forest-deep)] disabled:opacity-60 cursor-pointer"
                  >
                    <Send className="h-3 w-3" aria-hidden="true" />
                    <span>{draftSubmitting ? "Sending..." : "Send Enquiry"}</span>
                  </button>
                </div>
              </form>
            ) : null}

            <div ref={logEndRef} />
          </div>

          {/* Quick Escalation Strip */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border)] bg-white px-3 py-2 text-[0.7rem]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAppointmentModal({});
              }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-forest-soft)] px-2.5 py-1 font-semibold text-[var(--color-forest-deep)] hover:bg-[var(--color-forest)] hover:text-white transition-colors cursor-pointer"
            >
              <CalendarClock className="h-3 w-3" aria-hidden="true" />
              <span>Request Appointment</span>
            </button>
            <a
              href={config.escalation.telephoneHref}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
            >
              <Phone className="h-3 w-3 text-[var(--color-forest)]" aria-hidden="true" />
              <span>Call</span>
            </a>
            <a
              href={config.escalation.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
            >
              <MessageCircle className="h-3 w-3 text-[var(--color-forest)]" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
            <a
              href={config.escalation.emailHref}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
            >
              <Mail className="h-3 w-3 text-[var(--color-forest)]" aria-hidden="true" />
              <span>Email</span>
            </a>
          </div>

          {/* Question Input Row */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendQuestion(input);
            }}
            className="flex items-center gap-2 border-t border-[var(--color-border)] bg-white p-2.5"
          >
            <label htmlFor="ks_chatbot_input" className="visually-hidden">
              Ask Karen Surgery Assistant a question
            </label>
            <input
              ref={inputRef}
              id="ks_chatbot_input"
              type="text"
              maxLength={400}
              placeholder="Ask about hours, location, services..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendQuestion(input);
                }
              }}
              className="flex-1 min-h-[44px] rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 text-[16px] sm:text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-forest)] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || input.trim().length < 2}
              aria-label="Send question"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-ink)] text-white hover:bg-[var(--color-forest-deep)] disabled:opacity-45 transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      ) : null}

      {/* Discreet Floating Launcher */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) setTimeout(() => inputRef.current?.focus(), 80);
            return next;
          });
        }}
        className="pointer-events-auto inline-flex min-h-[48px] items-center gap-2 rounded-full border border-white/25 bg-[var(--color-ink)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.05em] text-white shadow-[0_10px_28px_rgba(18,23,19,0.26)] hover:bg-[var(--color-forest-deep)] transition-colors cursor-pointer"
      >
        {open ? (
          <>
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Close</span>
          </>
        ) : (
          <>
            <MessageSquare className="h-4 w-4 text-[#CFE3CA]" aria-hidden="true" />
            <span className="sm:hidden">Assistant</span>
            <span className="hidden sm:inline">Practice Assistant</span>
          </>
        )}
      </button>
    </div>
  );
}
