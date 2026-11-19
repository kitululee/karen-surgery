"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ChevronDown,
  Menu,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { PRIMARY_NAV, type NavItem } from "@/data/navigation";
import { PRACTICE } from "@/data/practice";

function normalizePath(p: string) {
  if (!p || p === "/") return "/";
  return p.endsWith("/") ? p : `${p}/`;
}

export function SiteHeader() {
  const pathname = normalizePath(usePathname() || "/");
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const drawerPanelRef = useRef<HTMLDivElement>(null);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const baseId = useId();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setOpenDropdown(null);
    if (drawerRef.current?.open) {
      drawerRef.current.close();
      setDrawerOpen(false);
    }
  }, [pathname]);

  // Close desktop dropdown on Escape or outside click
  useEffect(() => {
    if (!openDropdown) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openDropdown]);

  function openDrawer() {
    const dialog = drawerRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setDrawerOpen(true);
  }

  function closeDrawer() {
    const dialog = drawerRef.current;
    if (!dialog || !dialog.open) return;
    dialog.close();
    setDrawerOpen(false);
    openBtnRef.current?.focus();
  }

  function isItemActive(item: NavItem) {
    if (item.href) return normalizePath(item.href) === pathname;
    if (item.label === "Our Team") {
      return pathname === "/team/" || pathname === "/doctors/";
    }
    if (item.label === "Services") {
      return (
        pathname === "/services/" ||
        pathname === "/mental-health/" ||
        pathname === "/physiotherapy/" ||
        pathname === "/allied-health-professionals/" ||
        pathname === "/laboratory-services/"
      );
    }
    if (item.children) {
      return item.children.some((c) => normalizePath(c.href) === pathname);
    }
    return false;
  }

  const overHero = isHome && !scrolled;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4 pointer-events-none">
      <a href="#main-content" className="skip-link visually-hidden pointer-events-auto">
        Skip to main content
      </a>

      <div className="mx-auto max-w-[82rem] pointer-events-auto">
        <div
          className={`site-header-pill flex items-center justify-between gap-3 rounded-full border px-4 py-2 sm:px-5 transition-colors duration-200 ${
            overHero
              ? "border-white/30 bg-white/78 text-[var(--color-ink)] shadow-[0_8px_32px_rgba(18,23,19,0.12)] backdrop-blur-md"
              : "border-[var(--color-border)] bg-white/94 text-[var(--color-ink)] shadow-[0_8px_28px_rgba(18,23,19,0.08)] backdrop-blur-md"
          }`}
        >
          {/* Brand Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 py-1 text-[var(--color-ink)] no-underline group"
            aria-label="Karen Surgery — Home"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-forest)] text-white shrink-0"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-[var(--font-display)] text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-ink)] sm:text-[0.9375rem]">
                Karen Surgery
              </span>
              <span className="mt-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-[var(--color-ink-muted)] hidden sm:block">
                Family Medical Practice · Est. 1991
              </span>
            </span>
          </Link>

          {/* Primary Desktop Navigation */}
          <nav
            ref={navRef}
            aria-label="Primary"
            className="hidden lg:flex items-center gap-1"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setOpenDropdown(null);
              }
            }}
          >
            <ul className="flex items-center gap-1">
              {PRIMARY_NAV.map((item) => {
                const active = isItemActive(item);
                const menuId = `${baseId}-menu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                const isOpen = openDropdown === item.label;

                if (item.children) {
                  return (
                    <li key={item.label} className="relative">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={menuId}
                        onClick={() => setOpenDropdown(isOpen ? null : item.label)}
                        className={`inline-flex min-h-[2.5rem] items-center gap-1 rounded-full px-3.5 py-2 text-[0.875rem] font-medium transition-colors cursor-pointer ${
                          active
                            ? "bg-[var(--color-forest-soft)] text-[var(--color-forest-deep)] font-semibold"
                            : "text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                        }`}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform duration-150 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isOpen ? (
                        <div
                          id={menuId}
                          className="absolute left-0 top-full z-50 mt-2.5 w-80 rounded-2xl border border-[var(--color-border)] bg-white p-2 shadow-[0_18px_48px_rgba(18,23,19,0.14)]"
                        >
                          <ul className="space-y-0.5">
                            {item.children.map((sub) => {
                              const subActive = normalizePath(sub.href) === pathname;
                              return (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    aria-current={subActive ? "page" : undefined}
                                    onClick={() => setOpenDropdown(null)}
                                    className={`block rounded-xl px-3.5 py-2.5 transition-colors no-underline ${
                                      subActive
                                        ? "bg-[var(--color-forest-soft)] text-[var(--color-forest-deep)]"
                                        : "hover:bg-[var(--color-surface)] text-[var(--color-ink)]"
                                    }`}
                                  >
                                    <span className="flex items-center justify-between text-sm font-semibold">
                                      {sub.label}
                                      {subActive ? (
                                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-forest)]" aria-hidden="true" />
                                      ) : null}
                                    </span>
                                    <span className="mt-0.5 block text-xs leading-snug text-[var(--color-ink-muted)]">
                                      {sub.description}
                                    </span>
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ) : null}
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href!}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-[2.5rem] items-center rounded-full px-3.5 py-2 text-[0.875rem] no-underline transition-colors ${
                        active
                          ? "bg-[var(--color-forest-soft)] font-semibold text-[var(--color-forest-deep)] underline decoration-[var(--color-forest)] decoration-2 underline-offset-4"
                          : "font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right CTA & Mobile Menu Button */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
              className="hidden xl:inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-emergency)] no-underline hover:bg-[#fae4e5] transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>Emergency</span>
            </a>

            <Link
              href="/contact-us/"
              className="btn-pill btn-pill-primary !min-h-[2.5rem] !px-4 !py-1.5 !text-[0.75rem] hidden sm:inline-flex"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Contact &amp; Hours</span>
            </Link>

            <button
              ref={openBtnRef}
              type="button"
              onClick={openDrawer}
              aria-expanded={drawerOpen}
              aria-controls="mobile-nav-drawer"
              aria-label="Open menu"
              className="inline-flex lg:hidden min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-white px-3 text-sm font-semibold text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-surface)]"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs uppercase tracking-wider">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Native Modal <dialog> Mobile Navigation Drawer */}
      <dialog
        ref={drawerRef}
        id="mobile-nav-drawer"
        aria-label="Site navigation"
        className="ks-drawer pointer-events-auto"
        onCancel={(e) => {
          e.preventDefault();
          closeDrawer();
        }}
        onClick={(e) => {
          if (
            drawerPanelRef.current &&
            !drawerPanelRef.current.contains(e.target as Node)
          ) {
            closeDrawer();
          }
        }}
      >
        <div ref={drawerPanelRef} className="ks-drawer-panel flex flex-col">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <span className="font-[var(--font-display)] text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-ink)]">
              Karen Surgery
            </span>
            <button
              type="button"
              onClick={closeDrawer}
              aria-label="Close menu"
              autoFocus
              className="inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-ink)] cursor-pointer hover:bg-[var(--color-surface)]"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 px-5 py-5">
            <ul className="space-y-4">
              {PRIMARY_NAV.map((item) =>
                item.children ? (
                  <li key={item.label} className="border-b border-[var(--color-border)] pb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-forest)]">
                      {item.label}
                    </p>
                    <ul className="space-y-1">
                      {item.children.map((sub) => {
                        const subActive = normalizePath(sub.href) === pathname;
                        return (
                          <li key={sub.href}>
                            <Link
                              href={sub.href}
                              aria-current={subActive ? "page" : undefined}
                              onClick={closeDrawer}
                              className={`flex min-h-[2.75rem] items-center rounded-xl px-3 py-2 text-[0.9375rem] no-underline ${
                                subActive
                                  ? "bg-[var(--color-forest-soft)] font-semibold text-[var(--color-forest-deep)]"
                                  : "font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                              }`}
                            >
                              {sub.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ) : (
                  <li key={item.label} className="border-b border-[var(--color-border)] pb-3">
                    <Link
                      href={item.href!}
                      aria-current={normalizePath(item.href!) === pathname ? "page" : undefined}
                      onClick={closeDrawer}
                      className={`flex min-h-[2.75rem] items-center rounded-xl px-3 py-2 text-base no-underline ${
                        normalizePath(item.href!) === pathname
                          ? "bg-[var(--color-forest-soft)] font-semibold text-[var(--color-forest-deep)]"
                          : "font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>

          {/* Direct Mobile Contact & Emergency Footer inside Drawer */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
            <a
              href={`tel:${PRACTICE.contact.receptionPhones[0].tel}`}
              className="btn-pill btn-pill-primary w-full"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Call Reception</span>
            </a>
            <a
              href={PRACTICE.contact.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill-secondary w-full"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>WhatsApp Reception</span>
            </a>
            <div className="rounded-xl border border-[var(--color-emergency-border)] bg-[var(--color-emergency-bg)] p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-emergency)]">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Emergencies Only (7am–7pm)</span>
              </p>
              <a
                href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
                className="mt-1 inline-block font-semibold text-[var(--color-emergency)] underline underline-offset-4 tabular-nums"
              >
                {PRACTICE.contact.emergencyPhone.display}
              </a>
            </div>
          </div>
        </div>
      </dialog>
    </header>
  );
}
