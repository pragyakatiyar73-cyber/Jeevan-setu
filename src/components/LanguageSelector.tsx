import React from "react";
import { useTranslation } from "../i18n";

export default function LanguageSelector() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center rounded-full border border-slate-300 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-950 p-0.5 shadow-sm dark:shadow-md shrink-0">
      <button
        onClick={() => setLanguage("en")}
        className={`rounded-full px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
          language === "en"
            ? "bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>

      <button
        onClick={() => setLanguage("hi")}
        className={`rounded-full px-3 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
          language === "hi"
            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <span>🇮🇳</span>
        <span>हिन्दी</span>
      </button>
    </div>
  );
}
