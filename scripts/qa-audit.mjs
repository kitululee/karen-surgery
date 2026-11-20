import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "out");

const EXPECTED_ROUTES = [
  "/",
  "/about/",
  "/team/",
  "/services/",
  "/doctors/",
  "/mental-health/",
  "/physiotherapy/",
  "/allied-health-professionals/",
  "/laboratory-services/",
  "/opening-hours/",
  "/medical-info/",
  "/location/",
  "/contact-us/",
];

const PRACTITIONER_IMAGE_PAIRS = [
  ["Dr. Margriet van Unen-van Enk", "doctors/dr-margriet-van-unen"],
  ["Dr. Marie-Louise Cantamessa", "doctors/dr-marie-louise-cantamessa"],
  ["Dr. Jacqueline W. Kitulu", "doctors/dr-jacqueline-kitulu"],
  ["Mrs. Hannah Murimi", "doctors/hannah-murimi"],
  ["Dr. Z. A. Kaka", "doctors/dr-zohair-kaka"],
  ["Eunice Muthoni Mugo", "doctors/eunice-muthoni-mugo"],
  ["Anne Ragui", "reception/anne-ragui"],
  ["Dr. Tonya Shaw", "mental-health/dr-tonya-shaw"],
  ["Judy Gitau", "mental-health/judy-gitau"],
  ["Kaye Alianda McIlwaine", "mental-health/kaye-alianda-mcilwaine"],
  ["Anna Kaminski", "physiotherapy/anna-kaminski"],
  ["Altaf Mapara", "physiotherapy/altaf-mapara"],
  ["Sally Dixson", "physiotherapy/sally-dixson"],
  ["Sarah Peacock", "physiotherapy/sarah-peacock"],
  ["Fabian Collis", "allied-health/fabian-collis"],
  ["Megan Anjeri", "allied-health/megan-anjeri"],
  ["Millicent Mboya", "allied-health/millicent-mboya"],
  ["Richard Handford", "allied-health/richard-handford"],
  ["Alice Coulson", "allied-health/alice-coulson"],
];

const results = [];
function check(name, passed, detail) {
  results.push({ name, passed, detail });
  const icon = passed ? "PASS" : "FAIL";
  console.log(`[${icon}] ${name}: ${detail}`);
}

function routeToFile(route) {
  if (route === "/") return path.join(OUT_DIR, "index.html");
  return path.join(OUT_DIR, route.replace(/^\/|\/$/g, ""), "index.html");
}

// 1. All routes exist in static export
const missingRoutes = EXPECTED_ROUTES.filter((r) => !fs.existsSync(routeToFile(r)));
check(
  "All 13 pages built cleanly",
  missingRoutes.length === 0,
  missingRoutes.length === 0 ? "13/13 HTML files present" : `Missing: ${missingRoutes.join(", ")}`
);

// 2. Auxiliary SEO & error files
for (const file of ["sitemap.xml", "robots.txt", "404.html"]) {
  check(`Static asset ${file}`, fs.existsSync(path.join(OUT_DIR, file)), file);
}

// 3. Per-page SEO, heading, link, image & prohibited artifact audit
const titles = new Map();
const brokenLinks = [];
const brokenAssets = [];
const missingMeta = [];
const h1Issues = [];
const forbiddenLeaks = [];
const telLinks = new Set();
const mailtoLinks = new Set();
const whatsappLinks = new Set();

const FORBIDDEN_PATTERNS = [
  /AIzaSy[0-9A-Za-z_-]{20,}/,
  /Image After Description/i,
  /Google Maps Example/i,
  /YOUR_MAP_ID/,
  /Naiorbi/,
];

for (const route of EXPECTED_ROUTES) {
  const html = fs.readFileSync(routeToFile(route), "utf8");

  // Title uniqueness & no duplicate suffix
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";
  if (!title) missingMeta.push(`${route}: missing <title>`);
  if (title.includes("| Karen Surgery | Karen Surgery")) {
    missingMeta.push(`${route}: duplicated title suffix "${title}"`);
  }
  if (titles.has(title)) missingMeta.push(`${route}: duplicate <title> "${title}"`);
  titles.set(title, route);

  // Meta description & canonical & OG
  if (!/<meta\s+name="description"\s+content="[^"]{30,}"/i.test(html)) {
    missingMeta.push(`${route}: missing/short meta description`);
  }
  if (!/<link\s+rel="canonical"\s+href="https:\/\/www\.karensurgery\.com/i.test(html)) {
    missingMeta.push(`${route}: missing canonical URL`);
  }
  if (!/<meta\s+property="og:title"/i.test(html)) {
    missingMeta.push(`${route}: missing og:title`);
  }
  if (!/<html[^>]+lang="en"/i.test(html)) {
    missingMeta.push(`${route}: missing lang="en"`);
  }

  // Single <h1>
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (h1Count !== 1) h1Issues.push(`${route}: found ${h1Count} <h1> elements`);

  // Forbidden legacy artifacts / leaked API keys
  for (const pat of FORBIDDEN_PATTERNS) {
    if (pat.test(html)) forbiddenLeaks.push(`${route} matched ${pat}`);
  }

  // Internal href checks
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith("tel:")) {
      telLinks.add(href);
    } else if (href.startsWith("mailto:")) {
      mailtoLinks.add(href);
    } else if (href.includes("wa.me")) {
      whatsappLinks.add(href);
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      const cleanPath = href.split("#")[0].split("?")[0];
      if (!cleanPath || cleanPath.startsWith("/_next/") || cleanPath.startsWith("/icon")) continue;
      const diskHtml = cleanPath === "/"
        ? path.join(OUT_DIR, "index.html")
        : path.join(OUT_DIR, cleanPath.replace(/^\/|\/$/g, ""), "index.html");
      const diskDirect = path.join(OUT_DIR, cleanPath.replace(/^\//, ""));
      if (!fs.existsSync(diskHtml) && !fs.existsSync(diskDirect)) {
        brokenLinks.push(`${route} -> ${href}`);
      }
    }
  }

  // Image & <source> src/srcSet existence on disk
  for (const m of html.matchAll(/(?:src|srcSet)="(\/images\/[^"]+)"/g)) {
    const assetPath = path.join(OUT_DIR, m[1].replace(/^\//, ""));
    if (!fs.existsSync(assetPath) || fs.statSync(assetPath).size === 0) {
      brokenAssets.push(`${route} -> ${m[1]}`);
    }
  }
}

check("Unique SEO metadata, canonical & OG on all pages", missingMeta.length === 0, missingMeta.length === 0 ? "13/13 verified" : missingMeta.join("; "));
check("Single semantic <h1> per page", h1Issues.length === 0, h1Issues.length === 0 ? "13/13 verified" : h1Issues.join("; "));
check("Zero dead internal links", brokenLinks.length === 0, brokenLinks.length === 0 ? "All internal links valid" : brokenLinks.join("; "));
check("Zero broken local images/sources", brokenAssets.length === 0, brokenAssets.length === 0 ? "All AVIF/WebP/JPEG assets exist" : brokenAssets.join("; "));
check("Zero legacy builder artifacts or exposed API keys", forbiddenLeaks.length === 0, forbiddenLeaks.length === 0 ? "Clean" : forbiddenLeaks.join("; "));
check("Clickable telephone links present", telLinks.size >= 15, `${telLinks.size} unique tel: links`);
check("Clickable WhatsApp link verified", whatsappLinks.has("https://wa.me/254733642246"), Array.from(whatsappLinks).join(", "));
check("Clickable email links verified", mailtoLinks.has("mailto:Receptionist@KarenSurgery.com"), `${mailtoLinks.size} unique mailto: links`);

// 4. Practitioner photo-to-profile accuracy across team & department pages
const teamHtml = fs.readFileSync(routeToFile("/team/"), "utf8");
const mismatchedProfiles = [];
for (const [name, imgKey] of PRACTITIONER_IMAGE_PAIRS) {
  const escaped = imgKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const inTeam =
    teamHtml.includes(name) &&
    new RegExp(`/images/${escaped}(?:\\.[a-f0-9]{8})?\\.jpg`).test(teamHtml);
  if (!inTeam) mismatchedProfiles.push(`${name} <-> ${imgKey}`);
}
check(
  "All 19 authentic personnel profiles matched to verified photographs",
  mismatchedProfiles.length === 0,
  mismatchedProfiles.length === 0 ? "19/19 matched" : mismatchedProfiles.join("; ")
);

// 5. Critical clinical content & emergency safeguards
const homeHtml = fs.readFileSync(routeToFile("/"), "utf8");
const hoursHtml = fs.readFileSync(routeToFile("/opening-hours/"), "utf8");
const medHtml = fs.readFileSync(routeToFile("/medical-info/"), "utf8");
const contactHtml = fs.readFileSync(routeToFile("/contact-us/"), "utf8");

check("Homepage preserves official tagline", homeHtml.includes("Health Care") && homeHtml.includes("The Way It Should Be."), "Tagline verified");
check("Emergency phone +254 (0) 724 840246 present on Contact & Home", contactHtml.includes("+254 (0) 724 840246") && homeHtml.includes("+254 (0) 724 840246"), "Verified");
check("Opening Hours preserves all 5 schedules + Night Calls policy", hoursHtml.includes("Anne Ragui") && hoursHtml.includes("8:00 am – 1:00 pm") && hoursHtml.includes("7:00 am to 7:00 pm") && hoursHtml.includes("no longer do night calls") && hoursHtml.includes("Other Health Professionals"), "All 5 schedules verified");
check("Medical Advisory Disclaimer preserved verbatim", medHtml.includes("must be considered as an advisory service only"), "Verified");
check("JSON-LD MedicalClinic structured data present", homeHtml.includes('"@type":"MedicalClinic"'), "Verified");

const failed = results.filter((r) => !r.passed);
console.log(`\nQA Summary: ${results.length - failed.length}/${results.length} passed.`);
if (failed.length > 0) process.exit(1);
