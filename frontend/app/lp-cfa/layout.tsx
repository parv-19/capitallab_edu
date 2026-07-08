import type { ReactNode } from "react";
import { buildMetadata, getOrganizationSchema } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CFA Coaching in Ahmedabad | Capital Lab Education",
  description:
    "Structured CFA coaching from Capital Lab Education covering investment tools, valuation, ethics, and portfolio management, led by an instructor who has cleared CFA Level 2.",
  path: "/lp-cfa",
  keywords: [
    "CFA coaching Ahmedabad",
    "CFA classes",
    "CFA Level 1 preparation",
    "CFA Level 2 preparation",
    "Capital Lab Education CFA",
  ],
});

export default function LpCfaLayout({ children }: { children: ReactNode }) {
  const organizationSchema = getOrganizationSchema();

  return (
    <div className="bg-white font-jakarta">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      {children}
    </div>
  );
}
