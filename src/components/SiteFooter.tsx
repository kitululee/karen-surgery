import Link from "next/link";
import { AlertTriangle, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PRACTICE } from "@/data/practice";

export function SiteFooter() {
  return (
    <footer className="bg-[var(--color-ink)] text-white">
      <div className="site-container py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Practice Identity & Reception Contact */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-forest)] text-white"
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="font-[var(--font-display)] text-base font-bold uppercase tracking-[0.14em] text-white">
                  Karen Surgery
                </p>
                <p className="text-xs uppercase tracking-[0.12em] text-white/70">
                  Family Medical Practice · Est. 1991
                </p>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-white/80 max-w-sm">
              {PRACTICE.tagline} Providing primary care family medicine and multidisciplinary
              healthcare to Karen, Langata, Nairobi, and East Africa since 1991.
            </p>

            <address className="not-italic space-y-2.5 text-sm text-white/85">
              <p className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 mt-1 shrink-0 text-[#9BC094]" aria-hidden="true" />
                <span>
                  {PRACTICE.address.street}
                  <br />
                  {PRACTICE.address.poBox}, {PRACTICE.address.city}, {PRACTICE.address.country}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 mt-1 shrink-0 text-[#9BC094]" aria-hidden="true" />
                <span className="flex flex-col gap-1 tabular-nums">
                  {PRACTICE.contact.receptionPhones.map((phone) => (
                    <a
                      key={phone.tel}
                      href={`tel:${phone.tel}`}
                      className="text-white/90 hover:text-white underline-offset-4 hover:underline"
                    >
                      {phone.display}
                    </a>
                  ))}
                </span>
              </p>
              <p className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 shrink-0 text-[#9BC094]" aria-hidden="true" />
                <a
                  href={PRACTICE.contact.whatsapp.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/90 hover:text-white underline-offset-4 hover:underline tabular-nums"
                >
                  WhatsApp: {PRACTICE.contact.whatsapp.display}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#9BC094]" aria-hidden="true" />
                <a
                  href={`mailto:${PRACTICE.contact.email}`}
                  className="text-white/90 hover:text-white underline-offset-4 hover:underline break-all"
                >
                  {PRACTICE.contact.email}
                </a>
              </p>
            </address>
          </div>

          {/* Services Column */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9BC094]">
              Clinical Services
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "All Services", href: "/services/" },
                { label: "Doctors & Nurse", href: "/doctors/" },
                { label: "Ultrasound Services", href: "/doctors/#ultrasound" },
                { label: "Mental Health", href: "/mental-health/" },
                { label: "Physiotherapy", href: "/physiotherapy/" },
                { label: "Allied Health", href: "/allied-health-professionals/" },
                { label: "Laboratory Services", href: "/laboratory-services/" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Practice & Patient Information Column */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9BC094]">
              Patient Info
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                { label: "Home", href: "/" },
                { label: "About the Practice", href: "/about/" },
                { label: "Our Team Directory", href: "/team/" },
                { label: "Opening Hours", href: "/opening-hours/" },
                { label: "Medical Information", href: "/medical-info/" },
                { label: "Where to Find Us", href: "/location/" },
                { label: "Contact Us", href: "/contact-us/" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white hover:underline underline-offset-4 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Emergency & Hours Quick Card */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-[#723235] bg-[#241516] p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#F2A6A9]">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>In an Emergency</span>
              </div>
              <p className="text-sm leading-relaxed text-white/90">
                {PRACTICE.contact.emergencyBannerText}
              </p>
              <div className="pt-1">
                <p className="text-xs uppercase tracking-wider text-white/65">
                  Emergencies Only (Daylight 7am–7pm, 365 days)
                </p>
                <a
                  href={`tel:${PRACTICE.contact.emergencyPhone.tel}`}
                  className="mt-1 inline-flex items-center gap-2 text-lg font-bold text-white hover:text-[#F2A6A9] underline underline-offset-4 tabular-nums"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  {PRACTICE.contact.emergencyPhone.display}
                </a>
              </div>
              <p className="text-xs leading-relaxed text-white/75 border-t border-white/10 pt-3">
                For security reasons, Karen Surgery no longer conducts night calls.{" "}
                <Link
                  href="/contact-us/#emergency"
                  className="text-[#F2A6A9] underline underline-offset-4 hover:text-white"
                >
                  View all Nairobi ambulance numbers
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Advisory Bar */}
        <div className="mt-14 border-t border-white/15 pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-white/70">
          <p>© {new Date().getFullYear()} Karen Surgery. 333 Ngong Road, Karen, Nairobi, Kenya.</p>
          <p className="max-w-xl sm:text-right">
            Website information is advisory only and does not replace an in-person consultation
            with a physician.{" "}
            <Link
              href="/medical-info/#disclaimer"
              className="text-white/90 underline underline-offset-4 hover:text-white"
            >
              Read full medical disclaimer
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
