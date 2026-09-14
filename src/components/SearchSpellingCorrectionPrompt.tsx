import React from 'react';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';
import { getDidYouMeanSuggestion, getSpellingSuggestions, LocationSuggestion } from '../utils/locationSpellCheck';

interface SearchSpellingCorrectionPromptProps {
  query: string;
  onSelectSuggestion: (suggestedText: string) => void;
  className?: string;
}

export const SearchSpellingCorrectionPrompt: React.FC<SearchSpellingCorrectionPromptProps> = ({
  query,
  onSelectSuggestion,
  className = ''
}) => {
  if (!query || query.trim().length < 2) return null;

  const didYouMean = getDidYouMeanSuggestion(query);
  const suggestions = getSpellingSuggestions(query, 4);

  const cleanQ = query.trim().toLowerCase();

  // Filter out exact matches
  const filteredSuggestions = suggestions.filter(
    s => s.name.toLowerCase() !== cleanQ && !s.name.toLowerCase().startsWith(cleanQ)
  );

  if (!didYouMean && filteredSuggestions.length === 0) return null;

  return (
    <div className={`mt-2 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs shadow-md space-y-2 transition-all ${className}`}>
      {didYouMean && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-amber-900 dark:text-amber-200 font-medium">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-black text-amber-700 dark:text-amber-400">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0 animate-bounce" />
              क्या आपका मतलब (Did you mean):
            </span>
            <button
              type="button"
              onClick={() => onSelectSuggestion(didYouMean.name)}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition shadow cursor-pointer flex items-center gap-1.5 border border-amber-300"
            >
              <span>{didYouMean.name}</span>
              <span className="text-[10px] opacity-80">({didYouMean.state})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
            Spelling Correction Suggestion
          </span>
        </div>
      )}

      {filteredSuggestions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1.5 border-t border-amber-500/20">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5 text-sky-400" /> Similar Locations / Correct Spellings:
          </span>
          {filteredSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSuggestion(item.name)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-sky-600 hover:text-white transition text-[11px] font-bold cursor-pointer border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-1"
            >
              <span>{item.name}</span>
              <span className="opacity-60 text-[9px]">({item.state})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
