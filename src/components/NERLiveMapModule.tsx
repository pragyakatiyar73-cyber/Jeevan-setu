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
  Sparkles,
  ChevronDown
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

export interface NERStateData {
  id: string;
  name: string;
  capital: string;
  center: [number, number];
  zoom: number;
  districts: Array<{ name: string; coord: [number, number] }>;
}

// 8 North Eastern Region (NER) Sovereign States & District Dataset
export const NER_STATES_DATA: NERStateData[] = [
  {
    id: 'arunachal',
    name: 'Arunachal Pradesh',
    capital: 'Itanagar',
    center: [27.0844, 93.6053],
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
    center: [26.1445, 91.7362],
    zoom: 8,
    districts: [
      { name: 'Kamrup Metro (Guwahati)', coord: [26.1445, 91.7362] },
      { name: 'Kaziranga / Lakhimpur Basin', coord: [26.5800, 93.1700] },
      { name: 'Dibrugarh Sector', coord: [27.4728, 94.9120] },
      { name: 'Cachar (Silchar)', coord: [24.8333, 92.7789] },
      { name: 'Jorhat', coord: [26.7509, 94.2037] },
      { name: 'Sonitpur (Tezpur)', coord: [26.6338, 92.8006] },
      { name: 'Nagaon', coord: [26.3462, 92.6840] },
      { name: 'Barpeta', coord: [26.3228, 91.0048] }
    ]
  },
  {
    id: 'manipur',
    name: 'Manipur',
    capital: 'Imphal',
    center: [24.8170, 93.9368],
    zoom: 9,
    districts: [
      { name: 'Imphal West', coord: [24.8170, 93.9368] },
      { name: 'Imphal East', coord: [24.8000, 93.9500] },
      { name: 'Noney Landslide Corridor', coord: [24.7890, 93.6540] },
      { name: 'Churachandpur', coord: [24.3333, 93.6833] },
      { name: 'Ukhrul', coord: [25.1167, 94.3667] },
      { name: 'Tamenglong', coord: [24.9833, 93.4833] },
      { name: 'Senapati', coord: [25.2667, 94.0167] }
    ]
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya',
    capital: 'Shillong',
    center: [25.5788, 91.8933],
    zoom: 9,
    districts: [
      { name: 'East Khasi Hills (Shillong)', coord: [25.5788, 91.8933] },
      { name: 'Sohra / Cherrapunji Sector', coord: [25.2702, 91.7323] },
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
    center: [23.7271, 92.7176],
    zoom: 9,
    districts: [
      { name: 'Aizawl Ridge Sector', coord: [23.7271, 92.7176] },
      { name: 'Lunglei', coord: [22.8841, 92.7347] },
      { name: 'Champhai', coord: [23.4735, 93.3276] },
      { name: 'Serchhip', coord: [23.3086, 92.8465] },
      { name: 'Mamit', coord: [23.9287, 92.4891] },
      { name: 'Kolasib', coord: [24.2255, 92.6789] }
    ]
  },
  {
    id: 'nagaland',
    name: 'Nagaland',
    capital: 'Kohima',
    center: [25.6751, 94.1086],
    zoom: 9,
    districts: [
      { name: 'Kohima', coord: [25.6751, 94.1086] },
      { name: 'Dimapur', coord: [25.9060, 93.7270] },
      { name: 'Zubza Pass Sector', coord: [25.6890, 94.0450] },
      { name: 'Mokokchung', coord: [26.3262, 94.5203] },
      { name: 'Tuensang', coord: [26.2841, 94.8315] },
      { name: 'Wokha', coord: [26.0984, 94.2612] },
      { name: 'Mon', coord: [26.7481, 95.0594] }
    ]
  },
  {
    id: 'sikkim',
    name: 'Sikkim',
    capital: 'Gangtok',
    center: [27.3389, 88.6065],
    zoom: 9,
    districts: [
      { name: 'East Sikkim (Gangtok)', coord: [27.3389, 88.6065] },
      { name: 'North Sikkim (Mangan)', coord: [27.5020, 88.5342] },
      { name: 'Chungthang Sector', coord: [27.5800, 88.6200] },
      { name: 'South Sikkim (Namchi)', coord: [27.1664, 88.3639] },
      { name: 'West Sikkim (Gyalshing)', coord: [27.2833, 88.2333] }
    ]
  },
  {
    id: 'tripura',
    name: 'Tripura',
    capital: 'Agartala',
    center: [23.8315, 91.2868],
    zoom: 9,
    districts: [
      { name: 'West Tripura (Agartala)', coord: [23.8315, 91.2868] },
      { name: 'North Tripura (Dharmanagar)', coord: [24.3739, 92.1642] },
      { name: 'Gomati (Udaipur)', coord: [23.5333, 91.4833] },
      { name: 'Dhalai (Ambassa)', coord: [23.8441, 91.8507] },
      { name: 'South Tripura (Belonia)', coord: [23.2494, 91.4556] }
    ]
  }
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

  // State & District Explorer selection
  const [selectedStateId, setSelectedStateId] = useState<string>('all');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('all');

  // Layer Groups Refs
  const roadsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const trafficGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const weatherGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const disruptionsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const convoysGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const depotsGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const crossBorderGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Base Style
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
    depots: true,
    crossBorderContext: false // OFF by default; excluded from core NER counts
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

    // Default center strictly focused on North Eastern Region (8 States)
    const centerLat = focusedTarget ? focusedTarget.coord[0] : (activeSosLocation ? activeSosLocation.lat : 26.1000);
    const centerLon = focusedTarget ? focusedTarget.coord[1] : (activeSosLocation ? activeSosLocation.lon : 92.8000);
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
      attribution: "© Google Maps &bull; Jeevan Setu NER Sovereign GIS"
    }).addTo(map);
    currentTileLayerRef.current = baseTile;

    // Create & Add Layer Groups to Map
    roadsGroupRef.current = L.layerGroup().addTo(map);
    trafficGroupRef.current = L.layerGroup().addTo(map);
    weatherGroupRef.current = L.layerGroup().addTo(map);
    disruptionsGroupRef.current = L.layerGroup().addTo(map);
    convoysGroupRef.current = L.layerGroup().addTo(map);
    depotsGroupRef.current = L.layerGroup().addTo(map);
    crossBorderGroupRef.current = L.layerGroup().addTo(map);

    // 🌐 CROSS-BORDER CONTEXT OVERLAY LAYER (Disabled by default, isolated from core stats)
    const crossBorderPoints = [
      { name: "Nepal Border Corridor", lat: 26.8, lon: 87.2, info: "Cross-Border Transit Context (Nepal) — Excluded from core NER stats" },
      { name: "Bhutan Samdrup Jongkhar Corridor", lat: 26.8, lon: 91.5, info: "Cross-Border Transit Context (Bhutan) — Excluded from core NER stats" },
      { name: "Bangladesh Sylhet Border Corridor", lat: 24.9, lon: 91.8, info: "Cross-Border Transit Context (Bangladesh) — Excluded from core NER stats" }
    ];

    crossBorderPoints.forEach(cb => {
      const cbIcon = L.divIcon({
        className: "custom-crossborder-marker",
        html: `<div style="background: #64748b; color: white; border: 1.5px dashed #cbd5e1; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">🌐 ${cb.name}</div>`,
        iconSize: [140, 24],
        iconAnchor: [70, 12]
      });
      L.marker([cb.lat, cb.lon], { icon: cbIcon })
        .bindTooltip(cb.info, { permanent: false })
        .addTo(crossBorderGroupRef.current);
    });

    // 🌊 WEATHER RADAR OVERLAY LAYER
    L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
      opacity: 0.45,
      attribution: "NEXRAD Radar"
    }).addTo(weatherGroupRef.current);

    // 🗺️ DRAW SOVEREIGN 8 NER STATES BOUNDARY POLYGON
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

  // Dynamically update base tile URL on style switch
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
    if (overlays.crossBorderContext) { map.addLayer(crossBorderGroupRef.current); } else { map.removeLayer(crossBorderGroupRef.current); }
  }, [overlays]);

  // Handle State Selection
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

  // Handle District Selection
  const handleDistrictSelect = (districtName: string) => {
    setSelectedDistrictName(districtName);
    if (!mapInstanceRef.current || districtName === 'all') return;

    const currentState = NER_STATES_DATA.find(s => s.id === selectedStateId);
    const distObj = currentState?.districts.find(d => d.name === districtName);
    if (distObj) {
      mapInstanceRef.current.flyTo(distObj.coord, 11, { duration: 1.2 });
    }
  };

  const selectedStateObj = NER_STATES_DATA.find(s => s.id === selectedStateId);

  return (
    <div className="h-full w-full relative flex flex-col select-none bg-[#040814] text-slate-100 font-sans overflow-hidden min-w-0">
      
      {/* 🟢 TOP HEADER BAR SCOPED EXCLUSIVELY TO 8 NER STATES */}
      {!hideHeader && (
        <div className="min-h-[64px] py-2.5 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040814] px-4 lg:px-6 flex flex-wrap items-center justify-between gap-3 z-20 backdrop-blur transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                North Eastern Region (NER 8 States) Dedicated GIS
              </span>
              <span className="hidden sm:inline text-xs italic text-slate-500 dark:text-slate-400">Arunachal, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura</span>
            </div>
            <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight mt-0.5 leading-snug">
              North Eastern Region (NER) Accessibility &amp; Disaster Intelligence Overview
            </h1>
          </div>

          {/* TOP RIGHT STATE & DISTRICT SELECTORS */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            
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

            {/* District Explorer Selector */}
            {selectedStateObj && (
              <div className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-300 dark:border-slate-800 animate-fadeIn">
                <span className="pl-2 font-extrabold text-slate-700 dark:text-slate-300">District:</span>
                <select
                  value={selectedDistrictName}
                  onChange={(e) => handleDistrictSelect(e.target.value)}
                  className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-2 py-1 rounded-lg text-xs border border-slate-300 dark:border-slate-700 focus:outline-none"
                >
                  <option value="all">All {selectedStateObj.name} Districts</option>
                  {selectedStateObj.districts.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Map Style Switcher */}
            <div className="flex items-center gap-1 text-xs shrink-0">
              <button
                onClick={() => setBaseStyle("esri")}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer text-xs ${
                  baseStyle === "esri" ? "bg-sky-600 text-white shadow" : "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400"
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

          </div>
        </div>
      )}

      {/* MAP CANVAS CONTAINER */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <div ref={mapRef} className="w-full h-full z-10" />
      </div>

    </div>
  );
}
