import Link from "next/link";
import { Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getPractitionersByDepartment, PHYSIOTHERAPY_INTRO } from "@/data/team";
import { PageHero } from "@/components/PageHero";
import { PhysioFilterList } from "@/components/PhysioFilterList";
import { EmergencyBand } from "@/components/EmergencyBand";
import { AppointmentTriggerButton } from "@/components/AppointmentTriggerButton";

export const metadata = buildMetadata({
  title: "Physiotherapy",
  description:
    "Four internationally trained physiotherapists at Karen Surgery specialising in sports injuries, manual therapy, neuro-rehabilitation, paediatric physiotherapy, pelvic health, and acupuncture.",
  path: "/physiotherapy/",
});

export default function PhysiotherapyPage() {
  const team = getPractitionersByDepartment("physiotherapy");

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Services", href: "/services/" },
          { label: "Physiotherapy" },
        ]}
        eyebrow="Rehabilitation & Manual Therapy"
        title="Physiotherapists"
        description="Diverse international training across Kenya, Australia, Canada, and the UK — with direct self-referral or GP-coordinated rehabilitation under one roof."
        actions={
          <>
            <AppointmentTriggerButton
              label="Request Appointment"
              variant="primary"
              serviceSlug="physiotherapy"
            />
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Reception Enquiries</span>
            </Link>
          </>
        }
      />

      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container max-w-4xl space-y-4 text-base leading-[1.75] text-[var(--color-ink-muted)]">
          {PHYSIOTHERAPY_INTRO.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-[var(--color-surface)]">
        <div className="site-container space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Filter by Specialisation
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Meet Our Physiotherapy Team
            </h2>
          </div>

          <PhysioFilterList practitioners={team} />
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
