import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Sliders,
  ShieldAlert,
  HeartPulse,
  Droplets,
  Utensils
} from 'lucide-react';
import { incidentStore, ReliefCamp } from '../services/api/incidentStore';

export default function ReliefCampManagement() {
  const [camps, setCamps] = useState<ReliefCamp[]>(incidentStore.getReliefCamps());
  const activeIncident = incidentStore.getActiveIncident();
  const [updateCampId, setUpdateCampId] = useState<string | null>(null);
  const [newOccupiedInput, setNewOccupiedInput] = useState<string>('');

  useEffect(() => {
    const unsub = incidentStore.subscribe(() => {
      setCamps(incidentStore.getReliefCamps());
    });
    return unsub;
  }, []);

  const handleSaveCapacity = (campId: string) => {
    const val = parseInt(newOccupiedInput);
    if (!isNaN(val)) {
      incidentStore.updateReliefCampCapacity(campId, val);
    }
    setUpdateCampId(null);
  };

  const totalCap = camps.reduce((a, b) => a + b.totalCapacity, 0);
  const totalOcc = camps.reduce((a, b) => a + b.occupiedCapacity, 0);
  const totalAvail = totalCap - totalOcc;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-black text-indigo-300 border border-indigo-500/40 uppercase">
                RELIEF & SHELTER STAGE
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                VERIFIED DATA
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-indigo-400" />
              <span>Relief Camp & Evacuee Shelter Management Grid</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Track emergency shelter capacity, evacuee occupancy, ration stocks, drinking water supplies, and medical triage units across active relief hubs.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-2.5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Cap</div>
              <div className="text-slate-100 font-bold text-base">{totalCap}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-2.5">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Occupied</div>
              <div className="text-amber-400 font-bold text-base">{totalOcc}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-2.5">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Available</div>
              <div className="text-emerald-400 font-bold text-base">{totalAvail}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Camp Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {camps.map(camp => {
          const avail = camp.totalCapacity - camp.occupiedCapacity;
          const occPercent = Math.round((camp.occupiedCapacity / camp.totalCapacity) * 100);

          return (
            <div
              key={camp.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                    {camp.id}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black border ${
                      camp.status === 'FULL'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {camp.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{camp.name}</h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{camp.locationName}</div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Occupancy:</span>
                    <b className="text-amber-400">{camp.occupiedCapacity} / {camp.totalCapacity} ({occPercent}%)</b>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        occPercent > 90 ? 'bg-rose-500' : occPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occPercent)}%` }}
                    />
                  </div>
                </div>

                {/* Logistics Badges */}
                <div className="space-y-2 text-xs font-mono pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Utensils className="h-3.5 w-3.5 text-amber-400" />
                      <span>Ration Stock</span>
                    </span>
                    <b className={camp.foodSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-amber-400'}>
                      {camp.foodSupplyStatus}
                    </b>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Droplets className="h-3.5 w-3.5 text-sky-400" />
                      <span>Clean Water</span>
                    </span>
                    <b className={camp.waterSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-rose-400'}>
                      {camp.waterSupplyStatus}
                    </b>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                      <span>Medical Unit</span>
                    </span>
                    <b className="text-slate-200 text-[10px]">{camp.medicalSupportStatus.replace(/_/g, ' ')}</b>
                  </div>
                </div>
              </div>

              {/* Authority Update Control */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                {updateCampId === camp.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Occupied"
                      value={newOccupiedInput}
                      onChange={e => setNewOccupiedInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-xs font-mono text-white"
                    />
                    <button
                      onClick={() => handleSaveCapacity(camp.id)}
                      className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 shrink-0"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setUpdateCampId(null)}
                      className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setUpdateCampId(camp.id);
                      setNewOccupiedInput(camp.occupiedCapacity.toString());
                    }}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    UPDATE CAMP OCCUPANCY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
