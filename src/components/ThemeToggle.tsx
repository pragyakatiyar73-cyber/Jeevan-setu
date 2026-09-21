import React from 'react';
import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to Dark Mode (Command Center)' : 'Switch to Light Mode (Enterprise White)'}
      className={`relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-2 sm:px-3 h-8 sm:h-9 text-xs font-bold transition-all duration-300 shadow-sm cursor-pointer border focus:outline-none z-50 whitespace-nowrap ${
        theme === 'dark'
          ? 'bg-slate-900 border-amber-400/50 text-amber-300 hover:bg-slate-800'
          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
      }`}
    >
      <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline text-xs font-bold">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  );
}

