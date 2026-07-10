"use client";

import { useEffect, useRef } from "react";
import api from "@/lib/axios";
import { notifyLeadSubmission } from "@/lib/leadNotification";

const PAYMENT_URL = "https://payments.cashfree.com/forms/finance-foundation-workshop";

interface FinanceWorkshopPageProps {
  markup: string;
  styles: string;
}

function createCaptchaSvg(code: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="145" height="48" viewBox="0 0 145 48">
      <rect width="145" height="48" rx="8" fill="#26304b"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="4">${code}</text>
    </svg>`,
  )}`;
}

function generateCaptchaCode() {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function clean(value: string | null | undefined) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function isValidFullName(value: string) {
  const name = clean(value);
  const parts = name.split(" ").filter(Boolean);

  if (name.length < 2 || name.length > 80 || parts.length < 2) {
    return false;
  }

  return /^[A-Za-z](?:[A-Za-z .'-]{0,78}[A-Za-z])$/.test(name) && !/[0-9]/.test(name);
}

function isValidEmail(value: string) {
  const email = clean(value).toLowerCase();
  const blockedDomains = new Set([
    "mailinator.com",
    "example.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
  ]);

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    return false;
  }

  const domain = email.split("@")[1] ?? "";
  return !blockedDomains.has(domain);
}

function isValidPhone(value: string) {
  const digits = clean(value).replace(/\D+/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function FinanceWorkshopPage({ markup, styles }: FinanceWorkshopPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];
    const header = root.querySelector<HTMLElement>(".site-header");
    const menuToggle = root.querySelector<HTMLButtonElement>(".menu-toggle");
    const mobileMenu = root.querySelector<HTMLElement>("#mobileMenu");
    const modal = root.querySelector<HTMLElement>("#inquiryModal");
    const countdown = root.querySelector<HTMLElement>("#countdown");
    const animatedItems = Array.from(root.querySelectorAll<HTMLElement>("[data-animate]"));
    const forms = Array.from(root.querySelectorAll<HTMLFormElement>("form[data-lead-form]"));
    let autoModalTimer: number | undefined;
    let lastInquiryTrigger: HTMLElement | null = null;

    const setHeaderState = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    const setMenu = (open: boolean) => {
      if (!menuToggle || !mobileMenu) return;

      menuToggle.classList.toggle("is-open", open);
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
      mobileMenu.classList.toggle("is-open", open);
      mobileMenu.setAttribute("aria-hidden", String(!open));
    };

    const openModal = (trigger?: HTMLElement | null) => {
      if (!modal) return;
      if (trigger) {
        lastInquiryTrigger = trigger;
      }
      window.clearTimeout(autoModalTimer);
      modal.hidden = false;
      modal.classList.add("is-open");
      document.body.classList.add("modal-locked");

      const firstField = modal.querySelector<HTMLElement>("input, select, button");
      firstField?.focus({ preventScroll: true });
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.hidden = true;
      document.body.classList.remove("modal-locked");

      if (lastInquiryTrigger && document.contains(lastInquiryTrigger)) {
        lastInquiryTrigger.focus({ preventScroll: true });
      }
    };

    const scrollToSection = (href: string) => {
      const target = root.querySelector<HTMLElement>(href);
      if (!target) return;

      setMenu(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const renderCaptcha = (form: HTMLFormElement) => {
      const image = form.querySelector<HTMLImageElement>(".capside");
      const input = form.querySelector<HTMLInputElement>('[name="captcha"]');
      if (!image) return;

      const code = generateCaptchaCode();
      image.dataset.captchaCode = code;
      image.src = createCaptchaSvg(code);
      image.setAttribute("title", "Click to refresh captcha");
      if (input) {
        input.value = "";
      }
    };

    const showFormAlert = (form: HTMLFormElement, message: string, type: "error" | "success") => {
      const alertBox = form.querySelector<HTMLElement>(".form-alert");
      if (!alertBox) return;

      alertBox.textContent = message;
      alertBox.classList.remove("is-error", "is-success");
      alertBox.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
    };

    const getSubmitControl = (form: HTMLFormElement) =>
      form.querySelector<HTMLElement>('button[type="submit"], input[type="submit"], a.btn.full-width');

    const getSubmitText = (control: HTMLElement | null) => {
      if (!control) return "";
      if (control instanceof HTMLInputElement) {
        return control.value;
      }
      return control.textContent ?? "";
    };

    const setSubmitText = (control: HTMLElement | null, text: string) => {
      if (!control) return;
      if (control instanceof HTMLInputElement) {
        control.value = text;
        return;
      }
      control.textContent = text;
    };

    const setSubmitting = (form: HTMLFormElement, isSubmitting: boolean) => {
      const control = getSubmitControl(form);
      if (!control) return;

      if (!control.dataset.defaultText) {
        control.dataset.defaultText = getSubmitText(control);
      }

      form.dataset.isSubmitting = isSubmitting ? "true" : "false";
      setSubmitText(control, isSubmitting ? "Please wait..." : control.dataset.defaultText);
      control.setAttribute("aria-disabled", String(isSubmitting));

      if (control instanceof HTMLButtonElement || control instanceof HTMLInputElement) {
        control.disabled = isSubmitting;
      } else {
        control.style.pointerEvents = isSubmitting ? "none" : "auto";
        control.style.opacity = isSubmitting ? "0.6" : "1";
      }
    };

    const validateForm = (form: HTMLFormElement) => {
      const name = form.querySelector<HTMLInputElement>('[name="name"]');
      const email = form.querySelector<HTMLInputElement>('[name="email"]');
      const phone = form.querySelector<HTMLInputElement>('[name="number"]');
      const subject = form.querySelector<HTMLSelectElement>('[name="subject"]');
      const message = form.querySelector<HTMLSelectElement>('[name="message"]');
      const consent = form.querySelector<HTMLInputElement>('[name="consent"]');
      const captcha = form.querySelector<HTMLInputElement>('[name="captcha"]');
      const captchaImage = form.querySelector<HTMLImageElement>(".capside");

      if (!name || !isValidFullName(name.value)) {
        return "Please enter a valid full name with at least two words.";
      }

      if (!phone || !isValidPhone(phone.value)) {
        return "Please enter a valid phone number.";
      }

      if (!email || !isValidEmail(email.value)) {
        return "Please enter a valid email address.";
      }

      if (subject && clean(subject.value) === "") {
        return "Please select a valid workshop mode.";
      }

      if (message && clean(message.value) === "") {
        return "Please select your current stage.";
      }

      if (consent && !consent.checked) {
        return "Please accept the contact consent.";
      }

      if (!captcha || clean(captcha.value) === "") {
        return "Please enter the captcha code.";
      }

      if (captchaImage?.dataset.captchaCode !== clean(captcha.value).toUpperCase()) {
        renderCaptcha(form);
        return "Invalid captcha. Please try again.";
      }

      return "";
    };

    const submitLead = async (form: HTMLFormElement) => {
      if (form.dataset.isSubmitting === "true") return;

      const validationMessage = validateForm(form);
      if (validationMessage) {
        showFormAlert(form, validationMessage, "error");
        return;
      }

      const name = clean(form.querySelector<HTMLInputElement>('[name="name"]')?.value);
      const email = clean(form.querySelector<HTMLInputElement>('[name="email"]')?.value);
      const phone = clean(form.querySelector<HTMLInputElement>('[name="number"]')?.value);
      const mode = clean(form.querySelector<HTMLSelectElement>('[name="subject"]')?.value);
      const stage = clean(form.querySelector<HTMLSelectElement>('[name="message"]')?.value);
      const formName = clean(form.querySelector<HTMLInputElement>('[name="form_name"]')?.value);

      setSubmitting(form, true);
      showFormAlert(form, "Saving your details and redirecting...", "success");

      try {
        await Promise.allSettled([
          api.post("/leads", {
            name,
            email,
            phone,
            courseInterest: formName || "Capital Lab Finance Workshop",
            preferredTime: mode,
            message: stage,
          }),
          notifyLeadSubmission({
            formName: formName || "capital-lab-finance-workshop",
            name,
            phone,
            email,
            courseInterest: formName || "Capital Lab Finance Workshop",
            preferredTime: mode,
            message: stage,
            skipSheet: true,
          }).catch((error) => {
            console.error("[lead-notify] Workshop notification failed", error);
            return null;
          }),
        ]);
      } catch {
        // Keep the conversion path unblocked even if the lead API has a temporary failure.
      } finally {
        window.location.href = PAYMENT_URL;
      }
    };

    forms.forEach((form) => {
      form.dataset.isSubmitting = "false";
      renderCaptcha(form);

      const onSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        void submitLead(form);
      };

      form.addEventListener("submit", onSubmit);
      cleanupFns.push(() => form.removeEventListener("submit", onSubmit));
    });

    const handleRootClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && href !== "#") {
          event.preventDefault();
          scrollToSection(href);
          return;
        }
      }

      const menuButton = target.closest<HTMLButtonElement>(".menu-toggle");
      if (menuButton) {
        event.preventDefault();
        setMenu(!menuButton.classList.contains("is-open"));
        return;
      }

      const openInquiry = target.closest<HTMLElement>("[data-open-inquiry]");
      if (openInquiry) {
        event.preventDefault();
        openModal(openInquiry);
        return;
      }

      const closeInquiry = target.closest<HTMLElement>("[data-close-inquiry]");
      if (closeInquiry) {
        event.preventDefault();
        closeModal();
        return;
      }

      if (modal && target === modal) {
        closeModal();
        return;
      }

      const captchaImage = target.closest<HTMLImageElement>(".capside");
      if (captchaImage) {
        const form = captchaImage.closest<HTMLFormElement>("form[data-lead-form]");
        if (form) {
          event.preventDefault();
          renderCaptcha(form);
        }
        return;
      }

      const leadAnchor = target.closest<HTMLAnchorElement>("form[data-lead-form] a.btn.full-width");
      if (leadAnchor) {
        const form = leadAnchor.closest<HTMLFormElement>("form[data-lead-form]");
        if (form) {
          event.preventDefault();
          void submitLead(form);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        closeModal();
      }
    };

    const updateCountdown = () => {
      if (!countdown) return;

      const startDate = new Date("2026-07-04T00:00:00+05:30").getTime();
      const diff = startDate - Date.now();

      if (diff <= 0) {
        countdown.textContent = "registration closing soon";
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      countdown.textContent = `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
    };

    root.addEventListener("click", handleRootClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", setHeaderState, { passive: true });
    const countdownTimer = window.setInterval(updateCountdown, 1000);

    cleanupFns.push(() => root.removeEventListener("click", handleRootClick));
    cleanupFns.push(() => document.removeEventListener("keydown", handleKeyDown));
    cleanupFns.push(() => window.removeEventListener("scroll", setHeaderState));
    cleanupFns.push(() => window.clearInterval(countdownTimer));

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.14 },
      );

      animatedItems.forEach((item) => observer.observe(item));
      cleanupFns.push(() => observer.disconnect());
    } else {
      animatedItems.forEach((item) => item.classList.add("is-visible"));
    }

    setHeaderState();
    updateCountdown();
    autoModalTimer = window.setTimeout(() => openModal(null), 15000);
    cleanupFns.push(() => window.clearTimeout(autoModalTimer));

    return () => {
      cleanupFns.forEach((fn) => fn());
      document.body.classList.remove("modal-locked");
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
