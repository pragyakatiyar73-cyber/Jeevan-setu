import React from 'react';

export interface StateRiskData {
  name: string;
  flag: string;
  severity: 'red' | 'orange' | 'yellow';
  hazard: string;
  detail: string;
  highway: string;
  focusCoord: [number, number];
  zoom: number;
}

export const STATE_RISK_DATA: StateRiskData[] = [
  {
    name: "Bihar",
    flag: "🚨",
    severity: "red",
    hazard: "Nepal Influx & Barrage Flood Surge",
    detail: "Valmikinagar (4.5L+ Cusecs) & Birpur (5.2L+ Cusecs) • 7 Red & 11 Orange Districts",
    highway: "NH-27 / NH-22 East-West Corridor",
    focusCoord: [26.40, 85.90],
    zoom: 8
  },
  {
    name: "Sikkim",
    flag: "🏔️",
    severity: "red",
    hazard: "South Lhonak GLOF & NH-10 Teesta Washout",
    detail: "Moraine displacement 14.6 mm/day • Chungthang Dam spillway surge",
    highway: "NH-10 Siliguri-Gangtok (Diverting via Lava)",
    focusCoord: [27.55, 88.55],
    zoom: 8.5
  },
  {
    name: "Assam",
    flag: "🌊",
    severity: "red",
    hazard: "Majuli Island Erosion & Silchar Barak Surge",
    detail: "Brahmaputra bank failure • Dima Hasao rail mudslips • Kaziranga backflow",
    highway: "NH-37 / NH-27 Brahmaputra Artery",
    focusCoord: [26.40, 93.00],
    zoom: 7.8
  },
  {
    name: "Meghalaya",
    flag: "🌧️",
    severity: "red",
    hazard: "NH-6 Km 142 Landslide Breach & Sohra Runoff",
    detail: "680mm torrential rain • Escarpment washouts • Sector 9 AI Bypass active",
    highway: "NH-6 Jowai-Ratacherra Lifeline",
    focusCoord: [25.20, 92.10],
    zoom: 8
  },
  {
    name: "Arunachal Pradesh",
    flag: "🏔️",
    severity: "orange",
    hazard: "NH-13 Sela Pass Blizzard & Siang Inflow",
    detail: "Altitude 3,500m MSL snow slurry & rockfall • Upper Siang glacial surge",
    highway: "NH-13 Trans-Arunachal Highway",
    focusCoord: [27.50, 92.50],
    zoom: 8
  },
  {
    name: "Nagaland",
    flag: "⛰️",
    severity: "red",
    hazard: "NH-29 Paglapahar Geological Sinking Zone",
    detail: "Kohima-Dimapur active fault line slump • Boulder shield protective barrier",
    highway: "NH-29 Asian Highway 1 (AH-1)",
    focusCoord: [25.75, 93.85],
    zoom: 8.2
  },
  {
    name: "Manipur",
    flag: "🌋",
    severity: "red",
    hazard: "NH-37 Imphal-Jiribam Mudslips & Nambul Surge",
    detail: "Makru & Barak bridge approach slips • Imphal urban river waterlogging",
    highway: "NH-37 Western Lifeline Corridor",
    focusCoord: [24.80, 93.45],
    zoom: 8.2
  },
  {
    name: "Mizoram",
    flag: "🌿",
    severity: "red",
    hazard: "NH-306 Aizawl-Kolasib Slope Failure",
    detail: "Sole supply route hill breach • Heavy earthmovers deployed for restoration",
    highway: "NH-306 Essential Supply Lifeline",
    focusCoord: [24.05, 92.68],
    zoom: 8.2
  },
  {
    name: "Tripura",
    flag: "🌊",
    severity: "orange",
    hazard: "Agartala Howrah Basin Transboundary Surge",
    detail: "Howrah River embankment saturation • Regulated sluice discharge",
    highway: "NH-8 Assam-Agartala Highway",
    focusCoord: [23.83, 91.28],
    zoom: 8.2
  }
];

interface StateRiskMatrixSectionProps {
  onFocusState?: (coord: [number, number], zoom: number) => void;
}

export default function StateRiskMatrixSection({ onFocusState }: StateRiskMatrixSectionProps) {
  return (
    <section id="state-risk-matrix" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 lg:p-7 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-lg shadow-inner">
            📊
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Regional State Risk & Hazard Statistics Matrix</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold">Live Feeds</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time disaster vulnerability matrix & telemetry across North Eastern States & Bihar</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            ALL 9 STATES MONITORED
          </span>
        </div>
      </div>

      {/* Live High-Level Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">🚨 Red Alert States</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">4 States</span>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-300/80 font-medium">Bihar, Sikkim, Assam, Meghalaya</span>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">🟡 Orange Alert States</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 States</span>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-300/80 font-medium">Arunachal, Nagaland, Manipur, Mizoram, Tripura</span>
        </div>
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">🌊 Monitored Rivers</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 Influx Rivers</span>
          <span className="text-[11px] text-sky-600/80 dark:text-sky-300/80 font-medium">Gandak, Kosi, Teesta, Brahmaputra, Barak</span>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">⚡ Green Corridors</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">3 Active Detours</span>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 font-medium">Sector 9, Kalaktang, Lava-Kalimpong</span>
        </div>
      </div>

      {/* State-by-State Cards Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {STATE_RISK_DATA.map((st, i) => (
          <div
            key={i}
            className="flex flex-col justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#0c152e]/70 hover:border-slate-300 dark:hover:border-slate-700 transition"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{st.flag}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">{st.name}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${st.severity === "red" ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30" : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"}`}>
                  {st.severity === "red" ? "🚨 Red Alert" : "🟡 Orange Alert"}
                </span>
              </div>
              <div className="text-xs text-sky-600 dark:text-sky-400 font-bold">{st.hazard}</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{st.detail}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-1.5">🛣️ {st.highway}</div>
            </div>

            {onFocusState && (
              <button
                onClick={() => onFocusState(st.focusCoord, st.zoom)}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
              >
                <span>🎯</span> <span>Focus on Map</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
