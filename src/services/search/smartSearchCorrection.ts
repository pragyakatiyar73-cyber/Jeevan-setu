import { DISASTER_TERMS, COMMON_TYPOS } from './disasterDictionary';

export interface SearchCorrectionResult {
  originalQuery: string;
  correctedQuery: string;
  hasCorrection: boolean;
  confidence: number;
  reason?: string;
}

const KNOWN_LOCATIONS = [
  'Kanpur', 'Shillong', 'Sohra', 'Guwahati', 'Tawang', 'Sela Pass',
  'Aizawl', 'Gangtok', 'Mangan', 'Imphal', 'Ukhrul', 'Kohima',
  'Dimapur', 'Agartala', 'Silchar', 'Jowai', 'Itanagar', 'Dispur',
  'Darjeeling', 'Patna', 'Muzaffarpur', 'Ranchi', 'Kolkata', 'New Delhi',
  'Mumbai', 'Bengaluru', 'Chennai'
];

// Memory LRU Cache
const correctionCache = new Map<string, SearchCorrectionResult>();

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

/**
 * Core smart search correction function combining local fuzzy rules,
 * disaster dictionary, Hinglish normalization, and location intelligence.
 */
export function getLocalSmartCorrection(rawQuery: string): SearchCorrectionResult {
  const query = rawQuery.trim();
  if (!query || query.length < 2) {
    return { originalQuery: rawQuery, correctedQuery: rawQuery, hasCorrection: false, confidence: 1.0 };
  }

  const cached = correctionCache.get(query.toLowerCase());
  if (cached) return cached;

  const words = query.split(/\s+/);
  let isChanged = false;
  const correctedWords: string[] = [];

  for (const word of words) {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!cleanWord) {
      correctedWords.push(word);
      continue;
    }

    // 1. Direct typo dictionary check
    if (COMMON_TYPOS[cleanWord]) {
      correctedWords.push(COMMON_TYPOS[cleanWord]);
      isChanged = true;
      continue;
    }

    // 2. Known location fuzzy matching
    let matchedLocation: string | null = null;
    let minLocDist = 999;
    for (const loc of KNOWN_LOCATIONS) {
      const dist = levenshteinDistance(cleanWord, loc.toLowerCase());
      if (dist <= 2 && dist < minLocDist && cleanWord.length >= 4) {
        minLocDist = dist;
        matchedLocation = loc;
      }
    }

    if (matchedLocation && minLocDist > 0) {
      correctedWords.push(matchedLocation);
      isChanged = true;
      continue;
    }

    // 3. Disaster dictionary fuzzy matching
    let matchedTerm: string | null = null;
    let minTermDist = 999;
    for (const termObj of DISASTER_TERMS) {
      for (const syn of termObj.synonyms) {
        const dist = levenshteinDistance(cleanWord, syn);
        if (dist <= 2 && dist < minTermDist && cleanWord.length >= 4) {
          minTermDist = dist;
          matchedTerm = termObj.canonical;
        }
      }
    }

    if (matchedTerm && minTermDist > 0) {
      correctedWords.push(matchedTerm);
      isChanged = true;
      continue;
    }

    correctedWords.push(word);
  }

  const correctedQuery = correctedWords.join(' ');
  const result: SearchCorrectionResult = {
    originalQuery: rawQuery,
    correctedQuery: isChanged ? correctedQuery : rawQuery,
    hasCorrection: isChanged && correctedQuery.toLowerCase() !== rawQuery.toLowerCase(),
    confidence: isChanged ? 0.92 : 1.0,
    reason: isChanged ? 'Spelling / Disaster Vocabulary Match' : undefined
  };

  correctionCache.set(query.toLowerCase(), result);
  return result;
}

/**
 * Async API fallback for complex query corrections
 */
export async function smartSearchCorrection(query: string): Promise<SearchCorrectionResult> {
  const localRes = getLocalSmartCorrection(query);
  if (localRes.hasCorrection) return localRes;

  try {
    const response = await fetch('http://localhost:5000/api/search/correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (response.ok) {
      const data = await response.json();
      if (data?.correctedQuery && data.correctedQuery.toLowerCase() !== query.toLowerCase()) {
        return {
          originalQuery: query,
          correctedQuery: data.correctedQuery,
          hasCorrection: true,
          confidence: data.confidence || 0.85,
          reason: 'AI Query Intelligence'
        };
      }
    }
  } catch (e) {
    // Silent fallback to local result on error
  }

  return localRes;
}
