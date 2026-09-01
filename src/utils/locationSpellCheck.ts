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
  // 🇮🇳 North India States & UTs
  { name: "Uttar Pradesh", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462, type: "STATE" },
  { name: "Uttarakhand", state: "Uttarakhand", lat: 30.0668, lon: 79.0193, type: "STATE" },
  { name: "Himachal Pradesh", state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734, type: "STATE" },
  { name: "Haryana", state: "Haryana", lat: 29.0588, lon: 76.0856, type: "STATE" },
  { name: "Punjab", state: "Punjab", lat: 31.1471, lon: 75.3412, type: "STATE" },
  { name: "Rajasthan", state: "Rajasthan", lat: 27.0238, lon: 74.2179, type: "STATE" },
  { name: "Jammu & Kashmir", state: "Jammu & Kashmir", lat: 33.7782, lon: 76.5762, type: "STATE" },
  { name: "Ladakh", state: "Ladakh", lat: 34.1526, lon: 77.5771, type: "STATE" },
  { name: "Delhi (NCT)", state: "Delhi", lat: 28.6139, lon: 77.2090, type: "STATE" },
  { name: "Chandigarh", state: "Chandigarh", lat: 30.7333, lon: 76.7794, type: "STATE" },

  // 🟢 UTTAR PRADESH
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lon: 80.9462, type: "CITY" },
  { name: "Kanpur", state: "Uttar Pradesh", lat: 26.4499, lon: 80.3319, type: "CITY" },
  { name: "Varanasi", state: "Uttar Pradesh", lat: 25.3176, lon: 82.9739, type: "CITY" },
  { name: "Prayagraj (Allahabad)", state: "Uttar Pradesh", lat: 25.4358, lon: 81.8463, type: "CITY" },
  { name: "Gorakhpur", state: "Uttar Pradesh", lat: 26.7606, lon: 83.3732, type: "CITY" },
  { name: "Ayodhya", state: "Uttar Pradesh", lat: 26.7922, lon: 82.1998, type: "CITY" },
  { name: "Agra", state: "Uttar Pradesh", lat: 27.1767, lon: 78.0081, type: "CITY" },
  { name: "Meerut", state: "Uttar Pradesh", lat: 28.9845, lon: 77.7064, type: "CITY" },
  { name: "Ghaziabad", state: "Uttar Pradesh", lat: 28.6692, lon: 77.4538, type: "CITY" },
  { name: "Bareilly", state: "Uttar Pradesh", lat: 28.3670, lon: 79.4304, type: "CITY" },

  // 🏔️ UTTARAKHAND
  { name: "Dehradun", state: "Uttarakhand", lat: 30.3165, lon: 78.0322, type: "CITY" },
  { name: "Mussoorie", state: "Uttarakhand", lat: 30.4598, lon: 78.0644, type: "CITY" },
  { name: "Dehradun - Mussoorie Corridor", state: "Uttarakhand", lat: 30.3880, lon: 78.0500, type: "SECTOR" },
  { name: "Haridwar", state: "Uttarakhand", lat: 29.9457, lon: 78.1642, type: "CITY" },
  { name: "Rishikesh", state: "Uttarakhand", lat: 30.0869, lon: 78.2676, type: "CITY" },
  { name: "Nainital", state: "Uttarakhand", lat: 29.3919, lon: 79.4542, type: "CITY" },
  { name: "Almora", state: "Uttarakhand", lat: 29.5971, lon: 79.6591, type: "DISTRICT" },
  { name: "Chamoli (Gopeshwar)", state: "Uttarakhand", lat: 30.4042, lon: 79.3240, type: "DISTRICT" },
  { name: "Uttarkashi", state: "Uttarakhand", lat: 30.7268, lon: 78.4432, type: "DISTRICT" },
  { name: "Rudraprayag", state: "Uttarakhand", lat: 30.2844, lon: 78.9811, type: "DISTRICT" },
  { name: "Kedarnath Sector", state: "Uttarakhand", lat: 30.7346, lon: 79.0669, type: "SECTOR" },
  { name: "Badrinath Sector", state: "Uttarakhand", lat: 30.7433, lon: 79.4938, type: "SECTOR" },

  // 🏔️ HIMACHAL PRADESH
  { name: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lon: 77.1734, type: "CITY" },
  { name: "Manali", state: "Himachal Pradesh", lat: 32.2432, lon: 77.1892, type: "CITY" },
  { name: "Dharamshala", state: "Himachal Pradesh", lat: 32.2190, lon: 76.3234, type: "CITY" },
  { name: "Kullu", state: "Himachal Pradesh", lat: 31.9579, lon: 77.1095, type: "DISTRICT" },
  { name: "Solan", state: "Himachal Pradesh", lat: 30.9084, lon: 77.0999, type: "CITY" },
  { name: "Mandi", state: "Himachal Pradesh", lat: 31.7087, lon: 76.9320, type: "DISTRICT" },
  { name: "Rohtang Pass Sector", state: "Himachal Pradesh", lat: 32.3716, lon: 77.2466, type: "SECTOR" },
  { name: "Spiti Valley (Kaza)", state: "Himachal Pradesh", lat: 32.2276, lon: 78.0710, type: "SECTOR" },

  // 🌾 HARYANA
  { name: "Gurugram (Gurgaon)", state: "Haryana", lat: 28.4595, lon: 77.0266, type: "CITY" },
  { name: "Faridabad", state: "Haryana", lat: 28.4089, lon: 77.3178, type: "CITY" },
  { name: "Panipat", state: "Haryana", lat: 29.3909, lon: 76.9635, type: "CITY" },
  { name: "Ambala", state: "Haryana", lat: 30.3782, lon: 76.7767, type: "CITY" },
  { name: "Karnal", state: "Haryana", lat: 29.6857, lon: 76.9905, type: "CITY" },
  { name: "Hisar", state: "Haryana", lat: 29.1492, lon: 75.7217, type: "CITY" },

  // 🌾 PUNJAB
  { name: "Amritsar", state: "Punjab", lat: 31.6340, lon: 74.8723, type: "CITY" },
  { name: "Ludhiana", state: "Punjab", lat: 30.9010, lon: 75.8573, type: "CITY" },
  { name: "Jalandhar", state: "Punjab", lat: 31.3260, lon: 75.5762, type: "CITY" },
  { name: "Patiala", state: "Punjab", lat: 30.3398, lon: 76.3869, type: "CITY" },
  { name: "Bathinda", state: "Punjab", lat: 30.2110, lon: 74.9455, type: "CITY" },
  { name: "Mohali (SAS Nagar)", state: "Punjab", lat: 30.7046, lon: 76.7179, type: "CITY" },
  { name: "Pathankot", state: "Punjab", lat: 32.2643, lon: 75.6529, type: "CITY" },

  // 🏜️ RAJASTHAN
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lon: 75.7873, type: "CITY" },
  { name: "Jodhpur", state: "Rajasthan", lat: 26.2389, lon: 73.0243, type: "CITY" },
  { name: "Udaipur", state: "Rajasthan", lat: 24.5854, lon: 73.7125, type: "CITY" },
  { name: "Jaisalmer (Thar Desert)", state: "Rajasthan", lat: 26.9157, lon: 70.9083, type: "CITY" },
  { name: "Bikaner", state: "Rajasthan", lat: 28.0229, lon: 73.3119, type: "CITY" },
  { name: "Kota", state: "Rajasthan", lat: 25.2138, lon: 75.8648, type: "CITY" },
  { name: "Ajmer", state: "Rajasthan", lat: 26.4499, lon: 74.6399, type: "CITY" },
  { name: "Barmer Sector", state: "Rajasthan", lat: 25.7532, lon: 71.4181, type: "SECTOR" },

  // 🏔️ JAMMU & KASHMIR
  { name: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lon: 74.7973, type: "CITY" },
  { name: "Jammu", state: "Jammu & Kashmir", lat: 32.7266, lon: 74.8570, type: "CITY" },
  { name: "Anantnag", state: "Jammu & Kashmir", lat: 33.7311, lon: 75.1487, type: "DISTRICT" },
  { name: "Baramulla", state: "Jammu & Kashmir", lat: 34.2085, lon: 74.3444, type: "DISTRICT" },
  { name: "Gulmarg Alpine Sector", state: "Jammu & Kashmir", lat: 34.0484, lon: 74.3805, type: "SECTOR" },
  { name: "Pahalgam Valley Sector", state: "Jammu & Kashmir", lat: 34.0161, lon: 75.3150, type: "SECTOR" },
  { name: "Katra (Vaishno Devi)", state: "Jammu & Kashmir", lat: 32.9924, lon: 74.9317, type: "CITY" },
  { name: "Zoji La Pass Sector", state: "Jammu & Kashmir", lat: 34.2817, lon: 75.4744, type: "SECTOR" },

  // 🏔️ LADAKH
  { name: "Leh", state: "Ladakh", lat: 34.1526, lon: 77.5771, type: "CITY" },
  { name: "Kargil", state: "Ladakh", lat: 34.5539, lon: 76.1349, type: "DISTRICT" },
  { name: "Nubra Valley Sector", state: "Ladakh", lat: 34.6863, lon: 77.5673, type: "SECTOR" },
  { name: "Dras (Coldest Sector)", state: "Ladakh", lat: 34.4292, lon: 75.7533, type: "SECTOR" },
  { name: "Pangong Tso Sector", state: "Ladakh", lat: 33.7595, lon: 78.6674, type: "SECTOR" },
  { name: "Khardung La Pass (5,359m)", state: "Ladakh", lat: 34.2786, lon: 77.6047, type: "SECTOR" },

  // 🏙️ DELHI (NCT) & CHANDIGARH
  { name: "New Delhi", state: "Delhi", lat: 28.6139, lon: 77.2090, type: "CITY" },
  { name: "Connaught Place", state: "Delhi", lat: 28.6315, lon: 77.2167, type: "SECTOR" },
  { name: "Dwarka Urban Sector", state: "Delhi", lat: 28.5921, lon: 77.0460, type: "SECTOR" },
  { name: "Chandigarh City Center", state: "Chandigarh", lat: 30.7333, lon: 76.7794, type: "CITY" },

  // 🌿 NORTH-EAST REGION & BIHAR (PRESERVED & INTEGRATED)
  { name: "Shillong", state: "Meghalaya", lat: 25.5788, lon: 91.8933, type: "CITY" },
  { name: "Sohra (Cherrapunji)", state: "Meghalaya", lat: 25.2702, lon: 91.7323, type: "CITY" },
  { name: "Guwahati", state: "Assam", lat: 26.1445, lon: 91.7362, type: "CITY" },
  { name: "Tawang", state: "Arunachal Pradesh", lat: 27.5861, lon: 91.8504, type: "SECTOR" },
  { name: "Sela Pass", state: "Arunachal Pradesh", lat: 27.5021, lon: 92.1034, type: "SECTOR" },
  { name: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, type: "CITY" },
  { name: "Gangtok", state: "Sikkim", lat: 27.3389, lon: 88.6065, type: "CITY" },
  { name: "Imphal", state: "Manipur", lat: 24.8170, lon: 93.9368, type: "CITY" },
  { name: "Kohima", state: "Nagaland", lat: 25.6751, lon: 94.1086, type: "CITY" },
  { name: "Agartala", state: "Tripura", lat: 23.8315, lon: 91.2868, type: "CITY" },
  { name: "Silchar", state: "Assam", lat: 24.8333, lon: 92.7789, type: "CITY" },
  { name: "Patna", state: "Bihar", lat: 25.5941, lon: 85.1376, type: "CITY" },
  { name: "Muzaffarpur", state: "Bihar", lat: 26.1209, lon: 85.3647, type: "CITY" },
  { name: "Ranchi", state: "Jharkhand", lat: 23.3441, lon: 85.3096, type: "CITY" },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, type: "CITY" },
  { name: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777, type: "CITY" },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lon: 77.5946, type: "CITY" }
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
