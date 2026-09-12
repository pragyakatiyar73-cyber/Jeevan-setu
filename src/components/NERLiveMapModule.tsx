import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../i18n";
import SmartSearchInput from "./common/SmartSearchInput";
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
  Sun,
  Moon,
  Volume2,
  Search,
  Sparkles
} from "lucide-react";
import { getSpellingSuggestions, getDidYouMeanSuggestion } from "../utils/locationSpellCheck";

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

  // Layer Groups Refs for Dynamic Checkbox Toggling
  const roadsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const trafficGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const weatherGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const disruptionsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const convoysGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const depotsGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Base Style (Default to Vivid Sovereign Satellite with natural terrain relief)
  const [baseStyle, setBaseStyle] = useState<string>("esri");
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(false);
  const [showSosBroadcast, setShowSosBroadcast] = useState<boolean>(true);
  const [mapSearchQuery, setMapSearchQuery] = useState<string>("");

  // Overlay Checkboxes State
  const [overlays, setOverlays] = useState({
    roads: true,
    traffic: true,
    weather: true,
    disruptions: true,
    convoys: true,
    depots: true
  });

  // Handle external focus target changes from Dashboard
  useEffect(() => {
    if (focusedTarget && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(focusedTarget.coord, focusedTarget.zoom, { duration: 1.2 });
    }
  }, [focusedTarget]);

  // Initialize Map Instance & Build Interconnected Tactical Network
  useEffect(() => {
    if (!mapRef.current) return;

    const centerLat = focusedTarget ? focusedTarget.coord[0] : (activeSosLocation ? activeSosLocation.lat : 26.2000);
    const centerLon = focusedTarget ? focusedTarget.coord[1] : (activeSosLocation ? activeSosLocation.lon : 88.5000);
    const initialZoom = focusedTarget ? focusedTarget.zoom : (activeSosLocation ? 12 : 7);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 5,
      maxZoom: 18
    }).setView([centerLat, centerLon], initialZoom);

    mapInstanceRef.current = map;

    const getTileUrl = (style: string) => {
      if (style === "topo") return "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
      if (style === "osm" || style === "voyager") return "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
      return "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    };

    const baseTile = L.tileLayer(getTileUrl(baseStyle), {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© Google Maps &bull; Jeevan Setu Live GIS"
    }).addTo(map);
    currentTileLayerRef.current = baseTile;

    // Create & Add Layer Groups to Map
    roadsGroupRef.current = L.layerGroup().addTo(map);
    trafficGroupRef.current = L.layerGroup().addTo(map);
    weatherGroupRef.current = L.layerGroup().addTo(map);
    disruptionsGroupRef.current = L.layerGroup().addTo(map);
    convoysGroupRef.current = L.layerGroup().addTo(map);
    depotsGroupRef.current = L.layerGroup().addTo(map);

    // 3. WEATHER RADAR OVERLAY LAYER (🌧️)
    L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
      opacity: 0.45,
      attribution: "NEXRAD Radar"
    }).addTo(weatherGroupRef.current);

    // 🚨 EMERGENCY SOS GLOWING BEACON MARKER
    const sosLat = activeSosLocation ? activeSosLocation.lat : 25.5788;
    const sosLon = activeSosLocation ? activeSosLocation.lon : 91.8933;

    const sosBeaconIcon = L.divIcon({
      className: "custom-sos-beacon-marker",
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: radial-gradient(circle, #ef4444, #991b1b);
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 24px #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1s infinite;
        ">
          <span style="font-size:18px;">🚨</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const sosMarker = L.marker([sosLat, sosLon], { icon: sosBeaconIcon }).addTo(map);
    sosMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 250px; padding: 2px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="background: linear-gradient(135deg, #dc2626, #991b1b); color: #ffffff; padding: 3px 8px; border-radius: 6px; font-weight: 900; font-size: 10px; letter-spacing: 0.5px;">
            🚨 EMERGENCY SOS BROADCAST
          </span>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">
          ${activeSosLocation?.landmark || 'NH-6 Km 142 (East Khasi Hills, Meghalaya)'}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-family: monospace;">
          GPS: <b>${sosLat.toFixed(4)}° N, ${sosLon.toFixed(4)}° E</b> &bull; ID: <b>${activeSosLocation?.sosId || 'SOS-2026-7154'}</b>
        </div>
        <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 6px 10px; display: flex; align-items: center; justify-content: space-between;">
          <span style="color: #047857; font-weight: 800; font-size: 11px;">
            ✓ Nearest 4x4 Convoy #01 Dispatched
          </span>
          <span style="color: #065f46; font-weight: 900; font-size: 11px; font-family: monospace;">
            ETA: 14m
          </span>
        </div>
      </div>
    `);
    if (activeSosLocation) {
      sosMarker.openPopup();
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSosLocation]);

  // Dynamically update base tile URL on style switch without map teardown
  useEffect(() => {
    if (!currentTileLayerRef.current) return;
    let url = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";
    if (baseStyle === "topo") url = "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}";
    else if (baseStyle === "osm" || baseStyle === "voyager") url = "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    else url = "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}";

    currentTileLayerRef.current.setUrl(url);
  }, [baseStyle]);

  // Synchronize Checkbox Toggles with Leaflet Layer Groups Dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (overlays.roads) { map.addLayer(roadsGroupRef.current); } else { map.removeLayer(roadsGroupRef.current); }
    if (overlays.traffic) { map.addLayer(trafficGroupRef.current); } else { map.removeLayer(trafficGroupRef.current); }
    if (overlays.weather) { map.addLayer(weatherGroupRef.current); } else { map.removeLayer(weatherGroupRef.current); }
    if (overlays.disruptions) { map.addLayer(disruptionsGroupRef.current); } else { map.removeLayer(disruptionsGroupRef.current); }
    if (overlays.convoys) { map.addLayer(convoysGroupRef.current); } else { map.removeLayer(convoysGroupRef.current); }
    if (overlays.depots) { map.addLayer(depotsGroupRef.current); } else { map.removeLayer(depotsGroupRef.current); }
  }, [overlays]);

  const toggleOverlay = (key: keyof typeof overlays) => {
    setOverlays((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-full w-full relative flex flex-col select-none bg-[#040814] text-slate-100 font-sans overflow-hidden min-w-0">
      
      {/* 🟢 TOP HEADER BAR MATCHING SCREENSHOT (Hidden when embedded in Dashboard) */}
      {!hideHeader && (
        <div className="min-h-[64px] py-2.5 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040814] px-4 lg:px-6 flex flex-wrap items-center justify-between gap-3 z-20 backdrop-blur transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                {t("dashboard.liveRegionMap", "Live Region Map • Live Satellite & Radar")}
              </span>
              <span className="hidden sm:inline text-xs italic text-slate-500 dark:text-slate-400">{t("dashboard.smartDecisions", "\"Smart decisions today, safer tomorrow.\"")}</span>
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 leading-snug">
              {t("dashboard.overviewTitle", "North Eastern Region Accessibility & Logistics Overview")}
            </h1>
          </div>

          {/* TOP RIGHT MODE & LAYER PILLS */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer border border-indigo-400/40 shrink-0">
              <span>🗺️</span> <span>{t("dashboard.gisMap", "GIS Tactical Map")}</span>
            </button>

            {/* Map Style & Overview Switcher */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs shrink-0">
              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([26.20, 89.50], 6.5, { duration: 1.2 });
                  }
                }}
                className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer shrink-0"
                title="All North & North East Overview"
              >
                <span>🇮🇳</span> <span>All Zones</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs shrink-0">
              <button
                onClick={() => setBaseStyle("esri")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "esri" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🛰️ Satellite
              </button>

              <button
                onClick={() => setBaseStyle("topo")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "topo" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                ⛰️ Topo
              </button>

              <button
                onClick={() => setBaseStyle("osm")}
                className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "osm" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                🗺️ Roads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAP CANVAS & OVERLAY CONTAINERS */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        
        {/* LEAFLET MAP CANVAS */}
        <div ref={mapRef} className="w-full h-full z-0" />
        
        {/* FULL-SCREEN MODE FLOATING CONTROL HEADER BAR */}
        {hideHeader && (
          <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2.5 bg-slate-900/90 dark:bg-[#040814]/90 p-2.5 rounded-2xl border border-slate-700/80 backdrop-blur shadow-2xl">
            <div className="flex items-center gap-2.5">
              {onBackToDashboard && (
                <button
                  onClick={onBackToDashboard}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer border border-sky-300/30 transition transform hover:scale-105"
                  title="Return to Main Dashboard"
                >
                  <span className="text-sm">←</span>
                  <span>{t("navigation.home", "Back to Dashboard")}</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-black text-xs text-white tracking-tight hidden sm:inline">
                  NER Live GIS Map • 100% Full View
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsLayersPanelOpen(!isLayersPanelOpen)}
                className={`rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  isLayersPanelOpen ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Layers className="h-4 w-4 text-sky-400" />
                <span>Layers Panel</span>
              </button>

              <button
                onClick={() => {
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([26.20, 89.50], 6.5, { duration: 1.2 });
                  }
                }}
                className="rounded-xl bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs font-extrabold text-slate-200 hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer shrink-0"
                title="Overview All Zones"
              >
                <span>🇮🇳</span> <span className="hidden sm:inline">All Zones</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs shrink-0">
                <button
                  onClick={() => setBaseStyle("esri")}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition text-xs shrink-0 ${
                    baseStyle === "esri" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                  }`}
                >
                  🛰️ Satellite
                </button>
                <button
                  onClick={() => setBaseStyle("topo")}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition text-xs shrink-0 ${
                    baseStyle === "topo" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                  }`}
                >
                  ⛰️ Topo
                </button>
                <button
                  onClick={() => setBaseStyle("osm")}
                  className={`px-2.5 py-1 rounded-lg font-extrabold transition text-xs shrink-0 ${
                    baseStyle === "osm" ? "bg-indigo-600 text-white shadow" : "text-slate-300 hover:text-white"
                  }`}
                >
                  🗺️ Google Roads
                </button>
              </div>

              {onTriggerSOS && (
                <button
                  onClick={onTriggerSOS}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3 py-1.5 text-xs font-black text-white shadow-md shadow-rose-600/30 flex items-center gap-1 cursor-pointer border border-rose-400/30 animate-pulse shrink-0"
                >
                  <span>🚨</span>
                  <span className="hidden sm:inline">SOS</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* LEFT FLOATING LAYERS & OVERLAYS INTERACTIVE PANEL */}
        {isLayersPanelOpen ? (
          <div className={`absolute left-4 z-[1000] w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#070d1e]/95 p-4 shadow-2xl backdrop-blur text-xs space-y-3 transition-colors duration-300 ${hideHeader ? 'top-16' : 'top-4'}`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2 font-black uppercase text-slate-900 dark:text-white tracking-wider">
                <span>{t("map.layersPanel", "LAYERS & OVERLAYS")}</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/30 text-[9px]">{t("map.interactive", "Interactive")}</span>
              </div>
              <button
                onClick={() => setIsLayersPanelOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Location Search Bar with Auto-Suggest & Spelling Correction */}
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                📍 Location Search & Auto-Suggest:
              </label>
              <SmartSearchInput
                placeholder="Search sector, district, highway..."
                value={mapSearchQuery}
                onChange={setMapSearchQuery}
                onSearch={q => setMapSearchQuery(q)}
                searchType="location"
              />

              {/* Did You Mean Suggestion Banner */}
              {mapSearchQuery.trim().length >= 2 && (() => {
                const dyM = getDidYouMeanSuggestion(mapSearchQuery);
                if (!dyM) return null;
                return (
                  <div className="mt-1 flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-300">
                    <Sparkles className="h-3 w-3 text-amber-500 shrink-0" />
                    <span>Did you mean:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([dyM.lat, dyM.lon], 12, { duration: 1.5 });
                        }
                        setMapSearchQuery("");
                      }}
                      className="font-bold underline hover:text-amber-800 dark:hover:text-amber-200 transition"
                    >
                      {dyM.name} ({dyM.state})
                    </button>
                  </div>
                );
              })()}

              {/* Auto-Suggest Dropdown */}
              {mapSearchQuery.trim().length >= 2 && getSpellingSuggestions(mapSearchQuery).length > 0 && (
                <div className="absolute left-0 right-0 top-14 z-[2500] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-2xl max-h-44 overflow-y-auto">
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase px-1.5 py-0.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Suggestions / Auto-Correct</span>
                  </div>
                  {getSpellingSuggestions(mapSearchQuery).map((item, idx) => (
                    <div
                      key={`map_sug_${idx}`}
                      onClick={() => {
                        if (mapInstanceRef.current) {
                          mapInstanceRef.current.flyTo([item.lat, item.lon], 12, { duration: 1.5 });
                        }
                        setMapSearchQuery("");
                      }}
                      className="cursor-pointer rounded-lg p-1.5 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40 transition flex items-center justify-between"
                    >
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-sky-500" />
                        <span>{item.name} ({item.state})</span>
                      </div>
                      <span className="text-[8px] font-semibold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 px-1 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Base Map Style Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
                {t("map.baseStyle", "Base Map Style:")}
              </label>
              <select
                value={baseStyle}
                onChange={(e) => setBaseStyle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="esri" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🛰️ Sovereign Satellite (Esri High-Res)</option>
                <option value="topo" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">⛰️ OpenTopoMap (Elevation Relief)</option>
                <option value="osm" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🗺️ Carto Voyager (High-Contrast Roads)</option>
              </select>
            </div>

            {/* 100% Functional Checkboxes */}
            <div className="space-y-2.5 pt-1 font-semibold">
              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.roads", "🛣️ Roads & Highways")}</span>
                <input
                  type="checkbox"
                  checked={overlays.roads}
                  onChange={() => toggleOverlay("roads")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.traffic", "🚦 Traffic & Status")}</span>
                <input
                  type="checkbox"
                  checked={overlays.traffic}
                  onChange={() => toggleOverlay("traffic")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.weather", "🌧️ Weather Radar")}</span>
                <input
                  type="checkbox"
                  checked={overlays.weather}
                  onChange={() => toggleOverlay("weather")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.disruptions", "⚠️ Disruptions / Landslides")}</span>
                <input
                  type="checkbox"
                  checked={overlays.disruptions}
                  onChange={() => toggleOverlay("disruptions")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.convoys", "🚚 Essential Supply Convoys")}</span>
                <input
                  type="checkbox"
                  checked={overlays.convoys}
                  onChange={() => toggleOverlay("convoys")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-slate-800 dark:text-slate-200 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition">
                <span className="flex items-center gap-2">{t("map.depots", "🌉 Bridges & Supply Depots")}</span>
                <input
                  type="checkbox"
                  checked={overlays.depots}
                  onChange={() => toggleOverlay("depots")}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sky-500 focus:ring-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        ) : (
          !hideHeader && (
            <button
              onClick={() => setIsLayersPanelOpen(true)}
              className="absolute left-4 top-4 z-[1000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070d1e]/90 p-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur flex items-center gap-2 cursor-pointer"
            >
              <Layers className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <span>Layers Panel</span>
            </button>
          )
        )}

        {/* RIGHT FLOATING ZOOM CONTROLS */}
        <div className={`absolute right-4 z-[1000] flex flex-col gap-2 ${hideHeader ? 'top-16' : 'top-4'}`}>
          <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070d1e]/90 p-1.5 shadow-2xl backdrop-blur space-y-1">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-black text-sm flex items-center justify-center cursor-pointer"
              title="Zoom Out"
            >
              -
            </button>
          </div>

          <div className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070d1e]/90 p-1.5 shadow-2xl backdrop-blur space-y-1">
            <button
              onClick={() => setBaseStyle(baseStyle === "esri" ? "topo" : "esri")}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Toggle Satellite / Topo View"
            >
              {baseStyle === "esri" ? "⛰️" : "🛰️"}
            </button>
            <button
              onClick={() => mapInstanceRef.current?.flyTo([30.3880, 78.0500], 11, { duration: 1.5 })}
              className="h-8 w-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer text-xs font-bold shadow-lg shadow-purple-500/30"
              title="Focus Dehradun to Mussoorie Corridor"
            >
              🏔️
            </button>
            <button
              onClick={() => mapInstanceRef.current?.flyTo([26.9157, 70.9083], 8, { duration: 1.5 })}
              className="h-8 w-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center cursor-pointer text-xs font-bold shadow-lg shadow-amber-500/30"
              title="Focus Rajasthan Thar Desert Sector"
            >
              🏜️
            </button>
            <button
              onClick={() => mapInstanceRef.current?.flyTo([34.1526, 77.5771], 8, { duration: 1.5 })}
              className="h-8 w-8 rounded-lg bg-sky-600 hover:bg-sky-500 text-white flex items-center justify-center cursor-pointer text-xs font-bold shadow-lg shadow-sky-500/30"
              title="Focus J&K & Ladakh High Altitude Pass"
            >
              ❄️
            </button>
            <button
              onClick={() => mapInstanceRef.current?.flyTo([28.6139, 77.2090], 11, { duration: 1.5 })}
              className="h-8 w-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center cursor-pointer text-xs font-bold shadow-lg shadow-emerald-500/30"
              title="Focus Delhi (NCT) & Chandigarh Urban Grid"
            >
              🏙️
            </button>
            <button
              onClick={() => mapInstanceRef.current?.setView([27.5000, 81.5000], 6)}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Center All-India National Map Overview"
            >
              🎯
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
