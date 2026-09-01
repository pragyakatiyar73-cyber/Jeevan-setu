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
  // 🇮🇳 NORTH INDIA STATES & UTs
  {
    name: "Uttarakhand",
    flag: "🏔️",
    severity: "red",
    hazard: "Landslides, Cloudbursts & GLOF Watch",
    detail: "Dehradun-Mussoorie, Uttarkashi & Kedarnath slopes • Hill Road Status: 🔴 Blocked at Chamoli",
    highway: "NH-707A / NH-58 Chardham Corridor",
    focusCoord: [30.3165, 78.0322],
    zoom: 8.5
  },
  {
    name: "Himachal Pradesh",
    flag: "🏔️",
    severity: "red",
    hazard: "Rohtang Blizzard & Beas River Surge",
    detail: "Manali-Kullu highway mudslips • Altitude sub-zero freeze • Avalanche watch active",
    highway: "NH-5 Kalka-Shimla / NH-21 Manali Route",
    focusCoord: [31.1048, 77.1734],
    zoom: 8.2
  },
  {
    name: "Uttar Pradesh",
    flag: "🌊",
    severity: "red",
    hazard: "Ganga, Yamuna & Ghaghara Trans-Flooding",
    detail: "Gorakhpur, Prayagraj & Varanasi low-lying inundation • Agricultural crop submergence",
    highway: "NH-27 / NH-19 Uttar Pradesh Trans-Corridor",
    focusCoord: [26.8467, 80.9462],
    zoom: 7.5
  },
  {
    name: "Punjab",
    flag: "🌾",
    severity: "red",
    hazard: "Sutlej & Beas Dam Discharge River Surge",
    detail: "Harvest crop damage (62% risk) • 14 border villages submerged • De-watering active",
    highway: "NH-44 GT Road / Amritsar Bypass",
    focusCoord: [31.1471, 75.3412],
    zoom: 8
  },
  {
    name: "Rajasthan",
    flag: "🏜️",
    severity: "red",
    hazard: "Thar Desert Extreme Heatwave (44°C+) & Water Crisis",
    detail: "Emergency Water Priority System: CRITICAL • Jaisalmer & Barmer water tankers deployed",
    highway: "NH-11 / NH-68 Desert Lifeline",
    focusCoord: [26.9157, 70.9083],
    zoom: 7.2
  },
  {
    name: "Jammu & Kashmir",
    flag: "🏔️",
    severity: "red",
    hazard: "NH-44 Ramban Landslides & Jhelum Waterlogging",
    detail: "Zoji La & Srinagar highway slumps • Cold wave sub-zero frost alert",
    highway: "NH-44 Jammu-Srinagar Arterial Corridor",
    focusCoord: [34.0837, 74.7973],
    zoom: 8
  },
  {
    name: "Ladakh",
    flag: "❄️",
    severity: "orange",
    hazard: "High Altitude Extreme Sub-Zero (-18°C) & Avalanche",
    detail: "Khardung La (5,359m MSL) snow accumulation • Air Force high-altitude rescue active",
    highway: "Leh-Manali & Leh-Srinagar Pass Routes",
    focusCoord: [34.1526, 77.5771],
    zoom: 8
  },
  {
    name: "Haryana",
    flag: "🌾",
    severity: "orange",
    hazard: "Yamuna Basin Breach & Urban Highway Waterlogging",
    detail: "Gurugram Expressway drainage congestion • Agricultural farm submergence",
    highway: "NH-48 Delhi-Gurugram Expressway",
    focusCoord: [28.4595, 77.0266],
    zoom: 8.2
  },
  {
    name: "Delhi (NCT)",
    flag: "🏙️",
    severity: "orange",
    hazard: "Yamuna Overflow (208.6m) & Urban Underpass Inundation",
    detail: "Connaught Place & ITO waterlogging • Green Hospital Emergency Corridors active",
    highway: "Ring Road & Delhi Expressway Grid",
    focusCoord: [28.6139, 77.2090],
    zoom: 11
  },
  {
    name: "Chandigarh",
    flag: "🏙️",
    severity: "yellow",
    hazard: "Smart City Sector Underpass Waterlogging & Fog",
    detail: "PGI / GMCH emergency route priority • Regulated municipal drainage pumps",
    highway: "Chandigarh-Mohali Arterial Grid",
    focusCoord: [30.7333, 76.7794],
    zoom: 11.5
  },

  // 🌿 NORTH-EAST REGION & BIHAR (PRESERVED & INTEGRATED)
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
  const [regionFilter, setRegionFilter] = React.useState<'ALL' | 'NORTH' | 'NER'>('ALL');

  const filteredData = STATE_RISK_DATA.filter(st => {
    if (regionFilter === 'NORTH') {
      return ['Uttarakhand', 'Himachal Pradesh', 'Uttar Pradesh', 'Punjab', 'Rajasthan', 'Jammu & Kashmir', 'Ladakh', 'Haryana', 'Delhi (NCT)', 'Chandigarh'].includes(st.name);
    }
    if (regionFilter === 'NER') {
      return ['Bihar', 'Sikkim', 'Assam', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura'].includes(st.name);
    }
    return true;
  });

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
              <span>National & North India State Risk Matrix</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold">Live Grid</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time disaster vulnerability matrix across 19 States & UTs in North India, North-East & Bihar</p>
          </div>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setRegionFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${regionFilter === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            🇮🇳 All 19 Regions
          </button>
          <button
            onClick={() => setRegionFilter('NORTH')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${regionFilter === 'NORTH' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            🏔️ North India (10 UT/States)
          </button>
          <button
            onClick={() => setRegionFilter('NER')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${regionFilter === 'NER' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
          >
            🌿 North East & Bihar (9 States)
          </button>
        </div>
      </div>

      {/* Live High-Level Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider">🚨 Red Alert States</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">11 States</span>
          <span className="text-[11px] text-rose-600/80 dark:text-rose-300/80 font-medium">Uttarakhand, HP, UP, Punjab, Rajasthan, J&K, Bihar, Sikkim, Assam, Meghalaya, Nagaland</span>
        </div>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">🟡 Orange Alert States</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">7 Regions</span>
          <span className="text-[11px] text-amber-600/80 dark:text-amber-300/80 font-medium">Ladakh, Haryana, Delhi, Arunachal, Manipur, Mizoram, Tripura</span>
        </div>
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">🌊 Major Rivers Monitored</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">9 River Basins</span>
          <span className="text-[11px] text-sky-600/80 dark:text-sky-300/80 font-medium">Ganga, Yamuna, Sutlej, Beas, Jhelum, Gandak, Kosi, Teesta, Brahmaputra</span>
        </div>
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 flex flex-col justify-between shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">⚡ Specialized Systems</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1">5 AI Modules</span>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80 font-medium">Hill Road, Desert Water, Agri Impact, Cold Wave, Urban Inundation</span>
        </div>
      </div>

      {/* State-by-State Cards Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredData.map((st, i) => (
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
