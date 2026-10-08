import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/super-admin",
        "/super-admin/",
        "/api/",
        "/activity",
        "/favorites",
        "/checkout/",
        "/verify-email",
        "/verify-code",
        "/reset-password",
        "/forgot-password",
        "/email-sent",
        "/blocked",
        "/unauthorized",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
