import { Star } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";
import { getApprovedTestimonials } from "@/lib/server/testimonials";
import PublicReviewForm from "@/components/testimonials/PublicReviewForm";

export const metadata = buildMetadata({
  title: "Student Testimonials",
  description:
    "Read student testimonials and feedback for Capital Lab Education's CMA US and CFA coaching programs.",
  path: "/testimonials",
  keywords: ["Capital Lab testimonials", "CFA student reviews", "CMA US coaching feedback"],
});

export default async function TestimonialsPage() {
  const testimonials = await getApprovedTestimonials();

  return (
    <>
      <Navbar />

      <div className="relative bg-hero-mesh pb-16 pt-28">
        <div className="container-shell">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80">
            Student Stories
          </div>
          <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl">What Our Students Say</h1>
          <p className="max-w-lg text-lg text-white/70">
            Real feedback from learners preparing for globally recognized finance certifications.
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
          <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
            {testimonials.map((testimonial) => (
              <article
                key={testimonial._id}
                className="break-inside-avoid rounded-2xl border border-gray-100 bg-white p-6 shadow-soft"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-bold text-white">
                    {testimonial.studentName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-brand-navy">{testimonial.studentName}</div>
                    <div className="text-xs text-brand-gold">
                      {testimonial.designation ?? testimonial.courseName ?? "Capital Lab Education Student"}
                    </div>
                  </div>
                </div>
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm italic leading-relaxed text-gray-600">&ldquo;{testimonial.review}&rdquo;</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PublicReviewForm />

      <Footer />
    </>
  );
}
