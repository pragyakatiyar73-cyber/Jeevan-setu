import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Truck,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Activity,
  FileText,
  Radio,
  Navigation,
  Check,
  X,
  ChevronRight,
  Shield,
  Layers,
  PhoneCall,
  Flame,
  CloudRain,
  Mountain,
  Compass,
  Cpu,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import {
  EmergencyItem,
  EmergencyMetrics,
  fetchEmergencyData,
  fetchEmergencyById,
  submitEmergencyReport,
  updateEmergencyStatus,
  getEmergencyRecommendation
} from '../services/api/emergencyResponseService';
import { NER_STATES, NER_STATES_DISTRICTS } from '../services/api/disasterReportsService';

interface SmartEmergencyResponseModuleProps {
  initialEmergencyId?: string | null;
  onNavigateHome?: () => void;
}

export const SmartEmergencyResponseModule: React.FC<SmartEmergencyResponseModuleProps> = ({
  initialEmergencyId,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'map' | 'recommendation' | 'detail'>('dashboard');

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [refreshToast, setRefreshToast] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<EmergencyMetrics>({
    activeEmergencies: 0,
    criticalIncidents: 0,
    highPriorityIncidents: 0,
    rescueVehiclesAvailable: 0,
    medicalSupportRequired: 0,
    reliefOperationsActive: 0
  });
  const [emergencies, setEmergencies] = useState<EmergencyItem[]>([]);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyItem | null>(null);

  // Filters
  const [filterState, setFilterState] = useState<string>('ALL');
  const [filterDisaster, setFilterDisaster] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  // Report Form Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [repState, setRepState] = useState<string>('Assam');
  const [repDistrict, setRepDistrict] = useState<string>('Kamrup Metropolitan');
  const [repArea, setRepArea] = useState('');
  const [repLocationDetails, setRepLocationDetails] = useState('');
  const [repDisaster, setRepDisaster] = useState<string>('Flood');
  const [repAffectedCount, setRepAffectedCount] = useState(100);
  const [repInjuredCount, setRepInjuredCount] = useState(5);
  const [repRequirements, setRepRequirements] = useState<string[]>(['Rescue', 'Drinking Water']);
  const [repDescription, setRepDescription] = useState('');
  const [repPhotoUrl, setRepPhotoUrl] = useState<string | null>(null);
  const [repSubmitMsg, setRepSubmitMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Map Container Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Load All Data
  const loadData = async (isManualClick: boolean = false) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchEmergencyData();
      setMetrics(data.metrics);
      setEmergencies(data.emergencies);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (data.emergencies.length > 0) {
        setSelectedEmergency(prev => {
          if (initialEmergencyId) {
            const item = data.emergencies.find(e => e.id === initialEmergencyId);
            if (item) {
              setActiveTab('detail');
              return item;
            }
          }
          if (prev) {
            const match = data.emergencies.find(e => e.id === prev.id);
            return match || data.emergencies[0];
          }
          return data.emergencies[0];
        });
      }

      if (mapInstanceRef.current) {
        setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
      }

      if (isManualClick) {
        setRefreshToast(true);
        setTimeout(() => setRefreshToast(false), 2500);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load emergency response telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => loadData(false), 10000);
    return () => clearInterval(timer);
  }, []);

  // Leaflet Map Initialization
  useEffect(() => {
    if (activeTab !== 'map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

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

  // Update Map Markers
  useEffect(() => {
    if (activeTab !== 'map' || !mapInstanceRef.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const bounds = L.latLngBounds([]);

    emergencies.forEach(item => {
      const isCritical = item.priority === 'CRITICAL';
      const isHigh = item.priority === 'HIGH';

      const colorClass = isCritical ? 'bg-rose-500 animate-ping' : isHigh ? 'bg-amber-500' : 'bg-blue-500';

      const customIcon = L.divIcon({
        className: 'custom-emergency-marker',
        html: `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 border-2 ${isCritical ? 'border-rose-500' : isHigh ? 'border-amber-500' : 'border-blue-500'} shadow-xl text-white font-black">
            <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full ${colorClass}"></span>
            🚨
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([item.lat, item.lon], { icon: customIcon }).addTo(map);

      const popupContent = `
        <div class="p-3 font-sans min-w-[240px]">
          <div class="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
            <span class="font-extrabold text-xs text-rose-400 font-mono">${item.id}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isCritical ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-amber-950 text-amber-300 border border-amber-700'}">${item.priority}</span>
          </div>
          <p class="text-xs font-bold text-white mb-1">${item.disasterType} &bull; ${item.affectedArea}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>District:</strong> ${item.district}, ${item.state}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>People Affected:</strong> ${item.affectedPeople}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>Requirements:</strong> ${item.requirements.join(', ')}</p>
          <div class="mt-2 text-[10px] text-slate-400">Status: <strong class="text-emerald-400">${item.status}</strong></div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedEmergency(item);
        setActiveTab('detail');
      });
      markersRef.current.push(marker);
      bounds.extend([item.lat, item.lon]);
    });

    if (emergencies.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [emergencies, activeTab]);

  // Form submit handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepSubmitMsg(null);

    const res = await submitEmergencyReport({
      state: repState,
      district: repDistrict,
      affectedArea: repArea,
      locationDetails: repLocationDetails,
      disasterType: repDisaster,
      affectedPeople: repAffectedCount,
      injuredPeople: repInjuredCount,
      requirements: repRequirements,
      photoUrl: repPhotoUrl,
      description: repDescription
    });

    if (res.success && res.emergency) {
      setRepSubmitMsg({ success: true, text: 'Emergency reported successfully & registered in NER database!' });
      setTimeout(() => {
        setShowReportModal(false);
        setRepSubmitMsg(null);
        setSelectedEmergency(res.emergency!);
        setActiveTab('detail');
        loadData();
      }, 1500);
    } else {
      setRepSubmitMsg({ success: false, text: res.message });
    }
  };

  // Filtered List
  const filteredEmergencies = emergencies.filter(e => {
    if (filterState !== 'ALL' && e.state !== filterState) return false;
    if (filterDisaster !== 'ALL' && e.disasterType !== filterDisaster) return false;
    if (filterPriority !== 'ALL' && e.priority !== filterPriority) return false;
    return true;
  });

  const disasterTypesList = ['Flood', 'Landslide', 'Heavy Rainfall', 'Earthquake', 'Cyclone', 'Road Blockage', 'Building Damage', 'Medical Emergency', 'Other'];
  const requirementTypesList = ['Rescue', 'Medical', 'Food', 'Drinking Water', 'Shelter', 'Road Clearance', 'Evacuation'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6 pb-20">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
              <ShieldAlert className="w-7 h-7" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                SMART EMERGENCY RESPONSE
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/50 uppercase tracking-widest">
                  AI PRIORITISATION ENGINE
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                AI-assisted emergency prioritisation for disaster-affected areas in North-Eastern India (8 NER States Only)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="hidden sm:inline-block text-[10px] font-mono text-slate-400">
                Updated: <span className="text-slate-200 font-bold">{lastRefreshed}</span>
              </span>
            )}
            {refreshToast && (
              <span className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 text-[10px] font-bold rounded-lg animate-pulse">
                ✓ Data Refreshed!
              </span>
            )}
            <button
              onClick={() => loadData(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold active:scale-95 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition"
            >
              <Plus className="w-4 h-4" />
              Report Emergency
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

      {/* Main Tabs Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Emergencies Dashboard ({emergencies.length})
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-300 animate-pulse" />
            Emergency Incident Map
          </button>

          <button
            onClick={() => setActiveTab('recommendation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'recommendation'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Resource Matching Engine
          </button>

          {selectedEmergency && (
            <button
              onClick={() => setActiveTab('detail')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'detail'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Incident Detail ({selectedEmergency.id})
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* DASHBOARD TAB */}
      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 6 Live Database Driven Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Active Emergencies</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">{metrics.activeEmergencies}</div>
              <div className="text-[10px] text-rose-400 mt-1 font-semibold">Active Response Required</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Critical Incidents</span>
                <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
              </div>
              <div className="text-2xl font-black text-rose-400 mt-2">{metrics.criticalIncidents}</div>
              <div className="text-[10px] text-rose-400 mt-1 font-semibold">Immediate Action</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>High Priority</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 mt-2">{metrics.highPriorityIncidents}</div>
              <div className="text-[10px] text-amber-400 mt-1 font-semibold">Urgent Dispatch</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Rescue Vehicles</span>
                <Truck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-2">{metrics.rescueVehiclesAvailable}</div>
              <div className="text-[10px] text-emerald-400 mt-1 font-semibold">Ready for Convoy</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Medical Support</span>
                <HeartPulse className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-black text-cyan-400 mt-2">{metrics.medicalSupportRequired}</div>
              <div className="text-[10px] text-cyan-400 mt-1 font-semibold">Trauma & Ambulance</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Relief Active</span>
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-2">{metrics.reliefOperationsActive}</div>
              <div className="text-[10px] text-indigo-400 mt-1 font-semibold">Convoys En Route</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-400">
                <Filter className="w-4 h-4 text-rose-400" />
                <span>Filters:</span>
              </div>

              <select
                value={filterState}
                onChange={e => setFilterState(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-semibold"
              >
                <option value="ALL">All 8 NER States</option>
                {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                value={filterDisaster}
                onChange={e => setFilterDisaster(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-semibold"
              >
                <option value="ALL">All Disaster Types</option>
                {disasterTypesList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-semibold"
              >
                <option value="ALL">All Priority Ratings</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <span className="text-slate-400 text-xs font-mono">
              Showing {filteredEmergencies.length} of {emergencies.length} Emergencies
            </span>
          </div>

          {/* Emergency Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmergencies.map(item => {
              const isCritical = item.priority === 'CRITICAL';
              const isHigh = item.priority === 'HIGH';

              return (
                <div
                  key={item.id}
                  className={`bg-slate-900 border p-5 rounded-2xl shadow-xl flex flex-col justify-between transition hover:border-slate-700 ${
                    isCritical ? 'border-rose-900/60' : isHigh ? 'border-amber-900/60' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {item.id}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                          : isHigh
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-blue-950 text-blue-300 border-blue-700'
                      }`}>
                        {item.priority}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-white text-base mb-1">{item.disasterType} &bull; {item.affectedArea}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      {item.district}, {item.state}
                    </p>

                    <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Affected</span>
                        <strong className="text-white font-mono">{item.affectedPeople} Persons</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Injured</span>
                        <strong className="text-rose-400 font-mono">{item.injuredPeople} Persons</strong>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Immediate Requirements:</span>
                      <div className="flex flex-wrap gap-1">
                        {item.requirements.map(r => (
                          <span key={r} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {item.status}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEmergency(item);
                        setActiveTab('detail');
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MAP TAB */}
      {activeTab === 'map' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                <h2 className="text-xs font-extrabold uppercase text-white tracking-wider">
                  NER Emergency Incidents Map (8 States)
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Critical Priority</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> High Priority</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Medium/Low</span>
              </div>
            </div>

            <div ref={mapContainerRef} className="flex-1 w-full h-full z-0"></div>
          </div>
        </div>
      )}

      {/* RESOURCE MATCHING & RECOMMENDATION TAB */}
      {activeTab === 'recommendation' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Cpu className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg font-black text-white">RECOMMENDED EMERGENCY RESPONSE ENGINE</h2>
                <p className="text-xs text-slate-400">
                  AI-assisted resource matching connecting disaster incidents with nearest available depots, vehicles, and accessible routes.
                </p>
              </div>
            </div>

            {selectedEmergency ? (
              <div className="space-y-5">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-rose-400">{selectedEmergency.id}</span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">{selectedEmergency.disasterType} &bull; {selectedEmergency.affectedArea}</h3>
                    <p className="text-xs text-slate-400">{selectedEmergency.district}, {selectedEmergency.state}</p>
                  </div>
                  <span className="px-3 py-1 bg-rose-950 text-rose-300 border border-rose-700 text-xs font-black rounded-full">
                    {selectedEmergency.priority} PRIORITY
                  </span>
                </div>

                {/* Response Card */}
                <div className="p-5 bg-slate-950 border border-indigo-500/40 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2">
                    Recommended Resource Allocation Plan
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block">Main Risk Identified</span>
                      <strong className="text-white text-sm block">{selectedEmergency.connectedContext?.floodRiskText || 'High Water Level & Slope Breach'}</strong>
                      <span className="text-amber-400 font-mono text-[11px]">{selectedEmergency.connectedContext?.roadAccessText || 'NH-37 Operational'}</span>
                    </div>

                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 block">Recommended Convoy & Vehicle</span>
                      <strong className="text-white text-sm block">{selectedEmergency.assignedResource?.vehicleId || 'RT-101 (4x4 All-Terrain Convoy Truck)'}</strong>
                      <span className="text-emerald-400 font-mono text-[11px]">GPS Status: {selectedEmergency.assignedResource?.trackingStatus || 'GPS_CONNECTED'}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={async () => {
                        await getEmergencyRecommendation(selectedEmergency.id);
                        loadData();
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      Run Resource Match Calculator
                    </button>
                    <button
                      onClick={() => setActiveTab('detail')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
                    >
                      Proceed to Operations Detail &rarr;
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Select an active emergency from the dashboard to run resource matching.
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL TAB */}
      {activeTab === 'detail' && selectedEmergency && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded bg-slate-800 text-rose-400 border border-rose-900/80">
                    {selectedEmergency.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    {selectedEmergency.status}
                  </span>
                </div>
                <h2 className="text-xl font-black text-white mt-1">
                  {selectedEmergency.disasterType} &bull; {selectedEmergency.affectedArea}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  {selectedEmergency.locationDetails}, {selectedEmergency.district}, {selectedEmergency.state}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-rose-950 text-rose-300 border border-rose-700 text-xs font-black rounded-xl">
                  {selectedEmergency.priority} PRIORITY
                </span>
              </div>
            </div>

            {/* Data Transparency Badges Banner */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Connected Jeevan Setu Data Feeds & Transparency Status
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Weather Sensor</span>
                  <span className="font-bold text-emerald-400">{selectedEmergency.connectedContext?.weatherDataStatus}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Flood Telemetry</span>
                  <span className="font-bold text-emerald-400">{selectedEmergency.connectedContext?.floodRiskStatus}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Landslide Risk</span>
                  <span className="font-bold text-emerald-400">{selectedEmergency.connectedContext?.landslideRiskStatus}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Road Accessibility</span>
                  <span className="font-bold text-emerald-400">{selectedEmergency.connectedContext?.roadAccessibilityStatus}</span>
                </div>
              </div>
            </div>

            {/* Impact & Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase">Impact Assessment</h4>
                <p className="text-xs text-slate-300"><strong>People Affected:</strong> {selectedEmergency.affectedPeople}</p>
                <p className="text-xs text-slate-300"><strong>Injured Count:</strong> {selectedEmergency.injuredPeople}</p>
                <p className="text-xs text-slate-300 leading-relaxed mt-2">{selectedEmergency.description}</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase">Assigned Relief Resources</h4>
                {selectedEmergency.assignedResource ? (
                  <div className="text-xs text-slate-300 space-y-1">
                    <p><strong>Source Depot:</strong> {selectedEmergency.assignedResource.depotName}</p>
                    <p><strong>Relief Vehicle:</strong> {selectedEmergency.assignedResource.vehicleId} ({selectedEmergency.assignedResource.vehicleType})</p>
                    <p><strong>GPS Telemetry:</strong> <span className="text-emerald-400 font-mono">{selectedEmergency.assignedResource.trackingStatus}</span></p>
                    <p><strong>Route Status:</strong> <span className="text-indigo-400 font-mono">{selectedEmergency.assignedResource.routeStatus}</span></p>
                  </div>
                ) : (
                  <p className="text-xs text-amber-400 font-semibold">No resource assigned yet. Click Resource Matcher tab to allocate convoy.</p>
                )}
              </div>
            </div>

            {/* Status Workflow Updater */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-300">Update Emergency Workflow Step (Authorised Operator):</h4>
              <div className="flex flex-wrap gap-2">
                {['REPORTED', 'ASSESSED', 'RESPONSE RECOMMENDED', 'RESOURCE ASSIGNED', 'RESPONSE IN PROGRESS', 'RESOLVED'].map(st => (
                  <button
                    key={st}
                    onClick={async () => {
                      await updateEmergencyStatus(selectedEmergency.id, st);
                      loadData();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      selectedEmergency.status === st
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Timeline */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Response Timeline (Actual Database Timestamps)
              </h4>
              <div className="space-y-3 pl-2 border-l-2 border-slate-800">
                {selectedEmergency.timeline.map((item, idx) => (
                  <div key={idx} className="relative pl-4">
                    <span className="absolute -left-[9px] top-1.5 w-2 h-2 rounded-full bg-emerald-400"></span>
                    <p className="text-xs font-bold text-white">{item.statusText}</p>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(item.time).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT EMERGENCY MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Report an Emergency (NER 8 States Only)
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">State (8 NER Only)</label>
                  <select
                    value={repState}
                    onChange={e => {
                      setRepState(e.target.value);
                      const dists = NER_STATES_DISTRICTS[e.target.value] || [];
                      setRepDistrict(dists[0] || '');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">District</label>
                  <select
                    value={repDistrict}
                    onChange={e => setRepDistrict(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold"
                  >
                    {(NER_STATES_DISTRICTS[repState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Affected Area / Locality</label>
                <input
                  type="text"
                  required
                  value={repArea}
                  onChange={e => setRepArea(e.target.value)}
                  placeholder="e.g. Zoo Road Inundation Zone"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Exact / Approx Location Details</label>
                <input
                  type="text"
                  value={repLocationDetails}
                  onChange={e => setRepLocationDetails(e.target.value)}
                  placeholder="e.g. Near Central Park, Ward 12"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Disaster Type</label>
                  <select
                    value={repDisaster}
                    onChange={e => setRepDisaster(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    {disasterTypesList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">People Affected</label>
                  <input
                    type="number"
                    value={repAffectedCount}
                    onChange={e => setRepAffectedCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Injured Count</label>
                  <input
                    type="number"
                    value={repInjuredCount}
                    onChange={e => setRepInjuredCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Immediate Requirements</label>
                <div className="flex flex-wrap gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {requirementTypesList.map(req => {
                    const isChecked = repRequirements.includes(req);
                    return (
                      <button
                        key={req}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setRepRequirements(repRequirements.filter(r => r !== req));
                          } else {
                            setRepRequirements([...repRequirements, req]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                          isChecked ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {req}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Description / Additional Notes</label>
                <textarea
                  rows={3}
                  value={repDescription}
                  onChange={e => setRepDescription(e.target.value)}
                  placeholder="Describe emergency situation and immediate priorities..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white"
                ></textarea>
              </div>

              {repSubmitMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  repSubmitMsg.success ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-rose-950 text-rose-300 border border-rose-700'
                }`}>
                  {repSubmitMsg.text}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Submit Emergency Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
