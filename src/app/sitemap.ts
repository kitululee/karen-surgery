import type { MetadataRoute } from "next";
import { PRACTICE } from "@/data/practice";

export const dynamic = "force-static";

const ROUTES = [
  { path: "/", priority: 1.0 },
  { path: "/about/", priority: 0.8 },
  { path: "/team/", priority: 0.9 },
  { path: "/services/", priority: 0.9 },
  { path: "/doctors/", priority: 0.9 },
  { path: "/mental-health/", priority: 0.85 },
  { path: "/physiotherapy/", priority: 0.85 },
  { path: "/allied-health-professionals/", priority: 0.85 },
  { path: "/laboratory-services/", priority: 0.8 },
  { path: "/opening-hours/", priority: 0.9 },
  { path: "/medical-info/", priority: 0.75 },
  { path: "/location/", priority: 0.85 },
  { path: "/contact-us/", priority: 0.95 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((route) => ({
    url: `${PRACTICE.siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: route.priority,
  }));
}
