import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../i18n";
import {
  Mountain,
  MapPin,
  AlertTriangle,
  Compass,
  Zap,
  Navigation,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Radio,
  Droplets,
  ShieldCheck,
  Search,
  Globe,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Thermometer,
  Wind,
  Check,
  Info
} from "lucide-react";
import {
  getNERLandslideTelemetry,
  NER_LANDSLIDE_MASTER_RECORDS,
  EvaluatedLandslideSector,
  LandslideTelemetrySummary,
  LandslideLocationRecord
} from "../services/api/landslideService";
import { isPointInNER } from "../utils/nerBoundary";

interface LandslideRiskIntelligenceProps {
  onNavigateToMap?: () => void;
  onNavigateToReroute?: (corridor?: string) => void;
  onTriggerSOS?: () => void;
}

const NER_STATES_LIST = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
] as const;

export default function LandslideRiskIntelligence({
  onNavigateToMap,
  onNavigateToReroute,
  onTriggerSOS
}: LandslideRiskIntelligenceProps) {
  const { t } = useTranslation();

  // Filters State
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);

  // Data State
  const [telemetry, setTelemetry] = useState<LandslideTelemetrySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const circlesGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Load Telemetry
  const loadTelemetry = async () => {
    setIsLoading(true);
    try {
      const data = await getNERLandslideTelemetry(selectedState, selectedDistrict);
      setTelemetry(data);
      if (data.sectors.length > 0 && !selectedSectorId) {
        setSelectedSectorId(data.sectors[0].record.id);
      }
    } catch (err) {
      console.error("Error loading landslide telemetry:", err);
      setTelemetry(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [selectedState, selectedDistrict]);

  // Filter Sectors by Search Query & Geographic Boundary Check
  const getFilteredSectors = (): EvaluatedLandslideSector[] => {
    if (!telemetry || !Array.isArray(telemetry.sectors)) return [];

    let sectors = telemetry.sectors.filter(s => isPointInNER(s.record.lat, s.record.lon));

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      sectors = sectors.filter(s =>
        s.record.locationName.toLowerCase().includes(q) ||
        s.record.district.toLowerCase().includes(q) ||
        s.record.state.toLowerCase().includes(q) ||
        s.record.primaryHighway.toLowerCase().includes(q)
      );
    }

    return sectors;
  };

  const activeSectors = getFilteredSectors();
  const currentSector = activeSectors.find(s => s.record.id === selectedSectorId) || activeSectors[0];

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

    L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
      maxZoom: 18,
      attribution: "© Google Maps &bull; Jeevan Setu NER Landslide GIS"
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    circlesGroupRef.current = L.layerGroup().addTo(map);

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

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers on Active Sectors Change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !circlesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    circlesGroupRef.current.clearLayers();

    activeSectors.forEach((sec) => {
      const color = sec.riskLevel === 'CRITICAL' ? '#ef4444' :
                    sec.riskLevel === 'HIGH' ? '#f97316' :
                    sec.riskLevel === 'MODERATE' ? '#eab308' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-landslide-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${color}; opacity: 0.8; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 12px ${color}; z-index: 10; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
              ⛰️
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([sec.record.lat, sec.record.lon], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 900; font-size: 10px;">
              ${sec.riskLevel} RISK (LHI: ${sec.calculatedScore})
            </span>
            <span style="font-size: 10px; color: #64748b; font-weight: 700;">${sec.record.district}, ${sec.record.state}</span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
            ${sec.record.locationName}
          </div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 6px;">
            🛣️ ${sec.record.primaryHighway} &bull; ${sec.record.roadStatus}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-family: monospace; font-size: 11px;">
            <div>Slope Gradient: <b>${sec.record.slopeDegrees}°</b> | Altitude: <b>${sec.record.elevationMeters}m</b></div>
            <div>Rain Rate: <b>${sec.weather.precipitation} mm/h</b> | Temp: <b>${sec.weather.temperature}°C</b></div>
          </div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedSectorId(sec.record.id);
      });

      markersGroupRef.current.addLayer(marker);

      if (sec.riskLevel === 'CRITICAL' || sec.riskLevel === 'HIGH') {
        const circle = L.circle([sec.record.lat, sec.record.lon], {
          radius: sec.riskLevel === 'CRITICAL' ? 10000 : 6000,
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5
        });
        circlesGroupRef.current.addLayer(circle);
      }
    });

    if (activeSectors.length > 0) {
      const bounds = L.latLngBounds(activeSectors.map(s => [s.record.lat, s.record.lon]));
      mapInstanceRef.current.flyToBounds(bounds, { maxZoom: 10, duration: 1.2 });
    }
  }, [activeSectors]);

  return (
    <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* SECTION 1: HEADER BAR & COVERAGE BADGES */}
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
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5 border border-indigo-500/30">
                <Activity className="h-3.5 w-3.5 text-indigo-400" />
                {currentSector?.dataStatus || 'MODELLED / RISK ESTIMATE'}
              </span>
            </div>

            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
              <span>⛰️</span> Landslide Risk Intelligence &amp; Slope Stability Command
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Multi-criteria evaluation (MCE) landslide hazard indexing, live precipitation correlation, slope gradient analysis, and highway accessibility telemetry scoped strictly to the 8 NER states.
            </p>
          </div>

          {/* Search & Refresh Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus-within:border-sky-500 min-w-[220px]">
              <Search className="h-3.5 w-3.5 text-sky-500 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="Search Sector or Highway..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
              />
            </div>

            <button
              onClick={loadTelemetry}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: LOCATION FILTER (STATE → DISTRICT) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        
        {/* State Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">State:</span>
          <button
            onClick={() => { setSelectedState("all"); setSelectedDistrict("all"); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
              selectedState === "all"
                ? "bg-sky-600 text-white border-sky-400 shadow-md scale-[1.03]"
                : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            All 8 NER States
          </button>
          {NER_STATES_LIST.map((st) => (
            <button
              key={st}
              onClick={() => { setSelectedState(st); setSelectedDistrict("all"); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                selectedState === st
                  ? "bg-sky-600 text-white border-sky-400 shadow-md scale-[1.03]"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sector Selection Dropdown */}
        {currentSector && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sector:</span>
            <select
              value={currentSector.record.id}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 shadow-sm"
            >
              {activeSectors.map((sec) => (
                <option key={sec.record.id} value={sec.record.id}>
                  {sec.record.locationName} ({sec.record.district})
                </option>
              ))}
            </select>
          </div>
        )}

      </div>

      {/* SECTION 3: 6 PROFESSIONAL DASHBOARD CARDS FOR SELECTED SECTOR */}
      {currentSector ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          
          {/* Card 1: Current Risk Level */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Risk</span>
              <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center font-bold">
                <Mountain className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black font-mono ${
                currentSector.riskLevel === 'CRITICAL' ? 'text-red-600 dark:text-red-400' :
                currentSector.riskLevel === 'HIGH' ? 'text-amber-600 dark:text-amber-400' :
                currentSector.riskLevel === 'MODERATE' ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {currentSector.riskLevel}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                LHI Score: <b className="text-slate-900 dark:text-white">{currentSector.calculatedScore} / 100</b>
              </div>
            </div>
          </div>

          {/* Card 2: Rainfall & Precipitation */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rainfall</span>
              <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold">
                <Droplets className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {currentSector.weather.isLive ? `${currentSector.weather.precipitation} mm/h` : 'Data unavailable'}
              </div>
              <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate" title={currentSector.weather.condition}>
                {currentSector.weather.condition}
              </div>
            </div>
          </div>

          {/* Card 3: Slope & Risk Factors */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Slope &amp; Elevation</span>
              <div className="h-8 w-8 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-500 flex items-center justify-center font-bold">
                <Compass className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {currentSector.record.slopeDegrees}° Slope
              </div>
              <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                Elevation: {currentSector.record.elevationMeters}m MSL
              </div>
            </div>
          </div>

          {/* Card 4: Road Risk & Highway Status */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Road Status</span>
              <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
                <Navigation className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-lg font-black tracking-tight ${
                currentSector.record.roadStatus === 'Blocked' ? 'text-red-600 dark:text-red-400' :
                currentSector.record.roadStatus === 'Partially Blocked' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {currentSector.record.roadStatus}
              </div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate" title={currentSector.record.primaryHighway}>
                {currentSector.record.primaryHighway}
              </div>
            </div>
          </div>

          {/* Card 5: Data Source */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Source</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 flex items-center justify-center font-bold">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                Open-Meteo &amp; ISRO GIS
              </div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {currentSector.dataStatus}
              </div>
            </div>
          </div>

          {/* Card 6: Last Updated */}
          <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Updated</span>
              <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-500 flex items-center justify-center font-bold">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {currentSector.lastUpdatedTime}
              </div>
              <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                Real-time Sync
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-white dark:bg-[#070d1e] rounded-2xl border border-slate-200 dark:border-slate-800">
          Data temporarily unavailable for selected location.
        </div>
      )}

      {/* SECTION 4: GIS MAP & SAFETY GUIDANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 7 COLUMNS: LANDSLIDE GIS MAP */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" />
              <span>NER Slope Stability &amp; Landslide GIS Map</span>
            </h2>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
              {activeSectors.length} Sectors Mapped
            </span>
          </div>

          <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative">
            <div ref={mapRef} className="w-full h-full z-10" />
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: SAFETY GUIDANCE & MCE RISK FACTORS */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <span>Safety Information &amp; Practical Guidance</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                {currentSector?.record.district}, {currentSector?.record.state}
              </span>
            </div>

            {currentSector ? (
              <div className="mt-3 space-y-4">
                
                {/* Contributing Risk Factors */}
                <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    <span>Contributing Risk Factors</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1 font-medium">
                    {currentSector.hazardAssessment.contributingFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{factor}</span>
                      </li>
                    ))}
                    {currentSector.hazardAssessment.contributingFactors.length === 0 && (
                      <li className="text-emerald-500 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" /> Nominal slope conditions detected.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Practical Safety Bulletins */}
                <div className="bg-amber-500/10 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-500/30 space-y-2">
                  <div className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="h-4 w-4 text-amber-500" />
                    <span>Official Safety Protocols</span>
                  </div>
                  <div className="space-y-2 text-xs text-amber-900 dark:text-amber-200">
                    {currentSector.safetyGuidance.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold shrink-0">&bull;</span>
                        <span className="font-semibold">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                Select a location to view safety guidance.
              </div>
            )}
          </div>

          {/* Tactical Action Buttons */}
          <div className="pt-2 flex flex-wrap gap-2">
            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="flex-1 p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Full Map</span>
              </button>
            )}

            {onNavigateToReroute && (
              <button
                onClick={() => onNavigateToReroute(currentSector?.record.primaryHighway)}
                className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="h-3.5 w-3.5 text-emerald-500" />
                <span>Reroute</span>
              </button>
            )}

            {onTriggerSOS && (
              <button
                onClick={onTriggerSOS}
                className="flex-1 p-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Radio className="h-3.5 w-3.5" />
                <span>SOS Alert</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
