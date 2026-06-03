import type { Metadata } from "next";
import { companyInfo, courseDetails, marketingCourses } from "@/lib/site-content";

const fallbackBaseUrl = "https://capitallabedu.com";

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? fallbackBaseUrl;
}

export function absoluteUrl(pathname = "/") {
  return new URL(pathname, getBaseUrl()).toString();
}

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords = [],
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: companyInfo.name,
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: absoluteUrl("/LOGO.PNG"),
          width: 1200,
          height: 1200,
          alt: companyInfo.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/LOGO.PNG")],
    },
  };
}

export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: companyInfo.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/LOGO.PNG"),
    email: companyInfo.email,
    telephone: companyInfo.phoneDisplay,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ahmedabad",
      addressRegion: "Gujarat",
      addressCountry: "IN",
    },
    sameAs: [companyInfo.whatsappHref],
  };
}

export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: companyInfo.name,
    url: absoluteUrl("/"),
    description: companyInfo.heroDescription,
  };
}

export function getCourseCollectionSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${companyInfo.name} Programs`,
    itemListElement: marketingCourses.map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/courses/${course.slug}`),
      name: course.title,
    })),
  };
}

export function getCourseSchema(slug: string) {
  const course = marketingCourses.find((item) => item.slug === slug);
  const detail = courseDetails[slug];

  if (!course || !detail) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.fullTitle,
    description: detail.description,
    provider: {
      "@type": "EducationalOrganization",
      name: companyInfo.name,
      url: absoluteUrl("/"),
    },
    instructor: {
      "@type": "Person",
      name: detail.instructor,
    },
    educationalLevel: detail.level,
    url: absoluteUrl(`/courses/${slug}`),
  };
}
