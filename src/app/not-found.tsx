import Link from "next/link";
import { ArrowLeft, Phone } from "lucide-react";
import { EmergencyBand } from "@/components/EmergencyBand";

export default function NotFound() {
  return (
    <section className="pt-32 pb-20">
      <div className="site-container max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
          Page Not Found · 404
        </p>
        <h1 className="type-page-title mt-3 text-[var(--color-ink)]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-muted)]">
          The page you are looking for may have moved or no longer exists. Use the links below to
          find our doctors, opening hours, medical services, or reception contact details.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="btn-pill btn-pill-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return Home</span>
          </Link>
          <Link href="/opening-hours/" className="btn-pill btn-pill-secondary">
            <span>Opening Hours</span>
          </Link>
          <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Contact Us</span>
          </Link>
        </div>

        <div className="mt-12">
          <EmergencyBand compact />
        </div>
      </div>
    </section>
  );
}
