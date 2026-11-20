import { type DbClient, getDb, nowIso } from "./database.js";
import { runMigrations } from "./migrate.js";

const ROLES = [
  {
    code: "SUPER_ADMIN",
    name: "Super Administrator",
    description: "Full system access including user management, emergency contact configuration, and audit logs.",
  },
  {
    code: "CONTENT_ADMIN",
    name: "Content Administrator",
    description: "Manage pages, sections, practitioners, services, media library, chatbot knowledge, and public content.",
  },
  {
    code: "RECEPTION_OPERATIONS",
    name: "Reception / Operations",
    description: "Manage appointment requests, patient enquiries, assignments, internal notes, and request statuses.",
  },
  {
    code: "READ_ONLY",
    name: "Read Only",
    description: "View permitted operational and content records with no create, update, or delete permissions.",
  },
];

const PERMISSIONS: { code: string; description: string; roles: string[] }[] = [
  { code: "dashboard.read", description: "View dashboard statistics", roles: ["SUPER_ADMIN", "CONTENT_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"] },
  { code: "appointments.read", description: "View appointment requests", roles: ["SUPER_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"] },
  { code: "appointments.write", description: "Update appointment requests, status, assignment, and internal notes", roles: ["SUPER_ADMIN", "RECEPTION_OPERATIONS"] },
  { code: "enquiries.read", description: "View enquiries", roles: ["SUPER_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"] },
  { code: "enquiries.write", description: "Update enquiries, status, assignment, and internal notes", roles: ["SUPER_ADMIN", "RECEPTION_OPERATIONS"] },
  { code: "cms.read", description: "View pages, practitioners, services, media, and settings", roles: ["SUPER_ADMIN", "CONTENT_ADMIN", "READ_ONLY"] },
  { code: "cms.write", description: "Create, edit, publish, archive pages, practitioners, services, and media", roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { code: "chatbot.read", description: "View chatbot FAQs, unanswered questions, and settings", roles: ["SUPER_ADMIN", "CONTENT_ADMIN", "RECEPTION_OPERATIONS", "READ_ONLY"] },
  { code: "chatbot.write", description: "Manage chatbot FAQs, publish/approve knowledge, and settings", roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { code: "settings.write", description: "Update website hours, contact, navigation, and footer settings", roles: ["SUPER_ADMIN", "CONTENT_ADMIN"] },
  { code: "settings.emergency", description: "Update emergency contact numbers and notices", roles: ["SUPER_ADMIN"] },
  { code: "users.read", description: "View admin users and roles", roles: ["SUPER_ADMIN"] },
  { code: "users.write", description: "Create/edit admin users and assign roles", roles: ["SUPER_ADMIN"] },
  { code: "audit.read", description: "View administrative audit logs", roles: ["SUPER_ADMIN"] },
];

const SYSTEM_MEDIA = [
  { key: "practice/karen-surgery-building", file: "karen-surgery-building.jpg", w: 1280, h: 622, alt: "Karen Surgery timber clinic building surrounded by trees at 333 Ngong Road, Karen, Nairobi" },
  { key: "practice/karen-surgery-entrance", file: "karen-surgery-entrance.jpg", w: 680, h: 460, alt: "Karen Surgery veranda entrance with red timber doors" },
  { key: "reception/anne-ragui", file: "anne-ragui.jpg", w: 720, h: 744, alt: "Portrait of Anne Ragui, Receptionist at Karen Surgery" },
  { key: "doctors/dr-margriet-van-unen", file: "dr-margriet-van-unen.jpg", w: 299, h: 491, alt: "Portrait of Dr. Margriet van Unen-van Enk, General Practitioner" },
  { key: "doctors/dr-marie-louise-cantamessa", file: "dr-marie-louise-cantamessa.jpg", w: 627, h: 820, alt: "Portrait of Dr. Marie-Louise Cantamessa, General Practitioner" },
  { key: "doctors/dr-jacqueline-kitulu", file: "dr-jacqueline-kitulu.jpg", w: 819, h: 1024, alt: "Portrait of Dr. Jacqueline W. Kitulu, MBS, OGW, MD, MBA FCMA, General Practitioner" },
  { key: "doctors/hannah-murimi", file: "hannah-murimi.jpg", w: 720, h: 960, alt: "Portrait of Mrs. Hannah Murimi, Practice Nurse" },
  { key: "doctors/dr-zohair-kaka", file: "dr-zohair-kaka.jpg", w: 295, h: 354, alt: "Portrait of Dr. Z. A. Kaka, Consultant Radiologist" },
  { key: "doctors/eunice-muthoni-mugo", file: "eunice-muthoni-mugo.jpg", w: 720, h: 960, alt: "Portrait of Eunice Muthoni Mugo, Office Assistant" },
  { key: "mental-health/dr-tonya-shaw", file: "dr-tonya-shaw.jpg", w: 659, h: 839, alt: "Portrait of Dr. Tonya Shaw, Clinical Psychologist" },
  { key: "mental-health/judy-gitau", file: "judy-gitau.jpg", w: 400, h: 293, alt: "Portrait of Judy Gitau, Counselor" },
  { key: "mental-health/kaye-alianda-mcilwaine", file: "kaye-alianda-mcilwaine.jpg", w: 450, h: 600, alt: "Portrait of Kaye Alianda McIlwaine, Counselor" },
  { key: "physiotherapy/anna-kaminski", file: "anna-kaminski.jpg", w: 346, h: 411, alt: "Portrait of Anna Kaminski, Physiotherapist" },
  { key: "physiotherapy/altaf-mapara", file: "altaf-mapara.jpg", w: 720, h: 897, alt: "Portrait of Altaf Mapara, Physical Therapist" },
  { key: "physiotherapy/sally-dixson", file: "sally-dixson.jpg", w: 433, h: 682, alt: "Portrait of Sally Dixson, Physiotherapist" },
  { key: "physiotherapy/sarah-peacock", file: "sarah-peacock.jpg", w: 720, h: 652, alt: "Portrait of Sarah Peacock, Physiotherapist" },
  { key: "allied-health/fabian-collis", file: "fabian-collis.jpg", w: 465, h: 549, alt: "Portrait of Fabian Collis, Podiatrist" },
  { key: "allied-health/megan-anjeri", file: "megan-anjeri.jpg", w: 318, h: 320, alt: "Portrait of Megan Anjeri, Massage Therapist" },
  { key: "allied-health/millicent-mboya", file: "millicent-mboya.jpg", w: 720, h: 960, alt: "Portrait of Millicent Mboya, Massage Therapist" },
  { key: "allied-health/richard-handford", file: "richard-handford.jpg", w: 671, h: 959, alt: "Portrait of Richard Handford, Podiatrist" },
  { key: "allied-health/alice-coulson", file: "alice-coulson.jpg", w: 213, h: 320, alt: "Portrait of Alice Coulson, Nutritionist" },
  { key: "medical-info/cdc-immunization-schedule-2025", file: "cdc-immunization-schedule-2025.jpg", w: 1280, h: 935, alt: "CDC Table 1 Recommended Child and Adolescent Immunization Schedule 2025" },
  { key: "medical-info/cdc-hpv-vaccine-guide-2021", file: "cdc-hpv-vaccine-guide-2021.jpg", w: 1280, h: 1659, alt: "CDC HPV Vaccine for Preteens and Teens Fact Sheet" },
  { key: "location/karen-surgery-directions-map", file: "karen-surgery-directions-map.jpg", w: 650, h: 508, alt: "Karen Surgery schematic street map from Karen Roundabout" },
];

const SERVICES_SEED = [
  {
    slug: "family-medicine",
    title: "Family Medicine & Nursing",
    short_title: "Family Medicine",
    icon: "stethoscope",
    href: "/doctors/",
    description:
      "Primary care family medicine for people of all ages — from well-baby checks and antenatal care to acute illness, chronic disease management, vaccinations, and wound care.",
    highlights: [
      "Three experienced General Practitioners & Practice Nurse",
      "Same-day walk-in acute care & booked appointments",
      "Dressings, wound care & vaccinations by Mrs. Hannah Murimi",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 1,
  },
  {
    slug: "ultrasound",
    title: "Ultrasound Services",
    short_title: "Ultrasound & Radiology",
    icon: "scan",
    href: "/doctors/#ultrasound",
    description:
      "On-site diagnostic ultrasound and Doppler examinations provided by Consultant Radiologist Dr. Z. A. Kaka, eliminating the need to travel across Nairobi for imaging.",
    highlights: [
      "Abdominal, urological, pelvic, gynaecological & obstetric scans",
      "Vascular & obstetric Doppler examinations",
      "Small parts, musculoskeletal & ultrasound-guided interventions",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 2,
  },
  {
    slug: "mental-health",
    title: "Mental Health",
    short_title: "Mental Health",
    icon: "brain",
    href: "/mental-health/",
    description:
      "A centre for excellence in mental health with psychologists and counsellors working collaboratively with GPs to support children, adolescents, adults, and families.",
    highlights: [
      "Anxiety, depression, attachment disorders, ADHD & eating disorders",
      "CBT, Schema Therapy, ACT, CFT, RLT & TRE modalities",
      "GP referral or self-referral with optional GP medical support",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 3,
  },
  {
    slug: "physiotherapy",
    title: "Physiotherapy",
    short_title: "Physiotherapy",
    icon: "activity",
    href: "/physiotherapy/",
    description:
      "Four internationally trained physiotherapists offering sports injury rehabilitation, neuro-rehabilitation, paediatric physiotherapy, pelvic health, and acupuncture.",
    highlights: [
      "Sports injuries, manual therapy & post-surgery orthopaedic rehab",
      "Neuro-rehabilitation, cardiac/respiratory & paediatric care",
      "Pelvic health & pre/postnatal care; home visits available",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 4,
  },
  {
    slug: "allied-health",
    title: "Allied Health Professionals",
    short_title: "Allied Health",
    icon: "heart-handshake",
    href: "/allied-health-professionals/",
    description:
      "Podiatrists, holistic and sports massage therapists, and a registered nutritionist consulting alongside the surgery's doctors as part of one multidisciplinary team.",
    highlights: [
      "Podiatry — biomechanics, diabetic foot & ulcer management",
      "Holistic, sports, pregnancy, newborn & therapeutic massage",
      "Evidence-based nutrition, gut health & diabetes meal planning",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 5,
  },
  {
    slug: "laboratory-services",
    title: "Laboratory Services",
    short_title: "Laboratory Services",
    icon: "flask",
    href: "/laboratory-services/",
    description:
      "Specimen collection on-site by our practice nurse with twice-daily courier collections by partner laboratories CTTM and Pathcare Kenya Ltd.",
    highlights: [
      "9:30 am courier collection by CTTM",
      "1:00 pm courier collection by Pathcare Kenya Ltd",
      "Urgent results available the same day",
    ],
    contact_email: "Receptionist@KarenSurgery.com",
    sort_order: 6,
  },
];

// Strictly verified from https://www.karensurgery.com — zero invented personnel or emails
const PRACTITIONERS_SEED = [
  {
    slug: "dr-margriet-van-unen",
    name: "Dr. Margriet van Unen-van Enk",
    qualifications: "M.D., MBBS, Family and Tropical Medicine",
    role_title: "General Practitioner",
    department: "doctors",
    department_label: "Doctors & Medical Staff",
    department_href: "/doctors/",
    media_key: "doctors/dr-margriet-van-unen",
    image_position: "50% 62%",
    service_slugs: ["family-medicine"],
    email: null,
    phones: [],
    bio: [
      "Dr. Margriet van Unen is from Holland, where she graduated at the Free University of Amsterdam. She is specialised in Family Medicine and Tropical Medicine. She has worked in rural hospitals in Sudan and Yemen for four years and in Nazareth Mission Hospital for six years. In 1991 she started Karen Surgery with Dr. Judy Shaw. She has done voluntary work in Nepal and Peru and has worked as an expedition doctor on several Classic Car/Volvo rallies in South America, Central America, USA, Canada, South East Asia, the Silk Route, Mongolia and Russia.",
    ],
  },
  {
    slug: "dr-marie-louise-cantamessa",
    name: "Dr. Marie-Louise Cantamessa",
    qualifications: "MBBS(Hons), MPH&TM, MBioeth",
    role_title: "General Practitioner",
    department: "doctors",
    department_label: "Doctors & Medical Staff",
    department_href: "/doctors/",
    media_key: "doctors/dr-marie-louise-cantamessa",
    image_position: "50% 20%",
    service_slugs: ["family-medicine"],
    email: null,
    phones: [],
    bio: [
      "I love working with children, and as a GP I am able to treat the child within the family. I find it very rewarding to provide antenatal care to a mother, see her newborn for growth and development checks, and at the same time vaccinate the father and grandparents to 'cocoon' the baby. Before joining Karen Surgery I worked at Gertrude's Garden Children's Hospital and at Dr Colin Forbes' paediatric clinic in Nairobi. The Karen Surgery team approach allows me to work with our fabulous practice nurse Hannah Murimi, who has turned vaccinating young children into an art form; and with psychologists to assess and treat children with ADHD.",
      "I studied medicine at the University of Queensland and did my initial training in Australia. I have additional masters degrees in public health and tropical medicine from James Cook University, and in bioethics from Monash University.",
    ],
  },
  {
    slug: "dr-jacqueline-kitulu",
    name: "Dr. Jacqueline W. Kitulu",
    qualifications: "MBS, OGW, MD, MBA FCMA",
    role_title: "General Practitioner | MBA in Healthcare Management",
    department: "doctors",
    department_label: "Doctors & Medical Staff",
    department_href: "/doctors/",
    media_key: "doctors/dr-jacqueline-kitulu",
    image_position: "50% 15%",
    service_slugs: ["family-medicine"],
    email: null,
    phones: [],
    bio: [
      "Dr. Jackie Kitulu is an experienced General Practitioner with over 25 years of clinical practice. A graduate of the University of Nairobi, she holds an MBA in Healthcare Management from Strathmore Business School. She is committed to holistic, compassionate and patient-centred care, with a strong belief in building trusting, long-term relationships with her patients.",
      "She has distinguished herself through national and international medical leadership, having served as President of the Kenya Medical Association (2016–2020) and President of the World Medical Association (2025–2026), becoming the first Kenyan to hold this prestigious international position.",
      "In recognition of her contribution to medicine, leadership and public service, she has been awarded the Moran of the Order of the Burning Spear (MBS) and the Order of the Grand Warrior (OGW) by the Government of Kenya.",
      "Despite her extensive leadership experience, her greatest professional fulfilment remains caring for patients and making a meaningful difference in their health and wellbeing.",
    ],
  },
  {
    slug: "mrs-hannah-murimi",
    name: "Mrs. Hannah Murimi",
    qualifications: "",
    role_title: "Practice Nurse",
    department: "doctors",
    department_label: "Doctors & Medical Staff",
    department_href: "/doctors/",
    media_key: "doctors/hannah-murimi",
    image_position: "50% 22%",
    service_slugs: ["family-medicine", "laboratory-services"],
    email: null,
    phones: [],
    bio: [
      "Hannah has been the practice nurse at Karen Surgery since 2004. She has turned vaccinating young children into an art form, and is very good at getting blood samples from people with 'difficult veins'. She is an expert in managing wounds, from dog bites to wounds sustained from complex trauma and diabetic ulcers.",
    ],
  },
  {
    slug: "dr-z-a-kaka",
    name: "Dr. Z. A. Kaka",
    qualifications: "",
    role_title: "Consultant Radiologist",
    department: "radiology",
    department_label: "Ultrasound Services",
    department_href: "/doctors/#ultrasound",
    media_key: "doctors/dr-zohair-kaka",
    image_position: "50% 25%",
    service_slugs: ["ultrasound"],
    email: null,
    phones: [],
    bullet_heading: "The Ultrasounds offered are:",
    bullet_items: [
      "Abdominal / urological",
      "Pelvic / gynaecological",
      "Obstetric",
      "Small parts & Musculoskeletal",
      "Regional",
      "All Vascular and obstetric DOPPLER examinations",
      "Ultrasound guided interventions – FNAC, aspiration, drainage",
    ],
    bio: [
      "Dr. Zohair Kaka is a Consultant Radiologist with 29 years' experience in hospital and private practice.",
      "He now offers Ultrasound services at Karen Surgery. This results in considerable convenience for patients in this locality, who can have these investigations done immediately and do not have to travel far for these services.",
    ],
  },
  {
    slug: "dr-tonya-shaw",
    name: "Dr. Tonya Shaw",
    qualifications: "BSc., Clin.Psy.D., C.Psychol., AFBPsS.",
    role_title: "Clinical Psychologist",
    department: "mental-health",
    department_label: "Mental Health",
    department_href: "/mental-health/",
    media_key: "mental-health/dr-tonya-shaw",
    image_position: "50% 22%",
    service_slugs: ["mental-health"],
    email: "Dr_TonyaShaw@KarenSurgery.com",
    phones: [{ display: "+254 (0) 733 642 246", tel: "+254733642246" }],
    bio: [
      "Tonya has a doctorate in Clinical Psychology from the University of Birmingham (UK) and is an Associate Fellow of the British Psychological Society and a member of the Kenya Psychological Association. Tonya has been part of Karen Surgery since 1996. Tonya specialises in Adult Mental Health. This covers a wide range of difficulties: depression, anxiety and panic disorders, relationship difficulties, post traumatic stress disorder, obsessive compulsive disorders to name a few. In addition Tonya has a specialist interest in Eating Disorders. Tonya has trained in a number of models; mainly Cognitive Behavioural Therapy (CBT), Schema Therapy (SFCBT), Acceptance and Commitment Therapy (ACT), Compassion Focussed Therapy (CFT) and Relational Life Therapy (RLT).",
    ],
  },
  {
    slug: "judy-gitau",
    name: "Judy Gitau",
    qualifications: "BSc Psych",
    role_title: "Counselor",
    department: "mental-health",
    department_label: "Mental Health",
    department_href: "/mental-health/",
    media_key: "mental-health/judy-gitau",
    image_position: "50% 22%",
    service_slugs: ["mental-health"],
    email: "judigitau@gmail.com",
    phones: [{ display: "+254 (0) 717 219 386", tel: "+254717219386" }],
    bio: [
      "Judy trained in USA and Kenya. She has a Bachelor's degree in Psychology, Certificate in Trainer in Counseling, Certificate in Supervision in Counseling and Certificate in HIV testing & Adherence Counseling. She's registered with the Kenya Counselors Psychologists Association (KCPA).",
      "Judy worked in Pennsylvania, USA with a mental health agency for 10 years that provided a variety of community-integrated residential options for adults with developmental and intellectual disabilities. Upon returning to Kenya she volunteered with a special needs school in Kangemi for 2 years. She then did an internship at Amani Counseling Centre Training Institute (ACCTI) as a counselor and trainer/facilitator.",
      "Judy works with adults and adolescents in dealing with relationships, HIV status & treatment, terminal illness, bereavement-loss and grief, stress management, anger management, self-awareness/self-esteem & empowerment, just to name a few.",
    ],
  },
  {
    slug: "kaye-alianda-mcilwaine",
    name: "Kaye Alianda McIlwaine",
    qualifications: "",
    role_title: "Counselor",
    department: "mental-health",
    department_label: "Mental Health",
    department_href: "/mental-health/",
    media_key: "mental-health/kaye-alianda-mcilwaine",
    image_position: "44% 24%",
    service_slugs: ["mental-health"],
    email: "kayealianda@gmail.com",
    phones: [{ display: "+254 (0) 721 722 936", tel: "+254721722936" }],
    quote: "“When we are no longer able to change a situation, we are challenged to change ourselves” — Viktor Frankl",
    bio: [
      "Kaye trained in South Africa, with the Health Professionals Council of South Africa (HPCSA), and in Kenya. She has a Master of Social Sciences Degree (Community Mental Health Promotion), a Bachelor of Psychology-Honours, a Master's degree in Master of Arts, and a French Bachelor of Education. She is also a Trauma/Tension Release Exercises (TRE) facilitator.",
      "Kaye is multi-lingual, and speaks amongst other languages French and Kiswahili. She is an empathic listener, firm yet approachable, skills that she developed over her professional training and experience as both a counsellor and educator, to both young adolescents and adults.",
    ],
  },
  {
    slug: "anna-kaminski",
    name: "Anna Kaminski",
    qualifications: "BAppSc Physiotherapy, BA Hmn Mvt",
    role_title: "Physiotherapist",
    department: "physiotherapy",
    department_label: "Physiotherapy",
    department_href: "/physiotherapy/",
    media_key: "physiotherapy/anna-kaminski",
    image_position: "50% 35%",
    service_slugs: ["physiotherapy"],
    specialties: ["Sports Physiotherapy", "Manual Therapy", "Orthopaedic Rehab", "Gerontology"],
    email: "annakaminski@icloud.com",
    phones: [
      { display: "+254 (0) 728 600018", tel: "+254728600018" },
      { display: "+254 (0) 703 888091", tel: "+254703888091" },
    ],
    bio: [
      "Anna is an Australian physiotherapist with degrees in Sports Science and Physiotherapy. She is an experienced manual therapist and sports specialist who worked for one of Sydney's rugby union teams for 5 years. Anna specialises in sports physiotherapy, manual therapy, exercise based rehabilitation, orthopaedic rehabilitation and biomechanical analysis. She also recently completed a period of study in Gerontology. She is currently registered to practice physiotherapy in Kenya and Australia and works from Karen Surgery Mondays, Wednesdays and Thursdays.",
    ],
  },
  {
    slug: "altaf-mapara",
    name: "Altaf Mapara",
    qualifications: "BSc Kinesiology and Psychology, MSc (A) Physical Therapy",
    role_title: "Physical Therapist",
    department: "physiotherapy",
    department_label: "Physiotherapy",
    department_href: "/physiotherapy/",
    media_key: "physiotherapy/altaf-mapara",
    image_position: "66% 24%",
    service_slugs: ["physiotherapy"],
    specialties: ["Sports Physiotherapy", "Neuro-Rehabilitation", "Cardiac & Respiratory", "Home Visits"],
    email: "altaf.mapara@gmail.com",
    phone_prefix: "Tel & Text",
    phones: [{ display: "+254 (0) 724 007200", tel: "+254724007200" }],
    bio: [
      "Altaf (AL) is a Canadian trained Physical Therapist, who holds a Master's degree in Physical Therapy from McGill University and an Undergraduate Degree in Biological Science, Kinesiology and Psychology from the University of Alberta. He specialises in Sports Physiotherapy, Manual Therapy, Orthopedic rehabilitation (Pre and Post Surgery), Cardiac rehabilitation and Neuro rehabilitation for pediatric through geriatric patients, and conducts home sessions for neurological patients if needed.",
    ],
  },
  {
    slug: "sally-dixson",
    name: "Sally Dixson",
    qualifications: "BSc(Hons) Physiology, MSc Physiotherapy",
    role_title: "Physiotherapist",
    department: "physiotherapy",
    department_label: "Physiotherapy",
    department_href: "/physiotherapy/",
    media_key: "physiotherapy/sally-dixson",
    image_position: "50% 24%",
    service_slugs: ["physiotherapy"],
    specialties: ["Musculoskeletal", "Paediatric Physiotherapy", "Acupuncture"],
    email: "sallydixson@me.com",
    phones: [{ display: "+254 (0) 703 992 417", tel: "+254703992417" }],
    bio: [
      "Sally is a Chartered Physiotherapist with a Masters degree in Physiotherapy from King's College London, and a BSc(Hons) in Physiology from Edinburgh University. Sally is qualified to use acupuncture as a modality for her treatment in physio, and specialises in musculoskeletal physio with a special interest in paediatric physio.",
    ],
  },
  {
    slug: "sarah-peacock",
    name: "Sarah Peacock",
    qualifications: "MSc Physiotherapy (Brunel University), BSc Human Physiology (University of Leeds)",
    role_title: "Physiotherapist",
    department: "physiotherapy",
    department_label: "Physiotherapy",
    department_href: "/physiotherapy/",
    media_key: "physiotherapy/sarah-peacock",
    image_position: "50% 24%",
    service_slugs: ["physiotherapy"],
    specialties: ["Pelvic Health", "Pre & Post Natal", "Acupuncture", "Home Visits"],
    email: "sarahlouisepeacock53@gmail.com",
    phones: [{ display: "+254 (0) 727 789 970", tel: "+254727789970" }],
    bio: [
      "Sarah is a UK-trained chartered physiotherapist specialising in pelvic health, pregnancy related conditions (pre and post natal), musculoskeletal (including manual therapy, acupuncture, sports massage, and orthopaedic rehabilitation), respiratory and neurological patients. Home visits are available on request.",
    ],
  },
  {
    slug: "fabian-collis",
    name: "Fabian Collis",
    qualifications: "",
    role_title: "Podiatrist",
    department: "allied-health",
    department_label: "Allied Health",
    department_href: "/allied-health-professionals/",
    media_key: "allied-health/fabian-collis",
    image_position: "50% 22%",
    service_slugs: ["allied-health"],
    email: "Collisfabian@gmail.com",
    phones: [],
    bio: [
      "Fabian is a UK trained Specialised Podiatrist. He is HPC registered. He specialises in Biomechanics and the Diabetic Foot, and wound and ulcer management. Fabian runs a large practice in Westlands and also operates a clinic at the Karen Surgery twice a month.",
    ],
  },
  {
    slug: "megan-anjeri",
    name: "Megan Anjeri",
    qualifications: "Level 4 Diploma in Holistic Massage",
    role_title: "Massage Therapist",
    department: "allied-health",
    department_label: "Allied Health",
    department_href: "/allied-health-professionals/",
    media_key: "allied-health/megan-anjeri",
    image_position: "50% 25%",
    service_slugs: ["allied-health"],
    email: "megan@meganjeribodyworks.com",
    phones: [{ display: "+254 748 772 605", tel: "+254748772605" }],
    bio: [
      "Megan Anjeri is a UK-trained massage therapist with a Level 4 Diploma in Holistic Massage from the Bristol College of Massage & Bodywork, accredited by the UK Massage Training Institute. She focuses on therapeutic and health-based massage, prenatal/pregnancy massage, digestive support, and stress-relief methods.",
    ],
  },
  {
    slug: "millicent-mboya",
    name: "Millicent Mboya",
    qualifications: "",
    role_title: "Massage Therapist",
    department: "allied-health",
    department_label: "Allied Health",
    department_href: "/allied-health-professionals/",
    media_key: "allied-health/millicent-mboya",
    image_position: "46% 26%",
    service_slugs: ["allied-health"],
    email: "millicentmboya7@gmail.com",
    phones: [{ display: "+254 712 272 039", tel: "+254712272039" }],
    bio: [
      "Millicent is an experienced massage therapist who specialises in sport massage, reflexology, aromatherapy, pregnancy massage, newborn babies massage and hot stone massage.",
    ],
  },
  {
    slug: "richard-handford",
    name: "Richard Handford",
    qualifications: "BSc Podiatry (University of Plymouth)",
    role_title: "Podiatrist",
    department: "allied-health",
    department_label: "Allied Health",
    department_href: "/allied-health-professionals/",
    media_key: "allied-health/richard-handford",
    image_position: "50% 24%",
    service_slugs: ["allied-health"],
    email: "rhandford633@googlemail.com",
    phones: [{ display: "+254 720 018 377", tel: "+254720018377" }],
    bio: [
      "Richard graduated with a BSc in Podiatry from University of Plymouth in 1993. Registered with the HCPC (no CH11999) and KHPOA (no TPL 03AQ23), member of the Royal College of Podiatry and Faculty of Podiatric Medicine of The Royal College of Physicians and Surgeons Glasgow.",
    ],
  },
  {
    slug: "alice-coulson",
    name: "Alice Coulson",
    qualifications: "ANutr, MSc Food, Health and Nutrition",
    role_title: "Nutritionist",
    department: "allied-health",
    department_label: "Allied Health",
    department_href: "/allied-health-professionals/",
    media_key: "allied-health/alice-coulson",
    image_position: "50% 24%",
    service_slugs: ["allied-health"],
    email: null,
    phones: [{ display: "+254 728 610 646", tel: "+254728610646" }],
    website: { label: "www.aliceshealthykitchen.com", href: "https://www.aliceshealthykitchen.com" },
    instagram: { label: "@aliceshealthykitchen", href: "https://www.instagram.com/aliceshealthykitchen/" },
    bio: [
      "Alice Coulson (ANutr) graduated from University College Dublin with a Master of Science (MSc) in Food, Health and Nutrition. Passionate about gut health, diet and neurodegenerative disease, prevention and management of diabetes through diet, obesity management, and balanced meal planning.",
    ],
  },
  {
    slug: "anne-ragui",
    name: "Anne Ragui",
    qualifications: "",
    role_title: "Receptionist",
    department: "support",
    department_label: "Reception & Practice Support",
    department_href: "/opening-hours/",
    media_key: "reception/anne-ragui",
    image_position: "55% 28%",
    service_slugs: [],
    email: "Receptionist@KarenSurgery.com",
    phones: [
      { display: "+254 (0) 733 642246", tel: "+254733642246" },
      { display: "+254 (0) 775 642246", tel: "+254775642246" },
      { display: "+254 (0) 722 646891", tel: "+254722646891" },
    ],
    bio: [
      "Available to make appointments and take messages. Monday to Friday: 8 am to 4.30 pm. Saturday: 9 am to 12 noon.",
    ],
  },
  {
    slug: "eunice-muthoni-mugo",
    name: "Eunice Muthoni Mugo",
    qualifications: "",
    role_title: "Office Assistant",
    department: "support",
    department_label: "Reception & Practice Support",
    department_href: "/doctors/#office-assistant",
    media_key: "doctors/eunice-muthoni-mugo",
    image_position: "50% 24%",
    service_slugs: [],
    email: null,
    phones: [],
    bio: [
      "Eunice has been a part of Karen Surgery almost since its inception. Eunice manages the filing and ensures that all waiting patients are made to feel welcome, comfortable and well cared for.",
    ],
  },
];

const PAGES_SEED = [
  { slug: "home", title: "Home", meta_title: "Karen Surgery — Family Medical Practice in Karen, Nairobi", meta_description: "Karen Surgery: Health Care the way it should be. Family medical practice at 333 Ngong Road, Karen, Nairobi since 1991." },
  { slug: "about", title: "About the Practice", meta_title: "About the Practice | Karen Surgery", meta_description: "Established in 1991 to serve the Karen and Langata community with personal, comprehensive, collaborative, and cost-effective family medicine." },
  { slug: "team", title: "Our Team", meta_title: "Our Team | Karen Surgery", meta_description: "Meet our 19 doctors, practice nurse, radiologist, mental health professionals, physiotherapists, allied health practitioners, and support staff." },
  { slug: "services", title: "Medical Services", meta_title: "Medical Services | Karen Surgery", meta_description: "Family Medicine, Ultrasound Services, Mental Health, Physiotherapy, Allied Health, and Laboratory Services under one roof." },
  { slug: "doctors", title: "Doctors & Medical Staff", meta_title: "Doctors & Medical Staff | Karen Surgery", meta_description: "General Practitioners, Practice Nurse, Consultant Radiologist (Ultrasound Services), and Office Assistant at Karen Surgery." },
  { slug: "mental-health", title: "Mental Health", meta_title: "Mental Health | Karen Surgery", meta_description: "Multidisciplinary mental health care with Dr. Tonya Shaw, Judy Gitau, and Kaye Alianda McIlwaine." },
  { slug: "physiotherapy", title: "Physiotherapy", meta_title: "Physiotherapy | Karen Surgery", meta_description: "Sports injuries, manual therapy, neuro-rehabilitation, paediatric physiotherapy, pelvic health, and acupuncture." },
  { slug: "allied-health-professionals", title: "Allied Health Professionals", meta_title: "Allied Health Professionals | Karen Surgery", meta_description: "Podiatrists, holistic and sports massage therapists, and registered nutritionist at Karen Surgery." },
  { slug: "laboratory-services", title: "Laboratory Services", meta_title: "Laboratory Services | Karen Surgery", meta_description: "Specimen collection on-site with daily couriers by CTTM (9:30 am) and Pathcare Kenya Ltd (1:00 pm)." },
  { slug: "opening-hours", title: "Opening Hours", meta_title: "Opening Hours | Karen Surgery", meta_description: "Reception hours, doctors' consulting hours, daylight after-hours service (7am–7pm), night-call policy, and allied health hours." },
  { slug: "medical-info", title: "Medical Information", meta_title: "Medical Information | Karen Surgery", meta_description: "Vaccination notices, immunisation guidance, reference charts, recommended health resources, and medical disclaimer." },
  { slug: "location", title: "Where to Find Us", meta_title: "Where to Find Us | Karen Surgery", meta_description: "333 Ngong Road, Karen, Kenya — 333 metres from Karen roundabout. Interactive map and directions." },
  { slug: "contact-us", title: "Contact Us", meta_title: "Contact Us | Karen Surgery", meta_description: "Contact reception by telephone, WhatsApp, email, or online enquiry form — plus separate emergency and ambulance numbers." },
];

const CHATBOT_FAQS_SEED = [
  {
    category: "Location & Directions",
    question: "Where is Karen Surgery located and how do I get there?",
    answer:
      "Karen Surgery is located at **333 Ngong Road, Karen, Nairobi 00502, Kenya** — 333 metres from the Karen roundabout heading along Ngong Road towards Ngong (past Karen Shopping Centre, near Talisman). Postal address: P.O. Box 24932, Nairobi 00502. You can view the interactive map and launch Google Maps directions on our Where to Find Us page.",
    keywords: ["location", "where", "address", "directions", "map", "ngong road", "roundabout", "find", "karen", "talisman"],
    followups: ["What are your opening hours?", "How do I request an appointment?"],
  },
  {
    category: "Opening Hours",
    question: "What are Karen Surgery's opening and consulting hours?",
    answer:
      "Karen Surgery has distinct schedules:\n• **Receptionist (Anne Ragui):** Monday–Friday 8:00 am – 4:30 pm; Saturday 9:00 am – 12:00 noon.\n• **Doctors' Consulting Hours:** Monday–Friday 8:00 am – 1:00 pm; Saturday 9:00 am – 12:00 noon (Mon–Fri afternoons are for urgent cases only; please make an appointment if possible).\n• **Other Health Professionals:** Monday–Friday 8:00 am – 4:30 pm; Saturday 9:00 am – 12:00 noon.\n• **Doctors' After Hours Service:** Daylight hours only (7:00 am – 7:00 pm), 365 days a year including public holidays, for urgent cases via +254 (0) 724 840246.",
    keywords: ["hours", "opening", "open", "close", "closing", "time", "saturday", "sunday", "holiday", "weekend", "afternoon", "consulting", "schedule"],
    followups: ["Do you do night calls?", "How do I request an appointment?"],
  },
  {
    category: "Emergency & After Hours",
    question: "Do you handle emergencies or night calls?",
    answer:
      "**In an emergency, do not waste time:** call the emergency phone, go to the nearest hospital, or call an ambulance.\n• **Emergencies Only (Daylight 7:00 am – 7:00 pm, 365 days/year):** +254 (0) 724 840246.\n• **Night Calls:** For security reasons, Karen Surgery no longer conducts night calls. Please go to the nearest hospital or call an ambulance (Karen Hospital +254 702 222222, Red Cross E-Plus 0700 395 395, AAR 0725 225 225, AMREF 0722 207 350, St. John's 0721 225 285).",
    keywords: ["emergency", "after hours", "night", "night call", "ambulance", "urgent", "hospital"],
    followups: ["What are your contact details?"],
  },
  {
    category: "Contact Details",
    question: "How can I contact Karen Surgery reception?",
    answer:
      "You can reach Karen Surgery reception during opening hours (Mon–Fri 8:00 am – 4:30 pm, Sat 9:00 am – 12:00 noon) via:\n• **Telephone:** +254 (0) 733 642246, +254 (0) 775 642246, or +254 (0) 722 646891\n• **WhatsApp Message:** +254 (0) 733 642246\n• **Email:** Receptionist@KarenSurgery.com\n*(For emergencies only, call +254 (0) 724 840246.)*",
    keywords: ["contact", "phone", "telephone", "number", "whatsapp", "email", "reception", "call", "reach"],
    followups: ["How do I request an appointment?", "Where is Karen Surgery located?"],
  },
  {
    category: "Appointments",
    question: "How do I book or request an appointment?",
    answer:
      "You can request an appointment using our online **Request an Appointment** form on this website, or by contacting reception directly on +254 (0) 733 642246 (Call or WhatsApp) or Receptionist@KarenSurgery.com. Mental health, physiotherapy, and allied health appointments can be made through reception or directly with the practitioner.\n\nPlease note: submitting an online request is **not** an automatic confirmed booking — our reception team or practitioner will contact you to confirm availability. Same-day walk-in treatment is also available for serious acute illness.",
    keywords: ["appointment", "book", "booking", "schedule", "visit", "walk-in", "walk in", "see a doctor", "consultation"],
    followups: ["What are your opening hours?", "Who are the doctors at Karen Surgery?"],
  },
  {
    category: "Insurance & Billing",
    question: "Do you accept medical insurance?",
    answer:
      "Karen Surgery is an independent practice and **does not deal directly with insurance companies**, however our doctors will complete your insurance claim forms for reimbursement. We also provide individualised care with no unnecessary tests or treatment, and subsidised lower-cost care for your domestic staff.",
    keywords: ["insurance", "nhif", "sha", "aar", "jubilee", "britam", "bupa", "cigna", "claim", "billing", "cost", "fee", "price", "payment", "domestic staff"],
    followups: ["How does laboratory payment work?", "How do I request an appointment?"],
  },
  {
    category: "Services Overview",
    question: "What services does Karen Surgery offer?",
    answer:
      "Karen Surgery offers multidisciplinary care under one roof:\n• **Family Medicine & GP Care** (for all ages, antenatal, well-baby checks, vaccinations, acute & chronic care, travel medicine, school/sports physicals, house visits for elderly & infirm)\n• **Practice Nursing** (vaccinations, blood draws, dressings & wound care)\n• **On-Site Ultrasound Services** (Consultant Radiologist Dr. Z. A. Kaka)\n• **Mental Health** (Clinical Psychologist & Counsellors)\n• **Physiotherapy** (Sports, Orthopaedic, Neuro-rehab, Paediatric, Pelvic Health, Acupuncture)\n• **Allied Health** (Podiatry, Therapeutic & Holistic Massage, Nutrition)\n• **Partner Laboratory Services** (specimen collection with CTTM & Pathcare Kenya Ltd)",
    keywords: ["services", "offer", "provide", "departments", "disciplines", "specialties", "treatments", "clinic"],
    followups: ["Who are the doctors at Karen Surgery?", "Do you offer ultrasound scans?"],
  },
  {
    category: "Doctors & Family Medicine",
    question: "Who are the doctors and medical staff at Karen Surgery?",
    answer:
      "Our primary care medical team consists of:\n• **Dr. Margriet van Unen-van Enk** (M.D., MBBS, Family & Tropical Medicine — GP, co-founded Karen Surgery in 1991)\n• **Dr. Marie-Louise Cantamessa** (MBBS(Hons), MPH&TM, MBioeth — GP, strong interest in children, antenatal care & ADHD teamwork)\n• **Dr. Jacqueline W. Kitulu** (MBS, OGW, MD, MBA FCMA — General Practitioner | MBA in Healthcare Management, over 25 years of clinical practice; Past President of KMA 2016–2020 and President of the World Medical Association 2025–2026)\n• **Mrs. Hannah Murimi** (Practice Nurse since 2004 — childhood vaccinations, blood draws, wound & ulcer care)\n• **Dr. Z. A. Kaka** (Consultant Radiologist — on-site Ultrasound Services)\n• Supported by **Anne Ragui** (Receptionist) and **Eunice Muthoni Mugo** (Office Assistant).",
    keywords: ["doctor", "doctors", "gp", "family physician", "nurse", "margriet", "marie-louise", "cantamessa", "jacqueline", "jackie", "kitulu", "mbs", "ogw", "wma", "hannah", "murimi", "eunice", "anne"],
    followups: ["How do I request an appointment?", "Do you offer ultrasound scans?"],
  },
  {
    category: "Ultrasound & Radiology",
    question: "Do you offer ultrasound scans at Karen Surgery?",
    answer:
      "Yes. Consultant Radiologist **Dr. Z. A. Kaka** (29 years' experience) offers on-site Ultrasound services at Karen Surgery, including:\n• Abdominal / urological\n• Pelvic / gynaecological\n• Obstetric\n• Small parts & Musculoskeletal\n• Regional\n• All Vascular and obstetric DOPPLER examinations\n• Ultrasound-guided interventions (FNAC, aspiration, drainage)\nPlease contact reception on +254 (0) 733 642246 or submit an appointment request to schedule an ultrasound.",
    keywords: ["ultrasound", "scan", "radiology", "radiologist", "doppler", "kaka", "obstetric", "imaging", "fnac"],
    followups: ["How do I request an appointment?"],
  },
  {
    category: "Mental Health",
    question: "What mental health services and therapists are available?",
    answer:
      "Karen Surgery is a centre for excellence in mental health with psychologists and counsellors working collaboratively with GPs. Specialist areas include anxiety, depression, attachment disorders, ADHD, eating disorders, and relationship difficulties. Both GP referrals and self-referrals are welcome.\n\nOur Mental Health professionals:\n• **Dr. Tonya Shaw** (Clinical Psychologist — Adult Mental Health, Eating Disorders, CBT/ACT/Schema/CFT/RLT; Dr_TonyaShaw@KarenSurgery.com)\n• **Judy Gitau** (Counselor — adults & adolescents, relationships, grief, stress, HIV counselling; judigitau@gmail.com)\n• **Kaye Alianda McIlwaine** (Counselor & TRE facilitator — multilingual incl. French & Kiswahili, youth to older adults, corporate & school workshops; kayealianda@gmail.com)",
    keywords: ["mental health", "psychologist", "counsellor", "counselor", "therapy", "therapist", "anxiety", "depression", "adhd", "eating disorder", "tonya", "shaw", "judy", "gitau", "kaye", "mcilwaine", "tre"],
    followups: ["How do I request an appointment?", "Can I self-refer to mental health or physiotherapy?"],
  },
  {
    category: "Physiotherapy",
    question: "Who are the physiotherapists and what do they treat?",
    answer:
      "Karen Surgery has four internationally trained physiotherapists (self-referral or GP referral welcome):\n• **Anna Kaminski** — Sports physiotherapy, manual therapy, orthopaedic rehab, gerontology (Mon, Wed, Thu; annakaminski@icloud.com)\n• **Altaf Mapara** — Sports, manual therapy, pre/post-surgery orthopaedic, cardiac/respiratory & neuro-rehabilitation; home sessions for neurological patients (altaf.mapara@gmail.com)\n• **Sally Dixson** — Musculoskeletal, paediatric physiotherapy & acupuncture (sallydixson@me.com)\n• **Sarah Peacock** — Pelvic health, pre & postnatal care, musculoskeletal, acupuncture, respiratory & neurological; home visits available on request (sarahlouisepeacock53@gmail.com)",
    keywords: ["physio", "physiotherapy", "physiotherapist", "physical therapy", "sports injury", "pelvic", "paediatric", "pediatric", "acupuncture", "neuro", "rehab", "anna", "kaminski", "altaf", "mapara", "sally", "dixson", "sarah", "peacock"],
    followups: ["How do I request an appointment?"],
  },
  {
    category: "Allied Health",
    question: "Which allied health professionals consult at Karen Surgery?",
    answer:
      "Our consulting Allied Health professionals include:\n• **Fabian Collis** — Podiatrist (biomechanics, diabetic foot, wound/ulcer management; twice a month at Karen Surgery)\n• **Richard Handford** — Podiatrist (HCPC & KHPOA registered; rhandford633@googlemail.com)\n• **Megan Anjeri** — Massage Therapist (holistic, therapeutic, prenatal/pregnancy massage, stress relief; megan@meganjeribodyworks.com)\n• **Millicent Mboya** — Massage Therapist (sports, reflexology, aromatherapy, pregnancy, newborn baby & hot stone massage; millicentmboya7@gmail.com)\n• **Alice Coulson** — Nutritionist (ANutr, MSc — gut health, diabetes diet management, obesity management, meal plans; +254 728 610 646)",
    keywords: ["allied", "podiatrist", "podiatry", "foot", "diabetic foot", "massage", "nutritionist", "nutrition", "diet", "fabian", "collis", "richard", "handford", "megan", "anjeri", "millicent", "mboya", "alice", "coulson"],
    followups: ["How do I request an appointment?"],
  },
  {
    category: "Laboratory Services",
    question: "Do you have a laboratory and how do blood tests work?",
    answer:
      "Karen Surgery does not have its own in-house laboratory, but our practice nurse collects blood and other specimens on-site for two partner laboratories:\n• **CTTM (Centre for Tropical & Travel Medicine):** courier collects at **9:30 am**\n• **Pathcare Kenya Ltd:** courier collects at **1:00 pm**\nUrgent results are available the same day. Please note the partner laboratories do not offer credit — payment is required in **cash or via M-Pesa the same day**, with receipts returned to Karen Surgery the following day.",
    keywords: ["lab", "laboratory", "blood", "blood test", "specimen", "sample", "cttm", "pathcare", "courier", "mpesa", "m-pesa", "results"],
    followups: ["What are your opening hours?"],
  },
  {
    category: "Vaccinations & Medical Info",
    question: "Do you offer vaccinations, child immunisations, and travel medicine?",
    answer:
      "Yes. Karen Surgery offers well-baby growth and development checks, childhood and adolescent vaccinations, HPV vaccination guidance, flu vaccines, and travel medicine advice. Our practice nurse, Mrs. Hannah Murimi, is especially experienced in vaccinating young children. Because immunisation schedules and vaccine stock can vary, please contact reception on +254 (0) 733 642246 or consult one of our GPs to confirm current vaccine availability and build a schedule suited to you or your child.",
    keywords: ["vaccine", "vaccines", "vaccination", "immunisation", "immunization", "flu", "hpv", "travel", "baby", "child", "children", "yellow fever"],
    followups: ["How do I request an appointment?"],
  },
  {
    category: "House Visits & Prescriptions",
    question: "Do you offer house visits, telephone consultations, or repeat prescriptions?",
    answer:
      "Yes, as part of our Convenient Care model:\n• **House visits** are available for the elderly and infirm (and select physiotherapists also offer home visits on request).\n• **Telephone & email consultations** are available for established patients.\n• **Repeat prescriptions** can be arranged for established patients.\nPlease contact reception on +254 (0) 733 642246 to arrange any of these services.",
    keywords: ["house visit", "home visit", "elderly", "repeat prescription", "prescription", "refill", "telephone consultation", "email consultation", "domestic staff"],
    followups: ["How can I contact Karen Surgery reception?"],
  },
];

export async function seedDatabase(db: DbClient = getDb()) {
  await runMigrations(db);
  const ts = nowIso();

  // 1. Seed Roles
  const roleIdMap = new Map<string, number>();
  for (const r of ROLES) {
    const existing = await db.get<{ id: number }>("SELECT id FROM roles WHERE code = $1", [r.code]);
    if (existing) {
      roleIdMap.set(r.code, existing.id);
    } else {
      const res = await db.run("INSERT INTO roles (code, name, description) VALUES ($1, $2, $3)", [
        r.code,
        r.name,
        r.description,
      ]);
      roleIdMap.set(r.code, res.lastInsertRowid);
    }
  }

  // 2. Seed Permissions & Role-Permission links
  for (const p of PERMISSIONS) {
    let perm = await db.get<{ id: number }>("SELECT id FROM permissions WHERE code = $1", [p.code]);
    if (!perm) {
      const res = await db.run("INSERT INTO permissions (code, description) VALUES ($1, $2)", [
        p.code,
        p.description,
      ]);
      perm = { id: res.lastInsertRowid };
    }
    for (const rCode of p.roles) {
      const rId = roleIdMap.get(rCode);
      if (!rId) continue;
      const linked = await db.get(
        "SELECT 1 as ok FROM role_permissions WHERE role_id = $1 AND permission_id = $2",
        [rId, perm.id]
      );
      if (!linked) {
        await db.run("INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)", [
          rId,
          perm.id,
        ]);
      }
    }
  }

  // 3. Seed System Media Assets
  const mediaIdMap = new Map<string, number>();
  for (const m of SYSTEM_MEDIA) {
    const existing = await db.get<{ id: number }>("SELECT id FROM media_assets WHERE asset_key = $1", [m.key]);
    if (existing) {
      mediaIdMap.set(m.key, existing.id);
    } else {
      const res = await db.run(
        `INSERT INTO media_assets (asset_key, filename, original_name, mime_type, size_bytes, width, height, alt_text, storage_path, public_url, is_system_asset, created_at, updated_at)
         VALUES ($1, $2, $3, 'image/jpeg', 0, $4, $5, $6, $7, $8, 1, $9, $9)`,
        [m.key, m.file, m.file, m.w, m.h, m.alt, `public/images/${m.key}.jpg`, `/images/${m.key}.jpg`, ts]
      );
      mediaIdMap.set(m.key, res.lastInsertRowid);
    }
  }

  // 4. Seed Services
  const serviceIdMap = new Map<string, number>();
  for (const s of SERVICES_SEED) {
    const existing = await db.get<{ id: number }>("SELECT id FROM services WHERE slug = $1", [s.slug]);
    if (existing) {
      serviceIdMap.set(s.slug, existing.id);
    } else {
      const res = await db.run(
        `INSERT INTO services (slug, title, short_title, icon, description, highlights_json, href, contact_email, is_published, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $10, $10)`,
        [s.slug, s.title, s.short_title, s.icon, s.description, JSON.stringify(s.highlights), s.href, s.contact_email, s.sort_order, ts]
      );
      serviceIdMap.set(s.slug, res.lastInsertRowid);
    }
  }

  // 5. Seed Practitioners + PractitionerServices
  for (let i = 0; i < PRACTITIONERS_SEED.length; i++) {
    const p = PRACTITIONERS_SEED[i];
    let prac = await db.get<{ id: number }>("SELECT id FROM practitioners WHERE slug = $1", [p.slug]);
    if (!prac) {
      const mediaId = mediaIdMap.get(p.media_key) ?? null;
      const res = await db.run(
        `INSERT INTO practitioners (
          slug, name, qualifications, role_title, department, department_label, department_href,
          quote, bio_json, bullet_heading, bullet_items_json, specialties_json,
          email, phones_json, phone_prefix, website_json, instagram_json,
          media_asset_id, image_position, is_active, is_approved, is_archived, sort_order, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,1,1,0,$20,$21,$21)`,
        [
          p.slug,
          p.name,
          p.qualifications || "",
          p.role_title,
          p.department,
          p.department_label,
          p.department_href,
          p.quote || "",
          JSON.stringify(p.bio),
          p.bullet_heading || "",
          JSON.stringify(p.bullet_items || []),
          JSON.stringify(p.specialties || []),
          p.email,
          JSON.stringify(p.phones || []),
          p.phone_prefix || "",
          p.website ? JSON.stringify(p.website) : null,
          p.instagram ? JSON.stringify(p.instagram) : null,
          mediaId,
          p.image_position,
          i + 1,
          ts,
        ]
      );
      prac = { id: res.lastInsertRowid };
    }
    for (const sSlug of p.service_slugs) {
      const sId = serviceIdMap.get(sSlug);
      if (!sId) continue;
      const linked = await db.get(
        "SELECT 1 as ok FROM practitioner_services WHERE practitioner_id = $1 AND service_id = $2",
        [prac.id, sId]
      );
      if (!linked) {
        await db.run(
          "INSERT INTO practitioner_services (practitioner_id, service_id) VALUES ($1, $2)",
          [prac.id, sId]
        );
      }
    }
  }

  // 6. Seed Pages & Key Sections
  for (const pg of PAGES_SEED) {
    let page = await db.get<{ id: number }>("SELECT id FROM pages WHERE slug = $1", [pg.slug]);
    if (!page) {
      const res = await db.run(
        `INSERT INTO pages (slug, title, meta_title, meta_description, status, is_system_page, published_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'published', 1, $5, $5, $5)`,
        [pg.slug, pg.title, pg.meta_title, pg.meta_description, ts]
      );
      page = { id: res.lastInsertRowid };

      // Default hero & intro sections for CMS editing
      const heroMedia = pg.slug === "home" || pg.slug === "about" ? mediaIdMap.get("practice/karen-surgery-building") ?? null : null;
      await db.run(
        `INSERT INTO page_sections (page_id, section_key, section_type, heading, subheading, body_json, cta_label, cta_href, media_asset_id, sort_order, is_published, updated_at)
         VALUES ($1, 'hero', 'hero', $2, $3, $4, 'Contact & Appointments', '/contact-us/', $5, 1, 1, $6)`,
        [page.id, pg.title, pg.meta_description, JSON.stringify({ note: "Managed section synced with approved Karen Surgery copy." }), heroMedia, ts]
      );
    }
  }

  // 7. Seed Website Settings (Singleton id=1)
  const existingSettings = await db.get("SELECT id FROM website_settings WHERE id = 1");
  if (!existingSettings) {
    const openingHours = {
      reception: {
        personName: "Anne Ragui",
        subtitle: "Available to make appointments and take messages",
        schedule: [
          { days: "Monday to Friday", hours: "8:00 am – 4:30 pm" },
          { days: "Saturday", hours: "9:00 am – 12:00 noon" },
        ],
      },
      doctorsConsulting: {
        schedule: [
          { days: "Monday to Friday", hours: "8:00 am – 1:00 pm" },
          { days: "Saturday", hours: "9:00 am – 12:00 noon" },
          { days: "Monday to Friday Afternoons", hours: "Urgent cases only" },
        ],
        note: "Please make an appointment if possible.",
      },
      doctorsAfterHours: {
        availability: "Daylight hours only (7:00 am to 7:00 pm), 365 days a year — including public holidays.",
        instruction: "For urgent cases only, contact the doctor-on-duty via the emergency phone: 0724-840246",
      },
      nightCalls: {
        policy: "For security reasons, we no longer do night calls. Go to the nearest hospital, or call an ambulance service.",
      },
      otherProfessionals: {
        schedule: [
          { days: "Monday to Friday", hours: "8:00 am – 4:30 pm" },
          { days: "Saturday", hours: "9:00 am – 12:00 noon" },
        ],
        note: "Please make an appointment with the receptionist, or contact the health professional you wish to see directly by email.",
      },
    };

    const contact = {
      email: "Receptionist@KarenSurgery.com",
      receptionPhones: [
        { display: "+254 (0) 733 642246", tel: "+254733642246" },
        { display: "+254 (0) 775 642246", tel: "+254775642246" },
        { display: "+254 (0) 722 646891", tel: "+254722646891" },
      ],
      whatsapp: { display: "+254 (0) 733 642246", href: "https://wa.me/254733642246" },
    };

    const emergency = {
      phoneDisplay: "+254 (0) 724 840246",
      phoneTel: "+254724840246",
      bannerText: "Do not waste time. Call the emergency phone, go to the nearest hospital or call an ambulance.",
      ambulances: [
        { provider: "Karen Hospital", numbers: ["+254 (0) 702 222222"] },
        { provider: "Red Cross E-Plus", numbers: ["+254 (0) 700 395395"] },
        { provider: "AAR", numbers: ["+254 (0) 725 225225", "0735 225 225"] },
        { provider: "AMREF", numbers: ["+254 (0) 722 207350", "+254 (0) 20 699222 (switchboard)"] },
        { provider: "St. John's Ambulance", numbers: ["+254 (0) 721 225285", "020 343 999"] },
        { provider: "KK Security", numbers: ["0730 622 000", "0709 955 650", "0728 999 912"] },
      ],
    };

    const location = {
      street: "333 Ngong Road, Karen",
      landmark: "333 metres from the Karen roundabout",
      poBox: "P.O. Box 24932",
      city: "Nairobi 00502",
      country: "Kenya",
      lat: -1.32459,
      lng: 36.7026,
    };

    const navigation = [
      { label: "Home", href: "/", enabled: true, order: 1 },
      { label: "About", href: "/about/", enabled: true, order: 2 },
      { label: "Our Team", href: "/team/", enabled: true, order: 3 },
      { label: "Services", href: "/services/", enabled: true, order: 4 },
      { label: "Patient Info", href: "/opening-hours/", enabled: true, order: 5 },
      { label: "Contact", href: "/contact-us/", enabled: true, order: 6 },
    ];

    const footer = {
      tagline: "Karen Surgery: Health Care the way it should be.",
      disclaimerSummary: "Website information is advisory only and does not replace an in-person consultation with a physician.",
      links: [
        { label: "Opening Hours", href: "/opening-hours/", enabled: true },
        { label: "Medical Information", href: "/medical-info/", enabled: true },
        { label: "Where to Find Us", href: "/location/", enabled: true },
        { label: "Contact Us", href: "/contact-us/", enabled: true },
      ],
    };

    const chatbotConfig = {
      enabled: true,
      welcomeMessage:
        "Hello, welcome to Karen Surgery. I can help with opening hours, directions, services, practitioners, laboratory timings, and appointment requests. Please note I am an informational assistant and cannot offer medical advice.",
      suggestedQuestions: [
        "What are your opening hours?",
        "Where is Karen Surgery located?",
        "How do I request an appointment?",
        "Who are the doctors at Karen Surgery?",
        "Do you accept medical insurance?",
        "How do laboratory blood tests work?",
      ],
      escalationContacts: {
        telephone: "+254 733 642246",
        whatsapp: "+254 733 642246",
        email: "Receptionist@KarenSurgery.com",
        emergency: "+254 724 840246",
      },
    };

    await db.run(
      `INSERT INTO website_settings (
        id, opening_hours_json, contact_json, emergency_json, location_json,
        navigation_json, footer_json, chatbot_config_json, data_retention_days, updated_at
      ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, 365, $8)`,
      [
        JSON.stringify(openingHours),
        JSON.stringify(contact),
        JSON.stringify(emergency),
        JSON.stringify(location),
        JSON.stringify(navigation),
        JSON.stringify(footer),
        JSON.stringify(chatbotConfig),
        ts,
      ]
    );
  }

  // 8. Seed Approved Chatbot FAQs
  const faqCount = await db.get<{ c: number }>("SELECT COUNT(*) as c FROM chatbot_faqs");
  if (!faqCount || Number(faqCount.c) === 0) {
    for (let i = 0; i < CHATBOT_FAQS_SEED.length; i++) {
      const f = CHATBOT_FAQS_SEED[i];
      await db.run(
        `INSERT INTO chatbot_faqs (category, question, answer, keywords_json, suggested_followups_json, is_published, is_approved, sort_order, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 1, 1, $6, $7, $7)`,
        [f.category, f.question, f.answer, JSON.stringify(f.keywords), JSON.stringify(f.followups), i + 1, ts]
      );
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  seedDatabase()
    .then(async () => {
      await getDb().close();
      console.log("[db] Verified Karen Surgery seed complete.");
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
