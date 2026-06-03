import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import LeadsLandingPage from "@/components/home/LeadsLandingPage";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

function extractSection(source: string, startTag: string, endTag: string) {
  const start = source.indexOf(startTag);
  const end = source.indexOf(endTag, start + startTag.length);
  if (start === -1 || end === -1) return "";
  return source.slice(start + startTag.length, end);
}

function transformLeadsMarkup(markup: string) {
  return markup
    .replace(/src="LOGO\.PNG"/gi, 'src="/LOGO.PNG"')
    .replace(/src="instructor_harsh\.jpg"/g, 'src="/instructur_harsh_new.jpeg"')
    .replace(/src="instructor_parth\.jpg"/g, 'src="/instructor_parth.jpg"')
    .replace(
      /<div class="nav-logo">\s*<img src="logo\.png" alt="Capital Lab Education" class="logo-img" onerror="this\.style\.display='none';document\.querySelector\('\.logo-mark'\)\.style\.display='flex'">\s*<div class="logo-mark" style="display:none">CL<\/div>\s*<span class="logo-text">Capital <span>Lab<\/span><\/span>\s*<\/div>/,
      `<a href="/" class="nav-logo home-brand-link">
      <img src="/LOGO.PNG" alt="Capital Lab Education" class="logo-img" onerror="this.style.display='none';document.querySelector('.logo-mark').style.display='flex'">
      <div class="logo-mark" style="display:none">CL</div>
      <span class="logo-text"><span class="brand-main">capital</span><span class="brand-accent">lab</span></span>
    </a>`,
    )
    .replace(
      /<div class="nav-logo" style="margin-bottom:0">\s*<img src="logo\.png" alt="Capital Lab Education" class="logo-img" onerror="this\.style\.display='none'">\s*<div class="logo-mark" style="display:none">CL<\/div>\s*<span class="logo-text">Capital <span>Lab<\/span>\s*<\/span>\s*<\/div>/,
      `<a href="/" class="nav-logo home-brand-link" style="margin-bottom:0">
        <img src="/LOGO.PNG" alt="Capital Lab Education" class="logo-img" onerror="this.style.display='none'">
        <div class="logo-mark" style="display:none">CL</div>
        <span class="logo-text"><span class="brand-main">capital</span><span class="brand-accent">lab</span></span>
      </a>`,
    )
    .replace(
      /<span class="logo-text">Capital <span>Lab<\/span><\/span>/g,
      '<span class="logo-text"><span class="brand-main">capital</span><span class="brand-accent">lab</span></span>',
    )
    .replace(/onclick="submitForm\(\)"/g, 'data-leads-submit="true"');
}

const getLeadsContent = cache(async () => {
  const htmlPath = path.join(process.cwd(), "..", "leads", "index.html.html");
  const html = await readFile(htmlPath, "utf-8");

  const styles = `${extractSection(html, "<style>", "</style>")}
.nav-logo{gap:12px}
.home-brand-link{text-decoration:none}
.logo-img{width:42px;height:42px;object-fit:cover;border-radius:8px;background:#fff;padding:4px;box-shadow:none}
.logo-text{display:inline-flex;align-items:center;gap:4px;font-family:'Plus Jakarta Sans',sans-serif!important;font-size:18px!important;font-weight:800!important;line-height:1;letter-spacing:-0.6px;color:#fff!important;text-transform:lowercase}
.logo-text .brand-main{color:#fff}
.logo-text .brand-accent{color:var(--gold)}
@media (max-width: 900px){.logo-img{width:38px;height:38px}.logo-text{font-size:16px!important}}
@media (max-width: 480px){.logo-img{width:34px;height:34px;border-radius:7px}.logo-text{font-size:15px!important}}
`;
  const body = extractSection(html, "<body>", "<script>");

  return { styles, markup: transformLeadsMarkup(body) };
});

export const metadata = buildMetadata({
  title: "Enroll - Free Counselling Call",
  description:
    "Book a free counselling call with Capital Lab Education for CMA US and CFA coaching guidance before you enroll.",
  path: "/leads",
  keywords: ["free counselling call", "CMA US admission enquiry", "CFA counselling Ahmedabad"],
});

export default async function LeadsPage() {
  const { styles, markup } = await getLeadsContent();
  return <LeadsLandingPage styles={styles} markup={markup} />;
}
