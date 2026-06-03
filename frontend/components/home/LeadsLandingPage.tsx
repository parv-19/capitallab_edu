"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";

const SHEET_URL =
  "https://script.google.com/macros/s/AKfycbxxpE4_LIKsXmY4BVsVcssVLUbCAW9DeQFRMEOqN-78czmnovsrNh8IR4E2KZFKLrdAAA/exec";

interface LeadsLandingPageProps {
  styles: string;
  markup: string;
}

export default function LeadsLandingPage({ styles, markup }: LeadsLandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const cleanupFns: Array<() => void> = [];
    const homeBrandLinks = Array.from(
      root.querySelectorAll<HTMLElement>(".home-brand-link, .nav-logo"),
    );

    homeBrandLinks.forEach((link) => {
      const handleHomeRedirect = (event: Event) => {
        event.preventDefault();
        window.location.href = "/";
      };

      link.style.cursor = "pointer";
      link.addEventListener("click", handleHomeRedirect);
      cleanupFns.push(() => link.removeEventListener("click", handleHomeRedirect));
    });

    const submitBtn = root.querySelector<HTMLButtonElement>("[data-leads-submit]");
    if (submitBtn) {
      const handleSubmit = async () => {
        const get = (id: string) =>
          (root.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value ?? "").trim();

        const name = get("fname");
        const phone = get("fphone");
        const email = get("femail");
        const state = get("fstate");
        const city = get("fcity");
        const prog = get("fprog");
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
        if (!state) {
          toast.error("Please enter your state.");
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
          state,
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
          message: `State: ${state}, City: ${city}, Background: ${bg || "-"}, Availability: ${avail}`,
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

        const formBody = root.querySelector<HTMLElement>("#formBody");
        const formSuccess = root.querySelector<HTMLElement>("#formSuccess");
        formBody?.classList.add("hide");
        formSuccess?.classList.add("show");
        toast.success("Booked! We'll call you within 2 hours.");
      };

      const submitClickHandler = () => void handleSubmit();
      submitBtn.addEventListener("click", submitClickHandler);
      cleanupFns.push(() => submitBtn.removeEventListener("click", submitClickHandler));
    }

    return () => cleanupFns.forEach((fn) => fn());
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div ref={containerRef} dangerouslySetInnerHTML={{ __html: markup }} />
    </>
  );
}
