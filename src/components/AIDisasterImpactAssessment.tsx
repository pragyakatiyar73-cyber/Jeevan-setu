import { useTranslation } from "../i18n";
import React, { useState, useEffect, useRef } from 'react';
import SmartSearchInput from './common/SmartSearchInput';
import {
  Camera,
  Upload,
  Bot,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  MapPin,
  RefreshCw,
  FileText,
  Activity,
  Compass,
  Search,
  Check,
  Send,
  Info,
  Shield,
  Layers,
  CloudRain,
  Mountain,
  Truck,
  Eye,
  ToggleLeft,
  ToggleRight,
  Download,
  Printer
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  searchMonitoringLocation,
  reverseGeocodeMonitoring,
  GeocodedLocation,
  dispatchMDoNERAlert
} from '../services/api';
import { getSpellingSuggestions, getDidYouMeanSuggestion } from '../utils/locationSpellCheck';
import {
  runAIDisasterImpactAnalysis,
  saveAssessmentRecord,
  parseImageEXIF,
  FullImpactAssessmentResult
} from '../services/api/aiImpact';

interface AIDisasterImpactAssessmentProps {
  onNavigateToMonitoring?: (loc: { lat: number; lon: number; name: string }) => void;
  initialLoc?: GeocodedLocation;
}

export default function AIDisasterImpactAssessment({
 onNavigateToMonitoring, initialLoc }: AIDisasterImpactAssessmentProps) {
  const { t } = useTranslation();
  // Demo Mode State
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Photo & Evidence State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [uploadTime, setUploadTime] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Location State
  const [locationLoc, setLocationLoc] = useState<GeocodedLocation>(
    initialLoc || {
      lat: 25.5788,
      lon: 91.8933,
      displayName: 'East Khasi Hills Sector, Meghalaya',
      state: 'Meghalaya',
      country: 'India'
    }
  );
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [geoToast, setGeoToast] = useState<string | null>(null);
  const [latInput, setLatInput] = useState<string>(locationLoc.lat.toString());
  const [lonInput, setLonInput] = useState<string>(locationLoc.lon.toString());

  // Leaflet Map Reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Analysis Result State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<FullImpactAssessmentResult | null>(null);

  // MDoNER Dispatch Modal State
  const [mdonerModalOpen, setMdonerModalOpen] = useState<boolean>(false);
  const [mdonerMsg, setMdonerMsg] = useState<string>('');
  const [mdonerAgency, setMdonerAgency] = useState<string>('NDRF 1078 Triage Command & MDoNER Emergency Dispatch');
  const [mdonerSending, setMdonerSending] = useState<boolean>(false);
  const [mdonerSuccess, setMdonerSuccess] = useState<boolean>(false);

  // Sample Presets
  const sampleImages = [
    {
      title: 'Mountain Slope Breach (NH-6)',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      locName: 'Km 142 East Khasi Hills, Meghalaya',
      lat: 25.5788,
      lon: 91.8933
    },
    {
      title: 'Teesta Basin Flash Flood Overwash',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
      locName: 'Teesta River Basin, Gangtok, Sikkim',
      lat: 27.3389,
      lon: 88.6065
    },
    {
      title: 'Sela Pass Slurry & Boulder Barrier',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
      locName: 'Sela Pass Corridor (NH-13), Arunachal Pradesh',
      lat: 27.0844,
      lon: 93.6053
    }
  ];

  // Sync initial location if passed
  useEffect(() => {
    if (initialLoc) {
      setLocationLoc(initialLoc);
      setLatInput(initialLoc.lat.toString());
      setLonInput(initialLoc.lon.toString());
    }
  }, [initialLoc]);

  // Handle Photo Upload with validation
  const handleFileUpload = async (file: File) => {
    setUploadError(null);

    // Validation: Type Check
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid file format. Please upload JPG, PNG, or WebP disaster imagery.');
      return;
    }

    // Validation: Size Check (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit. Please upload a smaller image file.');
      return;
    }

    setFileName(file.name);
    setFileSizeStr((file.size / (1024 * 1024)).toFixed(2) + ' MB');
    setUploadTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // Check EXIF metadata
    const gps = await parseImageEXIF(file);
    if (gps && gps.lat && gps.lon) {
      const geo = await reverseGeocodeMonitoring(gps.lat, gps.lon);
      setLocationLoc(geo);
      setLatInput(geo.lat.toString());
      setLonInput(geo.lon.toString());
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setAssessment(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof sampleImages[0]) => {
    setUploadError(null);
    setSelectedImage(sample.url);
    setFileName(`${sample.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`);
    setFileSizeStr('1.85 MB');
    setUploadTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    const geo: GeocodedLocation = {
      lat: sample.lat,
      lon: sample.lon,
      displayName: sample.locName,
      state: 'NER Sector',
      country: 'India'
    };
    setLocationLoc(geo);
    setLatInput(sample.lat.toString());
    setLonInput(sample.lon.toString());
    setAssessment(null);
  };

  // Location Search & Geocoding Handlers
  const handleLocationSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchMonitoringLocation(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
    if (results && results.length > 0) {
      handleSelectSearchResult(results[0]);
    }
  };

  const handleSelectSearchResult = (res: GeocodedLocation) => {
    setLocationLoc(res);
    setLatInput(res.lat.toString());
    setLonInput(res.lon.toString());
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleManualCoordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (!isNaN(lat) && !isNaN(lon)) {
      const geo = await reverseGeocodeMonitoring(lat, lon);
      setLocationLoc(geo);
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = parseFloat(pos.coords.latitude.toFixed(4));
          const lon = parseFloat(pos.coords.longitude.toFixed(4));
          setLatInput(lat.toString());
          setLonInput(lon.toString());
          const geo = await reverseGeocodeMonitoring(lat, lon);
          setLocationLoc(geo);
        },
        err => {
          setGeoToast(`Geolocation unavailable: ${err.message}`);
          setTimeout(() => setGeoToast(null), 5000);
        }
      );
    } else {
      setGeoToast('Geolocation is not supported by your browser.');
      setTimeout(() => setGeoToast(null), 5000);
    }
  };

  // Initialize and Update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([locationLoc.lat, locationLoc.lon], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      map.on('click', async (e: L.LeafletMouseEvent) => {
        const lat = parseFloat(e.latlng.lat.toFixed(4));
        const lon = parseFloat(e.latlng.lng.toFixed(4));
        setLatInput(lat.toString());
        setLonInput(lon.toString());
        const geo = await reverseGeocodeMonitoring(lat, lon);
        setLocationLoc(geo);
      });
    } else {
      mapInstanceRef.current.setView([locationLoc.lat, locationLoc.lon], 12);
    }

    const map = mapInstanceRef.current;
    if (markerRef.current) map.removeLayer(markerRef.current);

    const customMarkerIcon = L.divIcon({
      className: 'custom-assessment-pin',
      html: `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(99, 102, 241, 0.9);
          border: 2px solid #ffffff;
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.8);
        ">
          <span style="font-size: 15px;">🤖</span>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    markerRef.current = L.marker([locationLoc.lat, locationLoc.lon], { icon: customMarkerIcon }).addTo(map);
    markerRef.current.bindPopup(`
      <div style="font-family: sans-serif; font-size: 11px; color: #0f172a;">
        <b style="color: #6366f1;">🤖 TARGET ASSESSMENT SITE</b><br/>
        <b>${locationLoc.displayName}</b><br/>
        Lat: ${locationLoc.lat.toFixed(4)} &bull; Lon: ${locationLoc.lon.toFixed(4)}
      </div>
    `).openPopup();
  }, [locationLoc]);

  // Run Assessment Analysis
  const handleRunFullAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await runAIDisasterImpactAnalysis(
      locationLoc.displayName,
      locationLoc.lat,
      locationLoc.lon,
      selectedImage || undefined,
      isDemoMode
    );
    setAssessment(result);
    await saveAssessmentRecord(result);
    setIsAnalyzing(false);
  };

  // Dispatch MDoNER Alert Handler
  const handleSendMDoNERAlert = async () => {
    if (!assessment) return;
    setMdonerSending(true);
    const res = await dispatchMDoNERAlert({
      locationName: assessment.locationName,
      disasterType: assessment.disasterType,
      riskLevel: assessment.overallSeverity,
      message: mdonerMsg || `Urgent: AI Disaster Impact Assessment computed ${assessment.overallSeverity} severity (${assessment.impactScore}/100 score) at ${assessment.locationName}. Visual damage: ${assessment.vision.visibleDamage[0] || 'Road breach'}.`,
      sender: 'AI-IMPACT-ASSESSMENT-COMMAND'
    });

    setMdonerSending(false);
    setMdonerSuccess(true);

    setTimeout(() => {
      setMdonerSuccess(false);
      setMdonerModalOpen(false);
      setMdonerMsg('');
    }, 2200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 p-5 lg:p-8 space-y-6 font-sans transition-colors duration-300">
      
      {/* 1. TOP HEADER & DEMO MODE BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              🤖 AI DISASTER IMPACT ASSESSMENT CENTER
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs lg:text-sm font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              Gemini Multimodal & Verified Data Pipeline
            </span>
            {isDemoMode && (
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs lg:text-sm font-extrabold text-amber-700 dark:text-amber-400 border border-amber-500/40">
                ⚠️ DEMO DATA ACTIVE
              </span>
            )}
          </div>

          <h1 className="mt-2 text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            {t("aiimpact.title", "Multimodal Photo Damage Assessment & Impact Analytics")}
          </h1>
          <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium max-w-4xl leading-relaxed">
            {t("aiimpact.subtitle", "Combines disaster imagery with confirmed location context, Gemini visual analysis, and real-world environmental data to compute an explainable impact score.")}
          </p>
        </div>

        {/* Header Actions: Demo Mode Toggle & Cross-Feature Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`rounded-xl border px-4 py-2.5 text-xs lg:text-sm font-extrabold flex items-center gap-2 transition cursor-pointer ${
              isDemoMode ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/40' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isDemoMode ? <ToggleRight className="h-4 w-4 text-amber-500" /> : <ToggleLeft className="h-4 w-4 text-slate-400" />}
            <span>{isDemoMode ? 'Demo Mode (ON)' : 'Demo Mode (OFF)'}</span>
          </button>

          {onNavigateToMonitoring && (
            <button
              onClick={() => onNavigateToMonitoring({ lat: locationLoc.lat, lon: locationLoc.lon, name: locationLoc.displayName })}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-xs lg:text-sm font-extrabold text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 flex items-center gap-2 cursor-pointer border border-sky-400/40"
            >
              <span>View in 🛰️ Smart Disaster Monitoring</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. UPLOAD DISASTER EVIDENCE & LOCATION SELECTOR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN (6 COLS): UPLOAD DISASTER EVIDENCE */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
              <span>{t("aiimpact.uploadPhotoTitle", "Upload Disaster Evidence Photo")}</span>
            </h2>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">JPG, PNG, WEBP &bull; Max 10MB</span>
          </div>

          {/* Upload Dropzone */}
          <div className="relative h-64 w-full rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            {selectedImage ? (
              <>
                <img src={selectedImage} alt="Disaster Evidence Preview" className="h-full w-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent p-3 flex justify-between items-end">
                  <div className="text-xs">
                    <div className="font-bold text-white truncate max-w-[200px]">{fileName}</div>
                    <div className="text-[10px] text-slate-300 font-mono">{fileSizeStr} &bull; Uploaded {uploadTime}</div>
                  </div>
                  <button
                    onClick={() => { setSelectedImage(null); setAssessment(null); }}
                    className="rounded-lg bg-slate-950/90 px-3 py-1 text-xs text-rose-400 font-bold border border-rose-500/40 backdrop-blur hover:bg-rose-500 hover:text-white transition"
                  >
                    Remove Photo
                  </button>
                </div>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center space-y-2 text-center p-6">
                <Upload className="h-10 w-10 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t("aiimpact.uploadPhotoSub", "Click or Drag & Drop disaster site image here")}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("aiimpact.supportsText", "Supports ground photos, mobile captures & drone imagery")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {uploadError && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Sample Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pre-Loaded NER Disaster Imagery Presets</span>
            <div className="grid grid-cols-3 gap-2">
              {sampleImages.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="group relative h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition text-left"
                >
                  <img src={sample.url} alt={sample.title} className="h-full w-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-1.5 flex flex-col justify-end">
                    <span className="text-[10px] font-bold text-white leading-tight">{sample.title}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6 COLS): DISASTER LOCATION SELECTOR */}
        <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                <span>{t("aiimpact.confirmedLocationTitle", "📍 Confirmed Disaster Location")}</span>
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Geocoded Context</span>
            </div>

            {/* Address Search & Map Selector */}
            <div className="mt-3 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <form onSubmit={handleLocationSearch} className="flex items-center gap-2">
                  <SmartSearchInput
                    placeholder="Search address, village, or landmark..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={q => {
                      setSearchQuery(q);
                      handleLocationSearch(new Event('submit') as any);
                    }}
                    searchType="location"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </form>

                {/* Did You Mean Spelling Suggestion Banner */}
                {searchQuery.trim().length >= 2 && (() => {
                  const dyM = getDidYouMeanSuggestion(searchQuery);
                  if (!dyM) return null;
                  return (
                    <div className="mt-1.5 flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>Did you mean:</span>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectSearchResult({
                            lat: dyM.lat,
                            lon: dyM.lon,
                            displayName: `${dyM.name}, ${dyM.state}, India`,
                            city: dyM.name,
                            state: dyM.state,
                            country: "India"
                          });
                        }}
                        className="font-bold underline hover:text-amber-800 dark:hover:text-amber-200 transition"
                      >
                        {dyM.name} ({dyM.state})
                      </button>
                    </div>
                  );
                })()}

                {/* Auto-Suggest & Search Results Dropdown */}
                {(searchResults.length > 0 || (searchQuery.trim().length >= 2 && getSpellingSuggestions(searchQuery).length > 0)) && (
                  <div className="absolute left-0 right-0 top-12 z-[2000] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-2xl max-h-56 overflow-y-auto">
                    {searchQuery.trim().length >= 2 && getSpellingSuggestions(searchQuery).length > 0 && (
                      <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase px-2 py-1 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Suggested Locations / Auto-Correct</span>
                        </div>
                        {getSpellingSuggestions(searchQuery).map((item, idx) => (
                          <div
                            key={`impact_sug_${idx}`}
                            onClick={() => handleSelectSearchResult({
                              lat: item.lat,
                              lon: item.lon,
                              displayName: `${item.name}, ${item.state}, India`,
                              city: item.name,
                              state: item.state,
                              country: "India"
                            })}
                            className="cursor-pointer rounded-lg p-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-950/40 transition flex items-center justify-between"
                          >
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                              <span>{item.name} ({item.state})</span>
                            </div>
                            <span className="text-[9px] font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                              {item.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">OpenStreetMap Direct Results</div>
                        {searchResults.map((res, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelectSearchResult(res)}
                            className="cursor-pointer rounded-lg p-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <div className="font-semibold text-slate-900 dark:text-white">{res.displayName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Lat: {res.lat.toFixed(4)}, Lon: {res.lon.toFixed(4)}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Lat/Lon Inputs & Geolocation */}
              <div className="flex items-center gap-2">
                <form onSubmit={handleManualCoordSubmit} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[11px] text-slate-500 font-mono">Lat:</span>
                    <input
                      type="text"
                      value={latInput}
                      onChange={e => setLatInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white font-mono text-center"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[11px] text-slate-500 font-mono">Lon:</span>
                    <input
                      type="text"
                      value={lonInput}
                      onChange={e => setLonInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs text-slate-900 dark:text-white font-mono text-center"
                    />
                  </div>
                  <button type="submit" className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                    Set
                  </button>
                </form>

                <button
                  onClick={handleUseCurrentLocation}
                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1"
                >
                  <Compass className="h-3.5 w-3.5" />
                  My Location
                </button>
              </div>

              {/* Location Display Info */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-xs">
                <div className="text-[10px] uppercase font-bold text-slate-500">Confirmed Target Location</div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">{locationLoc.displayName}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1">
                  Latitude: <b className="text-slate-800 dark:text-slate-200">{locationLoc.lat.toFixed(4)}° N</b> &bull; Longitude: <b className="text-slate-800 dark:text-slate-200">{locationLoc.lon.toFixed(4)}° E</b>
                </div>
              </div>

              {/* Leaflet Pin Map Picker */}
              <div className="h-36 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                <div ref={mapContainerRef} className="h-full w-full" />
                <div className="absolute left-2 bottom-2 z-[1000] rounded-lg border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-2 py-1 text-[10px] text-slate-700 dark:text-slate-300 backdrop-blur">
                  {t("aiimpact.clickMapToPin", "Click map to pin disaster location")}
                </div>
              </div>
            </div>
          </div>

          {/* Run Multimodal Impact Assessment Button */}
          <button
            onClick={handleRunFullAnalysis}
            disabled={!selectedImage || isAnalyzing}
            className={`w-full mt-3 rounded-xl py-3.5 text-xs font-bold text-white shadow-xl flex items-center justify-center gap-2 transition ${
              !selectedImage || isAnalyzing ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 shadow-indigo-600/30'
            }`}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Executing Gemini Vision & Environmental Impact Assessment...</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                <span>Run AI Disaster Impact Assessment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. GEMINI VISION ANALYSIS & OVERALL SEVERITY BANNER */}
      {assessment && (
        <div className="space-y-6">

          {/* OVERALL SEVERITY & EXPLAINABLE SCORE BANNER */}
          <div className={`rounded-2xl border p-6 shadow-xl dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300 ${
            assessment.overallSeverity === 'CRITICAL' ? 'border-rose-500/50 bg-rose-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-rose-950/40 dark:to-slate-900' :
            assessment.overallSeverity === 'HIGH' ? 'border-amber-500/50 bg-amber-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-amber-950/40 dark:to-slate-900' :
            'border-sky-500/50 bg-sky-50 dark:bg-gradient-to-r dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-900'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">DISASTER IMPACT SEVERITY</span>
                <span className="rounded bg-white/80 dark:bg-slate-950/80 px-2 py-0.5 text-[10px] font-mono text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-800">
                  {assessment.disclaimer}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className={`h-8 w-8 ${assessment.overallSeverity === 'CRITICAL' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-400'}`} />
                  <span>{assessment.overallSeverity} IMPACT</span>
                </div>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-xl">
                Based on uploaded visual evidence + available verified location/environmental data ({assessment.locationName}).
              </p>
            </div>

            {/* Score Badge */}
            <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-300 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">AI-Assisted Estimated Impact Score</span>
                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{assessment.impactScore} <span className="text-base text-slate-500 font-normal">/ 100</span></div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">Confidence: {assessment.confidencePercent}%</div>
              </div>
            </div>
          </div>

          {/* GEMINI VISION ANALYSIS & 4-CATEGORY IMPACT RATING GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* GEMINI VISION EVIDENCE CARD (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bot className="h-5 w-5 text-sky-500 dark:text-sky-400" />
                  <span>Gemini Vision Analysis (Visible Evidence)</span>
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">CONFIDENCE: {assessment.confidencePercent}%</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400">Classified Disaster Type:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{assessment.vision.disasterType}</span>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Visible Structural & Terrain Damage</span>
                  <div className="space-y-1 text-slate-800 dark:text-slate-200">
                    {assessment.vision.visibleDamage.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Affected Infrastructure Elements</span>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.vision.affectedInfrastructure.map((infra, idx) => (
                      <span key={idx} className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                        {infra}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4-CATEGORY IMPACT RATING CARD (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-rose-500 dark:text-rose-400" />
                  <span>4-Category Impact Assessment</span>
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Human & Infra Risk</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Human Safety Impact</span>
                  <div className={`text-base font-bold ${assessment.impactCategories.humanSafety.rating === 'CRITICAL' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {assessment.impactCategories.humanSafety.rating}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{assessment.impactCategories.humanSafety.evidence}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Infrastructure Impact</span>
                  <div className={`text-base font-bold ${assessment.impactCategories.infrastructure.rating === 'CRITICAL' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {assessment.impactCategories.infrastructure.rating}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{assessment.impactCategories.infrastructure.evidence}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Transportation Impact</span>
                  <div className={`text-base font-bold ${assessment.impactCategories.transportation.rating === 'CRITICAL' ? 'text-rose-600 dark:text-rose-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    {assessment.impactCategories.transportation.rating}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{assessment.impactCategories.transportation.evidence}</p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Environmental Impact</span>
                  <div className={`text-base font-bold ${assessment.impactCategories.environmental.rating === 'CRITICAL' ? 'text-rose-600 dark:text-rose-500' : 'text-indigo-600 dark:text-indigo-300'}`}>
                    {assessment.impactCategories.environmental.rating}
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-snug">{assessment.impactCategories.environmental.evidence}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ENVIRONMENTAL CONTEXT & IDENTIFIED RISK FACTORS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ENVIRONMENTAL CONTEXT PANEL (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CloudRain className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  <span>Verified Environmental & Terrain Context</span>
                </h3>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">LIVE TELEMETRY</span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Temperature</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{assessment.environmentalContext.temperature}°C</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Precipitation</span>
                  <div className="text-lg font-bold text-sky-600 dark:text-sky-400">{assessment.environmentalContext.precipitation} mm</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Terrain Slope</span>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{assessment.environmentalContext.slopeDegrees}°</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Soil Moisture</span>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{assessment.environmentalContext.soilMoisturePercent}%</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Fault Line Dist</span>
                  <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{assessment.environmentalContext.faultDistanceKm} km</div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Elevation</span>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{assessment.environmentalContext.elevationMsl}m</div>
                </div>
              </div>
            </div>

            {/* IDENTIFIED RISK FACTORS & RECOMMENDATIONS (6 COLS) */}
            <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <span>Identified Risk Factors & Recommendations</span>
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Risk Factors (Categorized by Evidence Basis)</span>
                  <div className="space-y-1.5">
                    {assessment.riskFactors.map(rf => (
                      <div key={rf.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                        <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${rf.severity === 'RED' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                          {rf.factor}
                        </span>
                        <span className="rounded bg-slate-200 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                          {rf.basis}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">AI-Assisted Response Recommendations</span>
                  <div className="space-y-1">
                    {assessment.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🏔️ REGION-AWARE STATE DISASTER PROFILE & SMART VEHICLE SELECTION ENGINE */}
          {assessment.stateProfile && (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-slate-900/40 to-slate-950 p-6 shadow-xl dark:shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg shadow-inner">
                    🇮🇳
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                      <span>{assessment.stateProfile.state} Region-Aware Disaster Profile</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                        {assessment.stateProfile.regionCategory} REGION
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Adaptive disaster risk evaluation tuned for {assessment.stateProfile.state} terrain and climate</p>
                  </div>
                </div>

                {assessment.stateProfile.hillRoadStatus && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">Hill Road Accessibility:</span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border ${
                      assessment.stateProfile.hillRoadStatus.includes('🔴') ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                      assessment.stateProfile.hillRoadStatus.includes('🟡') ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    }`}>
                      {assessment.stateProfile.hillRoadStatus}
                    </span>
                  </div>
                )}
              </div>

              {/* State Specialized Sub-Systems Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Primary Hazards */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/60 p-4 space-y-2">
                  <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Primary Regional Threats</span>
                  <div className="space-y-1">
                    {assessment.stateProfile.primaryHazards?.map((h: string, idx: number) => (
                      <div key={idx} className="font-semibold text-slate-800 dark:text-slate-200">{h}</div>
                    ))}
                  </div>
                </div>

                {/* Desert Water Priority System */}
                {assessment.stateProfile.waterPriority && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/40 p-4 space-y-2">
                    <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">💧 Desert Emergency Water Priority</span>
                    <div className="text-sm font-black text-rose-500 uppercase">{assessment.stateProfile.waterPriority.urgency} WATER NEED</div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Required: <b>{assessment.stateProfile.waterPriority.drinkingWaterRequiredLiters.toLocaleString()} Liters</b></div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Cooling Shelters: <b>{assessment.stateProfile.waterPriority.coolingSheltersNeeded} Sites</b></div>
                  </div>
                )}

                {/* Agricultural Impact */}
                {assessment.stateProfile.agriImpact && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/40 p-4 space-y-2">
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">🌾 Agricultural Flood Impact</span>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">{assessment.stateProfile.agriImpact.cropDamageRiskPercent}% Crop Damage Risk</div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Flooded Farms: <b>{assessment.stateProfile.agriImpact.floodedAgriHectares} Hectares</b></div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Affected Villages: <b>{assessment.stateProfile.agriImpact.affectedVillagesCount}</b> ({assessment.stateProfile.agriImpact.villageAccessStatus})</div>
                  </div>
                )}

                {/* High Altitude Cold & Avalanche */}
                {assessment.stateProfile.highAltitudeRisk && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 dark:bg-sky-950/40 p-4 space-y-2">
                    <span className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">❄️ High Altitude Alpine Risk</span>
                    <div className="text-sm font-black text-sky-400">{assessment.stateProfile.highAltitudeRisk.extremeColdRating} COLD ALERT</div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Avalanche Risk: <b>{assessment.stateProfile.highAltitudeRisk.avalancheRiskLevel}</b></div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Vehicle Mode: <b>{assessment.stateProfile.highAltitudeRisk.vehicleSuitability}</b></div>
                  </div>
                )}

                {/* Urban Disruption */}
                {assessment.stateProfile.urbanImpact && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/40 p-4 space-y-2">
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">🏙️ Urban Waterlogging & Traffic</span>
                    <div className="text-sm font-black text-amber-500">{assessment.stateProfile.urbanImpact.waterloggingSeverity} WATERLOGGING</div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Traffic: <b>{assessment.stateProfile.urbanImpact.trafficDisruptionLevel}</b></div>
                    <div className="text-[11px] text-slate-700 dark:text-slate-300">Hospitals: <b>{assessment.stateProfile.urbanImpact.hospitalRouteStatus}</b></div>
                  </div>
                )}
              </div>

              {/* Recommended Emergency Response Vehicles & Supplies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-indigo-500/20 pt-4 text-xs">
                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    <span>AI Recommended Emergency Vehicles</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.stateProfile.recommendedVehicles?.map((v: string, idx: number) => (
                      <span key={idx} className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold text-indigo-300 border border-indigo-500/30">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/80 p-3.5 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>AI Allocated Relief Resources</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {assessment.stateProfile.recommendedResources?.map((r: string, idx: number) => (
                      <span key={idx} className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 📈 STEP 6: 72-HOUR RISK PREDICTION MATRIX TABLE */}
          {assessment.riskPrediction72h && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">72-Hour AI Disaster Risk Prediction Matrix</h3>
                    <p className="text-[11px] text-slate-500">Forecasting risk progression for +0h, +24h, +48h, and +72h time windows</p>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-bold">Step 6 Forecast</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {assessment.riskPrediction72h.map((row, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border flex flex-col justify-between gap-2.5 ${
                      row.riskLevel === 'CRITICAL' ? 'border-rose-500/40 bg-rose-500/5 dark:bg-rose-950/20' :
                      row.riskLevel === 'HIGH' ? 'border-amber-500/40 bg-amber-500/5 dark:bg-amber-950/20' :
                      row.riskLevel === 'MODERATE' ? 'border-sky-500/40 bg-sky-500/5 dark:bg-sky-950/20' :
                      'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase">{row.timeframe}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.riskLevel === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' :
                        row.riskLevel === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                        row.riskLevel === 'MODERATE' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {row.riskLevel}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">{row.predictionTitle}</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-snug">{row.expectedImpact}</p>
                    </div>

                    <div className="text-[10px] font-mono font-bold text-slate-500 border-t border-slate-200 dark:border-slate-800/60 pt-2 flex items-center justify-between">
                      <span>Trend:</span>
                      <span className="text-slate-900 dark:text-white">{row.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ASSESSMENT REPORT 📄 & MDONER ALERT DISPATCH ACTION BAR */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-indigo-500 dark:text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Official Assessment Report 📄 (#{assessment.assessmentId})
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Generated at {assessment.timestamp} &bull; Target: {assessment.locationName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMdonerModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:from-rose-500 hover:to-indigo-500 flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send Important Alert ➔ MDoNER Command</span>
                </button>

                {onNavigateToMonitoring && (
                  <button
                    onClick={() => onNavigateToMonitoring({ lat: assessment.lat, lon: assessment.lon, name: assessment.locationName })}
                    className="rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-2.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20 flex items-center gap-2"
                  >
                    <span>[View in Smart Disaster Monitoring]</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Formatted Report Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-slate-500 font-bold block">Disaster Type</span>
                  <span className="text-slate-900 dark:text-white font-bold text-sm">{assessment.disasterType}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Overall Severity</span>
                  <span className="text-rose-600 dark:text-rose-400 font-bold text-sm">{assessment.overallSeverity}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Impact Score</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">{assessment.impactScore} / 100</span>
                </div>
                <div>
                  <span className="text-slate-500 font-bold block">Coordinates</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{assessment.lat.toFixed(4)}°N, {assessment.lon.toFixed(4)}°E</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block uppercase tracking-wider">Executive Findings Summary</span>
                <p className="text-slate-800 dark:text-slate-300 leading-relaxed">
                  Visual evidence inspection confirms {assessment.vision.disasterType.toLowerCase()} impact at {assessment.locationName}. Verified environmental telemetry reports {assessment.environmentalContext.precipitation}mm rainfall rate with {assessment.environmentalContext.slopeDegrees}° terrain slope steepness.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                <Info className="h-4 w-4 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>
                  <b>Official Notice & Disclaimer:</b> This is an AI-assisted assessment based on available evidence and is not an official government disaster assessment. Field verification by authorized SDRF / NDRF personnel is recommended.
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 5. MDONER DISPATCH CONFIRMATION MODAL */}
      {mdonerModalOpen && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Dispatch Alert to MDoNER Command
              </h3>
              <button onClick={() => setMdonerModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Target Agency</label>
                <input
                  type="text"
                  value={mdonerAgency}
                  onChange={e => setMdonerAgency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Disaster Location & Severity</label>
                <div className="font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  {locationLoc.displayName} ({assessment?.overallSeverity || 'HIGH'} Severity &bull; Score {assessment?.impactScore || 80}/100)
                </div>
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1 font-semibold">Emergency Dispatch Alert Message</label>
                <textarea
                  rows={3}
                  value={mdonerMsg}
                  onChange={e => setMdonerMsg(e.target.value)}
                  placeholder={`Urgent: AI Disaster Impact Assessment computed ${assessment?.overallSeverity || 'HIGH'} severity (${assessment?.impactScore || 80}/100) at ${locationLoc.displayName}. Ground team standby requested.`}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white"
                />
              </div>

              {mdonerSuccess && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/20 p-3 text-emerald-600 dark:text-emerald-400 text-center font-bold">
                  ✓ Important Alert Successfully Transmitted to MDoNER Command Grid!
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setMdonerModalOpen(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMDoNERAlert}
                  disabled={mdonerSending}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white shadow-lg hover:bg-rose-500"
                >
                  {mdonerSending ? 'Transmitting...' : 'Confirm & Send Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
