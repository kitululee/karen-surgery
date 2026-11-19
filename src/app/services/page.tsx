import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { SERVICES_OVERVIEW } from "@/data/services";
import { PageHero } from "@/components/PageHero";
import { ServiceIcon } from "@/components/ServiceIcon";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "Medical Services",
  description:
    "Explore Karen Surgery's multidisciplinary medical services in Karen, Nairobi: Family Medicine, Ultrasound, Mental Health, Physiotherapy, Allied Health, and Laboratory Services.",
  path: "/services/",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Services" }]}
        eyebrow="Integrated Multidisciplinary Practice"
        title="Medical & Allied Health Services"
        description="Karen Surgery brings together primary care general practitioners, nursing, on-site ultrasound imaging, mental health, physiotherapy, allied health practitioners, and partner laboratory collection in one calm venue."
        actions={
          <>
            <Link href="/opening-hours/" className="btn-pill btn-pill-primary">
              <span>Opening Hours</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Contact Reception</span>
            </Link>
          </>
        }
      />

      <section className="py-14 sm:py-20 bg-white">
        <div className="site-container space-y-6">
          {SERVICES_OVERVIEW.map((service) => (
            <article
              key={service.slug}
              className="ks-card grid gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 lg:grid-cols-12 lg:items-center"
            >
              <div className="lg:col-span-7">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-forest)] shrink-0">
                    <ServiceIcon name={service.icon} className="h-5 w-5" />
                  </span>
                  <h2 className="font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                    {service.title}
                  </h2>
                </div>
                <p className="mt-4 text-base leading-relaxed text-[var(--color-ink-muted)] max-w-[60ch]">
                  {service.description}
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-between gap-5 lg:border-l lg:border-[var(--color-border)] lg:pl-7">
                <ul className="space-y-2.5 text-sm text-[var(--color-ink-muted)]">
                  {service.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="h-4 w-4 mt-0.5 shrink-0 text-[var(--color-forest)]"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div>
                  <Link href={service.href} className="btn-pill btn-pill-primary">
                    <span>Explore {service.shortTitle}</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
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
