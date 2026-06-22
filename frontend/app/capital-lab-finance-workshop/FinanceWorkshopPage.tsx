"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BadgeIndianRupee,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Globe,
  GraduationCap,
  LineChart,
  Mail,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

const PAYMENT_URL = "https://payments.cashfree.com/forms/finance-foundation-workshop";
const WORKSHOP_DATE = new Date("2026-07-04T09:00:00+05:30");

const outcomes = [
  {
    title: "A Clear Understanding of Finance Careers",
    description:
      "Explore Financial Analysis, Investment Banking, Equity Research, Wealth Management, CFA, and US CMA to understand which path fits your goals.",
  },
  {
    title: "The Foundations of Smart Money Management",
    description:
      "Learn the principles behind saving, budgeting, and growing money with practical clarity from the start.",
  },
  {
    title: "Confidence to Understand Financial Markets",
    description:
      "Move past jargon and understand how stocks, mutual funds, and financial markets actually work.",
  },
  {
    title: "The Ability to Analyze Businesses",
    description:
      "See how finance professionals evaluate companies through statements, profitability, and core performance indicators.",
  },
  {
    title: "A Roadmap for Your Finance Journey",
    description:
      "Understand the next steps, skills, and certifications that can shape a long-term career in finance.",
  },
  {
    title: "Live Q&A and Career Guidance",
    description:
      "Get direct guidance on finance careers, CFA, US CMA, higher studies, and industry opportunities.",
  },
];

const audience = [
  {
    title: "Commerce Students",
    description:
      "Best for 12th, B.Com, and BBA students who want a strong first layer in finance before professional specialization.",
    icon: GraduationCap,
  },
  {
    title: "CFA and US CMA Aspirants",
    description:
      "Useful for learners who want better comfort with finance concepts used across investing, reporting, and analysis.",
    icon: LineChart,
  },
  {
    title: "MBA Finance Students",
    description:
      "A practical bridge between classroom theory and the way financial analysis is discussed in real work settings.",
    icon: Building2,
  },
  {
    title: "Young Professionals and Enthusiasts",
    description:
      "Ideal for anyone who wants stronger money management and early investing decision-making skills.",
    icon: BriefcaseBusiness,
  },
];

const curriculum = [
  {
    label: "Module 01",
    title: "Personal Finance and Budgeting",
    description:
      "Budgeting, saving strategies, emergency funds, and goal setting that make money management feel practical and usable.",
  },
  {
    label: "Module 02",
    title: "Stock Market Basics",
    description:
      "How NSE, BSE, indices, and investor participation work, without the usual confusion.",
  },
  {
    label: "Module 03",
    title: "Mutual Funds and Investing",
    description:
      "SIPs, compounding, risk management, and long-term wealth building for beginners.",
  },
  {
    label: "Module 04",
    title: "Financial Statement Analysis",
    description:
      "Read the balance sheet, profit and loss statement, and cash flow statement with a practical lens.",
  },
];

const benefits = [
  "Certificate of participation",
  "Scholarship opportunities up to 50%",
  "Career guidance for CFA, US CMA, and MBA Finance",
  "Online and offline access options",
];

const faqs = [
  {
    question: "Who can attend this workshop?",
    answer:
      "Students, graduates, finance enthusiasts, CFA aspirants, US CMA aspirants, and young professionals can all attend.",
  },
  {
    question: "Do I need prior finance knowledge?",
    answer:
      "No. The workshop is beginner-friendly and designed to build foundational knowledge from the ground up.",
  },
  {
    question: "Is the workshop online or offline?",
    answer:
      "Both. It is available live online across India and offline at Capital Lab Education in Sola, Ahmedabad.",
  },
  {
    question: "Will I receive a certificate?",
    answer: "Yes. Every participant receives a Certificate of Participation.",
  },
  {
    question: "Is this a CFA or US CMA coaching batch?",
    answer:
      "No. This is a finance foundation workshop designed to build practical clarity and help you understand future finance pathways.",
  },
];

function formatCountdown(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return "Starting now";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

export default function FinanceWorkshopPage() {
  const [countdown, setCountdown] = useState(() => formatCountdown(WORKSHOP_DATE));
  const [menuOpen, setMenuOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    preferredMode: "",
    currentStage: "",
    consent: false,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(formatCountdown(WORKSHOP_DATE));
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (menuOpen || inquiryOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [inquiryOpen, menuOpen]);

  const updateField = (name: string, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const phoneDigits = form.phone.replace(/\D/g, "");

    if (form.name.trim().split(/\s+/).length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (!form.preferredMode || !form.currentStage || !form.consent) {
      toast.error("Please complete the required fields.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/leads", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        courseInterest: "Capital Lab Finance Workshop",
        preferredTime: form.preferredMode,
        message: `Current stage: ${form.currentStage}. Source: Capital Lab Finance Workshop page.`,
      });
      toast.success("Details saved. Redirecting to registration.");
    } catch {
      toast.error("We couldn't save your details, but we'll still take you to registration.");
    } finally {
      window.location.href = PAYMENT_URL;
    }
  };

  const renderLeadForm = (compact = false) => (
    <form className={compact ? "space-y-4" : "mt-6 space-y-4"} onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Full Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="Your full name"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            placeholder="+91"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Email Address</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">Preferred Mode</label>
          <select
            value={form.preferredMode}
            onChange={(event) => updateField("preferredMode", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
            required
          >
            <option value="">Choose one</option>
            <option value="Live Online">Live Online</option>
            <option value="Offline Ahmedabad">Offline Ahmedabad</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-700">I am currently a</label>
          <select
            value={form.currentStage}
            onChange={(event) => updateField("currentStage", event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
            required
          >
            <option value="">Select your stage</option>
            <option value="Commerce Student">Commerce Student</option>
            <option value="CFA / US CMA Aspirant">CFA / US CMA Aspirant</option>
            <option value="MBA Finance Student">MBA Finance Student</option>
            <option value="Young Professional">Young Professional</option>
            <option value="Finance Enthusiast">Finance Enthusiast</option>
          </select>
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(event) => updateField("consent", event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700"
          required
        />
        <span>I agree to be contacted about this workshop and understand I&apos;ll be redirected to payment after submission.</span>
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0f766e] px-6 py-3 text-base font-bold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? "Redirecting..." : "Reserve My Seat"}
        <ChevronRight className="h-4 w-4" />
      </button>

      <p className="text-sm text-slate-500">Limited seats. Workshop details will be shared after registration.</p>
    </form>
  );

  return (
    <div className="bg-[#f7f1e3] text-slate-900">
      <a
        href="#main-content"
        className="absolute left-4 top-4 z-[70] -translate-y-20 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.26),_transparent_28%),linear-gradient(135deg,_#082f49_0%,_#0f3f62_35%,_#14532d_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.08),transparent_30%,rgba(255,255,255,0.04)_60%,transparent_100%)]" />
        <div className="absolute -left-20 top-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto flex w-[min(1220px,calc(100%-1.5rem))] flex-col">
          <header className="flex items-center justify-between border-b border-white/10 py-5">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/LOGO.PNG" alt="Capital Lab Education" width={48} height={48} className="rounded-lg bg-white p-1" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-200">Capital Lab</div>
                <div className="text-base font-bold text-white">Finance Workshop</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-5 text-sm text-white/80 md:flex">
              <a href="#outcomes" className="transition hover:text-white">Outcomes</a>
              <a href="#curriculum" className="transition hover:text-white">Curriculum</a>
              <a href="#mentor" className="transition hover:text-white">Mentor</a>
              <button
                type="button"
                onClick={() => setInquiryOpen(true)}
                className="transition hover:text-white"
              >
                Inquiry
              </button>
              <a href="#register" className="rounded-full border border-amber-300/60 px-4 py-2 font-semibold text-amber-100 transition hover:bg-amber-300/10">
                Reserve Seat
              </a>
            </nav>

            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </header>

          {menuOpen && (
            <div className="border-b border-white/10 py-4 md:hidden">
              <nav className="flex flex-col gap-2 text-sm text-white/85">
                <a href="#outcomes" onClick={() => setMenuOpen(false)} className="rounded-2xl bg-white/10 px-4 py-3">Outcomes</a>
                <a href="#curriculum" onClick={() => setMenuOpen(false)} className="rounded-2xl bg-white/10 px-4 py-3">Curriculum</a>
                <a href="#mentor" onClick={() => setMenuOpen(false)} className="rounded-2xl bg-white/10 px-4 py-3">Mentor</a>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setInquiryOpen(true);
                  }}
                  className="rounded-2xl bg-white/10 px-4 py-3 text-left"
                >
                  Inquiry
                </button>
                <a href="#register" onClick={() => setMenuOpen(false)} className="rounded-2xl border border-amber-300/60 px-4 py-3 font-semibold text-amber-100">
                  Reserve Seat
                </a>
              </nav>
            </div>
          )}

          <div id="main-content" className="grid gap-12 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-amber-200/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-100">
                2-Day Live Workshop
              </span>
              <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Finance Foundation Workshop for students, aspirants, and future finance professionals.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100/88">
                Learn the fundamentals of finance, investing, stock markets, and financial analysis through a practical workshop designed to replace confusion with clarity.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3 text-sm font-medium text-amber-100">
                    <CalendarDays className="h-5 w-5" />
                    4th and 5th July 2026
                  </div>
                  <p className="mt-2 text-sm text-white/80">Weekend format with practical sessions and live Q&A.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center gap-3 text-sm font-medium text-amber-100">
                    <Globe className="h-5 w-5" />
                    Live online across India
                  </div>
                  <p className="mt-2 text-sm text-white/80">Also available offline at Capital Lab Education, Sola, Ahmedabad.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href={PAYMENT_URL}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-base font-bold text-slate-950 transition hover:bg-amber-200"
                >
                  Register Now @ Rs.199
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#curriculum"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  See Curriculum
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/85">
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  Beginner-friendly
                </span>
                <span className="inline-flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-300" />
                  Certificate included
                </span>
                <span className="inline-flex items-center gap-2">
                  <BadgeIndianRupee className="h-4 w-4 text-emerald-300" />
                  Practical and career-oriented
                </span>
              </div>
            </div>

            <aside
              id="register"
              className="rounded-[2rem] border border-white/15 bg-white p-6 text-slate-900 shadow-[0_24px_80px_rgba(8,47,73,0.28)] sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Reserve your seat</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-950">Start your finance journey</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Fill your details and we&apos;ll take you to the secure payment page.
                  </p>
                </div>
                <div className="rounded-2xl bg-[#ecfdf5] px-4 py-3 text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Starts in</div>
                  <div className="mt-1 text-lg font-extrabold text-emerald-950">{countdown}</div>
                </div>
              </div>

              {renderLeadForm()}
            </aside>
          </div>
        </div>
      </section>

      <section id="outcomes" className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">What you&apos;ll walk away with</p>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
            Knowledge, confidence, and clarity to begin in finance.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            The workshop is built to turn big finance topics into practical first steps.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {outcomes.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[1.75rem] border border-[#eadfc9] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ecfdf5] text-sm font-bold text-[#0f766e]">
                {(index + 1).toString().padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8dbc0] bg-[#fffaf0]">
        <div className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Who should attend?</p>
              <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
                Designed for future finance professionals.
              </h2>
            </div>
            <p className="text-lg leading-8 text-slate-600">
              Ideal for learners who want a practical first layer before deeper certifications, markets, or career decisions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {audience.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[1.75rem] bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                  <div className="inline-flex rounded-2xl bg-[#0f766e] p-3 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="curriculum" className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 sm:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">What you&apos;ll learn</p>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-950 sm:text-4xl">
            A practical introduction to the world of finance.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            The curriculum moves from personal money habits to markets and business analysis in a simple, structured flow.
          </p>
        </div>

        <div className="mt-10 space-y-5">
          {curriculum.map((item) => (
            <article
              key={item.title}
              className="grid gap-4 rounded-[1.75rem] border border-[#e5dcc6] bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.05)] sm:grid-cols-[180px_1fr]"
            >
              <div>
                <span className="inline-flex rounded-full bg-[#ecfdf5] px-4 py-2 text-xs font-bold uppercase tracking-[0.26em] text-[#0f766e]">
                  {item.label}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="mentor" className="bg-[#0f172a] text-white">
        <div className="mx-auto grid w-[min(1180px,calc(100%-1.5rem))] gap-10 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-200">Meet your mentor</p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Learn from someone who&apos;s done it.</h2>
            <h3 className="mt-6 text-2xl font-bold text-amber-200">Harsh Trivedi</h3>
            <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-slate-300">
              Finance Professional and Lead Instructor - Capital Lab Education
            </p>
            <p className="mt-6 text-base leading-8 text-slate-300">
              With more than 10 years of hands-on experience in financial services, Harsh brings practical depth from equity valuation, real estate valuation, credit analysis, and financial analysis into every session.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Having progressed through the CFA journey himself, he understands the questions students face and explains complex topics with structure, clarity, and real-world context.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["CFA Level II", "MBA", "PGDM", "B.Com"].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100">
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Years of expertise", value: "10+" },
                { label: "Students trained", value: "500+" },
                { label: "Student satisfaction", value: "95%" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-3xl font-extrabold text-white">{item.value}</div>
                  <div className="mt-2 text-sm text-slate-300">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto max-w-md">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-amber-300/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-4">
              <Image
                src="/instructur_harsh_new.jpeg"
                alt="Harsh Trivedi, lead instructor at Capital Lab Education"
                width={800}
                height={1000}
                className="h-auto w-full rounded-[2rem] object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(1180px,calc(100%-1.5rem))] py-16 sm:py-20">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[#0f766e] p-8 text-white shadow-[0_24px_80px_rgba(15,118,110,0.25)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-100">Workshop benefits</p>
            <h2 className="mt-4 text-3xl font-extrabold">What you&apos;ll receive</h2>
            <p className="mt-4 text-base leading-8 text-emerald-50/90">
              A compact workshop that helps learners move from curiosity to confident next steps.
            </p>

            <div className="mt-8 space-y-4">
              {benefits.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/10 px-4 py-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-amber-200" />
                  <span className="text-sm leading-7 text-white/92">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e5dcc6] bg-white p-8 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">FAQ</p>
            <h2 className="mt-4 text-3xl font-extrabold text-slate-950">Frequently asked questions</h2>

            <div className="mt-8 space-y-4">
              {faqs.map((item, index) => (
                <details
                  key={item.question}
                  open={index === 0}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
                >
                  <summary className="cursor-pointer list-none text-base font-bold text-slate-900">
                    {item.question}
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#e5dcc6] bg-[#fffaf0]">
        <div className="mx-auto flex w-[min(1180px,calc(100%-1.5rem))] flex-col gap-6 py-14 text-center sm:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Still thinking about it?</p>
          <h2 className="mx-auto max-w-4xl text-3xl font-extrabold text-slate-950 sm:text-4xl">
            Build the knowledge, skills, and confidence needed to succeed in finance.
          </h2>
          <p className="text-base text-slate-600">
            4th and 5th July 2026 | Live Online + Offline Ahmedabad | Certificate Included
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={PAYMENT_URL}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-base font-bold text-white transition hover:bg-slate-800"
            >
              Register Now
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="tel:+916355258396"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-500"
            >
              <MapPin className="h-4 w-4" />
              Call for details
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#10253c] text-white">
        <div className="mx-auto flex w-[min(1180px,calc(100%-1.5rem))] flex-col gap-8 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Image src="/LOGO.PNG" alt="Capital Lab Education" width={56} height={56} className="rounded-xl bg-white p-1" />
            <div>
              <div className="text-lg font-bold">Capital Lab Education</div>
              <p className="mt-1 text-sm text-slate-300">
                Finance-focused training for students, aspirants, and future industry leaders.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-sm text-slate-200">
            <a href="tel:+916355258396" className="inline-flex items-center gap-2 transition hover:text-white">
              <Phone className="h-4 w-4" />
              +91 63552 58396
            </a>
            <a href="mailto:info@capitallabedu.com" className="inline-flex items-center gap-2 transition hover:text-white">
              <Mail className="h-4 w-4" />
              info@capitallabedu.com
            </a>
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sola, Ahmedabad
            </span>
          </div>
        </div>
      </footer>

      {inquiryOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setInquiryOpen(false)}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            aria-label="Close inquiry dialog"
          />
          <div className="relative z-10 w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#0f766e]">Inquiry now</p>
                <h3 className="mt-2 text-2xl font-extrabold text-slate-950">Reserve your workshop seat</h3>
                <p className="mt-2 text-sm text-slate-600">
                  This modal mirrors the inquiry entry from the PHP bundle while keeping the working Next.js lead flow.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInquiryOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
                aria-label="Close inquiry dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6">{renderLeadForm(true)}</div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setInquiryOpen(true)}
        className="fixed right-0 top-1/2 z-[60] hidden -translate-y-1/2 rounded-l-2xl bg-[#0f766e] px-4 py-4 text-left text-sm font-bold text-white shadow-[0_20px_60px_rgba(15,118,110,0.35)] lg:inline-flex"
      >
        Inquiry Now
      </button>

      <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-white/15 bg-[#0f172a]/95 backdrop-blur">
        <div className="mx-auto flex w-[min(1180px,calc(100%-1rem))] items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Workshop starts in</div>
            <div className="truncate text-sm font-bold text-white sm:text-base">{countdown}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInquiryOpen(true)}
              className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 sm:inline-flex"
            >
              Inquiry
            </button>
            <a
              href={PAYMENT_URL}
              className="inline-flex items-center gap-2 rounded-full bg-[#0f766e] px-4 py-2 text-sm font-bold text-white shadow-[0_20px_60px_rgba(15,118,110,0.35)]"
            >
              Register @ Rs.199
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
