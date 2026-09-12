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
import { isPointInNER, NER_BOUNDS } from "../utils/nerBoundary";

interface RoadAccessibilityModuleProps {
  onNavigateToMap?: () => void;
  onTriggerSOS?: () => void;
}

export default function RoadAccessibilityModule({
  onNavigateToMap,
  onTriggerSOS
}: RoadAccessibilityModuleProps) {
  const { t } = useTranslation();

  // Search Inputs
  const [startInput, setStartInput] = useState<string>("Guwahati, Assam");
  const [startCoords, setStartCoords] = useState<[number, number]>([26.1445, 91.7362]);
  const [destInput, setDestInput] = useState<string>("Shillong, Meghalaya");
  const [destCoords, setDestCoords] = useState<[number, number]>([25.5788, 91.8933]);

  // Route Calculation State
  const [routeResult, setRouteResult] = useState<SafeRouteResult | null>(null);
  const [isComputing, setIsComputing] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Compute Route
  const handleComputeRoute = async (sName: string, sLat: number, sLon: number, dName: string, dLat: number, dLon: number) => {
    setIsComputing(true);
    setStatusToast(`📡 Computing OSRM Safe Green Corridor from ${sName} to ${dName}...`);

    try {
      const res = await calculateSafeNERRoute({
        startName: sName,
        startLat: sLat,
        startLon: sLon,
        destName: dName,
        destLat: dLat,
        destLon: dLon
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
    handleComputeRoute(startInput, startCoords[0], startCoords[1], destInput, destCoords[0], destCoords[1]);
  }, []);

  // Preset Corridor Selection Handlers
  const handleSelectPreset = (sName: string, sLat: number, sLon: number, dName: string, dLat: number, dLon: number) => {
    setStartInput(sName);
    setStartCoords([sLat, sLon]);
    setDestInput(dName);
    setDestCoords([dLat, dLon]);
    handleComputeRoute(sName, sLat, sLon, dName, dLat, dLon);
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

    L.tileLayer("https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 18,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: "© Google Maps &bull; Jeevan Setu NER Safe Route GIS"
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);

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

  // Update Route Polyline & Markers on map when routeResult updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routePolylineRef.current) {
      mapInstanceRef.current.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (routeResult && routeResult.geometry.length > 0) {
      const color = routeResult.hasDisasterWarning ? '#f97316' : '#10b981';
      const polyline = L.polyline(routeResult.geometry, {
        color: color,
        weight: 5,
        opacity: 0.85,
        dashArray: routeResult.hasDisasterWarning ? '8, 8' : undefined
      }).addTo(mapInstanceRef.current);

      routePolylineRef.current = polyline;

      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40], duration: 1.2 });
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
            onClick={() => handleComputeRoute(startInput, startCoords[0], startCoords[1], destInput, destCoords[0], destCoords[1])}
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
            <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Start Location (NER State/City):</label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <MapPin className="h-4 w-4 text-emerald-500 mr-2 shrink-0" />
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                placeholder="e.g. Guwahati, Assam"
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Destination Input */}
          <div className="flex-1">
            <label className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-1">Destination Location (NER State/City):</label>
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white">
              <Navigation className="h-4 w-4 text-sky-500 mr-2 shrink-0" />
              <input
                type="text"
                value={destInput}
                onChange={(e) => setDestInput(e.target.value)}
                placeholder="e.g. Shillong, Meghalaya"
                className="w-full bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <div className="flex items-end">
            <button
              onClick={() => handleComputeRoute(startInput, startCoords[0], startCoords[1], destInput, destCoords[0], destCoords[1])}
              disabled={isComputing}
              className="w-full lg:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer h-[40px]"
            >
              <Navigation className="h-4 w-4" />
              <span>{isComputing ? 'Computing Route...' : 'Calculate Safe Route'}</span>
            </button>
          </div>

        </div>

        {/* Quick Travel Corridor Presets */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Tested Corridors:</span>
          
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
              ⚠️ High-Risk Road Segment Detected
            </h3>
            <p className="text-xs text-amber-900 dark:text-amber-100 font-semibold mt-0.5">
              {routeResult.warningMessage || "Route passes near a known landslide or flood danger sector. Alternative green corridor bypass recommended."}
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
              Geographic Boundary Rejection
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
                <span>SAFE ROUTE SUMMARY</span>
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

          <div className="w-full h-[460px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative">
            <div ref={mapRef} className="w-full h-full z-10" />
          </div>
        </div>

      </div>

    </div>
  );
}
