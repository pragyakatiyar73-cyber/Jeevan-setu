/**
 * 🚁 UAV Drone Dispatcher & Aerial Lifeline Routing API
 * 
 * Provides high-altitude aerial flight path calculations, battery consumption math,
 * mountain wind vector resistance checks, and emergency helipad/LZ catalog.
 */

export interface DroneSpec {
  id: string;
  name: string;
  type: 'HEAVY_LIFELINE' | 'EXPRESS_MEDICAL' | 'RIDGE_SCOUT';
  maxPayloadKg: number;
  maxRangeKm: number;
  maxWindResistanceKmH: number;
  cruiseSpeedKmH: number;
  batteryCapacitymAh: number;
  highAltitudeCapable: boolean;
  status: 'READY' | 'IN_FLIGHT' | 'CHARGING';
}

export interface EmergencyLZ {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  elevationMsl: number;
  type: 'HELIPAD' | 'FIELD_LZ' | 'HOSPITAL_ROOFTOP';
}

export interface DroneFlightPlan {
  feasible: boolean;
  feasibilityStatus: 'FEASIBLE' | 'HIGH_WIND_WARNING' | 'RANGE_EXCEEDED' | 'PAYLOAD_OVERLOAD';
  statusMessage: string;
  distanceKm: number;
  flightDurationMins: number;
  batteryConsumptionPercent: number;
  maxAltitudeMsl: number;
  windSpeedKmH: number;
  windPenaltyPercent: number;
  waypoints: [number, number][];
}

// Pre-configured Sovereign Emergency UAV Fleet
export const NER_DRONE_FLEET: DroneSpec[] = [
  {
    id: 'GARUDA-X15',
    name: 'Garuda-X15 Sovereign Heavy UAV',
    type: 'HEAVY_LIFELINE',
    maxPayloadKg: 18,
    maxRangeKm: 85,
    maxWindResistanceKmH: 55,
    cruiseSpeedKmH: 65,
    batteryCapacitymAh: 24000,
    highAltitudeCapable: true,
    status: 'READY'
  },
  {
    id: 'AIRMEDIC-5',
    name: 'AirMedic-5 Rapid Express Drone',
    type: 'EXPRESS_MEDICAL',
    maxPayloadKg: 8,
    maxRangeKm: 60,
    maxWindResistanceKmH: 45,
    cruiseSpeedKmH: 80,
    batteryCapacitymAh: 16000,
    highAltitudeCapable: true,
    status: 'READY'
  },
  {
    id: 'AEROPEAK-9',
    name: 'AeroPeak-9 Mountain Ridge Scout',
    type: 'RIDGE_SCOUT',
    maxPayloadKg: 5,
    maxRangeKm: 110,
    maxWindResistanceKmH: 65,
    cruiseSpeedKmH: 90,
    batteryCapacitymAh: 20000,
    highAltitudeCapable: true,
    status: 'READY'
  }
];

// Pre-configured Emergency Helipads and Isolated Landing Zones across 8 NER States
export const NER_EMERGENCY_LZS: EmergencyLZ[] = [
  { id: 'LZ-SELA', name: 'Sela Pass Emergency Field LZ (3,500m MSL)', state: 'Arunachal Pradesh', lat: 27.5050, lon: 92.1030, elevationMsl: 3500, type: 'FIELD_LZ' },
  { id: 'LZ-AIZAWL', name: 'Aizawl Civil Hospital Rooftop Helipad', state: 'Mizoram', lat: 23.7271, lon: 92.7176, elevationMsl: 1132, type: 'HOSPITAL_ROOFTOP' },
  { id: 'LZ-MELLI', name: 'Melli Teesta Basin High-Ground Helipad', state: 'Sikkim', lat: 27.0870, lon: 88.4630, elevationMsl: 650, type: 'HELIPAD' },
  { id: 'LZ-SHILLONG', name: 'NEIGRIHMS Shillong Trauma Rooftop', state: 'Meghalaya', lat: 25.5890, lon: 91.9320, elevationMsl: 1525, type: 'HOSPITAL_ROOFTOP' },
  { id: 'LZ-ZUBZA', name: 'Zubza Pass Highland Relief LZ', state: 'Nagaland', lat: 25.6890, lon: 94.0450, elevationMsl: 1400, type: 'FIELD_LZ' },
  { id: 'LZ-SILCHAR', name: 'Silchar Medical College Emergency Pad', state: 'Assam', lat: 24.8333, lon: 92.7789, elevationMsl: 35, type: 'HELIPAD' }
];

/**
 * Calculates Haversine distance in Km between two coordinates
 */
export function calculateHaversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * High-Altitude Drone Flight Plan & Feasibility Engine
 */
export function calculateDroneFlightPlan(
  startLat: number,
  startLon: number,
  destLZ: EmergencyLZ,
  payloadKg: number,
  windSpeedKmH: number,
  droneId: string = 'GARUDA-X15'
): DroneFlightPlan {
  const drone = NER_DRONE_FLEET.find(d => d.id === droneId) || NER_DRONE_FLEET[0];
  const directDist = calculateHaversineDistance(startLat, startLon, destLZ.lat, destLZ.lon);

  // Payload check
  if (payloadKg > drone.maxPayloadKg) {
    return {
      feasible: false,
      feasibilityStatus: 'PAYLOAD_OVERLOAD',
      statusMessage: `Payload (${payloadKg}kg) exceeds max capacity (${drone.maxPayloadKg}kg) of ${drone.name}`,
      distanceKm: directDist,
      flightDurationMins: 0,
      batteryConsumptionPercent: 0,
      maxAltitudeMsl: destLZ.elevationMsl,
      windSpeedKmH,
      windPenaltyPercent: 0,
      waypoints: [[startLat, startLon], [destLZ.lat, destLZ.lon]]
    };
  }

  // Range check (Round trip or one-way with 25% battery safety margin)
  const requiredRange = directDist * 1.25;
  if (requiredRange > drone.maxRangeKm) {
    return {
      feasible: false,
      feasibilityStatus: 'RANGE_EXCEEDED',
      statusMessage: `Flight distance (${directDist}km) exceeds operating radius of ${drone.name} (${drone.maxRangeKm}km)`,
      distanceKm: directDist,
      flightDurationMins: 0,
      batteryConsumptionPercent: 100,
      maxAltitudeMsl: destLZ.elevationMsl,
      windSpeedKmH,
      windPenaltyPercent: 0,
      waypoints: [[startLat, startLon], [destLZ.lat, destLZ.lon]]
    };
  }

  // Wind speed check
  const windPenaltyPercent = Math.min(50, Math.round((windSpeedKmH / drone.maxWindResistanceKmH) * 30));
  let feasibilityStatus: DroneFlightPlan['feasibilityStatus'] = 'FEASIBLE';
  let statusMessage = `🟢 Aerial Corridor Clear. Safe flight for ${drone.name}.`;

  if (windSpeedKmH > drone.maxWindResistanceKmH) {
    feasibilityStatus = 'HIGH_WIND_WARNING';
    statusMessage = `⚠️ High Mountain Wind Warning (${windSpeedKmH} km/h). Severe turbulence expected above 2,000m MSL.`;
  }

  const effectiveSpeed = Math.max(25, drone.cruiseSpeedKmH - (windSpeedKmH * 0.4));
  const flightDurationMins = Math.round((directDist / effectiveSpeed) * 60);

  // Battery consumption formula
  const payloadFactor = 1 + (payloadKg / drone.maxPayloadKg) * 0.4;
  const batteryConsumptionPercent = Math.min(
    100,
    Math.round((directDist / drone.maxRangeKm) * 100 * payloadFactor + (windPenaltyPercent * 0.5))
  );

  // Generate 5 mid-flight waypoints over mountain ridges
  const waypoints: [number, number][] = [
    [startLat, startLon],
    [startLat + (destLZ.lat - startLat) * 0.25, startLon + (destLZ.lon - startLon) * 0.25],
    [startLat + (destLZ.lat - startLat) * 0.50, startLon + (destLZ.lon - startLon) * 0.50],
    [startLat + (destLZ.lat - startLat) * 0.75, startLon + (destLZ.lon - startLon) * 0.75],
    [destLZ.lat, destLZ.lon]
  ];

  return {
    feasible: feasibilityStatus === 'FEASIBLE' || feasibilityStatus === 'HIGH_WIND_WARNING',
    feasibilityStatus,
    statusMessage,
    distanceKm: directDist,
    flightDurationMins,
    batteryConsumptionPercent,
    maxAltitudeMsl: Math.max(1200, destLZ.elevationMsl + 150),
    windSpeedKmH,
    windPenaltyPercent,
    waypoints
  };
}
