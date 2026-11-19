import type { PhoneContact } from "./practice";

export interface ServiceOverviewItem {
  slug: string;
  title: string;
  shortTitle: string;
  href: string;
  icon: "stethoscope" | "scan" | "brain" | "activity" | "heart-handshake" | "flask";
  description: string;
  highlights: string[];
}

export interface LabPartner {
  name: string;
  acronym?: string;
  courierTime: string;
  addressLines: string[];
  phones: PhoneContact[];
  email?: string;
  website: { label: string; href: string };
}

export const SERVICES_OVERVIEW: ServiceOverviewItem[] = [
  {
    slug: "family-medicine",
    title: "Family Medicine & Nursing",
    shortTitle: "Family Medicine",
    href: "/doctors/",
    icon: "stethoscope",
    description:
      "Primary care family medicine for people of all ages — from well-baby checks and antenatal care to acute illness, chronic disease management, vaccinations, and wound care.",
    highlights: [
      "Three experienced General Practitioners & Practice Nurse",
      "Same-day walk-in acute care & booked appointments",
      "Dressings, wound care & vaccinations by Mrs. Hannah Murimi",
    ],
  },
  {
    slug: "ultrasound",
    title: "Ultrasound Services",
    shortTitle: "Ultrasound & Radiology",
    href: "/doctors/#ultrasound",
    icon: "scan",
    description:
      "On-site diagnostic ultrasound and Doppler examinations provided by Consultant Radiologist Dr. Z. A. Kaka, eliminating the need to travel across Nairobi for imaging.",
    highlights: [
      "Abdominal, urological, pelvic, gynaecological & obstetric scans",
      "Vascular & obstetric Doppler examinations",
      "Small parts, musculoskeletal & ultrasound-guided interventions",
    ],
  },
  {
    slug: "mental-health",
    title: "Mental Health",
    shortTitle: "Mental Health",
    href: "/mental-health/",
    icon: "brain",
    description:
      "A centre for excellence in mental health with psychologists and counsellors working collaboratively with GPs to support children, adolescents, adults, and families.",
    highlights: [
      "Anxiety, depression, attachment disorders, ADHD & eating disorders",
      "CBT, Schema Therapy, ACT, CFT, RLT & TRE modalities",
      "GP referral or self-referral with optional GP medical support",
    ],
  },
  {
    slug: "physiotherapy",
    title: "Physiotherapy",
    shortTitle: "Physiotherapy",
    href: "/physiotherapy/",
    icon: "activity",
    description:
      "Four internationally trained physiotherapists offering sports injury rehabilitation, neuro-rehabilitation, paediatric physiotherapy, pelvic health, and acupuncture.",
    highlights: [
      "Sports injuries, manual therapy & post-surgery orthopaedic rehab",
      "Neuro-rehabilitation, cardiac/respiratory & paediatric care",
      "Pelvic health & pre/postnatal care; home visits available",
    ],
  },
  {
    slug: "allied-health",
    title: "Allied Health Professionals",
    shortTitle: "Allied Health",
    href: "/allied-health-professionals/",
    icon: "heart-handshake",
    description:
      "Podiatrists, holistic and sports massage therapists, and a registered nutritionist consulting alongside the surgery's doctors as part of one multidisciplinary team.",
    highlights: [
      "Podiatry — biomechanics, diabetic foot & ulcer management",
      "Holistic, sports, pregnancy, newborn & therapeutic massage",
      "Evidence-based nutrition, gut health & diabetes meal planning",
    ],
  },
  {
    slug: "laboratory-services",
    title: "Laboratory Services",
    shortTitle: "Laboratory Services",
    href: "/laboratory-services/",
    icon: "flask",
    description:
      "Specimen collection on-site by our practice nurse with twice-daily courier collections by partner laboratories CTTM and Pathcare Kenya Ltd.",
    highlights: [
      "9:30 am courier collection by CTTM",
      "1:00 pm courier collection by Pathcare Kenya Ltd",
      "Urgent results available the same day",
    ],
  },
];

export const LABORATORY_DATA = {
  intro: [
    "Karen Surgery does not have its own laboratory, however we provide a service with two laboratories – Centre for Tropical & Travel Medicine (CTTM) and Pathcare Kenya Ltd.",
    "Our nurse will take blood and other specimens, for collection at either 9.30 am by the CTTM courier or at 1 pm by the Pathcare courier. Urgent results are available the same day.",
    "The laboratories do not provide credit and patients are responsible for payment in cash or via M-Pesa the same day. Receipts will be returned to Karen Surgery the following day.",
  ],
  partners: [
    {
      name: "Centre for Tropical and Travel Medicine",
      acronym: "CTTM",
      courierTime: "9:30 am courier collection",
      addressLines: [
        "Kirichwa Road (off Ngong Road)",
        "Adams Arcade, Opposite Nairobi Women's Hospital Adams",
        "P.O. Box 73548, Nairobi 00200, Kenya",
      ],
      phones: [
        { display: "0721 163 974", tel: "+254721163974" },
        { display: "0734 211 888", tel: "+254734211888" },
      ],
      website: {
        label: "www.cttm-kenya.com",
        href: "http://www.cttm-kenya.com/",
      },
    },
    {
      name: "Pathcare Kenya Ltd",
      courierTime: "1:00 pm courier collection",
      addressLines: [
        "Regal Plaza, Limuru Rd",
        "P.O. Box 1256, Nairobi 00606, Kenya",
      ],
      phones: [
        { display: "0733 333 552", tel: "+254733333552" },
        { display: "0722 203 074", tel: "+254722203074" },
      ],
      email: "enquiries@pathcarekenya.com",
      website: {
        label: "www.pathcarekenya.com",
        href: "https://www.pathcarekenya.com/",
      },
    },
  ] as LabPartner[],
};
