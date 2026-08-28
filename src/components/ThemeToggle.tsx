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
      className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 shadow-md cursor-pointer border focus:outline-none z-50 ${
        theme === 'dark'
          ? 'bg-slate-900 border-amber-400/50 text-amber-300 hover:bg-slate-800'
          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center gap-1.5 font-bold">
        {theme === 'dark' ? (
          <>
            <span>🌙</span>
            <span className="text-amber-200 font-extrabold">Dark</span>
          </>
        ) : (
          <>
            <span>☀️</span>
            <span className="text-slate-800 font-extrabold">Light</span>
          </>
        )}
      </div>
    </button>
  );
}
