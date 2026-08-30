import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Building2,
  Wrench,
  Shield,
  TrendingUp,
  AlertTriangle,
  Sliders,
  DollarSign
} from 'lucide-react';
import { incidentStore, DamageItem } from '../services/api/incidentStore';

export default function RecoveryTracker() {
  const [damageItems, setDamageItems] = useState<DamageItem[]>(incidentStore.getDamageItems());
  const activeIncident = incidentStore.getActiveIncident();

  useEffect(() => {
    const unsub = incidentStore.subscribe(() => {
      setDamageItems(incidentStore.getDamageItems());
    });
    return unsub;
  }, []);

  const handleUpdateStatus = (id: string, status: DamageItem['repairStatus'], percent: number) => {
    incidentStore.updateDamageItemStatus(id, status, percent);
  };

  const avgRecovery = Math.round(
    damageItems.reduce((acc, curr) => acc + curr.repairPercent, 0) / (damageItems.length || 1)
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-emerald-950/60 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-black text-emerald-300 border border-emerald-500/40 uppercase">
                RECOVERY STAGE
              </span>
              <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-mono text-sky-400 border border-sky-500/30">
                VERIFIED RECONSTRUCTION TRACKER
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-emerald-400" />
              <span>Post-Disaster Infrastructure Recovery & Reconstruction Tracker</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Monitor long-term infrastructure repair progress, BRO highway clearance, bridge pier reinforcement, and power substation restoration.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-4 text-center space-y-1 font-mono min-w-[200px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Overall Recovery Completion</div>
            <div className="text-2xl font-black text-emerald-400">{avgRecovery}%</div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${avgRecovery}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Reconstruction Items List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Wrench className="h-4 w-4 text-emerald-400" />
          <span>Active Asset Reconstruction Tasks ({damageItems.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {damageItems.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    {item.id}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black border ${
                      item.repairStatus === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : item.repairStatus === 'IN PROGRESS'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {item.repairStatus}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{item.assetName}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{item.location}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Category</div>
                    <div className="font-semibold text-slate-200 text-[11px]">{item.assetCategory}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Est. Budget</div>
                    <div className="font-bold text-amber-400">₹ {item.estimatedCostInrLakhs} Lakhs</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Repair Progress:</span>
                    <b className="text-emerald-400">{item.repairPercent}%</b>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${item.repairPercent}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  Assigned Agency: <b className="text-slate-200">{item.assignedAgency}</b>
                </div>
              </div>

              {/* Status Update Quick Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleUpdateStatus(item.id, 'IN PROGRESS', 50)}
                  className="flex-1 rounded-xl bg-amber-600/20 text-amber-300 border border-amber-500/30 py-1.5 text-[11px] font-bold hover:bg-amber-600/30"
                >
                  Set 50% Progress
                </button>
                <button
                  onClick={() => handleUpdateStatus(item.id, 'COMPLETED', 100)}
                  className="flex-1 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 py-1.5 text-[11px] font-bold hover:bg-emerald-600/30"
                >
                  Mark Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
