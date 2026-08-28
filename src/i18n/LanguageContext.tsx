import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import enJSON from "./locales/en.json";
import hiJSON from "./locales/hi.json";
import asJSON from "./locales/as.json";
import bnJSON from "./locales/bn.json";
import brxJSON from "./locales/brx.json";
import mniJSON from "./locales/mni.json";
import khaJSON from "./locales/kha.json";
import grtJSON from "./locales/grt.json";
import mzoJSON from "./locales/mzo.json";
import neJSON from "./locales/ne.json";
import trpJSON from "./locales/trp.json";
import nagJSON from "./locales/nag.json";

export type LanguageCode =
  | "en"
  | "hi"
  | "as"
  | "bn"
  | "brx"
  | "mni"
  | "kha"
  | "grt"
  | "mzo"
  | "ne"
  | "trp"
  | "nag";

export interface LanguageMeta {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  region: string;
  flag: string;
  isNorthEast: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  // National Languages
  { code: "en", label: "English", nativeLabel: "English", region: "National / Global", flag: "🇬🇧", isNorthEast: false },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", region: "National", flag: "🇮🇳", isNorthEast: false },

  // All North Eastern Languages
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া", region: "Assam", flag: "🌿", isNorthEast: true },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", region: "Tripura / Barak", flag: "🌸", isNorthEast: true },
  { code: "brx", label: "Bodo", nativeLabel: "बड़ो", region: "Bodoland, Assam", flag: "🏹", isNorthEast: true },
  { code: "mni", label: "Manipuri", nativeLabel: "মৈতৈলোন্", region: "Manipur", flag: "🦚", isNorthEast: true },
  { code: "kha", label: "Khasi", nativeLabel: "Ka Ktien Khasi", region: "Meghalaya", flag: "🏔️", isNorthEast: true },
  { code: "grt", label: "Garo", nativeLabel: "A·chik", region: "Meghalaya", flag: "🌲", isNorthEast: true },
  { code: "mzo", label: "Mizo", nativeLabel: "Mizo ṭawng", region: "Mizoram", flag: "🌄", isNorthEast: true },
  { code: "ne", label: "Nepali", nativeLabel: "नेपाली", region: "Sikkim", flag: "🏔️", isNorthEast: true },
  { code: "trp", label: "Kokborok", nativeLabel: "ককবরক", region: "Tripura", flag: "🌺", isNorthEast: true },
  { code: "nag", label: "Nagamese", nativeLabel: "Nagamese", region: "Nagaland", flag: "🦅", isNorthEast: true }
];

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (keyPath: string, fallback?: string) => string;
}

const translations: Record<LanguageCode, any> = {
  en: enJSON,
  hi: hiJSON,
  as: asJSON,
  bn: bnJSON,
  brx: brxJSON,
  mni: mniJSON,
  kha: khaJSON,
  grt: grtJSON,
  mzo: mzoJSON,
  ne: neJSON,
  trp: trpJSON,
  nag: nagJSON
};

const STORAGE_KEY = "jeevan_setu_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    const validCodes = SUPPORTED_LANGUAGES.map(l => l.code);
    if (saved && validCodes.includes(saved)) {
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
