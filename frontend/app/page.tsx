import type { Metadata } from "next";
import { cache } from "react";
import { readFile } from "fs/promises";
import path from "path";
import ApprovedLandingPage from "@/components/home/ApprovedLandingPage";
import { buildMetadata, getOrganizationSchema, getWebsiteSchema } from "@/lib/seo";
import { getApprovedTestimonials, type MarketingTestimonial } from "@/lib/server/testimonials";

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function buildTestimonialMarkup(testimonials: MarketingTestimonial[]) {
  return testimonials
    .map(
      (item) => `<article class="testimonial-card">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">${escapeHtml(item.review)}</p>
            <div class="testimonial-footer">
              <div class="testimonial-avatar">${escapeHtml(initials(item.studentName))}</div>
              <div>
                <div class="testimonial-author">${escapeHtml(item.studentName)}</div>
                <div class="testimonial-role">${escapeHtml(item.designation ?? "Capital Lab Education Student")}</div>
              </div>
            </div>
          </article>`,
    )
    .join("");
}

function transformLandingMarkup(markup: string, testimonials: MarketingTestimonial[]) {
  const touchGuardPrefix =
    "event.preventDefault();event.stopPropagation();this.dataset.tap='1';setTimeout(function(el){el.dataset.tap='';},350,this);";
  const clickGuardPrefix =
    "event.preventDefault();event.stopPropagation();if(this.dataset.tap==='1'){this.dataset.tap='';return;}";
  const toggleNavAction = `${clickGuardPrefix}window.__capitalLabToggleMobileNav&&window.__capitalLabToggleMobileNav();`;
  const closeNavAction = `${clickGuardPrefix}window.__capitalLabCloseMobileNav&&window.__capitalLabCloseMobileNav();`;
  const touchToggleNavAction = `${touchGuardPrefix}window.__capitalLabToggleMobileNav&&window.__capitalLabToggleMobileNav();`;
  const touchCloseNavAction = `${touchGuardPrefix}window.__capitalLabCloseMobileNav&&window.__capitalLabCloseMobileNav();`;
  const testimonialAction = (direction: "prev" | "next") =>
    `${clickGuardPrefix}var track=document.getElementById('testimonialsTrack');var prev=document.getElementById('testimonialPrev');var next=document.getElementById('testimonialNext');var dots=document.getElementById('testimonialDots');if(!track||!prev||!next||!dots)return;var cards=track.querySelectorAll('.testimonial-card');if(!cards.length)return;var perView=window.innerWidth<=768?1:(cards.length<=2?1:2);var max=Math.max(0,cards.length-perView);var current=Number(track.dataset.index||'0');current=${direction === "next" ? "(current>=max?0:current+1)" : "(current<=0?max:current-1)"};cards.forEach(function(card){card.style.flex='0 0 '+(perView===1?'100%':'calc(50% - 12px)');});var gap=window.innerWidth<=768?20:24;var slideWidth=cards[0].getBoundingClientRect().width+gap;track.style.transform='translateX(' + (-current*slideWidth) + 'px)';prev.disabled=max===0;next.disabled=max===0;dots.querySelectorAll('.testimonial-dot').forEach(function(dot,i){dot.classList.toggle('active',i===current);});track.dataset.index=String(current);`;
  const testimonialTouchAction = (direction: "prev" | "next") =>
    `${touchGuardPrefix}${testimonialAction(direction).replace(clickGuardPrefix, "")}`;

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
      '$1<a href="/login" class="mobile-login" data-auth-link>Login</a>\n    $2',
    )
    .replace(/ onclick="closeMobileNav\(\)"/g, "")
    .replace(
      '<button class="hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">',
      `<button class="hamburger" id="hamburger" type="button" aria-label="Toggle menu" aria-expanded="false" aria-controls="mobileNav" onclick="${toggleNavAction}" ontouchend="${touchToggleNavAction}">`,
    )
    .replace(
      '<div class="mobile-nav" id="mobileNav" role="navigation" aria-label="Mobile navigation">',
      `<div class="mobile-nav" id="mobileNav" role="navigation" aria-label="Mobile navigation" aria-hidden="true">\n    <button class="mobile-nav-close" id="mobileNavClose" type="button" aria-label="Close menu" onclick="${closeNavAction}" ontouchend="${touchCloseNavAction}">&times;</button>`,
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
    .replace(
      '<button class="testimonial-btn" id="testimonialPrev" type="button" aria-label="Previous testimonial">&#8249;</button>',
      `<button class="testimonial-btn" id="testimonialPrev" type="button" aria-label="Previous testimonial" onclick="${testimonialAction("prev")}" ontouchend="${testimonialTouchAction("prev")}">&#8249;</button>`,
    )
    .replace(
      '<button class="testimonial-btn" id="testimonialNext" type="button" aria-label="Next testimonial">&#8250;</button>',
      `<button class="testimonial-btn" id="testimonialNext" type="button" aria-label="Next testimonial" onclick="${testimonialAction("next")}" ontouchend="${testimonialTouchAction("next")}">&#8250;</button>`,
    )
    .replace(
      /<div class="testimonials-track" id="testimonialsTrack">[\s\S]*?<\/div>\s*<div class="testimonial-controls">/,
      `<div class="testimonials-track" id="testimonialsTrack">${buildTestimonialMarkup(testimonials)}</div>\n      <div class="testimonial-controls">`,
    )
    .replace('  <!-- POPUP MODAL -->', '  <!-- POPUP MODAL -->');
}

const getLandingContent = cache(async () => {
  const html = await readFile(path.join(process.cwd(), "index.html"), "utf-8");
  const testimonials = await getApprovedTestimonials();
  const styles = `${extractSection(
    html,
    "<style>",
    "</style>",
  )}\nhtml,body{overflow-y:auto!important;scrollbar-gutter:auto;scrollbar-width:thin}.page{overflow-x:hidden}.page::-webkit-scrollbar,html::-webkit-scrollbar,body::-webkit-scrollbar{width:0;background:transparent}.page::-webkit-scrollbar-track,html::-webkit-scrollbar-track,body::-webkit-scrollbar-track{background:transparent}.page::-webkit-scrollbar-thumb,html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background:rgba(148,163,184,.45);border-radius:999px;border:0}.page::-webkit-scrollbar-thumb:hover,html::-webkit-scrollbar-thumb:hover,body::-webkit-scrollbar-thumb:hover{background:rgba(100,116,139,.65)}.nav-links{gap:20px}.nav-links a{display:inline-flex;align-items:center;justify-content:center}.nav-login{margin-left:8px;min-width:92px;border:1px solid rgba(255,255,255,0.36);color:var(--white)!important;padding:8px 18px;border-radius:4px;font-size:14px;font-weight:600;letter-spacing:.3px;line-height:1;transition:background .2s,color .2s,border-color .2s;display:inline-flex;align-items:center;justify-content:center}.nav-login:hover{background:rgba(255,255,255,0.1);color:var(--gold)!important;border-color:rgba(201,168,76,0.55)}.nav-cta{margin-left:2px;min-width:110px;text-align:center}.mobile-login{margin-top:16px;border-radius:4px;font-family:'Source Sans 3',sans-serif!important;font-size:16px!important;font-weight:700!important;width:auto!important;padding:14px 40px!important;color:var(--white)!important;border:1px solid rgba(255,255,255,0.26)}.mobile-login:hover{background:rgba(255,255,255,0.08);color:var(--gold)!important}.mobile-nav{visibility:hidden;pointer-events:none;padding:96px 20px 32px;justify-content:flex-start;overflow-y:auto;-webkit-overflow-scrolling:touch}.mobile-nav.open{visibility:visible;pointer-events:auto}.mobile-nav-close{position:absolute;top:18px;right:16px;z-index:505;display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border:1px solid rgba(255,255,255,0.18);border-radius:999px;background:rgba(255,255,255,0.06);color:var(--white);font-size:28px;line-height:1;cursor:pointer;pointer-events:auto;touch-action:manipulation}.mobile-nav-close:hover{background:rgba(255,255,255,0.12);color:var(--gold)}.mobile-nav-logo{pointer-events:none}.hamburger{position:relative;z-index:506;min-width:48px;min-height:48px;pointer-events:auto;touch-action:manipulation}.hamburger span{width:26px;pointer-events:none}.mobile-nav a{max-width:100%}.testimonial-controls,.testimonial-dots{position:relative;z-index:5}.testimonial-btn,.testimonial-dot{position:relative;z-index:6;pointer-events:auto;touch-action:manipulation}.program-accordion-item{position:relative}.program-accordion-trigger{position:relative;z-index:1;pointer-events:auto;touch-action:manipulation}.program-accordion-icon,.program-accordion-icon::before{pointer-events:none}.popup-overlay{pointer-events:none}.popup-overlay.active{pointer-events:auto}`;
  const body = extractSection(html, "<body>", "<script>");

  return {
    styles,
    markup: transformLandingMarkup(body, testimonials),
    testimonials,
  };
});

export default async function HomePage() {
  const { styles, markup, testimonials } = await getLandingContent();
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
