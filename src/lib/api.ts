import { PRACTICE } from "@/data/practice";
import { SERVICES_OVERVIEW } from "@/data/services";
import { PRACTITIONERS, type DepartmentSlug } from "@/data/team";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");

export function hasBackendApi(): boolean {
  return API_URL.length > 0;
}

export const INQUIRY_CATEGORIES = [
  "General enquiries",
  "General Practice",
  "Mental Health",
  "Physiotherapy",
  "Allied Health",
  "Laboratory Services",
  "Other verified services",
  "Appointment enquiries",
  "Other",
] as const;

export type InquiryCategory = (typeof INQUIRY_CATEGORIES)[number];

export interface BookingServiceOption {
  id: number;
  slug: string;
  title: string;
  shortTitle: string;
}

export interface BookingPractitionerOption {
  id: number;
  slug: string;
  name: string;
  role: string;
  qualifications: string;
  department: string;
  departmentLabel: string;
  serviceSlugs: string[];
}

export interface BookingOptionsResponse {
  services: BookingServiceOption[];
  practitioners: BookingPractitionerOption[];
  fromBackend: boolean;
}

export interface AppointmentSubmission {
  fullName: string;
  phone: string;
  email: string;
  patientType: "new" | "existing";
  serviceSlug: string;
  practitionerId: number | null;
  practitionerName?: string | null;
  serviceLabel?: string;
  preferredDate: string;
  preferredTime: string;
  preferredContact: "phone" | "whatsapp" | "email";
  message: string;
  privacyAccepted: true;
  websiteUrl?: string;
  startedAt?: number;
}

export interface AppointmentResponse {
  referenceCode?: string;
  status: string;
  serviceLabel: string;
  practitionerName: string | null;
  routedTo: string;
  acknowledgement: string;
  staticPreviewMode?: boolean;
  mailtoFallback?: string;
  whatsappFallback?: string;
}

export interface EnquirySubmission {
  fullName: string;
  email: string;
  phone: string;
  category: InquiryCategory;
  subject: string;
  message: string;
  preferredContact: "email" | "phone" | "whatsapp";
  privacyAccepted: true;
  source?: "contact_form" | "chatbot";
  originalQuestion?: string;
  conversationSummary?: string;
  websiteUrl?: string;
  startedAt?: number;
}

export interface EnquiryResponse {
  referenceCode?: string;
  status: string;
  source: string;
  acknowledgement: string;
  staticPreviewMode?: boolean;
  mailtoFallback?: string;
  whatsappFallback?: string;
}

export interface ChatbotEscalation {
  telephone: string;
  telephoneHref: string;
  whatsapp: string;
  whatsappHref: string;
  email: string;
  emailHref: string;
  emergency: string;
  emergencyHref: string;
}

export interface ChatbotConfigResponse {
  enabled: boolean;
  welcomeMessage: string;
  suggestedQuestions: string[];
  escalation: ChatbotEscalation;
  fromBackend?: boolean;
}

export interface ChatbotReply {
  type: "answer" | "emergency" | "medical_refusal" | "fallback" | "disabled";
  answer: string;
  matchedFaqId?: number;
  category?: string;
  suggestedFollowups: string[];
  escalation: ChatbotEscalation;
  offerEnquiryDraft: boolean;
  draftEnquiry?: {
    originalQuestion: string;
    category: InquiryCategory;
    subject: string;
    conversationSummary: string;
  };
}

export class ApiValidationError extends Error {
  fieldErrors?: Record<string, string[]>;
  statusCode: number;

  constructor(message: string, statusCode: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export function departmentToServiceSlug(department: DepartmentSlug): string {
  switch (department) {
    case "doctors":
      return "family-medicine";
    case "radiology":
      return "ultrasound";
    case "mental-health":
      return "mental-health";
    case "physiotherapy":
      return "physiotherapy";
    case "allied-health":
      return "allied-health";
    default:
      return "family-medicine";
  }
}

export function getStaticBookingOptions(): BookingOptionsResponse {
  const services: BookingServiceOption[] = [
    ...SERVICES_OVERVIEW.map((s, idx) => ({
      id: idx + 1,
      slug: s.slug,
      title: s.title,
      shortTitle: s.shortTitle,
    })),
    {
      id: 0,
      slug: "other-verified-services",
      title: "Other verified services",
      shortTitle: "Other Services",
    },
  ];

  const practitioners: BookingPractitionerOption[] = PRACTITIONERS.filter(
    (p) => p.department !== "support"
  ).map((p, idx) => ({
    id: idx + 1,
    slug: p.id,
    name: p.name,
    role: p.role,
    qualifications: p.qualifications || "",
    department: p.department,
    departmentLabel: p.departmentLabel,
    serviceSlugs: [departmentToServiceSlug(p.department)],
  }));

  return { services, practitioners, fromBackend: false };
}

export async function fetchBookingOptions(): Promise<BookingOptionsResponse> {
  if (!API_URL) {
    return getStaticBookingOptions();
  }
  try {
    const res = await fetch(`${API_URL}/api/public/booking-options`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Failed to load booking options");
    const data = await res.json();
    return {
      services: data.services || [],
      practitioners: data.practitioners || [],
      fromBackend: true,
    };
  } catch {
    return getStaticBookingOptions();
  }
}

export async function submitAppointment(payload: AppointmentSubmission): Promise<AppointmentResponse> {
  if (!API_URL) {
    const svc =
      payload.serviceLabel ||
      SERVICES_OVERVIEW.find((s) => s.slug === payload.serviceSlug)?.title ||
      "Other verified services";
    const summaryLines = [
      `Appointment Request (Karen Surgery Website)`,
      `Name: ${payload.fullName}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Patient status: ${payload.patientType === "existing" ? "Existing patient" : "New patient"}`,
      `Service: ${svc}`,
      payload.practitionerName ? `Preferred practitioner: ${payload.practitionerName}` : null,
      `Preferred date: ${payload.preferredDate}`,
      payload.preferredTime ? `Preferred time: ${payload.preferredTime}` : null,
      `Preferred contact: ${payload.preferredContact}`,
      payload.message ? `Notes: ${payload.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const mailtoFallback = `mailto:${PRACTICE.contact.email}?subject=${encodeURIComponent(
      `Appointment Request — ${svc} (${payload.preferredDate})`
    )}&body=${encodeURIComponent(summaryLines)}`;
    const whatsappFallback = `${PRACTICE.contact.whatsapp.href}?text=${encodeURIComponent(summaryLines)}`;

    return {
      status: "preview_ready",
      serviceLabel: svc,
      practitionerName: payload.practitionerName || null,
      routedTo: "Karen Surgery Reception",
      acknowledgement:
        "This GitHub Pages preview runs without a live backend server connected. To send your appointment request immediately to Karen Surgery reception, use the pre-filled Email or WhatsApp buttons below (or call +254 (0) 733 642246). When hosted with the Karen Surgery API backend, requests are saved directly to the Admin Portal and routed automatically.",
      staticPreviewMode: true,
      mailtoFallback,
      whatsappFallback,
    };
  }

  const res = await fetch(`${API_URL}/api/public/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      fullName: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      patientType: payload.patientType,
      serviceSlug: payload.serviceSlug,
      practitionerId: payload.practitionerId,
      preferredDate: payload.preferredDate,
      preferredTime: payload.preferredTime,
      preferredContact: payload.preferredContact,
      message: payload.message,
      privacyAccepted: payload.privacyAccepted,
      websiteUrl: payload.websiteUrl || "",
      startedAt: payload.startedAt,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiValidationError(
      data.error || "Unable to submit appointment request right now. Please contact reception directly.",
      res.status,
      data.fieldErrors
    );
  }
  return data as AppointmentResponse;
}

export async function submitEnquiry(payload: EnquirySubmission): Promise<EnquiryResponse> {
  if (!API_URL) {
    const summaryLines = [
      `General Enquiry (Karen Surgery Website${payload.source === "chatbot" ? " — Chatbot" : ""})`,
      `Name: ${payload.fullName}`,
      `Email: ${payload.email}`,
      payload.phone ? `Phone: ${payload.phone}` : null,
      `Category: ${payload.category}`,
      `Subject: ${payload.subject}`,
      `Preferred contact: ${payload.preferredContact}`,
      ``,
      payload.message,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const mailtoFallback = `mailto:${PRACTICE.contact.email}?subject=${encodeURIComponent(
      `[${payload.category}] ${payload.subject}`
    )}&body=${encodeURIComponent(summaryLines)}`;
    const whatsappFallback = `${PRACTICE.contact.whatsapp.href}?text=${encodeURIComponent(summaryLines)}`;

    return {
      status: "preview_ready",
      source: payload.source || "contact_form",
      acknowledgement:
        "This GitHub Pages preview runs without a live backend server connected. You can send your prepared enquiry directly to Karen Surgery reception right now using the pre-filled Email or WhatsApp links below. When deployed with the Karen Surgery backend API, enquiries are persisted and tracked in the Admin Portal.",
      staticPreviewMode: true,
      mailtoFallback,
      whatsappFallback,
    };
  }

  const res = await fetch(`${API_URL}/api/public/enquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiValidationError(
      data.error || "Unable to send your enquiry right now. Please contact reception by phone or email.",
      res.status,
      data.fieldErrors
    );
  }
  return data as EnquiryResponse;
}

// =========================================================================
// Grounded Static Chatbot Mirror (for offline / GitHub Pages static preview)
// Mirrors the exact verified Karen Surgery knowledge & safety guardrails.
// =========================================================================

export const DEFAULT_ESCALATION: ChatbotEscalation = {
  telephone: PRACTICE.contact.receptionPhones[0].display,
  telephoneHref: `tel:${PRACTICE.contact.receptionPhones[0].tel}`,
  whatsapp: PRACTICE.contact.whatsapp.display,
  whatsappHref: PRACTICE.contact.whatsapp.href,
  email: PRACTICE.contact.email,
  emailHref: `mailto:${PRACTICE.contact.email}`,
  emergency: PRACTICE.contact.emergencyPhone.display,
  emergencyHref: `tel:${PRACTICE.contact.emergencyPhone.tel}`,
};

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfigResponse = {
  enabled: true,
  welcomeMessage:
    "Hello, welcome to Karen Surgery. I can help with verified practice information such as opening hours, location, services, practitioners, and how to request an appointment. Please note I cannot provide medical advice or assess emergencies.",
  suggestedQuestions: [
    "What are your opening hours?",
    "Where is Karen Surgery located?",
    "How do I request an appointment?",
    "Do you accept medical insurance?",
    "How do laboratory tests work?",
  ],
  escalation: DEFAULT_ESCALATION,
  fromBackend: false,
};

const EMERGENCY_PATTERNS = [
  /\b(chest pain|heart attack|stroke|cannot breathe|can't breathe|difficulty breathing|shortness of breath|severe bleeding|bleeding heavily|unconscious|passed out|seizure|choking|overdose|poison|poisoned|suicid|kill myself|self[- ]?harm|anaphylax|broken bone|car accident|trauma)\b/i,
  /\b(life[- ]?threatening|need an ambulance|call ambulance|medical emergency)\b/i,
];

const CLINICAL_ADVICE_PATTERNS = [
  /\b(diagnos(e|is)|prescrib(e|ed|ing)|prescription for|what medicine|which medicine|what medication|which drug|dosage|dose of|should i take|can i take|antibiotic|painkiller|cure for|treat my|my symptoms?|i have a fever|i have pain|rash on my|lump on my|swollen|coughing blood|pregnant and bleeding|interpret my lab|test results? mean)\b/i,
  /\b(am i having|do i have|what is wrong with me|could it be cancer|could it be malaria)\b/i,
];

const OUT_OF_SCOPE_PATTERNS = [
  /\b(mri|ct\s*scan|x-?ray|mammogram|dentist|dental|orthodont|optician|optometr|ophthalmolog|chemotherapy|dialysis|inpatient|ward|icu|operating theatre|cosmetic surgery|plastic surgery|pharmacy|chemist)\b/i,
];

const STATIC_FAQS: {
  id: number;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}[] = [
  {
    id: 1,
    category: "Opening Hours",
    question: "What are Karen Surgery opening hours?",
    keywords: ["opening", "hours", "open", "time", "close", "saturday", "sunday", "schedule", "consulting", "afternoon"],
    answer:
      "Reception (Anne Ragui) and Other Health Professionals: Monday to Friday 8:00 am – 4:30 pm, Saturday 9:00 am – 12:00 noon.\n\nDoctors' consulting hours: Monday to Friday 8:00 am – 1:00 pm, Saturday 9:00 am – 12:00 noon. Monday to Friday afternoons are reserved for urgent cases only.\n\nAfter-hours urgent doctor service operates during daylight hours only (7:00 am – 7:00 pm), 365 days a year including public holidays.",
  },
  {
    id: 2,
    category: "Location & Directions",
    question: "Where is Karen Surgery located?",
    keywords: ["where", "location", "address", "directions", "find", "ngong road", "roundabout", "talisman", "map"],
    answer:
      "Karen Surgery is located at 333 Ngong Road, Karen, Nairobi 00502, Kenya — 333 metres from the Karen roundabout along Ngong Road heading towards Ngong, opposite Talisman and just past Karen Shopping Centre. Postal address: P.O. Box 24932, Nairobi 00502.",
  },
  {
    id: 3,
    category: "Appointments",
    question: "How do I book or request an appointment?",
    keywords: ["book", "appointment", "request", "consultation", "schedule", "walk-in", "visit"],
    answer:
      "You can request an appointment using our online Appointment Request form, or by contacting reception during opening hours:\n• Telephone: +254 (0) 733 642246, +254 (0) 775 642246, or +254 (0) 722 646891\n• WhatsApp: +254 (0) 733 642246\n• Email: Receptionist@KarenSurgery.com\n\nPlease note online requests are confirmed by reception or your practitioner. Same-day walk-in consultations are available for serious acute illness.",
  },
  {
    id: 4,
    category: "Emergency & After Hours",
    question: "What should I do in an emergency or after hours?",
    keywords: ["emergency", "urgent", "after hours", "night", "ambulance", "holiday", "weekend"],
    answer:
      "For urgent medical situations during daylight hours (7:00 am – 7:00 pm, 365 days a year including public holidays), call the Karen Surgery Emergencies Only phone: +254 (0) 724 840246.\n\nFor security reasons, Karen Surgery no longer conducts night calls. In any serious emergency, do not waste time — proceed to the nearest hospital or call an ambulance (Karen Hospital +254 702 222222, Red Cross E-Plus +254 700 395395, AAR +254 725 225225, AMREF +254 722 207350, St. John's +254 721 225285).",
  },
  {
    id: 5,
    category: "Fees & Insurance",
    question: "Do you accept medical insurance?",
    keywords: ["insurance", "claim", "nhif", "sha", "aar", "jubilee", "bupa", "cigna", "payment", "domestic staff", "cost", "fee"],
    answer:
      "Karen Surgery is an independent practice and does not deal directly with insurance companies. However, we are happy to complete your insurance claim forms for reimbursement. We also offer subsidised lower-cost care for your domestic staff. For current consultation fee enquiries, please contact reception on +254 (0) 733 642246 or Receptionist@KarenSurgery.com.",
  },
  {
    id: 6,
    category: "Services",
    question: "What services are offered at Karen Surgery?",
    keywords: ["services", "offer", "departments", "disciplines", "specialties", "treatments", "care"],
    answer:
      "Karen Surgery offers multidisciplinary care under one roof:\n• Family Medicine & General Practice (including well-baby, antenatal, chronic disease, vaccinations, wound care, and house visits for the elderly and infirm)\n• On-site Ultrasound & Doppler Services (Dr. Z. A. Kaka)\n• Mental Health (Clinical Psychologist & Counsellors)\n• Physiotherapy (4 internationally trained physiotherapists)\n• Allied Health (Podiatrists, Massage Therapists, Registered Nutritionist)\n• Partner Laboratory specimen collection (CTTM and Pathcare Kenya Ltd)",
  },
  {
    id: 7,
    category: "Doctors & Nursing",
    question: "Who are the doctors and nurse at Karen Surgery?",
    keywords: ["doctors", "gp", "general practitioner", "nurse", "margriet", "cantamessa", "jacqueline", "jackie", "kitulu", "hannah", "murimi", "mbs", "ogw"],
    answer:
      "Our primary care medical team consists of:\n• Dr. Margriet van Unen-van Enk (General Practitioner, co-founder)\n• Dr. Marie-Louise Cantamessa (General Practitioner)\n• Dr. Jacqueline W. Kitulu, MBS, OGW, MD, MBA FCMA (General Practitioner | MBA in Healthcare Management)\n• Mrs. Hannah Murimi (Practice Nurse — vaccinations, blood sampling, dressings & wound care)\n• Dr. Z. A. Kaka (Consultant Radiologist — on-site ultrasound services)",
  },
  {
    id: 8,
    category: "Ultrasound",
    question: "Do you offer ultrasound scans on-site?",
    keywords: ["ultrasound", "sonography", "doppler", "radiologist", "kaka", "imaging"],
    answer:
      "Yes. Consultant Radiologist Dr. Z. A. Kaka provides on-site diagnostic ultrasound services at Karen Surgery, including abdominal, urological, pelvic, gynaecological, obstetric, small parts, musculoskeletal, vascular and obstetric Doppler examinations, and ultrasound-guided interventions.",
  },
  {
    id: 9,
    category: "Mental Health",
    question: "What mental health services do you offer?",
    keywords: ["mental", "psychologist", "counsellor", "counselor", "therapy", "anxiety", "depression", "adhd", "tonya", "judy", "kaye"],
    answer:
      "Karen Surgery has a multidisciplinary mental health team working alongside our GPs: Clinical Psychologist Dr. Tonya Shaw, and Counsellors Judy Gitau and Kaye Alianda McIlwaine. Specialist areas include anxiety, depression, attachment disorders, ADHD, eating disorders, and relationship difficulties. Patients may be referred by a GP or self-refer directly.",
  },
  {
    id: 10,
    category: "Physiotherapy",
    question: "Do you have physiotherapists at Karen Surgery?",
    keywords: ["physiotherapy", "physio", "physical therapy", "rehab", "sports injury", "pelvic", "acupuncture", "anna", "altaf", "sally", "sarah"],
    answer:
      "Yes. We have four internationally trained physiotherapists: Anna Kaminski, Altaf Mapara, Sally Dixson, and Sarah Peacock. Areas include sports injuries, manual therapy, post-surgery orthopaedic rehab, neuro-rehabilitation, paediatric physiotherapy, pelvic health, acupuncture, and home visits where available. Both self-referrals and GP referrals are welcome.",
  },
  {
    id: 11,
    category: "Allied Health",
    question: "What allied health professionals consult at Karen Surgery?",
    keywords: ["allied", "podiatrist", "podiatry", "foot", "massage", "nutritionist", "nutrition", "diet", "fabian", "richard", "megan", "millicent", "alice"],
    answer:
      "Our consulting allied health team includes:\n• Podiatrists: Fabian Collis and Richard Handford\n• Massage Therapists: Megan Anjeri and Millicent Mboya\n• Registered Nutritionist: Alice Coulson",
  },
  {
    id: 12,
    category: "Laboratory Services",
    question: "How do laboratory and blood tests work?",
    keywords: ["lab", "laboratory", "blood test", "specimen", "sample", "cttm", "pathcare", "courier", "mpesa", "results"],
    answer:
      "Karen Surgery does not have its own in-house lab, but works with two partner laboratories: Centre for Tropical & Travel Medicine (CTTM) and Pathcare Kenya Ltd. Our practice nurse collects blood and other specimens on-site for courier pickup at 9:30 am (CTTM) and 1:00 pm (Pathcare). Urgent results are available the same day. The laboratories do not provide credit — payment is required in cash or via M-Pesa the same day.",
  },
  {
    id: 13,
    category: "Immunisations & Vaccinations",
    question: "Do you offer childhood vaccinations, HPV vaccine, and travel vaccines?",
    keywords: ["vaccine", "vaccination", "immunisation", "immunization", "hpv", "baby", "travel vaccine", "flu"],
    answer:
      "Yes. Karen Surgery provides well-baby checks, childhood immunisations, HPV vaccination, routine vaccination updates, and travel medicine advice, with vaccinations administered by our experienced Practice Nurse, Mrs. Hannah Murimi. Reference CDC schedules are available on our Medical Info page.",
  },
  {
    id: 14,
    category: "Contact & Reception",
    question: "How can I contact Karen Surgery reception?",
    keywords: ["contact", "phone", "number", "whatsapp", "email", "reception", "anne"],
    answer:
      "You can contact Karen Surgery reception (Anne Ragui) during opening hours:\n• Telephone: +254 (0) 733 642246 / +254 (0) 775 642246 / +254 (0) 722 646891\n• WhatsApp: +254 (0) 733 642246\n• Email: Receptionist@KarenSurgery.com",
  },
];

function detectLocalCategory(question: string): InquiryCategory {
  const q = question.toLowerCase();
  if (/(mental|psycholog|counsel|therap|anxiety|depress|adhd|eating|tonya|judy|kaye)/.test(q)) return "Mental Health";
  if (/(physio|rehab|pelvic|acupuncture|sports injur|anna|altaf|sally|sarah)/.test(q)) return "Physiotherapy";
  if (/(podiatr|foot|massage|nutrit|diet|fabian|richard|megan|millicent|alice)/.test(q)) return "Allied Health";
  if (/(lab|blood|specimen|cttm|pathcare|sample|test)/.test(q)) return "Laboratory Services";
  if (/(ultrasound|radiolog|doppler|kaka)/.test(q)) return "Other verified services";
  if (/(appointment|book|slot|schedule|visit)/.test(q)) return "Appointment enquiries";
  if (/(doctor|gp|nurse|vaccine|immunis|flu|hpv|antenatal|baby)/.test(q)) return "General Practice";
  return "General enquiries";
}

function wordMatch(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function answerChatbotLocally(question: string, history?: { role: string; text: string }[]): ChatbotReply {
  const q = question.trim();
  const qLower = q.toLowerCase();

  if (EMERGENCY_PATTERNS.some((rx) => rx.test(q))) {
    return {
      type: "emergency",
      answer:
        "IN AN EMERGENCY — DO NOT WASTE TIME.\nPlease call the emergency line, proceed immediately to the nearest hospital, or call an ambulance service. I cannot assess medical emergencies or provide triage.\n\n• Karen Surgery Emergency Phone (Daylight 7:00 am – 7:00 pm, 365 days): +254 (0) 724 840246\n• Night hours: Karen Surgery no longer conducts night calls for security reasons — please go straight to the nearest hospital or call an ambulance:\n  - Karen Hospital: +254 (0) 702 222222\n  - Red Cross E-Plus: +254 (0) 700 395395\n  - AAR: +254 (0) 725 225225\n  - AMREF: +254 (0) 722 207350\n  - St. John's Ambulance: +254 (0) 721 225285",
      suggestedFollowups: [],
      escalation: DEFAULT_ESCALATION,
      offerEnquiryDraft: false,
    };
  }

  if (CLINICAL_ADVICE_PATTERNS.some((rx) => rx.test(q))) {
    return {
      type: "medical_refusal",
      answer:
        "I am a website information assistant and cannot provide medical advice, diagnoses, prescriptions, or clinical symptom assessments.\n\nPlease speak directly with a Karen Surgery clinician or contact reception to request a consultation. If your symptoms are urgent during daylight hours (7:00 am – 7:00 pm), please call +254 (0) 724 840246 or go to the nearest hospital.",
      suggestedFollowups: ["How do I request an appointment?", "What are your opening hours?"],
      escalation: DEFAULT_ESCALATION,
      offerEnquiryDraft: false,
    };
  }

  // Practitioner name lookup
  for (const p of PRACTITIONERS) {
    const tokens = p.name
      .toLowerCase()
      .replace(/[^a-z\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 4 && !["mrs", "dr", "van"].includes(t));
    if (tokens.some((tok) => wordMatch(qLower, tok))) {
      const contactLine = p.email
        ? `\nDirect email: ${p.email}`
        : `\nAppointments & enquiries: Karen Surgery Reception (${PRACTICE.contact.receptionPhones[0].display} / ${PRACTICE.contact.email})`;
      return {
        type: "answer",
        category: p.departmentLabel,
        answer: `${p.name} — ${p.role}${p.qualifications ? ` (${p.qualifications})` : ""} at Karen Surgery (${p.departmentLabel}).\n\n${p.bio[0] || ""}${contactLine}`,
        suggestedFollowups: ["How do I request an appointment?", "What are your opening hours?"],
        escalation: DEFAULT_ESCALATION,
        offerEnquiryDraft: false,
      };
    }
  }

  if (!OUT_OF_SCOPE_PATTERNS.some((rx) => rx.test(q))) {
    let best: { faq: (typeof STATIC_FAQS)[number]; score: number } | null = null;
    for (const faq of STATIC_FAQS) {
      let score = 0;
      for (const kw of faq.keywords) {
        if (wordMatch(qLower, kw)) score += kw.includes(" ") ? 5 : 3;
      }
      if (score >= 3 && (!best || score > best.score)) {
        best = { faq, score };
      }
    }
    if (best) {
      return {
        type: "answer",
        matchedFaqId: best.faq.id,
        category: best.faq.category,
        answer: best.faq.answer,
        suggestedFollowups: DEFAULT_CHATBOT_CONFIG.suggestedQuestions
          .filter((s) => s.toLowerCase() !== best!.faq.question.toLowerCase())
          .slice(0, 3),
        escalation: DEFAULT_ESCALATION,
        offerEnquiryDraft: false,
      };
    }
  }

  const category = detectLocalCategory(q);
  const recentSummary = (history || [])
    .slice(-4)
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.text.slice(0, 140)}`)
    .join("\n");

  return {
    type: "fallback",
    category,
    answer:
      "I do not have verified information on that specific question in our practice knowledge base, and I do not guess or invent clinical or administrative details.\n\nYou can contact Karen Surgery reception directly, or I can prepare a pre-filled enquiry for you to review and edit before sending.",
    suggestedFollowups: ["What are your opening hours?", "What services are offered at Karen Surgery?"],
    escalation: DEFAULT_ESCALATION,
    offerEnquiryDraft: true,
    draftEnquiry: {
      originalQuestion: q,
      category,
      subject: `Website enquiry: ${q.slice(0, 80)}`,
      conversationSummary: recentSummary
        ? `${recentSummary}\nVisitor question: ${q}`
        : `Visitor asked via website assistant: "${q}"`,
    },
  };
}

export async function fetchChatbotConfig(): Promise<ChatbotConfigResponse> {
  if (!API_URL) return DEFAULT_CHATBOT_CONFIG;
  try {
    const res = await fetch(`${API_URL}/api/public/chatbot/config`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    return { ...data, fromBackend: true };
  } catch {
    return DEFAULT_CHATBOT_CONFIG;
  }
}

export async function askChatbot(params: {
  question: string;
  sessionId: string;
  history: { role: "user" | "assistant"; text: string }[];
}): Promise<ChatbotReply> {
  if (!API_URL) {
    return answerChatbotLocally(params.question, params.history);
  }
  const res = await fetch(`${API_URL}/api/public/chatbot/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error("The practice assistant is temporarily unavailable. Please contact reception directly.");
  }
  return (await res.json()) as ChatbotReply;
}
