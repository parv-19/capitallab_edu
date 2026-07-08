import CfaNavbar from "@/components/lp-cfa/CfaNavbar";
import CfaFooter from "@/components/lp-cfa/CfaFooter";
import CfaHeroBanner from "@/components/lp-cfa/CfaHeroBanner";
import CfaCounterSection from "@/components/lp-cfa/CfaCounterSection";
import CfaAboutSection from "@/components/lp-cfa/CfaAboutSection";
import CfaWhatIsSection from "@/components/lp-cfa/CfaWhatIsSection";
import CfaWhyCfaSection from "@/components/lp-cfa/CfaWhyCfaSection";
import CfaSyllabusSection from "@/components/lp-cfa/CfaSyllabusSection";
import CfaMentorSection from "@/components/lp-cfa/CfaMentorSection";
import CfaWhyChooseSection from "@/components/lp-cfa/CfaWhyChooseSection";
import CfaIndustryMarqueeSection from "@/components/lp-cfa/CfaIndustryMarqueeSection";
import CfaTestimonialsSection from "@/components/lp-cfa/CfaTestimonialsSection";
import CfaFaqSection from "@/components/lp-cfa/CfaFaqSection";
import CfaContactSection from "@/components/lp-cfa/CfaContactSection";
import CfaFloatingContacts from "@/components/lp-cfa/CfaFloatingContacts";
import CfaScrollToTop from "@/components/lp-cfa/CfaScrollToTop";
import CfaLeadModal from "@/components/lp-cfa/CfaLeadModal";
import { CfaLeadModalProvider } from "@/contexts/CfaLeadModalContext";
import { getCourseSchema } from "@/lib/seo";

export default function LpCfaPage() {
  const courseSchema = getCourseSchema("cfa");

  return (
    <CfaLeadModalProvider>
      {courseSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
        />
      )}
      <CfaNavbar />
      <CfaHeroBanner />
      <CfaCounterSection />
      <CfaAboutSection />
      <CfaWhatIsSection />
      <CfaSyllabusSection />
      <CfaWhyCfaSection />
      <CfaMentorSection />
      <CfaWhyChooseSection />
      <CfaIndustryMarqueeSection />
      <CfaTestimonialsSection />
      <CfaFaqSection />
      <CfaContactSection />
      <CfaFooter />
      <CfaFloatingContacts />
      <CfaScrollToTop />
      <CfaLeadModal />
    </CfaLeadModalProvider>
  );
}
