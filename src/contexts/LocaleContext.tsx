"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { translations, type Locale } from "@/lib/i18n/translations";

type T = typeof translations.en | typeof translations.fr;
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: T;
} | null>(null);

export function LocaleProvider({
  children,
  defaultLocale = "en",
}: {
  children: React.ReactNode;
  defaultLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);
  const t = translations[locale];
  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
