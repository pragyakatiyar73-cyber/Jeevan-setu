/**
 * 📍 Unified Location & Keyword Spell-Checking Utility
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
  type: 'CITY' | 'DISTRICT' | 'SECTOR' | 'STATE' | 'FACILITY' | 'HAZARD';
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
  { name: "Papum Pare", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053, type: "DISTRICT" },
  { name: "West Kameng", state: "Arunachal Pradesh", lat: 27.2642, lon: 92.4159, type: "DISTRICT" },
  { name: "East Kameng", state: "Arunachal Pradesh", lat: 27.3167, lon: 93.0333, type: "DISTRICT" },
  { name: "East Siang", state: "Arunachal Pradesh", lat: 28.0660, lon: 95.3262, type: "DISTRICT" },
  { name: "Lower Subansiri", state: "Arunachal Pradesh", lat: 27.5947, lon: 93.8385, type: "DISTRICT" },
  { name: "Upper Subansiri", state: "Arunachal Pradesh", lat: 28.0600, lon: 94.1300, type: "DISTRICT" },
  { name: "Changlang", state: "Arunachal Pradesh", lat: 27.1268, lon: 95.7337, type: "DISTRICT" },
  { name: "Lohit", state: "Arunachal Pradesh", lat: 27.9167, lon: 96.1667, type: "DISTRICT" },
  { name: "Namsai", state: "Arunachal Pradesh", lat: 27.6667, lon: 95.8667, type: "DISTRICT" },
  { name: "Tirap", state: "Arunachal Pradesh", lat: 27.0000, lon: 95.5000, type: "DISTRICT" },
  { name: "Longding", state: "Arunachal Pradesh", lat: 26.8500, lon: 95.3500, type: "DISTRICT" },
  { name: "Upper Siang", state: "Arunachal Pradesh", lat: 28.6167, lon: 94.9500, type: "DISTRICT" },
  { name: "Dibang Valley", state: "Arunachal Pradesh", lat: 28.8667, lon: 95.8000, type: "DISTRICT" },
  { name: "Lower Dibang Valley", state: "Arunachal Pradesh", lat: 28.1500, lon: 95.8333, type: "DISTRICT" },
  { name: "Anjaw", state: "Arunachal Pradesh", lat: 27.9167, lon: 96.8333, type: "DISTRICT" },
  { name: "Kra Daadi", state: "Arunachal Pradesh", lat: 27.8500, lon: 93.6500, type: "DISTRICT" },
  { name: "Kurung Kumey", state: "Arunachal Pradesh", lat: 27.9000, lon: 93.3500, type: "DISTRICT" },
  { name: "Lepa Rada", state: "Arunachal Pradesh", lat: 27.8000, lon: 94.6000, type: "DISTRICT" },
  { name: "Lower Siang", state: "Arunachal Pradesh", lat: 27.7500, lon: 94.8500, type: "DISTRICT" },
  { name: "Pakke Kessang", state: "Arunachal Pradesh", lat: 27.1500, lon: 93.2000, type: "DISTRICT" },
  { name: "Shi Yomi", state: "Arunachal Pradesh", lat: 28.5000, lon: 94.3000, type: "DISTRICT" },
  { name: "Siang", state: "Arunachal Pradesh", lat: 28.2000, lon: 95.0000, type: "DISTRICT" },
  { name: "Kamle", state: "Arunachal Pradesh", lat: 27.7000, lon: 93.9000, type: "DISTRICT" },
  { name: "Ziro", state: "Arunachal Pradesh", lat: 27.5947, lon: 93.8385, type: "CITY" },
  { name: "Pasighat", state: "Arunachal Pradesh", lat: 28.0660, lon: 95.3262, type: "CITY" },
  { name: "Bomdila", state: "Arunachal Pradesh", lat: 27.2642, lon: 92.4159, type: "CITY" },
  { name: "Naharlagun", state: "Arunachal Pradesh", lat: 27.1085, lon: 93.6925, type: "CITY" },
  { name: "TRIHMS Naharlagun", state: "Arunachal Pradesh", lat: 27.1085, lon: 93.6925, type: "FACILITY" },

  // 🌊 ASSAM SECTORS & DISTRICTS
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362, type: "CITY" },
  { name: "Dispur", state: "Assam", lat: 26.1433, lon: 91.7898, type: "CITY" },
  { name: "Kamrup Metropolitan", state: "Assam", lat: 26.1445, lon: 91.7362, type: "DISTRICT" },
  { name: "Kamrup", state: "Assam", lat: 26.3161, lon: 91.5984, type: "DISTRICT" },
  { name: "Cachar", state: "Assam", lat: 24.8333, lon: 92.7789, type: "DISTRICT" },
  { name: "Silchar", state: "Assam", lat: 24.8333, lon: 92.7789, type: "CITY" },
  { name: "Dibrugarh", state: "Assam", lat: 27.4728, lon: 94.9120, type: "DISTRICT" },
  { name: "Jorhat", state: "Assam", lat: 26.7509, lon: 94.2037, type: "DISTRICT" },
  { name: "Nagaon", state: "Assam", lat: 26.3462, lon: 92.6840, type: "DISTRICT" },
  { name: "Sonitpur", state: "Assam", lat: 26.6338, lon: 92.8006, type: "DISTRICT" },
  { name: "Tezpur", state: "Assam", lat: 26.6338, lon: 92.8006, type: "CITY" },
  { name: "Dhemaji", state: "Assam", lat: 27.4833, lon: 94.5833, type: "DISTRICT" },
  { name: "Lakhimpur", state: "Assam", lat: 27.2333, lon: 94.1000, type: "DISTRICT" },
  { name: "Dhubri", state: "Assam", lat: 26.0206, lon: 89.9746, type: "DISTRICT" },
  { name: "Goalpara", state: "Assam", lat: 26.1833, lon: 90.6167, type: "DISTRICT" },
  { name: "Bongaigaon", state: "Assam", lat: 26.4769, lon: 90.5584, type: "DISTRICT" },
  { name: "Tinsukia", state: "Assam", lat: 27.4886, lon: 95.3558, type: "DISTRICT" },
  { name: "Dima Hasao", state: "Assam", lat: 25.1667, lon: 93.0167, type: "DISTRICT" },
  { name: "Karbi Anglong", state: "Assam", lat: 25.8450, lon: 93.4350, type: "DISTRICT" },
  { name: "Karimganj", state: "Assam", lat: 24.8667, lon: 92.3500, type: "DISTRICT" },
  { name: "Hailakandi", state: "Assam", lat: 24.6833, lon: 92.5667, type: "DISTRICT" },
  { name: "Majuli", state: "Assam", lat: 26.9500, lon: 94.2167, type: "DISTRICT" },
  { name: "Kokrajhar", state: "Assam", lat: 26.4000, lon: 90.2667, type: "DISTRICT" },
  { name: "Chirang", state: "Assam", lat: 26.5000, lon: 90.5000, type: "DISTRICT" },
  { name: "Udalguri", state: "Assam", lat: 26.7460, lon: 92.1310, type: "DISTRICT" },
  { name: "Biswanath", state: "Assam", lat: 26.7328, lon: 93.1444, type: "DISTRICT" },
  { name: "Charaideo", state: "Assam", lat: 26.9600, lon: 94.9000, type: "DISTRICT" },
  { name: "Sivasagar", state: "Assam", lat: 26.9833, lon: 94.6333, type: "DISTRICT" },
  { name: "Morigaon", state: "Assam", lat: 26.2500, lon: 92.3333, type: "DISTRICT" },
  { name: "Nalbari", state: "Assam", lat: 26.4442, lon: 91.4398, type: "DISTRICT" },
  { name: "South Salmara-Mankachar", state: "Assam", lat: 25.8270, lon: 89.9320, type: "DISTRICT" },
  { name: "West Karbi Anglong", state: "Assam", lat: 25.7500, lon: 92.5000, type: "DISTRICT" },
  { name: "Hojai", state: "Assam", lat: 26.0000, lon: 92.8500, type: "DISTRICT" },
  { name: "Darrang", state: "Assam", lat: 26.4500, lon: 92.0300, type: "DISTRICT" },
  { name: "Baksa", state: "Assam", lat: 26.6935, lon: 91.5984, type: "DISTRICT" },
  { name: "Barpeta", state: "Assam", lat: 26.3228, lon: 91.0048, type: "DISTRICT" },
  { name: "GMCH Guwahati", state: "Assam", lat: 26.1554, lon: 91.7825, type: "FACILITY" },
  { name: "SMCH Silchar", state: "Assam", lat: 24.7933, lon: 92.7933, type: "FACILITY" },

  // 🌿 MANIPUR SECTORS & DISTRICTS
  { name: "Imphal", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "CITY" },
  { name: "Chandel", state: "Manipur", lat: 24.3167, lon: 93.9833, type: "DISTRICT" },
  { name: "Imphal West", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "DISTRICT" },
  { name: "Imphal East", state: "Manipur", lat: 24.8000, lon: 93.9500, type: "DISTRICT" },
  { name: "Noney", state: "Manipur", lat: 24.7890, lon: 93.6540, type: "DISTRICT" },
  { name: "Ukhrul", state: "Manipur", lat: 25.1167, lon: 94.3667, type: "DISTRICT" },
  { name: "Tamenglong", state: "Manipur", lat: 24.9833, lon: 93.4833, type: "DISTRICT" },
  { name: "Senapati", state: "Manipur", lat: 25.2667, lon: 94.0167, type: "DISTRICT" },
  { name: "Churachandpur", state: "Manipur", lat: 24.3333, lon: 93.6833, type: "DISTRICT" },
  { name: "Thoubal", state: "Manipur", lat: 24.6333, lon: 93.9833, type: "DISTRICT" },
  { name: "Bishnupur", state: "Manipur", lat: 24.5500, lon: 93.8000, type: "DISTRICT" },
  { name: "Jiribam", state: "Manipur", lat: 24.8000, lon: 93.1167, type: "DISTRICT" },
  { name: "Kakching", state: "Manipur", lat: 24.4833, lon: 93.9833, type: "DISTRICT" },
  { name: "Kamjong", state: "Manipur", lat: 24.8500, lon: 94.5000, type: "DISTRICT" },
  { name: "Kangpokpi", state: "Manipur", lat: 25.1500, lon: 93.9700, type: "DISTRICT" },
  { name: "Pherzawl", state: "Manipur", lat: 24.1800, lon: 93.3000, type: "DISTRICT" },
  { name: "Tengnoupal", state: "Manipur", lat: 24.4000, lon: 94.1500, type: "DISTRICT" },
  { name: "RIMS Imphal", state: "Manipur", lat: 24.8185, lon: 93.9215, type: "FACILITY" },
  { name: "JNIMS Imphal", state: "Manipur", lat: 24.8250, lon: 93.9550, type: "FACILITY" },

  // ☁️ MEGHALAYA SECTORS & DISTRICTS
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "CITY" },
  { name: "East Khasi Hills", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "DISTRICT" },
  { name: "West Khasi Hills", state: "Meghalaya", lat: 25.5204, lon: 91.2678, type: "DISTRICT" },
  { name: "South West Khasi Hills", state: "Meghalaya", lat: 25.3300, lon: 91.2300, type: "DISTRICT" },
  { name: "East Jaintia Hills", state: "Meghalaya", lat: 25.3167, lon: 92.4167, type: "DISTRICT" },
  { name: "West Jaintia Hills", state: "Meghalaya", lat: 25.4452, lon: 92.2081, type: "DISTRICT" },
  { name: "Ri Bhoi", state: "Meghalaya", lat: 25.9038, lon: 91.8812, type: "DISTRICT" },
  { name: "West Garo Hills", state: "Meghalaya", lat: 25.5142, lon: 90.2032, type: "DISTRICT" },
  { name: "East Garo Hills", state: "Meghalaya", lat: 25.6000, lon: 90.5833, type: "DISTRICT" },
  { name: "South Garo Hills", state: "Meghalaya", lat: 25.3167, lon: 90.6333, type: "DISTRICT" },
  { name: "North Garo Hills", state: "Meghalaya", lat: 25.9000, lon: 90.6000, type: "DISTRICT" },
  { name: "South West Garo Hills", state: "Meghalaya", lat: 25.4300, lon: 89.8800, type: "DISTRICT" },
  { name: "Eastern West Khasi Hills", state: "Meghalaya", lat: 25.5500, lon: 91.4500, type: "DISTRICT" },
  { name: "Tura", state: "Meghalaya", lat: 25.5142, lon: 90.2032, type: "CITY" },
  { name: "Jowai", state: "Meghalaya", lat: 25.4452, lon: 92.2081, type: "CITY" },
  { name: "Cherrapunji", state: "Meghalaya", lat: 25.2702, lon: 91.7323, type: "CITY" },
  { name: "Sohra", state: "Meghalaya", lat: 25.2702, lon: 91.7323, type: "CITY" },
  { name: "Mawsynram", state: "Meghalaya", lat: 25.2986, lon: 91.5822, type: "CITY" },
  { name: "NEIGRIHMS Shillong", state: "Meghalaya", lat: 25.5925, lon: 91.9422, type: "FACILITY" },

  // 🏔️ MIZORAM SECTORS & DISTRICTS
  { name: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "CITY" },
  { name: "Lunglei", state: "Mizoram", lat: 22.8833, lon: 92.7333, type: "DISTRICT" },
  { name: "Champhai", state: "Mizoram", lat: 23.4667, lon: 93.3333, type: "DISTRICT" },
  { name: "Kolasib", state: "Mizoram", lat: 24.2333, lon: 92.6833, type: "DISTRICT" },
  { name: "Serchhip", state: "Mizoram", lat: 23.3333, lon: 92.8500, type: "DISTRICT" },
  { name: "Mamit", state: "Mizoram", lat: 23.9333, lon: 92.4833, type: "DISTRICT" },
  { name: "Lawngtlai", state: "Mizoram", lat: 22.5333, lon: 92.8833, type: "DISTRICT" },
  { name: "Saiha", state: "Mizoram", lat: 22.4833, lon: 92.9833, type: "DISTRICT" },
  { name: "Hnahthial", state: "Mizoram", lat: 22.9667, lon: 92.9333, type: "DISTRICT" },
  { name: "Khawzawl", state: "Mizoram", lat: 23.5333, lon: 93.1833, type: "DISTRICT" },
  { name: "Saitual", state: "Mizoram", lat: 23.7000, lon: 92.9833, type: "DISTRICT" },
  { name: "Civil Hospital Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "FACILITY" },

  // 🌲 NAGALAND SECTORS & DISTRICTS
  { name: "Kohima", state: "Nagaland", lat: 25.6751, lon: 94.1086, type: "CITY" },
  { name: "Dimapur", state: "Nagaland", lat: 25.9060, lon: 93.7270, type: "CITY" },
  { name: "Mokokchung", state: "Nagaland", lat: 26.3262, lon: 94.5204, type: "DISTRICT" },
  { name: "Mon", state: "Nagaland", lat: 26.7500, lon: 95.0667, type: "DISTRICT" },
  { name: "Tuensang", state: "Nagaland", lat: 26.2833, lon: 94.8333, type: "DISTRICT" },
  { name: "Wokha", state: "Nagaland", lat: 26.1000, lon: 94.2667, type: "DISTRICT" },
  { name: "Zunheboto", state: "Nagaland", lat: 25.9667, lon: 94.5167, type: "DISTRICT" },
  { name: "Phek", state: "Nagaland", lat: 25.6667, lon: 94.4667, type: "DISTRICT" },
  { name: "Kiphire", state: "Nagaland", lat: 25.9000, lon: 94.7833, type: "DISTRICT" },
  { name: "Peren", state: "Nagaland", lat: 25.5167, lon: 93.7333, type: "DISTRICT" },
  { name: "Longleng", state: "Nagaland", lat: 26.4833, lon: 94.8000, type: "DISTRICT" },
  { name: "Chumoukedima", state: "Nagaland", lat: 25.8200, lon: 93.7700, type: "DISTRICT" },
  { name: "Niuland", state: "Nagaland", lat: 25.9800, lon: 93.8500, type: "DISTRICT" },
  { name: "Noklak", state: "Nagaland", lat: 26.2000, lon: 95.0500, type: "DISTRICT" },
  { name: "Shamator", state: "Nagaland", lat: 26.0500, lon: 94.9500, type: "DISTRICT" },
  { name: "Tseminyu", state: "Nagaland", lat: 25.9100, lon: 94.2100, type: "DISTRICT" },
  { name: "NHAK Kohima", state: "Nagaland", lat: 25.6712, lon: 94.1045, type: "FACILITY" },

  // 🏔️ SIKKIM SECTORS & DISTRICTS
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "CITY" },
  { name: "East Sikkim", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "DISTRICT" },
  { name: "North Sikkim", state: "Sikkim", lat: 27.7000, lon: 88.5167, type: "DISTRICT" },
  { name: "South Sikkim", state: "Sikkim", lat: 27.1667, lon: 88.3500, type: "DISTRICT" },
  { name: "West Sikkim", state: "Sikkim", lat: 27.2833, lon: 88.2500, type: "DISTRICT" },
  { name: "Pakyong", state: "Sikkim", lat: 27.2400, lon: 88.5900, type: "DISTRICT" },
  { name: "Soreng", state: "Sikkim", lat: 27.1667, lon: 88.2000, type: "DISTRICT" },
  { name: "Mangan", state: "Sikkim", lat: 27.5020, lon: 88.5342, type: "CITY" },
  { name: "Namchi", state: "Sikkim", lat: 27.1664, lon: 88.3639, type: "CITY" },
  { name: "STNM Gangtok", state: "Sikkim", lat: 27.3225, lon: 88.6015, type: "FACILITY" },

  // 🌴 TRIPURA SECTORS & DISTRICTS
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "CITY" },
  { name: "West Tripura", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "DISTRICT" },
  { name: "North Tripura", state: "Tripura", lat: 24.3667, lon: 92.1667, type: "DISTRICT" },
  { name: "Dhalai", state: "Tripura", lat: 23.8500, lon: 91.8500, type: "DISTRICT" },
  { name: "Gomati", state: "Tripura", lat: 23.5333, lon: 91.4833, type: "DISTRICT" },
  { name: "Khowai", state: "Tripura", lat: 24.0667, lon: 91.6000, type: "DISTRICT" },
  { name: "Sepahijala", state: "Tripura", lat: 23.6800, lon: 91.3300, type: "DISTRICT" },
  { name: "South Tripura", state: "Tripura", lat: 23.1667, lon: 91.5000, type: "DISTRICT" },
  { name: "Unakoti", state: "Tripura", lat: 24.2833, lon: 92.0167, type: "DISTRICT" },
  { name: "Dharmanagar", state: "Tripura", lat: 24.3739, lon: 92.1642, type: "CITY" },
  { name: "Udaipur", state: "Tripura", lat: 23.5333, lon: 91.4833, type: "CITY" },
  { name: "AGMC GBP Hospital", state: "Tripura", lat: 23.8540, lon: 91.2885, type: "FACILITY" }
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

  // If query is an exact match or substring of a known location, no "Did you mean" needed
  const isExact = KNOWN_LOCATIONS.some(loc => 
    loc.name.toLowerCase() === cleanQuery || 
    loc.name.toLowerCase().startsWith(cleanQuery)
  );
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

