import Link from "next/link";
import { Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getPractitionersByDepartment, MENTAL_HEALTH_INTRO } from "@/data/team";
import { PageHero } from "@/components/PageHero";
import { PractitionerCard } from "@/components/PractitionerCard";
import { EmergencyBand } from "@/components/EmergencyBand";
import { AppointmentTriggerButton } from "@/components/AppointmentTriggerButton";

export const metadata = buildMetadata({
  title: "Mental Health",
  description:
    "Multidisciplinary mental health care at Karen Surgery with Clinical Psychologist Dr. Tonya Shaw and Counsellors Judy Gitau and Kaye Alianda McIlwaine. GP referrals and self-referrals welcome.",
  path: "/mental-health/",
});

export default function MentalHealthPage() {
  const team = getPractitionersByDepartment("mental-health");

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Services", href: "/services/" },
          { label: "Mental Health" },
        ]}
        eyebrow="Discreet, Multidisciplinary Support"
        title="Mental Health at Karen Surgery"
        description="Psychologists and counsellors working collaboratively alongside our General Practitioners to support children, adolescents, adults, and families."
        tone="sage"
        actions={
          <Link href="/contact-us/" className="btn-pill btn-pill-primary">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Reception Enquiries</span>
          </Link>
        }
      />

      {/* Authoritative Service Overview */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-4 text-base leading-[1.75] text-[var(--color-ink-muted)] max-w-[65ch]">
            {MENTAL_HEALTH_INTRO.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          <aside className="lg:col-span-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 space-y-4 self-start">
            <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
              Referrals &amp; Appointments
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Patients may be referred by a Karen Surgery GP or self-refer directly. You can contact
              any mental health professional directly using the email or telephone listed on their
              profile below, or book through reception.
            </p>
            <div className="pt-2 flex flex-col gap-2.5">
              <AppointmentTriggerButton
                label="Request Appointment"
                variant="primary"
                serviceSlug="mental-health"
                className="w-full"
              />
              <Link href="/opening-hours/" className="btn-pill btn-pill-secondary w-full">
                <span>View Practice Hours</span>
              </Link>
              <Link href="/contact-us/" className="btn-pill btn-pill-secondary w-full">
                <span>Contact Reception</span>
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Mental Health Professionals Directory */}
      <section className="py-12 sm:py-16 bg-[var(--color-surface)]">
        <div className="site-container space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Psychologist &amp; Counsellors
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Mental Health Professionals
            </h2>
          </div>

          <div className="space-y-6">
            {team.map((person) => (
              <PractitionerCard key={person.id} practitioner={person} />
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
