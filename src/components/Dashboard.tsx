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
  Mountain,
  Waves,
  Eye,
  ArrowRight,
  ShieldCheck,
  Globe,
  Wind,
  Droplets,
  Thermometer,
  Gauge,
  Calendar
} from "lucide-react";

import { getNERLandslideTelemetry, LandslideTelemetrySummary, EvaluatedLandslideSector } from "../services/api/landslideService";
import { getNERFloodTelemetry, FloodTelemetrySummary, FloodReportItem } from "../services/api/floodService";
import { getLiveWeather, WeatherData } from "../services/api/weather";
import { MASTER_NER_POLYGON, NER_COVERAGE_LABEL, NER_STATES, isPointInNER } from "../utils/nerBoundary";

interface DashboardProps {
  onNavigateModule?: (module: string) => void;
}

// Major NER Capital Hubs for Weather Telemetry
const NER_CAPITAL_HUBS = [
  { id: "guwahati", name: "Guwahati (Assam)", state: "Assam", lat: 26.1445, lon: 91.7362 },
  { id: "shillong", name: "Shillong (Meghalaya)", state: "Meghalaya", lat: 25.5788, lon: 91.8933 },
  { id: "itanagar", name: "Itanagar (Arunachal Pradesh)", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053 },
  { id: "imphal", name: "Imphal (Manipur)", state: "Manipur", lat: 24.8170, lon: 93.9368 },
  { id: "aizawl", name: "Aizawl (Mizoram)", state: "Mizoram", lat: 23.7271, lon: 92.7176 },
  { id: "kohima", name: "Kohima (Nagaland)", state: "Nagaland", lat: 25.6751, lon: 94.1086 },
  { id: "gangtok", name: "Gangtok (Sikkim)", state: "Sikkim", lat: 27.3389, lon: 88.6065 },
  { id: "agartala", name: "Agartala (Tripura)", state: "Tripura", lat: 23.8315, lon: 91.2868 }
];

export default function Dashboard({ onNavigateModule }: DashboardProps) {
  const { t } = useTranslation();

  // Active Dashboard Pillar Tab: 'all' | 'landslide' | 'flood' | 'livemap' | 'weather'
  const [activeTab, setActiveTab] = useState<'all' | 'landslide' | 'flood' | 'livemap' | 'weather'>('all');

  // Selected State Filter
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("All");

  // Selected Weather Hub
  const [selectedHub, setSelectedHub] = useState(NER_CAPITAL_HUBS[1]); // Default Shillong

  // Telemetry Data States
  const [landslideData, setLandslideData] = useState<LandslideTelemetrySummary | null>(null);
  const [floodData, setFloodData] = useState<FloodTelemetrySummary | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Fetch all live data for 4 pillars
  const fetchAllTelemetry = async () => {
    setLoading(true);
    try {
      const stateArg = selectedStateFilter !== "All" ? selectedStateFilter : undefined;
      const [lsRes, flRes, wxRes] = await Promise.all([
        getNERLandslideTelemetry(stateArg),
        getNERFloodTelemetry(stateArg),
        getLiveWeather(selectedHub.lat, selectedHub.lon)
      ]);

      setLandslideData(lsRes);
      setFloodData(flRes);
      setWeatherData(wxRes);
    } catch (e) {
      console.error("Error fetching dashboard telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTelemetry();
  }, [selectedStateFilter, selectedHub]);

  // Render Leaflet Map for Pillar 3 (Live GIS Map)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix default Leaflet marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
      });

      const map = L.map(mapContainerRef.current).setView([25.8, 92.5], 7);

      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 16,
        attribution: "Jeevan Setu GIS Telemetry &bull; Esri Dark Canvas"
      }).addTo(map);

      // Render Master 8-State NER Boundary Polygon
      const polygonCoords: L.LatLngExpression[] = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon]);
      L.polygon(polygonCoords, {
        color: "#0284c7",
        weight: 2,
        fillColor: "#38bdf8",
        fillOpacity: 0.08,
        dashArray: "5, 5"
      }).addTo(map).bindPopup("<b>📍 North Eastern Region (8 States Boundary)</b>");

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Clear previous markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }

    const markers = markersGroupRef.current;
    if (!markers) return;

    // 1. Plot Landslide Sector Markers
    if (landslideData && landslideData.sectors) {
      landslideData.sectors.forEach(sec => {
        if (!isPointInNER(sec.record.lat, sec.record.lon)) return;

        const color = sec.riskLevel === "CRITICAL" ? "#ef4444" :
                      sec.riskLevel === "HIGH" ? "#f97316" :
                      sec.riskLevel === "MODERATE" ? "#eab308" : "#10b981";

        const iconHtml = `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 0 10px ${color}">⛰️</div>`;
        const customIcon = L.divIcon({
          className: "custom-ls-marker",
          html: iconHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([sec.record.lat, sec.record.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:180px;">
            <b style="color:#0f172a;">⛰️ Landslide: ${sec.record.locationName}</b><br/>
            <span>State: <b>${sec.record.state}</b> &bull; Risk: <b style="color:${color}">${sec.riskLevel}</b></span><br/>
            <span>Highway: ${sec.record.primaryHighway} &bull; Road: <b>${sec.record.roadStatus}</b></span><br/>
            <span>Rainfall: <b>${sec.weather.precipitation} mm</b></span>
          </div>
        `);
        markers.addLayer(marker);
      });
    }

    // 2. Plot Flood Sector Markers
    if (floodData && floodData.reports) {
      floodData.reports.forEach(fld => {
        if (!isPointInNER(fld.lat, fld.lon)) return;

        const color = fld.riskLevel === "CRITICAL" ? "#ef4444" :
                      fld.riskLevel === "HIGH" ? "#f97316" :
                      fld.riskLevel === "MODERATE" ? "#eab308" : "#3b82f6";

        const iconHtml = `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 0 10px ${color}">🌊</div>`;
        const customIcon = L.divIcon({
          className: "custom-fl-marker",
          html: iconHtml,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });

        const marker = L.marker([fld.lat, fld.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:180px;">
            <b style="color:#0f172a;">🌊 Flood: ${fld.locationName}</b><br/>
            <span>River: <b>${fld.riverBasin}</b> &bull; State: <b>${fld.state}</b></span><br/>
            <span>Water Level: <b style="color:${color}">${fld.waterLevelMeters}m</b> (Danger: ${fld.dangerLevelMeters}m)</span><br/>
            <span>Flow: <b>${fld.flowRateCumec} cumecs</b></span>
          </div>
        `);
        markers.addLayer(marker);
      });
    }

    // Invalidate map size after DOM renders/tabs switch
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [landslideData, floodData, activeTab]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              {NER_COVERAGE_LABEL}
            </span>

            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-black text-sky-700 dark:text-sky-300 border border-sky-500/30">
              ● REAL-TIME DISASTER INTELLIGENCE GRID
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <Gauge className="h-7 w-7 text-sky-500 shrink-0" />
            North Eastern Region Disaster Risk Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
            Unified live telemetry for Landslide Hazard Indices, Flood River Basins, GIS Satellite Mapping, and Open-Meteo Weather Radar strictly scoped to India's 8 North Eastern states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <select
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="All">All 8 NER States</option>
            {NER_STATES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          <button
            onClick={fetchAllTelemetry}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-extrabold cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Telemetry
          </button>
        </div>
      </div>

      {/* 📊 4 CORE PILLAR KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Pillar 1: Landslide Risk */}
        <div
          onClick={() => setActiveTab('landslide')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 ${
            activeTab === 'landslide'
              ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/40 shadow-xl'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Mountain className="h-4 w-4 text-orange-500" /> 1. Landslide Risk
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30">
              {landslideData ? `${landslideData.criticalSectorsCount + landslideData.highRiskSectorsCount} HIGH RISK` : 'LOADING'}
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {landslideData ? landslideData.totalSectors : 0} <span className="text-xs font-normal text-slate-500">Monitored Sectors</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>Critical Pass: <b>{landslideData ? landslideData.criticalSectorsCount : 0}</b></span>
            <span className="text-orange-500 font-bold flex items-center gap-1">View Details ➔</span>
          </div>
        </div>

        {/* Pillar 2: Flood Risk */}
        <div
          onClick={() => setActiveTab('flood')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 ${
            activeTab === 'flood'
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-xl'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Waves className="h-4 w-4 text-blue-500" /> 2. Flood Risk
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              {floodData ? `${floodData.criticalSectorsCount} SWELLING` : 'LOADING'}
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {floodData ? floodData.totalMonitoredSectors : 0} <span className="text-xs font-normal text-slate-500">River Basins</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>High Vulnerability: <b>{floodData ? floodData.highRiskSectorsCount + floodData.criticalSectorsCount : 0}</b></span>
            <span className="text-blue-500 font-bold flex items-center gap-1">View Basins ➔</span>
          </div>
        </div>

        {/* Pillar 3: Live GIS Map */}
        <div
          onClick={() => {
            setActiveTab('livemap');
            setTimeout(() => {
              const el = document.getElementById('live-gis-minimap-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              if (mapInstanceRef.current) mapInstanceRef.current.invalidateSize();
            }, 100);
          }}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 ${
            activeTab === 'livemap'
              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-xl'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-500" /> 3. Live GIS Map
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              8 NER STATES
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {landslideData && floodData ? landslideData.totalSectors + floodData.totalMonitoredSectors : 0} <span className="text-xs font-normal text-slate-500">GIS Telemetry Points</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>Interactive Leaflet Map</span>
            <span className="text-emerald-500 font-bold flex items-center gap-1">Open Map ➔</span>
          </div>
        </div>

        {/* Pillar 4: Weather Intelligence */}
        <div
          onClick={() => setActiveTab('weather')}
          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-3 ${
            activeTab === 'weather'
              ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/40 shadow-xl'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CloudRain className="h-4 w-4 text-sky-500" /> 4. Weather & Radar
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
              OPEN-METEO
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {weatherData ? `${weatherData.temperature}°C` : '...'} <span className="text-xs font-normal text-slate-500">({selectedHub.state})</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>Rain: <b>{weatherData ? `${weatherData.precipitation} mm` : '0 mm'}</b></span>
            <span className="text-sky-500 font-bold flex items-center gap-1">Forecast ➔</span>
          </div>
        </div>

      </div>

      {/* 🧭 PILLAR SELECTOR TABS BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
            activeTab === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-md'
              : 'bg-white dark:bg-[#070d1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🌐 Unified Overview (All 4 Pillars)
        </button>

        <button
          onClick={() => setActiveTab('landslide')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
            activeTab === 'landslide'
              ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-[#070d1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          ⛰️ 1. Landslide Risk
        </button>

        <button
          onClick={() => setActiveTab('flood')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
            activeTab === 'flood'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
              : 'bg-white dark:bg-[#070d1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🌊 2. Flood Intelligence
        </button>

        <button
          onClick={() => setActiveTab('livemap')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
            activeTab === 'livemap'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-[#070d1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🗺️ 3. Live GIS Map
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
            activeTab === 'weather'
              ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20'
              : 'bg-white dark:bg-[#070d1e] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🌤️ 4. Weather & Radar
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* ⛰️ PILLAR 1: LANDSLIDE RISK INTELLIGENCE SECTION */}
      {/* ---------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'landslide') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <Mountain className="h-5 w-5 text-orange-500" />
                1. Landslide Risk & Hazard Intelligence (8 NER States)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Live Open-Meteo precipitation cross-referenced against slope stability and road blockage risk.
              </p>
            </div>

            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('landslide')}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30 text-xs font-black border border-orange-500/30 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Open Full Landslide Module ➔
              </button>
            )}
          </div>

          {landslideData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {landslideData.sectors.slice(0, 4).map(sec => (
                <div key={sec.record.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      sec.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                      sec.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30' :
                      'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    }`}>
                      {sec.riskLevel} RISK
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">{sec.record.state}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">{sec.record.locationName}</h3>
                  
                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                    <div>Highway: <b className="text-slate-800 dark:text-slate-200">{sec.record.primaryHighway}</b></div>
                    <div>Slope: <b>{sec.record.slopeDegrees}°</b> &bull; Altitude: <b>{sec.record.elevationMeters}m</b></div>
                    <div>24h Rain: <b className="text-sky-600 dark:text-sky-400">{sec.weather.precipitation} mm</b></div>
                    <div>Road Status: <b className={sec.record.roadStatus === 'Blocked' ? 'text-rose-500' : 'text-emerald-500'}>{sec.record.roadStatus}</b></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 🌊 PILLAR 2: FLOOD INTELLIGENCE SECTION */}
      {/* ---------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'flood') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <Waves className="h-5 w-5 text-blue-500" />
                2. Flood Intelligence & River Basin Telemetry (8 NER States)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                CWC & Open-Meteo telemetry monitoring water levels, discharge rates, and inundation risks.
              </p>
            </div>

            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('flood')}
                className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 text-xs font-black border border-blue-500/30 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Open Full Flood Module ➔
              </button>
            )}
          </div>

          {floodData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {floodData.reports.slice(0, 4).map(fld => (
                <div key={fld.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      fld.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30' :
                      fld.riskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30' :
                      'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                    }`}>
                      {fld.riskLevel} FLOOD
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-500">{fld.state}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">{fld.locationName}</h3>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-medium">
                    <div>Basin: <b className="text-slate-800 dark:text-slate-200">{fld.riverBasin}</b></div>
                    <div>Level: <b className="text-rose-500">{fld.waterLevelMeters}m</b> (Danger: {fld.dangerLevelMeters}m)</div>
                    <div>Flow Rate: <b>{fld.flowRateCumec} cumecs</b></div>
                    <div>Status: <span className="text-slate-700 dark:text-slate-300 font-bold">{fld.statusSummary}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 🗺️ PILLAR 3: LIVE GIS MAP SECTION */}
      {/* ---------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'livemap') && (
        <div id="live-gis-minimap-section" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-emerald-500" />
                3. Live North Eastern Region GIS Map Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Interactive Leaflet mini map showing 8-state NER boundary and real-time hazard markers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                ● Live GIS Telemetry Active
              </span>

              {onNavigateModule && (
                <button
                  onClick={() => onNavigateModule('map')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-400/30"
                >
                  Open Full 2D Tactical GIS Map 🗺️
                </button>
              )}
            </div>
          </div>

          <div ref={mapContainerRef} className="h-80 sm:h-96 min-h-[320px] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner" />

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> ⛰️ Landslide Sectors</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> 🌊 Flood Basins</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span> 📍 8 States Boundary</span>
            </div>
            <span>Single Source of Truth: 8 NER States Only</span>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 🌤️ PILLAR 4: WEATHER INTELLIGENCE SECTION */}
      {/* ---------------------------------------------------------------------- */}
      {(activeTab === 'all' || activeTab === 'weather') && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-5 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <CloudRain className="h-5 w-5 text-sky-500" />
                4. Weather & Doppler Radar Telemetry (Open-Meteo Live API)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Live atmospheric conditions, 24h precipitation, wind speeds, and 7-day forecast.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedHub.id}
                onChange={(e) => {
                  const hub = NER_CAPITAL_HUBS.find(h => h.id === e.target.value);
                  if (hub) setSelectedHub(hub);
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                {NER_CAPITAL_HUBS.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>

              {onNavigateModule && (
                <button
                  onClick={() => onNavigateModule('weather')}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 hover:bg-sky-500/30 text-xs font-black border border-sky-500/30 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  Open Full Weather Module ➔
                </button>
              )}
            </div>
          </div>

          {weatherData ? (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              
              {/* Weather Stats Overview */}
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                    {weatherData.temperature}°C
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">{weatherData.condition}</div>
                    <div className="text-xs text-slate-500 font-medium">Feels like: {weatherData.feelsLike}°C &bull; {selectedHub.name}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Precipitation</span>
                    <b className="text-sky-600 dark:text-sky-400 text-sm font-black block mt-0.5">{weatherData.precipitation} mm</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Humidity</span>
                    <b className="text-blue-600 dark:text-blue-400 text-sm font-black block mt-0.5">{weatherData.relativeHumidity}%</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Wind Speed</span>
                    <b className="text-emerald-600 dark:text-emerald-400 text-sm font-black block mt-0.5">{weatherData.windSpeed} km/h</b>
                  </div>
                </div>
              </div>

              {/* 7-Day Forecast Snippet */}
              <div className="md:col-span-6 space-y-2">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-sky-500" /> 7-Day Forecast Telemetry ({selectedHub.state})
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center font-mono">
                  {weatherData.forecast7Days?.map((day, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="text-[9px] font-bold text-slate-500">{day.dayName.slice(0, 3)}</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white">{day.tempMax}°</div>
                      <div className="text-[9px] text-sky-600 dark:text-sky-400 font-bold">{day.precipitationProbabilityMax}% ☔</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 font-bold text-xs">
              Loading Open-Meteo weather telemetry...
            </div>
          )}
        </div>
      )}

    </div>
  );
}
