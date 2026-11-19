import Link from "next/link";
import { AlertTriangle, Clock, MessageCircle, Moon, Phone, Stethoscope, Users } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { OPENING_HOURS } from "@/data/hours";
import { PRACTICE } from "@/data/practice";
import { PageHero } from "@/components/PageHero";
import { OptimizedImage } from "@/components/OptimizedImage";

export const metadata = buildMetadata({
  title: "Opening Hours",
  description:
    "Karen Surgery reception hours, doctors' consulting hours, daylight after-hours service (7am–7pm, 365 days), night-call policy with Nairobi ambulance numbers, and allied health hours.",
  path: "/opening-hours/",
});

export default function OpeningHoursPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Patient Information" },
          { label: "Opening Hours" },
        ]}
        eyebrow="Schedules & After-Hours Care"
        title="Opening Hours"
        description="Reception, doctors' routine consultations, urgent daylight after-hours cover, and consulting health professionals follow distinct schedules so you always know how to reach the right care."
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
              href={PRACTICE.contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-secondary"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>
          </>
        }
      />

      <section className="py-12 sm:py-16 bg-white">
        <div className="site-container space-y-8">
          {/* 1. RECEPTIONIST (Anne Ragui with authentic portrait) */}
          <article className="ks-card grid gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 md:grid-cols-[11rem_1fr] md:items-center">
            <div className="w-36 sm:w-40 md:w-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-white aspect-square">
              <OptimizedImage
                asset="reception/anne-ragui"
                alt="Portrait of Anne Ragui, Receptionist at Karen Surgery"
                objectPosition="55% 28%"
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>01 · {OPENING_HOURS.reception.title}</span>
              </p>
              <h2 className="mt-1.5 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                {OPENING_HOURS.reception.personName}
              </h2>
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {OPENING_HOURS.reception.subtitle}
              </p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2 max-w-xl">
                {OPENING_HOURS.reception.schedule.map((row) => (
                  <div
                    key={row.days}
                    className="rounded-xl border border-[var(--color-border)] bg-white px-4 py-3"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                      {row.days}
                    </dt>
                    <dd className="mt-1 font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)] tabular-nums">
                      {row.hours}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex flex-wrap gap-2.5 tabular-nums">
                {PRACTICE.contact.receptionPhones.map((phone) => (
                  <a
                    key={phone.tel}
                    href={`tel:${phone.tel}`}
                    className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
                  >
                    <Phone className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
                    <span>{phone.display}</span>
                  </a>
                ))}
              </div>
            </div>
          </article>

          {/* 2. DOCTORS' CONSULTING HOURS & 5. OTHER HEALTH PROFESSIONALS */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Doctors' Consulting Hours */}
            <article className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  <Stethoscope className="h-4 w-4" aria-hidden="true" />
                  <span>02 · Routine &amp; Afternoon Urgent Care</span>
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  {OPENING_HOURS.doctorsConsulting.title}
                </h2>

                <table className="mt-5 w-full text-left text-sm border-collapse">
                  <caption className="visually-hidden">Doctors&apos; consulting hours schedule</caption>
                  <tbody>
                    {OPENING_HOURS.doctorsConsulting.schedule.map((row) => (
                      <tr key={row.days} className="border-b border-[var(--color-border)]">
                        <th scope="row" className="py-3.5 pr-4 font-semibold text-[var(--color-ink)]">
                          {row.days}
                        </th>
                        <td className="py-3.5 text-right font-medium text-[var(--color-ink-muted)] tabular-nums">
                          {row.hours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 rounded-xl bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]">
                {OPENING_HOURS.doctorsConsulting.note}
              </p>
            </article>

            {/* Other Health Professionals */}
            <article className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span>03 · Mental Health, Physio &amp; Allied Health</span>
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  {OPENING_HOURS.otherProfessionals.title}
                </h2>

                <table className="mt-5 w-full text-left text-sm border-collapse">
                  <caption className="visually-hidden">Other health professionals consulting hours</caption>
                  <tbody>
                    {OPENING_HOURS.otherProfessionals.schedule.map((row) => (
                      <tr key={row.days} className="border-b border-[var(--color-border)]">
                        <th scope="row" className="py-3.5 pr-4 font-semibold text-[var(--color-ink)]">
                          {row.days}
                        </th>
                        <td className="py-3.5 text-right font-medium text-[var(--color-ink-muted)] tabular-nums">
                          {row.hours}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 space-y-3">
                <p className="rounded-xl bg-[var(--color-surface)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {OPENING_HOURS.otherProfessionals.note}
                </p>
                <Link href="/team/" className="btn-pill btn-pill-secondary">
                  <span>View Practitioner Emails</span>
                </Link>
              </div>
            </article>
          </div>

          {/* 3. DOCTORS' AFTER HOURS SERVICE (Daylight 7am-7pm, 365 days) */}
          <article className="ks-card rounded-2xl border border-[#C6D4C1] bg-[var(--color-surface-elevated)] p-6 sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-forest-deep)]">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>04 · Urgent Daylight Cover</span>
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  {OPENING_HOURS.doctorsAfterHours.title}
                </h2>
                <p className="mt-2.5 text-base font-medium text-[var(--color-ink)]">
                  {OPENING_HOURS.doctorsAfterHours.availability}
                </p>
                <p className="mt-1.5 text-sm text-[var(--color-ink-muted)]">
                  {OPENING_HOURS.doctorsAfterHours.instruction}
                </p>
              </div>

              <a
                href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
                className="btn-pill btn-pill-emergency tabular-nums shrink-0 self-start lg:self-center"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>Emergency Phone: {PRACTICE.contact.emergencyPhone.shortDisplay}</span>
              </a>
            </div>
          </article>

          {/* 4. NIGHT CALLS POLICY + AMBULANCE SERVICES */}
          <article
            id="night-calls"
            className="ks-card rounded-2xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] p-6 sm:p-8 scroll-mt-24"
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-emergency)]">
              <Moon className="h-4 w-4" aria-hidden="true" />
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span>05 · Night Calls Policy &amp; Emergency Medical Services</span>
            </div>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
              {OPENING_HOURS.nightCalls.title}
            </h2>
            <p className="mt-2.5 text-base font-semibold text-[var(--color-ink)] max-w-3xl">
              {OPENING_HOURS.nightCalls.policy}
            </p>
            <p className="mt-4 text-sm font-medium text-[var(--color-ink-muted)]">
              {OPENING_HOURS.nightCalls.ambulanceIntro}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PRACTICE.openingHoursAmbulances.map((service) => (
                <div
                  key={service.provider}
                  className="rounded-xl border border-[var(--color-emergency-border)] bg-white p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-emergency)]">
                    {service.provider}
                  </p>
                  <div className="mt-2 flex flex-col gap-1.5 tabular-nums">
                    {service.numbers.map((num) => (
                      <a
                        key={num.tel}
                        href={`tel:${num.tel}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)] hover:text-[var(--color-emergency)] underline-offset-4 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--color-emergency)]" aria-hidden="true" />
                        <span>{num.display}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
