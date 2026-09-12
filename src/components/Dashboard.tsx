import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n";
import L from "leaflet";
import {
  ShieldAlert,
  MapPin,
  CloudRain,
  Compass,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Send,
  Radio,
  Truck,
  Building2,
  Camera,
  Upload,
  Globe,
  Bell,
  Sliders,
  Maximize2,
  Crosshair,
  Plus,
  Navigation,
  Flame,
  Home,
  Gauge,
  X,
  PhoneCall,
  Menu
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import EmergencySOSModal from "./EmergencySOSModal";

// Interactive Map Marker Data
interface DisasterIncident {
  id: string;
  type: "Flood" | "Landslide" | "Earthquake" | "Rainfall" | "Hospital" | "Shelter" | "Rescue" | "Vehicle";
  title: string;
  location: string;
  lat: number;
  lon: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | "CRITICAL";
  rainfallMm: number;
  affectedDistricts: number;
  roadStatus: "Blocked" | "Partially Blocked" | "Clear";
  updatedTime: string;
  color: string;
  radiusMeters: number;
  teams: string;
  population: string;
}

const DASHBOARD_INCIDENTS: DisasterIncident[] = [
  {
    id: "INC-101",
    type: "Flood",
    title: "Sikkim Teesta Flood Alert",
    location: "North Sikkim (Chungthang Sector)",
    lat: 27.58,
    lon: 88.62,
    riskLevel: "HIGH",
    rainfallMm: 82,
    affectedDistricts: 4,
    roadStatus: "Partially Blocked",
    updatedTime: "8 min ago",
    color: "#EF4444",
    radiusMeters: 35000,
    teams: "NDRF Battalion 2 & SDRF",
    population: "14,200"
  },
  {
    id: "INC-102",
    type: "Landslide",
    title: "Gangtok Hillside Debris Shift",
    location: "Gangtok / Mangan Corridor",
    lat: 27.3389,
    lon: 88.6065,
    riskLevel: "CRITICAL",
    rainfallMm: 114,
    affectedDistricts: 2,
    roadStatus: "Blocked",
    updatedTime: "12 min ago",
    color: "#F97316",
    radiusMeters: 28000,
    teams: "Army Engineers & BRO",
    population: "8,900"
  },
  {
    id: "INC-103",
    type: "Flood",
    title: "Assam Brahmaputra Swelling",
    location: "Kaziranga / Lakhimpur Basin",
    lat: 26.58,
    lon: 93.17,
    riskLevel: "HIGH",
    rainfallMm: 95,
    affectedDistricts: 6,
    roadStatus: "Partially Blocked",
    updatedTime: "24 min ago",
    color: "#EF4444",
    radiusMeters: 45000,
    teams: "SDRF Squad 8 & Boats",
    population: "42,000"
  },
  {
    id: "INC-104",
    type: "Rainfall",
    title: "Sohra Flash Downpour Watch",
    location: "East Khasi Hills, Meghalaya",
    lat: 25.27,
    lon: 91.73,
    riskLevel: "MEDIUM",
    rainfallMm: 140,
    affectedDistricts: 3,
    roadStatus: "Clear",
    updatedTime: "30 min ago",
    color: "#38BDF8",
    radiusMeters: 30000,
    teams: "IMD Weather Station 4",
    population: "12,500"
  },
  {
    id: "INC-105",
    type: "Hospital",
    title: "Gangtok Central Referral Hospital",
    location: "Gangtok City Center",
    lat: 27.32,
    lon: 88.61,
    riskLevel: "LOW",
    rainfallMm: 45,
    affectedDistricts: 1,
    roadStatus: "Clear",
    updatedTime: "5 min ago",
    color: "#10B981",
    radiusMeters: 5000,
    teams: "24x7 Emergency Ward",
    population: "450 Beds"
  },
  {
    id: "INC-106",
    type: "Shelter",
    title: "Mangan District Relief Camp",
    location: "Mangan High School Campus",
    lat: 27.50,
    lon: 88.53,
    riskLevel: "LOW",
    rainfallMm: 60,
    affectedDistricts: 1,
    roadStatus: "Partially Blocked",
    updatedTime: "15 min ago",
    color: "#8B5CF6",
    radiusMeters: 8000,
    teams: "Red Cross & Local Auth",
    population: "620 Capacity"
  },
  {
    id: "INC-107",
    type: "Vehicle",
    title: "Relief Convoy JS-104 (Tata LPTA)",
    location: "En Route Gangtok ➔ Mangan",
    lat: 27.42,
    lon: 88.58,
    riskLevel: "MEDIUM",
    rainfallMm: 70,
    affectedDistricts: 2,
    roadStatus: "Partially Blocked",
    updatedTime: "2 min ago",
    color: "#F59E0B",
    radiusMeters: 10000,
    teams: "NDRF Supply Logistics",
    population: "Oxygen & Rations"
  }
];

interface DashboardProps {
  onNavigateModule?: (module: string) => void;
}

export default function Dashboard({ onNavigateModule }: DashboardProps) {
  const { t } = useTranslation();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Selected Area Intelligence Panel State
  const [selectedIncident, setSelectedIncident] = useState<DisasterIncident>(DASHBOARD_INCIDENTS[0]);

  // Map Filterable Layer State
  const [activeLayerFilter, setActiveLayerFilter] = useState<string>("All");

  // Map Controls State
  const [mapTileType, setMapTileType] = useState<"satellite" | "dark" | "topo">("satellite");
  const [showRadarOverlay, setShowRadarOverlay] = useState<boolean>(true);
  const [showHazardCircles, setShowHazardCircles] = useState<boolean>(true);

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const radarLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  // Emergency SOS Modal
  const [isSosOpen, setIsSosOpen] = useState(false);

  // AI Demo Image Upload State
  const [aiImagePreview, setAiImagePreview] = useState<string | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  // Tracked Vehicles State
  const [vehicles, setVehicles] = useState([
    {
      id: "JS-104",
      name: "Relief Truck JS-104",
      type: "4x4 Heavy All-Terrain (Tata LPTA)",
      route: "Gangtok ➔ Mangan",
      eta: "42 min",
      status: "En Route",
      risk: "WARNING",
      cargo: "Life-Saving Oxygen & Rations"
    },
    {
      id: "JS-108",
      name: "Emergency Supply Van JS-108",
      type: "High-Altitude Medical Transport",
      route: "Mangan ➔ Chungthang",
      eta: "28 min",
      status: "En Route",
      risk: "CLEAR",
      cargo: "Blood Plasma & Dialysis Kits"
    }
  ]);

  // Helper tile provider URLs
  const getTileUrl = (type: "satellite" | "dark" | "topo") => {
    switch (type) {
      case "dark":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
      case "topo":
        return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      case "satellite":
      default:
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
  };

  // Initialize GIS Leaflet Command Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([selectedIncident.lat, selectedIncident.lon], 8);

    const baseTile = L.tileLayer(getTileUrl(mapTileType), {
      maxZoom: 18,
      subdomains: ["a", "b", "c", "d"]
    }).addTo(map);
    tileLayerRef.current = baseTile;

    const radarTile = L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
      opacity: showRadarOverlay ? 0.45 : 0,
      maxZoom: 18
    }).addTo(map);
    radarLayerRef.current = radarTile;

    markersLayerRef.current = L.layerGroup().addTo(map);
    circlesLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Force Leaflet to recalculate container dimensions & fetch tiles
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Buffer Rings on Filter / State Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !circlesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();

    const filtered = activeLayerFilter === "All"
      ? DASHBOARD_INCIDENTS
      : activeLayerFilter === "Flood"
      ? DASHBOARD_INCIDENTS.filter(i => i.type === "Flood")
      : activeLayerFilter === "Landslide"
      ? DASHBOARD_INCIDENTS.filter(i => i.type === "Landslide")
      : activeLayerFilter === "Rainfall"
      ? DASHBOARD_INCIDENTS.filter(i => i.type === "Rainfall")
      : activeLayerFilter === "Emergency Resources"
      ? DASHBOARD_INCIDENTS.filter(i => i.type === "Hospital" || i.type === "Shelter")
      : activeLayerFilter === "Vehicles"
      ? DASHBOARD_INCIDENTS.filter(i => i.type === "Vehicle")
      : DASHBOARD_INCIDENTS;

    filtered.forEach(inc => {
      const customIcon = L.divIcon({
        className: "custom-gis-marker",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${inc.color}; opacity: 0.8; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${inc.color}; border: 2px solid #ffffff; box-shadow: 0 0 12px ${inc.color}; z-index: 10; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
              ${inc.type === "Flood" ? "🌊" : inc.type === "Landslide" ? "⛰️" : inc.type === "Hospital" ? "🏥" : inc.type === "Shelter" ? "🏠" : inc.type === "Vehicle" ? "🚚" : "🌧️"}
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([inc.lat, inc.lon], { icon: customIcon });

      marker.on("click", () => {
        setSelectedIncident(inc);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; background: #070d1e; color: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.4); min-width: 220px; box-shadow: 0 12px 30px rgba(0,0,0,0.8);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: ${inc.color}; color: white;">
              ${inc.type} &bull; Risk ${inc.riskLevel}
            </span>
            <span style="font-size: 10px; color: #94a3b8;">${inc.updatedTime}</span>
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #ffffff; line-height: 1.3; margin-bottom: 4px;">${inc.title}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">📍 ${inc.location}</div>
          
          <div style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 6px 8px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
            <div><span style="color: #64748b;">Rainfall:</span> <br/><strong style="color: #38bdf8;">${inc.rainfallMm} mm</strong></div>
            <div><span style="color: #64748b;">Road Status:</span> <br/><strong style="color: #f59e0b;">${inc.roadStatus}</strong></div>
          </div>

          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button id="btn-inspect-${inc.id}" style="flex: 1; background: #0284c7; color: white; border: none; padding: 5px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; cursor: pointer;">
              View Risk Details
            </button>
          </div>
        </div>
      `);

      markersLayerRef.current.addLayer(marker);

      if (showHazardCircles && inc.radiusMeters) {
        const circle = L.circle([inc.lat, inc.lon], {
          radius: inc.radiusMeters,
          color: inc.color,
          fillColor: inc.color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: "6, 6"
        });
        circlesLayerRef.current.addLayer(circle);
      }
    });
  }, [activeLayerFilter, showHazardCircles]);

  // Handle Basemap Switch
  const switchBasemap = (type: "satellite" | "dark" | "topo") => {
    setMapTileType(type);
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const newLayer = L.tileLayer(getTileUrl(type), { maxZoom: 18 }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  };

  // Focus map on specific incident or location
  const focusLocationOnMap = (lat: number, lon: number, zoomLevel: number = 10) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lon], zoomLevel, { animate: true });
    }
  };

  // AI Image Drag & Drop / Photo Handler
  const handleAiPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAiImagePreview(evt.target?.result as string);
        setAiResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Execute Demo AI Analysis
  const runAiDemoAnalysis = () => {
    setIsAiAnalyzing(true);
    setTimeout(() => {
      setIsAiAnalyzing(false);
      setAiResult({
        disasterType: "Landslide & Road Collapse",
        severity: "CRITICAL 🔴",
        impact: "HIGH",
        roadStatus: "BLOCKED 🚫",
        affectedArea: "2.8 km²",
        recommendation: "Immediate emergency route diversion via Jowai Bypass corridor required. Dispatched warning signal to Gangtok Command.",
        confidence: "94%",
        lat: 27.3389,
        lon: 88.6065,
        locationName: "Gangtok / Teesta Highway (Km 142)"
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-[#040814] text-slate-100 font-sans flex flex-col pb-24 lg:pb-12 selection:bg-sky-500 selection:text-white transition-colors duration-300">
      
      {/* ==================================================
          TOP SLEEK SUB-HEADER COMMAND BAR
         ================================================== */}
      <div className="sticky top-0 z-[80] w-full bg-[#070d1e]/90 backdrop-blur-md border-b border-slate-800/80 shadow-lg px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4 transition-colors duration-300">
        
        {/* LEFT: Dashboard Section Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm lg:text-base font-black tracking-tight text-white">
              Jeevan Setu <span className="text-sky-400">Command Center</span>
            </h1>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider hidden sm:inline-block">
              LIVE GRID
            </span>
          </div>
        </div>

        {/* CENTER: Desktop Section Navigation Pills */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {[
            { id: "overview", label: t('navigation.overview', 'Overview') },
            { id: "map", label: t('navigation.map', 'Live Map') },
            { id: "risk", label: t('navigation.staterisk', 'Risk Assessment') },
            { id: "ai", label: t('navigation.aiimpact', 'AI Analysis') },
            { id: "alerts", label: t('navigation.alerts', 'Alerts') },
            { id: "resources", label: t('navigation.reliefcamps', 'Resources') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                const targetEl = document.getElementById(`section-${tab.id}`);
                targetEl?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* RIGHT: Live Grid Synchronized Status & Bell */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Grid Synchronized</span>
          </span>

          <button className="relative p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer">
            <Bell className="h-4 w-4 text-slate-300" />
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
        </div>

      </div>

      <div className="w-full px-3 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* ==================================================
            1. TOP SITUATION SUMMARY (5 Compact Cards)
           ================================================== */}
        <section id="section-overview" className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            
            {/* Card 1: Active Disasters */}
            <div className="bg-[#070d1e] border border-red-900/40 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-red-500/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cmdDashboard.activeDisasters', 'Active Disasters')}</span>
                <div className="h-8 w-8 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center font-bold">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white font-mono tracking-tight">12</div>
                <div className="text-[11px] font-bold text-red-400 mt-0.5 flex items-center gap-1">
                  <span>+3 today</span> &bull; <span>{t('landslide.highRisk', 'High Risk')}</span>
                </div>
              </div>
            </div>

            {/* Card 2: Critical Alerts */}
            <div className="bg-[#070d1e] border border-amber-900/40 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cmdDashboard.criticalAlerts', 'Critical Alerts')}</span>
                <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white font-mono tracking-tight">04</div>
                <div className="text-[11px] font-bold text-amber-400 mt-0.5">
                  {t('cmdDashboard.requiresAttention', 'Requires attention')}
                </div>
              </div>
            </div>

            {/* Card 3: Affected Districts */}
            <div className="bg-[#070d1e] border border-sky-900/40 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-sky-500/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cmdDashboard.affectedDistricts', 'Affected Districts')}</span>
                <div className="h-8 w-8 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white font-mono tracking-tight">18</div>
                <div className="text-[11px] font-bold text-sky-400 mt-0.5">
                  {t('cmdDashboard.currentlyAffected', 'Currently affected')}
                </div>
              </div>
            </div>

            {/* Card 4: Rescue Teams */}
            <div className="bg-[#070d1e] border border-emerald-900/40 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cmdDashboard.rescueTeams', 'Rescue Teams')}</span>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white font-mono tracking-tight">27</div>
                <div className="text-[11px] font-bold text-emerald-400 mt-0.5">
                  {t('lifeSavingEngine.deployed', 'Deployed')} (NDRF/SDRF)
                </div>
              </div>
            </div>

            {/* Card 5: Relief Vehicles */}
            <div className="bg-[#070d1e] border border-indigo-900/40 p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cmdDashboard.reliefVehicles', 'Relief Vehicles')}</span>
                <div className="h-8 w-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black text-white font-mono tracking-tight">09</div>
                <div className="text-[11px] font-bold text-indigo-400 mt-0.5">
                  {t('cmdDashboard.activeInField', 'Active in field')}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            2 & 3. MAIN LIVE GIS COMMAND MAP & SELECTED AREA INTELLIGENCE PANEL
           ================================================== */}
        <section id="section-map" className="w-full">
          <div className="bg-[#070d1e] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
            
            {/* Header & Layer Filters */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Radio className="h-5 w-5 text-red-500 animate-pulse" />
                  <span>{t('cmdDashboard.liveGisTitle', 'Live GIS Disaster Command Grid')}</span>
                </h2>
                <p className="text-xs text-slate-400 font-semibold">
                  {t('cmdDashboard.liveGisSubtitle', 'Real-time telemetry, Doppler radar overlays & asset locations')}
                </p>
              </div>

              {/* Map Layer Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 mr-1">Layer Filter:</span>
                {["All", "Flood", "Landslide", "Rainfall", "Emergency Resources", "Vehicles"].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveLayerFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
                      activeLayerFilter === filter
                        ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30"
                        : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700"
                    }`}
                  >
                    {filter === "All" ? t('cmdDashboard.filterAll', 'All') : filter === "Flood" ? t('cmdDashboard.filterFlood', 'Flood') : filter === "Landslide" ? t('cmdDashboard.filterLandslide', 'Landslide') : filter === "Rainfall" ? t('cmdDashboard.filterRainfall', 'Rainfall') : filter === "Emergency Resources" ? t('cmdDashboard.filterResources', 'Emergency Resources') : t('cmdDashboard.filterVehicles', 'Vehicles')}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Layout: GIS Map (8 cols) + Selected Area Intelligence Panel (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* GIS MAP CONTAINER (8 Columns) */}
              <div className="lg:col-span-8 relative min-h-[460px] lg:min-h-[520px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
                
                {/* Radar Sweep Animation Overlay */}
                <div className="radar-sweep-line" />

                {/* Leaflet Map Canvas */}
                <div ref={mapContainerRef} className="w-full h-full min-h-[460px] lg:min-h-[520px] z-0" />

                {/* Top Controls: Basemaps & Doppler Toggle */}
                <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
                  <div className="bg-slate-900/90 backdrop-blur p-1 rounded-xl border border-slate-700 flex items-center gap-1">
                    <button
                      onClick={() => switchBasemap("satellite")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        mapTileType === "satellite" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t('cmdDashboard.btnSatellite', '🛰️ Satellite')}
                    </button>
                    <button
                      onClick={() => switchBasemap("dark")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        mapTileType === "dark" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t('cmdDashboard.btnDarkGis', '🌑 Dark GIS')}
                    </button>
                    <button
                      onClick={() => switchBasemap("topo")}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        mapTileType === "topo" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {t('cmdDashboard.btnTerrain', '⛰️ Terrain')}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowRadarOverlay(!showRadarOverlay)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer ${
                      showRadarOverlay
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-slate-900/90 text-slate-400 border-slate-700"
                    }`}
                  >
                    {t('cmdDashboard.btnDoppler', '📡 Doppler Radar')}
                  </button>
                </div>

                {/* Bottom Right Map Tools (+, -, Locate Me, Recenter) */}
                <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5">
                  <button
                    onClick={() => mapInstanceRef.current?.zoomIn()}
                    className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 font-bold flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => mapInstanceRef.current?.zoomOut()}
                    className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl border border-slate-700 font-bold flex items-center justify-center shadow-lg cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => focusLocationOnMap(selectedIncident.lat, selectedIncident.lon, 9)}
                    className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-xl border border-slate-700 font-bold flex items-center justify-center shadow-lg cursor-pointer"
                    title="Focus Selected Area"
                  >
                    <Crosshair className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* SELECTED AREA INTELLIGENCE PANEL (4 Columns) */}
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('cmdDashboard.selectedAreaIntel', 'Selected Area Intelligence')}</span>
                      <h3 className="text-lg font-black text-white mt-0.5">{selectedIncident.location}</h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full font-black text-xs uppercase border ${
                        selectedIncident.riskLevel === "CRITICAL" || selectedIncident.riskLevel === "HIGH"
                          ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                          : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      }`}
                    >
                      {t('cmdDashboard.riskHigh', 'Risk')}: {selectedIncident.riskLevel}
                    </span>
                  </div>

                  {/* Telemetry Metrics List */}
                  <div className="py-4 space-y-3 text-xs font-medium">
                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">{t('cmdDashboard.weatherCondition', 'Weather Condition:')}</span>
                      <span className="font-extrabold text-white flex items-center gap-1">
                        <CloudRain className="h-3.5 w-3.5 text-sky-400" />
                        <span>{t('cmdDashboard.heavyDownpour', 'Heavy Downpour (22°C)')}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">{t('cmdDashboard.accumulatedRainfall', 'Accumulated Rainfall:')}</span>
                      <span className="font-extrabold text-sky-400 font-mono">{selectedIncident.rainfallMm} mm (24h)</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">{t('cmdDashboard.roadAccessibility', 'Road Accessibility:')}</span>
                      <span className={`font-extrabold ${selectedIncident.roadStatus === "Clear" ? "text-emerald-400" : "text-amber-400"}`}>
                        ⚠️ {selectedIncident.roadStatus === "Partially Blocked" ? t('cmdDashboard.partiallyBlocked', 'Partially Blocked') : selectedIncident.roadStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">{t('cmdDashboard.nearestShelter', 'Nearest Shelter:')}</span>
                      <span className="font-extrabold text-purple-400">🏠 4.2 km (Mangan High School)</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-400 font-bold">{t('cmdDashboard.nearestHospital', 'Nearest Hospital:')}</span>
                      <span className="font-extrabold text-emerald-400">🏥 7.1 km (STNM Referral)</span>
                    </div>
                  </div>

                  {/* AI Advisory Box */}
                  <div className="p-3.5 bg-sky-950/40 border border-sky-500/30 rounded-xl space-y-1">
                    <div className="text-xs font-black text-sky-300 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                      <span>{t('cmdDashboard.aiTacticalRec', 'AI Tactical Recommendation')}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                      "{t('cmdDashboard.aiTacticalDesc', 'Avoid affected mountain corridors over next 48 hours. Evacuate toward designated safe zone shelters.')}"
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const aiSection = document.getElementById("section-ai");
                    aiSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-3 rounded-xl shadow-lg transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                >
                  <span>View Full AI Analysis</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================
            4. AI DISASTER INTELLIGENCE (Image Upload + Demo Result & Map Connection)
           ================================================== */}
        <section id="section-ai" className="w-full">
          <div className="bg-[#070d1e] border border-indigo-900/40 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  AI VISION MODEL
                </span>
                <h2 className="text-xl font-black text-white">AI Disaster Intelligence</h2>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                AI-powered analysis of disaster images, location and environmental data.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              
              {/* UPLOAD BOX (5 Cols) */}
              <div className="lg:col-span-5 border-2 border-dashed border-slate-700 hover:border-indigo-400 bg-slate-950 p-6 rounded-2xl text-center relative cursor-pointer transition group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAiPhotoUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {aiImagePreview ? (
                  <div className="relative h-48 w-full rounded-xl overflow-hidden shadow-lg border border-slate-700">
                    <img src={aiImagePreview} alt="Ground site" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 bg-slate-900/90 text-white text-[10px] px-2 py-1 rounded font-bold border border-slate-700">
                      Photo Loaded
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="h-12 w-12 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mx-auto flex items-center justify-center group-hover:scale-110 transition">
                      <Camera className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Drag &amp; Drop Disaster Photo</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click to browse ground images (JPG, PNG)</p>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={runAiDemoAnalysis}
                  disabled={isAiAnalyzing}
                  className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  {isAiAnalyzing ? (
                    <>
                      <Activity className="h-4 w-4 animate-spin text-white" />
                      <span>Processing AI Vision Neural Net...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-indigo-200" />
                      <span>[ Analyze with AI ]</span>
                    </>
                  )}
                </button>
              </div>

              {/* DEMO RESULT CARD (7 Cols) */}
              <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-black text-white">AI Analysis Result</span>
                    <p className="text-[10px] text-slate-400">Multimodal Neural Net Landslide &amp; Flood Assessment</p>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black px-2.5 py-1 rounded-full uppercase">
                    DEMO ANALYSIS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#070d1e] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold block">Disaster Type</span>
                    <span className="font-extrabold text-white mt-0.5 block">{aiResult ? aiResult.disasterType : "Landslide"}</span>
                  </div>
                  <div className="bg-[#070d1e] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold block">Severity</span>
                    <span className="font-extrabold text-red-400 mt-0.5 block">{aiResult ? aiResult.severity : "CRITICAL 🔴"}</span>
                  </div>
                  <div className="bg-[#070d1e] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold block">Road Status</span>
                    <span className="font-extrabold text-amber-400 mt-0.5 block">{aiResult ? aiResult.roadStatus : "BLOCKED 🚫"}</span>
                  </div>
                  <div className="bg-[#070d1e] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] font-bold block">Confidence</span>
                    <span className="font-extrabold text-emerald-400 mt-0.5 block">{aiResult ? aiResult.confidence : "94%"}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-1">
                  <div className="text-xs font-extrabold text-indigo-300">AI Recommendation</div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {aiResult ? aiResult.recommendation : '"Immediate route diversion via Jowai Bypass corridor required. Dispatched warning signal to Gangtok Emergency Command."'}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => focusLocationOnMap(27.3389, 88.6065, 11)}
                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2.5 rounded-xl shadow cursor-pointer text-xs flex items-center justify-center gap-1.5"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Show on Map</span>
                  </button>
                  <button
                    onClick={() => alert("Full AI SITREP PDF report generated.")}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 cursor-pointer text-xs"
                  >
                    View Full AI Report
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ==================================================
            5. 72-HOUR RISK INTELLIGENCE FORECAST
           ================================================== */}
        <section id="section-risk" className="w-full">
          <div className="bg-[#070d1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">72-Hour Risk Forecast</h2>
                <p className="text-xs text-slate-400 font-semibold">Predicted environmental risk trajectory across timeline</p>
              </div>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 rounded-full text-xs font-extrabold">
                IMD &bull; ISRO TELEMETRY
              </span>
            </div>

            {/* Timeline Bars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { time: "Now", rain: "82 mm", floodProb: "75%", landslideProb: "84%", riskClass: "border-red-500/50 bg-red-950/20" },
                { time: "+12 Hours", rain: "105 mm", floodProb: "88%", landslideProb: "92%", riskClass: "border-red-500/50 bg-red-950/30" },
                { time: "+24 Hours", rain: "120 mm", floodProb: "90%", landslideProb: "95%", riskClass: "border-red-500/60 bg-red-950/40" },
                { time: "+48 Hours", rain: "65 mm", floodProb: "60%", landslideProb: "70%", riskClass: "border-amber-500/50 bg-amber-950/20" },
                { time: "+72 Hours", rain: "30 mm", floodProb: "35%", landslideProb: "40%", riskClass: "border-emerald-500/50 bg-emerald-950/20" }
              ].map((step, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${step.riskClass} text-center space-y-2`}>
                  <div className="text-xs font-black text-white">{step.time}</div>
                  <div className="text-sm font-black text-sky-400 font-mono">{step.rain}</div>
                  <div className="text-[10px] font-bold text-slate-300">
                    Flood: <strong className="text-red-400">{step.floodProb}</strong>
                  </div>
                  <div className="text-[10px] font-bold text-slate-300">
                    Landslide: <strong className="text-amber-400">{step.landslideProb}</strong>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk Category Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-950 p-4 rounded-2xl border border-red-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Flood Risk</span>
                  <span className="text-lg font-black text-red-400">HIGH 🔴</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">🌊</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-orange-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Landslide Risk</span>
                  <span className="text-lg font-black text-orange-400">HIGH 🟠</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">⛰️</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Earthquake Risk</span>
                  <span className="text-lg font-black text-amber-400">MEDIUM 🟡</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">📊</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-sky-900/40 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 block">Heavy Rainfall</span>
                  <span className="text-lg font-black text-sky-400">HIGH 🔵</span>
                </div>
                <div className="h-8 w-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">🌧️</div>
              </div>
            </div>

          </div>
        </section>

        {/* ==================================================
            6. CRITICAL ALERTS SECTION
           ================================================== */}
        <section id="section-alerts" className="w-full">
          <div className="bg-[#070d1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-400" />
                <span>Critical Alerts</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">Real-time Emergency Feed</span>
            </div>

            <div className="space-y-3">
              {[
                { id: "A-1", severity: "🔴", title: "NH-10 Road Blocked", desc: "Severe landslide reported near Km 142. Highway traffic halted.", location: "North Sikkim", time: "2 hours ago", lat: 27.3389, lon: 88.6065 },
                { id: "A-2", severity: "🟠", title: "Flood Risk Increased", desc: "Teesta river basin water level breached caution line.", location: "Chungthang Sector", time: "35 minutes ago", lat: 27.58, lon: 88.62 },
                { id: "A-3", severity: "🟡", title: "Heavy Rainfall Warning", desc: "Downpour expected over next 12 hours across East Khasi Hills.", location: "Sohra, Meghalaya", time: "1 hour ago", lat: 25.27, lon: 91.73 }
              ].map(alert => (
                <div key={alert.id} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{alert.severity}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{alert.title}</h4>
                        <span className="text-[10px] text-slate-400">&bull; {alert.location}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({alert.time})</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 font-medium">{alert.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => focusLocationOnMap(alert.lat, alert.lon, 11)}
                      className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-sky-500/30 cursor-pointer"
                    >
                      View on Map
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ==================================================
            7. EMERGENCY RESOURCES GRID
           ================================================== */}
        <section id="section-resources" className="w-full">
          <div className="bg-[#070d1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-400" />
                <span>Emergency Resources</span>
              </h2>
              <span className="text-xs font-bold text-slate-400">Nearest Assets Grid</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {[
                { icon: "🏥", name: "Hospitals", count: "24", status: "24 Nearby", layer: "Emergency Resources", lat: 27.32, lon: 88.61 },
                { icon: "🏠", name: "Shelters", count: "18", status: "18 Active", layer: "Emergency Resources", lat: 27.50, lon: 88.53 },
                { icon: "🚑", name: "Ambulances", count: "11", status: "Available", layer: "Vehicles", lat: 27.33, lon: 88.60 },
                { icon: "🚒", name: "Rescue Teams", count: "27", status: "Deployed", layer: "All", lat: 27.58, lon: 88.62 },
                { icon: "🍱", name: "Relief Centers", count: "13", status: "Active", layer: "Emergency Resources", lat: 26.58, lon: 93.17 },
                { icon: "⛽", name: "Fuel Stations", count: "09", status: "Available", layer: "Emergency Resources", lat: 25.57, lon: 91.89 }
              ].map((res, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setActiveLayerFilter(res.layer);
                    focusLocationOnMap(res.lat, res.lon, 10);
                  }}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer flex flex-col justify-between"
                >
                  <div className="text-2xl mb-1">{res.icon}</div>
                  <div className="text-xl font-black text-white font-mono">{res.count}</div>
                  <div className="text-xs font-bold text-slate-300 mt-0.5">{res.name}</div>
                  <span className="text-[10px] text-emerald-400 font-bold mt-1">{res.status}</span>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ==================================================
            8. RELIEF & LOGISTICS OPERATIONS
           ================================================== */}
        <section className="w-full">
          <div className="bg-[#070d1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-indigo-400" />
                  <span>Relief Operations &amp; Fleet Logistics</span>
                </h2>
                <p className="text-xs text-slate-400 font-semibold">Active supply convoys and dispatch routes</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-extrabold text-slate-300">
                <span>Vehicles: <strong className="text-indigo-400 font-mono">09</strong></span>
                <span>Deliveries: <strong className="text-emerald-400 font-mono">14</strong></span>
              </div>
            </div>

            {/* Logistics Vehicle Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicles.map(v => (
                <div key={v.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white">{v.name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{v.type}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      v.risk === "WARNING" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}>
                      Route: {v.risk}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium bg-[#070d1e] p-2.5 rounded-xl border border-slate-800">
                    <div><span className="text-slate-400">Corridor:</span> <strong className="text-white block">{v.route}</strong></div>
                    <div><span className="text-slate-400">ETA:</span> <strong className="text-sky-400 block font-mono">{v.eta}</strong></div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">Cargo: <strong className="text-slate-200">{v.cargo}</strong></span>
                    <button
                      onClick={() => focusLocationOnMap(27.42, 88.58, 11)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-extrabold cursor-pointer text-xs"
                    >
                      Track Vehicle →
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ==================================================
            10. TRUSTED DATA SOURCES STATUS
           ================================================== */}
        <section className="w-full">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black text-white">Trusted Data Sources Grid</h4>
              <p className="text-[11px] text-slate-400">Verified feeds from satellite &amp; meteorological networks</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-300">
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">ISRO / Bhuvan</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">IMD Weather</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">Govt Reports</span>
              <span className="px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800">OpenStreetMap</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded font-mono font-black">
                DEMO / SIMULATED DATA
              </span>
            </div>
          </div>
        </section>

      </div>

      {/* ==================================================
          11. PERSISTENT EMERGENCY ACTION BAR
         ================================================== */}
      <div className="fixed bottom-16 lg:bottom-4 left-1/2 -translate-x-1/2 z-[90] bg-[#070d1e]/90 backdrop-blur-md border border-slate-700/80 rounded-full px-4 py-2 shadow-2xl flex items-center gap-2">
        <span className="text-xs font-black text-white hidden sm:block pl-2">Need Emergency Help?</span>
        
        <button
          onClick={() => setIsSosOpen(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-1.5 rounded-full text-xs font-black shadow flex items-center gap-1 cursor-pointer"
        >
          <span>🚨</span>
          <span>Emergency SOS</span>
        </button>

        <button
          onClick={() => {
            setActiveLayerFilter("Emergency Resources");
            const mapSection = document.getElementById("section-map");
            mapSection?.scrollIntoView({ behavior: "smooth" });
          }}
          className="bg-purple-600/80 hover:bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow cursor-pointer hidden sm:flex items-center gap-1"
        >
          <span>🏠</span>
          <span>Find Shelter</span>
        </button>

        <button
          onClick={() => {
            setActiveLayerFilter("Emergency Resources");
            const mapSection = document.getElementById("section-map");
            mapSection?.scrollIntoView({ behavior: "smooth" });
          }}
          className="bg-blue-600/80 hover:bg-blue-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow cursor-pointer hidden sm:flex items-center gap-1"
        >
          <span>🏥</span>
          <span>Find Hospital</span>
        </button>
      </div>

      {/* ==================================================
          12. MOBILE FIXED BOTTOM NAVIGATION (Dashboard Only)
         ================================================== */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#070d1e] border-t border-slate-800 px-2 py-2 flex items-center justify-around shadow-2xl">
        {[
          { id: "home", label: "Home", icon: Home, action: () => onNavigateModule ? onNavigateModule("home") : (window.location.href = "/") },
          { id: "map", label: "Map", icon: MapPin, action: () => focusLocationOnMap(27.3389, 88.6065, 8) },
          { id: "dashboard", label: "Dashboard", icon: Gauge, active: true, action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
          { id: "risk", label: "Risk", icon: AlertTriangle, action: () => document.getElementById("section-risk")?.scrollIntoView({ behavior: "smooth" }) },
          { id: "more", label: "More", icon: Menu, action: () => document.getElementById("section-ai")?.scrollIntoView({ behavior: "smooth" }) }
        ].map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition cursor-pointer ${
                item.active ? "text-sky-400 font-extrabold" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Emergency SOS Modal Component */}
      <EmergencySOSModal isOpen={isSosOpen} onClose={() => setIsSosOpen(false)} />

    </div>
  );
}
