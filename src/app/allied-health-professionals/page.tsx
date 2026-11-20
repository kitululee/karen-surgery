import Link from "next/link";
import { Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { ALLIED_HEALTH_INTRO, getPractitionersByDepartment } from "@/data/team";
import { PageHero } from "@/components/PageHero";
import { PractitionerCard } from "@/components/PractitionerCard";
import { EmergencyBand } from "@/components/EmergencyBand";
import { AppointmentTriggerButton } from "@/components/AppointmentTriggerButton";

export const metadata = buildMetadata({
  title: "Allied Health Professionals",
  description:
    "Podiatrists, massage therapists, and a registered nutritionist consulting at Karen Surgery as part of our multidisciplinary team.",
  path: "/allied-health-professionals/",
});

export default function AlliedHealthPage() {
  const team = getPractitionersByDepartment("allied-health");

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Services", href: "/services/" },
          { label: "Allied Health Professionals" },
        ]}
        eyebrow="Multidisciplinary Care"
        title="Allied Health Professionals"
        description={ALLIED_HEALTH_INTRO}
        actions={
          <>
            <AppointmentTriggerButton
              label="Request Appointment"
              variant="primary"
              serviceSlug="allied-health"
            />
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Reception Enquiries</span>
            </Link>
          </>
        }
      />

      <section className="py-12 sm:py-16 bg-[var(--color-surface)]">
        <div className="site-container space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Podiatry, Massage Therapy &amp; Nutrition
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Consulting Allied Health Practitioners
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
