import Link from "next/link";
import { BookOpen, Clock, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { marketingCourses } from "@/lib/site-content";
import { buildMetadata, getCourseCollectionSchema } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CMA US and CFA Programs",
  description:
    "Explore Capital Lab Education programs for CMA US and CFA with exam-focused coaching, small batches, and practical finance guidance.",
  path: "/courses",
  keywords: ["CMA US course Ahmedabad", "CFA coaching program", "Capital Lab programs"],
});

export default function CoursesPage() {
  const structuredData = getCourseCollectionSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Navbar />
      <div className="bg-hero-mesh pb-14 pt-24 sm:pb-16 sm:pt-28">
        <div className="container-shell">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80">
            Our Programs
          </div>
          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">Find Your Certification Path</h1>
          <p className="max-w-2xl text-base text-white/70 sm:text-lg">
            Explore our CMA US and CFA programs built around rigorous concept clarity, applied finance understanding,
            and exam-focused support.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none">
            <path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" />
          </svg>
        </div>
      </div>

      <section className="section-pad relative">
        <div className="container-shell">
          <div className="flex flex-col gap-6 sm:gap-8">
            {marketingCourses.map((course) => (
              <article
                key={course._id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="flex h-40 shrink-0 items-center justify-center bg-gradient-to-br from-brand-navy to-blue-600 md:h-auto md:w-64">
                    <BookOpen className="h-16 w-16 text-white/30" />
                  </div>
                  <div className="flex-1 p-5 sm:p-6 md:p-7">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className="mb-3 inline-block rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-bold text-brand-gold">
                          {course.level}
                        </span>
                        <h2 className="text-xl font-bold text-brand-navy sm:text-2xl">{course.title}</h2>
                        <p className="mt-1 text-sm text-gray-400">by {course.instructor}</p>
                      </div>
                    </div>
                    <p className="mb-5 text-sm leading-relaxed text-gray-600 sm:text-base">{course.shortDescription}</p>
                    <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-brand-gold" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-brand-gold" />
                        Small batch mentoring
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="rounded-xl bg-brand-navy px-6 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-navyDark"
                      >
                        View Full Details
                      </Link>
                      <Link
                        href={`/leads?course=${encodeURIComponent(course.title)}`}
                        className="rounded-xl border border-brand-gold px-6 py-2.5 text-center text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold hover:text-white"
                      >
                        Enquire Now
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
