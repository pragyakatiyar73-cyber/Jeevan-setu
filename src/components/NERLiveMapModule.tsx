import React, { useState, useEffect, useRef } from "react";
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
  Sun,
  Moon,
  Volume2
} from "lucide-react";

interface NERLiveMapModuleProps {
  hideHeader?: boolean;
  activeSosLocation?: {
    lat: number;
    lon: number;
    sosId?: string;
    distressType?: string;
    landmark?: string;
    personsTrapped?: string;
    triageLevel?: string;
  } | null;
  onNavigateTo3DSim?: () => void;
  onTriggerSOS?: () => void;
}

export default function NERLiveMapModule({
  hideHeader,
  activeSosLocation,
  onNavigateTo3DSim,
  onTriggerSOS
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

  // Base Style (Default to Tactical Dark Matter matching media_1787755898566.png)
  const [baseStyle, setBaseStyle] = useState<string>("dark");
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(true);

  // Overlay Checkboxes State
  const [overlays, setOverlays] = useState({
    roads: true,
    traffic: true,
    weather: true,
    disruptions: true,
    convoys: true,
    depots: true
  });

  // Initialize Map Instance & Build Interconnected Tactical Network
  useEffect(() => {
    if (!mapRef.current) return;

    const centerLat = activeSosLocation ? activeSosLocation.lat : 25.8000;
    const centerLon = activeSosLocation ? activeSosLocation.lon : 92.5000;
    const initialZoom = activeSosLocation ? 12 : 7;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([centerLat, centerLon], initialZoom);

    mapInstanceRef.current = map;

    const getTileUrl = (style: string) => {
      if (style === "esri") return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      if (style === "osm") return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      if (style === "topo") return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      return "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    };

    const baseTile = L.tileLayer(getTileUrl(baseStyle), { attribution: "Jeevan Setu Tactical GIS" }).addTo(map);
    currentTileLayerRef.current = baseTile;

    // Create & Add Layer Groups to Map
    roadsGroupRef.current = L.layerGroup().addTo(map);
    trafficGroupRef.current = L.layerGroup().addTo(map);
    weatherGroupRef.current = L.layerGroup().addTo(map);
    disruptionsGroupRef.current = L.layerGroup().addTo(map);
    convoysGroupRef.current = L.layerGroup().addTo(map);
    depotsGroupRef.current = L.layerGroup().addTo(map);

    // 1. ROADS & HIGHWAYS LAYER (🛣️) - Interconnected Pink, Green & Orange Tactical Lines
    // Pink Route: Guwahati -> Tezpur -> Bomdila -> Tawang (Arunachal Sector)
    const pinkWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [26.8000, 92.5000], // Tezpur
      [27.2600, 92.4200], // Bomdila
      [27.5861, 91.8594]  // Tawang Sela Pass
    ];
    L.polyline(pinkWaypoints, { color: "#ec4899", weight: 5, opacity: 0.9 }).addTo(roadsGroupRef.current);

    // Green Route: Guwahati -> Nagaon -> Jorhat -> Dibrugarh (Upper Assam & Nagaland Sector)
    const greenWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [26.3456, 92.6841], // Nagaon
      [26.7509, 94.2037], // Jorhat
      [27.4728, 94.9120]  // Dibrugarh
    ];
    L.polyline(greenWaypoints, { color: "#10b981", weight: 5, opacity: 0.9 }).addTo(roadsGroupRef.current);

    // Orange Route: Guwahati -> Shillong -> Silchar -> Imphal -> Aizawl (Southern Corridor)
    const orangeWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [25.5788, 91.8933], // Shillong
      [24.8333, 92.7789], // Silchar
      [24.8170, 93.9368], // Imphal
      [23.7271, 92.7176]  // Aizawl
    ];
    L.polyline(orangeWaypoints, { color: "#f97316", weight: 5, opacity: 0.9 }).addTo(roadsGroupRef.current);

    // 2. TRAFFIC & STATUS LAYER (🚦)
    const bypassBadgeIcon = L.divIcon({
      className: "custom-bypass-badge",
      html: `<div style="background:#059669;color:#fff;padding:3px 8px;border-radius:8px;font-weight:800;font-size:10px;border:1px solid #34d399;white-space:nowrap;">⚡ Sector 9 AI Bypass</div>`,
      iconSize: [140, 24],
      iconAnchor: [70, 12]
    });
    L.marker([25.495, 91.508], { icon: bypassBadgeIcon }).addTo(trafficGroupRef.current);

    // 3. WEATHER RADAR OVERLAY LAYER (🌧️)
    L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
      opacity: 0.45,
      attribution: "NEXRAD Radar"
    }).addTo(weatherGroupRef.current);

    // 4. DISRUPTIONS / LANDSLIDES LAYER (⚠️) - Distinct Circle Badges matching media_1787755898566.png
    // Landslide 1 Badge (Pink Ring Warning)
    const warningBadgeIcon1 = L.divIcon({
      className: "custom-badge-warning1",
      html: `
        <div style="width:28px;height:28px;background:#be185d;border:2px solid #f472b6;border-radius:50%;box-shadow:0 0 12px #ec4899;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;">
          ⚠️
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([27.5861, 91.8594], { icon: warningBadgeIcon1 }).addTo(disruptionsGroupRef.current)
      .bindPopup("<b>⚠️ NH-13 Sela Pass Blockade</b><br/>Sub-Zero Snow Slurry & Rockfall");

    // Landslide 2 Badge (Orange Ring Warning)
    const warningBadgeIcon2 = L.divIcon({
      className: "custom-badge-warning2",
      html: `
        <div style="width:28px;height:28px;background:#c2410c;border:2px solid #fb923c;border-radius:50%;box-shadow:0 0 12px #f97316;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;font-weight:900;">
          ⚠️
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([24.8170, 93.9368], { icon: warningBadgeIcon2 }).addTo(disruptionsGroupRef.current)
      .bindPopup("<b>⚠️ Imphal Valley Caution Zone</b><br/>Heavy Rainfall Runoff");

    // 5. ESSENTIAL SUPPLY CONVOYS LAYER (🚚) - Moving Truck Badges matching media_1787755898566.png
    const truckIcon1 = L.divIcon({
      className: "custom-truck1",
      html: `
        <div style="width:28px;height:28px;background:#0284c7;border:2px solid #38bdf8;border-radius:50%;box-shadow:0 0 12px #0284c7;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">
          🚚
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const convoyMarker1 = L.marker(orangeWaypoints[0], { icon: truckIcon1 }).addTo(convoysGroupRef.current);

    const truckIcon2 = L.divIcon({
      className: "custom-truck2",
      html: `
        <div style="width:28px;height:28px;background:#059669;border:2px solid #34d399;border-radius:50%;box-shadow:0 0 12px #10b981;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">
          🚚
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    const convoyMarker2 = L.marker(greenWaypoints[0], { icon: truckIcon2 }).addTo(convoysGroupRef.current);

    // Continuous Live Movement for both Convoys
    let step1 = 0; let subStep1 = 0;
    let step2 = 0; let subStep2 = 0;
    const interval = setInterval(() => {
      // Convoy 1 on Orange Route
      const p1 = orangeWaypoints[step1];
      const p2 = orangeWaypoints[(step1 + 1) % orangeWaypoints.length];
      const t1 = subStep1 / 30;
      convoyMarker1.setLatLng([p1[0] + (p2[0] - p1[0]) * t1, p1[1] + (p2[1] - p1[1]) * t1]);
      subStep1++;
      if (subStep1 >= 30) { subStep1 = 0; step1 = (step1 + 1) % (orangeWaypoints.length - 1); }

      // Convoy 2 on Green Route
      const g1 = greenWaypoints[step2];
      const g2 = greenWaypoints[(step2 + 1) % greenWaypoints.length];
      const t2 = subStep2 / 30;
      convoyMarker2.setLatLng([g1[0] + (g2[0] - g1[0]) * t2, g1[1] + (g2[1] - g1[1]) * t2]);
      subStep2++;
      if (subStep2 >= 30) { subStep2 = 0; step2 = (step2 + 1) % (greenWaypoints.length - 1); }
    }, 200);

    // 6. BRIDGES & SUPPLY DEPOTS LAYER (🌉) - Circular Depot Icons matching media_1787755898566.png
    const depotIcon1 = L.divIcon({
      className: "custom-depot1",
      html: `<div style="width:28px;height:28px;background:#4f46e5;border:2px solid #818cf8;border-radius:50%;box-shadow:0 0 12px #6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">🌉</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([27.4728, 94.9120], { icon: depotIcon1 }).addTo(depotsGroupRef.current)
      .bindPopup("<b>🌉 Dibrugarh Brahmaputra Depot</b><br/>Capacity: 95%");

    const medIcon = L.divIcon({
      className: "custom-med1",
      html: `<div style="width:28px;height:28px;background:#db2777;border:2px solid #f472b6;border-radius:50%;box-shadow:0 0 12px #ec4899;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;">💊</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
    L.marker([24.8333, 92.7789], { icon: medIcon }).addTo(depotsGroupRef.current)
      .bindPopup("<b>💊 Silchar Civil Hospital Depot</b><br/>Oxygen Buffer: 22% (Replenishment En Route)");

    // 🚨 EMERGENCY SOS GLOWING BEACON MARKER (Matching media_1787755898566.png)
    const sosLat = activeSosLocation ? activeSosLocation.lat : 25.5788;
    const sosLon = activeSosLocation ? activeSosLocation.lon : 91.8933;

    const sosBeaconIcon = L.divIcon({
      className: "custom-sos-beacon-marker",
      html: `
        <div style="
          width: 32px;
          height: 32px;
          background: #ef4444;
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 20px #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 1.2s infinite;
        ">
          <span style="font-size:16px;">🚨</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const sosMarker = L.marker([sosLat, sosLon], { icon: sosBeaconIcon }).addTo(map);
    sosMarker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; padding: 4px;">
        <b style="color: #dc2626; font-weight:900;">🚨 EMERGENCY SOS BROADCAST &bull; ${activeSosLocation?.sosId || 'SOS-2026-7154'}</b><br/>
        <b>${activeSosLocation?.landmark || 'NH-6 Km 142 (East Khasi Hills, Meghalaya)'}</b><br/>
        <span>GPS: <b>${sosLat.toFixed(4)}° N, ${sosLon.toFixed(4)}° E</b></span><br/>
        <div style="margin-top:6px; background:#dcfce7; color:#15803d; padding:4px 8px; border-radius:6px; font-weight:800;">
          ✓ Nearest 4x4 Convoy #01 Dispatched (ETA: 14 mins)
        </div>
      </div>
    `).openPopup();

    return () => {
      clearInterval(interval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeSosLocation]);

  // Dynamically update base tile URL on style switch without map teardown
  useEffect(() => {
    if (!currentTileLayerRef.current) return;
    let url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    if (baseStyle === "esri") url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    else if (baseStyle === "osm") url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    else if (baseStyle === "topo") url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";

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
    <div className="h-full w-full relative flex flex-col select-none bg-[#040814] text-slate-100 font-sans overflow-hidden">
      
      {/* 🟢 TOP HEADER BAR MATCHING SCREENSHOT */}
      <div className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040814] px-4 lg:px-6 flex items-center justify-between gap-4 z-20 backdrop-blur transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
              Live Region Map &bull; Live Satellite & Radar
            </span>
            <span className="hidden sm:inline text-xs italic text-slate-500 dark:text-slate-400">"Smart decisions today, safer tomorrow."</span>
          </div>
          <h1 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            North Eastern Region Accessibility & Logistics Overview
          </h1>
        </div>

        {/* TOP RIGHT MODE & LAYER PILLS */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateTo3DSim}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow"
          >
            <span>🎮</span> 3D SIMULATION
          </button>

          <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer border border-indigo-400/40">
            <span>🗺️</span> 2D Map
          </button>

          <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setBaseStyle("topo")}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                baseStyle === "topo" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              ⛰️ Terrain
            </button>

            <button
              onClick={() => setBaseStyle("dark")}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                baseStyle === "dark" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🌙 Dark
            </button>

            <button
              onClick={() => setBaseStyle("osm")}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                baseStyle === "osm" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🗺️ OSM
            </button>

            <button
              onClick={() => setBaseStyle("esri")}
              className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                baseStyle === "esri" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              🛰️ Esri
            </button>
          </div>
        </div>
      </div>

      {/* MAP CANVAS & OVERLAY CONTAINERS */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        
        {/* LEAFLET MAP CANVAS */}
        <div ref={mapRef} className="w-full h-full z-0" />
        {hideHeader && (
          <div className="absolute top-4 right-4 z-[1000] flex items-center gap-1.5 text-xs bg-white/90 dark:bg-slate-950/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur shadow-xl">
            <button onClick={() => setBaseStyle("topo")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${baseStyle === "topo" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>⛰️ Terrain</button>
            <button onClick={() => setBaseStyle("dark")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${baseStyle === "dark" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🌙 Dark</button>
            <button onClick={() => setBaseStyle("osm")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${baseStyle === "osm" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🗺️ OSM</button>
            <button onClick={() => setBaseStyle("esri")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${baseStyle === "esri" ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🛰️ Esri</button>
          </div>
        )}

        {/* LEFT FLOATING LAYERS & OVERLAYS INTERACTIVE PANEL MATCHING SCREENSHOT media_1787755898566.png */}
        {isLayersPanelOpen ? (
          <div className="absolute left-4 top-4 z-[1000] w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#070d1e]/95 p-4 shadow-2xl backdrop-blur text-xs space-y-3 transition-colors duration-300">
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
                <option value="dark" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🌙 Dark Matter (Tactical)</option>
                <option value="esri" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🛰️ Esri Sovereign Satellite</option>
                <option value="osm" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🗺️ OpenStreetMap (Standard)</option>
                <option value="topo" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">⛰️ OpenTopoMap (Relief)</option>
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
          <button
            onClick={() => setIsLayersPanelOpen(true)}
            className="absolute left-4 top-4 z-[1000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#070d1e]/90 p-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-2xl backdrop-blur flex items-center gap-2 cursor-pointer"
          >
            <Layers className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            <span>Layers Panel</span>
          </button>
        )}

        {/* RIGHT FLOATING ZOOM CONTROLS */}
        <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
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
              onClick={() => setBaseStyle(baseStyle === "dark" ? "esri" : "dark")}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Toggle Map Style"
            >
              🌙
            </button>
            <button
              onClick={() => mapInstanceRef.current?.setView([25.8000, 92.5000], 7)}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Center on NER Region"
            >
              🎯
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
