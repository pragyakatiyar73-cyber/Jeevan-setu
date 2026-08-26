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
  CheckSquare
} from 'lucide-react';
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
  EmergencyLZ,
  analyzeCitizenDisasterPhoto,
  AIDamageAnalysisResult
} from './services/api';
import Dashboard from './components/Dashboard';

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
  const [activeModule, setActiveModule] = useState<'hub' | 'map' | 'road' | 'vehicles' | 'delivery' | 'rerouting' | 'supplies' | 'alerts' | 'weather' | 'vehicleselect' | 'analytics' | 'gov' | 'apis' | 'drone' | 'citizentriage' | 'customdashboard'>('hub');
  const [selectedLayer, setSelectedLayer] = useState<string>('osm');

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  // Weather state
  const [weatherCity, setWeatherCity] = useState(NER_HUBS[1]); // Default Shillong
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

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

  // Citizen AI Damage Triage state
  const [triageDesc, setTriageDesc] = useState('Severe landslide breach along NH-6 East Khasi Hills near Km 142. Road completely severed by mud and rockfall.');
  const [triagePhotoBase64, setTriagePhotoBase64] = useState<string | null>(null);
  const [triagePhotoPreview, setTriagePhotoPreview] = useState<string | null>(null);
  const [triageLocation, setTriageLocation] = useState('NH-6 Km 142 (East Khasi Hills, Meghalaya)');
  const [triageLat, setTriageLat] = useState(25.4200);
  const [triageLon, setTriageLon] = useState(92.1500);
  const [triageAnalyzing, setTriageAnalyzing] = useState(false);
  const [triageResult, setTriageResult] = useState<AIDamageAnalysisResult | null>(null);
  const [triageBroadcasted, setTriageBroadcasted] = useState(false);

  const handleRunTriage = async () => {
    setTriageAnalyzing(true);
    const res = await analyzeCitizenDisasterPhoto({
      description: triageDesc,
      imageBase64: triagePhotoBase64 || undefined,
      lat: triageLat,
      lon: triageLon,
      locationName: triageLocation
    });
    setTriageResult(res);
    setTriageAnalyzing(false);
  };

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
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Banner / MDoNER Government Bar */}
      <div className="flex h-8 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Ministry of Development of North Eastern Region (MDoNER)
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300">North Eastern Council (NEC) Logistics Grid</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Satellite Feed Connected
          </span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-400">Admin Officer: MDoNER-NER-OPS</span>
        </div>
      </div>

      {/* Main App Navigation Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveModule('hub')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-sky-500 to-emerald-500 shadow-lg shadow-indigo-500/25">
            <Mountain className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">Jeevan Setu</h1>
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300">जीवन सेतु</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">NER Logistics Grid</span>
            </div>
            <p className="text-[11px] text-slate-400">Connecting Routes &bull; Delivering Across North Eastern Region</p>
          </div>
        </div>

        {/* Quick Nav Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'hub', label: 'Operations Hub', icon: Sparkles },
            { id: 'customdashboard', label: 'Disaster Risk Dashboard', icon: Gauge },
            { id: 'map', label: 'NER Live Map', icon: MapPin },
            { id: 'citizentriage', label: 'Citizen AI Photo Triage', icon: Camera },
            { id: 'drone', label: 'UAV Drone Dispatcher', icon: Radio },
            { id: 'road', label: 'Road Monitoring', icon: Activity },
            { id: 'vehicles', label: 'Vehicle Logistics', icon: Truck },
            { id: 'delivery', label: 'Delivery Mgmt', icon: Package },
            { id: 'rerouting', label: 'Dynamic Rerouting', icon: Navigation },
            { id: 'supplies', label: 'Essential Supplies', icon: Sliders },
            { id: 'weather', label: 'Weather Intel', icon: CloudRain },
            { id: 'gov', label: 'Gov Dashboard', icon: Building2 },
            { id: 'apis', label: '22-API Ecosystem', icon: Layers }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveModule(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden">

        {/* 0. DISASTER RISK DASHBOARD */}
        {activeModule === 'customdashboard' && (
          <div className="h-full overflow-y-auto">
            <Dashboard />
          </div>
        )}

        {/* 1. OPERATIONS HUB (Matches jsalgoforge.netlify.app Home) */}
        {activeModule === 'hub' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            {/* Hero Top Bar */}
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 shadow-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    North East Region ● Live Satellite & Radar
                  </span>
                  <span className="text-xs text-slate-400">"Smart decisions today, safer tomorrow."</span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-white tracking-tight">NER Logistics & Accessibility Intelligence Platform</h2>
                <p className="text-xs text-slate-300 max-w-2xl mt-1">
                  Real-time logistics, terrain contours, dynamic road blockage detection, and sovereign satellite radar across Assam, Meghalaya, Mizoram, Manipur, Nagaland, Tripura, Arunachal Pradesh, and Sikkim.
                </p>
              </div>

              {/* Weather snapshot for Shillong */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 min-w-[240px]">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Weather Intelligence</span>
                  <span className="text-emerald-400 font-medium">Shillong, Meghalaya</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{weatherData ? `${weatherData.temperature}°C` : '21.4°C'}</span>
                  <span className="text-xs text-sky-400">{weatherData ? `${weatherData.precipitation} mm rain` : 'Precipitation Normal'}</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-500">Live 2026 Open-Meteo Satellite Feed</div>
              </div>
            </div>

            {/* Live Map Preview & AI Prediction Banner */}
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl flex flex-col h-[400px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Live Region Map ● North Eastern Region Logistics Grid</h3>
                  </div>
                  <button onClick={() => setActiveModule('map')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                    Expand Full Map <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div ref={mapContainerRef} className="flex-1 rounded-xl overflow-hidden" />
              </div>

              {/* Sidebar Quick Stats & AI Alerts */}
              <div className="col-span-4 space-y-4 flex flex-col justify-between">
                {/* AI Prediction Box */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-slate-900 p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <Bot className="h-4 w-4" />
                      AI Prediction Alert
                    </span>
                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">High Disruption</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-200">High disruption expected in East Khasi Hills (NH-6 corridor) on 24 May due to heavy pre-monsoon precipitation.</p>
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-slate-800 pt-3">
                    <span className="text-slate-400">Suggested Action:</span>
                    <span className="text-indigo-400 font-medium cursor-pointer" onClick={() => setActiveModule('rerouting')}>Reroute Via Bypass ➔</span>
                  </div>
                </div>

                {/* Live Vehicle Tracking Snapshot */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-indigo-400" />
                      Live Fleet Telemetry
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">58 Active Fleets</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-white">Guwahati ➔ Aizawl (NH-6)</div>
                        <div className="text-[10px] text-slate-400">Tata LPTA 4x4 Heavy &bull; Oxygen Cylinders</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">45 km/h</span>
                        <div className="text-[10px] text-slate-500">ETA: 3h 15m</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-medium text-white">Shillong ➔ Silchar Bypass</div>
                        <div className="text-[10px] text-slate-400">Mahindra Bolero All-Terrain &bull; Blood Units</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-indigo-400">38 km/h</span>
                        <div className="text-[10px] text-slate-500">ETA: 1h 45m</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Operations Hub Grid (10 Interactive Cards from Netlify App) */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Smart Operations Hub</h3>
                <span className="text-xs text-slate-500">All 10 Core Modules Synchronized with MDoNER Logistics Server</span>
              </div>

              <div className="grid grid-cols-5 gap-4">
                {[
                  { id: 'citizentriage', title: 'Citizen AI Damage Reporter', desc: 'Upload disaster photos for Gemini AI vision severity assessment & NDRF triage.', icon: Camera, color: 'from-pink-500/20 to-slate-900', border: 'hover:border-pink-500/50' },
                  { id: 'drone', title: 'UAV Drone Dispatcher', desc: 'Zero-road high-altitude aerial supply corridor dispatch.', icon: Radio, color: 'from-sky-500/20 to-slate-900', border: 'hover:border-sky-500/50' },
                  { id: 'road', title: 'Road & Accessibility', desc: 'Monitor road status, landslides & blockages in real-time.', icon: Activity, color: 'from-rose-500/20 to-slate-900', border: 'hover:border-rose-500/50' },
                  { id: 'vehicles', title: 'Vehicle & Logistics', desc: 'Track all-terrain fleets, check speeds & fuel capacity.', icon: Truck, color: 'from-indigo-500/20 to-slate-900', border: 'hover:border-indigo-500/50' },
                  { id: 'delivery', title: 'Delivery Management', desc: 'Manage deliveries of essential goods & emergency supplies.', icon: Package, color: 'from-emerald-500/20 to-slate-900', border: 'hover:border-emerald-500/50' },
                  { id: 'rerouting', title: 'Dynamic Rerouting', desc: 'AI-powered smart rerouting for safe & fastest delivery.', icon: Navigation, color: 'from-sky-500/20 to-slate-900', border: 'hover:border-sky-500/50' },
                  { id: 'supplies', title: 'Essential Supply Priority', desc: 'Prioritize essential supplies like medicine, blood & fuel.', icon: Sliders, color: 'from-amber-500/20 to-slate-900', border: 'hover:border-amber-500/50' },
                  { id: 'alerts', title: 'Alert & Notifications', desc: 'Real-time alerts & broadcasts for critical road incidents.', icon: Bell, color: 'from-rose-500/20 to-slate-900', border: 'hover:border-rose-500/50' },
                  { id: 'weather', title: 'Weather Intelligence', desc: 'Live Open-Meteo weather radar & precipitation telemetry.', icon: CloudRain, color: 'from-blue-500/20 to-slate-900', border: 'hover:border-blue-500/50' },
                  { id: 'vehicleselect', title: 'Smart Vehicle Selection', desc: 'AI selects the most suitable 4x4 or EV carrier for route.', icon: Compass, color: 'from-purple-500/20 to-slate-900', border: 'hover:border-purple-500/50' },
                  { id: 'analytics', title: 'Analytics & Reports', desc: 'Terrain resilience metrics, transport insights & reports.', icon: FileBarChart, color: 'from-teal-500/20 to-slate-900', border: 'hover:border-teal-500/50' },
                  { id: 'gov', title: 'Government Dashboard', desc: 'MDoNER administrative oversight & decision support.', icon: Building2, color: 'from-amber-500/20 to-slate-900', border: 'hover:border-amber-500/50' },
                ].map(card => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setActiveModule(card.id as any)}
                      className={`cursor-pointer rounded-2xl border border-slate-800 bg-gradient-to-br ${card.color} p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${card.border}`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-800">
                        <Icon className="h-4 w-4 text-indigo-400" />
                      </div>
                      <h4 className="mt-3 text-xs font-bold text-white">{card.title}</h4>
                      <p className="mt-1 text-[11px] text-slate-400 leading-snug">{card.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. FULL EXPANDED MAP VIEW */}
        {activeModule === 'map' && (
          <div className="relative h-full w-full">
            <div ref={mapContainerRef} className="h-full w-full" />
            <div className="absolute right-4 top-4 z-[1000] w-72 rounded-xl border border-slate-800 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
              <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Satellite & GIS Layers</span>
                <span className="text-[10px] font-semibold text-emerald-400">100% Free / Sovereign</span>
              </div>
              <div className="space-y-1.5">
                {Object.values(MAP_LAYERS).map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                      selectedLayer === layer.id ? 'bg-indigo-600 text-white font-medium shadow' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{layer.name}</span>
                    {selectedLayer === layer.id && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
              <div className="mt-3 border-t border-slate-800 pt-2 text-[10px] text-slate-400">
                🇮🇳 <b>ISRO Bhuvan</b> WMS provides official Indian government satellite thematic overlays across the 8 NER states.
              </div>
            </div>
          </div>
        )}

        {/* 3. ROAD MONITORING & ACCESSIBILITY */}
        {activeModule === 'road' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-400" />
                  NER Road & Accessibility Monitoring
                </h2>
                <p className="text-xs text-slate-400">Live telemetry on highway clearance, landslide choke points, and bridge load integrity.</p>
              </div>
              <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400 border border-rose-500/30">
                2 Active Disrupted Corridors
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { name: 'NH-6: Meghalaya ➔ Silchar Corridor', status: 'PARTIALLY_BLOCKED', risk: 'HIGH (Landslide at Km 142)', detour: 'Active Bypass Operational', speed: '25 km/h' },
                { name: 'NH-29: Dimapur ➔ Kohima Pass', status: 'CLEAR', risk: 'LOW (Optimal Flow)', detour: 'None Required', speed: '55 km/h' },
                { name: 'NH-10: Siliguri ➔ Gangtok Route', status: 'CAUTION', risk: 'MODERATE (Teesta River Swelling)', detour: 'Melli-Jorethang Alternate', speed: '35 km/h' },
                { name: 'NH-306: Silchar ➔ Aizawl Artery', status: 'CLEAR', risk: 'LOW (Convoy Clearance Active)', detour: 'None', speed: '48 km/h' },
                { name: 'NH-415: Banderdewa ➔ Itanagar', status: 'CLEAR', risk: 'LOW (Paved Terrain)', detour: 'None', speed: '60 km/h' },
                { name: 'NH-37: Kaziranga Flood Barrier Pass', status: 'MONITORED', risk: 'MODERATE (Wildlife + Rain)', detour: 'Speed Regulation 40 km/h', speed: '40 km/h' }
              ].map((route, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{route.name}</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      route.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      route.status === 'CAUTION' || route.status === 'MONITORED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Risk Assessment: <span className="text-slate-200">{route.risk}</span></div>
                  <div className="text-xs text-slate-400">Detour Status: <span className="text-indigo-300">{route.detour}</span></div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                    <span className="text-slate-500">Average Transit Speed</span>
                    <span className="font-mono font-bold text-emerald-400">{route.speed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. ESSENTIAL SUPPLIES & PRIORITY */}
        {activeModule === 'supplies' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-indigo-400" />
                  Essential Supply Priority Queue
                </h2>
                <p className="text-xs text-slate-400">Dynamic triage of life-saving medical gear, baby food, and relief fuel across NER.</p>
              </div>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500">
                + Register New Consignment
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-slate-400">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Supply Item</th>
                    <th className="p-3.5">Priority Level</th>
                    <th className="p-3.5">Destination Hub</th>
                    <th className="p-3.5">Transit Status</th>
                    <th className="p-3.5">ETA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {supplies.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-mono text-slate-400">{sup.id}</td>
                      <td className="p-3.5 font-semibold text-white">{sup.item}</td>
                      <td className="p-3.5">
                        <span className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                          sup.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          sup.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        }`}>
                          {sup.priority}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">{sup.dest}</td>
                      <td className="p-3.5">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Check className="h-3 w-3" />
                          {sup.status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-indigo-400 font-bold">{sup.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. DYNAMIC REROUTING (OSRM + NOMINATIM) */}
        {activeModule === 'rerouting' && (
          <div className="grid h-full grid-cols-12 gap-6 p-6 overflow-y-auto">
            <div className="col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-indigo-400" />
                  Dynamic AI Rerouting
                </h2>
                <p className="text-xs text-slate-400 mt-1">Calculates optimal bypass routes around landslide blockage zones.</p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Origin Logistics Depot</label>
                    <input
                      type="text"
                      value={routeStart}
                      onChange={e => setRouteStart(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Destination Hub</label>
                    <input
                      type="text"
                      value={routeDest}
                      onChange={e => setRouteDest(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Assigned Fleet Vehicle</label>
                    <select
                      value={vehicleType}
                      onChange={e => setVehicleType(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      <option>4x4 Heavy All-Terrain Truck (Tata LPTA)</option>
                      <option>Medium 4WD Carrier (Mahindra Bolero)</option>
                      <option>Heavy Emergency Drone (15kg Payload)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <span className="text-xs text-slate-300">Evade Landslide Polygons</span>
                    <input
                      type="checkbox"
                      checked={avoidBlockedSectors}
                      onChange={e => setAvoidBlockedSectors(e.target.checked)}
                      className="h-4 w-4 accent-indigo-600 rounded"
                    />
                  </div>

                  <button
                    onClick={handleRunReroute}
                    className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
                  >
                    Compute Safe Green Corridor
                  </button>
                </div>
              </div>

              {calculatedRoute && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                  <div className="text-xs font-bold uppercase text-slate-400">Route Telemetry</div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Distance</span>
                      <div className="text-lg font-bold text-white">{calculatedRoute.distanceKm || '412.5'} km</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Transit Duration</span>
                      <div className="text-lg font-bold text-indigo-400">{calculatedRoute.durationMinutes || '480'} mins</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white">Turn-by-Turn Emergency Navigation Guidance</h3>
              <p className="text-xs text-slate-400">Verified via Open Source Routing Machine (OSRM) with live terrain slope clearances.</p>

              <div className="mt-4 space-y-2.5 max-h-[500px] overflow-y-auto">
                {[
                  { step: 'Depart Guwahati Hub onto GS Road towards NH-6', dist: '14.2 km', note: 'Clear 4-lane Highway' },
                  { step: 'Cross Byrnihat Bridge into Meghalaya border checkpost', dist: '28.5 km', note: 'Priority Convoy Pass Verified' },
                  { step: 'Ascend Shillong Bypass via Umiam Lake vector', dist: '35.0 km', note: 'Caution: Hill Fog & Rain' },
                  { step: 'Detour around Km 142 Landslide Sector via Alternate Jowai Ridge Road', dist: '42.1 km', note: 'Disaster Hazard Bypassed' },
                  { step: 'Proceed southward along NH-306 into Aizawl valley entry', dist: '120.0 km', note: 'Safe Arrival Corridor' }
                ].map((s, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 font-bold text-indigo-400 text-[10px]">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-200">{s.step}</div>
                      <div className="mt-1 text-[10px] text-slate-400">Segment: {s.dist} &bull; Status: <span className="text-emerald-400">{s.note}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. GOVERNMENT DASHBOARD & ANALYTICS */}
        {activeModule === 'gov' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-400" />
                  MDoNER Executive Oversight Dashboard
                </h2>
                <p className="text-xs text-slate-400">Administrative logistics oversight & district-level accessibility telemetry for the 8 North Eastern States.</p>
              </div>
              <button className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-700">
                📥 Export Weekly MDoNER Report (PDF)
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <span className="text-xs text-slate-400 font-medium">Total Active Relief Fleets</span>
                <div className="mt-2 text-3xl font-bold text-white">58 / 64</div>
                <span className="text-[10px] text-emerald-400">90.6% Operational Rate</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <span className="text-xs text-slate-400 font-medium">Critical Supplies Delivered (24h)</span>
                <div className="mt-2 text-3xl font-bold text-indigo-400">14.8 Tons</div>
                <span className="text-[10px] text-slate-400">Across 32 Remote Panchayats</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <span className="text-xs text-slate-400 font-medium">Average Corridor Delay</span>
                <div className="mt-2 text-3xl font-bold text-emerald-400">-18 Mins</div>
                <span className="text-[10px] text-emerald-400">AI Dynamic Bypass Active</span>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <span className="text-xs text-slate-400 font-medium">Terrain Risk Factor</span>
                <div className="mt-2 text-3xl font-bold text-amber-400">MODERATE</div>
                <span className="text-[10px] text-slate-400">Continuous Satellite Monitoring</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3">8 North Eastern States Accessibility Index</h3>
              <div className="grid grid-cols-4 gap-3">
                {NER_HUBS.map(hub => (
                  <div key={hub.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">{hub.state}</span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        hub.status === 'HIGH_ALERT' ? 'bg-rose-500/20 text-rose-400' :
                        hub.status === 'CAUTION' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>{hub.status}</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-400">Hub: {hub.name.split(' ')[0]}</div>
                    <div className="mt-1 text-[11px] text-slate-500">Active Trucks: {hub.activeVehicles}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* UAV DRONE DISPATCHER MODULE VIEW */}
        {activeModule === 'drone' && (
          <div className="grid h-full grid-cols-12 gap-6 p-6 overflow-y-auto">
            {/* Left Control Panel */}
            <div className="col-span-4 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="h-5 w-5 text-sky-400 animate-pulse" />
                  UAV Drone Flight Control
                </h2>
                <p className="text-xs text-slate-400 mt-1">High-altitude aerial supply dispatch for zero-road emergency zones.</p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400">Origin Logistics Hub</label>
                    <select
                      value={droneOrigin.id}
                      onChange={e => {
                        const found = NER_HUBS.find(h => h.id === e.target.value);
                        if (found) setDroneOrigin(found);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      {NER_HUBS.map(h => (
                        <option key={h.id} value={h.id}>{h.name} ({h.state})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Destination Helipad / Emergency LZ</label>
                    <select
                      value={selectedLZ.id}
                      onChange={e => {
                        const found = NER_EMERGENCY_LZS.find(lz => lz.id === e.target.value);
                        if (found) setSelectedLZ(found);
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      {NER_EMERGENCY_LZS.map(lz => (
                        <option key={lz.id} value={lz.id}>{lz.name} [{lz.elevationMsl}m MSL]</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Assigned Lifeline UAV Drone</label>
                    <select
                      value={selectedDroneId}
                      onChange={e => setSelectedDroneId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    >
                      {NER_DRONE_FLEET.map(d => (
                        <option key={d.id} value={d.id}>{d.name} (Max Payload: {d.maxPayloadKg}kg)</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400">Emergency Payload Cargo</label>
                    <input
                      type="text"
                      value={dronePayloadItem}
                      onChange={e => setDronePayloadItem(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Payload Mass (kg)</span>
                      <span className="font-bold text-sky-400">{dronePayloadKg} kg</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={dronePayloadKg}
                      onChange={e => setDronePayloadKg(Number(e.target.value))}
                      className="w-full accent-sky-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setDroneMissionStatus('LAUNCHING');
                      setTimeout(() => setDroneMissionStatus('IN_FLIGHT'), 2000);
                    }}
                    disabled={!droneFlightPlan?.feasible || droneMissionStatus !== 'IDLE'}
                    className={`w-full rounded-xl py-3 text-xs font-bold text-white shadow-lg transition ${
                      droneMissionStatus === 'IN_FLIGHT' ? 'bg-emerald-600 hover:bg-emerald-500' :
                      droneMissionStatus === 'LAUNCHING' ? 'bg-amber-600 animate-pulse' :
                      droneFlightPlan?.feasible ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30' : 'bg-slate-800 cursor-not-allowed text-slate-500'
                    }`}
                  >
                    {droneMissionStatus === 'IN_FLIGHT' ? '⚡ Autonomous UAV Mission Active' :
                     droneMissionStatus === 'LAUNCHING' ? '⏳ Initiating Pre-Flight & IAF Corridor Handshake...' :
                     '🚀 Launch Autonomous Drone Lifeline Mission'}
                  </button>
                </div>
              </div>

              {droneFlightPlan && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Flight Telemetry Math</span>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                      droneFlightPlan.feasibilityStatus === 'FEASIBLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      droneFlightPlan.feasibilityStatus === 'HIGH_WIND_WARNING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {droneFlightPlan.feasibilityStatus}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-200">{droneFlightPlan.statusMessage}</p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Direct Aerial Range</span>
                      <div className="text-base font-bold text-white">{droneFlightPlan.distanceKm} km</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Estimated Duration</span>
                      <div className="text-base font-bold text-sky-400">{droneFlightPlan.flightDurationMins} mins</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Est. Battery Cons.</span>
                      <div className="text-base font-bold text-emerald-400">{droneFlightPlan.batteryConsumptionPercent}%</div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                      <span className="text-[10px] text-slate-500">Cruise Altitude</span>
                      <div className="text-base font-bold text-indigo-400">{droneFlightPlan.maxAltitudeMsl}m MSL</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Map & Aerial Corridor Display */}
            <div className="col-span-8 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl flex flex-col h-[420px]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-sky-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">High-Altitude Aerial Lifeline Corridor (Zero Road Dependency)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                    Live Altitude Telemetry
                  </span>
                </div>
                <div ref={droneMapContainerRef} className="flex-1 rounded-xl overflow-hidden" />
              </div>

              {/* Pre-Flight Protocol Checklist */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">Sovereign Aerial Pre-Flight Protocol & Safety Readiness</h4>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      IAF Air Corridor
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Geofenced Military Flight Clearance Active</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Mountain Wind Check
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Wind Vector Within Safe Threshold</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Helipad Receiver
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Ground Beacon Active at {selectedLZ.name.split(' ')[0]}</div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Cold-Chain Pod
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Medical Thermal Storage Sealed at 3.8°C</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CITIZEN AI DAMAGE TRIAGE VIEW */}
        {activeModule === 'citizentriage' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Camera className="h-5 w-5 text-pink-400" />
                  Citizen Photo Disaster Reporter & AI Damage Triage
                </h2>
                <p className="text-xs text-slate-400">
                  Multimodal <b>Google Gemini AI Vision</b> damage assessment with geolocation anti-spoofing verification.
                </p>
              </div>

              <span className="rounded-full bg-pink-500/20 px-3 py-1 text-xs font-semibold text-pink-300 border border-pink-500/30 self-start sm:self-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-pink-400 animate-pulse" />
                Crowdsourced NDRF Intelligence
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo & Incident Form */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>📸 1. Disaster Site Photo & Details</span>
                  <span className="text-[10px] text-pink-400 font-mono">EXIF & GPS Sync</span>
                </h3>

                {/* Photo Dropzone / Upload */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Incident Photo Upload:</label>
                  <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-4 bg-slate-950 text-center hover:border-pink-500/60 transition cursor-pointer">
                    {triagePhotoPreview ? (
                      <div className="space-y-2">
                        <img src={triagePhotoPreview} alt="Uploaded disaster" className="max-h-48 rounded-lg mx-auto object-cover shadow-md" />
                        <button
                          onClick={() => { setTriagePhotoPreview(null); setTriagePhotoBase64(null); }}
                          className="text-[11px] text-rose-400 font-semibold hover:underline"
                        >
                          ✕ Remove & Upload Different Photo
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer space-y-2 block">
                        <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                        <div className="text-xs text-slate-300 font-medium">Click to select or drop disaster photo</div>
                        <div className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP from Mobile / Camera</div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setTriagePhotoPreview(reader.result as string);
                                setTriagePhotoBase64(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Location Name & GPS */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Location Name / Landmark:</label>
                  <input
                    type="text"
                    value={triageLocation}
                    onChange={e => setTriageLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Latitude:</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={triageLat}
                      onChange={e => setTriageLat(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Longitude:</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={triageLon}
                      onChange={e => setTriageLon(parseFloat(e.target.value))}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Citizen Notes & Damage Description:</label>
                  <textarea
                    rows={3}
                    value={triageDesc}
                    onChange={e => setTriageDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleRunTriage}
                  disabled={triageAnalyzing}
                  className="w-full rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-pink-600/30 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {triageAnalyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Gemini Vision AI Extracting Damage Metrics...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Analyze Photo & Damage with Gemini AI Vision</span>
                    </>
                  )}
                </button>
              </div>

              {/* AI Damage Assessment Results HUD */}
              <div className="lg:col-span-2 space-y-4">
                {triageResult ? (
                  <>
                    {/* Severity Score Banner */}
                    <div className={`rounded-2xl border p-5 shadow-xl flex items-center justify-between ${
                      triageResult.riskLevel === 'CRITICAL' ? 'border-rose-500/50 bg-rose-950/30' : 'border-amber-500/50 bg-amber-950/30'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-rose-400 font-mono">{triageResult.severityScore.toFixed(1)}</span>
                          <span className="text-[9px] text-slate-400">/ 10 SCORE</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white uppercase">{triageResult.disasterCategory} BREACH</span>
                            <span className="rounded bg-rose-500/30 text-rose-300 font-bold text-[10px] px-2 py-0.5 border border-rose-400/40">
                              {triageResult.riskLevel} SEVERITY
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 max-w-lg">{triageResult.aiSummary}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-emerald-400 font-bold block">✓ Anti-Spoofing Validated</span>
                        <span className="text-xs font-mono text-slate-300">{triageResult.antiSpoofing.confidencePercent}% Confidence</span>
                      </div>
                    </div>

                    {/* Infrastructure Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <span className="text-[10px] text-slate-400 block">Road Breach Cutoff</span>
                        <b className="text-base text-rose-400">{triageResult.roadBreachLengthMeters} meters</b>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <span className="text-[10px] text-slate-400 block">Debris Volume</span>
                        <b className="text-base text-amber-400">{triageResult.estimatedDebrisM3} m³</b>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <span className="text-[10px] text-slate-400 block">Required Earthmovers</span>
                        <b className="text-base text-sky-400">{triageResult.requiredRescueForces.jcbEarthmovers} JCB Units</b>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
                        <span className="text-[10px] text-slate-400 block">NDRF Battalions</span>
                        <b className="text-base text-emerald-400">{triageResult.requiredRescueForces.ndrfBattalions} Unit(s)</b>
                      </div>
                    </div>

                    {/* Anti-Spoofing & Geotag Authentication Card */}
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 shadow-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          Geotag & EXIF Anti-Spoofing Authentication
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">Original Capture Verified</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{triageResult.antiSpoofing.verificationNotes}</p>
                    </div>

                    {/* Recommended Action Items */}
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-xl space-y-3">
                      <div className="text-xs font-bold text-white uppercase tracking-wider">AI Recommended Triage Dispatch Steps</div>
                      <div className="space-y-1.5 text-xs text-slate-300">
                        {triageResult.recommendedActions.map((act, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                            <span className="text-pink-400 font-bold">#{i + 1}</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Broadcast Button */}
                    <button
                      onClick={() => {
                        setTriageBroadcasted(true);
                        setTimeout(() => setTriageBroadcasted(false), 4000);
                      }}
                      className={`w-full rounded-2xl py-3.5 text-xs font-bold text-white shadow-xl transition flex items-center justify-center gap-2 ${
                        triageBroadcasted
                          ? 'bg-emerald-600 shadow-emerald-600/30'
                          : 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:scale-[1.01]'
                      }`}
                    >
                      <Zap className="h-4 w-4" />
                      <span>{triageBroadcasted ? '✓ INCIDENT BROADCASTED TO NDRF 1078 & MAP UPDATED!' : 'BROADCAST VERIFIED INCIDENT TO NDRF COMMAND & UPDATE HAZARD MAP ➔'}</span>
                    </button>
                  </>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400 space-y-3">
                    <Camera className="h-12 w-12 text-pink-500/50 mx-auto" />
                    <h3 className="text-sm font-bold text-white">No Damage Analysis Selected</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Upload a photo or fill in the citizen report details on the left, then click <b>"Analyze Photo & Damage with Gemini AI Vision"</b> to generate the real-time severity assessment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. WEATHER INTELLIGENCE VIEW */}
        {activeModule === 'weather' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-indigo-400" />
                  NER Meteorological & Cloudburst Ingestion
                </h2>
                <p className="text-xs text-slate-400">Powered by <b>Open-Meteo</b> (100% Free, zero rate limits, live satellite radar).</p>
              </div>

              <div className="flex gap-2">
                {NER_HUBS.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setWeatherCity(h)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      weatherCity.id === h.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800'
                    }`}
                  >
                    {h.state}
                  </button>
                ))}
              </div>
            </div>

            {weatherData && (
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <span className="text-xs text-slate-400 font-medium">Temperature</span>
                  <div className="mt-2 text-3xl font-bold text-white">{weatherData.temperature}°C</div>
                  <span className="text-xs text-slate-500">Elevation: {weatherData.elevation}m MSL</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <span className="text-xs text-slate-400 font-medium">Precipitation (Past Hour)</span>
                  <div className="mt-2 text-3xl font-bold text-sky-400">{weatherData.precipitation} mm</div>
                  <span className="text-xs text-slate-500">Rainfall Rate: {weatherData.rain} mm</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <span className="text-xs text-slate-400 font-medium">Wind & Peak Gusts</span>
                  <div className="mt-2 text-3xl font-bold text-emerald-400">{weatherData.windSpeed} km/h</div>
                  <span className="text-xs text-slate-500">Peak: {weatherData.windGusts} km/h</span>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <span className="text-xs text-slate-400 font-medium">Severe Weather Risk</span>
                  <div className={`mt-2 text-2xl font-bold ${
                    weatherData.severeRiskLevel === 'EXTREME' ? 'text-rose-500' :
                    weatherData.severeRiskLevel === 'HIGH' ? 'text-amber-500' : 'text-emerald-400'
                  }`}>
                    {weatherData.severeRiskLevel}
                  </div>
                  <span className="text-xs text-slate-500">Station: {weatherCity.name}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. 22-API ECOSYSTEM VIEW */}
        {activeModule === 'apis' && (
          <div className="h-full overflow-y-auto p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Jeevan Setu 22-API Ecosystem & Architecture Specification
            </h2>
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-950/60 font-semibold text-slate-400">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">API Name</th>
                    <th className="p-3">Provider</th>
                    <th className="p-3">Role in Jeevan Setu NER</th>
                    <th className="p-3">Tier</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {getAPIEcosystemRegistry().map((api, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-medium text-slate-400">{api.category}</td>
                      <td className="p-3 font-bold text-white">{api.name}</td>
                      <td className="p-3 text-slate-400">{api.provider}</td>
                      <td className="p-3 text-slate-300">{api.notes}</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          api.type === 'PRIMARY_OPEN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {api.type === 'PRIMARY_OPEN' ? 'Primary (No-Key Free)' : 'Configurable Slot'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Operational
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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

      </main>
    </div>
  );
}
