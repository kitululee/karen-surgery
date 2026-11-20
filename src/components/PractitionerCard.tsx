import { Globe, Instagram, Mail, Phone } from "lucide-react";
import type { Practitioner } from "@/data/team";
import { departmentToServiceSlug } from "@/lib/api";
import { OptimizedImage } from "./OptimizedImage";
import { AppointmentTriggerButton } from "./AppointmentTriggerButton";

export function PractitionerCard({ practitioner }: { practitioner: Practitioner }) {
  return (
    <article
      id={practitioner.id}
      className="ks-card grid gap-6 rounded-2xl border border-[var(--color-border)] bg-white p-6 sm:p-8 md:grid-cols-[13.5rem_1fr] md:gap-8 scroll-mt-28"
    >
      {/* Portrait Container — respectfully proportioned to keep original photographs sharp */}
      <div className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] aspect-[4/5] w-48 sm:w-52 md:w-full">
          <OptimizedImage
            asset={practitioner.image}
            alt={`Portrait of ${practitioner.name}, ${practitioner.role} at Karen Surgery`}
            objectPosition={practitioner.imagePosition}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Biography & Direct Contact */}
      <div className="min-w-0 flex flex-col">
        <div className="border-b border-[var(--color-border)] pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[var(--color-forest)]">
            {practitioner.role}
          </p>
          <h3 className="mt-1.5 font-[var(--font-display)] text-xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-2xl">
            {practitioner.profileHeading ?? practitioner.name}
          </h3>
          {practitioner.qualifications ? (
            <p className="mt-1 text-sm font-medium text-[var(--color-ink-muted)]">
              {practitioner.qualifications}
            </p>
          ) : null}

          {practitioner.specialties && practitioner.specialties.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Areas of focus">
              {practitioner.specialties.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-ink)]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {practitioner.quote ? (
          <blockquote className="mt-4 border-l-2 border-[var(--color-forest)] pl-4 text-sm italic leading-relaxed text-[var(--color-ink-muted)]">
            {practitioner.quote}
          </blockquote>
        ) : null}

        <div className="mt-4 space-y-3.5 text-[0.96875rem] leading-[1.7] text-[var(--color-ink-muted)] max-w-[66ch]">
          {practitioner.bio.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {practitioner.bulletItems && practitioner.bulletItems.length > 0 ? (
          <div className="mt-5 rounded-xl bg-[var(--color-surface)] p-5 border border-[var(--color-border)]">
            {practitioner.bulletListHeading ? (
              <p className="text-sm font-semibold text-[var(--color-ink)]">
                {practitioner.bulletListHeading}
              </p>
            ) : null}
            <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2 text-sm text-[var(--color-ink-muted)] list-disc pl-5">
              {practitioner.bulletItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {practitioner.secondaryLists && practitioner.secondaryLists.length > 0 ? (
          <div className="mt-5 space-y-4">
            {practitioner.secondaryLists.map((list) => (
              <div
                key={list.heading}
                className="rounded-xl bg-[var(--color-surface)] p-4 border border-[var(--color-border)]"
              >
                <p className="text-sm font-medium text-[var(--color-ink)]">{list.heading}</p>
                <ol className="mt-2 space-y-1 text-sm text-[var(--color-ink-muted)] list-decimal pl-5">
                  {list.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        ) : null}

        {/* Direct Practitioner Contact & Appointment Request Bar */}
        {(practitioner.department !== "support" ||
          practitioner.email ||
          (practitioner.phones && practitioner.phones.length > 0) ||
          practitioner.website ||
          practitioner.instagram) ? (
          <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2.5">
            {practitioner.department !== "support" ? (
              <AppointmentTriggerButton
                variant="card"
                label="Request Appointment"
                serviceSlug={departmentToServiceSlug(practitioner.department)}
                practitionerSlug={practitioner.id}
                practitionerName={practitioner.name}
              />
            ) : null}

            {practitioner.email ? (
              <a
                href={`mailto:${practitioner.email}`}
                className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors break-all"
              >
                <Mail className="h-4 w-4 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                <span>{practitioner.email}</span>
              </a>
            ) : null}

            {practitioner.phones?.map((phone) => (
              <a
                key={phone.tel}
                href={`tel:${phone.tel}`}
                className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors tabular-nums"
              >
                <Phone className="h-4 w-4 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                <span>
                  {practitioner.phonePrefix ? `${practitioner.phonePrefix}: ` : ""}
                  {phone.display}
                </span>
              </a>
            ))}

            {practitioner.website ? (
              <a
                href={practitioner.website.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <Globe className="h-4 w-4 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                <span>{practitioner.website.label}</span>
              </a>
            ) : null}

            {practitioner.instagram ? (
              <a
                href={practitioner.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] no-underline hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <Instagram className="h-4 w-4 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                <span>{practitioner.instagram.label}</span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
