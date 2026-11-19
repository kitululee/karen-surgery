import type { ReactNode } from "react";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

interface PageHeroProps {
  breadcrumbs: BreadcrumbItem[];
  eyebrow: string;
  title: string;
  description?: string;
  tone?: "default" | "sage" | "calm";
  actions?: ReactNode;
}

export function PageHero({
  breadcrumbs,
  eyebrow,
  title,
  description,
  tone = "default",
  actions,
}: PageHeroProps) {
  const bgClass =
    tone === "sage"
      ? "bg-[var(--color-surface-elevated)]"
      : tone === "calm"
        ? "bg-[#F4F6F3]"
        : "bg-[var(--color-surface)]";

  return (
    <section className={`${bgClass} border-b border-[var(--color-border)] pt-28 pb-12 sm:pt-32 sm:pb-16`}>
      <div className="site-container">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-forest)]">
              {eyebrow}
            </p>
            <h1 className="type-page-title text-[var(--color-ink)]">{title}</h1>
            {description ? (
              <p className="mt-4 max-w-[62ch] text-base leading-relaxed text-[var(--color-ink-muted)] sm:text-[1.0625rem]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3 shrink-0">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
