import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  Calendar,
  ChevronDown
} from "lucide-react";

import { getNERLandslideTelemetry, LandslideTelemetrySummary, EvaluatedLandslideSector } from "../services/api/landslideService";
import { getNERFloodTelemetry, FloodTelemetrySummary, FloodReportItem } from "../services/api/floodService";
import { getLiveWeather, WeatherData } from "../services/api/weather";
import { getNEREarthquakeTelemetry, EarthquakeTelemetrySummary } from "../services/api/earthquakeService";
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
  const { t, language } = useTranslation();

  // Active Dashboard Pillar Tab: 'all' | 'landslide' | 'flood' | 'livemap' | 'weather'
  const [activeTab, setActiveTab] = useState<'all' | 'landslide' | 'flood' | 'livemap' | 'weather'>('all');

  // Selected State Filter
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>("All");

  // Selected Weather Hub
  const [selectedHub, setSelectedHub] = useState(NER_CAPITAL_HUBS[1]); // Default Shillong

  // Unified State & Weather Hub Filter Handler
  const handleSelectStateFilter = (stateName: string) => {
    setSelectedStateFilter(stateName);
    if (stateName !== 'All') {
      const matchingHub = NER_CAPITAL_HUBS.find(
        h => h.state.toLowerCase() === stateName.toLowerCase()
      );
      if (matchingHub) {
        setSelectedHub(matchingHub);
      }
    }
  };

  // Synchronize weather hub whenever selected state filter changes
  useEffect(() => {
    if (selectedStateFilter && selectedStateFilter !== 'All') {
      const matchingHub = NER_CAPITAL_HUBS.find(
        h => h.state.toLowerCase() === selectedStateFilter.toLowerCase()
      );
      if (matchingHub && matchingHub.id !== selectedHub.id) {
        setSelectedHub(matchingHub);
      }
    }
  }, [selectedStateFilter]);

  // Telemetry Data States
  const [landslideData, setLandslideData] = useState<LandslideTelemetrySummary | null>(null);
  const [floodData, setFloodData] = useState<FloodTelemetrySummary | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [earthquakeData, setEarthquakeData] = useState<EarthquakeTelemetrySummary | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("");
  const [isOfflineCached, setIsOfflineCached] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Hydrate from local cache immediately on mount (Stale-While-Revalidate)
  useEffect(() => {
    try {
      const cached = localStorage.getItem('jeevan_setu_telemetry_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.lsRes) setLandslideData(parsed.lsRes);
        if (parsed.flRes) setFloodData(parsed.flRes);
        if (parsed.wxRes) setWeatherData(parsed.wxRes);
        if (parsed.eqRes) setEarthquakeData(parsed.eqRes);
        if (parsed.syncedTime) setLastSyncedTime(parsed.syncedTime);
        setIsOfflineCached(true);
        setLoading(false);
      }
    } catch (_) {}
  }, []);

  // Fetch all live data for 4 pillars (with silent background option)
  const fetchAllTelemetry = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const stateArg = selectedStateFilter !== "All" ? selectedStateFilter : undefined;
      
      // Determine effective weather hub: sync to state filter if specific state selected
      let effectiveHub = selectedHub;
      if (selectedStateFilter !== "All") {
        const matching = NER_CAPITAL_HUBS.find(
          h => h.state.toLowerCase() === selectedStateFilter.toLowerCase()
        );
        if (matching) {
          effectiveHub = matching;
        }
      }

      const [lsRes, flRes, wxRes, eqRes] = await Promise.all([
        getNERLandslideTelemetry(stateArg),
        getNERFloodTelemetry(stateArg),
        getLiveWeather(effectiveHub.lat, effectiveHub.lon),
        getNEREarthquakeTelemetry()
      ]);

      setLandslideData(lsRes);
      setFloodData(flRes);
      setWeatherData(wxRes);
      setEarthquakeData(eqRes);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncedTime(nowStr);
      setIsOfflineCached(false);

      // Cache snapshot for offline resilience
      try {
        localStorage.setItem('jeevan_setu_telemetry_cache', JSON.stringify({
          lsRes,
          flRes,
          wxRes,
          eqRes,
          timestamp: Date.now(),
          syncedTime: nowStr
        }));
      } catch (_) {}
    } catch (e) {
      console.error("Error fetching dashboard telemetry:", e);
      // Fallback to cache on error
      try {
        const cached = localStorage.getItem('jeevan_setu_telemetry_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.lsRes && !landslideData) setLandslideData(parsed.lsRes);
          if (parsed.flRes && !floodData) setFloodData(parsed.flRes);
          if (parsed.wxRes && !weatherData) setWeatherData(parsed.wxRes);
          if (parsed.eqRes && !earthquakeData) setEarthquakeData(parsed.eqRes);
          setLastSyncedTime(parsed.syncedTime || 'Cached');
          setIsOfflineCached(true);
        }
      } catch (_) {}
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Trigger telemetry on user filter/hub change
  useEffect(() => {
    fetchAllTelemetry();
  }, [selectedStateFilter, selectedHub]);

  // 60-Second Automated Background Polling
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAllTelemetry(true);
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedStateFilter, selectedHub]);

  // Render Leaflet Map for Pillar 3 (Live GIS Map)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy any existing instance before initializing fresh map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Fix default Leaflet marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
    });

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      minZoom: 5,
      maxZoom: 18
    }).setView([25.8, 92.5], 7);

    // Ultra-reliable Google Maps Satellite/Roads Hybrid tiles
    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "&copy; Google Maps &bull; Jeevan Setu GIS Grid"
    }).addTo(map);

    // Render Master 8-State NER Boundary Polygon
    const polygonCoords: L.LatLngExpression[] = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon]);
    L.polygon(polygonCoords, {
      color: "#0284c7",
      weight: 2.5,
      fillColor: "#38bdf8",
      fillOpacity: 0.1,
      dashArray: "6, 6"
    }).addTo(map).bindPopup("<b>📍 North Eastern Region (8 States Sovereign Boundary)</b>");

    const markers = L.layerGroup().addTo(map);
    markersGroupRef.current = markers;
    mapInstanceRef.current = map;

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
            <span>Discharge: <b>${fld.liveDischargeM3s ? `${fld.liveDischargeM3s} m³/s (GloFAS Live)` : `${fld.flowRateCumec} cumecs`}</b></span>
          </div>
        `);
        markers.addLayer(marker);
      });
    }

    // 3. Plot Live USGS Earthquake Epicenters (if any in last 24h)
    if (earthquakeData && earthquakeData.events.length > 0) {
      earthquakeData.events.forEach(eq => {
        const customIcon = L.divIcon({
          className: "custom-eq-marker",
          html: `<div style="background:#ef4444;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 0 14px #ef4444;font-weight:900;">⚡</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([eq.lat, eq.lon], { icon: customIcon });
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:12px;min-width:180px;">
            <b style="color:#ef4444;">⚡ Live USGS Tremor: M${eq.magnitude}</b><br/>
            <span>Epicenter: <b>${eq.place}</b></span><br/>
            <span>Depth: <b>${eq.depthKm} km</b> &bull; Recorded: <b>${eq.formattedTime}</b></span><br/>
            <span style="font-size:10px;color:#64748b;">USGS Global Earthquake Network Sync</span>
          </div>
        `);
        markers.addLayer(marker);
      });
    }

    // Ensure Leaflet recalculates size smoothly after mount
    const resizeTimer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [landslideData, floodData, earthquakeData, activeTab]);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 space-y-5 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300 min-w-0 max-w-full">
      
      {/* 🎛️ PROMINENT MOBILE FEATURE SWITCHER BANNER */}
      <div className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-xl flex items-center justify-between gap-3 border border-sky-400/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
            🎛️
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black leading-tight">
              {language === 'hi' ? 'दूसरा फीचर खोलना चाहते हैं?' : 'Want to Switch to Another Feature?'}
            </h3>
            <p className="text-[10px] sm:text-xs text-sky-100 font-semibold mt-0.5">
              {language === 'hi' ? 'सभी 18 फीचर्स की लिस्ट देखें' : 'Select from 18 Live Intelligence Modules'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (onNavigateModule) onNavigateModule('launcher');
            const event = new CustomEvent('openMobileMenu');
            window.dispatchEvent(event);
          }}
          className="px-4 py-2 rounded-xl bg-white text-slate-900 font-black text-xs shadow-md hover:bg-sky-50 active:scale-95 transition cursor-pointer shrink-0 border border-white/50"
        >
          {language === 'hi' ? '18 फीचर्स देखें ➔' : 'View 18 Features ➔'}
        </button>
      </div>

      {/* 🔴 MODERN EXECUTIVE CRISIS COMMAND HERO BANNER */}
      <div className="relative rounded-3xl p-6 sm:p-7 overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#0c142b] dark:via-[#090e1d] dark:to-[#060a15] shadow-xl dark:shadow-2xl transition-all">
        {/* Ambient Glow Orbs */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/20 dark:border-sky-500/30">
                Real-Time Telemetry Grid
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                {NER_COVERAGE_LABEL}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <Activity className="h-3 w-3 text-sky-500 animate-pulse" />
                <span>Auto-synced (60s){lastSyncedTime ? ` • ${lastSyncedTime}` : ''}</span>
              </span>
              {isOfflineCached && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 uppercase tracking-wider">
                  Cached Snapshot
                </span>
              )}
            </div>

            <div className="flex items-start gap-3.5 pt-1">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500/15 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shadow-inner shrink-0 mt-0.5">
                <Gauge className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white tracking-tight leading-[1.18]">
                  {language === 'hi' ? 'पूर्वोत्तर क्षेत्र' : 'North Eastern Region'}{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-sky-400 to-indigo-400 dark:from-sky-400 dark:via-sky-300 dark:to-indigo-300">
                    {language === 'hi' ? 'आपदा जोखिम कमान' : 'Disaster Risk Command'}
                  </span>
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal max-w-2xl">
                  {language === 'hi'
                    ? 'भारत के 8 पूर्वोत्तर राज्यों में एकीकृत स्थितिजन्य निगरानी। ढलान अस्थिरता, नदी जल स्तर और वर्षा विसंगतियों की सक्रिय ट्रैकिंग।'
                    : "Unified situational monitoring across India's 8 North Eastern states. Active sensors tracking slope instability, river surge volumes, and precipitation anomalies."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 lg:self-center">
            <div className="relative">
              <select
                value={selectedStateFilter}
                onChange={(e) => handleSelectStateFilter(e.target.value)}
                className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 hover:border-sky-400/60 px-4 py-2.5 pr-9 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-sm outline-none cursor-pointer transition focus:ring-2 focus:ring-sky-500/30"
              >
                <option value="All">{language === 'hi' ? 'सभी 8 पूर्वोत्तर राज्य' : 'All 8 NER States'}</option>
                {NER_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                <Compass className="h-4 w-4" />
              </div>
            </div>

            <button
              onClick={() => fetchAllTelemetry()}
              className="px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 hover:border-sky-400 font-semibold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-sm"
              title={language === 'hi' ? 'टेलीमेट्री सिंक करें' : 'Sync Real-Time Telemetry'}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{language === 'hi' ? 'टेलीमेट्री सिंक करें' : 'Sync Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* 8-State Interactive Quick-Filter Chips */}
        <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar w-full min-w-0">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1">
            {language === 'hi' ? 'राज्य:' : 'States:'}
          </span>
          
          <button
            onClick={() => handleSelectStateFilter('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
              selectedStateFilter === 'All'
                ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30'
                : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400/50'
            }`}
          >
            All 8 States
          </button>

          {[
            { name: 'Assam', risk: 'Flood Watch', dot: 'bg-amber-400', color: 'text-amber-500 dark:text-amber-400' },
            { name: 'Meghalaya', risk: 'Monsoon Rain', dot: 'bg-amber-400', color: 'text-amber-500 dark:text-amber-400' },
            { name: 'Sikkim', risk: 'Landslide Alert', dot: 'bg-rose-500 animate-pulse', color: 'text-rose-500 dark:text-rose-400' },
            { name: 'Arunachal Pradesh', risk: 'Normal', dot: 'bg-emerald-400', color: 'text-emerald-500 dark:text-emerald-400' },
            { name: 'Manipur', risk: 'Stable', dot: 'bg-emerald-400', color: 'text-emerald-500 dark:text-emerald-400' },
            { name: 'Mizoram', risk: 'Stable', dot: 'bg-emerald-400', color: 'text-emerald-500 dark:text-emerald-400' },
            { name: 'Nagaland', risk: 'Normal', dot: 'bg-emerald-400', color: 'text-emerald-500 dark:text-emerald-400' },
            { name: 'Tripura', risk: 'Normal', dot: 'bg-emerald-400', color: 'text-emerald-500 dark:text-emerald-400' }
          ].map((st) => (
            <button
              key={st.name}
              onClick={() => handleSelectStateFilter(st.name)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-2 ${
                selectedStateFilter === st.name
                  ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-400/80 shadow-md ring-1 ring-sky-400/40 font-semibold'
                  : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-sky-400/50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${st.dot}`}></span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{st.name}</span>
              <span className={`text-[11px] font-medium ${st.color}`}>{st.risk}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 📊 4 CORE PILLAR KPI SUMMARY CARDS (Glassmorphism + Dedicated Color Identities) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 min-w-0 max-w-full">
        
        {/* Pillar 1: Landslide Risk */}
        <div
          onClick={() => setActiveTab('landslide')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${
            activeTab === 'landslide'
              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/40 shadow-2xl shadow-amber-500/10'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c1427]/70 hover:border-amber-500/40 shadow-lg hover:shadow-xl'
          } backdrop-blur-xl`}
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Mountain className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'भूस्खलन खतरा' : 'Landslide Hazard'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              {landslideData ? `${landslideData.criticalSectorsCount + landslideData.highRiskSectorsCount} ${language === 'hi' ? 'उच्च जोखिम' : 'HIGH RISK'}` : (language === 'hi' ? 'लोड हो रहा है' : 'LOADING')}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{landslideData ? landslideData.totalSectors : 0}</span>
            <span className="text-xs font-semibold text-slate-500">{language === 'hi' ? 'निगरानी क्षेत्र' : 'Monitored Sectors'}</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 my-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${landslideData ? Math.min(100, Math.round(((landslideData.criticalSectorsCount + landslideData.highRiskSectorsCount) / Math.max(1, landslideData.totalSectors)) * 100)) : 60}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>{language === 'hi' ? 'गंभीर दर्रा:' : 'Critical Pass:'} <b className="text-slate-900 dark:text-white">{landslideData ? landslideData.criticalSectorsCount : 0}</b></span>
            <span className="text-amber-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">{language === 'hi' ? 'विवरण देखें →' : 'View Details →'}</span>
          </div>
        </div>

        {/* Pillar 2: Flood Risk */}
        <div
          onClick={() => setActiveTab('flood')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${
            activeTab === 'flood'
              ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/40 shadow-2xl shadow-blue-500/10'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c1427]/70 hover:border-blue-500/40 shadow-lg hover:shadow-xl'
          } backdrop-blur-xl`}
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Waves className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'नदी बेसिन' : 'River Basins'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30">
              {floodData ? `${floodData.criticalSectorsCount} ${language === 'hi' ? 'जल-स्तर वृद्धि' : 'SWELLING'}` : (language === 'hi' ? 'लोड हो रहा है' : 'LOADING')}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{floodData ? floodData.totalMonitoredSectors : 0}</span>
            <span className="text-xs font-semibold text-slate-500">{language === 'hi' ? 'निगरानी नदियां' : 'Monitored Rivers'}</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 my-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${floodData ? Math.min(100, Math.round((floodData.criticalSectorsCount / Math.max(1, floodData.totalMonitoredSectors)) * 100 + 40)) : 55}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>
              {floodData?.glofasConnected ? (
                <>GloFAS Flow: <b className="text-slate-900 dark:text-white font-mono">{floodData?.reports?.[0]?.liveDischargeM3s ?? 15.6} m³/s</b></>
              ) : (
                <>{language === 'hi' ? 'उच्च संवेदनशीलता:' : 'High Vulnerability:'} <b className="text-slate-900 dark:text-white">{floodData ? floodData.highRiskSectorsCount + floodData.criticalSectorsCount : 0}</b></>
              )}
            </span>
            <span className="text-blue-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">{language === 'hi' ? 'बेसिन विश्लेषण →' : 'Analyze Basins →'}</span>
          </div>
        </div>

        {/* Pillar 3: Live GIS Map */}
        <div
          onClick={() => setActiveTab('livemap')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${
            activeTab === 'livemap'
              ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40 shadow-2xl shadow-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c1427]/70 hover:border-emerald-500/40 shadow-lg hover:shadow-xl'
          } backdrop-blur-xl`}
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'जीआईएस उपग्रह' : 'GIS Satellite'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              8 NER STATES
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{landslideData && floodData ? landslideData.totalSectors + floodData.totalMonitoredSectors : 0}</span>
            <span className="text-xs font-semibold text-slate-500">{language === 'hi' ? 'जीआईएस टेलीमेट्री बिंदु' : 'GIS Telemetry Points'}</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 my-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-1.5 rounded-full w-[92%]" />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>{language === 'hi' ? 'इंटरैक्टिव लीफलेट मानचित्र' : 'Interactive Leaflet Map'}</span>
            <span className="text-emerald-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">{language === 'hi' ? 'मानचित्र खोलें →' : 'Open Map →'}</span>
          </div>
        </div>

        {/* Pillar 4: Weather Intelligence */}
        <div
          onClick={() => setActiveTab('weather')}
          className={`p-5 rounded-3xl border cursor-pointer transition-all duration-300 relative group overflow-hidden ${
            activeTab === 'weather'
              ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/40 shadow-2xl shadow-sky-500/10'
              : 'border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0c1427]/70 hover:border-sky-500/40 shadow-lg hover:shadow-xl'
          } backdrop-blur-xl`}
        >
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl group-hover:bg-sky-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500">
                <CloudRain className="h-4 w-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {language === 'hi' ? 'मौसम एवं रडार' : 'Weather & Radar'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30">
              OPEN-METEO
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{weatherData ? `${weatherData.temperature}°C` : '...'}</span>
            <span className="text-xs font-semibold text-slate-500">({selectedStateFilter !== 'All' ? selectedStateFilter : selectedHub.state})</span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800/80 rounded-full h-1.5 my-2.5 overflow-hidden">
            <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-1.5 rounded-full w-[76%]" />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
            <span>{language === 'hi' ? 'वर्षा:' : 'Rain:'} <b className="text-slate-900 dark:text-white">{weatherData ? `${weatherData.precipitation} mm` : '0 mm'}</b></span>
            <span className="text-sky-500 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">{language === 'hi' ? 'पूर्वानुमान →' : 'Forecast →'}</span>
          </div>
        </div>

      </div>

      {/* 🧭 PILLAR SELECTOR TABS BAR (Modern Segmented Control) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        {/* Left: Active State Filter */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>{language === 'hi' ? 'सक्रिय राज्य फ़िल्टर:' : 'Active State Filter:'}</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
            {selectedStateFilter}
          </span>
        </div>

        {/* Right (at the right side of All): 4 Pillar Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 dark:bg-[#090e1d] p-1.5 rounded-2xl border border-slate-300/60 dark:border-slate-800 ml-auto">
          <button
            onClick={() => setActiveTab(activeTab === 'landslide' ? 'all' : 'landslide')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'landslide'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>⛰️</span>
            <span>{language === 'hi' ? 'भूस्खलन जोखिम' : 'Landslide Risk'}</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'flood' ? 'all' : 'flood')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'flood'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>🌊</span>
            <span>{language === 'hi' ? 'बाढ़ बुद्धिमत्ता' : 'Flood Intelligence'}</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'livemap' ? 'all' : 'livemap')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'livemap'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>🗺️</span>
            <span>{language === 'hi' ? 'लाइव जीआईएस मानचित्र' : 'Live GIS Map'}</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'weather' ? 'all' : 'weather')}
            className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
              activeTab === 'weather'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>🌤️</span>
            <span>{language === 'hi' ? 'मौसम एवं रडार' : 'Weather & Radar'}</span>
          </button>
        </div>
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
                {language === 'hi' ? '1. भूस्खलन जोखिम एवं खतरा बुद्धिमत्ता (8 NER राज्य)' : '1. Landslide Risk & Hazard Intelligence (8 NER States)'}
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
                CWC & European Commission GloFAS live telemetry monitoring river flow rates, water stages, and inundation risks.
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
                    <div className="flex items-center justify-between">
                      <span>Flow: <b>{fld.liveDischargeM3s ? `${fld.liveDischargeM3s} m³/s` : `${fld.flowRateCumec} cumecs`}</b></span>
                      {fld.liveDischargeM3s && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-500/20 text-sky-700 dark:text-sky-300">GloFAS Live</span>}
                    </div>
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
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <MapPin className="h-5 w-5 text-emerald-500" />
                3. Live North Eastern Region GIS Map Telemetry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Interactive Leaflet map showing 8-state NER boundary and real-time hazard markers.
              </p>
            </div>

            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('map')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0 border border-indigo-400/30"
              >
                Open Full 2D Tactical GIS Map 🗺️
              </button>
            )}
          </div>

          <div ref={mapContainerRef} className="h-96 min-h-[384px] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative z-0" />

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
          <div className="flex flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5 gap-3.5">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5 tracking-tight">
                <CloudRain className="h-5 w-5 text-sky-500 shrink-0" />
                <span>4. Weather &amp; Doppler Radar Telemetry (Open-Meteo Live API)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                Live atmospheric conditions, 24h precipitation, wind speeds, and 7-day forecast.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="relative">
                <select
                  value={selectedHub.id}
                  onChange={(e) => {
                    const hub = NER_CAPITAL_HUBS.find(h => h.id === e.target.value);
                    if (hub) {
                      setSelectedHub(hub);
                      if (selectedStateFilter !== 'All') {
                        setSelectedStateFilter(hub.state);
                      }
                    }
                  }}
                  className="h-9 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 pl-3 pr-8 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition"
                >
                  {NER_CAPITAL_HUBS.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              </div>

              {onNavigateModule && (
                <button
                  onClick={() => onNavigateModule('weather')}
                  className="h-9 px-3.5 rounded-xl bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 hover:bg-sky-500/30 text-xs font-bold border border-sky-500/30 flex items-center gap-1.5 cursor-pointer shrink-0 transition shadow-sm hover:scale-[1.02] active:scale-95"
                >
                  <span>Open Full Weather Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
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
                  <Calendar className="h-3.5 w-3.5 text-sky-500" /> 7-Day Forecast Telemetry ({selectedStateFilter !== 'All' ? selectedStateFilter : selectedHub.state})
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
