import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://vision.example.com";
  const now = new Date();
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/chat`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${site}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/register`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site}/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
  ];
}
