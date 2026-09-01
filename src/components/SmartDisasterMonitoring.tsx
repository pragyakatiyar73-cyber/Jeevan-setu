import { useTranslation } from "../i18n";
import React, { useState, useEffect, useRef } from 'react';
import SmartSearchInput from './common/SmartSearchInput';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  Cpu,
  Eye,
  Flame,
  Layers,
  MapPin,
  Mountain,
  Navigation,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Truck,
  Zap,
  HelpCircle,
  Maximize2,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip as ChartTooltip, Legend as ChartLegend } from 'chart.js';
import {
  MAP_LAYERS,
  getLiveWeather,
  WeatherData,
  searchMonitoringLocation,
  reverseGeocodeMonitoring,
  getEnvironmentalData,
  getRoadAccessibility,
  getDisasterAlerts,
  get72HourTrend,
  generateAISituationSummary,
  dispatchMDoNERAlert,
  GeocodedLocation,
  MonitoringEnvironmentData,
  RoadStatusItem,
  DisasterAlertItem,
  MonitoringTimelineEvent,
  Monitoring72hForecast,
  AISituationSummary
} from '../services/api';
import { getSpellingSuggestions, getDidYouMeanSuggestion, LocationSuggestion } from '../utils/locationSpellCheck';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, ChartTooltip, ChartLegend);

export interface SmartDisasterMonitoringProps {
  onNavigateToImpactAssessment?: (loc: { lat: number; lon: number; name: string }) => void;
  initialLoc?: GeocodedLocation;
}

export default function SmartDisasterMonitoring({
 onNavigateToImpactAssessment, initialLoc }: SmartDisasterMonitoringProps) {
  const { t } = useTranslation();
  // Location & Disaster Settings State
  const [monitoredLoc, setMonitoredLoc] = useState<GeocodedLocation>(
    initialLoc || {
      lat: 25.5788,
      lon: 91.8933,
      displayName: 'Shillong (East Khasi Hills Sector), Meghalaya',
      state: 'Meghalaya',
      country: 'India'
    }
  );

  useEffect(() => {
    if (initialLoc) {
      setMonitoredLoc(initialLoc);
      setLatInput(initialLoc.lat.toString());
      setLonInput(initialLoc.lon.toString());
    }
  }, [initialLoc]);

  const [disasterType, setDisasterType] = useState<string>('Landslide & Cloudburst');
  const [disasterStatus, setDisasterStatus] = useState<'ACTIVE' | 'ESCALATING' | 'STABLE' | 'MONITORING'>('ACTIVE');
  const [monitoringRadiusKm, setMonitoringRadiusKm] = useState<number>(10);
  const [reportTime, setReportTime] = useState<string>(new Date().toLocaleTimeString());

  // Search & Geocoding State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [latInput, setLatInput] = useState<string>('25.5788');
  const [lonInput, setLonInput] = useState<string>('91.8933');

  // Map & Satellite State
  const [viewMode, setViewMode] = useState<'map' | 'satellite'>('map');
  const [selectedMapLayer, setSelectedMapLayer] = useState<string>('esriImagery');
  const [satelliteDataAvailable, setSatelliteDataAvailable] = useState<boolean>(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  // Satellite Change Comparison State
  const [changeViewMode, setChangeViewMode] = useState<'split' | 'latest' | 'previous'>('split');
  const [changeSlider, setChangeSlider] = useState<number>(50);

  // Telemetry & Sensor Data State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [envData, setEnvData] = useState<MonitoringEnvironmentData | null>(null);
  const [roads, setRoads] = useState<RoadStatusItem[]>([]);
  const [alerts, setAlerts] = useState<DisasterAlertItem[]>([]);
  const [trendData, setTrendData] = useState<Monitoring72hForecast | null>(null);
  const [aiSummary, setAiSummary] = useState<AISituationSummary | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  // 72h Tab State
  const [activeTab72h, setActiveTab72h] = useState<'24h' | '48h' | '72h'>('24h');

  // Timeline State
  const [timeline, setTimeline] = useState<MonitoringTimelineEvent[]>([
    { id: 't1', time: '10:15 AM', title: 'Smart Disaster Monitoring Initiated', category: 'SYSTEM', details: 'Telemetry sensors synchronized with Open-Meteo & Nominatim GIS' },
    { id: 't2', time: '10:20 AM', title: 'Open-Meteo Radar Feed Refreshed', category: 'WEATHER', details: 'Rainfall telemetry logged: 14.2 mm/hr precip rate' },
    { id: 't3', time: '10:25 AM', title: 'IMD Extreme Weather Alert Registered', category: 'ALERT', details: 'Heavy Rainfall & Flash Flood warning issued for East Khasi Hills' },
    { id: 't4', time: '10:40 AM', title: 'Satellite Pass Imagery Logged', category: 'SATELLITE', details: 'Esri High-Res Imagery centered on 25.5788° N, 91.8933° E' },
    { id: 't5', time: '11:00 AM', title: 'Risk Outlook Recalculated', category: 'RISK', details: 'Current Disaster Risk set to HIGH (85% Hazard Index)' }
  ]);
  const [customNote, setCustomNote] = useState<string>('');

  // MDoNER Dispatch Modal State
  const [mdonerModalOpen, setMdonerModalOpen] = useState<boolean>(false);
  const [mdonerMsg, setMdonerMsg] = useState<string>('');
  const [mdonerAgency, setMdonerAgency] = useState<string>('NDRF 1078 Triage Command & MDoNER Emergency Dispatch');
  const [mdonerSending, setMdonerSending] = useState<boolean>(false);
  const [mdonerSuccess, setMdonerSuccess] = useState<boolean>(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);

  // Chart Reference
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Compute Overall Risk Level from telemetry
  const calculateOverallRiskLevel = (): { level: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'; score: number; color: string } => {
    let score = 30;
    if (weather) {
      if (weather.precipitation > 40) score += 35;
      else if (weather.precipitation > 15) score += 20;

      if (weather.windGusts > 50) score += 20;
      else if (weather.windGusts > 30) score += 10;
    }

    if (envData) {
      if (envData.soilMoistureIndex > 85) score += 15;
      if (envData.slopeDegrees > 15) score += 10;
    }

    const hasBlocked = roads.some(r => r.status === 'BLOCKED');
    if (hasBlocked) score += 15;

    score = Math.min(98, score);

    if (score >= 80) return { level: 'CRITICAL', score, color: 'text-rose-500 bg-rose-500/20 border-rose-500/40' };
    if (score >= 60) return { level: 'HIGH', score, color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
    if (score >= 40) return { level: 'MODERATE', score, color: 'text-sky-400 bg-sky-500/20 border-sky-500/40' };
    return { level: 'LOW', score, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
  };

  const currentRisk = calculateOverallRiskLevel();

  // Load telemetry data whenever monitored location changes
  useEffect(() => {
    async function loadTelemetry() {
      setWeatherLoading(true);
      setAiLoading(true);

      const w = await getLiveWeather(monitoredLoc.lat, monitoredLoc.lon);
      const env = await getEnvironmentalData(monitoredLoc.lat, monitoredLoc.lon);

      const [rds, alr, trd] = await Promise.all([
        getRoadAccessibility(monitoredLoc.lat, monitoredLoc.lon, monitoredLoc.displayName, w, env),
        getDisasterAlerts(monitoredLoc.lat, monitoredLoc.lon, monitoredLoc.displayName, w, env),
        get72HourTrend(monitoredLoc.lat, monitoredLoc.lon)
      ]);

      setWeather(w);
      setEnvData(env);
      setRoads(rds);
      setAlerts(alr);
      setTrendData(trd);
      setWeatherLoading(false);

      const summary = await generateAISituationSummary(
        monitoredLoc.displayName,
        disasterType,
        currentRisk.level,
        w,
        alr,
        rds
      );

      setAiSummary(summary);
      setAiLoading(false);

      // Add location update to timeline
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTimeline(prev => [
        {
          id: `t_${Date.now()}`,
          time: nowStr,
          title: `Monitored Location Updated`,
          category: 'SYSTEM',
          details: `Target: ${monitoredLoc.displayName} (${monitoredLoc.lat.toFixed(4)}°N, ${monitoredLoc.lon.toFixed(4)}°E)`
        },
        ...prev
      ]);
    }

    loadTelemetry();
  }, [monitoredLoc.lat, monitoredLoc.lon]);

  // Handle Location Search
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchMonitoringLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
    if (results && results.length > 0) {
      handleSelectSearchResult(results[0]);
    }
  };

  const handleSelectSearchResult = (res: GeocodedLocation) => {
    setMonitoredLoc(res);
    setLatInput(res.lat.toString());
    setLonInput(res.lon.toString());
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleManualCoordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (!isNaN(lat) && !isNaN(lon)) {
      const geo = await reverseGeocodeMonitoring(lat, lon);
      setMonitoredLoc(geo);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatInput(lat.toString());
          setLonInput(lon.toString());
          const geo = await reverseGeocodeMonitoring(lat, lon);
          setMonitoredLoc(geo);
        },
        err => {
          setGeoToast(`Geolocation permission denied or unavailable: ${err.message}`);
          setTimeout(() => setGeoToast(null), 5000);
        }
      );
    } else {
      setGeoToast('Geolocation is not supported by your browser.');
      setTimeout(() => setGeoToast(null), 5000);
    }
  };

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([monitoredLoc.lat, monitoredLoc.lon], 12);
      mapInstanceRef.current = map;

      // Add Map Click Listener to pick location
      map.on('click', async (e: L.LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(4));
        const lon = parseFloat(e.latlng.lng.toFixed(4));
        setLatInput(lat.toString());
        setLonInput(lon.toString());
        const geo = await reverseGeocodeMonitoring(lat, lon);
        setMonitoredLoc(geo);
      });
    } else {
      mapInstanceRef.current.setView([monitoredLoc.lat, monitoredLoc.lon], 12);
    }

    const map = mapInstanceRef.current;

    // Update Tile Layer
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const layerKey = viewMode === 'satellite' ? 'esriImagery' : selectedMapLayer;
    const layerConfig = MAP_LAYERS[layerKey] || MAP_LAYERS.osm;

    let newTileLayer: L.TileLayer | L.TileLayer.WMS;
    if (layerConfig.category === 'disaster-wms' && layerConfig.wmsParams) {
      newTileLayer = L.tileLayer.wms(layerConfig.url, {
        layers: layerConfig.wmsParams.layers,
        format: layerConfig.wmsParams.format,
        transparent: true,
        attribution: layerConfig.attribution
      });
    } else {
      newTileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: layerConfig.maxZoom
      });
    }

    newTileLayer.addTo(map);
    tileLayerRef.current = newTileLayer;

    // Update Monitored Pin Marker
    if (markerRef.current) map.removeLayer(markerRef.current);

    const customMarkerIcon = L.divIcon({
      className: 'custom-monitoring-pin',
      html: `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(225, 29, 72, 0.9);
          border: 2.5px solid #ffffff;
          box-shadow: 0 0 20px rgba(225, 29, 72, 0.8);
        ">
          <span style="
            position: absolute;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 2px solid #ef4444;
            animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
          <span style="font-size: 16px;">🛰️</span>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    markerRef.current = L.marker([monitoredLoc.lat, monitoredLoc.lon], { icon: customMarkerIcon }).addTo(map);
    markerRef.current.bindPopup(`
      <div style="font-family: sans-serif; font-size: 12px; color: #0f172a;">
        <b style="color: #e11d48;">🛰️ Monitored Disaster Site</b><br/>
        <b>${monitoredLoc.displayName}</b><br/>
        Lat: ${monitoredLoc.lat.toFixed(4)} &bull; Lon: ${monitoredLoc.lon.toFixed(4)}<br/>
        <span>Disaster Type: <b>${disasterType}</b></span><br/>
        <span>Current Risk: <b style="color: #ef4444;">${currentRisk.level} (${currentRisk.score}%)</b></span>
      </div>
    `).openPopup();

    // Update Monitoring Radius Circle
    if (radiusCircleRef.current) map.removeLayer(radiusCircleRef.current);

    radiusCircleRef.current = L.circle([monitoredLoc.lat, monitoredLoc.lon], {
      radius: monitoringRadiusKm * 1000,
      color: '#f43f5e',
      fillColor: '#f43f5e',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '6, 6'
    }).addTo(map);

  }, [monitoredLoc, monitoringRadiusKm, selectedMapLayer, viewMode]);

  // Initialize and Update 72h Trend Chart
  useEffect(() => {
    if (!chartCanvasRef.current || !trendData) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: 'Disaster Risk Score (%)',
            data: trendData.riskScore,
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderWidth: 3,
            tension: 0.35,
            yAxisID: 'yRisk'
          },
          {
            label: 'Rainfall Trend (mm)',
            data: trendData.rainfall,
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            yAxisID: 'yPrecip'
          },
          {
            label: 'Wind Gusts (km/h)',
            data: trendData.wind,
            borderColor: '#10b981',
            borderWidth: 1.5,
            tension: 0.35,
            yAxisID: 'yPrecip'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' } }
          },
          tooltip: { enabled: true }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8', font: { size: 10 } },
            grid: { color: 'rgba(51, 65, 85, 0.3)' }
          },
          yRisk: {
            type: 'linear',
            position: 'left',
            min: 0,
            max: 100,
            ticks: { color: '#f87171', font: { size: 10 } },
            grid: { color: 'rgba(51, 65, 85, 0.2)' }
          },
          yPrecip: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            ticks: { color: '#38bdf8', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [trendData]);

  // Handle Adding Timeline Note
  const handleAddTimelineNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeline(prev => [
      {
        id: `t_${Date.now()}`,
        time: nowStr,
        title: 'Command Officer Manual Log Entry',
        category: 'DISPATCH',
        details: customNote.trim()
      },
      ...prev
    ]);
    setCustomNote('');
  };

  // Handle MDoNER Dispatch
  const handleSendMDoNERAlert = async () => {
    setMdonerSending(true);
    const res = await dispatchMDoNERAlert({
      locationName: monitoredLoc.displayName,
      disasterType,
      riskLevel: currentRisk.level,
      message: mdonerMsg || `Urgent: Continuous monitoring indicates ${currentRisk.level} risk at ${monitoredLoc.displayName}. Immediate team standby requested.`,
      sender: 'MDoNER-OPERATIONS-COMMAND'
    });

    setMdonerSending(false);
    setMdonerSuccess(true);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimeline(prev => [
      {
        id: res.alertId,
        time: nowStr,
        title: `⚡ Alert Dispatched to ${mdonerAgency}`,
        category: 'DISPATCH',
        details: `Alert ID: ${res.alertId} &bull; Priority: ${currentRisk.level} &bull; Location: ${monitoredLoc.displayName}`
      },
      ...prev
    ]);

    setTimeout(() => {
      setMdonerSuccess(false);
      setMdonerModalOpen(false);
      setMdonerMsg('');
    }, 2200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 p-4 sm:p-6 space-y-6 font-sans transition-colors duration-300">
      
      {/* 1. TOP HEADER & EMERGENCY COMMAND BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-rose-950/30 dark:to-slate-900 p-5 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              🛰️ SMART DISASTER MONITORING CENTER
            </span>
            <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              MDoNER Operations Command Grid
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t("smartmonitoring.continuousTracking", "Continuous 72-Hour Situation Tracking")}</span>
          </div>

          <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{monitoredLoc.displayName}</span>
          </h1>

          <div className="mt-1 flex items-center gap-4 text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap">
            <span>{t("smartmonitoring.latitude", "Latitude:")} <b className="text-slate-900 dark:text-white font-bold">{monitoredLoc.lat.toFixed(4)}° N</b></span>
            <span>{t("smartmonitoring.longitude", "Longitude:")} <b className="text-slate-900 dark:text-white font-bold">{monitoredLoc.lon.toFixed(4)}° E</b></span>
            <span>{t("smartmonitoring.stateLabel", "State:")} <b className="text-slate-800 dark:text-slate-200 font-bold">{monitoredLoc.state || 'NER Sector'}</b></span>
            <span>{t("smartmonitoring.lastSync", "Last Telemetry Sync:")} <b className="text-emerald-600 dark:text-emerald-400 font-bold">{reportTime}</b></span>
          </div>
        </div>

        {/* Header Right Status Badges & Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Disaster Type Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t("smartmonitoring.disasterVector", "Disaster Vector")}</label>
            <select
              value={disasterType}
              onChange={e => setDisasterType(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-white font-bold cursor-pointer focus:outline-none"
            >
              <option value="Landslide & Cloudburst">🌧️ Landslide & Cloudburst</option>
              <option value="Severe Flash Flood">🌊 Severe Flash Flood</option>
              <option value="Cyclone & Gale Wind">🌀 Cyclone & Gale Wind</option>
              <option value="Wildfire & Forest Fire">🔥 Wildfire & Forest Fire</option>
              <option value="Earthquake & Liquefaction">🌋 Earthquake & Seismic Risk</option>
            </select>
          </div>

          {/* Disaster Status Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t("smartmonitoring.statusMode", "Status Mode")}</label>
            <select
              value={disasterStatus}
              onChange={e => setDisasterStatus(e.target.value as any)}
              className="bg-transparent text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer focus:outline-none"
            >
              <option value="ACTIVE">🔴 ACTIVE</option>
              <option value="ESCALATING">⚠️ ESCALATING</option>
              <option value="STABLE">🟢 STABLE</option>
              <option value="MONITORING">🔵 MONITORING</option>
            </select>
          </div>

          {/* Current Risk Badge */}
          <div className={`rounded-2xl border px-4 py-2.5 shadow-lg flex flex-col items-end ${currentRisk.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t("smartmonitoring.currentDisasterRisk", "CURRENT DISASTER RISK")}</span>
            <div className="text-xl font-black">{currentRisk.level} ({currentRisk.score}%)</div>
          </div>
        </div>
      </div>

      {/* 2. LOCATION CONTROLS & MONITORING RADIUS BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-center transition-colors duration-300">
        
        {/* Search Place Address */}
        <div className="lg:col-span-5 relative">
          <form onSubmit={handleLocationSearch} className="flex items-center gap-2">
            <SmartSearchInput
              placeholder={t("smartmonitoring.searchPlaceholder", "Search location, village, PIN code or district...")}
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={q => {
                setSearchQuery(q);
                handleLocationSearch(new Event('submit') as any);
              }}
              searchType="location"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 shadow"
            >
              {isSearching ? t('smartmonitoring.searching', 'Searching...') : t('smartmonitoring.searchBtn', 'Search')}
            </button>
          </form>

          {/* Did You Mean Spelling Suggestion Banner */}
          {searchQuery.trim().length >= 2 && (() => {
            const dyM = getDidYouMeanSuggestion(searchQuery);
            if (!dyM) return null;
            return (
              <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Did you mean:</span>
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSearchResult({
                      lat: dyM.lat,
                      lon: dyM.lon,
                      displayName: `${dyM.name}, ${dyM.state}, India`,
                      city: dyM.name,
                      state: dyM.state,
                      country: "India"
                    });
                  }}
                  className="font-bold underline hover:text-amber-800 dark:hover:text-amber-200 transition"
                >
                  {dyM.name} ({dyM.state})
                </button>
              </div>
            );
          })()}

          {/* Auto-Suggest & Nominatim Search Results Dropdown */}
          {(searchResults.length > 0 || (searchQuery.trim().length >= 2 && getSpellingSuggestions(searchQuery).length > 0)) && (
            <div className="absolute left-0 right-0 top-12 z-[2000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-2xl max-h-64 overflow-y-auto">
              {/* Spelling / Dictionary Suggestions */}
              {searchQuery.trim().length >= 2 && getSpellingSuggestions(searchQuery).length > 0 && (
                <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                  <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase px-2 py-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>Suggested Locations / Auto-Correct</span>
                  </div>
                  {getSpellingSuggestions(searchQuery).map((item, idx) => (
                    <div
                      key={`sug_${idx}`}
                      onClick={() => handleSelectSearchResult({
                        lat: item.lat,
                        lon: item.lon,
                        displayName: `${item.name}, ${item.state}, India`,
                        city: item.name,
                        state: item.state,
                        country: "India"
                      })}
                      className="cursor-pointer rounded-lg p-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40 transition flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{item.state}, India</div>
                      </div>
                      <span className="text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Nominatim OSM Match Results */}
              {searchResults.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">OpenStreetMap Direct Results</div>
                  {searchResults.map((res, i) => (
                    <div
                      key={`osm_${i}`}
                      onClick={() => handleSelectSearchResult(res)}
                      className="cursor-pointer rounded-lg p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{res.displayName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Lat: {res.lat.toFixed(4)}, Lon: {res.lon.toFixed(4)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Lat/Lon Coordinates */}
        <div className="lg:col-span-4">
          <form onSubmit={handleManualCoordSubmit} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t("smartmonitoring.latLabel", "Lat:")}</span>
              <input
                type="text"
                value={latInput}
                onChange={e => setLatInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white font-mono text-center"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{t("smartmonitoring.lonLabel", "Lon:")}</span>
              <input
                type="text"
                value={lonInput}
                onChange={e => setLonInput(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white font-mono text-center"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              {t("smartmonitoring.updateBtn", "Update")}
            </button>
          </form>
        </div>

        {/* Geolocation & Radius Selector */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <button
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          >
            <Compass className="h-3.5 w-3.5" />
            {t("smartmonitoring.myLocationBtn", "My Location")}
          </button>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
            {[2, 5, 10, 25].map(r => (
              <button
                key={r}
                onClick={() => setMonitoringRadiusKm(r)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  monitoringRadiusKm === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {r}km
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: LIVE MAP & SATELLITE MONITORING */}
        <div className="lg:col-span-8 space-y-6">

          {/* LIVE MAP CARD */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl flex flex-col h-[480px] transition-colors duration-300">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {t("smartmonitoring.liveMonitoringMap", "Live Interactive Disaster Monitoring Map")}
                </h2>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
                  <button
                    onClick={() => setViewMode('map')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      viewMode === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t("smartmonitoring.mapView", "🗺️ Map View")}
                  </button>
                  <button
                    onClick={() => setViewMode('satellite')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      viewMode === 'satellite' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t("smartmonitoring.satelliteView", "🛰️ Satellite View")}
                  </button>
                </div>

                {/* Layer Selector */}
                {viewMode === 'map' && (
                  <select
                    value={selectedMapLayer}
                    onChange={e => setSelectedMapLayer(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="osm">OSM Standard</option>
                    <option value="esriImagery">Esri Satellite</option>
                    <option value="openTopo">OpenTopo Relief</option>
                    <option value="isroBhuvan">ISRO Bhuvan WMS</option>
                    <option value="nasaFirms">NASA GIBS Thermal</option>
                  </select>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div ref={mapContainerRef} className="h-full w-full" />
              
              {/* Map Footer Overlay Instructions */}
              <div className="absolute left-3 bottom-3 z-[1000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-3 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 backdrop-blur flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>{t("smartmonitoring.mapFooterNotice", "Click anywhere on the map to set a new monitored location pin.")}</span>
              </div>
            </div>
          </div>

          {/* 4. SATELLITE MONITORING & CHANGE DETECTION PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  <span>{t("smartmonitoring.satelliteObservationTitle", "Satellite Observation & Change Monitoring")}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("smartmonitoring.satelliteSubtitle", "Comparing previous baseline observation with latest satellite pass.")}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 dark:text-sky-300 border border-sky-500/30">
                  {t("smartmonitoring.satelliteObservationBtn", "Satellite-based observation / AI-assisted estimation")}
                </span>

                <button
                  onClick={() => setSatelliteDataAvailable(!satelliteDataAvailable)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  {t("smartmonitoring.toggleDataAvailability", "Toggle Satellite Data Availability")}
                </button>
              </div>
            </div>

            {satelliteDataAvailable ? (
              <div className="space-y-4">
                {/* Mode Selector & Metadata */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t("smartmonitoring.observationView", "Observation View:")}</span>
                    <button
                      onClick={() => setChangeViewMode('split')}
                      className={`rounded px-2.5 py-1 ${changeViewMode === 'split' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400'}`}
                    >
                      {t("smartmonitoring.beforeAfter", "Before / After Comparison")}
                    </button>
                    <button
                      onClick={() => setChangeViewMode('latest')}
                      className={`rounded px-2.5 py-1 ${changeViewMode === 'latest' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400'}`}
                    >
                      {t("smartmonitoring.latestPass", "Latest Pass (Today)")}
                    </button>
                    <button
                      onClick={() => setChangeViewMode('previous')}
                      className={`rounded px-2.5 py-1 ${changeViewMode === 'previous' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400'}`}
                    >
                      {t("smartmonitoring.baselineObs", "Baseline Observation")}
                    </button>
                  </div>

                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    Source: <b className="text-slate-900 dark:text-white">Esri World Imagery / ISRO Bhuvan</b> &bull; Resolution: <b>0.5m/px</b>
                  </div>
                </div>

                {/* Satellite Imagery Box */}
                <div className="relative h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                  <img
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
                    alt="Satellite Observation View"
                    className="h-full w-full object-cover opacity-85"
                  />

                  {/* Change Vector Markers Overlay */}
                  <div className="absolute inset-0 p-4 pointer-events-none flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="rounded bg-rose-600/90 text-white px-2.5 py-1 text-xs font-bold shadow">
                        🔴 {t("smartmonitoring.detectedFlood", "Detected Flood & Mud Expansion (+34%)")}
                      </span>
                      <span className="rounded bg-slate-900/80 text-white px-2.5 py-1 text-xs font-mono">
                        Pass Time: {reportTime} UTC+5:30
                      </span>
                    </div>

                    <div className="rounded-xl border border-amber-500/40 bg-white/90 dark:bg-slate-950/90 p-3 max-w-md backdrop-blur">
                      <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" />
                        {t("smartmonitoring.aiInterpretationTitle", "AI Change Interpretation Summary")}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-800 dark:text-slate-300 leading-snug">
                        {t("smartmonitoring.aiInterpretationText", "Automated surface change detection highlights increased water spread near low-lying river tributaries and 215m debris accumulation along slopes.")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Disclaimer */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                  <Info className="h-4 w-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <b>Observation Notice:</b> Satellite change detection provides macro-level environmental indicators (water spread, vegetation loss, surface slope movement). It does not certify exact building structural damage or casualty numbers.
                  </span>
                </div>
              </div>
            ) : (
              /* Satellite Data Unavailable State with Active Enable Action */
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-8 text-center space-y-4">
                <Eye className="h-10 w-10 text-slate-400 dark:text-slate-600 mx-auto" />
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Satellite Data Paused or Offline</h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                    Satellite observation stream is paused. Click below to initialize high-resolution satellite imagery pass (Esri World Imagery & ISRO Bhuvan stream).
                  </p>
                </div>
                <button
                  onClick={() => setSatelliteDataAvailable(true)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow flex items-center gap-2 mx-auto transition"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Enable High-Res Satellite Telemetry Stream</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: TELEMETRY, WEATHER, ENVIRONMENT, ALERTS */}
        <div className="lg:col-span-4 space-y-6">

          {/* 5. WEATHER MONITORING PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <span>{t("smartmonitoring.weatherTelemetry", "Weather Telemetry (Open-Meteo)")}</span>
              </h3>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">{t("smartmonitoring.liveRadar", "LIVE RADAR")}</span>
            </div>

            {weatherLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">Fetching live weather telemetry...</div>
            ) : weather ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t("smartmonitoring.temperature", "TEMPERATURE")}</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{weather.temperature}°C</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("smartmonitoring.elevation", "Elevation:")} {weather.elevation}m MSL</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t("smartmonitoring.rainfallRate", "RAINFALL RATE")}</span>
                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">{weather.precipitation} mm</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("smartmonitoring.pastHourPrecip", "Past Hour Precipitation")}</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t("smartmonitoring.relativeHumidity", "RELATIVE HUMIDITY")}</span>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{weather.relativeHumidity}%</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("smartmonitoring.saturationHigh", "Saturation High")}</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{t("smartmonitoring.windGusts", "WIND & GUSTS")}</span>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{weather.windSpeed} km/h</div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{t("smartmonitoring.peakGust", "Peak Gust:")} {weather.windGusts} km/h</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.atmosphericSeverity", "Atmospheric Severity Index")}</span>
                  <span className={`font-bold rounded px-2 py-0.5 ${
                    weather.severeRiskLevel === 'EXTREME' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' :
                    weather.severeRiskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {weather.severeRiskLevel} RISK
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-center text-xs text-rose-500">
                Live weather data unavailable.
              </div>
            )}
          </div>

          {/* 6. ENVIRONMENTAL MONITORING PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mountain className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                <span>Environmental Terrain Indicators</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">NER Topography</span>
            </div>

            {envData && (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Terrain Elevation (MSL):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{envData.elevationMsl} meters</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.terrainSteepness", "Terrain Slope Steepness:")}</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{envData.slopeDegrees}° Slope</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.soilMoisture", "Soil Moisture Saturation:")}</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">{envData.soilMoistureIndex}%</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.nearestWaterbody", "Nearest River / Waterbody:")}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{envData.waterBodyProximityKm} km</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.activeFaultLine", "Active Fault Line Proximity:")}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{envData.seismicFaultDistanceKm} km</span>
                </div>

                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">{t("smartmonitoring.drainageCapacity", "Drainage Capacity Rating:")}</span>
                  <span className={`font-bold ${envData.drainageCapacity === 'POOR' || envData.drainageCapacity === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {envData.drainageCapacity}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 7. ROAD ACCESSIBILITY PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <span>{t("smartmonitoring.roadAccessibilityTitle", "Road & Transport Accessibility")}</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">4 Arterial Corridors</span>
            </div>

            <div className="space-y-3">
              {roads.map(rd => (
                <div key={rd.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{rd.name}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      rd.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                      rd.status === 'PARTIALLY_ACCESSIBLE' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                      rd.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                      'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {rd.status === 'OPEN' ? '🟢 OPEN' : rd.status === 'PARTIALLY_ACCESSIBLE' ? '🟡 PARTIAL' : rd.status === 'BLOCKED' ? '🔴 BLOCKED' : '⚪ UNKNOWN'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400">{rd.warning}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-300">Detour: {rd.detour}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 4. DISASTER ALERTS & 72-HOUR MONITORING TREND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ACTIVE DISASTER ALERTS PANEL */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-bounce" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Active Disaster Alerts & Verification
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">{t("smartmonitoring.distinguishesData", "Distinguishes Live Data vs AI Estimates")}</span>
          </div>

          <div className="space-y-3">
            {alerts.map(alt => (
              <div key={alt.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${alt.severity === 'EXTREME' ? 'text-rose-500' : 'text-amber-500'}`} />
                    {alt.type}
                  </span>

                  <div className="flex items-center gap-2">
                    {alt.isVerified ? (
                      <span className="rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        VERIFIED / LIVE DATA
                      </span>
                    ) : (
                      <span className="rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                        AI-ASSISTED ESTIMATE
                      </span>
                    )}

                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      alt.severity === 'EXTREME' ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      {alt.severity}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">Target Zone: <span className="text-slate-900 dark:text-white font-semibold">{alt.locationName}</span></div>
                
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                  <span>Source: <b className="text-slate-700 dark:text-slate-400">{alt.source}</b></span>
                  <span>Timestamp: <b className="text-slate-700 dark:text-slate-400">{alt.timestamp}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 72-HOUR MONITORING SECTION */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                72-Hour Disaster Monitoring Outlook
              </h3>
            </div>

            <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              {t("smartmonitoring.aiAssistedRisk", "AI-ASSISTED RISK OUTLOOK")}
            </span>
          </div>

          {/* 0-24h, 24-48h, 48-72h Tabs */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
            <button
              onClick={() => setActiveTab72h('24h')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${activeTab72h === '24h' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              0 – 24 HOURS (Immediate)
            </button>
            <button
              onClick={() => setActiveTab72h('48h')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${activeTab72h === '48h' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              24 – 48 HOURS (Evolution)
            </button>
            <button
              onClick={() => setActiveTab72h('72h')}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${activeTab72h === '72h' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              48 – 72 HOURS (Recovery)
            </button>
          </div>

          {/* Tab Content */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-3">
            {activeTab72h === '24h' && (
              <>
                <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">Phase 1: Immediate Risk & Heavy Precipitation Window</div>
                <p className="text-slate-700 dark:text-slate-300">
                  Current conditions present peak rainfall intensity (up to 45 mm cumulative). Landslide hazard along NH-6 remains elevated.
                </p>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div>&bull; <b>Active Alerts:</b> Heavy Rainfall & Flash Flood Warning active.</div>
                  <div>&bull; <b>Monitoring Priority:</b> Clear debris at NH-6 Km 142 and maintain continuous Open-Meteo telemetry.</div>
                </div>
              </>
            )}

            {activeTab72h === '48h' && (
              <>
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">Phase 2: Expected Environmental Evolution & Water Stabilization</div>
                <p className="text-slate-700 dark:text-slate-300">
                  Precipitation levels expected to subside to 15 mm. Secondary runoff into low-lying Panchayats requires monitoring.
                </p>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div>&bull; <b>Infrastructure Concerns:</b> Bridge load limits under waterlogging pressure.</div>
                  <div>&bull; <b>Monitoring Priority:</b> Monitor slope drainage capacity and clear alternate transport bypasses.</div>
                </div>
              </>
            )}

            {activeTab72h === '72h' && (
              <>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Phase 3: Risk Reduction & Recovery Logistics Monitoring</div>
                <p className="text-slate-700 dark:text-slate-300">
                  Weather conditions stabilize with precipitation dropping below 5 mm. Risk score decreases from HIGH (85%) to LOW (25%).
                </p>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                  <div>&bull; <b>Recovery Concerns:</b> Silt clearing along feeder roads and restoring grid power lines.</div>
                  <div>&bull; <b>Monitoring Priority:</b> Transition from active emergency monitoring to routine maintenance.</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 5. 72-HOUR RISK TREND CHART & AI SITUATION SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 72-HOUR RISK TREND CHART */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 flex flex-col transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                72-Hour Visual Risk Trend Chart (0h ➔ 72h)
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Open-Meteo Hourly Forecast Data</span>
          </div>

          <div className="relative flex-1 min-h-[220px] w-full">
            <canvas ref={chartCanvasRef} />
          </div>
        </div>

        {/* AI SITUATION SUMMARY */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                <span>AI Situation Summary</span>
              </h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Gemini AI Engine</span>
            </div>

            {aiLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">Generating AI Situation Summary...</div>
            ) : aiSummary ? (
              <div className="mt-3 space-y-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Current Situation</span>
                  <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed">{aiSummary.currentSituation}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Main Risk Vector</span>
                  <p className="mt-1 text-slate-800 dark:text-slate-200 leading-relaxed">{aiSummary.mainRisk}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Monitoring Priority</span>
                  <p className="mt-1 text-indigo-600 dark:text-indigo-300 font-medium leading-relaxed">{aiSummary.monitoringPriority}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {onNavigateToImpactAssessment && (
              <button
                onClick={() => onNavigateToImpactAssessment({ lat: monitoredLoc.lat, lon: monitoredLoc.lon, name: monitoredLoc.displayName })}
                className="w-full rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <span>{t("smartmonitoring.performPhotoDamage", "Perform Photo Damage Assessment ➔ AI Impact Assessment")}</span>
              </button>
            )}

            <button
              onClick={() => setMdonerModalOpen(true)}
              className="w-full rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/20 hover:from-rose-500 hover:to-indigo-500 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              {t("smartmonitoring.sendImportantAlert", "Send Important Alert ➔ MDoNER Command")}
            </button>
          </div>
        </div>
      </div>

      {/* 6. MONITORING TIMELINE EVENT LOG */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Disaster Monitoring Timeline & Log
            </h3>
          </div>

          <form onSubmit={handleAddTimelineNote} className="flex items-center gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder={t("smartmonitoring.addNotePlaceholder", "Add command officer note to timeline...")}
              value={customNote}
              onChange={e => setCustomNote(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              {t("smartmonitoring.logNoteBtn", "+ Log Note")}
            </button>
          </form>
        </div>

        {/* Timeline Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
          {timeline.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</span>
                <span className="font-mono text-[10px] text-slate-500">{item.time}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{item.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. MDONER ALERT DISPATCH MODAL */}
      {mdonerModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-rose-500" />
                Dispatch Alert to MDoNER Command
              </h3>
              <button
                onClick={() => setMdonerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Target Command Agency</label>
                <input
                  type="text"
                  value={mdonerAgency}
                  onChange={e => setMdonerAgency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Monitored Target Location</label>
                <div className="font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {monitoredLoc.displayName}
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">Emergency Alert Message</label>
                <textarea
                  rows={3}
                  value={mdonerMsg}
                  onChange={e => setMdonerMsg(e.target.value)}
                  placeholder={`Urgent: Continuous monitoring indicates ${currentRisk.level} risk at ${monitoredLoc.displayName}. Requesting NDRF team standby.`}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {mdonerSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3 text-emerald-600 dark:text-emerald-400 text-center font-bold">
                  ✓ Alert Dispatched Successfully to MDoNER Command Grid!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setMdonerModalOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSendMDoNERAlert}
                  disabled={mdonerSending}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                >
                  {mdonerSending ? 'Transmitting...' : 'Confirm & Dispatch Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
