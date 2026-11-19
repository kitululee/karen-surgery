export interface PhoneContact {
  display: string;
  tel: string;
  label?: string;
}

export interface AmbulanceEntry {
  provider: string;
  numbers: PhoneContact[];
}

export interface CarePillar {
  number: string;
  title: string;
  summary: string;
  items: string[];
}

export const PRACTICE = {
  name: "Karen Surgery",
  subtitle: "Family Medical Practice",
  tagline: "Karen Surgery: Health Care the way it should be.",
  establishedYear: 1991,
  siteUrl: "https://www.karensurgery.com",
  address: {
    street: "333 Ngong Road, Karen",
    landmark: "333 metres from the Karen roundabout",
    poBox: "P.O. Box 24932",
    city: "Nairobi 00502",
    country: "Kenya",
    fullSingleLine: "333 Ngong Road, Karen, P.O. Box 24932, Nairobi 00502, Kenya",
    coordinates: {
      lat: -1.32459,
      lng: 36.7026,
    },
    googleMapsDirectionsUrl:
      "https://www.google.com/maps/search/?api=1&query=-1.32459,36.70260",
    googleMapsEmbedUrl:
      "https://maps.google.com/maps?q=-1.32459,36.70260&z=16&output=embed",
  },
  contact: {
    email: "Receptionist@KarenSurgery.com",
    receptionPhones: [
      { display: "+254 (0) 733 642246", tel: "+254733642246" },
      { display: "+254 (0) 775 642246", tel: "+254775642246" },
      { display: "+254 (0) 722 646891", tel: "+254722646891" },
    ] as PhoneContact[],
    whatsapp: {
      display: "+254 (0) 733 642246",
      href: "https://wa.me/254733642246",
    },
    emergencyPhone: {
      display: "+254 (0) 724 840246",
      shortDisplay: "0724-840246",
      tel: "+254724840246",
    },
    emergencyBannerText:
      "Do not waste time. Call the emergency phone, go to the nearest hospital or call an ambulance.",
  },
  // Preserved verbatim from https://www.karensurgery.com/
  historyParagraphs: [
    "Karen Surgery started in 1991 as a small traditional general practice to provide medical services to the Karen / Langata community. Soon patients were coming from all over Nairobi, upcountry Kenya, and even East Africa. Karen Surgery has moved a few times, and expanded, but its core values have not changed, and the doctors and psychologist who own and run it have a long-term commitment to the practice and the community.",
    "Karen Surgery provides primary care family medicine services for people of all ages. The GPs (or Family Physicians) establish a personal relationship with each individual, one on one, that may last for decades; and may also care for several generations within the same family.",
  ],
  // Preserved verbatim from https://www.karensurgery.com/
  carePillars: [
    {
      number: "01",
      title: "Convenient care, where and when you need it",
      summary:
        "Accessible primary care structured around both urgent needs and planned family visits.",
      items: [
        "Same day walk-in treatment for serious acute illness",
        "Booked appointments – to minimise waiting times",
        "House visits for the elderly and infirm",
        "Telephone & email consultations for established patients",
        "Repeat prescriptions",
      ],
    },
    {
      number: "02",
      title: "Comprehensive care",
      summary:
        "Whole-family primary medicine supported by nursing, diagnostics, and allied specialists.",
      items: [
        "Well women's health checks, and shared antenatal care",
        "Well baby growth and development checks, and vaccination",
        "Treatment of acute illness, keeping you out of the emergency room",
        "Management of chronic health conditions such as diabetes",
        "Preventative medicine and screening, keeping you healthy",
        "School and sports physicals",
        "Vaccination updates & travel medicine advice",
        "Dressings and wound care by the practice nurse",
        "Allied health professionals – psychologists, physiotherapists, podiatrist, nutritionist – make up the Karen Surgery team",
      ],
    },
    {
      number: "03",
      title: "Collaborative care",
      summary:
        "Continuity of care rooted in personal relationships, honesty, and multidisciplinary teamwork.",
      items: [
        "Old fashioned personal care – respecting your values and needs",
        "Shared decision making – based on honesty, trust, and empathy",
        "Facilitating your access to specialists and high tech healthcare",
      ],
    },
    {
      number: "04",
      title: "Cost effective care",
      summary:
        "Independent, transparent family medicine focused strictly on what is clinically appropriate.",
      items: [
        "Individualised appropriate care, no unnecessary tests or treatment",
        "Subsidised lower cost care for your domestic staff",
        "We are independent and do not deal directly with insurance companies, but will complete your insurance claim forms",
      ],
    },
  ] as CarePillar[],
  // Verbatim ambulance directory from https://www.karensurgery.com/contact-us/
  contactPageAmbulances: [
    {
      provider: "Karen Hospital",
      numbers: [{ display: "+254 (0) 702 222222", tel: "+254702222222" }],
    },
    {
      provider: "Red Cross E-Plus",
      numbers: [{ display: "+254 (0) 700 395395", tel: "+254700395395" }],
    },
    {
      provider: "AAR",
      numbers: [{ display: "+254 (0) 725 225225", tel: "+254725225225" }],
    },
    {
      provider: "AMREF",
      numbers: [
        { display: "+254 (0) 722 207350", tel: "+254722207350" },
        {
          display: "+254 (0) 20 699222",
          tel: "+25420699222",
          label: "AMREF switchboard",
        },
      ],
    },
    {
      provider: "St. John's Ambulance",
      numbers: [{ display: "+254 (0) 721 225285", tel: "+254721225285" }],
    },
  ] as AmbulanceEntry[],
  // Verbatim ambulance directory from https://www.karensurgery.com/opening-hours/
  openingHoursAmbulances: [
    {
      provider: "E-Plus Red Cross",
      numbers: [{ display: "0700 395 395", tel: "+254700395395" }],
    },
    {
      provider: "AAR",
      numbers: [
        { display: "0725 225 225", tel: "+254725225225" },
        { display: "0735 225 225", tel: "+254735225225" },
      ],
    },
    {
      provider: "St John's",
      numbers: [
        { display: "0721 225 285", tel: "+254721225285" },
        { display: "020 343 999", tel: "+25420343999" },
      ],
    },
    {
      provider: "KK Security",
      numbers: [
        { display: "0730 622 000", tel: "+254730622000" },
        { display: "0709 955 650", tel: "+254709955650" },
        { display: "0728 999 912", tel: "+254728999912" },
      ],
    },
    {
      provider: "AMREF",
      numbers: [{ display: "0722 207 350", tel: "+254722207350" }],
    },
  ] as AmbulanceEntry[],
};
