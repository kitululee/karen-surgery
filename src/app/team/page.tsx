import Link from "next/link";
import { Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/PageHero";
import { TeamDirectoryClient } from "@/components/TeamDirectoryClient";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "Our Team",
  description:
    "Meet the 19 doctors, practice nurse, consultant radiologist, clinical psychologist, counsellors, physiotherapists, allied health professionals, and support staff at Karen Surgery.",
  path: "/team/",
});

export default function TeamPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Our Team" }]}
        eyebrow="Multidisciplinary Practice Directory"
        title="Our Clinicians & Practice Team"
        description="Browse every doctor, nurse, specialist, therapist, and practice staff member at Karen Surgery. Filter by department or search by name or clinical focus."
        actions={
          <Link href="/contact-us/" className="btn-pill btn-pill-primary">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Contact Reception</span>
          </Link>
        }
      />

      <section className="py-12 sm:py-16 bg-white">
        <div className="site-container">
          <TeamDirectoryClient />
        </div>
      </section>

      <section className="py-12 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="site-container">
          <EmergencyBand />
        </div>
      </section>
    </>
  );
}
