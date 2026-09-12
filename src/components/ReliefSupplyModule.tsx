import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Truck,
  Building2,
  FileText,
  Zap,
  MapPin,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  Radio,
  Search,
  Filter,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Gauge,
  Layers
} from 'lucide-react';
import L from 'leaflet';
import {
  ReliefSupplyItem,
  SupplyInventoryStats,
  ReliefSupplyRequest,
  ReliefDepot,
  ReliefVehicle,
  ReliefOperation,
  NER_STATES,
  SUPPLY_CATEGORIES,
  NERState,
  SupplyCategory,
  DisasterType,
  PriorityLevel,
  getReliefSupplies,
  addReliefSupply,
  createReliefSupplyRequest,
  getReliefSupplyRequests,
  getReliefDepots,
  getReliefVehicles,
  getActiveReliefOperations,
  performSmartAllocation,
  dispatchReliefOperation,
  confirmReliefDelivery,
  subscribeToVehicleLocationStream,
  isNERState
} from '../services/api/reliefSupplyService';

const MASTER_NER_POLYGON: [number, number][] = [
  [28.2, 88.0], [28.1, 88.9], [27.3, 88.9], [27.0, 89.8],
  [27.4, 91.6], [28.0, 92.5], [29.3, 94.5], [29.5, 96.5],
  [28.2, 97.4], [27.0, 96.5], [26.2, 95.3], [25.2, 94.8],
  [24.2, 94.4], [23.2, 93.4], [21.9, 92.8], [22.4, 92.2],
  [23.0, 91.2], [24.1, 91.1], [24.9, 91.8], [25.2, 89.8],
  [26.1, 89.7], [26.6, 88.5], [27.2, 88.0]
];

interface ReliefSupplyModuleProps {
  onNavigateToDriverTracking?: () => void;
}

export default function ReliefSupplyModule({ onNavigateToDriverTracking }: ReliefSupplyModuleProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'requests' | 'depots' | 'vehicles' | 'operations'>('inventory');

  // Data states
  const [supplies, setSupplies] = useState<ReliefSupplyItem[]>([]);
  const [stats, setStats] = useState<SupplyInventoryStats>({ totalAvailable: 0, criticalShortageCount: 0, suppliesReserved: 0, suppliesInTransit: 0, deliveredSupplies: 0 });
  const [requests, setRequests] = useState<ReliefSupplyRequest[]>([]);
  const [depots, setDepots] = useState<ReliefDepot[]>([]);
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [operations, setOperations] = useState<ReliefOperation[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showAddSupplyModal, setShowAddSupplyModal] = useState<boolean>(false);
  const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<ReliefVehicle | null>(null);

  // Form States
  const [newSupply, setNewSupply] = useState<Partial<ReliefSupplyItem>>({
    item: '', category: 'Drinking Water', state: 'Assam', district: 'Kamrup Metropolitan', depot: 'Guwahati Central Relief Hub', availableQuantity: 1000, requiredQuantity: 1500, priority: 'High'
  });

  const [newReq, setNewReq] = useState<Partial<ReliefSupplyRequest>>({
    state: 'Assam', district: 'Cachar', affectedArea: 'Silchar Flood Relief Zone', disasterType: 'Flood', item: 'Drinking Water 1L Bottles', category: 'Drinking Water', requiredQuantity: 500, priority: 'Critical'
  });

  // Map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Load all telemetry data
  const refreshAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [supData, reqData, depotData, vehData, opsData] = await Promise.all([
        getReliefSupplies(),
        getReliefSupplyRequests(),
        getReliefDepots(),
        getReliefVehicles(),
        getActiveReliefOperations()
      ]);

      setSupplies(supData.supplies);
      setStats(supData.stats);
      setRequests(reqData);
      setDepots(depotData);
      setVehicles(vehData);
      setOperations(opsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync database telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // SSE Vehicle Stream Subscription
  useEffect(() => {
    const unsubscribe = subscribeToVehicleLocationStream((updatedVehicle) => {
      setVehicles((prev) => {
        const idx = prev.findIndex((v) => v.vehicleId === updatedVehicle.vehicleId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedVehicle;
          return next;
        }
        return [...prev, updatedVehicle];
      });
    });

    return () => unsubscribe();
  }, []);

  // Initialize Map in Vehicles Tab
  useEffect(() => {
    if (activeTab !== 'vehicles' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current).setView([26.1445, 91.7362], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      // Draw Master NER Polygon Boundary
      const polygonPoints = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon] as [number, number]);
      L.polygon(polygonPoints, {
        color: '#10b981',
        weight: 2,
        fillColor: '#059669',
        fillOpacity: 0.08,
        dashArray: '6, 6'
      }).addTo(map);

      leafletMapRef.current = map;
    }

    // Render Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    vehicles.forEach((v) => {
      if (v.currentLatitude && v.currentLongitude) {
        const isLive = v.trackingStatus === 'GPS_CONNECTED';
        const color = isLive ? '#10b981' : '#f43f5e';

        const customIcon = L.divIcon({
          className: 'custom-vehicle-marker',
          html: `<div style="
            background: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 0 10px ${color};
            font-size: 14px;
          ">🚚</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([v.currentLatitude, v.currentLongitude], { icon: customIcon })
          .addTo(leafletMapRef.current!)
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <strong style="font-size: 14px;">🚚 ${v.vehicleId} — ${v.vehicleType}</strong><br/>
              <div style="margin-top: 4px; font-size: 12px;">
                <b>Depot:</b> ${v.sourceDepot}<br/>
                <b>Destination:</b> ${v.destination}<br/>
                <b>Status:</b> ${isLive ? '🟢 GPS CONNECTED' : '🔴 GPS NOT CONNECTED'}<br/>
                <b>Speed:</b> ${v.speed || 0} km/h | <b>Accuracy:</b> ±${v.gpsAccuracy || 0}m
              </div>
            </div>
          `);

        marker.on('click', () => setSelectedVehicle(v));
        markersRef.current.push(marker);
      }
    });
  }, [activeTab, vehicles]);

  // Handlers
  const handleAddSupplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await addReliefSupply(newSupply);
    if (res.success) {
      setSuccessMsg('Supply added successfully!');
      setShowAddSupplyModal(false);
      refreshAllData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = await createReliefSupplyRequest(newReq);
    if (res.success) {
      setSuccessMsg('Supply request submitted successfully!');
      setShowRequestModal(false);
      refreshAllData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleSmartAllocate = async (reqId: string) => {
    setLoading(true);
    const res = await performSmartAllocation(reqId);
    if (res.success) {
      setSuccessMsg(res.message);
      refreshAllData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  const handleDispatchOp = async (opId: string) => {
    const res = await dispatchReliefOperation(opId);
    if (res.success) {
      setSuccessMsg(res.message);
      refreshAllData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleDeliverOp = async (opId: string) => {
    const res = await confirmReliefDelivery(opId);
    if (res.success) {
      setSuccessMsg(res.message);
      refreshAllData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  // Filtered supplies table
  const filteredSupplies = supplies.filter((s) => {
    const matchesCat = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesState = stateFilter === 'ALL' || s.state === stateFilter;
    const matchesSearch = searchQuery === '' || s.item.toLowerCase().includes(searchQuery.toLowerCase()) || s.depot.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesState && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Scope Guard Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-lg">
            <Package className="w-6 h-6 text-emerald-400" />
            Relief Supply & Real-Time Vehicle Tracking
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Database-Driven Logistics & Phone GPS Tracking Grid — North Eastern Region (8 States)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Data Coverage: North Eastern Region — 8 States
          </span>
          <button
            onClick={refreshAllData}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Sync Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" /> Supply Inventory
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'requests'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Supply Requests ({requests.length})
        </button>

        <button
          onClick={() => setActiveTab('depots')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'depots'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" /> Relief Depots ({depots.length})
        </button>

        <button
          onClick={() => setActiveTab('vehicles')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'vehicles'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" /> Live Vehicle Map ({vehicles.length})
        </button>

        <button
          onClick={() => setActiveTab('operations')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'operations'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" /> Smart Allocation & Operations ({operations.length})
        </button>
      </div>

      {/* TAB 1: SUPPLY INVENTORY */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* 5 KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Stock</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.totalAvailable.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Shortages</div>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats.criticalShortageCount} <span className="text-xs font-normal text-slate-400">items</span></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supplies Reserved</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">{stats.suppliesReserved.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Supplies In Transit</div>
              <div className="text-2xl font-bold text-blue-400 mt-1">{stats.suppliesInTransit.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span></div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered Supplies</div>
              <div className="text-2xl font-bold text-teal-400 mt-1">{stats.deliveredSupplies.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span></div>
            </div>
          </div>

          {/* Filters & Action Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search item or depot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                {SUPPLY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All 8 NER States</option>
                {NER_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAddSupplyModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" /> Add Supply Stock
            </button>
          </div>

          {/* Supply Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="p-4">Supply ID</th>
                  <th className="p-4">Item & Category</th>
                  <th className="p-4">State & District</th>
                  <th className="p-4">Depot</th>
                  <th className="p-4">Available</th>
                  <th className="p-4">Required</th>
                  <th className="p-4">Reserved</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSupplies.map((s) => (
                  <tr key={s.supplyId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-emerald-400">{s.supplyId}</td>
                    <td className="p-4">
                      <div className="font-semibold text-white">{s.item}</div>
                      <div className="text-xs text-slate-400">{s.category}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200">{s.district}</div>
                      <div className="text-xs text-emerald-400 font-medium">{s.state}</div>
                    </td>
                    <td className="p-4 text-slate-300 text-xs">{s.depot}</td>
                    <td className="p-4 font-bold text-emerald-400">{s.availableQuantity.toLocaleString()}</td>
                    <td className="p-4 font-medium text-slate-300">{s.requiredQuantity.toLocaleString()}</td>
                    <td className="p-4 font-medium text-amber-400">{s.reservedQuantity.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        s.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {s.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        s.status === 'Available' ? 'bg-emerald-500/15 text-emerald-400' :
                        s.status === 'Low Stock' ? 'bg-amber-500/15 text-amber-400' :
                        s.status === 'Critical' ? 'bg-rose-500/15 text-rose-400' :
                        'bg-blue-500/15 text-blue-400'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400 font-mono">
                      {new Date(s.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SUPPLY REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Emergency Supply Requests</h2>
              <p className="text-xs text-slate-400">Filtered strictly to North Eastern Region (8 States)</p>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Plus className="w-4 h-4" /> Create Supply Request
            </button>
          </div>

          {/* Requests Queue */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((r) => (
              <div key={r.requestId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{r.requestId}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{r.item}</h3>
                    <p className="text-xs text-slate-400">{r.affectedArea} ({r.state})</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    r.priority === 'Critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {r.priority} Priority
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500">Disaster Type:</span>
                    <div className="font-medium text-slate-200">{r.disasterType}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Required Quantity:</span>
                    <div className="font-bold text-emerald-400">{r.requiredQuantity} units</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    r.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    r.status === 'ALLOCATED' ? 'bg-blue-500/20 text-blue-400' :
                    r.status === 'DISPATCHED' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    Status: {r.status}
                  </span>

                  {r.status === 'PENDING' && (
                    <button
                      onClick={() => handleSmartAllocate(r.requestId)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" /> Smart Allocate Depot
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RELIEF DEPOTS */}
      {activeTab === 'depots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {depots.map((d) => (
            <div key={d.depotId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-400">{d.depotId}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{d.depotName}</h3>
                  <p className="text-xs text-slate-400">{d.location}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {d.status}
                </span>
              </div>

              {/* Progress Bar Capacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Storage Capacity</span>
                  <span className="font-bold text-slate-200">{d.utilization}% Used</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.utilization}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>Stock: {d.currentStock.toLocaleString()}</span>
                  <span>Cap: {d.storageCapacity.toLocaleString()}</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 border-t border-slate-800 pt-3 flex justify-between">
                <span>State: <strong className="text-emerald-400">{d.state}</strong></span>
                <span>District: <strong className="text-slate-200">{d.district}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: REAL-TIME VEHICLE TRACKING (LIVE MAP) */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                Live Vehicle GPS Map (NER 8 States)
              </h3>
              {onNavigateToDriverTracking && (
                <button
                  onClick={onNavigateToDriverTracking}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Smartphone className="w-4 h-4" /> Open Driver Phone Tracker
                </button>
              )}
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-[520px] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950"
            />
          </div>

          {/* Vehicle List & Details Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Vehicle Fleet Registry</h3>

            {selectedVehicle && (
              <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">{selectedVehicle.vehicleId}</span>
                    <h4 className="font-bold text-white text-lg">{selectedVehicle.vehicleType}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedVehicle.trackingStatus === 'GPS_CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {selectedVehicle.trackingStatus === 'GPS_CONNECTED' ? '🟢 GPS CONNECTED' : '🔴 GPS NOT CONNECTED'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Current Position:</span>
                    <span className="font-mono text-white">
                      {selectedVehicle.currentLatitude ? `${selectedVehicle.currentLatitude.toFixed(4)}, ${selectedVehicle.currentLongitude?.toFixed(4)}` : 'GPS NOT CONNECTED'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Destination:</span>
                    <span className="font-semibold text-amber-400">{selectedVehicle.destination}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Speed / Accuracy:</span>
                    <span className="font-medium text-white">{selectedVehicle.speed || 0} km/h (±{selectedVehicle.gpsAccuracy || 0}m)</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Trip Status:</span>
                    <span className="font-bold text-blue-400">{selectedVehicle.tripStatus}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {vehicles.map((v) => (
                <div
                  key={v.vehicleId}
                  onClick={() => setSelectedVehicle(v)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedVehicle?.vehicleId === v.vehicleId
                      ? 'bg-slate-800 border-emerald-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-emerald-400">{v.vehicleId}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      v.trackingStatus === 'GPS_CONNECTED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {v.trackingStatus === 'GPS_CONNECTED' ? '🟢 LIVE' : '🔴 NO GPS'}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white mt-1">{v.vehicleType}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{v.destination}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SMART ALLOCATION & ACTIVE OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-white">Active Relief Operations</h2>
              <p className="text-xs text-slate-400">Connected Logistics Workflow: Request → Depot → Vehicle → Delivery</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {operations.map((op) => (
              <div key={op.operationId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-sm font-extrabold text-emerald-400">{op.operationId}</span>
                    <div className="text-xs text-slate-400 mt-0.5">{op.sourceDepotName} ➔ {op.destination}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    op.tripStatus === 'DELIVERED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    op.tripStatus === 'ON_ROUTE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {op.tripStatus}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500">Assigned Vehicle:</span>
                    <div className="font-bold text-white font-mono">{op.vehicleId} ({op.vehicleType || 'Truck'})</div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500">Relief Cargo:</span>
                    <div className="font-bold text-emerald-400">
                      {op.supplies && op.supplies[0] ? `${op.supplies[0].quantity} units` : `${op.quantity} units`}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  {op.tripStatus === 'LOADING' && (
                    <button
                      onClick={() => handleDispatchOp(op.operationId)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5" /> Dispatch Vehicle On Route
                    </button>
                  )}

                  {op.tripStatus === 'ON_ROUTE' && (
                    <button
                      onClick={() => handleDeliverOp(op.operationId)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Delivery
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal 1: Add Supply Stock */}
      {showAddSupplyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" /> Add Relief Supply Stock
            </h3>

            <form onSubmit={handleAddSupplySubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newSupply.item}
                  onChange={(e) => setNewSupply({ ...newSupply, item: e.target.value })}
                  placeholder="e.g. Drinking Water 1L Bottles"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Category</label>
                  <select
                    value={newSupply.category}
                    onChange={(e) => setNewSupply({ ...newSupply, category: e.target.value as SupplyCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {SUPPLY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">State (8 NER States)</label>
                  <select
                    value={newSupply.state}
                    onChange={(e) => setNewSupply({ ...newSupply, state: e.target.value as NERState })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {NER_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Available Quantity</label>
                  <input
                    type="number"
                    required
                    value={newSupply.availableQuantity}
                    onChange={(e) => setNewSupply({ ...newSupply, availableQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Required Quantity</label>
                  <input
                    type="number"
                    required
                    value={newSupply.requiredQuantity}
                    onChange={(e) => setNewSupply({ ...newSupply, requiredQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplyModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
                >
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create Supply Request */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-400" /> Create Relief Supply Request
            </h3>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">State (NER Only)</label>
                  <select
                    value={newReq.state}
                    onChange={(e) => setNewReq({ ...newReq, state: e.target.value as NERState })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {NER_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newReq.district}
                    onChange={(e) => setNewReq({ ...newReq, district: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Affected Area / Relief Location</label>
                <input
                  type="text"
                  required
                  value={newReq.affectedArea}
                  onChange={(e) => setNewReq({ ...newReq, affectedArea: e.target.value })}
                  placeholder="e.g. Silchar Relief Camp Sector 4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Item Required</label>
                  <input
                    type="text"
                    required
                    value={newReq.item}
                    onChange={(e) => setNewReq({ ...newReq, item: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Required Quantity</label>
                  <input
                    type="number"
                    required
                    value={newReq.requiredQuantity}
                    onChange={(e) => setNewReq({ ...newReq, requiredQuantity: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
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
}
