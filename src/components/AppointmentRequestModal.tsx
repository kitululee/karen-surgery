"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Mail,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { PRACTICE } from "@/data/practice";
import {
  ApiValidationError,
  fetchBookingOptions,
  getStaticBookingOptions,
  submitAppointment,
  type AppointmentResponse,
  type BookingOptionsResponse,
} from "@/lib/api";
import type { AppointmentPreset } from "./AppointmentContext";

const PREFERRED_TIME_OPTIONS = [
  "Morning (8:00 am – 1:00 pm)",
  "Early Morning (8:00 am – 10:30 am)",
  "Late Morning (10:30 am – 1:00 pm)",
  "Afternoon (1:00 pm – 4:30 pm — Other Health Professionals)",
  "Saturday Morning (9:00 am – 12:00 noon)",
  "Any available slot",
];

function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface FieldErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  serviceSlug?: string;
  preferredDate?: string;
  privacyAccepted?: string;
}

export function AppointmentRequestModal({
  open,
  preset,
  onClose,
}: {
  open: boolean;
  preset: AppointmentPreset;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  const [options, setOptions] = useState<BookingOptionsResponse>(() => getStaticBookingOptions());
  const [optionsLoaded, setOptionsLoaded] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [patientType, setPatientType] = useState<"new" | "existing">("new");
  const [serviceSlug, setServiceSlug] = useState("family-medicine");
  const [practitionerId, setPractitionerId] = useState<string>("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState(PREFERRED_TIME_OPTIONS[0]);
  const [preferredContact, setPreferredContact] = useState<"phone" | "whatsapp" | "email">("phone");
  const [message, setMessage] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(""); // honeypot
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AppointmentResponse | null>(null);

  const minDate = useMemo(() => getTodayDateString(), []);

  // Load dynamic booking options from backend when modal opens
  useEffect(() => {
    if (!open || optionsLoaded) return;
    let active = true;
    fetchBookingOptions().then((data) => {
      if (!active) return;
      setOptions(data);
      setOptionsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [open, optionsLoaded]);

  // Apply presets whenever modal opens or options load
  useEffect(() => {
    if (!open) return;
    setStartedAt(Date.now());
    setServerError(null);
    setErrors({});
    setResult(null);

    const targetService = preset.serviceSlug || "family-medicine";
    setServiceSlug(targetService);

    if (preset.practitionerSlug) {
      const match = options.practitioners.find((p) => p.slug === preset.practitionerSlug);
      if (match) {
        setPractitionerId(String(match.id));
        if (match.serviceSlugs.length > 0 && !preset.serviceSlug) {
          setServiceSlug(match.serviceSlugs[0]);
        }
      } else {
        setPractitionerId("");
      }
    } else {
      setPractitionerId("");
    }
  }, [open, preset, options.practitioners]);

  // Native <dialog> open/close synchronization (browser provides Esc, focus trap, inert backdrop)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const filteredPractitioners = useMemo(() => {
    if (!serviceSlug || serviceSlug === "other-verified-services") {
      return options.practitioners;
    }
    const matching = options.practitioners.filter((p) => p.serviceSlugs.includes(serviceSlug));
    return matching;
  }, [options.practitioners, serviceSlug]);

  // Reset practitioner selection if service changes and practitioner is no longer in list
  const handleServiceChange = (nextSlug: string) => {
    setServiceSlug(nextSlug);
    clearError("serviceSlug");
    if (practitionerId) {
      const stillValid = options.practitioners.some(
        (p) => String(p.id) === practitionerId && (nextSlug === "other-verified-services" || p.serviceSlugs.includes(nextSlug))
      );
      if (!stillValid) setPractitionerId("");
    }
  };

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
      case "phone":
        if (phone.trim().length < 7) return "Please enter a valid telephone number.";
        return undefined;
      case "email":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Please enter a valid email address.";
        return undefined;
      case "serviceSlug":
        if (!serviceSlug) return "Please choose a service category.";
        return undefined;
      case "preferredDate":
        if (!preferredDate) return "Please choose a preferred date.";
        if (preferredDate < minDate) return "Please select today or a future date.";
        return undefined;
      case "privacyAccepted":
        if (!privacyAccepted) return "Please confirm the privacy acknowledgement before submitting.";
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
      "phone",
      "email",
      "serviceSlug",
      "preferredDate",
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
        const el = dialogRef.current?.querySelector<HTMLElement>(`[name="apt_${firstKey}"]`);
        el?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const selectedService = options.services.find((s) => s.slug === serviceSlug);
      const selectedPrac = practitionerId
        ? options.practitioners.find((p) => String(p.id) === practitionerId)
        : null;

      const res = await submitAppointment({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        patientType,
        serviceSlug,
        serviceLabel: selectedService?.title || serviceSlug,
        practitionerId: selectedPrac ? selectedPrac.id : null,
        practitionerName: selectedPrac ? selectedPrac.name : null,
        preferredDate,
        preferredTime,
        preferredContact,
        message: message.trim(),
        privacyAccepted: true,
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
            : "We could not submit your appointment request right now. Please contact reception directly."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setResult(null);
    setMessage("");
    setPreferredDate("");
    setPrivacyAccepted(false);
    setStartedAt(Date.now());
    setErrors({});
    setServerError(null);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="ks-modal"
    >
      <div className="flex flex-col max-h-[90dvh] bg-white text-[var(--color-ink)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Karen Surgery · Request &amp; Follow-Up</span>
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)] sm:text-2xl"
            >
              Request an Appointment
            </h2>
            <p id={descId} className="mt-1 text-xs text-[var(--color-ink-muted)]">
              Submit your preferred service, practitioner, and date. Reception or your practitioner
              will contact you to confirm availability.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close appointment request modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {/* Emergency Reminder Strip */}
          <div className="mb-5 rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--color-ink)] flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--color-emergency)] mt-0.5" aria-hidden="true" />
            <p>
              <strong className="font-semibold text-[var(--color-emergency)]">Not for emergencies:</strong>{" "}
              For urgent medical cases (daylight 7:00 am – 7:00 pm), call{" "}
              <a
                href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
                className="font-semibold underline text-[var(--color-emergency)] tabular-nums"
              >
                {PRACTICE.contact.emergencyPhone.display}
              </a>{" "}
              or go to the nearest hospital.
            </p>
          </div>

          {result ? (
            <div className="space-y-5" role="status" aria-live="polite">
              <div className="rounded-2xl border border-[var(--color-forest)]/30 bg-[var(--color-forest-soft)]/55 p-5 sm:p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-[var(--color-forest)] mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                      {result.staticPreviewMode
                        ? "Appointment Request Prepared"
                        : "Appointment Request Received"}
                    </h3>
                    {result.referenceCode ? (
                      <p className="mt-1 text-sm font-semibold text-[var(--color-forest)] tabular-nums">
                        Reference Number: {result.referenceCode}
                      </p>
                    ) : null}
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                  {result.acknowledgement}
                </p>
                <dl className="grid gap-2 sm:grid-cols-2 border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-ink-muted)]">
                  <div>
                    <dt className="font-semibold text-[var(--color-ink)]">Service</dt>
                    <dd>{result.serviceLabel}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--color-ink)]">Practitioner</dt>
                    <dd>{result.practitionerName || "No preference / Reception to advise"}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--color-ink)]">Preferred Date &amp; Time</dt>
                    <dd>
                      {preferredDate} · {preferredTime}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-[var(--color-ink)]">Routed To</dt>
                    <dd>{result.routedTo}</dd>
                  </div>
                </dl>
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

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <button
                  type="button"
                  onClick={resetForAnother}
                  className="text-sm font-medium text-[var(--color-forest)] underline underline-offset-4 hover:text-[var(--color-ink)] cursor-pointer"
                >
                  Submit another request
                </button>
                <button type="button" onClick={onClose} className="btn-pill btn-pill-primary">
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {serverError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-4 py-3 text-sm text-[var(--color-emergency)] flex items-start gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium">{serverError}</p>
                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                      You can also call reception directly on{" "}
                      <a href={`tel:${PRACTICE.contact.receptionPhones[0].tel}`} className="underline font-semibold">
                        {PRACTICE.contact.receptionPhones[0].display}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Honeypot spam trap — hidden from real users & assistive tech */}
              <div className="visually-hidden" aria-hidden="true">
                <label htmlFor="apt_website_url">Website</label>
                <input
                  id="apt_website_url"
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
                  <label htmlFor="apt_fullName" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Full Name <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="apt_fullName"
                    name="apt_fullName"
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
                    aria-describedby={errors.fullName ? "apt_fullName_err" : undefined}
                    className="ks-input"
                  />
                  {errors.fullName ? (
                    <p id="apt_fullName_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                      {errors.fullName}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="apt_phone" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Telephone Number <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="apt_phone"
                    name="apt_phone"
                    type="tel"
                    inputMode="tel"
                    required
                    autoComplete="tel"
                    placeholder="+254 7XX XXXXXX"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      clearError("phone");
                    }}
                    onBlur={() => handleBlur("phone")}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "apt_phone_err" : undefined}
                    className="ks-input"
                  />
                  {errors.phone ? (
                    <p id="apt_phone_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="apt_email" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Email Address <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="apt_email"
                    name="apt_email"
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
                    aria-describedby={errors.email ? "apt_email_err" : undefined}
                    className="ks-input"
                  />
                  {errors.email ? (
                    <p id="apt_email_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                      {errors.email}
                    </p>
                  ) : null}
                </div>

                <fieldset>
                  <legend className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Patient Status
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { value: "new", label: "New patient" },
                        { value: "existing", label: "Existing patient" },
                      ] as const
                    ).map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium cursor-pointer transition-colors ${
                          patientType === opt.value
                            ? "border-[var(--color-forest)] bg-[var(--color-forest-soft)]/60 text-[var(--color-ink)]"
                            : "border-[var(--color-border-strong)] bg-white text-[var(--color-ink-muted)] hover:border-[var(--color-ink)]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="apt_patientType"
                          value={opt.value}
                          checked={patientType === opt.value}
                          onChange={() => setPatientType(opt.value)}
                          className="accent-[var(--color-forest)]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="apt_serviceSlug" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Service Category <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="apt_serviceSlug"
                    name="apt_serviceSlug"
                    required
                    value={serviceSlug}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    onBlur={() => handleBlur("serviceSlug")}
                    aria-invalid={Boolean(errors.serviceSlug)}
                    className="ks-input"
                  >
                    {options.services.map((svc) => (
                      <option key={svc.slug} value={svc.slug}>
                        {svc.title}
                      </option>
                    ))}
                  </select>
                  {errors.serviceSlug ? (
                    <p className="mt-1 text-xs font-medium text-[var(--color-emergency)]">{errors.serviceSlug}</p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="apt_practitionerId" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Preferred Practitioner <span className="text-xs font-normal text-[var(--color-ink-muted)]">(Optional)</span>
                  </label>
                  <select
                    id="apt_practitionerId"
                    name="apt_practitionerId"
                    value={practitionerId}
                    onChange={(e) => setPractitionerId(e.target.value)}
                    disabled={filteredPractitioners.length === 0}
                    className="ks-input disabled:bg-[var(--color-surface)] disabled:text-[var(--color-ink-muted)]"
                  >
                    <option value="">
                      {filteredPractitioners.length === 0
                        ? "Handled by Practice Nurse & Reception"
                        : "No preference / Reception to advise"}
                    </option>
                    {filteredPractitioners.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name} — {p.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="apt_preferredDate" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Preferred Date <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="apt_preferredDate"
                    name="apt_preferredDate"
                    type="date"
                    required
                    min={minDate}
                    value={preferredDate}
                    onChange={(e) => {
                      setPreferredDate(e.target.value);
                      clearError("preferredDate");
                    }}
                    onBlur={() => handleBlur("preferredDate")}
                    aria-invalid={Boolean(errors.preferredDate)}
                    aria-describedby={errors.preferredDate ? "apt_preferredDate_err" : undefined}
                    className="ks-input"
                  />
                  {errors.preferredDate ? (
                    <p id="apt_preferredDate_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                      {errors.preferredDate}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label htmlFor="apt_preferredTime" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                    Preferred Time Window
                  </label>
                  <select
                    id="apt_preferredTime"
                    name="apt_preferredTime"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="ks-input"
                  >
                    {PREFERRED_TIME_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="apt_preferredContact" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  Preferred Contact Method
                </label>
                <select
                  id="apt_preferredContact"
                  name="apt_preferredContact"
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value as "phone" | "whatsapp" | "email")}
                  className="ks-input"
                >
                  <option value="phone">Telephone Call</option>
                  <option value="whatsapp">WhatsApp Message</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label htmlFor="apt_message" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
                  Brief Optional Note <span className="text-xs font-normal text-[var(--color-ink-muted)]">(Optional, max 600 characters)</span>
                </label>
                <textarea
                  id="apt_message"
                  name="apt_message"
                  rows={3}
                  maxLength={600}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-describedby="apt_message_hint"
                  placeholder="e.g., Routine check-up, childhood vaccination, physiotherapy follow-up..."
                  className="ks-input !min-h-[5.5rem] py-2.5 resize-y"
                />
                <p id="apt_message_hint" className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  For your privacy, please do not enter detailed medical histories or sensitive clinical records here.
                </p>
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    id="apt_privacyAccepted"
                    name="apt_privacyAccepted"
                    type="checkbox"
                    checked={privacyAccepted}
                    onChange={(e) => {
                      setPrivacyAccepted(e.target.checked);
                      clearError("privacyAccepted");
                    }}
                    aria-invalid={Boolean(errors.privacyAccepted)}
                    aria-describedby={errors.privacyAccepted ? "apt_privacy_err" : undefined}
                    className="mt-1 h-5 w-5 shrink-0 rounded accent-[var(--color-forest)]"
                  />
                  <span className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    I understand this is an <strong className="font-semibold text-[var(--color-ink)]">appointment request</strong>{" "}
                    (not an automatically confirmed booking) and consent to Karen Surgery using my
                    contact details solely to coordinate this appointment request.{" "}
                    <span className="text-[var(--color-emergency)]" aria-hidden="true">*</span>
                  </span>
                </label>
                {errors.privacyAccepted ? (
                  <p id="apt_privacy_err" className="mt-1 text-xs font-medium text-[var(--color-emergency)]">
                    {errors.privacyAccepted}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <a
                  href={`tel:${PRACTICE.contact.receptionPhones[0].tel}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] no-underline tabular-nums"
                >
                  <Phone className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
                  <span>Prefer to call? {PRACTICE.contact.receptionPhones[0].display}</span>
                </a>
                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn-pill btn-pill-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-pill btn-pill-primary disabled:opacity-60"
                  >
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </dialog>
  );
}
