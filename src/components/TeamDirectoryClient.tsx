"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Phone, Search } from "lucide-react";
import { PRACTITIONERS, type DepartmentSlug } from "@/data/team";
import { OptimizedImage } from "./OptimizedImage";

const FILTERS: { value: "all" | DepartmentSlug; label: string }[] = [
  { value: "all", label: "All Team (19)" },
  { value: "doctors", label: "Doctors & Nurse (4)" },
  { value: "radiology", label: "Ultrasound / Radiology (1)" },
  { value: "mental-health", label: "Mental Health (3)" },
  { value: "physiotherapy", label: "Physiotherapy (4)" },
  { value: "allied-health", label: "Allied Health (5)" },
  { value: "support", label: "Reception & Support (2)" },
];

export function TeamDirectoryClient() {
  const [department, setDepartment] = useState<"all" | DepartmentSlug>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = PRACTITIONERS.filter((p) => {
    const matchesDept = department === "all" || p.department === department;
    if (!matchesDept) return false;
    if (!q) return true;
    const haystack = [
      p.name,
      p.role,
      p.qualifications ?? "",
      p.departmentLabel,
      ...(p.specialties ?? []),
      ...p.bio,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className="space-y-8">
      <search className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <label htmlFor="team-search" className="visually-hidden">
              Search clinicians by name, role, or area of care
            </label>
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
              aria-hidden="true"
            />
            <input
              id="team-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, discipline, or clinical interest..."
              className="w-full min-h-[2.75rem] rounded-full border border-[var(--color-border-strong)] bg-white pl-10 pr-4 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
            />
          </div>
          <p className="text-sm text-[var(--color-ink-muted)]" aria-live="polite">
            Showing <strong className="font-semibold text-[var(--color-ink)]">{filtered.length}</strong>{" "}
            of {PRACTITIONERS.length} team members
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter team by department">
          {FILTERS.map((f) => {
            const active = department === f.value;
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={active}
                onClick={() => setDepartment(f.value)}
                className={`min-h-[2.5rem] rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                  active
                    ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                    : "border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </search>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-white p-10 text-center">
          <p className="text-base font-medium text-[var(--color-ink)]">
            No team members match &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => {
              setDepartment("all");
              setQuery("");
            }}
            className="btn-pill btn-pill-secondary mt-4"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => {
            const profileHref = person.departmentHref.includes("#")
              ? person.departmentHref
              : `${person.departmentHref}#${person.id}`;
            return (
              <article
                key={person.id}
                className="ks-card flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white p-6"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                      <OptimizedImage
                        asset={person.image}
                        alt={`Portrait of ${person.name}, ${person.role}`}
                        objectPosition={person.imagePosition}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-forest)]">
                        {person.role}
                      </p>
                      <h2 className="mt-1 font-[var(--font-display)] text-lg font-semibold leading-snug text-[var(--color-ink)]">
                        {person.name}
                      </h2>
                      {person.qualifications ? (
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)] line-clamp-2">
                          {person.qualifications}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-ink-muted)] line-clamp-4">
                    {person.bio[0]}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--color-border)] space-y-3">
                  {(person.email || person.phones) ? (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {person.phones?.[0] ? (
                        <a
                          href={`tel:${person.phones[0].tel}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 font-medium text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-elevated)] tabular-nums"
                        >
                          <Phone className="h-3.5 w-3.5 text-[var(--color-forest)]" aria-hidden="true" />
                          <span>{person.phones[0].display}</span>
                        </a>
                      ) : null}
                      {person.email ? (
                        <a
                          href={`mailto:${person.email}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1.5 font-medium text-[var(--color-ink)] no-underline hover:bg-[var(--color-surface-elevated)] max-w-full truncate"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-forest)]" aria-hidden="true" />
                          <span className="truncate">{person.email}</span>
                        </a>
                      ) : null}
                    </div>
                  ) : null}

                  <Link
                    href={profileHref}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-forest)] hover:text-[var(--color-ink)] no-underline"
                  >
                    <span>Read full profile ({person.departmentLabel})</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
