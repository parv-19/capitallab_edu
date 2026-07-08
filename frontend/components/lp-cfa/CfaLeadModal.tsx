"use client";

import { motion } from "framer-motion";
import CfaLeadForm from "@/components/lp-cfa/CfaLeadForm";
import { useCfaLeadModal } from "@/contexts/CfaLeadModalContext";

function PencilUnderline() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      aria-hidden
      className="pointer-events-none absolute -bottom-2 left-0 h-3 w-full overflow-visible"
    >
      <motion.path
        d="M2 14 C 40 4, 80 18, 120 8 C 150 2, 175 14, 198 6"
        fill="none"
        stroke="#C9A84C"
        strokeWidth="6"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut", delay: 0.3 }}
      />
    </svg>
  );
}

const titleNode = (
  <span className="font-jakarta">
    Get Free{" "}
    <span className="relative inline-block whitespace-nowrap text-cfa-gold">
      CFA Counselling
      <PencilUnderline />
    </span>
  </span>
);

export default function CfaLeadModal() {
  const { isOpen, closeModal } = useCfaLeadModal();

  return (
    <CfaLeadForm
      mode="modal"
      isOpen={isOpen}
      onClose={closeModal}
      defaultCourse="CFA Program"
      title="Get Free CFA Counselling"
      titleNode={titleNode}
      subtitle="Share your details and our mentor will call you within 24 hours."
      formName="inquery-form"
    />
  );
}
