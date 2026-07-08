"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCfaLeadModal } from "@/contexts/CfaLeadModalContext";

const MotionLink = motion(Link);

export type CfaCtaVariant = "solid" | "outline" | "ghost";
export type CfaCtaSize = "sm" | "md" | "lg";

const variantClasses: Record<CfaCtaVariant, string> = {
  solid: "bg-cfa-gold text-cfa-navy hover:bg-cfa-goldLight",
  outline: "border border-white/40 text-white hover:bg-white/10",
  ghost: "border border-cfa-navy/15 bg-transparent text-cfa-navy hover:bg-cfa-navy/5",
};

const sizeClasses: Record<CfaCtaSize, string> = {
  sm: "px-5 py-2.5 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

const tapAnimation = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.15, ease: "easeOut" as const },
};

interface CfaCtaButtonSharedProps {
  variant?: CfaCtaVariant;
  size?: CfaCtaSize;
  className?: string;
  children: ReactNode;
  /** Runs before the default action (e.g. closing a mobile menu before opening the modal). */
  onBeforeAction?: () => void;
}

type CfaCtaButtonProps =
  | (CfaCtaButtonSharedProps & { action: "modal" })
  | (CfaCtaButtonSharedProps & { action: "link"; href: string });

export default function CfaCtaButton(props: CfaCtaButtonProps) {
  const { openModal } = useCfaLeadModal();
  const {
    variant = "solid",
    size = "lg",
    className = "",
    children,
    onBeforeAction,
  } = props;

  const classes = `inline-flex items-center justify-center gap-2 rounded-sm font-semibold tracking-[0.3px] transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (props.action === "link") {
    return (
      <MotionLink
        href={props.href}
        onClick={onBeforeAction}
        className={classes}
        {...tapAnimation}
      >
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={() => {
        onBeforeAction?.();
        openModal();
      }}
      className={classes}
      {...tapAnimation}
    >
      {children}
    </motion.button>
  );
}
