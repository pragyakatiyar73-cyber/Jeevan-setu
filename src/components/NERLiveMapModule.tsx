import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../i18n";
import {
  Layers,
  CheckCircle2,
  X,
  MapPin,
  Radio,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Zap,
  Navigation,
  Activity,
  Maximize2,
  Minimize2,
  Search,
  Sparkles,
  ChevronDown,
  ArrowLeft,
  Waves,
  CloudRain,
  Mountain,
  Wind,
  Plane,
  Truck,
  Info,
  Filter,
  Eye,
  RefreshCw
} from "lucide-react";

export interface NERLiveMapModuleProps {
  hideHeader?: boolean;
  activeSosLocation?: {
    lat: number;
    lon: number;
    sosId?: string;
    landmark?: string;
    personsTrapped?: string;
    triageLevel?: string;
  } | null;
  focusedTarget?: { coord: [number, number]; zoom: number } | null;
  onNavigateTo3DSim?: () => void;
  onTriggerSOS?: () => void;
  onBackToDashboard?: () => void;
}

export interface NERStateData {
  id: string;
  name: string;
  capital: string;
  center: [number, number];
  zoom: number;
  districts: Array<{ name: string; coord: [number, number] }>;
}

export interface NERHazardHotspot {
  id: string;
  name: string;
  category: 'FLOOD' | 'LANDSLIDE' | 'STORM' | 'SEISMIC';
  state: string;
  stateId: string;
  district: string;
  coord: [number, number];
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  radiusMeters: number;
  description: string;
  metricLabel: string;
  metricValue: string;
  dangerBaseline: string;
  logisticsImpact: string;
  safeDetour: string;
  source: string;
}

// 8 North Eastern Region (NER) Sovereign States & District Dataset
export const NER_STATES_DATA: NERStateData[] = [
  {
    id: 'arunachal',
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    center: [28.2180, 94.7278],
    zoom: 8,
    districts: [
      { name: 'Itanagar / Papum Pare', coord: [27.0844, 93.6053] },
      { name: 'Tawang Sector', coord: [27.5861, 91.8504] },
      { name: 'Sela Pass Sector', coord: [27.5021, 92.1034] },
      { name: 'West Kameng (Bomdila)', coord: [27.2642, 92.4159] },
      { name: 'East Siang (Pasighat)', coord: [28.0660, 95.3262] },
      { name: 'Lower Subansiri (Ziro)', coord: [27.5947, 93.8385] },
      { name: 'Changlang Sector', coord: [27.1268, 95.7337] }
    ]
  },
  {
    id: 'assam',
    name: 'Assam',
    capital: 'Dispur / Guwahati',
    center: [26.2006, 92.9376],
    zoom: 8,
    districts: [
      { name: 'Kamrup Metro (Guwahati)', coord: [26.1445, 91.7362] },
      { name: 'Kaziranga / Lakhimpur Basin', coord: [26.5800, 93.1700] },
      { name: 'Dibrugarh Sector', coord: [27.4728, 94.9120] },
      { name: 'Cachar (Silchar)', coord: [24.8333, 92.7789] },
      { name: 'Jorhat', coord: [26.7509, 94.2037] },
      { name: 'Sonitpur (Tezpur)', coord: [26.6338, 92.8006] },
      { name: 'Nagaon', coord: [26.3462, 92.6840] },
      { name: 'Barpeta', coord: [26.3228, 91.0048] },
      { name: 'Majuli Island', coord: [26.9500, 94.2167] },
      { name: 'Dima Hasao (Haflong)', coord: [25.1667, 93.0167] }
    ]
  },
  {
    id: 'manipur',
    name: 'Manipur',
    capital: 'Imphal',
    center: [24.6637, 93.9063],
    zoom: 9,
    districts: [
      { name: 'Imphal West', coord: [24.8170, 93.9368] },
      { name: 'Imphal East', coord: [24.8000, 93.9500] },
      { name: 'Noney Landslide Corridor', coord: [24.7890, 93.6540] },
      { name: 'Churachandpur', coord: [24.3333, 93.6833] },
      { name: 'Loktak Lake / Bishnupur', coord: [24.5500, 93.8000] },
      { name: 'Ukhrul', coord: [25.1167, 94.3667] },
      { name: 'Tamenglong', coord: [24.9833, 93.4833] },
      { name: 'Senapati', coord: [25.2667, 94.0167] }
    ]
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya',
    capital: 'Shillong',
    center: [25.4670, 91.3662],
    zoom: 9,
    districts: [
      { name: 'East Khasi Hills (Shillong)', coord: [25.5788, 91.8933] },
      { name: 'Sohra / Cherrapunji Sector', coord: [25.2702, 91.7323] },
      { name: 'Mawsynram Cloudburst Alley', coord: [25.2970, 91.5822] },
      { name: 'West Garo Hills (Tura)', coord: [25.5142, 90.2032] },
      { name: 'West Jaintia Hills (Jowai)', coord: [25.4452, 92.2081] },
      { name: 'Ri-Bhoi (Nongpoh)', coord: [25.9038, 91.8812] },
      { name: 'West Khasi Hills (Nongstoin)', coord: [25.5204, 91.2678] }
    ]
  },
  {
    id: 'mizoram',
    name: 'Mizoram',
    capital: 'Aizawl',
    center: [23.1645, 92.9376],
    zoom: 9,
    districts: [
      { name: 'Aizawl Ridge Sector', coord: [23.7271, 92.7176] },
      { name: 'Lunglei', coord: [22.8841, 92.7347] },
      { name: 'Champhai Mountain Pass', coord: [23.4735, 93.3276] },
      { name: 'Serchhip', coord: [23.3086, 92.8465] },
      { name: 'Mamit', coord: [23.9287, 92.4891] },
      { name: 'Kolasib', coord: [24.2255, 92.6789] }
    ]
  },
  {
    id: 'nagaland',
    name: 'Nagaland',
    capital: 'Kohima',
    center: [26.1584, 94.5624],
    zoom: 9,
    districts: [
      { name: 'Kohima Capital Ridge', coord: [25.6751, 94.1086] },
      { name: 'Dimapur Dhansiri Basin', coord: [25.9060, 93.7270] },
      { name: 'Zubza Pass Landslide Corridor', coord: [25.6890, 94.0450] },
      { name: 'Mokokchung', coord: [26.3262, 94.5203] },
      { name: 'Tuensang', coord: [26.2841, 94.8315] },
      { name: 'Wokha', coord: [26.0984, 94.2612] },
      { name: 'Mon Border Sector', coord: [26.7481, 95.0594] }
    ]
  },
  {
    id: 'sikkim',
    name: 'Sikkim',
    capital: 'Gangtok',
    center: [27.5330, 88.5122],
    zoom: 9,
    districts: [
      { name: 'East Sikkim (Gangtok)', coord: [27.3389, 88.6065] },
      { name: 'North Sikkim (Mangan)', coord: [27.5020, 88.5342] },
      { name: 'Chungthang Surge Sector', coord: [27.5800, 88.6200] },
      { name: 'Singtam Teesta Basin', coord: [27.2340, 88.4980] },
      { name: 'NH-10 Teesta Gorge (29th Mile)', coord: [27.0500, 88.4600] },
      { name: 'South Sikkim (Namchi)', coord: [27.1664, 88.3639] },
      { name: 'West Sikkim (Gyalshing)', coord: [27.2833, 88.2333] }
    ]
  },
  {
    id: 'tripura',
    name: 'Tripura',
    capital: 'Agartala',
    center: [23.9408, 91.9882],
    zoom: 9,
    districts: [
      { name: 'West Tripura (Agartala)', coord: [23.8315, 91.2868] },
      { name: 'North Tripura (Dharmanagar)', coord: [24.3739, 92.1642] },
      { name: 'Gomati (Udaipur Basin)', coord: [23.5333, 91.4833] },
      { name: 'Dhalai (Ambassa)', coord: [23.8441, 91.8507] },
      { name: 'South Tripura (Belonia)', coord: [23.2494, 91.4556] }
    ]
  }
];

// Master Disaster Risk Hotspots across 8 NER States
export const NER_DISASTER_HOTSPOTS: NERHazardHotspot[] = [
  // 🌊 FLOOD BASINS & DELUGE ZONES
  {
    id: "FLD-AS-01",
    name: "Kaziranga - Lakhimpur Floodplain",
    category: "FLOOD",
    state: "Assam",
    stateId: "assam",
    district: "Lakhimpur / Golaghat",
    coord: [26.5800, 93.1700],
    severity: "CRITICAL",
    radiusMeters: 22000,
    description: "Catastrophic Brahmaputra river overflow. Multiple breached earthen embankments, 42,000+ villagers in low-lying riparian plain vulnerable to surging floodwaters.",
    metricLabel: "Brahmaputra River Stage",
    metricValue: "104.8m (Surging)",
    dangerBaseline: "Danger Mark: 103.5m (+1.3m)",
    logisticsImpact: "NH-715 submerged in 3 sectors. Freight traffic suspended.",
    safeDetour: "Divert via NH-15 Northern Bank corridor or Kaliabor Ridge bypass.",
    source: "Central Water Commission (CWC) & ASDMA River Gauges"
  },
  {
    id: "FLD-AS-02",
    name: "Majuli Island Braided Surge Zone",
    category: "FLOOD",
    state: "Assam",
    stateId: "assam",
    district: "Majuli",
    coord: [26.9500, 94.2167],
    severity: "CRITICAL",
    radiusMeters: 18000,
    description: "Brahmaputra & Subansiri confluence surge causing bank erosion and complete island cut-off. High water levels across Kamalabari and Garamur.",
    metricLabel: "Island Inundation Level",
    metricValue: "87.4m MSL",
    dangerBaseline: "Danger Mark: 86.0m (+1.4m)",
    logisticsImpact: "All river ferry operations suspended. Emergency motorized country boats deployed.",
    safeDetour: "Evacuate to concrete elevated flood shelters (Garamur Multi-Purpose Center).",
    source: "Brahmaputra Board & CWC Telemetry"
  },
  {
    id: "FLD-AS-03",
    name: "Silchar / Barak Valley Inundation Basin",
    category: "FLOOD",
    state: "Assam",
    stateId: "assam",
    district: "Cachar",
    coord: [24.8333, 92.7789],
    severity: "CRITICAL",
    radiusMeters: 16000,
    description: "Severe urban backflow from the swollen Barak River basin. Bethukandi embankment vulnerability creating intense residential inundation across Silchar city.",
    metricLabel: "Barak River Level",
    metricValue: "20.6m (Critical)",
    dangerBaseline: "Danger Mark: 19.8m (+0.8m)",
    logisticsImpact: "City interior roads waterlogged up to 4 ft. Supply convoys require 4x4 or boats.",
    safeDetour: "Bypass through bypass link towards Kumbhirgram / airport road.",
    source: "CWC Telemetry & Cachar District Disaster Management"
  },
  {
    id: "FLD-SK-01",
    name: "Singtam - Teesta River Surge Basin",
    category: "FLOOD",
    state: "Sikkim",
    stateId: "sikkim",
    district: "East Sikkim",
    coord: [27.2340, 88.4980],
    severity: "CRITICAL",
    radiusMeters: 14000,
    description: "High-velocity glacial & rainfall flash flood funnel along Teesta basin. Heavy sediment deposit threatening bridges, residential riverfront and power infrastructure.",
    metricLabel: "Teesta Discharge Rate",
    metricValue: "3,850 cumec",
    dangerBaseline: "Safe Threshold: 2,200 cumec",
    logisticsImpact: "Singtam footbridge and low bypass roads inundated.",
    safeDetour: "Use elevated Sirwani bypass to Gyalshing/Namchi.",
    source: "Sikkim State Disaster Management Authority (SSDMA) & CWC"
  },
  {
    id: "FLD-AR-01",
    name: "Pasighat Siang River Floodplain",
    category: "FLOOD",
    state: "Arunachal Pradesh",
    stateId: "arunachal",
    district: "East Siang",
    coord: [28.0660, 95.3262],
    severity: "HIGH",
    radiusMeters: 16000,
    description: "High-velocity Himalayan glacial runoff and heavy catchment rainfall causing high river stage on Siang (Brahmaputra main tributary).",
    metricLabel: "Siang Water Level",
    metricValue: "154.5m MSL",
    dangerBaseline: "Danger Mark: 153.9m (+0.6m)",
    logisticsImpact: "Downstream ferry ghats closed; Pasighat-Pangin route caution.",
    safeDetour: "Maintain transit on high ridge bypass; avoid lower riverbank roads.",
    source: "CWC Pasighat Station & Central Water Commission"
  },
  {
    id: "FLD-MN-01",
    name: "Loktak Lake & Bishnupur Flood Basin",
    category: "FLOOD",
    state: "Manipur",
    stateId: "manipur",
    district: "Bishnupur",
    coord: [24.5500, 93.8000],
    severity: "MODERATE",
    radiusMeters: 15000,
    description: "Natural lake basin accumulation. Floating phumdi displacement and backwater flooding across peripheral agricultural villages in Moirang and Thanga.",
    metricLabel: "Lake Elevation",
    metricValue: "768.8m MSL",
    dangerBaseline: "Overflow Mark: 768.5m",
    logisticsImpact: "Waterlogging along lakeshore roads; light craft relief required.",
    safeDetour: "Tiddim Road (NH-2) operational along higher western alignment.",
    source: "Loktak Development Authority & Manipur Irrigation Dept"
  },
  {
    id: "FLD-TR-01",
    name: "Gomati River Basin / Udaipur Sector",
    category: "FLOOD",
    state: "Tripura",
    stateId: "tripura",
    district: "Gomati",
    coord: [23.5333, 91.4833],
    severity: "HIGH",
    radiusMeters: 14000,
    description: "Spillway discharge from Dumbur Hydro Dam upstream combined with monsoon runoff causing rapid river swelling across Kakraban and Udaipur plains.",
    metricLabel: "Gomati Gauge Height",
    metricValue: "21.9m",
    dangerBaseline: "Danger Mark: 21.0m (+0.9m)",
    logisticsImpact: "Submersion of low bridges and connecting link roads to Amarpur.",
    safeDetour: "Follow Agartala-Sabroom National Highway (NH-8) high embankment.",
    source: "Tripura Disaster Management Authority"
  },

  // 🌧️ SEVERE STORMS, CLOUDBURSTS & CONVECTIVE CELLS
  {
    id: "STM-ME-01",
    name: "Cherrapunji (Sohra) / Mawsynram Cloudburst Alley",
    category: "STORM",
    state: "Meghalaya",
    stateId: "meghalaya",
    district: "East Khasi Hills",
    coord: [25.2702, 91.7323],
    severity: "CRITICAL",
    radiusMeters: 18000,
    description: "World's most intense precipitation funnel. Deep Bay of Bengal monsoon orographic lift triggering intense cloudbursts (>300 mm/24h) and sudden gorge torrents.",
    metricLabel: "Precipitation Rate",
    metricValue: "34.5 mm/hr (Extreme)",
    dangerBaseline: "High Alert Threshold: >20 mm/hr",
    logisticsImpact: "Near-zero visibility and heavy water sheeting on SH-5 mountain pass.",
    safeDetour: "Restrict night driving; shelter at Sohra Civil Sub-Divisional Depot.",
    source: "India Meteorological Department (IMD) Radar & Doppler Station"
  },
  {
    id: "STM-ME-02",
    name: "Tura / Garo Hills Tropical Depression Belt",
    category: "STORM",
    state: "Meghalaya",
    stateId: "meghalaya",
    district: "West Garo Hills",
    coord: [25.5142, 90.2032],
    severity: "HIGH",
    radiusMeters: 16000,
    description: "Convective tropical storm gateway channel. High gale-force wind squalls (up to 75 km/h) uprooting forest canopy, accompanied by sudden flash downpours.",
    metricLabel: "Wind Gust Velocity",
    metricValue: "68.2 km/h (Gale)",
    dangerBaseline: "Severe Gale: >60 km/h",
    logisticsImpact: "Tree-fall hazards on Tura-Dalu border highway corridor.",
    safeDetour: "Emergency convoys prioritize NH-127B high clearance trucks.",
    source: "IMD Guwahati Regional Meteorological Centre"
  },
  {
    id: "STM-AS-01",
    name: "North Lakhimpur - Dhemaji Convective Storm Cell",
    category: "STORM",
    state: "Assam",
    stateId: "assam",
    district: "Dhemaji",
    coord: [27.2300, 94.1000],
    severity: "HIGH",
    radiusMeters: 15000,
    description: "Severe mesoscale convective cell with frequent cloud-to-ground lightning strikes, localized hailstorms, and sudden 50+ mm torrential bursts.",
    metricLabel: "Atmospheric Lightning Index",
    metricValue: "Severe / 180 strikes/hr",
    dangerBaseline: "Warning Threshold: >60 strikes/hr",
    logisticsImpact: "Power transmission trips; wireless repeater standby.",
    safeDetour: "Secure open logistics storage; avoid high iron transmission pylons.",
    source: "IMD Doppler Weather Radar (Mohanbari)"
  },
  {
    id: "STM-TR-01",
    name: "Dharmanagar Nor'wester Squall Front",
    category: "STORM",
    state: "Tripura",
    stateId: "tripura",
    district: "North Tripura",
    coord: [24.3739, 92.1642],
    severity: "MODERATE",
    radiusMeters: 13000,
    description: "Kalbaishakhi storm front with violent microbursts and torrential squalls moving eastwards from Sylhet plains.",
    metricLabel: "Squall Gust Speed",
    metricValue: "56.4 km/h",
    dangerBaseline: "Squall Warning: >50 km/h",
    logisticsImpact: "Damage to lightweight relief tents and tin roofs.",
    safeDetour: "Anchor relief shelters with tension cables; keep trucks parked in lee side.",
    source: "IMD Agartala Station"
  },

  // ⛰️ CRITICAL LANDSLIDES & SLOPE COLLAPSE CORRIDORS
  {
    id: "LS-SK-01",
    name: "NH-10 Teesta Gorge (29th Mile / Kali Jhora)",
    category: "LANDSLIDE",
    state: "Sikkim",
    stateId: "sikkim",
    district: "East Sikkim / Kalimpong Border",
    coord: [27.0500, 88.4600],
    severity: "CRITICAL",
    radiusMeters: 15000,
    description: "Sikkim's primary lifeline. Chronic hillside rockfall, toe erosion by raging Teesta river, and deep slope shearing repeatedly cutting off Gangtok.",
    metricLabel: "Slope Incline & Stability",
    metricValue: "48° Incline (Active Creep)",
    dangerBaseline: "Critical Angle: >35°",
    logisticsImpact: "NH-10 closed at 29th Mile. No heavy vehicular transit.",
    safeDetour: "Compulsory detour via NH-717A Lava - Algarah - Rongpo bypass corridor.",
    source: "Border Roads Organisation (Project Swastik) & GSI"
  },
  {
    id: "LS-SK-02",
    name: "Chungthang Moraine Collapse Ridge",
    category: "LANDSLIDE",
    state: "Sikkim",
    stateId: "sikkim",
    district: "North Sikkim",
    coord: [27.5800, 88.6200],
    severity: "CRITICAL",
    radiusMeters: 12000,
    description: "Unstable moraine debris slopes following dam breach and heavy rainfall. Extreme rockfall hazard severing access to Lachen and Lachung high valleys.",
    metricLabel: "Terrain Elevation & Slope",
    metricValue: "1,790m MSL / 52° Slope",
    dangerBaseline: "Critical Angle: >40°",
    logisticsImpact: "Mangan-Chungthang road restricted to military tracked vehicles.",
    safeDetour: "BRO Bailey bridge crossing under active drone spotter surveillance.",
    source: "BRO Swastik & North Sikkim District Police"
  },
  {
    id: "LS-AR-01",
    name: "Sela Pass Landslide & Avalanche Corridor",
    category: "LANDSLIDE",
    state: "Arunachal Pradesh",
    stateId: "arunachal",
    district: "Tawang / West Kameng",
    coord: [27.5021, 92.1034],
    severity: "CRITICAL",
    radiusMeters: 14000,
    description: "High alpine pass (4,170m MSL) with active debris slips, snowmelt mudflows, and sudden rock avalanches blocking NH-13 Trans-Arunachal corridor.",
    metricLabel: "Pass Elevation",
    metricValue: "4,170m MSL / 46° Gradient",
    dangerBaseline: "Critical Alpine Hazard",
    logisticsImpact: "Surface pass blocked; traffic diverted through twin Sela Tunnels.",
    safeDetour: "Use newly commissioned Sela Tunnel (Tunnel 1 & 2) with convoy regulation.",
    source: "Border Roads Organisation (Project Vartak)"
  },
  {
    id: "LS-AS-01",
    name: "Jatinga - Haflong Landslide Sector (Dima Hasao)",
    category: "LANDSLIDE",
    state: "Assam",
    stateId: "assam",
    district: "Dima Hasao",
    coord: [25.1667, 93.0167],
    severity: "HIGH",
    radiusMeters: 16000,
    description: "Barail hill range cutting section with weak shale-sandstone strata. Heavy monsoon saturation triggers deep-seated rotational mudslides.",
    metricLabel: "Soil Saturation Level",
    metricValue: "88% Saturation",
    dangerBaseline: "Liquefaction Threshold: >75%",
    logisticsImpact: "NH-27 East-West Corridor single-lane traffic; slow transit.",
    safeDetour: "Emergency bypass through Umrangso-Lanka route.",
    source: "ASDMA & Northeast Frontier Railway (NFR) Geo-cell"
  },
  {
    id: "LS-NL-01",
    name: "Zubza Pass Sinking Corridor (NH-29)",
    category: "LANDSLIDE",
    state: "Nagaland",
    stateId: "nagaland",
    district: "Kohima",
    coord: [25.6890, 94.0450],
    severity: "HIGH",
    radiusMeters: 12000,
    description: "Active subsurface water table causing roadbed sinking, lateral displacement and mudflows along Dimapur-Kohima lifeline.",
    metricLabel: "Roadbed Displacement",
    metricValue: "18 cm/week Creep",
    dangerBaseline: "Stability Threshold: <2 cm/week",
    logisticsImpact: "Heavy freight trucks above 16 tonnes restricted.",
    safeDetour: "Bypass via Jotsoma - Khonoma mountain link.",
    source: "Nagaland PWD (National Highways) & NSDMA"
  },
  {
    id: "LS-MN-01",
    name: "Tupul / Noney Hillside Slump Corridor",
    category: "LANDSLIDE",
    state: "Manipur",
    stateId: "manipur",
    district: "Noney",
    coord: [24.7890, 93.6540],
    severity: "CRITICAL",
    radiusMeters: 14000,
    description: "Steep phyllitic slope failure zone along Imphal-Jiribam Highway (NH-37). Chronic mud avalanches and threat of Ijei River damming.",
    metricLabel: "Slope Incline",
    metricValue: "44° Angle / 890m MSL",
    dangerBaseline: "Critical Angle: >35°",
    logisticsImpact: "NH-37 blocked intermittently; civil supply convoys stranded.",
    safeDetour: "Emergency airlift from Imphal Tulihal or escorted 4x4 convoy only.",
    source: "Geological Survey of India (GSI) & Manipur Relief Dept"
  },
  {
    id: "LS-MZ-01",
    name: "Champhai Ridge Erosion Corridor",
    category: "LANDSLIDE",
    state: "Mizoram",
    stateId: "mizoram",
    district: "Champhai",
    coord: [23.4735, 93.3276],
    severity: "HIGH",
    radiusMeters: 12000,
    description: "High mountain ridge highway cutting through fractured shale formations. Landslides trigger supply isolation for border communities.",
    metricLabel: "Hillside Gradient",
    metricValue: "40° / 1,675m MSL",
    dangerBaseline: "Critical Gradient: >30°",
    logisticsImpact: "Single-lane traffic regulated by Village Disaster Teams.",
    safeDetour: "Cautious transit during daytime only; halt during downpours.",
    source: "Disaster Management & Rehabilitation Dept, Mizoram"
  },

  // ⚡ SEISMIC FAULTS & TECTONIC SHEAR BELTS
  {
    id: "SEIS-AS-01",
    name: "Kopili Fault Zone (Assam / Meghalaya)",
    category: "SEISMIC",
    state: "Assam",
    stateId: "assam",
    district: "Karbi Anglong / Dima Hasao",
    coord: [26.0000, 92.8000],
    severity: "HIGH",
    radiusMeters: 25000,
    description: "Active intraplate tectonic shear zone responsible for the 2021 M6.4 Dhekiajuli quake. Highest seismic hazard classification (Zone V).",
    metricLabel: "Seismic Vulnerability",
    metricValue: "Seismic Zone V (Highest)",
    dangerBaseline: "Peak Ground Accel: >0.36g",
    logisticsImpact: "Vulnerability of railway masonry bridges and mountain road retaining walls.",
    safeDetour: "Maintain structural surveillance on bridge piers along NH-27.",
    source: "National Center for Seismology (NCS) & GSI"
  },
  {
    id: "SEIS-ME-01",
    name: "Dauki Tectonic Fault Margin",
    category: "SEISMIC",
    state: "Meghalaya",
    stateId: "meghalaya",
    district: "East Khasi Hills / South Margin",
    coord: [25.1800, 91.5000],
    severity: "HIGH",
    radiusMeters: 28000,
    description: "Steep crustal tectonic boundary between the uplifted Meghalaya Plateau and the low Bengal Basin. Historical Great 1897 Earthquake source zone.",
    metricLabel: "Crustal Strain Rate",
    metricValue: "High Tectonic Lock",
    dangerBaseline: "Historical Potential: M8.0+",
    logisticsImpact: "High liquefaction risk in river valleys; bridge abutments under watch.",
    safeDetour: "Emergency evacuation towards northern granite plateau (Shillong).",
    source: "Geological Survey of India & Wadia Institute"
  }
];

// Strategic National Highway Lifelines across NER
export const NER_HIGHWAY_LIFELINES = [
  {
    id: "HWY-NH10",
    name: "NH-10 Sikkim Teesta Lifeline (Sevoke ➔ Gangtok)",
    state: "Sikkim",
    status: "CRITICAL",
    warning: "Active Landslides at 29th Mile & Kali Jhora. Restricted flow.",
    coords: [
      [26.7200, 88.4200],
      [26.8800, 88.4700],
      [27.0500, 88.4600],
      [27.1800, 88.5100],
      [27.3389, 88.6065]
    ] as [number, number][]
  },
  {
    id: "HWY-NH27",
    name: "NH-27 East-West Trans-Assam Corridor (Guwahati ➔ Silchar)",
    state: "Assam",
    status: "CAUTION",
    warning: "Hill cutting sections in Dima Hasao subject to mud runoff.",
    coords: [
      [26.1445, 91.7362],
      [26.3462, 92.6840],
      [25.7500, 93.1667],
      [25.1667, 93.0167],
      [24.8333, 92.7789]
    ] as [number, number][]
  },
  {
    id: "HWY-NH6",
    name: "NH-6 Meghalaya-Barak Arterial (Guwahati ➔ Shillong ➔ Silchar)",
    state: "Meghalaya",
    status: "OPEN",
    warning: "Wet pavement and fog in East Khasi Hills. Maintain safe distance.",
    coords: [
      [26.1445, 91.7362],
      [25.9038, 91.8812],
      [25.5788, 91.8933],
      [25.4452, 92.2081],
      [24.8333, 92.7789]
    ] as [number, number][]
  },
  {
    id: "HWY-NH29",
    name: "NH-29 Nagaland-Manipur Gateway (Dimapur ➔ Kohima ➔ Imphal)",
    state: "Nagaland",
    status: "CAUTION",
    warning: "Roadbed subsidence active at Zubza Pass. Single-lane bottleneck.",
    coords: [
      [25.9060, 93.7270],
      [25.6890, 94.0450],
      [25.6751, 94.1086],
      [25.2667, 94.0167],
      [24.8170, 93.9368]
    ] as [number, number][]
  }
];

// Strategic Emergency Landing Zones & Relief Hubs
export const NER_HELIPADS_AND_DEPOS = [
  { id: "LZ-01", name: "Guwahati LGBI Air Base (Assam)", coord: [26.1061, 91.5859], type: "PRIMARY AIR HUB", state: "Assam" },
  { id: "LZ-02", name: "Shillong Umroi Airport (Meghalaya)", coord: [25.7042, 91.9788], type: "MILITARY HELIPAD", state: "Meghalaya" },
  { id: "LZ-03", name: "Gangtok Libing Helipad (Sikkim)", coord: [27.3200, 88.6100], type: "MOUNTAIN RELIEF LZ", state: "Sikkim" },
  { id: "LZ-04", name: "Pasighat Advanced Landing Ground (Arunachal)", coord: [28.0667, 95.3333], type: "FORWARD AIR BASE", state: "Arunachal Pradesh" },
  { id: "LZ-05", name: "Aizawl Lengpui Airport (Mizoram)", coord: [23.8400, 92.6200], type: "RELIEF AIR HUB", state: "Mizoram" },
  { id: "LZ-06", name: "Kohima Helipad Sector (Nagaland)", coord: [25.6600, 94.1200], type: "DISASTER LZ", state: "Nagaland" },
  { id: "LZ-07", name: "Imphal Tulihal Airport (Manipur)", coord: [24.7600, 93.8967], type: "STRATEGIC LOGISTICS DEPOT", state: "Manipur" },
  { id: "LZ-08", name: "Agartala MBB Airport (Tripura)", coord: [23.8869, 91.2405], type: "RELIEF CARGO HUB", state: "Tripura" }
];

export default function NERLiveMapModule({
  hideHeader,
  activeSosLocation,
  focusedTarget,
  onNavigateTo3DSim,
  onTriggerSOS,
  onBackToDashboard
}: NERLiveMapModuleProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  // State & Category Filters
  const [selectedStateId, setSelectedStateId] = useState<string>('all');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [baseStyle, setBaseStyle] = useState<string>("satellite");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLegendOpen, setIsLegendOpen] = useState<boolean>(true);
  const [isTickerOpen, setIsTickerOpen] = useState<boolean>(true);
  const [liveQuakes, setLiveQuakes] = useState<any[]>([]);
  const [weatherTelemetry, setWeatherTelemetry] = useState<Record<string, { temp: number; rain: number; wind: number }>>({});
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedHotspot, setSelectedHotspot] = useState<NERHazardHotspot | null>(null);

  // Layer Groups Refs
  const floodGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const landslideGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const stormGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const seismicGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const highwayGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const helipadGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const sosGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Fetch Live Real-Time Telemetry (Open-Meteo Weather + USGS Live Quakes)
  const fetchLiveTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch live USGS earthquakes in NER Bounding Box (M2.5+)
      const usgsUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=21.8&maxlatitude=29.6&minlongitude=87.8&maxlongitude=97.5&minmagnitude=2.5&limit=15";
      const usgsRes = await fetch(usgsUrl);
      if (usgsRes.ok) {
        const usgsData = await usgsRes.json();
        if (usgsData && usgsData.features) {
          setLiveQuakes(usgsData.features);
        }
      }

      // 2. Fetch live Open-Meteo batch weather for all 8 NER state hubs
      const lats = NER_STATES_DATA.map(s => s.center[0]).join(',');
      const lons = NER_STATES_DATA.map(s => s.center[1]).join(',');
      const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m&timezone=Asia%2FKolkata`;
      const omRes = await fetch(omUrl);
      if (omRes.ok) {
        const omData = await omRes.json();
        const mapWeather: Record<string, { temp: number; rain: number; wind: number }> = {};
        if (Array.isArray(omData)) {
          omData.forEach((d, idx) => {
            const st = NER_STATES_DATA[idx];
            if (st && d.current) {
              mapWeather[st.id] = {
                temp: d.current.temperature_2m || 22,
                rain: d.current.precipitation || 0,
                wind: d.current.wind_gusts_10m || d.current.wind_speed_10m || 10
              };
            }
          });
        }
        setWeatherTelemetry(mapWeather);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn("Live NER telemetry fetch fallback:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTelemetry();
    const interval = setInterval(fetchLiveTelemetry, 60000); // 1-minute auto refresh
    return () => clearInterval(interval);
  }, [fetchLiveTelemetry]);

  // Handle Fullscreen toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Handle External Focus Target from Parent Dashboard
  useEffect(() => {
    if (focusedTarget && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusedTarget.coord, focusedTarget.zoom, { duration: 1.2 });
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 300);
    }
  }, [focusedTarget]);

  // Initialize Leaflet Map Instance
  useEffect(() => {
    if (!mapRef.current) return;

    const centerLat = activeSosLocation ? activeSosLocation.lat : 26.2000;
    const centerLon = activeSosLocation ? activeSosLocation.lon : 92.5000;
    const initialZoom = activeSosLocation ? 11 : 7;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 5,
      maxZoom: 19
    }).setView([centerLat, centerLon], initialZoom);

    mapInstanceRef.current = map;

    // Base Tile Layer (Google Satellite Hybrid with crisp roads & city labels)
    const getTileUrl = (style: string) => {
      if (style === "topo") return "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
      if (style === "osm" || style === "streets") return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
      return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"; // Google Satellite Hybrid
    };

    const baseTile = L.tileLayer(getTileUrl(baseStyle), {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© Google Maps &bull; Jeevan Setu NER Sovereign GIS"
    }).addTo(map);
    currentTileLayerRef.current = baseTile;

    // Attach Layer Groups
    floodGroupRef.current.addTo(map);
    landslideGroupRef.current.addTo(map);
    stormGroupRef.current.addTo(map);
    seismicGroupRef.current.addTo(map);
    highwayGroupRef.current.addTo(map);
    helipadGroupRef.current.addTo(map);
    sosGroupRef.current.addTo(map);

    // 🗺️ Draw Sovereign 8 NER States Boundary Polygon
    const nerBoundaryCoords: L.LatLngExpression[] = [
      [28.2, 88.0],
      [28.1, 88.9],
      [27.3, 88.9],
      [27.0, 89.8],
      [27.4, 91.6],
      [28.0, 92.5],
      [29.3, 94.5],
      [29.5, 96.5],
      [28.2, 97.4],
      [27.0, 96.5],
      [26.2, 95.3],
      [25.2, 94.8],
      [24.2, 94.4],
      [23.2, 93.4],
      [21.9, 92.8],
      [22.4, 92.2],
      [23.0, 91.1],
      [24.1, 91.1],
      [24.9, 91.8],
      [25.2, 89.8],
      [26.1, 89.7],
      [26.6, 88.5],
      [27.2, 88.0]
    ];

    L.polygon(nerBoundaryCoords, {
      color: '#38bdf8',
      weight: 2.5,
      dashArray: '6, 6',
      fillColor: '#0284c7',
      fillOpacity: 0.04
    }).addTo(map).bindTooltip("Data Coverage: North Eastern Region — 8 Sovereign States", { permanent: false });

    // 🚨 Emergency SOS Beacon if active
    if (activeSosLocation) {
      const sosIcon = L.divIcon({
        className: "custom-sos-marker",
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background: radial-gradient(circle, #ef4444, #991b1b);
            border: 3px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 25px #ef4444;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: pulse 1s infinite;
          ">
            <span style="font-size: 20px;">🚨</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const sosM = L.marker([activeSosLocation.lat, activeSosLocation.lon], { icon: sosIcon }).addTo(sosGroupRef.current);
      sosM.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 250px;">
          <div style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 6px; font-weight: 900; font-size: 11px; margin-bottom: 6px;">
            🚨 PRIORITY SOS SIGNAL
          </div>
          <b>${activeSosLocation.landmark || 'Active Distress Location'}</b>
          <div style="margin-top: 4px; color: #64748b;">GPS: ${activeSosLocation.lat.toFixed(4)}°N, ${activeSosLocation.lon.toFixed(4)}°E</div>
        </div>
      `).openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile URL on Style Switch
  useEffect(() => {
    if (!currentTileLayerRef.current) return;
    let url = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    if (baseStyle === "topo") url = "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
    else if (baseStyle === "streets" || baseStyle === "osm") url = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    currentTileLayerRef.current.setUrl(url);
  }, [baseStyle]);

  // Render & Update Tactical Layers (Hotspots, Faults, Highways, Helipads, Live Quakes)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear previous layers
    floodGroupRef.current.clearLayers();
    landslideGroupRef.current.clearLayers();
    stormGroupRef.current.clearLayers();
    seismicGroupRef.current.clearLayers();
    highwayGroupRef.current.clearLayers();
    helipadGroupRef.current.clearLayers();

    // 1. FILTER & RENDER HAZARD HOTSPOTS
    const filteredHotspots = NER_DISASTER_HOTSPOTS.filter(h => {
      if (selectedStateId !== 'all' && h.stateId !== selectedStateId) return false;
      if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
      return true;
    });

    filteredHotspots.forEach(hotspot => {
      const isFlood = hotspot.category === 'FLOOD';
      const isLandslide = hotspot.category === 'LANDSLIDE';
      const isStorm = hotspot.category === 'STORM';

      const isCrit = hotspot.severity === 'CRITICAL';
      const isHigh = hotspot.severity === 'HIGH';

      // Colors
      const mainColor = isFlood 
        ? '#0284c7' 
        : isLandslide 
        ? (isCrit ? '#ef4444' : '#f97316')
        : isStorm 
        ? '#8b5cf6' 
        : '#eab308';

      const iconEmoji = isFlood ? '🌊' : isLandslide ? '⛰️' : isStorm ? '🌧️' : '⚡';

      // Visual Risk Buffer Circle on Map
      const circle = L.circle(hotspot.coord, {
        radius: hotspot.radiusMeters,
        color: mainColor,
        weight: isCrit ? 2.5 : 1.5,
        dashArray: isCrit ? '4, 4' : undefined,
        fillColor: mainColor,
        fillOpacity: isCrit ? 0.22 : 0.14
      });

      // Custom Marker with Pulse Beacon for Critical Hazards
      const markerIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isCrit ? '34px' : '28px'};
            height: ${isCrit ? '34px' : '28px'};
            background: ${mainColor};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 ${isCrit ? '16px' : '8px'} ${mainColor};
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="font-size: ${isCrit ? '16px' : '13px'};">${iconEmoji}</span>
            ${isCrit ? `
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                border: 2px solid ${mainColor};
                opacity: 0.8;
                animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            ` : ''}
          </div>
        `,
        iconSize: [isCrit ? 34 : 28, isCrit ? 34 : 28],
        iconAnchor: [isCrit ? 17 : 14, isCrit ? 17 : 14]
      });

      const marker = L.marker(hotspot.coord, { icon: markerIcon });

      // Live Weather Radar Telemetry for this hotspot's state
      const stWeather = weatherTelemetry[hotspot.stateId];
      const liveRadarBar = stWeather ? `
        <div style="background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; color: #f8fafc;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: 800; color: #38bdf8; font-size: 10px; display: flex; align-items: center; gap: 4px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22c55e;"></span>
              LIVE RADAR & WEATHER
            </span>
            <span style="color: #94a3b8; font-size: 9px;">Open-Meteo Sync</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; font-size: 10px; font-weight: 700; text-align: center;">
            <div style="background: rgba(255,255,255,0.06); padding: 3px 4px; border-radius: 4px;">
              <div style="color: #94a3b8; font-size: 8px;">RAIN</div>
              <div style="color: #67e8f9;">${stWeather.rain.toFixed(1)} mm/h</div>
            </div>
            <div style="background: rgba(255,255,255,0.06); padding: 3px 4px; border-radius: 4px;">
              <div style="color: #94a3b8; font-size: 8px;">GUSTS</div>
              <div style="color: #fbbf24;">${stWeather.wind.toFixed(0)} km/h</div>
            </div>
            <div style="background: rgba(255,255,255,0.06); padding: 3px 4px; border-radius: 4px;">
              <div style="color: #94a3b8; font-size: 8px;">TEMP</div>
              <div style="color: #f43f5e;">${stWeather.temp.toFixed(1)}°C</div>
            </div>
          </div>
        </div>
      ` : '';

      // Tactical Popup Box
      const popupHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #0f172a; min-width: 270px; max-width: 320px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="
              background: ${isCrit ? '#ef4444' : isHigh ? '#f97316' : '#eab308'};
              color: #ffffff;
              padding: 2px 7px;
              border-radius: 9999px;
              font-weight: 800;
              font-size: 10px;
              letter-spacing: 0.5px;
            ">
              ${hotspot.severity} ${hotspot.category}
            </span>
            <span style="font-size: 10px; color: #64748b; font-weight: 600;">${hotspot.state} &bull; ${hotspot.district}</span>
          </div>

          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px; line-height: 1.3;">
            ${iconEmoji} ${hotspot.name}
          </div>

          <p style="font-size: 11px; color: #334155; line-height: 1.4; margin-bottom: 8px;">
            ${hotspot.description}
          </p>

          ${liveRadarBar}

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; font-size: 11px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="color: #64748b;">${hotspot.metricLabel}:</span>
              <b style="color: #0f172a;">${hotspot.metricValue}</b>
            </div>
            <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px;">
              <span>Baseline:</span>
              <span>${hotspot.dangerBaseline}</span>
            </div>
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 6px 8px; margin-bottom: 8px; font-size: 10.5px; color: #991b1b;">
            <b>Impact:</b> ${hotspot.logisticsImpact}
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px 8px; font-size: 10.5px; color: #166534;">
            <b>Safe Detour:</b> ${hotspot.safeDetour}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      circle.bindPopup(popupHtml);

      marker.on('click', () => setSelectedHotspot(hotspot));
      circle.on('click', () => setSelectedHotspot(hotspot));

      // Add to corresponding category group
      if (isFlood) {
        circle.addTo(floodGroupRef.current);
        marker.addTo(floodGroupRef.current);
      } else if (isLandslide) {
        circle.addTo(landslideGroupRef.current);
        marker.addTo(landslideGroupRef.current);
      } else if (isStorm) {
        circle.addTo(stormGroupRef.current);
        marker.addTo(stormGroupRef.current);
      } else {
        circle.addTo(seismicGroupRef.current);
        marker.addTo(seismicGroupRef.current);
      }
    });

    // 2. RENDER ACTIVE TECTONIC FAULT LINES
    if (selectedCategory === 'all' || selectedCategory === 'SEISMIC') {
      const faultLines = [
        {
          name: "Kopili Fault Zone (Zone V Active Intraplate Fault)",
          coords: [[25.40, 92.40], [26.00, 92.80], [26.60, 93.30], [27.00, 93.70]] as [number, number][]
        },
        {
          name: "Dauki Tectonic Fault Margin (Great 1897 Source)",
          coords: [[25.15, 89.80], [25.18, 91.00], [25.20, 92.20], [25.05, 92.80]] as [number, number][]
        },
        {
          name: "Main Boundary Thrust (MBT Himalayan Frontal Belt)",
          coords: [[27.10, 91.80], [27.40, 92.80], [27.80, 94.00], [28.20, 95.50], [28.50, 96.50]] as [number, number][]
        }
      ];

      faultLines.forEach(fault => {
        L.polyline(fault.coords, {
          color: '#eab308',
          weight: 3.5,
          dashArray: '8, 5',
          opacity: 0.85
        }).bindTooltip(`⚡ ${fault.name}`, { permanent: false }).addTo(seismicGroupRef.current);
      });

      // 3. RENDER LIVE USGS EARTHQUAKES IN NER
      liveQuakes.forEach((quake: any) => {
        const coords: [number, number] = [quake.geometry.coordinates[1], quake.geometry.coordinates[0]];
        const mag = quake.properties.mag || 0;
        const place = quake.properties.place || "Regional Tremor";
        const timeStr = new Date(quake.properties.time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        const quakeIcon = L.divIcon({
          className: 'custom-quake-marker',
          html: `
            <div style="
              width: 30px;
              height: 30px;
              background: #eab308;
              border: 2px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 14px #eab308;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 900;
              font-size: 10px;
              color: #000;
            ">
              M${mag.toFixed(1)}
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        });

        L.marker(coords, { icon: quakeIcon }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
            <span style="background: #eab308; color: #000; font-weight: 800; font-size: 10px; padding: 2px 6px; border-radius: 4px;">
              ⚡ USGS LIVE EARTHQUAKE
            </span>
            <div style="font-weight: 800; font-size: 12px; margin-top: 4px;">M${mag.toFixed(1)} — ${place}</div>
            <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Recorded: ${timeStr}</div>
            <div style="color: #64748b; font-size: 10px;">Depth: ${quake.geometry.coordinates[2]} km</div>
          </div>
        `).addTo(seismicGroupRef.current);
      });
    }

    // 4. RENDER STRATEGIC HIGHWAY LIFELINES
    if (selectedCategory === 'all' || selectedCategory === 'HIGHWAY') {
      NER_HIGHWAY_LIFELINES.forEach(hwy => {
        const isCritical = hwy.status === 'CRITICAL';
        const isCaution = hwy.status === 'CAUTION';
        const color = isCritical ? '#ef4444' : isCaution ? '#f97316' : '#22c55e';

        L.polyline(hwy.coords, {
          color,
          weight: 4,
          opacity: 0.9
        }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 220px;">
            <div style="font-weight: 800; color: #0f172a; margin-bottom: 2px;">🛣️ ${hwy.name}</div>
            <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">
              STATUS: ${hwy.status}
            </span>
            <div style="margin-top: 4px; font-size: 11px; color: #475569;">${hwy.warning}</div>
          </div>
        `).addTo(highwayGroupRef.current);
      });
    }

    // 5. RENDER EMERGENCY HELIPADS & RELIEF AIR HUBS
    if (selectedCategory === 'all' || selectedCategory === 'DEPOT') {
      NER_HELIPADS_AND_DEPOS.forEach(heli => {
        const heliIcon = L.divIcon({
          className: 'custom-helipad-marker',
          html: `
            <div style="
              width: 26px;
              height: 26px;
              background: #0284c7;
              border: 1.5px solid #ffffff;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            ">
              <span style="font-size: 14px;">🚁</span>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        L.marker(heli.coord as [number, number], { icon: heliIcon }).bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; min-width: 200px;">
            <div style="font-weight: 800; color: #0f172a;">🚁 ${heli.name}</div>
            <div style="color: #0284c7; font-size: 10px; font-weight: 700; margin-top: 2px;">${heli.type}</div>
            <div style="color: #64748b; font-size: 10px;">Coordinates: ${heli.coord[0].toFixed(4)}°N, ${heli.coord[1].toFixed(4)}°E</div>
          </div>
        `).addTo(helipadGroupRef.current);
      });
    }
  }, [selectedStateId, selectedCategory, liveQuakes, weatherTelemetry]);

  // Handle State Selection & Camera FlyTo
  const handleStateSelect = (stateId: string) => {
    setSelectedStateId(stateId);
    setSelectedDistrictName('all');
    if (!mapInstanceRef.current) return;

    if (stateId === 'all') {
      mapInstanceRef.current.flyToBounds([[21.9000, 88.0000], [29.5000, 97.4000]], { duration: 1.2 });
    } else {
      const stateObj = NER_STATES_DATA.find(s => s.id === stateId);
      if (stateObj) {
        mapInstanceRef.current.flyTo(stateObj.center, stateObj.zoom, { duration: 1.2 });
      }
    }
  };

  // Fly to specific hotspot from bottom ticker or selection
  const handleFlyToHotspot = (hotspot: NERHazardHotspot) => {
    setSelectedHotspot(hotspot);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(hotspot.coord, 11, { duration: 1.0 });
    }
  };

  const selectedStateObj = NER_STATES_DATA.find(s => s.id === selectedStateId);

  // Counts for Category Badges
  const floodCount = NER_DISASTER_HOTSPOTS.filter(h => h.category === 'FLOOD').length;
  const landslideCount = NER_DISASTER_HOTSPOTS.filter(h => h.category === 'LANDSLIDE').length;
  const stormCount = NER_DISASTER_HOTSPOTS.filter(h => h.category === 'STORM').length;
  const seismicCount = NER_DISASTER_HOTSPOTS.filter(h => h.category === 'SEISMIC').length + liveQuakes.length;

  return (
    <div className={`h-full w-full relative flex flex-col select-none bg-[#040814] text-slate-100 font-sans overflow-hidden min-w-0 ${isFullscreen ? 'fixed inset-0 z-[99999] w-screen h-screen' : ''}`}>
      
      {/* 🟢 TOP HEADER BAR SCOPED EXCLUSIVELY TO 8 NER STATES */}
      {!hideHeader && (
        <div className="min-h-[58px] py-2 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040814] px-4 lg:px-6 flex flex-wrap items-center justify-between gap-3 z-20 backdrop-blur transition-colors duration-300">
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md cursor-pointer shrink-0"
                title="Back to Home (Esc)"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  North Eastern Region (NER 8 States) Dedicated GIS
                </span>
                <span className="hidden sm:inline text-xs italic text-slate-500 dark:text-slate-400">
                  Live Multihazard Tactical Intelligence
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight mt-0.5 leading-snug">
                North Eastern Region (NER) Accessibility &amp; Disaster Intelligence Overview
              </h1>
            </div>
          </div>

          {/* TOP RIGHT STATE & MAP CONTROLS */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
            {/* Live Telemetry Refresh Button */}
            <button
              onClick={fetchLiveTelemetry}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-500 transition cursor-pointer"
              title="Refresh Real-Time Feeds (USGS + Open-Meteo)"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
            </button>

            {/* State Selector Dropdown */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800">
              <span className="pl-2 font-extrabold text-slate-700 dark:text-slate-300">State:</span>
              <select
                value={selectedStateId}
                onChange={(e) => handleStateSelect(e.target.value)}
                className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 focus:outline-none"
              >
                <option value="all">Fit All 8 NER States</option>
                {NER_STATES_DATA.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>

            {/* Map Style Switcher */}
            <div className="flex items-center gap-1 text-xs shrink-0">
              <button
                onClick={() => setBaseStyle("satellite")}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "satellite" ? "bg-sky-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400"
                }`}
              >
                🛰️ Satellite
              </button>

              <button
                onClick={() => setBaseStyle("topo")}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "topo" ? "bg-sky-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400"
                }`}
              >
                ⛰️ Topo
              </button>
            </div>

            {/* Expand / Fullscreen Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-sky-400" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{isFullscreen ? "Exit" : "Expand"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 🔴 INTERACTIVE HAZARD CATEGORY FILTER BAR OVERLAY */}
      <div className="absolute top-[68px] left-4 right-4 z-[1000] pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700/60 shadow-2xl">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>All Hazards</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">{NER_DISASTER_HOTSPOTS.length}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('FLOOD')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'FLOOD' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌊 Floods</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px]">{floodCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('LANDSLIDE')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'LANDSLIDE' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⛰️ Landslides</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 text-[10px]">{landslideCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('STORM')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'STORM' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🌧️ Severe Storms</span>
            <span className="px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-300 text-[10px]">{stormCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('SEISMIC')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'SEISMIC' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>⚡ Seismic &amp; Faults</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-950 text-amber-300 text-[10px]">{seismicCount}</span>
          </button>

          <button
            onClick={() => setSelectedCategory('HIGHWAY')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'HIGHWAY' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🛣️ Lifelines</span>
          </button>

          <button
            onClick={() => setSelectedCategory('DEPOT')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'DEPOT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <span>🚁 Helipads</span>
          </button>
        </div>

        {/* Live Telemetry & USGS Tremor Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Sync Status Pill */}
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/85 border border-emerald-500/40 text-emerald-400 text-xs font-bold backdrop-blur shadow-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Live Radar &amp; USGS:</span>
            <span className="text-slate-300 font-mono text-[11px]">
              {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-normal">(60s cycle)</span>
          </div>

          {/* Live USGS Tremor Badge */}
          {liveQuakes.length > 0 && (
            <button
              onClick={() => {
                const q = liveQuakes[0];
                if (q && q.geometry && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([q.geometry.coordinates[1], q.geometry.coordinates[0]], 9, { duration: 1.2 });
                }
              }}
              title="Click to zoom to live USGS quake location"
              className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold backdrop-blur cursor-pointer transition"
            >
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping"></span>
              <span>Live USGS: {liveQuakes[0].properties.title}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAP CANVAS CONTAINER */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <div ref={mapRef} className="w-full h-full z-10" />

        {/* 📋 FLOATING TACTICAL LEGEND (Collapsible on left) */}
        <div className="absolute top-[125px] left-4 z-[1000] pointer-events-auto">
          {isLegendOpen ? (
            <div className="w-56 p-3.5 rounded-2xl bg-slate-950/85 border border-slate-700/60 backdrop-blur-md shadow-2xl space-y-2.5 text-xs text-slate-300 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-extrabold text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-sky-400" />
                  Tactical Hazard Legend
                </span>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="text-slate-400 hover:text-white text-xs font-bold p-0.5"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-cyan-500 border border-white shadow-sm flex items-center justify-center text-[8px]">🌊</span>
                  <span>Flood / Inundation Zone</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 border border-white shadow-sm flex items-center justify-center text-[8px]">⛰️</span>
                  <span>Landslide / Sinking Slope</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-purple-500 border border-white shadow-sm flex items-center justify-center text-[8px]">🌧️</span>
                  <span>Cloudburst &amp; Severe Storm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 border border-white shadow-sm flex items-center justify-center text-[8px]">⚡</span>
                  <span>Active Fault &amp; Live Quake</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-4 rounded bg-emerald-500"></span>
                  <span>Highway Lifeline</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-blue-600 border border-white flex items-center justify-center text-[8px]">🚁</span>
                  <span>Emergency Helipad / LZ</span>
                </div>
                <div className="flex items-center gap-2 border-t border-slate-800 pt-1.5 text-[10px] text-sky-400 font-mono">
                  <span className="h-0.5 w-4 border-b-2 border-dashed border-sky-400"></span>
                  <span>8 NER Sovereign Boundary</span>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/60 backdrop-blur-md text-xs font-bold text-slate-300 hover:text-white shadow-lg flex items-center gap-1.5"
            >
              <Compass className="h-3.5 w-3.5 text-sky-400" />
              <span>Legend</span>
            </button>
          )}
        </div>

        {/* ⚡ BOTTOM ACTIVE RISK HOTSPOTS TICKER & QUICK INSPECTOR */}
        {isTickerOpen ? (
          <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-auto">
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-700/60 backdrop-blur-md shadow-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-white">
                    Critical Disaster Risk Hotspots (Click to Inspect)
                  </span>
                  <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-500/30">
                    {NER_DISASTER_HOTSPOTS.filter(h => h.severity === 'CRITICAL').length} High Vulnerability
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTickerOpen(false)}
                    className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-slate-800"
                  >
                    Hide Ticker
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Hotspot Cards */}
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 text-xs">
                {NER_DISASTER_HOTSPOTS.map(h => {
                  const isCrit = h.severity === 'CRITICAL';
                  const isFlood = h.category === 'FLOOD';
                  const isLandslide = h.category === 'LANDSLIDE';
                  const isStorm = h.category === 'STORM';
                  const icon = isFlood ? '🌊' : isLandslide ? '⛰️' : isStorm ? '🌧️' : '⚡';

                  return (
                    <div
                      key={h.id}
                      onClick={() => handleFlyToHotspot(h)}
                      className={`shrink-0 w-64 p-2.5 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                        selectedHotspot?.id === h.id
                          ? 'bg-sky-950/80 border-sky-500 shadow-lg'
                          : isCrit
                          ? 'bg-slate-900/80 border-rose-500/40 hover:border-rose-500'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-white text-xs truncate flex items-center gap-1.5">
                          <span>{icon}</span>
                          <span className="truncate">{h.name}</span>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase shrink-0 ${
                          isCrit ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          {h.severity}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate flex items-center justify-between gap-1">
                        <span className="truncate">{h.state} &bull; {h.metricValue}</span>
                        {weatherTelemetry[h.stateId] && (
                          <span className="text-sky-400 font-mono text-[9.5px] shrink-0 font-bold">
                            🌧️ {weatherTelemetry[h.stateId].rain.toFixed(1)} mm/h
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-4 left-4 z-[1000] pointer-events-auto">
            <button
              onClick={() => setIsTickerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/85 border border-slate-700/60 backdrop-blur-md text-xs font-bold text-white shadow-xl flex items-center gap-2 hover:bg-slate-900"
            >
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Show Critical Risk Hotspots Ticker</span>
            </button>
          </div>
        )}

        {/* Floating Back Button in full-screen or hideHeader mode */}
        {(isFullscreen || hideHeader) && onBackToDashboard && (
          <div className="absolute top-4 left-4 right-4 z-[1001] pointer-events-none flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={isFullscreen ? () => setIsFullscreen(false) : onBackToDashboard}
              className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/90 hover:bg-slate-900 text-white font-bold text-xs shadow-2xl border border-white/20 backdrop-blur-md transition cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-sky-400" />
              <span>{isFullscreen ? "Exit Fullscreen" : "Back to Home"}</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
