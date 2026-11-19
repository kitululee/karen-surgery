import type { Metadata } from "next";
import { PRACTICE } from "@/data/practice";

export function buildMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const normalizedPath = path.endsWith("/") ? path : `${path}/`;
  const canonicalUrl = `${PRACTICE.siteUrl}${normalizedPath === "//" ? "/" : normalizedPath}`;
  const fullTitle =
    title === PRACTICE.name
      ? "Karen Surgery — Family Medical Practice in Karen, Nairobi"
      : `${title} | Karen Surgery`;

  return {
    title: { absolute: fullTitle },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: PRACTICE.name,
      locale: "en_KE",
      type: "website",
      images: [
        {
          url: `${PRACTICE.siteUrl}/images/practice/karen-surgery-building.jpg`,
          width: 1280,
          height: 622,
          alt: "Karen Surgery family medical practice building surrounded by trees on Ngong Road, Karen, Nairobi",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [`${PRACTICE.siteUrl}/images/practice/karen-surgery-building.jpg`],
    },
  };
}

export function getClinicJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: PRACTICE.name,
    description:
      "Karen Surgery is an independent family medical practice established in 1991 at 333 Ngong Road, Karen, Nairobi, offering general practice, nursing, ultrasound, mental health, physiotherapy, allied health, and partner laboratory services.",
    url: PRACTICE.siteUrl,
    foundingDate: "1991",
    telephone: "+254733642246",
    email: PRACTICE.contact.email,
    image: `${PRACTICE.siteUrl}/images/practice/karen-surgery-building.jpg`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "333 Ngong Road, Karen",
      postOfficeBoxNumber: "24932",
      addressLocality: "Nairobi",
      postalCode: "00502",
      addressCountry: "KE",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: PRACTICE.address.coordinates.lat,
      longitude: PRACTICE.address.coordinates.lng,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:00",
        closes: "16:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "12:00",
      },
    ],
    medicalSpecialty: [
      "PrimaryCare",
      "FamilyPractice",
      "Psychiatric",
      "Physiotherapy",
      "Podiatric",
      "DietNutrition",
      "Radiography",
    ],
  };
}
