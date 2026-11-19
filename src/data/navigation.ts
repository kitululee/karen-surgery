export interface NavSubItem {
  label: string;
  href: string;
  description: string;
}

export interface NavItem {
  label: string;
  href?: string;
  children?: NavSubItem[];
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about/" },
  {
    label: "Our Team",
    children: [
      {
        label: "All Practitioners",
        href: "/team/",
        description: "Complete multidisciplinary directory (19 clinicians & staff)",
      },
      {
        label: "Doctors & Practice Nurse",
        href: "/doctors/",
        description: "GPs, Practice Nurse, Consultant Radiologist & Office Support",
      },
      {
        label: "Mental Health",
        href: "/mental-health/",
        description: "Clinical Psychologist & Counsellors",
      },
      {
        label: "Physiotherapy",
        href: "/physiotherapy/",
        description: "Sports, Orthopaedic, Neuro, Paediatric & Pelvic Health",
      },
      {
        label: "Allied Health Professionals",
        href: "/allied-health-professionals/",
        description: "Podiatry, Therapeutic Massage & Nutrition",
      },
    ],
  },
  {
    label: "Services",
    children: [
      {
        label: "All Services Overview",
        href: "/services/",
        description: "Integrated primary & multidisciplinary care under one roof",
      },
      {
        label: "Family Medicine & Ultrasound",
        href: "/doctors/",
        description: "GP consultations, nursing care & on-site diagnostic ultrasound",
      },
      {
        label: "Mental Health Services",
        href: "/mental-health/",
        description: "Integrative therapy for children, adults & families",
      },
      {
        label: "Physiotherapy",
        href: "/physiotherapy/",
        description: "Rehabilitation, manual therapy & acupuncture",
      },
      {
        label: "Allied Health",
        href: "/allied-health-professionals/",
        description: "Podiatry, massage therapy & nutritional guidance",
      },
      {
        label: "Laboratory Services",
        href: "/laboratory-services/",
        description: "Specimen collection with CTTM & Pathcare Kenya",
      },
    ],
  },
  {
    label: "Patient Info",
    children: [
      {
        label: "Opening Hours",
        href: "/opening-hours/",
        description: "Reception, doctors' consulting, after-hours & night policy",
      },
      {
        label: "Medical Information",
        href: "/medical-info/",
        description: "Vaccines, immunisation schedules & trusted health resources",
      },
      {
        label: "Where to Find Us",
        href: "/location/",
        description: "333 Ngong Road, Karen — maps & directions",
      },
    ],
  },
  { label: "Contact", href: "/contact-us/" },
];
