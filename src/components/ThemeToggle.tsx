import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to Dark Mode (Command Center)' : 'Switch to Light Mode (Enterprise White)'}
      className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-300 shadow-md cursor-pointer border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 z-50 ${
        theme === 'dark'
          ? 'bg-slate-900 border-amber-400/50 text-amber-300 hover:bg-slate-800 hover:border-amber-300 shadow-amber-500/20'
          : 'bg-white border-indigo-400/50 text-slate-800 hover:bg-slate-50 hover:border-indigo-500 shadow-indigo-500/20 ring-1 ring-indigo-500/20'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {theme === 'dark' ? (
          <>
            <Moon className="h-3.5 w-3.5 text-amber-300 transition-transform duration-300 rotate-0 scale-100" />
            <span className="text-amber-200 font-extrabold tracking-wide">🌙 Dark</span>
          </>
        ) : (
          <>
            <Sun className="h-3.5 w-3.5 text-amber-500 transition-transform duration-300 rotate-0 scale-100" />
            <span className="text-slate-800 font-extrabold tracking-wide">☀️ Light</span>
          </>
        )}
      </div>
    </button>
  );
}
