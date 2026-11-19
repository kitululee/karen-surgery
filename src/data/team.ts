import type { ImageAssetKey } from "./image-manifest.generated";
import type { PhoneContact } from "./practice";

export type DepartmentSlug =
  | "doctors"
  | "radiology"
  | "mental-health"
  | "physiotherapy"
  | "allied-health"
  | "support";

export interface Practitioner {
  id: string;
  name: string;
  qualifications?: string;
  role: string;
  department: DepartmentSlug;
  departmentLabel: string;
  departmentHref: string;
  image: ImageAssetKey;
  imagePosition: string;
  quote?: string;
  bio: string[];
  bulletListHeading?: string;
  bulletItems?: string[];
  secondaryLists?: { heading: string; items: string[] }[];
  email?: string;
  phones?: PhoneContact[];
  phonePrefix?: string;
  website?: { label: string; href: string };
  instagram?: { label: string; href: string };
  specialties?: string[];
}

export const MENTAL_HEALTH_INTRO: string[] = [
  "Karen Surgery is a centre for excellence in mental health; with an emphasis on working as a multi-disciplinary team. There are several psychologists / counsellors / psychotherapists working collaboratively with the GPs addressing the mental health needs of children, adults and families.",
  "Specialist areas of interest are anxiety, depression and attachment disorders, Attention Deficit Hyperactivity Disorder (ADHD), eating disorders and relationship difficulties.",
  "The Karen Surgery mental health professionals are trained across a range of different psychological models and adopt an integrative approach to case management; choosing the model best suited to each individual patient.",
  "Referrals are made either through the GP or patients can self-refer. Self-referred patients are offered a GP to provide medication management and to address any concomitant physical health needs. In the case of eating disorders a GP and nutritionist may be included in the team providing comprehensive treatment in one venue.",
];

export const PHYSIOTHERAPY_INTRO: string[] = [
  "Karen Surgery is a centre of excellence for physiotherapy. The four physiotherapists have diverse training and approaches, and a wealth of experience, in Kenya as well as Australia, Canada and the UK. Specialist areas of expertise are sports injuries – in both elite athletes and recreational players – and neuro-rehabilitation and paediatric physiotherapy.",
  "Appointments with the physiotherapists are made either directly, or after referral from a doctor. Self-referred patients are offered a GP to provide medication management and to address any concomitant health needs, and a nutritionist may be included in the team, providing comprehensive treatment in one venue.",
];

export const ALLIED_HEALTH_INTRO =
  "In keeping with Karen Surgery's emphasis on multidisciplinary team work, we also have a podiatrist, a nutritionist, a dietician, a speech therapist, and occupational therapist all consulting from the surgery and working in conjunction with the other health professionals.";

export const PRACTITIONERS: Practitioner[] = [
  // === DOCTORS & PRACTICE NURSE (/doctors/) ===
  {
    id: "dr-margriet-van-unen",
    name: "Dr. Margriet van Unen-van Enk",
    qualifications: "M.D., MBBS, Family and Tropical Medicine",
    role: "General Practitioner",
    department: "doctors",
    departmentLabel: "Doctors & Medical Staff",
    departmentHref: "/doctors/",
    image: "doctors/dr-margriet-van-unen",
    imagePosition: "50% 62%",
    bio: [
      "Dr. Margriet van Unen is from Holland, where she graduated at the Free University of Amsterdam. She is specialised in Family Medicine and Tropical Medicine. She has worked in rural hospitals in Sudan and Yemen for four years and in Nazareth Mission Hospital for six years. In 1991 she started Karen Surgery with Dr. Judy Shaw. She has done voluntary work in Nepal and Peru and has worked as an expedition doctor on several Classic Car/Volvo rallies in South America, Central America, USA, Canada, South East Asia, the Silk Route, Mongolia and Russia.",
    ],
  },
  {
    id: "dr-marie-louise-cantamessa",
    name: "Dr. Marie-Louise Cantamessa",
    qualifications: "MBBS(Hons), MPH&TM, MBioeth",
    role: "General Practitioner",
    department: "doctors",
    departmentLabel: "Doctors & Medical Staff",
    departmentHref: "/doctors/",
    image: "doctors/dr-marie-louise-cantamessa",
    imagePosition: "50% 20%",
    bio: [
      "I love working with children, and as a GP I am able to treat the child within the family. I find it very rewarding to provide antenatal care to a mother, see her newborn for growth and development checks, and at the same time vaccinate the father and grandparents to 'cocoon' the baby. Before joining Karen Surgery I worked at Gertrude's Garden Children's Hospital and at Dr Colin Forbes' paediatric clinic in Nairobi. The Karen Surgery team approach allows me to work with our fabulous practice nurse Hannah Murimi, who has turned vaccinating young children into an art form; and with psychologists to assess and treat children with ADHD.",
      "I studied medicine at the University of Queensland and did my initial training in Australia. I have additional masters degrees in public health and tropical medicine from James Cook University, and in bioethics from Monash University.",
    ],
  },
  {
    id: "dr-jacqueline-kitulu",
    name: "Dr. Jacqueline Kitulu",
    qualifications: "MB.Ch.B, MBA-HCM",
    role: "General Practitioner",
    department: "doctors",
    departmentLabel: "Doctors & Medical Staff",
    departmentHref: "/doctors/",
    image: "doctors/dr-jacqueline-kitulu",
    imagePosition: "50% 18%",
    bio: [
      "Dr. Jackie Kitulu graduated from The University of Nairobi and has been a general practitioner for more than 20 years. In addition to her medical training, she has an MBA in Healthcare Management from Strathmore Business School. She is the Immediate Past President (2016–2020) of the Kenya Medical Association, the umbrella professional association for doctors in Kenya. She also chaired the Kenya Medical Women's Association (2008–2012). Jackie is the 1st Deputy Governor of the Kenya Red Cross Society and sits on several other boards – National Hospital Insurance Fund (NHIF), the Kenya Medical Practitioners and Dentists Council, the Kenya Healthcare Federation (KHF) amongst others. She is the recipient of the Distinguished Service Award from the Kenya Medical Association 2019, Jacob's Well Award for Women Living Deliberately 2017, Annual Best Communicators 2016, Africa Most Astounding Female Professional Award 2012 and OWIT (Organisation of Women in International Trade) Woman of the Year 2010.",
    ],
  },
  {
    id: "mrs-hannah-murimi",
    name: "Mrs. Hannah Murimi",
    role: "Practice Nurse",
    department: "doctors",
    departmentLabel: "Doctors & Medical Staff",
    departmentHref: "/doctors/",
    image: "doctors/hannah-murimi",
    imagePosition: "50% 22%",
    bio: [
      "Hannah has been the practice nurse at Karen Surgery since 2004. She has turned vaccinating young children into an art form, and is very good at getting blood samples from people with 'difficult veins'. She is an expert in managing wounds, from dog bites to wounds sustained from complex trauma and diabetic ulcers.",
    ],
  },

  // === ULTRASOUND / RADIOLOGY (/doctors/#ultrasound) ===
  {
    id: "dr-z-a-kaka",
    name: "Dr. Z. A. Kaka",
    role: "Consultant Radiologist",
    department: "radiology",
    departmentLabel: "Ultrasound Services",
    departmentHref: "/doctors/#ultrasound",
    image: "doctors/dr-zohair-kaka",
    imagePosition: "50% 25%",
    bio: [
      "Dr. Zohair Kaka is a Consultant Radiologist with 29 years' experience in hospital and private practice.",
      "He now offers Ultrasound services at Karen Surgery. This results in considerable convenience for patients in this locality, who can have these investigations done immediately and do not have to travel far for these services.",
    ],
    bulletListHeading: "The Ultrasounds offered are:",
    bulletItems: [
      "Abdominal / urological",
      "Pelvic / gynaecological",
      "Obstetric",
      "Small parts & Musculoskeletal",
      "Regional",
      "All Vascular and obstetric DOPPLER examinations",
      "Ultrasound guided interventions – FNAC, aspiration, drainage",
    ],
  },

  // === MENTAL HEALTH (/mental-health/) ===
  {
    id: "dr-tonya-shaw",
    name: "Dr. Tonya Shaw",
    qualifications: "BSc., Clin.Psy.D., C.Psychol., AFBPsS.",
    role: "Clinical Psychologist",
    department: "mental-health",
    departmentLabel: "Mental Health",
    departmentHref: "/mental-health/",
    image: "mental-health/dr-tonya-shaw",
    imagePosition: "50% 22%",
    bio: [
      "Tonya has a doctorate in Clinical Psychology from the University of Birmingham (UK) and is an Associate Fellow of the British Psychological Society and a member of the Kenya Psychological Association. Tonya has been part of Karen Surgery since 1996. Tonya specialises in Adult Mental Health. This covers a wide range of difficulties: depression, anxiety and panic disorders, relationship difficulties, post traumatic stress disorder, obsessive compulsive disorders to name a few. In addition Tonya has a specialist interest in Eating Disorders. Tonya has trained in a number of models; mainly Cognitive Behavioural Therapy (CBT), Schema Therapy (SFCBT), Acceptance and Commitment Therapy (ACT), Compassion Focussed Therapy (CFT) and Relational Life Therapy (RLT).",
    ],
    email: "Dr_TonyaShaw@KarenSurgery.com",
    phones: [{ display: "+254 (0) 733 642 246", tel: "+254733642246" }],
  },
  {
    id: "judy-gitau",
    name: "Judy Gitau",
    qualifications: "BSc Psych",
    role: "Counselor",
    department: "mental-health",
    departmentLabel: "Mental Health",
    departmentHref: "/mental-health/",
    image: "mental-health/judy-gitau",
    imagePosition: "50% 22%",
    bio: [
      "Judy trained in USA and Kenya. She has a Bachelor's degree in Psychology, Certificate in Trainer in Counseling, Certificate in Supervision in Counseling and Certificate in HIV testing & Adherence Counseling. She's registered with the Kenya Counselors Psychologists Association (KCPA).",
      "Judy worked in Pennsylvania, USA with a mental health agency for 10 years that provided a variety of community-integrated residential options for adults with developmental and intellectual disabilities. Upon returning to Kenya she volunteered with a special needs school in Kangemi for 2 years. She then did an internship at Amani Counseling Centre Training Institute (ACCTI) as a counselor and trainer/facilitator. She facilitated experiential and supervision groups of the diploma students. She also trained the certificate class on counseling skills and facilitated peer-to-peer counseling.",
      "Judy works with adults and adolescents in dealing with relationships, HIV status & treatment, terminal illness, bereavement-loss and grief, stress management, anger management, self-awareness/self-esteem & empowerment, just to name a few.",
    ],
    email: "judigitau@gmail.com",
    phones: [{ display: "+254 (0) 717 219 386", tel: "+254717219386" }],
  },
  {
    id: "kaye-alianda-mcilwaine",
    name: "Kaye Alianda McIlwaine",
    role: "Counselor",
    department: "mental-health",
    departmentLabel: "Mental Health",
    departmentHref: "/mental-health/",
    image: "mental-health/kaye-alianda-mcilwaine",
    imagePosition: "44% 24%",
    quote:
      "“When we are no longer able to change a situation, we are challenged to change ourselves” — Viktor Frankl",
    bio: [
      "Kaye trained in South Africa, with the Health Professionals Council of South Africa (HPCSA), and in Kenya. She has a Master of Social Sciences Degree (Community Mental Health Promotion), a Bachelor of Psychology-Honours, a Master's degree in Master of Arts, and a French Bachelor of Education. She is also a Trauma/Tension Release Exercises (TRE) facilitator.",
      "Kaye is multi-lingual, and speaks amongst other languages French and Kiswahili. She is an empathic listener, firm yet approachable, skills that she developed over her professional training and experience as both a counsellor and educator, to both young adolescents and adults.",
    ],
    secondaryLists: [
      {
        heading:
          "Coupled with life experiences Kaye has the know-how to offer one on one and group counselling, and psycho-social support workshops to the following populations:",
        items: ["Pre-adolescents", "Adolescents", "Youth", "The older population"],
      },
      {
        heading:
          "Kaye offers services within the community, in the corporate space and in school settings:",
        items: [
          "Psycho-educational workshops to promote mental wellness (Employee Wellness Programs)",
          "Counselling in relationship difficulties (in relationships, in the family, at work)",
        ],
      },
    ],
    email: "kayealianda@gmail.com",
    phones: [{ display: "+254 (0) 721 722 936", tel: "+254721722936" }],
  },

  // === PHYSIOTHERAPY (/physiotherapy/) ===
  {
    id: "anna-kaminski",
    name: "Anna Kaminski",
    qualifications: "BAppSc Physiotherapy, BA Hmn Mvt",
    role: "Physiotherapist",
    department: "physiotherapy",
    departmentLabel: "Physiotherapy",
    departmentHref: "/physiotherapy/",
    image: "physiotherapy/anna-kaminski",
    imagePosition: "50% 35%",
    specialties: [
      "Sports Physiotherapy",
      "Manual Therapy",
      "Orthopaedic Rehab",
      "Gerontology",
    ],
    bio: [
      "Anna is an Australian physiotherapist with degrees in Sports Science and Physiotherapy. She is an experienced manual therapist and sports specialist who worked for one of Sydney's rugby union teams for 5 years. Anna specialises in sports physiotherapy, manual therapy, exercise based rehabilitation, orthopaedic rehabilitation and biomechanical analysis. She also recently completed a period of study in Gerontology. She is currently registered to practice physiotherapy in Kenya and Australia and works from Karen Surgery Mondays, Wednesdays and Thursdays.",
    ],
    email: "annakaminski@icloud.com",
    phones: [
      { display: "+254 (0) 728 600018", tel: "+254728600018" },
      { display: "+254 (0) 703 888091", tel: "+254703888091" },
    ],
  },
  {
    id: "altaf-mapara",
    name: "Altaf Mapara",
    qualifications:
      "BSc Kinesiology and Psychology, MSc (A) Physical Therapy",
    role: "Physical Therapist",
    department: "physiotherapy",
    departmentLabel: "Physiotherapy",
    departmentHref: "/physiotherapy/",
    image: "physiotherapy/altaf-mapara",
    imagePosition: "66% 24%",
    specialties: [
      "Sports Physiotherapy",
      "Neuro-Rehabilitation",
      "Cardiac & Respiratory",
      "Home Visits",
    ],
    bio: [
      "Altaf (AL) is a Canadian trained Physical Therapist, who holds a Master's degree in Physical Therapy from McGill University and an Undergraduate Degree in Biological Science, Kinesiology and Psychology from the University of Alberta. He has worked both in Australia and Canada and now in Kenya and specialises in Sports Physiotherapy, Manual Therapy, Orthopedic rehabilitation (Pre and Post Surgery), Cardiac rehabilitation (Cardiac disease, Respiratory disease and ICU management) and Neuro rehabilitation for a variety of populations from pediatric patients spanning through to geriatric patients. Altaf comes with a diverse background of having worked with elite level rugby players in Canada at the varsity level and with Paralympic wheelchair athletes at the national level and currently works with Kenya 7's Rugby team. He also has a passion for working with neurological patients, helping patients who have suffered either a Stroke or Traumatic Brain Injury (TBI) or have been diagnosed with Parkinson's and a variety of other Neurological conditions with whom he also conducts home sessions if needed.",
    ],
    email: "altaf.mapara@gmail.com",
    phonePrefix: "Tel & Text",
    phones: [{ display: "+254 (0) 724 007200", tel: "+254724007200" }],
  },
  {
    id: "sally-dixson",
    name: "Sally Dixson",
    qualifications: "BSc(Hons) Physiology, MSc Physiotherapy",
    role: "Physiotherapist",
    department: "physiotherapy",
    departmentLabel: "Physiotherapy",
    departmentHref: "/physiotherapy/",
    image: "physiotherapy/sally-dixson",
    imagePosition: "50% 24%",
    specialties: [
      "Musculoskeletal",
      "Paediatric Physiotherapy",
      "Acupuncture",
    ],
    bio: [
      "Sally is a Chartered Physiotherapist with a Masters degree in Physiotherapy from King's College London, and a BSc(Hons) in Physiology from Edinburgh University. She has recently moved back to Kenya after having gained a broad experience working in London in both the NHS and private practice settings, as well as with local rugby clubs. Sally is qualified to use acupuncture as a modality for her treatment in physio, and is a member of the Acupuncture Association of Chartered Physiotherapists. She specialises in musculoskeletal physio with a special interest in paediatric physio and has just completed a Paediatric Musculoskeletal Physiotherapy Masters module at the University College of London. Sally is registered to practise in both Kenya and UK and is a member of the Chartered Society of Physiotherapy, HCPC and Physiotherapy Council of Kenya. Sally loves working with a diverse range of patients of all ages, and is committed to helping them achieve their individual goals through appropriate assessment and treatment.",
    ],
    email: "sallydixson@me.com",
    phones: [{ display: "+254 (0) 703 992 417", tel: "+254703992417" }],
  },
  {
    id: "sarah-peacock",
    name: "Sarah Peacock",
    qualifications:
      "MSc Physiotherapy (Brunel University), BSc Human Physiology (University of Leeds)",
    role: "Physiotherapist",
    department: "physiotherapy",
    departmentLabel: "Physiotherapy",
    departmentHref: "/physiotherapy/",
    image: "physiotherapy/sarah-peacock",
    imagePosition: "50% 24%",
    specialties: [
      "Pelvic Health",
      "Pre & Post Natal",
      "Acupuncture",
      "Home Visits",
    ],
    bio: [
      "Sarah is a UK-trained chartered physiotherapist specialising in pelvic health. She has a Master's degree in Physiotherapy from Brunel University and has undertaken post graduate training in pelvic floor physiotherapy (Herman & Wallace, USA), acupuncture (AACP, UK) and sports massage therapy. Sarah worked in the UK in the NHS for 2 years before moving to Kenya in 2018. These initial years of NHS work equipped Sarah with the skill sets to treat a wide range of patient populations. As one of the first cohort of pelvic health specialists in Kenya, Sarah is committed to raising awareness and education for pelvic health issues to improve accessibility to treatment. Working with pre and postnatal women to empower them through their pregnancy journey and into motherhood is an aspect of work which she really enjoys. Sarah has a holistic approach to patient care, always ensuring an individualised and patient-centred approach to rehabilitation, to maximise functional, physical and mental well-being. Sarah specialises in treating pelvic health conditions, pregnancy related conditions (pre and post natal), musculoskeletal (including manual therapy, acupuncture, sports massage, and orthopaedic rehabilitation), respiratory (including chronic respiratory disease management and cardiac rehabilitation) and neurological patients. Home visits are available on request.",
    ],
    email: "sarahlouisepeacock53@gmail.com",
    phones: [{ display: "+254 (0) 727 789 970", tel: "+254727789970" }],
  },

  // === ALLIED HEALTH PROFESSIONALS (/allied-health-professionals/) ===
  {
    id: "fabian-collis",
    name: "Fabian Collis",
    role: "Podiatrist",
    department: "allied-health",
    departmentLabel: "Allied Health",
    departmentHref: "/allied-health-professionals/",
    image: "allied-health/fabian-collis",
    imagePosition: "50% 22%",
    bio: [
      "Fabian is a UK trained Specialised Podiatrist. He is HPC registered. He specialises in Biomechanics and the Diabetic Foot. Fabian has been practicing for over 10 years and is currently working for the Government relating to the Diabetic Foot and its complications. Fabian also specialises in wound and ulcer management. Fabian runs a large practice in Westlands and also operates a clinic at the Karen Surgery twice a month.",
    ],
    email: "Collisfabian@gmail.com",
  },
  {
    id: "megan-anjeri",
    name: "Megan Anjeri",
    role: "Massage Therapist",
    department: "allied-health",
    departmentLabel: "Allied Health",
    departmentHref: "/allied-health-professionals/",
    image: "allied-health/megan-anjeri",
    imagePosition: "50% 25%",
    bio: [
      "Megan Anjeri is a UK-trained massage therapist with a Level 4 Diploma in Holistic Massage from the Bristol College of Massage & Bodywork, accredited by the UK Massage Training Institute.",
      "She is an experienced bodyworker with a focus on therapeutic and health-based massage, has trained in prenatal / pregnancy massage, and has worked with clients managing digestive issues.",
      "Megan specializes in holistic massage techniques, and stress-relief methods. Megan is also a member of Rebel Massage in the US and remains dedicated to ongoing professional growth, continuously learning new methods to address diverse client needs.",
    ],
    phones: [{ display: "+254 748 772 605", tel: "+254748772605" }],
    email: "megan@meganjeribodyworks.com",
  },
  {
    id: "millicent-mboya",
    name: "Millicent Mboya",
    role: "Massage Therapist",
    department: "allied-health",
    departmentLabel: "Allied Health",
    departmentHref: "/allied-health-professionals/",
    image: "allied-health/millicent-mboya",
    imagePosition: "46% 26%",
    bio: [
      "Millicent is an experienced massage therapist who specialises in sport massage, reflexology, aromatherapy, pregnancy massage, newborn babies massage and hot stone massage.",
    ],
    phones: [{ display: "+254 712 272 039", tel: "+254712272039" }],
    email: "millicentmboya7@gmail.com",
  },
  {
    id: "richard-handford",
    name: "Richard Handford",
    qualifications: "BSc Podiatry (University of Plymouth)",
    role: "Podiatrist",
    department: "allied-health",
    departmentLabel: "Allied Health",
    departmentHref: "/allied-health-professionals/",
    image: "allied-health/richard-handford",
    imagePosition: "50% 24%",
    bio: [
      "Richard graduated with a BSc in Podiatry from University of Plymouth in 1993. He has worked in the NHS in several different settings, and also in his own private practice for the last 25 years.",
      "Richard is a member of Festival Medical Services and volunteers in festival healthcare at Glastonbury & Reading festivals.",
      "Richard is registered with the HCPC (no CH11999) and KHPOA (no TPL 03AQ23), is a member of the Royal College of Podiatry and the Faculty of Podiatric Medicine of The Royal College of Physicians and Surgeons Glasgow.",
    ],
    phones: [{ display: "+254 720 018 377", tel: "+254720018377" }],
    email: "rhandford633@googlemail.com",
  },
  {
    id: "alice-coulson",
    name: "Alice Coulson",
    qualifications: "ANutr, MSc Food, Health and Nutrition",
    role: "Nutritionist",
    department: "allied-health",
    departmentLabel: "Allied Health",
    departmentHref: "/allied-health-professionals/",
    image: "allied-health/alice-coulson",
    imagePosition: "50% 24%",
    bio: [
      "Alice Coulson (ANutr) graduated from University College Dublin with a Master of Science (MSc) in Food, Health and Nutrition.",
      "She did her dissertation on the link between diet and Neurodegenerative disease, and is also passionate about gut health, the prevention and management of Diabetes through diet, and obesity management.",
      "Alice is also an experienced Chef and specialises in healthy food, and has worked as a freelance Chef in France, the UK, Scotland, Portugal and Tanzania. Alice has a cookbook soon to be released in the USA, UK, UAE and Kenya on healthy food and wellbeing. Her Nutrition training and Chef experience means that she is well positioned to help create balanced meal plans and evidence based nutritional information to clients, as well as creating and helping with exciting recipes and providing inspiration for clients in the kitchen.",
    ],
    phones: [{ display: "+254 728 610 646", tel: "+254728610646" }],
    website: {
      label: "www.aliceshealthykitchen.com",
      href: "https://www.aliceshealthykitchen.com",
    },
    instagram: {
      label: "@aliceshealthykitchen",
      href: "https://www.instagram.com/aliceshealthykitchen/",
    },
  },

  // === RECEPTION & OFFICE SUPPORT ===
  {
    id: "anne-ragui",
    name: "Anne Ragui",
    role: "Receptionist",
    department: "support",
    departmentLabel: "Reception & Practice Support",
    departmentHref: "/opening-hours/",
    image: "reception/anne-ragui",
    imagePosition: "55% 28%",
    bio: [
      "Available to make appointments and take messages. Monday to Friday: 8 am to 4.30 pm. Saturday: 9 am to 12 noon.",
    ],
    email: "Receptionist@KarenSurgery.com",
    phones: [
      { display: "+254 (0) 733 642246", tel: "+254733642246" },
      { display: "+254 (0) 775 642246", tel: "+254775642246" },
      { display: "+254 (0) 722 646891", tel: "+254722646891" },
    ],
  },
  {
    id: "eunice-muthoni-mugo",
    name: "Eunice Muthoni Mugo",
    role: "Office Assistant",
    department: "support",
    departmentLabel: "Reception & Practice Support",
    departmentHref: "/doctors/#office-assistant",
    image: "doctors/eunice-muthoni-mugo",
    imagePosition: "50% 24%",
    bio: [
      "Eunice has been a part of Karen Surgery almost since its inception. Eunice manages the filing and ensures that all waiting patients are made to feel welcome, comfortable and well cared for.",
    ],
  },
];

export function getPractitionersByDepartment(dept: DepartmentSlug) {
  return PRACTITIONERS.filter((p) => p.department === dept);
}
