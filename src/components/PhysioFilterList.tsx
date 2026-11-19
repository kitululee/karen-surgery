"use client";

import { useState } from "react";
import type { Practitioner } from "@/data/team";
import { PractitionerCard } from "./PractitionerCard";

const SPECIALTY_FILTERS = [
  "All Physiotherapists",
  "Sports Physiotherapy",
  "Neuro-Rehabilitation",
  "Paediatric Physiotherapy",
  "Pelvic Health",
  "Acupuncture",
  "Home Visits",
];

export function PhysioFilterList({ practitioners }: { practitioners: Practitioner[] }) {
  const [selected, setSelected] = useState("All Physiotherapists");

  const visible =
    selected === "All Physiotherapists"
      ? practitioners
      : practitioners.filter((p) => p.specialties?.includes(selected));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter physiotherapists by area of focus">
        {SPECIALTY_FILTERS.map((tag) => {
          const active = selected === tag;
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(tag)}
              className={`min-h-[2.5rem] rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                active
                  ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                  : "border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-[var(--color-ink-muted)]" aria-live="polite">
        Showing <strong className="font-semibold text-[var(--color-ink)]">{visible.length}</strong>{" "}
        of {practitioners.length} physiotherapists
      </p>

      <div className="space-y-6">
        {visible.map((person) => (
          <PractitionerCard key={person.id} practitioner={person} />
        ))}
      </div>
    </div>
  );
}
