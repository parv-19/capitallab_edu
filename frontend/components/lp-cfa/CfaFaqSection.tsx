"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

const faqs = [
  {
    question: "Who is the CFA program designed for?",
    answer:
      "The CFA program suits students and working professionals aiming for careers in equity research, portfolio management, valuation, and investment banking. No prior finance degree is mandatory, though a basic grasp of numbers helps.",
  },
  {
    question:
      "How long does it take to complete the CFA program with Capital Lab?",
    answer:
      "Each level is typically prepared over 5-7 months of structured coaching, combining live sessions, practice questions, and mock exams. Total time to charter varies by how many levels you take per year.",
  },
  {
    question: "Do I need a finance background to enroll?",
    answer:
      "No. We start from the fundamentals and build up to advanced concepts. Many of our successful candidates come from engineering, commerce, and other non-finance backgrounds.",
  },
  {
    question: "What kind of support do I get during preparation?",
    answer:
      "Small batch sizes, doubt-resolution sessions, structured notes, practice question banks, and direct mentor access via WhatsApp and scheduled calls throughout your preparation.",
  },
  {
    question: "Is placement or career assistance provided?",
    answer:
      "Yes. Beyond exam coaching, we guide students on resume building, interview preparation, and connect them with our alumni network working across equity research, credit analysis, and portfolio management roles.",
  },
];

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-jakarta text-lg md:text-xl font-semibold text-cfa-navy">
          {question}
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cfa-gold/10">
          <motion.span
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="h-6 w-6 text-cfa-gold" />
          </motion.span>
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 leading-relaxed text-gray-600 text-base md:text-lg">
            {answer}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CfaFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="cfa-faq" className="bg-cfa-cream py-20 md:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-4xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Frequently Asked Questions
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            Got Questions? We&apos;ve Got{" "}
            <span className="text-cfa-gold">Answers</span>
          </h2>
        </motion.div>

        <div className="mx-auto max-w-6xl space-y-4">
          {faqs.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          className="mt-14 flex justify-center"
        >
          <CfaCtaButton action="modal" size="lg">
            Still Have Questions? Inquire Now
          </CfaCtaButton>
        </motion.div>
      </div>
    </section>
  );
}
