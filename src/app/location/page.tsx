import Link from "next/link";
import { Compass, ExternalLink, MapPin, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PRACTICE } from "@/data/practice";
import { PageHero } from "@/components/PageHero";
import { ExpandableFigure } from "@/components/ExpandableFigure";
import { OptimizedImage } from "@/components/OptimizedImage";
import { EmergencyBand } from "@/components/EmergencyBand";

export const metadata = buildMetadata({
  title: "Where to Find Us",
  description:
    "Karen Surgery is located at 333 Ngong Road, Karen, Kenya — 333 metres from the Karen roundabout. View our interactive Google Map, directions, and schematic landmark map.",
  path: "/location/",
});

export default function LocationPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[
          { label: "Patient Information" },
          { label: "Where to Find Us" },
        ]}
        eyebrow="333 Ngong Road, Karen, Nairobi"
        title="Where to Find Us"
        description="Surgery is at 333 Ngong Road, Karen, Kenya. We are 333 metres from the Karen roundabout."
        actions={
          <>
            <a
              href={PRACTICE.address.googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-primary"
            >
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>Open in Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
            <Link href="/contact-us/" className="btn-pill btn-pill-secondary">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Contact Us</span>
            </Link>
          </>
        }
      />

      {/* Interactive Map + Address Details */}
      <section className="py-12 sm:py-16 bg-white border-b border-[var(--color-border)]">
        <div className="site-container grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-6">
            <div className="ks-card rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-7 space-y-4">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>Physical &amp; Postal Address</span>
              </p>
              <address className="not-italic text-base leading-relaxed text-[var(--color-ink)]">
                <strong className="font-semibold block">{PRACTICE.name}</strong>
                {PRACTICE.address.street}
                <br />
                {PRACTICE.address.poBox}
                <br />
                {PRACTICE.address.city}, {PRACTICE.address.country}
              </address>
              <p className="text-sm text-[var(--color-ink-muted)] border-t border-[var(--color-border)] pt-4">
                <strong className="font-semibold text-[var(--color-ink)]">Landmark:</strong>{" "}
                We are 333 metres from the Karen roundabout along Ngong Road heading towards Ngong,
                opposite Talisman and just past Karen Shopping Centre.
              </p>
              <p className="text-xs text-[var(--color-ink-muted)] tabular-nums">
                GPS Coordinates: {PRACTICE.address.coordinates.lat}, {PRACTICE.address.coordinates.lng}
              </p>
            </div>

            <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              <OptimizedImage
                asset="practice/karen-surgery-entrance"
                alt="Karen Surgery entrance veranda at 333 Ngong Road, Karen"
                className="w-full h-auto object-cover"
              />
              <figcaption className="px-5 py-3 text-xs text-[var(--color-ink-muted)] border-t border-[var(--color-border)]">
                Look for the dark olive timber clinic building with red doors and windows set among
                mature trees at 333 Ngong Road.
              </figcaption>
            </figure>
          </div>

          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] min-h-[24rem] flex-1">
              <iframe
                title="Interactive Google Map showing Karen Surgery at 333 Ngong Road, Karen, Nairobi"
                src={PRACTICE.address.googleMapsEmbedUrl}
                width="800"
                height="520"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[24rem] w-full border-0"
              />
            </div>
            <p className="text-xs text-[var(--color-ink-muted)]">
              Need turn-by-turn navigation on your phone?{" "}
              <a
                href={PRACTICE.address.googleMapsDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-forest)] underline underline-offset-4 hover:text-[var(--color-ink)]"
              >
                Launch Google Maps Directions to 333 Ngong Road, Karen
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Original Schematic Landmark Map */}
      <section className="py-12 sm:py-16 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <div className="site-container space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Local Landmark Guide
            </p>
            <h2 className="type-section-title mt-1.5 text-[var(--color-ink)]">
              Karen Roundabout Schematic Map
            </h2>
          </div>

          <ExpandableFigure
            asset="location/karen-surgery-directions-map"
            title="Karen Surgery Schematic Street Map"
            alt="Schematic street map of the Karen Roundabout intersection showing Langata Road to Langata and Dagoretti, Ngong Road to Town and Ngong, Karen Police Station, Karen Shopping Centre, Talisman, and Karen Surgery located 333 metres from Karen Roundabout along Ngong Road."
            caption="From Karen Roundabout, head along Ngong Road towards Ngong past Karen Shopping Centre. Karen Surgery is on the left, 333 metres from the roundabout (near Talisman)."
          />
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="site-container">
          <EmergencyBand compact />
        </div>
      </section>
    </>
  );
}
