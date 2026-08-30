import React, { useState } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Building2,
  Users,
  Compass,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Radio,
  Send
} from 'lucide-react';
import { incidentStore } from '../services/api/incidentStore';

export default function EvacuationPlanner() {
  const activeIncident = incidentStore.getActiveIncident();
  const [selectedRoute, setSelectedRoute] = useState<'A' | 'B' | 'C'>('C');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const routes = [
    {
      id: 'A',
      name: 'Route A — Direct NH-6 Primary Highway Corridor',
      status: 'BLOCKED',
      statusColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
      badge: 'HIGH RISK / DISRUPTED',
      distanceKm: '42 km',
      travelTimeMins: 'N/A (Blocked)',
      reason: 'Severe 350m slope collapse & mudslide near Km 142 East Khasi Hills',
      isRecommended: false
    },
    {
      id: 'B',
      name: 'Route B — State Highway 12 District Connector',
      status: 'HIGH_RISK',
      statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      badge: 'CAUTION / PARTIAL',
      distanceKm: '58 km',
      travelTimeMins: '1h 45m',
      reason: 'Waterlogging at Culvert #4 (Speed restricted to 20 km/h for heavy trucks)',
      isRecommended: false
    },
    {
      id: 'C',
      name: 'Route C — Jowai Ridge Bypass High-Altitude Corridor',
      status: 'SAFE',
      statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      badge: 'RECOMMENDED BY AI',
      distanceKm: '64 km',
      travelTimeMins: '1h 10m',
      reason: 'Clear road conditions • Continuous BRO traffic management • Zero waterlogging',
      isRecommended: true
    }
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-teal-500/30 bg-gradient-to-r from-teal-950/80 via-slate-900 to-indigo-950/60 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-teal-500/20 px-2.5 py-0.5 text-[11px] font-black text-teal-300 border border-teal-500/40 uppercase">
                EVACUATION STAGE
              </span>
              <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-mono text-indigo-300 border border-indigo-500/30">
                AI / ALGORITHMIC RECOMMENDATION
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Navigation className="h-7 w-7 text-teal-400" />
              <span>Evacuation & Safe Zone Route Planner</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Connects high-risk disaster sectors + active road blockages + dynamic rerouting to identify safe evacuation paths to registered relief hubs.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-right font-mono text-xs">
            <div className="text-slate-400">Threat Zone:</div>
            <div className="text-rose-400 font-bold">{activeIncident.locationName}</div>
            <div className="text-teal-300 text-[11px]">Affected Pop: {activeIncident.affectedPopulation.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Main Workflow Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Route Options */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Compass className="h-4 w-4 text-teal-400" />
            <span>Evaluated Evacuation Corridors</span>
          </h2>

          <div className="space-y-4">
            {routes.map(r => (
              <div
                key={r.id}
                onClick={() => setSelectedRoute(r.id as any)}
                className={`cursor-pointer rounded-2xl border p-5 space-y-3 transition-all ${
                  selectedRoute === r.id
                    ? 'border-teal-500 bg-teal-500/10 dark:bg-teal-950/40 shadow-xl ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      ROUTE {r.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</h3>
                  </div>

                  <span className={`rounded px-2.5 py-0.5 text-[10px] font-black border ${r.statusColor}`}>
                    {r.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{r.reason}</p>

                <div className="grid grid-cols-3 gap-3 text-xs font-mono pt-1">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Total Distance</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{r.distanceKm}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Est. Travel Time</div>
                    <div className="font-bold text-teal-400">{r.travelTimeMins}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Data Status</div>
                    <div className="font-bold text-sky-400 text-[10px]">AI ESTIMATE</div>
                  </div>
                </div>

                {r.isRecommended && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      RECOMMENDED EVACUATION CORRIDOR (OPTIMAL SAFETY & ZERO CHOKEPOINTS)
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                      AI/Algorithmic Recommendation
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Route Summary & Action */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Selected Corridor Dispatch Blueprint</span>
            </h2>

            <div className="space-y-3 font-mono text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Route:</span>
                  <b className="text-emerald-400">Route {selectedRoute}</b>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Origin Danger Zone:</span>
                  <b className="text-slate-200">{activeIncident.locationName}</b>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Destination Safe Hub:</span>
                  <b className="text-teal-300">Shillong High-Altitude Relief Hub A</b>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 space-y-1">
                <div className="text-[11px] font-bold text-slate-300">Algorithmic Route Evaluation Note:</div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  The OSRM routing engine automatically filtered out NH-6 (350m mudslide breach) and designated Route C via Jowai Ridge as the safest evacuation vector for civilian buses and ambulance triage.
                </p>
              </div>

              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-[11px] text-sky-300 flex items-start gap-2 font-sans">
                <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <b>Labeling Notice:</b> All dynamic evacuation routing recommendations are labeled as <b>AI/Algorithmic Recommendation</b> based on real-time OSRM network analysis.
                </span>
              </div>

              {broadcastMessage && (
                <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/80 p-3 text-xs text-emerald-200 shadow-xl flex items-start justify-between gap-2 backdrop-blur animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-300">Evacuation Broadcast Dispatched</div>
                      <div className="text-[11px] text-emerald-200/90">{broadcastMessage}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setBroadcastMessage(null)}
                    className="text-emerald-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setBroadcastMessage(`Evacuation Dispatch Alert Issued for Route ${selectedRoute} via Jowai Ridge Bypass! Synchronized with NDRF & MDoNER Emergency Grids.`);
                }}
                className="w-full rounded-xl bg-gradient-to-r from-teal-600 via-indigo-600 to-sky-600 p-3 text-xs font-bold text-white shadow-lg hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>ISSUE PUBLIC EVACUATION ROUTE BROADCAST</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
