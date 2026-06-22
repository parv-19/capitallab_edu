import type { Metadata } from "next";
import FinanceWorkshopPage from "./FinanceWorkshopPage";
import { buildMetadata, getOrganizationSchema } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Capital Lab Finance Workshop",
  description:
    "Join Capital Lab Education's Finance Foundation Workshop on July 4 and 5, 2026 for practical learning in finance, investing, stock markets, and financial analysis.",
  path: "/capital-lab-finance-workshop",
  keywords: [
    "Capital Lab finance workshop",
    "finance workshop Ahmedabad",
    "finance foundation workshop",
    "stock market workshop for students",
    "Capital Lab Education workshop",
  ],
});

const eventSchema = {
  "@context": "https://schema.org",
  "@type": "EducationEvent",
  name: "Finance Foundation Workshop",
  description:
    "A practical 2-day finance workshop covering personal finance, stock market basics, mutual funds, investing, and financial statement analysis.",
  startDate: "2026-07-04",
  endDate: "2026-07-05",
  eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: [
    {
      "@type": "VirtualLocation",
      url: "https://www.capitallabedu.com/capital-lab-finance-workshop",
    },
    {
      "@type": "Place",
      name: "Capital Lab Education",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ahmedabad",
        addressRegion: "Gujarat",
        addressCountry: "IN",
      },
    },
  ],
  organizer: {
    "@type": "Organization",
    name: "Capital Lab Education",
    url: "https://www.capitallabedu.com/",
  },
  offers: {
    "@type": "Offer",
    price: "199",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    url: "https://payments.cashfree.com/forms/finance-foundation-workshop",
  },
  performer: {
    "@type": "Person",
    name: "Harsh Trivedi",
  },
};

export default function CapitalLabFinanceWorkshopPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(getOrganizationSchema()) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
      />
      <FinanceWorkshopPage />
    </>
  );
}
