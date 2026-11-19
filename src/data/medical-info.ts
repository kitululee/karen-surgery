import type { ImageAssetKey } from "./image-manifest.generated";

export interface MedicalGraphic {
  id: string;
  image: ImageAssetKey;
  title: string;
  caption: string;
  alt: string;
  sourceNote: string;
}

export const MEDICAL_INFO_DATA = {
  // Verbatim notices from https://www.karensurgery.com/medical-info/
  notices: [
    {
      title: "Southern Hemisphere Flu Vaccine",
      body: "The 2022 Southern Hemisphere flu vaccine is available at Surgery.",
      note: "Please confirm current seasonal vaccine stock with reception on +254 (0) 733 642246.",
    },
    {
      title: "HPV Vaccination",
      body: "The WHO recommends HPV vaccines as part of routine vaccinations. HPV vaccines have been used in Kenya since 2006 but have been out of stock for the last three years. Simply getting the HPV vaccine at the age of 10–14 (and catching up to 26 yrs) can help protect against certain cancers in life.",
      note: "Please contact reception to confirm current availability and dosing guidance.",
    },
  ],
  immunisationIntro:
    "Immunisation schedules for children and adolescents vary from country to country, and according to underlying health conditions. It is complicated, and parents also often have concerns about the safety of all these vaccines. Please come and talk to us and we will find a schedule that works for you and your child.",
  graphics: [
    {
      id: "immunization-schedule",
      image: "medical-info/cdc-immunization-schedule-2025",
      title: "Recommended Child and Adolescent Immunization Schedule (CDC, 2025)",
      caption:
        "Table 1: Recommended Child and Adolescent Immunization Schedule for Ages 18 Years or Younger, United States, 2025 (cdc.gov). Discuss with a Karen Surgery GP to tailor a schedule suited to Kenya and your family's needs.",
      alt: "CDC Table 1 showing the 2025 Recommended Child and Adolescent Immunization Schedule from birth through 18 years across RSV, Hepatitis B, Rotavirus, DTaP, Hib, Pneumococcal, Polio, COVID-19, Influenza, MMR, Varicella, Hepatitis A, Tdap, HPV, Meningococcal, Dengue, and Mpox vaccines.",
      sourceNote: "Source: CDC (cdc.gov) — 2025 Reference Table",
    },
    {
      id: "hpv-vaccine-guide",
      image: "medical-info/cdc-hpv-vaccine-guide-2021",
      title: "HPV Vaccine for Preteens and Teens (CDC Fact Sheet)",
      caption:
        "CDC informational handout explaining why HPV vaccination is recommended at ages 11–12 years, dosing intervals, and vaccine safety (Last updated July 2021).",
      alt: "CDC HPV Vaccine is Cancer Prevention fact sheet covering why children need HPV vaccination, recommended ages and 2-dose or 3-dose schedules, and safety profile.",
      sourceNote: "Source: CDC (www.cdc.gov/hpv) — Last updated July 2021",
    },
  ] as MedicalGraphic[],
  recommendedLinks: [
    {
      category: "Travel & General Health",
      items: [
        {
          label: "CDC Travellers' Health",
          href: "https://wwwnc.cdc.gov/travel",
          description:
            "Information on vaccines, medication, and other measures necessary to prevent illness and injury during international travel.",
        },
        {
          label: "CDC Kenya Travel Page",
          href: "https://wwwnc.cdc.gov/travel/destinations/traveler/none/kenya",
          description:
            "Destination-specific health advice and vaccine recommendations for Kenya.",
        },
        {
          label: "Nederlands Huisartsen Genootschap (NHG)",
          href: "https://www.nhg.org/",
          lang: "nl",
          description: "Recommended Dutch general practice health resource.",
        },
      ],
    },
    {
      category: "Dietary Advice",
      items: [
        {
          label: "GI Symbol — GI News (February 2015 PDF)",
          href: "http://www.gisymbol.com/cms/wp-content/uploads/2015/01/GI-News-February-20152.pdf",
          description: "Glycemic Index dietary newsletter reference.",
        },
        {
          label: "GI Symbol — Food for Thought",
          href: "http://www.gisymbol.com/food-thought-2/",
          description: "Evidence-based glycemic index articles and nutrition information.",
        },
      ],
    },
  ],
  // Preserved verbatim from https://www.karensurgery.com/medical-info/
  disclaimer:
    "Please remember that medical information provided by Karen Surgery, in the absence of a visit to a physician, must be considered as an advisory service only. The information contained in this website should not be relied upon as a medical consultation. This website is not designed to replace a physician's independent judgement about the appropriateness or risks of treatment for a given patient.",
};
