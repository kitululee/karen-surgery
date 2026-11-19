import Link from "next/link";
import { CalendarClock, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getPractitionersByDepartment, PRACTITIONERS } from "@/data/team";
import { PageHero } from "@/components/PageHero";
import { PractitionerCard } from "@/components/PractitionerCard";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "Doctors & Medical Staff",
  description:
    "Meet the General Practitioners, Practice Nurse, Consultant Radiologist (Ultrasound Services), and Office Assistant at Karen Surgery, Nairobi.",
  path: "/doctors/",
});

export default function DoctorsPage() {
  const doctorsAndNurse = getPractitionersByDepartment("doctors");
  const radiology = getPractitionersByDepartment("radiology");
  const eunice = PRACTITIONERS.find((p) => p.id === "eunice-muthoni-mugo");

  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Our Team", href: "/team/" },
          { label: "Doctors & Medical Staff" },
        ]}
        eyebrow="Family Medicine, Nursing & Ultrasound"
        title="Doctors & Medical Staff"
        description="Our General Practitioners, Practice Nurse, Consultant Radiologist, and practice support team provide continuous primary care for individuals and multi-generational families."
        actions={
          <>
            <Link href="/opening-hours/" className="btn-pill btn-pill-primary">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              <span>Consulting Hours</span>
            </Link>
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Book via Reception</span>
            </Link>
          </>
        }
      />

      {/* Quick In-Page Jump Links */}
      <nav
        aria-label="Doctors page sections"
        className="border-b border-[var(--color-border)] bg-white"
      >
        <div className="site-container py-3 flex flex-wrap gap-2">
          <a
            href="#gps-and-nurse"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
          >
            GPs &amp; Practice Nurse
          </a>
          <a
            href="#ultrasound"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
          >
            Ultrasound Services (Dr. Z. A. Kaka)
          </a>
          <a
            href="#office-assistant"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs font-semibold text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
          >
            Office Assistant
          </a>
        </div>
      </nav>

      {/* General Practitioners & Practice Nurse */}
      <section id="gps-and-nurse" className="py-12 sm:py-16 bg-white scroll-mt-24">
        <div className="site-container space-y-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Primary Care Team
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              General Practitioners &amp; Practice Nurse
            </h2>
          </div>

          <div className="space-y-6">
            {doctorsAndNurse.map((person) => (
              <PractitionerCard key={person.id} practitioner={person} />
            ))}
          </div>
        </div>
      </section>

      {/* Ultrasound Services Spotlight */}
      <section
        id="ultrasound"
        className="py-12 sm:py-16 bg-[var(--color-surface)] border-y border-[var(--color-border)] scroll-mt-24"
      >
        <div className="site-container space-y-6">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              On-Site Diagnostic Imaging
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Ultrasound Services now offered at Karen Surgery
            </h2>
          </div>

          <div className="space-y-6">
            {radiology.map((person) => (
              <PractitionerCard key={person.id} practitioner={person} />
            ))}
          </div>
        </div>
      </section>

      {/* Office Assistant */}
      {eunice ? (
        <section id="office-assistant" className="py-12 sm:py-16 bg-white scroll-mt-24">
          <div className="site-container space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                Practice Support
              </p>
              <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
                Office Assistant
              </h2>
            </div>

            <PractitionerCard practitioner={eunice} />
          </div>
        </section>
      ) : null}

      <section className="py-12 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="site-container">
          <EmergencyBand />
        </div>
      </section>
    </>
  );
}
