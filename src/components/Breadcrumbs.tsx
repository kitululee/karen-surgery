import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--color-ink-muted)]">
        <li>
          <Link
            href="/"
            className="hover:text-[var(--color-ink)] hover:underline underline-offset-4 transition-colors"
          >
            Home
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.label} className="inline-flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-[var(--color-border-strong)]" aria-hidden="true" />
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="hover:text-[var(--color-ink)] hover:underline underline-offset-4 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-[var(--color-ink)]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
