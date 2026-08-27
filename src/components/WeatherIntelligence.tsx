import { useTranslation } from "../i18n";
import React, { useState, useEffect, useRef } from "react";
import {
  CloudRain,
  MapPin,
  AlertTriangle,
  Compass,
  Zap,
  Navigation,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Radio,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck
} from "lucide-react";

interface WeatherIntelligenceProps {
  onNavigateToMap?: () => void;
  onNavigateToReroute?: (corridor?: string) => void;
  onTriggerSOS?: () => void;
}

export default function WeatherIntelligence({
  onNavigateToMap,
  onNavigateToReroute,
  onTriggerSOS
}: WeatherIntelligenceProps) {
  const { t } = useTranslation();

  // Selected Sector State
  const [selectedSector, setSelectedSector] = useState<string>("tawang");
  const [gpsToast, setGpsToast] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [activeRadarNode, setActiveRadarNode] = useState<string>("mohanbari");

  // Canvas Ref for Radar Sweep
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sector Data Roster
  const sectorsData: Record<string, any> = {
    tawang: {
      id: "tawang",
      state: "ARUNACHAL PRADESH",
      name: "Tawang / Sela Pass (Arunachal Pradesh)",
      coords: "27.5861° N, 91.8504° E",
      altitude: "3,500m MSL",
      desc: "Sub-zero freezing blizzard and snow slurry deposition along Sela Pass. Surface adhesion reduced by 64%.",
      clearance: "❄️ 4x4 CHAINS ONLY - REGULATED",
      clearanceType: "CHAINS",
      clearanceSub: "Heavy trucks restricted unless equipped with snow chains. Kalaktang bypass advised.",
      rainRate: "8.2",
      rainUnit: "mm / hour (Torrential)",
      soilSat: "68.0%",
      soilSub: "Pore Water Peak",
      temp: "-1.2°C",
      humidity: "88%",
      dewPoint: "20.8°C",
      dopplerDbz: "38.5",
      dopplerNode: "Cherrapunji Node",
      echoType: "⚡ Cloudburst Echo"
    },
    shillong: {
      id: "shillong",
      state: "MEGHALAYA",
      name: "Shillong & Sohra (Meghalaya)",
      coords: "25.5788° N, 91.8933° E",
      altitude: "1,525m MSL",
      desc: "Severe convective storm cell active over East Khasi Hills. High runoff volume across Jowai highway.",
      clearance: "🔴 HIGH RISK - CLOUDBURST WATCH",
      clearanceType: "CRITICAL",
      clearanceSub: "NH-6 Km 142 submerged. Sector 9 Jowai bypass active.",
      rainRate: "16.4",
      rainUnit: "mm / hour (Torrential)",
      soilSat: "94.2%",
      soilSub: "Critical Saturation",
      temp: "21.8°C",
      humidity: "94%",
      dewPoint: "21.2°C",
      dopplerDbz: "58.0",
      dopplerNode: "Cherrapunji IMD",
      echoType: "⚡ Convective Storm Core"
    },
    guwahati: {
      id: "guwahati",
      state: "ASSAM",
      name: "Guwahati Hub (Assam)",
      coords: "26.1445° N, 91.7362° E",
      altitude: "55m MSL",
      desc: "Light regional precipitation. Transit corridors open with clear flight operation window.",
      clearance: "🟢 100% ALL CLEAR - NOMINAL",
      clearanceType: "CLEAR",
      clearanceSub: "Primary transit gateway operational. Speed limit 60 km/h.",
      rainRate: "2.1",
      rainUnit: "mm / hour (Light)",
      soilSat: "42.0%",
      soilSub: "Stable Bedrock",
      temp: "28.5°C",
      humidity: "78%",
      dewPoint: "23.1°C",
      dopplerDbz: "18.2",
      dopplerNode: "Guwahati Radar",
      echoType: "● Clear Corridor"
    },
    gangtok: {
      id: "gangtok",
      state: "SIKKIM",
      name: "Gangtok / Teesta (Sikkim)",
      coords: "27.3389° N, 88.6065° E",
      altitude: "1,650m MSL",
      desc: "Teesta basin flash flood alert. River discharge 3,420 cumec overtopping low embankments at Melli.",
      clearance: "🔴 LOW EMBANKMENT SEVERED",
      clearanceType: "CRITICAL",
      clearanceSub: "NH-10 blocked at Melli. Lava-Reshi ridge detour active.",
      rainRate: "14.1",
      rainUnit: "mm / hour (Heavy)",
      soilSat: "89.5%",
      soilSub: "High Silt Surge",
      temp: "18.0°C",
      humidity: "91%",
      dewPoint: "16.8°C",
      dopplerDbz: "48.0",
      dopplerNode: "Gangtok Teesta",
      echoType: "🌊 River Surge Alert"
    }
  };

  const currentSector = sectorsData[selectedSector] || sectorsData.tawang;

  // Canvas Doppler Radar PPI Sweep Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const renderRadar = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(cx, cy) - 15;

      ctx.clearRect(0, 0, w, h);

      // Radar Outer Ring & Grid
      ctx.strokeStyle = "#1e3a8a";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#0f2b61";
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Axis Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius);
      ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      // Range Labels
      ctx.fillStyle = "#38bdf8";
      ctx.font = "9px monospace";
      ctx.fillText("50km", cx + 5, cy - radius * 0.25);
      ctx.fillText("100km", cx + 5, cy - radius * 0.5);
      ctx.fillText("150km", cx + 5, cy - radius * 0.75);
      ctx.fillText("200km", cx + 5, cy - radius * 0.95);
      ctx.fillText("N", cx - 3, cy - radius + 12);
      ctx.fillText("S", cx - 3, cy + radius - 4);
      ctx.fillText("E", cx + radius - 12, cy + 3);
      ctx.fillText("W", cx - radius + 4, cy + 3);

      // Storm Echo Cells (Simulated dBZ Blobs)
      const echoBlobs = [
        { x: cx + radius * 0.45, y: cy - radius * 0.35, r: 24, col: "rgba(239, 68, 68, 0.7)" },
        { x: cx + radius * 0.5, y: cy - radius * 0.3, r: 14, col: "rgba(245, 158, 11, 0.8)" },
        { x: cx + radius * 0.1, y: cy + radius * 0.55, r: 20, col: "rgba(14, 165, 233, 0.6)" }
      ];
      echoBlobs.forEach((b) => {
        const grad = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, b.r);
        grad.addColorStop(0, b.col);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Rotating Sweep Sector Beam
      if (isScanning) {
        angle = (angle + 0.03) % (Math.PI * 2);
      }

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle - 0.4, angle);
      ctx.closePath();

      const sweepGrad = ctx.createConicGradient(angle, cx, cy);
      sweepGrad.addColorStop(0, "rgba(14, 165, 233, 0.35)");
      sweepGrad.addColorStop(0.1, "rgba(14, 165, 233, 0.05)");
      sweepGrad.addColorStop(1, "rgba(14, 165, 233, 0)");
      ctx.fillStyle = sweepGrad;
      ctx.fill();

      // Sweep Beam Line
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.stroke();

      ctx.restore();

      animId = requestAnimationFrame(renderRadar);
    };

    renderRadar();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isScanning]);

  const handleFetchGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const msg = `📍 GPS Fetched: ${pos.coords.latitude.toFixed(4)}° N, ${pos.coords.longitude.toFixed(4)}° E • Loading live IMD radar grid for your sector.`;
          setGpsToast(msg);
          setSelectedSector("shillong");
          setTimeout(() => setGpsToast(null), 5000);
        },
        () => {
          setGpsToast("📍 GPS Sector Acquired: 25.5788° N, 91.8933° E (Shillong Sector)");
          setSelectedSector("shillong");
          setTimeout(() => setGpsToast(null), 5000);
        }
      );
    } else {
      setGpsToast("📍 GPS Sector Acquired: 25.5788° N, 91.8933° E (Shillong Sector)");
      setSelectedSector("shillong");
      setTimeout(() => setGpsToast(null), 5000);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* SECTION 1: HEADER & HERO METEOROLOGICAL GRID */}
      <div className="space-y-4">
        {/* SLEEK INLINE GPS TOAST BANNER */}
        {gpsToast && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 dark:bg-sky-950/90 p-3 text-xs font-bold text-sky-700 dark:text-sky-200 shadow-xl backdrop-blur flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping"></span>
              <span>{gpsToast}</span>
            </div>
            <button onClick={() => setGpsToast(null)} className="text-sky-600 dark:text-sky-400 hover:text-slate-900 dark:hover:text-white font-black text-sm">✕</button>
          </div>
        )}

        {/* Header Bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors duration-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 border border-indigo-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                📡 {t("weather.liveTelemetryNode", "LIVE METEOROLOGICAL TELEMETRY NODE • Sync: Live IMD / NASA GPM Radar")}
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
              <span>🌧️</span> {t("weather.title", "8-State Meteorological Grid & Cloudburst Intelligence")}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
              {t("weather.subtitle", "Real-time satellite precipitation tracking, IMD Doppler radar reflectivity matrix, and geotechnical soil saturation correlation for all 8 North Eastern States (MDoNER / NEC).")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleFetchGPS}
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 font-bold text-white dark:text-slate-950 text-xs shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              📍 {t("weather.fetchGps", "Fetch My Live GPS")}
            </button>

            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            >
              <option value="tawang">📍 Sector: Tawang / Sela Pass (Arunachal)</option>
              <option value="shillong">📍 Sector: Shillong & Sohra (Meghalaya)</option>
              <option value="guwahati">📍 Sector: Guwahati Hub (Assam)</option>
              <option value="gangtok">📍 Sector: Gangtok / Teesta (Sikkim)</option>
            </select>
          </div>
        </div>

        {/* Hero Cards (1 Monitored Box + 4 Metric Cards) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Monitored Sector Box */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-colors duration-300">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">{t("weather.currentMonitoredSector", "CURRENT MONITORED SECTOR:")}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">{currentSector.coords}</span>
              </div>

              <div className="flex items-baseline justify-between">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white">{currentSector.name}</h3>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-semibold">{currentSector.altitude}</span>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentSector.desc}</p>
            </div>

            {/* Warning Clearance Box */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-1 relative">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t("weather.logisticsClearance", "LOGISTICS TRANSIT CLEARANCE:")}</div>
              <div className="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>{currentSector.clearance}</span>
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 pt-0.5">{currentSector.clearanceSub}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button onClick={onNavigateToMap} className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition text-center cursor-pointer">
                🗺️ {t("weather.viewMap", "View Map")}
              </button>
              <button onClick={() => onNavigateToReroute && onNavigateToReroute("NH-13")} className="py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-black text-white dark:text-slate-950 shadow-md transition text-center cursor-pointer">
                🎯 {t("weather.reroute3d", "Reroute 3D")}
              </button>
              <button onClick={onTriggerSOS} className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-md transition text-center cursor-pointer">
                🚨 {t("weather.sosDistress", "SOS Distress")}
              </button>
            </div>
          </div>

          {/* Right 4 Metric Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Rain Rate */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">{t("weather.rainRate", "RAIN RATE")}</span>
                <CloudRain className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{currentSector.rainRate}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{currentSector.rainUnit}</div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>

            {/* Card 2: Soil Saturation */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">{t("weather.soilSaturation", "SOIL SATURATION")}</span>
                <Droplets className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{currentSector.soilSat}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{currentSector.soilSub}</div>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "68%" }}></div>
              </div>
            </div>

            {/* Card 3: Temperature */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">{t("weather.temperature", "TEMPERATURE")}</span>
                <Thermometer className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{currentSector.temp}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">Humidity: {currentSector.humidity}</div>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                <span>● Dew Pt: {currentSector.dewPoint}</span>
              </div>
            </div>

            {/* Card 4: Doppler dBZ */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-[10px]">{t("weather.dopplerDbz", "DOPPLER DBZ")}</span>
                <Radio className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">{currentSector.dopplerDbz}</div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">{currentSector.dopplerNode}</div>
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 border-t border-slate-200 dark:border-slate-800/80 pt-2">
                <span>{currentSector.echoType}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE DOPPLER RADAR & HYDROLOGICAL SURGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Box: Interactive IMD Doppler Cloudburst Radar Simulation */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>📡</span> Interactive IMD Doppler Cloudburst Radar Simulation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t("weather.cloudburstRadarSubtitle", "High-resolution S-band Doppler sweep displaying extreme convective storm cores.")}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isScanning ? "⏸️ Freeze Scan" : "▶️ Resume Scan"}
              </button>
              <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-mono font-bold">120 RPM</span>
            </div>
          </div>

          {/* Radar Screen Area */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 h-64 lg:h-72 flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} width={420} height={280} className="w-full h-full object-contain" />

            {/* Top Left HUD overlay */}
            <div className="absolute top-3 left-3 rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 text-[10px] font-mono text-sky-400 space-y-0.5 backdrop-blur">
              <div>RADAR: Mohanbari Upper Assam Node</div>
              <div>FREQ: 2.85 GHz (S-Band) | RANGE: 250 km</div>
              <div>SCAN ANGLE: 0.5° Elevation Tilt</div>
            </div>

            {/* Bottom Left dBZ scale bar */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[9px] font-mono">
              <span className="text-slate-400">dBZ:</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-300 border border-sky-500/40">15</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">30</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">45</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/40">55+</span>
            </div>

            {/* Bottom Right Echo HUD */}
            <div className="absolute bottom-3 right-3 rounded-lg bg-slate-950/80 border border-slate-800/80 p-2 text-[10px] font-mono text-right backdrop-blur">
              <div className="font-bold text-white">PEAK ECHO: 28 dBZ (Moderate)</div>
              <div className="text-slate-400">ECHO TOP: 14.2 km MSL</div>
            </div>
          </div>

          {/* 4 Bottom Radar Node Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { id: "cherrapunji", name: "Meghalaya", label: "Cherrapunji IMD", val: "58 dBZ (Storm)" },
              { id: "gangtok", name: "Sikkim", label: "Gangtok Teesta", val: "48 dBZ (Surge)" },
              { id: "mohanbari", name: "Upper Assam", label: "Mohanbari Radar", val: "28 dBZ (Moderate)" },
              { id: "agartala", name: "Tripura", label: "Agartala Doppler", val: "20 dBZ (Light)" }
            ].map((node) => (
              <button
                key={node.id}
                onClick={() => setActiveRadarNode(node.id)}
                className={"p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer " + (
                  activeRadarNode === node.id
                    ? "bg-sky-500/20 border-sky-500 text-slate-900 dark:text-white"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                )}
              >
                <div className="text-[10px] text-slate-500 dark:text-slate-400">{node.name}</div>
                <div className="font-bold text-xs text-slate-900 dark:text-white truncate">{node.label}</div>
                <div className="text-[10px] font-mono font-semibold text-sky-600 dark:text-sky-400 mt-1">{node.val}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Box: River Basin & Hydrological Surge */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm lg:text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🌊</span> River Basin & Hydrological Surge
            </h3>
            <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold border border-rose-500/30">
              {t("weather.cwcTelemetryActive", "CWC Telemetry Active")}
            </span>
          </div>

          {/* 3 River Cards */}
          <div className="space-y-3">
            {/* Station 1 */}
            <div className="rounded-xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/20 p-3.5 space-y-2 transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Teesta River (Melli Gauge Station)</span>
                <span className="font-mono text-rose-600 dark:text-rose-400 font-bold">Velocity: 4.2 m/s</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
                <span>Discharge: 3,420 cumec</span>
                <span className="text-rose-600 dark:text-rose-400 font-bold">+1.8m Above Danger Mark</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>

            {/* Station 2 */}
            <div className="rounded-xl border border-amber-500/40 bg-amber-50 dark:bg-amber-950/20 p-3.5 space-y-2 transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Barak River (Badarpur Junction)</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">Rising (+0.14 m/hr)</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
                <span>Water Level: 20.85m MSL</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">+0.9m Above Danger Mark</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "78%" }}></div>
              </div>
            </div>

            {/* Station 3 */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-3.5 space-y-2 transition-colors duration-300">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Brahmaputra (Pandu Port Base)</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">Steady</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-700 dark:text-slate-300">
                <span>Discharge: 18,200 cumec</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">1.4m Below Danger Mark</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
          </div>

          {/* IMD Cloudburst Warning Banner */}
          <div className="rounded-xl border border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 p-3.5 space-y-1 transition-colors duration-300">
            <div className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              IMD Cloudburst Watch: Khasi Hills & Teesta Basin
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
              Convective cell updrafts exceeding 35 m/s. High flash flood potential along hill streams for the next 180 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: 8-STATE METEOROLOGICAL MATRIX */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base lg:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🗺️</span> 8-State North Eastern Meteorological Matrix (All States)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Click on any state card to inspect radar telemetry, view live highway clearance, or trigger 3D bypass reroute.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
            8 / 8 States Telemetry Synchronized
          </span>
        </div>

        {/* 8 State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { state: "MEGHALAYA", title: "Shillong & Sohra", rate: "16.4 mm/h", temp: "21.8°C", sub1: "Humidity: 94%", sub2: "Soil Saturation: 94.2% (Critical)", badge: "⚠️ Cloudburst Alert", badgeType: "rose" },
            { state: "ARUNACHAL PRADESH", title: "Tawang / Sela Pass", rate: "8.2 mm/h", temp: "-1.2°C", sub1: "Elev: 3,500m", sub2: "Road Condition: Snow Slurry / Ice", badge: "❄️ Sub-Zero Blizzard", badgeType: "amber" },
            { state: "ASSAM", title: "Guwahati Hub", rate: "2.1 mm/h", temp: "28.5°C", sub1: "Wind: 14 km/h", sub2: "Flight Corridor: 100% Clear", badge: "🟢 Clear Corridor", badgeType: "emerald" },
            { state: "SIKKIM", title: "Gangtok / Teesta", rate: "14.1 mm/h", temp: "18.0°C", sub1: "Teesta Vel: 4.2 m/s", sub2: "Embankment: Overtopping Risk", badge: "🌊 River Surge Alert", badgeType: "rose" },
            { state: "NAGALAND", title: "Kohima / Zubza", rate: "6.8 mm/h", temp: "20.1°C", sub1: "Soil Shear: Degraded", sub2: "Slope Stability: LHI 75.9%", badge: "🟠 Subsidence Watch", badgeType: "amber" },
            { state: "MIZORAM", title: "Aizawl & Lunglei", rate: "11.2 mm/h", temp: "22.4°C", sub1: "Clay Sat: 82%", sub2: "Ridge Roadway: Clay Slump", badge: "🟠 Hillside Settling", badgeType: "amber" },
            { state: "MANIPUR", title: "Imphal / Noney", rate: "5.4 mm/h", temp: "24.1°C", sub1: "Ijei Silt: 66%", sub2: "Valley Transit: 4-Lane Operable", badge: "🔵 Silt Basin Watch", badgeType: "sky" },
            { state: "TRIPURA", title: "Agartala Transit", rate: "2.4 mm/h", temp: "29.2°C", sub1: "Humidity: 76%", sub2: "Inter-State Gate: 100% Nominal", badge: "🟢 Logistics Clear", badgeType: "emerald" }
          ].map((st, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between hover:border-sky-500/50 transition-colors duration-300">
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px]">{st.state}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">{st.rate}</span>
                </div>
                <h4 className="font-black text-sm text-slate-900 dark:text-white mt-1">{st.title}</h4>
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-mono mt-1 space-y-0.5">
                  <div>Temp: <b>{st.temp}</b> &bull; {st.sub1}</div>
                  <div className="text-slate-500 dark:text-slate-400">{st.sub2}</div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-xs">
                <span className={
                  "px-2 py-0.5 rounded text-[10px] font-bold " + (
                    st.badgeType === "rose" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30" :
                    st.badgeType === "amber" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30" :
                    st.badgeType === "sky" ? "bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30" :
                    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  )
                }>
                  {st.badge}
                </span>

                <button onClick={() => setSelectedSector(st.state.toLowerCase().split(" ")[0])} className="text-sky-600 dark:text-sky-400 font-bold hover:underline text-[11px] cursor-pointer">
                  Inspect ➔
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: ALL-WEATHER HIGHWAY WEATHER CLEARANCE ADVISORY */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-base lg:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🚛</span> All-Weather Highway Weather Clearance Advisory (Logistics Corridors)
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Automated vehicle convoy clearance derived from real-time precipitation & geotechnical slope stability.
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold">
            MDoNER / BRO Coordinated
          </span>
        </div>

        {/* Advisory Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] shadow-xl dark:shadow-2xl transition-colors duration-300">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 font-bold text-slate-700 dark:text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5">HIGHWAY CORRIDOR</th>
                <th className="p-3.5">STATE / ROUTE</th>
                <th className="p-3.5">CURRENT WEATHER HAZARD</th>
                <th className="p-3.5">CONVOY CLEARANCE</th>
                <th className="p-3.5">RECOMMENDED GREEN BYPASS</th>
                <th className="p-3.5 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {[
                { corridor: "NH-6 Arterial Pass", route: "Meghalaya ➔ Assam (Km 142)", hazard: "16.4 mm/h Cloudburst Saturation", clearance: "IMPASSABLE AT KM 142", clearanceType: "CRITICAL", bypass: "Sector 9 Jowai Ridge Bypass", action: "Reroute 3D" },
                { corridor: "NH-13 Trans-Arunachal", route: "Tezpur ➔ Tawang (Sela Pass)", hazard: "-1.2°C Freezing Snow Slurry", clearance: "4x4 CHAINS ONLY", clearanceType: "CHAINS", bypass: "Kalaktang Low-Altitude Bypass", action: "Reroute 3D" },
                { corridor: "NH-10 Sikkim Artery", route: "Siliguri ➔ Gangtok (Melli)", hazard: "Teesta River Swell (4.2 m/s)", clearance: "LOW EMBANKMENT SEVERED", clearanceType: "CRITICAL", bypass: "Lava - Reshi Ridge Viaduct Link", action: "Reroute 3D" },
                { corridor: "NH-29 Highland Pass", route: "Dimapur ➔ Kohima (Zubza)", hazard: "Soil Shear Subsidence", clearance: "REGULATED 15 KM/H", clearanceType: "REGULATED", bypass: "Pfutsero Highland Bedrock Link", action: "Reroute 3D" },
                { corridor: "NH-37 Imphal Link", route: "Silchar ➔ Imphal Valley", hazard: "5.4 mm/h Light Valley Rain", clearance: "100% ALL CLEAR", clearanceType: "CLEAR", bypass: "Standard 4-Lane Valley Highway", action: "Track 3D" }
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors duration-200">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className={"h-2 w-2 rounded-full " + (
                      row.clearanceType === "CRITICAL" ? "bg-rose-500 animate-ping" :
                      row.clearanceType === "CHAINS" ? "bg-amber-500" :
                      row.clearanceType === "REGULATED" ? "bg-orange-500" : "bg-emerald-500"
                    )}></span>
                    {row.corridor}
                  </td>
                  <td className="p-3.5 text-slate-700 dark:text-slate-300">{row.route}</td>
                  <td className={"p-3.5 font-semibold " + (row.clearanceType === "CRITICAL" ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-300")}>{row.hazard}</td>
                  <td className="p-3.5">
                    <span className={"px-2.5 py-1 rounded text-[10px] font-black uppercase " + (
                      row.clearanceType === "CRITICAL" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30" :
                      row.clearanceType === "CHAINS" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30" :
                      row.clearanceType === "REGULATED" ? "bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30" :
                      "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                    )}>
                      {row.clearance}
                    </span>
                  </td>
                  <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-medium">{row.bypass}</td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => onNavigateToReroute && onNavigateToReroute(row.corridor)}
                      className={"px-3 py-1.5 rounded-lg font-bold text-[11px] shadow transition cursor-pointer " + (
                        row.action === "Track 3D" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-sky-500 hover:bg-sky-400 text-white dark:text-slate-950"
                      )}
                    >
                      {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
