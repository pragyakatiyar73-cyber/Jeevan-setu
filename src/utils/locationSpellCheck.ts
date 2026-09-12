/**
 * 📍 Unified Location Spell-Checking & Auto-Suggest Utility
 * 
 * Computes Levenshtein Distance & Phonetic similarity to match misspelled user queries
 * strictly against the 8 North Eastern Region (NER) States of India:
 * 1. Arunachal Pradesh
 * 2. Assam
 * 3. Manipur
 * 4. Meghalaya
 * 5. Mizoram
 * 6. Nagaland
 * 7. Sikkim
 * 8. Tripura
 */

export interface LocationSuggestion {
  name: string;
  state: 'Arunachal Pradesh' | 'Assam' | 'Manipur' | 'Meghalaya' | 'Mizoram' | 'Nagaland' | 'Sikkim' | 'Tripura';
  lat: number;
  lon: number;
  type: 'CITY' | 'DISTRICT' | 'SECTOR' | 'STATE';
}

export const KNOWN_LOCATIONS: LocationSuggestion[] = [
  // 🏞️ THE 8 NER STATES
  { name: "Arunachal Pradesh", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053, type: "STATE" },
  { name: "Assam", state: "Assam", lat: 26.1445, lon: 91.7362, type: "STATE" },
  { name: "Manipur", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "STATE" },
  { name: "Meghalaya", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "STATE" },
  { name: "Mizoram", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "STATE" },
  { name: "Nagaland", state: "Nagaland", lat: 25.6751, lon: 94.1086, type: "STATE" },
  { name: "Sikkim", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "STATE" },
  { name: "Tripura", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "STATE" },

  // ⛰️ ARUNACHAL PRADESH SECTORS & DISTRICTS
  { name: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053, type: "CITY" },
  { name: "Tawang", state: "Arunachal Pradesh", lat: 27.5861, lon: 91.8504, type: "DISTRICT" },
  { name: "Sela Pass Sector", state: "Arunachal Pradesh", lat: 27.5021, lon: 92.1034, type: "SECTOR" },
  { name: "Bomdila (West Kameng)", state: "Arunachal Pradesh", lat: 27.2642, lon: 92.4159, type: "DISTRICT" },
  { name: "Pasighat (East Siang)", state: "Arunachal Pradesh", lat: 28.0660, lon: 95.3262, type: "DISTRICT" },
  { name: "Ziro (Lower Subansiri)", state: "Arunachal Pradesh", lat: 27.5947, lon: 93.8385, type: "DISTRICT" },
  { name: "Changlang", state: "Arunachal Pradesh", lat: 27.1268, lon: 95.7337, type: "DISTRICT" },
  { name: "Dirang Sector", state: "Arunachal Pradesh", lat: 27.3592, lon: 92.2321, type: "SECTOR" },

  // 🌊 ASSAM SECTORS & DISTRICTS
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362, type: "CITY" },
  { name: "Dispur", state: "Assam", lat: 26.1433, lon: 91.7898, type: "CITY" },
  { name: "Kaziranga Sector", state: "Assam", lat: 26.5775, lon: 93.1711, type: "SECTOR" },
  { name: "Dibrugarh", state: "Assam", lat: 27.4728, lon: 94.9120, type: "DISTRICT" },
  { name: "Silchar (Cachar)", state: "Assam", lat: 24.8333, lon: 92.7789, type: "DISTRICT" },
  { name: "Tezpur (Sonitpur)", state: "Assam", lat: 26.6338, lon: 92.8006, type: "DISTRICT" },
  { name: "Jorhat", state: "Assam", lat: 26.7509, lon: 94.2037, type: "DISTRICT" },
  { name: "Lakhimpur", state: "Assam", lat: 27.2366, lon: 94.1037, type: "DISTRICT" },
  { name: "Nagaon", state: "Assam", lat: 26.3462, lon: 92.6840, type: "DISTRICT" },
  { name: "Barpeta", state: "Assam", lat: 26.3228, lon: 91.0048, type: "DISTRICT" },
  { name: "Majuli River Island", state: "Assam", lat: 26.9500, lon: 94.1667, type: "SECTOR" },

  // 🌿 MANIPUR SECTORS & DISTRICTS
  { name: "Imphal", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "CITY" },
  { name: "Imphal West", state: "Manipur", lat: 24.8100, lon: 93.9000, type: "DISTRICT" },
  { name: "Churachandpur", state: "Manipur", lat: 24.3333, lon: 93.6833, type: "DISTRICT" },
  { name: "Ukhrul", state: "Manipur", lat: 25.1167, lon: 94.3667, type: "DISTRICT" },
  { name: "Tamenglong", state: "Manipur", lat: 24.9833, lon: 93.4833, type: "DISTRICT" },
  { name: "Senapati", state: "Manipur", lat: 25.2667, lon: 94.0167, type: "DISTRICT" },
  { name: "Loktak Lake Sector", state: "Manipur", lat: 24.5500, lon: 93.8000, type: "SECTOR" },
  { name: "Noney Slide Sector", state: "Manipur", lat: 24.7890, lon: 93.6540, type: "SECTOR" },

  // ☁️ MEGHALAYA SECTORS & DISTRICTS
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "CITY" },
  { name: "Sohra (Cherrapunji)", state: "Meghalaya", lat: 25.2702, lon: 91.7323, type: "CITY" },
  { name: "Mawsynram Sector", state: "Meghalaya", lat: 25.2986, lon: 91.5822, type: "SECTOR" },
  { name: "Tura (West Garo Hills)", state: "Meghalaya", lat: 25.5142, lon: 90.2032, type: "DISTRICT" },
  { name: "Jowai (West Jaintia Hills)", state: "Meghalaya", lat: 25.4452, lon: 92.2081, type: "DISTRICT" },
  { name: "Nongpoh (Ri-Bhoi)", state: "Meghalaya", lat: 25.9038, lon: 91.8812, type: "DISTRICT" },
  { name: "Nongstoin (West Khasi)", state: "Meghalaya", lat: 25.5204, lon: 91.2678, type: "DISTRICT" },
  { name: "Dawki Border Sector", state: "Meghalaya", lat: 25.1880, lon: 92.0160, type: "SECTOR" },

  // 🏔️ MIZORAM SECTORS & DISTRICTS
  { name: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "CITY" },
  { name: "Lunglei", state: "Mizoram", lat: 22.8841, lon: 92.7347, type: "DISTRICT" },
  { name: "Champhai", state: "Mizoram", lat: 23.4735, lon: 93.3276, type: "DISTRICT" },
  { name: "Serchhip", state: "Mizoram", lat: 23.3086, lon: 92.8465, type: "DISTRICT" },
  { name: "Mamit", state: "Mizoram", lat: 23.9287, lon: 92.4891, type: "DISTRICT" },
  { name: "Kolasib", state: "Mizoram", lat: 24.2255, lon: 92.6789, type: "DISTRICT" },
  { name: "Lengpui Airport Sector", state: "Mizoram", lat: 23.8406, lon: 92.6198, type: "SECTOR" },

  // 🌲 NAGALAND SECTORS & DISTRICTS
  { name: "Kohima", state: "Nagaland", lat: 25.6751, lon: 94.1086, type: "CITY" },
  { name: "Dimapur", state: "Nagaland", lat: 25.9060, lon: 93.7270, type: "CITY" },
  { name: "Mokokchung", state: "Nagaland", lat: 26.3262, lon: 94.5203, type: "DISTRICT" },
  { name: "Tuensang", state: "Nagaland", lat: 26.2841, lon: 94.8315, type: "DISTRICT" },
  { name: "Wokha", state: "Nagaland", lat: 26.0984, lon: 94.2612, type: "DISTRICT" },
  { name: "Mon", state: "Nagaland", lat: 26.7481, lon: 95.0594, type: "DISTRICT" },
  { name: "Zubza Pass Sector", state: "Nagaland", lat: 25.6890, lon: 94.0450, type: "SECTOR" },

  // 🏔️ SIKKIM SECTORS & DISTRICTS
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "CITY" },
  { name: "Mangan (North Sikkim)", state: "Sikkim", lat: 27.5020, lon: 88.5342, type: "DISTRICT" },
  { name: "Chungthang Sector", state: "Sikkim", lat: 27.5800, lon: 88.6200, type: "SECTOR" },
  { name: "Namchi (South Sikkim)", state: "Sikkim", lat: 27.1664, lon: 88.3639, type: "DISTRICT" },
  { name: "Gyalshing (West Sikkim)", state: "Sikkim", lat: 27.2833, lon: 88.2333, type: "DISTRICT" },
  { name: "Nathula Pass Sector", state: "Sikkim", lat: 27.3867, lon: 88.8306, type: "SECTOR" },

  // 🌴 TRIPURA SECTORS & DISTRICTS
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "CITY" },
  { name: "Dharmanagar (North Tripura)", state: "Tripura", lat: 24.3739, lon: 92.1642, type: "DISTRICT" },
  { name: "Udaipur (Gomati)", state: "Tripura", lat: 23.5333, lon: 91.4833, type: "DISTRICT" },
  { name: "Ambassa (Dhalai)", state: "Tripura", lat: 23.8441, lon: 91.8507, type: "DISTRICT" },
  { name: "Belonia (South Tripura)", state: "Tripura", lat: 23.2494, lon: 91.4556, type: "DISTRICT" }
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
