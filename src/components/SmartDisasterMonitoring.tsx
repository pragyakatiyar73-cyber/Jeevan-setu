import { useTranslation } from "../i18n";
import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudRain,
  Compass,
  Cpu,
  Droplets,
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
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  TrendingUp,
  Truck,
  Waves,
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
  const [latInput, setLatInput] = useState<string>(initialLoc ? initialLoc.lat.toString() : '25.5788');
  const [lonInput, setLonInput] = useState<string>(initialLoc ? initialLoc.lon.toString() : '91.8933');

  // Map & Satellite State
  const [viewMode, setViewMode] = useState<'map' | 'satellite'>('map');
  const [selectedMapLayer, setSelectedMapLayer] = useState<string>('osm');
  const [selectedSatelliteLayer, setSelectedSatelliteLayer] = useState<string>('esriImagery');
  const [satelliteDataAvailable, setSatelliteDataAvailable] = useState<boolean>(true);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const radiusCircleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  // Environmental Terrain Indicators Slideshow State
  const [currentTerrainSlide, setCurrentTerrainSlide] = useState<number>(0);
  const [isTerrainAutoPlay, setIsTerrainAutoPlay] = useState<boolean>(true);
  const [terrainViewMode, setTerrainViewMode] = useState<'slideshow' | 'grid'>('slideshow');

  // Auto-advance Environmental Terrain Slideshow every 4 seconds
  useEffect(() => {
    if (!isTerrainAutoPlay || terrainViewMode !== 'slideshow') return;
    const timer = setInterval(() => {
      setCurrentTerrainSlide(prev => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(timer);
  }, [isTerrainAutoPlay, terrainViewMode]);

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
  const [timeline, setTimeline] = useState<MonitoringTimelineEvent[]>([]);
  const lastLoggedCoordRef = useRef<string>('');
  const [customNote, setCustomNote] = useState<string>('');

  // MDoNER Dispatch Modal State
  const [mdonerModalOpen, setMdonerModalOpen] = useState<boolean>(false);
  const [mdonerMsg, setMdonerMsg] = useState<string>('');
  const [mdonerAgency, setMdonerAgency] = useState<string>('NDRF 1078 Triage Command & MDoNER Emergency Dispatch');
  const [mdonerSending, setMdonerSending] = useState<boolean>(false);
  const [mdonerSuccess, setMdonerSuccess] = useState<boolean>(false);

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

      // 1. Fetch live meteorological and terrain indicators first
      const [w, env] = await Promise.all([
        getLiveWeather(monitoredLoc.lat, monitoredLoc.lon, true),
        getEnvironmentalData(monitoredLoc.lat, monitoredLoc.lon)
      ]);

      // 2. Fetch road accessibility, active alerts, and 72h forecast using live w & env
      const [rds, alr, trd] = await Promise.all([
        getRoadAccessibility(monitoredLoc.lat, monitoredLoc.lon, monitoredLoc.displayName, w, env),
        getDisasterAlerts(monitoredLoc.lat, monitoredLoc.lon, monitoredLoc.displayName, w, env),
        get72HourTrend(monitoredLoc.lat, monitoredLoc.lon, env)
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
        rds,
        env
      );

      setAiSummary(summary);
      setAiLoading(false);

      // Deduplicated Timeline Logging
      const coordKey = `${monitoredLoc.lat.toFixed(3)}_${monitoredLoc.lon.toFixed(3)}`;
      if (lastLoggedCoordRef.current !== coordKey) {
        lastLoggedCoordRef.current = coordKey;
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newEvents: MonitoringTimelineEvent[] = [
          {
            id: `t_loc_${Date.now()}`,
            time: nowStr,
            title: 'Monitored Location Synchronized',
            category: 'SYSTEM',
            details: `Target: ${monitoredLoc.displayName} (${monitoredLoc.lat.toFixed(4)}°N, ${monitoredLoc.lon.toFixed(4)}°E)`
          },
          {
            id: `t_rad_${Date.now() + 1}`,
            time: nowStr,
            title: 'Open-Meteo Radar Feed Refreshed',
            category: 'WEATHER',
            details: `Precipitation: ${w ? w.precipitation.toFixed(1) : '0.0'} mm/h | Temp: ${w ? w.temperature.toFixed(1) : '20.0'}°C | Wind: ${w ? w.windSpeed.toFixed(1) : '10.0'} km/h`
          },
          {
            id: `t_env_${Date.now() + 2}`,
            time: nowStr,
            title: 'Terrain Hazard Telemetry Synced',
            category: 'RISK',
            details: `Elevation: ${env.elevationMsl}m MSL | Terrain Slope: ${env.slopeDegrees}° | Soil Saturation: ${env.soilMoistureIndex}%`
          },
          {
            id: `t_alt_${Date.now() + 3}`,
            time: nowStr,
            title: 'Active Sensor & Alert Grid Checked',
            category: 'ALERT',
            details: alr.some(a => a.severity === 'EXTREME' || a.severity === 'HIGH')
              ? `High-priority alerts active: ${alr.filter(a => a.severity === 'EXTREME' || a.severity === 'HIGH').map(a => a.type).join('; ')}`
              : `All real-time sensors nominal. No active disaster warnings triggered.`
          }
        ];

        setTimeline(prev => {
          return [...newEvents, ...prev.filter(e => !e.details.includes(monitoredLoc.displayName))].slice(0, 25);
        });
      }
    }

    loadTelemetry();
  }, [monitoredLoc.lat, monitoredLoc.lon, monitoredLoc.displayName]);

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
          alert(`Geolocation permission denied or unavailable: ${err.message}`);
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
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

    const layerKey = viewMode === 'satellite' ? selectedSatelliteLayer : selectedMapLayer;
    const layerConfig = MAP_LAYERS[layerKey] || (viewMode === 'satellite' ? MAP_LAYERS.esriImagery : MAP_LAYERS.osm);

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
        maxZoom: layerConfig.maxZoom || 19,
        subdomains: layerConfig.subdomains || ['a', 'b', 'c']
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

  }, [monitoredLoc, monitoringRadiusKm, selectedMapLayer, selectedSatelliteLayer, viewMode]);

  // Clean up Leaflet map instance on unmount & handle container resizing
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 1.5,
            tension: 0.35,
            yAxisID: 'yWind'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { size: 11, weight: 'bold' } }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: (context: any) => {
                if (context.dataset.label?.includes('Risk')) {
                  return `Disaster Risk: ${context.parsed.y}%`;
                }
                if (context.dataset.label?.includes('Rainfall')) {
                  return `Rainfall: ${context.parsed.y} mm`;
                }
                if (context.dataset.label?.includes('Wind')) {
                  return `Wind Gusts: ${context.parsed.y} km/h`;
                }
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
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
            title: { display: true, text: 'Risk Score (%)', color: '#f87171', font: { size: 10, weight: 'bold' } },
            ticks: { color: '#f87171', font: { size: 10 } },
            grid: { color: 'rgba(51, 65, 85, 0.2)' }
          },
          yPrecip: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            suggestedMax: 5,
            title: { display: true, text: 'Rain (mm)', color: '#38bdf8', font: { size: 10, weight: 'bold' } },
            ticks: { color: '#38bdf8', font: { size: 10 } },
            grid: { display: false }
          },
          yWind: {
            type: 'linear',
            position: 'right',
            beginAtZero: true,
            suggestedMax: 25,
            title: { display: true, text: 'Wind (km/h)', color: '#10b981', font: { size: 10, weight: 'bold' } },
            ticks: { color: '#10b981', font: { size: 10 } },
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

  // Environmental Terrain Slides definition
  const terrainSlides = envData ? [
    {
      id: 'elevation',
      title: 'Terrain Elevation (MSL)',
      value: `${envData.elevationMsl} m`,
      unit: 'Meters Above Sea Level',
      status: envData.elevationMsl > 1200 ? 'High Alpine' : envData.elevationMsl > 400 ? 'Hilly Uplands' : 'Valley Plain',
      statusColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      description: 'Live topographical elevation from Open-Meteo SRTM high-resolution digital elevation model.',
      icon: Mountain,
      iconColor: 'text-emerald-500 bg-emerald-500/15 border-emerald-500/30',
      metricPercent: Math.min(100, Math.round((envData.elevationMsl / 3500) * 100)),
      metricLabel: 'Elevation Gradient',
      accentColor: 'from-emerald-500 to-teal-400'
    },
    {
      id: 'slope',
      title: 'Terrain Slope Steepness',
      value: `${envData.slopeDegrees}° Incline`,
      unit: 'Surface Gradient',
      status: envData.slopeDegrees > 28 ? 'Steep Critical (>25°)' : envData.slopeDegrees > 15 ? 'Moderate Grade' : 'Stable Slope',
      statusColor: envData.slopeDegrees > 28 ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      description: 'Determines slope instability, gravity-driven debris velocity, and flash flood flow acceleration.',
      icon: TrendingUp,
      iconColor: 'text-amber-500 bg-amber-500/15 border-amber-500/30',
      metricPercent: Math.min(100, Math.round((envData.slopeDegrees / 50) * 100)),
      metricLabel: 'Slope Angle Risk',
      accentColor: 'from-amber-500 to-rose-500'
    },
    {
      id: 'moisture',
      title: 'Soil Moisture Saturation',
      value: `${envData.soilMoistureIndex}%`,
      unit: 'Volumetric Water Content',
      status: envData.soilMoistureIndex > 75 ? 'Critically Saturated' : envData.soilMoistureIndex > 45 ? 'Moist Ground' : 'Stable Moisture',
      statusColor: envData.soilMoistureIndex > 75 ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-sky-500 bg-sky-500/10 border-sky-500/30',
      description: 'Live topsoil percolation index from Open-Meteo satellite sensors. Saturated soil accelerates mudslides.',
      icon: Droplets,
      iconColor: 'text-sky-500 bg-sky-500/15 border-sky-500/30',
      metricPercent: envData.soilMoistureIndex,
      metricLabel: 'Saturation Index',
      accentColor: 'from-sky-400 to-blue-600'
    },
    {
      id: 'river',
      title: 'Nearest River Catchment',
      value: `${envData.waterBodyProximityKm} km`,
      unit: 'Distance to Catchment',
      status: envData.waterBodyProximityKm < 1.5 ? 'Flood Buffer (<1.5km)' : 'Moderate Distance',
      statusColor: envData.waterBodyProximityKm < 1.5 ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30',
      description: 'Proximity to nearest active river tributary, basin stream, or natural rainwater catchment corridor.',
      icon: Waves,
      iconColor: 'text-indigo-500 bg-indigo-500/15 border-indigo-500/30',
      metricPercent: Math.max(10, 100 - Math.round(envData.waterBodyProximityKm * 20)),
      metricLabel: 'Proximity Impact',
      accentColor: 'from-indigo-500 to-cyan-400'
    },
    {
      id: 'fault',
      title: 'Active Fault Proximity',
      value: `${envData.seismicFaultDistanceKm} km`,
      unit: 'Tectonic Fracture Distance',
      status: envData.seismicFaultDistanceKm < 15 ? 'Zone V High Shear' : 'Zone IV Moderate',
      statusColor: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
      description: 'Geological Survey of India seismic fault proximity for liquefaction and crustal tremor correlation.',
      icon: Activity,
      iconColor: 'text-purple-500 bg-purple-500/15 border-purple-500/30',
      metricPercent: Math.max(15, 100 - Math.round(envData.seismicFaultDistanceKm * 2)),
      metricLabel: 'Seismic Correlation',
      accentColor: 'from-purple-500 to-rose-500'
    },
    {
      id: 'drainage',
      title: 'Natural Drainage Capacity',
      value: envData.drainageCapacity,
      unit: 'Runoff Percolation Efficiency',
      status: envData.drainageCapacity === 'POOR' || envData.drainageCapacity === 'CRITICAL' ? 'Waterlogging Risk' : 'Effective Runoff',
      statusColor: envData.drainageCapacity === 'POOR' || envData.drainageCapacity === 'CRITICAL' ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-teal-500 bg-teal-500/10 border-teal-500/30',
      description: 'Topographic capability to naturally discharge surface stormwater and avoid deep waterlogging.',
      icon: ShieldCheck,
      iconColor: 'text-teal-500 bg-teal-500/15 border-teal-500/30',
      metricPercent: envData.drainageCapacity === 'HIGH' ? 85 : envData.drainageCapacity === 'MODERATE' ? 55 : 25,
      metricLabel: 'Drainage Efficiency',
      accentColor: 'from-teal-400 to-emerald-600'
    }
  ] : [];

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
            <div className="relative">
              <select
                value={disasterType}
                onChange={e => setDisasterType(e.target.value)}
                className="w-full bg-transparent text-slate-900 dark:text-white font-bold cursor-pointer focus:outline-none pr-6 appearance-none"
              >
                <option value="Landslide & Cloudburst" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-medium">🌧️ Landslide & Cloudburst</option>
                <option value="Severe Flash Flood" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-medium">🌊 Severe Flash Flood</option>
                <option value="Cyclone & Gale Wind" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-medium">🌀 Cyclone & Gale Wind</option>
                <option value="Wildfire & Forest Fire" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-medium">🔥 Wildfire & Forest Fire</option>
                <option value="Earthquake & Liquefaction" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1 font-medium">🌋 Earthquake & Seismic Risk</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Disaster Status Selector */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-0.5 font-bold">{t("smartmonitoring.statusMode", "Status Mode")}</label>
            <div className="relative">
              <select
                value={disasterStatus}
                onChange={e => setDisasterStatus(e.target.value as any)}
                className="w-full bg-transparent text-emerald-600 dark:text-emerald-400 font-bold cursor-pointer focus:outline-none pr-6 appearance-none"
              >
                <option value="ACTIVE" className="bg-white dark:bg-slate-900 text-rose-500 font-bold py-1">🔴 ACTIVE</option>
                <option value="ESCALATING" className="bg-white dark:bg-slate-900 text-amber-500 font-bold py-1">⚠️ ESCALATING</option>
                <option value="STABLE" className="bg-white dark:bg-slate-900 text-emerald-500 font-bold py-1">🟢 STABLE</option>
                <option value="MONITORING" className="bg-white dark:bg-slate-900 text-sky-500 font-bold py-1">🔵 MONITORING</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Current Risk Badge */}
          <div className={`rounded-2xl border px-4 py-2.5 shadow-lg flex flex-col items-end ${currentRisk.color}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t("smartmonitoring.currentDisasterRisk", "CURRENT DISASTER RISK")}</span>
            <div className="text-xl font-black">{currentRisk.level} ({currentRisk.score}%)</div>
          </div>
        </div>
      </div>

      {/* 2. LOCATION CONTROLS & MONITORING RADIUS BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-xl flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 transition-colors duration-300">
        
        {/* Search Place Address */}
        <div className="flex-1 min-w-[260px] max-w-xl relative">
          <form onSubmit={handleLocationSearch} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={t("smartmonitoring.searchPlaceholder", "Search location, village, PIN code or district...")}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow shrink-0 whitespace-nowrap transition cursor-pointer"
            >
              {isSearching ? t('smartmonitoring.searching', 'Searching...') : t('smartmonitoring.searchBtn', 'Search')}
            </button>
          </form>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-[2000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-2xl max-h-56 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">Nominatim OSM Match Results</div>
              {searchResults.map((res, i) => (
                <div
                  key={i}
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

        {/* Manual Coordinates & Geolocation Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Manual Lat/Lon Coordinates */}
          <form onSubmit={handleManualCoordSubmit} className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{t("smartmonitoring.latLabel", "Lat:")}</span>
              <input
                type="text"
                value={latInput}
                onChange={e => setLatInput(e.target.value)}
                className="w-20 sm:w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs text-slate-900 dark:text-white font-mono text-center outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">{t("smartmonitoring.lonLabel", "Lon:")}</span>
              <input
                type="text"
                value={lonInput}
                onChange={e => setLonInput(e.target.value)}
                className="w-20 sm:w-24 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-xs text-slate-900 dark:text-white font-mono text-center outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shrink-0 whitespace-nowrap transition cursor-pointer shadow-sm active:scale-95"
            >
              {t("smartmonitoring.updateBtn", "Update")}
            </button>
          </form>

          {/* Current GPS Geolocation */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap transition cursor-pointer shadow-sm active:scale-95"
          >
            <Compass className="h-3.5 w-3.5 shrink-0" />
            <span>{t("smartmonitoring.myLocationBtn", "My Location")}</span>
          </button>

          {/* Radius Selector */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1 shrink-0">
            {[2, 5, 10, 25].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setMonitoringRadiusKm(r)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* LEFT COLUMN: LIVE MAP & ROAD ACCESSIBILITY */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">

          {/* LIVE MAP CARD */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl flex flex-col h-[420px] transition-colors duration-300">
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
                    type="button"
                    onClick={() => setViewMode('map')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                      viewMode === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t("smartmonitoring.mapView", "🗺️ Map View")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('satellite')}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer ${
                      viewMode === 'satellite' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t("smartmonitoring.satelliteView", "🛰️ Satellite View")}
                  </button>
                </div>

                {/* Layer Selector */}
                {viewMode === 'map' ? (
                  <select
                    value={selectedMapLayer}
                    onChange={e => setSelectedMapLayer(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="osm" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🗺️ OSM Standard</option>
                    <option value="openTopo" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🏔️ OpenTopo Relief</option>
                  </select>
                ) : (
                  <select
                    value={selectedSatelliteLayer}
                    onChange={e => setSelectedSatelliteLayer(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1 text-xs text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    <option value="esriImagery" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🛰️ Esri Satellite</option>
                    <option value="googleHybrid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🛰️ Google Hybrid</option>
                    <option value="googleSatellite" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">🛰️ Google Satellite</option>
                  </select>
                )}
              </div>
            </div>

            {/* Map Container */}
            <div className="relative flex-1 min-h-[300px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div ref={mapContainerRef} className="h-full w-full" />
              
              {/* Map Footer Overlay Instructions */}
              <div className="absolute left-3 bottom-3 z-[1000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-3 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 backdrop-blur flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>{t("smartmonitoring.mapFooterNotice", "Click anywhere on the map to set a new monitored location pin.")}</span>
              </div>
            </div>
          </div>

          {/* ROAD & TRANSPORT ACCESSIBILITY PANEL (UNDER MAP IN EMPTY SPACE) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Truck className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                  <span>Road &amp; Transport Accessibility</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Live traffic &amp; weather safety corridors
                </p>
              </div>

              {/* Status Summary Pills */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {roads.filter(r => r.status === 'OPEN').length} Safe
                </span>
                {roads.filter(r => r.status === 'PARTIALLY_ACCESSIBLE').length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {roads.filter(r => r.status === 'PARTIALLY_ACCESSIBLE').length} Caution
                  </span>
                )}
                {roads.filter(r => r.status === 'BLOCKED').length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
                    {roads.filter(r => r.status === 'BLOCKED').length} Closed
                  </span>
                )}
              </div>
            </div>

            {/* Clean 2x2 Grid of Roads */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {roads.map(rd => {
                const isOpen = rd.status === 'OPEN';
                const isCaution = rd.status === 'PARTIALLY_ACCESSIBLE';
                const isBlocked = rd.status === 'BLOCKED';

                return (
                  <div
                    key={rd.id}
                    className={`rounded-xl border p-2.5 sm:p-3 flex flex-col justify-between space-y-2 transition-all ${
                      isBlocked
                        ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20'
                        : isCaution
                        ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {rd.name}
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1">
                          {rd.warning}
                        </p>
                      </div>

                      {/* Large, Easy Status Badge */}
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[9px] font-extrabold shrink-0 border flex items-center gap-1 shadow-sm whitespace-nowrap ${
                          isOpen
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                            : isCaution
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-emerald-500' : isCaution ? 'bg-amber-500' : 'bg-rose-500'}`} />
                        {isOpen ? 'SAFE & OPEN' : isCaution ? 'DRIVE SLOW' : 'ROAD CLOSED'}
                      </span>
                    </div>

                    {/* Bottom simple guidance row */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 pt-1.5 font-medium">
                      <span>Speed: <b className="text-slate-700 dark:text-slate-300">{rd.speedKmH > 0 ? `~${rd.speedKmH} km/h` : 'Halted'}</b></span>
                      <span className="truncate ml-1">{rd.detour !== 'None' && rd.detour !== 'None required' ? `Detour: ${rd.detour}` : '✓ No detour needed'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
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

          {/* 6. ENVIRONMENTAL MONITORING PANEL - REAL-TIME SLIDESHOW CAROUSEL */}
          <div 
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300 relative group"
            onMouseEnter={() => setIsTerrainAutoPlay(false)}
            onMouseLeave={() => setIsTerrainAutoPlay(true)}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Mountain className="h-5 w-5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Environmental Terrain Indicators
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span className="truncate">Live Real-Time Telemetry</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Slideshow vs Grid Toggle */}
                <button
                  type="button"
                  onClick={() => setTerrainViewMode(terrainViewMode === 'slideshow' ? 'grid' : 'slideshow')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer shrink-0"
                  title="Toggle Slideshow or View All"
                >
                  {terrainViewMode === 'slideshow' ? 'View All' : 'Slideshow'}
                </button>
              </div>
            </div>

            {envData && terrainSlides.length > 0 ? (
              terrainViewMode === 'slideshow' ? (
                /* Interactive Slideshow View */
                <div className="space-y-4">
                  {/* Current Active Slide Card */}
                  <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-950 dark:to-slate-900/90 p-4 shadow-sm min-h-[190px] flex flex-col justify-between">
                    {/* Top Row: Icon + Title + Status Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {React.createElement(terrainSlides[currentTerrainSlide].icon, {
                          className: `h-7 w-7 p-1.5 rounded-xl border shrink-0 ${terrainSlides[currentTerrainSlide].iconColor}`
                        })}
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                          {terrainSlides[currentTerrainSlide].title}
                        </span>
                      </div>

                      {/* Status Tag */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 whitespace-nowrap ${terrainSlides[currentTerrainSlide].statusColor}`}>
                        {terrainSlides[currentTerrainSlide].status}
                      </span>
                    </div>

                    {/* Value & Unit Display */}
                    <div className="flex items-baseline justify-between gap-2 my-1">
                      <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {terrainSlides[currentTerrainSlide].value}
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                        {terrainSlides[currentTerrainSlide].unit}
                      </span>
                    </div>

                    {/* Progress Gauge */}
                    <div className="space-y-1.5 my-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>{terrainSlides[currentTerrainSlide].metricLabel}</span>
                        <span>{terrainSlides[currentTerrainSlide].metricPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${terrainSlides[currentTerrainSlide].accentColor} transition-all duration-500`}
                          style={{ width: `${terrainSlides[currentTerrainSlide].metricPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Description Note */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {terrainSlides[currentTerrainSlide].description}
                    </p>
                  </div>

                  {/* Slideshow Controls Bar */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {terrainSlides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentTerrainSlide(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            currentTerrainSlide === idx
                              ? 'w-6 bg-emerald-500 shadow-sm shadow-emerald-500/50'
                              : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                          }`}
                          title={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                        {currentTerrainSlide + 1} / {terrainSlides.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentTerrainSlide(prev => (prev - 1 + terrainSlides.length) % terrainSlides.length)}
                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="Previous Slide"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentTerrainSlide(prev => (prev + 1) % terrainSlides.length)}
                        className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        title="Next Slide"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Compact Grid / View All View */
                <div className="space-y-2 text-xs">
                  {terrainSlides.map((slide) => (
                    <div
                      key={slide.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(slide.icon, { className: 'h-4 w-4 text-slate-500' })}
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{slide.title}:</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{slide.value}</span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Loading live topographical indicators...
              </div>
            )}
          </div>

        </div>
      </div>


      {/* 4. DISASTER ALERTS & 72-HOUR MONITORING TREND SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ACTIVE DISASTER ALERTS PANEL */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500 dark:text-amber-400 animate-bounce" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Active Disaster Alerts &amp; Verification
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Live sensor feeds verified against official monitoring networks
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {alerts.filter(a => a.isVerified).length} Live Feeds
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                {alerts.filter(a => !a.isVerified).length} AI Models
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {alerts.map(alt => {
              const isExtreme = alt.severity === 'EXTREME';
              const isHigh = alt.severity === 'HIGH';
              const isModerate = alt.severity === 'MODERATE';
              
              const borderLeft = isExtreme 
                ? 'border-l-4 border-l-rose-500 bg-rose-500/[0.03]' 
                : isHigh 
                ? 'border-l-4 border-l-orange-500 bg-orange-500/[0.03]'
                : isModerate
                ? 'border-l-4 border-l-amber-500 bg-amber-500/[0.03]'
                : 'border-l-4 border-l-emerald-500 bg-emerald-500/[0.03]';

              return (
                <div 
                  key={alt.id} 
                  className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 p-3.5 space-y-2.5 transition shadow-sm hover:shadow-md ${borderLeft}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className={`h-4 w-4 ${isExtreme ? 'text-rose-500' : isHigh ? 'text-orange-500' : isModerate ? 'text-amber-500' : 'text-emerald-500'}`} />
                      {alt.type}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {alt.isVerified ? (
                        <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          VERIFIED / LIVE
                        </span>
                      ) : (
                        <span className="rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 text-[10px] font-bold border border-indigo-500/30 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />
                          AI ESTIMATE
                        </span>
                      )}

                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        isExtreme ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                        isHigh ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30' :
                        isModerate ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                        'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {alt.severity}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Target Zone: <b className="text-slate-900 dark:text-white">{alt.locationName}</b></span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-2 font-medium">
                    <span>Source: <b className="text-slate-700 dark:text-slate-300">{alt.source}</b></span>
                    <span>Synced: <b className="text-slate-700 dark:text-slate-300">{alt.timestamp}</b></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 72-HOUR MONITORING SECTION */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  72-Hour Disaster Monitoring Outlook
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Open-Meteo hourly precipitation &amp; risk projection
                </span>
              </div>
            </div>

            <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
              AI RISK HORIZON
            </span>
          </div>

          {/* 0-24h, 24-48h, 48-72h Tabs */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-1">
            <button
              onClick={() => setActiveTab72h('24h')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab72h === '24h' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              0 – 24h (Immediate)
            </button>
            <button
              onClick={() => setActiveTab72h('48h')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab72h === '48h' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              24 – 48h (Evolution)
            </button>
            <button
              onClick={() => setActiveTab72h('72h')}
              className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
                activeTab72h === '72h' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              48 – 72h (Recovery)
            </button>
          </div>

          {/* Tab Content with Real-time Telemetry Metrics */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-3.5">
            {/* Real-time telemetry summary row for the active phase */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Forecast Rain</span>
                <b className="text-sky-600 dark:text-sky-400 text-sm sm:text-base font-black">
                  {trendData 
                    ? activeTab72h === '24h' 
                      ? `${Math.max(...trendData.rainfall.slice(0, 5))} mm`
                      : activeTab72h === '48h'
                      ? `${Math.max(...trendData.rainfall.slice(4, 7))} mm`
                      : `${Math.max(...trendData.rainfall.slice(6, 9))} mm`
                    : '0 mm'}
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Est. Temp</span>
                <b className="text-amber-600 dark:text-amber-400 text-sm sm:text-base font-black">
                  {trendData 
                    ? activeTab72h === '24h'
                      ? `${trendData.temp[0]}°C`
                      : activeTab72h === '48h'
                      ? `${trendData.temp[5] || trendData.temp[0]}°C`
                      : `${trendData.temp[8] || trendData.temp[0]}°C`
                    : '22°C'}
                </b>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Risk Score</span>
                <b className={`text-sm sm:text-base font-black ${
                  (trendData ? (activeTab72h === '24h' ? Math.max(...trendData.riskScore.slice(0, 5)) : activeTab72h === '48h' ? Math.max(...trendData.riskScore.slice(4, 7)) : Math.max(...trendData.riskScore.slice(6, 9))) : 30) > 70 
                    ? 'text-rose-500' 
                    : (trendData ? (activeTab72h === '24h' ? Math.max(...trendData.riskScore.slice(0, 5)) : activeTab72h === '48h' ? Math.max(...trendData.riskScore.slice(4, 7)) : Math.max(...trendData.riskScore.slice(6, 9))) : 30) > 40
                    ? 'text-amber-500'
                    : 'text-emerald-500'
                }`}>
                  {trendData 
                    ? activeTab72h === '24h'
                      ? `${Math.max(...trendData.riskScore.slice(0, 5))}%`
                      : activeTab72h === '48h'
                      ? `${Math.max(...trendData.riskScore.slice(4, 7))}%`
                      : `${Math.max(...trendData.riskScore.slice(6, 9))}%`
                    : '30%'}
                </b>
              </div>
            </div>

            {activeTab72h === '24h' && (() => {
              const maxR = trendData ? Math.max(...trendData.rainfall.slice(0, 5)) : 0;
              return (
                <>
                  <div className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                    Phase 1: Immediate Risk Window (0h ➔ 24h)
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {maxR > 15
                      ? `High precipitation alert (${maxR} mm peak). Surface runoff along feeder roads requires high vigilance and culvert clearing.`
                      : maxR > 0.5
                      ? `Scattered rainfall forecast (${maxR} mm peak). Moisture convergence monitored with localized slick surface alerts.`
                      : `Stable atmospheric conditions with dry to trace precipitation (${maxR} mm max). Normal surface traffic baseline.`}
                  </p>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                    <div>&bull; <b>Active Response Priority:</b> Clear drainage culverts along arterial roads and verify live Doppler radar.</div>
                    <div>&bull; <b>Logistics Warning:</b> {maxR > 10 ? 'Restrict heavy transport during peak rain spells.' : 'Standard logistics movement permitted with normal caution.'}</div>
                  </div>
                </>
              );
            })()}

            {activeTab72h === '48h' && (() => {
              const maxR = trendData ? Math.max(...trendData.rainfall.slice(4, 7)) : 0;
              return (
                <>
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                    Phase 2: Evolution &amp; Intermediate Horizon (24h ➔ 48h)
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {maxR > 15
                      ? `Sustained downpour expected (${maxR} mm peak). Slope saturation and waterlogging risks remain elevated.`
                      : maxR > 0.5
                      ? `Intermittent showers expected (${maxR} mm peak). Soil moisture saturation levels monitored.`
                      : `Fair weather outlook with negligible precipitation (${maxR} mm max). Ground saturation stabilizes into safe percolation limits.`}
                  </p>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                    <div>&bull; <b>Active Response Priority:</b> Inspect slope retaining walls and bridge foundations for waterlogging.</div>
                    <div>&bull; <b>Logistics Warning:</b> Reopen secondary routes under regulated speed limits.</div>
                  </div>
                </>
              );
            })()}

            {activeTab72h === '72h' && (() => {
              const maxR = trendData ? Math.max(...trendData.rainfall.slice(6, 9)) : 0;
              return (
                <>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    Phase 3: Extended Horizon &amp; Stabilization (48h ➔ 72h)
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {maxR > 15
                      ? `Late-phase rain surge (${maxR} mm peak) projected by weather models. Pre-position emergency teams.`
                      : maxR > 0.5
                      ? `Residual light rain (${maxR} mm peak). Overall risk index transitioning to nominal.`
                      : `Clear skies and low precipitation expected (${maxR} mm max). Risk level returns to green across all monitored corridors.`}
                  </p>
                  <div className="space-y-1.5 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
                    <div>&bull; <b>Active Response Priority:</b> Transition emergency teams to routine maintenance and audit sensor grids.</div>
                    <div>&bull; <b>Logistics Warning:</b> Full two-way highway traffic operational without detour restrictions.</div>
                  </div>
                </>
              );
            })()}
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
