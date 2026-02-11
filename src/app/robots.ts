import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/account", "/admin", "/creator", "/api/"] },
      { userAgent: "Googlebot", allow: "/", disallow: ["/dashboard", "/account", "/admin", "/creator", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
