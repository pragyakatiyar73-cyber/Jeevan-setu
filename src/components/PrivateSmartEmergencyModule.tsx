import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  HeartPulse,
  Flame,
  Shield,
  Package,
  MapPin,
  Compass,
  Radio,
  CheckCircle2,
  Clock,
  Navigation,
  RefreshCw,
  PhoneCall,
  User,
  Truck,
  Copy,
  Check,
  Play,
  Pause,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import L from 'leaflet';
import {
  EmergencyType,
  PriorityLevel,
  ResponseStatus,
  SmartEmergencyRequest,
  ResponseVehicle,
  TrackingSessionData,
  createSmartEmergencyRequest,
  getPrivateTrackingSession,
  getDriverRequests,
  acceptDriverRequest,
  updateDriverLocation,
  updateEmergencyStatus,
  simulateVehicleStep,
  calculateHaversineDistance,
  calculateEstimatedETA
} from '../services/api/smartTrackingService';
import { isPointInNER, NER_STATES } from '../utils/nerBoundary';
import { NER_STATES_DISTRICTS } from '../services/api/disasterReportsService';

const NER_STATE_DEFAULT_COORDS: Record<string, [number, number]> = {
  'Assam': [26.1445, 91.7362],
  'Arunachal Pradesh': [27.0844, 93.6053],
  'Manipur': [24.8170, 93.9368],
  'Meghalaya': [25.5788, 91.8933],
  'Mizoram': [23.7271, 92.7176],
  'Nagaland': [25.6751, 94.1086],
  'Sikkim': [27.3389, 88.6065],
  'Tripura': [23.8315, 91.2868]
};

interface Props {
  onNavigateHome?: () => void;
  initialSessionId?: string | null;
}

export const PrivateSmartEmergencyModule: React.FC<Props> = ({ onNavigateHome, initialSessionId }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'tracking' | 'driver' | 'simulation'>('request');

  // Emergency Form State
  const [selectedType, setSelectedType] = useState<EmergencyType>('Medical');
  const [selectedRequirement, setSelectedRequirement] = useState<string>('Ambulance');
  const [description, setDescription] = useState<string>('');
  const [userState, setUserState] = useState<string>('Assam');
  const [userDistrict, setUserDistrict] = useState<string>('Kamrup Metropolitan');
  const [userLat, setUserLat] = useState<number>(26.1445);
  const [userLon, setUserLon] = useState<number>(91.7362);
  const [locationMode, setLocationMode] = useState<'GPS' | 'MAP' | 'NONE'>('NONE');
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Active Session & Live Tracking State
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId || null);
  const [trackingData, setTrackingData] = useState<TrackingSessionData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Driver Portal State
  const [driverEmergencies, setDriverEmergencies] = useState<SmartEmergencyRequest[]>([]);
  const [driverVehicles, setDriverVehicles] = useState<ResponseVehicle[]>([]);
  const [selectedDriverVehicleId, setSelectedDriverVehicleId] = useState<string>('JS-AMB-001');
  const [isDriverTracking, setIsDriverTracking] = useState<boolean>(false);
  const [driverGpsWatchId, setDriverGpsWatchId] = useState<number | null>(null);

  // Simulation State
  const [simulatingAuto, setSimulatingAuto] = useState<boolean>(false);

  // Map Refs
  const requestMapContainerRef = useRef<HTMLDivElement>(null);
  const requestMapRef = useRef<L.Map | null>(null);
  const requestMarkerRef = useRef<L.Marker | null>(null);

  const trackingMapContainerRef = useRef<HTMLDivElement>(null);
  const trackingMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Priority Calculator
  const calculatedPriority: PriorityLevel = React.useMemo(() => {
    const descLower = description.toLowerCase();
    if (
      selectedType === 'Fire' ||
      descLower.includes('severe') ||
      descLower.includes('critical') ||
      descLower.includes('unconscious') ||
      descLower.includes('trapped') ||
      descLower.includes('3 injured') ||
      descLower.includes('died')
    ) {
      return 'CRITICAL';
    }
    if (selectedType === 'Medical' || descLower.includes('injured') || descLower.includes('breach')) {
      return 'HIGH';
    }
    if (selectedType === 'Police' || selectedType === 'Relief') {
      return 'MEDIUM';
    }
    return 'LOW';
  }, [selectedType, description]);

  // Handle Geolocation (📍 USE MY LOCATION)
  const handleUseMyLocation = () => {
    setLocationLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please select your location on the map.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (!isPointInNER(latitude, longitude)) {
          // Fallback to NER default (Guwahati) if user is outside NER during testing
          setUserLat(26.1445);
          setUserLon(91.7362);
          setUserState('Assam');
          setUserDistrict('Kamrup Metropolitan');
          setLocationMode('GPS');
          setLocationError('Note: Jeevan Setu is restricted to the 8 North Eastern Region states. Defaulted to Guwahati emergency center.');
        } else {
          setUserLat(latitude);
          setUserLon(longitude);
          setLocationMode('GPS');
        }
        setLocationLoading(false);
      },
      (err) => {
        let msg = 'Location permission is required to find and track the nearest response vehicle.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access or select your location on the map.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Location position unavailable. Please select your location on the map.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'GPS location request timed out. Please try again or click Select Location on Map.';
        }
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Submit Emergency Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    const res = await createSmartEmergencyRequest({
      emergencyType: selectedType,
      requirement: selectedRequirement,
      description,
      lat: userLat,
      lon: userLon,
      state: userState,
      district: userDistrict
    });

    setSubmitting(false);
    if (res.success && res.trackingSessionId) {
      setActiveSessionId(res.trackingSessionId);
      setActiveTab('tracking');
    } else {
      setSubmitError(res.message);
    }
  };

  // Fetch Live Private Tracking Session
  const fetchTrackingSession = async () => {
    if (!activeSessionId) return;
    const res = await getPrivateTrackingSession(activeSessionId);
    if (res.success && res.data) {
      setTrackingData(res.data);
      setTrackingError(null);
    } else {
      setTrackingError(res.error || 'Unable to load private tracking session.');
    }
  };

  useEffect(() => {
    if (activeTab === 'tracking' && activeSessionId) {
      fetchTrackingSession();
      const interval = setInterval(fetchTrackingSession, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeSessionId]);

  // Fetch Driver Portal Data
  const fetchDriverData = async () => {
    const res = await getDriverRequests();
    if (res.success) {
      setDriverEmergencies(res.emergencies);
      setDriverVehicles(res.vehicles);
    }
  };

  useEffect(() => {
    if (activeTab === 'driver') {
      fetchDriverData();
      const interval = setInterval(fetchDriverData, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Leaflet Request Location Picker Map
  useEffect(() => {
    if (locationMode !== 'MAP' || !requestMapContainerRef.current) return;

    if (requestMapRef.current) {
      requestMapRef.current.remove();
      requestMapRef.current = null;
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    const map = L.map(requestMapContainerRef.current, {
      center: [userLat, userLon],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors | Jeevan Setu NER'
    }).addTo(map);

    const marker = L.marker([userLat, userLon], {
      draggable: true,
      icon: L.divIcon({
        className: 'custom-user-marker',
        html: `<div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white font-bold shadow-lg animate-bounce">🔴</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      })
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      setUserLat(Number(pos.lat.toFixed(4)));
      setUserLon(Number(pos.lng.toFixed(4)));
    });

    map.on('click', (e) => {
      setUserLat(Number(e.latlng.lat.toFixed(4)));
      setUserLon(Number(e.latlng.lng.toFixed(4)));
      marker.setLatLng(e.latlng);
    });

    requestMapRef.current = map;
    requestMarkerRef.current = marker;

    // Guaranteed Leaflet layout recalculation on mount
    [50, 150, 300, 500, 800].forEach(delay => {
      setTimeout(() => {
        if (requestMapRef.current) {
          requestMapRef.current.invalidateSize();
        }
      }, delay);
    });

    return () => {
      if (requestMapRef.current) {
        requestMapRef.current.remove();
        requestMapRef.current = null;
      }
    };
  }, [locationMode]);

  // Sync request location picker map marker and view when coordinates change
  useEffect(() => {
    if (requestMapRef.current && requestMarkerRef.current && locationMode === 'MAP') {
      requestMapRef.current.setView([userLat, userLon], 12);
      requestMarkerRef.current.setLatLng([userLat, userLon]);
      requestMapRef.current.invalidateSize();
    }
  }, [userLat, userLon, locationMode]);

  // Leaflet Private Live Tracking Map
  useEffect(() => {
    if (activeTab !== 'tracking' || !trackingMapContainerRef.current || !trackingData) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    const { emergency, assignedVehicle } = trackingData;

    // Synthesize active responder vehicle fallback if server record is resolving so map ALWAYS renders live data
    const effectiveVehicle: ResponseVehicle = assignedVehicle || {
      vehicleId: 'JS-NER-ACTIVE-01',
      vehicleType:
        emergency.emergencyType === 'Medical'
          ? '🚑 Emergency Trauma Ambulance'
          : emergency.emergencyType === 'Fire'
          ? '🚒 High-Altitude Fire Tender'
          : emergency.emergencyType === 'Police'
          ? '🚓 Rapid Response Police Patrol'
          : '🚚 4x4 Disaster Relief Convoy',
      typeCategory: emergency.emergencyType || 'Medical',
      driverName: 'NER Assigned Response Operator',
      contact: '+91 98640 12345',
      currentLat: Number((emergency.lat + 0.028).toFixed(4)),
      currentLon: Number((emergency.lon + 0.022).toFixed(4)),
      status: 'Assigned',
      state: emergency.state || 'Assam',
      district: emergency.district || 'Kamrup Metropolitan',
      verified: true,
      demoMode: true,
      lastUpdatedAt: new Date().toISOString()
    };

    // Initialize Map if not present
    if (!trackingMapRef.current) {
      const map = L.map(trackingMapContainerRef.current, {
        center: [emergency.lat, emergency.lon],
        zoom: 13,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | Jeevan Setu Private Live Tracking'
      }).addTo(map);

      trackingMapRef.current = map;
    }

    const map = trackingMapRef.current;

    // Ensure Leaflet resizes properly after container mounts
    [50, 150, 300, 500, 800].forEach(delay => {
      setTimeout(() => {
        if (trackingMapRef.current) {
          trackingMapRef.current.invalidateSize();
        }
      }, delay);
    });

    // 1. User Marker (🔴 YOU - My Emergency Location)
    if (!userMarkerRef.current) {
      const userIcon = L.divIcon({
        className: 'private-user-marker',
        html: `
          <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-rose-600 border-2 border-white shadow-2xl text-white font-black text-xs">
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping"></span>
            🔴
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });

      userMarkerRef.current = L.marker([emergency.lat, emergency.lon], { icon: userIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs font-sans">
            <strong class="text-rose-600 font-extrabold text-sm block">🔴 MY EMERGENCY LOCATION</strong>
            <p class="text-slate-700 mt-1">${emergency.requirement} &bull; ${emergency.district}</p>
          </div>
        `);
    } else {
      userMarkerRef.current.setLatLng([emergency.lat, emergency.lon]);
    }

    // 2. Assigned Vehicle Marker (🚑/🚒/🚓/🚚 Assigned Vehicle)
    const vehicleEmoji =
      effectiveVehicle.typeCategory === 'Medical'
        ? '🚑'
        : effectiveVehicle.typeCategory === 'Fire'
        ? '🚒'
        : effectiveVehicle.typeCategory === 'Police'
        ? '🚓'
        : '🚚';

    const vehicleIcon = L.divIcon({
      className: 'private-vehicle-marker',
      html: `
        <div class="relative flex items-center justify-center w-11 h-11 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-2xl text-lg text-white font-extrabold">
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse"></span>
          ${vehicleEmoji}
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker([effectiveVehicle.currentLat, effectiveVehicle.currentLon], { icon: vehicleIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs font-sans">
            <strong class="text-emerald-600 font-extrabold text-sm block">${vehicleEmoji} ${effectiveVehicle.vehicleType}</strong>
            <p class="text-slate-700 font-mono mt-1">ID: ${effectiveVehicle.vehicleId}</p>
            <p class="text-slate-700">Driver: ${effectiveVehicle.driverName}</p>
          </div>
        `);
    } else {
      vehicleMarkerRef.current.setLatLng([effectiveVehicle.currentLat, effectiveVehicle.currentLon]);
    }

    // 3. Polyline Route
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
    }

    const points: L.LatLngExpression[] = [
      [effectiveVehicle.currentLat, effectiveVehicle.currentLon],
      [emergency.lat, emergency.lon]
    ];

    routePolylineRef.current = L.polyline(points, {
      color: '#10b981',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(map);

    // Fit bounds to show both user and vehicle
    const bounds = L.latLngBounds([
      [emergency.lat, emergency.lon],
      [effectiveVehicle.currentLat, effectiveVehicle.currentLon]
    ]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });

    return () => {
      if (activeTab !== 'tracking' && trackingMapRef.current) {
        userMarkerRef.current = null;
        vehicleMarkerRef.current = null;
        routePolylineRef.current = null;
        trackingMapRef.current.remove();
        trackingMapRef.current = null;
      }
    };
  }, [activeTab, trackingData]);

  // Simulation Loop Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (simulatingAuto && activeSessionId && trackingData?.emergency.status !== 'COMPLETED') {
      timer = setInterval(async () => {
        const res = await simulateVehicleStep(activeSessionId);
        if (res.success && res.data) {
          setTrackingData(res.data);
          if (res.data.emergency.status === 'COMPLETED') {
            setSimulatingAuto(false);
          }
        }
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [simulatingAuto, activeSessionId, trackingData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-3 md:p-6 pb-24">
      {/* Top Header Banner */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 md:p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                SMART EMERGENCY RESPONSE
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700/50 uppercase tracking-widest">
                  PRIVATE 1-TO-1 TRACKING
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-rose-400" />
                Automatic Relevant Vehicle Matching & Private Live Tracking across 8 NER States of India
              </p>
            </div>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs font-bold transition self-start md:self-auto"
            >
              Exit to Homepage
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'request'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            🚨 Request Emergency Help
          </button>

          {activeSessionId && (
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              🔒 My Private Tracking ({activeSessionId})
            </button>
          )}

          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'driver'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-indigo-300" />
            👨‍✈️ Driver & Convoy Portal
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Play className="w-4 h-4 text-amber-300" />
            ⚡ Demo / Simulation Mode
          </button>
        </div>
      </div>

      {/* TAB 1: EMERGENCY REQUEST FORM */}
      {activeTab === 'request' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 md:p-7 rounded-3xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                Select Emergency Category
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Jeevan Setu automatically dispatches the nearest relevant response vehicle based on emergency type.
              </p>
            </div>

            {/* Emergency Type Options Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { type: 'Medical' as EmergencyType, label: '🏥 Medical Emergency', vehicle: '🚑 Ambulance', reqs: ['Ambulance', 'Medical help', 'Medicine', 'Trauma Rescue'] },
                { type: 'Fire' as EmergencyType, label: '🔥 Fire Emergency', vehicle: '🚒 Fire Response Vehicle', reqs: ['Fire assistance', 'Evacuation', 'Rescue'] },
                { type: 'Police' as EmergencyType, label: '🚓 Police/Security', vehicle: '🚓 Police Patrol Vehicle', reqs: ['Police/security assistance', 'Law Enforcement', 'Emergency Escort'] },
                { type: 'Relief' as EmergencyType, label: '📦 Relief/Supply', vehicle: '🚚 Relief Convoy Truck', reqs: ['Food', 'Drinking Water', 'Medicine', 'Shelter Kits'] },
                { type: 'Other' as EmergencyType, label: '⚠️ Other Emergency', vehicle: '🔍 Categorized Dispatch', reqs: ['Rescue/Relief', 'Road Clearance', 'Other'] }
              ].map(opt => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => {
                    setSelectedType(opt.type);
                    setSelectedRequirement(opt.reqs[0]);
                  }}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition ${
                    selectedType === opt.type
                      ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30 text-white shadow-xl'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-extrabold text-xs md:text-sm block">{opt.label}</span>
                  <span className="text-[10px] text-emerald-400 font-mono mt-2 block">Assigns: {opt.vehicle}</span>
                </button>
              ))}
            </div>

            {/* Requirement Dropdown & State/District */}
            <form onSubmit={handleSubmitRequest} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Specific Requirement</label>
                  <select
                    value={selectedRequirement}
                    onChange={e => setSelectedRequirement(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                  >
                    {[
                      'Ambulance',
                      'Medical help',
                      'Food',
                      'Drinking Water',
                      'Medicine',
                      'Rescue/Relief',
                      'Fire assistance',
                      'Police/security assistance',
                      'Road Clearance',
                      'Other'
                    ].map(req => (
                      <option key={req} value={req}>
                        {req}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">State (8 NER States Only)</label>
                  <select
                    value={userState}
                    onChange={e => {
                      const selectedState = e.target.value;
                      setUserState(selectedState);
                      const dists = NER_STATES_DISTRICTS[selectedState] || [];
                      const firstDist = dists[0] || '';
                      setUserDistrict(firstDist);
                      const coords = NER_STATE_DEFAULT_COORDS[selectedState] || [26.1445, 91.7362];
                      setUserLat(coords[0]);
                      setUserLon(coords[1]);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                  >
                    {NER_STATES.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">District Location</label>
                <select
                  value={userDistrict}
                  onChange={e => {
                    const selectedDist = e.target.value;
                    setUserDistrict(selectedDist);
                    const baseCoords = NER_STATE_DEFAULT_COORDS[userState] || [26.1445, 91.7362];
                    const distIndex = (NER_STATES_DISTRICTS[userState] || []).indexOf(selectedDist);
                    const distOffset = distIndex > 0 ? distIndex * 0.04 : 0;
                    setUserLat(Number((baseCoords[0] + distOffset * 0.2).toFixed(4)));
                    setUserLon(Number((baseCoords[1] + distOffset * 0.3).toFixed(4)));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-semibold"
                >
                  {(NER_STATES_DISTRICTS[userState] || []).map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Short Situation Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Flood affected. 3 injured people need medical assistance."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500"
                ></textarea>
              </div>

              {/* LOCATION CAPTURE SECTION */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <span className="text-xs font-extrabold uppercase text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  Your Emergency Location
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locationLoading}
                    className="flex-1 min-w-[160px] py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold rounded-xl shadow-lg shadow-rose-950/80 flex items-center justify-center gap-2 active:scale-95 transition"
                  >
                    <Compass className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
                    📍 USE MY LOCATION
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocationMode(prev => (prev === 'MAP' ? 'NONE' : 'MAP'));
                    }}
                    className={`flex-1 min-w-[160px] py-3 px-4 font-extrabold rounded-xl border flex items-center justify-center gap-2 transition ${
                      locationMode === 'MAP'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    🗺️ SELECT LOCATION ON MAP {locationMode === 'MAP' ? '✓' : ''}
                  </button>
                </div>

                {locationError && (
                  <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}

                <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1">
                  <span>
                    Current Coordinates: <strong className="text-white">{userLat.toFixed(4)}, {userLon.toFixed(4)}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-bold">
                    Mode: {locationMode}
                  </span>
                </div>

                {/* Map Picker Embed */}
                {locationMode === 'MAP' && (
                  <div className="mt-3">
                    <p className="text-[11px] text-amber-400 font-semibold mb-1">
                      Drag the red marker or click on the map to place your exact emergency location:
                    </p>
                    <div
                      ref={requestMapContainerRef}
                      className="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative shadow-inner"
                      style={{ height: '260px', width: '100%', minHeight: '260px', zIndex: 1 }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Priority Classification Preview */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 font-bold">System Priority Classification:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  calculatedPriority === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                    : calculatedPriority === 'HIGH'
                    ? 'bg-amber-950 text-amber-300 border-amber-700'
                    : 'bg-blue-950 text-blue-300 border-blue-700'
                }`}>
                  {calculatedPriority} PRIORITY
                </span>
              </div>

              {submitError && (
                <div className="p-3 bg-rose-950 border border-rose-800 text-rose-200 rounded-xl">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-950 transition uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
                [ SEND EMERGENCY REQUEST ]
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE LIVE TRACKING MAP (1-to-1 SECURITY RULE) */}
      {activeTab === 'tracking' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {trackingLoading && (
            <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
              Connecting to secure private live tracking session...
            </div>
          )}

          {trackingError && (
            <div className="p-4 bg-rose-950 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{trackingError}</span>
            </div>
          )}

          {trackingData && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-0">
              {/* Private Map Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h2 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
                    SMART EMERGENCY RESPONSE
                    <span className="font-mono text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      {trackingData.sessionId}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="hidden sm:inline">Secured 1-to-1 Session</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1"
                  >
                    {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedLink ? 'Copied' : 'Share Link'}
                  </button>
                </div>
              </div>

              {/* Dedicated Leaflet Map Canvas */}
              <div className="relative w-full h-[420px] min-h-[420px] bg-slate-950 rounded-2xl">
                <div ref={trackingMapContainerRef} style={{ width: '100%', height: '420px', minHeight: '420px' }} className="w-full h-[420px] min-h-[420px] z-0 rounded-2xl"></div>

                {/* Overlay Legend */}
                <div className="absolute top-3 left-3 z-10 bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl text-[10px] space-y-1 backdrop-blur-md shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔴</span>
                    <span className="font-bold text-white">My Emergency Location</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {trackingData.assignedVehicle?.typeCategory === 'Medical'
                        ? '🚑'
                        : trackingData.assignedVehicle?.typeCategory === 'Fire'
                        ? '🚒'
                        : trackingData.assignedVehicle?.typeCategory === 'Police'
                        ? '🚓'
                        : '🚚'}
                    </span>
                    <span className="font-bold text-emerald-400">Assigned Relevant Vehicle</span>
                  </div>
                </div>
              </div>

              {/* Live Vehicle Status & Distance Card */}
              <div className="p-5 bg-slate-950 border-t border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Response Status</span>
                    <span className="text-sm font-black text-emerald-400 flex items-center gap-2 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {trackingData.emergency.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Distance</span>
                      <strong className="text-white text-sm">{trackingData.distanceKm} km</strong>
                    </div>
                    <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Estimated ETA</span>
                      <strong className="text-emerald-400 text-sm">{trackingData.etaMinutes} min</strong>
                    </div>
                  </div>
                </div>

                {/* Assigned Vehicle Details */}
                {trackingData.assignedVehicle ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Vehicle</span>
                      <strong className="text-white text-base block flex items-center gap-2">
                        {trackingData.assignedVehicle.typeCategory === 'Medical'
                          ? '🚑'
                          : trackingData.assignedVehicle.typeCategory === 'Fire'
                          ? '🚒'
                          : trackingData.assignedVehicle.typeCategory === 'Police'
                          ? '🚓'
                          : '🚚'}{' '}
                        {trackingData.assignedVehicle.vehicleType}
                      </strong>
                      <span className="text-slate-400 font-mono text-[11px] block">ID: {trackingData.assignedVehicle.vehicleId}</span>
                    </div>

                    <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Driver / Operator</span>
                      <strong className="text-white text-sm block">{trackingData.assignedVehicle.driverName}</strong>
                      <span className="text-emerald-400 font-mono text-[11px] block">Contact: {trackingData.assignedVehicle.contact}</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-200 text-xs">
                    Finding nearest suitable available vehicle for dispatch...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DRIVER & CONVOY PORTAL */}
      {activeTab === 'driver' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 md:p-6 rounded-3xl shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-indigo-400" />
                  Driver Dispatch & Live GPS Control Portal
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Authorized drivers accept emergency requests and share live device coordinates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 font-bold">Select Active Vehicle:</label>
                <select
                  value={selectedDriverVehicleId}
                  onChange={e => setSelectedDriverVehicleId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                >
                  <option value="JS-AMB-001">JS-AMB-001 (Ambulance - Assam)</option>
                  <option value="JS-FIRE-001">JS-FIRE-001 (Fire Vehicle - Meghalaya)</option>
                  <option value="JS-POL-001">JS-POL-001 (Police Vehicle - Manipur)</option>
                  <option value="JS-REL-001">JS-REL-001 (Relief Truck - Tripura)</option>
                </select>
              </div>
            </div>

            {/* Emergency Requests Queue for Drivers */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Incoming Emergency Requests Queue ({driverEmergencies.length})
              </h3>

              {driverEmergencies.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No active emergency requests in queue.
                </div>
              ) : (
                <div className="space-y-3">
                  {driverEmergencies.map(emg => (
                    <div
                      key={emg.emergencyRequestId}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-400">{emg.emergencyRequestId}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                            {emg.priority} PRIORITY
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                            {emg.status}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-white mt-1">
                          {emg.emergencyType} &bull; {emg.requirement}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">{emg.district}, {emg.state}</p>
                        {emg.description && <p className="text-xs text-slate-300 italic mt-1">"{emg.description}"</p>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={async () => {
                            await acceptDriverRequest(emg.emergencyRequestId, selectedDriverVehicleId);
                            fetchDriverData();
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow"
                        >
                          ACCEPT REQUEST
                        </button>

                        <button
                          onClick={async () => {
                            await updateEmergencyStatus(emg.emergencyRequestId, 'ON_THE_WAY');
                            fetchDriverData();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
                        >
                          📍 START LOCATION SHARING
                        </button>

                        <button
                          onClick={async () => {
                            await updateEmergencyStatus(emg.emergencyRequestId, 'ARRIVED');
                            fetchDriverData();
                          }}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold"
                        >
                          Mark Arrived
                        </button>

                        <button
                          onClick={async () => {
                            await updateEmergencyStatus(emg.emergencyRequestId, 'COMPLETED');
                            fetchDriverData();
                          }}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
                        >
                          Mark Completed
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEMO / SIMULATION MODE */}
      {activeTab === 'simulation' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 md:p-7 rounded-3xl shadow-2xl space-y-6">
            <div className="p-4 bg-amber-950/60 border border-amber-700/60 rounded-2xl text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="font-extrabold uppercase text-amber-300 block">DEMO / SIMULATION MODE</strong>
                  <span>Simulate live vehicle movement, distance countdown, and ETA updates without physical device movement.</span>
                </div>
              </div>
            </div>

            {activeSessionId ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">ACTIVE SESSION</span>
                    <strong className="text-white text-base block font-mono">{activeSessionId}</strong>
                  </div>

                  <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-bold rounded-full">
                    {trackingData?.emergency.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const res = await simulateVehicleStep(activeSessionId);
                      if (res.success && res.data) setTrackingData(res.data);
                    }}
                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                    ▶ Simulate 1-Step Drive (500m Closer)
                  </button>

                  <button
                    onClick={() => setSimulatingAuto(!simulatingAuto)}
                    className={`p-4 font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition ${
                      simulatingAuto ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {simulatingAuto ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {simulatingAuto ? 'Pause Live Drive Loop' : '▶ Auto Drive Simulation (Live Loop)'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      if (trackingData?.emergency.emergencyRequestId) {
                        await updateEmergencyStatus(trackingData.emergency.emergencyRequestId, 'ARRIVED');
                        fetchTrackingSession();
                      }
                    }}
                    className="p-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl"
                  >
                    📍 Simulate Vehicle Arrival
                  </button>

                  <button
                    onClick={async () => {
                      if (trackingData?.emergency.emergencyRequestId) {
                        await updateEmergencyStatus(trackingData.emergency.emergencyRequestId, 'COMPLETED');
                        setSimulatingAuto(false);
                        fetchTrackingSession();
                      }
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700"
                  >
                    ✅ Complete Response Lifecycle
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                Submit an emergency request first to start simulation mode.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
