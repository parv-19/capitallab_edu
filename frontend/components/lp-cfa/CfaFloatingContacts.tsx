"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { useCfaLeadModal } from "@/contexts/CfaLeadModalContext";
import { companyInfo } from "@/lib/site-content";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.12.554 4.106 1.523 5.828L.057 23.5l5.83-1.527A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.583-.502-5.073-1.377l-.364-.215-3.77.988.988-3.699-.234-.381A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

const contacts = [
  {
    icon: Phone,
    href: companyInfo.phoneHref,
    name: "Call",
    label: `Call ${companyInfo.phoneDisplay}`,
    external: false,
  },
  {
    icon: Mail,
    href: `mailto:${companyInfo.email}`,
    name: "Email",
    label: `Email ${companyInfo.email}`,
    external: false,
  },
  {
    icon: WhatsAppIcon,
    href: companyInfo.whatsappHref,
    name: "WhatsApp",
    label: "Chat on WhatsApp",
    external: true,
  },
];

export default function CfaFloatingContacts() {
  const constraintsRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [side, setSide] = useState<"left" | "right">("right");
  const { openModal } = useCfaLeadModal();

  useEffect(() => {
    const container = constraintsRef.current;
    const widget = widgetRef.current;
    if (container && widget) {
      x.set(container.offsetWidth - widget.offsetWidth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snapToSide = () => {
    const container = constraintsRef.current;
    const widget = widgetRef.current;
    if (!container || !widget) return;

    const containerWidth = container.offsetWidth;
    const widgetWidth = widget.offsetWidth;
    const center = x.get() + widgetWidth / 2;
    const isLeft = center < containerWidth / 2;
    const targetX = isLeft ? 0 : containerWidth - widgetWidth;

    animate(x, targetX, { type: "spring", stiffness: 380, damping: 32 });
    setSide(isLeft ? "left" : "right");
  };

  return (
    <>
      {/* md and up: draggable floating stack, snaps to nearest side on release */}
      <div
        ref={constraintsRef}
        className="pointer-events-none fixed inset-4 z-[70] hidden md:block"
      >
        <motion.div
          ref={widgetRef}
          drag
          dragMomentum={false}
          dragConstraints={constraintsRef}
          dragElastic={0}
          style={{ x, y }}
          onDragEnd={snapToSide}
          whileDrag={{ scale: 1.05 }}
          className="pointer-events-auto absolute top-1/2 flex w-fit -translate-y-1/2 cursor-grab flex-col gap-3 active:cursor-grabbing"
        >
          {contacts.map(({ icon: Icon, href, name, label, external }) => (
            <div key={label} className="group relative">
              <a
                href={href}
                aria-label={label}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                onDragStart={(event) => event.preventDefault()}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-cfa-gold text-cfa-navy shadow-xl transition-colors hover:bg-cfa-navy hover:text-cfa-gold"
              >
                <Icon className="h-7 w-7" />
              </a>
              <span
                className={`pointer-events-none absolute top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-cfa-gold px-3.5 py-2 text-base font-semibold text-cfa-navy opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 ${
                  side === "right" ? "right-full mr-3" : "left-full ml-3"
                }`}
              >
                {name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Below md: sticky bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-[70] flex items-stretch border-t border-cfa-navy/10 bg-cfa-gold px-2 py-2 md:hidden">
        {contacts.map(({ icon: Icon, href, name, label, external }, index) => (
          <a
            key={label}
            href={href}
            aria-label={label}
            {...(external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className={`flex flex-1 flex-col items-center justify-center gap-1 px-2 py-1 text-center text-cfa-navy ${
              index > 0 ? "border-l border-cfa-navy/15" : ""
            }`}
          >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-semibold">{name}</span>
          </a>
        ))}
        <button
          type="button"
          aria-label="Open inquiry form"
          onClick={openModal}
          className="flex flex-1 flex-col items-center justify-center gap-1 border-l border-cfa-navy/15 px-2 py-1 text-center text-cfa-navy"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="text-sm font-semibold">Inquire</span>
        </button>
      </div>
    </>
  );
}
