"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { PRACTICE } from "@/data/practice";
import {
  ApiValidationError,
  INQUIRY_CATEGORIES,
  submitEnquiry,
  type EnquiryResponse,
  type InquiryCategory,
} from "@/lib/api";

interface FieldErrors {
  fullName?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
  privacyAccepted?: string;
}

export function GeneralInquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<InquiryCategory>("General enquiries");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [preferredContact, setPreferredContact] = useState<"email" | "phone" | "whatsapp">("email");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(""); // honeypot
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<EnquiryResponse | null>(null);

  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateField = (field: keyof FieldErrors): string | undefined => {
    switch (field) {
      case "fullName":
        if (fullName.trim().length < 2) return "Please enter your full name.";
        return undefined;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
        return undefined;
      case "category":
        if (!category) return "Please choose an inquiry category.";
        return undefined;
      case "subject":
        if (subject.trim().length < 3) return "Please enter a brief subject (at least 3 characters).";
        return undefined;
      case "message":
        if (message.trim().length < 8) return "Please enter your enquiry message (at least 8 characters).";
        return undefined;
      case "privacyAccepted":
        if (!privacyAccepted) return "Please confirm the privacy acknowledgement before sending.";
        return undefined;
    }
  };

  const handleBlur = (field: keyof FieldErrors) => {
    const err = validateField(field);
    setErrors((prev) => {
      if (!err && !prev[field]) return prev;
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);

    const fields: (keyof FieldErrors)[] = [
      "fullName",
      "email",
      "category",
      "subject",
      "message",
      "privacyAccepted",
    ];
    const nextErrors: FieldErrors = {};
    for (const f of fields) {
      const msg = validateField(f);
      if (msg) nextErrors[f] = msg;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstKey = fields.find((f) => nextErrors[f]);
      if (firstKey) {
        formRef.current?.querySelector<HTMLElement>(`[name="enq_${firstKey}"]`)?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitEnquiry({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category,
        subject: subject.trim(),
        message: message.trim(),
        preferredContact,
        privacyAccepted: true,
        source: "contact_form",
        websiteUrl,
        startedAt,
      });
      setResult(res);
    } catch (err) {
      if (err instanceof ApiValidationError && err.fieldErrors) {
        const mapped: FieldErrors = {};
        for (const [k, v] of Object.entries(err.fieldErrors)) {
          if (v && v[0]) mapped[k as keyof FieldErrors] = v[0];
        }
        setErrors(mapped);
        setServerError(err.message);
      } else {
        setServerError(
          err instanceof Error
            ? err.message
            : "Unable to send your enquiry right now. Please contact reception directly."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setSubject("");
    setMessage("");
    setPrivacyAccepted(false);
    setStartedAt(Date.now());
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8">
      {result ? (
        <div className="space-y-5" role="status" aria-live="polite">
          <div className="rounded-2xl border border-[var(--color-forest)]/30 bg-[var(--color-forest-soft)]/55 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--color-forest)] mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  {result.staticPreviewMode ? "Enquiry Prepared for Reception" : "Enquiry Sent to Reception"}
                </h3>
                {result.referenceCode ? (
                  <p className="mt-1 text-sm font-semibold text-[var(--color-forest)] tabular-nums">
                    Reference Number: {result.referenceCode}
                  </p>
                ) : null}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-[var(--color-ink)]">{result.acknowledgement}</p>
          </div>

          {result.staticPreviewMode ? (
            <div className="flex flex-wrap gap-3">
              {result.mailtoFallback ? (
                <a href={result.mailtoFallback} className="btn-pill btn-pill-primary">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Send via Email to Reception</span>
                </a>
              ) : null}
              {result.whatsappFallback ? (
                <a
                  href={result.whatsappFallback}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill btn-pill-secondary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Send via WhatsApp</span>
                </a>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            onClick={resetForm}
            className="text-sm font-medium text-[var(--color-forest)] underline underline-offset-4 hover:text-[var(--color-ink)] cursor-pointer"
          >
            Send another general enquiry
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
          {serverError ? (
            <div
              role="alert"
              className="rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-4 py-3 text-sm text-[var(--color-emergency)] flex items-start gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-medium">{serverError}</p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  You may also email{" "}
                  <a href={`mailto:${PRACTICE.contact.email}`} className="underline font-semibold">
                    {PRACTICE.contact.email}
                  </a>{" "}
                  or call {PRACTICE.contact.receptionPhones[0].display}.
                </p>
              </div>
            </div>
          ) : null}

          {/* Honeypot */}
          <div className="visually-hidden" aria-hidden="true">
            <label htmlFor="enq_website_url">Website</label>
            <input
              id="enq_website_url"
              name="websiteUrl"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enq_fullName" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                Full Name <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
              </label>
              <input
                id="enq_fullName"
                name="enq_fullName"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  clearError("fullName");
                }}
                onBlur={() => handleBlur("fullName")}
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "enq_fullName_err" : undefined}
                className="ks-input"
              />
              {errors.fullName ? (
                <p id="enq_fullName_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                  {errors.fullName}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="enq_email" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                Email Address <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
              </label>
              <input
                id="enq_email"
                name="enq_email"
                type="email"
                inputMode="email"
                required
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                onBlur={() => handleBlur("email")}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "enq_email_err" : undefined}
                className="ks-input"
              />
              {errors.email ? (
                <p id="enq_email_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                  {errors.email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="enq_phone" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                Telephone <span className="text-xs font-normal text-[var(--color-ink-muted)]">(Optional)</span>
              </label>
              <input
                id="enq_phone"
                name="enq_phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+254 7XX XXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="ks-input"
              />
            </div>

            <div>
              <label htmlFor="enq_category" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                Inquiry Category <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
              </label>
              <select
                id="enq_category"
                name="enq_category"
                required
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as InquiryCategory);
                  clearError("category");
                }}
                className="ks-input"
              >
                {INQUIRY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enq_preferredContact" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                Preferred Contact Method
              </label>
              <select
                id="enq_preferredContact"
                name="enq_preferredContact"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value as "email" | "phone" | "whatsapp")}
                className="ks-input"
              >
                <option value="email">Email</option>
                <option value="phone">Telephone</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="enq_subject" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
              Subject <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
            </label>
            <input
              id="enq_subject"
              name="enq_subject"
              type="text"
              required
              maxLength={160}
              placeholder="e.g., Consultation fee enquiry, insurance claim form question, vaccination availability"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                clearError("subject");
              }}
              onBlur={() => handleBlur("subject")}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "enq_subject_err" : undefined}
              className="ks-input"
            />
            {errors.subject ? (
              <p id="enq_subject_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                {errors.subject}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="enq_message" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
              Message <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
            </label>
            <textarea
              id="enq_message"
              name="enq_message"
              rows={4}
              required
              maxLength={2000}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                clearError("message");
              }}
              onBlur={() => handleBlur("message")}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "enq_message_err enq_message_hint" : "enq_message_hint"}
              placeholder="Write your question for Karen Surgery reception..."
              className="ks-input !min-h-[7rem] py-2.5 resize-y"
            />
            <p id="enq_message_hint" className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Please do not use this form for medical emergencies or to share sensitive clinical records.
            </p>
            {errors.message ? (
              <p id="enq_message_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                {errors.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                id="enq_privacyAccepted"
                name="enq_privacyAccepted"
                type="checkbox"
                checked={privacyAccepted}
                onChange={(e) => {
                  setPrivacyAccepted(e.target.checked);
                  clearError("privacyAccepted");
                }}
                aria-invalid={Boolean(errors.privacyAccepted)}
                aria-describedby={errors.privacyAccepted ? "enq_privacy_err" : undefined}
                className="mt-1 h-5 w-5 shrink-0 rounded accent-[var(--color-forest)]"
              />
              <span className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                I understand this enquiry form is for non-urgent communication and consent to Karen
                Surgery reception using my details solely to respond to my enquiry.{" "}
                <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
              </span>
            </label>
            {errors.privacyAccepted ? (
              <p id="enq_privacy_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                {errors.privacyAccepted}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-ink-muted)]">
              Routed to Karen Surgery Reception ({PRACTICE.contact.email})
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="btn-pill btn-pill-primary disabled:opacity-60"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? "Sending Enquiry..." : "Send General Enquiry"}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
