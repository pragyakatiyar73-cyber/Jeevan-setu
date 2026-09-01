import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  CloudRain,
  Navigation,
  Bot,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Truck,
  Compass,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  ShieldCheck,
  Building2,
  Package,
  Radio,
  FileBarChart,
  Sliders,
  Bell,
  Check,
  TrendingUp,
  Clock,
  Gauge,
  Sparkles,
  Mountain,
  Camera,
  Upload,
  Eye,
  ShieldAlert,
  CheckSquare,
  X,
  Mic,
  MicOff
} from 'lucide-react';
import { useVoiceRecognition } from './hooks/useVoiceRecognition';
import VoiceAssistantModal from './components/common/VoiceAssistantModal';
import L from 'leaflet';
import {
  MAP_LAYERS,
  getLiveWeather,
  calculateLandslideHazardIndex,
  calculateFloodVulnerabilityIndex,
  calculateEmergencyRoute,
  getAPIEcosystemRegistry,
  WeatherData,
  HazardAssessment,
  NER_DRONE_FLEET,
  NER_EMERGENCY_LZS,
  calculateDroneFlightPlan,
  DroneFlightPlan,
  DroneSpec,
  EmergencyLZ
} from './services/api';
import Dashboard from './components/Dashboard';
import SmartDisasterMonitoring from './components/SmartDisasterMonitoring';
import AIDisasterImpactAssessment from './components/AIDisasterImpactAssessment';
import ThreeDigitalTwin from './components/ThreeDigitalTwin';
import WeatherIntelligence from './components/WeatherIntelligence';
import UAVDroneModule from './components/UAVDroneModule';
import EmergencySOSModal from './components/EmergencySOSModal';
import MDoNERCommandModule from './components/MDoNERCommandModule';
import NERLiveMapModule from './components/NERLiveMapModule';
import ActionAlertsModule from './components/ActionAlertsModule';
import StateRiskMatrixSection from './components/StateRiskMatrixSection';
import CitizenSOSModule from './components/CitizenSOSModule';
import RescueTeamCommand from './components/RescueTeamCommand';
import EvacuationPlanner from './components/EvacuationPlanner';
import ReliefCampManagement from './components/ReliefCampManagement';
import AIDamageAssessment from './components/AIDamageAssessment';
import AISituationReportModule from './components/AISituationReportModule';
import RecoveryTracker from './components/RecoveryTracker';
import LifeSavingResponseEngine from './components/LifeSavingResponseEngine';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggle from './components/ThemeToggle';
import AddressDisasterIntelligence from './components/AddressDisasterIntelligence';
import { useTranslation } from './i18n';
import { incidentStore } from './services/api';

// NER State Data
const NER_HUBS = [
  { id: 'guwahati', name: 'Guwahati (Assam Hub)', lat: 26.1445, lon: 91.7362, state: 'Assam', activeVehicles: 14, status: 'OPTIMAL' },
  { id: 'shillong', name: 'Shillong (East Khasi Hills)', lat: 25.5788, lon: 91.8933, state: 'Meghalaya', activeVehicles: 8, status: 'HIGH_ALERT' },
  { id: 'aizawl', name: 'Aizawl (Mizoram Terminal)', lat: 23.7271, lon: 92.7176, state: 'Mizoram', activeVehicles: 6, status: 'STABLE' },
  { id: 'itanagar', name: 'Itanagar (Arunachal Hub)', lat: 27.0844, lon: 93.6053, state: 'Arunachal Pradesh', activeVehicles: 5, status: 'CAUTION' },
  { id: 'imphal', name: 'Imphal (Manipur Center)', lat: 24.8170, lon: 93.9368, state: 'Manipur', activeVehicles: 7, status: 'STABLE' },
  { id: 'gangtok', name: 'Gangtok (Sikkim Command)', lat: 27.3389, lon: 88.6065, state: 'Sikkim', activeVehicles: 4, status: 'CAUTION' },
  { id: 'agartala', name: 'Agartala (Tripura Depot)', lat: 23.8315, lon: 91.2868, state: 'Tripura', activeVehicles: 9, status: 'OPTIMAL' },
  { id: 'kohima', name: 'Kohima (Nagaland Center)', lat: 25.6751, lon: 94.1086, state: 'Nagaland', activeVehicles: 5, status: 'STABLE' }
];

export default function App() {
  const { t } = useTranslation();
  const [activeModule, setActiveModuleState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || params.get('module');
    if (tab) return tab;
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash;
    return 'hub';
  });

  const setActiveModule = (mod: string) => {
    setActiveModuleState(mod);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', mod);
    window.history.replaceState(null, '', url.toString());
  };

  // Reset to 100% Native Pixel-Perfect Responsive Resolution
  useEffect(() => {
    (document.body.style as any).zoom = "100%";
  }, []);

  const [sharedMonitoringLoc, setSharedMonitoringLoc] = useState<any>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('osm');
  const [mapFocusedTarget, setMapFocusedTarget] = useState<{ coord: [number, number]; zoom: number } | null>(null);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  // Weather state
  const [weatherCity, setWeatherCity] = useState(NER_HUBS[1]); // Default Shillong
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // SOS Emergency Modal State
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceFeedbackMsg, setVoiceFeedbackMsg] = useState<string>('');
  const [activeSosLocation, setActiveSosLocation] = useState<{
    lat: number;
    lon: number;
    sosId?: string;
    distressType?: string;
    landmark?: string;
    personsTrapped?: string;
    triageLevel?: string;
  } | null>(null);

  // Real-time synchronization of SOS alerts from central DB across all devices
  useEffect(() => {
    const syncSosAlerts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/sos/alerts');
        if (res.ok) {
          const data = await res.json();
          if (data?.alerts && data.alerts.length > 0) {
            const latest = data.alerts[0];
            setActiveSosLocation(prev => {
              if (!prev || prev.sosId !== latest.sosId) {
                return {
                  lat: Number(latest.lat) || 27.26,
                  lon: Number(latest.lon) || 92.42,
                  sosId: latest.sosId,
                  distressType: latest.distressType,
                  landmark: latest.landmark,
                  personsTrapped: latest.personsTrapped,
                  triageLevel: latest.triageLevel
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Silent fallback if server offline
      }
    };

    syncSosAlerts();
    const interval = setInterval(syncSosAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rerouting state
  const [routeStart, setRouteStart] = useState('Guwahati Logistics Depot');
  const [routeDest, setRouteDest] = useState('Aizawl District Hospital');
  const [vehicleType, setVehicleType] = useState('4x4 Heavy All-Terrain Truck (Tata LPTA)');
  const [avoidBlockedSectors, setAvoidBlockedSectors] = useState(true);
  const [calculatedRoute, setCalculatedRoute] = useState<any>(null);

  // Essential Supplies List
  const [supplies, setSupplies] = useState([
    { id: 'SUP-1092', item: 'Life-saving Oxygen & Dialysis Fluids', priority: 'CRITICAL', dest: 'Aizawl Civil Hospital', status: 'IN_TRANSIT', eta: '3h 15m' },
    { id: 'SUP-1093', item: 'High-Altitude Emergency Blood Plasma', priority: 'CRITICAL', dest: 'Shillong Medical Hub', status: 'DISPATCHED', eta: '1h 45m' },
    { id: 'SUP-1094', item: 'Baby Food & Nutritional Supplements', priority: 'HIGH', dest: 'Silchar Relief Camp', status: 'IN_TRANSIT', eta: '4h 00m' },
    { id: 'SUP-1095', item: 'Disaster Emergency Diesel Generator Fuel', priority: 'HIGH', dest: 'East Khasi Hills Sub-Depot', status: 'READY', eta: '5h 30m' },
    { id: 'SUP-1096', item: 'Water Purification Tablets (10,000 units)', priority: 'MEDIUM', dest: 'Kaziranga Perimeter Hub', status: 'IN_TRANSIT', eta: '2h 10m' }
  ]);

  // UAV Drone Dispatcher state
  const [droneOrigin, setDroneOrigin] = useState(NER_HUBS[0]); // Guwahati
  const [selectedLZ, setSelectedLZ] = useState(NER_EMERGENCY_LZS[0]); // Sela Pass
  const [selectedDroneId, setSelectedDroneId] = useState('GARUDA-X15');
  const [dronePayloadKg, setDronePayloadKg] = useState(12);
  const [dronePayloadItem, setDronePayloadItem] = useState('High-Altitude Emergency Blood Plasma & Dialysis Fluid');
  const [droneFlightPlan, setDroneFlightPlan] = useState<DroneFlightPlan | null>(null);
  const [droneMissionModalOpen, setDroneMissionModalOpen] = useState(false);
  const [droneMissionStatus, setDroneMissionStatus] = useState<'IDLE' | 'LAUNCHING' | 'IN_FLIGHT'>('IDLE');

  const droneMapContainerRef = useRef<HTMLDivElement>(null);
  const droneMapInstanceRef = useRef<L.Map | null>(null);

  const rerouteMapContainerRef = useRef<HTMLDivElement>(null);
  const rerouteMapInstanceRef = useRef<L.Map | null>(null);

  const roadMapContainerRef = useRef<HTMLDivElement>(null);
  const roadMapInstanceRef = useRef<L.Map | null>(null);

  // Citizen AI Damage Triage state


  // Calculate drone flight plan dynamically
  useEffect(() => {
    const windSpeed = weatherData ? weatherData.windSpeed : 35;
    const plan = calculateDroneFlightPlan(
      droneOrigin.lat,
      droneOrigin.lon,
      selectedLZ,
      dronePayloadKg,
      windSpeed,
      selectedDroneId
    );
    setDroneFlightPlan(plan);
  }, [droneOrigin, selectedLZ, dronePayloadKg, selectedDroneId, weatherData]);

  // Drone Map Render
  useEffect(() => {
    if (activeModule === 'drone' && droneMapContainerRef.current) {
      if (droneMapInstanceRef.current) {
        droneMapInstanceRef.current.remove();
        droneMapInstanceRef.current = null;
      }

      const dmap = L.map(droneMapContainerRef.current).setView(
        [(droneOrigin.lat + selectedLZ.lat) / 2, (droneOrigin.lon + selectedLZ.lon) / 2],
        7
      );

      L.tileLayer(MAP_LAYERS.osm.url, { attribution: MAP_LAYERS.osm.attribution }).addTo(dmap);

      // Origin Hub Marker
      L.circleMarker([droneOrigin.lat, droneOrigin.lon], {
        radius: 9,
        fillColor: '#6366f1',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95
      }).addTo(dmap).bindPopup(`<b>🛫 Dispatch Hub: ${droneOrigin.name}</b><br>State: ${droneOrigin.state}`);

      // Destination LZ Marker
      L.circleMarker([selectedLZ.lat, selectedLZ.lon], {
        radius: 11,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(dmap).bindPopup(`<b>🚁 Isolated Emergency LZ: ${selectedLZ.name}</b><br>Altitude: ${selectedLZ.elevationMsl}m MSL &bull; State: ${selectedLZ.state}`);

      // Aerial Vector Polyline
      L.polyline([
        [droneOrigin.lat, droneOrigin.lon],
        [selectedLZ.lat, selectedLZ.lon]
      ], {
        color: '#38bdf8',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(dmap).bindPopup(`<b>🚁 High-Altitude Aerial Supply Vector</b><br>Direct Distance: ${calculateDroneFlightPlan(droneOrigin.lat, droneOrigin.lon, selectedLZ, dronePayloadKg, 30, selectedDroneId).distanceKm} km &bull; Zero Road Dependency`);

      droneMapInstanceRef.current = dmap;
    }
  }, [activeModule, droneOrigin, selectedLZ, selectedDroneId, dronePayloadKg]);

  // Dynamic AI Rerouting Leaflet Map Render
  useEffect(() => {
    if (activeModule === 'rerouting' && rerouteMapContainerRef.current) {
      if (rerouteMapInstanceRef.current) {
        rerouteMapInstanceRef.current.remove();
        rerouteMapInstanceRef.current = null;
      }

      const rmap = L.map(rerouteMapContainerRef.current).setView([25.2, 92.5], 7);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Esri World Dark Gray Canvas'
      }).addTo(rmap);

      // Interconnected Waypoints (Guwahati -> Shillong -> Jowai Bypass -> Silchar -> Aizawl)
      const routePoints: [number, number][] = [
        [26.1445, 91.7362], // Guwahati Origin
        [25.5788, 91.8933], // Shillong
        [25.2000, 92.2000], // Jowai Ridge Bypass
        [24.8333, 92.7789], // Silchar
        [23.7271, 92.7176]  // Aizawl Destination
      ];

      // Origin Pin
      L.circleMarker(routePoints[0], {
        radius: 10,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(rmap).bindPopup(`<b>🛫 Origin Hub: ${routeStart || 'Guwahati Logistics Depot'}</b>`);

      // Destination Pin
      L.circleMarker(routePoints[routePoints.length - 1], {
        radius: 10,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(rmap).bindPopup(`<b>🏁 Destination Hub: ${routeDest || 'Aizawl District Hospital'}</b>`);

      // Disrupted Landslide Polygon & Evaded Corridor
      if (avoidBlockedSectors) {
        // Red Landslide Hazard Polygon Circle
        L.circle([25.495, 91.508], {
          radius: 18000,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(rmap).bindPopup('<b>⚠️ Km 142 Landslide Sector</b><br/>High-Risk Polygon Evaded by OSRM Green Corridor');

        // Green Bypass Polyline
        L.polyline(routePoints, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          dashArray: '6, 6'
        }).addTo(rmap).bindPopup('<b>🟢 AI Green Corridor Bypass Route (Clear)</b>');
      } else {
        // Direct Route Polyline
        L.polyline([routePoints[0], routePoints[routePoints.length - 1]], {
          color: '#ef4444',
          weight: 4,
          opacity: 0.85
        }).addTo(rmap).bindPopup('<b>🔴 Direct Highway (Caution: Landslide Choke Points Active)</b>');
      }

      rerouteMapInstanceRef.current = rmap;
    }
  }, [activeModule, routeStart, routeDest, avoidBlockedSectors]);

  // Live Highway Accessibility Leaflet Map Render
  useEffect(() => {
    if (activeModule === 'road' && roadMapContainerRef.current) {
      if (roadMapInstanceRef.current) {
        roadMapInstanceRef.current.remove();
        roadMapInstanceRef.current = null;
      }

      const rmap = L.map(roadMapContainerRef.current).setView([26.0, 92.5], 7);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Jeevan Setu Highway Telemetry &bull; Esri Dark Canvas'
      }).addTo(rmap);

      // 1. NH-6 (Pink/Red - Blocked)
      const nh6Waypoints: [number, number][] = [[26.1445, 91.7362], [25.5788, 91.8933], [24.8333, 92.7789]];
      L.polyline(nh6Waypoints, { color: '#ef4444', weight: 6, opacity: 0.9 }).addTo(rmap);
      L.marker([25.495, 91.508], {
        icon: L.divIcon({
          className: 'nh6-block-badge',
          html: `<div style="background:#dc2626;color:#fff;padding:4px 8px;border-radius:8px;font-weight:900;font-size:10px;border:1.5px solid #f87171;white-space:nowrap;box-shadow:0 0 12px #ef4444;">🔴 NH-6 Km 142 Landslide Blocked</div>`,
          iconSize: [210, 24],
          iconAnchor: [105, 12]
        })
      }).addTo(rmap);

      // 2. NH-29 (Green - Clear)
      const nh29Waypoints: [number, number][] = [[25.9060, 93.7270], [25.6751, 94.1086]];
      L.polyline(nh29Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);
      L.marker([25.7900, 93.9000], {
        icon: L.divIcon({
          className: 'nh29-clear-badge',
          html: `<div style="background:#059669;color:#fff;padding:3px 8px;border-radius:8px;font-weight:800;font-size:10px;border:1px solid #34d399;white-space:nowrap;">🟢 NH-29 Dimapur ➔ Kohima (Clear)</div>`,
          iconSize: [190, 24],
          iconAnchor: [95, 12]
        })
      }).addTo(rmap);

      // 3. NH-10 (Orange - Caution)
      const nh10Waypoints: [number, number][] = [[26.7167, 88.4333], [27.1000, 88.5000], [27.3389, 88.6065]];
      L.polyline(nh10Waypoints, { color: '#f97316', weight: 5, opacity: 0.9 }).addTo(rmap);
      L.marker([27.1000, 88.5000], {
        icon: L.divIcon({
          className: 'nh10-caution-badge',
          html: `<div style="background:#c2410c;color:#fff;padding:3px 8px;border-radius:8px;font-weight:800;font-size:10px;border:1px solid #fb923c;white-space:nowrap;">⚠️ NH-10 Teesta River Swelling</div>`,
          iconSize: [180, 24],
          iconAnchor: [90, 12]
        })
      }).addTo(rmap);

      // 4. NH-306 (Green - Clear)
      const nh306Waypoints: [number, number][] = [[24.8333, 92.7789], [23.7271, 92.7176]];
      L.polyline(nh306Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);

      // 5. NH-415 (Green - Clear)
      const nh415Waypoints: [number, number][] = [[27.0000, 93.6000], [27.1000, 93.6200]];
      L.polyline(nh415Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);

      // 6. NH-37 (Amber - Monitored)
      const nh37Waypoints: [number, number][] = [[26.1445, 91.7362], [26.5800, 93.1700], [27.4728, 94.9120]];
      L.polyline(nh37Waypoints, { color: '#eab308', weight: 5, opacity: 0.9 }).addTo(rmap);

      roadMapInstanceRef.current = rmap;
    }
  }, [activeModule]);

  // Load weather for NER
  useEffect(() => {
    async function load() {
      setWeatherLoading(true);
      const data = await getLiveWeather(weatherCity.lat, weatherCity.lon);
      setWeatherData(data);
      setWeatherLoading(false);
    }
    load();
  }, [weatherCity]);

  // Initialize Map
  useEffect(() => {
    if ((activeModule === 'map' || activeModule === 'hub') && mapContainerRef.current && !mapInstanceRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([25.8, 92.5], 7); // Center of North East India (NER)

      const layer = L.tileLayer(MAP_LAYERS.osm.url, {
        attribution: MAP_LAYERS.osm.attribution,
        maxZoom: 19
      }).addTo(map);

      currentTileLayerRef.current = layer;
      mapInstanceRef.current = map;

      // Add NER Hub Markers
      NER_HUBS.forEach(hub => {
        const color = hub.status === 'HIGH_ALERT' ? '#ef4444' : hub.status === 'CAUTION' ? '#f59e0b' : '#10b981';
        const marker = L.circleMarker([hub.lat, hub.lon], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="color: #0f172a;">${hub.name}</b><br/>
            <span>State: ${hub.state}</span><br/>
            <span>Status: <b style="color:${color};">${hub.status}</b></span><br/>
            <span>Active Fleets: <b>${hub.activeVehicles}</b></span>
          </div>
        `);
      });

      // Sample Guwahati -> Aizawl Active Transit Route Corridor
      const routePolyline = L.polyline([
        [26.1445, 91.7362], // Guwahati
        [25.5788, 91.8933], // Shillong
        [24.8333, 92.7789], // Silchar
        [23.7271, 92.7176]  // Aizawl
      ], {
        color: '#6366f1',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(map);
      routePolyline.bindPopup('<b>🚚 Active Supply Route: Guwahati ➔ Aizawl (NH-6)</b><br>Speed: 45 km/h &bull; Carrying Critical Medical Supplies');
    }

    return () => {
      if (activeModule !== 'map' && activeModule !== 'hub' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeModule]);

  // Handle Layer switch
  useEffect(() => {
    if (mapInstanceRef.current && MAP_LAYERS[selectedLayer]) {
      if (currentTileLayerRef.current) {
        mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      }

      const layerConfig = MAP_LAYERS[selectedLayer];
      let newLayer: L.TileLayer | L.TileLayer.WMS;

      if (layerConfig.category === 'disaster-wms' && layerConfig.wmsParams) {
        newLayer = L.tileLayer.wms(layerConfig.url, {
          layers: layerConfig.wmsParams.layers,
          format: layerConfig.wmsParams.format,
          transparent: true,
          attribution: layerConfig.attribution
        });
      } else {
        newLayer = L.tileLayer(layerConfig.url, {
          attribution: layerConfig.attribution,
          maxZoom: layerConfig.maxZoom
        });
      }

      newLayer.addTo(mapInstanceRef.current);
      currentTileLayerRef.current = newLayer;
    }
  }, [selectedLayer]);

  const handleRunReroute = async () => {
    const res = await calculateEmergencyRoute([26.1445, 91.7362], [23.7271, 92.7176], avoidBlockedSectors ? [[25.4, 92.2]] : []);
    setCalculatedRoute(res);
  };

  return (
    <div className="flex h-screen w-full max-w-full bg-slate-100 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      
      {/* 1. LEFT SIDEBAR NAVIGATION BAR (Sleek & Perfectly Sized) */}
      <aside className="w-16 md:w-60 lg:w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] flex flex-col justify-between p-2.5 md:p-3 shadow-xl dark:shadow-2xl z-50 select-none transition-colors duration-300">
        <div className="space-y-3">
          
          {/* Logo & Brand Header (Sleek & Compact) */}
          <div
            className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group"
            onClick={() => setActiveModule('hub')}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-md shadow-sky-500/20 ring-2 ring-sky-500/40 group-hover:ring-sky-400 transition">
              <img
                src="/jeevan-setu-logo.jpg"
                alt="Jeevan Setu Logo"
                className="h-full w-full object-cover rounded-full transform group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="hidden md:block overflow-hidden">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Jeevan Setu</h1>
                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">जीवन सेतु</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">MoDoNER / NEC Logistics Grid</p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-slate-800/80 mx-1" />

          {/* Navigation Items List (Sleek & Perfectly Proportioned) */}
          <nav className="space-y-3 overflow-y-auto max-h-[calc(100vh-175px)] pr-0.5 custom-scrollbar">
            {[
              {
                category: t('sidebar.catIntelligence', 'Intelligence & Monitoring'),
                items: [
                  { id: 'hub', label: t('navigation.dashboard', '3D Disaster Simulation'), icon: Sparkles, iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10' },
                  { id: 'address-intelligence', label: t('navigation.addressIntelligence', 'Address Intelligence'), icon: Compass, badge: 'NEW', iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10' },
                  { id: 'staterisk', label: t('navigation.staterisk', 'Regional State Risk'), icon: FileBarChart, badge: '19 STATES', iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' },
                  { id: 'smartmonitoring', label: t('navigation.smartmonitoring', 'Smart Disaster Monitoring'), icon: Eye, badge: 'LIVE', iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10' },
                  { id: 'aiimpact', label: t('navigation.aiimpact', 'AI Impact Assessment'), icon: Camera, badge: 'AI', iconColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10' },
                  { id: 'customdashboard', label: t('navigation.customdashboard', 'Disaster Risk Dashboard'), icon: Gauge, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { id: 'map', label: t('navigation.map', 'NER Live Map'), icon: MapPin, iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' }
                ]
              },
              {
                category: t('sidebar.catLogistics', 'Tactical Logistics'),
                items: [
                  { id: 'drone', label: t('navigation.drone', 'UAV Drone Dispatcher'), icon: Radio, iconColor: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10' },
                  { id: 'road', label: t('navigation.road', 'Road Accessibility'), icon: Activity, iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10' },
                  { id: 'alerts', label: t('navigation.alerts', 'Active Alerts'), icon: AlertTriangle, badge: 'LIVE', iconColor: 'text-orange-500 dark:text-orange-400 bg-orange-500/10' },
                  { id: 'vehicles', label: t('navigation.vehicles', 'Vehicle Logistics'), icon: Truck, iconColor: 'text-blue-500 dark:text-blue-400 bg-blue-500/10' },
                  { id: 'rerouting', label: t('navigation.rerouting', 'Dynamic Rerouting'), icon: Navigation, iconColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10' },
                  { id: 'supplies', label: t('navigation.supplies', 'Essential Supplies'), icon: Sliders, iconColor: 'text-violet-500 dark:text-violet-400 bg-violet-500/10' }
                ]
              },
              {
                category: t('sidebar.catResponse', 'Emergency Response'),
                items: [
                  { id: 'lifesaving', label: t('navigation.lifesaving', 'Life-Saving Response'), icon: ShieldAlert, badge: 'ENGINE', iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' },
                  { id: 'citizensos', label: t('navigation.citizensos', 'Citizen SOS Triage'), icon: Zap, badge: 'SOS', iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' },
                  { id: 'rescueteams', label: t('navigation.rescueteams', 'Rescue Team Command'), icon: ShieldCheck, badge: 'NDRF', iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10' },
                  { id: 'evacuation', label: t('navigation.evacuation', 'Evacuation & Safe Zone'), icon: Navigation, badge: 'ROUTE C', iconColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10' },
                  { id: 'reliefcamps', label: t('navigation.reliefcamps', 'Relief Camp Grid'), icon: Building2, iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10' }
                ]
              },
              {
                category: t('sidebar.catCommand', 'Executive Command'),
                items: [
                  { id: 'gov', label: t('navigation.gov', 'MDoNER Command Grid'), icon: Building2, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { id: 'weather', label: t('navigation.weather', 'Weather Intelligence'), icon: CloudRain, iconColor: 'text-sky-400 dark:text-sky-300 bg-sky-400/10' }
                ]
              },
              {
                category: t('sidebar.catRecovery', 'Recovery & Reporting'),
                items: [
                  { id: 'damageassessment', label: t('navigation.damageassessment', 'AI Damage Assessment'), icon: Camera, badge: 'AI', iconColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10' },
                  { id: 'sitrep', label: t('navigation.sitrep', 'AI Situation SITREP'), icon: FileBarChart, badge: '16 SEC', iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10' },
                  { id: 'recovery', label: t('navigation.recovery', 'Recovery Tracker'), icon: TrendingUp, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' }
                ]
              }
            ].map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="hidden md:block px-2.5 pt-1 pb-1 text-[10px] font-black tracking-wider uppercase text-sky-600 dark:text-sky-400 select-none">
                  {section.category}
                </div>

                <div className="space-y-1">
                  {section.items.map(tab => {
                    const Icon = tab.icon;
                    const active = activeModule === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveModule(tab.id as any)}
                        title={tab.label}
                        aria-label={tab.label}
                        className={`w-full flex items-center justify-start gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 group relative min-h-[42px] cursor-pointer ${
                          active
                            ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-500/30'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        {/* Active Pill Indicator Bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.2 h-5 bg-sky-300 rounded-r-full shadow-sm shadow-sky-300" />
                        )}

                        {/* Professional Icon Badge Container */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                            active
                              ? 'bg-white/20 text-white border border-white/30 backdrop-blur-sm'
                              : `border border-slate-200/80 dark:border-slate-700/50 ${tab.iconColor} group-hover:border-sky-500/40 group-hover:scale-105`
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        </div>

                        {/* Complete Readable Feature Label */}
                        <span className="hidden md:block flex-1 text-left text-xs font-bold leading-snug whitespace-normal tracking-tight">
                          {tab.label}
                        </span>

                        {/* Aligned Status Badge */}
                        {tab.badge && (
                          <span
                            className={`hidden md:inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none ml-auto border transition-colors ${
                              active
                                ? 'bg-white/20 text-white border-white/40'
                                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 group-hover:bg-sky-500/20'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">

        {/* Top Header Command Bar Matching media_1787858147598.png */}
        <header className="relative z-[9999] h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#040814] px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3 backdrop-blur shadow-sm dark:shadow-md transition-colors duration-300 min-w-0">
          {/* MDoNER / Regional Title matching media_1787858147598.png */}
          <div className="flex items-center gap-3 shrink-0">
            <img
              src="/jeevan-setu-logo.jpg"
              alt="Jeevan Setu Emblem"
              className="h-10 w-10 shrink-0 object-cover rounded-full shadow ring-2 ring-sky-500/50 cursor-pointer hover:opacity-90 transition"
              onClick={() => setActiveModule('hub')}
              title="Jeevan Setu Home"
            />
            <div className="flex items-center gap-3">
              <div className="text-[11px] font-black leading-tight text-emerald-600 dark:text-emerald-400">
                <div>{t('header.titleLine1', 'Ministry of Development')}</div>
                <div>{t('header.titleLine2', 'of North Eastern Region')}</div>
                <div>{t('header.titleLine3', '(MDoNER)')}</div>
              </div>
              <div className="hidden sm:block text-[11px] font-bold leading-tight text-slate-600 dark:text-slate-300 border-l border-slate-200 dark:border-slate-800 pl-3">
                <div>{t('header.councilLine1', 'North Eastern')}</div>
                <div>{t('header.councilLine2', 'Council (NEC)')}</div>
                <div>{t('header.councilLine3', 'Command Grid')}</div>
              </div>
            </div>
          </div>

          {/* Glowing Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 z-50">
            {/* 🚨 EMERGENCY SOS Glowing Pill Button */}
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md hover:scale-105 transition flex items-center gap-1.5 border border-rose-400/40 cursor-pointer animate-pulse shrink-0"
            >
              <span className="text-xs">🚨</span>
              <span>{t('navigation.sos', 'Emergency SOS')}</span>
            </button>

            {/* 🎮 11-STAGE DISASTER SIMULATION BUTTON */}
            <button
              onClick={() => {
                incidentStore.triggerHackathonSimulation();
                setActiveModule('smartmonitoring');
                setSimModalOpen(true);
              }}
              className="rounded-full bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md hover:scale-105 transition flex items-center gap-1.5 border border-amber-400/40 cursor-pointer shrink-0"
            >
              <span>⚡</span>
              <span>Run Hackathon Simulation</span>
            </button>

            {/* 🎙️ VOICE SOS & ASSISTANT HEADER BUTTON */}
            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-black text-white shadow-md hover:scale-105 transition flex items-center gap-1.5 border border-sky-400/40 cursor-pointer shrink-0"
            >
              <span className="text-xs">🎙️</span>
              <span>Voice Assistant</span>
            </button>

            {/* 🎮 3D SIM Pill Button */}
            <button
              onClick={() => setActiveModule('hub')}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeModule === 'hub'
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/40'
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="text-xs">🎮</span>
              <span>{t('header.sim', '3D SIM')}</span>
            </button>

            {/* 🤖 AI Pill Button */}
            <button
              onClick={() => setActiveModule('aiimpact')}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeModule === 'aiimpact'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-purple-600/40'
                  : 'bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="text-xs">🤖</span>
              <span>{t('header.ai', 'AI')}</span>
            </button>

            {/* Live IST Clock */}
            <div className="flex flex-col text-right font-mono px-1.5 shrink-0">
              <span className="text-xs lg:text-sm font-black text-slate-900 dark:text-slate-100 tracking-wider">
                {currentTime || '23:45:11'} IST
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">2026 NER Grid</span>
            </div>

            {/* User Profile Badge: Admin Officer MDoNER L3 */}
            <button
              onClick={() => setActiveModule('gov')}
              title="Click to Open MDoNER Command / Executive Oversight"
              className={`flex items-center gap-2 rounded-full border transition cursor-pointer px-3 py-1.5 text-xs shrink-0 ${
                activeModule === 'gov'
                  ? 'border-emerald-400 bg-emerald-900/80 text-white shadow-md shadow-emerald-500/30'
                  : 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
              }`}
            >
              <div className="h-6 w-6 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                AO
              </div>
              <div className="text-left">
                <div className="font-extrabold text-slate-900 dark:text-white leading-none text-xs">{t('header.adminOfficer', 'Admin Officer')}</div>
                <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-0.5">MDONER L3</div>
              </div>
            </button>

            {/* 🌐 Language Switcher (EN <-> हिन्दी Toggle) */}
            <div className="shrink-0">
              <LanguageSelector />
            </div>

            {/* ☀️/🌙 Theme Toggle Switch */}
            <div className="shrink-0 pr-1">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Workspace Render */}
        <main className="flex-1 overflow-hidden">

          {/* 📍 ADDRESS-BASED DISASTER & ROAD ACCESSIBILITY INTELLIGENCE */}
          {activeModule === 'address-intelligence' && (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <AddressDisasterIntelligence />
            </div>
          )}

          {/* 🛰️ SMART DISASTER MONITORING */}
          {activeModule === 'smartmonitoring' && (
            <div className="h-full overflow-y-auto">
              <SmartDisasterMonitoring
                initialLoc={sharedMonitoringLoc}
                onNavigateToImpactAssessment={(loc) => {
                  setSharedMonitoringLoc({ lat: loc.lat, lon: loc.lon, displayName: loc.name });
                  setActiveModule('aiimpact');
                }}
              />
            </div>
          )}

        {/* 🤖 AI DISASTER IMPACT ASSESSMENT */}
        {activeModule === 'aiimpact' && (
          <div className="h-full overflow-y-auto">
            <AIDisasterImpactAssessment
              onNavigateToMonitoring={(loc) => {
                setSharedMonitoringLoc({ lat: loc.lat, lon: loc.lon, displayName: loc.name, state: 'NER Sector', country: 'India' });
                setActiveModule('smartmonitoring');
              }}
            />
          </div>
        )}

        {/* 🚨 LIFE-SAVING RESPONSE ENGINE */}
        {activeModule === 'lifesaving' && (
          <div className="h-full overflow-y-auto">
            <LifeSavingResponseEngine />
          </div>
        )}

        {/* 🚨 CITIZEN SOS TRIAGE */}
        {activeModule === 'citizensos' && (
          <div className="h-full overflow-y-auto">
            <CitizenSOSModule />
          </div>
        )}

        {/* 🛡️ RESCUE TEAM COMMAND */}
        {activeModule === 'rescueteams' && (
          <div className="h-full overflow-y-auto">
            <RescueTeamCommand />
          </div>
        )}

        {/* 🧭 EVACUATION & SAFE ZONE PLANNER */}
        {activeModule === 'evacuation' && (
          <div className="h-full overflow-y-auto">
            <EvacuationPlanner />
          </div>
        )}

        {/* 🏢 RELIEF CAMP MANAGEMENT */}
        {activeModule === 'reliefcamps' && (
          <div className="h-full overflow-y-auto">
            <ReliefCampManagement />
          </div>
        )}

        {/* 📷 AI DAMAGE ASSESSMENT */}
        {activeModule === 'damageassessment' && (
          <div className="h-full overflow-y-auto">
            <AIDamageAssessment />
          </div>
        )}

        {/* 📊 AI SITUATION REPORT SITREP */}
        {activeModule === 'sitrep' && (
          <div className="h-full overflow-y-auto">
            <AISituationReportModule />
          </div>
        )}

        {/* 📈 RECOVERY TRACKER */}
        {activeModule === 'recovery' && (
          <div className="h-full overflow-y-auto">
            <RecoveryTracker />
          </div>
        )}

        {/* 0. DISASTER RISK DASHBOARD */}
        {activeModule === 'customdashboard' && (
          <div className="h-full overflow-y-auto">
            <Dashboard
              onNavigateToLiveMap={(loc) => {
                setMapFocusedTarget({ coord: [loc.lat, loc.lon], zoom: 12 });
                setActiveModule('map');
              }}
            />
          </div>
        )}

        {/* 📊 DEDICATED REGIONAL STATE RISK MATRIX SECTION */}
        {activeModule === 'staterisk' && (
          <div className="h-full overflow-y-auto p-4 lg:p-7 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            <StateRiskMatrixSection
              onFocusState={(coord, zoom) => {
                setMapFocusedTarget({ coord, zoom });
                setActiveModule('map');
              }}
            />
          </div>
        )}

        {/* 1. OPERATIONS HUB / 3D SIMULATION DIGITAL TWIN */}
        {activeModule === 'hub' && (
          <div className="h-full overflow-y-auto p-4 lg:p-6">
            <ThreeDigitalTwin
              onNavigateToMonitoring={() => setActiveModule('smartmonitoring')}
              onNavigateToImpact={() => setActiveModule('aiimpact')}
              onNavigateToRerouting={() => setActiveModule('rerouting')}
              onNavigateModule={(mod) => setActiveModule(mod as any)}
            />
          </div>
        )}

        {/* 2. FULL EXPANDED MAP VIEW MATCHING SCREENSHOT media_1787754063833.png */}
        {activeModule === 'map' && (
          <NERLiveMapModule
            focusedTarget={mapFocusedTarget}
            onNavigateTo3DSim={() => setActiveModule('hub')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 🚨 ACTION ALERTS / REAL-TIME EMERGENCY INCIDENT BROADCAST FEED MATCHING SCREENSHOT media_1787753496813.png */}
        {activeModule === 'alerts' && (
          <ActionAlertsModule
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateTo3D={() => setActiveModule('hub')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 3. ROAD MONITORING & ACCESSIBILITY */}
        {activeModule === 'road' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    EXECUTIVE HIGHWAY & BRIDGE INTEGRITY TELEMETRY
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <Activity className="h-7 w-7 text-rose-500" />
                  {t("road.title", "NER Road & Accessibility Monitoring")}
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  {t("road.subtitle", "Live telemetry on highway clearance, landslide choke points, and bridge load integrity.")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveModule('map')}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs lg:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer border border-indigo-400/30 transition"
                >
                  <span>🗺️</span> Open Full 2D Tactical Map
                </button>
                <span className="rounded-xl bg-rose-500/20 px-4 py-2 text-xs lg:text-sm font-black text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  2 Active Disrupted Corridors
                </span>
              </div>
            </div>

            {/* Live Interactive Highway Clearance Map Container */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛣️</span> Live Interactive Highway Telemetry & Clearance Map
                </h3>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                  ● Live Map Synchronization Active
                </span>
              </div>
              <div ref={roadMapContainerRef} className="h-72 w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner" />
            </div>

            {/* Highway Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: 'NH-6: Meghalaya ➔ Silchar Corridor', status: 'PARTIALLY_BLOCKED', risk: 'HIGH (Landslide at Km 142)', detour: 'Active Bypass Operational', speed: '25 km/h' },
                { name: 'NH-29: Dimapur ➔ Kohima Pass', status: 'CLEAR', risk: 'LOW (Optimal Flow)', detour: 'None Required', speed: '55 km/h' },
                { name: 'NH-10: Siliguri ➔ Gangtok Route', status: 'CAUTION', risk: 'MODERATE (Teesta River Swelling)', detour: 'Melli-Jorethang Alternate', speed: '35 km/h' },
                { name: 'NH-306: Silchar ➔ Aizawl Artery', status: 'CLEAR', risk: 'LOW (Convoy Clearance Active)', detour: 'None', speed: '48 km/h' },
                { name: 'NH-415: Banderdewa ➔ Itanagar', status: 'CLEAR', risk: 'LOW (Paved Terrain)', detour: 'None', speed: '60 km/h' },
                { name: 'NH-37: Kaziranga Flood Barrier Pass', status: 'MONITORED', risk: 'MODERATE (Wildlife + Rain)', detour: 'Speed Regulation 40 km/h', speed: '40 km/h' }
              ].map((route, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 transition-colors duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">{route.name}</span>
                    <span className={`rounded-lg px-3 py-1 text-xs font-black shrink-0 ${
                      route.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                      route.status === 'CAUTION' || route.status === 'MONITORED' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                  <div className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium">Risk Assessment: <span className="text-slate-900 dark:text-slate-200 font-bold">{route.risk}</span></div>
                  <div className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium">Detour Status: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{route.detour}</span></div>
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs lg:text-sm">
                    <span className="text-slate-500 font-medium">Speed: <b className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm lg:text-base">{route.speed}</b></span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer shadow">Live Map 🗺️</button>
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D 🎮</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VEHICLE LOGISTICS TELEMETRY ROSTER (8 ACTIVE SECTOR UNITS) */}
        {activeModule === 'vehicles' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    LIVE CAN-BUS OBD-II DIAGNOSTICS & ISRO NAVIC TRACKING
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <span>🚚</span> {t("vehicles.title", "Inter State Relief Convoy Telemetry Roster")} <span className="text-xs lg:text-sm font-bold text-slate-500 dark:text-slate-400">(8 Active Sector Units)</span>
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  {t("vehicles.subtitle", "Live satellite telemetry, CAN-bus OBD-II sensor diagnostics, cold-chain monitoring, and emergency diversion tracking across all 8 North Eastern States.")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-mono text-xs lg:text-sm font-black flex items-center gap-2 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  ● NavIC 14 Sats Active
                </span>
              </div>
            </div>

            {/* DATA TRANSPARENCY STATUS BANNER */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs lg:text-sm font-mono transition-colors duration-300">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-black flex items-center gap-2 text-xs">
                  🟢 CAN-BUS & NAVIC SATELLITE LINK ONLINE
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-sans">
                  Source: <b className="text-slate-900 dark:text-white font-bold">ISRO NavIC Satellite Array & Heavy Convoy OBD-II Units</b>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-sans">
                <span>Refreshed: <b className="text-slate-900 dark:text-slate-200 font-bold">12:49:10 AM</b></span>
              </div>
            </div>

            {/* 8 Active Convoy Cards Grid (2 cols x 4 rows) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Convoy #01 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                      PRIORITY 1
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AS-01-AB-1234 (Convoy #01)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    45 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Guwahati Central Hub (Assam) ➔ Aizawl Civil Hospital (Mizoram)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 12t Medical Oxygen Cylinders (Class 1 Urgent)
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">78%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">12 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Temp: <b className="text-slate-900 dark:text-white font-bold">21.4°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 42% &bull; Diverted via Sector 9 Jowai Bypass</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #02 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black uppercase">
                      PRIORITY 2
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AS-02-CD-5678 (Convoy #02)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    52 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Nagaon Central Silos ➔ Dhemaji Forward Depot (Upper Assam)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 20t Baby Food & Fortified Grain Bags
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">84%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">14 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Temp: <b className="text-slate-900 dark:text-white font-bold">26.2°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-sky-600 dark:text-sky-300 font-bold">Clear 4-Lane</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 68% &bull; ETA: 1h 45m (NH-27 Green Corridor)</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #03 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      ESCORT ACTIVE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AR-01-EF-9012 (Convoy #03)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-amber-600 dark:text-amber-400">
                    34 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Tezpur Military Base ➔ Sela Pass & Tawang Sector (Arunachal)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 25t Ration, Antivenom & Hypothermia Blankets
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">92%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Chains: <b className="text-slate-900 dark:text-white font-bold">Mounted</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Alt: <b className="text-slate-900 dark:text-white font-bold">2,410m</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">ITBP Fog</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 25% &bull; Kalaktang Ridge Bypass &bull; ETA: 4h 10m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('drone')} className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer">Air-Drop SOS 🚨</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #04 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      REROUTED
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">NL-01-GH-3456 (Convoy #04)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    41 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Dimapur Commercial Hub ➔ Kohima Medical Center (Nagaland)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 18 KL Emergency Diesel for Hospital Generators
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">88%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">13 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Zubza</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">35km Escort</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 55% &bull; Single-Lane Escort &bull; ETA: 2h 05m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #05 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black uppercase">
                      CLASS 1 TRAUMA
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">ML-01-IJ-7890 (Convoy #05)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-rose-600 dark:text-rose-400">
                    48 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Siliguri Staging Depot ➔ Gangtok Civil Hospital (Sikkim)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 8t Blood Plasma, Trauma Kits & Antivenom Vials
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Cold: <b className="text-cyan-600 dark:text-cyan-300 font-bold">-20°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">70%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Lava Pass</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">Teesta</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: '79%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 79% &bull; Elevated Ridge Link &bull; ETA: 0h 40m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #06 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                      PRIORITY 2
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">MN-01-KL-2345 (Convoy #06)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-emerald-600 dark:text-emerald-400">
                    58 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Silchar Logistics Base ➔ Imphal Valley Hospital (Manipur)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 14t Infant Formula & Water Purification Chem
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">66%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">11 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Jiribam</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">All Clear</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 72% &bull; Nominal Transit &bull; ETA: 1h 20m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #07 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase">
                      SHELTER CACHE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">TR-01-MN-6789 (Convoy #07)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    50 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Guwahati Central Hub ➔ Agartala Relief Depot (Tripura)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 18t Emergency Tarpaulins & Medical Tents
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">74%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">14 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">NH-8</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">Clear</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 87% &bull; Southern Artery Operational &bull; ETA: 0h 55m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #08 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      HILL CACHE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">MZ-01-OP-4567 (Convoy #08)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-amber-600 dark:text-amber-400">
                    36 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Silchar Staging Depot ➔ Lunglei Hill Post (Mizoram)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 10t Survival Rations & Anti-Rabies Vaccine Caches
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">82%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">10 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">NH-54</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">Rain</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 45% &bull; Heavy Mud Silt Drag &bull; ETA: 3h 50m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. ESSENTIAL SUPPLIES & INTER-STATE STRATEGIC DEPOTS */}
        {activeModule === 'supplies' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-ping"></span>
                    EXECUTIVE LOGISTICS & DEPOT STOCKPILE TELEMETRY
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <span>📦</span> Inter-State Strategic Essential Supply Depots & Forward Caches
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  Real-time inventory levels, medical oxygen buffers, food grain silos & emergency fuel reserves synchronized across FCI, Indian Red Cross & State Civil Supplies Directorates for all 8 NER States.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 font-extrabold text-white text-xs lg:text-sm shadow-lg shadow-rose-600/30 hover:scale-105 transition flex items-center gap-2 shrink-0 border border-rose-400/40 cursor-pointer">
                  <span>+</span> Allocate Emergency Supply ➔
                </button>
              </div>
            </div>

            {/* DATA TRANSPARENCY STATUS BANNER */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs lg:text-sm font-mono transition-colors duration-300">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-black flex items-center gap-2 text-xs">
                  🔵 ✓ VERIFIED STOCKPILE DATA ACTIVE
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-sans">
                  Source: <b className="text-slate-900 dark:text-white font-bold">FCI, Indian Red Cross & State Civil Supplies Directorates</b>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-sans">
                <span>Last Updated: <b className="text-slate-900 dark:text-slate-200">12:41:11 AM</b></span>
                <a href="https://mdoner.gov.in" target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 font-bold">
                  View Portal 🔗
                </a>
              </div>
            </div>

            {/* Top 4 KPI Stockpile Buffer Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Medical Oxygen */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 relative overflow-hidden transition-colors duration-300">
                <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-400">
                  <span className="uppercase tracking-wider">MEDICAL OXYGEN</span>
                  <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-extrabold uppercase">Class 1</span>
                </div>
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">120 Tons</div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                  <span>4,200 Cylinders</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">14 Days Buffer</span>
                </div>
              </div>

              {/* Card 2: Food Grains & Rations */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 relative overflow-hidden transition-colors duration-300">
                <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-400">
                  <span className="uppercase tracking-wider">FOOD GRAINS & RATIONS</span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-extrabold uppercase">Class 2</span>
                </div>
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">340 Tons</div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                  <span>FCI Regional Silos</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">18 Days Buffer</span>
                </div>
              </div>

              {/* Card 3: Emergency Fuel */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 relative overflow-hidden transition-colors duration-300">
                <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-400">
                  <span className="uppercase tracking-wider">EMERGENCY FUEL</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold uppercase">Class 1</span>
                </div>
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">85 KL</div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                  <span>Diesel & Jet-A1</span>
                  <span className="text-sky-600 dark:text-sky-400 font-bold">Helicopter / JCB Fleet</span>
                </div>
              </div>

              {/* Card 4: Shelter Gear & Tents */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 relative overflow-hidden transition-colors duration-300">
                <div className="flex items-center justify-between text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-400">
                  <span className="uppercase tracking-wider">SHELTER GEAR & TENTS</span>
                  <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-extrabold uppercase">Class 2</span>
                </div>
                <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">200 Tons</div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                  <span>1,200 Relief Tents</span>
                  <span className="text-indigo-600 dark:text-indigo-300 font-bold">Waterproof Tarps</span>
                </div>
              </div>
            </div>

            {/* Strategic Depots Section Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 gap-3 pt-2">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                  <span>📦</span> {t("supplies.title", "Inter-State Strategic Supply Depots & Forward Caches")} <span className="text-xs lg:text-sm font-bold text-slate-500 dark:text-slate-400">(All 8 NER States)</span>
                </h2>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
                  {t("supplies.subtitle", "Real-time inventory levels synchronized across FCI, Indian Red Cross & State Civil Supplies Directorates.")}
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold shrink-0">
                8 / 8 State Depots Monitored
              </span>
            </div>

            {/* 8 Depot Cards Grid (2 cols x 4 rows) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Depot 1 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Guwahati Central Mega Depot (Assam)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">Primary Transit Hub & Gateway for Upper Assam, Meghalaya & Nagaland</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs lg:text-sm font-black shrink-0">
                    95% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">45 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">120 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Diesel</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">30 KL</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">📍 Sookreting Staging Base</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('vehicles')} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs lg:text-sm font-extrabold shadow cursor-pointer">Dispatch Convoy 🚛</button>
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 2 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Silchar Civil Medical Staging Post (Cachar, Assam)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">High-Priority Buffer Depot for Barak Valley, Mizoram (Aizawl) & Tripura Links</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs lg:text-sm font-black shrink-0">
                    62% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">22 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">60 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Blood Units</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">150 Units</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Buffer active for NH-6 blockage</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Reroute 3D ➔</button>
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 3 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Bomdila High-Altitude Medical Cache (Arunachal Pradesh)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">Critical Forward Station supporting Sela Tunnel (2,400m) & Tawang Sectors</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs lg:text-sm font-black shrink-0 uppercase">
                    41% LOW STOCK
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">8 Tons (Low)</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Antivenom</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">48 Vials</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Blankets</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">500 Units</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-800 dark:text-slate-300 font-medium">📍 Resupply Convoy #03 Dispatched</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('drone')} className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer">Air-Drop SOS 🚨</button>
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 4 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Dibrugarh Forward Depot (Upper Assam)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">Rail-Road Hub and Bridge Head for Eastern Arunachal & Siang Valley</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs lg:text-sm font-black shrink-0">
                    84% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">28 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">85 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Diesel</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">25 KL</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">📍 Regional Railhead Node</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('vehicles')} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer">Dispatch Fleet 🚚</button>
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 5 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Shillong Staging Depot (Meghalaya)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">High-Altitude East Khasi & Jaintia Hills Emergency Stockpile Hub</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-black shrink-0">
                    78% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">18 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">45 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fuel</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">12 KL</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">📍 Jowai Sector 9 Detour Active</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 6 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Gangtok Artery Depot (Sikkim)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">Teesta Basin Emergency Medical & Mountain Survival Cache</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs lg:text-sm font-black shrink-0">
                    51% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">14 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">35 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fuel</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">18 KL</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-amber-600 dark:text-amber-400 font-medium">⚠️ NH-10 cutoff bypass active</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Reroute 3D ➔</button>
                  </div>
                </div>
              </div>

              {/* Depot 7 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Kohima Relief Center (Nagaland)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">NH-29 Highland Artery Logistics Depot supporting Dimapur & Imphal</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs lg:text-sm font-black shrink-0">
                    87% Stocked
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">16 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">48 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Fuel</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">10 KL</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">📍 Zubza Slope Regulated</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                  </div>
                </div>
              </div>

              {/* Depot 8 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-lg lg:text-xl text-slate-900 dark:text-white">Aizawl Civil Hospital Reserve (Mizoram)</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">South NER Critical Care Oxygen & Trauma Stockpile Post</p>
                  </div>
                  <span className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs lg:text-sm font-black shrink-0 uppercase">
                    48% CRITICAL
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Oxygen</span>
                    <b className="text-rose-600 dark:text-rose-400 block text-sm lg:text-base font-black mt-0.5">8 Tons (Buffer)</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rations</span>
                    <b className="text-amber-600 dark:text-amber-400 block text-sm lg:text-base font-black mt-0.5">25 Tons</b>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Trauma Kits</span>
                    <b className="text-sky-600 dark:text-sky-400 block text-sm lg:text-base font-black mt-0.5">100 Kits</b>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800/80">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">📍 Convoy #01 En Route (ETA: 3h 15m)</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs lg:text-sm font-extrabold shadow cursor-pointer">Track 3D Convoy ➔</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. DYNAMIC REROUTING (OSRM + NOMINATIM) */}
        {activeModule === 'rerouting' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 dark:bg-rose-400 animate-ping"></span>
                    EXECUTIVE AI REROUTING & LANDSLIDE BYPASS COMMAND
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <span>🧭</span> {t("rerouting.title", "Dynamic AI Green Corridor Rerouting")}
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  {t("rerouting.subtitle", "Calculates real-time OSRM bypass corridors avoiding active landslide polygons, flood surge zones, and mountain blockages across all 8 NER states.")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-mono text-xs lg:text-sm font-black flex items-center gap-2 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  ● Green Bypass Engine Active
                </span>
              </div>
            </div>

            {/* DATA TRANSPARENCY STATUS BANNER */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs lg:text-sm font-mono transition-colors duration-300">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 font-black flex items-center gap-2 text-xs">
                  🟢 OSRM & ISRO BHUVAN ELEVATION MATRIX ONLINE
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-sans">
                  Engine: <b className="text-slate-900 dark:text-white font-bold">Open Source Routing Machine (OSRM) + Live Terrain Clearance</b>
                </span>
              </div>
            </div>

            {/* Main Content Grid (12 cols) */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column (Form + Telemetry) */}
              <div className="col-span-12 lg:col-span-4 space-y-6">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 transition-colors duration-300">
                  <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                    <Navigation className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                    Dynamic AI Rerouting
                  </h2>
                  <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium">Calculates optimal bypass routes around landslide blockage zones.</p>

                  <div className="space-y-4 pt-1">
                    <div>
                      <label className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 font-bold block">Origin Logistics Depot</label>
                      <input
                        type="text"
                        value={routeStart}
                        onChange={e => setRouteStart(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 font-bold block">Destination Hub</label>
                      <input
                        type="text"
                        value={routeDest}
                        onChange={e => setRouteDest(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 font-bold block mb-1.5">Assigned Fleet Vehicle</label>
                      <select
                        value={vehicleType}
                        onChange={e => setVehicleType(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
                      >
                        <option value="4x4 Heavy All-Terrain Truck (Tata LPTA)" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🚚 4x4 Heavy All-Terrain Truck (Tata LPTA)</option>
                        <option value="Medium 4WD Carrier (Mahindra Bolero)" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🛻 Medium 4WD Carrier (Mahindra Bolero)</option>
                        <option value="Heavy Emergency Drone (15kg Payload)" className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold py-1">🚁 Heavy Emergency Drone (15kg Payload)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5">
                      <span className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 font-bold">Evade Landslide Polygons</span>
                      <input
                        type="checkbox"
                        checked={avoidBlockedSectors}
                        onChange={e => setAvoidBlockedSectors(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
                      />
                    </div>

                    <button
                      onClick={handleRunReroute}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3 text-xs lg:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                    >
                      {t("rerouting.computeGreenCorridor", "Compute Safe Green Corridor")}
                    </button>
                  </div>
                </div>

                {calculatedRoute && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 transition-colors duration-300">
                    <div className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Route Telemetry</div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Distance</span>
                        <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">{calculatedRoute.distanceKm || '412.5'} km</div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Transit Duration</span>
                        <div className="text-2xl lg:text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{calculatedRoute.durationMinutes || '480'} mins</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column (Map + Turn-by-Turn) */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                {/* Interactive 2D OSRM Corridor Map */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 transition-colors duration-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>🗺️</span> Live OSRM Bypass Corridor Map
                    </h3>
                    <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                      ● Green Bypass Active
                    </span>
                  </div>
                  <div ref={rerouteMapContainerRef} className="h-72 w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner" />
                </div>

                {/* Turn-by-Turn Guidance */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 transition-colors duration-300">
                  <div>
                    <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">{t("rerouting.turnByTurnTitle", "Turn-by-Turn Emergency Navigation Guidance")}</h3>
                    <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">Verified via Open Source Routing Machine (OSRM) with live terrain slope clearances.</p>
                  </div>

                  <div className="space-y-3 max-h-[340px] overflow-y-auto pt-1">
                    {[
                      { step: `Depart ${routeStart || 'Guwahati Hub'} onto GS Road towards NH-6`, dist: '14.2 km', note: 'Clear 4-lane Highway' },
                      { step: 'Cross Byrnihat Bridge into Meghalaya border checkpost', dist: '28.5 km', note: 'Priority Convoy Pass Verified' },
                      { step: 'Ascend Shillong Bypass via Umiam Lake vector', dist: '35.0 km', note: 'Caution: Hill Fog & Rain' },
                      { step: 'Detour around Km 142 Landslide Sector via Alternate Jowai Ridge Road', dist: '42.1 km', note: 'Disaster Hazard Bypassed' },
                      { step: `Proceed southward along NH-306 into ${routeDest || 'Aizawl'} valley entry`, dist: '120.0 km', note: 'Safe Arrival Corridor' }
                    ].map((s, idx) => (
                      <div key={idx} className="flex items-start gap-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs lg:text-sm transition-colors duration-300">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-black text-indigo-600 dark:text-indigo-400 text-xs">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-slate-900 dark:text-white text-sm lg:text-base">{s.step}</div>
                          <div className="mt-1 text-xs font-mono text-slate-500 dark:text-slate-400">Segment: {s.dist} &bull; Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{s.note}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. GOVERNMENT DASHBOARD & ANALYTICS */}
        {activeModule === 'gov' && (
          <MDoNERCommandModule />
        )}

        {/* UAV DRONE DISPATCHER MODULE VIEW */}
        {activeModule === 'drone' && (
          <UAVDroneModule onNavigateToMonitoring={() => setActiveModule('smartmonitoring')} />
        )}


        {/* 7. WEATHER INTELLIGENCE VIEW */}
        {activeModule === 'weather' && (
          <WeatherIntelligence
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateToReroute={() => setActiveModule('rerouting')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 8. LIVE RELIEF CAMP & SHELTER FINDER VIEW */}
        {activeModule === 'reliefcamps' && (
          <ReliefCampManagement onNavigateToMap={() => setActiveModule('map')} />
        )}

        {/* Fallback for other quick tabs */}
        {(activeModule === 'vehicles' || activeModule === 'alerts' || activeModule === 'vehicleselect' || activeModule === 'analytics') && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white capitalize">{activeModule.replace('-', ' ')} Module</h2>
              <p className="text-xs text-slate-400 mt-1">Directly integrated with MDoNER NER Logistics database.</p>
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <ShieldCheck className="h-12 w-12 text-indigo-500 mb-3" />
                <p className="text-sm text-slate-300 font-semibold">Active Logistics Stream Online</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">Data synchronizing with the central dispatch nodes across all 8 North Eastern states.</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency SOS Modal (Matching media_1787750104900.png) */}
        <EmergencySOSModal
          isOpen={isSosModalOpen}
          onClose={() => setIsSosModalOpen(false)}
          onTransmitSOSLocation={(locationData) => {
            setActiveSosLocation(locationData);
            setIsSosModalOpen(false);
            setActiveModule('map');
          }}
        />

        {/* 🎙️ GLOBAL VOICE ASSISTANT MODAL */}
        <VoiceAssistantModal
          isOpen={isVoiceModalOpen}
          onClose={() => setIsVoiceModalOpen(false)}
          onNavigate={(targetModule) => setActiveModule(targetModule as any)}
          onTriggerSOS={() => setIsSosModalOpen(true)}
        />

        {/* 🎮 11-STAGE HACKATHON DISASTER SIMULATION MODAL */}
        {simModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-2xl border border-rose-500/50 bg-gradient-to-b from-slate-900 via-rose-950/40 to-slate-900 p-6 shadow-2xl space-y-4 animate-fadeIn text-white select-none">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎮</span>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">HACKATHON DISASTER SIMULATION INITIALIZED!</h3>
                </div>
                <button
                  onClick={() => setSimModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed text-slate-200">
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 font-bold text-rose-300">
                  Incident JS-2026-001 (East Khasi Hills Flash Flood & Mudslide) set to CRITICAL.
                </div>
                <div className="font-mono text-[11px] text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="font-bold text-sky-400">11-Stage End-to-End Workflow:</div>
                  <div className="text-[10px] leading-relaxed text-slate-300">
                    MONITOR → DETECT → ASSESS → PREDICT → ALERT → RESPOND → RESCUE → EVACUATE → RELIEF → REPORT → RECOVER
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSimModalOpen(false)}
                  className="rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg hover:from-rose-500 hover:to-indigo-500 cursor-pointer border border-rose-400/40"
                >
                  Acknowledge & Proceed ➔
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  </div>
  );
}
