import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { aboutPillars, companyInfo, instructorProfile, stats } from "@/lib/site-content";
import { buildMetadata, getOrganizationSchema } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Capital Lab Education",
  description:
    "Learn about Capital Lab Education, our finance-focused coaching approach, instructor background, and how we help students prepare for CMA US and CFA.",
  path: "/about",
  keywords: [
    "about Capital Lab Education",
    "finance coaching institute Ahmedabad",
    "CFA and CMA US mentor",
  ],
});

const timeline = [
  {
    year: "2014",
    title: "Capital Lab Founded",
    desc: "Capital Lab Education was built to help finance students and professionals prepare for globally recognized certifications with more relevance and structure.",
  },
  {
    year: "2018",
    title: "Industry-Led Teaching Model",
    desc: "The classroom approach evolved to blend exam-focused learning with live financial services experience across valuation, credit, and analysis.",
  },
  {
    year: "2022",
    title: "Flexible Learning Expansion",
    desc: "Online and offline delivery options made it easier for working professionals and graduates to prepare without compromising depth.",
  },
  {
    year: "2026",
    title: "500+ Students Trained",
    desc: "Capital Lab continues to support finance aspirants with focused programs, small batches, and mentorship that stays close to student goals.",
  },
];

export default function AboutPage() {
  const organizationSchema = getOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Navbar />

      <section className="relative bg-hero-mesh pb-20 pt-28">
        <div className="container-shell relative z-10">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80">
              About Us
            </div>
            <h1 className="mb-5 text-4xl font-extrabold text-white md:text-5xl">
              Built for finance professionals who <span className="text-brand-gold">aim higher</span>
            </h1>
            <p className="mb-6 text-lg leading-relaxed text-white/70">{companyInfo.aboutDescription}</p>
            <p className="leading-relaxed text-white/60">
              Our coaching model is centered on clarity, relevance, and mentorship so students can prepare with confidence for high-stakes finance exams.
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none">
            <path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" />
          </svg>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-2xl bg-white p-6 text-center shadow-soft">
                <div className="mb-1 text-4xl font-extrabold text-brand-navy">{value}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-shell">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-brand-navy">Our Journey</h2>
            <p className="mx-auto max-w-md text-gray-500">A few milestones that shaped the Capital Lab approach.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {timeline.map(({ year, title, desc }) => (
              <article key={year} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
                <div className="mb-2 text-sm font-bold text-brand-gold">{year}</div>
                <h3 className="mb-2 text-lg font-bold text-brand-navy">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-brand-navy">Meet the Instructor</h2>
            <p className="mx-auto max-w-2xl text-gray-500">
              Learn from a finance professional who brings both classroom clarity and practical market experience.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-7 shadow-soft">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <img
                src="/api/site-assets/instructor"
                alt={instructorProfile.name}
                className="h-56 w-44 rounded-2xl border border-brand-gold/30 object-cover shadow-sm"
              />
              <div className="flex-1">
                <h3 className="mb-1 text-xl font-bold text-brand-navy">{instructorProfile.name}</h3>
                <div className="mb-3 text-xs font-semibold text-brand-gold">{instructorProfile.role}</div>
                <p className="mb-4 text-sm leading-relaxed text-gray-500">{instructorProfile.bio}</p>
                <div className="mb-4 flex flex-wrap gap-2">
                  {instructorProfile.credentials.map((tag) => (
                    <span key={tag} className="rounded-full bg-brand-gold/10 px-2.5 py-1 text-xs font-medium text-brand-gold">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {instructorProfile.expertise.map((tag) => (
                    <span key={tag} className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-xs font-medium text-brand-navy">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container-shell">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold text-brand-navy">What Sets Us Apart</h2>
            <p className="mx-auto max-w-md text-gray-500">The principles that shape every session and every student interaction.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {aboutPillars.map(({ title, description }) => (
              <article key={title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-soft">
                <h3 className="mb-2 font-bold text-brand-navy">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-navy py-14">
        <div className="container-shell text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">Ready to choose the right finance certification?</h2>
          <p className="mx-auto mb-8 max-w-md text-white/60">
            Talk to our team and get guidance on whether CMA US or CFA best fits your next career move.
          </p>
          <Link
            href="/leads"
            className="inline-flex rounded-xl bg-brand-gold px-8 py-4 text-lg font-bold text-white shadow-lg transition-colors hover:bg-amber-600"
          >
            Talk to an Advisor
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
