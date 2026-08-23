/**
 * 🔍 Geocoding & Emergency Routing API Client (Category 4: Nominatim + OSRM)
 * 
 * Provides Indian address search, reverse geocoding, and turn-by-turn emergency routing
 * with dynamic disaster zone avoidance.
 */

export interface GeocodingResult {
  placeId: number;
  displayName: string;
  lat: number;
  lon: number;
  type: string;
  importance: number;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name: string;
}

export interface EmergencyRouteResult {
  distanceKm: number;
  durationMinutes: number;
  geometry: [number, number][]; // [lat, lon] coordinates array
  steps: RouteStep[];
  isDisasterEvaded: boolean;
  warnings: string[];
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

/**
 * Searches Indian addresses, villages, and PIN codes via Nominatim
 */
export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  try {
    const url = new URL(`${NOMINATIM_BASE}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('countrycodes', 'in'); // Prioritize India
    url.searchParams.set('limit', '5');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JeevanSetuDisasterManagementApp/1.0'
      }
    });

    if (!res.ok) throw new Error(`Nominatim HTTP error: ${res.status}`);

    const data = await res.json();
    return data.map((item: any) => ({
      placeId: item.place_id,
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));
  } catch (err) {
    console.error('Nominatim search failed:', err);
    return [];
  }
}

/**
 * Reverse geocodes [lat, lon] into readable Indian landmark/district
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('format', 'json');

    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JeevanSetuDisasterManagementApp/1.0'
      }
    });

    if (!res.ok) return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/**
 * Calculates emergency route between Start and End coordinates using OSRM,
 * with optional waypoint avoidance around disaster clusters.
 */
export async function calculateEmergencyRoute(
  start: [number, number], // [lat, lon]
  end: [number, number],   // [lat, lon]
  avoidPoints: [number, number][] = []
): Promise<EmergencyRouteResult> {
  try {
    // Format: lon,lat;lon,lat
    let coordinatesString = `${start[1]},${start[0]}`;
    
    // Inject evasion waypoints if disaster zones exist along straight trajectory
    if (avoidPoints.length > 0) {
      for (const pt of avoidPoints) {
        // Offset waypoint slightly to bypass obstacle
        const detourLon = pt[1] + 0.03;
        const detourLat = pt[0] + 0.03;
        coordinatesString += `;${detourLon},${detourLat}`;
      }
    }
    
    coordinatesString += `;${end[1]},${end[0]}`;

    const url = `${OSRM_BASE}/route/v1/driving/${coordinatesString}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    
    if (!res.ok) throw new Error(`OSRM HTTP error: ${res.status}`);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No route found');
    }

    const route = data.routes[0];
    const coordinates: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

    const steps: RouteStep[] = [];
    if (route.legs) {
      for (const leg of route.legs) {
        for (const s of leg.steps || []) {
          steps.push({
            instruction: s.maneuver?.instruction || s.name || 'Proceed on route',
            distanceMeters: s.distance,
            durationSeconds: s.duration,
            name: s.name
          });
        }
      }
    }

    return {
      distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
      durationMinutes: Math.round(route.duration / 60),
      geometry: coordinates,
      steps,
      isDisasterEvaded: avoidPoints.length > 0,
      warnings: avoidPoints.length > 0 ? ['Route has been rerouted around active disaster danger zones.'] : []
    };
  } catch (err) {
    console.error('OSRM route calculation failed, fallback to direct vector:', err);
    return {
      distanceKm: 0,
      durationMinutes: 0,
      geometry: [start, end],
      steps: [{ instruction: 'Direct vector path', distanceMeters: 0, durationSeconds: 0, name: 'Direct' }],
      isDisasterEvaded: false,
      warnings: ['Could not calculate turn-by-turn road network, showing direct vector corridor.']
    };
  }
}
