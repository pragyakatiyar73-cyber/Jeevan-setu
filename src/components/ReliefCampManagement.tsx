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
  Utensils,
  Navigation,
  MapPin,
  Filter,
  Sparkles,
  PhoneCall,
  Bed,
  Compass
} from 'lucide-react';
import { incidentStore, ReliefCamp } from '../services/api/incidentStore';
import SmartSearchInput from './common/SmartSearchInput';

interface ReliefCampManagementProps {
  onNavigateToMap?: () => void;
}

export default function ReliefCampManagement({ onNavigateToMap }: ReliefCampManagementProps) {
  const [camps, setCamps] = useState<ReliefCamp[]>(incidentStore.getReliefCamps());
  const activeIncident = incidentStore.getActiveIncident();
  const [updateCampId, setUpdateCampId] = useState<string | null>(null);
  const [newOccupiedInput, setNewOccupiedInput] = useState<string>('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'AVAILABLE' | 'MEDICAL' | 'HIGH_STOCKS'>('ALL');
  
  // Evacuee Check-in Modal
  const [checkInCamp, setCheckInCamp] = useState<ReliefCamp | null>(null);
  const [evacueeName, setEvacueeName] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<number>(1);
  const [checkInSuccessMsg, setCheckInSuccessMsg] = useState<string | null>(null);

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

  const handleCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCamp) return;
    
    const newOcc = Math.min(checkInCamp.totalCapacity, checkInCamp.occupiedCapacity + familyMembers);
    incidentStore.updateReliefCampCapacity(checkInCamp.id, newOcc);
    setCheckInSuccessMsg(`✅ ${familyMembers} evacuee(s) checked into ${checkInCamp.name}!`);
    setTimeout(() => {
      setCheckInSuccessMsg(null);
      setCheckInCamp(null);
      setEvacueeName('');
      setFamilyMembers(1);
    }, 2000);
  };

  // Filtered camps logic
  const filteredCamps = camps.filter(camp => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = camp.name.toLowerCase().includes(q);
      const matchesLoc = camp.locationName.toLowerCase().includes(q);
      const matchesId = camp.id.toLowerCase().includes(q);
      if (!matchesName && !matchesLoc && !matchesId) return false;
    }

    // 2. Filter Category
    if (filterMode === 'AVAILABLE') {
      return camp.occupiedCapacity < camp.totalCapacity;
    }
    if (filterMode === 'MEDICAL') {
      return camp.medicalSupportStatus.includes('DOCTOR') || camp.medicalSupportStatus.includes('TRIAGE');
    }
    if (filterMode === 'HIGH_STOCKS') {
      return camp.foodSupplyStatus === 'ADEQUATE' && camp.waterSupplyStatus === 'ADEQUATE';
    }

    return true;
  });

  const totalCap = camps.reduce((a, b) => a + b.totalCapacity, 0);
  const totalOcc = camps.reduce((a, b) => a + b.occupiedCapacity, 0);
  const totalAvail = totalCap - totalOcc;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      
      {/* 🔴 HEADER SECTION */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 p-6 shadow-2xl relative overflow-hidden text-white">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-black text-indigo-300 border border-indigo-500/40 uppercase">
                LIVE RELIEF CAMP & SHELTER FINDER
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                VERIFIED TELEMETRY
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white mt-1 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-indigo-400" />
              <span>Relief Camp & Evacuee Shelter Grid</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Find nearby emergency shelters, real-time bed availability, medical triage support, clean drinking water, ration stocks, and safe evacuation routes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-inner">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Beds</div>
              <div className="text-slate-100 font-black text-lg">{totalCap}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-inner">
              <div className="text-[10px] text-amber-400 uppercase font-bold">Occupied</div>
              <div className="text-amber-400 font-black text-lg">{totalOcc}</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 shadow-inner">
              <div className="text-[10px] text-emerald-400 uppercase font-bold">Free Beds</div>
              <div className="text-emerald-400 font-black text-lg">{totalAvail}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 SMART SEARCH & FILTER CONTROLS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Smart Search Bar */}
          <div className="flex-1 min-w-[280px]">
            <SmartSearchInput
              placeholder="Search relief camp by name, sector location, or district..."
              value={searchQuery}
              onChange={setSearchQuery}
              enableAI={true}
              correctionEnabled={true}
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-2 rounded-xl font-bold transition cursor-pointer border ${
                filterMode === 'ALL'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              All Camps ({camps.length})
            </button>

            <button
              onClick={() => setFilterMode('AVAILABLE')}
              className={`px-3 py-2 rounded-xl font-bold transition cursor-pointer border ${
                filterMode === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🟢 Free Beds Available
            </button>

            <button
              onClick={() => setFilterMode('MEDICAL')}
              className={`px-3 py-2 rounded-xl font-bold transition cursor-pointer border ${
                filterMode === 'MEDICAL'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              🏥 Medical Triage On-Site
            </button>

            <button
              onClick={() => setFilterMode('HIGH_STOCKS')}
              className={`px-3 py-2 rounded-xl font-bold transition cursor-pointer border ${
                filterMode === 'HIGH_STOCKS'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              💧 High Water/Ration Stock
            </button>
          </div>
        </div>
      </div>

      {/* ⛺ CAMP CARDS GRID */}
      {filteredCamps.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center text-slate-500">
          <Building2 className="h-12 w-12 text-indigo-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No relief camps found matching your filter</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the search query or changing filter parameters.</p>
          <button
            onClick={() => { setSearchQuery(''); setFilterMode('ALL'); }}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow hover:bg-indigo-500 transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCamps.map(camp => {
            const avail = camp.totalCapacity - camp.occupiedCapacity;
            const occPercent = Math.round((camp.occupiedCapacity / camp.totalCapacity) * 100);

            return (
              <div
                key={camp.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition duration-200"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                      {camp.id}
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black border uppercase tracking-wider ${
                        camp.status === 'FULL'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {camp.status === 'FULL' ? '🔴 CAMP FULL' : '🟢 OPEN (VACANCY)'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white leading-snug">{camp.name}</h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                      <span>{camp.locationName}</span>
                    </div>
                  </div>

                  {/* Bed Capacity Progress Bar */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400 font-bold flex items-center gap-1">
                        <Bed className="h-3.5 w-3.5 text-sky-400" />
                        <span>Bed Capacity:</span>
                      </span>
                      <b className={avail > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {avail > 0 ? `${avail} Free Beds` : '0 Beds Available'}
                      </b>
                    </div>

                    <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden border border-slate-300 dark:border-slate-800">
                      <div
                        className={`h-full transition-all duration-500 ${
                          occPercent > 90 ? 'bg-rose-500' : occPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, occPercent)}%` }}
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex justify-between pt-0.5">
                      <span>Occupied: {camp.occupiedCapacity}</span>
                      <span>Total: {camp.totalCapacity} ({occPercent}%)</span>
                    </div>
                  </div>

                  {/* Logistics Telemetry Badges */}
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Utensils className="h-3.5 w-3.5 text-amber-400" />
                        <span>Ration Supply</span>
                      </span>
                      <b className={camp.foodSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-amber-400'}>
                        {camp.foodSupplyStatus}
                      </b>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Droplets className="h-3.5 w-3.5 text-sky-400" />
                        <span>Drinking Water</span>
                      </span>
                      <b className={camp.waterSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-rose-400'}>
                        {camp.waterSupplyStatus}
                      </b>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                        <span>Medical Unit</span>
                      </span>
                      <b className="text-slate-200 text-[10px] uppercase font-bold">{camp.medicalSupportStatus.replace(/_/g, ' ')}</b>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  {/* Evacuee Check-in Button */}
                  <button
                    onClick={() => setCheckInCamp(camp)}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-2.5 text-xs font-black text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>CHECK-IN EVACUEE / UPDATE BEDS</span>
                  </button>

                  {/* Turn-by-Turn Safe Route Navigation Button */}
                  {onNavigateToMap && (
                    <button
                      onClick={onNavigateToMap}
                      className="w-full rounded-xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 py-2 text-xs font-bold text-indigo-400 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>📍 NAVIGATE SAFE ROUTE TO CAMP</span>
                    </button>
                  )}

                  {/* Manager Direct Capacity Editor */}
                  {updateCampId === camp.id ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="Occupied"
                        value={newOccupiedInput}
                        onChange={e => setNewOccupiedInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2 text-xs font-mono text-white"
                      />
                      <button
                        onClick={() => handleSaveCapacity(camp.id)}
                        className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 shrink-0 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setUpdateCampId(null)}
                        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 shrink-0 cursor-pointer"
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
                      className="w-full text-center text-[11px] font-bold text-slate-400 hover:text-slate-200 py-1 transition cursor-pointer"
                    >
                      ⚙️ Manager Bed Capacity Override
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🏥 EVACUEE CHECK-IN MODAL */}
      {checkInCamp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 animate-fadeIn text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⛺</span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">EVACUEE CHECK-IN: {checkInCamp.id}</h3>
              </div>
              <button
                onClick={() => setCheckInCamp(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {checkInSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center">
                {checkInSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleCheckInSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Evacuee Family / Lead Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter name"
                    value={evacueeName}
                    onChange={e => setEvacueeName(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Number of Persons / Beds Required *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={familyMembers}
                    onChange={e => setFamilyMembers(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div>Camp Name: <b className="text-white">{checkInCamp.name}</b></div>
                  <div>Current Occupancy: <b className="text-amber-400">{checkInCamp.occupiedCapacity} / {checkInCamp.totalCapacity}</b></div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3 font-extrabold text-white text-xs shadow-lg shadow-emerald-600/30 transition cursor-pointer"
                >
                  CONFIRM EVACUEE CHECK-IN ➔
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
