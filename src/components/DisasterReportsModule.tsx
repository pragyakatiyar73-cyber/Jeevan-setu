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
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Thermometer,
  Droplets,
  Eye,
  Compass,
  Radio
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
import { SearchSpellingCorrectionPrompt } from './SearchSpellingCorrectionPrompt';

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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [rejectedSearchNotice, setRejectedSearchNotice] = useState<boolean>(false);
  const [telemetryMeta, setTelemetryMeta] = useState<{
    isRealtime?: boolean;
    source?: string;
    lastSynced?: string;
    seismicEventsCount?: number;
    weatherStationsCount?: number;
  }>({
    isRealtime: true,
    source: 'Open-Meteo High-Resolution IMD Grid & USGS Realtime Seismology',
    lastSynced: new Date().toISOString()
  });
  const [lastSyncTimeDisplay, setLastSyncTimeDisplay] = useState<string>('Just now');

  // Slideshow & Stream Presentation States
  const [viewMode, setViewMode] = useState<'slideshow' | 'list'>('slideshow');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0);

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

  // Slideshow Reel Refs & Interactive Auto-Scroll
  const carouselReelRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Smoothly center the active slide pill in the reel when currentSlideIndex updates
  useEffect(() => {
    const targetPill = pillRefs.current[currentSlideIndex];
    if (targetPill && carouselReelRef.current) {
      targetPill.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentSlideIndex]);

  const handleScrollReelLeft = () => {
    if (carouselReelRef.current) {
      carouselReelRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const handleScrollReelRight = () => {
    if (carouselReelRef.current) {
      carouselReelRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  const formatSlideShortTitle = (item: DisasterReportItem) => {
    const loc = item.location || '';
    if (loc.includes('Zoo Road')) return 'Guwahati Zoo Rd';
    if (loc.includes('Brahmaputra') || loc.includes('Riverbank')) return 'Guwahati Riverbank';
    if (loc.includes('Gangtok')) return 'Gangtok NH-10';
    if (loc.includes('Sohra') || loc.includes('Cherrapunji')) return 'Sohra / Cherra';
    if (loc.includes('Zubza')) return 'Zubza Bypass';
    if (loc.includes('Imphal')) return 'Imphal Valley';
    if (loc.includes('Dhemaji')) return 'Dhemaji Subansiri';
    if (loc.includes('Aizawl')) return 'Aizawl Sairang';
    const words = loc.split(' ').filter(w => !['Inundation', 'Corridor', 'Pass', 'Slopes', 'Lowlands'].includes(w));
    return words.slice(0, 2).join(' ') || loc;
  };

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

  // Fetch Incidents from Backend API with Real-time Telemetry
  const loadIncidents = async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setIsError(false);
    setRejectedSearchNotice(false);

    try {
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
        return;
      }

      if (!res.success && res.incidents.length === 0) {
        setIsError(true);
        setErrorMessage(res.message || 'Disaster incident data temporarily unavailable.');
      } else {
        setIncidents(res.incidents);
        if (res.telemetryMeta) {
          setTelemetryMeta(res.telemetryMeta);
          setLastSyncTimeDisplay('Just now');
        }
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, [selectedState, selectedDistrict, selectedType, selectedSeverity, selectedStatus]);

  // Automated 25-Second Real-Time Telemetry Background Polling
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      loadIncidents(true);
    }, 25000);
    return () => clearInterval(pollingInterval);
  }, [selectedState, selectedDistrict, selectedType, selectedSeverity, selectedStatus, searchQuery]);

  // Relative Sync Time Ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      if (telemetryMeta?.lastSynced) {
        const diffSec = Math.floor((Date.now() - new Date(telemetryMeta.lastSynced).getTime()) / 1000);
        if (diffSec < 15) setLastSyncTimeDisplay('Just now');
        else if (diffSec < 60) setLastSyncTimeDisplay(`${diffSec}s ago`);
        else setLastSyncTimeDisplay(`${Math.floor(diffSec / 60)}m ago`);
      }
    }, 5000);
    return () => clearInterval(ticker);
  }, [telemetryMeta?.lastSynced]);

  // Slideshow Auto-Cycle Timer (6 seconds per slide with smooth progress)
  useEffect(() => {
    if (!isAutoPlaying || isHovered || incidents.length <= 1 || viewMode !== 'slideshow') {
      return;
    }

    const stepIntervalMs = 100;
    const totalSlideDurationMs = 6000;
    const increment = (stepIntervalMs / totalSlideDurationMs) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % incidents.length;
            const target = incidents[nextIdx];
            if (target && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([target.lat, target.lon], Math.max(mapInstanceRef.current.getZoom(), 10), { duration: 0.9 });
            }
            return nextIdx;
          });
          return 0;
        }
        return prev + increment;
      });
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isHovered, incidents, viewMode]);

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

  // Track previous count and state to only fitBounds on filter/count change
  const prevIncidentsCountRef = useRef<number>(0);
  const prevStateRef = useRef<string>('All');

  // Initialize Leaflet Incident Map & Synchronize with Active Slide
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

    // Update Map Markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      const bounds = L.latLngBounds([]);

      incidents.forEach((item, index) => {
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
        const isActive = currentSlideIndex === index;
        const statusBg = item.status === 'RESOLVED' ? '#065f46' : item.status === 'MONITORING' ? '#075985' : '#881337';
        const statusText = item.status === 'RESOLVED' ? '#34d399' : item.status === 'MONITORING' ? '#38bdf8' : '#fda4af';

        // Custom Pin Icon showing Disaster Type Emoji & Label pointing to exact location
        const customPinIcon = L.divIcon({
          className: 'disaster-location-pin',
          html: `
            <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%) ${isActive ? 'scale(1.18)' : 'scale(1)'}; transition: all 0.2s ease; z-index: ${isActive ? 9999 : 100};">
              <div style="
                display: flex; align-items: center; gap: 5px;
                background: ${isActive ? 'rgba(15, 23, 42, 0.98)' : 'rgba(15, 23, 42, 0.92)'};
                border: ${isActive ? '2.5px solid #38bdf8' : `2px solid ${markerColor}`};
                border-radius: 12px;
                padding: ${isActive ? '4px 9px' : '3px 8px'};
                box-shadow: ${isActive ? '0 0 20px rgba(56, 189, 248, 0.85), 0 8px 24px rgba(0,0,0,0.9)' : '0 6px 16px rgba(0,0,0,0.7)'};
                white-space: nowrap;
                color: #ffffff;
                font-family: system-ui, sans-serif;
                font-size: 11px;
                font-weight: 800;
              ">
                <span style="font-size: 13px;">${emoji}</span>
                <span style="color: ${isActive ? '#38bdf8' : '#f8fafc'}; font-weight: 800;">${item.disasterType}</span>
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
                border-top: 7px solid ${isActive ? '#38bdf8' : markerColor};
                margin-top: -1px;
              "></div>
              ${isActive ? `
                <span style="
                  position: absolute;
                  bottom: -8px;
                  left: 50%;
                  transform: translateX(-50%);
                  width: 14px;
                  height: 14px;
                  border-radius: 9999px;
                  background: #38bdf8;
                  opacity: 0.75;
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></span>
              ` : ''}
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
            ${item.liveTelemetry ? `
              <div style="font-size: 10px; color: #0369a1; font-weight: 700; margin-top: 5px; background: #e0f2fe; border: 1px solid #bae6fd; padding: 3px 6px; border-radius: 6px; display: flex; align-items: center; justify-content: space-between; gap: 4px;">
                <span>🌡️ ${item.liveTelemetry.temperature !== undefined ? item.liveTelemetry.temperature + '°C' : '--'} ${item.liveTelemetry.weatherCondition || ''}</span>
                <span>🌧️ ${item.liveTelemetry.precipitation !== undefined ? item.liveTelemetry.precipitation + ' mm/h' : '0 mm/h'}</span>
              </div>
            ` : ''}
          </div>
        `);

        marker.on('click', () => {
          setSelectedIncident(item);
          setCurrentSlideIndex(index);
          setSlideProgress(0);
        });

        marker.addTo(markersGroupRef.current!);
        bounds.extend([item.lat, item.lon]);
      });

      // AUTO-ZOOM ON MAP ONLY WHEN INCIDENTS COUNT OR FILTER CHANGES
      const countChanged = incidents.length !== prevIncidentsCountRef.current;
      const stateChanged = selectedState !== prevStateRef.current;

      if (mapInstanceRef.current && (countChanged || stateChanged)) {
        prevIncidentsCountRef.current = incidents.length;
        prevStateRef.current = selectedState;

        if (incidents.length > 0 && bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        } else if (selectedState !== 'All' && STATE_CENTERS[selectedState]) {
          const center = STATE_CENTERS[selectedState];
          mapInstanceRef.current.flyTo([center.lat, center.lon], center.zoom, { duration: 1.2 });
        }
      }
    }
  }, [incidents, selectedState, currentSlideIndex]);

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

  // Fly Map to Incident & Set as Active Slide
  const flyToIncidentOnMap = (item: DisasterReportItem) => {
    setSelectedIncident(item);
    const idx = incidents.findIndex(i => i.id === item.id);
    if (idx !== -1) {
      setCurrentSlideIndex(idx);
      setSlideProgress(0);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lon], 11, { duration: 1.0 });
    }
  };

  const handleNextSlide = () => {
    if (incidents.length === 0) return;
    const nextIdx = (currentSlideIndex + 1) % incidents.length;
    setCurrentSlideIndex(nextIdx);
    setSlideProgress(0);
    const target = incidents[nextIdx];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lon], 11, { duration: 0.9 });
    }
  };

  const handlePrevSlide = () => {
    if (incidents.length === 0) return;
    const prevIdx = (currentSlideIndex - 1 + incidents.length) % incidents.length;
    setCurrentSlideIndex(prevIdx);
    setSlideProgress(0);
    const target = incidents[prevIdx];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lon], 11, { duration: 0.9 });
    }
  };

  const handleSelectSlide = (idx: number) => {
    if (idx >= 0 && idx < incidents.length) {
      setCurrentSlideIndex(idx);
      setSlideProgress(0);
      const target = incidents[idx];
      if (target && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([target.lat, target.lon], 11, { duration: 0.9 });
      }
    }
  };

  const handleFitAllMarkers = () => {
    if (mapInstanceRef.current && incidents.length > 0) {
      const bounds = L.latLngBounds(incidents.map(i => [i.lat, i.lon]));
      if (bounds.isValid()) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
      }
    }
  };

  const activeIncident = incidents[currentSlideIndex] || incidents[0] || null;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6 select-none font-sans">
      
      {/* 🚀 MANDATORY TOP COVERAGE BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-sky-50 via-indigo-50/50 to-slate-100 dark:from-sky-950 dark:via-indigo-950 dark:to-slate-900 border border-sky-200 dark:border-sky-500/40 p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-400/30 dark:border-sky-400/40 flex items-center justify-center shrink-0 shadow-lg shadow-sky-900/10 dark:shadow-sky-900/40">
            <ShieldAlert className="h-6 w-6 text-sky-500 dark:text-sky-400 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Disaster Reports &amp; Incident Intelligence
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold tracking-wide uppercase flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Data Coverage: North Eastern Region — 8 States
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 dark:border-sky-500/40 text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping" />
                GENUINE REAL-TIME TELEMETRY
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Live feeds from Open-Meteo High-Resolution IMD Grid &amp; USGS Realtime Seismology.</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">• Synced {lastSyncTimeDisplay}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-900/20 dark:shadow-sky-900/40 hover:scale-105 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer border border-sky-400/40"
          >
            <Plus className="h-4 w-4" />
            <span>Report Incident</span>
          </button>
          <button
            onClick={() => loadIncidents(false)}
            disabled={isLoading || isRefreshing}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition cursor-pointer"
            title={`Refresh Live Telemetry (Last synced: ${lastSyncTimeDisplay})`}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin text-sky-500 dark:text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 🎛️ CONTROL PANEL & FILTERS */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 shadow-sm dark:shadow-xl space-y-4">
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by state, district, town, or disaster type (e.g. Guwahati, Flood, Landslide)..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            Search
          </button>
          {(selectedState !== 'All' || selectedDistrict !== 'All' || selectedType !== 'All' || selectedSeverity !== 'All' || selectedStatus !== 'All' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30 dark:border-rose-500/40 transition cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </form>

        {/* 💡 SPELLING CORRECTION PROMPT */}
        <SearchSpellingCorrectionPrompt
          query={searchQuery}
          onSelectSuggestion={(suggestedText) => setSearchQuery(suggestedText)}
        />

        {/* Outside-NER Search Rejection Warning */}
        {rejectedSearchNotice && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500 dark:text-rose-400" />
            <span>Location is outside Jeevan Setu's NER coverage. Only 8 North Eastern states are supported.</span>
          </div>
        )}

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* Disaster Type Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Disaster Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
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
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              State (NER Only)
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">All NER States (8)</option>
              {NER_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Dynamic District Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={selectedState === 'All'}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-40 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
            >
              <option value="All">{selectedState === 'All' ? 'Select State First' : 'All Districts'}</option>
              {selectedState !== 'All' && NER_STATES_DISTRICTS[selectedState]?.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex flex-col">
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
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
            <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Incident Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 hover:border-slate-300 dark:hover:border-slate-600 transition cursor-pointer"
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

      {/* 🗺️ INTERACTIVE MAP & INCIDENTS SLIDESHOW DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Incident Map (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg dark:shadow-2xl flex flex-col h-[640px] xl:h-[660px]">
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                <MapPin className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                NER Disaster Incident Map
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60">
                {incidents.length} Markers
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleFitAllMarkers}
                title="Fit map view to show all incidents"
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition text-[10px] font-bold cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-700/60"
              >
                <Maximize2 className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                <span>Fit All</span>
              </button>
              {activeIncident && (
                <button
                  type="button"
                  onClick={() => flyToIncidentOnMap(activeIncident)}
                  title="Center map on current slide"
                  className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/80 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300 transition text-[10px] font-bold cursor-pointer flex items-center gap-1 border border-sky-200 dark:border-sky-600/50"
                >
                  <Navigation className="h-3 w-3 text-sky-500 dark:text-sky-400" />
                  <span>Focus</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative flex-1 w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800/60 z-10">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Active Incident Floating Indicator on Map */}
            {activeIncident && (
              <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-xl px-3 py-1.5 shadow-xl flex items-center gap-2 max-w-[85%] pointer-events-none">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500" />
                </span>
                <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {activeIncident.location}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono shrink-0 hidden sm:inline">
                  {activeIncident.lat.toFixed(2)}°N, {activeIncident.lon.toFixed(2)}°E
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Incident Telemetry Slideshow & Stream (7 cols) */}
        <div 
          className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 shadow-lg dark:shadow-2xl flex flex-col h-[640px] xl:h-[660px] relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Top Progress Bar (Active during Slideshow) */}
          {viewMode === 'slideshow' && isAutoPlaying && incidents.length > 1 && (
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800/50 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400 transition-all duration-100 ease-linear"
                style={{ width: `${slideProgress}%` }}
              />
            </div>
          )}

          {/* Header Bar */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-200 dark:border-slate-800/80 mb-3 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                Active NER Incident Stream ({incidents.length})
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                REAL-TIME TELEMETRY
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher: Slideshow vs List */}
              <div className="bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center">
                <button
                  type="button"
                  onClick={() => setViewMode('slideshow')}
                  title="Slideshow Presentation View"
                  className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'slideshow'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>🎞️ Slideshow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Compact Stream View"
                  className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition flex items-center gap-1 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>📋 All Cards</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold hidden md:inline">
                Synced {lastSyncTimeDisplay}
              </span>
              <button
                type="button"
                onClick={() => loadIncidents(true)}
                disabled={isRefreshing}
                title={`Refresh real-time telemetry feed (Last synced: ${lastSyncTimeDisplay})`}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition flex items-center gap-1 text-[10px] font-bold cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <RefreshCw className={`h-3 w-3 text-sky-500 dark:text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-8 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-sky-500 dark:text-sky-400 animate-spin" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-bold">Querying official NER incident feeds &amp; live weather telemetry...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && incidents.length === 0 && !isError && (
            <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-8 text-center space-y-3">
              <ShieldAlert className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-300">No Matching Incidents Found</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
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

          {/* VIEW MODE 1: SLIDESHOW DECK (DEFAULT & USER REQUESTED) */}
          {!isLoading && incidents.length > 0 && viewMode === 'slideshow' && activeIncident && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* Slideshow Top Navigation Bar */}
              <div className="flex items-center justify-between px-1 pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-[11px] font-black flex items-center gap-1.5 shadow-sm">
                    <span className="text-sky-600 dark:text-sky-400 font-black">#{currentSlideIndex + 1}</span>
                    <span className="text-slate-400 dark:text-slate-500">/</span>
                    <span className="text-slate-600 dark:text-slate-400">{incidents.length}</span>
                    <span className="ml-1 text-slate-700 dark:text-slate-300 font-bold hidden sm:inline">Incidents</span>
                  </span>

                  {/* Auto-Play Toggle */}
                  <button
                    type="button"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    title={isAutoPlaying ? "Pause Auto-Cycle (6s)" : "Start Auto-Cycle"}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                      isAutoPlaying 
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300' 
                        : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {isAutoPlaying ? <Pause className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <Play className="h-3 w-3 text-sky-600 dark:text-sky-400" />}
                    <span>{isAutoPlaying ? 'Auto-Cycle 6s' : 'Paused'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    title="Previous Incident"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    title="Next Incident"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Main Featured Slide Card */}
              <div className="flex-1 bg-slate-50/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-sm dark:shadow-xl">
                
                {/* Header Row: Badges & Live Status */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-black text-xs border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                        {activeIncident.disasterType === 'Flood' && '🌊'}
                        {activeIncident.disasterType === 'Landslide' && '⛰️'}
                        {activeIncident.disasterType === 'Heavy Rain' && '🌧️'}
                        {activeIncident.disasterType === 'Storm/Cyclone' && '🌪️'}
                        {activeIncident.disasterType === 'Road Block' && '🚧'}
                        {activeIncident.disasterType === 'Earthquake' && '🌋'}
                        {activeIncident.disasterType === 'Other Disaster' && '⚠️'}
                        <span>{activeIncident.disasterType}</span>
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase border ${
                          activeIncident.severity === 'CRITICAL'
                            ? 'bg-red-500/15 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 animate-pulse'
                            : activeIncident.severity === 'HIGH'
                            ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/40'
                            : activeIncident.severity === 'MODERATE'
                            ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                            : 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                        }`}
                      >
                        {activeIncident.severity}
                      </span>

                      <span
                        className={`px-2.5 py-1 rounded-md font-black text-[10px] uppercase border ${
                          activeIncident.status === 'ACTIVE' || activeIncident.status === 'RESPONSE IN PROGRESS'
                            ? 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-500/50'
                            : activeIncident.status === 'MONITORING'
                            ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50'
                            : activeIncident.status === 'RESOLVED'
                            ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Status: {activeIncident.status || 'ACTIVE'}
                      </span>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 text-[10px] font-black flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                      {activeIncident.dataStatus || 'REALTIME LIVE'}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div className="mt-3">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>{activeIncident.location}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                        <MapPin className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
                        <span>{activeIncident.district}, <b className="text-sky-600 dark:text-sky-300 font-bold">{activeIncident.state}</b></span>
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Clock className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                        <span>{activeIncident.date} {activeIncident.time}</span>
                      </span>
                    </div>
                  </div>

                  {/* Clean Description */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-2.5 leading-relaxed bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    {activeIncident.description}
                  </p>
                </div>

                {/* Real-time Multi-Sensor Telemetry Matrix (6 Live Gauges) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
                  {/* Temp */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Temperature</span>
                      <span>🌡️</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-300">
                        {activeIncident.liveTelemetry?.temperature !== undefined ? `${activeIncident.liveTelemetry.temperature}°C` : '--'}
                      </span>
                      {activeIncident.liveTelemetry?.apparentTemperature !== undefined && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Feels {activeIncident.liveTelemetry.apparentTemperature}°C
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">High-Res IMD Radar</div>
                  </div>

                  {/* Rainfall */}
                  <div className={`border rounded-xl p-2.5 flex flex-col justify-between shadow-xs ${
                    (activeIncident.liveTelemetry?.precipitation || 0) > 10
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50'
                      : (activeIncident.liveTelemetry?.precipitation || 0) > 0
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-500/50'
                      : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Rainfall Rate</span>
                      <span>🌧️</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className={`text-base sm:text-lg font-black ${
                        (activeIncident.liveTelemetry?.precipitation || 0) > 10 ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-300'
                      }`}>
                        {activeIncident.liveTelemetry?.precipitation !== undefined ? `${activeIncident.liveTelemetry.precipitation} mm/h` : '0 mm/h'}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {(activeIncident.liveTelemetry?.precipitation || 0) > 10 ? 'Heavy' : (activeIncident.liveTelemetry?.precipitation || 0) > 0 ? 'Light' : 'None'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Precipitation Gauge</div>
                  </div>

                  {/* Humidity */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Humidity</span>
                      <span>💧</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-base sm:text-lg font-black text-cyan-600 dark:text-cyan-300">
                        {activeIncident.liveTelemetry?.humidity !== undefined ? `${activeIncident.liveTelemetry.humidity}%` : '--'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Atmospheric Sensor</div>
                  </div>

                  {/* Wind Speed */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Wind Velocity</span>
                      <span>💨</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200">
                        {activeIncident.liveTelemetry?.windSpeed !== undefined ? `${activeIncident.liveTelemetry.windSpeed} km/h` : '--'}
                      </span>
                      {activeIncident.liveTelemetry?.windGusts !== undefined && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          Gust {activeIncident.liveTelemetry.windGusts} km/h
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">Anemometer Grid</div>
                  </div>

                  {/* Atmosphere Condition */}
                  <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Weather</span>
                      <span>⛅</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                        {activeIncident.liveTelemetry?.weatherCondition || 'Partly Cloudy'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">WMO Satellite Code</div>
                  </div>

                  {/* Seismic / Geological */}
                  <div className={`border rounded-xl p-2.5 flex flex-col justify-between shadow-xs ${
                    activeIncident.liveTelemetry?.seismicMagnitude
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/50 animate-pulse'
                      : 'bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">
                      <span>Seismic Sensor</span>
                      <span>🌋</span>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-300">
                        {activeIncident.liveTelemetry?.seismicMagnitude
                          ? `USGS M${activeIncident.liveTelemetry.seismicMagnitude.toFixed(1)}`
                          : 'Zone V Normal'}
                      </span>
                    </div>
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">USGS Real-time Feed</div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => flyToIncidentOnMap(activeIncident)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Focus on Map</span>
                    </button>

                    {onNavigateToReroute && (
                      <button
                        type="button"
                        onClick={() => onNavigateToReroute(activeIncident.location, `${activeIncident.district} Relief Hub`)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white font-extrabold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Plan Corridor</span>
                      </button>
                    )}

                    {onTriggerSOS && (
                      <button
                        type="button"
                        onClick={onTriggerSOS}
                        className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 dark:bg-red-600/20 dark:hover:bg-red-600/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/40 font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                        <span>Trigger SOS</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {activeIncident.lat.toFixed(4)}°N, {activeIncident.lon.toFixed(4)}°E
                  </span>
                </div>
              </div>

              {/* 🎞️ Bottom Interactive Slideshow Deck Reel */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
                {/* Reel Header Info & Scroll Chevrons */}
                <div className="flex items-center justify-between px-1 mb-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🎞️</span>
                      <span>Slide Reel</span>
                    </span>
                    <span className="text-slate-400 dark:text-slate-600 font-bold">•</span>
                    <span className="font-extrabold text-sky-600 dark:text-sky-400">
                      Slide {currentSlideIndex + 1} of {incidents.length}
                    </span>
                    {isAutoPlaying && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        <span>Auto-Advancing</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleScrollReelLeft}
                      title="Scroll slide reel left"
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleScrollReelRight}
                      title="Scroll slide reel right"
                      className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition cursor-pointer"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Reel Horizontal Slider Track with Edge Fades & Hidden Scrollbars */}
                <div className="relative group">
                  {/* Left & Right Edge Vignette Fades */}
                  <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-5 bg-gradient-to-r from-white/95 dark:from-slate-950/90 to-transparent z-10 rounded-l-xl" />
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-5 bg-gradient-to-l from-white/95 dark:from-slate-950/90 to-transparent z-10 rounded-r-xl" />

                  <div
                    ref={carouselReelRef}
                    className="flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  >
                    {incidents.map((item, idx) => {
                      const isSelected = currentSlideIndex === idx;
                      const isCompleted = idx < currentSlideIndex;
                      let emoji = '⚠️';
                      if (item.disasterType === 'Flood') emoji = '🌊';
                      else if (item.disasterType === 'Landslide') emoji = '⛰️';
                      else if (item.disasterType === 'Heavy Rain') emoji = '🌧️';
                      else if (item.disasterType === 'Storm/Cyclone') emoji = '🌪️';
                      else if (item.disasterType === 'Road Block') emoji = '🚧';
                      else if (item.disasterType === 'Earthquake') emoji = '🌋';

                      const isCritical = item.severity === 'CRITICAL';
                      const isHigh = item.severity === 'HIGH';
                      const isModerate = item.severity === 'MODERATE';
                      const sevColor = isCritical ? 'bg-rose-500' : isHigh ? 'bg-orange-500' : isModerate ? 'bg-amber-500' : 'bg-emerald-500';

                      return (
                        <button
                          key={item.id}
                          ref={(el) => { pillRefs.current[idx] = el; }}
                          type="button"
                          onClick={() => handleSelectSlide(idx)}
                          className={`relative shrink-0 flex flex-col justify-between rounded-xl px-2.5 py-2 text-left transition-all duration-200 cursor-pointer overflow-hidden border select-none ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/90 border-sky-400 ring-2 ring-sky-400/40 shadow-md scale-[1.02] text-slate-900 dark:text-white'
                              : 'bg-white dark:bg-slate-950/90 border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                          }`}
                          style={{ minWidth: '138px', maxWidth: '160px' }}
                        >
                          {/* Story/Slideshow Top Progress Bar Line */}
                          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-slate-200 dark:bg-slate-800/80 overflow-hidden">
                            <div
                              className={`h-full transition-all ease-linear ${
                                isSelected
                                  ? 'bg-gradient-to-r from-sky-400 to-emerald-400 duration-100'
                                  : isCompleted
                                  ? 'bg-sky-500/70 w-full'
                                  : 'w-0'
                              }`}
                              style={{
                                width: isSelected ? `${slideProgress}%` : isCompleted ? '100%' : '0%'
                              }}
                            />
                          </div>

                          {/* Top Row: Slide # + Emoji + Temp + Severity Beacon */}
                          <div className="flex items-center justify-between w-full pt-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-mono font-black ${isSelected ? 'text-sky-600 dark:text-sky-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                #{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                              </span>
                              <span className="text-xs">{emoji}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {item.liveTelemetry?.temperature !== undefined && (
                                <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-300">
                                  {item.liveTelemetry.temperature}°
                                </span>
                              )}
                              <span className="relative flex h-2 w-2">
                                {isCritical && (
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                                )}
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${sevColor}`} />
                              </span>
                            </div>
                          </div>

                          {/* Main Label & State/Disaster Subtitle */}
                          <div className="w-full">
                            <div className={`text-[11px] font-black truncate leading-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                              {formatSlideShortTitle(item)}
                            </div>
                            <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center justify-between mt-0.5">
                              <span>{item.state}</span>
                              <span className={`text-[8px] font-black uppercase px-1 rounded ${
                                isCritical ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300' : isHigh ? 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}>
                                {item.disasterType}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* VIEW MODE 2: COMPACT STREAM LIST */}
          {!isLoading && incidents.length > 0 && viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
              {incidents.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedIncident(item);
                    setCurrentSlideIndex(idx);
                    flyToIncidentOnMap(item);
                  }}
                  className={`rounded-xl border bg-white dark:bg-slate-950/80 p-4 transition-all duration-200 hover:border-sky-400 dark:hover:border-sky-500/60 cursor-pointer shadow-sm ${
                    selectedIncident?.id === item.id || currentSlideIndex === idx ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/30 ring-1 ring-sky-500/40' : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-sky-700 dark:text-sky-300 font-black text-xs border border-slate-200 dark:border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                        {item.disasterType === 'Flood' && '🌊'}
                        {item.disasterType === 'Landslide' && '⛰️'}
                        {item.disasterType === 'Heavy Rain' && '🌧️'}
                        {item.disasterType === 'Storm/Cyclone' && '🌪️'}
                        {item.disasterType === 'Road Block' && '🚧'}
                        {item.disasterType === 'Earthquake' && '🌋'}
                        {item.disasterType === 'Other Disaster' && '⚠️'}
                        {item.disasterType}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] uppercase border ${
                          item.severity === 'CRITICAL'
                            ? 'bg-red-500/15 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/40 animate-pulse'
                            : item.severity === 'HIGH'
                            ? 'bg-orange-500/15 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/40'
                            : item.severity === 'MODERATE'
                            ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/40'
                            : 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/40'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40 text-[9px] font-black flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                      {item.dataStatus || 'REALTIME LIVE'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white mt-2.5 tracking-tight">
                    {item.location}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.liveTelemetry && (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-amber-600 dark:text-amber-300">
                        <span>🌡️</span>
                        <span>{item.liveTelemetry.temperature}°C</span>
                      </span>
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-sky-600 dark:text-sky-300">
                        <span>🌧️</span>
                        <span>{item.liveTelemetry.precipitation} mm/h</span>
                      </span>
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-cyan-600 dark:text-cyan-300">
                        <span>💧</span>
                        <span>{item.liveTelemetry.humidity}%</span>
                      </span>
                      <span className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                        <span>💨</span>
                        <span>{item.liveTelemetry.windSpeed} km/h</span>
                      </span>
                      {item.liveTelemetry.weatherCondition && (
                        <span className="ml-auto text-[10px] font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800/40">
                          {item.liveTelemetry.weatherCondition}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      📍 {item.district}, <b className="text-sky-600 dark:text-sky-300">{item.state}</b>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        flyToIncidentOnMap(item);
                      }}
                      className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition hover:translate-x-0.5"
                    >
                      Focus Map &rarr;
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
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-950 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-black flex items-center gap-1">
                  {selectedIncident.disasterType === 'Flood' && '🌊'}
                  {selectedIncident.disasterType === 'Landslide' && '⛰️'}
                  {selectedIncident.disasterType === 'Heavy Rain' && '🌧️'}
                  {selectedIncident.disasterType === 'Storm/Cyclone' && '🌪️'}
                  {selectedIncident.disasterType === 'Road Block' && '🚧'}
                  {selectedIncident.disasterType === 'Earthquake' && '🌋'}
                  {selectedIncident.disasterType === 'Other Disaster' && '⚠️'}
                  {selectedIncident.disasterType}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                  {selectedIncident.dataStatus || 'REALTIME LIVE'}
                </span>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 text-xs">
              
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{selectedIncident.location || 'Not available'}</span>
                </h3>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                  📍 {selectedIncident.district || 'Not available'}, {selectedIncident.state || 'Not available'} ({selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lon.toFixed(4)}° E)
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-500/50 px-3 py-1 rounded-lg">
                  <span>Disaster Classification: <b>{selectedIncident.disasterType}</b></span>
                </div>
              </div>

              {/* ⚡ REAL-TIME SENSOR TELEMETRY DIAGNOSTICS */}
              {selectedIncident.liveTelemetry && (
                <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                      Live Environmental &amp; Sensor Telemetry
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                      {selectedIncident.liveTelemetry.source || 'Open-Meteo & IMD Grid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Temperature</span>
                      <span className="text-xs font-black text-amber-600 dark:text-amber-300">
                        {selectedIncident.liveTelemetry.temperature !== undefined ? `${selectedIncident.liveTelemetry.temperature}°C` : 'N/A'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Rainfall Rate</span>
                      <span className={`text-xs font-black ${
                        (selectedIncident.liveTelemetry.precipitation || 0) > 0 ? 'text-sky-600 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {selectedIncident.liveTelemetry.precipitation !== undefined ? `${selectedIncident.liveTelemetry.precipitation} mm/h` : '0 mm/h'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Humidity</span>
                      <span className="text-xs font-black text-sky-600 dark:text-sky-300">
                        {selectedIncident.liveTelemetry.humidity !== undefined ? `${selectedIncident.liveTelemetry.humidity}%` : 'N/A'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Wind Speed</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {selectedIncident.liveTelemetry.windSpeed !== undefined ? `${selectedIncident.liveTelemetry.windSpeed} km/h` : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {selectedIncident.liveTelemetry.seismicMagnitude !== undefined && (
                    <div className="mt-2 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 flex items-center justify-between text-xs">
                      <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                        <span>🌋</span> USGS Richter Magnitude:
                      </span>
                      <span className="font-black text-red-600 dark:text-red-400 text-sm">
                        M{selectedIncident.liveTelemetry.seismicMagnitude.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Badges Grid */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Severity Rating</span>
                  <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{selectedIncident.severity || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Incident Status</span>
                  <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{selectedIncident.status || 'Not available'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Reported Date &amp; Time</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedIncident.date || 'Not available'} {selectedIncident.time || ''}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Telemetry Source</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">{selectedIncident.source || 'Not available'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Incident Description</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {selectedIncident.description || 'Not available'}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono">
                Last System Sync: {selectedIncident.lastUpdated || 'Not available'}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => {
                    const item = selectedIncident;
                    setSelectedIncident(null);
                    flyToIncidentOnMap(item);
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 hover:text-slate-900 dark:text-white font-bold py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MapPin className="h-4 w-4 text-sky-500 dark:text-sky-400" />
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
                  className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold py-2.5 rounded-xl border border-sky-400/40 shadow-lg shadow-sky-900/20 dark:shadow-sky-900/30 transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-950/70 dark:bg-slate-950/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-950 px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                  Report Disaster Incident (NER Coverage)
                </h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit} className="p-5 space-y-4 text-xs">
              
              {/* Error Warning */}
              {reportError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {/* Success Notification */}
              {reportSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                  <span>Incident Report Submitted Successfully! Status set to MONITORING (Unverified).</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Disaster Type */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Disaster Type *
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
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
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Observed Severity *
                  </label>
                  <select
                    value={reportSeverity}
                    onChange={(e) => setReportSeverity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
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
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    State (8 NER Only) *
                  </label>
                  <select
                    value={reportState}
                    onChange={(e) => setReportState(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {NER_STATES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* District (Dynamic Dropdown) */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    District *
                  </label>
                  <select
                    value={reportDistrict}
                    onChange={(e) => setReportDistrict(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {NER_STATES_DISTRICTS[reportState]?.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Landmark */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Location / Highway Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g. NH-10 Teesta Bridge Mile 14, Gangtok Corridor"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Lat / Lon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Latitude (NER Bbox 21.5-29.8° N) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={reportLat}
                    onChange={(e) => setReportLat(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Longitude (NER Bbox 87.5-97.8° E) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={reportLon}
                    onChange={(e) => setReportLon(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                  Incident Description &amp; Ground Situation
                </label>
                <textarea
                  rows={3}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Describe road blockage depth, trapped vehicles, water level rise, or emergency assistance needed..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-900/20 dark:shadow-sky-900/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
