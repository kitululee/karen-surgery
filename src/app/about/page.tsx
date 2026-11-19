import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PRACTICE } from "@/data/practice";
import { PageHero } from "@/components/PageHero";
import { OptimizedImage } from "@/components/OptimizedImage";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "About the Practice",
  description:
    "Established in 1991 to serve the Karen and Langata community, Karen Surgery is an independent family medical practice committed to personal, comprehensive, collaborative, and cost-effective care.",
  path: "/about/",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "About the Practice" }]}
        eyebrow="Established 1991 · Karen, Nairobi"
        title="Health Care the way it should be."
        description="Founded in 1991 as a traditional general practice serving Karen and Langata, Karen Surgery remains owned and run by doctors and a psychologist with a long-term commitment to our patients and community."
        actions={
          <>
            <Link href="/team/" className="btn-pill btn-pill-primary">
              <span>Meet Our Team</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Contact Us</span>
            </Link>
          </>
        }
      />

      {/* History & Continuity Narrative */}
      <section className="py-14 sm:py-20 bg-white">
        <div className="site-container grid gap-10 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Our Heritage &amp; Philosophy
            </p>
            <h2 className="type-section-title text-[var(--color-ink)]">
              Long-term family medicine rooted in trust and continuity.
            </h2>
            {PRACTICE.historyParagraphs.map((paragraph, idx) => (
              <p
                key={idx}
                className="text-base leading-[1.75] text-[var(--color-ink-muted)] max-w-[62ch]"
              >
                {paragraph}
              </p>
            ))}

            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/doctors/" className="btn-pill btn-pill-secondary">
                <span>Doctors &amp; Practice Nurse</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/location/" className="btn-pill btn-pill-secondary">
                <span>Where to Find Us</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <OptimizedImage
                asset="practice/karen-surgery-building"
                alt="Karen Surgery building surrounded by trees at 333 Ngong Road, Karen"
                className="w-full h-auto object-cover"
              />
              <figcaption className="px-5 py-3 text-xs text-[var(--color-ink-muted)] bg-white border-t border-[var(--color-border)]">
                Karen Surgery — 333 Ngong Road, Karen, 333 metres from the Karen roundabout.
              </figcaption>
            </figure>

            <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <OptimizedImage
                asset="practice/karen-surgery-entrance"
                alt="Veranda entrance to Karen Surgery with ferns and red timber doors"
                className="w-full h-auto object-cover"
              />
              <figcaption className="px-5 py-3 text-xs text-[var(--color-ink-muted)] bg-white border-t border-[var(--color-border)]">
                The welcoming veranda entrance to the surgery.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Four Pillars of Care (Full Verbatim List) */}
      <section className="py-14 sm:py-20 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="site-container">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Our Core Values
            </p>
            <h2 className="type-section-title mt-2 text-[var(--color-ink)]">
              Four pillars guiding every consultation.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PRACTICE.carePillars.map((pillar) => (
              <article
                key={pillar.number}
                className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  Pillar {pillar.number}
                </p>
                <h3 className="mt-2 font-[var(--font-display)] text-xl font-semibold text-[var(--color-ink)]">
                  {pillar.title}
                </h3>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-forest)]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Notice */}
      <section className="py-14 bg-white">
        <div className="site-container">
          <EmergencyBand />
        </div>
      </section>
    </>
  );
}
