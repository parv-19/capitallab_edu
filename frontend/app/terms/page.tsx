import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Terms of Use",
  description: "Terms of use for Capital Lab Education.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <section className="section-pad pt-28">
        <div className="container-shell max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold text-brand-navy">Terms of Use</h1>
          <div className="space-y-4 text-sm leading-7 text-gray-600">
            <p>
              By using Capital Lab Education services, you agree to provide accurate information and use the
              platform only for lawful educational purposes.
            </p>
            <p>
              Course access, counselling, downloadable content, and student resources are intended for enrolled
              users or authorized visitors and may not be misused, copied, or redistributed without permission.
            </p>
            <p>
              We may update platform features, content, or policies over time. Continued use of the website and
              services means you accept the updated terms.
            </p>
            <p>
              For questions about these terms, contact us at <a className="text-brand-navy underline" href="mailto:info@capitallabeduation.com">info@capitallabeduation.com</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
