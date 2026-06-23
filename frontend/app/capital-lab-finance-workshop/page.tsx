import type { Metadata } from "next";
import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
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

const CAPTCHA_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

function replaceWorkshopPaths(source: string) {
  return source
    .replace(/src="assets\/capital-lab-logo\.png"/g, 'src="/workshop-assets/capital-lab-logo.png"')
    .replace(/src="assets\/harsh-trivedi\.jpeg"/g, 'src="/workshop-assets/harsh-trivedi.jpeg"')
    .replace(/captcha\.php/g, CAPTCHA_PLACEHOLDER)
    .replace(/href="index\.php"/g, 'href="/"')
    .replace(/action="mail-send\.php"/g, 'action="#"');
}

const getWorkshopContent = cache(async () => {
  const workshopDir = path.resolve(process.cwd(), "workshop-source");
  const [styleSource, headerSource, indexSource, footerSource, modalSource] = await Promise.all([
    readFile(path.join(workshopDir, "style.css"), "utf-8"),
    readFile(path.join(workshopDir, "header.php"), "utf-8"),
    readFile(path.join(workshopDir, "index.php"), "utf-8"),
    readFile(path.join(workshopDir, "footer.php"), "utf-8"),
    readFile(path.join(workshopDir, "modal-form.html"), "utf-8"),
  ]);

  const styles = `@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap");
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css");
${styleSource.replace(/url\("assets\/reference-hero-bg\.avif"\)/g, 'url("/workshop-assets/reference-hero-bg.avif")')}
.form-alert.is-error{display:block;color:#842029;background:#f8d7da;border:1px solid #f1aeb5;}
.form-alert.is-success{display:block;color:#0f5132;background:#eaf6ee;border:1px solid #b8dfc7;}
a.btn[aria-disabled="true"]{pointer-events:none;opacity:.6;}
.site-footer{padding-bottom:138px;}
@media (max-width: 920px){.site-footer{padding-bottom:150px;}}
@media (max-width: 640px){.site-footer{padding-bottom:170px;}}
`;

  const mainMatch = indexSource.match(/<main id="main-content">[\s\S]*<\/main>/);
  const footerMarkup = footerSource
    .replace(/<script src="main\.js"><\/script>\s*/g, "")
    .replace(/<script src="form-validation\.js\?v=20260619-3"><\/script>\s*/g, "")
    .replace('<div class="modal-loading">Loading inquiry form...</div>', modalSource);

  const bodyStart = headerSource.indexOf("<body>");
  const headerMarkup = bodyStart === -1 ? headerSource : headerSource.slice(bodyStart + "<body>".length);

  const markup = replaceWorkshopPaths(
    `${headerMarkup}${mainMatch?.[0] ?? ""}${footerMarkup}`.replace(
      /<div class="form-alert<\?php echo \$formError !== '' \? ' is-visible is-error' : ''; \?>" role="status" aria-live="polite"><\?php echo htmlspecialchars\(\$formError, ENT_QUOTES, 'UTF-8'\); \?><\/div>/g,
      '<div class="form-alert" role="status" aria-live="polite"></div>',
    ),
  );

  return { markup, styles };
});

export default async function CapitalLabFinanceWorkshopPage() {
  const { markup, styles } = await getWorkshopContent();

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
      <FinanceWorkshopPage markup={markup} styles={styles} />
    </>
  );
}
