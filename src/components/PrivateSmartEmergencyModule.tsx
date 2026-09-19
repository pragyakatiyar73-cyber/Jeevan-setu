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
  Info,
  Users,
  Share2,
  Sun,
  Moon
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import QRCode from 'qrcode';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import {
  EmergencyType,
  PriorityLevel,
  ResponseStatus,
  SmartEmergencyRequest,
  ResponseVehicle,
  TrackingSessionData,
  SessionParticipant,
  createSmartEmergencyRequest,
  createQRLiveTrackingSession,
  getPrivateTrackingSession,
  getDriverRequests,
  acceptDriverRequest,
  registerDriverVehicle,
  markDriverArrived,
  markDriverComplete,
  updateDriverLocation,
  updateEmergencyStatus,
  simulateVehicleStep,
  sendRealGPSUpdate,
  stopQRLiveTrackingSession,
  removeParticipantFromSession,
  subscribeToRemoteSessionUpdates,
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
  const { t, language } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'request' | 'tracking' | 'driver' | 'simulation'>(initialSessionId ? 'tracking' : 'request');

  // Emergency Form State
  const [selectedType, setSelectedType] = useState<EmergencyType>('Medical');
  const [selectedRequirement, setSelectedRequirement] = useState<string>('Ambulance');
  const [description, setDescription] = useState<string>('');
  const [userState, setUserState] = useState<string>('Assam');
  const [userDistrict, setUserDistrict] = useState<string>('Kamrup Metropolitan');
  const [userLat, setUserLat] = useState<number>(26.1445);
  const [userLon, setUserLon] = useState<number>(91.7362);
  const [locationMode, setLocationMode] = useState<'GPS' | 'MAP' | 'NONE'>('MAP');
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

  // Auto GPS Sync for Host inside Tracking Tab
  const [autoGpsSync, setAutoGpsSync] = useState<boolean>(true);
  const gpsWatchIdRef = useRef<number | null>(null);

  // Initial Auto-detect GPS on component mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLon(pos.coords.longitude);
          setLocationMode('GPS');
        },
        (_err) => {},
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
      );
    }
  }, []);

  // Continuous GPS Watcher when tracking tab is active and autoGpsSync is ON
  useEffect(() => {
    if (activeTab === 'tracking' && activeSessionId && autoGpsSync && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          setUserLat(latitude);
          setUserLon(longitude);
          await sendRealGPSUpdate({
            sessionId: activeSessionId,
            token: trackingData?.token || 'tok_live',
            participantId: 'P-1',
            label: language === 'hi' ? '🔴 अनुरोधकर्ता (मैं)' : '🔴 Requester (Me)',
            lat: latitude,
            lon: longitude,
            accuracy: accuracy || 5,
            timestamp: Date.now()
          });
        },
        (err) => console.warn('Watch GPS error:', err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
      gpsWatchIdRef.current = watchId;

      return () => {
        if (gpsWatchIdRef.current !== null) {
          navigator.geolocation.clearWatch(gpsWatchIdRef.current);
          gpsWatchIdRef.current = null;
        }
      };
    }
  }, [activeTab, activeSessionId, autoGpsSync, language, trackingData?.token]);

  // Manual GPS update trigger in tracking tab
  const handleManualGpsUpdateInTracking = () => {
    if (!navigator.geolocation) {
      alert(language === 'hi' ? 'जीपीएस आपके डिवाइस में उपलब्ध नहीं है' : 'GPS is not available on your device');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLat(latitude);
        setUserLon(longitude);
        setLocationMode('GPS');
        setLocationLoading(false);
        if (activeSessionId) {
          await sendRealGPSUpdate({
            sessionId: activeSessionId,
            token: trackingData?.token || 'tok_live',
            participantId: 'P-1',
            label: language === 'hi' ? '🔴 अनुरोधकर्ता (मैं)' : '🔴 Requester (Me)',
            lat: latitude,
            lon: longitude,
            accuracy: accuracy || 5,
            timestamp: Date.now()
          });
          fetchTrackingSession();
        }
      },
      (_err) => {
        setLocationLoading(false);
        alert(language === 'hi' ? 'जीपीएस स्थान प्राप्त करने में विफल। स्थान एक्सेस की अनुमति दें।' : 'Failed to retrieve GPS location. Please grant location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRemoveFriend = async (pid: string) => {
    if (!activeSessionId) return;
    removeParticipantFromSession(activeSessionId, pid);
    await stopQRLiveTrackingSession(activeSessionId, trackingData?.token || 'tok_live', pid);
    fetchTrackingSession();
  };

  // Driver Portal State
  const [driverEmergencies, setDriverEmergencies] = useState<SmartEmergencyRequest[]>([]);
  const [driverVehicles, setDriverVehicles] = useState<ResponseVehicle[]>([]);
  const [selectedDriverVehicleId, setSelectedDriverVehicleId] = useState<string>('JS-AMB-001');
  const [isDriverTracking, setIsDriverTracking] = useState<boolean>(false);
  const [driverGpsWatchId, setDriverGpsWatchId] = useState<number | null>(null);

  // Driver Registration Form State
  const [showDriverRegModal, setShowDriverRegModal] = useState<boolean>(false);
  const [regDriverName, setRegDriverName] = useState<string>('');
  const [regContact, setRegContact] = useState<string>('');
  const [regVehicleType, setRegVehicleType] = useState<string>('🚑 Emergency Ambulance');
  const [regCategory, setRegCategory] = useState<EmergencyType>('Medical');
  const [regState, setRegState] = useState<string>('Assam');
  const [regDistrict, setRegDistrict] = useState<string>('Kamrup Metropolitan');
  const [regSubmitting, setRegSubmitting] = useState<boolean>(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Simulation State
  const [simulatingAuto, setSimulatingAuto] = useState<boolean>(false);

  // QR Code Real Phone Modal State
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [qrAppUrl, setQrAppUrl] = useState<string>(() => {
    const metaNextUrl = (import.meta as any).env?.NEXT_PUBLIC_APP_URL;
    const metaViteUrl = (import.meta as any).env?.VITE_APP_URL;
    const procNextUrl = typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_APP_URL : undefined;
    const procViteUrl = typeof process !== 'undefined' ? process.env?.VITE_APP_URL : undefined;
    return metaNextUrl || procNextUrl || metaViteUrl || procViteUrl || window.location.origin;
  });
  const [qrSessionData, setQrSessionData] = useState<{
    sessionId: string;
    token: string;
    trackingUrl: string;
  } | null>(null);
  const [qrImageSrc, setQrImageSrc] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);

  // Multi-Friend Addition State
  const [customFriendName, setCustomFriendName] = useState<string>('');
  const [addingFriend, setAddingFriend] = useState<boolean>(false);

  // Map Refs
  const requestMapContainerRef = useRef<HTMLDivElement>(null);
  const requestMapRef = useRef<L.Map | null>(null);
  const requestMarkerRef = useRef<L.Marker | null>(null);
  const requestVehicleMarkerRef = useRef<L.Marker | null>(null);
  const requestRoutePolylineRef = useRef<L.Polyline | null>(null);

  const trackingMapContainerRef = useRef<HTMLDivElement>(null);
  const trackingMapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const participantPolylinesRef = useRef<L.Polyline[]>([]);
  const realAccuracyCircleRef = useRef<L.Circle | null>(null);
  const participantMarkersRef = useRef<Record<string, { marker: L.Marker; circle?: L.Circle }>>({});

  const handleOpenQrModal = async () => {
    setShowQrModal(true);
    setQrLoading(true);
    try {
      const res = await createQRLiveTrackingSession(qrAppUrl);
      setQrLoading(false);
      if (res.success && res.sessionId && res.token && res.trackingUrl) {
        setQrSessionData({
          sessionId: res.sessionId,
          token: res.token,
          trackingUrl: res.trackingUrl
        });
      } else {
        const fallbackSessionId = `QR-${Math.floor(100000 + Math.random() * 900000)}`;
        const fallbackToken = `tok_${Math.random().toString(36).slice(2, 10)}`;
        const baseUrl = qrAppUrl || window.location.origin;
        const fallbackTrackingUrl = `${baseUrl.replace(/\/$/, '')}/?shareSession=${fallbackSessionId}&token=${fallbackToken}`;
        setQrSessionData({
          sessionId: fallbackSessionId,
          token: fallbackToken,
          trackingUrl: fallbackTrackingUrl
        });
      }
    } catch (_) {
      setQrLoading(false);
      const fallbackSessionId = `QR-${Math.floor(100000 + Math.random() * 900000)}`;
      const fallbackToken = `tok_${Math.random().toString(36).slice(2, 10)}`;
      const baseUrl = qrAppUrl || window.location.origin;
      const fallbackTrackingUrl = `${baseUrl.replace(/\/$/, '')}/?shareSession=${fallbackSessionId}&token=${fallbackToken}`;
      setQrSessionData({
        sessionId: fallbackSessionId,
        token: fallbackToken,
        trackingUrl: fallbackTrackingUrl
      });
    }
  };

  const handleAddSimulatedFriend = async (nameInput?: string) => {
    if (!activeSessionId || !trackingData) return;
    setAddingFriend(true);

    const existingParts = trackingData.participants || [];
    const friendIndex = existingParts.filter(p => p.role === 'PARTICIPANT').length + 1;
    const friendName = nameInput || customFriendName || (language === 'hi' ? `मित्र ${friendIndex}` : `Friend ${friendIndex}`);

    const palette = ['#3b82f6', '#10b981', '#a855f7', '#f97316', '#06b6d4', '#ec4899'];
    const color = palette[(friendIndex - 1) % palette.length];

    const baseLat = trackingData.emergency.lat;
    const baseLon = trackingData.emergency.lon;

    const angle = (friendIndex * 125 * Math.PI) / 180;
    const dist = 0.003 + (friendIndex * 0.0012);
    const fLat = Number((baseLat + Math.sin(angle) * dist).toFixed(5));
    const fLon = Number((baseLon + Math.cos(angle) * dist).toFixed(5));

    const pid = `P-FRIEND-${Date.now().toString().slice(-4)}-${friendIndex}`;
    const tokenToUse = trackingData.token || qrSessionData?.token || '';

    const res = await sendRealGPSUpdate({
      sessionId: activeSessionId,
      token: tokenToUse,
      participantId: pid,
      label: friendName,
      lat: fLat,
      lon: fLon,
      accuracy: Number((4 + Math.random() * 4).toFixed(1)),
      timestamp: Date.now()
    });

    setAddingFriend(false);
    setCustomFriendName('');

    if (res.success) {
      fetchTrackingSession();
    }
  };

  useEffect(() => {
    if (qrSessionData) {
      const baseUrl = qrAppUrl || window.location.origin;
      const targetUrl = `${baseUrl.replace(/\/$/, '')}/?shareSession=${qrSessionData.sessionId}&token=${qrSessionData.token}`;
      const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(targetUrl)}`;

      try {
        if (typeof QRCode !== 'undefined' && typeof QRCode.toDataURL === 'function') {
          QRCode.toDataURL(targetUrl, {
            width: 280,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
          })
            .then(url => setQrImageSrc(url || fallbackQrUrl))
            .catch(() => setQrImageSrc(fallbackQrUrl));
        } else {
          setQrImageSrc(fallbackQrUrl);
        }
      } catch (_) {
        setQrImageSrc(fallbackQrUrl);
      }
    }
  }, [qrSessionData, qrAppUrl]);

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

  // Handle Geolocation & Instant Emergency Response Connection (📍 USE MY LOCATION)
  const handleUseMyLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    const dispatchWithCoords = async (lat: number, lon: number, stateName: string, distName: string) => {
      setUserLat(lat);
      setUserLon(lon);
      setUserState(stateName);
      setUserDistrict(distName);
      setLocationMode('GPS');

      // Pan live preview map
      if (requestMapRef.current) {
        requestMapRef.current.setView([lat, lon], 13);
        requestMapRef.current.invalidateSize();
      }

      // Automatically submit emergency request to instantly connect user to live tracking
      setSubmitting(true);
      const res = await createSmartEmergencyRequest({
        emergencyType: selectedType,
        requirement: selectedRequirement,
        description: description || `Live Emergency Request at ${distName}, ${stateName}`,
        lat,
        lon,
        state: stateName,
        district: distName
      });

      setSubmitting(false);
      setLocationLoading(false);

      if (res.success && res.trackingSessionId) {
        setActiveSessionId(res.trackingSessionId);
        setActiveTab('tracking');
      } else {
        setLocationError(res.message || 'Error connecting to emergency response.');
      }
    };

    if (!navigator.geolocation) {
      await dispatchWithCoords(userLat, userLon, userState, userDistrict);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        await dispatchWithCoords(latitude, longitude, userState, userDistrict);
      },
      async (_err) => {
        navigator.geolocation.getCurrentPosition(
          async (pos2) => {
            const { latitude, longitude } = pos2.coords;
            await dispatchWithCoords(latitude, longitude, userState, userDistrict);
          },
          async () => {
            const baseCoords = NER_STATE_DEFAULT_COORDS[userState] || [26.1445, 91.7362];
            await dispatchWithCoords(baseCoords[0], baseCoords[1], userState, userDistrict);
          },
          { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
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
      const unsubscribe = subscribeToRemoteSessionUpdates(activeSessionId, fetchTrackingSession);
      const interval = setInterval(fetchTrackingSession, 3000);
      return () => {
        unsubscribe();
        clearInterval(interval);
      };
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

  const handleRegisterDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regDriverName || !regContact) {
      setRegError('Please provide driver name and contact number.');
      return;
    }
    setRegSubmitting(true);
    setRegError(null);

    const baseCoords = NER_STATE_DEFAULT_COORDS[regState] || [26.1445, 91.7362];
    const res = await registerDriverVehicle({
      driverName: regDriverName,
      contact: regContact,
      vehicleType: regVehicleType,
      typeCategory: regCategory,
      state: regState,
      district: regDistrict,
      lat: baseCoords[0],
      lon: baseCoords[1]
    });

    setRegSubmitting(false);
    if (res.success && res.vehicle) {
      setSelectedDriverVehicleId(res.vehicle.vehicleId);
      setShowDriverRegModal(false);
      setRegDriverName('');
      setRegContact('');
      fetchDriverData();
    } else {
      setRegError(res.message || 'Failed to register driver vehicle.');
    }
  };

  useEffect(() => {
    if (activeTab === 'driver') {
      fetchDriverData();
      const interval = setInterval(fetchDriverData, 4000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Leaflet Request Location Picker & Live Preview Map
  useEffect(() => {
    if (activeTab !== 'request' || !requestMapContainerRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    // Reset if map instance container was unmounted
    if (requestMapRef.current && (requestMapContainerRef.current as any)?._leaflet_id === undefined) {
      requestMarkerRef.current = null;
      requestVehicleMarkerRef.current = null;
      requestRoutePolylineRef.current = null;
      requestMapRef.current.remove();
      requestMapRef.current = null;
    }

    if (!requestMapRef.current) {
      const map = L.map(requestMapContainerRef.current, {
        center: [userLat, userLon],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; OpenStreetMap contributors | Jeevan Setu NER'
      }).addTo(map);

      requestMapRef.current = map;
    }

    const map = requestMapRef.current;

    // 1. User Location Red Marker (🔴 YOU)
    if (!requestMarkerRef.current) {
      const userMarker = L.marker([userLat, userLon], {
        draggable: true,
        icon: L.divIcon({
          className: 'custom-user-marker',
          html: `<div class="w-9 h-9 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white font-bold shadow-xl animate-bounce">🔴</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map);

      userMarker.on('dragend', () => {
        const pos = userMarker.getLatLng();
        setUserLat(Number(pos.lat.toFixed(4)));
        setUserLon(Number(pos.lng.toFixed(4)));
      });

      map.on('click', (e) => {
        setUserLat(Number(e.latlng.lat.toFixed(4)));
        setUserLon(Number(e.latlng.lng.toFixed(4)));
        userMarker.setLatLng(e.latlng);
      });

      requestMarkerRef.current = userMarker;
    } else {
      requestMarkerRef.current.setLatLng([userLat, userLon]);
    }

    // 2. Assigned Vehicle Marker (🚑 / 🚒 / 🚓 / 🚚 base on selectedType)
    const vehicleEmoji =
      selectedType === 'Medical'
        ? '🚑'
        : selectedType === 'Fire'
        ? '🚒'
        : selectedType === 'Police'
        ? '🚓'
        : '🚚';

    const vehicleTitle =
      selectedType === 'Medical'
        ? '🚑 Emergency Trauma Ambulance'
        : selectedType === 'Fire'
        ? '🚒 High-Altitude Fire Tender'
        : selectedType === 'Police'
        ? '🚓 Rapid Response Police Patrol'
        : '🚚 4x4 Disaster Relief Convoy';

    const vLat = Number((userLat + 0.024).toFixed(4));
    const vLon = Number((userLon + 0.018).toFixed(4));

    const vehicleIcon = L.divIcon({
      className: 'request-vehicle-marker',
      html: `
        <div class="relative flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 border-2 border-emerald-400 shadow-2xl text-base text-white font-extrabold">
          <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          ${vehicleEmoji}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    if (!requestVehicleMarkerRef.current) {
      requestVehicleMarkerRef.current = L.marker([vLat, vLon], { icon: vehicleIcon })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-xs font-sans">
            <strong class="text-emerald-600 font-extrabold text-sm block">${vehicleTitle}</strong>
            <p class="text-slate-700 mt-0.5">Assigned for ${selectedType} Emergency</p>
          </div>
        `);
    } else {
      requestVehicleMarkerRef.current.setIcon(vehicleIcon);
      requestVehicleMarkerRef.current.setLatLng([vLat, vLon]);
      requestVehicleMarkerRef.current.setPopupContent(`
        <div class="p-2 text-xs font-sans">
          <strong class="text-emerald-600 font-extrabold text-sm block">${vehicleTitle}</strong>
          <p class="text-slate-700 mt-0.5">Assigned for ${selectedType} Emergency</p>
        </div>
      `);
    }

    // 3. Dashed Polyline Route
    if (requestRoutePolylineRef.current) {
      requestRoutePolylineRef.current.remove();
    }
    requestRoutePolylineRef.current = L.polyline(
      [
        [vLat, vLon],
        [userLat, userLon]
      ],
      {
        color: '#10b981',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }
    ).addTo(map);

    map.setView([userLat, userLon], 12);

    // Guaranteed Leaflet layout recalculation on mount
    [50, 150, 300, 500, 800].forEach(delay => {
      setTimeout(() => {
        if (requestMapRef.current) {
          requestMapRef.current.invalidateSize();
        }
      }, delay);
    });

    return () => {
      if (activeTab !== 'request' && requestMapRef.current) {
        requestMarkerRef.current = null;
        requestVehicleMarkerRef.current = null;
        requestRoutePolylineRef.current = null;
        requestMapRef.current.remove();
        requestMapRef.current = null;
      }
    };
  }, [activeTab, locationMode, selectedType, userLat, userLon]);

  // Leaflet Private Live Tracking Map (With Multi-Participant Support)
  useEffect(() => {
    if (activeTab !== 'tracking' || !trackingMapContainerRef.current || !trackingData) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    const { emergency, assignedVehicle, participants } = trackingData;

    // Reset if map instance container was unmounted
    if (trackingMapRef.current && (trackingMapContainerRef.current as any)?._leaflet_id === undefined) {
      userMarkerRef.current = null;
      vehicleMarkerRef.current = null;
      routePolylineRef.current = null;
      Object.values(participantMarkersRef.current).forEach(item => {
        item.marker.remove();
        item.circle?.remove();
      });
      participantMarkersRef.current = {};
      trackingMapRef.current.remove();
      trackingMapRef.current = null;
    }

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
        attribution: '&copy; OpenStreetMap contributors | Jeevan Setu Multi-Participant Live Tracking'
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

    const activeBoundsCoords: Array<[number, number]> = [];

    // 1. Multi-Participant Markers rendering
    if (participants && participants.length > 0) {
      const activePids = new Set(participants.map(p => p.participantId));
      Object.keys(participantMarkersRef.current).forEach(pid => {
        if (!activePids.has(pid)) {
          participantMarkersRef.current[pid].marker.remove();
          participantMarkersRef.current[pid].circle?.remove();
          delete participantMarkersRef.current[pid];
        }
      });

      participants.forEach((part, index) => {
        if (!part.location || part.status === 'STOPPED') {
          if (participantMarkersRef.current[part.participantId]) {
            participantMarkersRef.current[part.participantId].marker.remove();
            participantMarkersRef.current[part.participantId].circle?.remove();
            delete participantMarkersRef.current[part.participantId];
          }
          return;
        }

        const { lat, lon, accuracy } = part.location;
        activeBoundsCoords.push([lat, lon]);

        const isHost = part.role === 'HOST';
        const friendBadges = ['🔵', '🟢', '🟣', '🟠', '🔷', '🩷', '🟡'];
        const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'];
        
        const friendParts = participants.filter(p => p.role !== 'HOST');
        const friendIdx = friendParts.findIndex(p => p.participantId === part.participantId);
        
        const markerColor = part.color || (isHost ? '#ef4444' : palette[friendIdx >= 0 ? friendIdx % palette.length : 0]);
        const badgeEmoji = isHost ? '🔴' : (friendBadges[friendIdx >= 0 ? friendIdx % friendBadges.length : 0] || '🔵');

        const icon = L.divIcon({
          className: `private-participant-marker-${part.participantId}`,
          html: `
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-2xl text-white font-black text-xs" style="background-color: ${markerColor}">
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-ping" style="background-color: ${markerColor}"></span>
              ${badgeEmoji}
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        if (!participantMarkersRef.current[part.participantId]) {
          const marker = L.marker([lat, lon], { icon }).addTo(map);
          marker.bindPopup(`
            <div class="p-2 text-xs font-sans">
              <strong style="color:${markerColor}" class="font-bold text-sm block">${badgeEmoji} ${part.label || part.participantId} (${part.role})</strong>
              <p class="text-slate-700 font-mono mt-1">Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}</p>
              <p class="text-slate-700 font-mono">Accuracy: ±${accuracy}m</p>
              <p class="text-emerald-600 font-bold uppercase mt-1">● ${part.status}</p>
            </div>
          `);

          let circle: L.Circle | undefined;
          if (accuracy && accuracy > 0) {
            circle = L.circle([lat, lon], {
              radius: accuracy,
              color: markerColor,
              fillColor: markerColor,
              fillOpacity: 0.15,
              weight: 1
            }).addTo(map);
          }

          participantMarkersRef.current[part.participantId] = { marker, circle };
        } else {
          const entry = participantMarkersRef.current[part.participantId];
          entry.marker.setLatLng([lat, lon]);
          entry.marker.setIcon(icon);
          entry.marker.setPopupContent(`
            <div class="p-2 text-xs font-sans">
              <strong style="color:${markerColor}" class="font-bold text-sm block">${badgeEmoji} ${part.label || part.participantId} (${part.role})</strong>
              <p class="text-slate-700 font-mono mt-1">Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)}</p>
              <p class="text-slate-700 font-mono">Accuracy: ±${accuracy}m</p>
              <p class="text-emerald-600 font-bold uppercase mt-1">● ${part.status}</p>
            </div>
          `);
          if (entry.circle) {
            entry.circle.setLatLng([lat, lon]);
            if (accuracy) entry.circle.setRadius(accuracy);
          }
        }
      });
    }

    // 2. Default User Emergency Marker (🔴 Host / Requester Location)
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
    activeBoundsCoords.push([emergency.lat, emergency.lon]);

    // 3. Remove assigned vehicle marker (Live map shows ONLY Me 🔴 & Friend 🔵 connection)
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }

    // 4. Polyline Route Connections between Me (🔴 Host) and ALL Friends (🔵 Friend 1, 🟢 Friend 2, 🟣 Friend 3...)
    participantPolylinesRef.current.forEach(p => p.remove());
    participantPolylinesRef.current = [];

    const hostPart = participants?.find(p => p.role === 'HOST' || p.participantId === 'P-1') || participants?.[0];
    const hostLat = hostPart?.location?.lat ?? emergency.lat;
    const hostLon = hostPart?.location?.lon ?? emergency.lon;

    if (participants && participants.length > 0) {
      participants.forEach((part) => {
        if (part.location && part.status !== 'STOPPED' && part.participantId !== (hostPart?.participantId || 'P-1')) {
          const points: L.LatLngExpression[] = [
            [hostLat, hostLon],
            [part.location.lat, part.location.lon]
          ];
          const colorToUse = part.color || '#10b981';
          const line = L.polyline(points, {
            color: colorToUse,
            weight: 3.5,
            dashArray: '6, 6',
            opacity: 0.9
          }).addTo(map);

          participantPolylinesRef.current.push(line);
          activeBoundsCoords.push([part.location.lat, part.location.lon]);
        }
      });
    }

    // Fit bounds to show all participants and vehicle
    if (activeBoundsCoords.length > 0) {
      const bounds = L.latLngBounds(activeBoundsCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }

    return () => {
      if (activeTab !== 'tracking' && trackingMapRef.current) {
        userMarkerRef.current = null;
        vehicleMarkerRef.current = null;
        participantPolylinesRef.current.forEach(p => p.remove());
        participantPolylinesRef.current = [];
        Object.values(participantMarkersRef.current).forEach(item => {
          item.marker.remove();
          item.circle?.remove();
        });
        participantMarkersRef.current = {};
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
    <div className={`min-h-screen font-sans p-3 md:p-6 pb-24 transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header Banner */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl shadow-xl backdrop-blur-md transition-colors ${
          isDarkMode ? 'bg-slate-900/90 border border-slate-800' : 'bg-white/90 border border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-500">
              <ShieldAlert className="w-7 h-7 animate-pulse" />
            </span>
            <div>
              <h1 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 flex-wrap ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {language === 'hi' ? 'स्मार्ट आपातकालीन प्रतिक्रिया प्रणाली' : 'SMART EMERGENCY RESPONSE'}
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 uppercase tracking-widest">
                  {language === 'hi' ? 'निजी 1-टू-1 जीपीएस ट्रैकिंग' : 'PRIVATE 1-TO-1 TRACKING'}
                </span>
              </h1>
              <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <Shield className="w-3.5 h-3.5 text-rose-500" />
                {language === 'hi'
                  ? 'भारत के 8 पूर्वोत्तर राज्यों में स्वचालित संबंधित वाहन आवंटन और लाइव जीपीएस ट्रैकिंग'
                  : 'Automatic Relevant Vehicle Matching & Private Live Tracking across 8 NER States of India'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`px-3.5 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>{isDarkMode ? (language === 'hi' ? 'लाइट मोड ☀️' : 'Light Mode ☀️') : (language === 'hi' ? 'डार्क मोड 🌙' : 'Dark Mode 🌙')}</span>
            </button>

            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                }`}
              >
                {language === 'hi' ? 'होमपेज पर जाएं' : 'Exit to Homepage'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('request')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'request'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950'
                : (isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm')
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-300" />
            {language === 'hi' ? '🚨 आपातकालीन सहायता का अनुरोध करें' : '🚨 Request Emergency Help'}
          </button>

          {activeSessionId && (
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'tracking'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
                  : (isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm')
              }`}
            >
              <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
              {language === 'hi' ? `🔒 मेरी निजी ट्रैकिंग (${activeSessionId})` : `🔒 My Private Tracking (${activeSessionId})`}
            </button>
          )}

          <button
            onClick={handleOpenQrModal}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border shadow-sm ${
              isDarkMode ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border-emerald-800/80 shadow-emerald-950/40' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-300'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            {language === 'hi' ? '📱 मोबाइल जीपीएस शेयर करें (QR कोड)' : '📱 Share Real Mobile GPS (QR Code)'}
          </button>

          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'driver'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950'
                : (isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm')
            }`}
          >
            <Truck className="w-4 h-4 text-indigo-400" />
            {language === 'hi' ? '👨‍✈️ ड्राइवर एवं काफिला पोर्टल' : '👨‍✈️ Driver & Convoy Portal'}
          </button>

          <button
            onClick={() => setActiveTab('simulation')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'simulation'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950'
                : (isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm')
            }`}
          >
            <Play className="w-4 h-4 text-amber-400" />
            {language === 'hi' ? '⚡ डेमो / सिमुलेशन मोड' : '⚡ Demo / Simulation Mode'}
          </button>
        </div>
      </div>

      {/* TAB 1: EMERGENCY REQUEST & LIVE DISPATCH MAP GRID */}
      {activeTab === 'request' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Interactive GIS Map */}
          <div className={`lg:col-span-7 h-full rounded-2xl border p-5 shadow-xl flex flex-col transition-colors duration-300 min-h-[680px] sm:min-h-[720px] xl:min-h-[780px] ${
            isDarkMode ? 'bg-[#070d1e] border-slate-800' : 'bg-white border-slate-200'
          }`}>
              {/* Map Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <span>🗺️</span> {language === 'hi' ? 'स्मार्ट आपातकालीन रिस्पॉन्स मैप' : 'Smart Emergency Response Map'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {language === 'hi' ? 'लाइव जीपीएस स्थिति, आवंटित प्रतिक्रिया वाहन एवं मार्ग देखें' : 'Live GPS location, assigned response vehicle & route preview'}
                  </p>
                </div>

                {/* Live GPS & Map Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locationLoading || submitting}
                    className="px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer border shadow bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-600/30"
                    title="Detect your device live location"
                  >
                    <Radio className={`h-3.5 w-3.5 ${locationLoading ? 'animate-spin' : 'animate-pulse'}`} />
                    <span>{locationLoading ? (language === 'hi' ? 'खोज रहे हैं...' : 'Locating...') : (language === 'hi' ? '📍 लाइव लोकेशन' : '📍 Live Location')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const coords = NER_STATE_DEFAULT_COORDS[userState] || [26.1445, 91.7362];
                      setUserLat(coords[0]);
                      setUserLon(coords[1]);
                      if (requestMapRef.current) {
                        requestMapRef.current.setView(coords, 12);
                        requestMapRef.current.invalidateSize();
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                      isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    🎯 {language === 'hi' ? 'री-सेंटर' : 'Recenter'}
                  </button>
                </div>
              </div>

              {/* Toolbar bar above map */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 my-2 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[240px]">
                    <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{userDistrict}, {userState}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  <span>
                    {selectedType === 'Medical' ? '🚑 Ambulance' : selectedType === 'Fire' ? '🚒 Fire Tender' : selectedType === 'Police' ? '🚓 Police Patrol' : '🚚 Relief Convoy'} Matched
                  </span>
                </div>
              </div>

              {/* Interactive Leaflet Map Container */}
              <div className="relative flex-1 min-h-[440px] sm:min-h-[480px] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner my-1">
                <div ref={requestMapContainerRef} className="absolute inset-0 w-full h-full z-0" />
                
                {/* Floating Detect Live Location overlay button */}
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locationLoading || submitting}
                  className="absolute bottom-3 right-3 z-[400] px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-2xl border border-rose-500/50 backdrop-blur-md flex items-center gap-2 cursor-pointer transition hover:scale-105 active:scale-95"
                >
                  <Radio className={`h-4 w-4 ${locationLoading ? 'animate-spin text-rose-400' : 'text-rose-500 animate-pulse'}`} />
                  <span>{locationLoading ? (language === 'hi' ? 'कनेक्ट हो रहा है...' : 'Connecting...') : (language === 'hi' ? '📍 मेरा स्थान उपयोग करें' : '📍 Detect My Live Location')}</span>
                </button>
              </div>

              {/* Assigned Vehicle Quick Status Footer */}
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 my-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-rose-600 text-white">
                      {selectedType} Emergency
                    </span>
                    <h4 className={`text-sm font-black truncate max-w-[280px] ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {selectedType === 'Medical' ? '🚑 Emergency Trauma Ambulance' : selectedType === 'Fire' ? '🚒 High-Altitude Fire Tender' : selectedType === 'Police' ? '🚓 Rapid Response Police Patrol' : '🚚 4x4 Disaster Relief Convoy'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    {userDistrict}, {userState} &bull; <b className="text-rose-400">Lat: {userLat.toFixed(4)}, Lon: {userLon.toFixed(4)}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locationLoading || submitting}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{language === 'hi' ? 'लाइव कनेक्ट ➔' : 'Connect Live ➔'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> 🔴 My Location</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> 🚑 Assigned Vehicle</span>
                </div>
                <span>Status: <strong className="text-emerald-500">READY TO DISPATCH</strong></span>
              </div>
          </div>

        {/* Right Column: Emergency Request Form Cards Panel */}
        <div className={`lg:col-span-5 h-full rounded-2xl border p-5 shadow-xl flex flex-col transition-colors duration-300 min-h-[680px] sm:min-h-[720px] xl:min-h-[780px] ${
          isDarkMode ? 'bg-[#070d1e] border-slate-800' : 'bg-white border-slate-200'
        }`}>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
              <h3 className={`text-base sm:text-lg font-black flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {language === 'hi' ? 'आपातकालीन सहायता फॉर्म' : 'Emergency Request Details'}
              </h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                calculatedPriority === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500 animate-pulse'
                  : calculatedPriority === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500'
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500'
              }`}>
                {calculatedPriority} PRIORITY
              </span>
            </div>

            <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
              {/* Emergency Type Pills */}
              <div>
                <label className={`block font-bold text-xs uppercase tracking-wider mb-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {language === 'hi' ? 'आपातकालीन श्रेणी' : 'Emergency Category'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'Medical' as EmergencyType, label: '🏥 Medical' },
                    { type: 'Fire' as EmergencyType, label: '🔥 Fire' },
                    { type: 'Police' as EmergencyType, label: '🚓 Police' },
                    { type: 'Relief' as EmergencyType, label: '📦 Relief' },
                    { type: 'Other' as EmergencyType, label: '⚠️ Other' }
                  ].map(opt => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={() => {
                        setSelectedType(opt.type);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-extrabold transition text-left ${
                        selectedType === opt.type
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                          : (isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200')
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* State & District Selector */}
              <div className="space-y-3">
                <div>
                  <label className={`block font-bold text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'राज्य (8 पूर्वोत्तर राज्य)' : 'State (8 NER States)'}
                  </label>
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
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {NER_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'ज़िला स्थान' : 'District Location'}
                  </label>
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
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold border outline-none ${
                      isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {(NER_STATES_DISTRICTS[userState] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Requirement & Description */}
              <div>
                <label className={`block font-bold text-xs mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'hi' ? 'स्थिति का विवरण' : 'Situation Description'}
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. आपातकालीन चिकित्सा सहायता की आवश्यकता है।' : 'e.g. Emergency medical help needed.'}
                  className={`w-full rounded-xl p-2.5 text-xs border outline-none ${
                    isDarkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                ></textarea>
              </div>

              {submitError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-200 rounded-xl text-xs">
                  {submitError}
                </div>
              )}
            </div>

            {/* Action Buttons Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locationLoading || submitting}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Compass className={`w-4 h-4 ${locationLoading || submitting ? 'animate-spin' : ''}`} />
                <span>{language === 'hi' ? '📍 मेरा स्थान उपयोग करें और लाइव कनेक्ट करें' : '📍 USE MY LOCATION & CONNECT LIVE'}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={submitting}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition"
              >
                {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-4 h-4 text-rose-400" />}
                <span>{language === 'hi' ? '[ अनुरोध जमा करें ]' : '[ SUBMIT EMERGENCY REQUEST ]'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVATE LIVE TRACKING MAP (1-to-1 SECURITY RULE) */}
      {activeTab === 'tracking' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {trackingLoading && (
            <div className={`p-8 text-center text-xs flex items-center justify-center gap-2 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
              {language === 'hi'
                ? 'सुरक्षित निजी लाइव ट्रैकिंग सत्र से कनेक्ट हो रहा है...'
                : 'Connecting to secure private live tracking session...'}
            </div>
          )}

          {trackingError && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{trackingError}</span>
            </div>
          )}

          {trackingData && (
            <div className={`border rounded-3xl overflow-hidden shadow-2xl space-y-0 ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              {/* Private Map Header */}
              <div className={`p-4 border-b space-y-3 ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <h2 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {language === 'hi' ? 'स्मार्ट आपातकालीन प्रतिक्रिया' : 'SMART EMERGENCY RESPONSE'}
                      <span className="font-mono text-[10px] text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        {trackingData.sessionId}
                      </span>
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/?shareSession=${trackingData.sessionId}&token=${trackingData.token || 'tok_live'}`;
                        const text = encodeURIComponent(`🚨 Live Emergency Location Tracking: ${shareUrl}`);
                        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1 cursor-pointer transition shadow"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>WhatsApp Share</span>
                    </button>

                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/?shareSession=${trackingData.sessionId}&token=${trackingData.token || 'tok_live'}`;
                        navigator.clipboard.writeText(shareUrl);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition ${
                        isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                      }`}
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? (language === 'hi' ? 'कॉपी हो गया' : 'Copied') : (language === 'hi' ? 'लिंक कॉपी करें' : 'Copy Link')}
                    </button>
                  </div>
                </div>

                {/* Live GPS Telemetry Action Bar */}
                <div className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleManualGpsUpdateInTracking}
                      disabled={locationLoading}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer"
                    >
                      <Navigation className={`w-3.5 h-3.5 ${locationLoading ? 'animate-spin' : ''}`} />
                      <span>{language === 'hi' ? '📍 मेरा असली लाइव GPS अपडेट करें' : '📍 Update My Real Live GPS'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAutoGpsSync(!autoGpsSync)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                        autoGpsSync
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${autoGpsSync ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                      <span>{autoGpsSync ? (language === 'hi' ? 'ऑटो GPS सिंक: चालू' : 'Auto GPS Sync: ON') : (language === 'hi' ? 'ऑटो GPS सिंक: बंद' : 'Auto GPS Sync: OFF')}</span>
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    My GPS: <strong className="text-rose-500 font-extrabold">{userLat.toFixed(4)}, {userLon.toFixed(4)}</strong>
                  </div>
                </div>
              </div>

              {/* Dedicated Leaflet Map Canvas */}
              <div className="relative w-full h-[420px] min-h-[420px] bg-slate-950 rounded-2xl">
                <div ref={trackingMapContainerRef} style={{ width: '100%', height: '420px', minHeight: '420px' }} className="w-full h-[420px] min-h-[420px] z-0 rounded-2xl"></div>

                {/* Overlay Legend */}
                <div className={`absolute top-3 left-3 z-10 border p-2.5 rounded-xl text-[10px] space-y-1.5 backdrop-blur-md shadow-xl ${
                  isDarkMode ? 'bg-slate-950/90 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔴</span>
                    <span className="font-bold">{language === 'hi' ? 'मेरा स्थान (मैं)' : 'My Location (Me)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔵</span>
                    <span className="font-bold text-sky-500">{language === 'hi' ? 'मित्र स्थान (फोन B)' : 'Friend Location (Phone B)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block"></span>
                    <span className="font-bold text-emerald-500">{language === 'hi' ? 'लाइव कनेक्शन (मैं ➔ मित्र)' : 'Live Connection (Me ➔ Friend)'}</span>
                  </div>
                </div>
              </div>

              {/* Live Status & Distance Card */}
              <div className={`p-5 border-t space-y-4 ${
                isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 ${
                  isDarkMode ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                      {language === 'hi' ? 'प्रतिक्रिया स्थिति' : 'Response Status'}
                    </span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {trackingData.participants && trackingData.participants.length > 1
                        ? (language === 'hi' ? 'बहु-व्यक्ति लाइव कनेक्टेड' : 'MULTI-PERSON LIVE CONNECTED')
                        : (language === 'hi' ? 'सत्र सक्रिय' : 'SESSION_ACTIVE')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                    {(() => {
                      const hostPart = trackingData.participants?.find(p => p.role === 'HOST' || p.participantId === 'P-1') || trackingData.participants?.[0];
                      const hostLat = hostPart?.location?.lat ?? trackingData.emergency.lat;
                      const hostLon = hostPart?.location?.lon ?? trackingData.emergency.lon;
                      const activeFriends = trackingData.participants?.filter(p => p.location && p.status !== 'STOPPED' && p.participantId !== (hostPart?.participantId || 'P-1')) || [];

                      if (activeFriends.length > 0) {
                        return activeFriends.map((fPart) => {
                          const dist = calculateHaversineDistance(hostLat, hostLon, fPart.location!.lat, fPart.location!.lon);
                          return (
                            <div key={fPart.participantId} className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${
                              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                            }`}>
                              <span style={{ color: fPart.color || '#3b82f6' }} className="font-extrabold text-xs">● {fPart.label || fPart.participantId}</span>
                              <strong className={`text-xs ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{dist} km</strong>
                            </div>
                          );
                        });
                      }
                      return (
                        <div className={`px-3 py-1.5 rounded-xl border ${
                          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-300 shadow-sm'
                        }`}>
                          <span className="text-[10px] text-slate-500 block">{language === 'hi' ? 'स्थिति' : 'Status'}</span>
                          <strong className="text-amber-500 text-sm">{language === 'hi' ? 'QR द्वारा मित्र की प्रतीक्षा जारी' : 'Waiting for Friend via QR'}</strong>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Multi-Participant Live Location Status Section */}
                <div className={`p-4 rounded-2xl space-y-3.5 border ${
                  isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <h3 className={`text-xs font-black uppercase tracking-wide ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {language === 'hi'
                          ? `लाइव जीपीएस सत्र प्रतिभागी (${trackingData.participants?.length || 1})`
                          : `Live GPS Session Participants (${trackingData.participants?.length || 1})`}
                      </h3>
                    </div>

                    <button
                      onClick={handleOpenQrModal}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow flex items-center gap-2 cursor-pointer transition"
                    >
                      <Share2 className="w-4 h-4" />
                      {language === 'hi' ? '📱 QR कोड / लिंक द्वारा आमंत्रित करें' : '📱 Invite Live Participant (QR Code)'}
                    </button>
                  </div>

                  {/* Add Friend to Map Panel */}
                  <div className={`p-3.5 rounded-xl border space-y-2.5 ${
                    isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold flex items-center gap-1.5 text-indigo-500 dark:text-indigo-400">
                        <Users className="w-3.5 h-3.5" />
                        {language === 'hi' ? '+ मित्र / रिश्तेदार को लाइव मैप पर जोड़ें' : '+ Add Friend / Relative to Live Map'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {language === 'hi' ? 'मैप पर मित्र की पिन देखें' : 'View friend pin on live map'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={customFriendName}
                        onChange={e => setCustomFriendName(e.target.value)}
                        placeholder={language === 'hi' ? 'मित्र का नाम दर्ज करें (उदा. राहुल, प्रिया)' : 'Enter friend name (e.g. Rahul, Priya)'}
                        className={`w-full sm:flex-1 rounded-xl px-3 py-1.5 text-xs border outline-none font-bold ${
                          isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddSimulatedFriend(customFriendName)}
                        disabled={addingFriend}
                        className="w-full sm:w-auto px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer shrink-0 transition"
                      >
                        {addingFriend ? '...' : (language === 'hi' ? '+ जोड़ें' : '+ Add Friend Pin')}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      <span className="text-[10px] text-slate-500 font-bold">{language === 'hi' ? 'त्वरित जोड़ें:' : 'Quick add:'}</span>
                      <button
                        type="button"
                        onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'मित्र 1 (राहुल)' : 'Friend 1 (Rahul)')}
                        className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-[10px] font-bold border border-blue-500/30 cursor-pointer"
                      >
                        + Friend 1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'मित्र 2 (प्रिया)' : 'Friend 2 (Priya)')}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-500/30 cursor-pointer"
                      >
                        + Friend 2
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'रिश्तेदार' : 'Relative')}
                        className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 rounded-lg text-[10px] font-bold border border-purple-500/30 cursor-pointer"
                      >
                        + Relative
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {(trackingData.participants && trackingData.participants.length > 0) ? (
                      trackingData.participants.map((part, idx) => (
                        <div key={part.participantId} className={`p-3 rounded-xl space-y-1.5 border ${
                          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className={`font-extrabold flex items-center gap-1.5 ${
                              isDarkMode ? 'text-white' : 'text-slate-900'
                            }`}>
                              <span>{part.role === 'HOST' ? '🔴' : idx === 1 ? '🔵' : '🟢'}</span>
                              <span>{part.label || part.participantId}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({part.role})</span>
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                part.status === 'LIVE'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40 animate-pulse'
                                  : part.status === 'STALE'
                                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                                  : 'bg-slate-200 text-slate-600 border-slate-300'
                              }`}>
                                ● {part.status}
                              </span>
                              {part.role !== 'HOST' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFriend(part.participantId)}
                                  className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold cursor-pointer px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/30"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {part.location ? (
                            <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300 space-y-0.5">
                              <div>Lat: <span className="font-bold text-slate-900 dark:text-white">{part.location.lat.toFixed(5)}</span>, Lon: <span className="font-bold text-slate-900 dark:text-white">{part.location.lon.toFixed(5)}</span></div>
                              <div className="text-slate-500 text-[10px] flex items-center justify-between">
                                <span>Accuracy: ±{part.location.accuracy}m</span>
                                <span>{new Date(part.location.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-500 italic">{language === 'hi' ? 'प्रारंभिक जीपीएस स्थान की प्रतीक्षा जारी...' : 'Waiting for initial GPS location...'}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={`p-3 rounded-xl space-y-1.5 col-span-2 border ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-extrabold flex items-center gap-1.5 ${
                            isDarkMode ? 'text-white' : 'text-slate-900'
                          }`}>
                            <span>🔴</span>
                            <span>{language === 'hi' ? 'अनुरोधकर्ता (मैं)' : 'Requester (Me)'}</span>
                            <span className="text-[10px] text-slate-500 font-mono">(HOST)</span>
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 animate-pulse">
                            ● LIVE
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          Lat: <span className="font-bold text-slate-900 dark:text-white">{trackingData.emergency.lat.toFixed(5)}</span>, Lon: <span className="font-bold text-slate-900 dark:text-white">{trackingData.emergency.lon.toFixed(5)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Vehicle Details */}
                {trackingData.assignedVehicle ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className={`p-3.5 rounded-2xl border space-y-1 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        {language === 'hi' ? 'आवंटित वाहन' : 'Assigned Vehicle'}
                      </span>
                      <strong className={`text-base block flex items-center gap-2 ${
                        isDarkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {trackingData.assignedVehicle.typeCategory === 'Medical'
                          ? '🚑'
                          : trackingData.assignedVehicle.typeCategory === 'Fire'
                          ? '🚒'
                          : trackingData.assignedVehicle.typeCategory === 'Police'
                          ? '🚓'
                          : '🚚'}{' '}
                        {trackingData.assignedVehicle.vehicleType}
                      </strong>
                      <span className="text-slate-500 font-mono text-[11px] block">ID: {trackingData.assignedVehicle.vehicleId}</span>
                    </div>

                    <div className={`p-3.5 rounded-2xl border space-y-1 ${
                      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                    }`}>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">
                        {language === 'hi' ? 'ड्राइवर / ऑपरेटर' : 'Driver / Operator'}
                      </span>
                      <strong className={`text-sm block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {trackingData.assignedVehicle.driverName}
                      </strong>
                      <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] block">
                        {language === 'hi' ? 'संपर्क:' : 'Contact:'} {trackingData.assignedVehicle.contact}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-200 rounded-xl text-xs">
                    {language === 'hi' ? 'प्रेषण के लिए निकटतम उपयुक्त उपलब्ध वाहन की खोज जारी है...' : 'Finding nearest suitable available vehicle for dispatch...'}
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
          <div className={`p-5 md:p-6 rounded-3xl shadow-2xl space-y-5 border transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <h2 className={`text-base font-extrabold flex items-center gap-2 ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <Truck className="w-5 h-5 text-indigo-500" />
                  {language === 'hi' ? 'ड्राइवर प्रेषण एवं लाइव जीपीएस नियंत्रण पोर्टल' : 'Driver Dispatch & Live GPS Control Portal'}
                </h2>
                <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {language === 'hi'
                    ? 'अधिकृत ड्राइवर आपातकालीन अनुरोध स्वीकार करते हैं और वास्तविक डिवाइस निर्देशांक प्रेषित करते हैं।'
                    : 'Authorized drivers accept emergency requests and transmit real device coordinates.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDriverRegModal(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  {language === 'hi' ? '+ ड्राइवर पंजीकृत करें' : '+ Register Driver'}
                </button>

                <div className="flex items-center gap-2">
                  <label className={`text-xs font-bold hidden sm:inline ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {language === 'hi' ? 'सक्रिय वाहन:' : 'Active Vehicle:'}
                  </label>
                  <select
                    value={selectedDriverVehicleId}
                    onChange={e => setSelectedDriverVehicleId(e.target.value)}
                    className={`border rounded-xl px-3 py-1.5 font-mono text-xs max-w-[220px] ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {driverVehicles.length > 0 ? (
                      driverVehicles.map(v => (
                        <option key={v.vehicleId} value={v.vehicleId}>
                          {v.vehicleId} ({v.driverName} - {v.state})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="JS-AMB-001">JS-AMB-001 (Ambulance - Assam)</option>
                        <option value="JS-FIRE-001">JS-FIRE-001 (Fire Vehicle - Meghalaya)</option>
                        <option value="JS-POL-001">JS-POL-001 (Police Vehicle - Manipur)</option>
                        <option value="JS-REL-001">JS-REL-001 (Relief Truck - Tripura)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            {/* Emergency Requests Queue for Drivers */}
            <div className="space-y-4">
              <h3 className={`text-xs font-extrabold uppercase tracking-wider flex items-center justify-between ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}>
                <span>
                  {language === 'hi' ? 'आगमन आपातकालीन अनुरोध कतार' : 'Incoming Emergency Requests Queue'} ({driverEmergencies.length})
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal">
                  {language === 'hi' ? '● हर 4 सेकंड में ऑटो-रिफ्रेश' : '● AUTO-REFRESHING EVERY 4S'}
                </span>
              </h3>

              {driverEmergencies.length === 0 ? (
                <div className={`p-8 text-center text-xs border rounded-2xl ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  {language === 'hi'
                    ? 'कतार में कोई सक्रिय आपातकालीन अनुरोध नहीं है। ड्राइवर प्रतिक्रिया का परीक्षण करने के लिए टैब 1 से एक आपातकालीन अनुरोध बनाएं।'
                    : 'No active emergency requests in queue. Create an emergency request from Tab 1 to test driver response.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {driverEmergencies.map(emg => (
                    <div
                      key={emg.emergencyRequestId}
                      className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                        isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-500">{emg.emergencyRequestId}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            {language === 'hi' ? `${emg.priority === 'CRITICAL' ? 'गंभीर' : emg.priority === 'HIGH' ? 'उच्च' : 'सामान्य'} प्राथमिकता` : `${emg.priority} PRIORITY`}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {emg.status}
                          </span>
                        </div>

                        <h4 className={`text-sm font-extrabold mt-1 ${
                          isDarkMode ? 'text-white' : 'text-slate-900'
                        }`}>
                          {emg.emergencyType} &bull; {emg.requirement}
                        </h4>
                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{emg.district}, {emg.state}</p>
                        {emg.description && <p className="text-xs text-slate-500 dark:text-slate-300 italic mt-1">"{emg.description}"</p>}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={async () => {
                            await acceptDriverRequest(emg.emergencyRequestId, selectedDriverVehicleId);
                            fetchDriverData();
                          }}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                        >
                          {language === 'hi' ? 'अनुरोध स्वीकार करें' : 'ACCEPT REQUEST'}
                        </button>

                        <button
                          onClick={async () => {
                            await updateEmergencyStatus(emg.emergencyRequestId, 'ON_THE_WAY');
                            fetchDriverData();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow cursor-pointer"
                        >
                          {language === 'hi' ? '📍 स्थान शेयरिंग शुरू करें' : '📍 START LOCATION SHARING'}
                        </button>

                        <button
                          onClick={async () => {
                            await markDriverArrived(emg.emergencyRequestId);
                            fetchDriverData();
                          }}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          {language === 'hi' ? 'पहुंच गए चिह्नित करें' : 'Mark Arrived'}
                        </button>

                        <button
                          onClick={async () => {
                            await markDriverComplete(emg.emergencyRequestId);
                            fetchDriverData();
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                            isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                          }`}
                        >
                          {language === 'hi' ? 'पूर्ण हुआ चिह्नित करें' : 'Mark Completed'}
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

      {/* DRIVER REGISTRATION MODAL */}
      {showDriverRegModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative my-8 transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <h3 className={`text-base font-extrabold flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <Truck className="w-5 h-5 text-indigo-500" />
                {language === 'hi' ? 'आपातकालीन ड्राइवर और वाहन पंजीकृत करें' : 'Register Emergency Driver & Vehicle'}
              </h3>
              <button
                onClick={() => setShowDriverRegModal(false)}
                className={`p-1 rounded-xl cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterDriver} className="space-y-4 text-xs">
              <div>
                <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'hi' ? 'ड्राइवर का पूरा नाम *' : 'Driver Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={regDriverName}
                  onChange={e => setRegDriverName(e.target.value)}
                  placeholder={language === 'hi' ? 'उदा. रमेश कलिता' : 'e.g. Ramesh Kalita'}
                  className={`w-full rounded-xl p-2.5 border ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {language === 'hi' ? 'संपर्क फोन नंबर *' : 'Contact Phone Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={regContact}
                  onChange={e => setRegContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className={`w-full rounded-xl p-2.5 font-mono border ${
                    isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'श्रेणी' : 'Category'}
                  </label>
                  <select
                    value={regCategory}
                    onChange={e => setRegCategory(e.target.value as EmergencyType)}
                    className={`w-full rounded-xl p-2.5 font-semibold border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="Medical">{language === 'hi' ? 'चिकित्सा (एम्बुलेंस)' : 'Medical (Ambulance)'}</option>
                    <option value="Fire">{language === 'hi' ? 'अग्निशामक' : 'Fire Tender'}</option>
                    <option value="Police">{language === 'hi' ? 'पुलिस गश्ती' : 'Police Patrol'}</option>
                    <option value="Relief">{language === 'hi' ? 'राहत सामग्री' : 'Relief Convoy'}</option>
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'वाहन विवरण' : 'Vehicle Description'}
                  </label>
                  <input
                    type="text"
                    value={regVehicleType}
                    onChange={e => setRegVehicleType(e.target.value)}
                    placeholder="e.g. 🚑 ICU Ambulance"
                    className={`w-full rounded-xl p-2.5 border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'राज्य (पूर्वोत्तर)' : 'State (NER)'}
                  </label>
                  <select
                    value={regState}
                    onChange={e => {
                      const s = e.target.value;
                      setRegState(s);
                      const dists = NER_STATES_DISTRICTS[s] || [];
                      setRegDistrict(dists[0] || '');
                    }}
                    className={`w-full rounded-xl p-2.5 border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {NER_STATES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {language === 'hi' ? 'जिला' : 'District'}
                  </label>
                  <select
                    value={regDistrict}
                    onChange={e => setRegDistrict(e.target.value)}
                    className={`w-full rounded-xl p-2.5 border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  >
                    {(NER_STATES_DISTRICTS[regState] || []).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {regError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-700 dark:text-rose-200 rounded-xl">
                  {regError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={regSubmitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow transition cursor-pointer"
                >
                  {regSubmitting ? (language === 'hi' ? 'पंजीकृत हो रहा है...' : 'Registering...') : (language === 'hi' ? 'वाहन पंजीकृत करें' : 'REGISTER VEHICLE')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDriverRegModal(false)}
                  className={`py-3 px-4 font-bold rounded-xl cursor-pointer ${
                    isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: DEMO / SIMULATION MODE */}
      {activeTab === 'simulation' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className={`p-5 md:p-7 rounded-3xl shadow-2xl space-y-6 border transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <strong className="font-extrabold uppercase text-amber-700 dark:text-amber-300 block">
                    {language === 'hi' ? 'डेमो / सिमुलेशन मोड' : 'DEMO / SIMULATION MODE'}
                  </strong>
                  <span>
                    {language === 'hi'
                      ? 'भौतिक डिवाइस आंदोलन के बिना लाइव वाहन गतिविधि, दूरी और ईटीए अपडेट सिमुलेट करें।'
                      : 'Simulate live vehicle movement, distance countdown, and ETA updates without physical device movement.'}
                  </span>
                </div>
              </div>
            </div>

            {activeSessionId ? (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {language === 'hi' ? 'सक्रिय सत्र' : 'ACTIVE SESSION'}
                    </span>
                    <strong className={`text-base block font-mono ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activeSessionId}</strong>
                  </div>

                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-full">
                    {trackingData?.emergency.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      const res = await simulateVehicleStep(activeSessionId);
                      if (res.success && res.data) setTrackingData(res.data);
                    }}
                    className="p-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                    {language === 'hi' ? '▶ 1-स्टेप ड्राइव सिमुलेट करें (500मी निकट)' : '▶ Simulate 1-Step Drive (500m Closer)'}
                  </button>

                  <button
                    onClick={() => setSimulatingAuto(!simulatingAuto)}
                    className={`p-4 font-extrabold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                      simulatingAuto ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {simulatingAuto ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {simulatingAuto
                      ? (language === 'hi' ? 'लाइव ड्राइव लूप रोकें' : 'Pause Live Drive Loop')
                      : (language === 'hi' ? '▶ ऑटो ड्राइव सिमुलेशन (लाइव लूप)' : '▶ Auto Drive Simulation (Live Loop)')}
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
                    className="p-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl cursor-pointer"
                  >
                    {language === 'hi' ? '📍 वाहन आगमन सिमुलेट करें' : '📍 Simulate Vehicle Arrival'}
                  </button>

                  <button
                    onClick={async () => {
                      if (trackingData?.emergency.emergencyRequestId) {
                        await updateEmergencyStatus(trackingData.emergency.emergencyRequestId, 'COMPLETED');
                        setSimulatingAuto(false);
                        fetchTrackingSession();
                      }
                    }}
                    className={`p-3 font-bold rounded-xl border cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {language === 'hi' ? '✅ प्रतिक्रिया जीवनचक्र पूर्ण करें' : '✅ Complete Response Lifecycle'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={`p-8 text-center text-xs border rounded-2xl ${
                isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {language === 'hi'
                  ? 'सिमुलेशन मोड शुरू करने के लिए पहले एक आपातकालीन अनुरोध जमा करें।'
                  : 'Submit an emergency request first to start simulation mode.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL ANDROID PHONE QR CODE SHARE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className={`border rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl relative my-8 transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${
              isDarkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500">
                  <Radio className="w-5 h-5 animate-pulse" />
                </span>
                <div>
                  <h3 className={`text-base font-black flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    {language === 'hi' ? 'वास्तविक एंड्रॉइड जीपीएस ट्रैकिंग (QR कोड)' : 'Real Android GPS Tracking (QR Code)'}
                  </h3>
                  <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {language === 'hi' ? 'वास्तविक जीपीएस टेलीमेट्री शेयर करने के लिए फोन A से स्कैन करें' : 'Scan from Phone A to share actual GPS telemetry'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Configurable App URL Field */}
            <div className="space-y-1.5">
              <label className={`block text-xs font-extrabold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {language === 'hi' ? 'एप्लीकेशन डोमेन / HTTPS टनल यूआरएल:' : 'Application Domain / HTTPS Tunnel URL:'}
              </label>
              <input
                type="text"
                value={qrAppUrl}
                onChange={e => setQrAppUrl(e.target.value)}
                placeholder="https://YOUR-DEPLOYED-DOMAIN or https://xxx.loca.lt"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-600 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500 outline-none ${
                  isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-300'
                }`}
              />
              <p className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ⚠️ Android Chrome requires <strong>HTTPS</strong> for Geolocation API. For local mobile testing, expose port 3000 using Localtunnel or Ngrok e.g. <code className="text-emerald-600 dark:text-emerald-400 bg-slate-200 dark:bg-slate-950 px-1 py-0.5 rounded">npx localtunnel --port 3000</code> and paste the HTTPS URL above.
              </p>
            </div>

            {/* QR Code Container */}
            <div className={`border p-5 rounded-3xl text-center flex flex-col items-center justify-center space-y-3 shadow-inner ${
              isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              {qrLoading ? (
                <div className="py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-emerald-500" />
                  {language === 'hi' ? 'सुरक्षित वास्तविक-फोन ट्रैकिंग QR कोड जनरेट हो रहा है...' : 'Generating secure real-phone tracking QR code...'}
                </div>
              ) : qrImageSrc ? (
                <>
                  <div className="p-3 border-2 border-slate-900 dark:border-slate-100 rounded-2xl shadow-xl bg-white">
                    <img src={qrImageSrc} alt="Real GPS Tracking QR Code" className="w-56 h-56 rounded-xl" />
                  </div>
                  <div className={`text-[11px] font-mono text-slate-900 dark:text-slate-100 px-3 py-1.5 rounded-xl border break-all max-w-full ${
                    isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-300 shadow-sm'
                  }`}>
                    {qrSessionData?.trackingUrl}
                  </div>
                </>
              ) : (
                <button
                  onClick={handleOpenQrModal}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  {language === 'hi' ? 'QR कोड जनरेट करें' : 'Generate QR Code'}
                </button>
              )}
            </div>

            {/* Multi-Friend Live Quick Spawn Section */}
            <div className={`p-4 border rounded-2xl text-xs space-y-2.5 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <strong className="text-emerald-500 font-extrabold uppercase text-[11px] block tracking-wide">
                {language === 'hi' ? '⚡ बहु-मित्र लाइव परीक्षण (एक ही सत्र में कई मित्र जोड़ें)' : '⚡ Multi-Friend Live Demo (Add Multiple Friends to Session)'}
              </strong>
              <p className="text-[11px] text-slate-500">
                {language === 'hi'
                  ? 'आप एक ही QR / लाइव सत्र में कई मित्रों (राहुल, प्रिया, अमित) को जोड़ सकते हैं। वे सभी मानचित्र पर अलग-अलग रंगों से लाइव प्रदर्शित होंगे।'
                  : 'You can add multiple friends (Rahul, Priya, Amit) to the same session. All will display live on the Leaflet map with distinct pin colors.'}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'मित्र 1 (राहुल)' : 'Friend 1 (Rahul)')}
                  disabled={addingFriend}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer transition"
                >
                  + {language === 'hi' ? 'राहुल (मित्र 1)' : 'Rahul (Friend 1)'}
                </button>
                <button
                  onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'मित्र 2 (प्रिया)' : 'Friend 2 (Priya)')}
                  disabled={addingFriend}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer transition"
                >
                  + {language === 'hi' ? 'प्रिया (मित्र 2)' : 'Priya (Friend 2)'}
                </button>
                <button
                  onClick={() => handleAddSimulatedFriend(language === 'hi' ? 'रेस्पोंडर (अमित)' : 'Responder (Amit)')}
                  disabled={addingFriend}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow flex items-center gap-1 cursor-pointer transition"
                >
                  + {language === 'hi' ? 'अमित (रेस्पोंडर)' : 'Amit (Responder)'}
                </button>
              </div>
            </div>

            {/* Step-by-Step Test Guide */}
            <div className={`p-4 border rounded-2xl text-xs space-y-2 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <strong className="text-amber-600 dark:text-amber-400 font-bold block flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-500" />
                {language === 'hi' ? 'वास्तविक फोन परीक्षण निर्देश:' : 'Real Phone Testing Instructions:'}
              </strong>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'hi' ? (
                  <>
                    <li><strong className="text-slate-900 dark:text-white">फोन A (प्रेषक):</strong> एंड्रॉइड फोन कैमरा का उपयोग करके QR कोड स्कैन करें और क्रोम में खोलें।</li>
                    <li><strong className="text-slate-900 dark:text-white">फोन A:</strong> <span className="text-emerald-600 dark:text-emerald-400 font-bold">[जीपीएस अनुमति दें और लाइव शेयरिंग शुरू करें]</span> पर टैप करें। अनुमति के लिए <strong>Allow</strong> चुनें।</li>
                    <li><strong className="text-slate-900 dark:text-white">फोन B (डैशबोर्ड/दर्शंक):</strong> फोन A को लाइव देखने के लिए नीचे दिए गए बटन पर टैप करें!</li>
                  </>
                ) : (
                  <>
                    <li><strong className="text-slate-900 dark:text-white">PHONE A (Sender):</strong> Scan QR Code using Android Phone camera and open in Chrome.</li>
                    <li><strong className="text-slate-900 dark:text-white">PHONE A:</strong> Tap <span className="text-emerald-600 dark:text-emerald-400 font-bold">[ALLOW GPS & START LIVE SHARING]</span>. Chrome will prompt for location permission. Tap <strong>Allow</strong>.</li>
                    <li><strong className="text-slate-900 dark:text-white">PHONE B (Dashboard/Viewer):</strong> Tap button below to open live tracking dashboard and watch Phone A move live!</li>
                  </>
                )}
              </ol>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (qrSessionData?.sessionId) {
                    setActiveSessionId(qrSessionData.sessionId);
                    setActiveTab('tracking');
                    setShowQrModal(false);
                  }
                }}
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4 text-white" />
                {language === 'hi' ? '[ डैशबोर्ड पर लाइव ट्रैकिंग खोलें ]' : '[ Open Live Tracking on Dashboard ]'}
              </button>

              <button
                onClick={() => setShowQrModal(false)}
                className={`py-3.5 px-4 font-bold text-xs rounded-xl border cursor-pointer ${
                  isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                }`}
              >
                {language === 'hi' ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
