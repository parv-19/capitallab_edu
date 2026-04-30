import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://capitallabedu.com";

  // Base static routes
  const routes = [
    "",
    "/about",
    "/courses",
    "/testimonials",
    "/login",
    "/signup",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // In a real scenario, you would fetch the course slugs from the backend API here:
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses`);
  // const courses = await res.json();
  const mockCourseSlugs = ["foundation-commerce-excellence", "advanced-accounts-mastery"];

  const courseRoutes = mockCourseSlugs.map((slug) => ({
    url: `${baseUrl}/courses/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [...routes, ...courseRoutes];
}
