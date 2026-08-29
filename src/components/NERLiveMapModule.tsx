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
}

export default function NERLiveMapModule({
  hideHeader,
  activeSosLocation,
  focusedTarget,
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

  // Base Style (Default to Vivid Sovereign Satellite with natural terrain relief)
  const [baseStyle, setBaseStyle] = useState<string>("esri");
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(true);
  const [showSosBroadcast, setShowSosBroadcast] = useState<boolean>(true);

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
      if (style === "topo") return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
      if (style === "osm" || style === "voyager") return "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    };

    const baseTile = L.tileLayer(getTileUrl(baseStyle), {
      maxZoom: 18,
      attribution: "Esri Sovereign Satellite &bull; Jeevan Setu Tactical GIS"
    }).addTo(map);
    currentTileLayerRef.current = baseTile;

    // Create & Add Layer Groups to Map
    roadsGroupRef.current = L.layerGroup().addTo(map);
    trafficGroupRef.current = L.layerGroup().addTo(map);
    weatherGroupRef.current = L.layerGroup().addTo(map);
    disruptionsGroupRef.current = L.layerGroup().addTo(map);
    convoysGroupRef.current = L.layerGroup().addTo(map);
    depotsGroupRef.current = L.layerGroup().addTo(map);

    // 1. ROADS & HIGHWAYS LAYER (🛣️) - Multi-Layer Neon Tactical Glow Corridors
    // Pink Route: Guwahati -> Tezpur -> Bomdila -> Tawang (Arunachal Mountain Sector)
    const pinkWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [26.8000, 92.5000], // Tezpur
      [27.2600, 92.4200], // Bomdila
      [27.5861, 91.8594]  // Tawang Sela Pass
    ];
    L.polyline(pinkWaypoints, { color: "#ec4899", weight: 11, opacity: 0.35 }).addTo(roadsGroupRef.current);
    L.polyline(pinkWaypoints, { color: "#f472b6", weight: 4.5, opacity: 0.95 }).addTo(roadsGroupRef.current);
    L.polyline(pinkWaypoints, { color: "#ffffff", weight: 1.5, opacity: 0.75, dashArray: "6, 14" }).addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#db2777;'>🏔️ NH-13 Arunachal Alpine Corridor</b><br/>Guwahati ➔ Tezpur ➔ Bomdila ➔ Tawang (3,500m MSL)<br/><span style='color:#059669;font-weight:800;'>✓ BRO Project Vartak Active</span></div>");

    // Green Route: Guwahati -> Nagaon -> Jorhat -> Dibrugarh (Upper Assam & Brahmaputra Artery)
    const greenWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [26.3456, 92.6841], // Nagaon
      [26.7509, 94.2037], // Jorhat
      [27.4728, 94.9120]  // Dibrugarh
    ];
    L.polyline(greenWaypoints, { color: "#10b981", weight: 11, opacity: 0.35 }).addTo(roadsGroupRef.current);
    L.polyline(greenWaypoints, { color: "#34d399", weight: 4.5, opacity: 0.95 }).addTo(roadsGroupRef.current);
    L.polyline(greenWaypoints, { color: "#ffffff", weight: 1.5, opacity: 0.75, dashArray: "6, 14" }).addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#059669;'>🌿 NH-37/NH-715 Brahmaputra Lifeline</b><br/>Guwahati ➔ Nagaon ➔ Jorhat ➔ Dibrugarh<br/><span style='color:#0284c7;font-weight:800;'>✓ Clear High-Speed Logistics Route</span></div>");

    // Orange Route: Guwahati -> Shillong -> Silchar -> Imphal -> Aizawl (Southern Mountain Corridor)
    const orangeWaypoints: [number, number][] = [
      [26.1445, 91.7362], // Guwahati
      [25.5788, 91.8933], // Shillong
      [24.8333, 92.7789], // Silchar
      [24.8170, 93.9368], // Imphal
      [23.7271, 92.7176]  // Aizawl
    ];
    L.polyline(orangeWaypoints, { color: "#f97316", weight: 11, opacity: 0.35 }).addTo(roadsGroupRef.current);
    L.polyline(orangeWaypoints, { color: "#fb923c", weight: 4.5, opacity: 0.95 }).addTo(roadsGroupRef.current);
    L.polyline(orangeWaypoints, { color: "#ffffff", weight: 1.5, opacity: 0.75, dashArray: "6, 14" }).addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#ea580c;'>🟠 NH-6 Southern Mountain Artery</b><br/>Guwahati ➔ Shillong ➔ Silchar ➔ Aizawl<br/><span style='color:#16a34a;font-weight:800;'>⚡ Sector 9 Jowai Bypass Active</span></div>");

    // 🌊 NEPAL -> BIHAR TRANSBOUNDARY INFLUX RIVERS
    // 1. Gandak River (Nepal -> Valmikinagar -> West/East Champaran -> Gopalganj -> Saran)
    const gandakRiverWaypoints: [number, number][] = [
      [27.70, 83.85],
      [27.43, 83.90],
      [27.18, 84.12],
      [26.78, 84.45],
      [26.15, 84.95],
      [25.68, 85.18]
    ];
    L.polyline(gandakRiverWaypoints, { color: "#0284c7", weight: 10, opacity: 0.3 }).addTo(roadsGroupRef.current);
    L.polyline(gandakRiverWaypoints, { color: "#38bdf8", weight: 4, opacity: 0.95, dashArray: "8, 6" })
      .addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#0284c7;'>🌊 Gandak River Flood Influx Vector</b><br/>Origin: Nepal Himalayas &bull; Status: Critical Surge (4.5L+ Cusecs at Valmikinagar Barrage)</div>");

    // 2. Bagmati River (Nepal -> Sitamarhi -> Sheohar -> Muzaffarpur -> Darbhanga)
    const bagmatiRiverWaypoints: [number, number][] = [
      [27.70, 85.35],
      [27.10, 85.30],
      [26.65, 85.45],
      [26.25, 85.50],
      [25.75, 85.90]
    ];
    L.polyline(bagmatiRiverWaypoints, { color: "#0284c7", weight: 10, opacity: 0.3 }).addTo(roadsGroupRef.current);
    L.polyline(bagmatiRiverWaypoints, { color: "#38bdf8", weight: 4, opacity: 0.95, dashArray: "8, 6" })
      .addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#0284c7;'>🌊 Bagmati River Flow Vector</b><br/>Origin: Kathmandu Basin / Nepal &bull; Status: Rising rapidly above danger mark</div>");

    // 3. Kosi River ("Sorrow of Bihar") (Nepal -> Birpur Barrage -> Supaul -> Saharsa -> Khagaria)
    const kosiRiverWaypoints: [number, number][] = [
      [27.90, 86.80],
      [26.85, 87.05],
      [26.50, 86.95],
      [26.10, 86.75],
      [25.40, 87.20]
    ];
    L.polyline(kosiRiverWaypoints, { color: "#0369a1", weight: 12, opacity: 0.35 }).addTo(roadsGroupRef.current);
    L.polyline(kosiRiverWaypoints, { color: "#0ea5e9", weight: 5, opacity: 0.95, dashArray: "8, 6" })
      .addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#0284c7;'>🌊 Kosi River Surge Vector</b><br/>Birpur Barrage Discharge: 5.2L+ Cusecs &bull; Red Alert across Supaul & Saharsa</div>");

    // 4. Mahananda River (Nepal -> Araria -> Kishanganj -> Purnia -> Katihar)
    const mahanandaRiverWaypoints: [number, number][] = [
      [27.10, 88.25],
      [26.45, 88.10],
      [26.15, 87.85],
      [25.60, 87.70]
    ];
    L.polyline(mahanandaRiverWaypoints, { color: "#0284c7", weight: 10, opacity: 0.3 }).addTo(roadsGroupRef.current);
    L.polyline(mahanandaRiverWaypoints, { color: "#38bdf8", weight: 4, opacity: 0.95, dashArray: "8, 6" })
      .addTo(roadsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#0284c7;'>🌊 Mahananda River Flow Vector</b><br/>Kishanganj & Purnia riverbank warning</div>");

    // 2. TRAFFIC & STATUS LAYER (🚦)
    const bypassBadgeIcon = L.divIcon({
      className: "custom-bypass-badge",
      html: `<div style="background:linear-gradient(135deg, #059669, #10b981);color:#fff;padding:4px 10px;border-radius:10px;font-weight:900;font-size:11px;border:1.5px solid #6ee7b7;box-shadow:0 0 16px rgba(16,185,129,0.8);white-space:nowrap;display:flex;align-items:center;gap:4px;"><span>⚡</span> <span>Sector 9 AI Bypass</span></div>`,
      iconSize: [150, 26],
      iconAnchor: [75, 13]
    });
    L.marker([25.495, 91.508], { icon: bypassBadgeIcon }).addTo(trafficGroupRef.current);

    // 3. WEATHER RADAR OVERLAY LAYER (🌧️)
    L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
      opacity: 0.45,
      attribution: "NEXRAD Radar"
    }).addTo(weatherGroupRef.current);

    // 4. DISRUPTIONS / LANDSLIDES / BIHAR FLOOD HAZARD LAYER (⚠️)
    // 🚨 BIHAR-NEPAL RED ALERT FLOOD POLYGON (Northern Border Strip)
    const biharFloodBorderPolygon: [number, number][] = [
      [27.45, 83.85],
      [27.05, 84.50],
      [26.85, 85.30],
      [26.70, 86.20],
      [26.55, 87.10],
      [26.45, 88.10],
      [26.05, 88.05],
      [26.15, 87.35],
      [26.10, 86.40],
      [26.18, 85.40],
      [26.40, 84.60],
      [27.00, 83.90]
    ];
    L.polygon(biharFloodBorderPolygon, {
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 0.35,
      weight: 2.5,
      dashArray: "6, 4"
    }).addTo(disruptionsGroupRef.current)
      .bindPopup("<b>🚨 BIHAR ON HIGH ALERT</b><br/>Nepal Transboundary Flood Influx into Gandak, Bagmati, Kosi & Mahananda Rivers.<br/><b>7 Red Alert Districts &bull; 11 Orange Alert Districts</b>");

    // NEPAL ORIGIN BADGE
    const nepalOriginIcon = L.divIcon({
      className: "custom-nepal-badge",
      html: `
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(15, 23, 42, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid rgba(244, 63, 94, 0.85);
          border-radius: 9999px;
          padding: 5px 14px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7), 0 0 20px rgba(225, 29, 72, 0.5);
          white-space: nowrap;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        ">
          <span style="font-size: 13px;">🇳🇵</span>
          <span>Nepal Glacial & Flood Influx Origin</span>
          <span style="
            background: rgba(225, 29, 72, 0.3);
            border: 1px solid rgba(244, 63, 94, 0.6);
            color: #fecdd3;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 6px;
          ">3,800m MSL</span>
        </div>
      `,
      iconSize: [280, 28],
      iconAnchor: [140, 14]
    });
    L.marker([27.70, 85.30], { icon: nepalOriginIcon }).addTo(disruptionsGroupRef.current)
      .bindPopup("<div style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#be123c;'>🇳🇵 Nepal Transboundary Surge Origin</b><br/>Extreme precipitation & glacial runoff feeding downstream into Gandak, Bagmati, Kosi & Mahananda rivers.</div>");

    // 🔴 7 RED ALERT BIHAR DISTRICT BADGES (Refined Modern Glassmorphic Micro-Badges)
    const redDistricts = [
      { name: "West Champaran", lat: 27.15, lon: 84.45, river: "Gandak River", note: "Valmikinagar Barrage 4.5L+ Cusecs" },
      { name: "East Champaran", lat: 26.65, lon: 84.90, river: "Sikrahna & Gandak", note: "Floodplain Inundation Warning" },
      { name: "Sitamarhi", lat: 26.60, lon: 85.48, river: "Bagmati River", note: "Embankment Surge Watch" },
      { name: "Madhubani", lat: 26.35, lon: 86.07, river: "Kamla Balan River", note: "Overtopping Hazard" },
      { name: "Supaul", lat: 26.25, lon: 86.60, river: "Kosi River (Birpur)", note: "Birpur Barrage 5.2L+ Cusecs" },
      { name: "Araria", lat: 26.15, lon: 87.50, river: "Bakra & Parman", note: "Riverbank Overflow Alert" },
      { name: "Kishanganj", lat: 26.10, lon: 87.95, river: "Mahananda River", note: "Waterlogging & Inundation Watch" }
    ];

    redDistricts.forEach(d => {
      const redIcon = L.divIcon({
        className: "custom-red-district",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: rgba(15, 23, 42, 0.88);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(244, 63, 94, 0.7);
            border-radius: 9999px;
            padding: 2.5px 8px 2.5px 6px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 10px rgba(225, 29, 72, 0.35);
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif;
            font-size: 10px;
            font-weight: 700;
            color: #ffffff;
            letter-spacing: -0.01em;
            cursor: pointer;
          ">
            <span style="
              width: 7px;
              height: 7px;
              background: #ef4444;
              border-radius: 50%;
              box-shadow: 0 0 8px #ef4444;
              display: inline-block;
            "></span>
            <span>${d.name}</span>
          </div>
        `,
        iconSize: [110, 22],
        iconAnchor: [55, 11]
      });
      L.marker([d.lat, d.lon], { icon: redIcon }).addTo(disruptionsGroupRef.current)
        .bindPopup(`<div style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#dc2626;'>🚨 RED ALERT: ${d.name} (Bihar)</b><br/>Primary River: <b>${d.river}</b><br/>Status: <b>${d.note}</b><br/><span style='color:#dc2626;font-weight:800;'>SDRF & NDRF deployed on high alert.</span></div>`);
    });

    // 🟠 ORANGE ALERT DISTRICTS (Bihar)
    const orangeDistricts = [
      { name: "Gopalganj", lat: 26.47, lon: 84.44 },
      { name: "Muzaffarpur", lat: 26.12, lon: 85.39 },
      { name: "Darbhanga", lat: 26.15, lon: 85.90 },
      { name: "Saharsa", lat: 25.88, lon: 86.60 },
      { name: "Purnia", lat: 25.78, lon: 87.47 },
      { name: "Katihar", lat: 25.54, lon: 87.57 },
      { name: "Saran", lat: 25.85, lon: 84.75 }
    ];

    orangeDistricts.forEach(d => {
      const orangeIcon = L.divIcon({
        className: "custom-orange-district",
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(245, 158, 11, 0.6);
            border-radius: 9999px;
            padding: 2px 7px 2px 5px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(245, 158, 11, 0.25);
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif;
            font-size: 9.5px;
            font-weight: 600;
            color: #fef08a;
            letter-spacing: -0.01em;
            cursor: pointer;
          ">
            <span style="
              width: 6px;
              height: 6px;
              background: #f59e0b;
              border-radius: 50%;
              box-shadow: 0 0 6px #f59e0b;
              display: inline-block;
            "></span>
            <span>${d.name}</span>
          </div>
        `,
        iconSize: [85, 20],
        iconAnchor: [42, 10]
      });
      L.marker([d.lat, d.lon], { icon: orangeIcon }).addTo(disruptionsGroupRef.current)
        .bindPopup(`<div style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#d97706;'>🟡 ORANGE ALERT: ${d.name} (Bihar)</b><br/>Status: Regulated Flood Watch & Secondary Embankment Alert.</div>`);
    });

    // 🏔️ ALL NORTH EASTERN REGION (NER) 8-STATE REAL-TIME HAZARD ALERT MESH
    const nerHazardZones = [
      // 1. SIKKIM & NORTH BENGAL (Teesta GLOF & Flash Flood Basin)
      { name: "South Lhonak GLOF", state: "Sikkim", lat: 27.91, lon: 88.20, severity: "red", type: "GLOF Moraine Breach", note: "Moraine displacement 14.6mm/day • 5,200m MSL • 52-min advance lead time" },
      { name: "Chungthang Dam", state: "Sikkim", lat: 27.60, lon: 88.65, severity: "red", type: "Hydro Flood Surge", note: "Teesta Stage III Surge Alert • Embankment spillway overtopping" },
      { name: "NH-10 Teesta Washout", state: "Sikkim / WB", lat: 27.15, lon: 88.52, severity: "red", type: "River Highway Washout", note: "NH-10 breach at 29th Mile • Diverting via Lava-Kalimpong corridor" },
      { name: "Melli Landslide", state: "Sikkim", lat: 27.08, lon: 88.46, severity: "orange", type: "Debris Sinking Zone", note: "Pore-pressure sensor alert • Heavy mud flow watch" },

      // 2. ARUNACHAL PRADESH (Alpine Passes & Siang Inflow)
      { name: "NH-13 Sela Pass", state: "Arunachal", lat: 27.5861, lon: 91.8594, severity: "red", type: "Sub-Zero Blizzard & Rockfall", note: "Altitude 3,500m MSL • Tyre snow-chains mandatory • Kalaktang alternate active" },
      { name: "Upper Siang / Pasighat", state: "Arunachal", lat: 28.06, lon: 95.33, severity: "orange", type: "Tsangpo River Surge", note: "Transboundary glacial inflow surge into Siang Basin" },
      { name: "Dibang Valley Slopes", state: "Arunachal", lat: 28.15, lon: 95.84, severity: "orange", type: "Mountain Slump", note: "Hill road sinking along Anini corridor" },

      // 3. ASSAM (Brahmaputra Floodplains, Majuli Island & Dima Hasao)
      { name: "Majuli Island", state: "Assam", lat: 26.95, lon: 94.20, severity: "red", type: "Brahmaputra Bank Erosion", note: "Kamalabari & Salmora embankment overtopping • SDRF boat rescue stationed" },
      { name: "Dima Hasao / Haflong", state: "Assam", lat: 25.18, lon: 93.02, severity: "red", type: "Hill Sinking & Mudslides", note: "Lumding-Badarpur rail-road mudslips • Geotechnical sensors active" },
      { name: "Silchar / Barak Basin", state: "Assam", lat: 24.83, lon: 92.78, severity: "red", type: "Barak River Sluice Surge", note: "Bethukandi river overflow • Civil Hospital 22% medical buffer alert" },
      { name: "Kaziranga Floodplain", state: "Assam", lat: 26.58, lon: 93.17, severity: "orange", type: "Brahmaputra Backflow", note: "Wildlife corridor inundation • NH-715 speed governor active (40 km/h)" },
      { name: "Dhubri Lower Basin", state: "Assam", lat: 26.02, lon: 89.98, severity: "orange", type: "Downstream Inundation", note: "Brahmaputra low-lying char area waterlogging" },
      { name: "Kapili River Basin", state: "Assam", lat: 26.25, lon: 92.35, severity: "orange", type: "Flash Inundation", note: "Nagaon & Kampur agricultural basin alert" },

      // 4. MEGHALAYA (High-Rainfall Escarpments & NH-6 Lifeline)
      { name: "Sohra (Cherrapunji)", state: "Meghalaya", lat: 25.28, lon: 91.73, severity: "red", type: "Torrential Flash Runoff", note: "680mm 24h rainfall spike • Cliff edge escarpment washouts" },
      { name: "NH-6 Jowai-Ratacherra", state: "Meghalaya", lat: 25.32, lon: 92.35, severity: "red", type: "Km 142 Landslide Breach", note: "Sector 9 AI Bypass active • 4.2 hrs detour routing enabled" },
      { name: "Tura Sinking Hills", state: "Meghalaya", lat: 25.51, lon: 90.22, severity: "orange", type: "Garo Hills Mud Runoff", note: "Simsang riverbank swell & road edge erosion" },

      // 5. NAGALAND (Paglapahar Sinking Corridor)
      { name: "NH-29 Paglapahar", state: "Nagaland", lat: 25.75, lon: 93.85, severity: "red", type: "Sinking Rockfall Corridor", note: "Kohima-Dimapur geological fault line slip • Heavy boulder shield deployed" },
      { name: "Pfutsero Slopes", state: "Nagaland", lat: 25.68, lon: 94.32, severity: "orange", type: "High-Altitude Mudslip", note: "Phek district road connectivity watch" },

      // 6. MANIPUR (Imphal Valley & NH-37 Lifeline)
      { name: "NH-37 Imphal-Jiribam", state: "Manipur", lat: 24.80, lon: 93.45, severity: "red", type: "Makru Bridge Slip", note: "Lifeline hill road sinking • Emergency convoy escort required" },
      { name: "Imphal Valley Basin", state: "Manipur", lat: 24.8170, lon: 93.9368, severity: "orange", type: "Nambul River Overflow", note: "Urban rainwater overflow & low-lying waterlogging" },

      // 7. MIZORAM (NH-306 Lifeline & Hill Slumps)
      { name: "NH-306 Aizawl-Kolasib", state: "Mizoram", lat: 24.05, lon: 92.68, severity: "red", type: "Sole Lifeline Slope Failure", note: "Critical fuel/grain supply route breach • Heavy earthmovers clearing" },
      { name: "Lunglei Southern Slopes", state: "Mizoram", lat: 22.89, lon: 92.74, severity: "orange", type: "Hill Slump & Runoff", note: "Khawthlangtuipui riverbank saturation warning" },

      // 8. TRIPURA (Agartala Lowland Basin)
      { name: "Agartala Howrah Basin", state: "Tripura", lat: 23.83, lon: 91.28, severity: "orange", type: "Transboundary River Surge", note: "Howrah River embankment watch • Regulated sluice discharge" }
    ];

    nerHazardZones.forEach(z => {
      const isRed = z.severity === "red";
      const icon = L.divIcon({
        className: `custom-ner-hazard-${z.severity}`,
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: ${isRed ? 'rgba(15, 23, 42, 0.90)' : 'rgba(15, 23, 42, 0.85)'};
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid ${isRed ? 'rgba(244, 63, 94, 0.75)' : 'rgba(245, 158, 11, 0.65)'};
            border-radius: 9999px;
            padding: ${isRed ? '3px 8.5px 3px 6.5px' : '2.5px 7.5px 2.5px 5.5px'};
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 10px ${isRed ? 'rgba(225, 29, 72, 0.4)' : 'rgba(245, 158, 11, 0.3)'};
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', 'Segoe UI', Roboto, sans-serif;
            font-size: ${isRed ? '10px' : '9.5px'};
            font-weight: 700;
            color: ${isRed ? '#ffffff' : '#fef08a'};
            letter-spacing: -0.01em;
            cursor: pointer;
            transition: transform 0.2s ease;
          ">
            <span style="
              width: ${isRed ? '7px' : '6px'};
              height: ${isRed ? '7px' : '6px'};
              background: ${isRed ? '#ef4444' : '#f59e0b'};
              border-radius: 50%;
              box-shadow: 0 0 8px ${isRed ? '#ef4444' : '#f59e0b'};
              display: inline-block;
            "></span>
            <span>${z.name}</span>
          </div>
        `,
        iconSize: [120, 22],
        iconAnchor: [60, 11]
      });

      L.marker([z.lat, z.lon], { icon }).addTo(disruptionsGroupRef.current)
        .bindPopup(`
          <div style='font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:12px;color:#0f172a;padding:2px;min-width:210px;'>
            <div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;'>
              <b style='color:${isRed ? '#dc2626' : '#d97706'};font-weight:900;'>${isRed ? '🚨 RED ALERT' : '🟡 ORANGE ALERT'}: ${z.name}</b>
              <span style='font-size:10px;background:#f1f5f9;color:#475569;padding:1px 5px;border-radius:4px;font-weight:800;'>${z.state}</span>
            </div>
            <div style='font-weight:700;color:#0f172a;font-size:11.5px;margin-bottom:2px;'>Type: ${z.type}</div>
            <div style='font-size:11px;color:#475569;line-height:1.3;'>${z.note}</div>
            <div style='margin-top:6px;padding:3px 6px;border-radius:4px;background:${isRed ? '#fee2e2' : '#fef3c7'};color:${isRed ? '#991b1b' : '#92400e'};font-size:10.5px;font-weight:800;'>
              ${isRed ? '⚠️ Immediate Action & AI Reroute Active' : '⚡ Regulated Speed & Caution Enforced'}
            </div>
          </div>
        `);
    });

    // 5. ESSENTIAL SUPPLY CONVOYS LAYER (🚚) - Moving Truck Badges with Radar Ripples
    const truckIcon1 = L.divIcon({
      className: "custom-truck1",
      html: `
        <div style="width:32px;height:32px;background:radial-gradient(circle, #0284c7, #0369a1);border:2.5px solid #38bdf8;border-radius:50%;box-shadow:0 0 18px #0284c7;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;animation:pulse 1.1s infinite;">
          🚚
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const convoyMarker1 = L.marker(orangeWaypoints[0], { icon: truckIcon1 }).addTo(convoysGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#0284c7;'>🚚 Convoy #01 (Medical Oxygen)</b><br/>Route: Guwahati ➔ Silchar<br/>Speed: <b>48 km/h</b> &bull; ETA: <b>3h 15m</b></div>");

    const truckIcon2 = L.divIcon({
      className: "custom-truck2",
      html: `
        <div style="width:32px;height:32px;background:radial-gradient(circle, #059669, #047857);border:2.5px solid #34d399;border-radius:50%;box-shadow:0 0 18px #10b981;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;animation:pulse 1.1s infinite;">
          🚚
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const convoyMarker2 = L.marker(greenWaypoints[0], { icon: truckIcon2 }).addTo(convoysGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#059669;'>🚚 Convoy #02 (Rations & Shelter)</b><br/>Route: Guwahati ➔ Dibrugarh<br/>Speed: <b>56 km/h</b> &bull; ETA: <b>2h 45m</b></div>");

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

    // 6. BRIDGES & SUPPLY DEPOTS LAYER (🌉) - Circular Depot Icons
    const depotIcon1 = L.divIcon({
      className: "custom-depot1",
      html: `<div style="width:30px;height:30px;background:radial-gradient(circle, #4f46e5, #3730a3);border:2px solid #818cf8;border-radius:50%;box-shadow:0 0 16px #6366f1;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;">🌉</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([27.4728, 94.9120], { icon: depotIcon1 }).addTo(depotsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#4f46e5;'>🌉 Dibrugarh Brahmaputra Staging Depot</b><br/>Emergency Capacity: <b>95%</b> &bull; Grains & Medical Staged</div>");

    const medIcon = L.divIcon({
      className: "custom-med1",
      html: `<div style="width:30px;height:30px;background:radial-gradient(circle, #db2777, #9d174d);border:2px solid #f472b6;border-radius:50%;box-shadow:0 0 16px #ec4899;display:flex;align-items:center;justify-content:center;color:#fff;font-size:15px;">💊</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    L.marker([24.8333, 92.7789], { icon: medIcon }).addTo(depotsGroupRef.current)
      .bindPopup("<div style='font-family:sans-serif;font-size:12px;color:#0f172a;padding:2px;'><b style='color:#db2777;'>💊 Silchar Civil Hospital Critical Reserve</b><br/>Oxygen Buffer: <b>22%</b> (Convoy #01 Arriving in 3h 15m)</div>");

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
    let url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    if (baseStyle === "topo") url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
    else if (baseStyle === "osm" || baseStyle === "voyager") url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    else url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

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
            <button
              onClick={onNavigateTo3DSim}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow shrink-0"
            >
              <span>🎮</span> <span>{t("dashboard.sim3d", "3D SIMULATION")}</span>
            </button>

            <button className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer border border-indigo-400/40 shrink-0">
              <span>🗺️</span> <span>{t("dashboard.map2d", "2D Map")}</span>
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
        {hideHeader && (
          <div className="absolute top-4 right-16 z-[1000] flex items-center gap-1.5 text-xs bg-white/90 dark:bg-slate-950/85 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur shadow-2xl">
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo([26.20, 89.50], 6.5, { duration: 1.2 });
                }
              }}
              className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 cursor-pointer shrink-0"
              title="Overview"
            >
              <span>🇮🇳</span> <span>Overview</span>
            </button>

            <button onClick={() => setBaseStyle("esri")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs shrink-0 ${baseStyle === "esri" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🛰️ Satellite</button>
            <button onClick={() => setBaseStyle("topo")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs shrink-0 ${baseStyle === "topo" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>⛰️ Topo</button>
            <button onClick={() => setBaseStyle("osm")} className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs shrink-0 ${baseStyle === "osm" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"}`}>🗺️ Roads</button>
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
              onClick={() => setBaseStyle(baseStyle === "esri" ? "topo" : "esri")}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Toggle Satellite / Topo View"
            >
              {baseStyle === "esri" ? "⛰️" : "🛰️"}
            </button>
            <button
              onClick={() => mapInstanceRef.current?.setView([26.2000, 88.5000], 7)}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer text-xs font-bold"
              title="Center Map Overview"
            >
              🎯
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
