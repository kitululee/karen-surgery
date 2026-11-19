import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Siren,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PRACTICE } from "@/data/practice";
import { OPENING_HOURS } from "@/data/hours";
import { PageHero } from "@/components/PageHero";
import { OptimizedImage } from "@/components/OptimizedImage";

export const metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Contact Karen Surgery reception by phone, WhatsApp (+254 (0) 733 642246), or email for routine appointments — plus clearly separated emergency telephone (+254 (0) 724 840246) and Nairobi ambulance services.",
  path: "/contact-us/",
});

export default function ContactUsPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Contact Us" }]}
        eyebrow="Appointments, Enquiries & Emergencies"
        title="Contact Us"
        description="Reach reception by telephone, WhatsApp, or email for routine appointments and general enquiries. For urgent medical emergencies, use the separate Emergency section below."
        actions={
          <>
            <a
              href={`tel:${PRACTICE.contact.receptionPhones[0].tel}`}
              className="btn-pill btn-pill-primary tabular-nums"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Call Reception</span>
            </a>
            <a
              href="#emergency"
              className="btn-pill btn-pill-emergency"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>Jump to Emergency Contacts</span>
            </a>
          </>
        }
      />

      {/* SECTION 1 — Routine Appointments & General Enquiries */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Routine Appointments &amp; General Enquiries
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Reception Contact Channels
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Telephone Card */}
            <article className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-forest)]">
                  <Phone className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  Telephone
                </h3>
                <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                  Call reception to book doctor appointments, check availability, or leave a message.
                </p>
              </div>
              <ul className="mt-5 space-y-2 tabular-nums">
                {PRACTICE.contact.receptionPhones.map((phone) => (
                  <li key={phone.tel}>
                    <a
                      href={`tel:${phone.tel}`}
                      className="inline-flex min-h-[2.75rem] w-full items-center justify-between rounded-xl border border-[var(--color-border-strong)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] transition-colors"
                    >
                      <span>{phone.display}</span>
                      <Phone className="h-4 w-4 text-[var(--color-forest)]" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </article>

            {/* WhatsApp Card */}
            <article className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-forest)]">
                  <MessageCircle className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  WhatsApp Message
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  Send a WhatsApp message to reception during opening hours for routine appointment
                  requests and general enquiries.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <p className="text-base font-semibold text-[var(--color-ink)] tabular-nums">
                  {PRACTICE.contact.whatsapp.display}
                </p>
                <a
                  href={PRACTICE.contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill btn-pill-primary w-full"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>Message on WhatsApp</span>
                </a>
              </div>
            </article>

            {/* Email Card */}
            <article className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between">
              <div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-forest)]">
                  <Mail className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  Email
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  Email our receptionist directly. Please do not use email for medical emergencies.
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <p className="text-sm font-semibold text-[var(--color-ink)] break-all">
                  {PRACTICE.contact.email}
                </p>
                <a
                  href={`mailto:${PRACTICE.contact.email}`}
                  className="btn-pill btn-pill-secondary w-full"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>Send Email</span>
                </a>
              </div>
            </article>
          </div>

          {/* Reception Hours & Physical Address Strip */}
          <div className="grid gap-6 lg:grid-cols-12 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 items-center">
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                <OptimizedImage
                  asset="reception/anne-ragui"
                  alt="Anne Ragui, Receptionist at Karen Surgery"
                  objectPosition="55% 28%"
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-forest)]">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Reception Hours · {OPENING_HOURS.reception.personName}</span>
                </p>
                <p className="mt-1 text-sm text-[var(--color-ink)] font-medium">
                  Monday to Friday: 8:00 am – 4:30 pm · Saturday: 9:00 am – 12:00 noon
                </p>
                <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                  Mental health, physiotherapy, and allied health practitioners may also be
                  contacted directly via their emails in{" "}
                  <Link href="/team/" className="text-[var(--color-forest)] underline underline-offset-4">
                    Our Team
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 lg:border-l lg:border-[var(--color-border)] lg:pl-6 flex flex-col sm:flex-row lg:flex-col xl:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink)] flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[var(--color-forest)]" aria-hidden="true" />
                  <span>{PRACTICE.address.street}</span>
                </p>
                <p className="mt-0.5 text-xs">
                  {PRACTICE.address.poBox}, {PRACTICE.address.city}, {PRACTICE.address.country}
                </p>
              </div>
              <Link href="/location/" className="btn-pill btn-pill-secondary shrink-0">
                <span>Map &amp; Directions</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — High-Visibility Emergency & Ambulance Services */}
      <section
        id="emergency"
        className="py-12 sm:py-16 bg-[var(--color-emergency-bg)] border-b border-[var(--color-emergency-border)] scroll-mt-24"
      >
        <div className="site-container space-y-8">
          <div className="rounded-2xl border-2 border-[var(--color-emergency)] bg-white p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 rounded-full bg-[var(--color-emergency-bg)] px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-emergency)]">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <span>Emergencies Only — Do Not Use For Routine Appointments</span>
                </p>
                <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold text-[var(--color-ink)] sm:text-3xl">
                  In an Emergency
                </h2>
                <p className="mt-2 text-base font-medium text-[var(--color-ink)] leading-relaxed">
                  {PRACTICE.contact.emergencyBannerText}
                </p>
                <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                  Doctors&apos; after-hours service is available during{" "}
                  <strong className="font-semibold text-[var(--color-ink)]">
                    daylight hours only (7:00 am – 7:00 pm), 365 days a year
                  </strong>{" "}
                  including public holidays. For security reasons, Karen Surgery no longer conducts
                  night calls.
                </p>
              </div>

              <div className="shrink-0 flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-emergency)]">
                  Emergencies Only Phone
                </p>
                <a
                  href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
                  className="btn-pill btn-pill-emergency !text-base !px-6 !min-h-[3.25rem] tabular-nums"
                >
                  <Phone className="h-5 w-5" aria-hidden="true" />
                  <span>{PRACTICE.contact.emergencyPhone.display}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Ambulance Services Directory (Verbatim from /contact-us/) */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-emergency)]">
              <Siren className="h-4 w-4" aria-hidden="true" />
              <span>Emergency Medical Transport</span>
            </p>
            <h3 className="mt-1.5 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              Ambulance Services
            </h3>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PRACTICE.contactPageAmbulances.map((entry) => (
                <div
                  key={entry.provider}
                  className="rounded-2xl border border-[var(--color-emergency-border)] bg-white p-5"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-emergency)]">
                    {entry.provider}
                  </p>
                  <div className="mt-3 space-y-2 tabular-nums">
                    {entry.numbers.map((num) => (
                      <a
                        key={num.tel}
                        href={`tel:${num.tel}`}
                        className="flex min-h-[2.75rem] items-center justify-between gap-2 rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] no-underline hover:bg-[#fae3e4] transition-colors"
                      >
                        <span>
                          {num.display}
                          {num.label ? (
                            <span className="block text-[0.7rem] font-normal text-[var(--color-ink-muted)]">
                              {num.label}
                            </span>
                          ) : null}
                        </span>
                        <Phone className="h-4 w-4 shrink-0 text-[var(--color-emergency)]" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
