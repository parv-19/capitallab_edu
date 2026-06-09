import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import LeadsLandingPage from "@/components/home/LeadsLandingPage";
import { buildMetadata } from "@/lib/seo";
import { getApprovedTestimonials } from "@/lib/server/testimonials";

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
    .replace(/<nav>[\s\S]*?<\/nav>\s*/m, "")
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
.leads-menu-btn{display:none;border:none;background:transparent;padding:10px;flex-direction:column;gap:5px;cursor:pointer;touch-action:manipulation;min-height:44px;min-width:44px;align-items:center;justify-content:center}
.leads-menu-btn span{display:block;width:22px;height:2px;border-radius:999px;background:#fff;transition:transform .2s,opacity .2s}
.leads-mobile-nav{position:fixed;inset:0;background:rgba(13,27,62,.98);z-index:9999;opacity:0;pointer-events:none;transform:translateX(100%);transition:transform .25s ease,opacity .25s ease;padding:22px 18px}
.leads-mobile-nav.open{opacity:1;pointer-events:auto;transform:translateX(0)}
.leads-mobile-nav__header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:28px}
.leads-mobile-nav__close{border:none;background:transparent;color:#fff;font-size:34px;line-height:1;cursor:pointer;touch-action:manipulation;min-height:44px;min-width:44px;display:flex;align-items:center;justify-content:center}
.leads-mobile-nav__links{display:flex;flex-direction:column;gap:10px}
.leads-mobile-nav__links a{color:#fff;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:18px}
.leads-mobile-nav__links .nav-cta{margin-top:10px;text-align:center;justify-content:center}
.testi-carousel-viewport{overflow:hidden}
.testi-grid.testi-carousel-track{display:flex!important;gap:20px;transition:transform .35s ease;will-change:transform}
.testi-grid.testi-carousel-track .testi-card{min-width:calc(33.333% - 14px);flex:0 0 calc(33.333% - 14px);display:flex!important}
.testi-controls{display:flex;flex-direction:column;align-items:center;gap:12px;margin-top:24px}
.testi-controls__buttons{display:flex;align-items:center;gap:14px}
.testi-btn{width:40px;height:40px;border-radius:999px;border:1px solid rgba(201,168,76,.55);background:transparent;color:var(--gold);font-size:22px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.testi-btn:disabled{opacity:.35;cursor:default}
.testi-dots{display:flex;align-items:center;gap:8px}
.testi-dot{width:8px;height:8px;border:none;border-radius:999px;background:rgba(255,255,255,.28);cursor:pointer}
.testi-dot.active{background:var(--gold)}
@media (max-width: 900px){.logo-img{width:38px;height:38px}.logo-text{font-size:16px!important}}
@media (max-width: 480px){.logo-img{width:34px;height:34px;border-radius:7px}.logo-text{font-size:15px!important}}
@media (max-width: 900px){.leads-menu-btn{display:flex}.testi-grid.testi-carousel-track .testi-card{min-width:100%;flex:0 0 100%;display:flex!important}}
@media (min-width: 901px) and (max-width: 1180px){.testi-grid.testi-carousel-track .testi-card{min-width:calc(50% - 10px);flex:0 0 calc(50% - 10px)}}
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
  const testimonials = await getApprovedTestimonials();
  return <LeadsLandingPage styles={styles} markup={markup} testimonials={testimonials} />;
}
