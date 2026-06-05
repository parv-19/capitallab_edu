"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useAuth } from "@/contexts/AuthContext";
import { companyInfo } from "@/lib/site-content";
import type { Testimonial } from "@/types";
import FloatingReviewWidget from "@/components/testimonials/FloatingReviewWidget";

type MarketingTestimonial = Pick<Testimonial, "studentName" | "review" | "designation"> & {
  rating?: number;
};

const fallbackTestimonials: MarketingTestimonial[] = [
  {
    studentName: "Moksh",
    designation: "Capital Lab Education Student",
    rating: 5,
    review:
      "Your teaching method was great. The lecture were fun and also very helpful in remembering the concept. There was no boredom in your lecture and there was a personal connection which all the students studying with you felt in the class. You were more than a teacher. A friend and a mentor.",
  },
  {
    studentName: "Dhriti Pandey",
    designation: "Capital Lab Education Student",
    rating: 5,
    review:
      "I wanted to express how much I've enjoyed being in your class. Your teaching has been truly great Sir. I always felt comfortable asking questions and you explained everything so clearly, specially with those helpful examples and Excel sheets which really boosted my understanding of the topics. I appreciate how you made the classroom such a welcoming space for learning and discussion. Thank you for creating such a positive learning environment.",
  },
  {
    studentName: "Tamanna",
    designation: "US CMA Student",
    rating: 5,
    review:
      "I am extremely satisfied with the depth of knowledge and exceptional teaching style. The way of explaining concepts is very clear and accurate, which makes even difficult topics easy to understand. I really appreciate the efforts put into each session and guidance in my US CMA preparation.",
  },
  {
    studentName: "Poorva",
    designation: "Capital Lab Education Student",
    rating: 5,
    review:
      "Your teaching method was really really great and helpful. Helped a lot in clearing certain concepts, was able to understand it all very easily. You created a very positive and comfortable learning environment. Truly a great experience!",
  },
  {
    studentName: "Mudrika",
    designation: "Capital Lab Education Student",
    rating: 5,
    review:
      "It was great learning with you. You made stuff easy to understand for everybody. Your fun and friendly energy made finance feel easy. A really wonderful mentor and tutor!",
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getClosestInterest(label: string | null) {
  if (!label) return "General Enquiry";
  const text = label.toLowerCase();
  if (text.includes("cma")) return "CMA US Program";
  if (text.includes("cfa")) return "CFA Program";
  if (text.includes("both")) return "Both Programs";
  return "General Enquiry";
}

function validatePhone(phone: string) {
  return /^\d{10}$/.test(phone);
}

function shouldOpenWhatsapp(label: string) {
  const normalizedLabel = label.trim().toLowerCase();
  return (
    normalizedLabel === "talk to an advisor" ||
    normalizedLabel === "talk to advisor" ||
    normalizedLabel === "talk to instructor" ||
    normalizedLabel === "talk to counsellor" ||
    normalizedLabel === "talk to counselor"
  );
}

function normalizeLabel(label: string | null | undefined) {
  return (label ?? "").trim().toLowerCase();
}

function getCourseContext(element: HTMLElement | null) {
  const section = element?.closest<HTMLElement>("#cfa-program, #cma-program");
  if (section?.id === "cfa-program") {
    return {
      leadCourse: "CFA — Chartered Financial Analyst",
      interest: "CFA Program",
      whatsappText: "Hi, I want to inquire about the CFA program at Capital Lab Education.",
    };
  }
  if (section?.id === "cma-program") {
    return {
      leadCourse: "US CMA — Certified Management Accountant",
      interest: "CMA US Program",
      whatsappText: "Hi, I want to inquire about the US CMA program at Capital Lab Education.",
    };
  }
  return {
    leadCourse: "Help me decide",
    interest: "General Enquiry",
    whatsappText: "Hi, I want to inquire about your programs at Capital Lab Education.",
  };
}

function buildWhatsappHref(message: string) {
  const base = new URL(companyInfo.whatsappHref);
  base.searchParams.set("text", message);
  return base.toString();
}

interface ApprovedLandingPageProps {
  styles: string;
  markup: string;
  testimonials?: MarketingTestimonial[];
}

export default function ApprovedLandingPage({ styles, markup, testimonials = fallbackTestimonials }: ApprovedLandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];
    const hamburger = root.querySelector<HTMLElement>("#hamburger");
    const mobileNav = root.querySelector<HTMLElement>("#mobileNav");
    const mobileNavClose = root.querySelector<HTMLButtonElement>("#mobileNavClose");
    const popupOverlay = root.querySelector<HTMLElement>("#contactPopup");
    const popupClose = root.querySelector<HTMLElement>("#popupClose");
    const popupSkip = root.querySelector<HTMLElement>("#popupSkip");
    const popupSelect = popupOverlay?.querySelector<HTMLSelectElement>("select");
    const authLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-auth-link]"));

    const setBodyScrollLock = (locked: boolean) => {
      document.documentElement.style.overflowX = "hidden";
      document.body.style.overflowX = "hidden";
      document.documentElement.style.overflowY = locked ? "hidden" : "auto";
      document.body.style.overflowY = locked ? "hidden" : "auto";
    };

    const closeMobileNav = () => {
      hamburger?.classList.remove("open");
      mobileNav?.classList.remove("open");
      hamburger?.setAttribute("aria-expanded", "false");
      mobileNav?.setAttribute("aria-hidden", "true");
      if (!popupOverlay?.classList.contains("active")) {
        setBodyScrollLock(false);
      }
    };

    const openPopup = (interest = "General Enquiry") => {
      if (!popupOverlay || mobileNav?.classList.contains("open")) return;
      popupOverlay.classList.add("active");
      if (popupSelect) {
        popupSelect.value = interest;
      }
      setBodyScrollLock(true);
    };

    const closePopup = () => {
      popupOverlay?.classList.remove("active");
      if (!mobileNav?.classList.contains("open")) {
        setBodyScrollLock(false);
      }
    };

    const syncAuthLinks = () => {
      const href = isAuthenticated ? user?.role === "admin" ? "/admin" : "/student" : "/login";
      const label = isAuthenticated ? "Dashboard" : "Login";
      authLinks.forEach((link) => {
        link.href = href ?? "/login";
        link.textContent = label;
      });
    };

    syncAuthLinks();

    const toggleMobileNav = () => {
      if (!hamburger || !mobileNav) return;
      const isOpen = mobileNav.classList.toggle("open");
      hamburger.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      mobileNav.setAttribute("aria-hidden", isOpen ? "false" : "true");
      setBodyScrollLock(isOpen || Boolean(popupOverlay?.classList.contains("active")));
    };

    if (hamburger) {
      const handleHamburgerClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleMobileNav();
      };
      hamburger.addEventListener("pointerdown", handleHamburgerClick);
      hamburger.addEventListener("click", handleHamburgerClick);
      cleanupFns.push(() => hamburger.removeEventListener("pointerdown", handleHamburgerClick));
      cleanupFns.push(() => hamburger.removeEventListener("click", handleHamburgerClick));
    }

    if (mobileNavClose) {
      const handleMobileNavClose = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        closeMobileNav();
      };
      mobileNavClose.addEventListener("pointerdown", handleMobileNavClose);
      mobileNavClose.addEventListener("click", handleMobileNavClose);
      cleanupFns.push(() => mobileNavClose.removeEventListener("pointerdown", handleMobileNavClose));
      cleanupFns.push(() => mobileNavClose.removeEventListener("click", handleMobileNavClose));
    }

    const aboutSection = root.querySelector("#about-us");
    if (aboutSection) {
      const introBody = aboutSection.querySelector(".section-body");
      introBody?.remove();

      const cards = aboutSection.querySelectorAll(".about-pillar");
      if (cards[0]) {
        const title = cards[0].querySelector(".pillar-title");
        const text = cards[0].querySelector(".pillar-text");
        if (title) title.textContent = "About Us";
        if (text) {
          text.textContent =
            "At Capital Lab Education, we believe that mastering the complexities of the global financial markets requires more than just memorizing formulas. It requires a shift in perspective. Founded by industry experts, our mission is to provide aspiring professionals with the technical depth, ethical foundation, and analytical rigor necessary to excel in the most demanding financial environments.";
        }
      }
      if (cards[1]) {
        const title = cards[1].querySelector(".pillar-title");
        const text = cards[1].querySelector(".pillar-text");
        if (title) title.textContent = "Our Vision";
        if (text) {
          text.textContent =
            "To be the catalyst for career transformation in the financial sector. We aim to bridge the gap between academic theory and real-world application, ensuring our students do not just pass exams, but become visionary leaders in investment management.";
        }
      }
      if (cards[2]) {
        const title = cards[2].querySelector(".pillar-title");
        const text = cards[2].querySelector(".pillar-text");
        if (title) title.textContent = "Our Commitment to Your Success";
        if (text) {
          text.textContent =
            "Whether you are navigating the rigorous path of the CFA Program or looking to sharpen your valuation skills, Capital Lab Education is your partner in professional growth. We provide the structure, the clarity, and the new vision you need to unlock your full potential in the world of finance.";
        }
      }
      cards[3]?.remove();
    }

    const cfaCard = root.querySelector(".programs-grid .program-card:last-child");
    const cfaHighlights = cfaCard?.querySelectorAll(".program-highlights li");
    if (cfaHighlights?.[1]) {
      cfaHighlights[1].textContent =
        "Strong path into banking, research, portfolio, and corporate finance";
    }

    const testimonialsTrack = root.querySelector<HTMLElement>("#testimonialsTrack");
    const testimonialPrev = root.querySelector<HTMLButtonElement>("#testimonialPrev");
    const testimonialNext = root.querySelector<HTMLButtonElement>("#testimonialNext");
    const testimonialDots = root.querySelector<HTMLElement>("#testimonialDots");
    const testimonialsCarousel = root.querySelector<HTMLElement>("#testimonialsCarousel");

    if (testimonialsTrack && testimonialPrev && testimonialNext && testimonialDots && testimonialsCarousel) {
      testimonialsTrack.innerHTML = testimonials
        .map(
          (item) => `<article class="testimonial-card">
            <div class="testimonial-quote">"</div>
            <p class="testimonial-text">${item.review}</p>
            <div class="testimonial-footer">
              <div class="testimonial-avatar">${initials(item.studentName)}</div>
              <div>
                <div class="testimonial-author">${item.studentName}</div>
                <div class="testimonial-role">${item.designation ?? "Capital Lab Education Student"}</div>
              </div>
            </div>
          </article>`,
        )
        .join("");

      let currentIndex = 0;
      let autoSlideTimer: ReturnType<typeof setInterval> | null = null;
      let touchStartX = 0;

      const getCardsPerView = () => (window.innerWidth <= 768 ? 1 : 2);
      const getMaxIndex = () => Math.max(0, testimonials.length - getCardsPerView());

      const renderDots = () => {
        const pages = getMaxIndex() + 1;
        testimonialDots.innerHTML = "";
        for (let index = 0; index < pages; index += 1) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = `testimonial-dot${index === currentIndex ? " active" : ""}`;
          dot.setAttribute("aria-label", `Go to testimonial group ${index + 1}`);
          dot.dataset.index = String(index);
          testimonialDots.appendChild(dot);
        }
      };

      const updateDots = () => {
        testimonialDots.querySelectorAll(".testimonial-dot").forEach((dot, index) => {
          dot.classList.toggle("active", index === currentIndex);
        });
      };

      const updateSlider = () => {
        const card = testimonialsTrack.querySelector<HTMLElement>(".testimonial-card");
        if (!card) return;

        currentIndex = Math.max(0, Math.min(currentIndex, getMaxIndex()));
        const gap = window.innerWidth <= 768 ? 20 : 24;
        const slideWidth = card.getBoundingClientRect().width + gap;
        testimonialsTrack.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
        testimonialPrev.disabled = getMaxIndex() === 0;
        testimonialNext.disabled = getMaxIndex() === 0;
        renderDots();
        updateDots();
      };

      const nextSlide = () => {
        const maxIndex = getMaxIndex();
        currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
        updateSlider();
      };

      const prevSlide = () => {
        const maxIndex = getMaxIndex();
        currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
        updateSlider();
      };

      const stopAutoSlide = () => {
        if (autoSlideTimer) {
          clearInterval(autoSlideTimer);
          autoSlideTimer = null;
        }
      };

      const startAutoSlide = () => {
        stopAutoSlide();
        autoSlideTimer = setInterval(nextSlide, 4500);
      };

      const goToPrevSlide = () => {
        prevSlide();
        startAutoSlide();
      };

      const goToNextSlide = () => {
        nextSlide();
        startAutoSlide();
      };

      const handleDotsClick = (event: Event) => {
        const dot = (event.target as HTMLElement).closest<HTMLElement>(".testimonial-dot");
        if (!dot) return;
        currentIndex = Number(dot.dataset.index ?? "0");
        updateSlider();
        startAutoSlide();
      };

      const handleTestimonialPrevClick = (event?: Event) => {
        event?.preventDefault();
        event?.stopPropagation();
        goToPrevSlide();
      };

      const handleTestimonialNextClick = (event?: Event) => {
        event?.preventDefault();
        event?.stopPropagation();
        goToNextSlide();
      };

      const handleResize = () => updateSlider();
      const handleTouchStart = (event: TouchEvent) => {
        stopAutoSlide();
        touchStartX = event.changedTouches[0]?.clientX ?? 0;
      };
      const handleTouchEnd = (event: TouchEvent) => {
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
        if (Math.abs(delta) >= 40) {
          if (delta < 0) nextSlide();
          else prevSlide();
        }
        startAutoSlide();
      };

      testimonialPrev.addEventListener("pointerdown", handleTestimonialPrevClick);
      testimonialPrev.addEventListener("click", handleTestimonialPrevClick);
      testimonialNext.addEventListener("pointerdown", handleTestimonialNextClick);
      testimonialNext.addEventListener("click", handleTestimonialNextClick);
      testimonialDots.addEventListener("click", handleDotsClick);
      window.addEventListener("resize", handleResize);
      testimonialsCarousel.addEventListener("mouseenter", stopAutoSlide);
      testimonialsCarousel.addEventListener("mouseleave", startAutoSlide);
      testimonialsCarousel.addEventListener("touchstart", handleTouchStart, { passive: true });
      testimonialsCarousel.addEventListener("touchend", handleTouchEnd, { passive: true });

      updateSlider();
      startAutoSlide();

      cleanupFns.push(() => {
        testimonialPrev.removeEventListener("pointerdown", handleTestimonialPrevClick);
        testimonialPrev.removeEventListener("click", handleTestimonialPrevClick);
        testimonialNext.removeEventListener("pointerdown", handleTestimonialNextClick);
        testimonialNext.removeEventListener("click", handleTestimonialNextClick);
        testimonialDots.removeEventListener("click", handleDotsClick);
        window.removeEventListener("resize", handleResize);
        testimonialsCarousel.removeEventListener("mouseenter", stopAutoSlide);
        testimonialsCarousel.removeEventListener("mouseleave", startAutoSlide);
        testimonialsCarousel.removeEventListener("touchstart", handleTouchStart);
        testimonialsCarousel.removeEventListener("touchend", handleTouchEnd);
        stopAutoSlide();
      });
    }

    const syncAccordionItem = (item: HTMLElement, isOpen: boolean) => {
      const trigger = item.querySelector<HTMLElement>(".program-accordion-trigger");
      const content = item.querySelector<HTMLElement>(".program-accordion-content");
      if (!trigger || !content) return;
      item.classList.toggle("active", isOpen);
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false");
      content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "0px";
    };

    root.querySelectorAll<HTMLElement>(".program-accordion").forEach((accordion) => {
      accordion.querySelectorAll<HTMLElement>(".program-accordion-item").forEach((item) => {
        syncAccordionItem(item, item.classList.contains("active"));
      });
    });

    const resizeAccordions = () => {
      root
        .querySelectorAll<HTMLElement>(".program-accordion-item.active .program-accordion-content")
        .forEach((content) => {
          content.style.maxHeight = `${content.scrollHeight}px`;
        });
    };
    window.addEventListener("resize", resizeAccordions);
    cleanupFns.push(() => window.removeEventListener("resize", resizeAccordions));

    const submitLead = async (scope: ParentNode, closeAfterSubmit = false) => {
      const inputs = scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input, textarea, select",
      );
      const [nameInput, emailInput, phoneInput, courseSelect, messageInput] = Array.from(inputs);
      const phone = phoneInput?.value.trim() ?? "";
      const payload = {
        name: nameInput?.value.trim() ?? "",
        email: emailInput?.value.trim() ?? "",
        phone,
        courseInterest: courseSelect?.value || "General Enquiry",
        preferredTime: "Evening (4 PM - 7:30 PM)",
        message: messageInput?.value.trim() ?? "",
      };

      if (!payload.name) {
        toast.error("Please enter your name.");
        return;
      }
      if (!validatePhone(phone)) {
        toast.error("Please enter a valid 10-digit phone number.");
        return;
      }

      try {
        await api.post("/leads", payload);
        toast.success("We'll reach out to you shortly!");
        inputs.forEach((field) => {
          if (field.tagName === "SELECT") {
            field.value = "General Enquiry";
          } else {
            field.value = "";
          }
        });
        if (courseSelect) {
          courseSelect.value = payload.courseInterest;
        }
        if (closeAfterSubmit) closePopup();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    };

    const inlineLeadForm = root.querySelector<HTMLElement>("[data-inline-lead-form]");
    const inlineSubmit = inlineLeadForm?.querySelector<HTMLButtonElement>(".submit-btn");
    if (inlineLeadForm && inlineSubmit) {
      const handleInlineSubmit = () => {
        void submitLead(inlineLeadForm);
      };
      inlineSubmit.addEventListener("click", handleInlineSubmit);
      cleanupFns.push(() => inlineSubmit.removeEventListener("click", handleInlineSubmit));
    }

    const popupLeadForm = root.querySelector<HTMLElement>("[data-popup-lead-form]");
    const popupSubmit = popupLeadForm?.querySelector<HTMLButtonElement>(".popup-submit");
    if (popupLeadForm && popupSubmit) {
      const handlePopupSubmit = () => {
        void submitLead(popupLeadForm, true);
      };
      popupSubmit.addEventListener("click", handlePopupSubmit);
      cleanupFns.push(() => popupSubmit.removeEventListener("click", handlePopupSubmit));
    }

    const handleRootClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const accordionTrigger = target.closest<HTMLElement>(".program-accordion-trigger");
      const trigger = target.closest<HTMLElement>(".nav-cta-trigger, .btn-outline, .program-cta-link, .nav-cta");
      const scrollButton = target.closest<HTMLElement>("[data-scroll-target]");
      const anchor = target.closest<HTMLAnchorElement>("a[href^='#']");

      if (accordionTrigger) {
        event.preventDefault();
        const item = accordionTrigger.closest<HTMLElement>(".program-accordion-item");
        const accordion = accordionTrigger.closest<HTMLElement>(".program-accordion");
        if (!item || !accordion) return;

        const shouldOpen = !item.classList.contains("active");
        accordion.querySelectorAll<HTMLElement>(".program-accordion-item").forEach((other) => {
          syncAccordionItem(other, false);
        });
        syncAccordionItem(item, shouldOpen);
        return;
      }

      if (trigger) {
        const label = trigger.textContent?.trim() ?? "";
        const normalizedLabel = normalizeLabel(label);
        const courseContext = getCourseContext(trigger);

        if (normalizedLabel === "enroll now") {
          event.preventDefault();
          window.location.href = `/leads?course=${encodeURIComponent(courseContext.leadCourse)}`;
          if (trigger.classList.contains("mobile-cta")) {
            closeMobileNav();
          }
          return;
        }

        if (normalizedLabel === "start your cma journey") {
          event.preventDefault();
          window.open(buildWhatsappHref(courseContext.whatsappText), "_blank", "noopener,noreferrer");
          return;
        }

        if (shouldOpenWhatsapp(label)) {
          event.preventDefault();
          window.open(buildWhatsappHref(courseContext.whatsappText), "_blank", "noopener,noreferrer");
          if (trigger.classList.contains("mobile-cta")) {
            closeMobileNav();
          }
          return;
        }

        event.preventDefault();
        openPopup(courseContext.interest || getClosestInterest(label));
        if (trigger.classList.contains("mobile-cta")) {
          closeMobileNav();
        }
        return;
      }

      if (scrollButton) {
        event.preventDefault();
        const selector = scrollButton.getAttribute("data-scroll-target");
        if (selector) {
          root.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      if (anchor) {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        event.preventDefault();
        root.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" });
        closeMobileNav();
      }
    };

    root.addEventListener("click", handleRootClick);
    cleanupFns.push(() => root.removeEventListener("click", handleRootClick));

    if (popupClose) {
      popupClose.addEventListener("click", closePopup);
      cleanupFns.push(() => popupClose.removeEventListener("click", closePopup));
    }
    if (popupSkip) {
      popupSkip.addEventListener("click", closePopup);
      cleanupFns.push(() => popupSkip.removeEventListener("click", closePopup));
    }
    if (popupOverlay) {
      const handleOverlayClick = (event: Event) => {
        if (event.target === popupOverlay) closePopup();
      };
      popupOverlay.addEventListener("click", handleOverlayClick);
      cleanupFns.push(() => popupOverlay.removeEventListener("click", handleOverlayClick));
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
        closeMobileNav();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    cleanupFns.push(() => document.removeEventListener("keydown", handleKeyDown));

    const popupTimer = window.setTimeout(() => openPopup(), 2000);
    cleanupFns.push(() => window.clearTimeout(popupTimer));

    return () => {
      cleanupFns.forEach((cleanup) => cleanup());
      setBodyScrollLock(false);
    };
  }, [isAuthenticated, user]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: markup }} />
      <FloatingReviewWidget />
    </>
  );
}
