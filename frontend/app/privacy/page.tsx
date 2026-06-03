import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Capital Lab Education.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <section className="section-pad pt-28">
        <div className="container-shell max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold text-brand-navy">Privacy Policy</h1>
          <div className="space-y-4 text-sm leading-7 text-gray-600">
            <p>
              Capital Lab Education collects basic contact and account information to support counselling,
              enrolment, student access, and service communication.
            </p>
            <p>
              We use submitted details such as name, email, phone number, and course interest only for
              educational support, account management, and related updates.
            </p>
            <p>
              We do not sell personal data. Data may be processed through trusted infrastructure providers used
              for hosting, authentication, analytics, database storage, and communication.
            </p>
            <p>
              If you want your data corrected or removed, contact us at <a className="text-brand-navy underline" href="mailto:info@capitallabeduation.com">info@capitallabeduation.com</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
