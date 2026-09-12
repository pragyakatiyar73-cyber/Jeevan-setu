/**
 * 📍 Master Geographic Data Boundary for Jeevan Setu
 * Single Source of Truth for North Eastern Region (NER) Data Scoping
 * 
 * Core Project Area: Strictly 8 States
 * 1. Arunachal Pradesh
 * 2. Assam
 * 3. Manipur
 * 4. Meghalaya
 * 5. Mizoram
 * 6. Nagaland
 * 7. Sikkim
 * 8. Tripura
 */

export const NER_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
] as const;

export type NERStateName = typeof NER_STATES[number];

export const NER_COVERAGE_LABEL = "Data Coverage: North Eastern Region — 8 States";

/**
 * Bounds for Leaflet map camera framing [[South, West], [North, East]]
 */
export const NER_BOUNDS: [[number, number], [number, number]] = [
  [21.8, 87.8], // Southwest corner (South Mizoram/Tripura & West Sikkim)
  [29.6, 97.5]  // Northeast corner (North Arunachal Pradesh)
];

/**
 * Master NER Geographic Boundary Polygon (latitude, longitude pairs)
 * Encloses the entire North Eastern Region of India (8 States).
 */
export const MASTER_NER_POLYGON: Array<[number, number]> = [
  [28.2, 88.0], // Sikkim Northwest tip
  [28.1, 88.9], // Sikkim Northeast tip
  [27.3, 88.9], // Sikkim South edge
  [27.0, 89.8], // West Bengal / Bhutan / Assam junction
  [27.4, 91.6], // Arunachal Pradesh Tawang sector
  [28.0, 92.5], // Arunachal North
  [29.3, 94.5], // Arunachal North (Siang / Dibang)
  [29.5, 96.5], // Arunachal Northeast tip (Anjaw / Kibithu)
  [28.2, 97.4], // Arunachal East tip
  [27.0, 96.5], // Arunachal / Nagaland East border
  [26.2, 95.3], // Nagaland East border (Myanmar boundary)
  [25.2, 94.8], // Manipur East border
  [24.2, 94.4], // Manipur South border
  [23.2, 93.4], // Mizoram East border
  [21.9, 92.8], // Mizoram Southernmost tip (Lawngtlai)
  [22.4, 92.2], // Mizoram Southwest border
  [23.0, 91.2], // Tripura South tip (Sabroom)
  [24.1, 91.1], // Tripura West border
  [24.9, 91.8], // Meghalaya South border (Sylhet boundary)
  [25.2, 89.8], // Meghalaya West tip (Garo Hills)
  [26.1, 89.7], // Assam Southwest border (Dhubri)
  [26.6, 88.5], // Siliguri Corridor link to Sikkim
  [27.2, 88.0]  // West Sikkim tip
];

/**
 * Ray-casting algorithm to test if a point (lat, lon) lies inside the NER boundary.
 */
export function isPointInNER(lat: number, lon: number): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    return false;
  }

  // Bounding box pre-filter for instant rejection
  if (lat < 21.8 || lat > 29.6 || lon < 87.8 || lon > 97.5) {
    return false;
  }

  const poly = MASTER_NER_POLYGON;
  let inside = false;
  
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];

    const intersect = ((yi > lon) !== (yj > lon)) &&
        (lat < (xj - xi) * (lon - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Validates if a state name is one of the official 8 NER states.
 */
export function isNERState(stateName?: string): boolean {
  if (!stateName) return false;
  const normalized = stateName.trim().toLowerCase();
  return NER_STATES.some(s => s.toLowerCase() === normalized);
}

export interface LocationValidationResult {
  isValid: boolean;
  reason?: string;
  normalizedState?: NERStateName;
}

/**
 * Validates a location record against NER geographic bounds & state name requirements.
 */
export function validateNERLocation(
  lat?: number,
  lon?: number,
  state?: string,
  district?: string
): LocationValidationResult {
  if (lat === undefined || lon === undefined || isNaN(Number(lat)) || isNaN(Number(lon))) {
    return { isValid: false, reason: "Missing or invalid latitude/longitude coordinates." };
  }

  const numLat = Number(lat);
  const numLon = Number(lon);

  if (!isPointInNER(numLat, numLon)) {
    return {
      isValid: false,
      reason: `Coordinates (${numLat}, ${numLon}) lie outside the 8 North Eastern Region (NER) states.`
    };
  }

  if (state && !isNERState(state)) {
    return {
      isValid: false,
      reason: `State '${state}' is not one of the 8 NER states.`
    };
  }

  const matchedState = NER_STATES.find(s => s.toLowerCase() === (state || '').trim().toLowerCase());

  return {
    isValid: true,
    normalizedState: matchedState
  };
}
