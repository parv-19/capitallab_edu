"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";
import CfaCtaButton from "@/components/lp-cfa/CfaCtaButton";

interface LogoItem {
  name: string;
  src: string;
  width: number;
  height: number;
  /** Extra classes for logos whose source art is too low-contrast on a white tile. */
  imgClassName?: string;
}

const rowOne: LogoItem[] = [
  {
    name: "Grant Thornton",
    src: "/lp-cfa/companies/grant-thornton.png",
    width: 1600,
    height: 635,
  },
  {
    name: "Citibank",
    src: "/lp-cfa/companies/citibank.png",
    width: 1600,
    height: 635,
  },
  {
    name: "BlackRock",
    src: "/lp-cfa/companies/blackrock.png",
    width: 1600,
    height: 635,
  },
  {
    name: "Avendus",
    src: "/lp-cfa/companies/avendus.png",
    width: 1600,
    height: 635,
  },
  {
    name: "India Research",
    src: "/lp-cfa/companies/india-research.png",
    width: 1600,
    height: 635,
  },
  {
    name: "JP Morgan",
    src: "/lp-cfa/companies/jp-morgan.png",
    width: 1600,
    height: 635,
  },
];

const rowTwo: LogoItem[] = [
  { name: "KPMG", src: "/lp-cfa/companies/kpmg.png", width: 1600, height: 635 },
  {
    name: "Morningstar",
    src: "/lp-cfa/companies/morningstar.png",
    width: 1600,
    height: 635,
  },
  {
    name: "PGIM",
    src: "/lp-cfa/companies/pgim.png",
    width: 1600,
    height: 635,
  },
  {
    name: "Tresvista",
    src: "/lp-cfa/companies/tresvista.png",
    width: 1600,
    height: 635,
  },
  {
    name: "Alpha Alternatives",
    src: "/lp-cfa/companies/alpha-alternatives.png",
    width: 1600,
    height: 635,
    imgClassName: "brightness-0 opacity-70",
  },
  {
    name: "Kapso",
    src: "/lp-cfa/companies/kapso.png",
    width: 328,
    height: 120,
  },
];

function LogoTile({ name, src, width, height, imgClassName }: LogoItem) {
  return (
    <div className="flex h-32 w-72 shrink-0 items-center justify-center rounded-2xl border border-cfa-goldPale bg-white px-10 py-6 sm:h-40 sm:w-80">
      <Image
        src={src}
        alt={name}
        width={width}
        height={height}
        sizes="320px"
        className={`h-full w-full object-contain ${imgClassName ?? ""}`}
        draggable={false}
      />
    </div>
  );
}

function LogoRow({
  logos,
  reverse = false,
  speed = 40,
}: {
  logos: LogoItem[];
  reverse?: boolean;
  speed?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const halfWidth = useRef(0);
  const dragStart = useRef({ x: 0, value: 0 });
  const x = useMotionValue(0);

  const wrap = (value: number) => {
    const width = halfWidth.current;
    if (!width) return value;
    let wrapped = value % width;
    if (wrapped > 0) wrapped -= width;
    return wrapped;
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      halfWidth.current = el.scrollWidth / 2;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (dragging.current || !halfWidth.current) return;
    const direction = reverse ? 1 : -1;
    x.set(wrap(x.get() + (direction * speed * delta) / 1000));
  });

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    dragStart.current = { x: event.clientX, value: x.get() };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    x.set(
      wrap(dragStart.current.value + (event.clientX - dragStart.current.x)),
    );
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const loop = [...logos, ...logos];

  return (
    <div className="overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
      <motion.div
        ref={trackRef}
        style={{ x }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex w-max cursor-grab touch-pan-y select-none items-center gap-6 active:cursor-grabbing sm:gap-8"
      >
        {loop.map((logo, index) => (
          <LogoTile key={`${logo.name}-${index}`} {...logo} />
        ))}
      </motion.div>
    </div>
  );
}

export default function CfaIndustryMarqueeSection() {
  return (
    <section
      id="cfa-industry"
      className="relative overflow-hidden bg-cfa-cream py-20 md:py-28"
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-cfa-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-cfa-navy/10 blur-3xl" />

      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-[3px] text-cfa-gold">
            Global Career Landscape
          </p>
          <h2 className="font-jakarta text-3xl font-bold leading-snug text-cfa-navy md:text-5xl">
            Where Capital Lab <span className="text-cfa-gold">Alumni Work</span>
          </h2>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
        <LogoRow logos={rowOne} speed={38} />
        <LogoRow logos={rowTwo} reverse speed={38} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="container mt-14 flex justify-center"
      >
        <CfaCtaButton action="modal" size="lg">
          Join Our Alumni Network
        </CfaCtaButton>
      </motion.div>
    </section>
  );
}
