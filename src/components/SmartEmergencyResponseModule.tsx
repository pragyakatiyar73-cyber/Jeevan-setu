import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  MapPin,
  AlertTriangle,
  Users,
  HeartPulse,
  Truck,
  Building2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Navigation,
  CloudRain,
  Activity,
  Zap,
  Eye,
  FileText,
  ShieldCheck,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import {
  EmergencyIncident,
  EmergencyPriority,
  EmergencyStatus,
  EmergencyDisasterType,
  EmergencyRequirement,
  EmergencyReportPayload,
  getEmergencyIncidents,
  submitEmergencyReport,
  updateEmergencyStatus,
  assignEmergencyResource
} from '../services/api/emergencyResponseService';
import { NER_STATES, NERState, getReliefVehicles, getReliefDepots, ReliefVehicle, ReliefDepot } from '../services/api/reliefSupplyService';
import EmergencyDetailModal from './EmergencyDetailModal';

const MASTER_NER_POLYGON: [number, number][] = [
  [28.2, 88.0], [28.1, 88.9], [27.3, 88.9], [27.0, 89.8],
  [27.4, 91.6], [28.0, 92.5], [29.3, 94.5], [29.5, 96.5],
  [28.2, 97.4], [27.0, 96.5], [26.2, 95.3], [25.2, 94.8],
  [24.2, 94.4], [23.2, 93.4], [21.9, 92.8], [22.4, 92.2],
  [23.0, 91.2], [24.1, 91.1], [24.9, 91.8], [25.2, 89.8],
  [26.1, 89.7], [26.6, 88.5], [27.2, 88.0]
];

const DISASTER_TYPES: EmergencyDisasterType[] = [
  'Flood',
  'Landslide',
  'Heavy Rainfall',
  'Earthquake',
  'Cyclone',
  'Road Blockage',
  'Building Damage',
  'Medical Emergency',
  'Other'
];

const REQUIREMENTS_LIST: EmergencyRequirement[] = [
  'Rescue',
  'Medical',
  'Food',
  'Drinking Water',
  'Shelter',
  'Road Clearance',
  'Evacuation'
];

interface SmartEmergencyResponseModuleProps {
  onNavigateToMap?: () => void;
  onNavigateToSupply?: () => void;
  onTriggerSOS?: () => void;
}

export default function SmartEmergencyResponseModule({ onNavigateToMap, onNavigateToSupply, onTriggerSOS }: SmartEmergencyResponseModuleProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report' | 'matcher'>('dashboard');

  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [depots, setDepots] = useState<ReliefDepot[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Incident Detail View Modal
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // Report Form State
  const [reportForm, setReportForm] = useState<EmergencyReportPayload>({
    state: 'Assam',
    district: 'Cachar',
    affectedArea: 'Silchar Flood Zone Sector 3',
    disasterType: 'Flood',
    peopleAffected: 120,
    injured: 8,
    immediateRequirements: ['Rescue', 'Drinking Water', 'Medical'],
    description: 'River water overflowed embankments into village homes.',
    photo: null
  });

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Fetch telemetry data
  const refreshData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [incList, vehList, depotList] = await Promise.all([
        getEmergencyIncidents(),
        getReliefVehicles(),
        getReliefDepots()
      ]);
      setIncidents(incList);
      setVehicles(vehList);
      setDepots(depotList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sync database emergency telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Initialize Map in Dashboard Tab
  useEffect(() => {
    if (activeTab !== 'dashboard' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current).setView([26.1445, 91.7362], 7);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 18
      }).addTo(map);

      // Master 8 NER Polygon
      const polygonPoints = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon] as [number, number]);
      L.polygon(polygonPoints, {
        color: '#ef4444',
        weight: 2,
        fillColor: '#dc2626',
        fillOpacity: 0.08,
        dashArray: '6, 6'
      }).addTo(map);

      leafletMapRef.current = map;
    }

    // Draw Emergency Markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    incidents.forEach((inc) => {
      if (inc.latitude && inc.longitude) {
        const color = inc.priority === 'CRITICAL' ? '#ef4444' : inc.priority === 'HIGH' ? '#f59e0b' : '#3b82f6';

        const customIcon = L.divIcon({
          className: 'custom-emergency-marker',
          html: `<div style="
            background: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 0 12px ${color};
            font-size: 14px;
          ">🚨</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([inc.latitude, inc.longitude], { icon: customIcon })
          .addTo(leafletMapRef.current!)
          .bindPopup(`
            <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
              <strong style="font-size: 14px;">🚨 ${inc.incidentId} — ${inc.disasterType}</strong><br/>
              <div style="margin-top: 4px; font-size: 12px;">
                <b>Location:</b> ${inc.affectedArea}, ${inc.state}<br/>
                <b>Priority:</b> <span style="color:${color}; font-weight:bold;">${inc.priority}</span><br/>
                <b>Affected:</b> ${inc.peopleAffected} | <b>Injured:</b> ${inc.injured}<br/>
                <b>Status:</b> ${inc.status.replace('_', ' ')}
              </div>
            </div>
          `);

        marker.on('click', () => setSelectedIncidentId(inc.incidentId));
        markersRef.current.push(marker);
      }
    });
  }, [activeTab, incidents]);

  // Form Submit Handler
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const res = await submitEmergencyReport(reportForm);
    if (res.success) {
      setSuccessMsg('Emergency distress report logged! AI Priority Assessment completed.');
      setActiveTab('dashboard');
      refreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  // Toggle Requirement Selection
  const toggleRequirement = (reqItem: EmergencyRequirement) => {
    const current = [...reportForm.immediateRequirements];
    const idx = current.indexOf(reqItem);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(reqItem);
    setReportForm({ ...reportForm, immediateRequirements: current });
  };

  // Calculate Metrics
  const activeCount = incidents.filter((i) => i.status !== 'RESOLVED').length;
  const criticalCount = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length;
  const highCount = incidents.filter((i) => i.priority === 'HIGH' && i.status !== 'RESOLVED').length;
  const availableVehiclesCount = vehicles.filter((v) => v.tripStatus === 'AVAILABLE').length;
  const medicalRequiredCount = incidents.filter((i) => i.requirements.includes('Medical') && i.status !== 'RESOLVED').length;
  const activeOpsCount = incidents.filter((i) => i.status === 'RESPONSE_IN_PROGRESS').length;

  const criticalBanners = incidents.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED');

  // Filtered incidents list
  const filteredIncidents = incidents.filter((i) => {
    const matchState = stateFilter === 'ALL' || i.state === stateFilter;
    const matchPriority = priorityFilter === 'ALL' || i.priority === priorityFilter;
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchSearch = searchQuery === '' || i.affectedArea.toLowerCase().includes(searchQuery.toLowerCase()) || i.district.toLowerCase().includes(searchQuery.toLowerCase());
    return matchState && matchPriority && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-rose-400 font-extrabold text-xl">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
            Smart Emergency Response
          </div>
          <p className="text-xs text-slate-300 mt-1">
            AI-assisted emergency prioritisation for disaster-affected areas in North-Eastern India.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Data Coverage: North Eastern Region — 8 States
          </span>
          <button
            onClick={refreshData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title="Sync Database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Prominent CRITICAL EMERGENCY Banner */}
      {criticalBanners.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-2 border-rose-500 rounded-2xl p-5 shadow-2xl shadow-rose-950/50 space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-200 font-black text-base tracking-wider uppercase">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              CRITICAL EMERGENCY ALERT ({criticalBanners.length} ACTIVE)
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs tracking-wider">
              IMMEDIATE RESPONSE REQUIRED
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {criticalBanners.slice(0, 2).map((cb) => (
              <div key={cb.incidentId} className="bg-slate-950/80 border border-rose-500/40 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold text-rose-400">{cb.incidentId}</span>
                  <span className="text-xs font-bold text-white">{cb.disasterType}</span>
                </div>
                <div className="text-sm font-bold text-white">{cb.affectedArea}, {cb.state}</div>
                <div className="text-xs text-rose-300">
                  Impact: <strong>{cb.peopleAffected} Affected</strong> | <strong>{cb.injured} Injured</strong>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-xs text-slate-400">Status: {cb.status.replace('_', ' ')}</span>
                  <button
                    onClick={() => setSelectedIncidentId(cb.incidentId)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
                  >
                    View & Dispatch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* 6 Database-Driven KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Emergencies</div>
          <div className="text-2xl font-bold text-white mt-1">{activeCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Incidents</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{criticalCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Priority</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{highCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rescue Vehicles</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{availableVehiclesCount} <span className="text-xs font-normal text-slate-400">ready</span></div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medical Needed</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{medicalRequiredCount}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Operations</div>
          <div className="text-2xl font-bold text-teal-400 mt-1">{activeOpsCount}</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'dashboard'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Emergency Dashboard & Map
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'report'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" /> Report an Emergency
        </button>

        <button
          onClick={() => setActiveTab('matcher')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'matcher'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/40'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" /> Smart Resource Matcher
        </button>
      </div>

      {/* TAB 1: EMERGENCY DASHBOARD & GIS MAP */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Map Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                Live Emergency Incidents Map (NER 8 States)
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                Click any marker to open detailed response panel
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-[480px] rounded-xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-950"
            />
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search location or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">All 8 NER States</option>
                {NER_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-rose-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">REPORTED</option>
                <option value="ASSESSED">ASSESSED</option>
                <option value="RESPONSE_RECOMMENDED">RESPONSE RECOMMENDED</option>
                <option value="RESOURCE_ASSIGNED">RESOURCE ASSIGNED</option>
                <option value="RESPONSE_IN_PROGRESS">RESPONSE IN PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
              </select>
            </div>
          </div>

          {/* Incident Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map((inc) => (
              <div key={inc.incidentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-xl flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-rose-400">{inc.incidentId}</span>
                      <h4 className="text-base font-bold text-white mt-0.5">{inc.disasterType} Emergency</h4>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                      inc.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      inc.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-blue-500/20 text-blue-400 border-blue-500/40'
                    }`}>
                      {inc.priority}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    {inc.affectedArea}, <strong className="text-emerald-400">{inc.state}</strong>
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-500">Affected:</span>
                      <div className="font-bold text-white">{inc.peopleAffected} people</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Injured:</span>
                      <div className="font-bold text-rose-400">{inc.injured} casualties</div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {inc.requirements.map((r, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-300 border border-slate-800 rounded text-[11px]">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-400">
                    Status: <strong className="text-slate-200">{inc.status.replace('_', ' ')}</strong>
                  </span>

                  <button
                    onClick={() => setSelectedIncidentId(inc.incidentId)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                  >
                    <Eye className="w-3.5 h-3.5" /> Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REPORT AN EMERGENCY FORM */}
      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-rose-500" /> Report an Emergency Incident
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Mobile-first emergency logging form restricted to the 8 North Eastern Region states.
            </p>
          </div>

          <form onSubmit={handleReportSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">State (8 NER States Only)</label>
                <select
                  value={reportForm.state}
                  onChange={(e) => setReportForm({ ...reportForm, state: e.target.value as NERState })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
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
                  value={reportForm.district}
                  onChange={(e) => setReportForm({ ...reportForm, district: e.target.value })}
                  placeholder="e.g. Cachar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Affected Area / Location</label>
              <input
                type="text"
                required
                value={reportForm.affectedArea}
                onChange={(e) => setReportForm({ ...reportForm, affectedArea: e.target.value })}
                placeholder="e.g. Silchar Municipal Sector 3 Flood Zone"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Disaster Type</label>
                <select
                  value={reportForm.disasterType}
                  onChange={(e) => setReportForm({ ...reportForm, disasterType: e.target.value as EmergencyDisasterType })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500"
                >
                  {DISASTER_TYPES.map((dt) => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">People Affected</label>
                <input
                  type="number"
                  required
                  value={reportForm.peopleAffected}
                  onChange={(e) => setReportForm({ ...reportForm, peopleAffected: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Injured Casualties</label>
                <input
                  type="number"
                  required
                  value={reportForm.injured}
                  onChange={(e) => setReportForm({ ...reportForm, injured: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">Immediate Support Requirements</label>
              <div className="flex flex-wrap gap-2">
                {REQUIREMENTS_LIST.map((reqItem) => {
                  const selected = reportForm.immediateRequirements.includes(reqItem);
                  return (
                    <button
                      type="button"
                      key={reqItem}
                      onClick={() => toggleRequirement(reqItem)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {selected ? '✓ ' : '+ '}{reqItem}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Additional Description</label>
              <textarea
                rows={3}
                value={reportForm.description || ''}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Describe ground situation, water level, or road access status..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-5 h-5" /> REPORT EMERGENCY
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: SMART RESOURCE MATCHER */}
      {activeTab === 'matcher' && (
        <div className="space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-500" /> Recommended Resource Allocation Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Matches unfulfilled emergency incidents to available relief depots, supplies, and real GPS vehicles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incidents.filter((i) => i.status !== 'RESOLVED').map((inc) => (
              <div key={inc.incidentId} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-400">{inc.incidentId}</span>
                    <h4 className="font-bold text-white text-base mt-0.5">{inc.disasterType} in {inc.affectedArea}</h4>
                    <p className="text-xs text-slate-400">{inc.state}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${
                    inc.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}>
                    {inc.priority}
                  </span>
                </div>

                <div className="space-y-2 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="font-semibold text-slate-300">Recommended Match Workflow:</div>
                  <div className="text-slate-400 font-mono flex items-center gap-1.5 flex-wrap">
                    <span>Depot: <strong className="text-emerald-400">{inc.assignedDepotId || 'DEPOT-GAU-01'}</strong></span>
                    <span>➔ Supply: <strong className="text-blue-400">Drinking Water 1L</strong></span>
                    <span>➔ Vehicle: <strong className="text-amber-400">{inc.assignedVehicleId || 'RT-101'}</strong></span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-slate-400">Status: {inc.status.replace('_', ' ')}</span>
                  <button
                    onClick={() => setSelectedIncidentId(inc.incidentId)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" /> Execute Recommended Match
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Incident Details Modal View */}
      {selectedIncidentId && (
        <EmergencyDetailModal
          incidentId={selectedIncidentId}
          onClose={() => setSelectedIncidentId(null)}
          onRefresh={refreshData}
        />
      )}
    </div>
  );
}
