import { testimonials as fallbackTestimonials } from "@/lib/site-content";
import type { Testimonial } from "@/types";

export interface MarketingTestimonial extends Testimonial {
  courseName?: string;
}

export async function getApprovedTestimonials(limit?: number) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
  const url = new URL(`${apiBaseUrl.replace(/\/$/, "")}/testimonials`);
  url.searchParams.set("status", "approved");

  if (limit && limit > 0) {
    url.searchParams.set("limit", String(limit));
  }

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: 300, tags: ["approved-testimonials"] },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch testimonials: ${response.status}`);
    }

    return (await response.json()) as MarketingTestimonial[];
  } catch {
    const approvedFallback = fallbackTestimonials.filter((testimonial) => testimonial.status === "approved");
    return approvedFallback.slice(0, limit || approvedFallback.length);
  }
}
