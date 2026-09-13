import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  MapPin,
  Filter,
  Search,
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  Mountain,
  Wind,
  Navigation,
  ExternalLink,
  Flame,
  Activity,
  Layers,
  Calendar,
  Clock,
  Building2,
  Upload,
  Camera,
  Check
} from 'lucide-react';
import L from 'leaflet';
import {
  DisasterReportItem,
  NER_STATES,
  NER_STATES_DISTRICTS,
  fetchDisasterIncidents,
  submitDisasterReport,
  isNERCoordinates,
  isNERStateName
} from '../services/api/disasterReportsService';

interface DisasterReportsModuleProps {
  onNavigateToReroute?: (origin: string, dest: string) => void;
  onNavigateToMap?: () => void;
  onTriggerSOS?: () => void;
}

export default function DisasterReportsModule({
  onNavigateToReroute,
  onNavigateToMap,
  onTriggerSOS
}: DisasterReportsModuleProps) {
  // Filter States
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Incidents Data & Status
  const [incidents, setIncidents] = useState<DisasterReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rejectedSearchNotice, setRejectedSearchNotice] = useState<boolean>(false);

  // Selected Incident Details Modal
  const [selectedIncident, setSelectedIncident] = useState<DisasterReportItem | null>(null);

  // User Reporting Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportType, setReportType] = useState<string>('Flood');
  const [reportState, setReportState] = useState<string>('Assam');
  const [reportDistrict, setReportDistrict] = useState<string>('Kamrup Metropolitan');
  const [reportLocation, setReportLocation] = useState<string>('');
  const [reportLat, setReportLat] = useState<string>('26.1839');
  const [reportLon, setReportLon] = useState<string>('91.7450');
  const [reportSeverity, setReportSeverity] = useState<string>('MODERATE');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<boolean>(false);

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Reset District filter when State changes
  useEffect(() => {
    setSelectedDistrict('All');
  }, [selectedState]);

  // Reset Report District when Report State changes
  useEffect(() => {
    if (NER_STATES_DISTRICTS[reportState] && NER_STATES_DISTRICTS[reportState].length > 0) {
      setReportDistrict(NER_STATES_DISTRICTS[reportState][0]);
    }
  }, [reportState]);

  // Fetch Incidents from Backend API
  const loadIncidents = async () => {
    setIsLoading(true);
    setIsError(false);
    setRejectedSearchNotice(false);

    const res = await fetchDisasterIncidents({
      state: selectedState,
      district: selectedDistrict,
      disasterType: selectedType,
      severity: selectedSeverity,
      status: selectedStatus,
      search: searchQuery
    });

    if (res.rejectedSearch) {
      setRejectedSearchNotice(true);
      setIncidents([]);
      setIsLoading(false);
      return;
    }

    if (!res.success && res.incidents.length === 0) {
      setIsError(true);
      setErrorMessage(res.message || 'Disaster incident data temporarily unavailable.');
    } else {
      setIncidents(res.incidents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedState, selectedDistrict, selectedType, selectedSeverity, selectedStatus]);

  // Handle Search Input Trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadIncidents();
  };

  // Reset All Filters & Search Query
  const handleResetFilters = () => {
    setSelectedState('All');
    setSelectedDistrict('All');
    setSelectedType('All');
    setSelectedSeverity('All');
    setSelectedStatus('All');
    setSearchQuery('');
  };

// Centroid Coordinates for 8 NER States
const STATE_CENTERS: Record<string, { lat: number; lon: number; zoom: number }> = {
  'Arunachal Pradesh': { lat: 28.2180, lon: 94.7278, zoom: 8 },
  'Assam': { lat: 26.2006, lon: 92.9376, zoom: 8 },
  'Manipur': { lat: 24.6637, lon: 93.9063, zoom: 9 },
  'Meghalaya': { lat: 25.5788, lon: 91.8933, zoom: 9 },
  'Mizoram': { lat: 23.1645, lon: 92.9376, zoom: 9 },
  'Nagaland': { lat: 26.1584, lon: 94.5624, zoom: 9 },
  'Sikkim': { lat: 27.5330, lon: 88.5122, zoom: 9 },
  'Tripura': { lat: 23.9408, lon: 91.9882, zoom: 9 }
};

  // Initialize Leaflet Incident Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [26.1445, 91.7362], // Guwahati Center
        zoom: 7,
        zoomControl: true
      });

      L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        attribution: '&copy; Google Hybrid Satellite'
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    // Update Map Markers & Auto Zoom to State/District Risks
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      const bounds = L.latLngBounds([]);

      incidents.forEach((item) => {
        let markerColor = '#3b82f6'; // Default Blue
        let emoji = '⚠️';
        if (item.disasterType === 'Flood') { markerColor = '#0284c7'; emoji = '🌊'; }
        else if (item.disasterType === 'Landslide') { markerColor = '#ea580c'; emoji = '⛰️'; }
        else if (item.disasterType === 'Heavy Rain') { markerColor = '#2563eb'; emoji = '🌧️'; }
        else if (item.disasterType === 'Storm/Cyclone') { markerColor = '#9333ea'; emoji = '🌪️'; }
        else if (item.disasterType === 'Road Block') { markerColor = '#dc2626'; emoji = '🚧'; }
        else if (item.disasterType === 'Earthquake') { markerColor = '#ca8a04'; emoji = '🌋'; }

        const isCritical = item.severity === 'CRITICAL';
        const isHigh = item.severity === 'HIGH';
        const statusBg = item.status === 'RESOLVED' ? '#065f46' : item.status === 'MONITORING' ? '#075985' : '#881337';
        const statusText = item.status === 'RESOLVED' ? '#34d399' : item.status === 'MONITORING' ? '#38bdf8' : '#fda4af';

        // Custom Pin Icon showing Disaster Type Emoji & Label pointing to exact location
        const customPinIcon = L.divIcon({
          className: 'disaster-location-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
              <div style="
                display: flex; align-items: center; gap: 5px;
                background: rgba(15, 23, 42, 0.95);
                border: 2px solid ${markerColor};
                border-radius: 12px;
                padding: 4px 8px;
                box-shadow: 0 6px 16px rgba(0,0,0,0.7);
                white-space: nowrap;
                color: #ffffff;
                font-family: system-ui, sans-serif;
                font-size: 11px;
                font-weight: 800;
              ">
                <span style="font-size: 14px;">${emoji}</span>
                <span style="color: #f8fafc;">${item.disasterType}</span>
                <span style="
                  font-size: 9px;
                  font-weight: 900;
                  background: ${isCritical ? '#991b1b' : isHigh ? '#9a3412' : '#1e3a8a'};
                  color: ${isCritical ? '#fca5a5' : isHigh ? '#ffedd5' : '#bfdbfe'};
                  padding: 1px 5px;
                  border-radius: 6px;
                ">${item.severity}</span>
              </div>
              <div style="
                width: 0; height: 0;
                border-left: 6px solid transparent;
                border-right: 6px solid transparent;
                border-top: 7px solid ${markerColor};
                margin-top: -1px;
              "></div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0]
        });

        const marker = L.marker([item.lat, item.lon], { icon: customPinIcon });

        marker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
              <span style="font-weight: 800; font-size: 11px; color: ${markerColor}; text-transform: uppercase;">
                ${emoji} ${item.disasterType} (${item.severity})
              </span>
              <span style="font-weight: 800; font-size: 9px; background: ${statusBg}; color: ${statusText}; padding: 2px 6px; border-radius: 4px;">
                ${item.status}
              </span>
            </div>
            <div style="font-weight: 800; font-size: 13px; color: #0f172a; margin-top: 4px;">${item.location}</div>
            <div style="font-size: 11px; color: #475569; margin-top: 2px;">📍 ${item.district}, <b>${item.state}</b></div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              Status: <b>${item.status}</b> | 🕒 ${item.date} ${item.time}
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedIncident(item);
        });

        marker.addTo(markersGroupRef.current!);
        bounds.extend([item.lat, item.lon]);
      });

      // AUTO-ZOOM ON MAP: Zoom to all risk bounds in target State/District
      if (mapInstanceRef.current) {
        if (incidents.length > 0 && bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        } else if (selectedState !== 'All' && STATE_CENTERS[selectedState]) {
          const center = STATE_CENTERS[selectedState];
          mapInstanceRef.current.flyTo([center.lat, center.lon], center.zoom, { duration: 1.2 });
        }
      }
    }
  }, [incidents, selectedState]);

  // Handle User Report Submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    setReportSuccess(false);

    const latNum = Number(reportLat);
    const lonNum = Number(reportLon);

    if (isNaN(latNum) || isNaN(lonNum)) {
      setReportError('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    if (!isNERCoordinates(latNum, lonNum) || !isNERStateName(reportState)) {
      setReportError('Location is outside Jeevan Setu\'s NER coverage.');
      return;
    }

    setReportSubmitting(true);

    const res = await submitDisasterReport({
      disasterType: reportType,
      state: reportState,
      district: reportDistrict,
      location: reportLocation || `${reportDistrict}, ${reportState}`,
      lat: latNum,
      lon: lonNum,
      severity: reportSeverity,
      description: reportDescription || 'Citizen disaster report logged via public portal.',
      photoUrl: reportPhoto
    });

    setReportSubmitting(false);

    if (res.success && res.incident) {
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportModalOpen(false);
        setReportSuccess(false);
        setReportDescription('');
        loadIncidents();
      }, 1500);
    } else {
      setReportError(res.error || 'Failed to submit report.');
    }
  };

  // Fly Map to Incident
  const flyToIncidentOnMap = (item: DisasterReportItem) => {
    setSelectedIncident(item);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lon], 11, { duration: 1.2 });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 select-none font-sans">
      
      {/* 🚀 MANDATORY TOP COVERAGE BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-900 border border-sky-500/40 p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-sky-900/40">
            <ShieldAlert className="h-6 w-6 text-sky-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Disaster Reports &amp; Incident Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold tracking-wide uppercase">
                Data Coverage: North Eastern Region — 8 States
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              Real-time verified hazard reports, IMD meteorological telemetry, USGS seismic feeds, and citizen ground reports.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-900/40 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border border-sky-400/40"
          >
            <Plus className="h-4 w-4" />
            <span>Report Incident</span>
          </button>
          <button
            onClick={loadIncidents}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh Incident Stream"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 🎛️ CONTROL PANEL & FILTERS */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl space-y-4">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by state, district, town, or disaster type (e.g. Guwahati, Flood, Landslide)..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            Search
          </button>
          {(selectedState !== 'All' || selectedDistrict !== 'All' || selectedType !== 'All' || selectedSeverity !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/40 transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </form>

        {/* Outside-NER Search Rejection Warning */}
        {rejectedSearchNotice && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>Location is outside Jeevan Setu's NER coverage. Only 8 North Eastern states are supported.</span>
          </div>
        )}

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Disaster Type Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Disaster Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Flood">🌊 Flood</option>
              <option value="Landslide">⛰️ Landslide</option>
              <option value="Heavy Rain">🌧️ Heavy Rain</option>
              <option value="Storm/Cyclone">🌪️ Storm / Cyclone</option>
              <option value="Road Block">🚧 Road Block</option>
              <option value="Earthquake">🌋 Earthquake</option>
              <option value="Other Disaster">⚠️ Other Disaster</option>
            </select>
          </div>

          {/* State Filter (8 NER States) */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              State (NER Only)
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">All NER States (8)</option>
              {NER_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Dynamic District Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedState === 'All'}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-40 hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">{selectedState === 'All' ? 'Select State First' : 'All Districts'}</option>
              {selectedState !== 'All' && NER_STATES_DISTRICTS[selectedState]?.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="CRITICAL">🔴 CRITICAL</option>
              <option value="HIGH">🟠 HIGH</option>
              <option value="MODERATE">🟡 MODERATE</option>
              <option value="LOW">🟢 LOW</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
              Incident Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="MONITORING">MONITORING</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </div>

        </div>

      </div>

      {/* 🗺️ INTERACTIVE MAP & INCIDENTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Incident Map (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl flex flex-col h-[580px]">
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-800/80 mb-3">
            <span className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wide">
              <MapPin className="h-4 w-4 text-sky-400" />
              NER Disaster Incident Map
            </span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-950 text-sky-400 border border-sky-800/60">
              Showing {incidents.length} Markers
            </span>
          </div>

          <div ref={mapContainerRef} className="flex-1 w-full rounded-xl overflow-hidden shadow-inner border border-slate-800/60 z-10" />
        </div>

        {/* Right Column: Incident List / Grid (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl flex flex-col h-[580px]">
          
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-800/80 mb-3 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Active NER Incident Stream ({incidents.length})
            </h3>
            {isError && (
              <span className="text-xs font-bold text-rose-400">
                🔴 Disaster incident data temporarily unavailable.
              </span>
            )}
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-sky-400 animate-spin" />
              <p className="text-xs text-slate-400 font-bold">Querying official NER incident feeds...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && incidents.length === 0 && !isError && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/50 p-8 text-center space-y-3">
              <ShieldAlert className="h-10 w-10 text-slate-500" />
              <h4 className="text-sm font-bold text-slate-300">No Matching Incidents Found</h4>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Multiple active filters or search terms are filtering out records. Try clearing search text or resetting filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset All Filters &amp; Search</span>
              </button>
            </div>
          )}

          {/* Incidents List Cards */}
          {!isLoading && incidents.length > 0 && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {incidents.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedIncident(item)}
                  className={`rounded-xl border bg-slate-950/80 p-4 transition-all duration-200 hover:border-sky-500/60 cursor-pointer shadow-md ${
                    selectedIncident?.id === item.id ? 'border-sky-500 bg-sky-950/30 ring-1 ring-sky-500/40' : 'border-slate-800 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Type Badge & Severity Badge */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-sky-300 font-black text-xs border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                        {item.disasterType === 'Flood' && '🌊'}
                        {item.disasterType === 'Landslide' && '⛰️'}
                        {item.disasterType === 'Heavy Rain' && '🌧️'}
                        {item.disasterType === 'Storm/Cyclone' && '🌪️'}
                        {item.disasterType === 'Road Block' && '🚧'}
                        {item.disasterType === 'Earthquake' && '🌋'}
                        {item.disasterType === 'Other Disaster' && '⚠️'}
                        {item.disasterType}
                      </span>

                      {/* Severity Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase border ${
                          item.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                            : item.severity === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                            : item.severity === 'MODERATE'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {item.severity || 'Not available'}
                      </span>

                      {/* Incident Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase border ${
                          item.status === 'ACTIVE' || item.status === 'RESPONSE IN PROGRESS'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                            : item.status === 'MONITORING'
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                            : item.status === 'RESOLVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        Status: {item.status || 'ACTIVE'}
                      </span>
                    </div>

                    {/* Data Status Tag */}
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800 text-[9px] font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      {item.dataStatus || 'LIVE'}
                    </span>
                  </div>

                  {/* Location Title */}
                  <h4 className="text-sm font-black text-white mt-2.5 tracking-tight flex items-center justify-between">
                    <span>{item.location || 'Not available'}</span>
                  </h4>
                  
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description || 'Not available'}
                  </p>

                  {/* Footer Metadata */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                    <span className="font-semibold text-slate-300 flex items-center gap-1">
                      📍 {item.district || 'Not available'}, <b className="text-sky-300 font-bold">{item.state || 'Not available'}</b>
                    </span>
                    <span className="text-slate-400 font-medium">
                      🕒 {item.date || 'Not available'} {item.time || ''}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        flyToIncidentOnMap(item);
                      }}
                      className="text-sky-400 hover:text-sky-300 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition hover:translate-x-0.5"
                    >
                      View on Map &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* 📄 INCIDENT DETAILS CARD MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-black">
                  {selectedIncident.disasterType}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-extrabold">
                  {selectedIncident.dataStatus || 'STATIC'}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              
              <div>
                <h3 className="text-base font-black text-white tracking-tight">
                  {selectedIncident.location || 'Not available'}
                </h3>
                <p className="text-xs text-sky-400 font-bold mt-0.5">
                  {selectedIncident.district || 'Not available'}, {selectedIncident.state || 'Not available'} ({selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lon.toFixed(4)}° E)
                </p>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Severity Rating</span>
                  <span className="text-xs font-extrabold text-amber-400">{selectedIncident.severity || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Incident Status</span>
                  <span className="text-xs font-extrabold text-emerald-400">{selectedIncident.status || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Reported Date &amp; Time</span>
                  <span className="text-xs font-bold text-slate-200">{selectedIncident.date || 'Not available'} {selectedIncident.time || ''}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Telemetry Source</span>
                  <span className="text-xs font-bold text-slate-300 truncate block">{selectedIncident.source || 'Not available'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Incident Description</span>
                <p className="text-slate-300 font-medium leading-relaxed">
                  {selectedIncident.description || 'Not available'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Last System Sync: {selectedIncident.lastUpdated || 'Not available'}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    const item = selectedIncident;
                    setSelectedIncident(null);
                    flyToIncidentOnMap(item);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl border border-slate-700 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-sky-400" />
                  <span>View on Map</span>
                </button>

                <button
                  onClick={() => {
                    const locName = `${selectedIncident.location}, ${selectedIncident.state}`;
                    setSelectedIncident(null);
                    if (onNavigateToReroute) {
                      onNavigateToReroute('Guwahati Hub', locName);
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold py-2.5 rounded-xl border border-sky-400/40 shadow-lg shadow-sky-900/30 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="h-4 w-4" />
                  <span>Check Safe Route</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 📝 USER REPORT INCIDENT MODAL (MOBILE & DESKTOP RESPONSIVE) */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-sky-400" />
                <h3 className="text-sm font-black text-white tracking-tight">
                  Report Disaster Incident (NER Coverage)
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Error Warning */}
              {reportError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {/* Success Notification */}
              {reportSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Incident Report Submitted Successfully! Status set to MONITORING (Unverified).</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Disaster Type */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Disaster Type *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="Flood">🌊 Flood</option>
                    <option value="Landslide">⛰️ Landslide</option>
                    <option value="Heavy Rain">🌧️ Heavy Rain</option>
                    <option value="Storm/Cyclone">🌪️ Storm / Cyclone</option>
                    <option value="Road Block">🚧 Road Block</option>
                    <option value="Earthquake">🌋 Earthquake</option>
                    <option value="Other Disaster">⚠️ Other Disaster</option>
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Observed Severity *
                  </label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="CRITICAL">🔴 CRITICAL</option>
                    <option value="HIGH">🟠 HIGH</option>
                    <option value="MODERATE">🟡 MODERATE</option>
                    <option value="LOW">🟢 LOW</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* State (8 NER States Only) */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    State (8 NER Only) *
                  </label>
                  <select
                    value={reportState}
                    onChange={(e) => setReportState(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {NER_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* District (Dynamic Dropdown) */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    District *
                  </label>
                  <select
                    value={reportDistrict}
                    onChange={(e) => setReportDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {NER_STATES_DISTRICTS[reportState]?.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Landmark */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Location / Highway Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. NH-10 Teesta Bridge Mile 14, Gangtok Corridor"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Lat / Lon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Latitude (NER Bbox 21.5-29.8° N) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={reportLat}
                    onChange={(e) => setReportLat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                    Longitude (NER Bbox 87.5-97.8° E) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={reportLon}
                    onChange={(e) => setReportLon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                  Incident Description &amp; Ground Situation
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe road blockage depth, trapped vehicles, water level rise, or emergency assistance needed..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-900/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {reportSubmitting ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-white" />
                  )}
                  <span>Submit Incident Report</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
