"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

const AUTO_OPEN_INTERVAL_MS = 30_000;

interface CfaLeadModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const CfaLeadModalContext = createContext<CfaLeadModalContextValue | null>(
  null,
);

export function CfaLeadModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAutoOpened = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-open the modal every 30 seconds; skips if modal is already open
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIsOpen((current) => {
        if (!current) {
          hasAutoOpened.current = true;
          return true;
        }
        return current;
      });
    }, AUTO_OPEN_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const value = useMemo<CfaLeadModalContextValue>(
    () => ({
      isOpen,
      openModal: () => setIsOpen(true),
      closeModal: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return (
    <CfaLeadModalContext.Provider value={value}>
      {children}
    </CfaLeadModalContext.Provider>
  );
}

export function useCfaLeadModal() {
  const context = useContext(CfaLeadModalContext);
  if (!context) {
    throw new Error("useCfaLeadModal must be used within CfaLeadModalProvider");
  }
  return context;
}
