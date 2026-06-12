"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/axios";
import type { Testimonial } from "@/types";
import LeadsLandingNavbar from "@/components/home/LeadsLandingNavbar";

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxxpE4_LIKsXmY4BVsVcssVLUbCAW9DeQFRMEOqN-78czmnovsrNh8IR4E2KZFKLrdAAA/exec";

interface LeadsLandingPageProps {
  styles: string;
  markup: string;
  testimonials?: Testimonial[];
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LeadsLandingPage({ styles, markup, testimonials = [] }: LeadsLandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];
    const searchParams = new URLSearchParams(window.location.search);
    const requestedCourse = searchParams.get("course")?.trim();
    if (requestedCourse) {
      const programSelect = root.querySelector<HTMLSelectElement>("#fprog");
      const matchingOption = Array.from(programSelect?.options ?? []).find(
        (option) => option.text.trim().toLowerCase() === requestedCourse.toLowerCase(),
      );
      if (programSelect && matchingOption) {
        programSelect.value = matchingOption.text;
      }
    }

    const testimonialGrid = root.querySelector<HTMLElement>(".testi-grid");
    if (testimonialGrid && testimonials.length > 0) {
      testimonialGrid.innerHTML = testimonials
        .map(
          (testimonial) => `<div class="testi-card">
            <div class="testi-stars">${"&#9733;".repeat(Math.max(0, Math.min(5, testimonial.rating || 5)))}</div>
            <p class="testi-text">"${testimonial.review}"</p>
            <div class="testi-author">
              <div class="testi-avatar">${initials(testimonial.studentName)}</div>
              <div>
                <div class="testi-name">${testimonial.studentName}</div>
                <div class="testi-meta">${testimonial.designation ?? "Capital Lab Education Student"}</div>
              </div>
            </div>
          </div>`,
        )
        .join("");

      let viewport = testimonialGrid.parentElement;
      if (!viewport?.classList.contains("testi-carousel-viewport")) {
        const wrapper = document.createElement("div");
        wrapper.className = "testi-carousel-viewport";
        testimonialGrid.parentNode?.insertBefore(wrapper, testimonialGrid);
        wrapper.appendChild(testimonialGrid);
        viewport = wrapper;
      }

      testimonialGrid.classList.add("testi-carousel-track");

      let controls = root.querySelector<HTMLElement>(".testi-controls");
      if (!controls) {
        controls = document.createElement("div");
        controls.className = "testi-controls";
        controls.innerHTML = `
          <div class="testi-controls__buttons">
            <button class="testi-btn" type="button" data-testi-prev aria-label="Previous review">&#8249;</button>
            <button class="testi-btn" type="button" data-testi-next aria-label="Next review">&#8250;</button>
          </div>
          <div class="testi-dots" data-testi-dots aria-label="Review navigation"></div>
        `;
        viewport?.insertAdjacentElement("afterend", controls);
      }

      const prevButton = controls.querySelector<HTMLButtonElement>("[data-testi-prev]");
      const nextButton = controls.querySelector<HTMLButtonElement>("[data-testi-next]");
      const dotsWrap = controls.querySelector<HTMLElement>("[data-testi-dots]");
      let currentIndex = 0;
      let touchStartX = 0;
      let autoplay: ReturnType<typeof setInterval> | null = null;

      const getCardsPerView = () => {
        if (window.innerWidth <= 900) return 1;
        if (window.innerWidth <= 1180) return 2;
        return 3;
      };

      const getMaxIndex = () => Math.max(0, testimonials.length - getCardsPerView());

      const renderDots = () => {
        if (!dotsWrap) return;
        const total = getMaxIndex() + 1;
        dotsWrap.innerHTML = "";
        for (let index = 0; index < total; index += 1) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = `testi-dot${index === currentIndex ? " active" : ""}`;
          dot.dataset.index = String(index);
          dotsWrap.appendChild(dot);
        }
      };

      const updateCarousel = () => {
        const card = testimonialGrid.querySelector<HTMLElement>(".testi-card");
        if (!card) return;
        currentIndex = Math.max(0, Math.min(currentIndex, getMaxIndex()));
        const gap = window.innerWidth <= 900 ? 12 : 20;
        const slideWidth = card.getBoundingClientRect().width + gap;
        testimonialGrid.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
        if (prevButton) prevButton.disabled = getMaxIndex() === 0;
        if (nextButton) nextButton.disabled = getMaxIndex() === 0;
        renderDots();
      };

      const stopAutoplay = () => {
        if (autoplay) {
          clearInterval(autoplay);
          autoplay = null;
        }
      };

      const startAutoplay = () => {
        stopAutoplay();
        if (getMaxIndex() === 0) return;
        autoplay = setInterval(() => {
          currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
          updateCarousel();
        }, 4500);
      };

      const handlePrev = () => {
        currentIndex = currentIndex <= 0 ? getMaxIndex() : currentIndex - 1;
        updateCarousel();
        startAutoplay();
      };

      const handleNext = () => {
        currentIndex = currentIndex >= getMaxIndex() ? 0 : currentIndex + 1;
        updateCarousel();
        startAutoplay();
      };

      const handleDotsClick = (event: Event) => {
        const dot = (event.target as HTMLElement).closest<HTMLElement>(".testi-dot");
        if (!dot) return;
        currentIndex = Number(dot.dataset.index || "0");
        updateCarousel();
        startAutoplay();
      };

      const handleTouchStart = (event: TouchEvent) => {
        touchStartX = event.changedTouches[0]?.clientX ?? 0;
        stopAutoplay();
      };

      const handleTouchEnd = (event: TouchEvent) => {
        const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX;
        if (Math.abs(delta) >= 40) {
          if (delta < 0) handleNext();
          else handlePrev();
        } else {
          startAutoplay();
        }
      };

      prevButton?.addEventListener("click", handlePrev);
      nextButton?.addEventListener("click", handleNext);
      dotsWrap?.addEventListener("click", handleDotsClick);
      window.addEventListener("resize", updateCarousel);
      viewport?.addEventListener("mouseenter", stopAutoplay);
      viewport?.addEventListener("mouseleave", startAutoplay);
      viewport?.addEventListener("touchstart", handleTouchStart, { passive: true });
      viewport?.addEventListener("touchend", handleTouchEnd, { passive: true });

      updateCarousel();
      startAutoplay();

      cleanupFns.push(() => {
        prevButton?.removeEventListener("click", handlePrev);
        nextButton?.removeEventListener("click", handleNext);
        dotsWrap?.removeEventListener("click", handleDotsClick);
        window.removeEventListener("resize", updateCarousel);
        viewport?.removeEventListener("mouseenter", stopAutoplay);
        viewport?.removeEventListener("mouseleave", startAutoplay);
        viewport?.removeEventListener("touchstart", handleTouchStart);
        viewport?.removeEventListener("touchend", handleTouchEnd);
        stopAutoplay();
      });
    }

    const submitBtn = root.querySelector<HTMLButtonElement>("[data-leads-submit]");
    if (submitBtn) {
      const handleSubmit = async () => {
        const get = (id: string) =>
          (root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value ?? "").trim();

        const name = get("fname");
        const phone = get("fphone");
        const email = get("femail");
        const city = get("fcity");
        const prog = get("fprog") || requestedCourse || "";
        const bg = get("fstream");
        const avail = get("favail");

        if (!name) {
          toast.error("Please enter your name.");
          return;
        }
        if (!phone) {
          toast.error("Please enter your WhatsApp number.");
          return;
        }
        if (!city) {
          toast.error("Please enter your city.");
          return;
        }
        if (!avail) {
          toast.error("Please select your call availability.");
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";

        const sheetPayload = {
          name,
          phone,
          email,
          city,
          program: prog,
          background: bg,
          availability: avail,
        };
        const backendPayload = {
          name,
          phone,
          email,
          courseInterest: prog || "General Enquiry",
          message: `City: ${city}, Background: ${bg || "-"}, Availability: ${avail}`,
        };

        await Promise.allSettled([
          fetch(SHEET_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sheetPayload),
          }),
          api.post("/leads", backendPayload).catch(() => null),
        ]);

        router.push("/thank-you");
      };

      const submitClickHandler = () => void handleSubmit();
      submitBtn.addEventListener("click", submitClickHandler);
      cleanupFns.push(() => submitBtn.removeEventListener("click", submitClickHandler));
    }

    return () => {
      cleanupFns.forEach((fn) => fn());
    };
  }, [testimonials]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <LeadsLandingNavbar />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
