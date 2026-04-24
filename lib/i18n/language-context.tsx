"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale, type T } from "./translations";

interface LanguageContextValue {
  locale: Locale;
  t: T;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  t: translations.en,
  setLocale: () => {},
});

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/);
  const val = match?.[1];
  return val === "tr" ? "tr" : "en";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    setLocaleState(getInitialLocale());
  }, []);

  function setLocale(next: Locale) {
    document.cookie = `lang=${next}; path=/; max-age=31536000`;
    setLocaleState(next);
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
