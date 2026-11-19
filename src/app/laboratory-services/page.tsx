import Link from "next/link";
import { Clock, CreditCard, ExternalLink, FlaskConical, Mail, MapPin, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { LABORATORY_DATA } from "@/data/services";
import { PageHero } from "@/components/PageHero";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "Laboratory Services",
  description:
    "Blood and specimen collection at Karen Surgery with twice-daily courier pickups by Centre for Tropical & Travel Medicine (CTTM) at 9:30 am and Pathcare Kenya Ltd at 1:00 pm.",
  path: "/laboratory-services/",
});

export default function LaboratoryServicesPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Services", href: "/services/" },
          { label: "Laboratory Services" },
        ]}
        eyebrow="Specimen Collection & Partner Labs"
        title="Laboratory Services"
        description="Blood and other specimens are collected on-site by our practice nurse and dispatched via daily courier to our two external partner laboratories."
        actions={
          <Link href="/opening-hours/" className="btn-pill btn-pill-primary">
            <span>View Opening Hours</span>
          </Link>
        }
      />

      {/* How Laboratory Services Work */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4 text-base leading-[1.75] text-[var(--color-ink-muted)] max-w-[62ch]">
            {LABORATORY_DATA.intro.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Daily Courier Schedule</span>
              </p>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <dt className="font-semibold text-[var(--color-ink)]">CTTM Courier</dt>
                  <dd className="font-semibold text-[var(--color-forest)] tabular-nums">9:30 am</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-3">
                  <dt className="font-semibold text-[var(--color-ink)]">Pathcare Courier</dt>
                  <dd className="font-semibold text-[var(--color-forest)] tabular-nums">1:00 pm</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-semibold text-[var(--color-ink)]">Urgent Results</dt>
                  <dd className="text-[var(--color-ink-muted)]">Available the same day</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span>Laboratory Payment Policy</span>
              </p>
              <p className="mt-2.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                The external laboratories do not provide credit. Patients are responsible for
                payment in <strong className="font-semibold text-[var(--color-ink)]">cash or via M-Pesa</strong>{" "}
                the same day. Receipts are returned to Karen Surgery the following day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* External Laboratory Partners */}
      <section className="py-12 sm:py-16 bg-[var(--color-surface)]">
        <div className="site-container space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Partner Laboratories
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Laboratory Details
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {LABORATORY_DATA.partners.map((partner) => (
              <article
                key={partner.name}
                className="ks-card flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-forest-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-forest-deep)]">
                      <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{partner.courierTime}</span>
                    </span>
                    {partner.acronym ? (
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink-muted)]">
                        {partner.acronym}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                    {partner.name}
                  </h3>

                  <address className="not-italic mt-4 space-y-3 text-sm text-[var(--color-ink-muted)]">
                    <p className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                      <span>
                        {partner.addressLines.map((line, i) => (
                          <span key={i} className="block">
                            {line}
                          </span>
                        ))}
                      </span>
                    </p>

                    <div className="flex flex-wrap gap-2 pt-1 tabular-nums">
                      {partner.phones.map((phone) => (
                        <a
                          key={phone.tel}
                          href={`tel:${phone.tel}`}
                          className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-1.5 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
                        >
                          <Phone className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
                          <span>{phone.display}</span>
                        </a>
                      ))}
                    </div>

                    {partner.email ? (
                      <p className="pt-1">
                        <a
                          href={`mailto:${partner.email}`}
                          className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-1.5 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] break-all"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                          <span>{partner.email}</span>
                        </a>
                      </p>
                    ) : null}
                  </address>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
                  <a
                    href={partner.website.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline"
                  >
                    <span>Visit {partner.website.label}</span>
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-t border-[var(--color-border)]">
        <div className="site-container">
          <EmergencyBand compact />
        </div>
      </section>
    </>
  );
}
