"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PRACTICE } from "@/data/practice";

const PILLAR_THEMES = [
  "bg-[#1F2E21] text-white border-[#2E4230]",
  "bg-[#2B3E2D] text-white border-[#3B543E]",
  "bg-[#36493A] text-white border-[#48604D]",
  "bg-[#1B2420] text-white border-[#2D3B34]",
];

export function PillarsCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: -1 | 1) {
    const el = trackRef.current;
    if (!el) return;
    const distance = Math.max(300, Math.round(el.clientWidth * 0.72));
    el.scrollBy({ left: direction * distance, behavior: "smooth" });
  }

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="site-container">
        {/* SYNORA-inspired split section header with tall pill prev/next controls */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              How We Care For Your Family
            </p>
            <h2 className="type-section-title mt-2.5 text-[var(--color-ink)]">
              Personal primary care built around lasting relationships.
            </h2>
            <p className="mt-3 text-[0.96875rem] leading-relaxed text-[var(--color-ink-muted)]">
              Our GPs establish one-on-one relationships that often span decades and care for
              several generations within the same family.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0" aria-label="Scroll care pillars">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Scroll left to previous care pillar"
              className="inline-flex h-16 w-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Scroll right to next care pillar"
              className="inline-flex h-16 w-12 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-white text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 4-column editorial horizontal scroll track */}
        <div ref={trackRef} className="pillars-track">
          {PRACTICE.carePillars.map((pillar, index) => (
            <article
              key={pillar.number}
              className={`ks-card snap-start flex flex-col justify-between rounded-2xl border p-6 sm:p-7 ${PILLAR_THEMES[index % PILLAR_THEMES.length]}`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <span className="font-[var(--font-display)] text-xs font-semibold uppercase tracking-[0.16em] text-[#A8CBA1]">
                    Pillar {pillar.number}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full bg-[#A8CBA1]"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-5 font-[var(--font-display)] text-xl font-semibold leading-snug text-white">
                  {pillar.title}
                </h3>
                <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-white/85">
                  {pillar.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        className="mt-2 h-1.5 w-1.5 rounded-full bg-[#A8CBA1] shrink-0"
                        aria-hidden="true"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
