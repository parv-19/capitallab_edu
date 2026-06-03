import type { MetadataRoute } from "next";
import { marketingCourses } from "@/lib/site-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://capitallabedu.com";
  const lastModified = new Date();

  const routes = [
    "",
    "/about",
    "/courses",
    "/testimonials",
    "/leads",
    "/login",
    "/signup",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const courseRoutes = marketingCourses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...routes, ...courseRoutes];
}
