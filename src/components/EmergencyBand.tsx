import Link from "next/link";
import { AlertTriangle, ArrowRight, Phone } from "lucide-react";
import { PRACTICE } from "@/data/practice";

export function EmergencyBand({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-label="Emergency medical contacts"
      className="rounded-2xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-emergency)]">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>In an Emergency — Not for Routine Bookings</span>
          </p>
          <h2 className="mt-2 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)] sm:text-2xl">
            {PRACTICE.contact.emergencyBannerText}
          </h2>
          {!compact ? (
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
              Doctors&apos; after-hours service operates during{" "}
              <strong className="font-semibold text-[var(--color-ink)]">
                daylight hours only (7:00 am – 7:00 pm), 365 days a year
              </strong>{" "}
              including public holidays. For security reasons, we no longer do night calls.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
            className="btn-pill btn-pill-emergency tabular-nums"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>Emergency: {PRACTICE.contact.emergencyPhone.display}</span>
          </a>
          <Link href="/contact-us/#emergency" className="btn-pill btn-pill-secondary">
            <span>Ambulance Numbers</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
