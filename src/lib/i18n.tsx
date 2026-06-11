"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export type Locale = "it" | "en" | "fr" | "de" | "es" | "pt-BR" | "ja" | "ko" | "zh-TW" | "zh-CN";

const STORAGE_KEY = "memoro-language";

import translations from "@/lib/translations";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  locales: { code: Locale; name: string; nativeName: string }[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as Locale) || "it";
    }
    return "it";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    let value = translations[locale]?.[key] || translations["en"]?.[key] || translations["it"]?.[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, v);
      });
    }
    return value;
  }, [locale]);

  const locales: { code: Locale; name: string; nativeName: string }[] = [
    { code: "it", name: "Italian", nativeName: "Italiano" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "pt-BR", name: "Portuguese (BR)", nativeName: "Português (Brasil)" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
    { code: "ko", name: "Korean", nativeName: "한국어" },
    { code: "zh-TW", name: "Chinese (Traditional)", nativeName: "繁體中文" },
    { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  ];

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}

export function useT() {
  return useI18n();
}
