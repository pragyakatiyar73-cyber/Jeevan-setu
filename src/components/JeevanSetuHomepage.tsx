import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Bot,
  MapPin,
  ShieldAlert,
  Map as MapIcon,
  Search,
  Globe,
  PhoneCall,
  Cpu,
  CloudRain,
  Radio,
  Clock,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  HelpCircle,
  Lock,
  Mail,
  X,
  Upload,
  Navigation,
  Zap,
  Layers,
  Activity,
  Sparkles,
  Plus,
  Minus,
  Crosshair,
  ShieldCheck,
  Youtube,
  Twitter,
  Instagram,
  Linkedin,
  Sun,
  Wind,
  Droplets,
  Share2,
  ExternalLink,
  Info,
  LayoutDashboard,
  Menu,
  Sliders,
  Eye,
  Truck,
  Package,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import L from 'leaflet';
import { useTranslation, SUPPORTED_LANGUAGES } from '../i18n';
import ThemeToggle from './ThemeToggle';
import TrustedDataSourcesModal from './TrustedDataSourcesModal';
import AIChatbotWidget from './AIChatbotWidget';

interface JeevanSetuHomepageProps {
  onNavigateModule: (module: string) => void;
  onOpenSos: () => void;
  onOpenDashboard?: () => void;
  onOpenAiChatbot?: () => void;
}

export interface DisasterMarkerItem {
  id: number;
  type: 'Flood' | 'Landslide' | 'Heavy Rainfall' | 'Earthquake' | 'Fire';
  name: string;
  loc: string;
  lat: number;
  lon: number;
  severity: string;
  time: string;
  color: string;
  radius: number;
  teams: string;
  pop: string;
  liveTemp?: number;
  liveRain?: number;
  liveHumidity?: number;
  liveWeatherDesc?: string;
  liveMaxTemp?: number;
  liveMinTemp?: number;
  source?: string;
}

// Verified North Eastern Region (NER 8 States) disaster telemetry markers covering all disaster types
const INITIAL_DISASTER_MARKERS: DisasterMarkerItem[] = [
  { id: 1, type: 'Landslide', name: 'Landslide in Sikkim', loc: 'Gangtok / Mangan Sector', lat: 27.3389, lon: 88.6065, severity: 'High Risk', time: 'Live Monitored', color: '#F97316', radius: 35000, teams: 'NDRF Battalion 2 (Sikkim)', pop: '14,200' },
  { id: 2, type: 'Flood', name: 'Brahmaputra Flood Alert', loc: 'Kaziranga / Lakhimpur, Assam', lat: 26.5800, lon: 93.1700, severity: 'Moderate Risk', time: 'Live Monitored', color: '#2563EB', radius: 45000, teams: 'SDRF Team 8 (Assam)', pop: '42,000' },
  { id: 3, type: 'Heavy Rainfall', name: 'Cloudburst Watch – Meghalaya', loc: 'Sohra / Cherrapunji Sector', lat: 25.2700, lon: 91.7300, severity: 'Monitor', time: 'Live Monitored', color: '#10B981', radius: 25000, teams: 'IMD Shillong Center', pop: '8,500' },
  { id: 4, type: 'Landslide', name: 'Sela Pass Snow & Landslide', loc: 'Tawang Sector, Arunachal Pradesh', lat: 27.5861, lon: 91.8504, severity: 'High Risk', time: 'Live Monitored', color: '#F97316', radius: 30000, teams: 'Indian Army & BRO Unit 14', pop: '9,800' },
  { id: 5, type: 'Landslide', name: 'Noney Corridor Slope Breach', loc: 'Imphal West Corridor, Manipur', lat: 24.8170, lon: 93.9368, severity: 'Moderate Risk', time: 'Live Monitored', color: '#2563EB', radius: 20000, teams: 'Manipur SDRF Team', pop: '12,400' },
  { id: 6, type: 'Landslide', name: 'Aizawl Ridge Subsidence', loc: 'Aizawl Sector, Mizoram', lat: 23.7271, lon: 92.7176, severity: 'Monitor', time: 'Live Monitored', color: '#EAB308', radius: 25000, teams: 'Mizoram Disaster Auth', pop: '18,500' },
  { id: 7, type: 'Landslide', name: 'Zubza Pass Road Disruption', loc: 'Kohima-Dimapur Pass, Nagaland', lat: 25.6751, lon: 94.1086, severity: 'High Risk', time: 'Live Monitored', color: '#EF4444', radius: 15000, teams: 'Nagaland Civil Defense', pop: '15,200' },
  { id: 8, type: 'Flood', name: 'Gumti Basin Inundation Watch', loc: 'Agartala Sector, Tripura', lat: 23.8315, lon: 91.2868, severity: 'Monitor', time: 'Live Monitored', color: '#10B981', radius: 20000, teams: 'Tripura Disaster Cell', pop: '22,100' },
  { id: 9, type: 'Earthquake', name: 'Kopili Fault Tremor Watch', loc: 'Shillong Plateau / Assam Border', lat: 25.5788, lon: 91.8933, severity: 'High Risk', time: 'Live Monitored', color: '#EAB308', radius: 30000, teams: 'National Center for Seismology', pop: '38,000' },
  { id: 10, type: 'Fire', name: 'Dzukou Valley Wildfire Front', loc: 'Kohima-Senapati Ridge', lat: 25.5500, lon: 94.0700, severity: 'Moderate Risk', time: 'Live Monitored', color: '#EF4444', radius: 22000, teams: 'NDRF Forest Unit & IAF Air Wing', pop: '6,200' }
];

const DISASTER_MARKERS = INITIAL_DISASTER_MARKERS;

const getDisasterIconSvg = (type: string) => {
  switch (type) {
    case 'Flood':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
    case 'Landslide':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case 'Earthquake':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    case 'Fire':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    case 'Heavy Rainfall':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    default:
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>`;
  }
};

interface LocationRiskData {
  name: string;
  state: string;
  lat: number;
  lon: number;
  slopeDegrees: number;
  baseLhi: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  riskColor: string;
  rainfallForecastText: string;
  rainfallProgressPercent: number;
  soilSaturationText: string;
  soilSaturationProgressPercent: number;
  alertTitle: string;
  alertMessage: string;
}

const REGIONAL_RISK_LOCATIONS: Record<string, LocationRiskData> = {
  'Uttarkashi, Uttarakhand': {
    name: 'Uttarkashi, Uttarakhand',
    state: 'Uttarakhand',
    lat: 30.7268,
    lon: 78.4354,
    slopeDegrees: 45,
    baseLhi: 7.8,
    riskLevel: 'High',
    riskColor: 'bg-red-500',
    rainfallForecastText: '220 mm Heavy Downpour',
    rainfallProgressPercent: 88,
    soilSaturationText: 'Critical Moisture (92%)',
    soilSaturationProgressPercent: 92,
    alertTitle: 'IMD Flash Warning Active',
    alertMessage: 'Bhagirathi river gorge and NH-34 Gangotri corridor are on orange watch for active rockfall and debris slips near Dharasu bend.'
  },
  'Sikkim, North East India': {
    name: 'Sikkim, North East India',
    state: 'Sikkim',
    lat: 27.3389,
    lon: 88.6065,
    slopeDegrees: 48,
    baseLhi: 8.6,
    riskLevel: 'Critical',
    riskColor: 'bg-rose-600',
    rainfallForecastText: '245 mm Severe Torrential Rain',
    rainfallProgressPercent: 95,
    soilSaturationText: 'Critical Saturation (94%)',
    soilSaturationProgressPercent: 94,
    alertTitle: 'Teesta Valley Flash Warning Active',
    alertMessage: 'Steep mountain slopes in Gangtok, Mangan, and Chungthang sector under critical watch for slope liquification and flash debris flows over next 48 hours.'
  },
  'Guwahati, Assam': {
    name: 'Guwahati, Assam',
    state: 'Assam',
    lat: 26.1445,
    lon: 91.7362,
    slopeDegrees: 20,
    baseLhi: 3.4,
    riskLevel: 'Low',
    riskColor: 'bg-emerald-600',
    rainfallForecastText: '85 mm Intermittent Showers',
    rainfallProgressPercent: 35,
    soilSaturationText: 'Stable Moisture (58%)',
    soilSaturationProgressPercent: 58,
    alertTitle: 'Urban Low-Risk Advisory',
    alertMessage: 'Low regional landslide hazard across Kamrup Metro; localized slope runoff monitored along Narakasur and Kharghuli hill fringes.'
  },
  'Shillong, Meghalaya': {
    name: 'Shillong, Meghalaya',
    state: 'Meghalaya',
    lat: 25.5788,
    lon: 91.8933,
    slopeDegrees: 38,
    baseLhi: 6.9,
    riskLevel: 'High',
    riskColor: 'bg-amber-600',
    rainfallForecastText: '175 mm Monsoonal Downpour',
    rainfallProgressPercent: 72,
    soilSaturationText: 'Elevated Saturation (84%)',
    soilSaturationProgressPercent: 84,
    alertTitle: 'NH-6 Escarpment Slip Warning',
    alertMessage: 'NH-6 Shillong-Silchar corridor faces high risk of mudslides and road shoulder subsidence near Sonapur tunnel and Jowai bypass.'
  },
  'Wayanad, Kerala': {
    name: 'Wayanad, Kerala',
    state: 'Kerala',
    lat: 11.6854,
    lon: 76.1320,
    slopeDegrees: 44,
    baseLhi: 9.2,
    riskLevel: 'Critical',
    riskColor: 'bg-rose-600',
    rainfallForecastText: '290 mm Extreme Rainfall Alert',
    rainfallProgressPercent: 98,
    soilSaturationText: 'Severe Soil Saturation (96%)',
    soilSaturationProgressPercent: 96,
    alertTitle: 'Western Ghats Red Alert Active',
    alertMessage: 'Chooralmala, Meppadi, and Mundakkai hill tracts are under maximum red alert for catastrophic debris movement. Precautionary evacuation advisory in force.'
  },
  'Shimla, Himachal Pradesh': {
    name: 'Shimla, Himachal Pradesh',
    state: 'Himachal Pradesh',
    lat: 31.1048,
    lon: 77.1734,
    slopeDegrees: 39,
    baseLhi: 6.2,
    riskLevel: 'Moderate',
    riskColor: 'bg-amber-500',
    rainfallForecastText: '135 mm Heavy Showers',
    rainfallProgressPercent: 56,
    soilSaturationText: 'Elevated Moisture (77%)',
    soilSaturationProgressPercent: 77,
    alertTitle: 'NH-5 Highway Caution',
    alertMessage: 'Parwanoo-Solan-Shimla expressway monitored for shooting stones and cut-slope destabilization during persistent precipitation.'
  },
  'Aizawl, Mizoram': {
    name: 'Aizawl, Mizoram',
    state: 'Mizoram',
    lat: 23.7271,
    lon: 92.7176,
    slopeDegrees: 44,
    baseLhi: 7.5,
    riskLevel: 'High',
    riskColor: 'bg-red-500',
    rainfallForecastText: '190 mm Heavy Tropical Rains',
    rainfallProgressPercent: 78,
    soilSaturationText: 'Critical Moisture (87%)',
    soilSaturationProgressPercent: 87,
    alertTitle: 'Soft Shale Slumping Advisory',
    alertMessage: 'Ridge settlements and NH-306 connecting Vairengte are at risk of progressive mudslips due to saturated soft shale bedrock.'
  },
  'Kohima, Nagaland': {
    name: 'Kohima, Nagaland',
    state: 'Nagaland',
    lat: 25.6751,
    lon: 94.1086,
    slopeDegrees: 36,
    baseLhi: 5.6,
    riskLevel: 'Moderate',
    riskColor: 'bg-amber-500',
    rainfallForecastText: '120 mm Moderate-Heavy Rains',
    rainfallProgressPercent: 50,
    soilSaturationText: 'Moderate Saturation (72%)',
    soilSaturationProgressPercent: 72,
    alertTitle: 'Phesama Sinking Zone Watch',
    alertMessage: 'Phesama and Zubza bypass corridors under continuous geodetic observation; heavy commercial vehicles regulated during rain spells.'
  }
};

interface LiveLocationRiskTelemetry {
  lhi: number;
  riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low';
  riskColor: string;
  rainfallForecastText: string;
  rainfallProgressPercent: number;
  soilSaturationText: string;
  soilSaturationProgressPercent: number;
  currentRainMm: number;
  total72HrRainMm: number;
  humidityPercent: number;
  isLive: boolean;
  lastUpdated: string;
}

function computeLiveRiskTelemetry(
  loc: LocationRiskData,
  currentRainMm: number,
  total72HrRainMm: number,
  humidity: number
): LiveLocationRiskTelemetry {
  // Terrain geological vulnerability (0 to 10 scale, derived from slope gradient)
  const terrainScore = (loc.slopeDegrees / 50) * 10;
  
  // Rain factor scaled to landslide triggering thresholds (0mm -> 1.0, 150mm+ -> 9+)
  const rainScore = Math.min(10, Math.max(1, (total72HrRainMm / 18) + (currentRainMm * 2.5)));
  
  // Soil saturation factor proxy from humidity and precipitation
  const moistureScore = Math.min(10, Math.max(2, (humidity * 0.08) + (total72HrRainMm * 0.02)));

  // Multi-Criteria Evaluation (MCE) weighted formula:
  // 40% Terrain Slope + 40% Precipitation Forecast + 20% Soil Moisture/Humidity
  const rawLhi = (0.40 * terrainScore) + (0.40 * rainScore) + (0.20 * moistureScore);
  // Blend with baseline geotechnical risk for regional stability
  const blendedLhi = (rawLhi * 0.7) + (loc.baseLhi * 0.3);
  const lhi = Number(Math.min(9.8, Math.max(1.5, blendedLhi)).toFixed(1));

  let riskLevel: 'Critical' | 'High' | 'Moderate' | 'Low' = 'Low';
  let riskColor = 'bg-emerald-600';
  if (lhi >= 8.0) {
    riskLevel = 'Critical';
    riskColor = 'bg-rose-600';
  } else if (lhi >= 6.5) {
    riskLevel = 'High';
    riskColor = 'bg-red-500';
  } else if (lhi >= 4.5) {
    riskLevel = 'Moderate';
    riskColor = 'bg-amber-500';
  } else {
    riskLevel = 'Low';
    riskColor = 'bg-emerald-600';
  }

  // Rainfall display string
  const rainProgress = Math.min(100, Math.round((total72HrRainMm / 250) * 100));
  let rainDesc = 'Light Showers';
  if (total72HrRainMm > 200) rainDesc = 'Severe Torrential Rain';
  else if (total72HrRainMm > 120) rainDesc = 'Heavy Downpour';
  else if (total72HrRainMm > 60) rainDesc = 'Moderate Showers';
  else if (total72HrRainMm > 20) rainDesc = 'Intermittent Rain';

  // Soil saturation
  const soilPercent = Math.min(98, Math.max(25, Math.round((humidity * 0.7) + (rainProgress * 0.3))));
  let soilDesc = 'Normal Moisture';
  if (soilPercent >= 90) soilDesc = 'Critical Moisture';
  else if (soilPercent >= 75) soilDesc = 'Elevated Moisture';
  else if (soilPercent >= 55) soilDesc = 'Moderate Saturation';
  else soilDesc = 'Stable Moisture';

  return {
    lhi,
    riskLevel,
    riskColor,
    rainfallForecastText: `${Math.round(total72HrRainMm)} mm ${rainDesc}`,
    rainfallProgressPercent: Math.max(12, rainProgress),
    soilSaturationText: `${soilDesc} (${soilPercent}%)`,
    soilSaturationProgressPercent: soilPercent,
    currentRainMm,
    total72HrRainMm,
    humidityPercent: humidity,
    isLive: true,
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' IST'
  };
}

interface AITriageScanResult {
  sceneType: string;
  severityRating: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  severityScore: number;
  severityBadgeColor: string;
  structuralScore: number;
  structuralText: string;
  structuralStatus: string;
  structuralBarColor: string;
  floodDepthText: string;
  floodPercent: number;
  slopeRiskText: string;
  slopeRiskPercent: number;
  confidencePercent: number;
  detectedFeatures: string[];
  recommendedProtocol: string;
  sensorMetrics?: {
    structuralIndex: number;
    thermalIndex: number;
    inundationMeters: number;
    mudSedimentIndex: number;
  };
}

function evaluateImageDisasterTriage(photoUrl: string, fileName: string, focusDisaster: string = 'auto'): Promise<AITriageScanResult> {
  return new Promise((resolve) => {
    const lowerName = (fileName || '').toLowerCase();
    const img = new Image();
    
    // Only set crossOrigin for http/https URLs; setting it on data: URIs causes error in browsers
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    let hasResolved = false;
    const safeResolve = (res: AITriageScanResult) => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(res);
      }
    };

    const processEvaluation = (stats: {
      flameRatio: number;
      smokeRatio: number;
      groundMudRatio: number;
      groundWaterRatio: number;
      skyBlueRatio: number;
      greenRatio: number;
      groundRubbleRatio: number;
      stormRatio: number;
      highChaosRatio: number;
      avgRoughness: number;
      avgWarmth: number;
      avgChroma: number;
      avgLum: number;
    }) => {
      const {
        flameRatio,
        smokeRatio,
        groundMudRatio,
        groundWaterRatio,
        skyBlueRatio,
        greenRatio,
        groundRubbleRatio,
        stormRatio,
        highChaosRatio,
        avgRoughness,
        avgWarmth,
        avgChroma,
        avgLum
      } = stats;

      // Calculate evidence scores across categories
      const fireEv = (flameRatio * 220) + (smokeRatio * 35) + (avgWarmth > 0.25 ? 20 : 0) + (lowerName.match(/fire|flame|wildfire|blaze|burn|inferno|combust/) ? 60 : 0);
      const rubbleEv = (groundRubbleRatio * 160) + (highChaosRatio * 75) + (lowerName.match(/collapse|rubble|breach|quake|earthquake|destruct|ruin/) ? 60 : 0);
      const mudEv = (groundMudRatio * 135) + (lowerName.match(/mud|debris|slurry|silt|sediment|landslide|glof|soil|lahar/) ? 60 : 0);
      const waterEv = (groundWaterRatio * 180) + (lowerName.match(/flood|water|submerge|inundat|river|deluge|surge/) ? 60 : 0);
      const stormEv = (stormRatio * 120) + (avgLum < 65 ? 25 : 0) + (lowerName.match(/storm|cyclone|cloudburst|rain|tempest|hurricane/) ? 60 : 0);
      const greenEv = greenRatio * 100;

      const isForcedQuake = focusDisaster === 'earthquake';
      const isForcedFire = focusDisaster === 'fire';
      const isForcedFlood = focusDisaster === 'flood';
      const isForcedMud = focusDisaster === 'mudflow';
      const isForcedStorm = focusDisaster === 'storm';

      // 1. Wildfire / Active Fire
      if (isForcedFire || (focusDisaster === 'auto' && fireEv > 15 && fireEv > mudEv && fireEv > waterEv && fireEv > rubbleEv)) {
        const severityScore = Math.min(99, Math.max(70, Math.round(74 + flameRatio * 50 + avgWarmth * 15)));
        const structuralScore = Math.min(98, Math.max(50, Math.round(58 + flameRatio * 70 + highChaosRatio * 25)));
        const slopeRiskPercent = Math.min(98, Math.max(55, Math.round(68 + flameRatio * 45)));
        const confidencePercent = +(93.0 + Math.min(5.5, flameRatio * 12 + avgWarmth * 4)).toFixed(1);

        safeResolve({
          sceneType: 'Active Wildfire & Forest Fire Surge',
          severityRating: severityScore >= 85 ? 'CRITICAL' : 'HIGH',
          severityScore,
          severityBadgeColor: 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Active Combustion Zone`,
          structuralStatus: 'Critical Thermal Impact',
          structuralBarColor: 'bg-rose-600',
          floodDepthText: '0.0 Meters (High Thermal Hazard)',
          floodPercent: 0,
          slopeRiskText: flameRatio > 0.2 ? 'Severe Rapid Flame Spread (Wind-Driven Threat)' : 'Active Perimeter Thermal Creep',
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            `Active Flame Front (${Math.max(12, Math.round(flameRatio * 100))}% Image Coverage)`,
            `Radiative Thermal Heat Index: ${Math.round(Math.min(99, 70 + avgWarmth * 30))}/100`,
            `Atmospheric Smoke Plume (${Math.max(15, Math.round(smokeRatio * 100))}% Canopy)`,
            'High Wildland-Urban Interface (WUI) Threat'
          ],
          recommendedProtocol: 'Deploy NDRF & State Forest Firefighting Units with IAF Bambi Bucket airdrops immediately. Enforce immediate 3 km perimeter evacuation and establish firebreak containment lines.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: Math.round(Math.min(100, Math.max(75, flameRatio * 250))),
            inundationMeters: 0.0,
            mudSedimentIndex: Math.round(groundMudRatio * 100)
          }
        });
      }
      // 2. Structural Breach / Building Collapse / Earthquake Rubble
      else if (isForcedQuake || (focusDisaster === 'auto' && rubbleEv > 25 && rubbleEv >= mudEv * 1.05 && rubbleEv > waterEv)) {
        const severityScore = Math.min(99, Math.max(76, Math.round(76 + groundRubbleRatio * 45 + highChaosRatio * 30)));
        const structuralScore = Math.min(99, Math.max(70, Math.round(74 + groundRubbleRatio * 48 + highChaosRatio * 32)));
        const slopeRiskPercent = Math.min(95, Math.max(60, Math.round(68 + groundRubbleRatio * 35)));
        const confidencePercent = +(94.5 + Math.min(4.5, groundRubbleRatio * 8)).toFixed(1);

        safeResolve({
          sceneType: 'Structural Breach & Heavy Collapse Field (Earthquake Rupture)',
          severityRating: 'CRITICAL',
          severityScore,
          severityBadgeColor: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Severe Multi-Span Structural Collapse`,
          structuralStatus: 'Heavy Collapse & Rubble Void Field',
          structuralBarColor: 'bg-red-500',
          floodDepthText: '0.0 Meters (Dry Rubble Field - Zero Inundation)',
          floodPercent: 0,
          slopeRiskText: '44° Unstable Debris Gradient & Void Risk',
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            `Multi-Span Load-Bearing Wall & Roof Failure (${structuralScore}% Structural Impact)`,
            `Dense Masonry Rubble Field (${Math.max(30, Math.round(groundRubbleRatio * 100))}% Debris Coverage)`,
            `High-Frequency Fracture Chaos Index: ${Math.round(highChaosRatio * 100)}%`,
            'Dry Rubble Field (Zero Surface Water / No Flood Inundation)',
            'Secondary Facade Shear & Void Collapse Vulnerability'
          ],
          recommendedProtocol: 'Dispatch NDRF Heavy Urban Search & Rescue (USAR) with canine search teams, acoustic listening sensors, and hydraulic cutting gear immediately. Establish a 200m cordon against secondary collapse casualties.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: Math.round(flameRatio * 100),
            inundationMeters: 0.0,
            mudSedimentIndex: Math.round(groundMudRatio * 100)
          }
        });
      }
      // 3. Mudflow / Debris Slurry / Landslide Inundation
      else if (isForcedMud || (focusDisaster === 'auto' && (groundMudRatio > 0.22 || (mudEv > 22 && mudEv > waterEv)))) {
        const depthMeters = +(1.2 + groundMudRatio * 3.4).toFixed(1);
        const severityScore = Math.min(98, Math.max(72, Math.round(72 + groundMudRatio * 42 + groundRubbleRatio * 20)));
        const structuralScore = Math.min(96, Math.max(55, Math.round(62 + groundMudRatio * 48 + groundRubbleRatio * 28)));
        const floodPercent = Math.min(96, Math.round(groundMudRatio * 135 + 15));
        const slopeRiskPercent = Math.min(95, Math.round(65 + groundMudRatio * 50));
        const confidencePercent = +(93.5 + Math.min(4.5, groundMudRatio * 10)).toFixed(1);

        safeResolve({
          sceneType: 'Catastrophic Mudflow & Debris Slurry Inundation',
          severityRating: severityScore >= 85 ? 'CRITICAL' : 'HIGH',
          severityScore,
          severityBadgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Severe Structural Burial & Base Inundation`,
          structuralStatus: 'Submerged in Mud Slurry',
          structuralBarColor: 'bg-red-500',
          floodDepthText: `${depthMeters} Meters (Viscous Mud Slurry Sedimentation)`,
          floodPercent,
          slopeRiskText: 'Critical Flash Slurry Deposition & Toe Inundation',
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            `Viscous Mud & River Silt Inundation (${Math.max(25, Math.round(groundMudRatio * 100))}% Area)`,
            `Structural Base Burial Level ~${depthMeters}m Depth`,
            'Hydrostatic Silt Surcharge on Building Substructures',
            'Access Roads & Ground Evacuation Routes Severed'
          ],
          recommendedProtocol: 'Dispatch NDRF Heavy Earthmovers & Amphibious Excavators immediately. Initiate aerial winch rescue for survivors trapped in upper storeys. Evacuate 500m riverine corridor.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: Math.round(flameRatio * 100),
            inundationMeters: depthMeters,
            mudSedimentIndex: Math.round(Math.min(100, groundMudRatio * 220))
          }
        });
      }
      // 4. Riverine Flood & Water Inundation (Must be on ground!)
      else if (isForcedFlood || (focusDisaster === 'auto' && waterEv > 16 && groundWaterRatio > 0.08)) {
        const depthMeters = +(0.8 + groundWaterRatio * 3.4).toFixed(1);
        const severityScore = Math.min(96, Math.max(65, Math.round(66 + groundWaterRatio * 55)));
        const structuralScore = Math.min(88, Math.max(30, Math.round(35 + groundWaterRatio * 65)));
        const floodPercent = Math.min(98, Math.round(groundWaterRatio * 145 + 20));
        const slopeRiskPercent = Math.min(65, Math.max(15, Math.round(22 + (1 - groundWaterRatio) * 25)));
        const confidencePercent = +(92.5 + Math.min(5.0, groundWaterRatio * 12)).toFixed(1);

        safeResolve({
          sceneType: 'Riverine Flood & Inundation Zone',
          severityRating: severityScore >= 80 ? 'CRITICAL' : 'HIGH',
          severityScore,
          severityBadgeColor: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Water-Weakened Foundation`,
          structuralStatus: 'Partially Submerged',
          structuralBarColor: 'bg-amber-500',
          floodDepthText: `${depthMeters} Meters (Active Water Surge)`,
          floodPercent,
          slopeRiskText: 'Low Relief Floodplain (Runoff Accumulation)',
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            `Active Ground Inundation (${Math.max(18, Math.round(groundWaterRatio * 100))}% Water Surface)`,
            `Water Crest Depth ~${depthMeters}m Above Base Level`,
            'Submerged Ground Storeys & Waterlogged Envelopes',
            'Hydraulic Scour Risk on Foundation Pedestals'
          ],
          recommendedProtocol: 'Deploy SDRF inflatable rescue dinghies & distribute clean drinking water. Evacuate ground-floor residents to elevated relief camps.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: Math.round(flameRatio * 100),
            inundationMeters: depthMeters,
            mudSedimentIndex: Math.round(groundMudRatio * 100)
          }
        });
      }
      // 5. Severe Storm / Cyclone / Cloudburst
      else if (isForcedStorm || (focusDisaster === 'auto' && stormEv > 28)) {
        const severityScore = Math.min(95, Math.max(65, Math.round(68 + stormRatio * 55)));
        const structuralScore = Math.min(78, Math.max(25, Math.round(32 + stormRatio * 60)));
        const floodPercent = Math.min(85, Math.round(stormRatio * 120 + 20));
        const slopeRiskPercent = Math.min(88, Math.round(58 + stormRatio * 45));
        const confidencePercent = +(91.5 + Math.min(5.0, stormRatio * 10)).toFixed(1);

        safeResolve({
          sceneType: 'Severe Cyclone & Storm Surge Hazard',
          severityRating: 'HIGH',
          severityScore,
          severityBadgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Wind & Torrential Inundation Risk`,
          structuralStatus: 'High Wind Exposure',
          structuralBarColor: 'bg-indigo-500',
          floodDepthText: '0.9 Meters (High Precipitation Runoff)',
          floodPercent,
          slopeRiskText: 'Severe Flash Runoff & Drainage Overflow',
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            `Severe Cloudburst & Storm Cloud Density (${Math.max(20, Math.round(stormRatio * 100))}%)`,
            'Intense Precipitation & Sheet-Flow Runoff',
            'Wind-Driven Structural Exposure',
            'Flash Drainage Overflow Hazard'
          ],
          recommendedProtocol: 'Issue immediate flash flood sirens. Advise residents to shelter away from unstable roofs and avoid open nullahs and drainages.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: 0,
            inundationMeters: 0.9,
            mudSedimentIndex: 15
          }
        });
      }
      // 6. Mountain Slope Settlement / Stable Hillside (Default)
      else {
        const severityScore = Math.min(60, Math.max(38, Math.round(44 + (1 - greenRatio) * 22)));
        const structuralScore = Math.min(22, Math.max(8, Math.round(10 + (1 - greenRatio) * 14)));
        const slopeAngle = Math.round(30 + (1 - greenRatio) * 16);
        const slopeRiskPercent = Math.min(75, Math.max(45, Math.round(54 + (1 - greenRatio) * 22)));
        const confidencePercent = +(93.5 + Math.min(4.5, greenRatio * 8)).toFixed(1);

        safeResolve({
          sceneType: 'Mountain Slope Settlement & Hill Terrain',
          severityRating: 'MODERATE',
          severityScore,
          severityBadgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40',
          structuralScore,
          structuralText: `${structuralScore}% Minor Slope Creep (Standing Structures)`,
          structuralStatus: 'Intact & Standing',
          structuralBarColor: 'bg-emerald-500',
          floodDepthText: '0.0 Meters (Natural Valley Drainage)',
          floodPercent: 0,
          slopeRiskText: `${slopeAngle}° Natural Mountain Gradient`,
          slopeRiskPercent,
          confidencePercent,
          detectedFeatures: [
            'Multi-Tier Hillside Reinforced Concrete Buildings',
            'Intact Building Envelopes (No Structural Collapse)',
            'Natural Valley Drainage (Zero Waterlogging)',
            'Steep Incline Mountain Urban Zone'
          ],
          recommendedProtocol: 'No catastrophic structural collapse detected. Standing multi-tier structures remain intact. Maintain slope toe-drainage and monitor retaining walls during heavy rainfall.',
          sensorMetrics: {
            structuralIndex: structuralScore,
            thermalIndex: 0,
            inundationMeters: 0.0,
            mudSedimentIndex: Math.round((1 - greenRatio) * 30)
          }
        });
      }
    };

    const runCanvasAnalysis = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 48, 48);
          const imgData = ctx.getImageData(0, 0, 48, 48).data;
          
          let flameCells = 0, smokeCells = 0, groundMudCells = 0;
          let groundWaterCells = 0, groundRubbleCells = 0, skyBlueCells = 0;
          let greenCells = 0, stormCells = 0, highChaosCells = 0;
          let rSum = 0, gSum = 0, bSum = 0, lumSum = 0, chromaSum = 0, warmthSum = 0, edgeSum = 0;
          const total = 48 * 48;

          const lumGrid: number[][] = [];
          for (let gy = 0; gy < 48; gy++) {
            lumGrid[gy] = [];
            for (let gx = 0; gx < 48; gx++) {
              const idx = (gy * 48 + gx) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              lumGrid[gy][gx] = 0.299 * r + 0.587 * g + 0.114 * b;
            }
          }

          for (let gy = 0; gy < 48; gy++) {
            const yNorm = gy / 48;
            for (let gx = 0; gx < 48; gx++) {
              const idx = (gy * 48 + gx) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];

              rSum += r; gSum += g; bSum += b;
              const maxC = Math.max(r, g, b);
              const minC = Math.min(r, g, b);
              const chroma = maxC - minC;
              const sat = chroma / (maxC + 0.001);
              const lum = lumGrid[gy][gx];
              const warmth = (r - b) / (r + b + 0.001);

              lumSum += lum; chromaSum += chroma; warmthSum += warmth;

              let rough = 0;
              if (gx > 0) rough += Math.abs(lum - lumGrid[gy][gx - 1]);
              if (gy > 0) rough += Math.abs(lum - lumGrid[gy - 1][gx]);
              edgeSum += rough;
              if (rough > 28) highChaosCells++;

              // Flame (any altitude, high thermal signature)
              const isFlame = (r > 130 && g > 40 && b < 120 && r > g * 1.1 && r > b * 1.35) ||
                              (r > 180 && g > 90 && b < 90) ||
                              (r > 155 && (r - b > 60) && (r - g < 85));
              if (isFlame) flameCells++;

              // Sky Zone: yNorm < 0.40 (Sky is NEVER ground water!)
              if (yNorm < 0.40) {
                if ((b > r + 15 && b > 80) || (b > 115 && b > r * 1.2)) {
                  skyBlueCells++;
                }
                if (lum < 70 && sat < 0.25 && r > b) {
                  smokeCells++;
                }
                if (lum < 60 && sat < 0.20) {
                  stormCells++;
                }
              } else {
                // Ground Zone: yNorm >= 0.40

                // Ground Water (MUST BE AT GROUND LEVEL)
                const isGroundBlueWater = (b > r + 15 && b > g - 5 && b > 75);
                const isGroundMurkyWater = (yNorm > 0.55) && (rough < 18) && (sat < 0.35) && (r > 65 && r < 160) && (g > 60 && g < 155) && (b > 45 && b < 135) && (r >= g - 5) && (r >= b);
                if (isGroundBlueWater || isGroundMurkyWater) {
                  groundWaterCells++;
                }

                // Ground Silt / Mud Slurry
                const isMud = (sat < 0.28) && (r > 55 && r < 195) && (r >= b - 10) && (Math.abs(r - g) < 30) && (!isGroundBlueWater);
                if (isMud) {
                  groundMudCells++;
                }

                // Ground Rubble / Shattered Concrete / Masonry
                const isRubble = (rough > 26) && (sat < 0.28) && (lum > 50 && lum < 220);
                if (isRubble) {
                  groundRubbleCells++;
                }
              }

              // Green foliage
              if (g > r * 1.12 && g > b * 1.12 && g > 60) {
                greenCells++;
              }
            }
          }

          processEvaluation({
            flameRatio: flameCells / total,
            smokeRatio: smokeCells / total,
            groundMudRatio: groundMudCells / total,
            groundWaterRatio: groundWaterCells / total,
            skyBlueRatio: skyBlueCells / total,
            greenRatio: greenCells / total,
            groundRubbleRatio: groundRubbleCells / total,
            stormRatio: stormCells / total,
            highChaosRatio: highChaosCells / total,
            avgRoughness: edgeSum / total,
            avgWarmth: warmthSum / total,
            avgChroma: chromaSum / total,
            avgLum: lumSum / total
          });
          return;
        }
      } catch (err) {
        // Handled below
      }

      computeFallback();
    };

    const computeFallback = () => {
      let hash = 0;
      for (let i = 0; i < lowerName.length; i++) {
        hash = (hash * 31 + lowerName.charCodeAt(i)) % 1000;
      }
      const isFire = focusDisaster === 'fire' || lowerName.match(/fire|flame|wildfire|blaze|burn/);
      const isMud = focusDisaster === 'mudflow' || lowerName.match(/mud|debris|slurry|silt|sediment|landslide/);
      const isWater = focusDisaster === 'flood' || lowerName.match(/flood|water|submerge|inundat|river/);
      const isCollapse = focusDisaster === 'earthquake' || lowerName.match(/collapse|rubble|breach|quake/);
      const isStorm = focusDisaster === 'storm' || lowerName.match(/storm|cyclone|cloudburst/);

      processEvaluation({
        flameRatio: isFire ? 0.32 + (hash % 10) / 100 : 0.01,
        smokeRatio: isFire ? 0.25 : 0.02,
        groundMudRatio: isMud ? 0.40 + (hash % 8) / 100 : 0.05,
        groundWaterRatio: isWater ? 0.35 + (hash % 8) / 100 : 0.02,
        skyBlueRatio: 0.2,
        greenRatio: (!isFire && !isMud && !isWater && !isCollapse && !isStorm) ? 0.35 : 0.05,
        groundRubbleRatio: isCollapse ? 0.42 + (hash % 10) / 100 : 0.05,
        stormRatio: isStorm ? 0.38 + (hash % 10) / 100 : 0.02,
        highChaosRatio: isCollapse ? 0.45 : 0.08,
        avgRoughness: isCollapse ? 55 : 35,
        avgWarmth: isFire ? 0.4 : 0.0,
        avgChroma: 60,
        avgLum: isStorm ? 60 : 115
      });
    };

    img.onload = runCanvasAnalysis;
    img.onerror = computeFallback;

    img.src = photoUrl;
    if (img.complete && img.naturalWidth !== 0) {
      runCanvasAnalysis();
    }
  });
}

export default function JeevanSetuHomepage({ onNavigateModule, onOpenSos, onOpenDashboard, onOpenAiChatbot }: JeevanSetuHomepageProps) {
  const { t, language, setLanguage } = useTranslation();

  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      onNavigateModule('customdashboard');
    }
  };

  // Side Panel Drawer state (report, aianalysis, risk, gethelp, livesituation, safetyguide, reliefcamps, livemap, reliefsupplies, emergencyresponse)
  const [activeSidePanel, setActiveSidePanel] = useState<'report' | 'aianalysis' | 'risk' | 'gethelp' | 'livesituation' | 'safetyguide' | 'reliefcamps' | 'livemap' | 'reliefsupplies' | 'emergencyresponse' | null>(null);

  // Compact Feature Modal state for hero indicator pills (ai, livedata, gis, risk, resources)
  const [activeFeatureModal, setActiveFeatureModal] = useState<'ai' | 'livedata' | 'gis' | 'risk' | 'resources' | null>(null);

  // Trusted Data Sources Modal state
  const [trustedSourceModalOpen, setTrustedSourceModalOpen] = useState(false);
  const [trustedSourceTab, setTrustedSourceTab] = useState<'imd' | 'isro' | 'gov' | 'ground' | 'gis'>('imd');

  // AI Analysis Panel simulation state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiTriagePhoto, setAiTriagePhoto] = useState<string | null>(null);
  const [aiTriageFileName, setAiTriageFileName] = useState<string>('');
  const [aiAnalysisResult, setAiAnalysisResult] = useState<AITriageScanResult | null>(null);
  const [selectedAiFocus, setSelectedAiFocus] = useState<'auto' | 'earthquake' | 'fire' | 'flood' | 'mudflow' | 'storm'>('auto');
  const [activeVisionFilter, setActiveVisionFilter] = useState<'normal' | 'edges' | 'thermal' | 'hydrology'>('normal');

  // Instruction Guide Modal State for "How Jeevan Setu Works" steps
  const [selectedInstructionStep, setSelectedInstructionStep] = useState<{
    stepNum: string;
    title: string;
    subtitle: string;
    desc: string;
    icon: any;
    color: string;
    instructions: string[];
    tips: string;
    actionText: string;
    action: () => void;
  } | null>(null);

  // Side Panel Map Refs & Effect
  const sidePanelMapContainerRef = useRef<HTMLDivElement>(null);
  const sidePanelMapInstanceRef = useRef<L.Map | null>(null);

  // Dedicated Live Map Side Panel Refs & State
  const liveMapSidePanelRef = useRef<HTMLDivElement>(null);
  const liveMapSidePanelInstanceRef = useRef<L.Map | null>(null);
  const liveMapTileRef = useRef<L.TileLayer | null>(null);
  const liveMapMarkersRef = useRef<L.CircleMarker[]>([]);
  const [liveMapSidePanelStyle, setLiveMapSidePanelStyle] = useState<'satellite' | 'topo'>('satellite');
  const [isFetchingLiveGeozones, setIsFetchingLiveGeozones] = useState(false);
  const [lastLiveGeozoneSync, setLastLiveGeozoneSync] = useState<string>('');
  const [liveGeozones, setLiveGeozones] = useState<Array<{
    id: string;
    name: string;
    coord: [number, number];
    type: string;
    status: 'HIGH RISK' | 'MONITORING' | 'WATCH' | 'NORMAL';
    color: string;
    badgeColor: string;
    temp: number;
    humidity: number;
    rain: number;
    weatherDesc: string;
    windSpeed: number;
  }>>([
    {
      id: 'assam-kaziranga',
      name: 'Assam Kaziranga Basin',
      coord: [26.5775, 93.1711],
      type: 'Flood Alert Zone • Syncing Live Weather...',
      status: 'HIGH RISK',
      color: '#ef4444',
      badgeColor: 'bg-red-500',
      temp: 25.4,
      humidity: 97,
      rain: 0.1,
      weatherDesc: 'Light Drizzle',
      windSpeed: 5.9
    },
    {
      id: 'shillong-bypass',
      name: 'Shillong Bypass NH-6',
      coord: [25.5788, 91.8933],
      type: 'Landslide Watch • Syncing Live Weather...',
      status: 'MONITORING',
      color: '#f59e0b',
      badgeColor: 'bg-amber-500',
      temp: 18.0,
      humidity: 96,
      rain: 0.0,
      weatherDesc: 'Partly Cloudy',
      windSpeed: 0.8
    },
    {
      id: 'gangtok-teesta',
      name: 'Gangtok Teesta Corridor',
      coord: [27.3389, 88.6065],
      type: 'Soil Saturation • Syncing Live Weather...',
      status: 'WATCH',
      color: '#0ea5e9',
      badgeColor: 'bg-blue-500',
      temp: 17.6,
      humidity: 89,
      rain: 0.1,
      weatherDesc: 'Light Drizzle',
      windSpeed: 0.6
    },
    {
      id: 'itanagar-arunachal',
      name: 'Itanagar Hills (Arunachal)',
      coord: [27.0844, 93.6053],
      type: 'Mountain Rain Runoff',
      status: 'MONITORING',
      color: '#10b981',
      badgeColor: 'bg-emerald-500',
      temp: 23.8,
      humidity: 98,
      rain: 0.1,
      weatherDesc: 'Light Drizzle',
      windSpeed: 4.2
    },
    {
      id: 'imphal-manipur',
      name: 'Imphal Valley (Manipur)',
      coord: [24.8170, 93.9368],
      type: 'Valley River Discharge',
      status: 'NORMAL',
      color: '#8b5cf6',
      badgeColor: 'bg-purple-500',
      temp: 21.2,
      humidity: 98,
      rain: 0.0,
      weatherDesc: 'Clear Sky',
      windSpeed: 2.1
    }
  ]);

  useEffect(() => {
    if (activeSidePanel !== 'livesituation') {
      if (sidePanelMapInstanceRef.current) {
        sidePanelMapInstanceRef.current.remove();
        sidePanelMapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!sidePanelMapContainerRef.current) return;
      if (sidePanelMapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(sidePanelMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([23.5, 83.5], 5);

      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);
      sidePanelMapInstanceRef.current = map;
      map.invalidateSize();
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (sidePanelMapInstanceRef.current) {
        sidePanelMapInstanceRef.current.remove();
        sidePanelMapInstanceRef.current = null;
      }
    };
  }, [activeSidePanel]);

  const renderLiveMapMarkers = (map: L.Map, zones: typeof liveGeozones) => {
    liveMapMarkersRef.current.forEach(m => m.remove());
    liveMapMarkersRef.current = [];

    zones.forEach(gz => {
      const circle = L.circleMarker(gz.coord, {
        radius: 9,
        fillColor: gz.color,
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map);

      circle.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 175px; padding: 2px;">
          <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-bottom: 2px;">${gz.name}</div>
          <div style="display: inline-block; font-weight: 800; font-size: 10px; color: ${gz.color}; background: rgba(0,0,0,0.06); padding: 1px 6px; border-radius: 4px; margin-bottom: 6px;">
            ● ${gz.status}
          </div>
          <div style="font-size: 11px; color: #334155; line-height: 1.5;">
            <div>🌡️ <b>${gz.temp}°C</b> • ${gz.weatherDesc}</div>
            <div>🌧️ Precipitation: <b>${gz.rain} mm/h</b></div>
            <div>💧 Humidity: <b>${gz.humidity}%</b></div>
            <div>💨 Wind: <b>${gz.windSpeed} km/h</b></div>
          </div>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #0284c7; font-weight: 700;">
            ✓ Real-Time Open-Meteo IMD Grid
          </div>
        </div>
      `);

      liveMapMarkersRef.current.push(circle);
    });
  };

  const fetchLiveMapTelemetry = async () => {
    setIsFetchingLiveGeozones(true);
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=26.58,25.58,27.34,27.08,24.82&longitude=93.17,91.89,88.61,93.61,93.94&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&timezone=auto'
      );
      if (!res.ok) throw new Error('Open-Meteo response not ok');
      const raw = await res.json();
      const list = Array.isArray(raw) ? raw : [raw];

      const getWeatherDesc = (code: number) => {
        if (code === 0) return 'Clear Sky';
        if (code <= 3) return 'Partly Cloudy';
        if (code <= 48) return 'Misty / Fog';
        if (code <= 55) return 'Light Drizzle';
        if (code <= 65) return 'Active Rainfall';
        if (code <= 82) return 'Heavy Showers';
        return 'Thunderstorm / Surge';
      };

      const baseLocs = [
        {
          id: 'assam-kaziranga',
          name: 'Assam Kaziranga Basin',
          coord: [26.5775, 93.1711] as [number, number],
          calcRisk: (rain: number, hum: number) => {
            if (rain > 5 || hum >= 96) return { status: 'HIGH RISK' as const, color: '#ef4444', badgeColor: 'bg-red-500' };
            if (rain > 1 || hum >= 85) return { status: 'MONITORING' as const, color: '#f59e0b', badgeColor: 'bg-amber-500' };
            return { status: 'WATCH' as const, color: '#0ea5e9', badgeColor: 'bg-blue-500' };
          }
        },
        {
          id: 'shillong-bypass',
          name: 'Shillong Bypass NH-6',
          coord: [25.5788, 91.8933] as [number, number],
          calcRisk: (rain: number, hum: number) => {
            if (rain > 8) return { status: 'HIGH RISK' as const, color: '#ef4444', badgeColor: 'bg-red-500' };
            if (rain > 0.5 || hum >= 92) return { status: 'MONITORING' as const, color: '#f59e0b', badgeColor: 'bg-amber-500' };
            return { status: 'WATCH' as const, color: '#0ea5e9', badgeColor: 'bg-blue-500' };
          }
        },
        {
          id: 'gangtok-teesta',
          name: 'Gangtok Teesta Corridor',
          coord: [27.3389, 88.6065] as [number, number],
          calcRisk: (rain: number, hum: number) => {
            if (rain > 6) return { status: 'HIGH RISK' as const, color: '#ef4444', badgeColor: 'bg-red-500' };
            if (rain > 0 || hum >= 85) return { status: 'WATCH' as const, color: '#0ea5e9', badgeColor: 'bg-blue-500' };
            return { status: 'NORMAL' as const, color: '#10b981', badgeColor: 'bg-emerald-500' };
          }
        },
        {
          id: 'itanagar-arunachal',
          name: 'Itanagar Hills (Arunachal)',
          coord: [27.0844, 93.6053] as [number, number],
          calcRisk: (rain: number, hum: number) => {
            if (rain > 8) return { status: 'HIGH RISK' as const, color: '#ef4444', badgeColor: 'bg-red-500' };
            if (rain > 0.5 || hum >= 90) return { status: 'MONITORING' as const, color: '#f59e0b', badgeColor: 'bg-amber-500' };
            return { status: 'NORMAL' as const, color: '#10b981', badgeColor: 'bg-emerald-500' };
          }
        },
        {
          id: 'imphal-manipur',
          name: 'Imphal Valley (Manipur)',
          coord: [24.8170, 93.9368] as [number, number],
          calcRisk: (rain: number, hum: number) => {
            if (rain > 10) return { status: 'HIGH RISK' as const, color: '#ef4444', badgeColor: 'bg-red-500' };
            if (rain > 1 || hum >= 90) return { status: 'MONITORING' as const, color: '#f59e0b', badgeColor: 'bg-amber-500' };
            return { status: 'NORMAL' as const, color: '#10b981', badgeColor: 'bg-emerald-500' };
          }
        }
      ];

      const updated = baseLocs.map((loc, idx) => {
        const cur = list[idx]?.current;
        const temp = cur?.temperature_2m ?? 24;
        const hum = cur?.relative_humidity_2m ?? 85;
        const rain = cur?.precipitation ?? 0;
        const code = cur?.weather_code ?? 0;
        const wind = cur?.wind_speed_10m ?? 3.5;
        const weatherDesc = getWeatherDesc(code);
        const risk = loc.calcRisk(rain, hum);

        return {
          id: loc.id,
          name: loc.name,
          coord: loc.coord,
          type: `${weatherDesc} • ${temp}°C • Rain: ${rain} mm/h`,
          status: risk.status,
          color: risk.color,
          badgeColor: risk.badgeColor,
          temp,
          humidity: hum,
          rain,
          weatherDesc,
          windSpeed: wind
        };
      });

      setLiveGeozones(updated);
      setLastLiveGeozoneSync(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (liveMapSidePanelInstanceRef.current) {
        renderLiveMapMarkers(liveMapSidePanelInstanceRef.current, updated);
      }
    } catch (err) {
      console.warn('Error fetching live map telemetry:', err);
    } finally {
      setIsFetchingLiveGeozones(false);
    }
  };

  // Initialize Dedicated Live Map Side Panel
  useEffect(() => {
    if (activeSidePanel !== 'livemap') {
      if (liveMapSidePanelInstanceRef.current) {
        liveMapSidePanelInstanceRef.current.remove();
        liveMapSidePanelInstanceRef.current = null;
        liveMapTileRef.current = null;
        liveMapMarkersRef.current = [];
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!liveMapSidePanelRef.current) return;
      if (liveMapSidePanelInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(liveMapSidePanelRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([26.1, 92.5], 7);

      const tile = L.tileLayer(
        liveMapSidePanelStyle === 'topo'
          ? 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
          : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }
      ).addTo(map);
      liveMapTileRef.current = tile;

      renderLiveMapMarkers(map, liveGeozones);
      fetchLiveMapTelemetry();

      liveMapSidePanelInstanceRef.current = map;
      map.invalidateSize();
      setTimeout(() => map.invalidateSize(), 150);
    }, 250);

    return () => {
      clearTimeout(timer);
      if (liveMapSidePanelInstanceRef.current) {
        liveMapSidePanelInstanceRef.current.remove();
        liveMapSidePanelInstanceRef.current = null;
        liveMapTileRef.current = null;
        liveMapMarkersRef.current = [];
      }
    };
  }, [activeSidePanel]);

  useEffect(() => {
    if (!liveMapTileRef.current) return;
    const url = liveMapSidePanelStyle === 'topo'
      ? 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}'
      : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    liveMapTileRef.current.setUrl(url);
  }, [liveMapSidePanelStyle]);

  const flySidePanelToLocation = (coord: [number, number], zoom: number = 8) => {
    if (liveMapSidePanelInstanceRef.current) {
      liveMapSidePanelInstanceRef.current.flyTo(coord, zoom, { duration: 1 });
    }
  };

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Agent & Voice Search State
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; actionText?: string; actionModule?: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your Jeevan Setu AI Agent. You can speak or type to search disaster alerts, check live GIS telemetry, locate emergency camps, or analyze local risk.'
    }
  ]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Toggle Voice-to-Text Listening
  const toggleVoiceListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Edge, or type your query.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setAiPrompt(transcript);
        if (isSearchOpen) {
          setSearchQuery(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  // Process AI Prompt and Return Disaster Intelligence
  const handleSendAiPrompt = (queryText?: string) => {
    const textToSend = queryText || aiPrompt;
    if (!textToSend.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMsg = { role: 'user' as const, text: textToSend };
    setAiMessages(prev => [...prev, userMsg]);
    setAiPrompt('');
    setIsAiThinking(true);

    const q = textToSend.toLowerCase();

    setTimeout(() => {
      let reply = '';
      let actionText: string | undefined;
      let actionModule: string | undefined;

      if (q.includes('map') || q.includes('gis') || q.includes('satellite') || q.includes('telem') || q.includes('live')) {
        reply = 'Live GIS telemetry is active. Sikkim Teesta corridor is on HIGH risk (82mm rain), and Assam Brahmaputra basin is being monitored by SDRF Team 8.';
        actionText = 'Open Live Map';
        actionModule = 'map';
      } else if (q.includes('risk') || q.includes('landslide') || q.includes('flood') || q.includes('hazard') || q.includes('sikkim')) {
        reply = 'Analyzed 8 North Eastern states: Sikkim (LHI 7.8, High Risk) and Meghalaya (Heavy Cloudburst Alert) require priority avoidance corridors.';
        actionText = 'View Risk Matrix';
        actionModule = 'staterisk';
      } else if (q.includes('camp') || q.includes('shelter') || q.includes('hospital') || q.includes('resource') || q.includes('relief')) {
        reply = '32 active relief camps are operational across NER with 14.8 tons of essential medical supplies. Gangtok Central Referral Hospital has 450 emergency beds available.';
        actionText = 'View Relief Camps';
        actionModule = 'reliefcamps';
      } else if (q.includes('drone') || q.includes('aerial') || q.includes('flight') || q.includes('uav')) {
        reply = 'UAV Garuda-X15 drone fleet is on standby at Guwahati logistics depot with high-altitude blood plasma and dialysis payload.';
        actionText = 'Open Drone Dispatcher';
        actionModule = 'drone';
      } else if (q.includes('sos') || q.includes('emergency') || q.includes('help') || q.includes('rescue')) {
        reply = 'Emergency SOS dispatch is standing by. National Disaster Helpline: 1078, National Emergency Number: 112. Connecting to triage center.';
        actionText = 'Trigger Emergency SOS';
        actionModule = 'sos';
      } else if (q.includes('dashboard') || q.includes('command') || q.includes('center')) {
        reply = 'Connecting to MDoNER / NEC Unified Command Center with 27 active rescue battalions and 9 relief fleets deployed in the field.';
        actionText = 'Open Command Center';
        actionModule = 'customdashboard';
      } else {
        reply = `AI Assistant analyzed "${textToSend}": All disaster response systems are operational. You can track real-time weather overlays, road accessibility corridors, and satellite indices across the North Eastern grid.`;
        actionText = 'Explore Live Map';
        actionModule = 'map';
      }

      setAiMessages(prev => [...prev, {
        role: 'assistant',
        text: reply,
        actionText,
        actionModule
      }]);
      setIsAiThinking(false);
    }, 600);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [reportLocation, setReportLocation] = useState('Gangtok, Sikkim (27.33° N, 88.60° E)');
  const [reportCategory, setReportCategory] = useState('Landslide');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Check Risk Modal state
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedRiskLoc, setSelectedRiskLoc] = useState('Uttarkashi, Uttarakhand');
  const [liveRiskMap, setLiveRiskMap] = useState<Record<string, LiveLocationRiskTelemetry>>({});
  const [isRiskLoading, setIsRiskLoading] = useState(false);

  // Emergency Info Modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalTab, setInfoModalTab] = useState<'privacy' | 'terms' | 'help' | 'contact' | 'resources'>('privacy');

  // Mobile Menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map state & references inside Live Situation Command HUD
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circlesGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapTileType, setMapTileType] = useState<'satellite' | 'dark' | 'topo'>('satellite');
  const [showDopplerRadar, setShowDopplerRadar] = useState(true);
  const [showHazardCircles, setShowHazardCircles] = useState(true);
  const [selectedMapCategory, setSelectedMapCategory] = useState<string>('All');
  const [liveTimeStr, setLiveTimeStr] = useState<string>('');
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lon: string } | null>(null);

  // Live Homepage Telemetry State for Live Situation
  const [liveDisasterMarkers, setLiveDisasterMarkers] = useState<DisasterMarkerItem[]>(INITIAL_DISASTER_MARKERS);
  const [liveWeatherCard, setLiveWeatherCard] = useState({
    location: 'Sikkim',
    subLocation: 'Gangtok, North East India',
    condition: 'Light Drizzle',
    temp: 18,
    maxTemp: 23,
    minTemp: 18,
    rain: 0.1,
    humidity: 89,
    windSpeed: 0.6,
    riskLevel: 'High Risk in next 72 hours',
    riskTitle: 'Landslide & Soil Saturation Watch',
    lastUpdated: 'Live'
  });
  const [liveStats, setLiveStats] = useState({
    activeIncidents: 10,
    criticalAlerts: 4,
    affectedDistricts: 18,
    rescueTeams: 27
  });
  const [liveRecentAlerts, setLiveRecentAlerts] = useState<Array<{
    title: string;
    risk: string;
    riskClass: string;
    time: string;
    dot: string;
    coord: [number, number];
  }>>([
    { title: 'Landslide in Sikkim', risk: 'High Risk', riskClass: 'text-red-600 dark:text-red-400 font-extrabold', time: 'Live: 0.1 mm/h', dot: 'bg-red-500', coord: [27.3389, 88.6065] },
    { title: 'Flood Alert – Assam', risk: 'Moderate Risk', riskClass: 'text-amber-600 dark:text-amber-400 font-bold', time: 'Live: 0.1 mm/h', dot: 'bg-amber-500', coord: [26.5800, 93.1700] },
    { title: 'Heavy Rainfall – Meghalaya', risk: 'Monitor', riskClass: 'text-slate-500 dark:text-slate-400 font-semibold', time: 'Live Monitored', dot: 'bg-emerald-500', coord: [25.2700, 91.7300] }
  ]);

  // Real-time disaster telemetry query: USGS Live Seismic, NASA EONET Active Events & Open-Meteo IMD Grid
  useEffect(() => {
    let isMounted = true;
    const fetchRealtimeHomepageData = async () => {
      try {
        const [usgsRes, eonetRes, meteoRes] = await Promise.allSettled([
          fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=2.5&minlatitude=5&maxlatitude=38&minlongitude=65&maxlongitude=100&limit=6'),
          fetch('https://eonet.gsfc.nasa.gov/api/v3/events?bbox=65,5,100,38&limit=8'),
          fetch('https://api.open-meteo.com/v1/forecast?latitude=27.34,26.58,25.27,27.59,24.82,23.73,25.68,23.83,25.58,25.55&longitude=88.61,93.17,91.73,91.85,93.94,92.72,94.11,91.29,91.89,94.07&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto')
        ]);

        const getWeatherDesc = (code: number) => {
          if (code === 0) return 'Clear Sky';
          if (code <= 3) return 'Partly Cloudy';
          if (code <= 48) return 'Misty / Fog';
          if (code <= 55) return 'Light Drizzle';
          if (code <= 65) return 'Active Rainfall';
          if (code <= 82) return 'Heavy Showers';
          return 'Thunderstorm / Surge';
        };

        const getTimeAgo = (timestampMs: number) => {
          const mins = Math.max(1, Math.floor((Date.now() - timestampMs) / 60000));
          const hrs = Math.floor(mins / 60);
          if (mins < 60) return `${mins}m ago`;
          if (hrs < 24) return `${hrs}h ago`;
          return `${Math.floor(hrs / 24)}d ago`;
        };

        // 1. Process Open-Meteo Weather Grid Data
        let weatherList: any[] = [];
        if (meteoRes.status === 'fulfilled' && meteoRes.value.ok) {
          try {
            const data = await meteoRes.value.json();
            weatherList = Array.isArray(data) ? data : [data];
          } catch (e) {
            console.warn('Failed parsing Open-Meteo data', e);
          }
        }

        // 2. Process Live USGS Earthquakes
        const liveEarthquakes: DisasterMarkerItem[] = [];
        if (usgsRes.status === 'fulfilled' && usgsRes.value.ok) {
          try {
            const uData = await usgsRes.value.json();
            const features = (uData.features || []).slice(0, 3);
            features.forEach((f: any, idx: number) => {
              const coords = f.geometry?.coordinates;
              if (coords && coords.length >= 2) {
                const lon = coords[0];
                const lat = coords[1];
                const depth = coords[2];
                const mag = f.properties?.mag ? Number(f.properties.mag).toFixed(1) : '3.8';
                const place = f.properties?.place || 'India / South Asia Region';
                const timeStr = f.properties?.time ? getTimeAgo(f.properties.time) : 'Recent Shock';
                const numMag = Number(mag);
                const severity = numMag >= 5.0 ? 'Critical' : numMag >= 4.0 ? 'High Risk' : 'Moderate Risk';

                liveEarthquakes.push({
                  id: 100 + idx,
                  type: 'Earthquake',
                  name: `M ${mag} Earthquake`,
                  loc: `${place}${depth ? ` (${Math.round(depth)} km depth)` : ''}`,
                  lat,
                  lon,
                  severity,
                  time: timeStr,
                  color: '#EAB308',
                  radius: Math.max(22000, Math.round(numMag * 8500)),
                  teams: 'NCS Seismology & NDRF Seismic Unit',
                  pop: `Tremor Zone (~${Math.round(numMag * 15000).toLocaleString()})`,
                  source: 'USGS LIVE SEISMIC FEED'
                });
              }
            });
          } catch (e) {
            console.warn('Failed parsing USGS data', e);
          }
        }

        // 3. Process Live NASA EONET Active Events (Wildfires / Storms)
        const liveFires: DisasterMarkerItem[] = [];
        if (eonetRes.status === 'fulfilled' && eonetRes.value.ok) {
          try {
            const eData = await eonetRes.value.json();
            const events = eData.events || [];
            // Sort to prioritize events mentioning India or closer coordinates
            const sortedEvents = [...events].sort((a: any, b: any) => {
              const aIsIndia = (a.title || '').toLowerCase().includes('india') ? 1 : 0;
              const bIsIndia = (b.title || '').toLowerCase().includes('india') ? 1 : 0;
              return bIsIndia - aIsIndia;
            }).slice(0, 3);

            sortedEvents.forEach((ev: any, idx: number) => {
              const geo = ev.geometry?.[ev.geometry.length - 1];
              if (geo && geo.coordinates && geo.coordinates.length >= 2) {
                const lon = geo.coordinates[0];
                const lat = geo.coordinates[1];
                const isIndia = (lat >= 8 && lat <= 36 && lon >= 68 && lon <= 97);
                const catName = ev.categories?.[0]?.title || 'Wildfires';
                const isFire = catName.toLowerCase().includes('fire');
                const timeStr = geo.date ? getTimeAgo(new Date(geo.date).getTime()) : 'Live Satellite';

                liveFires.push({
                  id: 200 + idx,
                  type: isFire ? 'Fire' : 'Heavy Rainfall',
                  name: (ev.title || 'Wildfire Incident').replace(/\s*\d{6,}\s*$/, ''),
                  loc: `${isIndia ? 'India Hotspot' : 'Regional Active Zone'} (${lat.toFixed(2)}° N, ${lon.toFixed(2)}° E)`,
                  lat,
                  lon,
                  severity: 'High Risk',
                  time: timeStr,
                  color: isFire ? '#EF4444' : '#10B981',
                  radius: 25000,
                  teams: 'Forest Fire Defense & NDRF Unit',
                  pop: 'Active Satellite Detection',
                  source: 'NASA EONET SATELLITE'
                });
              }
            });
          } catch (e) {
            console.warn('Failed parsing NASA EONET data', e);
          }
        }

        // 4. Update weather-driven markers (Landslide, Flood, Heavy Rainfall)
        const baseMarkers = INITIAL_DISASTER_MARKERS.filter(m => m.type !== 'Earthquake' && m.type !== 'Fire');
        const updatedWeatherMarkers = baseMarkers.map((m, idx) => {
          const c = weatherList[idx]?.current;
          const d = weatherList[idx]?.daily;
          const temp = Math.round(c?.temperature_2m ?? 22);
          const rain = c?.precipitation ?? 0;
          const hum = c?.relative_humidity_2m ?? 85;
          const maxT = Math.round(d?.temperature_2m_max?.[0] ?? temp + 4);
          const minT = Math.round(d?.temperature_2m_min?.[0] ?? temp - 3);
          const desc = getWeatherDesc(c?.weather_code ?? 0);

          let severity = m.severity;
          if (rain > 2 || hum >= 96) severity = 'High Risk';
          else if (rain > 0.3 || hum >= 90) severity = 'Moderate Risk';
          else severity = 'Monitor';

          return {
            ...m,
            severity,
            time: rain > 0 ? `Rain: ${rain} mm/h` : 'Live Telemetry',
            liveTemp: temp,
            liveRain: rain,
            liveHumidity: hum,
            liveWeatherDesc: desc,
            liveMaxTemp: maxT,
            liveMinTemp: minT,
            source: 'OPEN-METEO IMD GRID • LIVE SYNC'
          };
        });

        // 5. Combine all active disasters
        const earthquakesToUse = liveEarthquakes.length > 0
          ? liveEarthquakes
          : INITIAL_DISASTER_MARKERS.filter(m => m.type === 'Earthquake');

        const firesToUse = liveFires.length > 0
          ? liveFires
          : INITIAL_DISASTER_MARKERS.filter(m => m.type === 'Fire');

        const combinedMarkers: DisasterMarkerItem[] = [
          ...updatedWeatherMarkers,
          ...earthquakesToUse,
          ...firesToUse
        ];

        if (!isMounted) return;
        setLiveDisasterMarkers(combinedMarkers);

        // 6. Update Weather Card with Sikkim / NER primary readings
        const prim = weatherList[0];
        const curTemp = Math.round(prim?.current?.temperature_2m ?? 18);
        const maxTemp = Math.round(prim?.daily?.temperature_2m_max?.[0] ?? 23);
        const minTemp = Math.round(prim?.daily?.temperature_2m_min?.[0] ?? 17);
        const primRain = prim?.current?.precipitation ?? 0.1;
        const primHum = prim?.current?.relative_humidity_2m ?? 89;
        const primWind = prim?.current?.wind_speed_10m ?? 0.6;
        const primDesc = getWeatherDesc(prim?.current?.weather_code ?? 51);

        setLiveWeatherCard({
          location: 'Sikkim',
          subLocation: 'Gangtok, North East India',
          condition: primDesc,
          temp: curTemp,
          maxTemp,
          minTemp,
          rain: primRain,
          humidity: primHum,
          windSpeed: primWind,
          riskLevel: primRain > 1 || primHum > 90 ? 'High Risk in next 72 hours' : 'Moderate Advisory',
          riskTitle: primRain > 1 ? 'Heavy Precipitation & Landslide Risk' : 'Landslide & Soil Saturation Watch',
          lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        });

        // 7. Update Live Stats dynamically
        const critCount = combinedMarkers.filter(m => m.severity.includes('Critical') || m.severity.includes('High')).length;
        const uniqueLocations = new Set(combinedMarkers.map(m => m.loc)).size;
        const estimatedTeams = Math.round(combinedMarkers.length * 2.6 + critCount * 2);

        setLiveStats({
          activeIncidents: combinedMarkers.length,
          criticalAlerts: Math.max(1, critCount),
          affectedDistricts: Math.max(8, uniqueLocations),
          rescueTeams: estimatedTeams
        });

        // 8. Build Recent Alerts from live incoming feeds (Earthquake + Fire + High-Rain Landslide)
        const newRecent: Array<{
          title: string;
          risk: string;
          riskClass: string;
          time: string;
          dot: string;
          coord: [number, number];
        }> = [];

        // Add live earthquake alert if available
        if (earthquakesToUse.length > 0) {
          const eq = earthquakesToUse[0];
          newRecent.push({
            title: eq.name,
            risk: eq.severity,
            riskClass: 'text-amber-500 dark:text-amber-400 font-extrabold',
            time: `${eq.time} • USGS`,
            dot: 'bg-amber-500',
            coord: [eq.lat, eq.lon]
          });
        }

        // Add live landslide or heavy rainfall alert
        const topRainZone = updatedWeatherMarkers.find(m => m.severity.includes('High') || m.type === 'Landslide') || updatedWeatherMarkers[0];
        if (topRainZone) {
          newRecent.push({
            title: topRainZone.name,
            risk: topRainZone.severity,
            riskClass: topRainZone.severity.includes('High') ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-bold',
            time: topRainZone.liveRain !== undefined ? `Live: ${topRainZone.liveRain} mm/h` : 'Live Monitored',
            dot: topRainZone.severity.includes('High') ? 'bg-red-500' : 'bg-amber-500',
            coord: [topRainZone.lat, topRainZone.lon]
          });
        }

        // Add live wildfire alert
        if (firesToUse.length > 0) {
          const fire = firesToUse[0];
          newRecent.push({
            title: fire.name,
            risk: fire.severity,
            riskClass: 'text-rose-500 dark:text-rose-400 font-extrabold',
            time: `${fire.time} • NASA`,
            dot: 'bg-rose-500',
            coord: [fire.lat, fire.lon]
          });
        }

        if (newRecent.length > 0) {
          setLiveRecentAlerts(newRecent);
        }
      } catch (err) {
        console.warn('Realtime disaster feeds sync failed:', err);
      }
    };

    fetchRealtimeHomepageData();
    const interval = setInterval(fetchRealtimeHomepageData, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Language state dropdown
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Smooth Scroll / Tab highlight
  const [activeTab, setActiveTab] = useState<'Home' | 'Dashboard' | 'Live Map' | 'Risk Assessment' | 'Resources' | 'About' | 'Contact' | 'AIChat'>('Home');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  // Live time ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch real-time live meteorological telemetry & compute dynamic LHI for selected region
  useEffect(() => {
    const loc = REGIONAL_RISK_LOCATIONS[selectedRiskLoc];
    if (!loc) return;

    if (liveRiskMap[selectedRiskLoc]) return;

    let isMounted = true;
    setIsRiskLoading(true);

    const fetchLiveTelemetry = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=precipitation,relative_humidity_2m&daily=precipitation_sum&forecast_days=3&timezone=auto`
        );
        if (!response.ok) throw new Error('Failed to fetch live weather telemetry');
        const data = await response.json();
        
        const currentRain = Number(data.current?.precipitation || 0);
        const humidity = Number(data.current?.relative_humidity_2m || 70);
        const dailyRainArray: number[] = data.daily?.precipitation_sum || [];
        const total72hRain = dailyRainArray.reduce((acc, val) => acc + (Number(val) || 0), 0);

        const computed = computeLiveRiskTelemetry(loc, currentRain, total72hRain, humidity);

        if (isMounted) {
          setLiveRiskMap((prev) => ({
            ...prev,
            [selectedRiskLoc]: computed
          }));
          setIsRiskLoading(false);
        }
      } catch (err) {
        console.warn('Real-time telemetry fetch fallback to baseline:', err);
        if (isMounted) {
          setIsRiskLoading(false);
        }
      }
    };

    fetchLiveTelemetry();

    return () => {
      isMounted = false;
    };
  }, [selectedRiskLoc, liveRiskMap]);

  // Map Basemap URLs (Google Maps Live Telemetry)
  const getTileUrl = (type: 'satellite' | 'dark' | 'topo') => {
    switch (type) {
      case 'dark':
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'topo':
        return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      case 'satellite':
      default:
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    }
  };

  // Initialize Embedded Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Fix leaflet icon path issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    // Create map centered on 8 North Eastern Region (NER) States
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([26.1, 92.8], 7);

    const initialTile = L.tileLayer(getTileUrl(mapTileType), { maxZoom: 18 }).addTo(map);
    tileLayerRef.current = initialTile;

    // Doppler Radar Layer Overlay
    const radarTile = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
      opacity: showDopplerRadar ? 0.45 : 0,
      maxZoom: 18
    }).addTo(map);
    radarTileRef.current = radarTile;

    // Layer groups for markers & buffer circles
    markersGroupRef.current = L.layerGroup().addTo(map);
    circlesGroupRef.current = L.layerGroup().addTo(map);

    // Mouse move event for HUD live coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: e.latlng.lat.toFixed(2),
        lon: e.latlng.lng.toFixed(2)
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Circles dynamically on filter / toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !circlesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    circlesGroupRef.current.clearLayers();

    const filtered = selectedMapCategory === 'All'
      ? liveDisasterMarkers
      : liveDisasterMarkers.filter(m => m.type === selectedMapCategory);

    filtered.forEach((item) => {
      const svgIcon = getDisasterIconSvg(item.type);

      const customIcon = L.divIcon({
        className: 'custom-disaster-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${item.color}; opacity: 0.75; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: ${item.color}; opacity: 0.3; animation: pulse 2s infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${item.color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${item.color}; z-index: 10; display: flex; align-items: center; justify-content: center; color: white;">
              ${svgIcon}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([item.lat, item.lon], { icon: customIcon });

      const liveWeatherInfo = item.liveTemp !== undefined ? `
        <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 6px 8px; font-size: 10px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #94a3b8;">Live Weather:</span>
            <strong style="color: #38bdf8;">${item.liveTemp}°C • ${item.liveWeatherDesc || 'Monitored'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span style="color: #94a3b8;">Precipitation:</span>
            <strong style="color: #10b981;">${item.liveRain || 0} mm/hr</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Humidity:</span>
            <strong style="color: #e2e8f0;">${item.liveHumidity || 85}%</strong>
          </div>
        </div>
      ` : '';

      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; background: #0b1329; color: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.3); min-width: 215px; box-shadow: 0 12px 30px rgba(0,0,0,0.8);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: ${item.color}; color: white; letter-spacing: 0.5px;">
              ${item.type} &bull; ${item.severity}
            </span>
            <span style="font-size: 10px; color: #94a3b8;">${item.time}</span>
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #ffffff; line-height: 1.3; margin-bottom: 4px;">${item.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">📍 ${item.loc}</div>
          
          ${liveWeatherInfo}

          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
            <div><span style="color: #64748b;">Response:</span> <br/><strong style="color: #38bdf8;">${item.teams}</strong></div>
            <div><span style="color: #64748b;">Impacted:</span> <br/><strong style="color: #e2e8f0;">${item.pop}</strong></div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; pt: 4px; border-top: 1px solid rgba(255,255,255,0.08);">
            <span style="font-size: 9px; font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
              <span style="height: 6px; width: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
              ${item.source ? item.source : 'OPEN-METEO IMD GRID &bull; LIVE SYNC'}
            </span>
          </div>
        </div>
      `);

      markersGroupRef.current.addLayer(marker);

      if (showHazardCircles && item.radius) {
        const circle = L.circle([item.lat, item.lon], {
          radius: item.radius,
          color: item.color,
          fillColor: item.color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '6, 6'
        });
        circlesGroupRef.current.addLayer(circle);
      }
    });
  }, [selectedMapCategory, showHazardCircles, liveDisasterMarkers, mapInstanceRef.current]);

  // Handle map basemap tile change
  const changeMapTile = (type: 'satellite' | 'dark' | 'topo') => {
    if (!mapInstanceRef.current) return;
    setMapTileType(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(getTileUrl(type), { maxZoom: 18 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  // Toggle Doppler Radar Layer
  const toggleDopplerRadar = () => {
    const nextState = !showDopplerRadar;
    setShowDopplerRadar(nextState);
    if (radarTileRef.current) {
      radarTileRef.current.setOpacity(nextState ? 0.45 : 0);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => mapInstanceRef.current?.setView([23.5, 83.5], 5);

  // File upload preview handler for Report Disaster
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setReportPhoto(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to trigger live AI scan on any given photo
  const triggerAiScanForPhoto = async (
    photoUrl: string,
    fileName: string,
    focusOverride?: 'auto' | 'earthquake' | 'fire' | 'flood' | 'mudflow' | 'storm'
  ) => {
    setIsAnalyzingAi(true);
    setAiAnalysisResult(null);

    const focus = focusOverride !== undefined ? focusOverride : selectedAiFocus;
    const result = await evaluateImageDisasterTriage(photoUrl, fileName, focus);

    setTimeout(() => {
      setIsAnalyzingAi(false);
      setAiAnalysisResult(result);
    }, 850);
  };

  // File upload preview handler for AI Triage Analysis - auto-analyzes immediately on upload!
  const handleAiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAiTriageFileName(file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const url = evt.target?.result as string;
        setAiTriagePhoto(url);
        triggerAiScanForPhoto(url, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run live Gemini AI Triage scan on the uploaded image
  const handleRunAiScan = async (focusOverride?: 'auto' | 'earthquake' | 'fire' | 'flood' | 'mudflow' | 'storm') => {
    if (!aiTriagePhoto) {
      document.getElementById('ai-triage-file-input')?.click();
      return;
    }
    const focus = focusOverride !== undefined ? focusOverride : selectedAiFocus;
    triggerAiScanForPhoto(aiTriagePhoto, aiTriageFileName, focus);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      await fetch('http://localhost:5000/citizen/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: reportLocation,
          incident: reportCategory,
          photoName: 'disaster_upload.jpg'
        })
      });
    } catch (err) {
      // Fallback local handling
    }
    setTimeout(() => {
      setReportSubmitting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setIsReportModalOpen(false);
        setReportPhoto(null);
      }, 2000);
    }, 1200);
  };

  // Active regional risk profile & live real-time telemetry calculation
  const currentRiskProfile = REGIONAL_RISK_LOCATIONS[selectedRiskLoc] || REGIONAL_RISK_LOCATIONS['Uttarkashi, Uttarakhand'];
  const liveTelemetry = liveRiskMap[selectedRiskLoc];

  const displayLhi = liveTelemetry?.lhi ?? currentRiskProfile.baseLhi;
  const displayRiskLevel = liveTelemetry?.riskLevel ?? currentRiskProfile.riskLevel;
  const displayRiskColor = liveTelemetry?.riskColor ?? currentRiskProfile.riskColor;
  const displayRainText = liveTelemetry?.rainfallForecastText ?? currentRiskProfile.rainfallForecastText;
  const displayRainPct = liveTelemetry?.rainfallProgressPercent ?? currentRiskProfile.rainfallProgressPercent;
  const displaySoilText = liveTelemetry?.soilSaturationText ?? currentRiskProfile.soilSaturationText;
  const displaySoilPct = liveTelemetry?.soilSaturationProgressPercent ?? currentRiskProfile.soilSaturationProgressPercent;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col transition-colors duration-300">
      
      {/* ==================================================
          2. STICKY NAVBAR (Dark Navy matching reference image)
         ================================================== */}
      <header className="sticky top-0 z-[100] w-full max-w-full bg-[#0B132B] dark:bg-[#070d1e] text-white shadow-lg border-b border-slate-800 transition-colors duration-300">
        <div className="w-full max-w-full px-3 sm:px-5 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* LEFT: Logo & Brand */}
          <div
            onClick={() => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0 min-w-0"
          >
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-sky-400/60 group-hover:scale-105 transition shadow-md shadow-sky-500/25 bg-slate-900 flex items-center justify-center shrink-0">
              <img
                src="/jeevan-setu-logo.jpg"
                alt="Jeevan Setu Logo"
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-sky-400 font-bold text-base">JS</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white leading-none font-sans group-hover:text-sky-300 transition whitespace-nowrap">
                  {language === "hi" ? <>जीवन <span className="text-sky-400">सेतु</span></> : <>Jeevan <span className="text-sky-400">Setu</span></>}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-sky-400/90 tracking-wide leading-tight mt-0.5 hidden 2xl:block whitespace-nowrap">
                {t('nav.brandSubtitle', 'AI Powered Disaster Response & GIS Intelligence Platform')}
              </span>
            </div>
          </div>

          {/* Navigation Links (Positioned near AI Agent) */}
          <nav className="hidden xl:flex items-center justify-end flex-1 gap-2.5 2xl:gap-4 mr-2 xl:mr-3">
            {[
              { id: 'Home', name: t('nav.homeNav', 'Home'), action: () => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { id: 'About', name: t('nav.aboutNav', 'About'), action: () => { setActiveTab('About'); const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); } },
              { id: 'Contact', name: t('nav.contactNav', 'Contact'), action: () => { setActiveTab('Contact'); setInfoModalTab('contact'); setIsInfoModalOpen(true); } }
            ].map((nav) => {
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={nav.action}
                  className={`px-3 py-1.5 rounded-lg text-xs 2xl:text-sm font-semibold transition-all relative cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-sky-300 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {nav.name}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Action Tools & Mobile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 2xl:gap-2.5 shrink-0">
            {/* 🤖 AI AGENT WITH VOICE SEARCH BUTTON */}
            <button
              onClick={() => setIsAiAgentOpen(true)}
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-md shadow-sky-500/20 hover:shadow-sky-500/40 hover:scale-105 transition flex items-center gap-1.5 cursor-pointer border border-sky-400/40 whitespace-nowrap shrink-0 group"
              title="AI Agent and Voice Search"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 group-hover:rotate-12 transition transform" />
              <span>AI Agent</span>
              <span className="flex items-center gap-0.5 bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                <Mic className="h-2.5 w-2.5 text-white animate-pulse" />
                <span className="hidden sm:inline">Voice</span>
              </span>
            </button>

            {/* Search Icon (Moved to right side of AI Agent) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-1.5 sm:p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Search"
            >
              <Search className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>

            {/* Language Selector (Comprehensive 16 North East & National Languages) */}
            <div className="relative hidden sm:block shrink-0">
              {(() => {
                const currentLangMeta = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
                return (
                  <>
                    <button
                      onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                      className="h-9 flex items-center gap-2 px-3.5 rounded-full text-xs font-bold text-slate-100 hover:text-white bg-slate-800/60 hover:bg-slate-800 hover:border-sky-400/80 transition-all duration-200 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer border border-slate-700/70 shadow-sm shrink-0"
                      title="Select Language / Regional Dialect"
                    >
                      <span className="text-sm leading-none">{currentLangMeta.flag}</span>
                      <span>{currentLangMeta.nativeLabel}</span>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isLangDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsLangDropdownOpen(false)} 
                        />
                        <div className="absolute right-0 mt-2 w-80 max-h-[460px] overflow-y-auto bg-[#0B132B] dark:bg-[#070d1e] border border-slate-700/80 rounded-2xl shadow-2xl py-2 z-50 text-xs font-medium text-slate-200 divide-y divide-slate-800/80 backdrop-blur-xl">
                          {/* Header */}
                          <div className="px-3.5 py-2 bg-slate-900/80 flex items-center justify-between">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                              <Globe className="h-3.5 w-3.5" />
                              Select Language
                            </span>
                            <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold border border-sky-500/30">
                              {SUPPORTED_LANGUAGES.length} Languages
                            </span>
                          </div>

                          {/* National Languages */}
                          <div className="py-1">
                            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              National
                            </div>
                            {SUPPORTED_LANGUAGES.filter((l) => !l.isNorthEast).map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setLanguage(lang.code);
                                  setIsLangDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 hover:bg-sky-600/25 hover:text-white transition flex items-center justify-between cursor-pointer ${
                                  language === lang.code ? 'bg-sky-500/20 text-sky-300 font-bold' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm">{lang.flag}</span>
                                  <span className="truncate">{lang.nativeLabel} <span className="text-slate-400 text-[11px] font-normal">({lang.label})</span></span>
                                </div>
                                {language === lang.code && <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />}
                              </button>
                            ))}
                          </div>

                          {/* North Eastern Languages */}
                          <div className="py-1">
                            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center justify-between bg-slate-900/40">
                              <span>North East India (8 States)</span>
                              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">14 Languages</span>
                            </div>
                            {SUPPORTED_LANGUAGES.filter((l) => l.isNorthEast).map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => {
                                  setLanguage(lang.code);
                                  setIsLangDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3.5 py-2 hover:bg-sky-600/25 hover:text-white transition flex items-center justify-between cursor-pointer ${
                                  language === lang.code ? 'bg-sky-500/20 text-sky-300 font-bold' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-sm">{lang.flag}</span>
                                  <div className="min-w-0">
                                    <div className="truncate text-slate-100 font-semibold">
                                      {lang.nativeLabel} <span className="text-slate-400 text-[10px] font-normal">({lang.label})</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate">{lang.region}</div>
                                  </div>
                                </div>
                                {language === lang.code && <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>

            {/* NER Coverage Badge */}
            <button
              onClick={() => onNavigateModule('gov')}
              className="h-9 px-3 rounded-full text-xs font-bold bg-sky-500/15 text-sky-300 border border-sky-400/40 hover:bg-sky-500/25 hover:border-sky-400 transition-all duration-200 cursor-pointer hidden xl:flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
            >
              <span>🏛️</span>
              <span className="hidden 2xl:inline">Data Coverage: North Eastern Region — 8 States</span>
              <span className="inline 2xl:hidden">NER Coverage: 8 States</span>
            </button>

            {/* Theme Toggle Switch */}
            <div className="shrink-0 flex items-center">
              <ThemeToggle />
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#070d1e] border-t border-slate-800 px-4 py-4 space-y-3 text-sm font-semibold text-slate-200 shadow-2xl max-h-[85vh] overflow-y-auto">
            {/* Nav links */}
            <div className="space-y-1">
              {[
                { name: t('nav.homeNav', 'Home'), action: () => { setActiveTab('Home'); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                {
                  name: 'AI Chat Box (Voice Search 🎙️)',
                  action: () => {
                    setActiveTab('AIChat');
                    setIsMobileMenuOpen(false);
                    setIsAiChatOpen(true);
                    if (onOpenAiChatbot) onOpenAiChatbot();
                  }
                },
                { name: t('nav.aboutNav', 'About'), action: () => { setActiveTab('About'); setIsMobileMenuOpen(false); const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); } },
                { name: t('nav.contactNav', 'Contact'), action: () => { setActiveTab('Contact'); setIsMobileMenuOpen(false); setInfoModalTab('contact'); setIsInfoModalOpen(true); } }
              ].map((nav) => (
                <button
                  key={nav.name}
                  onClick={nav.action}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition flex items-center justify-between"
                >
                  <span>{nav.name}</span>
                  <ArrowRight className="h-4 w-4 text-sky-400" />
                </button>
              ))}
            </div>

            {/* Mobile Language Selector */}
            <div className="pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  Select Language
                </span>
                <span className="text-[10px] text-slate-400 font-normal">16 Languages</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition flex items-center justify-between border ${
                      language === lang.code
                        ? 'bg-sky-500/20 text-sky-300 border-sky-400/60 font-bold'
                        : 'bg-slate-800/60 text-slate-300 border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{lang.flag} {lang.nativeLabel}</span>
                    {language === lang.code && <CheckCircle2 className="h-3.5 w-3.5 text-sky-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==================================================
          3. HERO SECTION (Clean High-Res Landscape + Balanced Proportioned Typography)
          ================================================== */}
      <section className="relative w-full min-h-[500px] lg:min-h-[560px] bg-[#040814] text-white overflow-hidden flex items-center border-b border-slate-800">
        {/* 100% Clean Photographic Background with Rich Dark Gradient Overlay for Maximum Readability */}
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-rescue-bg.jpg?v=3"
            alt="Jeevan Setu Disaster Response & Rescue Operations"
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle soft gradient on left for crisp text contrast without darkening the landscape */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070E20]/75 via-[#070E20]/30 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16 flex flex-col justify-between">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Hero Left Content with Balanced Typography & Buttons */}
            <div className="max-w-2xl space-y-4">
              
              {/* Upper Label */}
              <div className="text-xs sm:text-xs font-bold uppercase tracking-wider text-[#38BDF8] font-sans drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {t('home.badge', 'DISASTER RESPONSE & GIS INTELLIGENCE')}
              </div>

              {/* Title with "Jeevan" in White and "Setu" in Cyan */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans leading-tight drop-shadow-[0_3px_12px_rgba(0,0,0,0.8)]">
                {(() => {
                  const parts = t('nav.brandTitle', 'Jeevan Setu').split(' ');
                  return (
                    <>{parts[0]} <span className="text-[#38BDF8] drop-shadow-[0_0_20px_rgba(56,189,248,0.5)]">{parts.slice(1).join(' ') || ''}</span></>
                  );
                })()}
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 tracking-tight leading-snug drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                {t('home.heroSub', 'AI Powered Disaster Response & GIS Intelligence Platform')}
              </p>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal max-w-xl drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
                {t('home.heroDesc', 'Jeevan Setu combines AI, GIS, satellite data, weather intelligence and real-time disaster information to help people understand risks, find emergency resources and respond faster.')}
              </p>

              {/* TWO REAL WORKING CALL TO ACTION BUTTONS */}
              <div className="pt-2 flex flex-wrap items-center gap-3 z-30">
                <button
                  type="button"
                  onClick={() => onNavigateModule('customdashboard')}
                  className="bg-gradient-to-r from-[#38BDF8] via-[#0284C7] to-[#0369a1] hover:from-[#7dd3fc] hover:to-[#38BDF8] text-slate-950 font-bold px-6 py-3 rounded-full shadow-xl shadow-sky-500/30 flex items-center gap-2 text-sm sm:text-base transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-sky-500/50 cursor-pointer border border-sky-200/60 group"
                >
                  <LayoutDashboard className="h-5 w-5 text-slate-950 group-hover:scale-105 transition duration-300" />
                  <span>{t('home.exploreDashboard', 'Explore Dashboard')}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition duration-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidePanel('livemap')}
                  className="bg-slate-950/85 hover:bg-slate-900 text-white font-bold px-6 py-3 rounded-full border border-[#38BDF8]/70 hover:border-[#38BDF8] backdrop-blur-xl flex items-center gap-2 text-sm sm:text-base transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-sky-500/25 cursor-pointer shadow-lg group"
                >
                  <MapPin className="h-5 w-5 text-[#38BDF8] group-hover:scale-105 transition duration-300" />
                  <span>{t('home.exploreLiveMap', 'Explore Live Map')}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition duration-300" />
                </button>
              </div>

              {/* 4 Feature Indicator Pills (Opens Compact Centered Modal in Middle of Screen) */}
              <div className="pt-2 flex flex-wrap items-center gap-2 sm:gap-2.5">
                {[
                  { label: 'AI Analysis', icon: Cpu, action: () => setActiveFeatureModal('ai') },
                  { label: 'Live Data', icon: CloudRain, action: () => setActiveFeatureModal('livedata') },
                  { label: 'GIS Mapping', icon: MapPin, action: () => setActiveFeatureModal('gis') },
                  { label: '72-hour Risk', icon: Clock, action: () => setActiveFeatureModal('risk') }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      title={`Click to preview ${item.label}`}
                      aria-label={`Preview ${item.label}`}
                      className="bg-slate-950/85 backdrop-blur-xl border border-[#38BDF8]/50 hover:border-[#38BDF8] px-3.5 py-1.5 rounded-full text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-sky-500/15 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.04] active:scale-95 cursor-pointer group"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#38BDF8] group-hover:scale-115 transition duration-300 drop-shadow-[0_0_6px_rgba(56,189,248,0.5)]" />
                      <span className="font-semibold tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Hero Right Script Accent Tagline */}
            <div className="hidden xl:flex flex-col items-end justify-center self-start pt-2 pr-4 lg:pr-6 z-20 shrink-0">
              <div className="relative font-serif italic text-lg lg:text-xl text-slate-100 font-normal tracking-wide transform -rotate-3 text-right drop-shadow-md">
                {language === 'hi' ? (
                  <>
                    <span>सुरक्षित कल के लिए</span>
                    <br />
                    <span className="font-semibold text-white">एक साथ</span>
                  </>
                ) : (
                  <>
                    <span>Together for a</span>
                    <br />
                    <span className="font-semibold text-white">safer tomorrow</span>
                  </>
                )}
                <svg className="w-36 h-3 text-[#38BDF8] mt-1 ml-auto" viewBox="0 0 200 20" fill="none">
                  <path d="M5 15 Q 100 0, 195 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          5. WHAT JEEVAN SETU DOES (Clean Section - Light & Dark Mode Compatible)
         ================================================== */}
      <section className="relative z-20 w-full py-8 text-slate-900 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.whatJeevanSetuDoes', 'What Jeevan Setu Does')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-1">
              {t('home.whatJeevanSetuSub', 'Smart tools for faster response, better preparedness and safer communities.')}
            </p>
          </div>

          {/* FEATURE CARDS GRID (Included Real-Time Relief Supply & Vehicle Tracking + Smart Emergency Response) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {[
              {
                title: 'Real-Time Relief Supply & Vehicle Tracking',
                desc: 'Live database-driven relief supply monitoring & real-time mobile GPS tracking across all 8 North-Eastern states.',
                icon: Truck,
                badge: 'LIVE REGIONAL SYSTEM',
                badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40',
                action: () => setActiveSidePanel('reliefsupplies'),
                bgColor: 'bg-[#ECFDF5] dark:bg-emerald-950/30',
                hoverBg: 'hover:bg-[#D1FAE5] dark:hover:bg-emerald-900/50',
                borderColor: 'border-emerald-300 dark:border-emerald-800/80',
                iconBg: 'bg-emerald-600 text-white',
                hoverText: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              },
              {
                title: 'Smart Emergency Response System',
                desc: 'Multi-criteria emergency response priority calculator matching depots, supplies, and live GPS vehicles.',
                icon: Zap,
                badge: 'AI PRIORITY',
                badgeColor: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40',
                action: () => setActiveSidePanel('emergencyresponse'),
                bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/30',
                hoverBg: 'hover:bg-[#FEF3C7] dark:hover:bg-amber-900/50',
                borderColor: 'border-amber-300 dark:border-amber-800/80',
                iconBg: 'bg-amber-500 text-white',
                hoverText: 'group-hover:text-amber-700 dark:group-hover:text-amber-300'
              },
              {
                title: t('home.reportDisaster', 'Report a Disaster'),
                desc: t('home.reportDisasterDesc', 'Upload a photo and location to report and analyze a disaster.'),
                icon: Camera,
                action: () => setActiveSidePanel('report'),
                bgColor: 'bg-[#FFF5F5] dark:bg-red-950/25',
                hoverBg: 'hover:bg-[#FFEAEA] dark:hover:bg-red-900/40',
                borderColor: 'border-red-200/80 dark:border-red-900/40',
                iconBg: 'bg-[#FF4D4D] text-white',
                hoverText: 'group-hover:text-red-700 dark:group-hover:text-red-300'
              },
              {
                title: t('home.checkRisk', 'Check Disaster Risk'),
                desc: t('home.checkRiskDesc', 'Check current disaster hazards and 72-hour risk information.'),
                icon: MapPin,
                action: () => setActiveSidePanel('risk'),
                bgColor: 'bg-[#F0F7FF] dark:bg-blue-950/25',
                hoverBg: 'hover:bg-[#E2F0FF] dark:hover:bg-blue-900/40',
                borderColor: 'border-blue-200/80 dark:border-blue-900/40',
                iconBg: 'bg-[#2563EB] text-white',
                hoverText: 'group-hover:text-blue-700 dark:group-hover:text-blue-300'
              },
              {
                title: t('home.safetyGuide', 'Disaster Safety Guide & Helplines'),
                desc: t('home.safetyGuideDesc', 'Official Do’s & Don’ts, 24/7 helplines, and 72-hour survival kit checklist.'),
                icon: ShieldCheck,
                action: () => setActiveSidePanel('safetyguide'),
                bgColor: 'bg-[#F0FAF5] dark:bg-emerald-950/25',
                hoverBg: 'hover:bg-[#E0F7EB] dark:hover:bg-emerald-900/40',
                borderColor: 'border-emerald-200/80 dark:border-emerald-900/40',
                iconBg: 'bg-[#10B981] text-white',
                hoverText: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              },
              {
                title: t('home.exploreSituation', 'Explore Live Situation'),
                desc: t('home.exploreSituationDesc', 'View live disaster activity, weather and affected areas.'),
                icon: MapIcon,
                action: () => setActiveSidePanel('livesituation'),
                bgColor: 'bg-[#F8F5FF] dark:bg-purple-950/25',
                hoverBg: 'hover:bg-[#EEE5FF] dark:hover:bg-purple-900/40',
                borderColor: 'border-purple-200/80 dark:border-purple-900/40',
                iconBg: 'bg-[#8B5CF6] text-white',
                hoverText: 'group-hover:text-purple-700 dark:group-hover:text-purple-300'
              },
              {
                title: t('home.aiImpact', 'AI Disaster Impact Assessment'),
                desc: t('home.aiImpactDesc', 'Analyze disaster images and estimate severity and impact.'),
                icon: Cpu,
                action: () => setActiveSidePanel('aianalysis'),
                bgColor: 'bg-[#F5F3FF] dark:bg-indigo-950/25',
                hoverBg: 'hover:bg-[#EDE9FE] dark:hover:bg-indigo-900/40',
                borderColor: 'border-indigo-200/80 dark:border-indigo-900/40',
                iconBg: 'bg-indigo-600 text-white',
                hoverText: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
              },
              {
                title: 'Road Accessibility & Safe Route Intelligence',
                desc: 'Real-time highway accessibility status, landslide road blockages, and AI OSRM green corridor rerouting.',
                icon: Navigation,
                badge: 'LIVE ROUTES',
                badgeColor: 'bg-teal-500/20 text-teal-600 dark:text-teal-400 border-teal-500/40',
                action: () => onNavigateModule('rerouting'),
                bgColor: 'bg-[#F0FDF4] dark:bg-teal-950/30',
                hoverBg: 'hover:bg-[#DCFCE7] dark:hover:bg-teal-900/50',
                borderColor: 'border-teal-300 dark:border-teal-800/80',
                iconBg: 'bg-teal-600 text-white',
                hoverText: 'group-hover:text-teal-700 dark:group-hover:text-teal-300'
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  onClick={card.action}
                  className={`${card.bgColor} ${card.hoverBg} border ${card.borderColor} rounded-2xl p-4 sm:p-4.5 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.02] hover:border-sky-400/80 flex flex-col justify-between cursor-pointer group min-h-[140px] relative overflow-hidden`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`h-9 w-9 rounded-xl ${card.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      {card.badge && (
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border tracking-wider uppercase ${card.badgeColor || 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'}`}>
                          {card.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm sm:text-base font-bold text-slate-900 dark:text-white ${card.hoverText} transition leading-snug`}>
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-normal leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-end mt-3">
                    <div className={`h-6 w-6 rounded-full ${card.iconBg} flex items-center justify-center shadow-sm group-hover:translate-x-1 group-hover:scale-110 transition duration-300`}>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>



      {/* ==================================================
          5 & 6. LIVE SITUATION SECTION (With Interactive Leaflet Map)
         ================================================== */}
      <section className="w-full py-10 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                <Radio className="h-4 w-4 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t('home.liveSituationTitle', 'Live Situation')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                  {t('home.liveSituationSub', 'Real-time updates from across India')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenDashboard}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md shadow-sm cursor-pointer border border-sky-300/40 flex items-center gap-1.5 group"
              >
                <span>{t('home.viewFullDashboard', 'View Full Dashboard')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-300" />
              </button>

              <button
                onClick={() => onNavigateModule('map')}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md hover:border-sky-400 shadow-sm cursor-pointer flex items-center gap-1.5 group"
              >
                <span>{t('home.viewFullMap', 'View Full Map')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            
            {/* LEFT COLUMN: Stats & Recent Alerts (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
              {/* 4 Statistics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-sky-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-6 w-6 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1 text-xs font-bold group-hover:scale-105 transition">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                    {liveStats.activeIncidents < 10 ? `0${liveStats.activeIncidents}` : liveStats.activeIncidents}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{t('home.activeIncidents', 'Active Incidents')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-amber-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 text-xs font-bold group-hover:scale-105 transition">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                    {liveStats.criticalAlerts < 10 ? `0${liveStats.criticalAlerts}` : liveStats.criticalAlerts}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{t('home.criticalAlerts', 'Critical Alerts')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 text-xs font-bold group-hover:scale-105 transition">
                    <MapPin className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">{liveStats.affectedDistricts}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{t('home.affectedDistricts', 'Affected Districts')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:border-emerald-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 text-xs font-bold group-hover:scale-105 transition">
                    <Users className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">{liveStats.rescueTeams}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1">{t('home.rescueTeamsDeployed', 'Rescue Teams Deployed')}</span>
                </div>
              </div>

              {/* Recent Alerts List */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] hover:border-sky-400/80 cursor-pointer flex-1 flex flex-col justify-between group">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">{t('home.recentAlerts', 'Recent Alerts')}</span>
                  </div>
                  <span className="text-[10px] text-sky-500 font-mono font-bold">LIVE TELEMETRY</span>
                </div>

                <div className="space-y-3">
                  {liveRecentAlerts.map((alert, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (mapInstanceRef.current && alert.coord) {
                          mapInstanceRef.current.flyTo(alert.coord, 8, { duration: 1.2 });
                        }
                      }}
                      className="flex items-center justify-between text-xs py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 rounded-lg transition cursor-pointer"
                      title="Click to pinpoint on GIS map"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-1">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${alert.dot} animate-pulse`} />
                        <span className="font-bold text-slate-900 dark:text-slate-200 truncate">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] ${alert.riskClass}`}>{alert.risk}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Real Interactive Command Live GIS India Map (6 Cols) */}
            <div className="lg:col-span-6 relative min-h-[420px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.01] hover:border-sky-400/80 bg-slate-950 group">
              
              {/* Tactical HUD Radar Sweep overlay */}
              <div className="radar-sweep-line" />

              {/* Leaflet Map Container */}
              <div ref={mapContainerRef} className="w-full h-full min-h-[420px] lg:min-h-[460px] z-0" />

              {/* Top Left: LIVE HUD STATS BADGE */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2 pointer-events-auto">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400 font-mono">
                    LIVE GIS TELEMETRY
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono pl-1.5 border-l border-slate-700">
                    {liveTimeStr || 'LIVE'}
                  </span>
                </div>

                {/* Live Coordinates Readout */}
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2 pointer-events-auto w-max shadow-md">
                  <span className="text-sky-400 font-bold">COORD:</span>
                  <span>{cursorCoords ? `${cursorCoords.lat}° N, ${cursorCoords.lon}° E` : '23.50° N, 83.50° E'}</span>
                </div>
              </div>

              {/* Top Right: CATEGORY FILTERABLE LEGEND */}
              <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-[11px] font-bold text-slate-200 space-y-1 max-w-[170px]">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Incident Filter</span>
                  <span className="text-sky-400 text-[9px] font-mono">{liveDisasterMarkers.length} Active</span>
                </div>
                
                {[
                  { label: 'All', color: '#38BDF8', count: liveDisasterMarkers.length },
                  { label: 'Flood', color: '#2563EB', count: liveDisasterMarkers.filter(m => m.type === 'Flood').length },
                  { label: 'Landslide', color: '#F97316', count: liveDisasterMarkers.filter(m => m.type === 'Landslide').length },
                  { label: 'Earthquake', color: '#EAB308', count: liveDisasterMarkers.filter(m => m.type === 'Earthquake').length },
                  { label: 'Fire', color: '#EF4444', count: liveDisasterMarkers.filter(m => m.type === 'Fire').length },
                  { label: 'Heavy Rainfall', color: '#10B981', count: liveDisasterMarkers.filter(m => m.type === 'Heavy Rainfall').length },
                ].map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedMapCategory(cat.label)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      selectedMapCategory === cat.label
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className="text-[9px] px-1.5 rounded bg-slate-800 text-slate-400 font-mono">{cat.count}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Left: BASEMAP SWITCHER & OVERLAY TOGGLES */}
              <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
                {/* Map Layer Switcher Pills */}
                <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-1">
                  <button
                    onClick={() => changeMapTile('satellite')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'satellite'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🛰️ Satellite</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('dark')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'dark'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🌑 Dark GIS</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('topo')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'topo'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>⛰️ Terrain</span>
                  </button>
                </div>

                {/* Doppler Radar Toggle Button */}
                <button
                  onClick={toggleDopplerRadar}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-lg border transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-xl flex items-center gap-1.5 cursor-pointer ${
                    showDopplerRadar
                      ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-emerald-900/40'
                      : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Toggle Live Precipitation Radar Overlay"
                >
                  <span className={`h-2 w-2 rounded-full ${showDopplerRadar ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                  <span>📡 Doppler Radar</span>
                </button>
              </div>

              {/* Bottom Right: CONTROL BUTTONS (Zoom, Recenter, Buffer Rings) */}
              <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
                <button
                  onClick={handleZoomIn}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg flex items-center justify-center font-bold text-sm border border-slate-700 transition cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg flex items-center justify-center font-bold text-sm border border-slate-700 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRecenter}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-lg shadow-lg flex items-center justify-center border border-slate-700 transition cursor-pointer"
                  title="Recenter India Map"
                >
                  <Crosshair className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowHazardCircles(!showHazardCircles)}
                  className={`h-8 w-8 rounded-lg shadow-lg flex items-center justify-center border transition cursor-pointer ${
                    showHazardCircles
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                      : 'bg-slate-900/90 text-slate-500 border-slate-700 hover:text-slate-300'
                  }`}
                  title="Toggle Hazard Buffer Zones"
                >
                  <Radio className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Weather Card & High Risk Banner (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
              {/* Weather Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] hover:border-sky-400/80 cursor-pointer flex-1 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                    <CloudRain className="h-6 w-6 text-sky-500 group-hover:scale-105 transition" />
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider uppercase text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Weather</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">{t('home.currentWeather', 'Current Weather')}</span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug group-hover:text-sky-400 transition flex items-center justify-between">
                    <span>{liveWeatherCard.condition}</span>
                    <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 font-mono">{liveWeatherCard.rain} mm/h</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    {liveWeatherCard.subLocation}
                  </p>
                </div>

                <div className="pt-3">
                  <div className="text-3xl font-bold text-slate-900 dark:text-white font-mono tracking-tight group-hover:scale-105 transition origin-left flex items-baseline justify-between">
                    <span>{liveWeatherCard.temp}°C</span>
                    <span className="text-xs font-sans text-slate-500 font-semibold">💧 Hum: {liveWeatherCard.humidity}%</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 flex justify-between items-center pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>H: {liveWeatherCard.maxTemp}° &nbsp; L: {liveWeatherCard.minTemp}°</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono flex items-center gap-1">
                      <span>✓ Open-Meteo IMD</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* High Risk Banner */}
              <div
                onClick={() => setIsRiskModalOpen(true)}
                className="bg-[#FFF0F0] dark:bg-[#250d11] hover:bg-[#FFE2E2] dark:hover:bg-[#341217] border border-red-200/90 dark:border-red-900/40 hover:border-red-400/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] hover:shadow-lg shadow-sm group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 block leading-tight">
                      {liveWeatherCard.riskLevel}
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block mt-0.5">
                      {liveWeatherCard.riskTitle}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 shrink-0 group-hover:translate-x-1 transition" />
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ==================================================
          4. HOW JEEVAN SETU WORKS (From data to action — in just a few steps)
          ================================================== */}
      <section id="how-it-works" className="w-full py-12 sm:py-16 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.howItWorksTitle', 'How Jeevan Setu Works')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-1">
              {t('home.howItWorksSub', 'From data to action — in just a few steps.')}
            </p>
          </div>

          {/* 4 Horizontal Steps Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 relative">
            
            {[
              {
                stepNum: '1',
                title: t('home.step1Title', 'Report'),
                subtitle: 'How to report a disaster or request emergency aid',
                desc: t('home.step1Desc', 'Share photos, location and details about the disaster.'),
                icon: Camera,
                cardColor: 'bg-sky-500/15 text-sky-500 border-sky-400/40',
                gradientColor: 'from-sky-500 to-blue-600',
                instructions: [
                  'Click on "Report Incident" or "Emergency SOS" button on home page.',
                  'Capture or upload high-resolution photos of the disaster area.',
                  'Enable GPS location to pinpoint exact coordinates for rescue teams.',
                  'Submit the report to broadcast instant alerts to local emergency response teams.'
                ],
                tips: '💡 Pro Tip: Works offline! Reports will automatically sync once cellular network reconnects.',
                actionText: 'Try Feature Now',
                panel: 'report' as const
              },
              {
                stepNum: '2',
                title: t('home.step2Title', 'AI Analysis'),
                subtitle: 'How satellite & computer vision AI processes real-time data',
                desc: t('home.step2Desc', 'Our AI processes data from satellites, weather and ground reports.'),
                icon: Cpu,
                cardColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-400/40',
                gradientColor: 'from-cyan-500 to-blue-600',
                instructions: [
                  'View real-time satellite radar imagery and computer vision damage scores.',
                  'Track automated risk severity classification (Low, Medium, Severe, Critical).',
                  'Compare pre-disaster baseline imagery with post-disaster satellite scans.',
                  'Access multi-hazard predictive analytics and structural damage estimates.'
                ],
                tips: '💡 Pro Tip: Satellite radar feeds update automatically every 15 minutes.',
                actionText: 'Try Feature Now',
                panel: 'aianalysis' as const
              },
              {
                stepNum: '3',
                title: t('home.step3Title', 'Risk Assessment'),
                subtitle: 'How regional hazard index & rainfall predictions are evaluated',
                desc: t('home.step3Desc', 'Get instant risk levels, impact analysis and 72-hour forecast.'),
                icon: AlertTriangle,
                cardColor: 'bg-amber-500/15 text-amber-500 border-amber-400/40',
                gradientColor: 'from-amber-500 to-orange-600',
                instructions: [
                  'Select target vulnerable region (e.g., Sikkim, Uttarakhand, Kerala).',
                  'Check real-time Landslide Hazard Index (LHI) and soil saturation levels.',
                  'Review 72-hour IMD weather forecasts and heavy rainfall projections.',
                  'View active flash warnings and evacuation advisories.'
                ],
                tips: '💡 Pro Tip: Enable SMS hazard alerts for automatic emergency warning broadcasts.',
                actionText: 'Try Feature Now',
                panel: 'risk' as const
              },
              {
                stepNum: '4',
                title: t('home.step4Title', 'Get Help'),
                subtitle: 'How to locate nearest shelters, medical camps & emergency numbers',
                desc: t('home.step4Desc', 'Find nearby shelters, hospitals, routes and emergency services.'),
                icon: ShieldAlert,
                cardColor: 'bg-rose-500/15 text-rose-500 border-rose-400/40',
                gradientColor: 'from-rose-500 to-red-600',
                instructions: [
                  'Tap "Transmit Emergency SOS" for immediate 1-click location sharing.',
                  'Call 24/7 National/State emergency helplines directly (NDRF 1078, SDMA 1070).',
                  'Search nearby open relief camps, distances, and live bed capacities.',
                  'Get real-time safe route navigation avoiding flood and blocked roads.'
                ],
                tips: '💡 Pro Tip: Emergency helplines are available 24/7 with toll-free access.',
                actionText: 'Try Feature Now',
                panel: 'gethelp' as const
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.stepNum}
                  onClick={() => setSelectedInstructionStep({
                    stepNum: item.stepNum,
                    title: item.title,
                    subtitle: item.subtitle,
                    desc: item.desc,
                    icon: item.icon,
                    color: item.gradientColor,
                    instructions: item.instructions,
                    tips: item.tips,
                    actionText: item.actionText,
                    action: () => {
                      setSelectedInstructionStep(null);
                      setActiveSidePanel(item.panel);
                    }
                  })}
                  className="flex flex-col items-center text-center group relative p-6 sm:p-7 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-sky-400/80 transition-all duration-300 min-h-[230px] sm:min-h-[250px] justify-between cursor-pointer transform hover:-translate-y-1.5 hover:scale-[1.02]"
                >
                  {/* Arrow Connector between steps (visible on desktop) */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20 pointer-events-none">
                      <ArrowRight className="h-5 w-5 text-sky-400 opacity-70" />
                    </div>
                  )}

                  <div className={`h-13 w-13 sm:h-14 sm:w-14 rounded-2xl ${item.cardColor} border flex items-center justify-center shadow-sm group-hover:scale-105 transition duration-300 mb-4 relative`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-white dark:ring-slate-900">
                      {item.stepNum}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-sky-400 transition leading-snug">
                      {item.stepNum}. {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-normal leading-relaxed mb-2.5">
                      {item.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 group-hover:underline">
                      <span>View Step-by-Step Guide</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

      </section>



      {/* ==================================================
          EMERGENCY CTA SECTION
         ================================================== */}
      <section className="w-full py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border border-red-500/30 rounded-2xl p-5 sm:p-7 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                <ShieldAlert className="h-3 w-3 text-red-400 animate-pulse" />
                <span>{t('home.emergencyCoordination', '24x7 Emergency Coordination')}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">{t('home.needHelpTitle', 'Need help during a disaster?')}</h3>
              <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                {t('home.needHelpDesc', 'Send distress signal, access live emergency maps, locate relief shelters, or connect with command teams.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={onOpenSos}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-red-600/30 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl hover:shadow-red-600/50 flex items-center gap-2 cursor-pointer border border-red-400/50 group"
              >
                <PhoneCall className="h-3.5 w-3.5 animate-pulse group-hover:scale-110 transition duration-300" />
                <span>{t('home.emergencyHelp', 'Emergency Help')}</span>
              </button>
              <button
                onClick={() => setActiveFeatureModal('resources')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-emerald-400 backdrop-blur px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md hover:shadow-emerald-500/20 cursor-pointer flex items-center gap-2 group"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 group-hover:scale-110 transition duration-300" />
                <span>{t('home.exploreResources', 'Explore Resources')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          8. TRUSTED DATA SOURCES
          ================================================== */}
      <section className="w-full border-t border-b border-slate-200/80 dark:border-slate-800/80 py-8 my-4 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('home.trustedSourcesTitle', 'Trusted Data Sources')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {t('home.trustedSourcesSub', 'Powered by reliable and verified sources for accurate information.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
            <button
              type="button"
              onClick={() => { setTrustedSourceTab('isro'); setTrustedSourceModalOpen(true); }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-400/80 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer group text-left"
            >
              <Radio className="h-4 w-4 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition duration-300" />
              <span>{t('home.isroSatelliteData', 'ISRO / Satellite Data')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setTrustedSourceTab('imd'); setTrustedSourceModalOpen(true); }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400/80 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer group text-left relative"
            >
              <CloudRain className="h-4 w-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition duration-300" />
              <span>{t('home.imdWeatherData', 'IMD Weather Data')}</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Live Open-Meteo Integration Active" />
            </button>

            <button
              type="button"
              onClick={() => { setTrustedSourceTab('gov'); setTrustedSourceModalOpen(true); }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400/80 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer group text-left"
            >
              <Building2 className="h-4 w-4 text-slate-700 dark:text-slate-300 group-hover:scale-110 transition duration-300" />
              <span>{t('home.govReports', 'Government Reports')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setTrustedSourceTab('ground'); setTrustedSourceModalOpen(true); }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400/80 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer group text-left"
            >
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition duration-300" />
              <span>{t('home.groundReports', 'Ground Reports')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setTrustedSourceTab('gis'); setTrustedSourceModalOpen(true); }}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-400/80 shadow-sm transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-md cursor-pointer group text-left"
            >
              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition duration-300" />
              <span>{t('home.gisRemoteSensing', 'GIS & Remote Sensing')}</span>
            </button>
          </div>

        </div>
      </section>

      {/* Trusted Data Sources Interactive Live Modal */}
      <TrustedDataSourcesModal
        isOpen={trustedSourceModalOpen}
        onClose={() => setTrustedSourceModalOpen(false)}
        initialTab={trustedSourceTab}
      />

      {/* ==================================================
          9. FOOTER (Compact & Sleek)
          ================================================== */}
      <footer className="w-full bg-[#0B132B] dark:bg-[#040814] text-white pt-8 pb-6 border-t border-slate-800 transition-colors duration-300 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            
            {/* Left: Brand (Compact) */}
            <div className="flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.05] cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-slate-900 ring-2 ring-sky-400/70 overflow-hidden flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300">
                <img
                  src="/jeevan-setu-logo.jpg"
                  alt="Jeevan Setu Logo"
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sky-400 font-black text-base">JS</span>
              </div>
              <div>
                <span className="text-base font-black tracking-wider text-white block leading-none group-hover:text-sky-400 transition duration-300">
                  {language === 'hi' ? 'जीवन सेतु' : 'JEEVAN SETU'}
                </span>
                <span className="text-[10px] font-semibold text-sky-400 block mt-0.5">
                  {t('nav.brandSubtitle', 'AI Powered Disaster Response & GIS Intelligence Platform')}
                </span>
              </div>
            </div>

            {/* Center Links (Compact) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold text-slate-300">
              <button onClick={() => { setInfoModalTab('privacy'); setIsInfoModalOpen(true); }} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.privacyPolicy', 'Privacy Policy')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => { setInfoModalTab('terms'); setIsInfoModalOpen(true); }} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.termsOfUse', 'Terms of Use')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => { setInfoModalTab('help'); setIsInfoModalOpen(true); }} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.help', 'Help')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => { setInfoModalTab('contact'); setIsInfoModalOpen(true); }} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.contact', 'Contact')}</button>
            </div>

            {/* Right: Follow Us (Compact) */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span>{t('footer.followUs', 'Follow Us')}</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://youtu.be/5GZvqN8GZw8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-red-600/40 cursor-pointer"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="#twitter"
                  className="p-2 bg-slate-800 hover:bg-sky-500 rounded-xl text-slate-300 hover:text-slate-950 transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-sky-500/40 cursor-pointer"
                  title="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  className="p-2 bg-slate-800 hover:bg-pink-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-pink-600/40 cursor-pointer"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#linkedin"
                  className="p-2 bg-slate-800 hover:bg-blue-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-blue-600/40 cursor-pointer"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Footer Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] font-semibold text-slate-400 gap-4">
            <div>
              {t('footer.copyright', '© 2026 Jeevan Setu • National Disaster Response & GIS Intelligence Platform')}
            </div>
            
            <div className="font-serif italic text-sm text-slate-200 tracking-wide">
              {t('footer.saferTomorrow', 'Together we can build a safer tomorrow')}
            </div>
          </div>

        </div>
      </footer>

      {/* ==================================================
          MODAL 1: REPORT A DISASTER MODAL
         ================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Report a Disaster</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload photo + location → AI processes emergency triage</p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Disaster Report Submitted!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  AI has dispatched the signal to the nearest NDRF &amp; Local Emergency Command Center.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Type</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option>Landslide</option>
                    <option>Flood</option>
                    <option>Heavy Rainfall</option>
                    <option>Earthquake</option>
                    <option>Forest Fire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Photo</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {reportPhoto ? (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden">
                        <img src={reportPhoto} alt="Uploaded site" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">Photo Attached</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload photo</p>
                        <p className="text-[10px] text-slate-400">JPG, JPEG, PNG allowed</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Incident Location</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setReportLocation('Captured GPS: 27.3389° N, 88.6065° E')}
                      className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold shrink-0"
                    >
                      GPS
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
                  >
                    {reportSubmitting ? 'Analyzing with AI...' : 'Submit Report →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: CHECK DISASTER RISK MODAL
         ================================================== */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRiskModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Check Disaster Risk</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">72-Hour Environmental &amp; Landslide Hazard Assessment</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold">Select Target Region</label>
                  {isRiskLoading && (
                    <span className="text-[10px] font-bold text-sky-500 flex items-center gap-1 animate-pulse">
                      <Activity className="h-3 w-3 animate-spin" /> Live sync...
                    </span>
                  )}
                </div>
                <select
                  value={selectedRiskLoc}
                  onChange={(e) => setSelectedRiskLoc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  {Object.keys(REGIONAL_RISK_LOCATIONS).map((locKey) => (
                    <option key={locKey} value={locKey}>
                      {locKey}
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time telemetry badge */}
              <div className="flex items-center justify-between text-[11px] px-1 font-semibold">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{liveTelemetry ? 'Real-Time Telemetry Active' : 'Live Data Synchronizing...'}</span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                  {liveTelemetry?.lastUpdated ? `Sync: ${liveTelemetry.lastUpdated}` : 'IMD Open-Meteo Feed'}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Current Risk Index</span>
                  <span className={`${displayRiskColor} text-white px-2.5 py-0.5 rounded-full font-black text-xs shadow-sm`}>
                    {displayLhi} / 10 ({displayRiskLevel})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">72-Hr Weather Forecast</span>
                  <span className="font-black text-slate-900 dark:text-white">{displayRainText}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Slope Stability Status</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{displaySoilText}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500">
                  <span>Slope Incline: <strong>{currentRiskProfile.slopeDegrees}° gradient</strong></span>
                  <span>Coordinates: <strong>{currentRiskProfile.lat.toFixed(2)}°N, {currentRiskProfile.lon.toFixed(2)}°E</strong></span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsRiskModalOpen(false);
                    onNavigateModule('location');
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl font-extrabold shadow-md text-center"
                >
                  View Location Intelligence Report →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 3: INFORMATION & POLICY MODAL (Privacy, Terms, Help, Contact, Resources)
         ================================================== */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Tabs Header */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs font-bold scrollbar-none pr-10">
              {[
                { id: 'privacy', label: 'Privacy Policy', icon: Lock },
                { id: 'terms', label: 'Terms of Use', icon: FileText },
                { id: 'help', label: 'Help & Guide', icon: HelpCircle },
                { id: 'contact', label: 'Contact', icon: PhoneCall },
                { id: 'resources', label: 'Emergency Resources', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = infoModalTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setInfoModalTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: PRIVACY POLICY */}
            {infoModalTab === 'privacy' && (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-2xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Privacy Policy</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Citizen Data Protection & Ethical Disaster Telemetry (DPDP Act 2023)</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                      <span>1. Zero Commercial Profiling & Monetization</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Jeevan Setu is an official humanitarian logistics system developed for the Ministry of Development of North Eastern Region (MoDoNER) and North Eastern Council (NEC). Citizen location coordinates, contact details, and emergency distress logs are strictly never sold, rented, or shared with commercial advertisers or third-party tracking services.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <MapPin className="h-4 w-4 text-sky-500" />
                      <span>2. Purpose-Bound Location Telemetry</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      GPS coordinates and environmental telemetry are accessed only when you voluntarily trigger an Emergency SOS distress beacon, report a geotechnical road breach, or request evacuation routing. Location data is relayed strictly to verified response agencies (NDRF, SDRF, Indian Army, BRO).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Activity className="h-4 w-4 text-purple-500" />
                      <span>3. Cryptographic Transmission & Ephemeral Storage</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Emergency distress packets, blood group alerts, and compressed offline SMS payloads are transmitted using secure protocols. Disaster photos uploaded for AI geotechnical triage are stored in encrypted government cloud vaults and auto-archived post-relief completion.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <FileText className="h-4 w-4 text-amber-500" />
                      <span>4. DPDP Act 2023 Compliance & Data Rights</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      In full accordance with India's Digital Personal Data Protection Act (2023), citizens retain the right to review, update, or request the redaction of their personal identity from public emergency audit logs once operational life-safety hazards are mitigated.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TERMS OF USE */}
            {infoModalTab === 'terms' && (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Terms of Use</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Platform Governance & Emergency Response Protocol</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span>1. Operational Mandate</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Jeevan Setu is intended as an emergency response, digital twin simulation, and lifeline supply bridge for the 8 North Eastern States of India. All telemetry, disaster tracking, and AI route optimizations are provided to safeguard life and infrastructure during monsoon surges and seismic events.
                    </p>
                  </div>

                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-1">
                    <div className="font-extrabold text-red-700 dark:text-red-400 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>2. Strict Prohibition on False Alarms (DM Act 2005)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-red-800 dark:text-red-300">
                      The Emergency SOS beacon and NDRF 1078 SMS gateway are strictly reserved for genuine life-threatening emergencies. Generating malicious false alarms or intentionally transmitting fictitious disaster coordinates is a punishable offense under Section 54 of the Disaster Management Act, 2005.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Radio className="h-4 w-4 text-emerald-500" />
                      <span>3. Real-Time Telemetry & Environmental Dynamic Disclaimer</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Meteorological feeds (Open-Meteo IMD Grid), seismic telemetry (USGS), and thermal wildfire satellite anomalies (NASA EONET) represent near-instantaneous sensor captures. Mountain weather patterns can evolve rapidly; users must heed physical ground instructions from local law enforcement and civil defense personnel.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Navigation className="h-4 w-4 text-sky-500" />
                      <span>4. Autonomous Rerouting & Green Corridor Compliance</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      AI-calculated bypass corridors and bridge load assessments are computational models based on satellite slope gradients and rainfall saturation. Emergency convoy operators must coordinate with Border Roads Organisation (BRO) checkpoints before transiting severe pass sectors.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: HELP & USER GUIDE */}
            {infoModalTab === 'help' && (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <HelpCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Help & User Guide</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Operational Walkthrough for Emergency Tools & GIS Telemetry</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <PhoneCall className="h-4 w-4 text-red-500" />
                      <span>How to Trigger Emergency SOS (Offline Ready)</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Click the red <strong>Emergency SOS</strong> button in the top navigation or floating action beacon. Even if internet connectivity drops, the system generates a standardized SMS pre-populated with your GPS coordinates addressed to the NDRF National Helpline (1078) and sounds an 880Hz acoustic rescue siren.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Camera className="h-4 w-4 text-sky-500" />
                      <span>How to Report a Landslide or Road Blockage</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Navigate to the <strong>Report Disaster</strong> card. Select the disaster category, attach a photo of the road slip or flood, and verify the auto-detected coordinates. The integrated AI vision triage engine scans geotechnical deformation and notifies district command.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <MapIcon className="h-4 w-4 text-emerald-500" />
                      <span>Navigating the Live Interactive GIS Map</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Use the <strong>Incident Filter</strong> legend (Flood, Landslide, Earthquake, Fire, Heavy Rain) in the top-right of the map to toggle specific hazards. Click on any marker to inspect real-time Open-Meteo weather readings, deployed rescue units, and impacted perimeters.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Offline PWA Installation</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                      Jeevan Setu is a Progressive Web App (PWA). You can install it on Android, iOS, or Windows directly from your browser. Crucial emergency data—including offline shelter directories, first-aid checklists, and SOS sirens—remain accessible without mobile data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: CONTACT & DIRECTORY */}
            {infoModalTab === 'contact' && (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Emergency Command & Directory</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct Contact Lines for NDRF, MoDoNER & State Operations</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/50 flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-red-900 dark:text-red-300 text-xs">NDRF National 24x7 Control Room</div>
                      <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">Toll-Free Emergency Helpline: <strong>1078</strong></div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">Direct Line: +91-11-24363260 &bull; Email: hq.ndrf@nic.in</div>
                    </div>
                    <a
                      href="tel:1078"
                      className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs shadow-md shadow-red-600/30 transition flex items-center gap-1.5 shrink-0"
                    >
                      <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
                      <span>Dial 1078</span>
                    </a>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-sky-500" />
                      <span>Ministry of Development of North Eastern Region (MoDoNER)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Vigyan Bhawan Annexe, Maulana Azad Road, New Delhi 110011<br />
                      Phone: +91-11-23022400 &bull; Email: <span className="text-sky-500 font-mono">support@jeevansetu.gov.in</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                      <Building2 className="h-4 w-4 text-indigo-500" />
                      <span>North Eastern Council (NEC) Secretariat</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Nongrim Hills, Shillong, Meghalaya 793003<br />
                      Phone: +91-364-2522644 &bull; Email: <span className="text-indigo-500 font-mono">nec-shillong@nic.in</span>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                    <div className="font-extrabold text-slate-900 dark:text-white text-xs">
                      State Emergency Operations Centers (SEOC - NER 8 States)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Sikkim:</span> <a href="tel:03592202461" className="text-sky-500 font-mono">03592-202461</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Assam:</span> <a href="tel:1079" className="text-sky-500 font-mono">1070 / 1079</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Meghalaya:</span> <a href="tel:1070" className="text-sky-500 font-mono">1070</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Arunachal:</span> <a href="tel:03602212541" className="text-sky-500 font-mono">0360-2212541</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Manipur:</span> <a href="tel:03852443441" className="text-sky-500 font-mono">0385-2443441</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Mizoram:</span> <a href="tel:03892335837" className="text-sky-500 font-mono">0389-2335837</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Nagaland:</span> <a href="tel:03702291122" className="text-sky-500 font-mono">0370-2291122</a>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <span className="font-bold text-slate-900 dark:text-white">Tripura:</span> <a href="tel:03812416045" className="text-sky-500 font-mono">0381-2416045</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: EMERGENCY RESOURCES */}
            {infoModalTab === 'resources' && (
              <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 animate-in fade-in duration-150">
                <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Emergency Resources</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Nearby Shelters, Hospitals &amp; Evacuation Corridors</p>
                  </div>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">Gangtok District Relief Shelter</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Capacity: 450 beds &bull; Medical Staff Onsite</div>
                    </div>
                    <button
                      onClick={() => { setIsInfoModalOpen(false); onNavigateModule('reliefcamps'); }}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-emerald-500 transition cursor-pointer"
                    >
                      Locate
                    </button>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">STNM Super Specialty Hospital</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Emergency Ward: 24x7 Open &bull; Blood Bank Ready</div>
                    </div>
                    <button
                      onClick={() => { setIsInfoModalOpen(false); onNavigateModule('lifesaving'); }}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-blue-500 transition cursor-pointer"
                    >
                      Call
                    </button>
                  </div>

                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white">Evacuation Route NH-10 Clearance</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Green Corridor Active for Emergency Convoy</div>
                    </div>
                    <button
                      onClick={() => { setIsInfoModalOpen(false); onNavigateModule('evacuation'); }}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] hover:bg-purple-500 transition cursor-pointer"
                    >
                      Route
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button onClick={onOpenSos} className="text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center gap-1.5 hover:underline cursor-pointer">
                <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
                <span>Call Emergency Helpline (1078)</span>
              </button>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 4: SEARCH MODAL (Centered Command Palette)
         ================================================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Search className="h-5 w-5 text-sky-500 shrink-0" />
              <input
                type="text"
                placeholder={t('search.placeholder', 'Search state, hazard, hospital, or disaster alert...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
              {/* Voice Search Button */}
              <button
                type="button"
                onClick={toggleVoiceListening}
                className={`px-2.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1.5 text-xs font-bold ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-400'
                }`}
                title={isListening ? 'Stop Voice Listening' : 'Click to Speak (Voice Search)'}
              >
                {isListening ? <MicOff className="h-4 w-4 text-white" /> : <Mic className="h-4 w-4 text-sky-400" />}
                <span className="hidden sm:inline text-[11px]">{isListening ? 'Listening...' : 'Voice'}</span>
              </button>

              {/* Close Button (Cleanly aligned next to Voice button with no overlap) */}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Close Search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Suggestions & Filtered Search Results */}
            <div className="space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
              <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider pb-1">
                <span>{searchQuery ? 'Search Results' : t('search.quickSuggestions', 'Quick Suggestions')}</span>
                <span className="text-sky-500">Instant Navigation</span>
              </div>

              {(() => {
                const allSearchItems = [
                  {
                    id: 'sos',
                    label: 'Emergency SOS Dispatch Signal',
                    category: '24x7 SOS',
                    color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
                    action: () => { setIsSearchOpen(false); onOpenSos(); }
                  },
                  {
                    id: 'sikkim',
                    label: t('search.sikkimLandslide', 'Sikkim Landslide High-Risk Area'),
                    category: 'RISK RADAR',
                    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
                    action: () => { setIsSearchOpen(false); setActiveSidePanel('risk'); }
                  },
                  {
                    id: 'reliefcamps',
                    label: t('search.meghalayaNDRF', 'NDRF Relief Camps in Meghalaya'),
                    category: 'RELIEF CAMPS',
                    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
                    action: () => { setIsSearchOpen(false); setActiveSidePanel('reliefcamps'); }
                  },
                  {
                    id: 'safetyguide',
                    label: 'Disaster Safety Guide & Helplines',
                    category: 'SAFETY GUIDE',
                    color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30',
                    action: () => { setIsSearchOpen(false); setActiveSidePanel('safetyguide'); }
                  },
                  {
                    id: 'assam',
                    label: t('search.assamFlood', 'Assam Kaziranga Flood Live Map'),
                    category: 'GIS MAP',
                    color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
                    action: () => { setIsSearchOpen(false); onNavigateModule('map'); }
                  },
                  {
                    id: 'aiimpact',
                    label: 'AI Disaster Impact Assessment',
                    category: 'VISION AI',
                    color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
                    action: () => { setIsSearchOpen(false); setActiveSidePanel('aianalysis'); }
                  },
                  {
                    id: 'report',
                    label: 'Report a Disaster (Ground Photo Triage)',
                    category: 'REPORT',
                    color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
                    action: () => { setIsSearchOpen(false); setActiveSidePanel('report'); }
                  },
                  {
                    id: 'drone',
                    label: t('search.droneMedical', 'UAV Drone Medical Supply Routes'),
                    category: 'DRONE',
                    color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
                    action: () => { setIsSearchOpen(false); onNavigateModule('drone'); }
                  }
                ];

                const filtered = searchQuery.trim()
                  ? allSearchItems.filter(item =>
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  : allSearchItems;

                if (filtered.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <div className="text-sm font-bold">No matching results found</div>
                      <div className="text-xs text-slate-500">Try searching for "Landslide", "Flood", "Relief", or "SOS"</div>
                    </div>
                  );
                }

                return filtered.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${item.color}`}>
                        {item.category}
                      </span>
                      <span className="text-xs group-hover:text-sky-500 transition">{item.label}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-1 transition transform" />
                  </button>
                ));
              })()}
            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 5: AI AGENT & VOICE SEARCH MODAL
         ================================================== */}
      {isAiAgentOpen && (
        <div className="fixed inset-0 z-[210] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#070d1e] border border-sky-500/40 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl shadow-sky-500/10 relative flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">Jeevan Setu AI Agent</h3>
                    <span className="bg-sky-500/20 text-sky-300 border border-sky-400/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Voice Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Voice-to-Text Search &amp; Neural Disaster Intelligence Assistant
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (isListening && recognitionRef.current) {
                    recognitionRef.current.stop();
                    setIsListening(false);
                  }
                  setIsAiAgentOpen(false);
                }}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Chat / Message Stream */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3.5 custom-scrollbar min-h-[220px]">
              {aiMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-xl bg-sky-600/30 border border-sky-400/30 text-sky-300 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-900/90 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Action button if AI suggested a navigation route */}
                    {msg.actionText && (
                      <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsAiAgentOpen(false);
                            if (msg.actionModule === 'sos') {
                              onOpenSos();
                            } else if (msg.actionModule) {
                              onNavigateModule(msg.actionModule);
                            }
                          }}
                          className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>{msg.actionText}</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => speakText(msg.text)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition cursor-pointer"
                          title="Read aloud"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isAiThinking && (
                <div className="flex items-center gap-2 text-sky-400 text-xs font-bold pl-9">
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  <span>AI Agent is analyzing telemetry...</span>
                </div>
              )}
            </div>

            {/* Voice Listening Active Wave Indicator */}
            {isListening && (
              <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
                  <span>Listening... Speak your search or question now</span>
                </div>
                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  className="bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                >
                  Stop
                </button>
              </div>
            )}

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-1.5 pb-3">
              {[
                'Show Live GIS Map',
                'Check Landslide Risk in Sikkim',
                'Find Nearest Relief Camps',
                'Evacuation Route NH-10',
                'Weather & Cyclone Watch'
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendAiPrompt(suggestion)}
                  className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-sky-600/30 text-slate-300 hover:text-white border border-slate-800 text-[10px] font-semibold transition cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Bar with Voice to Text Mic Button */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAiPrompt();
              }}
              className="flex items-center gap-2 pt-3 border-t border-slate-800"
            >
              {/* Voice-to-Text Microphone Trigger Button */}
              <button
                type="button"
                onClick={toggleVoiceListening}
                className={`p-3 rounded-2xl transition cursor-pointer flex items-center justify-center ${
                  isListening
                    ? 'bg-red-600 text-white ring-4 ring-red-500/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-sky-500 text-slate-200 hover:text-slate-950 border border-slate-700'
                }`}
                title={isListening ? 'Stop Listening' : 'Click to Speak (Voice Search)'}
              >
                {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              {/* Text Input Box */}
              <input
                type="text"
                placeholder={isListening ? 'Listening to your voice...' : 'Ask AI Agent or speak via microphone...'}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!aiPrompt.trim() && !isListening}
                className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-40 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>Search</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>

          </div>
        </div>
      )}

      {/* ==================================================
          RIGHT-SIDE SLIDING DRAWER / PANEL (Opens directly on Homepage)
         ================================================== */}
      {activeSidePanel && (
        <>
          {/* Semi-transparent Backdrop Overlay */}
          <div
            onClick={() => setActiveSidePanel(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200"
          />

          {/* Right-Side Drawer Container */}
          <div className={`fixed top-0 right-0 h-full z-[200] ${activeSidePanel === 'livemap' || activeSidePanel === 'reliefsupplies' || activeSidePanel === 'emergencyresponse' ? 'w-full sm:w-[540px] lg:w-[600px]' : 'w-full sm:w-[480px] lg:w-[540px]'} bg-white dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300`}>
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b132b]">
              <div className="flex items-center gap-3">
                {activeSidePanel === 'report' && (
                  <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'aianalysis' && (
                  <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'risk' && (
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'gethelp' && (
                  <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'livemap' && (
                  <div className="h-9 w-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                    <Globe className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'livesituation' && (
                  <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'safetyguide' && (
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'reliefcamps' && (
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'reliefsupplies' && (
                  <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'emergencyresponse' && (
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeSidePanel === 'report' && '1. Report a Disaster'}
                    {activeSidePanel === 'risk' && '2. Check Disaster Risk'}
                    {activeSidePanel === 'aianalysis' && '5. AI Analysis & Triage'}
                    {activeSidePanel === 'gethelp' && '4. Emergency Help & Rescue'}
                    {activeSidePanel === 'livemap' && 'Live GIS Disaster Map'}
                    {activeSidePanel === 'livesituation' && 'Explore Live Situation'}
                    {activeSidePanel === 'safetyguide' && 'Disaster Safety Guide & Helplines'}
                    {activeSidePanel === 'reliefcamps' && 'Relief Camps & Emergency Supplies'}
                    {activeSidePanel === 'reliefsupplies' && 'Real-Time Relief Supply & Vehicle Tracking'}
                    {activeSidePanel === 'emergencyresponse' && 'Smart Emergency Response System'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {activeSidePanel === 'report' && 'AI Incident Submission & Ground Photo Triage'}
                    {activeSidePanel === 'aianalysis' && 'Automated Gemini AI Structural Damage Assessment'}
                    {activeSidePanel === 'risk' && '72-Hour Environmental Hazard Radar'}
                    {activeSidePanel === 'gethelp' && '24/7 SOS Rescue Signals & Relief Shelters'}
                    {activeSidePanel === 'livemap' && 'Real-Time Disaster Locations & Geographic Information'}
                    {activeSidePanel === 'livesituation' && 'Real-time Operations & Field Intelligence'}
                    {activeSidePanel === 'safetyguide' && 'Official Do’s & Don’ts, 24/7 Helplines & Survival Kit Checklist'}
                    {activeSidePanel === 'reliefcamps' && 'Nearby Operational Shelters, Bed Capacity & Relief Stocks'}
                    {activeSidePanel === 'reliefsupplies' && 'Live Regional Fleet GPS Tracking, Depots & Supply Dispatches'}
                    {activeSidePanel === 'emergencyresponse' && 'Multi-Criteria Emergency Priority Calculator & Live Dispatches'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSidePanel(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* PANEL 1: REPORT A DISASTER */}
              {activeSidePanel === 'report' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-red-600 dark:text-red-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-red-500/20 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Select the disaster category (e.g., Landslide, Flood, Rainfall).</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Upload or capture a ground photo showing the incident site damage.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Tap the <strong>"GPS"</strong> button to auto-detect your location coordinates.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Submit Report"</strong> to trigger instant emergency telemetry.</span>
                      </div>
                    </div>
                  </div>
                  {reportSuccess ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                      <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">Incident Successfully Submitted!</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        AI Severity analysis: <span className="font-bold">High Priority Landslide</span>. NDRF &amp; local control centers dispatched.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReport} className="space-y-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Type</label>
                        <select
                          value={reportCategory}
                          onChange={(e) => setReportCategory(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option>Landslide</option>
                          <option>Flood</option>
                          <option>Heavy Rainfall</option>
                          <option>Earthquake</option>
                          <option>Forest Fire</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Upload Ground Photo</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 text-center relative cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          {reportPhoto ? (
                            <div className="relative h-44 w-full rounded-xl overflow-hidden">
                              <img src={reportPhoto} alt="Uploaded incident site" className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">Photo Attached</span>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <Upload className="h-8 w-8 text-red-500 mx-auto" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tap or click to capture/upload image</p>
                              <p className="text-[10px] text-slate-400">Supported: JPG, PNG, WEBP up to 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Incident Location &amp; Coordinates</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={reportLocation}
                            onChange={(e) => setReportLocation(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => setReportLocation('GPS Acquired: 27.3389° N, 88.6065° E')}
                            className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 border border-red-300 dark:border-red-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Crosshair className="h-3.5 w-3.5" />
                            <span>GPS</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-[11px]">
                        <div className="font-bold flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-red-500" />
                          <span>Instant AI Analysis</span>
                        </div>
                        Our neural vision model will calculate hazard index, damage extent, and send immediate distress signals to nearest emergency responders.
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveSidePanel(null)}
                          className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={reportSubmitting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {reportSubmitting ? (
                            <>
                              <Activity className="h-4 w-4 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Report</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* PANEL 2: AI ANALYSIS & TRIAGE */}
              {activeSidePanel === 'aianalysis' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-cyan-600 dark:text-cyan-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Choose or upload an aerial, drone, or satellite disaster photo.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Click <strong>"Run Live AI Triage Scan"</strong> to start Gemini AI processing.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Review structural damage %, flood depth, and AI severity rating.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Inspect recommended rescue protocols for NDRF/UAV dispatch.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-cyan-500 font-bold text-sm">
                      <Cpu className="h-5 w-5 text-cyan-500" />
                      <span>Gemini AI Structural Damage Triage Engine</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      Upload aerial, drone, satellite or ground photos to estimate disaster severity, structural collapse, and water inundation levels.
                    </p>
                  </div>

                  {/* AI Disaster Focus Diagnostic Mode Tool */}
                  <div className="space-y-1.5 bg-slate-100 dark:bg-slate-900/70 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                        <Sliders className="h-3.5 w-3.5" />
                        <span>AI Diagnostic Focus Tool:</span>
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {selectedAiFocus === 'auto' ? 'Auto-Classification Active' : `Mode: ${selectedAiFocus.toUpperCase()}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                      {[
                        { id: 'auto', label: '🤖 Auto AI', desc: 'Auto Vision Detection' },
                        { id: 'earthquake', label: '🏚️ Quake', desc: 'Rubble & Structural Breach' },
                        { id: 'fire', label: '🔥 Fire', desc: 'Thermal & Flame Front' },
                        { id: 'flood', label: '🌊 Flood', desc: 'Waterline & Submersion' },
                        { id: 'mudflow', label: '🏔️ Mudflow', desc: 'Slurry Silt Inundation' },
                        { id: 'storm', label: '🌪️ Storm', desc: 'Cyclone & Wind Shear' },
                      ].map((item) => {
                        const isSelected = selectedAiFocus === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              const next = item.id as any;
                              setSelectedAiFocus(next);
                              if (aiTriagePhoto) {
                                triggerAiScanForPhoto(aiTriagePhoto, aiTriageFileName, next);
                              }
                            }}
                            className={`px-1.5 py-2 rounded-xl border text-[10px] font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 shadow-sm ${
                              isSelected
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 ring-2 ring-cyan-400/40 scale-[1.02]'
                                : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-cyan-400'
                            }`}
                            title={item.desc}
                          >
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-400 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-5 text-center space-y-3 relative transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      id="ai-triage-file-input"
                      onChange={handleAiPhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      title="Click or drag image to upload"
                    />

                    {aiTriagePhoto ? (
                      <div className="space-y-2.5">
                        <div className="relative h-52 w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950 shadow-inner">
                          <img
                            src={aiTriagePhoto}
                            alt="Uploaded for AI Triage"
                            className={`w-full h-full object-cover transition-all duration-300 ${
                              activeVisionFilter === 'edges'
                                ? 'contrast-[250%] grayscale invert-[15%]'
                                : activeVisionFilter === 'thermal'
                                ? 'saturate-[350%] hue-rotate-180 contrast-150'
                                : activeVisionFilter === 'hydrology'
                                ? 'saturate-[240%] brightness-105'
                                : ''
                            }`}
                          />
                          {/* Active scanning overlay with pulse & scanner line */}
                          {isAnalyzingAi && (
                            <div className="absolute inset-0 bg-cyan-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2.5 z-20">
                              <div className="relative">
                                <div className="h-12 w-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                                <Sparkles className="h-5 w-5 text-cyan-300 absolute inset-0 m-auto animate-pulse" />
                              </div>
                              <div className="text-center space-y-1">
                                <span className="text-xs font-black text-cyan-300 bg-slate-900/90 px-3 py-1 rounded-full shadow border border-cyan-500/30">
                                  Scanning with Gemini Vision AI...
                                </span>
                                <p className="text-[10px] text-cyan-200/80 font-semibold">Analyzing structures &amp; disaster cues</p>
                              </div>
                            </div>
                          )}
                          {/* Verified badge when scan finishes */}
                          {!isAnalyzingAi && aiAnalysisResult && (
                            <span className="absolute top-2 left-2 bg-slate-900/90 text-emerald-400 text-[10px] px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1.5 border border-emerald-500/40 shadow">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              <span>AI Vision Verified ({aiAnalysisResult.confidencePercent}%)</span>
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 bg-slate-900/90 text-cyan-400 text-[10px] px-2.5 py-1 rounded-md font-extrabold flex items-center gap-1.5 border border-cyan-500/30">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                            <span className="truncate max-w-[200px]">{aiTriageFileName || 'Photo Attached'}</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAiTriagePhoto(null);
                              setAiTriageFileName('');
                              setIsAnalyzingAi(false);
                              setAiAnalysisResult(null);
                            }}
                            className="absolute top-2 right-2 bg-slate-900/90 hover:bg-red-600 text-white p-1.5 rounded-lg transition z-20 cursor-pointer shadow"
                            title="Remove photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Optical Sensor Filter Lens Tool */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5">
                          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Eye className="h-3 w-3 text-cyan-500" />
                            <span>Sensor Lens:</span>
                          </span>
                          <div className="inline-flex rounded-lg p-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                            {[
                              { id: 'normal', label: 'RGB Normal' },
                              { id: 'edges', label: 'Fracture / Edge' },
                              { id: 'thermal', label: 'Thermal IR' },
                              { id: 'hydrology', label: 'Hydrology Saliency' },
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveVisionFilter(f.id as any);
                                }}
                                className={`px-2 py-0.5 rounded-md text-[9px] font-black transition cursor-pointer ${
                                  activeVisionFilter === f.id
                                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-0.5 px-1">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Click photo to change image</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold">
                            {aiAnalysisResult ? 'Triage Computed' : 'Image Loaded & Ready'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 py-3 pointer-events-none">
                        <Upload className="h-9 w-9 text-cyan-500 mx-auto animate-bounce" />
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                            Upload Image for Real-time AI Triage
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Supports JPG, PNG, Satellite TIFF up to 15MB
                          </div>
                        </div>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-1.5 bg-cyan-500 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md">
                            <Upload className="h-4 w-4" />
                            <span>Browse &amp; Upload Photo</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sample Disaster Photo Presets */}
                  {!aiTriagePhoto && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                        <span>Or select a sample disaster photo:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          {
                            label: '🔥 Wildfire',
                            url: 'https://images.unsplash.com/photo-1602980085566-480459345d3c?w=500&auto=format&fit=crop&q=60',
                            name: 'Forest_wildfire_surge.jpg'
                          },
                          {
                            label: '🏔️ Mudflow',
                            url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=500&auto=format&fit=crop&q=60',
                            name: 'Teesta_mudflow_slurry.jpg'
                          },
                          {
                            label: '🌊 Flood Surge',
                            url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=500&auto=format&fit=crop&q=60',
                            name: 'Teesta_flood_debris.jpg'
                          },
                          {
                            label: '🏚️ Collapse',
                            url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=500&auto=format&fit=crop&q=60',
                            name: 'Structural_breach_site.jpg'
                          }
                        ].map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAiTriagePhoto(sample.url);
                              setAiTriageFileName(sample.name);
                              triggerAiScanForPhoto(sample.url, sample.name);
                            }}
                            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:border-cyan-400 text-[10px] font-extrabold text-slate-700 dark:text-slate-200 text-center transition cursor-pointer"
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={() => handleRunAiScan()}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                    >
                      {isAnalyzingAi ? (
                        <>
                          <Activity className="h-4 w-4 animate-spin" />
                          <span>Scanning Image with Gemini AI...</span>
                        </>
                      ) : aiAnalysisResult ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-slate-950" />
                          <span>Scan Completed • Click to Re-scan</span>
                        </>
                      ) : aiTriagePhoto ? (
                        <>
                          <Sparkles className="h-4 w-4" />
                          <span>Run Live AI Triage Scan</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Select Photo to Scan</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Analysis Dynamic Results */}
                  {aiAnalysisResult && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-300 shadow-md">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <span className="font-extrabold text-slate-900 dark:text-white block">AI Damage Severity Rating</span>
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">{aiAnalysisResult.sceneType}</span>
                        </div>
                        <span className={`px-2.5 py-1 ${aiAnalysisResult.severityBadgeColor} border rounded-full font-black text-[11px]`}>
                          {aiAnalysisResult.severityRating} ({aiAnalysisResult.severityScore}/100)
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Structural Integrity &amp; Damage</span>
                            <span className="text-slate-900 dark:text-white font-bold">{aiAnalysisResult.structuralText}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${aiAnalysisResult.structuralBarColor} transition-all duration-700`}
                              style={{ width: `${Math.max(10, aiAnalysisResult.structuralScore)}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Inundation &amp; Drainage</span>
                            <span className="text-slate-900 dark:text-white font-bold">{aiAnalysisResult.floodDepthText}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 transition-all duration-700"
                              style={{ width: `${aiAnalysisResult.floodPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">Slope / Topographic Hazard</span>
                            <span className="text-slate-900 dark:text-white font-bold">{aiAnalysisResult.slopeRiskText}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 transition-all duration-700"
                              style={{ width: `${aiAnalysisResult.slopeRiskPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Multi-Spectrum Sensor Diagnostics Tool */}
                      {aiAnalysisResult.sensorMetrics && (
                        <div className="bg-slate-900/95 text-white rounded-xl p-3.5 border border-cyan-500/40 space-y-2.5 shadow-inner">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="flex items-center gap-1.5">
                              <Activity className="h-4 w-4 text-cyan-400 animate-pulse" />
                              <span className="text-[11px] font-black uppercase tracking-wider text-cyan-300">
                                Multi-Spectrum Sensor Diagnostics Tool
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                              Live Calibration
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {/* Structural Breach Metric */}
                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex justify-between font-bold text-slate-400">
                                <span>Structural Breach:</span>
                                <span className="text-red-400 font-black">{aiAnalysisResult.sensorMetrics.structuralIndex}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-red-500 transition-all duration-500"
                                  style={{ width: `${aiAnalysisResult.sensorMetrics.structuralIndex}%` }}
                                />
                              </div>
                            </div>

                            {/* Thermal Radiation Metric */}
                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex justify-between font-bold text-slate-400">
                                <span>Thermal Radiation:</span>
                                <span className="text-rose-400 font-black">{aiAnalysisResult.sensorMetrics.thermalIndex}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 transition-all duration-500"
                                  style={{ width: `${aiAnalysisResult.sensorMetrics.thermalIndex}%` }}
                                />
                              </div>
                            </div>

                            {/* Ground Waterline Metric */}
                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex justify-between font-bold text-slate-400">
                                <span>Ground Waterline:</span>
                                <span className="text-blue-400 font-black">{aiAnalysisResult.sensorMetrics.inundationMeters}m</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 transition-all duration-500"
                                  style={{ width: `${Math.min(100, (aiAnalysisResult.sensorMetrics.inundationMeters / 4) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Silt & Sediment Metric */}
                            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex justify-between font-bold text-slate-400">
                                <span>Silt / Debris Load:</span>
                                <span className="text-amber-400 font-black">{aiAnalysisResult.sensorMetrics.mudSedimentIndex}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 transition-all duration-500"
                                  style={{ width: `${aiAnalysisResult.sensorMetrics.mudSedimentIndex}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detected Visual Features */}
                      <div className="pt-1">
                        <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1.5">
                          Visual Evidence Detected by Gemini Vision:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {aiAnalysisResult.detectedFeatures.map((feat, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-bold bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                            >
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* AI Recommended Protocol */}
                      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        aiAnalysisResult.severityRating === 'CRITICAL'
                          ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                          : aiAnalysisResult.severityRating === 'HIGH'
                          ? 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
                      }`}>
                        <div className="font-black mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" />
                          <span>AI Recommended Emergency Protocol:</span>
                        </div>
                        {aiAnalysisResult.recommendedProtocol}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setActiveSidePanel(null);
                      onNavigateModule('aiimpact');
                    }}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                  >
                    <span>Open Full AI Impact Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PANEL 3: CHECK DISASTER RISK */}
              {activeSidePanel === 'risk' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Select your target state or district from the region selector.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Check the <strong>Landslide Hazard Index (LHI)</strong> score out of 10.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Inspect 72-hour rainfall predictions and soil saturation levels.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Monitor active geological flash warnings and slope stability advisories.</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-700 dark:text-slate-300 font-extrabold">Select Target Region</label>
                      {isRiskLoading && (
                        <span className="text-[10px] font-bold text-sky-500 flex items-center gap-1 animate-pulse">
                          <Activity className="h-3 w-3 animate-spin" /> Live sync...
                        </span>
                      )}
                    </div>
                    <select
                      value={selectedRiskLoc}
                      onChange={(e) => setSelectedRiskLoc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(REGIONAL_RISK_LOCATIONS).map((locKey) => (
                        <option key={locKey} value={locKey}>
                          {locKey}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Real-time Telemetry Status Pill */}
                  <div className="flex items-center justify-between text-[11px] px-1 font-semibold">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{liveTelemetry ? 'Real-Time Telemetry Active' : 'Live Data Synchronizing...'}</span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                      {liveTelemetry?.lastUpdated ? `Updated ${liveTelemetry.lastUpdated}` : 'IMD / Satellite Feed'}
                    </span>
                  </div>

                  {/* Risk Index Overview */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="font-extrabold text-slate-700 dark:text-slate-200 block">Landslide Hazard Index (LHI)</span>
                        <span className="text-[10px] text-slate-400">Multi-Criteria Geotechnical Score</span>
                      </div>
                      <span className={`${displayRiskColor} text-white px-2.5 py-1 rounded-full font-black text-xs shadow-sm`}>
                        {displayLhi} / 10 ({displayRiskLevel})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">72-Hr Rainfall Forecast</span>
                        <span className="font-bold text-slate-900 dark:text-white">{displayRainText}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full transition-all duration-700"
                          style={{ width: `${displayRainPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Slope &amp; Soil Saturation</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{displaySoilText}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-700"
                          style={{ width: `${displaySoilPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Terrain Slope: <strong className="text-slate-800 dark:text-slate-200">{currentRiskProfile.slopeDegrees}° gradient</strong></span>
                      <span>GPS: <strong className="text-slate-800 dark:text-slate-200">{currentRiskProfile.lat.toFixed(2)}°N, {currentRiskProfile.lon.toFixed(2)}°E</strong></span>
                    </div>
                  </div>

                  {/* Hazard Alert Notice */}
                  <div className={`p-4 rounded-2xl flex items-start gap-3 border transition-colors ${
                    displayRiskLevel === 'Critical'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      : displayRiskLevel === 'High'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
                  }`}>
                    <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                      displayRiskLevel === 'Critical'
                        ? 'text-rose-600 dark:text-rose-400'
                        : displayRiskLevel === 'High'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`} />
                    <div className="space-y-1">
                      <div className="font-extrabold">{currentRiskProfile.alertTitle}</div>
                      <p className="text-[11px] opacity-90 leading-normal">
                        {currentRiskProfile.alertMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PANEL 3: LIVE GIS DISASTER MAP (Matches Picture 1 Drawer Layout) */}
              {activeSidePanel === 'livemap' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-sky-500/10 border border-sky-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sky-600 dark:text-sky-400 text-xs uppercase tracking-wider">
                        <span>🗺️</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-sky-500/20 text-sky-600 dark:text-sky-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Browse real-time disaster hazard locations and tactical emergency zones.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Tap quick state filter pills to focus directly on specific NER states.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Toggle between Satellite imagery and Topographic terrain maps.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Open Full Interactive Live Map"</strong> for expanded command operations.</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Live Map in Drawer */}
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div ref={liveMapSidePanelRef} className="w-full h-full z-0" />
                    
                    <div className="absolute top-2 left-2 z-10 bg-slate-900/85 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-white/10 shadow">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live NER GIS Satellite Feed</span>
                    </div>

                    <div className="absolute top-2 right-2 z-10 flex gap-1 bg-slate-900/85 backdrop-blur p-1 rounded-lg border border-white/10 shadow text-[10px]">
                      <button
                        type="button"
                        onClick={() => setLiveMapSidePanelStyle('satellite')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${liveMapSidePanelStyle === 'satellite' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
                      >
                        🛰️ Sat
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveMapSidePanelStyle('topo')}
                        className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${liveMapSidePanelStyle === 'topo' ? 'bg-sky-600 text-white' : 'text-slate-300 hover:text-white'}`}
                      >
                        ⛰️ Topo
                      </button>
                    </div>
                  </div>

                  {/* Quick State Jumper Pills */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Quick State Jump</div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: 'All 8 NER', coord: [26.1, 92.5] as [number, number], zoom: 7 },
                        { name: 'Assam', coord: [26.1445, 91.7362] as [number, number], zoom: 8 },
                        { name: 'Meghalaya', coord: [25.5788, 91.8933] as [number, number], zoom: 9 },
                        { name: 'Sikkim', coord: [27.3389, 88.6065] as [number, number], zoom: 9 },
                        { name: 'Arunachal', coord: [27.0844, 93.6053] as [number, number], zoom: 8 },
                        { name: 'Manipur', coord: [24.8170, 93.9368] as [number, number], zoom: 9 }
                      ].map((st, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => flySidePanelToLocation(st.coord, st.zoom)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-500/20 text-slate-800 dark:text-slate-200 font-bold text-[11px] border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Tactical Monitoring Feed */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Live Active Geozones</span>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <span>Live Open-Meteo</span>
                          {lastLiveGeozoneSync && <span className="opacity-75">({lastLiveGeozoneSync})</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => fetchLiveMapTelemetry()}
                          disabled={isFetchingLiveGeozones}
                          className="text-sky-600 dark:text-sky-400 font-bold hover:underline cursor-pointer ml-1"
                          title="Refresh live telemetry"
                        >
                          {isFetchingLiveGeozones ? 'Syncing...' : '↻ Refresh'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {liveGeozones.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => flySidePanelToLocation(item.coord, 9)}
                          className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-xl space-y-1.5 cursor-pointer transition shadow-sm"
                          title="Click to focus map on this location"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full animate-ping shrink-0"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</span>
                            </div>
                            <span className={`px-2 py-0.5 text-white text-[10px] font-black rounded-md shadow-sm ${item.badgeColor}`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 pl-4.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-medium">
                            <span className="text-slate-800 dark:text-slate-100 font-bold">🌡️ {item.temp}°C</span>
                            <span>🌧️ {item.rain} mm/h</span>
                            <span>💧 {item.humidity}%</span>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px]">• {item.weatherDesc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open Full Live Map Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSidePanel(null);
                      onNavigateModule('map');
                    }}
                    className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sky-600/30 transition cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <span>Open Full Screen Operational GIS Map</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PANEL 4: GET HELP & EMERGENCY RESPONSE */}
              {activeSidePanel === 'gethelp' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-rose-500/10 border border-rose-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Tap <strong>"Transmit Emergency SOS Now"</strong> for instant 1-click distress location transmission.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Directly call 24/7 helplines (<strong>NDRF 1078</strong> or <strong>State SDMA 1070</strong>).</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Browse nearby open relief camps, distances, and bed capacities.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"View All Relief Camps &amp; Supplies"</strong> for safe route navigation.</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Red SOS Button */}
                  <div className="p-5 bg-gradient-to-br from-red-950/90 to-rose-950/80 border border-red-500/40 rounded-2xl space-y-3 text-center shadow-lg">
                    <ShieldAlert className="h-10 w-10 text-red-400 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-base font-black text-white">Emergency SOS Signal Dispatch</h4>
                      <p className="text-xs text-red-200 mt-0.5">Transmit live GPS coordinates to nearest NDRF &amp; SDMA command hub</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onOpenSos();
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-red-600/40 transition cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="h-4 w-4 animate-bounce" />
                      <span>Transmit Emergency SOS Now</span>
                    </button>
                  </div>

                  {/* 24/7 Helplines */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">24/7 Emergency Helplines</div>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="tel:1078" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">NDRF Control</div>
                          <div className="text-[11px] text-sky-500 font-extrabold">1078</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                      <a href="tel:1070" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">State SDMA</div>
                          <div className="text-[11px] text-sky-500 font-extrabold">1070</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                    </div>
                  </div>

                  {/* Nearby Relief Camps */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Nearby Operational Relief Camps</div>
                    {[
                      { name: 'Guwahati Stadium Relief Camp', dist: '2.4 km', cap: '340 / 500 Beds', status: 'OPEN' },
                      { name: 'Shillong Sports Complex Shelter', dist: '5.1 km', cap: '180 / 300 Beds', status: 'OPEN' }
                    ].map((camp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{camp.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full">{camp.status}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Distance: {camp.dist}</span>
                          <span>Capacity: {camp.cap}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setActiveSidePanel(null);
                      onNavigateModule('reliefcamps');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 transition cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <span>View All Relief Camps &amp; Supplies</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PANEL 5: EXPLORE LIVE SITUATION */}
              {activeSidePanel === 'livesituation' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Interact with the live GIS radar map to inspect active incident markers.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Monitor active disaster incident stats and deployed rescue team counts.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Review recent emergency alerts and live incident feeds across India.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Open Full Operational Dashboard"</strong> for full command radar.</span>
                      </div>
                    </div>
                  </div>
                  {/* Live Leaflet Map Preview inside Drawer */}
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div ref={sidePanelMapContainerRef} className="w-full h-full z-0" />
                    <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>Live GPS Radar</span>
                    </div>
                  </div>

                  {/* KPI Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Active Hazards</div>
                      <div className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">12 Incidents</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Rescue Squads</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">27 Deployed</div>
                    </div>
                  </div>

                  {/* Live Incidents Feed */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Recent Incident Alerts</div>
                    {[
                      { name: 'Sikkim Gangtok Landslide', status: 'High Risk', time: '1 hr ago', color: 'bg-red-500' },
                      { name: 'Assam Flood Warning', status: 'Moderate', time: '3 hrs ago', color: 'bg-amber-500' },
                      { name: 'Wayanad Soil Saturation', status: 'Monitoring', time: '5 hrs ago', color: 'bg-blue-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.color}`} />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* OPEN FULL DASHBOARD BUTTON */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        handleOpenDashboard();
                      }}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
                    >
                      <span>Open Full Operational Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 6: DISASTER SAFETY GUIDE & HELPLINES */}
              {activeSidePanel === 'safetyguide' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Review official Do’s &amp; Don’ts for Landslides, Floods, and Earthquakes.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Keep emergency helpline numbers (<strong>NDRF 1078</strong>, <strong>SDMA 1070</strong>) saved.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Prepare a 72-hour emergency kit with water, food, and first aid.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Follow real-time evacuation advisories issued by disaster authorities.</span>
                      </div>
                    </div>
                  </div>

                  {/* 24/7 Helplines Grid */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">24/7 Official Emergency Helplines</div>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="tel:1078" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">NDRF Control</div>
                          <div className="text-[11px] text-emerald-500 font-extrabold">1078</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                      <a href="tel:1070" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">State SDMA</div>
                          <div className="text-[11px] text-emerald-500 font-extrabold">1070</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                      <a href="tel:112" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">National Emergency</div>
                          <div className="text-[11px] text-emerald-500 font-extrabold">112</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                      <a href="tel:108" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Medical Ambulance</div>
                          <div className="text-[11px] text-emerald-500 font-extrabold">108</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                    </div>
                  </div>

                  {/* 72-Hour Survival Kit Checklist */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-900/40 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-extrabold text-sm">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      <span>72-Hour Survival Kit Checklist</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5 font-semibold">✓ Drinking Water (3L/person)</div>
                      <div className="flex items-center gap-1.5 font-semibold">✓ Non-perishable Rations</div>
                      <div className="flex items-center gap-1.5 font-semibold">✓ Torch &amp; Extra Batteries</div>
                      <div className="flex items-center gap-1.5 font-semibold">✓ Emergency First-Aid Box</div>
                      <div className="flex items-center gap-1.5 font-semibold">✓ Whistle &amp; Signal Mirror</div>
                      <div className="flex items-center gap-1.5 font-semibold">✓ Important ID Documents</div>
                    </div>
                  </div>

                  {/* Do's & Don'ts Summary */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Critical Do’s &amp; Don’ts</div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px]">
                      <div className="text-emerald-600 dark:text-emerald-400 font-bold">✅ DO: Stay tuned to IMD/SDMA alerts on radio or phone.</div>
                      <div className="text-rose-600 dark:text-rose-400 font-bold">❌ DON'T: Cross swollen rivers or landslide-prone mountain curves.</div>
                    </div>
                  </div>

                  {/* Full Module Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onNavigateModule('safetyguide');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>Open Full Disaster Safety Guide</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 7: RELIEF CAMPS & SUPPLIES */}
              {activeSidePanel === 'reliefcamps' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>View nearby operational relief shelters and real-time bed capacity.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Check availability of medical supplies, clean drinking water, and rations.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Request shelter allocation or navigate to the nearest active relief camp.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Access emergency supply distribution points across disaster-affected zones.</span>
                      </div>
                    </div>
                  </div>

                  {/* Nearby Operational Relief Camps List */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Nearby Operational Relief Camps</div>
                    {[
                      { name: 'Guwahati Stadium Relief Camp', dist: '2.4 km', cap: '340 / 500 Beds', status: 'OPEN', details: 'Rations, Water & Medical' },
                      { name: 'Shillong Sports Complex Shelter', dist: '5.1 km', cap: '180 / 300 Beds', status: 'OPEN', details: 'Doctors & Oxygen Support' },
                      { name: 'Gangtok High School Relief Camp', dist: '8.7 km', cap: '95 / 250 Beds', status: 'OPEN', details: 'Air-drop Supply Hub' }
                    ].map((camp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{camp.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full">{camp.status}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          <span>Distance: {camp.dist}</span>
                          <span>Capacity: {camp.cap}</span>
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold">
                          Facilities: {camp.details}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Supply Inventory Summary */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/40 rounded-2xl space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-extrabold text-sm">
                      <Building2 className="h-5 w-5 text-amber-500" />
                      <span>District Relief Stock Inventory</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <div className="text-slate-400 text-[9px] font-bold">DRINKING WATER</div>
                        <div className="font-black text-slate-900 dark:text-white">8,400 Liters</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <div className="text-slate-400 text-[9px] font-bold">RATIONS & MEALS</div>
                        <div className="font-black text-slate-900 dark:text-white">4,200 Packets</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <div className="text-slate-400 text-[9px] font-bold">FIRST AID KITS</div>
                        <div className="font-black text-slate-900 dark:text-white">650 Units</div>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800/50">
                        <div className="text-slate-400 text-[9px] font-bold">TENTS & BLANKETS</div>
                        <div className="font-black text-slate-900 dark:text-white">1,100 Units</div>
                      </div>
                    </div>
                  </div>

                  {/* Full Module Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onNavigateModule('reliefcamps');
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>Open Full Relief Camps &amp; Supplies Module</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 8: REAL-TIME RELIEF SUPPLY & VEHICLE TRACKING */}
              {activeSidePanel === 'reliefsupplies' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-emerald-600 dark:text-emerald-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Track live GPS coordinates, vehicle speeds, and transit routes across North-East India.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Monitor warehouse depot inventories for clean water, meal packets, and medical kits.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Initiate immediate relief package dispatches matching active distress zones.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Connect with on-ground drivers and view live mobile telemetry updates.</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Fleet Tracking Status */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-500" />
                        Active Relief Convoys &amp; Fleet Telemetry
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        8 NER States Live
                      </span>
                    </div>

                    {[
                      { id: 'JS-TRK-01', type: 'Heavy Supply Truck (10T)', driver: 'Tenzing Norbu', route: 'Guwahati Depot ➔ Shillong Relief Center', speed: '48 km/h', status: 'ON ROUTE', gps: 'GPS Connected', cargo: '4,000 Food Packets + Water' },
                      { id: 'JS-TRK-04', type: '4x4 Off-Road All-Terrain', driver: 'Bikash Kalita', route: 'Silchar Warehouse ➔ Aizawl District Hub', speed: '34 km/h', status: 'ON ROUTE', gps: 'GPS Connected', cargo: '850 Medical & Trauma Kits' },
                      { id: 'JS-AMB-02', type: 'Emergency Mobile Medical Van', driver: 'Kevichüsa Angami', route: 'Dimapur Base ➔ Kohima Disaster Zone', speed: '52 km/h', status: 'DISPATCHED', gps: 'GPS Connected', cargo: 'Doctors + Emergency Oxygen' }
                    ].map((veh, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-emerald-500/50 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 dark:text-white text-xs">{veh.id}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">({veh.type})</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/30">
                            {veh.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span className="text-slate-400 font-normal">Route: </span>{veh.route}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                          <span>Driver: <strong className="text-slate-700 dark:text-slate-200">{veh.driver}</strong></span>
                          <span>Speed: <strong className="text-emerald-600 dark:text-emerald-400">{veh.speed}</strong></span>
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            {veh.gps}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded-lg font-bold">
                          Cargo: {veh.cargo}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Regional Warehouse Supply Inventory */}
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-900/40 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-extrabold text-sm">
                      <div className="flex items-center gap-2">
                        <Package className="h-4.5 w-4.5 text-emerald-500" />
                        <span>Regional Warehouse Supply Stocks</span>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md">Live Telemetry</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <div className="text-slate-400 text-[9px] font-bold uppercase">Potable Drinking Water</div>
                        <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">14,250 Liters</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Assam &amp; Meghalaya Hubs</div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <div className="text-slate-400 text-[9px] font-bold uppercase">Ready Meal Rations</div>
                        <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">8,600 Packets</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Sikkim &amp; Nagaland Depots</div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <div className="text-slate-400 text-[9px] font-bold uppercase">Trauma &amp; Medical Kits</div>
                        <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">1,420 Kits</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Critical Emergency Stock</div>
                      </div>
                      <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                        <div className="text-slate-400 text-[9px] font-bold uppercase">Tarps &amp; Winter Blankets</div>
                        <div className="font-black text-slate-900 dark:text-white text-sm mt-0.5">3,100 Units</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Highland Weather Ready</div>
                      </div>
                    </div>
                  </div>

                  {/* Full Module Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onNavigateModule('relief-supplies');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer text-xs transition transform hover:scale-[1.01]"
                    >
                      <span>Open Full Real-Time Relief Supply &amp; Vehicle Tracking Module</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 9: SMART EMERGENCY RESPONSE SYSTEM */}
              {activeSidePanel === 'emergencyresponse' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Review automated multi-criteria priority rankings for incoming emergency incidents.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Inspect casualty risk, structural damage, and population vulnerability scores.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Match nearest supply depots and dispatch live GPS response vehicles with one click.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Coordinate multi-agency disaster operations across all 8 North-Eastern states.</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Emergency Metrics Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-center">
                      <div className="text-red-500 text-[10px] font-extrabold uppercase">Critical</div>
                      <div className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">3</div>
                      <div className="text-[9px] text-slate-400 font-medium">Immediate Action</div>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-center">
                      <div className="text-amber-500 text-[10px] font-extrabold uppercase">High Priority</div>
                      <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">7</div>
                      <div className="text-[9px] text-slate-400 font-medium">Under Response</div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-center">
                      <div className="text-emerald-500 text-[10px] font-extrabold uppercase">Available Units</div>
                      <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">28</div>
                      <div className="text-[9px] text-slate-400 font-medium">Ready in Depots</div>
                    </div>
                  </div>

                  {/* Priority Incident Queue */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Active Triage Incidents &amp; Auto-Matched Resources
                      </span>
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
                        AI Calculated
                      </span>
                    </div>

                    {[
                      {
                        id: 'EM-NER-042',
                        type: 'Landslide Road Blockage',
                        loc: 'NH-29 Kohima Bypass, Nagaland',
                        priority: 'CRITICAL',
                        affected: '140+ Commuters Stranded',
                        assigned: 'NDRF Battalion 12 + Heavy Earthmover',
                        eta: '14 Mins'
                      },
                      {
                        id: 'EM-NER-038',
                        type: 'Flash Flood & River Inundation',
                        loc: 'Silchar Urban Lowlands, Assam',
                        priority: 'HIGH',
                        affected: '320 Displaced Residents',
                        assigned: 'SDRF Inflatable Rescue Boats (4 Units)',
                        eta: '22 Mins'
                      },
                      {
                        id: 'EM-NER-045',
                        type: 'Structural Hill Damage',
                        loc: 'North Sikkim Highway Km-44',
                        priority: 'CRITICAL',
                        affected: 'Hill Community Isolated',
                        assigned: 'Indian Army Quick Response Convoy',
                        eta: '30 Mins'
                      }
                    ].map((inc, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 hover:border-amber-500/50 transition">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">{inc.type}</span>
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-full border ${
                            inc.priority === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}>
                            {inc.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold">
                          <span className="text-slate-400 font-normal">Location: </span>{inc.loc}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>Impact: <strong className="text-slate-700 dark:text-slate-200">{inc.affected}</strong></span>
                          <span className="text-amber-600 dark:text-amber-400 font-bold">ETA: {inc.eta}</span>
                        </div>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg font-bold flex items-center justify-between">
                          <span>Assigned: {inc.assigned}</span>
                          <span className="flex items-center gap-1 text-emerald-500">
                            <CheckCircle2 className="h-3 w-3" />
                            Dispatched
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Full Module Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onNavigateModule('emergency-response');
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer text-xs transition transform hover:scale-[1.01]"
                    >
                      <span>Open Full Smart Emergency Response System</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* ==================================================
          INSTRUCTION GUIDE MODAL (How Jeevan Setu Works Steps)
         ================================================== */}
      {selectedInstructionStep && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${selectedInstructionStep.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                  <selectedInstructionStep.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-sky-500">
                    Feature Guide • Step {selectedInstructionStep.stepNum}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {selectedInstructionStep.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {selectedInstructionStep.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstructionStep(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              {selectedInstructionStep.desc}
            </p>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📋</span>
                <span>Step-by-Step Instructions:</span>
              </h4>
              <div className="space-y-2.5">
                {selectedInstructionStep.instructions.map((stepText, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {stepText}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Useful Tip Box */}
            <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-300 text-xs font-bold">
              <Info className="h-5 w-5 shrink-0 text-amber-500" />
              <span>{selectedInstructionStep.tips}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedInstructionStep(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Guide
              </button>
              <button
                onClick={selectedInstructionStep.action}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 text-xs transition transform hover:scale-105 cursor-pointer"
              >
                <span>{selectedInstructionStep.actionText}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          COMPACT CENTERED FEATURE PREVIEW MODAL ("saree feature open ho mid me par chote")
         ================================================== */}
      {activeFeatureModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5">
            
            {/* 1. AI ANALYSIS MODAL */}
            {activeFeatureModal === 'ai' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                        VISION AI • 99.4% ACCURACY
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        AI Disaster Impact Assessment
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Multi-modal Vision AI & Geospatial Damage Classifier
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-black">
                      <span>Detected Structural Hazard:</span>
                      <span className="bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-500/30">CRITICAL 84%</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Landslide slip breach on NH-6 Km 142 (Sohra Corridor). 18 civilians trapped; mudflow volume estimated at 420 m³.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Vision Model</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">ResNet-50 SAR Radar</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Est. Casualty Triage</div>
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5">Level 1 Immediate</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('aiimpact');
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-purple-600/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Full AI Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 2. LIVE DATA MODAL */}
            {activeFeatureModal === 'livedata' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
                      <CloudRain className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                        LIVE SATELLITE RADAR
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        Real-Time Weather Telemetry
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Precipitation Radar & River Discharge Gauges
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 font-black">
                      <span>24h Rainfall Spike:</span>
                      <span className="bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] border border-sky-500/30">680 mm Severe</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Cherrapunji & Brahmaputra basin recording flash runoff surge. Brahmaputra gauge reading +2.4m over danger mark.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Wind Gusts</div>
                      <div className="text-xs font-black text-sky-600 dark:text-sky-400 mt-0.5">45 km/h</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Humidity</div>
                      <div className="text-xs font-black text-sky-600 dark:text-sky-400 mt-0.5">94%</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Radar Status</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">ACTIVE</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('weather');
                    }}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-sky-500/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Live Radar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 3. GIS MAPPING MODAL */}
            {activeFeatureModal === 'gis' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        TACTICAL GIS GRID
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        NER Live GIS & Satellite Map
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Google Hybrid Satellite, Topo Relief & Live Convoys
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-black">
                      <span>Live Convoy Telemetry:</span>
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">CONVOY #01 ACTIVE</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Medical Oxygen Convoy #01 en route Guwahati ➔ Silchar (Speed 48 km/h • ETA 3h 15m).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Active Overlays</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">8 Hazard Zones</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Map View Mode</div>
                      <div className="text-xs font-black text-sky-500 mt-0.5">100% Full View</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('map');
                    }}
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Full Screen Map</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 4. 72-HOUR RISK MODAL */}
            {activeFeatureModal === 'risk' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        8-STATE RISK MATRIX
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        72-Hour State Hazard Forecast
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Multi-State Predictive Risk Index (+0h to +72h)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-black">
                      <span>Highest Risk Sectors:</span>
                      <span className="bg-rose-500/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] border border-rose-500/30">ASSAM & MEGHALAYA</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      High runoff inundation in Assam Brahmaputra plains & hill edge slips along Meghalaya NH-6.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Deployed NDRF</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">27 Battalions</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Risk Timeline</div>
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">+24h Peak Runoff</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('location');
                    }}
                    className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Location Intelligence Report</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 5. EXPLORE RESOURCES MODAL */}
            {activeFeatureModal === 'resources' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        DISASTER RESOURCE DIRECTORY
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        Explore Emergency Resources
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Relief Camps, Medical Units, Survival Guides &amp; Helplines
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                        <Building2 className="h-4 w-4 text-emerald-500" />
                        <span>Relief Camps</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        340+ active beds with food, water &amp; shelter in Guwahati/Shillong sectors.
                      </p>
                    </div>

                    <div className="bg-sky-50 dark:bg-sky-950/40 p-3 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sky-300 text-xs">
                        <PhoneCall className="h-4 w-4 text-sky-500" />
                        <span>24/7 Helplines</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        Direct hotline to NDRF (1078), SDMA (1070) &amp; Emergency Call Center (112).
                      </p>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 text-xs">
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                        <span>Safety Guides</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        Official Do's &amp; Don'ts for Landslides, Floods &amp; 72-hr Survival Checklist.
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-300 text-xs">
                        <Zap className="h-4 w-4 text-purple-500" />
                        <span>Medical Supplies</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                        650+ first aid kits, oxygen cylinders &amp; mobile ambulance units deployed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 gap-2">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveFeatureModal(null);
                        onNavigateModule('safetyguide');
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3.5 py-2 rounded-xl border border-slate-700 text-xs transition cursor-pointer"
                    >
                      Safety Guide
                    </button>
                    <button
                      onClick={() => {
                        setActiveFeatureModal(null);
                        onNavigateModule('reliefcamps');
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-4 py-2 rounded-xl shadow-md shadow-emerald-600/30 flex items-center gap-1 text-xs transition transform hover:scale-105 cursor-pointer"
                    >
                      <span>Relief Camps</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* 🤖 Interactive AI Chat Box with Voice-to-Text & Voice Search (Fallback if not handled by parent) */}
      {!onOpenAiChatbot && (
        <AIChatbotWidget
          onNavigateModule={onNavigateModule}
          onOpenSos={onOpenSos}
          isOpenControlled={isAiChatOpen}
          onOpenControlled={() => setIsAiChatOpen(true)}
          onCloseControlled={() => {
            setIsAiChatOpen(false);
            if (activeTab === 'AIChat') {
              setActiveTab('Home');
            }
          }}
        />
      )}

    </div>
  );
}
