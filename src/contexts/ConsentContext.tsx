"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const CONSENT_KEY = "spaxio_consent";

function getConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CONSENT_KEY) === "accepted";
  } catch {
    return false;
  }
}

type ConsentContextValue = {
  hasConsented: boolean;
  acceptConsent: () => void;
  showConsentModal: boolean;
  dismissConsentModal: () => void;
  openConsentModal: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setHasConsented(getConsent());
    setShowConsentModal(!getConsent());
    setMounted(true);
  }, []);

  const acceptConsent = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, "accepted");
    } catch {}
    setHasConsented(true);
    setShowConsentModal(false);
  }, []);

  const dismissConsentModal = useCallback(() => {
    setShowConsentModal(false);
  }, []);

  const openConsentModal = useCallback(() => {
    setShowConsentModal(true);
  }, []);

  const value: ConsentContextValue = {
    hasConsented: mounted ? hasConsented : false,
    acceptConsent,
    showConsentModal: mounted ? showConsentModal : false,
    dismissConsentModal,
    openConsentModal,
  };

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error("useConsent must be used within ConsentProvider");
  return ctx;
}
