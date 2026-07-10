"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { captureAdTrackingParams, getAdTrackingParams } from "@/lib/adTracking";
import { generateCaptchaCode, drawCaptcha } from "@/lib/captcha";
import { markLeadSubmitted } from "@/lib/leadThankYou";
import { companyInfo } from "@/lib/site-content";
import {
  cfaLeadFormSchema,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
  validateCfaLeadFormField,
  type CfaLeadFormField,
} from "@/lib/leadFormValidation";

const cardFoldShapes = [
  "polygon(0% 0%, 100% 0%, 100% 65%, 35% 100%, 0% 100%)",
  "polygon(0% 0%, 65% 0%, 100% 35%, 100% 100%, 0% 100%)",
  "polygon(0% 0%, 100% 0%, 100% 100%, 35% 100%, 0% 65%)",
];

function CfaCardRings() {
  const [shapeIndex, setShapeIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShapeIndex((prev) => (prev + 1) % cardFoldShapes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        animate={{ clipPath: cardFoldShapes[shapeIndex] }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
    </div>
  );
}

interface CfaLeadFormProps {
  mode: "modal" | "inline";
  isOpen?: boolean;
  onClose?: () => void;
  defaultCourse?: string;
  title?: string;
  /** Optional rich JSX override for the title — used in modal left panel and inline heading. */
  titleNode?: React.ReactNode;
  subtitle?: string;
  /** Identifies which form on the lp-cfa page this is, for the sheet log + notification email. */
  formName: "banner-form" | "inquery-form" | "contact-form";
}

const courseOptions = [
  "CMA US Program",
  "CFA Program",
  "Both Programs",
  "General Enquiry",
];
const timeOptions = [
  "Morning (10 AM - 1 PM)",
  "Afternoon (1 PM - 4 PM)",
  "Evening (4 PM - 7:30 PM)",
];

const themeClasses = {
  heading: "font-jakarta font-semibold text-white",
  field: "rounded-sm bg-white focus:ring-cfa-gold/30 focus:border-cfa-gold",
  submit: "rounded-sm !bg-cfa-gold !text-cfa-navy hover:!bg-cfa-goldLight",
  bg: "bg-cfa-navy",
  card: "rounded-2xl p-5 lg:p-8 shadow-2xl border-t-4 border-cfa-gold",
  title: "text-2xl mb-2",
  subtitle: "text-base mb-5",
  subtitleColor: "text-white/70",
  label: "text-sm mb-1.5",
  labelColor: "text-white/80",
  input: "px-4 py-2.5 text-sm",
  submitPad: "py-3.5 text-base",
  formGap: "space-y-4",
  modalPanelBg: "bg-cfa-navy",
  modalHeading: "font-jakarta font-semibold text-white",
  modalSubtitleColor: "text-white/70",
  modalAccent: "text-cfa-gold",
  modalAccentBg: "bg-cfa-gold/15",
};

const modalContactPoints = [
  {
    icon: Phone,
    label: "Call Us",
    value: companyInfo.phoneDisplay,
    href: companyInfo.phoneHref,
  },
  {
    icon: Mail,
    label: "Email Us",
    value: companyInfo.email,
    href: `mailto:${companyInfo.email}`,
  },
  {
    icon: MapPin,
    label: "Visit Us",
    value: companyInfo.location,
    href: companyInfo.mapUrl,
  },
];

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  captcha: "",
};

export default function CfaLeadForm({
  mode,
  isOpen,
  onClose,
  defaultCourse,
  title = "Talk to an Advisor",
  titleNode,
  subtitle = "Share your details and our team will guide you to the right program.",
  formName,
}: CfaLeadFormProps) {
  const router = useRouter();
  const t =
    mode === "modal"
      ? {
          ...themeClasses,
          labelColor: "text-gray-700",
          subtitleColor: "text-gray-500",
          label: "text-sm mb-2",
          input: "px-4 py-3.5 text-base",
          submitPad: "py-4 text-lg",
          formGap: "space-y-6",
        }
      : themeClasses;
  const [form, setForm] = useState({
    ...emptyForm,
    courseInterest: defaultCourse ?? courseOptions[0],
    preferredTime: timeOptions[0],
  });
  const [errors, setErrors] = useState<
    Partial<Record<CfaLeadFormField | "captcha", string>>
  >({});
  const [loading, setLoading] = useState(false);

  const [captchaCode, setCaptchaCode] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const latestCaptchaCode = useRef(captchaCode);
  latestCaptchaCode.current = captchaCode;

  // Callback ref: draws the captcha the instant the canvas mounts into the DOM.
  // This fixes the case where the modal opens for the first time — the canvas
  // doesn't exist yet when the captchaCode state is first set, so the plain
  // useEffect below misses it. Now drawing happens both on mount and on refresh.
  const setCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    canvasRef.current = el;
    if (el && latestCaptchaCode.current) {
      drawCaptcha(el, latestCaptchaCode.current);
    }
  }, []);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      courseInterest: defaultCourse ?? prev.courseInterest,
    }));
  }, [defaultCourse]);

  useEffect(() => {
    setCaptchaCode(generateCaptchaCode());
  }, []);

  useEffect(() => {
    captureAdTrackingParams();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Redraw when the code changes (e.g. after a refresh click)
  useEffect(() => {
    if (captchaCode && canvasRef.current) {
      drawCaptcha(canvasRef.current, captchaCode);
    }
  }, [captchaCode]);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message || undefined }));
  }, []);

  const refreshCaptcha = useCallback(
    (clearError = true) => {
      setCaptchaCode(generateCaptchaCode());
      setForm((prev) => ({ ...prev, captcha: "" }));
      if (clearError) {
        setFieldError("captcha", "");
      }
    },
    [setFieldError],
  );

  const validateAndSetError = (field: CfaLeadFormField, value: string) => {
    setFieldError(field, validateCfaLeadFormField(field, value));
  };

  const validateCaptchaOnBlur = () => {
    const value = form.captcha.trim();
    if (!value) {
      setFieldError("captcha", "Please enter the captcha");
    } else if (value.toUpperCase() !== captchaCode) {
      setFieldError("captcha", "Captcha does not match");
    } else {
      setFieldError("captcha", "");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeName(e.target.value);
    setForm((prev) => ({ ...prev, name: value }));
    if (errors.name) validateAndSetError("name", value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizePhone(e.target.value);
    setForm((prev) => ({ ...prev, phone: value }));
    if (errors.phone) validateAndSetError("phone", value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeEmail(e.target.value);
    setForm((prev) => ({ ...prev, email: value }));
    if (errors.email) validateAndSetError("email", value);
  };

  const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);
    setForm((prev) => ({ ...prev, captcha: value }));
    if (errors.captcha) setFieldError("captcha", "");
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    validateAndSetError(name as CfaLeadFormField, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = cfaLeadFormSchema.safeParse({
      name: form.name,
      phone: form.phone,
      email: form.email,
      courseInterest: form.courseInterest,
      preferredTime: form.preferredTime,
    });

    const nextErrors: Partial<Record<CfaLeadFormField | "captcha", string>> = {};
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0] as CfaLeadFormField;
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
    }

    const captchaValid = form.captcha.trim().toUpperCase() === captchaCode;
    if (!captchaValid) {
      nextErrors.captcha = "Captcha does not match. Please try again.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (!captchaValid) {
        refreshCaptcha(false);
      }
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const { captcha: _captcha, ...payload } = form;
      const adTracking = getAdTrackingParams();

      // lp-cfa forms: post to the dedicated Next.js route (same-origin, no CORS).
      // Email + sheet only — no DB save.
      const res = await fetch("/api/cfa-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formName,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          courseInterest: payload.courseInterest,
          preferredTime: payload.preferredTime,
          ...adTracking,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Submission failed");
      }

      markLeadSubmitted();
      router.push("/lp-cfa/thank-you");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldErrorClass = "mt-1.5 text-xs font-medium text-red-500";

  const formContent = (
    <form onSubmit={handleSubmit} noValidate className={t.formGap}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
          >
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleNameChange}
            onBlur={() => validateAndSetError("name", form.name)}
            placeholder="Your Name"
            aria-invalid={Boolean(errors.name)}
            className={`w-full border border-gray-200 focus:outline-none focus:ring-2 transition-colors ${t.field} ${t.input}`}
          />
          {errors.name && <p className={fieldErrorClass}>{errors.name}</p>}
        </div>
        <div>
          <label
            className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
          >
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handlePhoneChange}
            onBlur={() => validateAndSetError("phone", form.phone)}
            placeholder="Phone Number"
            inputMode="numeric"
            maxLength={10}
            aria-invalid={Boolean(errors.phone)}
            className={`w-full border border-gray-200 focus:outline-none focus:ring-2 transition-colors ${t.field} ${t.input}`}
          />
          {errors.phone && <p className={fieldErrorClass}>{errors.phone}</p>}
        </div>
      </div>

      <div>
        <label
          className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
        >
          Email <span className="text-red-500">*</span>
        </label>
        <input
          name="email"
          type="email"
          value={form.email}
          onChange={handleEmailChange}
          onBlur={() => validateAndSetError("email", form.email)}
          placeholder="Email Address"
          aria-invalid={Boolean(errors.email)}
          className={`w-full border border-gray-200 focus:outline-none focus:ring-2 transition-colors ${t.field} ${t.input}`}
        />
        {errors.email && <p className={fieldErrorClass}>{errors.email}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
          >
            Interested In <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="courseInterest"
              value={form.courseInterest}
              onChange={handleSelectChange}
              aria-invalid={Boolean(errors.courseInterest)}
              className={`w-full border border-gray-200 focus:outline-none focus:ring-2 appearance-none bg-white transition-colors ${t.field} ${t.input}`}
            >
              {courseOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.courseInterest && (
            <p className={fieldErrorClass}>{errors.courseInterest}</p>
          )}
        </div>
        <div>
          <label
            className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
          >
            Preferred Time <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              name="preferredTime"
              value={form.preferredTime}
              onChange={handleSelectChange}
              aria-invalid={Boolean(errors.preferredTime)}
              className={`w-full border border-gray-200 focus:outline-none focus:ring-2 appearance-none bg-white transition-colors ${t.field} ${t.input}`}
            >
              {timeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          {errors.preferredTime && (
            <p className={fieldErrorClass}>{errors.preferredTime}</p>
          )}
        </div>
      </div>

      <div>
        <label
          className={`block font-semibold uppercase tracking-wide ${t.labelColor} ${t.label}`}
        >
          Verify You&apos;re Human <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            name="captcha"
            value={form.captcha}
            onChange={handleCaptchaChange}
            onBlur={validateCaptchaOnBlur}
            placeholder="Enter code"
            maxLength={5}
            aria-invalid={Boolean(errors.captcha)}
            className={`min-w-0 flex-1 basis-full border border-gray-200 uppercase tracking-[0.3em] focus:outline-none focus:ring-2 transition-colors sm:basis-0 ${t.field} ${t.input}`}
          />
          <button
            type="button"
            onClick={() => refreshCaptcha()}
            aria-label="Refresh captcha"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <canvas
            ref={setCanvasRef}
            width={140}
            height={48}
            aria-hidden
            className="h-[48px] w-[140px] shrink-0 select-none rounded-sm border border-gray-200"
          />
        </div>
        {errors.captcha && <p className={fieldErrorClass}>{errors.captcha}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 ${t.submit} ${t.submitPad}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Sending...
          </>
        ) : (
          "Send Enquiry"
        )}
      </button>
    </form>
  );

  if (mode === "inline") {
    return (
      <div className={`relative overflow-hidden ${t.bg} ${t.card}`}>
        <CfaCardRings />
        <div className="relative z-10">
          <h3 className={`${t.title} ${t.heading}`}>{titleNode ?? title}</h3>
          <p className={`${t.subtitleColor} ${t.subtitle}`}>{subtitle}</p>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1 },
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          />

          <motion.div
            className="relative flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl lg:max-h-[90vh] lg:flex-row"
            variants={{
              hidden: { opacity: 0, scale: 0.94, y: 24 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white transition-colors hover:bg-black/40"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex-1 overflow-y-auto lg:flex lg:overflow-hidden">
              {/* Left panel — 40% width on desktop, full width on mobile */}
              <div
                className={`flex shrink-0 flex-col items-center gap-7 px-6 py-12 text-center lg:w-[40%] lg:justify-center lg:px-10 ${t.modalPanelBg}`}
              >
                <img
                  src="/api/site-assets/logo"
                  alt={companyInfo.name}
                  className="h-24 w-auto rounded-sm bg-white p-1.5 sm:h-28"
                />
                <div>
                  <h2 className={`text-2xl leading-snug ${t.modalHeading}`}>
                    {titleNode ?? title}
                  </h2>
                  <p className={`mt-2 text-base ${t.modalSubtitleColor}`}>
                    {subtitle}
                  </p>
                </div>

                <div className="hidden w-full flex-col gap-5 lg:flex">
                  {modalContactPoints.map(
                    ({ icon: Icon, label, value, href }) => (
                      <a
                        key={label}
                        href={href}
                        className="flex items-start gap-3 rounded-lg px-2 py-1 text-left transition-opacity hover:opacity-80"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.modalAccentBg}`}
                        >
                          <Icon className={`h-5 w-5 ${t.modalAccent}`} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs uppercase tracking-wide text-white/50">
                            {label}
                          </span>
                          <span className="block text-base font-medium text-white">
                            {value}
                          </span>
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>

              {/* Right panel — 60% width on desktop, scrolls independently */}
              <div className="flex-1 px-6 py-8 text-base lg:overflow-y-auto lg:px-12 lg:py-12">
                {formContent}

                <div className="mt-8 flex flex-col gap-5 border-t border-gray-100 pt-6 lg:hidden">
                  {modalContactPoints.map(
                    ({ icon: Icon, label, value, href }) => (
                      <a
                        key={label}
                        href={href}
                        className="flex items-center gap-3"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.modalAccentBg}`}
                        >
                          <Icon className={`h-5 w-5 ${t.modalAccent}`} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs uppercase tracking-wide text-gray-400">
                            {label}
                          </span>
                          <span className="block text-base font-medium text-gray-700">
                            {value}
                          </span>
                        </span>
                      </a>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
