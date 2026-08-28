import React, { useState, useRef, useEffect } from "react";
import { useTranslation, SUPPORTED_LANGUAGES, LanguageCode } from "../i18n";
import { ChevronDown, Check, Globe } from "lucide-react";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  const isNerActive = activeLangMeta.isNorthEast;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const nerLanguages = SUPPORTED_LANGUAGES.filter((l) => l.isNorthEast);
  const nationalLanguages = SUPPORTED_LANGUAGES.filter((l) => !l.isNorthEast);

  return (
    <div className="relative z-[9999] shrink-0" ref={dropdownRef}>
      {/* Sleek Command Center Language Pill */}
      <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-950 p-0.5 shadow-sm dark:shadow-md shrink-0">
        {/* Quick English Toggle */}
        <button
          onClick={() => selectLanguage("en")}
          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            language === "en"
              ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
          title="Switch to English"
        >
          <span>🇬🇧</span>
          <span>EN</span>
        </button>

        {/* Quick Hindi Toggle */}
        <button
          onClick={() => selectLanguage("hi")}
          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
            language === "hi"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
          title="हिन्दी में बदलें (Hindi)"
        >
          <span>🇮🇳</span>
          <span>हिन्दी</span>
        </button>

        {/* North Eastern Languages Dropdown Trigger Pill */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
            isNerActive
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/40 shadow-md shadow-purple-600/30"
              : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white"
          }`}
          title="All North Eastern Region Languages (Assam, Meghalaya, Manipur, Mizoram, Sikkim, Tripura, Nagaland, Arunachal)"
        >
          <span>{isNerActive ? activeLangMeta.flag : "🌿"}</span>
          <span className="hidden sm:inline">
            {isNerActive ? activeLangMeta.nativeLabel : "NER"}
          </span>
          <span className="sm:hidden">
            {isNerActive ? activeLangMeta.code.toUpperCase() : "NER"}
          </span>
          <ChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Floating Tactical Dropdown Menu for North Eastern & National Languages (Matching Site Theme) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-[#070d1e] p-4 shadow-2xl shadow-black/90 backdrop-blur-2xl z-[99999] animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">
                  North Eastern Languages
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  MDoNER / NEC 8-State Logistics Command
                </p>
              </div>
            </div>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold text-emerald-300 border border-emerald-500/30">
              10 Regional Langs
            </span>
          </div>

          {/* SECTION 1: North Eastern Region Languages */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-sky-400 px-1">
              North Eastern States
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
              {nerLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage(lang.code)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-sky-600/30 to-indigo-600/30 border-sky-400 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/40"
                        : "border-slate-700/60 bg-[#0c1427] hover:bg-[#13203c] hover:border-sky-500/60"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{lang.flag}</span>
                        <span className="text-xs font-black text-white truncate">
                          {lang.nativeLabel}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 truncate pl-5">
                        {lang.region}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: National Languages */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5">
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">
              National Languages
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {nationalLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => selectLanguage(lang.code)}
                    className={`flex items-center justify-between p-2 rounded-xl text-left transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-sky-600/30 to-indigo-600/30 border-sky-400 shadow-md shadow-sky-500/20 ring-1 ring-sky-400/40"
                        : "border-slate-700/60 bg-[#0c1427] hover:bg-[#13203c] hover:border-sky-500/60"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{lang.flag}</span>
                        <span className="text-xs font-black text-white truncate">
                          {lang.nativeLabel}
                        </span>
                      </div>
                      <div className="text-[10px] font-semibold text-slate-400 truncate pl-5">
                        {lang.label}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
