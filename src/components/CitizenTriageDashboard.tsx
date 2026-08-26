import React, { useState } from "react";
import MapComponent from "./MapComponent";
import RainfallChart from "./RainfallChart";
import { Camera, Flag, Activity } from "lucide-react";

// Semicircle Gauge Component
const GaugeMeter: React.FC<{ score: number }> = ({ score }) => {
  const normalizedScore = Math.min(Math.max(score, 0), 10);
  const angle = (normalizedScore / 10) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center justify-center pt-1">
      <svg viewBox="0 0 200 115" className="w-48 h-26">
        <defs>
          <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="30%" stopColor="#84cc16" />
            <stop offset="55%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Gauge Arc */}
        <path
          d="M 25 100 A 75 75 0 0 1 175 100"
          fill="none"
          stroke="url(#gaugeArcGrad)"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Gauge Needle */}
        <g transform={`rotate(${angle}, 100, 100)`}>
          <polygon points="97,100 103,100 100,34" fill="#f87171" />
          <circle cx="100" cy="100" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
        </g>
      </svg>

      {/* Centered Numeric Score */}
      <div className="absolute bottom-1 text-center">
        <span className="text-3xl font-black text-white tracking-tight">{score.toFixed(1)}</span>
        <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wide">High Risk</div>
      </div>
    </div>
  );
};

const CitizenTriageDashboard: React.FC = () => {
  const [location, setLocation] = useState("NH-6 Km 142, East Khasi Hills, Meghalaya");
  const [incident, setIncident] = useState("Massive Landslide & Slope Mudslide");
  const [notes, setNotes] = useState("Both lanes blocked by landslide debris.");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [lhiScore] = useState(8.2);
  const [damageScore] = useState(8.8);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeDamage = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="w-full bg-[#080B14] text-slate-100 p-4 md:p-6 font-sans min-h-screen">
      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-[1400px] mx-auto">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* Card: Disaster Site Details */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
              <span>📋</span>
              <h2>Disaster Site Details</h2>
            </div>

            {/* Dotted Upload Box */}
            <div className="relative border-2 border-dashed border-rose-500/40 hover:border-rose-500/80 rounded-xl p-4 bg-[#0A0E1A] transition text-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              {photoPreview ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-800 max-h-36">
                  <img src={photoPreview} alt="Disaster Site Preview" className="w-full h-36 object-cover" />
                </div>
              ) : (
                <div className="py-3 flex flex-col items-center justify-center gap-2">
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Select or Drop Disaster Site Photo
                  </span>
                </div>
              )}
            </div>

            {/* Field Inputs */}
            <div className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-slate-400 font-semibold">Location :</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 italic font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 font-semibold">Incident :</label>
                <input
                  type="text"
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-slate-400 font-semibold">Notes :</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Analyze Damage Button */}
            <button
              onClick={handleAnalyzeDamage}
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Analyze Damage</span>
                </>
              )}
            </button>
          </div>

          {/* Card: Incident Zone Overview */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Incident Zone Overview
            </h3>
            <MapComponent center={[25.51, 91.50]} />
          </div>

        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Top Row: Gauge Card & (Damage Card + Actions Card) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Landslide Hazard Index */}
            <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between gap-4">
              <h3 className="text-xs font-bold text-slate-200">Landslide Hazard Index</h3>
              
              <GaugeMeter score={lhiScore} />

              <div className="border-t border-slate-800/80 pt-3 flex flex-col gap-0.5">
                <span className="text-xs font-bold text-slate-300">LHI Score</span>
                <span className="text-xs text-slate-400">Elevated Landslide Risk</span>
              </div>

              {/* Status Bar */}
              <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 p-0.5 border border-slate-800" />
            </div>

            {/* Card 2 Container: Stacked Damage Assessment & AI Actions */}
            <div className="flex flex-col gap-5">
              
              {/* Sub-Card A: Damage Assessment */}
              <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1">Damage Assessment</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-rose-500">{damageScore.toFixed(1)}</span>
                    <span className="text-xs font-bold text-rose-400">Severe Damage</span>
                  </div>
                </div>
              </div>

              {/* Sub-Card B: AI Recommended Actions */}
              <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex-1 flex flex-col gap-2.5">
                <h3 className="text-xs font-bold text-slate-200">AI Recommended Actions</h3>
                <ol className="flex flex-col gap-1.5 text-xs text-slate-300 font-medium">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-400">1.</span>
                    <span>Dispatch 3 BRO JCB Excavators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-400">2.</span>
                    <span>Notify NDRF 1078 Triage Team</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-slate-400">3.</span>
                    <span>Set Avoidance Perimeter</span>
                  </li>
                </ol>
              </div>

            </div>

          </div>

          {/* Middle Row: Hazard Timeline */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200">Hazard Timeline</h3>
              <span className="text-xs text-slate-400">Last 72 Hours</span>
            </div>
            <RainfallChart />
          </div>

          {/* Bottom Row: 2 Metric Cards */}
          <div className="grid grid-cols-2 gap-5">
            
            {/* Card: Road Cutoff Distance */}
            <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl">
              <span className="text-xs text-slate-400 font-medium block mb-1">Road Cutoff Distance</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-amber-500">350</span>
                <span className="text-xs text-slate-400 font-semibold">meters</span>
              </div>
            </div>

            {/* Card: 72hr Rainfall */}
            <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl">
              <span className="text-xs text-slate-400 font-medium block mb-1">72hr Rainfall</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-400">115</span>
                <span className="text-xs text-slate-400 font-semibold">mm</span>
              </div>
            </div>

          </div>

          {/* Bottom Legend Bar */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-xl p-2.5 px-4 flex items-center justify-end gap-6 text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe &lt; 4.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate 4.0-7.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Risk &gt; 7.0
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default CitizenTriageDashboard;
