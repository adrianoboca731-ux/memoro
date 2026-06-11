"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, locales, type TranslationDict } from "./translations";

interface I18nContextType {
  t: (key: string, params?: Record<string, string>) => string;
  locale: string;
  setLocale: (locale: string) => void;
  locales: typeof locales;
}

const I18nContext = createContext<I18nContextType>({
  t: (key) => key,
  locale: "it",
  setLocale: () => {},
  locales,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState("it");

  useEffect(() => {
    const saved = localStorage.getItem("memoro-locale");
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem("memoro-locale", newLocale);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const dict: TranslationDict = translations[locale] || translations.it;
      let value = dict[key] || translations.it[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(`{${k}}`, v);
        });
      }
      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ t, locale, setLocale, locales }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useT() {
  const { t } = useContext(I18nContext);
  return { t };
}
