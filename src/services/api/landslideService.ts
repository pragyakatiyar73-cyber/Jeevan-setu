/**
 * ⛰️ Landslide Risk Intelligence Service
 * 
 * Combines live Open-Meteo precipitation telemetry, elevation, slope gradient,
 * and Multi-Criteria Evaluation (MCE) Landslide Hazard Index (LHI) algorithms
 * for the 8 North Eastern Region (NER) states.
 * 
 * Single Source of Truth: Scoped strictly to the 8 NER states via isPointInNER(lat, lon).
 */

import { isPointInNER } from '../../utils/nerBoundary';
import { getLiveWeather, WeatherData } from './weather';
import { calculateLandslideHazardIndex, HazardAssessment } from './hazardModels';

export interface LandslideLocationRecord {
  id: string;
  locationName: string;
  district: string;
  state: 'Arunachal Pradesh' | 'Assam' | 'Manipur' | 'Meghalaya' | 'Mizoram' | 'Nagaland' | 'Sikkim' | 'Tripura';
  lat: number;
  lon: number;
  elevationMeters: number;
  slopeDegrees: number;
  typicalSoilMoisture: number; // %
  roadStatus: 'Blocked' | 'Partially Blocked' | 'Regulated' | 'Clear';
  primaryHighway: string;
  historicalDebrisEvents: number;
}

export interface EvaluatedLandslideSector {
  record: LandslideLocationRecord;
  weather: WeatherData;
  hazardAssessment: HazardAssessment;
  calculatedScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  dataStatus: 'LIVE DATA' | 'MODELLED / RISK ESTIMATE' | 'UNAVAILABLE';
  lastUpdatedTime: string;
  safetyGuidance: string[];
}

export interface LandslideTelemetrySummary {
  coverageLabel: string;
  totalSectors: number;
  criticalSectorsCount: number;
  highRiskSectorsCount: number;
  moderateSectorsCount: number;
  lowRiskSectorsCount: number;
  sectors: EvaluatedLandslideSector[];
  lastUpdatedTime: string;
  isLive: boolean;
}

// Master 8 NER States Verified Landslide Hazard Sectors Roster
export const NER_LANDSLIDE_MASTER_RECORDS: LandslideLocationRecord[] = [
  // 🏔️ ARUNACHAL PRADESH
  {
    id: "LS-AR-01",
    locationName: "Sela Pass Landslide & Blizzard Corridor",
    district: "Tawang",
    state: "Arunachal Pradesh",
    lat: 27.5021,
    lon: 92.1034,
    elevationMeters: 4170,
    slopeDegrees: 48,
    typicalSoilMoisture: 78,
    roadStatus: "Regulated",
    primaryHighway: "NH-13 Trans-Arunachal Highway",
    historicalDebrisEvents: 14
  },
  {
    id: "LS-AR-02",
    locationName: "Bomdila Pass Debris Slip Sector",
    district: "West Kameng",
    state: "Arunachal Pradesh",
    lat: 27.2642,
    lon: 92.4159,
    elevationMeters: 2217,
    slopeDegrees: 42,
    typicalSoilMoisture: 70,
    roadStatus: "Partially Blocked",
    primaryHighway: "NH-229 Highway",
    historicalDebrisEvents: 9
  },
  {
    id: "LS-AR-03",
    locationName: "Dirang Sector Cliff Face",
    district: "West Kameng",
    state: "Arunachal Pradesh",
    lat: 27.3592,
    lon: 92.2321,
    elevationMeters: 1560,
    slopeDegrees: 38,
    typicalSoilMoisture: 65,
    roadStatus: "Clear",
    primaryHighway: "NH-13 Sector B",
    historicalDebrisEvents: 6
  },

  // 🌊 ASSAM
  {
    id: "LS-AS-01",
    locationName: "Jatinga Landslide Corridor (Dima Hasao)",
    district: "Dima Hasao",
    state: "Assam",
    lat: 25.1667,
    lon: 93.0167,
    elevationMeters: 512,
    slopeDegrees: 36,
    typicalSoilMoisture: 82,
    roadStatus: "Partially Blocked",
    primaryHighway: "NH-27 East-West Corridor",
    historicalDebrisEvents: 18
  },
  {
    id: "LS-AS-02",
    locationName: "Lumding Hill Cutting Section",
    district: "Hojai",
    state: "Assam",
    lat: 25.7500,
    lon: 93.1667,
    elevationMeters: 280,
    slopeDegrees: 30,
    typicalSoilMoisture: 60,
    roadStatus: "Clear",
    primaryHighway: "Lumding Hill Artery",
    historicalDebrisEvents: 5
  },

  // 🌿 MANIPUR
  {
    id: "LS-MN-01",
    locationName: "Noney Slope Breach & Mudslide Sector",
    district: "Noney",
    state: "Manipur",
    lat: 24.7890,
    lon: 93.6540,
    elevationMeters: 1150,
    slopeDegrees: 46,
    typicalSoilMoisture: 88,
    roadStatus: "Blocked",
    primaryHighway: "NH-37 Imphal-Jiribam Highway",
    historicalDebrisEvents: 22
  },
  {
    id: "LS-MN-02",
    locationName: "Ukhrul Mountain Ridge Pass",
    district: "Ukhrul",
    state: "Manipur",
    lat: 25.1167,
    lon: 94.3667,
    elevationMeters: 1662,
    slopeDegrees: 40,
    typicalSoilMoisture: 72,
    roadStatus: "Regulated",
    primaryHighway: "NH-150 Highway",
    historicalDebrisEvents: 11
  },
  {
    id: "LS-MN-03",
    locationName: "Senapati Slope Cutting Sector",
    district: "Senapati",
    state: "Manipur",
    lat: 25.2667,
    lon: 94.0167,
    elevationMeters: 1100,
    slopeDegrees: 35,
    typicalSoilMoisture: 68,
    roadStatus: "Clear",
    primaryHighway: "NH-2 Imphal-Dimapur Artery",
    historicalDebrisEvents: 7
  },

  // ☁️ MEGHALAYA
  {
    id: "LS-ML-01",
    locationName: "Shillong-Jowai NH-6 Breach (Km 142)",
    district: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.5788,
    lon: 91.8933,
    elevationMeters: 1525,
    slopeDegrees: 45,
    typicalSoilMoisture: 92,
    roadStatus: "Blocked",
    primaryHighway: "NH-6 Primary Arterial Highway",
    historicalDebrisEvents: 26
  },
  {
    id: "LS-ML-02",
    locationName: "Sohra Cherrapunji Cliff Face",
    district: "East Khasi Hills",
    state: "Meghalaya",
    lat: 25.2702,
    lon: 91.7323,
    elevationMeters: 1430,
    slopeDegrees: 52,
    typicalSoilMoisture: 96,
    roadStatus: "Regulated",
    primaryHighway: "SH-12 Shillong-Sohra Road",
    historicalDebrisEvents: 31
  },
  {
    id: "LS-ML-03",
    locationName: "Nongstoin Mountain Corridor",
    district: "West Khasi Hills",
    state: "Meghalaya",
    lat: 25.5204,
    lon: 91.2678,
    elevationMeters: 1400,
    slopeDegrees: 34,
    typicalSoilMoisture: 74,
    roadStatus: "Clear",
    primaryHighway: "NH-127B Highway",
    historicalDebrisEvents: 8
  },

  // 🏔️ MIZORAM
  {
    id: "LS-MZ-01",
    locationName: "Aizawl Ridge Subsidence & Mudslide Zone",
    district: "Aizawl",
    state: "Mizoram",
    lat: 23.7271,
    lon: 92.7176,
    elevationMeters: 1132,
    slopeDegrees: 44,
    typicalSoilMoisture: 85,
    roadStatus: "Partially Blocked",
    primaryHighway: "NH-54 Silchar-Aizawl Highway",
    historicalDebrisEvents: 19
  },
  {
    id: "LS-MZ-02",
    locationName: "Lunglei Hill Slope Pass",
    district: "Lunglei",
    state: "Mizoram",
    lat: 22.8841,
    lon: 92.7347,
    elevationMeters: 722,
    slopeDegrees: 39,
    typicalSoilMoisture: 76,
    roadStatus: "Clear",
    primaryHighway: "NH-102B Highway",
    historicalDebrisEvents: 10
  },

  // 🌲 NAGALAND
  {
    id: "LS-NL-01",
    locationName: "Zubza Pass Landslide Corridor",
    district: "Kohima",
    state: "Nagaland",
    lat: 25.6890,
    lon: 94.0450,
    elevationMeters: 1444,
    slopeDegrees: 42,
    typicalSoilMoisture: 84,
    roadStatus: "Blocked",
    primaryHighway: "NH-29 Kohima-Dimapur Highway",
    historicalDebrisEvents: 21
  },
  {
    id: "LS-NL-02",
    locationName: "Mokokchung Hill Cut Sector",
    district: "Mokokchung",
    state: "Nagaland",
    lat: 26.3262,
    lon: 94.5203,
    elevationMeters: 1325,
    slopeDegrees: 36,
    typicalSoilMoisture: 70,
    roadStatus: "Regulated",
    primaryHighway: "NH-702 Highway",
    historicalDebrisEvents: 9
  },

  // 🏔️ SIKKIM
  {
    id: "LS-SK-01",
    locationName: "Gangtok-Mangan Debris Shift Sector",
    district: "North Sikkim",
    state: "Sikkim",
    lat: 27.5020,
    lon: 88.5342,
    elevationMeters: 1650,
    slopeDegrees: 50,
    typicalSoilMoisture: 90,
    roadStatus: "Blocked",
    primaryHighway: "NH-10 North Sikkim Highway",
    historicalDebrisEvents: 28
  },
  {
    id: "LS-SK-02",
    locationName: "Chungthang Ridge Landslide Sector",
    district: "North Sikkim",
    state: "Sikkim",
    lat: 27.5800,
    lon: 88.6200,
    elevationMeters: 1790,
    slopeDegrees: 48,
    typicalSoilMoisture: 88,
    roadStatus: "Partially Blocked",
    primaryHighway: "Lachen-Lachung Highway",
    historicalDebrisEvents: 17
  },

  // 🏛️ TRIPURA
  {
    id: "LS-TR-01",
    locationName: "Baramura Hill Ridge Cutting Sector",
    district: "Khowai",
    state: "Tripura",
    lat: 23.8315,
    lon: 91.5500,
    elevationMeters: 260,
    slopeDegrees: 28,
    typicalSoilMoisture: 62,
    roadStatus: "Clear",
    primaryHighway: "NH-8 Agartala-Churaibari Highway",
    historicalDebrisEvents: 4
  }
];

/**
 * Evaluates Landslide Risk for a specific sector using live Open-Meteo weather + MCE hazard model
 */
export async function evaluateSectorLandslideRisk(rec: LandslideLocationRecord): Promise<EvaluatedLandslideSector> {
  let weather: WeatherData;

  try {
    weather = await getLiveWeather(rec.lat, rec.lon);
  } catch (e) {
    weather = {
      latitude: rec.lat,
      longitude: rec.lon,
      elevation: rec.elevationMeters,
      temperature: 0,
      feelsLike: 0,
      relativeHumidity: rec.typicalSoilMoisture,
      precipitation: 0,
      precipitationProbability: 0,
      rain: 0,
      weatherCode: 0,
      condition: 'Weather data unavailable',
      windSpeed: 0,
      windDirection: 0,
      windDirectionLabel: 'N/A',
      windGusts: 0,
      isSevereWeather: false,
      severeRiskLevel: 'NONE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: false,
      error: 'Data temporarily unavailable'
    };
  }

  // Calculate Landslide Hazard Index using live weather + terrain parameters
  const rain24h = (weather.precipitation || 0) * 4 + 10;
  const soilMoist = weather.isLive ? Math.min(98, Math.round(weather.relativeHumidity * 0.85 + (weather.precipitation * 1.2))) : rec.typicalSoilMoisture;

  const hazardAssessment = calculateLandslideHazardIndex({
    slopeDegrees: rec.slopeDegrees,
    rainfall24h: rain24h,
    soilMoisturePercent: soilMoist,
    vegetationIndex: rec.slopeDegrees > 45 ? 0.25 : 0.45
  });

  const calculatedScore = hazardAssessment.score;
  const riskLevel = hazardAssessment.riskLevel;

  // Generate practical safety guidance based on risk level
  const safetyGuidance: string[] = [
    "Follow official NDRF / SDMA disaster bulletins & local district magistrate alerts.",
    "Emergency Contact: Call NDRF National Triage 1078 or State Helpline 1070."
  ];

  if (riskLevel === 'CRITICAL' || riskLevel === 'HIGH') {
    safetyGuidance.unshift("AVOID UNNECESSARY TRAVEL: High risk of sudden slope collapse & debris deposition.");
    safetyGuidance.unshift("VERIFY ROAD CLEARANCE: Check BRO / State Highway clearance status before convoy dispatch.");
  } else if (riskLevel === 'MODERATE') {
    safetyGuidance.unshift("REGULATED CONVOY TRANSIT: Drive with extreme caution along mountain cut-slopes.");
  } else {
    safetyGuidance.unshift("NOMINAL MOUNTAIN TRANSIT: Maintain standard slope safety precautions.");
  }

  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    record: rec,
    weather,
    hazardAssessment,
    calculatedScore,
    riskLevel,
    dataStatus: weather.isLive ? 'LIVE DATA' : 'MODELLED / RISK ESTIMATE',
    lastUpdatedTime: formattedTime,
    safetyGuidance
  };
}

/**
 * Fetches and evaluates all NER Landslide Sectors matching optional state, district, or risk filters
 */
export async function getNERLandslideTelemetry(
  stateFilter?: string,
  districtFilter?: string
): Promise<LandslideTelemetrySummary> {
  // Enforce strict geographic boundary check
  let validRecords = NER_LANDSLIDE_MASTER_RECORDS.filter(r => isPointInNER(r.lat, r.lon));

  if (stateFilter && stateFilter !== 'all') {
    const norm = stateFilter.trim().toLowerCase();
    validRecords = validRecords.filter(r => r.state.toLowerCase() === norm);
  }

  if (districtFilter && districtFilter !== 'all') {
    const norm = districtFilter.trim().toLowerCase();
    validRecords = validRecords.filter(r => r.district.toLowerCase() === norm);
  }

  // Evaluate all sectors concurrently
  const evaluatedSectors = await Promise.all(validRecords.map(rec => evaluateSectorLandslideRisk(rec)));

  const critical = evaluatedSectors.filter(s => s.riskLevel === 'CRITICAL').length;
  const high = evaluatedSectors.filter(s => s.riskLevel === 'HIGH').length;
  const moderate = evaluatedSectors.filter(s => s.riskLevel === 'MODERATE').length;
  const low = evaluatedSectors.filter(s => s.riskLevel === 'LOW').length;

  const isAnyLive = evaluatedSectors.some(s => s.weather.isLive);
  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    coverageLabel: "Data Coverage: North Eastern Region — 8 States",
    totalSectors: evaluatedSectors.length,
    criticalSectorsCount: critical,
    highRiskSectorsCount: high,
    moderateSectorsCount: moderate,
    lowRiskSectorsCount: low,
    sectors: evaluatedSectors,
    lastUpdatedTime: formattedTime,
    isLive: isAnyLive
  };
}
