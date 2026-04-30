import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/student/"],
    },
    sitemap: "https://capitallabedu.com/sitemap.xml",
  };
}
