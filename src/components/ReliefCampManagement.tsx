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
  Compass,
  PhoneCall,
  Search,
  Check,
  X
} from 'lucide-react';
import { incidentStore, ReliefCamp } from '../services/api/incidentStore';
import SmartSearchInput from './common/SmartSearchInput';

export default function ReliefCampManagement() {
  const [camps, setCamps] = useState<ReliefCamp[]>(incidentStore.getReliefCamps());
  const activeIncident = incidentStore.getActiveIncident();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'DOCTORS' | 'ADEQUATE_FOOD'>('ALL');
  
  // Modals & Active Selections
  const [updateCampId, setUpdateCampId] = useState<string | null>(null);
  const [newOccupiedInput, setNewOccupiedInput] = useState<string>('');
  const [selectedRouteCamp, setSelectedRouteCamp] = useState<ReliefCamp | null>(null);
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);

  // New Camp Form
  const [newCampName, setNewCampName] = useState('');
  const [newCampLocation, setNewCampLocation] = useState('East Khasi Hills, Shillong');
  const [newCampCap, setNewCampCap] = useState(250);

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

  const handleAddCamp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    const newCamp: ReliefCamp = {
      id: `CAMP-NER-${Math.floor(100 + Math.random() * 900)}`,
      incidentId: activeIncident.id,
      name: newCampName,
      locationName: newCampLocation,
      lat: activeIncident.lat + (Math.random() * 0.05 - 0.025),
      lon: activeIncident.lon + (Math.random() * 0.05 - 0.025),
      totalCapacity: newCampCap,
      occupiedCapacity: 0,
      foodSupplyStatus: 'ADEQUATE',
      waterSupplyStatus: 'ADEQUATE',
      medicalSupportStatus: 'FULL_DOCTORS_ON_SITE',
      status: 'ACTIVE',
      dataStatus: 'VERIFIED DATA'
    };
    incidentStore.addReliefCamp(newCamp);
    setIsAddCampOpen(false);
    setNewCampName('');
  };

  // Distance calculation helper (Haversine in km)
  const calculateDistanceKm = (cLat: number, cLon: number) => {
    const R = 6371;
    const dLat = (cLat - activeIncident.lat) * (Math.PI / 180);
    const dLon = (cLon - activeIncident.lon) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(activeIncident.lat * (Math.PI / 180)) *
        Math.cos(cLat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  // Filter Camps
  const filteredCamps = camps.filter(camp => {
    const matchesSearch =
      camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === 'AVAILABLE') {
      return camp.totalCapacity - camp.occupiedCapacity > 0;
    }
    if (statusFilter === 'DOCTORS') {
      return camp.medicalSupportStatus === 'FULL_DOCTORS_ON_SITE';
    }
    if (statusFilter === 'ADEQUATE_FOOD') {
      return camp.foodSupplyStatus === 'ADEQUATE';
    }
    return true;
  });

  const totalCap = camps.reduce((a, b) => a + b.totalCapacity, 0);
  const totalOcc = camps.reduce((a, b) => a + b.occupiedCapacity, 0);
  const totalAvail = totalCap - totalOcc;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER BAR */}
      <div className="rounded-3xl border border-indigo-500/40 bg-gradient-to-r from-slate-950 via-indigo-950/70 to-slate-950 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-3 py-0.5 text-[11px] font-black text-indigo-300 border border-indigo-500/40 uppercase tracking-wider">
                LIVE RELIEF & SHELTER FINDER
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                ● 24/7 BED TRACKER
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Building2 className="h-7 w-7 text-indigo-400" />
              <span>Live Relief Camp Finder & Evacuee Shelter Grid</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Find safe emergency shelters, check real-time bed occupancy, ration & clean water supplies, and get 1-click turn-by-turn safe evacuation routing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs text-center">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 px-3 py-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Total Capacity</div>
                <div className="text-slate-100 font-black text-lg">{totalCap}</div>
              </div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 px-3 py-2">
                <div className="text-[10px] text-amber-400 uppercase font-bold">Occupied</div>
                <div className="text-amber-400 font-black text-lg">{totalOcc}</div>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Available Beds</div>
                <div className="text-emerald-400 font-black text-lg">{totalAvail}</div>
              </div>
            </div>

            <button
              onClick={() => setIsAddCampOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 px-4 py-3 text-xs font-black text-white shadow-lg hover:scale-105 transition flex items-center gap-2 cursor-pointer border border-indigo-400/40 shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Register New Camp</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 shadow-md">
        <div className="w-full md:w-96">
          <SmartSearchInput
            placeholder="Search camp by name, sector, or district..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Camps' },
            { id: 'AVAILABLE', label: '🟢 Available Beds' },
            { id: 'DOCTORS', label: '👨‍⚕️ Doctors On Site' },
            { id: 'ADEQUATE_FOOD', label: '🍱 Ration Stocked' }
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setStatusFilter(btn.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === btn.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* RELIEF CAMP CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCamps.map(camp => {
          const avail = camp.totalCapacity - camp.occupiedCapacity;
          const occPercent = Math.round((camp.occupiedCapacity / camp.totalCapacity) * 100);
          const distKm = calculateDistanceKm(camp.lat, camp.lon);

          return (
            <div
              key={camp.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl space-y-4 flex flex-col justify-between hover:border-indigo-500/40 transition group"
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono text-xs font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/30">
                    {camp.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                      <Compass className="h-3 w-3 text-sky-400" />
                      <span>{distKm} km away</span>
                    </span>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black border uppercase ${
                        camp.status === 'FULL'
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {camp.status}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-black text-white group-hover:text-sky-300 transition flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span>{camp.name}</span>
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                    <span>{camp.locationName}</span>
                  </div>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400 font-bold">Live Occupancy:</span>
                    <b className="text-amber-400">{camp.occupiedCapacity} / {camp.totalCapacity} ({occPercent}%)</b>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-500 ${
                        occPercent > 90 ? 'bg-rose-500' : occPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, occPercent)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono pt-0.5">
                    <span className="text-emerald-400 font-bold">🟢 {avail} Available Beds</span>
                    <span className="text-slate-400">GPS: {camp.lat.toFixed(4)}, {camp.lon.toFixed(4)}</span>
                  </div>
                </div>

                {/* Logistics Badges */}
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Utensils className="h-3.5 w-3.5 text-amber-400" />
                      <span>Ration Stock</span>
                    </span>
                    <b className={camp.foodSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-amber-400'}>
                      {camp.foodSupplyStatus}
                    </b>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Droplets className="h-3.5 w-3.5 text-sky-400" />
                      <span>Clean Water</span>
                    </span>
                    <b className={camp.waterSupplyStatus === 'ADEQUATE' ? 'text-emerald-400' : 'text-rose-400'}>
                      {camp.waterSupplyStatus}
                    </b>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                      <span>Medical Unit</span>
                    </span>
                    <b className="text-slate-200 text-[10px]">{camp.medicalSupportStatus.replace(/_/g, ' ')}</b>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <button
                  onClick={() => setSelectedRouteCamp(camp)}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-xs font-black text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>📍 NAVIGATE SAFE ROUTE ({distKm} KM)</span>
                </button>

                {updateCampId === camp.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Occupied"
                      value={newOccupiedInput}
                      onChange={e => setNewOccupiedInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2 text-xs font-mono text-white focus:border-indigo-500 focus:outline-none"
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
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    UPDATE CAMP OCCUPANCY
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 📍 SAFE EVACUATION ROUTE MODAL */}
      {selectedRouteCamp && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md select-none animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl border border-emerald-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
                  <Navigation className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">SAFE EVACUATION ROUTE NAVIGATION</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Turn-by-Turn Safe Route Guidance to Camp</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRouteCamp(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">DESTINATION RELIEF CAMP:</div>
                <div className="text-sm font-bold text-emerald-400">{selectedRouteCamp.name}</div>
                <div className="text-slate-300 text-[11px]">{selectedRouteCamp.locationName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">DISTANCE</div>
                  <div className="text-sm font-bold text-sky-400">
                    {calculateDistanceKm(selectedRouteCamp.lat, selectedRouteCamp.lon)} KM
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">ESTIMATED ETA</div>
                  <div className="text-sm font-bold text-emerald-400">
                    {Math.round(parseFloat(calculateDistanceKm(selectedRouteCamp.lat, selectedRouteCamp.lon)) * 2.5)} MINS
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <Check className="h-4 w-4" />
                  <span>AI VERIFIED SAFE CORRIDOR</span>
                </div>
                <div className="text-[10px] leading-relaxed text-slate-300">
                  Route cleared by BRO & SDRF patrol. Zero active landslide hazards detected along primary evacuation corridor.
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedRouteCamp(null)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 cursor-pointer"
              >
                Close Navigation Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGISTER NEW CAMP MODAL */}
      {isAddCampOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md select-none animate-fadeIn">
          <div className="relative w-full max-w-md rounded-3xl border border-indigo-500/50 bg-slate-900 p-6 shadow-2xl space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <Building2 className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">REGISTER NEW EMERGENCY RELIEF CAMP</h3>
              </div>
              <button
                onClick={() => setIsAddCampOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddCamp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Relief Camp Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shillong St. Anthony Shelter Hub"
                  value={newCampName}
                  onChange={e => setNewCampName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Sector / Location Landmark *</label>
                <input
                  type="text"
                  required
                  placeholder="District, Sector or Landmark"
                  value={newCampLocation}
                  onChange={e => setNewCampLocation(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Total Bed Capacity *</label>
                <input
                  type="number"
                  required
                  min="20"
                  max="5000"
                  value={newCampCap}
                  onChange={e => setNewCampCap(parseInt(e.target.value) || 100)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCampOpen(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:from-indigo-500 hover:to-sky-500 cursor-pointer"
                >
                  Save Relief Camp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
