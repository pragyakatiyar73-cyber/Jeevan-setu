/**
 * 📍 Unified Location Spell-Checking & Auto-Suggest Utility
 * 
 * Computes Levenshtein Distance & Phonetic similarity to match misspelled user queries
 * against a master dictionary of Indian cities, districts, states, and North-East Region sectors.
 */

export interface LocationSuggestion {
  name: string;
  state: string;
  lat: number;
  lon: number;
  type: 'CITY' | 'DISTRICT' | 'SECTOR' | 'STATE';
}

export const KNOWN_LOCATIONS: LocationSuggestion[] = [
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "CITY" },
  { name: "Sohra (Cherrapunji)", state: "Meghalaya", lat: 25.2702, lon: 91.7323, type: "CITY" },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362, type: "CITY" },
  { name: "Tawang", state: "Arunachal Pradesh", lat: 27.5861, lon: 91.8504, type: "SECTOR" },
  { name: "Sela Pass", state: "Arunachal Pradesh", lat: 27.5021, lon: 92.1034, type: "SECTOR" },
  { name: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "CITY" },
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "CITY" },
  { name: "Mangan", state: "Sikkim", lat: 27.5167, lon: 88.5333, type: "DISTRICT" },
  { name: "Imphal", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "CITY" },
  { name: "Ukhrul", state: "Manipur", lat: 25.1167, lon: 94.3667, type: "DISTRICT" },
  { name: "Kohima", state: "Nagaland", lat: 25.6751, lon: 94.1086, type: "CITY" },
  { name: "Dimapur", state: "Nagaland", lat: 25.9060, lon: 93.7270, type: "CITY" },
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "CITY" },
  { name: "Silchar", state: "Assam", lat: 24.8333, lon: 92.7789, type: "CITY" },
  { name: "Jowai", state: "Meghalaya", lat: 25.4500, lon: 92.2000, type: "CITY" },
  { name: "Teesta River Basin", state: "Sikkim", lat: 27.1500, lon: 88.5000, type: "SECTOR" },
  { name: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053, type: "CITY" },
  { name: "Dispur", state: "Assam", lat: 26.1433, lon: 91.7898, type: "CITY" },
  { name: "Darjeeling", state: "West Bengal", lat: 27.0410, lon: 88.2663, type: "CITY" },
  { name: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376, type: "CITY" },
  { name: "Muzaffarpur", state: "Bihar", lat: 26.1209, lon: 85.3647, type: "CITY" },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lon: 85.3096, type: "CITY" },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, type: "CITY" },
  { name: "New Delhi", state: "Delhi", lat: 28.6139, lon: 77.2090, type: "CITY" },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777, type: "CITY" },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946, type: "CITY" },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707, type: "CITY" }
];

/**
 * Calculates Levenshtein Distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const str1 = a.toLowerCase().trim();
  const str2 = b.toLowerCase().trim();

  if (str1.length === 0) return str2.length;
  if (str2.length === 0) return str1.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Returns spelling suggestions if query matches partially or has a low edit distance
 */
export function getSpellingSuggestions(query: string, maxResults = 5): LocationSuggestion[] {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.toLowerCase().trim();

  // 1. Direct prefix / substring matches
  const exactMatches = KNOWN_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(cleanQuery) ||
    loc.state.toLowerCase().includes(cleanQuery)
  );

  if (exactMatches.length > 0) {
    return exactMatches.slice(0, maxResults);
  }

  // 2. Fuzzy edit-distance matching
  const scored = KNOWN_LOCATIONS.map(loc => {
    const nameDist = levenshteinDistance(cleanQuery, loc.name);
    // Allow up to 3 typos depending on string length
    const maxAllowedDist = cleanQuery.length <= 4 ? 1 : cleanQuery.length <= 7 ? 2 : 3;
    return { loc, dist: nameDist, maxAllowedDist };
  })
  .filter(item => item.dist <= item.maxAllowedDist)
  .sort((a, b) => a.dist - b.dist);

  return scored.map(s => s.loc).slice(0, maxResults);
}

/**
 * Checks if a query is likely misspelled and returns a single recommended "Did you mean?" suggestion
 */
export function getDidYouMeanSuggestion(query: string): LocationSuggestion | null {
  if (!query || query.trim().length < 3) return null;

  const cleanQuery = query.toLowerCase().trim();

  // If query is an exact match for a known location, no "Did you mean" needed
  const isExact = KNOWN_LOCATIONS.some(loc => loc.name.toLowerCase() === cleanQuery);
  if (isExact) return null;

  const suggestions = getSpellingSuggestions(query, 1);
  if (suggestions.length > 0) {
    const best = suggestions[0];
    const dist = levenshteinDistance(cleanQuery, best.name);
    if (dist > 0 && dist <= 3) {
      return best;
    }
  }

  return null;
}
