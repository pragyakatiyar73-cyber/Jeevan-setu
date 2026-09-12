import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  MapPin,
  Clock,
  User,
  Users,
  HeartPulse,
  Truck,
  Building2,
  Package,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Navigation,
  Compass,
  Zap,
  Activity,
  FileText,
  X,
  Share2,
  Play
} from 'lucide-react';
import {
  EmergencyIncident,
  EmergencyStatus,
  EmergencyPriority,
  getEmergencyIncidentById,
  updateEmergencyStatus,
  assignEmergencyResource,
  reassessEmergencyWithAI,
  ConnectedTelemetry
} from '../services/api/emergencyResponseService';
import { getReliefVehicles, getReliefDepots, ReliefVehicle, ReliefDepot } from '../services/api/reliefSupplyService';

interface EmergencyDetailModalProps {
  incidentId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function EmergencyDetailModal({ incidentId, onClose, onRefresh }: EmergencyDetailModalProps) {
  const [incident, setIncident] = useState<EmergencyIncident | null>(null);
  const [telemetry, setTelemetry] = useState<ConnectedTelemetry>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Resource Assignment State
  const [availableVehicles, setAvailableVehicles] = useState<ReliefVehicle[]>([]);
  const [availableDepots, setAvailableDepots] = useState<ReliefDepot[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('RT-101');
  const [selectedDepotId, setSelectedDepotId] = useState<string>('DEPOT-GAU-01');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  // Load Incident Details
  const loadDetails = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await getEmergencyIncidentById(incidentId);
      if (res.incident) {
        setIncident(res.incident);
        setTelemetry(res.telemetry || {});
      } else {
        setErrorMsg(`Emergency Incident '${incidentId}' not found.`);
      }

      const [vList, dList] = await Promise.all([getReliefVehicles(), getReliefDepots()]);
      setAvailableVehicles(vList);
      setAvailableDepots(dList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load emergency details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) loadDetails();
  }, [incidentId]);

  const handleStatusChange = async (newStatus: EmergencyStatus) => {
    if (!incident) return;
    const res = await updateEmergencyStatus(incident.incidentId, newStatus, `Operator updated status to ${newStatus}`);
    if (res.success) {
      setActionSuccess(`Status updated to ${newStatus}`);
      loadDetails();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleAssignResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incident) return;
    setIsAssigning(true);
    const res = await assignEmergencyResource(incident.incidentId, {
      vehicleId: selectedVehicleId,
      depotId: selectedDepotId,
      supplies: [{ item: 'Drinking Water 1L Bottles', quantity: 500 }]
    });

    if (res.success) {
      setActionSuccess(res.message);
      loadDetails();
      if (onRefresh) onRefresh();
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
    setIsAssigning(false);
  };

  const handleReassess = async () => {
    if (!incident) return;
    setLoading(true);
    const res = await reassessEmergencyWithAI(incident.incidentId);
    if (res.success) {
      setActionSuccess('AI Assessment refreshed');
      loadDetails();
      setTimeout(() => setActionSuccess(null), 3000);
    } else {
      setErrorMsg(res.message);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-sm">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-300">Syncing Emergency Incident Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 max-w-md">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Incident Not Found</h3>
          <p className="text-xs text-slate-400">{errorMsg || 'The requested emergency record is unavailable.'}</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-sm font-semibold">
            Close Panel
          </button>
        </div>
      </div>
    );
  }

  const priorityColors = {
    CRITICAL: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    LOW: 'bg-slate-800 text-slate-400 border-slate-700'
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-6 flex items-center justify-center">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative my-auto">
        
        {/* Header Bar */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-extrabold text-emerald-400">{incident.incidentId}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${priorityColors[incident.priority]}`}>
                {incident.priority} PRIORITY
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300">
                {incident.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-1">{incident.disasterType} Emergency — {incident.affectedArea}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              {incident.district}, <strong className="text-emerald-400">{incident.state}</strong> (Lat: {incident.latitude.toFixed(4)}, Lon: {incident.longitude.toFixed(4)})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {actionSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {actionSuccess}
          </div>
        )}

        {/* Impact & Casualty Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-amber-400" /> People Affected
            </div>
            <div className="text-xl font-bold text-white">{incident.peopleAffected}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
              <HeartPulse className="w-3.5 h-3.5 text-rose-400" /> Reported Injured
            </div>
            <div className="text-xl font-bold text-rose-400">{incident.injured}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2">
            <div className="text-xs font-semibold text-slate-400 mb-1.5">Immediate Requirements</div>
            <div className="flex flex-wrap gap-1.5">
              {incident.requirements.map((r, idx) => (
                <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI-Assisted Priority Assessment Card (Mandatory Labeling) */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">AI-Assisted Priority Assessment</h3>
            </div>
            <button
              onClick={handleReassess}
              className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold"
            >
              Re-Assess AI
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {incident.aiAssessment?.summary || `Impact calculation score based on ${incident.disasterType} hazard metrics.`}
          </p>

          {incident.aiAssessment?.risks && (
            <div className="space-y-1 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Identified Hazards & Vulnerabilities:</span>
              <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                {incident.aiAssessment.risks.map((rk, idx) => (
                  <li key={idx}>{rk}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory AI Disclaimer Notice */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>AI-generated assessment — verify with authorised emergency personnel.</span>
          </div>
        </div>

        {/* Connected Multi-Module Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Weather Risk
            </span>
            <div className="font-bold text-white text-sm">{telemetry.weather?.rainRate || '8.2 mm/h Torrential'}</div>
            <div className="text-slate-400">Temp: {telemetry.weather?.temp || '21.8°C'} | Soil: {telemetry.weather?.soilSat || '94% Peak'}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-rose-400" /> Flood & River Level
            </span>
            <div className="font-bold text-rose-400 text-sm">
              {telemetry.rivers && telemetry.rivers[0] ? telemetry.rivers[0].status : '+1.4m Above Danger Mark'}
            </div>
            <div className="text-slate-400">Discharge: {telemetry.rivers && telemetry.rivers[0] ? telemetry.rivers[0].discharge : '3,420 cumec'}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-amber-400" /> Road Accessibility
            </span>
            <div className="font-bold text-amber-400 text-sm">
              {telemetry.highways && telemetry.highways[0] ? telemetry.highways[0].clearance : 'NH-6 IMPASSIBLE AT KM 142'}
            </div>
            <div className="text-slate-400">Bypass: {telemetry.highways && telemetry.highways[0] ? telemetry.highways[0].bypass : 'Sector 9 Jowai Ridge'}</div>
          </div>
        </div>

        {/* Assigned Resources & Workflow Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Resource Assignment Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" /> Authorised Resource Assignment
            </h3>

            <form onSubmit={handleAssignResource} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Select Relief Vehicle</label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableVehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.vehicleId} — {v.vehicleType} ({v.trackingStatus === 'GPS_CONNECTED' ? '🟢 LIVE GPS' : '🔴 NO GPS'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Select Source Depot</label>
                <select
                  value={selectedDepotId}
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  {availableDepots.map((d) => (
                    <option key={d.depotId} value={d.depotId}>
                      {d.depotId} — {d.depotName} ({d.state})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isAssigning}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" /> Dispatch Assigned Resources
              </button>
            </form>
          </div>

          {/* Workflow Status Transition */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Emergency Workflow Control
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleStatusChange('ASSESSED')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold"
              >
                1. Mark ASSESSED
              </button>
              <button
                onClick={() => handleStatusChange('RESPONSE_RECOMMENDED')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 font-semibold"
              >
                2. Mark RECOMMENDED
              </button>
              <button
                onClick={() => handleStatusChange('RESPONSE_IN_PROGRESS')}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-blue-400 font-semibold"
              >
                3. Mark IN PROGRESS
              </button>
              <button
                onClick={() => handleStatusChange('RESOLVED')}
                className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900 text-emerald-400 font-bold"
              >
                4. Mark RESOLVED
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Database Event Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Real-Time Database Event Timeline
          </h3>

          <div className="space-y-3 pl-2 border-l-2 border-slate-800">
            {incident.timeline.map((item, idx) => (
              <div key={idx} className="relative pl-4">
                <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-900"></div>
                <div className="text-xs font-bold text-white">{item.action}</div>
                <div className="text-xs text-slate-400">{item.detail}</div>
                <div className="text-[10px] font-mono text-slate-500 mt-0.5">{new Date(item.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
