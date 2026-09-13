import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Package,
  Warehouse,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Shield,
  Activity,
  PhoneCall,
  Navigation,
  Check,
  X,
  Play,
  Square,
  Cpu,
  Layers,
  FileText,
  Radio,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import L from 'leaflet';
import {
  ReliefSupplyItem,
  ReliefVehicle,
  ReliefDepot,
  ReliefOperation,
  SmartAllocationResult,
  fetchReliefSupplies,
  createSupplyRequest,
  fetchReliefVehicles,
  fetchReliefDepots,
  fetchReliefOperations,
  dispatchReliefOperation,
  markOperationDelivered,
  getSmartAllocation,
  sendVehicleGPSLocation,
  watchDeviceGPS
} from '../services/api/reliefService';
import { NER_STATES, NER_STATES_DISTRICTS } from '../services/api/disasterReportsService';

interface ReliefSupplyTrackingModuleProps {
  initialTab?: 'supplies' | 'depots' | 'live-map' | 'driver-portal' | 'operations' | 'smart-alloc';
  onNavigateHome?: () => void;
}

export const ReliefSupplyTrackingModule: React.FC<ReliefSupplyTrackingModuleProps> = ({
  initialTab = 'supplies',
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'supplies' | 'depots' | 'live-map' | 'driver-portal' | 'operations' | 'smart-alloc'>(initialTab);

  // Sync prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Supply Data States
  const [supplyMetrics, setSupplyMetrics] = useState({
    totalAvailableSupplies: 0,
    criticalShortage: 0,
    suppliesReserved: 0,
    suppliesInTransit: 0,
    deliveredSupplies: 0
  });
  const [suppliesList, setSuppliesList] = useState<ReliefSupplyItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Supply Request Form Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqState, setReqState] = useState<string>('Assam');
  const [reqDistrict, setReqDistrict] = useState<string>('Kamrup Metropolitan');
  const [reqArea, setReqArea] = useState('');
  const [reqDisaster, setReqDisaster] = useState('Flood');
  const [reqItem, setReqItem] = useState('Drinking Water Canisters');
  const [reqQty, setReqQty] = useState(100);
  const [reqPriority, setReqPriority] = useState('High');
  const [reqSubmitMsg, setReqSubmitMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Vehicles Data States
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ReliefVehicle | null>(null);

  // Depots Data States
  const [depots, setDepots] = useState<ReliefDepot[]>([]);

  // Operations Data States
  const [operations, setOperations] = useState<ReliefOperation[]>([]);

  // Driver Mobile Tracking States
  const [driverVehicleId, setDriverVehicleId] = useState('RT-101');
  const [isDriverTracking, setIsDriverTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState('GPS Idle • Click Start Live Tracking to broadcast real location');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number; accuracy?: number; speed?: number; time: string } | null>(null);
  const [driverGpsError, setDriverGpsError] = useState<string | null>(null);

  // Smart Allocation States
  const [allocState, setAllocState] = useState('Assam');
  const [allocDistrict, setAllocDistrict] = useState('Darrang');
  const [allocArea, setAllocArea] = useState('Mangaldoi Relief Camp');
  const [allocSupply, setAllocSupply] = useState('Food Grain Packs');
  const [allocQty, setAllocQty] = useState(250);
  const [allocResult, setAllocResult] = useState<SmartAllocationResult | null>(null);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  // Map Container Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Initial Data Load
  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [supRes, vehData, depData, opData] = await Promise.all([
        fetchReliefSupplies(),
        fetchReliefVehicles(),
        fetchReliefDepots(),
        fetchReliefOperations()
      ]);
      setSupplyMetrics(supRes.metrics);
      setSuppliesList(supRes.supplies);
      setVehicles(vehData);
      setDepots(depData);
      setOperations(opData);
      if (vehData.length > 0 && !selectedVehicle) {
        setSelectedVehicle(vehData[0]);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load relief tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const timer = setInterval(() => {
      // Periodic soft refresh for vehicle locations & status
      fetchReliefVehicles().then(setVehicles);
      fetchReliefOperations().then(setOperations);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Leaflet Map Initialization for Live Tracking Map tab
  useEffect(() => {
    if (activeTab !== 'live-map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center on NER Region (Assam/Meghalaya)
    const map = L.map(mapContainerRef.current, {
      center: [26.1445, 91.7362],
      zoom: 7,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors | Jeevan Setu NER'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update Map Markers & Route Lines when vehicles change or tab switches
  const routeLinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (activeTab !== 'live-map' || !mapInstanceRef.current) return;

    // Clear existing markers & route polylines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    routeLinesRef.current.forEach(l => l.remove());
    routeLinesRef.current = [];

    const map = mapInstanceRef.current;
    const bounds = L.latLngBounds([]);

    vehicles.forEach(v => {
      const vLat = v.lat || v.currentLatitude || 26.1445;
      const vLon = v.lon || v.currentLongitude || 91.7362;
      const sLat = v.sourceLat || 26.1445;
      const sLon = v.sourceLon || 91.7362;
      const dLat = v.destLat || 26.4363;
      const dLon = v.destLon || 92.0345;

      const isConnected = v.trackingStatus === 'GPS_CONNECTED';
      const isStale = v.trackingStatus === 'GPS_STALE';

      const colorClass = isConnected ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : isStale ? 'bg-amber-500' : 'bg-rose-500';
      const statusBadge = isConnected ? '🟢 LIVE GPS CONNECTED' : isStale ? '🟡 LAST KNOWN LOCATION' : '🔴 GPS NOT CONNECTED';

      // 1. Vehicle Marker
      const customVehicleIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 ${isConnected ? 'border-emerald-400' : isStale ? 'border-amber-400' : 'border-rose-400'} shadow-2xl text-white font-bold text-base">
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${colorClass}"></span>
            🚚
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      const vehicleMarker = L.marker([vLat, vLon], { icon: customVehicleIcon }).addTo(map);

      // 2. Source Depot Marker
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500 text-indigo-300 text-xs font-bold shadow-md">
            🏢
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const depotMarker = L.marker([sLat, sLon], { icon: depotIcon }).addTo(map);
      depotMarker.bindPopup(`<div class="p-2 text-xs font-bold text-indigo-300">🏢 Source Depot: ${v.sourceDepot || 'Regional Relief Depot'}</div>`);
      markersRef.current.push(depotMarker);

      // 3. Destination Marker
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-rose-950 border border-rose-500 text-rose-300 text-xs font-bold shadow-md">
            🏁
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      const destMarker = L.marker([dLat, dLon], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`<div class="p-2 text-xs font-bold text-rose-300">🏁 Destination: ${v.destination}</div>`);
      markersRef.current.push(destMarker);

      // 4. Draw Polyline Route Line connecting Source Depot -> Vehicle Current GPS -> Destination
      const routePolyline = L.polyline([[sLat, sLon], [vLat, vLon], [dLat, dLon]], {
        color: isConnected ? '#10b981' : isStale ? '#f59e0b' : '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);
      routeLinesRef.current.push(routePolyline);

      const popupContent = `
        <div class="p-3 font-sans min-w-[250px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
            <span class="font-extrabold text-sm text-slate-100">${v.vehicleId} • ${v.vehicleType}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : isStale ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}">${statusBadge}</span>
          </div>
          <p class="text-xs text-slate-300 mb-1"><strong>Driver:</strong> ${v.driverName} (${v.contact})</p>
          <p class="text-xs text-slate-300 mb-1"><strong>State:</strong> ${v.state}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>Current Position:</strong> ${v.currentLocationName}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>Route Path:</strong> ${v.sourceDepot || 'Depot'} &rarr; ${v.destination}</p>
          <div class="grid grid-cols-2 gap-1 text-[11px] bg-slate-800 p-2 rounded mt-2 text-slate-300">
            <div>Speed: <strong class="text-emerald-400">${v.speed || 0} km/h</strong></div>
            <div>Accuracy: <strong class="text-cyan-400">±${v.accuracy || 4}m</strong></div>
          </div>
          <div class="text-[10px] text-slate-400 mt-2">
            Last update: ${v.lastLocationUpdate ? new Date(v.lastLocationUpdate).toLocaleTimeString() : 'Live Synced'}
          </div>
        </div>
      `;

      vehicleMarker.bindPopup(popupContent);
      vehicleMarker.on('click', () => setSelectedVehicle(v));
      markersRef.current.push(vehicleMarker);

      bounds.extend([sLat, sLon]);
      bounds.extend([vLat, vLon]);
      bounds.extend([dLat, dLon]);
    });

    if (vehicles.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [vehicles, activeTab]);

  const handleToggleDriverTracking = () => {
    if (isDriverTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsDriverTracking(false);
      setGpsStatusText('GPS Tracking Stopped');
      setDriverGpsError(null);
    } else {
      setDriverGpsError(null);
      setGpsStatusText('Acquiring real device GPS signal...');

      const id = watchDeviceGPS(
        driverVehicleId,
        (pos) => {
          setDriverLocation({
            lat: pos.lat,
            lon: pos.lon,
            accuracy: pos.accuracy,
            speed: pos.speed,
            time: new Date().toLocaleTimeString()
          });
          setGpsStatusText(pos.statusText);
          // Refresh list to update vehicle tracking status
          fetchReliefVehicles().then(setVehicles);
        },
        (errText) => {
          setDriverGpsError(errText);
          setIsDriverTracking(false);
        }
      );

      if (id !== null) {
        setWatchId(id);
        setIsDriverTracking(true);
      }
    }
  };

  // Submit New Relief Supply Request Handler
  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitMsg(null);
    const res = await createSupplyRequest({
      state: reqState,
      district: reqDistrict,
      affectedArea: reqArea,
      disasterType: reqDisaster,
      item: reqItem,
      requiredQuantity: reqQty,
      priority: reqPriority
    });

    if (res.success) {
      setReqSubmitMsg({ success: true, text: 'Relief request submitted & saved to database successfully!' });
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSubmitMsg(null);
        setReqArea('');
        loadAllData();
      }, 1500);
    } else {
      setReqSubmitMsg({ success: false, text: res.message });
    }
  };

  // Calculate Smart Allocation Handler
  const handleRunSmartAllocation = async () => {
    setAllocLoading(true);
    setAllocError(null);
    setAllocResult(null);

    const res = await getSmartAllocation({
      state: allocState,
      district: allocDistrict,
      affectedArea: allocArea,
      requiredSupply: allocSupply,
      requiredQuantity: allocQty
    });

    if (res.success && res.allocation) {
      setAllocResult(res.allocation);
    } else {
      setAllocError(res.error || 'Failed to match optimal allocation');
    }
    setAllocLoading(false);
  };

  // Filtered Supplies
  const categories = ['ALL', 'Food', 'Drinking Water', 'Medical Kits', 'Shelter Tarps', 'Hygiene Kits', 'Warm Clothes', 'Heavy Rescue Tools'];
  const filteredSupplies = selectedCategory === 'ALL'
    ? suppliesList
    : suppliesList.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-20">
      {/* Top Header Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Truck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  REAL-TIME RELIEF SUPPLY & VEHICLE TRACKING
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 uppercase tracking-widest">
                    LIVE REGIONAL SYSTEM
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  Strictly Restricted to North-Eastern Region — 8 States (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              New Supply Request
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-semibold"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          <button
            onClick={() => setActiveTab('supplies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'supplies'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Relief Supply Monitoring
          </button>

          <button
            onClick={() => setActiveTab('depots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'depots'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Relief Depots & Stock
          </button>

          <button
            onClick={() => setActiveTab('live-map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'live-map'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
            Live Vehicle Tracking Map
          </button>

          <button
            onClick={() => setActiveTab('driver-portal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'driver-portal'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            Driver Mobile GPS Portal
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Active Relief Operations
          </button>

          <button
            onClick={() => setActiveTab('smart-alloc')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'smart-alloc'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Smart Allocation Engine
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-MODULE 1: RELIEF SUPPLY MONITORING */}
      {activeTab === 'supplies' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 5 Live Database-Driven Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Total Available Supplies</span>
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">
                {supplyMetrics.totalAvailableSupplies.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Units</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Across 8 NER Depots</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Critical Shortage Items</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2">
                {supplyMetrics.criticalShortage} <span className="text-xs text-slate-400 font-normal">Categories</span>
              </div>
              <div className="text-[10px] text-rose-400 mt-1 font-semibold">Needs Immediate Replenishment</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Supplies Reserved</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2">
                {supplyMetrics.suppliesReserved.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Units</span>
              </div>
              <div className="text-[10px] text-amber-400 mt-1 font-semibold">Staged for Dispatch</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Supplies In Transit</span>
                <Truck className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-400 mt-2">
                {supplyMetrics.suppliesInTransit} <span className="text-xs text-slate-400 font-normal">Convoys</span>
              </div>
              <div className="text-[10px] text-blue-400 mt-1 font-semibold">En Route to Disaster Zones</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Delivered Supplies</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2">
                {supplyMetrics.deliveredSupplies} <span className="text-xs text-slate-400 font-normal">Operations</span>
              </div>
              <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Verified Relief Reached</div>
            </div>
          </div>

          {/* Supply Category Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">Filter Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Live Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Live Regional Relief Inventory Table
              </h2>
              <span className="text-xs text-slate-400">Showing {filteredSupplies.length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Supply ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Depot Location</th>
                    <th className="py-3 px-4">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredSupplies.map(sup => (
                    <tr key={sup.supplyId} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-200">{sup.supplyId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                          {sup.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{sup.item}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {sup.availableQuantity.toLocaleString()} {sup.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-400">
                        {sup.reservedQuantity.toLocaleString()} {sup.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          sup.status === 'In Stock'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : sup.status === 'Low Stock'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : sup.status === 'Critical'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : 'bg-blue-950 text-blue-300 border-blue-700'
                        }`}>
                          {sup.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{sup.location}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(sup.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {filteredSupplies.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No relief supplies matched the selected category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: RELIEF DEPOTS */}
      {activeTab === 'depots' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {depots.map(depot => {
              const utilPct = Math.round((depot.currentStock / depot.capacity) * 100);
              return (
                <div key={depot.depotId} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {depot.depotId}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-1">{depot.depotName}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {depot.district}, {depot.state}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        depot.status === 'OPERATIONAL'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : depot.status === 'FULL'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-rose-950 text-rose-300 border-rose-700'
                      }`}>
                        {depot.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-400">Storage Capacity Utilization</span>
                        <span className="text-emerald-400 font-mono">{utilPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className={`h-full transition-all duration-500 ${
                            utilPct > 90 ? 'bg-amber-500' : utilPct < 20 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Capacity</span>
                        <strong className="text-slate-200 font-mono">{depot.capacity.toLocaleString()} Tons</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Current Stock</span>
                        <strong className="text-emerald-400 font-mono">{depot.currentStock.toLocaleString()} Tons</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">Enrolled under State Emergency Relief Hub</span>
                    <button
                      onClick={() => {
                        setActiveTab('smart-alloc');
                        setAllocState(depot.state);
                        setAllocDistrict(depot.district);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1"
                    >
                      Allocate Supplies <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-MODULE 3: LIVE VEHICLE TRACKING MAP */}
      {activeTab === 'live-map' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Column */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[560px]">
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <h2 className="text-xs font-extrabold uppercase text-white tracking-wider">
                    NER Fleet Live GPS Telemetry Stream Map
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Live GPS Connected</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Stale (&gt;30s)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> GPS Not Connected</span>
                </div>
              </div>

              {/* Leaflet Map Canvas */}
              <div ref={mapContainerRef} className="flex-1 w-full h-full z-0"></div>
            </div>

            {/* Vehicle Details Side Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[560px] overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                  <span>Vehicles List ({vehicles.length})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Real-Time Sensor Sync</span>
                </h3>

                <div className="space-y-3">
                  {vehicles.map(veh => {
                    const isSelected = selectedVehicle?.vehicleId === veh.vehicleId;
                    const isConnected = veh.trackingStatus === 'GPS_CONNECTED';
                    const isStale = veh.trackingStatus === 'GPS_STALE';

                    return (
                      <div
                        key={veh.vehicleId}
                        onClick={() => setSelectedVehicle(veh)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-emerald-500/80 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs text-white">{veh.vehicleId}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isConnected
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                              : isStale
                              ? 'bg-amber-950 text-amber-300 border-amber-700'
                              : 'bg-rose-950 text-rose-300 border-rose-700'
                          }`}>
                            {isConnected ? 'GPS CONNECTED' : isStale ? 'GPS STALE' : 'GPS NOT CONNECTED'}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-300 space-y-1">
                          <p>Driver: <strong className="text-slate-200">{veh.driverName}</strong> ({veh.contact})</p>
                          <p>Route: <span className="text-slate-400">{veh.currentLocationName} &rarr; {veh.destination}</span></p>
                        </div>

                        {veh.lat != null && veh.lon != null ? (
                          <div className="mt-2 text-[10px] font-mono text-emerald-400 flex items-center justify-between bg-slate-900 p-1.5 rounded">
                            <span>Lat: {veh.lat.toFixed(4)}, Lon: {veh.lon.toFixed(4)}</span>
                            <span>Speed: {veh.speed || 0} km/h</span>
                          </div>
                        ) : (
                          <div className="mt-2 text-[10px] font-semibold text-rose-400 bg-rose-950/40 p-1.5 rounded border border-rose-900/50">
                            GPS NOT CONNECTED • Waiting for driver mobile transmission
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 text-center">
                <button
                  onClick={() => setActiveTab('driver-portal')}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-amber-950 transition flex items-center justify-center gap-2"
                >
                  <Compass className="w-4 h-4" />
                  Open Mobile Driver Tracking Console
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 4: DRIVER MOBILE TRACKING PORTAL */}
      {activeTab === 'driver-portal' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="text-center mb-6">
              <span className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl inline-block border border-amber-500/30 mb-3">
                <Compass className="w-8 h-8" />
              </span>
              <h2 className="text-xl font-black text-white">DRIVER MOBILE GPS PORTAL</h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-Time Hardware Geolocation Transmission (`navigator.geolocation.watchPosition`)
              </p>
            </div>

            {/* Vehicle Selection Dropdown */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
                Select Assigned Relief Vehicle:
              </label>
              <select
                value={driverVehicleId}
                onChange={e => setDriverVehicleId(e.target.value)}
                disabled={isDriverTracking}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="RT-101">RT-101 (Assam Heavy Logistics Truck - Driver: Bhaben Kalita)</option>
                <option value="RT-102">RT-102 (Meghalaya Terrain 4x4 Mini - Driver: Wanlang Kharshiing)</option>
                <option value="RT-103">RT-103 (Manipur Medical Emergency Van - Driver: Ibomcha Singh)</option>
                <option value="RT-104">RT-104 (Nagaland Relief Convoy - Driver: Toshi Ao)</option>
              </select>
            </div>

            {/* Tracking Controls */}
            <div className="space-y-4">
              {!isDriverTracking ? (
                <button
                  onClick={handleToggleDriverTracking}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-950 transition flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  START LIVE DEVICE GPS TRACKING
                </button>
              ) : (
                <button
                  onClick={handleToggleDriverTracking}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-base shadow-xl shadow-rose-950 transition flex items-center justify-center gap-3"
                >
                  <Square className="w-5 h-5 fill-current" />
                  STOP LIVE TRACKING
                </button>
              )}

              {/* Quick Route Telemetry Simulator */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Desktop & Field Telemetry Simulation Triggers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendVehicleGPSLocation({
                        vehicleId: 'RT-101',
                        lat: 26.3000,
                        lon: 91.9000,
                        accuracy: 5,
                        speed: 48
                      });
                      if (res.success) {
                        setGpsStatusText('📡 Simulating RT-101 En Route to Mangaldoi (26.3000, 91.9000) • 48 km/h');
                        fetchReliefVehicles().then(setVehicles);
                      }
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700 text-left font-semibold"
                  >
                    🚚 RT-101: Guwahati &rarr; Mangaldoi
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendVehicleGPSLocation({
                        vehicleId: 'RT-102',
                        lat: 25.4000,
                        lon: 91.8000,
                        accuracy: 6,
                        speed: 38
                      });
                      if (res.success) {
                        setGpsStatusText('📡 Simulating RT-102 En Route to Sohra (25.4000, 91.8000) • 38 km/h');
                        fetchReliefVehicles().then(setVehicles);
                      }
                    }}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 text-left font-semibold"
                  >
                    🚚 RT-102: Shillong &rarr; Sohra Pass
                  </button>
                </div>
              </div>
            </div>

            {/* GPS Telemetry Output */}
            <div className="mt-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">GPS Telemetry Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDriverTracking ? 'bg-emerald-950 text-emerald-300 border-emerald-700 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isDriverTracking ? 'TRANSMITTING LIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="text-xs text-slate-300 font-mono bg-slate-900 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {gpsStatusText}
              </div>

              {driverGpsError && (
                <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{driverGpsError}</span>
                </div>
              )}

              {driverLocation && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Latitude</span>
                    <strong className="text-emerald-400 font-mono text-sm">{driverLocation.lat.toFixed(5)}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Longitude</span>
                    <strong className="text-emerald-400 font-mono text-sm">{driverLocation.lon.toFixed(5)}</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Accuracy</span>
                    <strong className="text-cyan-400 font-mono">±{driverLocation.accuracy || 0} meters</strong>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Current Speed</span>
                    <strong className="text-amber-400 font-mono">{driverLocation.speed || 0} km/h</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 5: ACTIVE RELIEF OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operations.map(op => {
              const isDelivered = op.tripStatus === 'DELIVERED';
              const isOnRoute = op.tripStatus === 'ON_ROUTE';

              return (
                <div key={op.operationId} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800">
                        {op.operationId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDelivered ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-blue-950 text-blue-300 border-blue-700'
                      }`}>
                        {op.tripStatus}
                      </span>
                    </div>

                    <h4 className="font-bold text-white text-sm mb-1">{op.supplyItem} ({op.quantity} Units)</h4>
                    <p className="text-xs text-slate-400">Assigned Vehicle: <strong className="text-slate-200">{op.vehicleId}</strong></p>

                    {/* Step Tracker */}
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                        <span>Depot Dispatched</span>
                        <span>En Route</span>
                        <span>Delivered</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-2 rounded bg-emerald-500"></div>
                        <div className={`h-2 rounded ${isOnRoute || isDelivered ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        <div className={`h-2 rounded ${isDelivered ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <p><span className="text-slate-400">Source Depot:</span> <strong className="text-slate-200">{op.sourceDepot}</strong></p>
                      <p><span className="text-slate-400">Destination:</span> <strong className="text-slate-200">{op.destination}</strong></p>
                      <p><span className="text-slate-400">GPS Signal:</span> <span className="font-mono text-emerald-400">{op.gpsStatus}</span></p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Updated: {new Date(op.lastUpdated).toLocaleTimeString()}
                    </span>
                    {!isDelivered && (
                      <button
                        onClick={async () => {
                          await markOperationDelivered(op.operationId);
                          loadAllData();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-MODULE 6: SMART ALLOCATION ENGINE */}
      {activeTab === 'smart-alloc' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Cpu className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg font-black text-white">SMART RELIEF ALLOCATION ENGINE</h2>
                <p className="text-xs text-slate-400">
                  Matches affected North-Eastern areas with nearest operational depots and available GPS vehicles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">State (8 NER Only)</label>
                <select
                  value={allocState}
                  onChange={e => {
                    setAllocState(e.target.value);
                    const dists = NER_STATES_DISTRICTS[e.target.value] || [];
                    setAllocDistrict(dists[0] || '');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                >
                  {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">District</label>
                <select
                  value={allocDistrict}
                  onChange={e => setAllocDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white"
                >
                  {(NER_STATES_DISTRICTS[allocState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Affected Area / Relief Camp</label>
                <input
                  type="text"
                  value={allocArea}
                  onChange={e => setAllocArea(e.target.value)}
                  placeholder="e.g. Mangaldoi High School Camp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Required Supply Item</label>
                <input
                  type="text"
                  value={allocSupply}
                  onChange={e => setAllocSupply(e.target.value)}
                  placeholder="e.g. Food Grain Packs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Required Quantity (Units/Kits)</label>
                <input
                  type="number"
                  value={allocQty}
                  onChange={e => setAllocQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleRunSmartAllocation}
              disabled={allocLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-xl shadow-indigo-950 transition flex items-center justify-center gap-2"
            >
              <Cpu className={`w-4 h-4 ${allocLoading ? 'animate-spin' : ''}`} />
              {allocLoading ? 'Calculating Optimal Match...' : 'MATCH OPTIMAL DEPOT & VEHICLE'}
            </button>

            {allocError && (
              <div className="mt-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs">
                {allocError}
              </div>
            )}

            {allocResult && (
              <div className="mt-6 p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Recommended Allocation Plan
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Source Depot Matched</span>
                    <strong className="text-white text-sm block">{allocResult.availableDepot}</strong>
                    <span className="text-emerald-400 font-mono text-[11px]">Stock Available: {allocResult.depotStock} Units</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-slate-400 text-[10px] block">Vehicle Assigned</span>
                    <strong className="text-white text-sm block">{allocResult.assignedVehicleId} ({allocResult.vehicleType})</strong>
                    <span className="text-amber-400 text-[11px]">Tracking: {allocResult.gpsStatus}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={async () => {
                      await dispatchReliefOperation({
                        depotId: allocResult.availableDepot,
                        vehicleId: allocResult.assignedVehicleId,
                        supplyItem: allocResult.requiredSupply,
                        quantity: allocResult.requiredQuantity,
                        destination: allocResult.destination
                      });
                      loadAllData();
                      setActiveTab('operations');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    Confirm & Dispatch Relief Convoy Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW SUPPLY REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Submit Relief Supply Request (NER Only)
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">State (8 NER Only)</label>
                  <select
                    value={reqState}
                    onChange={e => {
                      setReqState(e.target.value);
                      const dists = NER_STATES_DISTRICTS[e.target.value] || [];
                      setReqDistrict(dists[0] || '');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">District</label>
                  <select
                    value={reqDistrict}
                    onChange={e => setReqDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    {(NER_STATES_DISTRICTS[reqState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Affected Area / Relief Camp</label>
                <input
                  type="text"
                  required
                  value={reqArea}
                  onChange={e => setReqArea(e.target.value)}
                  placeholder="e.g. Silchar Stadium Relief Shelter"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Disaster Type</label>
                  <select
                    value={reqDisaster}
                    onChange={e => setReqDisaster(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Heavy Rain">Heavy Rain</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Storm/Cyclone">Storm/Cyclone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Priority</label>
                  <select
                    value={reqPriority}
                    onChange={e => setReqPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Supply Item</label>
                  <input
                    type="text"
                    required
                    value={reqItem}
                    onChange={e => setReqItem(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Required Quantity</label>
                  <input
                    type="number"
                    required
                    value={reqQty}
                    onChange={e => setReqQty(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              {reqSubmitMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  reqSubmitMsg.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                }`}>
                  {reqSubmitMsg.text}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Submit Supply Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
