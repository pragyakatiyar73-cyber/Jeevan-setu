import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, X, RotateCcw } from 'lucide-react';
import { getLocalSmartCorrection, smartSearchCorrection, SearchCorrectionResult } from '../../services/search/smartSearchCorrection';

export interface SmartSearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onSearch?: (query: string) => void;
  searchType?: string;
  locationContext?: string;
  enableAI?: boolean;
  correctionEnabled?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function SmartSearchInput({
  placeholder = 'Search...',
  value,
  onChange,
  onSearch,
  enableAI = true,
  correctionEnabled = true,
  className = '',
  inputClassName = ''
}: SmartSearchInputProps) {
  const [suggestion, setSuggestion] = useState<SearchCorrectionResult | null>(null);
  const [originalQueryOverride, setOriginalQueryOverride] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search correction calculation
  useEffect(() => {
    if (!correctionEnabled || !value || value.trim().length < 3) {
      setSuggestion(null);
      setIsDismissed(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // 1. Immediate local check
      const localRes = getLocalSmartCorrection(value);
      if (localRes.hasCorrection) {
        setSuggestion(localRes);
        setIsDismissed(false);
        return;
      }

      // 2. Async AI / server fallback if local has no correction
      if (enableAI) {
        const asyncRes = await smartSearchCorrection(value);
        if (asyncRes.hasCorrection) {
          setSuggestion(asyncRes);
          setIsDismissed(false);
        } else {
          setSuggestion(null);
        }
      } else {
        setSuggestion(null);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, correctionEnabled, enableAI]);

  const handleApplySuggestion = (suggestedQuery: string) => {
    setOriginalQueryOverride(value);
    onChange(suggestedQuery);
    setIsDismissed(true);
    if (onSearch) {
      onSearch(suggestedQuery);
    }
  };

  const handleRestoreOriginal = (orig: string) => {
    onChange(orig);
    setOriginalQueryOverride(null);
    setIsDismissed(false);
    if (onSearch) {
      onSearch(orig);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(value);
      }
    } else if (e.key === 'Escape') {
      setIsDismissed(true);
    }
  };

  return (
    <div className={`relative flex flex-col w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={e => {
            setOriginalQueryOverride(null);
            onChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-9 pr-8 py-2 text-xs lg:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 transition ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestion(null);
              setOriginalQueryOverride(null);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Google-Style "Did you mean: ..." Suggestion Banner */}
      {suggestion && suggestion.hasCorrection && !isDismissed && (
        <div
          role="status"
          aria-live="polite"
          className="mt-1.5 px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2 shadow-sm animate-fadeIn"
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span>Did you mean:</span>
            <button
              type="button"
              onClick={() => handleApplySuggestion(suggestion.correctedQuery)}
              className="font-bold text-sky-600 dark:text-sky-400 underline decoration-sky-400/50 hover:decoration-sky-400 transition cursor-pointer"
            >
              {suggestion.correctedQuery}?
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-0.5"
            title="Dismiss suggestion"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Subtle "Restore original query" Option */}
      {originalQueryOverride && (
        <div className="mt-1 px-3 py-1 text-[11px] text-slate-400 flex items-center gap-1.5">
          <RotateCcw className="h-3 w-3 text-amber-400" />
          <span>Searching for <b>"{value}"</b>.</span>
          <button
            type="button"
            onClick={() => handleRestoreOriginal(originalQueryOverride)}
            className="text-amber-400 underline cursor-pointer hover:text-amber-300"
          >
            Use original: "{originalQueryOverride}"
          </button>
        </div>
      )}
    </div>
  );
}
