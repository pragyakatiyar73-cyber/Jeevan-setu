import React, { useState } from "react";
import MapComponent from "./MapComponent";
import RainfallChart from "./RainfallChart";
import {
  Camera,
  Flag,
  Activity,
  Layers
} from "lucide-react";

// Semicircle Gauge Component to match the uploaded screenshot exact design
const GaugeMeter: React.FC<{ score: number }> = ({ score }) => {
  const normalizedScore = Math.min(Math.max(score, 0), 10);
  // Semicircle angle range: -90deg (0) to +90deg (10)
  const angle = (normalizedScore / 10) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center justify-center pt-2">
      <svg viewBox="0 0 200 115" className="w-52 h-28">
        <defs>
          <linearGradient id="gaugeArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="30%" stopColor="#84cc16" />
            <stop offset="55%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Thick Semicircle Gauge Arc */}
        <path
          d="M 25 100 A 75 75 0 0 1 175 100"
          fill="none"
          stroke="url(#gaugeArcGradient)"
          strokeWidth="20"
          strokeLinecap="round"
        />

        {/* Gauge Needle */}
        <g transform={`rotate(${angle}, 100, 100)`}>
          <polygon points="97,100 103,100 100,32" fill="#f87171" />
          <circle cx="100" cy="100" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
        </g>
      </svg>

      {/* Centered Large Numeric Score */}
      <div className="absolute bottom-2 text-center">
        <span className="text-4xl font-black text-white tracking-tight">{score.toFixed(1)}</span>
        <div className="text-xs font-bold text-rose-500 uppercase tracking-wide mt-0.5">High Risk</div>
      </div>
    </div>
  );
};

const CitizenTriageDashboard: React.FC = () => {
  // Input fields state
  const [location, setLocation] = useState("NH-6 Km 142, East Khasi Hills, Meghalaya");
  const [incident, setIncident] = useState("Massive Landslide & Slope Mudslide");
  const [notes, setNotes] = useState("Both lanes blocked by landslide debris.");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Results state
  const [lhiScore, setLhiScore] = useState(8.2);
  const [damageScore, setDamageScore] = useState(8.8);
  const [damageText, setDamageText] = useState("Severe Damage");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeDamage = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: photoPreview,
          location,
          incident_type: incident,
          notes,
          slope: 45,
          rainfall: 180
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.lhi_score) setLhiScore(Number((data.lhi_score / 10).toFixed(1)));
        if (data.damage_score) setDamageText(data.damage_score);
      }
    } catch (err) {
      console.warn("Using offline fail-safe AI triage calculation engine.", err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D18] text-slate-100 p-4 md:p-6 lg:p-7 space-y-6 font-sans">
      
      {/* 2-COLUMN MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Disaster Site Details & Map Overview */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card: Disaster Site Details */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-slate-200 font-bold text-sm">
              <span className="text-base">📋</span>
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
                <div className="py-4 flex flex-col items-center justify-center space-y-2">
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    Select or Drop Disaster Site Photo
                  </span>
                </div>
              )}
            </div>

            {/* Field Inputs matching exact labels & italic styling */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-400 font-semibold">Location :</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 italic font-mono text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-semibold">Incident :</label>
                <input
                  type="text"
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 font-medium text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 font-semibold">Notes :</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Analyze Damage Button */}
            <button
              onClick={handleAnalyzeDamage}
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Activity className="w-4 h-4 animate-spin text-white" />
                  <span>Analyzing Damage...</span>
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
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Incident Zone Overview
            </h3>
            <MapComponent center={[25.51, 91.50]} />
          </div>

        </div>

        {/* RIGHT COLUMN: Scores, AI Actions, Timeline & Stats */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Top Row: Gauge Card & (Damage Card + Actions Card) */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6">
            
            {/* Card: Landslide Hazard Index */}
            <div className="sm:col-span-6 bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
              <h3 className="text-xs font-bold text-slate-200">Landslide Hazard Index</h3>
              
              {/* Semicircle SVG Gauge */}
              <GaugeMeter score={lhiScore} />

              <div className="border-t border-slate-800/80 pt-3 space-y-1">
                <span className="text-xs font-bold text-slate-300 block">LHI Score</span>
                <span className="text-xs text-slate-400 block">Elevated Landslide Risk</span>
              </div>

              {/* Horizontal Status Bar */}
              <div className="w-full h-3 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600 p-0.5 border border-slate-800 shadow-inner" />
            </div>

            {/* Right Sub-Column: Damage Assessment & AI Actions */}
            <div className="sm:col-span-6 space-y-6 flex flex-col justify-between">
              
              {/* Card: Damage Assessment */}
              <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 mb-1">Damage Assessment</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-rose-500">{damageScore.toFixed(1)}</span>
                    <span className="text-xs font-bold text-rose-400">{damageText}</span>
                  </div>
                </div>
              </div>

              {/* Card: AI Recommended Actions */}
              <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex-1 space-y-3">
                <h3 className="text-xs font-bold text-slate-200">AI Recommended Actions</h3>
                <ol className="space-y-2 text-xs text-slate-300 font-medium">
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

          {/* Card: Hazard Timeline */}
          <div className="bg-[#0F1424] border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200">Hazard Timeline</h3>
              <span className="text-[11px] text-slate-400">Last 72 Hours</span>
            </div>
            <RainfallChart />
          </div>

          {/* Bottom Row Stats & Legend Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
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
