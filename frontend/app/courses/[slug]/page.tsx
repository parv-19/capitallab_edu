import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, Users } from "lucide-react";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LeadForm from "@/components/ui/LeadForm";
import { courseDetails, instructorProfile, marketingCourses } from "@/lib/site-content";
import { buildMetadata, getCourseSchema } from "@/lib/seo";

export function generateStaticParams() {
  return marketingCourses.map((course) => ({ slug: course.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const course = marketingCourses.find((item) => item.slug === params.slug);

  if (!course) {
    return buildMetadata({
      title: "Program Not Found",
      description: "The requested Capital Lab Education program could not be found.",
      path: `/courses/${params.slug}`,
    });
  }

  return buildMetadata({
    title: `${course.title} Coaching Program`,
    description: course.shortDescription,
    path: `/courses/${course.slug}`,
    keywords: [course.title, `${course.title} coaching`, `${course.title} classes Ahmedabad`],
  });
}

export default function CourseDetailPage({ params }: { params: { slug: string } }) {
  const course = courseDetails[params.slug];

  if (!course) {
    notFound();
  }

  const sections = [...new Set(course.lessons.map((lesson) => lesson.sectionName))];
  const structuredData = getCourseSchema(params.slug);

  return (
    <>
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}
      <Navbar />

      <div className="bg-hero-mesh pb-14 pt-24 sm:pb-16 sm:pt-28">
        <div className="container-shell">
          <div className="max-w-2xl">
            <span className="mb-4 inline-block rounded-full bg-brand-gold px-3 py-1 text-xs font-bold text-white">
              {course.level}
            </span>
            <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">{course.title}</h1>
            <p className="mb-5 text-base text-white/70 sm:text-lg">{course.shortDescription}</p>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-gold" />
                {course.duration}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-brand-gold" />
                Small batch mentoring
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-brand-gold" />
                {course.instructor}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none">
            <path d="M0 60L1440 60L1440 10C1200 60 900 0 720 15C540 30 240 60 0 15L0 60Z" fill="#f5f7fb" />
          </svg>
        </div>
      </div>

      <section className="section-pad relative">
        <div className="container-shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <div className="min-w-0 flex-1 space-y-6">
              <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
                <h2 className="mb-4 text-xl font-bold text-brand-navy">About this Program</h2>
                <p className="leading-relaxed text-gray-600">{course.description}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[
                    ["Duration", course.duration],
                    ["Level", course.level],
                    ["Instructor", course.instructor],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-gray-50 p-4">
                      <div className="mb-1 text-xs text-gray-400">{label}</div>
                      <div className="text-sm font-semibold text-brand-navy">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl bg-white p-5 shadow-soft sm:p-7">
                <h2 className="text-xl font-bold text-brand-navy">Curriculum Snapshot</h2>
                {sections.map((section) => {
                  const lessons = course.lessons
                    .filter((lesson) => lesson.sectionName === section)
                    .sort((a, b) => a.order - b.order);

                  return (
                    <section key={section} className="rounded-2xl border border-gray-100">
                      <div className="border-b border-gray-100 px-5 py-4">
                        <div className="font-semibold text-brand-navy">{section}</div>
                        <div className="text-sm text-gray-400">{lessons.length} lessons</div>
                      </div>
                      <div>
                        {lessons.map((lesson) => (
                          <div
                            key={lesson._id}
                            className="flex flex-col gap-3 border-b border-gray-50 px-5 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy/10">
                                <BookOpen className="h-3 w-3 text-brand-navy" />
                              </div>
                              <span className="text-sm text-gray-700">{lesson.title}</span>
                              {lesson.isFreePreview ? (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                  Free Preview
                                </span>
                              ) : null}
                            </div>
                            <span className="text-xs text-gray-400">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-soft sm:p-7">
                <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <img
                    src="/api/site-assets/instructor"
                    alt={instructorProfile.name}
                    className="h-20 w-16 rounded-2xl border border-brand-gold/30 object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-brand-navy">{instructorProfile.name}</h3>
                    <div className="text-sm font-medium text-brand-gold">{instructorProfile.role}</div>
                  </div>
                </div>
                <p className="mb-5 leading-relaxed text-gray-600">{instructorProfile.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {instructorProfile.expertise.map((item) => (
                    <span key={item} className="rounded-full bg-brand-navy/5 px-2.5 py-1 text-xs font-medium text-brand-navy">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 lg:w-80">
              <div className="space-y-4 lg:sticky lg:top-24">
                <LeadForm mode="inline" defaultCourse={course.title} />
                <Link
                  href="/leads"
                  className="inline-flex w-full justify-center rounded-xl border border-brand-gold px-6 py-3 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold hover:text-white"
                >
                  Book Free Counselling Call
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
