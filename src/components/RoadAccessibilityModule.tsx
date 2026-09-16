import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../i18n";
import {
  Navigation,
  MapPin,
  AlertTriangle,
  Compass,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Radio,
  ShieldCheck,
  Search,
  Globe,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Truck,
  Sliders,
  X,
  FileText,
  TrendingUp,
  SlidersHorizontal
} from "lucide-react";
import {
  calculateSafeNERRoute,
  NER_HIGHWAY_SEGMENTS,
  NERHighwaySegment,
  SafeRouteResult,
  RoadAccessibilityStatus
} from "../services/api/roadAccessibilityService";
import { searchLocation } from "../services/api/routing";
import { isPointInNER } from "../utils/nerBoundary";

export const NER_DISTRICT_COORDS: Record<string, [number, number]> = {
  // Assam
  'baksa': [26.6935, 91.5984],
  'barpeta': [26.3228, 91.0048],
  'guwahati': [26.1445, 91.7362],
  'kamrup': [26.3161, 91.5984],
  'kamrup metro': [26.1445, 91.7362],
  'kamrup metropolitan': [26.1445, 91.7362],
  'cachar': [24.8333, 92.7789],
  'silchar': [24.8333, 92.7789],
  'dibrugarh': [27.4728, 94.9120],
  'jorhat': [26.7509, 94.2037],
  'nagaon': [26.3462, 92.6840],
  'tezpur': [26.6338, 92.8006],
  'sonitpur': [26.6338, 92.8006],
  'dhemaji': [27.4833, 94.5833],
  'lakhimpur': [27.2333, 94.1000],
  'dhubri': [26.0206, 89.9746],
  'goalpara': [26.1833, 90.6167],
  'bongaigaon': [26.4769, 90.5584],
  'tinsukia': [27.4886, 95.3558],
  'dima hasao': [25.1667, 93.0167],
  'haflong': [25.1667, 93.0167],
  'karbi anglong': [25.8450, 93.4350],
  'karimganj': [24.8667, 92.3500],
  'hailakandi': [24.6833, 92.5667],
  'majuli': [26.9500, 94.2167],
  'kokrajhar': [26.4000, 90.2667],
  'chirang': [26.5000, 90.5000],
  'udalguri': [26.7460, 92.1310],
  'biswanath': [26.7328, 93.1444],
  'charaideo': [26.9600, 94.9000],
  'sivasagar': [26.9833, 94.6333],
  'morigaon': [26.2500, 92.3333],
  'nalbari': [26.4442, 91.4398],
  'south salmara': [25.8270, 89.9320],
  // Meghalaya
  'shillong': [25.5788, 91.8933],
  'east khasi hills': [25.5788, 91.8933],
  'sohra': [25.2702, 91.7323],
  'cherrapunji': [25.2702, 91.7323],
  'jowai': [25.4452, 92.2081],
  'west jaintia hills': [25.4452, 92.2081],
  'east jaintia hills': [25.3167, 92.4167],
  'tura': [25.5142, 90.2032],
  'west garo hills': [25.5142, 90.2032],
  'east garo hills': [25.6000, 90.5833],
  'south garo hills': [25.3167, 90.6333],
  'north garo hills': [25.9000, 90.6000],
  'south west garo hills': [25.4300, 89.8800],
  'ri bhoi': [25.9038, 91.8812],
  'nongpoh': [25.9038, 91.8812],
  'west khasi hills': [25.5204, 91.2678],
  'nongstoin': [25.5204, 91.2678],
  'south west khasi hills': [25.3300, 91.2300],
  'eastern west khasi hills': [25.5500, 91.4500],
  // Arunachal Pradesh
  'itanagar': [27.0844, 93.6053],
  'papum pare': [27.0844, 93.6053],
  'tawang': [27.5861, 91.8504],
  'sela pass': [27.5021, 92.1034],
  'bomdila': [27.2642, 92.4159],
  'west kameng': [27.2642, 92.4159],
  'east kameng': [27.3167, 93.0333],
  'pasighat': [28.0660, 95.3262],
  'east siang': [28.0660, 95.3262],
  'ziro': [27.5947, 93.8385],
  'lower subansiri': [27.5947, 93.8385],
  'upper subansiri': [28.0600, 94.1300],
  'changlang': [27.1268, 95.7337],
  'tezu': [27.9167, 96.1667],
  'lohit': [27.9167, 96.1667],
  'namsai': [27.6667, 95.8667],
  'tirap': [27.0000, 95.5000],
  'longding': [26.8500, 95.3500],
  'upper siang': [28.6167, 94.9500],
  'dibang valley': [28.8667, 95.8000],
  'lower dibang valley': [28.1500, 95.8333],
  'anjaw': [27.9167, 96.8333],
  'kra daadi': [27.8500, 93.6500],
  'kurung kumey': [27.9000, 93.3500],
  'lepa rada': [27.8000, 94.6000],
  'lower siang': [27.7500, 94.8500],
  'pakke kessang': [27.1500, 93.2000],
  'shi yomi': [28.5000, 94.3000],
  'siang': [28.2000, 95.0000],
  'kamle': [27.7000, 93.9000],
  // Nagaland
  'dimapur': [25.9060, 93.7270],
  'kohima': [25.6751, 94.1086],
  'mokokchung': [26.3262, 94.5204],
  'mon': [26.7500, 95.0667],
  'tuensang': [26.2833, 94.8333],
  'wokha': [26.1000, 94.2667],
  'zunheboto': [25.9667, 94.5167],
  'phek': [25.6667, 94.4667],
  'kiphire': [25.9000, 94.7833],
  'peren': [25.5167, 93.7333],
  'longleng': [26.4833, 94.8000],
  'chumoukedima': [25.8200, 93.7700],
  'niuland': [25.9800, 93.8500],
  'noklak': [26.2000, 95.0500],
  'shamator': [26.0500, 94.9500],
  'tseminyu': [25.9100, 94.2100],
  // Manipur
  'imphal': [24.8170, 93.9368],
  'imphal west': [24.8170, 93.9368],
  'imphal east': [24.8000, 93.9500],
  'churachandpur': [24.3333, 93.6833],
  'noney': [24.7890, 93.6540],
  'ukhrul': [25.1167, 94.3667],
  'tamenglong': [24.9833, 93.4833],
  'senapati': [25.2667, 94.0167],
  'thoubal': [24.6333, 93.9833],
  'bishnupur': [24.5500, 93.8000],
  'chandel': [24.3167, 93.9833],
  'jiribam': [24.8000, 93.1167],
  'kakching': [24.4833, 93.9833],
  'kamjong': [24.8500, 94.5000],
  'kangpokpi': [25.1500, 93.9700],
  'pherzawl': [24.1800, 93.3000],
  'tengnoupal': [24.4000, 94.1500],
  // Mizoram
  'aizawl': [23.7271, 92.7176],
  'lunglei': [22.8833, 92.7333],
  'champhai': [23.4667, 93.3333],
  'kolasib': [24.2333, 92.6833],
  'serchhip': [23.3333, 92.8500],
  'mamit': [23.9333, 92.4833],
  'lawngtlai': [22.5333, 92.8833],
  'saiha': [22.4833, 92.9833],
  'hnahthial': [22.9667, 92.9333],
  'khawzawl': [23.5333, 93.1833],
  'saitual': [23.7000, 92.9833],
  // Sikkim
  'gangtok': [27.3389, 88.6065],
  'east sikkim': [27.3389, 88.6065],
  'north sikkim': [27.7000, 88.5167],
  'mangan': [27.5020, 88.5342],
  'namchi': [27.1667, 88.3500],
  'south sikkim': [27.1667, 88.3500],
  'gyalshing': [27.2833, 88.2500],
  'west sikkim': [27.2833, 88.2500],
  'pakyong': [27.2400, 88.5900],
  'soreng': [27.1667, 88.2000],
  // Tripura
  'agartala': [23.8315, 91.2868],
  'west tripura': [23.8315, 91.2868],
  'dharmanagar': [24.3667, 92.1667],
  'north tripura': [24.3667, 92.1667],
  'dhalai': [23.8500, 91.8500],
  'ambassa': [23.8500, 91.8500],
  'gomati': [23.5333, 91.4833],
  'udaipur': [23.5333, 91.4833],
  'khowai': [24.0667, 91.6000],
  'sepahijala': [23.6800, 91.3300],
  'south tripura': [23.1667, 91.5000],
  'belonia': [23.1667, 91.5000],
  'unakoti': [24.2833, 92.0167],
  'kailashahar': [24.2833, 92.0167],
  // Non-NER Special test
  'delhi': [28.6139, 77.2090],
  'lucknow': [26.8467, 80.9462]
};

async function resolveLocationCoords(query: string, fallbackCoords: [number, number]): Promise<[number, number]> {
  if (!query || !query.trim()) return fallbackCoords;
  const q = query.trim().toLowerCase();
  
  // 1. Direct dictionary match
  if (NER_DISTRICT_COORDS[q]) {
    return NER_DISTRICT_COORDS[q];
  }
  
  // 2. Partial dictionary match
  for (const [key, coords] of Object.entries(NER_DISTRICT_COORDS)) {
    if (q.includes(key) || key.includes(q)) {
      return coords;
    }
  }

  // 3. Nominatim Geocoding API Fallback
  try {
    const results = await searchLocation(query);
    if (results && results.length > 0) {
      return [results[0].lat, results[0].lon];
    }
  } catch (e) {
    console.warn("Geocoding failed for query:", query, e);
  }

  return fallbackCoords;
}

interface RoadAccessibilityModuleProps {
  onNavigateToMap?: () => void;
  onTriggerSOS?: () => void;
}

export default function RoadAccessibilityModule({
  onNavigateToMap,
  onTriggerSOS
}: RoadAccessibilityModuleProps) {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';

  // Search Inputs
  const [startInput, setStartInput] = useState<string>("Guwahati, Assam");
  const [startCoords, setStartCoords] = useState<[number, number]>([26.1445, 91.7362]);
  const [destInput, setDestInput] = useState<string>("Shillong, Meghalaya");
  const [destCoords, setDestCoords] = useState<[number, number]>([25.5788, 91.8933]);

  // Route Calculation State
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Map Refs & Display States
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const baseTileRef = useRef<L.TileLayer | null>(null);
  const [mapStyle, setMapStyle] = useState<'satellite' | 'streets'>('satellite');
  const [showHighways, setShowHighways] = useState<boolean>(false);

  // Compute Route
  const handleComputeRoute = async (sNameCustom?: string, dNameCustom?: string) => {
    const sName = sNameCustom || startInput;
    const dName = dNameCustom || destInput;
    setIsComputing(true);
    setStatusToast(`📡 Resolving location telemetry for ${sName} ➔ ${dName}...`);

    try {
      // 1. Dynamic Geocode Start & Dest
      const resolvedStart = await resolveLocationCoords(sName, startCoords);
      const resolvedDest = await resolveLocationCoords(dName, destCoords);

      setStartCoords(resolvedStart);
      setDestCoords(resolvedDest);

      setStatusToast(`📡 Computing OSRM Safe Green Corridor from ${sName} to ${dName}...`);

      const res = await calculateSafeNERRoute({
        startName: sName,
        startLat: resolvedStart[0],
        startLon: resolvedStart[1],
        destName: dName,
        destLat: resolvedDest[0],
        destLon: resolvedDest[1]
      });

      setRouteResult(res);

      if (!res.isValidNER) {
        setStatusToast(res.warningMessage || `Location outside North Eastern Region.`);
      } else if (res.hasDisasterWarning) {
        setStatusToast(res.warningMessage || `⚠️ High-risk road segment detected!`);
      } else {
        setStatusToast(`✓ Safe route calculated (${res.distanceKm} km, ${res.durationMinutes} mins)`);
      }
    } catch (err) {
      console.error("Route calculation error:", err);
      setStatusToast("Route data temporarily unavailable.");
    } finally {
      setIsComputing(false);
      setTimeout(() => setStatusToast(null), 6000);
    }
  };

  // Initial Calculation on Mount
  useEffect(() => {
    handleComputeRoute(startInput, destInput);
  }, []);

  // Preset Corridor Selection Handlers
  const handleSelectPreset = (sName: string, sLat: number, sLon: number, dName: string, dLat: number, dLon: number) => {
    setStartInput(sName);
    setStartCoords([sLat, sLon]);
    setDestInput(dName);
    setDestCoords([dLat, dLon]);
    handleComputeRoute(sName, dName);
  };

  // Initialize Map
  useEffect(() => {
    if (!mapRef.current) return;

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

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([26.1000, 92.8000], 7);

    const baseTile = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 18,
      attribution: "© Google Maps &bull; Jeevan Setu NER Safe Route GIS"
    }).addTo(map);
    baseTileRef.current = baseTile;

    markersGroupRef.current = L.layerGroup();
    if (showHighways) {
      markersGroupRef.current.addTo(map);
    }

    routeLayersRef.current = L.layerGroup().addTo(map);

    // Draw Master NER Boundary Polygon
    const nerBoundaryCoords: L.LatLngExpression[] = [
      [28.2, 88.0], [28.1, 88.9], [27.3, 88.9], [27.0, 89.8],
      [27.4, 91.6], [28.0, 92.5], [29.3, 94.5], [29.5, 96.5],
      [28.2, 97.4], [27.0, 96.5], [26.2, 95.3], [25.2, 94.8],
      [24.2, 94.4], [23.2, 93.4], [21.9, 92.8], [22.4, 92.2],
      [23.0, 91.1], [24.1, 91.1], [24.9, 91.8], [25.2, 89.8],
      [26.1, 89.7], [26.6, 88.5], [27.2, 88.0]
    ];
    L.polygon(nerBoundaryCoords, {
      color: '#38bdf8',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#0284c7',
      fillOpacity: 0.04
    }).addTo(map).bindTooltip("Data Coverage: North Eastern Region — 8 Sovereign States", { permanent: false });

    // Render Highway Status Markers
    NER_HIGHWAY_SEGMENTS.filter(h => isPointInNER(h.centerLat, h.centerLon)).forEach(hw => {
      const color = hw.status === 'Blocked' ? '#ef4444' :
                    hw.status === 'High Risk' ? '#f97316' :
                    hw.status === 'Caution' ? '#eab308' : '#10b981';

      const hwIcon = L.divIcon({
        className: 'custom-highway-marker',
        html: `<div style="background: ${color}; color: white; border: 1.5px solid white; font-size: 10px; font-weight: 900; padding: 2px 6px; border-radius: 6px; box-shadow: 0 0 8px ${color}; cursor: pointer;">🛣️ ${hw.highwayCode} (${hw.status})</div>`,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });

      const m = L.marker([hw.centerLat, hw.centerLon], { icon: hwIcon });
      m.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 220px; padding: 2px;">
          <div style="font-weight: 900; font-size: 13px; color: #0f172a; margin-bottom: 2px;">
            ${hw.highwayCode}: ${hw.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px; font-weight: 700;">
            ${hw.district}, ${hw.state} &bull; Status: <b style="color: ${color};">${hw.status}</b>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; font-size: 11px; color: #334155;">
            ${hw.statusDetails}
          </div>
        </div>
      `);
      markersGroupRef.current.addLayer(m);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Base Tile on style toggle
  useEffect(() => {
    if (!baseTileRef.current) return;
    const url = mapStyle === 'satellite'
      ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
      : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    baseTileRef.current.setUrl(url);
  }, [mapStyle]);

  // Toggle highway markers visibility
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    if (showHighways) {
      markersGroupRef.current.addTo(mapInstanceRef.current);
    } else {
      markersGroupRef.current.remove();
    }
  }, [showHighways]);

  // Re-center / Zoom to Route helper
  const fitRouteBounds = () => {
    if (!mapInstanceRef.current || !routeResult || !routeResult.geometry || routeResult.geometry.length === 0) return;
    mapInstanceRef.current.invalidateSize();
    const bounds = L.latLngBounds(routeResult.geometry);
    mapInstanceRef.current.flyToBounds(bounds, {
      paddingTopLeft: [45, 45],
      paddingBottomRight: [45, 45],
      maxZoom: 15,
      duration: 1.4
    });
  };

  // Render high-precision route corridor, modern pins, and auto-zoom
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayersRef.current) return;

    routeLayersRef.current.clearLayers();

    if (routeResult && routeResult.geometry && routeResult.geometry.length > 0) {
      const isHazard = routeResult.hasDisasterWarning;
      const mainRouteColor = isHazard ? '#f97316' : '#0284c7'; // Amber orange for hazard, vibrant royal sky blue for safe corridor

      // 1. Layer 1: Dark Casing Halo for crisp contrast against any satellite or street tiles
      L.polyline(routeResult.geometry, {
        color: '#020617',
        weight: 9,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayersRef.current);

      // 2. Layer 2: Main Solid Navigation Ribbon (Smooth, continuous, NO jagged disjointed dots)
      L.polyline(routeResult.geometry, {
        color: mainRouteColor,
        weight: 5.5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayersRef.current);

      // 3. Layer 3: Inner Glass Highlight Streak (modern GPS navigation glow)
      L.polyline(routeResult.geometry, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeLayersRef.current);

      // 4. Start Pin Icon 📍 (Point A)
      const startCoord = routeResult.geometry[0];
      const startLabel = routeResult.startLocation || startInput;
      const startIcon = L.divIcon({
        className: 'custom-start-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));">
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: 2.5px solid #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
              <span style="background: white; color: #059669; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">A</span>
              <span>${startLabel}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #059669; margin-top: -1px;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #10b981; border: 2px solid white; box-shadow: 0 0 8px #10b981; margin-top: 1px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      const startMarker = L.marker(startCoord, { icon: startIcon, zIndexOffset: 1000 });
      startMarker.bindPopup(`<b>Start Point (A):</b> ${startLabel}`);
      startMarker.addTo(routeLayersRef.current);

      // 5. Destination Pin Icon 🎯 (Point B)
      const destCoord = routeResult.geometry[routeResult.geometry.length - 1];
      const destLabel = routeResult.destLocation || destInput;
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.6));">
            <div style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: 2.5px solid #ffffff; padding: 4px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; display: flex; align-items: center; gap: 6px; white-space: nowrap; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);">
              <span style="background: white; color: #dc2626; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 900; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">B</span>
              <span>${destLabel}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #dc2626; margin-top: -1px;"></div>
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #ef4444; border: 2px solid white; box-shadow: 0 0 8px #ef4444; margin-top: 1px;"></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });
      const destMarker = L.marker(destCoord, { icon: destIcon, zIndexOffset: 1000 });
      destMarker.bindPopup(`<b>Destination (B):</b> ${destLabel}`);
      destMarker.addTo(routeLayersRef.current);

      // 6. Hazard Warning Sector Marker (pinpoint warning location rather than breaking polyline)
      if (isHazard && routeResult.geometry.length > 6) {
        const warnIdx = Math.floor(routeResult.geometry.length * 0.35);
        const warnCoord = routeResult.geometry[warnIdx];
        const warnIcon = L.divIcon({
          className: 'custom-hazard-sector-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); pointer-events: auto; cursor: pointer; filter: drop-shadow(0 4px 12px rgba(234, 88, 12, 0.7));">
              <div style="background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: 2px solid white; padding: 3px 8px; border-radius: 8px; font-weight: 900; font-size: 10px; display: flex; align-items: center; gap: 4px; white-space: nowrap;">
                <span>⚠️</span>
                <span>CAUTION SECTOR</span>
              </div>
              <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #ea580c; margin-top: -1px;"></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });
        const warnMarker = L.marker(warnCoord, { icon: warnIcon, zIndexOffset: 900 });
        warnMarker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 11px; min-width: 200px; color: #0f172a;">
            <b style="color: #ea580c; font-size: 12px;">⚠️ Caution: Active Risk Sector</b>
            <p style="margin-top: 4px; color: #475569; line-height: 1.4;">${routeResult.warningMessage || 'Passes near active multi-hazard sector.'}</p>
          </div>
        `);
        warnMarker.addTo(routeLayersRef.current);
      }

      // 7. Dynamic Camera Auto-Zoom: Focus directly on the corridor
      setTimeout(() => {
        if (!mapInstanceRef.current) return;
        mapInstanceRef.current.invalidateSize();
        const bounds = L.latLngBounds(routeResult.geometry);
        mapInstanceRef.current.flyToBounds(bounds, {
          paddingTopLeft: [45, 45],
          paddingBottomRight: [45, 45],
          maxZoom: 15,
          duration: 1.4
        });
      }, 80);
    }
  }, [routeResult]);

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* SECTION 1: HEADER BAR & COVERAGE BADGE */}
      <div className="space-y-4">
        {statusToast && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 dark:bg-sky-950/90 p-3 text-xs lg:text-sm font-bold text-sky-700 dark:text-sky-200 shadow-xl backdrop-blur flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping"></span>
              <span>{statusToast}</span>
            </div>
            <button onClick={() => setStatusToast(null)} className="text-sky-600 dark:text-sky-400 hover:text-white font-black text-sm">✕</button>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 lg:p-6 shadow-xl dark:shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors duration-300 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Coverage Badge */}
              <span className="rounded-full bg-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 border border-sky-500/30">
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                Data Coverage: North Eastern Region — 8 States
              </span>

              {/* Data Status Badge */}
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                {routeResult?.dataStatus || 'LIVE / REAL-TIME'}
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
              <span>🛣️</span> Road Accessibility &amp; Safe Route Intelligence
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Disaster-aware green corridor routing, OSRM turn-by-turn navigation, and multi-hazard slope &amp; flood risk avoidance scoped strictly to the 8 NER states.
            </p>
          </div>

          <button
            onClick={() => handleComputeRoute(startInput, destInput)}
            disabled={isComputing}
            className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isComputing ? 'animate-spin text-sky-400' : ''}`} />
            <span>Recalculate Route</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: SAFE ROUTE SEARCH FORM & PRESETS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Start Location Input */}
          <div className="flex-1">
            <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {isHi ? 'शुरुआती स्थान (NER राज्य/शहर):' : 'Start Location (NER State/City):'}
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComputeRoute(startInput, destInput); }}
                placeholder={isHi ? 'जैसे गुवाहाटी, असम' : 'e.g. Guwahati, Assam'}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Destination Input */}
          <div className="flex-1">
            <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">
              {isHi ? 'गंतव्य स्थान (NER राज्य/शहर):' : 'Destination Location (NER State/City):'}
            </label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <Navigation className="h-4 w-4 text-sky-500 mr-2 shrink-0" />
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleComputeRoute(startInput, destInput); }}
                placeholder={isHi ? 'जैसे शिलोंग, मेघालय' : 'e.g. Shillong, Meghalaya'}
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex items-end">
            <button
              onClick={() => handleComputeRoute(startInput, destInput)}
              disabled={isComputing}
              className="w-full lg:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer h-[40px]"
            >
              <Navigation className="h-4 w-4" />
              <span>{isComputing ? (isHi ? 'मार्ग की गणना हो रही है...' : 'Computing Route...') : (isHi ? 'सुरक्षित मार्ग की गणना करें' : 'Calculate Safe Route')}</span>
            </button>
          </div>

        </div>

        {/* Quick Travel Corridor Presets */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
            {isHi ? 'परीक्षण किए गए कॉरिडोर:' : 'Tested Corridors:'}
          </span>
          
          <button
            onClick={() => handleSelectPreset("Guwahati, Assam", 26.1445, 91.7362, "Shillong, Meghalaya", 25.5788, 91.8933)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Assam → Meghalaya (Guwahati to Shillong)
          </button>

          <button
            onClick={() => handleSelectPreset("Itanagar, Arunachal Pradesh", 27.0844, 93.6053, "Tawang, Arunachal Pradesh", 27.5861, 91.8504)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Arunachal Corridor (Itanagar to Tawang)
          </button>

          <button
            onClick={() => handleSelectPreset("Dimapur, Nagaland", 25.9060, 93.7270, "Imphal, Manipur", 24.8170, 93.9368)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Nagaland → Manipur (Dimapur to Imphal)
          </button>

          <button
            onClick={() => handleSelectPreset("Gangtok, Sikkim", 27.3389, 88.6065, "Mangan, Sikkim", 27.5020, 88.5342)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Sikkim Corridor (Gangtok to Mangan)
          </button>

          <button
            onClick={() => handleSelectPreset("Delhi", 28.6139, 77.2090, "Lucknow", 26.8467, 80.9462)}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/20 transition cursor-pointer"
            title="Tests boundary rejection for non-NER locations"
          >
            ⛔ Non-NER Location Test (Delhi → Lucknow)
          </button>
        </div>
      </div>

      {/* WARNING PANEL FOR DISASTER-AWARE ROUTING */}
      {routeResult?.hasDisasterWarning && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/90 p-4 shadow-xl flex items-start gap-3.5 animate-fadeIn">
          <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-black text-amber-800 dark:text-amber-200 uppercase tracking-wide">
              ⚠️ {isHi ? 'उच्च जोखिम वाला सड़क खंड मिला' : 'High-Risk Road Segment Detected'}
            </h3>
            <p className="text-xs text-amber-900 dark:text-amber-100 font-semibold mt-0.5">
              {routeResult.warningMessage || (isHi ? 'मार्ग ज्ञात भूस्खलन या बाढ़ के खतरे वाले क्षेत्र के पास से गुजरता है। वैकल्पिक ग्रीन कॉरिडोर बाईपास की सिफारिश की जाती है।' : 'Route passes near a known landslide or flood danger sector. Alternative green corridor bypass recommended.')}
            </p>
          </div>
        </div>
      )}

      {/* NON-NER REJECTION NOTICE */}
      {!routeResult?.isValidNER && routeResult?.error && (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 dark:bg-red-950/90 p-4 shadow-xl flex items-start gap-3.5 animate-fadeIn">
          <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-black text-red-700 dark:text-red-300 uppercase tracking-wide">
              {isHi ? 'भौगोलिक सीमा अस्वीकृति' : 'Geographic Boundary Rejection'}
            </h3>
            <p className="text-xs text-red-800 dark:text-red-200 font-semibold mt-0.5">
              {routeResult.warningMessage}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 3: ROUTE SUMMARY CARDS & GIS MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 5 COLUMNS: ROUTE SUMMARY CARD & RISK FACTORS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Safe Route Summary Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="h-5 w-5 text-indigo-500" />
                {isHi ? 'सुरक्षित मार्ग का सारांश' : 'SAFE ROUTE SUMMARY'}
              </h2>
              <span className={`px-3 py-0.5 rounded-full text-xs font-black uppercase border ${
                routeResult?.overallRisk === 'CRITICAL' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40' :
                routeResult?.overallRisk === 'HIGH' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40' :
                routeResult?.overallRisk === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/40' :
                routeResult?.overallRisk === 'UNRELIABLE' ? 'bg-slate-500/20 text-slate-500 border-slate-500/40' :
                'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
              }`}>
                {routeResult?.overallRisk === 'UNRELIABLE' ? 'Risk cannot be reliably determined' : `${routeResult?.overallRisk || 'LOW'} RISK`}
              </span>
            </div>

            {/* Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Distance</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {routeResult?.distanceKm ? `${routeResult.distanceKm} km` : '0 km'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Estimated Time</span>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1">
                  {routeResult?.durationMinutes ? `${routeResult.durationMinutes} mins` : '0 mins'}
                </div>
              </div>
            </div>

            {/* Major Risk Factors */}
            <div className="bg-slate-50 dark:bg-slate-950/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Major Risk Factors
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-semibold">
                {routeResult?.riskFactors && routeResult.riskFactors.length > 0 ? (
                  routeResult.riskFactors.map((rf, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-sky-500 font-bold shrink-0">&bull;</span>
                      <span>{rf}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-slate-400">Risk cannot be reliably determined</li>
                )}
              </ul>
            </div>

            {/* Data Source & Last Updated Section */}
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-1">
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <b className="text-slate-900 dark:text-white">{routeResult?.lastUpdated || 'Just Now'}</b>
              </div>
              <div className="flex justify-between">
                <span>Data Sources:</span>
                <b className="text-sky-500">{routeResult?.dataSources.join(', ') || 'OSRM & Open-Meteo'}</b>
              </div>
            </div>

          </div>

          {/* Quick Tactical Navigation Buttons */}
          <div className="flex flex-wrap gap-2">
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex-1 p-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <MapPin className="h-4 w-4" />
                <span>Full GIS Map</span>
              </button>
            )}

            {onTriggerSOS && (
              <button
                onClick={onTriggerSOS}
                className="flex-1 p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Radio className="h-4 w-4" />
                <span>Trigger SOS Alert</span>
              </button>
            )}
          </div>

        </div>

        {/* RIGHT 7 COLUMNS: INTERACTIVE GIS MAP & HIGHWAY STATUS LAYER */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" />
              <span>NER Road Accessibility &amp; OSRM Corridor GIS Map</span>
            </h2>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
              8 NER States Network
            </span>
          </div>

          <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative group">
            <div ref={mapRef} className="w-full h-full z-10" />

            {/* Floating Active Route Corridor Badge (Top Left) */}
            {routeResult && routeResult.geometry && routeResult.geometry.length > 0 && (
              <div className="absolute top-3 left-3 z-[1000] pointer-events-auto flex items-center gap-2 max-w-[calc(100%-180px)]">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white shadow-xl min-w-0">
                  <span className={`h-2 w-2 rounded-full ${routeResult.hasDisasterWarning ? 'bg-amber-500' : 'bg-emerald-500'} animate-ping shrink-0`} />
                  <span className="truncate">
                    {routeResult.startLocation} ➔ {routeResult.destLocation}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600 font-bold shrink-0">•</span>
                  <span className="text-sky-600 dark:text-sky-400 font-mono shrink-0">{routeResult.distanceKm} km</span>
                  <span className="text-slate-400 dark:text-slate-600 font-bold shrink-0 hidden sm:inline">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0 hidden sm:inline">{routeResult.durationMinutes}m</span>
                </div>
              </div>
            )}

            {/* Floating Tactical Map HUD Controls (Top Right) */}
            <div className="absolute top-3 right-3 z-[1000] pointer-events-auto flex items-center gap-1.5">
              {/* Zoom to Route Focus Button */}
              {routeResult && routeResult.geometry && routeResult.geometry.length > 0 && (
                <button
                  type="button"
                  onClick={fitRouteBounds}
                  className="px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-700/60 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Zoom in clearly to full route corridor"
                >
                  <Compass className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="hidden sm:inline">Zoom Route</span>
                </button>
              )}

              {/* Map Style Switcher (Satellite vs Streets) */}
              <button
                type="button"
                onClick={() => setMapStyle(mapStyle === 'satellite' ? 'streets' : 'satellite')}
                className="px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-950/90 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-700/60 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-xl transition cursor-pointer"
                title="Toggle Base Map Style (Satellite / Streets)"
              >
                {mapStyle === 'satellite' ? '🛰️ Satellite' : '🗺️ Streets'}
              </button>

              {/* Toggle Highway Badges */}
              <button
                type="button"
                onClick={() => setShowHighways(!showHighways)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold backdrop-blur-md shadow-xl transition cursor-pointer flex items-center gap-1 ${
                  showHighways
                    ? 'bg-sky-600 border-sky-400 text-white'
                    : 'bg-white/95 dark:bg-slate-950/90 border-slate-200/90 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Toggle Highway Status Markers on Map"
              >
                <span>🛣️ Highways</span>
              </button>

              {/* Interactive Zoom Buttons (+ / -) */}
              <div className="flex items-center rounded-xl bg-white/95 dark:bg-slate-950/90 border border-slate-200/90 dark:border-slate-700/60 overflow-hidden shadow-xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomIn()}
                  className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-extrabold text-xs"
                  title="Zoom In"
                >
                  +
                </button>
                <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-700" />
                <button
                  type="button"
                  onClick={() => mapInstanceRef.current?.zoomOut()}
                  className="px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer font-extrabold text-xs"
                  title="Zoom Out"
                >
                  -
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
