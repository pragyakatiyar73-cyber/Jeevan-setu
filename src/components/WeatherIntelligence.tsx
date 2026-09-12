import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../i18n";
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
  Radio,
  Thermometer,
  Droplets,
  Wind,
  ShieldCheck,
  Search,
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  Globe,
  Clock,
  ArrowUpRight
} from "lucide-react";

import {
  getLiveWeather,
  WeatherData,
  DailyForecastDay
} from "../services/api/weather";
import { isPointInNER } from "../utils/nerBoundary";

interface WeatherIntelligenceProps {
  onNavigateToMap?: () => void;
  onNavigateToReroute?: (corridor?: string) => void;
  onTriggerSOS?: () => void;
}

export interface NERLocationItem {
  name: string;
  district: string;
  state: 'Arunachal Pradesh' | 'Assam' | 'Manipur' | 'Meghalaya' | 'Mizoram' | 'Nagaland' | 'Sikkim' | 'Tripura';
  lat: number;
  lon: number;
  altitude?: string;
}

// 🏞️ Master 8 North Eastern Region (NER) States & Major Districts/Cities Dataset
export const NER_WEATHER_LOCATIONS: Record<string, NERLocationItem[]> = {
  "Arunachal Pradesh": [
    { name: "Itanagar", district: "Papum Pare", state: "Arunachal Pradesh", lat: 27.0844, lon: 93.6053, altitude: "320m" },
    { name: "Tawang / Sela Pass", district: "Tawang", state: "Arunachal Pradesh", lat: 27.5861, lon: 91.8504, altitude: "3,500m" },
    { name: "Pasighat", district: "East Siang", state: "Arunachal Pradesh", lat: 28.0660, lon: 95.3262, altitude: "155m" },
    { name: "Ziro", district: "Lower Subansiri", state: "Arunachal Pradesh", lat: 27.5947, lon: 93.8385, altitude: "1,568m" },
    { name: "Bomdila", district: "West Kameng", state: "Arunachal Pradesh", lat: 27.2642, lon: 92.4159, altitude: "2,217m" },
    { name: "Changlang", district: "Changlang", state: "Arunachal Pradesh", lat: 27.1268, lon: 95.7337, altitude: "580m" }
  ],
  "Assam": [
    { name: "Guwahati", district: "Kamrup Metropolitan", state: "Assam", lat: 26.1445, lon: 91.7362, altitude: "55m" },
    { name: "Dispur", district: "Kamrup Metropolitan", state: "Assam", lat: 26.1433, lon: 91.7898, altitude: "55m" },
    { name: "Dibrugarh", district: "Dibrugarh", state: "Assam", lat: 27.4728, lon: 94.9120, altitude: "108m" },
    { name: "Silchar", district: "Cachar", state: "Assam", lat: 24.8333, lon: 92.7789, altitude: "22m" },
    { name: "Tezpur", district: "Sonitpur", state: "Assam", lat: 26.6338, lon: 92.8006, altitude: "48m" },
    { name: "Jorhat", district: "Jorhat", state: "Assam", lat: 26.7509, lon: 94.2037, altitude: "116m" },
    { name: "Lakhimpur", district: "Lakhimpur", state: "Assam", lat: 27.2366, lon: 94.1037, altitude: "101m" },
    { name: "Nagaon", district: "Nagaon", state: "Assam", lat: 26.3462, lon: 92.6840, altitude: "63m" }
  ],
  "Manipur": [
    { name: "Imphal", district: "Imphal West", state: "Manipur", lat: 24.8170, lon: 93.9368, altitude: "786m" },
    { name: "Churachandpur", district: "Churachandpur", state: "Manipur", lat: 24.3333, lon: 93.6833, altitude: "914m" },
    { name: "Ukhrul", district: "Ukhrul", state: "Manipur", lat: 25.1167, lon: 94.3667, altitude: "1,662m" },
    { name: "Tamenglong", district: "Tamenglong", state: "Manipur", lat: 24.9833, lon: 93.4833, altitude: "1,260m" },
    { name: "Senapati", district: "Senapati", state: "Manipur", lat: 25.2667, lon: 94.0167, altitude: "1,100m" }
  ],
  "Meghalaya": [
    { name: "Shillong", district: "East Khasi Hills", state: "Meghalaya", lat: 25.5788, lon: 91.8933, altitude: "1,525m" },
    { name: "Sohra (Cherrapunji)", district: "East Khasi Hills", state: "Meghalaya", lat: 25.2702, lon: 91.7323, altitude: "1,430m" },
    { name: "Mawsynram", district: "East Khasi Hills", state: "Meghalaya", lat: 25.2986, lon: 91.5822, altitude: "1,400m" },
    { name: "Tura", district: "West Garo Hills", state: "Meghalaya", lat: 25.5142, lon: 90.2032, altitude: "349m" },
    { name: "Jowai", district: "West Jaintia Hills", state: "Meghalaya", lat: 25.4452, lon: 92.2081, altitude: "1,380m" },
    { name: "Nongpoh", district: "Ri-Bhoi", state: "Meghalaya", lat: 25.9038, lon: 91.8812, altitude: "485m" }
  ],
  "Mizoram": [
    { name: "Aizawl", district: "Aizawl", state: "Mizoram", lat: 23.7271, lon: 92.7176, altitude: "1,132m" },
    { name: "Lunglei", district: "Lunglei", state: "Mizoram", lat: 22.8841, lon: 92.7347, altitude: "722m" },
    { name: "Champhai", district: "Champhai", state: "Mizoram", lat: 23.4735, lon: 93.3276, altitude: "1,678m" },
    { name: "Serchhip", district: "Serchhip", state: "Mizoram", lat: 23.3086, lon: 92.8465, altitude: "888m" },
    { name: "Kolasib", district: "Kolasib", state: "Mizoram", lat: 24.2255, lon: 92.6789, altitude: "640m" }
  ],
  "Nagaland": [
    { name: "Kohima", district: "Kohima", state: "Nagaland", lat: 25.6751, lon: 94.1086, altitude: "1,444m" },
    { name: "Dimapur", district: "Dimapur", state: "Nagaland", lat: 25.9060, lon: 93.7270, altitude: "145m" },
    { name: "Mokokchung", district: "Mokokchung", state: "Nagaland", lat: 26.3262, lon: 94.5203, altitude: "1,325m" },
    { name: "Tuensang", district: "Tuensang", state: "Nagaland", lat: 26.2841, lon: 94.8315, altitude: "1,371m" },
    { name: "Wokha", district: "Wokha", state: "Nagaland", lat: 26.0984, lon: 94.2612, altitude: "1,314m" },
    { name: "Mon", district: "Mon", state: "Nagaland", lat: 26.7481, lon: 95.0594, altitude: "897m" }
  ],
  "Sikkim": [
    { name: "Gangtok", district: "East Sikkim", state: "Sikkim", lat: 27.3389, lon: 88.6065, altitude: "1,650m" },
    { name: "Mangan", district: "North Sikkim", state: "Sikkim", lat: 27.5020, lon: 88.5342, altitude: "1,160m" },
    { name: "Chungthang", district: "North Sikkim", state: "Sikkim", lat: 27.5800, lon: 88.6200, altitude: "1,790m" },
    { name: "Namchi", district: "South Sikkim", state: "Sikkim", lat: 27.1664, lon: 88.3639, altitude: "1,315m" },
    { name: "Geyzing", district: "West Sikkim", state: "Sikkim", lat: 27.2889, lon: 88.2361, altitude: "1,900m" }
  ],
  "Tripura": [
    { name: "Agartala", district: "West Tripura", state: "Tripura", lat: 23.8315, lon: 91.2868, altitude: "12m" },
    { name: "Udaipur", district: "Gomati", state: "Tripura", lat: 23.5333, lon: 91.4833, altitude: "22m" },
    { name: "Dharmanagar", district: "North Tripura", state: "Tripura", lat: 24.3667, lon: 92.1667, altitude: "33m" },
    { name: "Kailashahar", district: "Unakoti", state: "Tripura", lat: 24.3333, lon: 92.0167, altitude: "30m" },
    { name: "Belonia", district: "South Tripura", state: "Tripura", lat: 23.2500, lon: 91.4500, altitude: "23m" }
  ]
};

export default function WeatherIntelligence({
  onNavigateToMap,
  onNavigateToReroute,
  onTriggerSOS
}: WeatherIntelligenceProps) {
  const { t } = useTranslation();

  // State Selection
  const [selectedState, setSelectedState] = useState<string>("Assam");
  const [selectedLocation, setSelectedLocation] = useState<NERLocationItem>(NER_WEATHER_LOCATIONS["Assam"][0]);

  // Live Weather Telemetry State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  // Search Bar State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Status Banners
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);

  // Canvas Ref for Doppler Radar
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch Live Weather for Current Selected Coordinates
  const fetchWeather = async (loc: NERLocationItem) => {
    setIsLoading(true);
    setStatusToast(`📡 Fetching Open-Meteo live weather telemetry for ${loc.name}, ${loc.state}...`);
    
    try {
      const data = await getLiveWeather(loc.lat, loc.lon);
      setWeather(data);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      if (!data.isLive) {
        setStatusToast(data.error || "Weather data unavailable");
      } else {
        setStatusToast(`✓ Live weather synchronized for ${loc.name}`);
      }
    } catch (err: any) {
      console.error("Error loading weather telemetry:", err);
      setWeather({
        latitude: loc.lat,
        longitude: loc.lon,
        elevation: 0,
        temperature: 0,
        feelsLike: 0,
        relativeHumidity: 0,
        precipitation: 0,
        precipitationProbability: 0,
        rain: 0,
        weatherCode: 0,
        condition: 'Weather data unavailable',
        conditionIcon: 'Cloud',
        windSpeed: 0,
        windDirection: 0,
        windDirectionLabel: 'N/A',
        windGusts: 0,
        isSevereWeather: false,
        severeRiskLevel: 'NONE',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLive: false,
        error: 'Weather data unavailable'
      });
      setStatusToast("Weather data unavailable");
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusToast(null), 5000);
    }
  };

  // Trigger weather fetch when selectedLocation changes
  useEffect(() => {
    fetchWeather(selectedLocation);
  }, [selectedLocation]);

  // Handle State Dropdown Change
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const locations = NER_WEATHER_LOCATIONS[stateName] || [];
    if (locations.length > 0) {
      setSelectedLocation(locations[0]);
    }
  };

  // Handle Location Search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      if (res.ok) {
        const data = await res.json();
        const results = data?.results || [];
        // Pre-filter search results against NER boundary
        const nerResults = results.filter((r: any) => isPointInNER(r.latitude, r.longitude));
        setSearchResults(nerResults.length > 0 ? nerResults : [{ isOutofBounds: true, query }]);
      }
    } catch (err) {
      console.warn("Geocoding search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Selecting a Search Result
  const handleSelectSearchResult = (item: any) => {
    if (item.isOutofBounds) {
      setStatusToast(`⚠️ Location '${item.query}' is outside the 8 North Eastern Region (NER) states.`);
      setSearchResults([]);
      setSearchQuery("");
      setTimeout(() => setStatusToast(null), 6000);
      return;
    }

    if (!isPointInNER(item.latitude, item.longitude)) {
      setStatusToast(`⚠️ Location outside NER coverage.`);
      setSearchResults([]);
      setSearchQuery("");
      setTimeout(() => setStatusToast(null), 6000);
      return;
    }

    const customLoc: NERLocationItem = {
      name: item.name,
      district: item.admin1 || item.country || "NER Sector",
      state: (item.admin1 || "Assam") as any,
      lat: item.latitude,
      lon: item.longitude,
      altitude: item.elevation ? `${item.elevation}m` : undefined
    };

    setSelectedLocation(customLoc);
    setSearchResults([]);
    setSearchQuery("");
  };

  // Weather Icon Render Helper
  const renderWeatherIcon = (iconName?: string) => {
    const props = { className: "h-8 w-8 text-sky-400" };
    switch (iconName) {
      case 'Sun': return <Sun className="h-8 w-8 text-amber-400" />;
      case 'SunMedium': return <SunMedium className="h-8 w-8 text-amber-400" />;
      case 'CloudSun': return <CloudSun className="h-8 w-8 text-amber-300" />;
      case 'Cloud': return <Cloud className="h-8 w-8 text-slate-300" />;
      case 'CloudFog': return <CloudFog className="h-8 w-8 text-slate-400" />;
      case 'CloudDrizzle': return <CloudDrizzle className="h-8 w-8 text-sky-300" />;
      case 'CloudRain': return <CloudRain className="h-8 w-8 text-blue-400" />;
      case 'CloudRainWind': return <CloudRainWind className="h-8 w-8 text-blue-500" />;
      case 'CloudSnow': return <CloudSnow className="h-8 w-8 text-indigo-200" />;
      case 'CloudLightning': return <CloudLightning className="h-8 w-8 text-amber-500 animate-bounce" />;
      default: return <CloudRain {...props} />;
    }
  };

  // Canvas Doppler Radar Animation
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

  return (
    <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* SECTION 1: HEADER & STATUS TOAST */}
      <div className="space-y-4">
        {statusToast && (
          <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 dark:bg-sky-950/90 p-3 text-xs lg:text-sm font-bold text-sky-700 dark:text-sky-200 shadow-xl backdrop-blur flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping"></span>
              <span>{statusToast}</span>
            </div>
            <button onClick={() => setStatusToast(null)} className="text-sky-600 dark:text-sky-400 hover:text-white font-black text-sm">✕</button>
          </div>
        )}

        {/* Header Bar */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 lg:p-6 shadow-xl dark:shadow-2xl flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-colors duration-300 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Coverage Badge */}
              <span className="rounded-full bg-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 border border-sky-500/30">
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                Data Coverage: North Eastern Region — 8 States
              </span>

              {/* LIVE Status Badge */}
              {weather?.isLive ? (
                <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  Live Telemetry Active
                </span>
              ) : (
                <span className="rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5 border border-red-500/30">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                  {weather?.error || "Weather data unavailable"}
                </span>
              )}
            </div>

            <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-2.5">
              <span>🌧️</span> Weather Intelligence (Open-Meteo API)
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
              Real-time meteorological telemetry, precipitation, temperature, humidity, wind direction &amp; 7-day weather forecast scoped exclusively to the 8 North Eastern Region (NER) states.
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 relative">
            <div className="relative min-w-[240px]">
              <div className="flex items-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus-within:border-sky-500">
                <Search className="h-3.5 w-3.5 text-sky-500 shrink-0 mr-2" />
                <input
                  type="text"
                  placeholder="Search NER City/District..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-11 z-[2500] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-1.5 shadow-2xl max-h-48 overflow-y-auto space-y-1">
                  <div className="text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase px-1.5 py-0.5">NER Location Search:</div>
                  {searchResults.map((item, idx) => (
                    item.isOutofBounds ? (
                      <div key={`loc_err_${idx}`} className="p-2 text-xs text-red-400 font-bold bg-red-950/40 rounded-lg">
                        ⚠️ '{item.query}' is outside North Eastern Region coverage.
                      </div>
                    ) : (
                      <div
                        key={`loc_res_${idx}`}
                        onClick={() => handleSelectSearchResult(item)}
                        className="cursor-pointer rounded-lg p-2 text-xs hover:bg-sky-50 dark:hover:bg-sky-950/50 transition flex flex-col"
                      >
                        <span className="font-bold text-slate-900 dark:text-white">{item.name}{item.admin1 ? `, ${item.admin1}` : ''}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{item.latitude?.toFixed(2)}°N, {item.longitude?.toFixed(2)}°E</span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => fetchWeather(selectedLocation)}
              disabled={isLoading}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh Weather Telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: NER HIERARCHICAL STATE & DISTRICT SELECTOR BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        
        {/* State Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-sky-500" />
            <span>Select State:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(NER_WEATHER_LOCATIONS).map((stName) => (
              <button
                key={stName}
                onClick={() => handleStateChange(stName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                  selectedState === stName
                    ? "bg-sky-600 text-white border-sky-400 shadow-md scale-[1.03]"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {stName}
              </button>
            ))}
          </div>
        </div>

        {/* District / City Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">District / City:</span>
          <select
            value={selectedLocation.name}
            onChange={(e) => {
              const locs = NER_WEATHER_LOCATIONS[selectedState] || [];
              const found = locs.find(l => l.name === e.target.value);
              if (found) setSelectedLocation(found);
            }}
            className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 shadow-sm"
          >
            {(NER_WEATHER_LOCATIONS[selectedState] || []).map((loc) => (
              <option key={loc.name} value={loc.name}>
                {loc.name} ({loc.district})
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* SECTION 3: MAIN TELEMETRY GRID & DOPPLER RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: CURRENT WEATHER DASHBOARD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Weather Telemetry Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-[#09132e] dark:via-[#070d1e] dark:to-[#040814] p-6 lg:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            
            {/* Top Row: Location Title & Live Badge */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-widest font-mono">
                    {selectedLocation.district}, {selectedLocation.state}
                  </span>
                  {selectedLocation.altitude && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      Alt: {selectedLocation.altitude}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
                  <span>📍</span> {selectedLocation.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  GPS: {selectedLocation.lat.toFixed(4)}° N, {selectedLocation.lon.toFixed(4)}° E
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end gap-1">
                {weather?.isLive ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 text-xs font-extrabold flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                    LIVE
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    Weather data unavailable
                  </span>
                )}
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Updated: {weather?.timestamp || lastRefreshed || 'N/A'}
                </span>
              </div>
            </div>

            {/* Middle Row: Temperature & Weather Condition */}
            <div className="py-6 flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="p-4 rounded-3xl bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                  {renderWeatherIcon(weather?.conditionIcon)}
                </div>
                <div>
                  <div className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                    {weather?.isLive ? `${weather.temperature}°C` : '--°C'}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-2">
                    <span>Feels like {weather?.isLive ? `${weather.feelsLike}°C` : '--'}</span>
                    <span>&bull;</span>
                    <span className="text-sky-600 dark:text-sky-400 font-extrabold">{weather?.condition || 'Unavailable'}</span>
                  </div>
                </div>
              </div>

              {/* Severe Risk Indicator */}
              <div className="rounded-2xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-4 min-w-[200px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Precipitation Risk</div>
                <div className={`text-base font-black mt-1 flex items-center gap-1.5 ${
                  weather?.severeRiskLevel === 'EXTREME' ? 'text-red-500' :
                  weather?.severeRiskLevel === 'HIGH' ? 'text-amber-500' :
                  weather?.severeRiskLevel === 'MODERATE' ? 'text-yellow-500' : 'text-emerald-500'
                }`}>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{weather?.severeRiskLevel || 'NONE'} RISK</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Rain Probability: <b className="text-slate-900 dark:text-white font-mono">{weather?.isLive ? `${weather.precipitationProbability}%` : '--'}</b>
                </div>
              </div>
            </div>

            {/* Bottom Grid: 4 Core Telemetry Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4 border-t border-slate-200 dark:border-slate-800">
              
              {/* Rain / Precipitation */}
              <div className="bg-white dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Droplets className="h-3.5 w-3.5 text-blue-500" />
                  <span>Rainfall</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {weather?.isLive ? `${weather.precipitation} mm` : '--'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Rate per hour</div>
              </div>

              {/* Relative Humidity */}
              <div className="bg-white dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                  <span>Humidity</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {weather?.isLive ? `${weather.relativeHumidity}%` : '--'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Relative saturation</div>
              </div>

              {/* Wind Speed & Direction */}
              <div className="bg-white dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Wind className="h-3.5 w-3.5 text-teal-500" />
                  <span>Wind Speed</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {weather?.isLive ? `${weather.windSpeed} km/h` : '--'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Direction: <b className="text-sky-400">{weather?.isLive ? weather.windDirectionLabel : 'N/A'}</b> ({weather?.windDirection || 0}°)</div>
              </div>

              {/* Wind Gusts */}
              <div className="bg-white dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Compass className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Wind Gusts</span>
                </div>
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-1">
                  {weather?.isLive ? `${weather.windGusts} km/h` : '--'}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Peak velocity</div>
              </div>

            </div>

          </div>

          {/* 7-DAY FORECAST GRID */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>🗓️</span> 7-Day Open-Meteo Weather Forecast ({selectedLocation.name})
              </h3>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">Open-Meteo Live API</span>
            </div>

            {weather?.isLive && weather.forecast7Days && weather.forecast7Days.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weather.forecast7Days.map((day, idx) => (
                  <div
                    key={`fc_day_${idx}`}
                    className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between group hover:border-sky-500/60 transition"
                  >
                    <div className="text-xs font-black text-slate-700 dark:text-slate-300">{day.dayName}</div>
                    <div className="my-2 flex justify-center scale-90">
                      {renderWeatherIcon(day.conditionIcon)}
                    </div>
                    <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate" title={day.condition}>
                      {day.condition}
                    </div>
                    <div className="mt-2 text-xs font-mono font-bold">
                      <span className="text-slate-900 dark:text-white">{day.tempMax}°</span>
                      <span className="text-slate-400 dark:text-slate-500 mx-1">/</span>
                      <span className="text-slate-500 dark:text-slate-400">{day.tempMin}°</span>
                    </div>
                    <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      ☔ {day.precipitationProbabilityMax}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs font-bold bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                Weather data unavailable for 7-day forecast.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT 1 COLUMN: DOPPLER RADAR SWEEP & QUICK NAVIGATION */}
        <div className="space-y-6">
          
          {/* Real-time Doppler Radar PPI Widget */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Doppler Radar PPI
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-500">200 km Scope</span>
            </div>

            <div className="flex justify-center py-2">
              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="rounded-2xl bg-[#020617] border border-blue-900/60 shadow-inner"
              />
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Active Sector:</span>
                <b className="text-slate-900 dark:text-white font-mono">{selectedLocation.name}</b>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Doppler Reflectivity:</span>
                <b className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {weather?.isLive ? `${(weather.precipitation * 6 + 15).toFixed(1)} dBZ` : 'N/A'}
                </b>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Cloud Echo:</span>
                <b className="text-sky-600 dark:text-sky-400">{weather?.condition || 'Nominal'}</b>
              </div>
            </div>
          </div>

          {/* Quick Tactical Actions */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tactical Actions
            </h3>

            {onNavigateToMap && (
              <button
                onClick={onNavigateToMap}
                className="w-full p-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-between cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>View on Live NER GIS Map</span>
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}

            {onNavigateToReroute && (
              <button
                onClick={() => onNavigateToReroute("NH-6 Corridor")}
                className="w-full p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-800 transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-emerald-500" />
                  <span>Evacuation &amp; Road Reroute</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400" />
              </button>
            )}

            {onTriggerSOS && (
              <button
                onClick={onTriggerSOS}
                className="w-full p-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition flex items-center justify-between cursor-pointer shadow-md"
              >
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4" />
                  <span>Trigger Emergency SOS Alert</span>
                </div>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
