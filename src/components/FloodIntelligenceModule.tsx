import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "../i18n";
import {
  Waves,
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
  Sliders,
  ChevronDown
} from "lucide-react";
import {
  getNERFloodTelemetry,
  FloodReportItem,
  FloodTelemetrySummary,
  FloodRiskLevel
} from "../services/api/floodService";
import { isPointInNER, NER_STATES, MASTER_NER_POLYGON, NER_COVERAGE_LABEL } from "../utils/nerBoundary";
import { SearchSpellingCorrectionPrompt } from "./SearchSpellingCorrectionPrompt";

interface FloodIntelligenceModuleProps {
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

export default function FloodIntelligenceModule({
  onNavigateToMap,
  onNavigateToReroute,
  onTriggerSOS
}: FloodIntelligenceModuleProps) {
  const { t } = useTranslation();

  // Filters State
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [selectedBasin, setSelectedBasin] = useState<string>("all");

  // Data & Loading State
  const [telemetry, setTelemetry] = useState<FloodTelemetrySummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup>(L.layerGroup());
  const circlesGroupRef = useRef<L.LayerGroup>(L.layerGroup());

  // Fetch Telemetry
  const loadTelemetry = async () => {
    setIsLoading(true);
    try {
      const data = await getNERFloodTelemetry(selectedState, selectedDistrict, selectedBasin);
      setTelemetry(data);
    } catch (err) {
      console.error("Error loading flood telemetry:", err);
      setTelemetry(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, [selectedState, selectedDistrict, selectedBasin]);

  // Filter Reports by Search Query & Geographic NER Boundary
  const getFilteredReports = (): FloodReportItem[] => {
    if (!telemetry || !Array.isArray(telemetry.reports)) return [];
    
    // Strict NER boundary filtering
    let reports = telemetry.reports.filter(r => isPointInNER(r.lat, r.lon));

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      reports = reports.filter(r =>
        r.locationName.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q) ||
        r.riverBasin.toLowerCase().includes(q)
      );
    }

    return reports;
  };

  const activeReports = getFilteredReports();

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
      attribution: "© Google Maps &bull; Jeevan Setu NER Flood GIS"
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

  // Update Markers when activeReports change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !circlesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    circlesGroupRef.current.clearLayers();

    activeReports.forEach((rep) => {
      const color = rep.riskLevel === 'CRITICAL' ? '#ef4444' :
                    rep.riskLevel === 'HIGH' ? '#f97316' :
                    rep.riskLevel === 'MODERATE' ? '#eab308' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-flood-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; cursor: pointer;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${color}; opacity: 0.8; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${color}; border: 2px solid #ffffff; box-shadow: 0 0 12px ${color}; z-index: 10; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 11px;">
              🌊
            </div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([rep.lat, rep.lon], { icon: customIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #0f172a; min-width: 240px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 900; font-size: 10px;">
              ${rep.riskLevel} RISK
            </span>
            <span style="font-size: 10px; color: #64748b; font-weight: 700;">${rep.district}, ${rep.state}</span>
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
            ${rep.locationName}
          </div>
          <div style="font-size: 11px; color: #0284c7; font-weight: 700; margin-bottom: 6px;">
            🌊 ${rep.riverBasin}
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px; margin-bottom: 6px; font-family: monospace; font-size: 11px;">
            <div>Water Level: <b>${rep.waterLevelMeters} m</b> (Danger: ${rep.dangerLevelMeters} m)</div>
            <div>Discharge: <b>${rep.flowRateCumec} cumec</b></div>
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.3;">
            ${rep.statusSummary}
          </div>
        </div>
      `);

      markersGroupRef.current.addLayer(marker);

      // Buffer circle around critical zones
      if (rep.riskLevel === 'CRITICAL' || rep.riskLevel === 'HIGH') {
        const circle = L.circle([rep.lat, rep.lon], {
          radius: rep.riskLevel === 'CRITICAL' ? 12000 : 8000,
          color: color,
          fillColor: color,
          fillOpacity: 0.12,
          weight: 1.5
        });
        circlesGroupRef.current.addLayer(circle);
      }
    });

    if (activeReports.length > 0) {
      const bounds = L.latLngBounds(activeReports.map(r => [r.lat, r.lon]));
      mapInstanceRef.current.flyToBounds(bounds, { maxZoom: 10, duration: 1.2 });
    }
  }, [activeReports]);

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

              {/* Status Indicator */}
              {telemetry?.isLive ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  Live River Telemetry Active
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/20 px-3 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 border border-amber-500/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                  Live flood data unavailable
                </span>
              )}
            </div>

            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
              <span>🌊</span> North Eastern Region (NER) Flood Intelligence &amp; River Basin Command
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Real-time river level gauges, danger mark overtopping watch, discharge telemetry, and flood vulnerability mapping scoped strictly to the 8 North Eastern Region states.
            </p>
          </div>

          {/* Search & Refresh Bar */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus-within:border-sky-500 min-w-[220px]">
                <Search className="h-3.5 w-3.5 text-sky-500 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search River or District..."
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

            <SearchSpellingCorrectionPrompt
              query={searchQuery}
              onSelectSuggestion={(suggestedText) => setSearchQuery(suggestedText)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: SITUATION SUMMARY CARDS (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Monitored Flood Sectors */}
        <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monitored Sectors</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-500 flex items-center justify-center">
              <Waves className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{activeReports.length}</div>
            <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">8 NER States Coverage</div>
          </div>
        </div>

        {/* Card 2: Critical Flood Danger Zones */}
        <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-red-900/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Critical Danger Zones</span>
            <div className="h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center font-bold">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
              {activeReports.filter(r => r.riskLevel === 'CRITICAL').length}
            </div>
            <div className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-0.5">Danger level overtopped</div>
          </div>
        </div>

        {/* Card 3: High Risk Basins */}
        <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-amber-900/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Risk Basins</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {activeReports.filter(r => r.riskLevel === 'HIGH').length}
            </div>
            <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">Warning mark approaching</div>
          </div>
        </div>

        {/* Card 4: Total Estimated Affected Population */}
        <div className="bg-white dark:bg-[#070d1e] border border-slate-200 dark:border-emerald-900/40 p-4 rounded-2xl shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Affected Population</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {activeReports.reduce((acc, curr) => acc + curr.affectedPopEstimate, 0).toLocaleString()}
            </div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Shelter triage ready</div>
          </div>
        </div>

      </div>

      {/* SECTION 3: HIERARCHICAL STATE / DISTRICT / BASIN FILTERING BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        
        {/* State Selection Buttons */}
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

        {/* River Basin Dropdown Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">River Basin:</span>
          <select
            value={selectedBasin}
            onChange={(e) => setSelectedBasin(e.target.value)}
            className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 shadow-sm"
          >
            <option value="all">All River Basins</option>
            <option value="brahmaputra">Brahmaputra Basin</option>
            <option value="teesta">Teesta River Basin</option>
            <option value="barak">Barak River Basin</option>
            <option value="imphal">Imphal River Basin</option>
            <option value="kopili">Kopili River Basin</option>
            <option value="subansiri">Subansiri Basin</option>
            <option value="gumti">Gumti River Basin</option>
            <option value="dhansiri">Dhansiri River Basin</option>
          </select>
        </div>

      </div>

      {/* SECTION 4: MAP & TELEMETRY LIST GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT 7 COLUMNS: INTERACTIVE GIS MAP */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl flex flex-col space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500" />
              <span>NER Flood Vulnerability &amp; Water-Body GIS Map</span>
            </h2>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
              {activeReports.length} Sectors Mapped
            </span>
          </div>

          <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative">
            <div ref={mapRef} className="w-full h-full z-10" />
          </div>
        </div>

        {/* RIGHT 5 COLUMNS: DETAILED FLOOD REPORT LIST */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Waves className="h-4 w-4 text-blue-500" />
                <span>River Gauge Telemetry</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                Updated {telemetry?.lastUpdatedTime || 'Just Now'}
              </span>
            </div>

            <div className="mt-3 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {activeReports.length > 0 ? (
                activeReports.map((rep) => {
                  const isOverDanger = rep.waterLevelMeters >= rep.dangerLevelMeters;
                  return (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 hover:border-sky-500/50 transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 font-mono uppercase block">
                            {rep.riverBasin}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                            {rep.locationName}
                          </h4>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            {rep.district}, {rep.state}
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                          rep.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' :
                          rep.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' :
                          rep.riskLevel === 'MODERATE' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30' :
                          'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        }`}>
                          {rep.riskLevel}
                        </span>
                      </div>

                      {/* Water Level Gauge Bar */}
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600 dark:text-slate-400">Current Level: <b className={isOverDanger ? "text-red-500 font-bold" : "text-slate-900 dark:text-white"}>{rep.waterLevelMeters} m</b></span>
                          <span className="text-slate-500 dark:text-slate-400">Danger: <b>{rep.dangerLevelMeters} m</b></span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isOverDanger ? 'bg-red-500' : 'bg-sky-500'}`}
                            style={{ width: `${Math.min(100, (rep.waterLevelMeters / rep.dangerLevelMeters) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span>Discharge: <b className="text-slate-900 dark:text-white">{rep.flowRateCumec} cumec</b></span>
                          <span>Est. Affected: <b className="text-slate-900 dark:text-white">{rep.affectedPopEstimate.toLocaleString()}</b></span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                        {rep.statusSummary}
                      </p>

                      <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-800/60">
                        <span>Source: {rep.source}</span>
                        <span>{rep.lastUpdatedTime}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                  No flood hazard reports matching selected filters.
                </div>
              )}
            </div>
          </div>

          {/* Quick Tactical Navigation Buttons */}
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
                onClick={() => onNavigateToReroute("Brahmaputra Bypass Corridor")}
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
