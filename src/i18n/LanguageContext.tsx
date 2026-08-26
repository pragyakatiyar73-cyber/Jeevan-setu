import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import enJSON from "./locales/en.json";
import hiJSON from "./locales/hi.json";
import asJSON from "./locales/as.json";
import bnJSON from "./locales/bn.json";

export type LanguageCode = "en" | "hi" | "as" | "bn";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const translations: Record<LanguageCode, any> = {
  en: enJSON,
  hi: hiJSON,
  as: asJSON,
  bn: bnJSON
};

const STORAGE_KEY = "jeevan_setu_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (saved && ["en", "hi", "as", "bn"].includes(saved)) {
      return saved;
    }
    return "en";
  });

  // Force default to English on initial mount if not explicitly toggled in session
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(STORAGE_KEY, "en");
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (keyPath: string, fallback?: string): string => {
    const keys = keyPath.split(".");
    
    // Try target language first
    let val: any = translations[language];
    for (const k of keys) {
      if (val && typeof val === "object" && k in val) {
        val = val[k];
      } else {
        val = undefined;
        break;
      }
    }

    if (val !== undefined && typeof val === "string") {
      return val;
    }

    // Fallback to English
    let fallbackVal: any = translations.en;
    for (const k of keys) {
      if (fallbackVal && typeof fallbackVal === "object" && k in fallbackVal) {
        fallbackVal = fallbackVal[k];
      } else {
        fallbackVal = undefined;
        break;
      }
    }

    if (fallbackVal !== undefined && typeof fallbackVal === "string") {
      return fallbackVal;
    }

    return fallback || keyPath;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
