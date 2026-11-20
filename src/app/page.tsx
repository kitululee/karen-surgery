import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  MapPin,
  MessageCircle,
  Phone,
  Search,
} from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { PRACTICE } from "@/data/practice";
import { SERVICES_OVERVIEW } from "@/data/services";
import { OPENING_HOURS } from "@/data/hours";
import { PRACTITIONERS } from "@/data/team";
import { OptimizedImage } from "@/components/OptimizedImage";
import { PillarsCarousel } from "@/components/PillarsCarousel";
import { ServiceIcon } from "@/components/ServiceIcon";
import { EmergencyBand } from "@/components/EmergencyBand";
import { AppointmentTriggerButton } from "@/components/AppointmentTriggerButton";

export const metadata = buildMetadata({
  title: PRACTICE.name,
  description:
    "Karen Surgery: Health Care the way it should be. Established in 1991 at 333 Ngong Road, Karen, Nairobi — General Practitioners, Practice Nurse, Ultrasound, Mental Health, Physiotherapy, Allied Health, and Laboratory Services.",
  path: "/",
});

const HERO_FACTS = [
  { value: "1991", label: "Serving Karen & Nairobi" },
  { value: "333m", label: "From Karen Roundabout" },
  { value: "7am–7pm", label: "365-Day Daylight Urgent Cover" },
  { value: "6", label: "Integrated Clinical Disciplines" },
];

const FEATURED_TEAM_IDS = [
  "dr-margriet-van-unen",
  "dr-marie-louise-cantamessa",
  "dr-jacqueline-kitulu",
  "mrs-hannah-murimi",
  "dr-z-a-kaka",
  "dr-tonya-shaw",
];

export default function HomePage() {
  const featuredTeam = FEATURED_TEAM_IDS.map((id) =>
    PRACTITIONERS.find((p) => p.id === id)
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      {/* BAND 1 — Full-Bleed Architectural Hero (inspired by SYNORA composition + Karen Surgery building) */}
      <section className="relative min-h-[88svh] flex flex-col justify-between overflow-hidden bg-[#172119] text-white">
        {/* Authentic Karen Surgery Woodland Building Backdrop — LCP Image */}
        <div className="absolute inset-0">
          <OptimizedImage
            asset="practice/karen-surgery-building"
            alt="Karen Surgery timber clinic building surrounded by indigenous trees and ferns at 333 Ngong Road, Karen, Nairobi"
            priority
            objectPosition="64% 48%"
            className="h-full w-full object-cover"
          />
          {/* Atmospheric left-to-right editorial scrim keeping text ultra-legible while revealing the building & red doors */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#111812]/90 via-[#162018]/72 to-[#162018]/36"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#0E140F]/82 via-transparent to-[#0E140F]/45"
            aria-hidden="true"
          />
        </div>

        {/* Hero Main Content */}
        <div className="relative z-10 site-container flex-1 flex flex-col justify-between pt-28 pb-10 sm:pt-36 sm:pb-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center my-auto py-6 sm:py-10">
            {/* Left Editorial Headline + Dual Pill CTAs */}
            <div className="lg:col-span-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#CFE3CA]">
                Family Medical Practice · 333 Ngong Road, Karen · Est. 1991
              </p>

              <h1 className="type-hero-display mt-4 uppercase text-white">
                <span className="block">Karen Surgery:</span>
                <span className="mt-1 inline-flex flex-wrap items-center gap-x-3 gap-y-2">
                  {/* Inline rounded entrance photo pill — signature editorial detail from SYNORA */}
                  <span
                    className="inline-block h-[0.82em] w-[1.45em] overflow-hidden rounded-xl border border-white/40 align-middle shadow-md shrink-0"
                    aria-hidden="true"
                  >
                    <OptimizedImage
                      asset="practice/karen-surgery-entrance"
                      alt=""
                      priority
                      objectPosition="50% 50%"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span>Health Care</span>
                </span>
                <span className="block mt-1">The Way It Should Be.</span>
              </h1>

              {/* Dual Pill CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/contact-us/" className="btn-pill btn-pill-primary !bg-[#0E130F] !border-white/20 hover:!bg-[var(--color-forest)]">
                  <CalendarClock className="h-4 w-4" aria-hidden="true" />
                  <span>Contact &amp; Appointments</span>
                </Link>
                <Link href="/team/" className="btn-pill btn-pill-ghost-light">
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span>Meet Our Team</span>
                </Link>
                <a
                  href={PRACTICE.contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill !bg-white/14 !text-white !border-white/35 backdrop-blur-sm hover:!bg-white/24"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>WhatsApp Reception</span>
                </a>
              </div>
            </div>

            {/* Right-Aligned Factual Practice Anchors (100% verified source facts) */}
            <aside
              aria-label="Practice highlights"
              className="lg:col-span-4 lg:text-right border-t border-white/20 pt-6 lg:border-t-0 lg:pt-0"
            >
              <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-1 lg:gap-7">
                {HERO_FACTS.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs font-medium tracking-wide text-white/75 order-2">
                      {fact.label}
                    </dt>
                    <dd className="font-[var(--font-display)] text-2xl font-medium tracking-tight text-white sm:text-3xl tabular-nums">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>

          {/* Grounded Bottom Hero Row */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between border-t border-white/15 pt-6">
            <p className="max-w-lg text-sm leading-relaxed text-white/85">
              Primary care family medicine for people of all ages alongside mental health
              professionals, physiotherapists, ultrasound imaging, allied health specialists, and
              partner laboratory services in Karen, Nairobi.
            </p>
            <a
              href="#pillars"
              aria-label="Scroll to care pillars"
              className="inline-flex h-11 w-16 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors shrink-0 self-start sm:self-auto"
            >
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* BAND 2 — 4 Editorial Care Pillars Carousel */}
      <div id="pillars">
        <PillarsCarousel />
      </div>

      {/* BAND 3 — Multidisciplinary Services Grid (SYNORA-inspired soft neutral specialty tiles) */}
      <section className="py-16 sm:py-24 border-t border-[var(--color-border)] bg-white">
        <div className="site-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                Multidisciplinary Care In One Venue
              </p>
              <h2 className="type-section-title mt-2.5 text-[var(--color-ink)]">
                Comprehensive care across every practice discipline.
              </h2>
              <p className="mt-3 text-[0.96875rem] leading-relaxed text-[var(--color-ink-muted)]">
                General practitioners, our practice nurse, radiologist, psychologists,
                physiotherapists, and allied health professionals collaborate directly under one
                roof.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link href="/opening-hours/" className="btn-pill btn-pill-primary">
                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                <span>Opening Hours</span>
              </Link>
              <Link href="/services/" className="btn-pill btn-pill-secondary">
                <span>Explore All Services</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES_OVERVIEW.map((service) => (
              <Link
                key={service.slug}
                href={service.href}
                className="ks-card group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 no-underline transition-colors hover:border-[var(--color-forest)] hover:bg-[#EFF3EC]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white text-[var(--color-forest)] shadow-xs">
                      <ServiceIcon name={service.icon} className="h-5 w-5" />
                    </span>
                    <ArrowUpRight
                      className="h-4 w-4 text-[var(--color-ink-muted)] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-ink)]"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="mt-5 font-[var(--font-display)] text-lg font-semibold text-[var(--color-ink)]">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                    {service.description}
                  </p>
                </div>

                <p className="mt-5 pt-4 border-t border-[var(--color-border)] text-xs font-semibold uppercase tracking-[0.11em] text-[var(--color-forest)]">
                  View {service.shortTitle}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BAND 4 — Established in 1991 Heritage & Independent Care Split */}
      <section className="py-16 sm:py-24 bg-[var(--color-surface)] border-y border-[var(--color-border)]">
        <div className="site-container grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <figure className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
              <OptimizedImage
                asset="practice/karen-surgery-entrance"
                alt="The veranda entrance and red timber doors of Karen Surgery at 333 Ngong Road, Karen"
                className="w-full h-auto object-cover aspect-[3/2]"
              />
              <figcaption className="px-5 py-3 text-xs text-[var(--color-ink-muted)] bg-white border-t border-[var(--color-border)]">
                Karen Surgery veranda entrance — 333 Ngong Road, Karen, Nairobi.
              </figcaption>
            </figure>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              Rooted in Karen Since 1991
            </p>
            <h2 className="type-section-title text-[var(--color-ink)]">
              An independent family practice committed to its community.
            </h2>
            {PRACTICE.historyParagraphs.map((para, i) => (
              <p
                key={i}
                className="text-[0.96875rem] leading-[1.72] text-[var(--color-ink-muted)] max-w-[60ch]"
              >
                {para}
              </p>
            ))}

            <div className="rounded-xl border border-[var(--color-border)] bg-white p-5">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                Independent Practice &amp; Insurance Claim Forms
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                We are independent and do not deal directly with insurance companies, but we will
                complete your insurance claim forms — and offer subsidised lower-cost care for your
                domestic staff.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/about/" className="btn-pill btn-pill-primary">
                <span>About Karen Surgery</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* BAND 5 — Multidisciplinary Team Preview (Authentic Clinician Portraits) */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="site-container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between mb-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                Our Clinicians &amp; Staff
              </p>
              <h2 className="type-section-title mt-2.5 text-[var(--color-ink)]">
                Experienced doctors, nurses, and specialists who know your family.
              </h2>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <Link href="/doctors/" className="btn-pill btn-pill-secondary !text-xs">
                Doctors &amp; Nurse
              </Link>
              <Link href="/mental-health/" className="btn-pill btn-pill-secondary !text-xs">
                Mental Health
              </Link>
              <Link href="/physiotherapy/" className="btn-pill btn-pill-secondary !text-xs">
                Physiotherapy
              </Link>
              <Link href="/allied-health-professionals/" className="btn-pill btn-pill-secondary !text-xs">
                Allied Health
              </Link>
            </div>
          </div>

          <div className="grid gap-5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {featuredTeam.map((person) => (
              <Link
                key={person.id}
                href={`${person.departmentHref}#${person.id}`}
                className="group block no-underline"
              >
                <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] aspect-[4/5]">
                  <OptimizedImage
                    asset={person.image}
                    alt={`Portrait of ${person.name}, ${person.role}`}
                    objectPosition={person.imagePosition}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <h3 className="mt-3 font-[var(--font-display)] text-sm font-semibold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-forest)]">
                  {person.name}
                </h3>
                {person.qualifications ? (
                  <p className="mt-0.5 text-[0.7rem] font-medium leading-snug text-[var(--color-forest)]">
                    {person.qualifications}
                  </p>
                ) : null}
                <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">{person.role}</p>
              </Link>
            ))}
          </div>

          <div className="mt-10 flex justify-start">
            <Link href="/team/" className="btn-pill btn-pill-primary">
              <span>View All 19 Team Members</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* BAND 6 — Hours, Location & High-Visibility Emergency Care */}
      <section className="py-16 sm:py-24 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="site-container space-y-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Opening Hours Summary Card */}
            <div className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  Hours &amp; Appointments
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  Reception &amp; Consulting Hours
                </h2>

                <dl className="mt-6 space-y-4 divide-y divide-[var(--color-border)] text-sm">
                  <div className="pt-1">
                    <dt className="font-semibold text-[var(--color-ink)]">
                      Receptionist ({OPENING_HOURS.reception.personName})
                    </dt>
                    <dd className="mt-1 text-[var(--color-ink-muted)]">
                      Mon–Fri: 8:00 am – 4:30 pm · Sat: 9:00 am – 12:00 noon
                    </dd>
                  </div>
                  <div className="pt-4">
                    <dt className="font-semibold text-[var(--color-ink)]">
                      Doctors&apos; Consulting Hours
                    </dt>
                    <dd className="mt-1 text-[var(--color-ink-muted)]">
                      Mon–Fri: 8:00 am – 1:00 pm · Sat: 9:00 am – 12:00 noon
                      <br />
                      <span className="text-[var(--color-ink)] font-medium">
                        Mon–Fri Afternoons: Urgent cases only
                      </span>
                    </dd>
                  </div>
                  <div className="pt-4">
                    <dt className="font-semibold text-[var(--color-ink)]">
                      Other Health Professionals
                    </dt>
                    <dd className="mt-1 text-[var(--color-ink-muted)]">
                      Mon–Fri: 8:00 am – 4:30 pm · Sat: 9:00 am – 12:00 noon
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-7 pt-5 border-t border-[var(--color-border)] flex flex-wrap gap-3">
                <AppointmentTriggerButton label="Request Appointment" variant="primary" />
                <Link href="/opening-hours/" className="btn-pill btn-pill-secondary">
                  <span>Full Opening Hours</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Location & Direct Reception Contact Card */}
            <div className="ks-card rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
                  Finding Karen Surgery
                </p>
                <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-[var(--color-ink)]">
                  333 Ngong Road, Karen
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-muted)]">
                  We are located {PRACTICE.address.landmark}. Postal address:{" "}
                  {PRACTICE.address.poBox}, {PRACTICE.address.city}, {PRACTICE.address.country}.
                </p>

                <div className="mt-6 space-y-2.5 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                    Reception Telephone Lines
                  </p>
                  <div className="flex flex-wrap gap-2 tabular-nums">
                    {PRACTICE.contact.receptionPhones.map((phone) => (
                      <a
                        key={phone.tel}
                        href={`tel:${phone.tel}`}
                        className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-1.5 font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)]"
                      >
                        <Phone className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
                        <span>{phone.display}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-7 pt-5 border-t border-[var(--color-border)] flex flex-wrap gap-3">
                <Link href="/location/" className="btn-pill btn-pill-primary">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  <span>Map &amp; Directions</span>
                </Link>
                <a
                  href={PRACTICE.contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-pill btn-pill-secondary"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>WhatsApp Us</span>
                </a>
              </div>
            </div>
          </div>

          <EmergencyBand />
        </div>
      </section>
    </>
  );
}
