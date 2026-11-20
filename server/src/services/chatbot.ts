import { type DbClient, getDb, nowIso } from "../db/database.js";

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
    category: string;
    subject: string;
    conversationSummary: string;
  };
}

const EMERGENCY_PATTERNS = [
  /\b(chest pain|heart attack|stroke|cannot breathe|can't breathe|difficulty breathing|shortness of breath|severe bleeding|bleeding heavily|unconscious|passed out|seizure|choking|overdose|poison|poisoned|suicid|kill myself|self[- ]?harm|anaphylax|broken bone|car accident|trauma)\b/i,
  /\b(life[- ]?threatening|need an ambulance|call ambulance|medical emergency)\b/i,
];

const CLINICAL_ADVICE_PATTERNS = [
  /\b(diagnos(e|is)|prescrib(e|ed|ing)|prescription for|what medicine|which medicine|what medication|which drug|dosage|dose of|should i take|can i take|antibiotic|painkiller|cure for|treat my|my symptoms?|i have a fever|i have pain|rash on my|lump on my|swollen|coughing blood|pregnant and bleeding|interpret my lab|test results? mean)\b/i,
  /\b(am i having|do i have|what is wrong with me|could it be cancer|could it be malaria)\b/i,
];

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "do", "does", "did", "can", "could", "would",
  "should", "i", "me", "my", "we", "you", "your", "they", "their", "to", "for", "of", "in",
  "on", "at", "by", "with", "about", "from", "as", "or", "and", "it", "this", "that", "there",
  "be", "have", "has", "had", "what", "when", "where", "who", "how", "please", "hi", "hello",
  "karen", "surgery", "clinic",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

export function detectInquiryCategory(question: string): string {
  const q = question.toLowerCase();
  if (/(mental|psycholog|counsel|therap|anxiety|depress|adhd|eating|tonya|judy|kaye)/.test(q)) return "Mental Health";
  if (/(physio|rehab|pelvic|acupuncture|sports injur|anna|altaf|sally|sarah)/.test(q)) return "Physiotherapy";
  if (/(podiatr|foot|massage|nutrit|diet|fabian|richard|megan|millicent|alice)/.test(q)) return "Allied Health";
  if (/(lab|blood|specimen|cttm|pathcare|sample|test)/.test(q)) return "Laboratory Services";
  if (/(ultrasound|scan|radiolog|doppler|kaka)/.test(q)) return "Other verified services";
  if (/(appointment|book|slot|schedule|visit)/.test(q)) return "Appointment enquiries";
  if (/(doctor|gp|nurse|vaccine|immunis|flu|hpv|antenatal|baby)/.test(q)) return "General Practice";
  return "General enquiries";
}

async function getEscalationAndConfig(db: DbClient) {
  const row = await db.get<{ chatbot_config_json: string; emergency_json: string; contact_json: string }>(
    "SELECT chatbot_config_json, emergency_json, contact_json FROM website_settings WHERE id = 1"
  );
  const cfg = row ? JSON.parse(row.chatbot_config_json || "{}") : {};
  const contact = row ? JSON.parse(row.contact_json || "{}") : {};
  const emergency = row ? JSON.parse(row.emergency_json || "{}") : {};

  const telDisplay = cfg?.escalationContacts?.telephone || contact?.receptionPhones?.[0]?.display || "+254 733 642246";
  const waDisplay = cfg?.escalationContacts?.whatsapp || contact?.whatsapp?.display || "+254 733 642246";
  const email = cfg?.escalationContacts?.email || contact?.email || "Receptionist@KarenSurgery.com";
  const emerDisplay = cfg?.escalationContacts?.emergency || emergency?.phoneDisplay || "+254 724 840246";

  const cleanDigits = (s: string) => s.replace(/[^+\d]/g, "");
  const waDigits = waDisplay.replace(/\D/g, "").replace(/^0/, "254");

  return {
    enabled: cfg.enabled !== false,
    welcomeMessage: cfg.welcomeMessage || "Hello, welcome to Karen Surgery.",
    suggestedQuestions: (cfg.suggestedQuestions || []) as string[],
    escalation: {
      telephone: telDisplay,
      telephoneHref: `tel:${cleanDigits(telDisplay)}`,
      whatsapp: waDisplay,
      whatsappHref: `https://wa.me/${waDigits}`,
      email,
      emailHref: `mailto:${email}`,
      emergency: emerDisplay,
      emergencyHref: `tel:${cleanDigits(emerDisplay)}`,
    } as ChatbotEscalation,
  };
}

export async function getPublicChatbotConfig(db: DbClient = getDb()) {
  return getEscalationAndConfig(db);
}

const OUT_OF_SCOPE_SERVICE_PATTERNS = [
  /\b(mri|ct\s*scan|x-?ray|mammogram|dentist|dental|orthodont|optician|optometr|ophthalmolog|chemotherapy|dialysis|inpatient|ward|icu|operating theatre|cosmetic surgery|plastic surgery|pharmacy|chemist)\b/i,
];

function wordMatch(text: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export async function answerChatbotQuestion(params: {
  question: string;
  sessionId?: string;
  history?: { role: string; text: string }[];
  db?: DbClient;
}): Promise<ChatbotReply> {
  const db = params.db || getDb();
  const question = params.question.trim();
  const sessionId = (params.sessionId || "anon").slice(0, 64);
  const { enabled, escalation, suggestedQuestions } = await getEscalationAndConfig(db);

  if (!enabled) {
    return {
      type: "disabled",
      answer:
        "The website assistant is currently unavailable. Please contact Karen Surgery reception directly by telephone, WhatsApp, or email.",
      suggestedFollowups: [],
      escalation,
      offerEnquiryDraft: false,
    };
  }

  // 1. EMERGENCY GUARDRAIL (Strictest priority — never attempt triage)
  if (EMERGENCY_PATTERNS.some((rx) => rx.test(question))) {
    await db.run(
      `INSERT INTO chatbot_conversations (session_id, question, response_type, escalated, created_at)
       VALUES ($1, $2, 'emergency', 1, $3)`,
      [sessionId, question.slice(0, 500), nowIso()]
    );
    return {
      type: "emergency",
      answer:
        "**IN AN EMERGENCY — DO NOT WASTE TIME.**\nPlease call the emergency line, proceed immediately to the nearest hospital, or call an ambulance service. I cannot assess medical emergencies or provide triage.\n\n• **Karen Surgery Emergency Phone (Daylight 7:00 am – 7:00 pm, 365 days):** " +
        escalation.emergency +
        "\n• **Night hours:** Karen Surgery no longer conducts night calls for security reasons — please go straight to the nearest hospital or call an ambulance:\n  - Karen Hospital: +254 (0) 702 222222\n  - Red Cross E-Plus: +254 (0) 700 395395\n  - AAR: +254 (0) 725 225225\n  - AMREF: +254 (0) 722 207350\n  - St. John's Ambulance: +254 (0) 721 225285",
      suggestedFollowups: [],
      escalation,
      offerEnquiryDraft: false,
    };
  }

  // 2. CLINICAL / MEDICAL ADVICE REFUSAL GUARDRAIL
  if (CLINICAL_ADVICE_PATTERNS.some((rx) => rx.test(question))) {
    await db.run(
      `INSERT INTO chatbot_conversations (session_id, question, response_type, escalated, created_at)
       VALUES ($1, $2, 'medical_refusal', 1, $3)`,
      [sessionId, question.slice(0, 500), nowIso()]
    );
    return {
      type: "medical_refusal",
      answer:
        "I am an administrative website assistant and **cannot diagnose conditions, interpret symptoms or test results, recommend medications, or give clinical advice**.\n\nPlease speak directly with a Karen Surgery doctor by requesting an appointment or calling reception on " +
        escalation.telephone +
        ". If your symptoms are urgent or worsening, call our emergency line (" +
        escalation.emergency +
        ") during daylight hours (7am–7pm) or go to the nearest hospital.",
      category: "General Practice",
      suggestedFollowups: ["How do I request an appointment?", "What are your opening hours?"],
      escalation,
      offerEnquiryDraft: false,
    };
  }

  // 3. DIRECT PRACTITIONER LOOKUP (Grounded in live active & approved DB profiles)
  const qLower = question.toLowerCase();
  const practitioners = await db.all<{
    id: number;
    name: string;
    role_title: string;
    qualifications: string;
    department_label: string;
    email: string | null;
    phones_json: string;
    bio_json: string;
  }>(
    "SELECT id, name, role_title, qualifications, department_label, email, phones_json, bio_json FROM practitioners WHERE is_active = 1 AND is_approved = 1 AND is_archived = 0"
  );

  for (const p of practitioners) {
    const nameTokens = p.name
      .toLowerCase()
      .replace(/dr\.|mrs\.|mr\.|ms\./g, "")
      .split(/[\s-]+/)
      .filter((t) => t.length >= 4);
    const matchedName = nameTokens.some((tok) => new RegExp(`\\b${tok}\\b`, "i").test(qLower));
    if (matchedName) {
      const bioArr = JSON.parse(p.bio_json || "[]") as string[];
      const phones = JSON.parse(p.phones_json || "[]") as { display: string }[];
      const contactParts: string[] = [];
      if (p.email) contactParts.push(`Email: ${p.email}`);
      if (phones.length > 0) contactParts.push(`Tel: ${phones.map((x) => x.display).join(", ")}`);
      const summary = [
        `**${p.name}** — ${p.role_title}${p.qualifications ? ` (${p.qualifications})` : ""} [${p.department_label}]`,
        bioArr[0] || "",
        contactParts.length > 0
          ? `Direct contact: ${contactParts.join(" · ")}`
          : `Appointments are arranged via Reception (${escalation.telephone}).`,
      ]
        .filter(Boolean)
        .join("\n\n");

      await db.run(
        `INSERT INTO chatbot_conversations (session_id, question, response_type, escalated, created_at)
         VALUES ($1, $2, 'practitioner_match', 0, $3)`,
        [sessionId, question.slice(0, 500), nowIso()]
      );

      return {
        type: "answer",
        answer: summary,
        category: p.department_label,
        suggestedFollowups: ["How do I request an appointment?", "What are your opening hours?"],
        escalation,
        offerEnquiryDraft: false,
      };
    }
  }

  // 4. RETRIEVAL OVER APPROVED & PUBLISHED FAQ KNOWLEDGE BASE
  const isExplicitlyOutOfScope = OUT_OF_SCOPE_SERVICE_PATTERNS.some((rx) => rx.test(question));
  const faqs = isExplicitlyOutOfScope
    ? []
    : await db.all<{
        id: number;
        category: string;
        question: string;
        answer: string;
        keywords_json: string;
        suggested_followups_json: string;
      }>(
        "SELECT id, category, question, answer, keywords_json, suggested_followups_json FROM chatbot_faqs WHERE is_published = 1 AND is_approved = 1 ORDER BY sort_order ASC, id ASC"
      );

  const qTokens = tokenize(question);
  let bestFaq: (typeof faqs)[number] | null = null;
  let bestScore = 0;

  for (const faq of faqs) {
    const keywords = (JSON.parse(faq.keywords_json || "[]") as string[]).map((k) => k.toLowerCase());
    const faqTokens = new Set(tokenize(`${faq.question} ${faq.category}`));
    let score = 0;

    // Word-boundary keyword matching (prevents false substring matches)
    for (const kw of keywords) {
      if (kw.includes(" ") && qLower.includes(kw)) {
        score += 4.5;
      } else if (wordMatch(qLower, kw)) {
        score += 2.6;
      }
    }

    // Token overlap against FAQ question & category
    for (const tok of qTokens) {
      if (faqTokens.has(tok)) {
        score += 1.4;
      } else {
        for (const ft of faqTokens) {
          if (tok.length >= 5 && ft.length >= 5 && (ft.startsWith(tok.slice(0, 5)) || tok.startsWith(ft.slice(0, 5)))) {
            score += 0.9;
            break;
          }
        }
      }
    }

    // Exact question match boost
    if (faq.question.toLowerCase() === qLower) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  if (bestFaq && bestScore >= 2.5) {
    const followups = JSON.parse(bestFaq.suggested_followups_json || "[]") as string[];
    await db.run(
      `INSERT INTO chatbot_conversations (session_id, question, response_type, matched_faq_id, escalated, created_at)
       VALUES ($1, $2, 'faq_match', $3, 0, $4)`,
      [sessionId, question.slice(0, 500), bestFaq.id, nowIso()]
    );
    return {
      type: "answer",
      answer: bestFaq.answer,
      matchedFaqId: bestFaq.id,
      category: bestFaq.category,
      suggestedFollowups: followups.length > 0 ? followups : suggestedQuestions.slice(0, 2),
      escalation,
      offerEnquiryDraft: false,
    };
  }

  // 5. CONTROLLED FALLBACK + LOG UNANSWERED QUESTION + OFFER EDITABLE ENQUIRY DRAFT
  const detectedCategory = detectInquiryCategory(question);
  const ts = nowIso();
  await db.run(
    `INSERT INTO chatbot_unanswered (question, detected_category, session_id, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'open', $4, $4)`,
    [question.slice(0, 500), detectedCategory, sessionId, ts]
  );
  await db.run(
    `INSERT INTO chatbot_conversations (session_id, question, response_type, escalated, created_at)
     VALUES ($1, $2, 'fallback', 1, $3)`,
    [sessionId, question.slice(0, 500), ts]
  );

  const recentUserTurns = (params.history || [])
    .filter((h) => h.role === "user")
    .slice(-3)
    .map((h) => h.text.trim())
    .filter(Boolean);
  const summaryLines = Array.from(new Set([...recentUserTurns, question])).slice(-3);
  const conversationSummary =
    summaryLines.length > 1
      ? `Visitor asked about: ${summaryLines.join(" | ")}`
      : `Visitor asked via Website Assistant: "${question}"`;

  return {
    type: "fallback",
    answer:
      "I don't have verified information on that specific question in our approved knowledge base, and I won't guess. I can prepare a short enquiry for **Karen Surgery reception** (which you can review and edit before sending), or you can reach reception directly using the options below.",
    category: detectedCategory,
    suggestedFollowups: [],
    escalation,
    offerEnquiryDraft: true,
    draftEnquiry: {
      originalQuestion: question.slice(0, 400),
      category: detectedCategory,
      subject: `Website enquiry: ${detectedCategory}`,
      conversationSummary: conversationSummary.slice(0, 500),
    },
  };
}
