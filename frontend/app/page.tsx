import type { Metadata } from "next";
import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import ApprovedLandingPage from "@/components/home/ApprovedLandingPage";
import { buildMetadata, getOrganizationSchema, getWebsiteSchema } from "@/lib/seo";
import { getApprovedTestimonials } from "@/lib/server/testimonials";

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "CMA US and CFA Coaching in Ahmedabad",
  description:
    "Capital Lab Education offers expert-led CMA US and CFA coaching in Ahmedabad with small batches, practical finance insights, and focused exam preparation.",
  path: "/",
  keywords: [
    "CMA US coaching Ahmedabad",
    "CFA classes Ahmedabad",
    "finance coaching institute Ahmedabad",
    "Capital Lab Education",
  ],
});

function extractSection(source: string, startTag: string, endTag: string) {
  const start = source.indexOf(startTag);
  const end = source.indexOf(endTag, start + startTag.length);

  if (start === -1 || end === -1) {
    return "";
  }

  return source.slice(start + startTag.length, end);
}

function transformLandingMarkup(markup: string) {
  return markup
    .replace(/src="LOGO\.PNG"/g, 'src="/LOGO.PNG"')
    .replace(/src="instructor_harsh\.jpg"/g, 'src="/instructur_harsh_new.jpeg"')
    .replace(/src="instructor_parth\.jpg"/g, 'src="/instructor_parth.jpg"')
    .replace(
      /(<a href="#testimonials">Testimonials<\/a>\s*)(<a href="\/leads" class="nav-leads">Book Free Call<\/a>\s*)(<a href="#" class="nav-cta">Enroll Now<\/a>)/,
      '$1<a href="/login" class="nav-login" data-auth-link>Login</a>\n      $2',
    )
    .replace(
      /(<a href="#testimonials" onclick="closeMobileNav\(\)">Testimonials<\/a>\s*)(<a href="\/leads" class="nav-leads" onclick="closeMobileNav\(\)">Book Free Call<\/a>\s*)(<a href="#" class="mobile-cta" onclick="closeMobileNav\(\)">Enroll Now<\/a>)/,
      '$1<a href="/login" class="mobile-login" data-auth-link onclick="closeMobileNav()">Login</a>\n    $2',
    )
    .replace(
      '<button class="btn-primary">Explore Our Programs</button>',
      '<button class="btn-primary" data-scroll-target="#cfa-program">Explore Our Programs</button>',
    )
    .replace(
      '<button class="btn-outline">Talk to an Advisor</button>',
      '<button class="btn-outline nav-cta-trigger">Talk to an Advisor</button>',
    )
    .replace(
      '<div class="contact-form">',
      '<div class="contact-form" data-inline-lead-form>',
    )
    .replace(
      '<div class="popup-body">',
      '<div class="popup-body" data-popup-lead-form>',
    )
    .replace(
      '<button class="submit-btn">Send Enquiry</button>',
      '<button class="submit-btn" type="button">Send Enquiry</button>',
    )
    .replace(
      '<button class="popup-submit">Send Enquiry &#8594;</button>',
      '<button class="popup-submit" type="button">Send Enquiry &#8594;</button>',
    )
    .replace('  <!-- POPUP MODAL -->', '  <!-- POPUP MODAL -->');
}

const getLandingContent = cache(async () => {
  const html = await readFile(path.join(process.cwd(), "index.html"), "utf-8");
  const styles = `${extractSection(
    html,
    "<style>",
    "</style>",
  )}\nhtml,body{overflow-y:auto!important;scrollbar-gutter:stable;scrollbar-width:auto}.page{overflow-x:hidden}.page::-webkit-scrollbar,html::-webkit-scrollbar,body::-webkit-scrollbar{width:12px}.page::-webkit-scrollbar-track,html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:#e5e7eb}.page::-webkit-scrollbar-thumb,html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:#94a3b8;border-radius:999px;border:2px solid #e5e7eb}.page::-webkit-scrollbar-thumb:hover,html::-webkit-scrollbar-thumb:hover,body::-webkit-scrollbar-thumb:hover{background:#64748b}.nav-links{gap:20px}.nav-links a{display:inline-flex;align-items:center;justify-content:center}.nav-login{margin-left:8px;min-width:92px;border:1px solid rgba(255,255,255,0.36);color:var(--white)!important;padding:8px 18px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:.3px;line-height:1;transition:background .2s,color .2s,border-color .2s;display:inline-flex;align-items:center;justify-content:center}.nav-login:hover{background:rgba(255,255,255,0.1);color:var(--gold)!important;border-color:rgba(201,168,76,0.55)}.nav-cta{margin-left:2px;min-width:110px;text-align:center}.mobile-login{margin-top:16px;border-radius:4px;font-family:'Source Sans 3',sans-serif!important;font-size:16px!important;font-weight:700!important;width:auto!important;padding:14px 40px!important;color:var(--white)!important;border:1px solid rgba(255,255,255,0.26)}.mobile-login:hover{background:rgba(255,255,255,0.08);color:var(--gold)!important}`;
  const body = extractSection(html, "<body>", "<script>");

  return {
    styles,
    markup: transformLandingMarkup(body),
  };
});

export default async function HomePage() {
  const { styles, markup } = await getLandingContent();
  const testimonials = await getApprovedTestimonials(8);
  const structuredData = [getOrganizationSchema(), getWebsiteSchema()];

  return (
    <>
      {structuredData.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ApprovedLandingPage styles={styles} markup={markup} testimonials={testimonials} />
    </>
  );
}
