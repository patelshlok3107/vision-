import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://vision.example.com";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
