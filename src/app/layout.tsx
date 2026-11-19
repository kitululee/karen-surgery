import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getClinicJsonLd } from "@/lib/seo";
import { PRACTICE } from "@/data/practice";

const jakarta = localFont({
  src: "../fonts/plus-jakarta-sans-latin.woff2",
  weight: "400 700",
  variable: "--font-jakarta",
  display: "swap",
});

const inter = localFont({
  src: "../fonts/inter-latin.woff2",
  weight: "400 600",
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2F4A2C",
};

export const metadata: Metadata = {
  metadataBase: new URL(PRACTICE.siteUrl),
  title: {
    default: "Karen Surgery — Family Medical Practice in Karen, Nairobi",
    template: "%s | Karen Surgery",
  },
  description:
    "Karen Surgery is a family medical practice at 333 Ngong Road, Karen, Nairobi (est. 1991), offering General Practitioners, Practice Nurse, Ultrasound, Mental Health, Physiotherapy, Allied Health, and Laboratory Services.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = getClinicJsonLd();

  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col bg-white text-[var(--color-ink)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
