import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  MapPin,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Navigation,
  ShieldAlert,
  Mountain,
  Waves,
  CloudRain,
  Flame,
  Activity,
  CheckCircle2,
  Clock,
  Phone,
  Camera,
  ExternalLink,
  Layers,
  Info,
  ShieldCheck,
  Building2,
  X
} from 'lucide-react';
import L from 'leaflet';
import {
  getNERDisasterIncidents,
  submitCitizenDisasterReport,
  DisasterIncidentRecord,
  IncidentType,
  SeverityLevel,
  IncidentStatus,
  IncidentsSummaryMetrics,
  NER_DISTRICTS_BY_STATE
} from '../services/api/disasterIncidentsService';
import { isPointInNER, NER_STATES, NERStateName, MASTER_NER_POLYGON, NER_COVERAGE_LABEL } from '../utils/nerBoundary';
import { calculateSafeNERRoute } from '../services/api/roadAccessibilityService';

interface DisasterIncidentsModuleProps {
  onNavigateToMap?: () => void;
  onNavigateToReroute?: (origin: string, dest: string) => void;
  onNavigateToFlood?: () => void;
  onNavigateToLandslide?: () => void;
  onTriggerSOS?: () => void;
}

const DISASTER_TYPES: Array<IncidentType | 'All'> = [
  'All',
  'Flood',
  'Landslide',
  'Heavy Rain',
  'Storm/Cyclone',
  'Road Block',
  'Earthquake',
  'Other Disaster'
];

export default function DisasterIncidentsModule({
  onNavigateToMap,
  onNavigateToReroute,
  onNavigateToFlood,
  onNavigateToLandslide,
  onTriggerSOS
}: DisasterIncidentsModuleProps) {
  // View Toggle: 'map' | 'list'
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Filters State
  const [selectedType, setSelectedType] = useState<IncidentType | 'All'>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Location search check
  const [isSearchOutsideNER, setIsSearchOutsideNER] = useState(false);

  // Data & Metrics State
  const [incidents, setIncidents] = useState<DisasterIncidentRecord[]>([]);
  const [metrics, setMetrics] = useState<IncidentsSummaryMetrics>({
    totalIncidents: 0,
    activeIncidents: 0,
    highCriticalIncidents: 0,
    floodIncidents: 0,
    landslideIncidents: 0,
    roadBlockIncidents: 0,
    unverifiedReportsCount: 0
  });
  const [selectedIncident, setSelectedIncident] = useState<DisasterIncidentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<IncidentType>('Flood');
  const [reportState, setReportState] = useState<NERStateName>('Assam');
  const [reportDistrict, setReportDistrict] = useState<string>('Kamrup Metropolitan');
  const [reportLocation, setReportLocation] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportContact, setReportContact] = useState<string>('');
  const [reportLat, setReportLat] = useState<string>('26.1445');
  const [reportLon, setReportLon] = useState<string>('91.7362');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Route calculation warning
  const [routeWarning, setRouteWarning] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Load Incidents Telemetry & Reports
  const loadIncidents = async () => {
    setLoading(true);
    setErrorNotice(null);

    // Validate search query for non-NER locations
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nonNERKeywords = ['delhi', 'mumbai', 'kanpur', 'lucknow', 'up', 'uttar pradesh', 'bihar', 'kolkata', 'maharashtra'];
      if (nonNERKeywords.some(k => q === k || q.includes(k))) {
        setIsSearchOutsideNER(true);
        setIncidents([]);
        setLoading(false);
        return;
      }
    }

    setIsSearchOutsideNER(false);

    try {
      const res = await getNERDisasterIncidents({
        disasterType: selectedType,
        state: selectedState,
        district: selectedDistrict,
        severity: selectedSeverity,
        status: selectedStatus,
        searchQuery: searchQuery
      });

      if (!res.success) {
        setErrorNotice(res.errorMessage || 'Disaster incident data temporarily unavailable.');
        setIncidents([]);
      } else {
        setIncidents(res.incidents);
        setMetrics(res.metrics);

        if (res.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(res.incidents[0]);
        }
      }
    } catch (e) {
      setErrorNotice('Disaster incident data temporarily unavailable.');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedType, selectedState, selectedDistrict, selectedSeverity, selectedStatus, searchQuery]);

  // Handle District reset when State changes
  useEffect(() => {
    setSelectedDistrict('All');
    if (selectedState !== 'All' && NER_STATES.includes(selectedState as NERStateName)) {
      setReportState(selectedState as NERStateName);
      setReportDistrict(NER_DISTRICTS_BY_STATE[selectedState as NERStateName]?.[0] || 'Regional Sector');
    }
  }, [selectedState]);

  // Leaflet GIS Map Init & Marker Rendering
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([25.8, 92.5], 7);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Jeevan Setu Incident Intelligence &bull; Esri Dark Canvas'
      }).addTo(map);

      // Render Master 8-State NER Boundary Polygon
      const polygonCoords: L.LatLngExpression[] = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon]);
      L.polygon(polygonCoords, {
        color: '#0284c7',
        weight: 2,
        fillColor: '#38bdf8',
        fillOpacity: 0.08,
        dashArray: '5, 5'
      }).addTo(map).bindPopup('<b>📍 North Eastern Region (8 States Boundary)</b>');

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
    }

    const markers = markersGroupRef.current;
    if (!markers) return;

    incidents.forEach(inc => {
      if (!isPointInNER(inc.lat, inc.lon)) return;

      let color = '#ef4444';
      if (inc.severity === 'HIGH') color = '#f97316';
      if (inc.severity === 'MODERATE') color = '#eab308';
      if (inc.severity === 'LOW') color = '#10b981';

      let symbol = '⚠️';
      if (inc.type === 'Flood') symbol = '🌊';
      if (inc.type === 'Landslide') symbol = '⛰️';
      if (inc.type === 'Heavy Rain') symbol = '🌧️';
      if (inc.type === 'Storm/Cyclone') symbol = '🌪️';
      if (inc.type === 'Road Block') symbol = '🚧';
      if (inc.type === 'Earthquake') symbol = '🌋';

      const isSelected = selectedIncident && selectedIncident.id === inc.id;

      const customIcon = L.divIcon({
        className: 'custom-incident-marker',
        html: `
          <div style="
            background: ${color};
            color: #ffffff;
            width: ${isSelected ? '34px' : '28px'};
            height: ${isSelected ? '34px' : '28px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '16px' : '13px'};
            border: ${isSelected ? '3px solid #ffffff' : '2px solid #ffffff'};
            box-shadow: ${isSelected ? `0 0 16px ${color}` : '0 2px 6px rgba(0,0,0,0.4)'};
            transition: all 0.2s ease;
          ">
            ${symbol}
          </div>
        `,
        iconSize: [isSelected ? 34 : 28, isSelected ? 34 : 28],
        iconAnchor: [isSelected ? 17 : 14, isSelected ? 17 : 14]
      });

      const marker = L.marker([inc.lat, inc.lon], { icon: customIcon });

      marker.on('click', () => {
        setSelectedIncident(inc);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 190px;">
          <b style="color: #0f172a; font-size: 13px;">${symbol} ${inc.type}: ${inc.locationName}</b><br/>
          <span>State: <b>${inc.state}</b> &bull; District: <b>${inc.district}</b></span><br/>
          <span>Severity: <b style="color:${color};">${inc.severity}</b> &bull; Status: <b>${inc.status}</b></span><br/>
          <span style="color:#64748b; font-size:11px;">Source: <b>${inc.source}</b></span>
        </div>
      `);

      markers.addLayer(marker);
    });

    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [incidents, selectedIncident, viewMode]);

  // Focus Map on Selected Incident
  const handleFocusIncidentOnMap = (inc: DisasterIncidentRecord) => {
    setSelectedIncident(inc);
    setViewMode('map');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([inc.lat, inc.lon], 11, { animate: true });
    }
  };

  // Safe Route Navigation Integration
  const handleCheckSafeRoute = async (inc: DisasterIncidentRecord) => {
    setIsCalculatingRoute(true);
    setRouteWarning(null);

    try {
      const res = await calculateSafeNERRoute({
        startLat: 26.1445, // Guwahati default
        startLon: 91.7362,
        destLat: inc.lat,
        destLon: inc.lon,
        startName: 'Guwahati Command Hub',
        destName: inc.locationName
      });

      if (!res.isValidNER || res.error) {
        setRouteWarning(res.error || 'Route data temporarily unavailable.');
      } else {
        if (res.hasDisasterWarning && res.warningMessage) {
          setRouteWarning(res.warningMessage);
        }
        if (onNavigateToReroute) {
          onNavigateToReroute('Guwahati Command Hub', inc.locationName);
        }
      }
    } catch (e) {
      setRouteWarning('Route data temporarily unavailable.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Submit User Disaster Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    setReportFeedback(null);

    const lat = Number(reportLat);
    const lon = Number(reportLon);

    const res = await submitCitizenDisasterReport({
      disasterType: reportType,
      state: reportState,
      district: reportDistrict,
      locationName: reportLocation || `${reportDistrict}, ${reportState}`,
      description: reportDescription,
      lat: !isNaN(lat) ? lat : undefined,
      lon: !isNaN(lon) ? lon : undefined,
      reporterContact: reportContact
    });

    setIsSubmittingReport(false);
    if (!res.success) {
      setReportFeedback({ success: false, message: res.message });
    } else {
      setReportFeedback({ success: true, message: res.message });
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportFeedback(null);
        setReportDescription('');
        setReportLocation('');
        loadIncidents();
      }, 1500);
    }
  };

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

            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-black text-rose-700 dark:text-rose-400 border border-rose-500/30">
              ● MULTI-HAZARD INCIDENT TELEMETRY
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <ShieldAlert className="h-7 w-7 text-rose-500 shrink-0" />
            Disaster Reports & Incident Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
            Real-time disaster incident monitoring, CWC flood bulletins, BRO landslide alerts, and citizen ground reports strictly scoped across India's 8 North Eastern Region states.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/30 hover:scale-105 transition border border-rose-400/40 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Report a Disaster
          </button>
          <button
            onClick={loadIncidents}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-extrabold cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      {/* ⚠️ SEARCH OUTSIDE NER REJECTION NOTICE */}
      {isSearchOutsideNER && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300 font-bold text-xs sm:text-sm flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 animate-bounce" />
          <span>Location is outside Jeevan Setu's NER coverage. Scoped strictly to the 8 North Eastern Region states.</span>
        </div>
      )}

      {/* 📊 SUMMARY COUNTERS BAR (6 Dynamic Counters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Incidents</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{metrics.activeIncidents}</div>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">High / Critical</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.highCriticalIncidents}</div>
        </div>

        <div className="p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Flood Incidents</div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{metrics.floodIncidents}</div>
        </div>

        <div className="p-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Landslide Incidents</div>
          <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400">{metrics.landslideIncidents}</div>
        </div>

        <div className="p-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Road Blockades</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">{metrics.roadBlockIncidents}</div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Verification</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{metrics.unverifiedReportsCount}</div>
        </div>
      </div>

      {/* 🔍 FILTERS & SEARCH CONTROLS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
        
        {/* Row 1: Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search State, District, City, Location, or Incident Type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                viewMode === 'map' ? 'bg-sky-600 text-white shadow' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🗺️ Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition ${
                viewMode === 'list' ? 'bg-sky-600 text-white shadow' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              📋 List View
            </button>
          </div>
        </div>

        {/* Row 2: Incident Type Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {DISASTER_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
                selectedType === t
                  ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400 shadow'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {t === 'Flood' && '🌊 '}
              {t === 'Landslide' && '⛰️ '}
              {t === 'Heavy Rain' && '🌧️ '}
              {t === 'Storm/Cyclone' && '🌪️ '}
              {t === 'Road Block' && '🚧 '}
              {t === 'Earthquake' && '🌋 '}
              {t}
            </button>
          ))}
        </div>

        {/* Row 3: Dropdowns for State, District, Severity, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          
          {/* State Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">State (8 NER States Only)</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All 8 NER States</option>
              {NER_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* District Selector (Dynamic based on selected state) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Districts</option>
              {selectedState !== 'All' && NER_DISTRICTS_BY_STATE[selectedState as NERStateName]?.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Severity Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MODERATE">MODERATE</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Incident Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="MONITORING">MONITORING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="UNVERIFIED">UNVERIFIED (User Report)</option>
            </select>
          </div>

        </div>
      </div>

      {/* ⚠️ ROUTE WARNING PANEL */}
      {routeWarning && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span>{routeWarning}</span>
        </div>
      )}

      {/* 🗺️ MAP & LIST MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Leaflet GIS Map or List Cards */}
        <div className="lg:col-span-7 space-y-4">
          {viewMode === 'map' ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🗺️</span> NER Disaster Incidents Interactive GIS Map
                </h3>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  ● 8 NER States Boundary Active
                </span>
              </div>

              <div ref={mapContainerRef} className="h-[460px] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner" />

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
                <div className="flex items-center gap-3">
                  <span>🌊 Flood</span>
                  <span>⛰️ Landslide</span>
                  <span>🌧️ Heavy Rain</span>
                  <span>🚧 Road Block</span>
                </div>
                <span>Showing {incidents.length} verified incident markers</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
              {incidents.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => handleFocusIncidentOnMap(inc)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 space-y-2.5 ${
                    selectedIncident && selectedIncident.id === inc.id
                      ? 'border-sky-500 bg-sky-500/10 shadow-lg ring-1 ring-sky-500/50'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        inc.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                        inc.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
                        'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}>
                        {inc.severity} &bull; {inc.type}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1">
                        {inc.locationName}
                      </h4>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold ${
                      inc.status === 'ACTIVE' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                      inc.status === 'UNVERIFIED' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                      'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {inc.status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    <b>State:</b> {inc.state} &bull; <b>District:</b> {inc.district}
                  </div>

                  <div className="text-xs text-slate-500 line-clamp-2">
                    {inc.description}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-[11px] text-slate-400 font-mono">
                    <span>Source: <b>{inc.source}</b></span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFocusIncidentOnMap(inc);
                      }}
                      className="text-sky-500 font-bold hover:underline"
                    >
                      Focus Map 🗺️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Incident Details Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>📋</span> Selected Incident Details
            </h3>
            <span className="text-xs font-mono text-slate-400 font-bold">
              {selectedIncident ? selectedIncident.id : 'None Selected'}
            </span>
          </div>

          {selectedIncident ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-4 transition-colors duration-300">
              
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-black uppercase text-slate-900 dark:text-white">
                  {selectedIncident.type}
                </span>

                <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${
                  selectedIncident.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30' :
                  selectedIncident.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30' :
                  'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}>
                  {selectedIncident.severity} SEVERITY
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedIncident.locationName}
                </h2>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  <b>District:</b> {selectedIncident.district} &bull; <b>State:</b> {selectedIncident.state}
                </div>
              </div>

              {/* Verification Status Badge */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Verification Status</span>
                <span className={`font-black block mt-0.5 ${selectedIncident.isVerified ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {selectedIncident.isVerified ? '✓ VERIFIED OFFICIAL DISASTER DATA' : selectedIncident.verificationLabel || 'User Report — Pending Verification'}
                </span>
              </div>

              <div className="space-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <b className="text-slate-900 dark:text-white block font-bold">Description:</b>
                <p className="leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">Data Source</span>
                  <b className="text-slate-900 dark:text-white text-xs font-bold block mt-0.5">{selectedIncident.source}</b>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block font-bold">Last Updated</span>
                  <b className="text-slate-900 dark:text-white text-xs font-bold block mt-0.5">{selectedIncident.time} IST</b>
                </div>
              </div>

              {/* Connected Module Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => handleCheckSafeRoute(selectedIncident)}
                  disabled={isCalculatingRoute}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Navigation className="h-4 w-4" />
                  {isCalculatingRoute ? 'Calculating Safe Route...' : 'Check Safe Route ➔'}
                </button>

                {selectedIncident.type === 'Flood' && onNavigateToFlood && (
                  <button
                    onClick={onNavigateToFlood}
                    className="w-full py-2 px-4 rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Waves className="h-4 w-4" /> Open Flood Intelligence Module ➔
                  </button>
                )}

                {selectedIncident.type === 'Landslide' && onNavigateToLandslide && (
                  <button
                    onClick={onNavigateToLandslide}
                    className="w-full py-2 px-4 rounded-xl bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30 border border-orange-500/30 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Mountain className="h-4 w-4" /> Open Landslide Risk Module ➔
                  </button>
                )}
              </div>

            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] text-center text-slate-500 text-xs font-bold">
              Select an incident from the map or list to inspect details.
            </div>
          )}
        </div>

      </div>

      {/* 📝 REPORT A DISASTER MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-rose-500" />
                Report a Disaster (Citizen Ground Report)
              </h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/30 font-bold">
              ⚠️ User-submitted reports are saved with status <b>UNVERIFIED</b> and badge <b>"User Report — Pending Verification"</b> until reviewed by authorities.
            </div>

            {reportFeedback && (
              <div className={`p-3 rounded-xl text-xs font-bold border ${
                reportFeedback.success ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}>
                {reportFeedback.message}
              </div>
            )}

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Disaster Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as IncidentType)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {DISASTER_TYPES.filter(t => t !== 'All').map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">State (8 NER States Only)</label>
                  <select
                    value={reportState}
                    onChange={(e) => {
                      const st = e.target.value as NERStateName;
                      setReportState(st);
                      setReportDistrict(NER_DISTRICTS_BY_STATE[st]?.[0] || 'Regional Sector');
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {NER_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">District</label>
                  <select
                    value={reportDistrict}
                    onChange={(e) => setReportDistrict(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {NER_DISTRICTS_BY_STATE[reportState]?.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Location Name / Landmark</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NH-6 Km 142, Panbazar Market..."
                    value={reportLocation}
                    onChange={(e) => setReportLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-slate-500">Incident Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe ground conditions, severity, casualties or road blockages..."
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Reporter Contact (Optional)</label>
                  <input
                    type="text"
                    placeholder="Phone or Email"
                    value={reportContact}
                    onChange={(e) => setReportContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-500">Latitude / Longitude (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Lat e.g. 26.14"
                      value={reportLat}
                      onChange={(e) => setReportLat(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Lon e.g. 91.73"
                      value={reportLon}
                      onChange={(e) => setReportLon(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-2"
                >
                  {isSubmittingReport ? 'Submitting Report...' : 'Submit Unverified Report ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
