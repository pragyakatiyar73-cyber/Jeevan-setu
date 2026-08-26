import React, { useState, useRef, useEffect } from "react";
import { useTranslation, LanguageCode } from "../i18n";
import { Globe, Check, ChevronDown } from "lucide-react";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const languagesList: { code: LanguageCode; label: string; flag: string }[] = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
    { code: "as", label: "অসমীয়া Assamese", flag: "🚩" },
    { code: "bn", label: "বাংলা Bengali", flag: "🚩" }
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1.5" ref={dropdownRef}>
      {/* 1. INSTANT DUAL TOGGLE SWITCH (ENGLISH <-> HINDI) */}
      <div className="flex items-center rounded-full border border-slate-700/80 bg-slate-950 p-0.5 shadow-md">
        <button
          onClick={() => setLanguage("en")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
            language === "en"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>

        <button
          onClick={() => setLanguage("hi")}
          className={`rounded-full px-2.5 py-1 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer ${
            language === "hi"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🇮🇳</span>
          <span>हिन्दी</span>
        </button>
      </div>

      {/* 2. MORE LANGUAGES DROPDOWN BUTTON */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Select additional language"
          title="More Languages"
          className="rounded-full bg-slate-900/90 border border-slate-700/80 p-1.5 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-600 transition flex items-center justify-center cursor-pointer shadow-md"
        >
          <Globe className="h-3.5 w-3.5 text-sky-400" />
          <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-800 bg-[#070d1e] p-1.5 shadow-2xl z-50 animate-fadeIn backdrop-blur-lg">
            <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800/80 flex items-center gap-1.5">
              <Globe className="h-3 w-3 text-sky-400" />
              <span>{t("header.selectLanguage", "Select Language")}</span>
            </div>

            <div className="py-1 space-y-0.5">
              {languagesList.map((langItem) => {
                const isActive = language === langItem.code;
                return (
                  <button
                    key={langItem.code}
                    onClick={() => {
                      setLanguage(langItem.code);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{langItem.flag}</span>
                      <span>{langItem.label}</span>
                    </span>
                    {isActive && <Check className="h-3.5 w-3.5 text-sky-400 font-black" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
