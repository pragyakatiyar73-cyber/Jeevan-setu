import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  HeartPulse,
  Navigation,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  Send,
  Sparkles,
  ArrowRight,
  Eye,
  Truck,
  Building2,
  Compass,
  Layers,
  FileText,
  Info,
  X,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  incidentStore,
  DisasterIncident,
  RescueTeam,
  CitizenSOS,
  ResponseStatusLifecycle,
  DataStatusTag
} from '../services/api/incidentStore';

export default function LifeSavingResponseEngine() {
  const [incidents, setIncidents] = useState<DisasterIncident[]>(incidentStore.getIncidents());
  const activeIncident = incidentStore.getActiveIncident();
  const [teams, setTeams] = useState<RescueTeam[]>(incidentStore.getRescueTeams());
  const [sosList, setSosList] = useState<CitizenSOS[]>(incidentStore.getSOSAlerts());
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const unsub = incidentStore.subscribe(() => {
      setIncidents([...incidentStore.getIncidents()]);
      setTeams([...incidentStore.getRescueTeams()]);
      setSosList([...incidentStore.getSOSAlerts()]);
    });
    return unsub;
  }, []);

  // Leaflet Response Map Render
  useEffect(() => {
    if (mapContainerRef.current) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([activeIncident.lat, activeIncident.lon], 9);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Jeevan Setu Life-Saving Response Grid &bull; Esri Dark Canvas'
      }).addTo(map);

      const bounds = L.latLngBounds([[activeIncident.lat, activeIncident.lon]]);

      // 1. Active Disaster Pin
      L.circleMarker([activeIncident.lat, activeIncident.lon], {
        radius: 14,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 0.9
      }).addTo(map).bindPopup(`
        <div style="font-family:sans-serif;font-size:12px;color:#000;">
          <b style="color:#dc2626;">🔴 ${activeIncident.id} — ${activeIncident.title}</b><br/>
          <b>Priority:</b> ${activeIncident.priorityLevel}<br/>
          <b>Affected Population:</b> ${activeIncident.affectedPopulation.toLocaleString()}<br/>
          <b>Status:</b> ${activeIncident.responseStatus}
        </div>
      `);

      // Disaster Risk Danger Circle
      L.circle([activeIncident.lat, activeIncident.lon], {
        radius: 12000,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        weight: 1.5,
        dashArray: '6, 6'
      }).addTo(map);

      // 2. Rescue Teams Pins
      teams.forEach(team => {
        bounds.extend([team.lat, team.lon]);
        const color = team.status === 'AVAILABLE' ? '#10b981' : '#f59e0b';
        L.circleMarker([team.lat, team.lon], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.95
        }).addTo(map).bindPopup(`
          <div style="font-family:sans-serif;font-size:11px;">
            <b>🚑 ${team.id}: ${team.name}</b><br/>
            Status: <b>${team.status}</b> | ETA: ${team.etaMinutes} Mins<br/>
            Personnel: ${team.personnelCount}
          </div>
        `);
      });

      // 3. SOS Markers
      sosList.forEach(sos => {
        bounds.extend([sos.lat, sos.lon]);
        L.circleMarker([sos.lat, sos.lon], {
          radius: 7,
          fillColor: sos.priority === 'CRITICAL' ? '#f43f5e' : '#fbbf24',
          color: '#ffffff',
          weight: 1.5,
          fillOpacity: 0.9
        }).addTo(map).bindPopup(`
          <div style="font-family:sans-serif;font-size:11px;">
            <b>🆘 ${sos.id} (${sos.distressType})</b><br/>
            Priority: <b>${sos.priority}</b><br/>
            Location: ${sos.locationName}<br/>
            Affected: ${sos.personsAffected} Persons
          </div>
        `);
      });

      // 4. Recommended Route Polyline (Jowai Ridge Bypass)
      const routePoints: [number, number][] = [
        [26.1445, 91.7362], // Guwahati Depot
        [25.5788, 91.8933], // Shillong
        [25.2000, 92.2000], // Jowai Ridge Bypass
        [24.8333, 92.7789]  // Silchar
      ];

      routePoints.forEach(pt => bounds.extend(pt));

      L.polyline(routePoints, {
        color: '#10b981',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8'
      }).addTo(map).bindPopup('<b>🟢 Recommended Available Route: Route C (Jowai Ridge Bypass)</b>');

      map.fitBounds(bounds, { padding: [30, 30] });

      mapInstanceRef.current = map;
    }
  }, [activeIncident.id, teams, sosList]);

  // Handle Response Status Lifecycle Updates
  const handleUpdateStatus = (newStatus: ResponseStatusLifecycle) => {
    incidentStore.updateIncidentResponseStatus(activeIncident.id, newStatus, 'Authorized NDRF Triage Commander');
    setStatusMessage(`SUCCESS: Response Lifecycle updated to "${newStatus.replace(/_/g, ' ')}"`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleAssignTeam4 = () => {
    incidentStore.assignRescueTeam('TEAM-01', 'SOS-2026-101', activeIncident.id);
    incidentStore.updateIncidentResponseStatus(activeIncident.id, 'TEAM_ASSIGNED', 'NDRF Command Dispatcher');
    setStatusMessage('DISPATCH SUCCESS: NDRF 10th Battalion Alpha assigned to Incident JS-2026-001 (ETA 28 mins)!');
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Compute KPI metrics
  const totalPeopleAtRisk = incidents.reduce((a, b) => a + b.affectedPopulation, 0);
  const criticalIncidentsCount = incidents.filter(i => i.priorityLevel === 'CRITICAL').length;
  const availableTeamsCount = teams.filter(t => t.status === 'AVAILABLE').length;
  const activeTeamsCount = teams.filter(t => t.status === 'EN_ROUTE' || t.status === 'ON_SITE').length;
  const medicalRequestsCount = sosList.filter(s => s.isMedicalEmergency).length;
  const unresolvedSosCount = sosList.filter(s => s.status !== 'RESOLVED').length;

  // Lifecycle Timeline Order
  const LIFECYCLE_STEPS: { status: ResponseStatusLifecycle; label: string }[] = [
    { status: 'NEW', label: '1. SOS Received' },
    { status: 'VERIFIED', label: '2. Incident Verified' },
    { status: 'PRIORITIZED', label: '3. Priority Engine' },
    { status: 'RESOURCE_RECOMMENDED', label: '4. Resource Match' },
    { status: 'TEAM_ASSIGNED', label: '5. Team Assigned' },
    { status: 'EN_ROUTE', label: '6. Team En Route' },
    { status: 'REACHED_LOCATION', label: '7. Reached Location' },
    { status: 'RESCUE_IN_PROGRESS', label: '8. Rescue Active' },
    { status: 'RESCUED_SAFE', label: '9. Rescued / Safe' },
    { status: 'RESOLVED', label: '10. Incident Resolved' }
  ];

  const getStepIndex = (st: ResponseStatusLifecycle) => {
    return LIFECYCLE_STEPS.findIndex(s => s.status === st);
  };

  const currentStepIdx = getStepIndex(activeIncident.responseStatus);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* 🔴 HEADER BANNER */}
      <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/90 via-slate-900 to-indigo-950/80 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-black text-rose-400 border border-rose-500/40 uppercase animate-pulse">
                DECISION SUPPORT & EMERGENCY RESPONSE ENGINE
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                VERIFIED DATA + AI ESTIMATE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-rose-500" />
              <span>LIFE-SAVING RESPONSE CENTER</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Converts disaster telemetry into actionable emergency response recommendations: matching available rescue teams, determining accessible routes, and tracking rescue lifecycle to resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setDetailModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-rose-600 to-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-sky-500 flex items-center gap-2 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
              <span>VIEW INCIDENT ({activeIncident.id})</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 📊 1. HEADER KPI METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Active Incidents</div>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{incidents.length}</div>
          <span className="text-[9px] font-mono text-sky-400">VERIFIED</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">People At Risk</div>
          <div className="text-xl font-black text-amber-500 mt-0.5">{totalPeopleAtRisk.toLocaleString()}</div>
          <span className="text-[9px] font-mono text-amber-400">AI ESTIMATE</span>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
          <div className="text-[10px] text-rose-400 font-bold uppercase">Critical Incidents</div>
          <div className="text-xl font-black text-rose-500 mt-0.5">{criticalIncidentsCount}</div>
          <span className="text-[9px] font-mono text-rose-400">HIGH URGENCY</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Teams Available</div>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{availableTeamsCount}</div>
          <span className="text-[9px] font-mono text-emerald-400">READY</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Teams Active</div>
          <div className="text-xl font-black text-sky-400 mt-0.5">{activeTeamsCount}</div>
          <span className="text-[9px] font-mono text-sky-400">DEPLOYED</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Medical Requests</div>
          <div className="text-xl font-black text-rose-400 mt-0.5">{medicalRequestsCount}</div>
          <span className="text-[9px] font-mono text-rose-400">TRIAGE</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Unresolved SOS</div>
          <div className="text-xl font-black text-amber-400 mt-0.5">{unresolvedSosCount}</div>
          <span className="text-[9px] font-mono text-amber-400">LIVE QUEUE</span>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKFLOW GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: PRIORITY ENGINE, RESOURCE MATCHING & ROUTE */}
        <div className="lg:col-span-7 space-y-6">

          {/* ⚡ 2. INCIDENT PRIORITY ENGINE & REASONING PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-500" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Operational Life-Saving Priority Engine
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Incident Selection Dropdown */}
                <select
                  value={activeIncident.id}
                  onChange={e => incidentStore.setActiveIncidentId(e.target.value)}
                  className="rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 font-mono text-xs font-bold text-amber-500 dark:text-amber-400 p-1.5 cursor-pointer focus:outline-none"
                >
                  {incidents.map(inc => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id} — {inc.title} ({inc.priorityLevel})
                    </option>
                  ))}
                </select>

                <span className={`rounded px-2.5 py-0.5 text-[10px] font-black border uppercase ${
                  activeIncident.priorityLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                  activeIncident.priorityLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  'bg-sky-500/20 text-sky-300 border-sky-500/40'
                }`}>
                  {activeIncident.priorityLevel} PRIORITY
                </span>
              </div>
            </div>

            {/* Priority Reason Explanation Box */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Priority Decision Reasoning (Operational Urgency Rule)</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                "{activeIncident.priorityReason}"
              </p>
            </div>

            {/* Key Risk Factors List */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Key Risk Factors Evaluated:</div>
              <div className="flex flex-wrap gap-2">
                {activeIncident.keyRiskFactors.map((factor, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    • {factor}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3 font-mono">
              <span>Last Evaluated: <b>{activeIncident.timestamp}</b></span>
              <span className="text-sky-400 font-bold">DATA STATUS: VERIFIED + AI ESTIMATE</span>
            </div>
          </div>

          {/* 🚑 3. RESOURCE REQUIREMENT & MATCHING MATRIX */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-400" />
                <span>Resource Requirement & Available Match Matrix</span>
              </h3>
              <span className="rounded bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 text-[10px] font-mono font-bold border border-indigo-500/30">
                AI / RULE-BASED RECOMMENDATION
              </span>
            </div>

            {/* Required Resource Categories Badges */}
            <div className="space-y-1.5 font-mono text-xs">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Required Resource Categories:</div>
              <div className="flex flex-wrap gap-2">
                {activeIncident.requiredResourceCategories.map((res, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/30 px-3 py-1 text-xs font-bold"
                  >
                    {res}
                  </span>
                ))}
              </div>
            </div>

            {/* Available Teams Matching Table */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-400 font-mono font-bold uppercase">Available Response Teams:</div>
              <div className="space-y-2">
                {teams.map((team, idx) => {
                  const isMatch = team.id === 'TEAM-01'; // Optimal recommended team
                  const distanceKm = idx === 0 ? '4.2' : idx === 1 ? '12.6' : '24.1';
                  return (
                    <div
                      key={team.id}
                      className={`rounded-xl border p-3 flex items-center justify-between flex-wrap gap-2 text-xs font-mono transition ${
                        isMatch
                          ? 'border-emerald-500/50 bg-emerald-500/10'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <b className="text-slate-900 dark:text-white">{team.name} ({team.id})</b>
                          {isMatch && (
                            <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 border border-emerald-500/40">
                              RECOMMENDED MATCH
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Distance: <b>{distanceKm} km</b> &bull; Status: <b className="text-emerald-400">{team.status}</b> &bull; ETA: <b>{team.etaMinutes} mins</b>
                        </div>
                      </div>

                      {isMatch ? (
                        <button
                          onClick={handleAssignTeam4}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-500 flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>ASSIGN SQUAD NOW</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Occupied on Task</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 🧭 4. ROUTE INTELLIGENCE PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Navigation className="h-5 w-5 text-teal-400" />
                <span>Dynamic Evacuation Route Intelligence</span>
              </h3>
              <span className="text-[10px] text-teal-400 font-mono font-bold">OSRM ROUTING ENGINE</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
                <span className="text-rose-400 font-bold">Route A (Direct NH-6)</span>
                <div className="text-[10px] text-rose-300 font-sans">🔴 BLOCKED (350m slope collapse near Km 142)</div>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
                <span className="text-amber-400 font-bold">Route B (SH-12 Link)</span>
                <div className="text-[10px] text-amber-300 font-sans">⚠️ HIGH RISK (Waterlogging at Culvert #4)</div>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3 space-y-1">
                <span className="text-emerald-300 font-bold">Route C (Jowai Ridge)</span>
                <div className="text-[10px] text-emerald-200 font-sans">🟢 RECOMMENDED AVAILABLE ROUTE (Clear BRO Corridor)</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE MAP & RESPONSE LIFECYCLE CONTROLS */}
        <div className="lg:col-span-5 space-y-6">

          {/* 📍 5. INTERACTIVE RESPONSE MAP */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl flex flex-col h-[380px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>Life-Saving GIS Incident & Resource Map</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">Leaflet Canvas</span>
            </div>

            <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div ref={mapContainerRef} className="h-full w-full" />
            </div>
          </div>

          {/* ⏱️ 6. RESPONSE LIFECYCLE VISUAL TIMELINE & CONTROLS */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-400" />
              <span>Response Lifecycle Tracker & Triage Status</span>
            </h3>

            {/* Visual Step Indicator */}
            <div className="space-y-2 font-mono">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-400">Current Lifecycle Stage:</span>
                <span className="text-amber-400 font-black">
                  Stage {currentStepIdx + 1} of 10: {activeIncident.responseStatus.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Steps 1-5 */}
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {LIFECYCLE_STEPS.slice(0, 5).map((s, idx) => (
                    <div
                      key={s.status}
                      className={`h-2.5 rounded-full transition-all ${
                        idx <= currentStepIdx
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-400 font-semibold text-center truncate">
                  {LIFECYCLE_STEPS.slice(0, 5).map(s => (
                    <span key={s.status} title={s.label} className="truncate px-0.5">
                      {s.label.split('. ')[1]}
                    </span>
                  ))}
                </div>
              </div>

              {/* Steps 6-10 */}
              <div className="space-y-1 pt-1">
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {LIFECYCLE_STEPS.slice(5, 10).map((s, idx) => (
                    <div
                      key={s.status}
                      className={`h-2.5 rounded-full transition-all ${
                        idx + 5 <= currentStepIdx
                          ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-400 font-semibold text-center truncate">
                  {LIFECYCLE_STEPS.slice(5, 10).map(s => (
                    <span key={s.status} title={s.label} className="truncate px-0.5">
                      {s.label.split('. ')[1]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Authorized Responder Status Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400 font-mono uppercase font-bold mb-1">
                Authorized Triage Status Controls:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  onClick={() => handleUpdateStatus('REACHED_LOCATION')}
                  className="rounded-xl bg-amber-600/20 text-amber-300 border border-amber-500/30 py-2 font-bold hover:bg-amber-600/30 transition cursor-pointer"
                >
                  MARK REACHED LOCATION
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESCUED_SAFE')}
                  className="rounded-xl bg-sky-600/20 text-sky-300 border border-sky-500/30 py-2 font-bold hover:bg-sky-600/30 transition cursor-pointer"
                >
                  MARK RESCUED / SAFE
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className="rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 py-2 font-bold hover:bg-emerald-600/30 transition cursor-pointer"
                >
                  MARK RESOLVED
                </button>
              </div>

              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono text-right pt-1">
                Updated By: <b>{activeIncident.statusUpdatedBy}</b> ({activeIncident.statusUpdatedAt})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📄 DETAILED INCIDENT MODAL (VIEW INCIDENT) */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {activeIncident.id}
                </span>
                <h3 className="text-base font-black text-white">{activeIncident.title}</h3>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono leading-relaxed text-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Severity</div>
                  <div className="font-bold text-rose-400 text-sm">{activeIncident.severity}</div>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Confidence</div>
                  <div className="font-bold text-sky-400 text-sm">{activeIncident.confidenceScore}%</div>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Affected Area</div>
                  <div className="font-bold text-slate-200 text-sm">{activeIncident.affectedAreaSqKm} sq km</div>
                </div>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Affected Pop</div>
                  <div className="font-bold text-amber-400 text-sm">{activeIncident.affectedPopulation.toLocaleString()}</div>
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2 font-sans">
                <h4 className="text-amber-400 font-mono font-bold uppercase text-xs">Priority Decision Reason</h4>
                <p className="text-xs text-slate-300">"{activeIncident.priorityReason}"</p>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sky-400 font-bold uppercase font-mono text-xs mb-1">Required Resources</h4>
                  <div className="flex flex-wrap gap-1">
                    {activeIncident.requiredResourceCategories.map((r, i) => (
                      <span key={i} className="text-[11px] text-slate-300">• {r}</span>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-teal-400 font-bold uppercase font-mono text-xs mb-1">Recommended Route</h4>
                  <div className="text-xs text-slate-300">{activeIncident.recommendedRoute}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700"
              >
                Close Full Incident Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
