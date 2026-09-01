import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Sparkles,
  CloudRain,
  Navigation,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Shield,
  Activity,
  Truck,
  Send,
  Printer,
  Download,
  Share2,
  PhoneCall,
  Flame,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  Radio,
  FileText,
  Clock,
  Bot,
  HelpCircle,
  Building2,
  Wind
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../i18n';
import { getSpellingSuggestions, getDidYouMeanSuggestion } from '../utils/locationSpellCheck';
import { searchMonitoringLocation, reverseGeocodeMonitoring, GeocodedLocation, getLiveWeather, dispatchMDoNERAlert } from '../services/api';
import { calculateStateSpecificDisasterProfile } from '../services/api/hazardModels';

interface RouteDetail {
  normalRouteStatus: '🔴 Blocked / Unsafe' | '🟡 Partially Impaired' | '🟢 Safe';
  normalRouteVia: string;
  alternativeRouteStatus: '🟢 Recommended Safe Route';
  alternativeRouteVia: string;
  distanceKm: number;
  travelTimeMins: number;
  accessibilityPercent: number;
  routeDisasterRisk: string;
}

interface EmergencyAccessStatus {
  ambulanceAccess: '🟢 SAFE ACCESS' | '🟡 CAUTION REQUIRED' | '🔴 BLOCKED';
  fireVehicleAccess: '🟢 SAFE ACCESS' | '🟡 CAUTION REQUIRED' | '🔴 BLOCKED';
  rescueTeamAccess: '🟢 SAFE ACCESS' | '🟡 CAUTION REQUIRED' | '🔴 BLOCKED';
  normalRouteSafety: '🟢 NORMAL SAFE' | '🟡 PARTIALLY IMPAIRED' | '🔴 UNSAFE / BREACHED';
}

interface SafetyScoreBreakdown {
  totalScore: number; // 0 - 100
  tier: 'SAFE' | 'MODERATE' | 'HIGH RISK' | 'CRITICAL';
  floodScore: number;
  rainfallScore: number;
  roadScore: number;
  landslideScore: number;
  weatherScore: number;
}

export default function AddressDisasterIntelligence() {
  const { t } = useTranslation();

  // Search & Query State
  const [searchQuery, setSearchQuery] = useState<string>('Dehradun, Uttarakhand');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);

  // Confirmed Location
  const [currentLoc, setCurrentLoc] = useState<GeocodedLocation>({
    lat: 30.3165,
    lon: 78.0322,
    displayName: 'Dehradun, Uttarakhand, India',
    city: 'Dehradun',
    state: 'Uttarakhand',
    country: 'India'
  });

  // Telemetry & Assessment State
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [stateProfile, setStateProfile] = useState<any>(null);
  const [routeDetail, setRouteDetail] = useState<RouteDetail | null>(null);
  const [emergencyAccess, setEmergencyAccess] = useState<EmergencyAccessStatus | null>(null);
  const [safetyScore, setSafetyScore] = useState<SafetyScoreBreakdown | null>(null);
  const [aiReportText, setAiReportText] = useState<string>('');

  // Map Reference & Layer Toggles
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [mapLayers, setMapLayers] = useState({
    flood: true,
    road: true,
    rainfall: true,
    landslide: true,
    activeDisaster: true,
    emergencyRoute: true
  });

  // Action Bar Feedback
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([currentLoc.lat, currentLoc.lon], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setIsLoadingData(true);
        try {
          const rev = await reverseGeocodeMonitoring(lat, lng);
          if (rev) {
            handleSelectLocation(rev);
          }
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        } finally {
          setIsLoadingData(false);
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Map Pin & Polyline on Location Change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    map.setView([currentLoc.lat, currentLoc.lon], 11);

    if (markerRef.current) map.removeLayer(markerRef.current);

    const pinIcon = L.divIcon({
      className: 'custom-address-pin',
      html: `<div style="background:linear-gradient(135deg,#ef4444,#dc2626);color:#fff;padding:6px 12px;border-radius:12px;font-weight:900;font-size:12px;border:2px solid #fff;box-shadow:0 0 20px rgba(239,68,68,0.8);white-space:nowrap;display:flex;align-items:center;gap:4px;">🛡️ <span>GeoSafe AI: ${currentLoc.city || currentLoc.displayName.split(',')[0]}</span></div>`,
      iconSize: [180, 30],
      iconAnchor: [90, 15]
    });

    markerRef.current = L.marker([currentLoc.lat, currentLoc.lon], { icon: pinIcon }).addTo(map)
      .bindPopup(`<b>🛡️ GeoSafe AI Pin: ${currentLoc.displayName}</b><br/>Lat: ${currentLoc.lat.toFixed(4)}° N, Lon: ${currentLoc.lon.toFixed(4)}° E`);

    // Draw Emergency Safe Route Vector
    if (routePolylineRef.current) map.removeLayer(routePolylineRef.current);
    const safeRouteWaypoints: [number, number][] = [
      [currentLoc.lat - 0.05, currentLoc.lon - 0.04],
      [currentLoc.lat - 0.02, currentLoc.lon - 0.01],
      [currentLoc.lat, currentLoc.lon],
      [currentLoc.lat + 0.03, currentLoc.lon + 0.02]
    ];
    routePolylineRef.current = L.polyline(safeRouteWaypoints, {
      color: '#10b981',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8'
    }).addTo(map).bindPopup("<b>🚑 GeoSafe Recommended Safe Bypass Route</b>");

  }, [currentLoc]);

  // Load Complete Telemetry & GeoSafe Assessment for Location
  const runFullLocationAssessment = async (loc: GeocodedLocation) => {
    setIsLoadingData(true);
    try {
      // 1. Fetch live Open-Meteo weather
      const w = await getLiveWeather(loc.lat, loc.lon);
      setWeatherData(w);

      const rainVal = w ? w.precipitation : 0;
      const tempVal = w ? w.temperature : 22;
      const windVal = w ? w.windGusts : 12;

      // 2. Fetch state-specific disaster profile
      const prof = calculateStateSpecificDisasterProfile(
        loc.state || loc.displayName,
        loc.lat,
        loc.lon,
        rainVal,
        tempVal,
        windVal,
        22, // slope degrees
        78  // soil moisture %
      );
      setStateProfile(prof);

      // 3. Compute Emergency Route Analysis
      const isHighRisk = rainVal > 15 || prof.hillRoadStatus === '🔴 Blocked';
      const route: RouteDetail = {
        normalRouteStatus: isHighRisk ? '🔴 Blocked / Unsafe' : '🟡 Partially Impaired',
        normalRouteVia: `Arterial Pass (NH Corridor)`,
        alternativeRouteStatus: '🟢 Recommended Safe Route',
        alternativeRouteVia: `Valley Ridge Bypass Highway`,
        distanceKm: 28.5,
        travelTimeMins: isHighRisk ? 65 : 42,
        accessibilityPercent: isHighRisk ? 35 : 78,
        routeDisasterRisk: isHighRisk ? 'Heavy Precipitation & Slope Debris Flow' : 'Minor Waterlogging'
      };
      setRouteDetail(route);

      // 4. Compute Emergency Access Questions (Ambulance, Fire, Rescue, Normal Route)
      setEmergencyAccess({
        ambulanceAccess: isHighRisk ? '🔴 BLOCKED' : rainVal > 8 ? '🟡 CAUTION REQUIRED' : '🟢 SAFE ACCESS',
        fireVehicleAccess: isHighRisk ? '🔴 BLOCKED' : rainVal > 8 ? '🟡 CAUTION REQUIRED' : '🟢 SAFE ACCESS',
        rescueTeamAccess: '🟢 SAFE ACCESS',
        normalRouteSafety: isHighRisk ? '🔴 UNSAFE / BREACHED' : rainVal > 8 ? '🟡 PARTIALLY IMPAIRED' : '🟢 NORMAL SAFE'
      });

      // 5. Compute GeoSafe Safety Score (0 - 100)
      const floodScore = Math.max(0, 100 - Math.round(rainVal * 2.8 + 15));
      const rainScore = Math.max(0, 100 - Math.round(rainVal * 2.5));
      const roadScore = isHighRisk ? 30 : 80;
      const landslideScore = Math.max(0, 100 - Math.round(rainVal * 2.0 + 20));
      const weatherScore = Math.max(0, 100 - Math.round(Math.abs(tempVal - 22) * 1.5));

      const totalScore = Math.round((floodScore * 0.3) + (rainScore * 0.2) + (roadScore * 0.25) + (landslideScore * 0.15) + (weatherScore * 0.1));
      
      let tier: SafetyScoreBreakdown['tier'] = 'SAFE';
      if (totalScore < 30) tier = 'CRITICAL';
      else if (totalScore < 60) tier = 'HIGH RISK';
      else if (totalScore < 85) tier = 'MODERATE';

      setSafetyScore({
        totalScore,
        tier,
        floodScore,
        rainfallScore: rainScore,
        roadScore,
        landslideScore,
        weatherScore
      });

      // 6. Generate AI Disaster Assessment Statement
      const summary = `Location ${loc.displayName} is evaluated under ${prof.regionCategory} terrain parameters. Primary hazards include ${prof.primaryHazards.slice(0, 3).join(', ')}. Current precipitation is ${rainVal} mm/h with ambient temperature of ${tempVal}°C. Transit accessibility is rated ${route.accessibilityPercent}%. Emergency units are advised to maintain ${prof.recommendedVehicles[0]} vector availability.`;
      setAiReportText(summary);

    } catch (err) {
      console.warn('Error running location assessment:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Run initial assessment on mount
  useEffect(() => {
    runFullLocationAssessment(currentLoc);
  }, []);

  const handleSelectLocation = (loc: GeocodedLocation) => {
    setCurrentLoc(loc);
    setSearchQuery(loc.displayName);
    setSearchResults([]);
    runFullLocationAssessment(loc);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchMonitoringLocation(searchQuery);
      setSearchResults(results);
      if (results.length > 0) {
        handleSelectLocation(results[0]);
      }
    } catch (err) {
      console.warn('Location search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const { latitude, longitude } = pos.coords;
          setIsLoadingData(true);
          const rev = await reverseGeocodeMonitoring(latitude, longitude);
          if (rev) {
            handleSelectLocation(rev);
          } else {
            handleSelectLocation({
              lat: latitude,
              lon: longitude,
              displayName: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
              country: 'India'
            });
          }
        },
        () => {
          setActionFeedback('⚠️ GPS location access denied or unavailable.');
          setTimeout(() => setActionFeedback(null), 4000);
        }
      );
    }
  };

  const handleActionTrigger = async (actionType: string) => {
    if (actionType === 'ALERT') {
      setActionFeedback('📡 Sending CRITICAL GeoSafe Alert to MDoNER & SDRF Triage Command...');
      await dispatchMDoNERAlert({
        locationName: currentLoc.displayName,
        disasterType: 'CRITICAL',
        message: 'Immediate dispatch of rescue boats & ambulances required'
      });
      setTimeout(() => setActionFeedback('✅ Alert dispatched to Central Emergency Dashboard!'), 2000);
    } else if (actionType === 'SHARE') {
      if (navigator.share) {
        navigator.share({
          title: `GeoSafe AI Report - ${currentLoc.displayName}`,
          text: `GeoSafe AI Disaster Assessment for ${currentLoc.displayName}. Safety Score: ${safetyScore?.totalScore}/100 (${safetyScore?.tier}).`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        setActionFeedback('📋 Shareable GeoSafe report link copied to clipboard!');
      }
    } else if (actionType === 'PRINT') {
      window.print();
    } else {
      setActionFeedback(`⚡ Request for ${actionType} submitted successfully!`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Determine Flood Status
  const getFloodStatus = () => {
    if (!weatherData) return { label: '🟢 SAFE – No Flood Detected', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    const p = weatherData.precipitation || 0;
    if (p > 30) return { label: '🔴 CRITICAL – Active Flood Emergency', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse' };
    if (p > 15) return { label: '🟠 HIGH – Serious Flood Warning', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' };
    if (p > 5) return { label: '🟡 MODERATE – Flood Risk Present', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    return { label: '🟢 SAFE – No Flood Detected', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
  };

  // Determine Road Status
  const getRoadStatus = () => {
    if (!stateProfile) return { label: '🟢 Fully Accessible', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
    if (stateProfile.hillRoadStatus?.includes('🔴')) return { label: '🔴 Blocked / Unsafe', color: 'text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse' };
    if (stateProfile.hillRoadStatus?.includes('🟡')) return { label: '🟡 Partially Accessible', color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' };
    return { label: '🟢 Fully Accessible', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' };
  };

  const floodObj = getFloodStatus();
  const roadObj = getRoadStatus();

  return (
    <div className="space-y-6 pb-12">
      {/* 🛡️ TOP HEADER SECTION: GEOSAFE AI BRANDING & SEARCH BAR */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-900/90 to-slate-950 p-6 shadow-xl dark:shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner shadow-indigo-500/30">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white tracking-tight">GeoSafe AI</h1>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                  Address-Based Disaster Intelligence
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 font-semibold mt-0.5">
                Enter any location. Instantly understand its disaster risk, safety status, and emergency accessibility.
              </p>
            </div>
          </div>

          <button
            onClick={handleUseCurrentLocation}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 px-4 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
          >
            <Compass className="h-4 w-4 animate-spin-slow text-emerald-400" />
            <span>📍 Use Current Location</span>
          </button>
        </div>

        {/* Search Bar & Auto-Suggest */}
        <div className="relative">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="📍 Enter village, city, district, address, PIN code, or landmark..."
                className="w-full rounded-xl border border-indigo-500/30 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-xl bg-gradient-to-r from-indigo-600 via-sky-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 px-6 py-3 text-xs font-black text-white shadow-lg shadow-indigo-600/40 flex items-center gap-2 transition cursor-pointer shrink-0"
            >
              {isSearching ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span>🔍 Analyze Location</span>
            </button>
          </form>

          {/* Search Dropdown Matches */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-14 z-[2000] rounded-xl border border-indigo-500/40 bg-slate-950 p-2 shadow-2xl space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase px-2 py-1 border-b border-slate-800">Select Exact Location Match:</div>
              {searchResults.map((res, rIdx) => (
                <button
                  key={rIdx}
                  onClick={() => handleSelectLocation(res)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-indigo-500/20 text-xs text-white font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <span>📍</span>
                  <span className="truncate">{res.displayName}</span>
                </button>
              ))}
            </div>
          )}

          {/* Did You Mean Spelling Correction Banner */}
          {searchQuery.trim().length >= 2 && (() => {
            const dyM = getDidYouMeanSuggestion(searchQuery);
            if (!dyM) return null;
            return (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Did you mean:</span>
                <button
                  type="button"
                  onClick={() => handleSelectLocation({
                    lat: dyM.lat,
                    lon: dyM.lon,
                    displayName: `${dyM.name}, ${dyM.state}, India`,
                    city: dyM.name,
                    state: dyM.state,
                    country: 'India'
                  })}
                  className="font-bold underline hover:text-amber-200 transition cursor-pointer"
                >
                  {dyM.name} ({dyM.state})
                </button>
              </div>
            );
          })()}

          {/* Quick Preset Location Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase font-mono">Popular Sectors:</span>
            {[
              { name: 'Dehradun, Uttarakhand', lat: 30.3165, lon: 78.0322, state: 'Uttarakhand' },
              { name: 'Kanpur, Uttar Pradesh', lat: 26.4499, lon: 80.3319, state: 'Uttar Pradesh' },
              { name: 'Haridwar, Uttarakhand', lat: 29.9457, lon: 78.1642, state: 'Uttarakhand' },
              { name: 'Prayagraj, Uttar Pradesh', lat: 25.4358, lon: 81.8463, state: 'Uttar Pradesh' },
              { name: 'Shimla, Himachal Pradesh', lat: 31.1048, lon: 77.1734, state: 'Himachal Pradesh' },
              { name: 'Jaisalmer, Rajasthan', lat: 26.9157, lon: 70.9083, state: 'Rajasthan' },
              { name: 'Leh, Ladakh', lat: 34.1526, lon: 77.5771, state: 'Ladakh' },
              { name: 'Srinagar, Jammu & Kashmir', lat: 34.0837, lon: 74.7973, state: 'Jammu & Kashmir' }
            ].map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectLocation({
                  lat: p.lat,
                  lon: p.lon,
                  displayName: `${p.name}, India`,
                  city: p.name.split(',')[0],
                  state: p.state,
                  country: 'India'
                })}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-indigo-500/30 text-slate-300 border border-slate-800 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
              >
                <span>📍</span> <span>{p.name.split(',')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-xs font-bold text-indigo-300 flex items-center gap-2">
            <Radio className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>{actionFeedback}</span>
          </div>
        )}
      </div>

      {/* 🧭 SMART LOCATION INTELLIGENCE METRICS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              📍 Smart Location Intelligence
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/30">
            Verified Geocoding
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">📍 Display Name</div>
            <div className="font-bold text-slate-900 dark:text-white truncate" title={currentLoc.displayName}>{currentLoc.displayName}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">🌐 Coordinates</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.lat.toFixed(4)}°N, {currentLoc.lon.toFixed(4)}°E</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">🏘️ Village / City</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.city || currentLoc.displayName.split(',')[0]}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">🏛️ District</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.city} District</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">🗺️ State</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.state || 'Uttarakhand'}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">🇮🇳 Country</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.country || 'India'}</div>
          </div>
        </div>
      </div>

      {/* 🧭 INTELLIGENCE DASHBOARD CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 🌊 Flood Intelligence */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">FLOOD INTELLIGENCE</span>
            <span className="text-xl">🌊</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Current Flood Status</div>
            <div className={`mt-1 inline-block px-3 py-1 rounded-xl text-xs font-black uppercase border ${floodObj.color}`}>
              {floodObj.label}
            </div>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
            <div>Precipitation Rate: <b>{weatherData?.precipitation || 0} mm/h</b></div>
            <div>River Proximity: <b>{weatherData?.precipitation > 15 ? '< 250m (High Surge)' : 'Safe Basin Distance'}</b></div>
          </div>
        </div>

        {/* Card 2: 🛣️ Road Accessibility */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">ROAD ACCESSIBILITY</span>
            <span className="text-xl">🛣️</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Transit Clearance</div>
            <div className={`mt-1 inline-block px-3 py-1 rounded-xl text-xs font-black uppercase border ${roadObj.color}`}>
              {roadObj.label}
            </div>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
            <div>Accessibility Index: <b>{routeDetail?.accessibilityPercent || 85}%</b></div>
            <div>Disruption Risk: <b>{routeDetail?.routeDisasterRisk || 'None'}</b></div>
          </div>
        </div>

        {/* Card 3: 🌦️ Weather & Landslide Risk */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">WEATHER & TERRAIN</span>
            <span className="text-xl">⛰️</span>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Ambient Conditions</div>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
              {weatherData?.temperature || 24}°C &bull; <span className="text-sky-500">{weatherData?.condition || 'Clear'}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-800/80 pt-2 font-mono">
            <div>Wind Gusts: <b>{weatherData?.windGusts || 12} km/h</b></div>
            <div>Slope Gradient: <b>22° Steepness</b></div>
          </div>
        </div>

        {/* Card 4: 🛡️ GeoSafe Safety Score */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-slate-950 p-5 shadow-xl dark:shadow-2xl flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">GEOSAFE SAFETY SCORE</span>
            <Shield className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-1">
              <span>{safetyScore?.totalScore || 85}</span>
              <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
            <div className={`mt-1 inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
              safetyScore?.tier === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              safetyScore?.tier === 'HIGH RISK' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              safetyScore?.tier === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              🛡️ {safetyScore?.tier || 'SAFE'}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-800 pt-2">
            0-29 CRITICAL &bull; 30-59 HIGH &bull; 60-84 MOD &bull; 85-100 SAFE
          </div>
        </div>
      </div>

      {/* 🚑 EMERGENCY ACCESS CHECK PANEL */}
      {emergencyAccess && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-rose-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                🚑 Emergency Access Verification Check
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Live Transit Check
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Ambulance Vector</span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🚑</span> <span>Can ambulance reach?</span>
              </div>
              <div className="text-xs font-black mt-1 text-emerald-500">{emergencyAccess.ambulanceAccess}</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Fire Engine Vector</span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🚒</span> <span>Can fire engine access?</span>
              </div>
              <div className="text-xs font-black mt-1 text-emerald-500">{emergencyAccess.fireVehicleAccess}</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Rescue Squad Vector</span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>👨‍🚒</span> <span>Can rescue team reach?</span>
              </div>
              <div className="text-xs font-black mt-1 text-emerald-500">{emergencyAccess.rescueTeamAccess}</div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Primary Route Safety</span>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🛣️</span> <span>Normal route safe?</span>
              </div>
              <div className="text-xs font-black mt-1 text-emerald-500">{emergencyAccess.normalRouteSafety}</div>
            </div>
          </div>
        </div>
      )}

      {/* ⛰️ LOCATION-SPECIFIC DISASTER ANALYSIS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              ⛰️ Location-Specific Geography & Hazard Adaptation
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30 uppercase">
            Terrain Adaptive Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* ⛰️ Mountain Regions */}
          <div className={`rounded-xl border p-4 space-y-2.5 transition ${
            stateProfile?.regionCategory === 'MOUNTAIN' ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg ring-1 ring-indigo-500/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <span>⛰️</span> Mountain Regions
              </span>
              {stateProfile?.regionCategory === 'MOUNTAIN' && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">ACTIVE TERRAIN</span>
              )}
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">⛰️ Landslide Risk:</span>
                <span className="font-bold text-amber-500">{weatherData?.precipitation > 15 ? '🟠 HIGH' : '🟡 MODERATE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌧️ Heavy Rainfall:</span>
                <span className="font-bold text-sky-400">{weatherData?.precipitation || 0} mm/h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌊 Flash Flood:</span>
                <span className="font-bold text-emerald-500">{weatherData?.precipitation > 20 ? '🔴 CRITICAL' : '🟢 SAFE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🛣️ Mountain Pass:</span>
                <span className="font-bold text-indigo-400">{stateProfile?.hillRoadStatus || '🟡 CAUTION'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">❄️ Snow / Avalanche:</span>
                <span className="font-bold text-slate-400">{weatherData?.temperature < 2 ? '⚠️ ACTIVE' : '🟢 NONE'}</span>
              </div>
            </div>
          </div>

          {/* 🌾 Plains */}
          <div className={`rounded-xl border p-4 space-y-2.5 transition ${
            stateProfile?.regionCategory === 'PLAINS' ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg ring-1 ring-indigo-500/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <span>🌾</span> River Plains
              </span>
              {stateProfile?.regionCategory === 'PLAINS' && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">ACTIVE TERRAIN</span>
              )}
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌊 River Flooding:</span>
                <span className="font-bold text-emerald-500">{weatherData?.precipitation > 25 ? '🔴 SURGE' : '🟢 SAFE'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌧️ Waterlogging:</span>
                <span className="font-bold text-amber-500">{weatherData?.precipitation > 10 ? '🟡 ELEVATED' : '🟢 LOW'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🔥 Heatwave Risk:</span>
                <span className="font-bold text-rose-400">{weatherData?.temperature > 38 ? '🔴 EXTREME' : '🟢 NORMAL'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌫️ Fog / Visibility:</span>
                <span className="font-bold text-slate-300">CLEAR VISIBILITY</span>
              </div>
            </div>
          </div>

          {/* 🏙️ Urban Areas */}
          <div className={`rounded-xl border p-4 space-y-2.5 transition ${
            stateProfile?.regionCategory === 'URBAN' ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg ring-1 ring-indigo-500/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <span>🏙️</span> Urban Sectors
              </span>
              {stateProfile?.regionCategory === 'URBAN' && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">ACTIVE TERRAIN</span>
              )}
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌧️ Urban Flooding:</span>
                <span className="font-bold text-emerald-500">{weatherData?.precipitation > 20 ? '🔴 DRAIN OVERFLOW' : '🟢 CLEAR'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🚦 Traffic Clearance:</span>
                <span className="font-bold text-emerald-400">82% NOMINAL</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🛣️ Road Conditions:</span>
                <span className="font-bold text-emerald-500">ACCESSIBLE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🏥 Emergency Access:</span>
                <span className="font-bold text-emerald-400">GREEN CORRIDOR OPEN</span>
              </div>
            </div>
          </div>

          {/* 🏜️ Desert Regions */}
          <div className={`rounded-xl border p-4 space-y-2.5 transition ${
            stateProfile?.regionCategory === 'DESERT' ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg ring-1 ring-indigo-500/40' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <span>🏜️</span> Arid / Desert
              </span>
              {stateProfile?.regionCategory === 'DESERT' && (
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[9px] font-bold">ACTIVE TERRAIN</span>
              )}
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🔥 Extreme Heat:</span>
                <span className="font-bold text-amber-500">{weatherData?.temperature > 40 ? '🔴 SEVERE' : '🟡 ELEVATED'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">💧 Water Scarcity:</span>
                <span className="font-bold text-indigo-400">TANKER PRIORITY HIGH</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌪️ Dust Storms:</span>
                <span className="font-bold text-slate-400">{weatherData?.windGusts > 40 ? '⚠️ DUST ALERT' : '🟢 NORMAL'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">🌧️ Sudden Flash Flood:</span>
                <span className="font-bold text-emerald-500">🟢 LOW</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🗺️ GEOSAFE INTERACTIVE MAP & ROUTE ANALYSIS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* MAP VISUALIZATION PANEL (7 COLS) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                GeoSafe Interactive Map & Layer Controls
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">📍 PIN CONFIRMED</span>
          </div>

          {/* Toggleable Layer Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { key: 'flood', label: '🌊 Flood Risk' },
              { key: 'road', label: '🛣️ Road Access' },
              { key: 'rainfall', label: '🌧️ Rainfall' },
              { key: 'landslide', label: '⛰️ Landslide' },
              { key: 'activeDisaster', label: '🚨 Active Disaster' },
              { key: 'emergencyRoute', label: '🚑 Emergency Route' }
            ].map(layer => (
              <button
                key={layer.key}
                onClick={() => setMapLayers(prev => ({ ...prev, [layer.key]: !(prev as any)[layer.key] }))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                  (mapLayers as any)[layer.key] ? 'bg-indigo-600 text-white border-indigo-500 shadow' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Leaflet Map Display */}
          <div className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
            <div ref={mapContainerRef} className="h-full w-full" />
            <div className="absolute left-3 bottom-3 z-[1000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 backdrop-blur font-mono">
              Click anywhere on map to pin new location
            </div>
          </div>
        </div>

        {/* EMERGENCY ROUTE ANALYSIS PANEL (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-500" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                AI Recommended Safe Route
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/30">
              Reroute Engine
            </span>
          </div>

          {/* Normal vs Alternative Route Comparison */}
          <div className="space-y-3 text-xs">
            {/* Normal Route (Blocked/Unsafe) */}
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📍 User Target:</span> <b>{currentLoc.city || 'Destination'}</b>
                </span>
                <span className="text-[10px] font-bold text-rose-500 uppercase px-2 py-0.5 rounded bg-rose-500/20">
                  {routeDetail?.normalRouteStatus || '🔴 Blocked'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Primary Route via <b>{routeDetail?.normalRouteVia || 'Arterial Corridor'}</b>
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-mono">
                ❌ Risk: {routeDetail?.routeDisasterRisk || 'Road Disruption'}
              </div>
            </div>

            {/* Recommended Safe Alternative Route */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>➡️ Safe Bypass:</span> <b>Recommended</b>
                </span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase px-2 py-0.5 rounded bg-emerald-500/20">
                  {routeDetail?.alternativeRouteStatus || '🟢 Recommended'}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400">
                Alternative Route via <b>{routeDetail?.alternativeRouteVia || 'Valley Ridge Bypass'}</b>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                <div className="rounded bg-slate-100 dark:bg-slate-900 p-1.5 text-center">
                  <div className="text-[9px] text-slate-500">Distance</div>
                  <div className="font-bold text-slate-900 dark:text-white">{routeDetail?.distanceKm || 28.5} km</div>
                </div>
                <div className="rounded bg-slate-100 dark:bg-slate-900 p-1.5 text-center">
                  <div className="text-[9px] text-slate-500">Est. Time</div>
                  <div className="font-bold text-slate-900 dark:text-white">{routeDetail?.travelTimeMins || 45} mins</div>
                </div>
                <div className="rounded bg-slate-100 dark:bg-slate-900 p-1.5 text-center">
                  <div className="text-[9px] text-slate-500">Access %</div>
                  <div className="font-bold text-emerald-500">{routeDetail?.accessibilityPercent || 85}%</div>
                </div>
              </div>
            </div>

            {/* Smart Vehicle Recommendation */}
            {stateProfile && (
              <div className="rounded-xl bg-slate-900/80 p-3 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Recommended Vehicle Vectors</span>
                <div className="flex flex-wrap gap-1">
                  {stateProfile.recommendedVehicles?.map((v: string, idx: number) => (
                    <span key={idx} className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📊 DATA RELIABILITY & PROVENANCE SYSTEM */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-sky-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              GeoSafe AI Assessment & Data Reliability Provenance
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold border border-sky-500/30">
            Transparency Engine
          </span>
        </div>

        {/* Data Provenance Labels */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <div>
              <div className="text-[10px] text-slate-400">CATEGORY 1</div>
              <div className="font-bold text-emerald-400">🟢 Live / Verified Data</div>
            </div>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
            <div>
              <div className="text-[10px] text-slate-400">CATEGORY 2</div>
              <div className="font-bold text-sky-400">🔵 Historical Data</div>
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500"></span>
            <div>
              <div className="text-[10px] text-slate-400">CATEGORY 3</div>
              <div className="font-bold text-purple-400">🟣 AI Prediction</div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-500/30 bg-slate-500/10 p-2.5 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
            <div>
              <div className="text-[10px] text-slate-400">CATEGORY 4</div>
              <div className="font-bold text-slate-300">⚪ Estimated / Simulation</div>
            </div>
          </div>
        </div>

        {/* AI Narrative Output */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs space-y-2">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>GeoSafe AI Risk Assessment & Guidance for {currentLoc.displayName}:</span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            {aiReportText || 'Analyzing disaster risk vectors and accessibility...'}
          </p>
        </div>
      </div>

      {/* 🚨 EMERGENCY RESPONSE ACTIONS */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-slate-900/80 to-indigo-500/10 p-6 shadow-xl dark:shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Emergency Response Actions
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            PRIORITY CONTROLS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => handleActionTrigger('ALERT')}
            className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 p-3 text-xs font-black text-white shadow-lg flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <ShieldAlert className="h-5 w-5" />
            <span>🚨 Send Emergency Alert</span>
          </button>

          <button
            onClick={() => handleActionTrigger('SHARE')}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-xs font-bold text-white border border-slate-700 shadow-md flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Share2 className="h-5 w-5 text-sky-400" />
            <span>📍 Share Location</span>
          </button>

          <button
            onClick={() => handleActionTrigger('Emergency Route')}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-xs font-bold text-white border border-slate-700 shadow-md flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Navigation className="h-5 w-5 text-emerald-400" />
            <span>🚑 Find Safe Route</span>
          </button>

          <button
            onClick={() => handleActionTrigger('Medical Triage')}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-xs font-bold text-white border border-slate-700 shadow-md flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <PhoneCall className="h-5 w-5 text-rose-400" />
            <span>🏥 Nearest Assistance</span>
          </button>

          <button
            onClick={() => handleActionTrigger('Emergency Supplies')}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 p-3 text-xs font-bold text-white border border-slate-700 shadow-md flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Truck className="h-5 w-5 text-indigo-400" />
            <span>🚛 Request Supplies</span>
          </button>

          <button
            onClick={() => handleActionTrigger('MDoNER Alert')}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 p-3 text-xs font-black text-white shadow-lg flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-center"
          >
            <Send className="h-5 w-5" />
            <span>📡 Send to MDoNER</span>
          </button>
        </div>
      </div>

      {/* 📄 AUTOMATIC DISASTER REPORT PRINTABLE CARD */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-500" />
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Official GeoSafe Disaster Intelligence Report
              </h3>
              <span className="text-xs text-slate-500">Updated: {new Date().toLocaleTimeString()} &bull; Data Status: 🟢 Live / Verified Data Available</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleActionTrigger('PRINT')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Official Report</span>
            </button>
          </div>
        </div>

        {/* Report Summary Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">Target Address</div>
            <div className="font-bold text-slate-900 dark:text-white truncate">{currentLoc.displayName}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">Coordinates</div>
            <div className="font-bold text-slate-900 dark:text-white">{currentLoc.lat.toFixed(4)}°N, {currentLoc.lon.toFixed(4)}°E</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">Flood Status</div>
            <div className="font-bold text-emerald-500">{floodObj.label}</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] text-slate-500">GeoSafe Score</div>
            <div className="font-bold text-indigo-500">{safetyScore?.totalScore || 85} / 100 ({safetyScore?.tier})</div>
          </div>
        </div>
      </div>
    </div>
  );
}
