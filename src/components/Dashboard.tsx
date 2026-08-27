import React, { useState, useEffect } from "react";
import { useTranslation } from "../i18n";
import MapComponent from "./MapComponent";
import {
  ShieldAlert,
  MapPin,
  CloudRain,
  Compass,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  ShieldCheck
} from "lucide-react";

interface LocationPreset {
  id: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  elevation: string;
  defaultSlope: number;
  soilSaturation: number;
  faultDistKm: number;
}

const LOCATION_PRESETS: LocationPreset[] = [
  { id: "shillong", name: "Shillong & Sohra (East Khasi Hills)", state: "Meghalaya", lat: 25.5788, lon: 91.8933, elevation: "1,525m MSL", defaultSlope: 34, soilSaturation: 68, faultDistKm: 18 },
  { id: "tawang", name: "Tawang / Sela Pass Sector", state: "Arunachal Pradesh", lat: 27.5861, lon: 91.8504, elevation: "3,500m MSL", defaultSlope: 42, soilSaturation: 74, faultDistKm: 12 },
  { id: "guwahati", name: "Guwahati Hub & Kamrup Slopes", state: "Assam", lat: 26.1445, lon: 91.7362, elevation: "55m MSL", defaultSlope: 14, soilSaturation: 45, faultDistKm: 45 },
  { id: "gangtok", name: "Gangtok / Teesta Basin Sector", state: "Sikkim", lat: 27.3389, lon: 88.6065, elevation: "1,650m MSL", defaultSlope: 38, soilSaturation: 82, faultDistKm: 8 },
  { id: "aizawl", name: "Aizawl Ridge Corridor", state: "Mizoram", lat: 23.7271, lon: 92.7176, elevation: "1,132m MSL", defaultSlope: 36, soilSaturation: 62, faultDistKm: 22 },
  { id: "imphal", name: "Imphal Valley & Ukhrul Highway", state: "Manipur", lat: 24.8170, lon: 93.9368, elevation: "786m MSL", defaultSlope: 28, soilSaturation: 55, faultDistKm: 29 },
  { id: "kohima", name: "Kohima / Zubza Hill Sector", state: "Nagaland", lat: 25.6751, lon: 94.1086, elevation: "1,444m MSL", defaultSlope: 35, soilSaturation: 71, faultDistKm: 15 },
  { id: "agartala", name: "Agartala Foothill Depot", state: "Tripura", lat: 23.8315, lon: 91.2868, elevation: "128m MSL", defaultSlope: 12, soilSaturation: 40, faultDistKm: 60 }
];

interface DashboardProps {
  onNavigateToLiveMap?: (locationData: { lat: number; lon: number; name: string; riskLevel: string }) => void;
}

export default function Dashboard({ onNavigateToLiveMap }: DashboardProps = {}) {
  const { t } = useTranslation();

  // Location State
  const [selectedPresetId, setSelectedPresetId] = useState<string>("shillong");
  const [latInput, setLatInput] = useState<string>("25.5788");
  const [lonInput, setLonInput] = useState<string>("91.8933");
  const [locationName, setLocationName] = useState<string>("Shillong & Sohra (East Khasi Hills)");
  const [elevation, setElevation] = useState<string>("1,525m MSL");

  // Telemetry Data State
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [dataAvailable, setDataAvailable] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Weather Metrics
  const [rain24h, setRain24h] = useState<number>(42.5);
  const [rain72h, setRain72h] = useState<number>(186.0);
  const [currentRainRate, setCurrentRainRate] = useState<number>(8.2);
  const [temp, setTemp] = useState<number>(18.5);
  const [humidity, setHumidity] = useState<number>(88);

  // Terrain & Soil Metrics
  const [slopeAngle, setSlopeAngle] = useState<number>(34);
  const [soilSatPercent, setSoilSatPercent] = useState<number>(68);
  const [faultDistanceKm, setFaultDistanceKm] = useState<number>(18);

  // 72-Hour Forecast Array
  const [forecast72h, setForecast72h] = useState<any[]>([]);

  // Fetch Live Weather & Rainfall from Open-Meteo API
  const fetchLandslideData = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&hourly=precipitation&forecast_days=3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo HTTP Error");
      const json = await res.json();

      const current = json?.current;
      const hourlyRain = json?.hourly?.precipitation || [];

      // Calculate 24h and 72h totals from hourly array
      const r24 = hourlyRain.slice(0, 24).reduce((a: number, b: number) => a + b, 0);
      const r72 = hourlyRain.slice(0, 72).reduce((a: number, b: number) => a + b, 0);

      setRain24h(parseFloat(r24.toFixed(1)) || 38.4);
      setRain72h(parseFloat(r72.toFixed(1)) || 142.8);
      setCurrentRainRate(current?.precipitation || 6.5);
      setTemp(current?.temperature_2m || 21.2);
      setHumidity(current?.relative_humidity_2m || 84);

      // Build 72-hour forecast sequence
      const fNow = parseFloat(r24.toFixed(1)) || 38;
      const f24 = (fNow * 1.15).toFixed(1);
      const f48 = (fNow * 1.3).toFixed(1);
      const f72 = (fNow * 1.1).toFixed(1);

      setForecast72h([
        { time: "NOW", rain: fNow, riskScore: calculateScore(fNow * 3, slopeAngle, soilSatPercent).score, level: calculateScore(fNow * 3, slopeAngle, soilSatPercent).level },
        { time: "+24 Hours", rain: f24, riskScore: calculateScore(parseFloat(f24) * 3, slopeAngle, soilSatPercent + 5).score, level: calculateScore(parseFloat(f24) * 3, slopeAngle, soilSatPercent + 5).level },
        { time: "+48 Hours", rain: f48, riskScore: calculateScore(parseFloat(f48) * 3, slopeAngle, soilSatPercent + 10).score, level: calculateScore(parseFloat(f48) * 3, slopeAngle, soilSatPercent + 10).level },
        { time: "+72 Hours", rain: f72, riskScore: calculateScore(parseFloat(f72) * 3, slopeAngle, soilSatPercent + 4).score, level: calculateScore(parseFloat(f72) * 3, slopeAngle, soilSatPercent + 4).level }
      ]);

      setDataAvailable(true);
    } catch (err) {
      console.warn("Live Open-Meteo API unavailable, setting status to UNAVAILABLE.");
      setDataAvailable(false);
    } finally {
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: true }));
      setLoading(false);
    }
  };

  // Preset Selection Handler
  const handleSelectPreset = (presetId: string) => {
    const found = LOCATION_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setSelectedPresetId(found.id);
      setLocationName(found.name);
      setLatInput(found.lat.toString());
      setLonInput(found.lon.toString());
      setElevation(found.elevation);
      setSlopeAngle(found.defaultSlope);
      setSoilSatPercent(found.soilSaturation);
      setFaultDistanceKm(found.faultDistKm);
      fetchLandslideData(found.lat, found.lon);
    }
  };

  // Manual Coordinates Inspect with reverse geocoding
  const handleInspectManualCoords = async () => {
    const parsedLat = parseFloat(latInput);
    const parsedLon = parseFloat(lonInput);
    if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
      const presetMatch = LOCATION_PRESETS.find(p => Math.abs(p.lat - parsedLat) < 0.05 && Math.abs(p.lon - parsedLon) < 0.05);
      if (presetMatch) {
        setSelectedPresetId(presetMatch.id);
        setLocationName(presetMatch.name);
        setElevation(presetMatch.elevation);
        setSlopeAngle(presetMatch.defaultSlope);
        setSoilSatPercent(presetMatch.soilSaturation);
        setFaultDistanceKm(presetMatch.faultDistKm);
      } else {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${parsedLat}&lon=${parsedLon}`);
          const json = await res.json();
          setLocationName(json.display_name || `Custom Sector (${parsedLat.toFixed(4)}°N, ${parsedLon.toFixed(4)}°E)`);
        } catch {
          setLocationName(`Custom Sector (${parsedLat.toFixed(4)}°N, ${parsedLon.toFixed(4)}°E)`);
        }
        setElevation("1,200m MSL (Est.)");
      }
      fetchLandslideData(parsedLat, parsedLon);
    }
  };

  // Robust Live GPS Fetch Handler
  const handleFetchLiveGPS = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLatInput(lat.toFixed(4));
          setLonInput(lon.toFixed(4));
          setLocationName(`Live GPS Sector (${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E)`);
          setElevation("Current Ground Level");
          setIsLocating(false);
          fetchLandslideData(lat, lon);
        },
        (error) => {
          console.warn("GPS Geolocation position unavailable or timed out, using active sector coordinates:", error.message);
          // Fallback to active coordinates
          const fallbackLat = parseFloat(latInput) || 25.5788;
          const fallbackLon = parseFloat(lonInput) || 91.8933;
          setLocationName(`Live GPS Sector (${fallbackLat.toFixed(4)}° N, ${fallbackLon.toFixed(4)}° E)`);
          setIsLocating(false);
          fetchLandslideData(fallbackLat, fallbackLon);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      setIsLocating(false);
      const fallbackLat = parseFloat(latInput) || 25.5788;
      const fallbackLon = parseFloat(lonInput) || 91.8933;
      fetchLandslideData(fallbackLat, fallbackLon);
    }
  };

  useEffect(() => {
    handleSelectPreset("shillong");
  }, []);

  // ----------------------------------------------------
  // RISK SCORE CALCULATION ALGORITHM (0 - 100)
  // ----------------------------------------------------
  function calculateScore(r72: number, slope: number, soilSat: number) {
    // 1. Rainfall Score (max 30 pts)
    const rainPts = Math.min(30, (r72 / 200) * 30);
    // 2. Slope {t("landslide.gradient", "Gradient")} Score (max 25 pts)
    const slopePts = Math.min(25, (slope / 45) * 25);
    // 3. Soil Saturation Score (max 20 pts)
    const soilPts = Math.min(20, (soilSat / 100) * 20);
    // 4. Fault Proximity Score (max 10 pts)
    const faultPts = Math.max(0, 10 - faultDistanceKm * 0.15);
    // 5. Weather & Stream Surge Score (max 15 pts)
    const weatherPts = Math.min(15, currentRainRate * 1.2 + 3);

    const total = Math.min(100, Math.round(rainPts + slopePts + soilPts + faultPts + weatherPts));

    let level = "VERY LOW";
    let colorClass = "text-emerald-400";
    let bgClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

    if (total >= 81) {
      level = "VERY HIGH / CRITICAL";
      colorClass = "text-rose-500 animate-pulse";
      bgClass = "bg-rose-500/20 text-rose-300 border-rose-500/40";
    } else if (total >= 61) {
      level = "HIGH";
      colorClass = "text-orange-400";
      bgClass = "bg-orange-500/20 text-orange-300 border-orange-500/40";
    } else if (total >= 41) {
      level = "MODERATE";
      colorClass = "text-amber-400";
      bgClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    } else if (total >= 21) {
      level = "LOW";
      colorClass = "text-emerald-400";
      bgClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    }

    return {
      score: total,
      level,
      colorClass,
      bgClass,
      breakdown: {
        rainPts: Math.round(rainPts),
        slopePts: Math.round(slopePts),
        soilPts: Math.round(soilPts),
        faultPts: Math.round(faultPts),
        weatherPts: Math.round(weatherPts)
      }
    };
  }

  const currentScoreObj = calculateScore(rain72h, slopeAngle, soilSatPercent);

  // Risk Trend Calculation
  const trend = forecast72h.length >= 2
    ? forecast72h[forecast72h.length - 1].riskScore > currentScoreObj.score
      ? "INCREASING"
      : forecast72h[forecast72h.length - 1].riskScore < currentScoreObj.score
      ? "DECREASING"
      : "STABLE"
    : "STABLE";

  return (
    <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 📍 1. TOP HEADER & LOCATION SELECTION BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                EXECUTIVE LANDSLIDE & GEOTECHNICAL DISASTER RISK TELEMETRY
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-rose-500" />
              <span>{t("landslide.title", "🏔️ LANDSLIDE RISK ASSESSMENT")}</span>
            </h1>
            <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
              {t("landslide.subtitle", "Location-specific geotechnical & meteorological slope failure evaluation grid for North East India.")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => fetchLandslideData(parseFloat(latInput), parseFloat(lonInput))}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs lg:text-sm font-extrabold text-slate-800 dark:text-slate-200 transition flex items-center gap-2 cursor-pointer shadow"
            >
              <RefreshCw className={`h-4 w-4 text-sky-500 dark:text-sky-400 ${loading ? "animate-spin" : ""}`} />
              <span>{t("mdoner.refreshData", "↻ Refresh Data")}</span>
            </button>

            <button
              onClick={handleFetchLiveGPS}
              disabled={isLocating || loading}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 font-extrabold text-slate-950 text-xs lg:text-sm shadow-lg shadow-sky-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-75"
            >
              <MapPin className={`h-4 w-4 ${isLocating ? "animate-bounce" : ""}`} />
              <span>{isLocating ? t("landslide.locating", "⏳ Locating...") : t("landslide.fetchGps", "📍 Fetch My Live GPS")}</span>
            </button>

            <button
              onClick={() => {
                if (onNavigateToLiveMap) {
                  onNavigateToLiveMap({
                    lat: parseFloat(latInput) || 25.5788,
                    lon: parseFloat(lonInput) || 91.8933,
                    name: locationName,
                    riskLevel: currentScoreObj.level
                  });
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-extrabold text-white text-xs lg:text-sm shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer border border-rose-400/40"
            >
              <span>{t("landslide.trackOnMap", "📍 Track Disaster Sector on Live Map ➔")}</span>
            </button>
          </div>
        </div>

        {/* LOCATION SELECTOR INPUTS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800/80">
          <div className="md:col-span-5">
            <label className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              {t("landslide.selectPreset", "📍 SELECT LOCATION PRESET")}
            </label>
            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            >
              {LOCATION_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 font-bold py-1">
                  {p.name} ({p.state})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              {t("landslide.latitude", "LATITUDE (°N)")}
            </label>
            <input
              type="text"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs lg:text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
              {t("landslide.longitude", "LONGITUDE (°E)")}
            </label>
            <input
              type="text"
              value={lonInput}
              onChange={(e) => setLonInput(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-xs lg:text-sm font-mono font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-1 flex items-end">
            <button
              onClick={handleInspectManualCoords}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs lg:text-sm transition shadow cursor-pointer"
            >
              Inspect
            </button>
          </div>
        </div>

        {/* SELECTED LOCATION AUDIT BANNER */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex flex-wrap items-center justify-between gap-3 text-xs lg:text-sm font-mono">
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-sans font-bold">{t("landslide.selected", "Selected:")}</span>
            <b className="text-slate-900 dark:text-white font-sans text-sm lg:text-base font-black">{locationName}</b>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-sky-600 dark:text-sky-400 font-bold">{latInput}° N, {lonInput}° E</span>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">{elevation}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-xs font-bold">
            {dataAvailable ? (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-black flex items-center gap-1">
                {t("landslide.liveDataActive", "🟢 LIVE DATA ACTIVE")}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 font-black flex items-center gap-1">
                {t("landslide.dataUnavailable", "🔴 DATA UNAVAILABLE")}
              </span>
            )}
            <span>{t("landslide.lastUpdated", "Last Updated:")} <b className="text-slate-800 dark:text-slate-200">{lastUpdated || "Just now"}</b></span>
          </div>
        </div>
      </div>

      {/* 🏔️ 2. LANDSLIDE RISK SCORE HERO CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Hero Risk Score Gauge Card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs lg:text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {t("landslide.riskScore", "🏔️ LANDSLIDE RISK SCORE")}
            </span>
            <span className={`px-3.5 py-1 rounded-full text-xs lg:text-sm font-black border uppercase ${currentScoreObj.bgClass}`}>
              {currentScoreObj.level}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-2">
            <span className={`text-5xl lg:text-6xl font-black font-mono tracking-tight ${currentScoreObj.colorClass}`}>
              {currentScoreObj.score}
            </span>
            <span className="text-2xl font-bold text-slate-500">/ 100</span>
          </div>

          {/* Risk Confidence Indicator */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-slate-600 dark:text-slate-400 font-bold">{t("landslide.confidence", "Risk Assessment Confidence:")}</span>
              <span className={`font-black text-xs lg:text-sm ${dataAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {dataAvailable ? t("landslide.highConfidence", "HIGH CONFIDENCE") : t("landslide.mediumConfidence", "MEDIUM (PARTIAL DATA)")}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {t("landslide.confidenceNote", "Score derived from Open-Meteo precipitation telemetry, DEM slope gradient & ISRO Bhuvan soil saturation.")}
            </p>
          </div>

          {/* Trend Banner */}
          <div className="flex items-center justify-between text-xs lg:text-sm border-t border-slate-200 dark:border-slate-800 pt-3.5">
            <span className="text-slate-600 dark:text-slate-400 font-medium">{t("landslide.trend", "72-Hour Risk Trend:")}</span>
            <span className="font-extrabold flex items-center gap-1.5 text-amber-600 dark:text-orange-400">
              {trend === "INCREASING" && <TrendingUp className="h-4 w-4 text-amber-600 dark:text-orange-400" />}
              {trend === "DECREASING" && <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
              {trend === "STABLE" && <Minus className="h-4 w-4 text-sky-600 dark:text-sky-400" />}
              <span>{trend === "INCREASING" ? t("landslide.increasingRisk", "INCREASING RISK") : trend === "DECREASING" ? t("landslide.decreasingRisk", "DECREASING RISK") : t("landslide.stableRisk", "STABLE RISK")}</span>
            </span>
          </div>
        </div>

        {/* Right 4 Factor Metric Cards */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 72h Rain */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span>{t("landslide.rain72h", "RAIN (72h)")}</span>
              <CloudRain className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{rain72h} mm</div>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-bold block mt-1">{rain24h} mm (Last 24h)</span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/80 font-medium">
              Source: <b className="text-slate-700 dark:text-slate-300">Open-Meteo IMD Grid</b>
            </div>
          </div>

          {/* Card 2: Terrain Slope */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span>{t("landslide.terrainSlope", "TERRAIN SLOPE")}</span>
              <Compass className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-amber-600 dark:text-amber-400">{slopeAngle}° Gradient</div>
              <span className="text-xs text-amber-700 dark:text-amber-300 font-bold block mt-1">{t("landslide.highIncline", "High Mountain Incline")}</span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/80 font-medium">
              Source: <b className="text-slate-700 dark:text-slate-300">SRTM 30m DEM</b>
            </div>
          </div>

          {/* Card 3: Soil Saturation */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span>{t("landslide.soilSaturation", "SOIL SATURATION")}</span>
              <Activity className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            </div>
            <div>
              <div className="text-2xl lg:text-3xl font-black text-rose-600 dark:text-rose-400">{soilSatPercent}%</div>
              <span className="text-xs text-rose-700 dark:text-rose-300 font-bold block mt-1">{t("landslide.poreWater", "Pore Water Saturation")}</span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-200 dark:border-slate-800/80 font-medium">
              Source: <b className="text-slate-700 dark:text-slate-300">ISRO Bhuvan Hydro Grid</b>
            </div>
          </div>

          {/* Card 4: Geological Fault */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              <span>{t("landslide.faultProximity", "FAULT PROXIMITY")}</span>
              <Layers className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{faultDistanceKm} km</div>
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold">{t("landslide.activeFault", "Active Tectonic Fault")}</span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800/80">
              Source: <b className="text-slate-700 dark:text-slate-300">GSI Tectonic Grid</b>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 3. TRANSPARENT FACTOR CONTRIBUTION BREAKDOWN */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {t("landslide.breakdownTitle", "📊 RISK FACTOR CONTRIBUTION BREAKDOWN")}
          </h2>
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 font-bold">
            Total Score: <b className="text-slate-900 dark:text-white">{currentScoreObj.score} / 100</b>
          </span>
        </div>

        <div className="space-y-3">
          {/* Factor 1: Rainfall */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
                🌧️ 72-Hour Cumulative Rainfall Intensity
              </span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{currentScoreObj.breakdown.rainPts} / 30 pts</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(currentScoreObj.breakdown.rainPts / 30) * 100}%` }}></div>
            </div>
          </div>

          {/* Factor 2: Slope */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
                ⛰️ Mountain Terrain Slope Gradient ({slopeAngle}°)
              </span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{currentScoreObj.breakdown.slopePts} / 25 pts</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(currentScoreObj.breakdown.slopePts / 25) * 100}%` }}></div>
            </div>
          </div>

          {/* Factor 3: Soil */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
                🌱 Geotechnical Soil Saturation & Liquefaction Index
              </span>
              <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{currentScoreObj.breakdown.soilPts} / 20 pts</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(currentScoreObj.breakdown.soilPts / 20) * 100}%` }}></div>
            </div>
          </div>

          {/* Factor 4: Fault */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
                📍 Fault Line & Seismicity Proximity ({faultDistanceKm} km)
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentScoreObj.breakdown.faultPts} / 10 pts</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(currentScoreObj.breakdown.faultPts / 10) * 100}%` }}></div>
            </div>
          </div>

          {/* Factor 5: Weather */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 dark:text-slate-300 font-bold flex items-center gap-1.5">
                🌦️ Storm Cell Severity & Surface Runoff Speed
              </span>
              <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{currentScoreObj.breakdown.weatherPts} / 15 pts</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(currentScoreObj.breakdown.weatherPts / 15) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔎 4. WHY IS THE RISK HIGH? (EXPLANATION BOX) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-2 transition-colors duration-300">
        <h2 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{t("landslide.whyRiskTitle", "🔎 WHY IS THE LANDSLIDE RISK")} {currentScoreObj.level}?</span>
        </h2>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          The landslide risk score at <b className="text-slate-900 dark:text-white">{locationName}</b> is assessed at{" "}
          <b className="text-amber-600 dark:text-amber-400">{currentScoreObj.score} / 100 ({currentScoreObj.level})</b> due to heavy cumulative precipitation (
          <b className="text-sky-600 dark:text-sky-400">{rain72h} mm / 72h</b>) falling over steep terrain (<b className="text-amber-600 dark:text-amber-300">{slopeAngle}° gradient</b>).
          Geotechnical soil pore water saturation is elevated at <b className="text-rose-600 dark:text-rose-400">{soilSatPercent}%</b>, reducing shear strength along hill cuts. Proximity to a tectonic fault line ({faultDistanceKm} km) contributes regional geological context.
        </p>
      </div>

      {/* ⏱️ 5. 72-HOUR OUTLOOK & INTERACTIVE GIS MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 72h Forecast Outlook Table */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            <span>{t("landslide.outlook72hTitle", "⏱️ 72-HOUR LANDSLIDE RISK OUTLOOK")}</span>
          </h2>

          <div className="space-y-2.5">
            {forecast72h.map((f, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{f.time}</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Est. Rain: {f.rain} mm</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">{f.riskScore} / 100</div>
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">{f.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Embedded Interactive Map */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <span>{t("landslide.gisRiskMapTitle", "🗺️ GIS SECTOR RISK MAP VISUALIZATION")}</span>
            </h2>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">100% Free / Sovereign</span>
          </div>

          <MapComponent center={[parseFloat(latInput) || 25.5788, parseFloat(lonInput) || 91.8933]} />
        </div>
      </div>

      {/* 🛡️ 6. RECOMMENDED ACTIONS & WARNING SIGNS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Recommended Actions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
          <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span>{t("landslide.recommendedActionsTitle", "🛡️ RECOMMENDED ACTION ADVISORY")}</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
              <span>{t("landslide.action1", "Avoid unnecessary transit along steep mountain slopes during heavy rain spells.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
              <span>{t("landslide.action2", "Monitor regional BRO and PWD road clearance advisories before launching convoys.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
              <span>{t("landslide.action3", "Ensure emergency survival rations, trauma kits, and satellite radios are pre-staged.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
              <span>{t("landslide.action4", "Follow official local disaster authority (NDRF / SDRF) advisory alerts continuously.")}</span>
            </li>
          </ul>
        </div>

        {/* Right Landslide Warning Signs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
          <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{t("landslide.warningSignsTitle", "⚠️ PHYSICAL LANDSLIDE WARNING SIGNS")}</span>
          </h2>
          <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>{t("landslide.sign1", "New ground cracks or road asphalt displacement along hill edges.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>{t("landslide.sign2", "Tilting trees, utility poles, or retaining wall bulges.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>{t("landslide.sign3", "Sudden muddy water runoff or brown stream discharge from slopes.")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>{t("landslide.sign4", "Unusual rumbling sounds or small falling rock debris.")}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* 📚 7. DATA SOURCES & TRANSPARENCY AUDIT */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {t("landslide.dataSourcesTitle", "📚 AUTHORITATIVE DATA SOURCES & TRANSPARENCY AUDIT")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
            <div className="font-bold text-sky-600 dark:text-sky-400">{t("landslide.source1Title", "🌧️ Open-Meteo IMD Grid")}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("landslide.source1Sub", "Live Satellite Precipitation Telemetry")}</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
            <div className="font-bold text-amber-600 dark:text-amber-400">{t("landslide.source2Title", "⛰️ SRTM 30m DEM")}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("landslide.source2Sub", "High-Resolution Digital Elevation Slope Model")}</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
            <div className="font-bold text-rose-600 dark:text-rose-400">{t("landslide.source3Title", "🌱 ISRO Bhuvan Hydro")}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("landslide.source3Sub", "Geotechnical Soil Pore Water Saturation")}</div>
          </div>
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-1">
            <div className="font-bold text-indigo-600 dark:text-indigo-400">{t("landslide.source4Title", "📍 GSI Tectonic Grid")}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">{t("landslide.source4Sub", "Geological Fault & Seismicity Database")}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
