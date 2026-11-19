import Link from "next/link";
import { ExternalLink, Info, ShieldAlert, Syringe } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { MEDICAL_INFO_DATA } from "@/data/medical-info";
import { PageHero } from "@/components/PageHero";
import { ExpandableFigure } from "@/components/ExpandableFigure";

export const metadata = buildMetadata({
  title: "Medical Information",
  description:
    "Vaccination notices, child and adolescent immunisation reference schedules, HPV vaccine guidance, recommended health & travel resources, and Karen Surgery's medical advisory disclaimer.",
  path: "/medical-info/",
});

export default function MedicalInfoPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Patient Information" },
          { label: "Medical Information" },
        ]}
        eyebrow="Patient Health Resources"
        title="Medical Information"
        description="Immunisation guidance, vaccine information, and recommended international health, travel, and dietary references curated by Karen Surgery."
        actions={
          <Link href="/contact-us/" className="btn-pill btn-pill-primary">
            <span>Ask Our Doctors / Reception</span>
          </Link>
        }
      />

      {/* Vaccine & Immunisation Notes */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {MEDICAL_INFO_DATA.notices.map((notice) => (
              <article
                key={notice.title}
                className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 flex flex-col justify-between"
              >
                <div>
                  <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                    <Syringe className="h-4 w-4" aria-hidden="true" />
                    <span>Vaccination Notice</span>
                  </p>
                  <h2 className="mt-2 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                    {notice.title}
                  </h2>
                  <p className="mt-3 text-[0.96875rem] leading-[1.7] text-[var(--color-ink-muted)]">
                    {notice.body}
                  </p>
                </div>
                <p className="mt-5 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-muted)] flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                  <span>{notice.note}</span>
                </p>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-6 sm:p-8 max-w-4xl">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
              Child &amp; Adolescent Immunisation Schedules
            </h2>
            <p className="mt-3 text-base leading-[1.75] text-[var(--color-ink-muted)]">
              {MEDICAL_INFO_DATA.immunisationIntro}
            </p>
          </div>
        </div>
      </section>

      {/* Expandable Clinical Reference Charts */}
      <section className="py-12 sm:py-16 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="site-container space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Reference Charts
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Immunisation &amp; HPV Reference Guides
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
              Select &ldquo;Expand full view&rdquo; on either guide to read the detailed tables
              comfortably.
            </p>
          </div>

          <div className="space-y-8">
            {MEDICAL_INFO_DATA.graphics.map((graphic) => (
              <ExpandableFigure
                key={graphic.id}
                asset={graphic.image}
                title={graphic.title}
                alt={graphic.alt}
                caption={graphic.caption}
                sourceNote={graphic.sourceNote}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recommended External Sites */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Trusted Reading
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Recommended Sites for Health Information &amp; Advice
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {MEDICAL_INFO_DATA.recommendedLinks.map((group) => (
              <div
                key={group.category}
                className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7"
              >
                <h3 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                  {group.category}
                </h3>
                <ul className="mt-4 space-y-4">
                  {group.items.map((item) => (
                    <li
                      key={item.href}
                      className="border-t border-[var(--color-border)] pt-4 first:border-t-0 first:pt-0"
                    >
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        lang={"lang" in item ? item.lang : undefined}
                        className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-forest)] hover:text-[var(--color-ink)] underline-offset-4 hover:underline"
                      >
                        <span>{item.label}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </a>
                      <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                        {item.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Medical Advisory Disclaimer (Verbatim, Prominent) */}
      <section id="disclaimer" className="py-12 sm:py-16 bg-[var(--color-surface)] scroll-mt-24">
        <div className="site-container">
          <aside
            aria-label="Medical advisory disclaimer"
            className="rounded-2xl border border-[var(--color-border-strong)] bg-white p-6 sm:p-8"
          >
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
              <ShieldAlert className="h-4 w-4 text-[var(--color-forest)]" aria-hidden="true" />
              <span>Important Medical Advisory Notice</span>
            </p>
            <p className="mt-3 text-base leading-[1.75] text-[var(--color-ink-muted)] max-w-[75ch]">
              {MEDICAL_INFO_DATA.disclaimer}
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
