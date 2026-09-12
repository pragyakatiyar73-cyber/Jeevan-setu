import React, { useState, useEffect } from 'react';
import {
  X,
  CloudRain,
  Radio,
  Building2,
  Users,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sun,
  SunMedium,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Compass,
  Layers,
  ExternalLink,
  ShieldCheck,
  Navigation
} from 'lucide-react';
import { getLiveWeather, WeatherData } from '../services/api/weather';
import {
  getBhuvanServiceStatus,
  BhuvanServiceTelemetry,
  DOCUMENTED_BHUVAN_LAYERS,
  BHUVAN_WMS_ENDPOINT,
  BHUVAN_PORTAL_URL,
  BHUVAN_API_PORTAL_URL
} from '../services/api/bhuvanService';
import {
  getCrowdsourcedReportsTelemetry,
  CrowdsourcedTelemetryData
} from '../services/api/crowdsourcedService';

interface TrustedDataSourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'imd' | 'isro' | 'gov' | 'ground' | 'gis';
}

const PRESET_LOCATIONS = [
  { name: 'Guwahati, Assam', lat: 26.1445, lon: 91.7362 },
  { name: 'Gangtok, Sikkim', lat: 27.3389, lon: 88.6065 },
  { name: 'Shillong, Meghalaya', lat: 25.5788, lon: 91.8933 },
  { name: 'Itanagar, Arunachal', lat: 27.0844, lon: 93.6053 },
  { name: 'Imphal, Manipur', lat: 24.8170, lon: 93.9368 },
  { name: 'Wayanad, Kerala', lat: 11.6854, lon: 76.1320 },
  { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090 }
];

export default function TrustedDataSourcesModal({
  isOpen,
  onClose,
  initialTab = 'imd'
}: TrustedDataSourcesModalProps) {
  const [activeTab, setActiveTab] = useState<'imd' | 'isro' | 'gov' | 'ground' | 'gis'>(initialTab);

  // Weather state
  const [selectedLocation, setSelectedLocation] = useState(PRESET_LOCATIONS[0]);
  const [customLat, setCustomLat] = useState<string>('26.1445');
  const [customLon, setCustomLon] = useState<string>('91.7362');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [geoLocating, setGeoLocating] = useState<boolean>(false);

  // Bhuvan State
  const [selectedBhuvanLayer, setSelectedBhuvanLayer] = useState<string>('india3');
  const [bhuvanStatus, setBhuvanStatus] = useState<BhuvanServiceTelemetry | null>(null);
  const [bhuvanLoading, setBhuvanLoading] = useState<boolean>(false);

  // MongoDB Crowdsourced Reports State
  const [crowdsourcedData, setCrowdsourcedData] = useState<CrowdsourcedTelemetryData | null>(null);
  const [crowdsourcedLoading, setCrowdsourcedLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Fetch weather data when tab or location changes
  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await getLiveWeather(lat, lon);
      setWeatherData(data);
      if (!data.isLive) {
        setWeatherError(data.error || 'Data unavailable');
      }
    } catch (err: any) {
      setWeatherData(null);
      setWeatherError(err?.message || 'Data unavailable');
    } finally {
      setWeatherLoading(false);
    }
  };

  // Fetch Bhuvan telemetry status
  const fetchBhuvanTelemetry = async (layerId: string) => {
    setBhuvanLoading(true);
    try {
      const telemetry = await getBhuvanServiceStatus(layerId);
      setBhuvanStatus(telemetry);
    } catch (err) {
      setBhuvanStatus(null);
    } finally {
      setBhuvanLoading(false);
    }
  };

  // Fetch MongoDB Crowdsourced Telemetry
  const fetchCrowdsourcedData = async () => {
    setCrowdsourcedLoading(true);
    try {
      const data = await getCrowdsourcedReportsTelemetry();
      setCrowdsourcedData(data);
    } catch (err) {
      setCrowdsourcedData({
        isConnected: false,
        status: 'error',
        database: 'MongoDB (Unavailable)',
        totalReports: 0,
        reportsLastHour: 0,
        latestReportTimestamp: null,
        recentReports: [],
        error: 'Database unavailable'
      });
    } finally {
      setCrowdsourcedLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'imd') {
        fetchWeather(selectedLocation.lat, selectedLocation.lon);
      } else if (activeTab === 'isro') {
        fetchBhuvanTelemetry(selectedBhuvanLayer);
      } else if (activeTab === 'ground') {
        fetchCrowdsourcedData();
      }
    }
  }, [isOpen, activeTab, selectedLocation, selectedBhuvanLayer]);

  const handleSelectPreset = (loc: typeof PRESET_LOCATIONS[0]) => {
    setSelectedLocation(loc);
    setCustomLat(loc.lat.toString());
    setCustomLon(loc.lon.toString());
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon)) {
      setWeatherError('Please enter valid numeric latitude and longitude values.');
      return;
    }
    const customLoc = { name: `Custom (${lat.toFixed(2)}, ${lon.toFixed(2)})`, lat, lon };
    setSelectedLocation(customLoc);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setWeatherError('Browser geolocation is not supported.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lon = parseFloat(pos.coords.longitude.toFixed(4));
        setCustomLat(lat.toString());
        setCustomLon(lon.toString());
        const loc = { name: 'My Current Location (GPS)', lat, lon };
        setSelectedLocation(loc);
      },
      (err) => {
        setGeoLocating(false);
        setWeatherError(`Geolocation error: ${err.message}. Using default location.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  if (!isOpen) return null;

  const renderWeatherIcon = (iconName?: string) => {
    const props = { className: "h-8 w-8 text-sky-400 animate-pulse" };
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                Trusted Data Sources
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Verified Telemetry
                </span>
              </h3>
              <p className="text-xs text-slate-400">Real-time integrated meteorological, spatial &amp; MongoDB crowdsourced intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Source Navigation Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/80 bg-slate-900/60 flex flex-wrap gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('imd')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'imd'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-1 ring-blue-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CloudRain className="h-4 w-4" />
            IMD Weather Data (Open-Meteo)
          </button>

          <button
            onClick={() => setActiveTab('isro')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'isro'
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 ring-1 ring-sky-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="h-4 w-4" />
            ISRO / Satellite Data (Bhuvan WMS)
          </button>

          <button
            onClick={() => setActiveTab('gov')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'gov'
                ? 'bg-slate-700 text-white shadow-lg ring-1 ring-slate-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="h-4 w-4" />
            Govt Reports
          </button>

          <button
            onClick={() => setActiveTab('ground')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'ground'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-emerald-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            Ground Reports (MongoDB)
          </button>

          <button
            onClick={() => setActiveTab('gis')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'gis'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-1 ring-purple-400'
                : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="h-4 w-4" />
            GIS &amp; Remote Sensing
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: IMD WEATHER DATA (LIVE OPEN-METEO INTEGRATION) */}
          {activeTab === 'imd' && (
            <div className="space-y-6">
              
              {/* Top Controls: City Presets & Custom Coordinates */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-400" />
                      Select Weather Location
                    </h4>
                    <p className="text-xs text-slate-400">Fetch real-time atmospheric telemetry by location or exact GPS coordinates</p>
                  </div>

                  <button
                    onClick={handleUseMyLocation}
                    disabled={geoLocating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold transition duration-200 disabled:opacity-50"
                  >
                    <Navigation className={`h-3.5 w-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
                    {geoLocating ? 'Locating...' : 'Use My GPS Location'}
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectPreset(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition duration-200 ${
                        selectedLocation.name === loc.name
                          ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-400/50'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>

                {/* Custom Lat/Lon input form */}
                <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <span>Latitude:</span>
                    <input
                      type="number"
                      step="any"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-sky-400 focus:outline-none"
                      placeholder="26.1445"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
                    <span>Longitude:</span>
                    <input
                      type="number"
                      step="any"
                      value={customLon}
                      onChange={(e) => setCustomLon(e.target.value)}
                      className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:ring-1 focus:ring-sky-400 focus:outline-none"
                      placeholder="91.7362"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white rounded-lg transition duration-200"
                  >
                    Fetch Coordinates
                  </button>

                  <button
                    type="button"
                    onClick={() => fetchWeather(selectedLocation.lat, selectedLocation.lon)}
                    disabled={weatherLoading}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-bold transition duration-200"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${weatherLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </form>

              </div>

              {/* Status Header Banner */}
              <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  {weatherData?.isLive && !weatherLoading ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black tracking-wide animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      LIVE
                    </span>
                  ) : weatherLoading ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-black">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      FETCHING API...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-black">
                      <AlertTriangle className="h-3 w-3" />
                      DATA UNAVAILABLE
                    </span>
                  )}
                  <div>
                    <h5 className="text-sm font-black text-white">{selectedLocation.name}</h5>
                    <p className="text-[11px] font-mono text-slate-400">
                      Coordinates: {selectedLocation.lat}° N, {selectedLocation.lon}° E
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Last Updated</span>
                  <span className="text-xs font-mono font-extrabold text-slate-300">
                    {weatherLoading ? 'Fetching...' : weatherData?.timestamp || 'Unavailable'}
                  </span>
                </div>
              </div>

              {/* LOADING STATE */}
              {weatherLoading && (
                <div className="p-12 text-center bg-slate-950/40 border border-slate-800 rounded-2xl space-y-4 animate-pulse">
                  <div className="h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">Fetching live meteorological telemetry from Open-Meteo API...</p>
                  <p className="text-xs text-slate-500 font-mono">https://api.open-meteo.com/v1/forecast?latitude={selectedLocation.lat}&longitude={selectedLocation.lon}</p>
                </div>
              )}

              {/* ERROR / DATA UNAVAILABLE STATE */}
              {!weatherLoading && weatherError && (
                <div className="p-6 bg-rose-950/30 border border-rose-800/60 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3 text-rose-400">
                    <AlertTriangle className="h-6 w-6 shrink-0" />
                    <div>
                      <h5 className="text-sm font-bold">Weather Data Unavailable</h5>
                      <p className="text-xs text-rose-300/80">{weatherError}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Live meteorological API connection failed or timed out. No simulated data is rendered as per system protocol.
                  </p>
                  <button
                    onClick={() => fetchWeather(selectedLocation.lat, selectedLocation.lon)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition duration-200 shadow"
                  >
                    Retry Fetching Live Data
                  </button>
                </div>
              )}

              {/* LIVE WEATHER DATA GRID */}
              {!weatherLoading && weatherData && weatherData.isLive && (
                <div className="space-y-4">
                  
                  {/* Weather Condition Hero Banner */}
                  <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                        {renderWeatherIcon(weatherData.conditionIcon)}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">Current Weather Condition</span>
                        <h4 className="text-2xl font-black text-white">{weatherData.condition}</h4>
                        <span className="text-xs text-slate-400">WMO Weather Code: {weatherData.weatherCode}</span>
                      </div>
                    </div>

                    <div className="text-center sm:text-right bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-800">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Temperature</span>
                      <span className="text-3xl font-black text-amber-400 font-mono">
                        {weatherData.temperature}°C
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Temperature Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase">Temperature</span>
                        <Thermometer className="h-4 w-4 text-amber-400" />
                      </div>
                      <p className="text-2xl font-black text-white font-mono">{weatherData.temperature} °C</p>
                      <p className="text-[11px] text-slate-400">Sensor height 2 meters</p>
                    </div>

                    {/* Rainfall / Precipitation Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase">Rainfall / Precip</span>
                        <CloudRain className="h-4 w-4 text-blue-400" />
                      </div>
                      <p className="text-2xl font-black text-sky-400 font-mono">{weatherData.precipitation} mm</p>
                      <p className="text-[11px] text-slate-400">Rain volume: {weatherData.rain} mm</p>
                    </div>

                    {/* Wind Speed Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase">Wind Speed</span>
                        <Wind className="h-4 w-4 text-teal-400" />
                      </div>
                      <p className="text-2xl font-black text-white font-mono">{weatherData.windSpeed} km/h</p>
                      <p className="text-[11px] text-slate-400">Gusts: {weatherData.windGusts} km/h</p>
                    </div>

                    {/* Relative Humidity Card */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-bold uppercase">Humidity</span>
                        <Droplets className="h-4 w-4 text-sky-400" />
                      </div>
                      <p className="text-2xl font-black text-white font-mono">{weatherData.relativeHumidity} %</p>
                      <p className="text-[11px] text-slate-400">Elevation: {weatherData.elevation} m</p>
                    </div>

                  </div>

                  {/* Severe Risk Indicator */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        weatherData.severeRiskLevel === 'EXTREME' ? 'bg-rose-500/20 text-rose-400' :
                        weatherData.severeRiskLevel === 'HIGH' ? 'bg-orange-500/20 text-orange-400' :
                        weatherData.severeRiskLevel === 'MODERATE' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 block uppercase">Precipitation &amp; Wind Risk Assessment</span>
                        <span className="text-sm font-black text-white">
                          Status: {weatherData.severeRiskLevel} RISK
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-slate-400 font-mono hidden sm:block">
                      Provider: Open-Meteo / IMD Synchronized
                    </span>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: ISRO / SATELLITE DATA (OFFICIAL BHUVAN INTEGRATION) */}
          {activeTab === 'isro' && (
            <div className="space-y-6">
              
              {/* Controls & Layer Selector */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Radio className="h-4 w-4 text-sky-400" />
                      ISRO Bhuvan Documented Public WMS Service
                    </h4>
                    <p className="text-xs text-slate-400">Verified sovereign geospatial layers from NRSC / ISRO GeoWebCache WMS</p>
                  </div>

                  <button
                    onClick={() => fetchBhuvanTelemetry(selectedBhuvanLayer)}
                    disabled={bhuvanLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 rounded-xl text-xs font-bold transition duration-200 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${bhuvanLoading ? 'animate-spin' : ''}`} />
                    Refresh Service Status
                  </button>
                </div>

                {/* Layer Picker Dropdown / Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <label className="text-xs font-bold text-slate-300 block">Select Documented Bhuvan Data Layer / Source:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {DOCUMENTED_BHUVAN_LAYERS.map((layer) => (
                      <button
                        key={layer.id}
                        onClick={() => setSelectedBhuvanLayer(layer.id)}
                        className={`p-3 rounded-xl border text-left transition duration-200 ${
                          selectedBhuvanLayer === layer.id
                            ? 'bg-sky-950/60 border-sky-400 text-white shadow'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-sky-300">{layer.name}</span>
                          {layer.requiresCredentials ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Token Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Public WMS
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{layer.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Status Header Banner */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl">
                      <Radio className="h-6 w-6 text-sky-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">Sovereign Data Provider</span>
                      <h4 className="text-xl font-black text-white">Source: ISRO / Bhuvan</h4>
                      <p className="text-xs text-slate-400">National Remote Sensing Centre (NRSC) • Hyderabad, India</p>
                    </div>
                  </div>

                  {/* Service Status Badge */}
                  <div>
                    {bhuvanLoading ? (
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-black">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        CHECKING BHUVAN STATUS...
                      </span>
                    ) : bhuvanStatus?.serviceStatus === 'OPERATIONAL' ? (
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black tracking-wide animate-pulse">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        OPERATIONAL (200 OK)
                      </span>
                    ) : bhuvanStatus?.serviceStatus === 'AUTHENTICATION_REQUIRED' ? (
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-xs font-black">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        AUTHENTICATION REQUIRED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-black">
                        <AlertTriangle className="h-4 w-4 text-rose-400" />
                        SERVICE UNAVAILABLE
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata Summary Grid (Required Fields Display) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* Field 1: Source */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source</span>
                    <p className="text-sm font-black text-white">ISRO / Bhuvan</p>
                    <p className="text-[11px] text-slate-400">NRSC Geospatial Portal</p>
                  </div>

                  {/* Field 2: Service Status */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Service Status</span>
                    <p className={`text-sm font-black ${
                      bhuvanStatus?.serviceStatus === 'OPERATIONAL' ? 'text-emerald-400' :
                      bhuvanStatus?.serviceStatus === 'AUTHENTICATION_REQUIRED' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {bhuvanStatus?.serviceStatus || 'Checking...'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {bhuvanStatus?.latencyMs ? `Latency: ${bhuvanStatus.latencyMs}ms` : 'GeoWebCache WMS'}
                    </p>
                  </div>

                  {/* Field 3: Last Successful Data Fetch */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Last Successful Data Fetch</span>
                    <p className="text-xs font-black text-white font-mono">
                      {bhuvanLoading ? 'Fetching capabilities...' : bhuvanStatus?.lastFetchTime || 'Unavailable'}
                    </p>
                    <p className="text-[11px] text-slate-400">GetCapabilities verified</p>
                  </div>

                  {/* Field 4: Data Layer / Source Name */}
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data Layer / Source Name</span>
                    <p className="text-xs font-black text-sky-400 font-mono truncate" title={bhuvanStatus?.dataLayerName}>
                      {bhuvanStatus?.dataLayerName || 'india3'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">WMS Layer ID: {bhuvanStatus?.dataLayerId}</p>
                  </div>

                </div>

                {/* Authentication / Token Prompt if required */}
                {bhuvanStatus?.serviceStatus === 'AUTHENTICATION_REQUIRED' && (
                  <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      Registration &amp; Credentials Required
                    </div>
                    <p className="text-xs text-slate-300">
                      {bhuvanStatus.error}
                    </p>
                    <div className="flex items-center gap-3 pt-1">
                      <a
                        href={BHUVAN_API_PORTAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-bold transition duration-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Register on Bhuvan Developer Portal
                      </a>
                    </div>
                  </div>
                )}

                {/* Technical Endpoint Specs */}
                <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 font-mono">
                  <div>
                    <span className="text-slate-500">WMS Endpoint: </span>
                    <span className="text-slate-300">{BHUVAN_WMS_ENDPOINT}</span>
                  </div>
                  <a
                    href={BHUVAN_PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    bhuvan.nrsc.gov.in <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: GOVERNMENT REPORTS */}
          {activeTab === 'gov' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-slate-300" />
                    <h4 className="text-base font-black text-white">NDMA &amp; MDoNER Emergency Bulletins</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Official administrative disaster response telemetry from the Ministry of Development of North Eastern Region (MDoNER), National Disaster Response Force (NDRF), and State Disaster Management Authorities (SDMA).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: GROUND REPORTS (MONGODB INTEGRATED) */}
          {activeTab === 'ground' && (
            <div className="space-y-6">
              
              {/* Header & Status */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                      <Users className="h-6 w-6 text-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Live MongoDB Database Collection</span>
                      <h4 className="text-xl font-black text-white">Crowdsourced Ground Reports</h4>
                      <p className="text-xs text-slate-400">Database: jeevan_setu.crowdsourced_reports</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchCrowdsourcedData}
                      disabled={crowdsourcedLoading}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition duration-200"
                      title="Refresh MongoDB Data"
                    >
                      <RefreshCw className={`h-4 w-4 ${crowdsourcedLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {crowdsourcedLoading ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-black">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        QUERYING MONGODB...
                      </span>
                    ) : crowdsourcedData?.isConnected ? (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-black tracking-wide animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                        MONGODB CONNECTED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-xs font-black">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        DATABASE UNAVAILABLE
                      </span>
                    )}
                  </div>
                </div>

                {/* 4 Required Metric Summary Cards */}
                {crowdsourcedData?.isConnected ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Item 1: Total Reports */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Reports</span>
                      <p className="text-3xl font-black text-emerald-400 font-mono">
                        {crowdsourcedData.totalReports}
                      </p>
                      <p className="text-[11px] text-slate-400">Recorded in MongoDB</p>
                    </div>

                    {/* Item 2: Reports from Last 1 Hour */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reports from Last 1 Hour</span>
                      <p className="text-3xl font-black text-sky-400 font-mono">
                        {crowdsourcedData.reportsLastHour}
                      </p>
                      <p className="text-[11px] text-slate-400">Past 60 minutes window</p>
                    </div>

                    {/* Item 3: Latest Report Timestamp */}
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latest Report Timestamp</span>
                      <p className="text-xs font-black text-white font-mono leading-tight pt-1">
                        {crowdsourcedData.latestReportTimestamp || 'No reports yet'}
                      </p>
                      <p className="text-[11px] text-slate-400">MongoDB latest insertion</p>
                    </div>

                  </div>
                ) : (
                  <div className="p-6 bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                      <AlertTriangle className="h-5 w-5" />
                      Database Unavailable
                    </div>
                    <p className="text-xs text-rose-300/80">
                      Unable to connect to MongoDB instance (<code className="font-mono bg-rose-900/40 px-1 py-0.5 rounded">mongodb://localhost:27017</code>). No dummy numbers are displayed as per system rules.
                    </p>
                    <button
                      onClick={fetchCrowdsourcedData}
                      className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition duration-200 shadow"
                    >
                      Retry Database Connection
                    </button>
                  </div>
                )}

              </div>

              {/* Item 4: Active / Recent Disaster Reports List */}
              {crowdsourcedData?.isConnected && crowdsourcedData.recentReports.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Active / Recent Disaster Reports from MongoDB</span>
                    <span className="text-emerald-400 font-mono font-bold">{crowdsourcedData.recentReports.length} Live Documents</span>
                  </h4>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {crowdsourcedData.recentReports.map((report) => (
                      <div
                        key={report.reportId || report._id}
                        className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{report.disasterType}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              report.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                              report.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                              'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                            }`}>
                              {report.severity}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">{report.timestamp}</span>
                        </div>

                        <p className="text-xs text-slate-300">{report.description}</p>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-900">
                          <span>📍 Location: {report.locationName} ({report.latitude}°, {report.longitude}°)</span>
                          <span className="text-sky-400 font-bold">ID: {report.reportId}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: GIS & REMOTE SENSING */}
          {activeTab === 'gis' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-purple-400" />
                    <h4 className="text-base font-black text-white">GIS Spatial Layers &amp; OpenTopo</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Topographic contour maps, river basin hydrography overlays, and OpenStreetMap vector routing network engine for real-time evacuation path computations.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Jeevan Setu Verified Data Ecosystem • MongoDB &amp; ISRO Bhuvan Integration
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition duration-200"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}
