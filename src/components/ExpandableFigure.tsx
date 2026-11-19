"use client";

import { useRef } from "react";
import { Maximize2, X } from "lucide-react";
import type { ImageAssetKey } from "@/data/image-manifest.generated";
import { OptimizedImage } from "./OptimizedImage";

interface ExpandableFigureProps {
  asset: ImageAssetKey;
  title: string;
  alt: string;
  caption: string;
  sourceNote?: string;
}

export function ExpandableFigure({
  asset,
  title,
  alt,
  caption,
  sourceNote,
}: ExpandableFigureProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openModal() {
    dialogRef.current?.showModal();
  }

  function closeModal() {
    dialogRef.current?.close();
  }

  return (
    <figure className="ks-card overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
        <div>
          <h3 className="font-[var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
            {title}
          </h3>
          {sourceNote ? (
            <p className="text-xs text-[var(--color-ink-muted)] mt-0.5">{sourceNote}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Expand full view</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 bg-white">
        <OptimizedImage
          asset={asset}
          alt={alt}
          className="mx-auto h-auto w-full max-w-4xl rounded-lg border border-[var(--color-border)]"
        />
      </div>

      <figcaption className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5 text-sm leading-relaxed text-[var(--color-ink-muted)]">
        {caption}
      </figcaption>

      <dialog
        ref={dialogRef}
        aria-label={`Full-size view: ${title}`}
        className="ks-lightbox"
        onClick={(e) => {
          if (e.target === dialogRef.current) closeModal();
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3.5">
          <p className="font-[var(--font-display)] text-sm font-semibold text-[var(--color-ink)]">
            {title}
          </p>
          <button
            type="button"
            onClick={closeModal}
            aria-label="Close full-size view"
            autoFocus
            className="inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-surface)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>Close</span>
          </button>
        </div>
        <div className="max-h-[78dvh] overflow-auto p-4 sm:p-6 bg-white">
          <OptimizedImage
            asset={asset}
            alt={alt}
            className="mx-auto h-auto max-w-full rounded"
          />
        </div>
      </dialog>
    </figure>
  );
}
