export const OPENING_HOURS = {
  reception: {
    title: "Receptionist",
    personName: "Anne Ragui",
    subtitle: "Available to make appointments and take messages",
    schedule: [
      { days: "Monday to Friday", hours: "8:00 am – 4:30 pm" },
      { days: "Saturday", hours: "9:00 am – 12:00 noon" },
    ],
  },
  doctorsConsulting: {
    title: "Doctors' Consulting Hours",
    schedule: [
      { days: "Monday to Friday", hours: "8:00 am – 1:00 pm" },
      { days: "Saturday", hours: "9:00 am – 12:00 noon" },
      { days: "Monday to Friday Afternoons", hours: "Urgent cases only" },
    ],
    note: "Please make an appointment if possible.",
  },
  doctorsAfterHours: {
    title: "Doctors' After Hours Service",
    availability: "Daylight hours only (7:00 am to 7:00 pm), 365 days a year — including public holidays.",
    instruction: "For urgent cases only, contact the doctor-on-duty via the emergency phone:",
  },
  nightCalls: {
    title: "Night Calls",
    policy:
      "For security reasons, we no longer do night calls. Go to the nearest hospital, or call an ambulance service.",
    ambulanceIntro: "Emergency Medical Services: Ambulances run by:",
  },
  otherProfessionals: {
    title: "Other Health Professionals",
    schedule: [
      { days: "Monday to Friday", hours: "8:00 am – 4:30 pm" },
      { days: "Saturday", hours: "9:00 am – 12:00 noon" },
    ],
    note: "Please make an appointment with the receptionist, or contact the health professional you wish to see directly by email.",
  },
};
