import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Package,
  Warehouse,
  MapPin,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Search,
  Shield,
  Activity,
  PhoneCall,
  Navigation,
  Check,
  X,
  Play,
  Square,
  Cpu,
  Layers,
  FileText,
  Radio,
  ExternalLink,
  ChevronRight,
  QrCode,
  Send,
  Share2
} from 'lucide-react';
import L from 'leaflet';
import {
  ReliefSupplyItem,
  ReliefVehicle,
  ReliefDepot,
  ReliefOperation,
  SmartAllocationResult,
  fetchReliefSupplies,
  createSupplyRequest,
  fetchReliefVehicles,
  fetchReliefDepots,
  fetchReliefOperations,
  dispatchReliefOperation,
  markOperationDelivered,
  getSmartAllocation,
  sendVehicleGPSLocation,
  watchDeviceGPS,
  dispatchVehicleRoute,
  fetchVehicleRoute,
  clearVehicleRoute
} from '../services/api/reliefService';
import { NER_STATES, NER_STATES_DISTRICTS } from '../services/api/disasterReportsService';

interface ReliefSupplyTrackingModuleProps {
  initialTab?: 'supplies' | 'depots' | 'live-map' | 'driver-portal' | 'operations' | 'smart-alloc';
  onNavigateHome?: () => void;
}

// ─── Route Realism Utilities ────────────────────────────────────────────────

/**
 * Catmull-Rom spline: smooths a polyline of [lat,lon] through intermediate
 * control points, yielding a silky curved path through every waypoint.
 */
function catmullRomSmooth(pts: [number, number][], resolution: number = 14): [number, number][] {
  if (pts.length < 2) return pts;
  const result: [number, number][] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < resolution; j++) {
      const t = j / resolution;
      const t2 = t * t;
      const t3 = t2 * t;
      const lat = 0.5 * (
        2 * p1[0] +
        (-p0[0] + p2[0]) * t +
        (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
        (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3
      );
      const lon = 0.5 * (
        2 * p1[1] +
        (-p0[1] + p2[1]) * t +
        (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
        (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3
      );
      result.push([lat, lon]);
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

/**
 * Takes a list of waypoints and generates a realistic-looking curved road path
 * by inserting arc-deflected intermediate control points between each pair,
 * then running Catmull-Rom smoothing over all of them.
 *
 * @param waypoints  – key via-points, e.g. [depot, vehicle, destination]
 * @param arcFactor  – controls how much the route bows perpendicular to the
 *                     direct line (0.06 ≈ subtle, 0.14 ≈ dramatic mountain road)
 * @param resolution – spline resolution per segment (higher = smoother)
 */
function generateRealisticRoute(
  waypoints: [number, number][],
  arcFactor: number = 0.07,
  resolution: number = 16
): [number, number][] {
  if (waypoints.length < 2) return waypoints;

  const enhanced: [number, number][] = [waypoints[0]];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lon1] = waypoints[i];
    const [lat2, lon2] = waypoints[i + 1];

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist === 0) { enhanced.push([lat2, lon2]); continue; }

    // Perpendicular unit vector (rotate 90°)
    const perpLat = -dLon / dist;
    const perpLon =  dLat / dist;

    // Alternating bow direction per segment → natural S-curves across long routes
    const sign = (i % 2 === 0) ? 1 : -0.6;
    const arc = dist * arcFactor;

    // 4 intermediate control points: 25%, 40%, 60%, 75% of segment
    const q25Lat = lat1 + dLat * 0.25 + perpLat * arc * 0.45 * sign;
    const q25Lon = lon1 + dLon * 0.25 + perpLon * arc * 0.45 * sign;

    const q40Lat = lat1 + dLat * 0.40 + perpLat * arc * 0.85 * sign;
    const q40Lon = lon1 + dLon * 0.40 + perpLon * arc * 0.85 * sign;

    const q60Lat = lat1 + dLat * 0.60 + perpLat * arc * 0.85 * sign;
    const q60Lon = lon1 + dLon * 0.60 + perpLon * arc * 0.85 * sign;

    const q75Lat = lat1 + dLat * 0.75 + perpLat * arc * 0.45 * sign;
    const q75Lon = lon1 + dLon * 0.75 + perpLon * arc * 0.45 * sign;

    enhanced.push(
      [q25Lat, q25Lon],
      [q40Lat, q40Lon],
      [q60Lat, q60Lon],
      [q75Lat, q75Lon],
      [lat2, lon2]
    );
  }

  // Run Catmull-Rom spline smoothing over all enhanced control points
  return catmullRomSmooth(enhanced, resolution);
}

// ────────────────────────────────────────────────────────────────────────────

export const ReliefSupplyTrackingModule: React.FC<ReliefSupplyTrackingModuleProps> = ({
  initialTab = 'supplies',
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<'supplies' | 'depots' | 'live-map' | 'driver-portal' | 'operations' | 'smart-alloc'>(initialTab);

  // Sync prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Supply Data States
  const [supplyMetrics, setSupplyMetrics] = useState({
    totalAvailableSupplies: 0,
    criticalShortage: 0,
    suppliesReserved: 0,
    suppliesInTransit: 0,
    deliveredSupplies: 0
  });
  const [suppliesList, setSuppliesList] = useState<ReliefSupplyItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Supply Request Form Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqState, setReqState] = useState<string>('Assam');
  const [reqDistrict, setReqDistrict] = useState<string>('Kamrup Metropolitan');
  const [reqArea, setReqArea] = useState('');
  const [reqDisaster, setReqDisaster] = useState('Flood');
  const [reqItem, setReqItem] = useState('Drinking Water Canisters');
  const [reqQty, setReqQty] = useState(100);
  const [reqPriority, setReqPriority] = useState('High');
  const [reqSubmitMsg, setReqSubmitMsg] = useState<{ success: boolean; text: string } | null>(null);

  // Vehicles Data States
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<ReliefVehicle | null>(null);

  // Depots Data States
  const [depots, setDepots] = useState<ReliefDepot[]>([]);

  // Operations Data States
  const [operations, setOperations] = useState<ReliefOperation[]>([]);

  // Driver Mobile Tracking States
  const [driverVehicleId, setDriverVehicleId] = useState('RT-101');
  const [isDriverTracking, setIsDriverTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [gpsStatusText, setGpsStatusText] = useState('GPS Idle • Click Start Live Tracking to broadcast real location');
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lon: number; accuracy?: number; speed?: number; time: string } | null>(null);
  const [driverGpsError, setDriverGpsError] = useState<string | null>(null);
  const [driverDemoMode, setDriverDemoMode] = useState(true);

  // Convoy Route Simulation States
  const [isSimulatingConvoy, setIsSimulatingConvoy] = useState(false);
  const [convoyStep, setConvoyStep] = useState(0);
  const convoyTimerRef = useRef<any>(null);

  // Authority Route Dispatch & Two-Way Sync States
  const [dispatchDest, setDispatchDest] = useState('Mangaldoi Relief Camp');
  const [dispatchHazard, setDispatchHazard] = useState('Flooding reported on NH-27; rerouted via Narangi - Chandrapur Bypass corridor.');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [dispatchedRouteReceived, setDispatchedRouteReceived] = useState<any>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [routeAlertToast, setRouteAlertToast] = useState<string | null>(null);
  const [isClearingRoute, setIsClearingRoute] = useState(false);

  // Auto-detect current public URL so the QR/link modal always shows the live working link.
  // When the laptop is accessed via Pinggy/Cloudflare tunnel the hostname is the tunnel host.
  // When accessed locally it falls back to the LAN IP:port.
  const driverPortalUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/?tab=driver`
    : 'http://localhost:3000/?tab=driver';

  const localDriverUrl = typeof window !== 'undefined'
    ? `http://${window.location.hostname}:3000/?tab=driver`
    : 'http://localhost:3000/?tab=driver';

  // Smart Allocation States
  const [allocState, setAllocState] = useState('Assam');
  const [allocDistrict, setAllocDistrict] = useState('Darrang');
  const [allocArea, setAllocArea] = useState('Mangaldoi Relief Camp');
  const [allocSupply, setAllocSupply] = useState('Food Grain Packs');
  const [allocQty, setAllocQty] = useState(250);
  const [allocResult, setAllocResult] = useState<SmartAllocationResult | null>(null);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  // Map Container Ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Driver Navigation Map Refs
  const driverMapContainerRef = useRef<HTMLDivElement>(null);
  const driverMapInstanceRef = useRef<L.Map | null>(null);
  const driverMapLayersRef = useRef<L.Layer[]>([]);

  // Initial Data Load
  const loadAllData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [supRes, vehData, depData, opData] = await Promise.all([
        fetchReliefSupplies(),
        fetchReliefVehicles(),
        fetchReliefDepots(),
        fetchReliefOperations()
      ]);
      setSupplyMetrics(supRes.metrics);
      setSuppliesList(supRes.supplies);
      setVehicles(vehData);
      setDepots(depData);
      setOperations(opData);
      if (vehData.length > 0 && !selectedVehicle) {
        setSelectedVehicle(vehData[0]);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to load relief tracking data');
    } finally {
      setLoading(false);
    }
  };

  const playRouteNotificationChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.12);
      osc.frequency.setValueAtTime(1174.66, audioCtx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {}
  };

  useEffect(() => {
    loadAllData();
    const timer = setInterval(() => {
      // Fast soft refresh for vehicle locations & status
      fetchReliefVehicles().then(newVehs => {
        setVehicles(newVehs);
        setSelectedVehicle(prev => {
          if (!prev) return newVehs[0] || null;
          return newVehs.find(v => v.vehicleId === prev.vehicleId) || prev;
        });
      });
      fetchReliefOperations().then(setOperations);
    }, 2500);

    // Immediate initial route check
    fetchVehicleRoute(driverVehicleId).then(res => {
      if (res.hasRoute && res.dispatchedRoute) {
        setDispatchedRouteReceived(res.dispatchedRoute);
      } else {
        setDispatchedRouteReceived(null);
      }
    });

    // Poll for dispatched route to driver device every 2.0s
    const routeTimer = setInterval(async () => {
      const res = await fetchVehicleRoute(driverVehicleId);
      if (res.hasRoute && res.dispatchedRoute) {
        setDispatchedRouteReceived((prev: any) => {
          if (!prev || prev.dispatchedAt !== res.dispatchedRoute.dispatchedAt) {
            playRouteNotificationChime();
            try {
              if ('vibrate' in navigator) navigator.vibrate([300, 150, 300, 150, 400]);
            } catch (e) {}
            const dest = res.dispatchedRoute.destination || 'Designated Relief Camp';
            const eta = res.dispatchedRoute.eta || (res.dispatchedRoute.etaMinutes ? `${res.dispatchedRoute.etaMinutes} mins` : '18 mins');
            setRouteAlertToast(`New safe route assigned to ${dest}! ETA: ${eta}`);
            setTimeout(() => setRouteAlertToast(null), 9000);
            return res.dispatchedRoute;
          }
          return prev;
        });
      } else {
        setDispatchedRouteReceived(null);
      }
    }, 2000);

    // Check URL query param ?tab=driver or ?view=driver
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') || params.get('view');
    if (tabParam === 'driver' || tabParam === 'driver-portal') {
      setActiveTab('driver-portal');
    }

    return () => {
      clearInterval(timer);
      clearInterval(routeTimer);
    };
  }, [driverVehicleId]);

  // Leaflet Map Initialization for Live Tracking Map tab
  useEffect(() => {
    if (activeTab !== 'live-map' || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default center on NER Region (Assam/Meghalaya)
    const map = L.map(mapContainerRef.current, {
      center: [26.1445, 91.7362],
      zoom: 7,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors | Jeevan Setu NER'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update Map Markers & Route Lines when vehicles change or tab switches
  const routeLinesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    if (activeTab !== 'live-map' || !mapInstanceRef.current) return;

    // Clear existing markers & route polylines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    routeLinesRef.current.forEach(l => l.remove());
    routeLinesRef.current = [];

    const map = mapInstanceRef.current;
    const bounds = L.latLngBounds([]);

    vehicles.forEach(v => {
      const vLat = v.currentLatitude !== undefined ? v.currentLatitude : (v.lat !== undefined ? v.lat : 26.1445);
      const vLon = v.currentLongitude !== undefined ? v.currentLongitude : (v.lon !== undefined ? v.lon : 91.7362);
      const sLat = v.sourceLat || 26.1445;
      const sLon = v.sourceLon || 91.7362;
      const dLat = v.destLat || 26.4363;
      const dLon = v.destLon || 92.0345;

      const isConnected = v.trackingStatus === 'GPS_CONNECTED';
      const isStale = v.trackingStatus === 'GPS_STALE';

      const colorClass = isConnected ? 'bg-emerald-500 shadow-emerald-500/50 animate-pulse' : isStale ? 'bg-amber-500' : 'bg-rose-500';
      const statusBadge = isConnected ? '🟢 LIVE GPS CONNECTED' : isStale ? '🟡 LAST KNOWN LOCATION' : '🔴 GPS NOT CONNECTED';

      // 1. Vehicle Marker — glowing pulse ring
      const customVehicleIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div class="relative flex items-center justify-center" style="width:48px;height:48px">
            <span class="absolute inset-0 rounded-full ${isConnected ? 'bg-emerald-400' : isStale ? 'bg-amber-400' : 'bg-rose-400'}" style="opacity:0.18;transform:scale(1);animation:ping 1.4s cubic-bezier(0,0,0.2,1) infinite"></span>
            <span class="absolute inset-1 rounded-full ${isConnected ? 'bg-emerald-500' : isStale ? 'bg-amber-500' : 'bg-rose-500'}" style="opacity:0.25"></span>
            <div class="relative flex items-center justify-center w-10 h-10 rounded-full shadow-2xl font-bold text-base" style="background:${isConnected ? 'linear-gradient(135deg,#064e3b,#065f46)' : isStale ? 'linear-gradient(135deg,#78350f,#92400e)' : 'linear-gradient(135deg,#7f1d1d,#991b1b)'};border:2px solid ${isConnected ? '#34d399' : isStale ? '#fbbf24' : '#f87171'}">
              <span style="font-size:18px">🚚</span>
            </div>
            <span class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-slate-900 ${isConnected ? 'bg-emerald-400' : isStale ? 'bg-amber-400' : 'bg-rose-500'}" style="${isConnected ? 'animation:ping 1s ease-in-out infinite' : ''}"></span>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      });

      const vehicleMarker = L.marker([vLat, vLon], { icon: customVehicleIcon }).addTo(map);

      // 2. Source Depot Marker — styled headquarters icon
      const depotIcon = L.divIcon({
        className: 'custom-depot-marker',
        html: `
          <div style="position:relative;width:36px;height:36px">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#1e1b4b,#312e81);border:2px solid #818cf8;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(99,102,241,0.5)">
              <span style="font-size:16px">🏢</span>
            </div>
            <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:8px;height:8px;background:#818cf8;border-radius:50%;box-shadow:0 0 6px rgba(129,140,248,0.8)"></div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36]
      });
      const depotMarker = L.marker([sLat, sLon], { icon: depotIcon }).addTo(map);
      depotMarker.bindPopup(`<div style="padding:10px;font-family:sans-serif;min-width:180px"><div style="font-weight:800;font-size:13px;color:#818cf8;margin-bottom:4px">🏢 ${v.sourceDepot || 'Regional Relief Depot'}</div><div style="font-size:11px;color:#94a3b8">Supply Origin Point</div></div>`);
      markersRef.current.push(depotMarker);

      // 3. Destination Marker — animated flag pin
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div style="position:relative;width:36px;height:44px">
            <div style="width:36px;height:36px;background:linear-gradient(135deg,#4c0519,#881337);border:2px solid #fb7185;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(251,113,133,0.6)">
              <span style="font-size:17px">🏁</span>
            </div>
            <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:3px;height:10px;background:linear-gradient(to bottom,#fb7185,transparent)"></div>
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44]
      });
      const destMarker = L.marker([dLat, dLon], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`<div style="padding:10px;font-family:sans-serif;min-width:180px"><div style="font-weight:800;font-size:13px;color:#fb7185;margin-bottom:4px">🏁 ${v.destination}</div><div style="font-size:11px;color:#94a3b8">Relief Destination</div></div>`);
      markersRef.current.push(destMarker);

      // 4. Beautiful multi-layer CURVED route line: shadow → glow → core → animated dash
      const routeColor = isConnected ? '#10b981' : isStale ? '#f59e0b' : '#38bdf8';
      const routeGlow  = isConnected ? '#34d399' : isStale ? '#fcd34d' : '#7dd3fc';
      const routeShadow= isConnected ? '#052e16' : isStale ? '#451a03' : '#082f49';

      // Generate realistic curved path through depot → vehicle → destination
      const fullCurvedPath = generateRealisticRoute(
        [[sLat, sLon], [vLat, vLon], [dLat, dLon]],
        0.08  // arc factor: ~8% perpendicular bow per segment
      );

      // Layer 1: wide dark shadow
      const shadowLine = L.polyline(fullCurvedPath, {
        color: routeShadow,
        weight: 14,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLinesRef.current.push(shadowLine);

      // Layer 2: wide glow
      const glowLine = L.polyline(fullCurvedPath, {
        color: routeGlow,
        weight: 9,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLinesRef.current.push(glowLine);

      // Layer 3: solid bright core
      const coreLine = L.polyline(fullCurvedPath, {
        color: routeColor,
        weight: 4,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLinesRef.current.push(coreLine);

      // Layer 4: white animated dash overlay
      const dashLine = L.polyline(fullCurvedPath, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.6,
        dashArray: '4, 16',
        dashOffset: '0',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      routeLinesRef.current.push(dashLine);

      // Progress segment: depot → current vehicle position (completed portion — also curved)
      if (isConnected) {
        const progressPath = generateRealisticRoute([[sLat, sLon], [vLat, vLon]], 0.08);
        const progressLine = L.polyline(progressPath, {
          color: '#ffffff',
          weight: 3,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map);
        routeLinesRef.current.push(progressLine);
      }

      const popupContent = `
        <div class="p-3 font-sans min-w-[250px]">
          <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
            <span class="font-extrabold text-sm text-slate-100">${v.vehicleId} • ${v.vehicleType}</span>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : isStale ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-rose-950 text-rose-300 border border-rose-700'}">${statusBadge}</span>
          </div>
          <p class="text-xs text-slate-300 mb-1"><strong>Driver:</strong> ${v.driverName} (${v.contact})</p>
          <p class="text-xs text-slate-300 mb-1"><strong>State:</strong> ${v.state}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>Current Position:</strong> ${v.currentLocationName}</p>
          <p class="text-xs text-slate-300 mb-1"><strong>Route Path:</strong> ${v.sourceDepot || 'Depot'} &rarr; ${v.destination}</p>
          <div class="grid grid-cols-2 gap-1 text-[11px] bg-slate-800 p-2 rounded mt-2 text-slate-300">
            <div>Speed: <strong class="text-emerald-400">${v.speed || 0} km/h</strong></div>
            <div>Accuracy: <strong class="text-cyan-400">±${v.accuracy || 4}m</strong></div>
          </div>
          <div class="text-[10px] text-slate-400 mt-2">
            Last update: ${v.lastLocationUpdate ? new Date(v.lastLocationUpdate).toLocaleTimeString() : 'Live Synced'}
          </div>
        </div>
      `;

      vehicleMarker.bindPopup(popupContent);
      vehicleMarker.on('click', () => setSelectedVehicle(v));
      markersRef.current.push(vehicleMarker);

      bounds.extend([sLat, sLon]);
      bounds.extend([vLat, vLon]);
      bounds.extend([dLat, dLon]);
    });

    if (vehicles.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [vehicles, activeTab]);

  // Driver Navigation Map Initialization
  useEffect(() => {
    if (activeTab !== 'driver-portal' || !driverMapContainerRef.current) return;

    if (driverMapInstanceRef.current) {
      driverMapInstanceRef.current.remove();
      driverMapInstanceRef.current = null;
    }

    const curLat = driverLocation?.lat || 26.5494;
    const curLon = driverLocation?.lon || 80.2274;

    const map = L.map(driverMapContainerRef.current, {
      center: [curLat, curLon],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap | Jeevan Setu Driver HUD'
    }).addTo(map);

    driverMapInstanceRef.current = map;

    // Invalidate size once rendered
    setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 300);

    return () => {
      if (driverMapInstanceRef.current) {
        driverMapInstanceRef.current.remove();
        driverMapInstanceRef.current = null;
      }
    };
  }, [activeTab]);

  // Update Driver Navigation Map Layers (GPS marker, detour corridor, hazard circle, destination)
  useEffect(() => {
    if (activeTab !== 'driver-portal' || !driverMapInstanceRef.current) return;

    const map = driverMapInstanceRef.current;
    driverMapLayersRef.current.forEach(layer => layer.remove());
    driverMapLayersRef.current = [];

    const bounds = L.latLngBounds([]);

    // 1. Current Driver Location Marker - ONLY render if driver has active GPS signal
    let curLat: number | null = null;
    let curLon: number | null = null;

    if (driverLocation?.lat !== undefined && driverLocation?.lon !== undefined) {
      curLat = driverLocation.lat;
      curLon = driverLocation.lon;

      // Outer pulse ring (large soft glow)
      const pulseRing = L.circle([curLat, curLon], {
        radius: Math.max(driverLocation.accuracy || 40, 40),
        color: '#10b981',
        weight: 0,
        fillColor: '#10b981',
        fillOpacity: 0.12
      }).addTo(map);
      driverMapLayersRef.current.push(pulseRing);

      // Accuracy precision ring
      if (driverLocation?.accuracy) {
        const accCircle = L.circle([curLat, curLon], {
          radius: Math.min(driverLocation.accuracy, 200),
          color: '#34d399',
          weight: 2,
          dashArray: '4, 6',
          fillColor: '#10b981',
          fillOpacity: 0.08
        }).addTo(map);
        driverMapLayersRef.current.push(accCircle);
      }

      // Premium driver truck marker
      const driverIcon = L.divIcon({
        className: 'driver-live-gps-marker',
        html: `
          <div style="position:relative;width:52px;height:60px;display:flex;flex-direction:column;align-items:center">
            <div style="position:relative;width:52px;height:52px">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(16,185,129,0.2);animation:ping 1.2s ease-in-out infinite"></div>
              <div style="position:absolute;inset:4px;border-radius:50%;background:rgba(52,211,153,0.15)"></div>
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(145deg,#064e3b,#065f46);border:2.5px solid #34d399;box-shadow:0 0 20px rgba(52,211,153,0.7),0 4px 15px rgba(0,0,0,0.5)">
                <span style="font-size:22px;filter:drop-shadow(0 0 4px rgba(52,211,153,0.9))">🚚</span>
              </div>
              <div style="position:absolute;top:1px;right:1px;width:14px;height:14px;background:#10b981;border-radius:50%;border:2px solid #064e3b;box-shadow:0 0 8px rgba(16,185,129,0.9)"></div>
            </div>
            <div style="width:3px;height:8px;background:linear-gradient(to bottom,#34d399,transparent);margin-top:-1px"></div>
          </div>
        `,
        iconSize: [52, 60],
        iconAnchor: [26, 58]
      });

      const driverMarker = L.marker([curLat, curLon], { icon: driverIcon }).addTo(map);
      driverMarker.bindPopup(`
        <div style="padding:12px;font-family:sans-serif;min-width:200px;background:#0f172a;border-radius:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:20px">🚚</span>
            <div>
              <div style="font-weight:800;font-size:13px;color:#f1f5f9">${driverVehicleId}</div>
              <div style="font-size:10px;color:#34d399;font-weight:700">● LIVE GPS ACTIVE</div>
            </div>
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:8px;font-size:11px;color:#94a3b8">
            <div style="margin-bottom:3px">Accuracy: <strong style="color:#34d399">±${driverLocation?.accuracy?.toFixed(0) || 15}m</strong></div>
            <div style="font-family:monospace;font-size:10px;color:#64748b">${curLat.toFixed(5)}, ${curLon.toFixed(5)}</div>
          </div>
        </div>
      `);
      driverMapLayersRef.current.push(driverMarker);
      bounds.extend([curLat, curLon]);
    }

    // 2. Dispatched Route Rendering — ONLY IF HQ PUSHED ROUTE!
    if (dispatchedRouteReceived) {
      const startLat = curLat !== null ? curLat : (Number(dispatchedRouteReceived.startLat) || 26.1445);
      const startLon = curLon !== null ? curLon : (Number(dispatchedRouteReceived.startLon) || 91.7362);

      const destLat = Number(dispatchedRouteReceived.destLat) || (startLat + 0.04);
      const destLon = Number(dispatchedRouteReceived.destLon) || (startLon + 0.05);

      // ── Step 1: Build raw key via-points for the detour ──
      let rawWaypoints: [number, number][] = [];
      if (dispatchedRouteReceived.routePolyline && dispatchedRouteReceived.routePolyline.length >= 2) {
        rawWaypoints = dispatchedRouteReceived.routePolyline;
      } else {
        const midLat = (startLat + destLat) / 2;
        const midLon = (startLon + destLon) / 2;
        const detourLat = midLat + 0.012;
        const detourLon = midLon - 0.018;
        rawWaypoints = [
          [startLat, startLon],
          [startLat + (detourLat - startLat) * 0.45, startLon + (detourLon - startLon) * 0.45],
          [detourLat, detourLon],
          [detourLat + (destLat - detourLat) * 0.55, detourLon + (destLon - detourLon) * 0.55],
          [destLat, destLon]
        ];
      }

      // ── Step 2: Run through Catmull-Rom + arc deflection → smooth curved road path ──
      const corridorWaypoints = generateRealisticRoute(rawWaypoints, 0.09, 18);

      corridorWaypoints.forEach(pt => bounds.extend(pt));

      // ── Layer 1: deep dark shadow/halo underneath ──
      const shadowPolyline = L.polyline(corridorWaypoints, {
        color: '#022c22',
        weight: 22,
        opacity: 0.55,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      driverMapLayersRef.current.push(shadowPolyline);

      // ── Layer 2: wide emerald outer glow ──
      const outerGlow = L.polyline(corridorWaypoints, {
        color: '#34d399',
        weight: 16,
        opacity: 0.18,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      driverMapLayersRef.current.push(outerGlow);

      // ── Layer 3: medium cyan glow ──
      const midGlow = L.polyline(corridorWaypoints, {
        color: '#6ee7b7',
        weight: 10,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      driverMapLayersRef.current.push(midGlow);

      // ── Layer 4: bright solid core ──
      const corePolyline = L.polyline(corridorWaypoints, {
        color: '#10b981',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      driverMapLayersRef.current.push(corePolyline);

      // ── Layer 5: white racing stripe / dash overlay ──
      const dashPolyline = L.polyline(corridorWaypoints, {
        color: '#ffffff',
        weight: 2,
        opacity: 0.65,
        dashArray: '1, 10',
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      driverMapLayersRef.current.push(dashPolyline);

      // ── Waypoint node markers along route ──
      corridorWaypoints.slice(1, -1).forEach((pt, idx) => {
        const nodeIcon = L.divIcon({
          className: '',
          html: `<div style="width:10px;height:10px;border-radius:50%;background:#10b981;border:2px solid #ffffff;box-shadow:0 0 8px rgba(16,185,129,0.9)"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        });
        const nodeMarker = L.marker(pt, { icon: nodeIcon }).addTo(map);
        driverMapLayersRef.current.push(nodeMarker);
      });

      // ── Hazard Exclusion Zone — gorgeous biohazard ring ──
      const hazardLat = corridorWaypoints[Math.floor(corridorWaypoints.length / 2)][0];
      const hazardLon = corridorWaypoints[Math.floor(corridorWaypoints.length / 2)][1];
      const hazardActualLat = (startLat + destLat) / 2;
      const hazardActualLon = (startLon + destLon) / 2;

      // Outer warning ring
      const hazardOuterRing = L.circle([hazardActualLat, hazardActualLon], {
        radius: 1100,
        color: '#f43f5e',
        weight: 0,
        fillColor: '#f43f5e',
        fillOpacity: 0.06
      }).addTo(map);
      driverMapLayersRef.current.push(hazardOuterRing);

      // Main hazard zone
      const hazardCircle = L.circle([hazardActualLat, hazardActualLon], {
        radius: 650,
        color: '#f43f5e',
        weight: 3,
        dashArray: '8, 5',
        fillColor: '#f43f5e',
        fillOpacity: 0.2
      }).addTo(map);

      // Hazard inner ring
      const hazardInnerRing = L.circle([hazardActualLat, hazardActualLon], {
        radius: 280,
        color: '#fb7185',
        weight: 2,
        fillColor: '#fb7185',
        fillOpacity: 0.35
      }).addTo(map);
      driverMapLayersRef.current.push(hazardInnerRing);

      // Hazard zone icon marker
      const hazardIcon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center">
            <div style="width:40px;height:40px;background:linear-gradient(135deg,#4c0519,#9f1239);border:2.5px solid #f43f5e;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 18px rgba(244,63,94,0.7),0 0 35px rgba(244,63,94,0.3)">
              <span style="font-size:19px">⚠️</span>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      const hazardMarker = L.marker([hazardActualLat, hazardActualLon], { icon: hazardIcon }).addTo(map);
      hazardCircle.bindPopup(`
        <div style="padding:12px;font-family:sans-serif;min-width:200px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:18px">⚠️</span>
            <span style="font-weight:800;font-size:12px;color:#f43f5e">HAZARD SECTOR — BYPASS ACTIVE</span>
          </div>
          <p style="font-size:11px;color:#475569;margin:0">${dispatchedRouteReceived.hazardWarning || 'Severe Waterlogging / Road Damage Reported'}</p>
          <div style="margin-top:8px;padding:6px 8px;background:#fff1f2;border-radius:6px;font-size:10px;color:#9f1239;font-weight:700">🔴 ROAD CLOSED — HQ ROUTED YOU AROUND THIS SECTOR</div>
        </div>
      `);
      driverMapLayersRef.current.push(hazardCircle);
      driverMapLayersRef.current.push(hazardMarker);
      bounds.extend([hazardActualLat, hazardActualLon]);

      // ── Destination Marker — premium animated beacon ──
      const destIcon = L.divIcon({
        className: 'dest-pin-marker',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:54px">
            <div style="position:relative;width:52px;height:52px">
              <div style="position:absolute;inset:0;border-radius:50%;background:rgba(99,102,241,0.25);animation:ping 1.5s ease-in-out infinite"></div>
              <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:linear-gradient(145deg,#1e1b4b,#312e81);border:2.5px solid #818cf8;box-shadow:0 0 22px rgba(99,102,241,0.7),0 4px 15px rgba(0,0,0,0.6)">
                <span style="font-size:22px;filter:drop-shadow(0 0 5px rgba(129,140,248,1))">🏁</span>
              </div>
            </div>
            <div style="width:3px;height:10px;background:linear-gradient(to bottom,#818cf8,transparent)"></div>
          </div>
        `,
        iconSize: [54, 62],
        iconAnchor: [27, 62]
      });

      const destMarker = L.marker([destLat, destLon], { icon: destIcon }).addTo(map);
      destMarker.bindPopup(`
        <div style="padding:12px;font-family:sans-serif;min-width:210px;background:#0f172a;border-radius:10px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:20px">🏁</span>
            <div>
              <div style="font-weight:800;font-size:13px;color:#e0e7ff">${dispatchedRouteReceived.destination || 'Relief Camp'}</div>
              <div style="font-size:10px;color:#818cf8;font-weight:700">TARGET DESTINATION</div>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div style="background:#1e293b;border-radius:6px;padding:7px;text-align:center">
              <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:2px">ETA</div>
              <div style="font-size:13px;font-weight:800;color:#34d399">${dispatchedRouteReceived.eta || '18 mins'}</div>
            </div>
            <div style="background:#1e293b;border-radius:6px;padding:7px;text-align:center">
              <div style="font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:2px">Distance</div>
              <div style="font-size:13px;font-weight:800;color:#38bdf8">${dispatchedRouteReceived.distance || '26.4 km'}</div>
            </div>
          </div>
        </div>
      `);
      driverMapLayersRef.current.push(destMarker);
      bounds.extend([destLat, destLon]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } else if (curLat !== null && curLon !== null) {
      map.setView([curLat, curLon], 14);
    }
  }, [activeTab, driverLocation, dispatchedRouteReceived, driverVehicleId]);

  const handleCenterDriverMap = () => {
    if (!driverMapInstanceRef.current) return;
    if (driverLocation?.lat !== undefined && driverLocation?.lon !== undefined) {
      driverMapInstanceRef.current.setView([driverLocation.lat, driverLocation.lon], 15, { animate: true });
    } else if (dispatchedRouteReceived?.destLat && dispatchedRouteReceived?.destLon) {
      driverMapInstanceRef.current.setView([dispatchedRouteReceived.destLat, dispatchedRouteReceived.destLon], 14, { animate: true });
    } else {
      driverMapInstanceRef.current.setView([26.1445, 91.7362], 12, { animate: true });
    }
  };

  const handleToggleDriverTracking = () => {
    if (isDriverTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsDriverTracking(false);
      setGpsStatusText('GPS Tracking Stopped');
      setDriverGpsError(null);
    } else {
      setDriverGpsError(null);
      setGpsStatusText('Acquiring real device GPS signal...');

      const id = watchDeviceGPS(
        driverVehicleId,
        (pos) => {
          setDriverLocation({
            lat: pos.lat,
            lon: pos.lon,
            accuracy: pos.accuracy,
            speed: pos.speed,
            time: new Date().toLocaleTimeString()
          });
          setGpsStatusText(pos.statusText);
          // Clear any previous send-error once GPS updates keep flowing
          setDriverGpsError(null);
          // Refresh list to update vehicle tracking status
          fetchReliefVehicles().then(setVehicles);
        },
        (errText) => {
          // Real GPS hardware/permission error — stop tracking
          setDriverGpsError(errText);
          setIsDriverTracking(false);
        },
        driverDemoMode,
        (sendErrText) => {
          // Non-fatal network send error — show warning but KEEP GPS alive
          setDriverGpsError(`⚠️ Sync: ${sendErrText} (GPS still active — retrying...)`);
          // Auto-dismiss after 4 seconds so it doesn't block the UI
          setTimeout(() => setDriverGpsError(null), 4000);
        }
      );

      if (id !== null) {
        setWatchId(id);
        setIsDriverTracking(true);
      }
    }
  };

  // Highway simulation route for RT-101 (Guwahati Regional Depot -> Mangaldoi Camp)
  const SIMULATION_ROUTE = [
    { lat: 26.1445, lon: 91.7362, speed: 0, locationName: 'Guwahati Regional Relief Depot (Origin Staging Hub)' },
    { lat: 26.1850, lon: 91.7850, speed: 38, locationName: 'Noonmati - Narangi Bypass, Kamrup Metro' },
    { lat: 26.2200, lon: 91.8350, speed: 45, locationName: 'Chandrapur Highway Corridor, NH-27' },
    { lat: 26.2650, lon: 91.8820, speed: 52, locationName: 'Brahmaputra River Transit Bridge Link' },
    { lat: 26.3150, lon: 91.9300, speed: 44, locationName: 'Sipajhar Outpost Highway Stretch' },
    { lat: 26.3800, lon: 91.9900, speed: 41, locationName: 'Patharighat Flood Relief Access Corridor' },
    { lat: 26.4363, lon: 92.0345, speed: 0, locationName: 'Mangaldoi Relief Camp (Destination Verified Relief Arrived)' }
  ];

  const handleStartConvoySimulation = () => {
    if (isSimulatingConvoy) {
      if (convoyTimerRef.current) clearInterval(convoyTimerRef.current);
      setIsSimulatingConvoy(false);
      return;
    }

    setIsSimulatingConvoy(true);
    let step = convoyStep >= SIMULATION_ROUTE.length - 1 ? 0 : convoyStep;

    convoyTimerRef.current = setInterval(async () => {
      step = (step + 1) % SIMULATION_ROUTE.length;
      setConvoyStep(step);
      const curPoint = SIMULATION_ROUTE[step];

      setVehicles(prev => prev.map(v => {
        if (v.vehicleId === 'RT-101') {
          return {
            ...v,
            lat: curPoint.lat,
            lon: curPoint.lon,
            currentLatitude: curPoint.lat,
            currentLongitude: curPoint.lon,
            speed: curPoint.speed,
            currentLocationName: curPoint.locationName,
            trackingStatus: 'GPS_CONNECTED',
            lastLocationUpdate: new Date().toISOString()
          };
        }
        return v;
      }));

      await sendVehicleGPSLocation({
        vehicleId: 'RT-101',
        lat: curPoint.lat,
        lon: curPoint.lon,
        speed: curPoint.speed,
        accuracy: 3.5,
        demoMode: true
      });

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo([curPoint.lat, curPoint.lon], { animate: true });
      }

      if (step === SIMULATION_ROUTE.length - 1) {
        clearInterval(convoyTimerRef.current);
        setIsSimulatingConvoy(false);
      }
    }, 2800);
  };

  const handleResetConvoySimulation = async () => {
    if (convoyTimerRef.current) clearInterval(convoyTimerRef.current);
    setIsSimulatingConvoy(false);
    setConvoyStep(0);
    const origin = SIMULATION_ROUTE[0];
    setVehicles(prev => prev.map(v => {
      if (v.vehicleId === 'RT-101') {
        return {
          ...v,
          lat: origin.lat,
          lon: origin.lon,
          currentLatitude: origin.lat,
          currentLongitude: origin.lon,
          speed: 0,
          currentLocationName: origin.locationName,
          trackingStatus: 'GPS_CONNECTED',
          lastLocationUpdate: new Date().toISOString()
        };
      }
      return v;
    }));
    await sendVehicleGPSLocation({
      vehicleId: 'RT-101',
      lat: origin.lat,
      lon: origin.lon,
      speed: 0,
      accuracy: 3.5,
      demoMode: true
    });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([origin.lat, origin.lon], 8);
    }
  };

  useEffect(() => {
    return () => {
      if (convoyTimerRef.current) clearInterval(convoyTimerRef.current);
    };
  }, []);

  // Authority Dispatches Safe Route to Driver Phone
  const handleAuthorityDispatchRoute = async () => {
    const targetVeh = selectedVehicle || vehicles[0];
    if (!targetVeh) return;

    setIsDispatching(true);
    setDispatchSuccess(null);

    const vLat = targetVeh.lat || targetVeh.currentLatitude || 26.1445;
    const vLon = targetVeh.lon || targetVeh.currentLongitude || 91.7362;

    const isSohra = dispatchDest.includes('Sohra');
    const isTezpur = dispatchDest.includes('Tezpur');
    const isBarpeta = dispatchDest.includes('Barpeta');

    // Check if vehicle is in a demo location (e.g. outside NE lon ~88-97)
    const isOutsideNER = vLon < 88.0 || vLon > 97.5;

    let destLat = isSohra ? 25.27 : isTezpur ? 26.63 : 26.4363;
    let destLon = isSohra ? 91.73 : isTezpur ? 92.80 : 92.0345;
    let distKm = isSohra ? 48.5 : isTezpur ? 62.0 : isBarpeta ? 38.2 : 26.4;
    let etaMins = isSohra ? 45 : isTezpur ? 58 : isBarpeta ? 32 : 18;

    if (isOutsideNER && !isSohra && !isTezpur && !isBarpeta) {
      // Create a realistic local demonstration corridor around the vehicle's actual location
      destLat = Number((vLat + 0.035).toFixed(5));
      destLon = Number((vLon + 0.042).toFixed(5));
      distKm = 6.2;
      etaMins = 14;
    }

    // Dynamic safe detour corridor avoiding direct line midpoint
    const midLat = (vLat + destLat) / 2;
    const midLon = (vLon + destLon) / 2;
    const detourLat = midLat + 0.012;
    const detourLon = midLon - 0.018;

    const routePolyline: [number, number][] = [
      [vLat, vLon],
      [Number((vLat + (detourLat - vLat) * 0.45).toFixed(5)), Number((vLon + (detourLon - vLon) * 0.45).toFixed(5))],
      [Number(detourLat.toFixed(5)), Number(detourLon.toFixed(5))],
      [Number((detourLat + (destLat - detourLat) * 0.55).toFixed(5)), Number((detourLon + (destLon - detourLon) * 0.55).toFixed(5))],
      [destLat, destLon]
    ];

    const res = await dispatchVehicleRoute({
      vehicleId: targetVeh.vehicleId,
      destination: dispatchDest,
      destLat,
      destLon,
      routePolyline,
      distanceKm: distKm,
      etaMinutes: etaMins,
      hazardWarning: dispatchHazard,
      notes: 'Safe Bypass corridor authorized by MDoNER Logistics Command.'
    });

    setIsDispatching(false);
    if (res.success) {
      setDispatchSuccess(`Safe route dispatched to ${targetVeh.vehicleId}! Sent to driver's phone screen.`);
      setTimeout(() => setDispatchSuccess(null), 5000);
      fetchReliefVehicles().then(setVehicles);
    }
  };

  // Authority Clears Route (Reset back to clean standby)
  const handleAuthorityClearRoute = async () => {
    const targetVeh = selectedVehicle || vehicles[0];
    if (!targetVeh) return;

    setIsClearingRoute(true);
    const ok = await clearVehicleRoute(targetVeh.vehicleId);
    setIsClearingRoute(false);
    if (ok) {
      setDispatchedRouteReceived(null);
      setDispatchSuccess(`Route cleared for ${targetVeh.vehicleId}. Phone returned to clean standby.`);
      setTimeout(() => setDispatchSuccess(null), 4000);
      fetchReliefVehicles().then(setVehicles);
    }
  };

  // Submit New Relief Supply Request Handler
  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSubmitMsg(null);
    const res = await createSupplyRequest({
      state: reqState,
      district: reqDistrict,
      affectedArea: reqArea,
      disasterType: reqDisaster,
      item: reqItem,
      requiredQuantity: reqQty,
      priority: reqPriority
    });

    if (res.success) {
      setReqSubmitMsg({ success: true, text: 'Relief request submitted & saved to database successfully!' });
      setTimeout(() => {
        setShowRequestModal(false);
        setReqSubmitMsg(null);
        setReqArea('');
        loadAllData();
      }, 1500);
    } else {
      setReqSubmitMsg({ success: false, text: res.message });
    }
  };

  // Calculate Smart Allocation Handler
  const handleRunSmartAllocation = async () => {
    setAllocLoading(true);
    setAllocError(null);
    setAllocResult(null);

    const res = await getSmartAllocation({
      state: allocState,
      district: allocDistrict,
      affectedArea: allocArea,
      requiredSupply: allocSupply,
      requiredQuantity: allocQty
    });

    if (res.success && res.allocation) {
      setAllocResult(res.allocation);
    } else {
      setAllocError(res.error || 'Failed to match optimal allocation');
    }
    setAllocLoading(false);
  };

  // Filtered Supplies with smart category mapping
  const categories = ['ALL', 'Food', 'Drinking Water', 'Medical Kits', 'Shelter Tarps', 'Hygiene Kits', 'Warm Clothes', 'Heavy Rescue Tools'];
  const filteredSupplies = suppliesList.filter(s => {
    if (selectedCategory === 'ALL') return true;
    if (s.category === selectedCategory) return true;
    const catStr = String(s.category);
    if (selectedCategory === 'Medical Kits' && (catStr === 'Medicines' || catStr === 'Medical Equipment')) return true;
    if (selectedCategory === 'Warm Clothes' && catStr === 'Blankets') return true;
    if (selectedCategory === 'Hygiene Kits' && catStr === 'Emergency Kits') return true;
    if (selectedCategory === 'Heavy Rescue Tools' && catStr === 'Rescue Equipment') return true;
    if (selectedCategory === 'Shelter Tarps' && (catStr === 'Shelter' || s.item?.toLowerCase().includes('tarp'))) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans p-4 md:p-6 pb-20">
      {/* FLOATING AUDIO/VISUAL ROUTE ALERT TOAST */}
      {routeAlertToast && (
        <div className="fixed top-4 left-4 right-4 z-[99999] max-w-lg mx-auto p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl shadow-2xl border-2 border-white/90 flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/20 rounded-xl shrink-0">
              <Navigation className="w-6 h-6 text-white" />
            </span>
            <div>
              <strong className="block text-xs font-black uppercase tracking-wider text-emerald-100">
                🚨 NEW SAFE ROUTE ASSIGNED BY HQ!
              </strong>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">
                {routeAlertToast}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRouteAlertToast(null)}
            className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-white text-xs font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Banner */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-md">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Truck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  REAL-TIME RELIEF SUPPLY & VEHICLE TRACKING
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50 uppercase tracking-widest">
                    LIVE REGIONAL SYSTEM
                  </span>
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Strictly Restricted to North-Eastern Region — 8 States (Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/20 dark:shadow-emerald-900/30 transition"
            >
              <Plus className="w-4 h-4" />
              New Supply Request
            </button>
            {onNavigateHome && (
              <button
                onClick={onNavigateHome}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Sub-Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">

          {/* ── PRIMARY: GPS & Live Tracking ── */}
          <button
            onClick={() => setActiveTab('live-map')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ring-2 ${
              activeTab === 'live-map'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-emerald-400'
                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-700/60 ring-emerald-900/0 hover:ring-emerald-700/40'
            }`}
          >
            <Radio className="w-4 h-4 animate-pulse" />
            🗺️ Live Vehicle Tracking
          </button>

          <button
            onClick={() => setActiveTab('driver-portal')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap ring-2 ${
              activeTab === 'driver-portal'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-amber-300'
                : 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50 border border-amber-700/60 ring-amber-900/0 hover:ring-amber-700/40'
            }`}
          >
            <Compass className="w-4 h-4" />
            📱 Driver GPS Portal
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition whitespace-nowrap bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/50 cursor-pointer"
          >
            <QrCode className="w-4 h-4 animate-pulse" />
            🔗 Connect Phone
          </button>

          {/* ── Divider ── */}
          <div className="h-7 w-px bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

          {/* ── SECONDARY: Monitoring & Admin ── */}
          <button
            onClick={() => setActiveTab('supplies')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'supplies'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Supply Monitoring
          </button>

          <button
            onClick={() => setActiveTab('depots')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'depots'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            Depots & Stock
          </button>

          <button
            onClick={() => setActiveTab('operations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'operations'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Active Operations
          </button>

          <button
            onClick={() => setActiveTab('smart-alloc')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'smart-alloc'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/20 dark:shadow-indigo-950'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Smart Allocation
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="max-w-7xl mx-auto mb-6 p-4 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-MODULE 1: RELIEF SUPPLY MONITORING */}
      {activeTab === 'supplies' && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 5 Live Database-Driven Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Total Available Supplies</span>
                <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {supplyMetrics.totalAvailableSupplies.toLocaleString()} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Units</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Across 8 NER Depots</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Critical Shortage Items</span>
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
                {supplyMetrics.criticalShortage} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Categories</span>
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">Needs Immediate Replenishment</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Supplies Reserved</span>
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
                {supplyMetrics.suppliesReserved.toLocaleString()} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Units</span>
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-semibold">Staged for Dispatch</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Supplies In Transit</span>
                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
                {supplyMetrics.suppliesInTransit} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Convoys</span>
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">En Route to Disaster Zones</div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-500 dark:text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Delivered Supplies</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {supplyMetrics.deliveredSupplies} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Operations</span>
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Verified Relief Reached</div>
            </div>
          </div>

          {/* Supply Category Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-2">Filter Category:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Live Inventory Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Live Regional Relief Inventory Table
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Showing {filteredSupplies.length} items</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Supply ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-4">Available Stock</th>
                    <th className="py-3 px-4">Reserved</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Depot Location</th>
                    <th className="py-3 px-4">Last Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredSupplies.map(sup => (
                    <tr key={sup.supplyId} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-200">{sup.supplyId}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px]">
                          {sup.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{sup.item}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {sup.availableQuantity.toLocaleString()} {sup.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-600 dark:text-amber-400">
                        {sup.reservedQuantity.toLocaleString()} {sup.unit}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          sup.status === 'In Stock'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                            : sup.status === 'Low Stock'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : sup.status === 'Critical'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        }`}>
                          {sup.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{sup.location}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(sup.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                  {filteredSupplies.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        No relief supplies matched the selected category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 2: RELIEF DEPOTS */}
      {activeTab === 'depots' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {depots.map(depot => {
              const utilPct = Math.round((depot.currentStock / depot.capacity) * 100);
              return (
                <div key={depot.depotId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {depot.depotId}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{depot.depotName}</h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          {depot.district}, {depot.state}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase ${
                        depot.status === 'OPERATIONAL'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                          : depot.status === 'FULL'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                      }`}>
                        {depot.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Storage Capacity Utilization</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono">{utilPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/50">
                        <div
                          className={`h-full transition-all duration-500 ${
                            utilPct > 90 ? 'bg-amber-500' : utilPct < 20 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${utilPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Total Capacity</span>
                        <strong className="text-slate-800 dark:text-slate-200 font-mono">{depot.capacity.toLocaleString()} Tons</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Current Stock</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{depot.currentStock.toLocaleString()} Tons</strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">Enrolled under State Emergency Relief Hub</span>
                    <button
                      onClick={() => {
                        setActiveTab('smart-alloc');
                        setAllocState(depot.state);
                        setAllocDistrict(depot.district);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                    >
                      Allocate Supplies <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-MODULE 3: LIVE VEHICLE TRACKING MAP */}
      {activeTab === 'live-map' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Column */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
                  <h2 className="text-xs font-extrabold uppercase text-slate-900 dark:text-white tracking-wider">
                    NER Fleet Live GPS Telemetry Stream Map
                  </h2>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span> Live GPS Connected</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400"></span> Stale (&gt;30s)</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 dark:bg-rose-400"></span> GPS Not Connected</span>
                </div>
              </div>

              {/* Prototype Convoy Simulation Interactive Bar */}
              <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${isSimulatingConvoy ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`}></span>
                    Convoy Demo (RT-101):
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px] truncate max-w-[280px]">
                    {SIMULATION_ROUTE[convoyStep]?.locationName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartConvoySimulation}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer ${
                      isSimulatingConvoy
                        ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {isSimulatingConvoy ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isSimulatingConvoy ? 'Pause Simulation' : convoyStep > 0 && convoyStep < SIMULATION_ROUTE.length - 1 ? 'Resume Simulation' : '▶ Run Live Convoy Simulation'}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetConvoySimulation}
                    className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* Leaflet Map Canvas */}
              <div ref={mapContainerRef} className="flex-1 w-full h-full z-0"></div>
            </div>

            {/* Vehicle Details Side Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between h-[560px] overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span>Vehicles List ({vehicles.length})</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Real-Time Sensor Sync</span>
                </h3>

                <div className="space-y-3">
                  {vehicles.map(veh => {
                    const isSelected = selectedVehicle?.vehicleId === veh.vehicleId;
                    const isConnected = veh.trackingStatus === 'GPS_CONNECTED';
                    const isStale = veh.trackingStatus === 'GPS_STALE';

                    return (
                      <div
                        key={veh.vehicleId}
                        onClick={() => setSelectedVehicle(veh)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 dark:bg-slate-800 border-emerald-500/80 shadow-md'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Truck className={`w-4 h-4 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{veh.vehicleId}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isConnected
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                              : isStale
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                              : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                          }`}>
                            {isConnected ? 'GPS CONNECTED' : isStale ? 'GPS STALE' : 'GPS NOT CONNECTED'}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                          <p>Driver: <strong className="text-slate-900 dark:text-slate-200">{veh.driverName}</strong> ({veh.contact})</p>
                          <p>Route: <span className="text-slate-500 dark:text-slate-400">{veh.currentLocationName} &rarr; {veh.destination}</span></p>
                        </div>

                        {veh.lat != null && veh.lon != null ? (
                          <div className="mt-2 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 flex items-center justify-between bg-slate-100 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                            <span>Lat: {veh.lat.toFixed(4)}, Lon: {veh.lon.toFixed(4)}</span>
                            <span>Speed: {veh.speed || 0} km/h</span>
                          </div>
                        ) : (
                          <div className="mt-2 text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded border border-rose-200 dark:border-rose-900/50">
                            GPS NOT CONNECTED • Waiting for driver mobile transmission
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authority Safe Route Dispatch Panel */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Authority Route Dispatch:</span>
                    </span>
                    <span className="text-[10px] font-mono text-indigo-400 font-bold">
                      Target: {selectedVehicle?.vehicleId || 'RT-101'}
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Assigned Relief Destination:
                    </label>
                    <select
                      value={dispatchDest}
                      onChange={e => setDispatchDest(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none"
                    >
                      <option value="Mangaldoi Relief Camp">Mangaldoi Relief Camp (Darrang, Assam)</option>
                      <option value="Barpeta Emergency Medical Hub">Barpeta Emergency Medical Hub (Assam)</option>
                      <option value="Sohra Mountain Pass, Meghalaya">Sohra Mountain Pass (East Khasi Hills)</option>
                      <option value="Tezpur Airbase Logistics LZ">Tezpur Airbase Logistics LZ (Sonitpur)</option>
                      <option value="Teesta NH-10 Pass, Sikkim">Teesta NH-10 Pass (Sikkim Frontier)</option>
                      <option value="Dimapur Flood Staging Camp">Dimapur Flood Staging Camp (Nagaland)</option>
                    </select>

                    {/* Quick Demo Destination Selectors */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchDest('Barpeta Emergency Medical Hub');
                          setDispatchHazard('NH-31 submerged at Howly bridge; detour via Pathsala safe sector.');
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          dispatchDest.includes('Barpeta') ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        + Barpeta Medical
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchDest('Sohra Mountain Pass, Meghalaya');
                          setDispatchHazard('Heavy slope debris on Shillong-Cherrapunjee link; alternate via Mawphlang.');
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          dispatchDest.includes('Sohra') ? 'bg-amber-600 text-white border-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        + Sohra Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDispatchDest('Tezpur Airbase Logistics LZ');
                          setDispatchHazard('Brahmaputra high alert; follow inland elevated bypass road.');
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                          dispatchDest.includes('Tezpur') ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        + Tezpur LZ
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                      Road Hazard Advisory to Driver:
                    </label>
                    <input
                      type="text"
                      value={dispatchHazard}
                      onChange={e => setDispatchHazard(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleAuthorityDispatchRoute}
                      disabled={isDispatching}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isDispatching ? 'Dispatching to Driver...' : '🚀 Push Safe Route to Phone'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAuthorityClearRoute}
                      disabled={isClearingRoute}
                      title="Reset route on driver's phone back to clean standby"
                      className="px-3 py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span>{isClearingRoute ? 'Clearing...' : 'Clear / Reset'}</span>
                    </button>
                  </div>

                  {dispatchSuccess && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 animate-pulse">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{dispatchSuccess}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-300 dark:border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <QrCode className="w-4 h-4 text-emerald-500" />
                    <span>Scan QR Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('driver-portal')}
                    className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Driver Console</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 4: DRIVER MOBILE TRACKING PORTAL */}
      {activeTab === 'driver-portal' && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="text-center mb-5">
              <span className="p-3 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-2xl inline-block border border-amber-500/30 mb-3">
                <Compass className="w-8 h-8" />
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">DRIVER MOBILE GPS PORTAL</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Real-Time Hardware Geolocation Transmission (`navigator.geolocation.watchPosition`)
              </p>
            </div>

            {/* Mobile Pairing Banner */}
            <div className="mb-5 p-3 rounded-2xl bg-gradient-to-r from-purple-900/10 via-indigo-900/10 to-transparent border border-purple-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-purple-700 dark:text-purple-300 block">
                  Pair Phone with Laptop HQ
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Scan QR code or use the secure mobile link to transmit real GPS from your phone.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Pair QR</span>
              </button>
            </div>

            {/* Direct HTTPS Notice if currently opened via insecure HTTP */}
            {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
              <div className="mb-4 p-3.5 bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <strong className="font-bold">Notice: Browser Requires HTTPS for Phone GPS</strong>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Android Chrome and iOS Safari block GPS hardware on IP links like <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">10.0.164.222</code>. Tap below to switch to our instant HTTPS link:
                </p>
                <a
                  href={driverPortalUrl}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-xl text-center shadow flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Tap Here to Switch to Secure HTTPS Link</span>
                </a>
              </div>
            )}

            {/* Vehicle Selection Dropdown */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">
                Select Assigned Relief Vehicle:
              </label>
              <select
                value={driverVehicleId}
                onChange={e => setDriverVehicleId(e.target.value)}
                disabled={isDriverTracking}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="RT-101">RT-101 (Assam Heavy Logistics Truck - Driver: Bhaben Kalita)</option>
                <option value="RT-102">RT-102 (Meghalaya Terrain 4x4 Mini - Driver: Wanlang Kharshiing)</option>
                <option value="RT-103">RT-103 (Manipur Medical Emergency Van - Driver: Ibomcha Singh)</option>
                <option value="RT-104">RT-104 (Nagaland Relief Convoy - Driver: Toshi Ao)</option>
              </select>
            </div>

            {/* Prototype Demo Mode Toggle */}
            <div className="mb-5 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Prototype Demo Mode (Allow GPS Testing from Any Location)
                </span>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Permits testing real phone GPS even if you are currently outside the 8 North-Eastern states.
                </p>
              </div>
              <input
                type="checkbox"
                checked={driverDemoMode}
                onChange={e => setDriverDemoMode(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded cursor-pointer ml-3 shrink-0"
              />
            </div>

            {/* INCOMING DISPATCHED SAFE ROUTE CARD */}
            {dispatchedRouteReceived ? (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent border-2 border-emerald-500/50 dark:border-emerald-400/50 shadow-xl relative overflow-hidden transition-all">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-emerald-500 text-white rounded-lg">
                      <Navigation className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black tracking-wide uppercase text-emerald-600 dark:text-emerald-400">
                      Safe Route Assigned by Authority HQ
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 animate-pulse">
                    ⚡ LIVE FROM HQ
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Dispatched Target Destination</span>
                    <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      {dispatchedRouteReceived.destination || 'Designated Relief Sector'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Estimated Travel Time</span>
                      <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {dispatchedRouteReceived.eta || (dispatchedRouteReceived.etaMinutes ? `${dispatchedRouteReceived.etaMinutes} mins` : '18 mins')}
                      </strong>
                    </div>
                    <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-semibold">Safe Distance</span>
                      <strong className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono">
                        {dispatchedRouteReceived.distance || (dispatchedRouteReceived.distanceKm ? `${dispatchedRouteReceived.distanceKm} km` : '26.4 km')}
                      </strong>
                    </div>
                  </div>

                  {dispatchedRouteReceived.hazardWarning && (
                    <div className="p-3 bg-amber-500/10 dark:bg-amber-950/40 rounded-xl border border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-[11px] font-bold">HAZARD BYPASS ADVISORY:</strong>
                        <span>{dispatchedRouteReceived.hazardWarning}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Dispatched: {dispatchedRouteReceived.dispatchedAt ? new Date(dispatchedRouteReceived.dispatchedAt).toLocaleTimeString() : 'Just now'}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Detour Corridor Verified
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-300 dark:border-slate-800 text-center">
                <Navigation className="w-5 h-5 text-slate-400 mx-auto mb-1 opacity-60" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Awaiting Route Dispatch from Laptop HQ</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  When the Authority pushes a route from the Live Map, safe detours and alerts appear here in real-time.
                </p>
              </div>
            )}

            {/* DRIVER LIVE NAVIGATION & DETOUR CORRIDOR MAP */}
            <div className="mb-5 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Driver Live Route &amp; Detour Map
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {dispatchedRouteReceived ? `Safe detour corridor to ${dispatchedRouteReceived.destination}` : 'Live GPS & Detour Path Visualizer'}
                    </span>
                  </div>
                </div>

                <span className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full border ${
                  dispatchedRouteReceived ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  {dispatchedRouteReceived ? '🟢 SAFE CORRIDOR ACTIVE' : 'GPS STANDBY'}
                </span>
              </div>

              {/* Map Canvas Container */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-inner bg-slate-950">
                <div
                  ref={driverMapContainerRef}
                  className="w-full h-64 sm:h-72 z-10"
                  style={{ minHeight: '270px' }}
                />

                {/* Floating Map HUD */}
                <div className="absolute top-2.5 left-2.5 right-2.5 z-20 pointer-events-none flex items-center justify-between gap-2">
                  <div className="bg-slate-900/90 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold backdrop-blur-md border border-slate-700 shadow flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>{dispatchedRouteReceived ? `Detour around ${dispatchedRouteReceived.hazardWarning ? 'Hazard' : 'Obstacle'}` : 'Live Device GPS Beacon'}</span>
                  </div>
                </div>

                {/* Floating Map Action Buttons */}
                <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCenterDriverMap}
                    className="px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition backdrop-blur-sm"
                  >
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>My GPS</span>
                  </button>
                  {dispatchedRouteReceived && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${dispatchedRouteReceived.destLat || 26.4363},${dispatchedRouteReceived.destLon || 92.0345}&travelmode=driving`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Turn-by-Turn Guidance Strip */}
              {dispatchedRouteReceived ? (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-transparent border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
                  <Navigation className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <strong className="block text-[11px] font-bold">TURN-BY-TURN DETOUR GUIDANCE:</strong>
                    <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                      Follow green corridor detour to bypass hazard sector. Head toward <strong className="text-emerald-600 dark:text-emerald-400">{dispatchedRouteReceived.destination}</strong> (ETA: {dispatchedRouteReceived.eta || '18 mins'}, {dispatchedRouteReceived.distance || '26.4 km'}).
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic text-center">
                  When Authority pushes a safe route from laptop HQ, the corridor will be rendered here.
                </p>
              )}
            </div>

            {/* Tracking Controls */}
            <div className="space-y-4">
              {!isDriverTracking ? (
                <button
                  onClick={handleToggleDriverTracking}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-950/20 dark:shadow-emerald-950 transition flex items-center justify-center gap-3 cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  START LIVE DEVICE GPS TRACKING
                </button>
              ) : (
                <button
                  onClick={handleToggleDriverTracking}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-base shadow-xl shadow-rose-950/20 dark:shadow-rose-950 transition flex items-center justify-center gap-3"
                >
                  <Square className="w-5 h-5 fill-current" />
                  STOP LIVE TRACKING
                </button>
              )}

              {/* Quick Route Telemetry Simulator */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Desktop & Field Telemetry Simulation Triggers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendVehicleGPSLocation({
                        vehicleId: 'RT-101',
                        lat: 26.3000,
                        lon: 91.9000,
                        accuracy: 5,
                        speed: 48
                      });
                      if (res.success) {
                        setGpsStatusText('📡 Simulating RT-101 En Route to Mangaldoi (26.3000, 91.9000) • 48 km/h');
                        fetchReliefVehicles().then(setVehicles);
                      }
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-400 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold"
                  >
                    🚚 RT-101: Guwahati &rarr; Mangaldoi
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const res = await sendVehicleGPSLocation({
                        vehicleId: 'RT-102',
                        lat: 25.4000,
                        lon: 91.8000,
                        accuracy: 6,
                        speed: 38
                      });
                      if (res.success) {
                        setGpsStatusText('📡 Simulating RT-102 En Route to Sohra (25.4000, 91.8000) • 38 km/h');
                        fetchReliefVehicles().then(setVehicles);
                      }
                    }}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-400 rounded-xl border border-slate-200 dark:border-slate-700 text-left font-semibold"
                  >
                    🚚 RT-102: Shillong &rarr; Sohra Pass
                  </button>
                </div>
              </div>
            </div>

            {/* GPS Telemetry Output */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-semibold">GPS Telemetry Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isDriverTracking ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                }`}>
                  {isDriverTracking ? 'TRANSMITTING LIVE' : 'OFFLINE'}
                </span>
              </div>

              <div className="text-xs text-slate-800 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                {gpsStatusText}
              </div>

              {driverGpsError && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs space-y-2.5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                    <span className="font-semibold">{driverGpsError}</span>
                  </div>

                  {typeof window !== 'undefined' && window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && (
                    <div className="pt-2 border-t border-rose-200 dark:border-rose-800/80 space-y-2">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        🔒 <strong>Why this happened:</strong> Mobile Chrome automatically disables location access on plain HTTP IP addresses. Tap below to launch on secure HTTPS:
                      </p>
                      <a
                        href="https://bscfp-103-112-15-82.free.pinggy.net/?tab=driver"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open on Secure HTTPS (Enables GPS)
                      </a>
                    </div>
                  )}
                </div>
              )}

              {driverLocation && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Latitude</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{driverLocation.lat.toFixed(5)}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Longitude</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{driverLocation.lon.toFixed(5)}</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Accuracy</span>
                    <strong className="text-cyan-700 dark:text-cyan-400 font-mono">±{driverLocation.accuracy || 0} meters</strong>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Current Speed</span>
                    <strong className="text-amber-600 dark:text-amber-400 font-mono">{driverLocation.speed || 0} km/h</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODULE 5: ACTIVE RELIEF OPERATIONS */}
      {activeTab === 'operations' && (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operations.map(op => {
              const isDelivered = op.tripStatus === 'DELIVERED';
              const isOnRoute = op.tripStatus === 'ON_ROUTE';

              return (
                <div key={op.operationId} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        {op.operationId}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isDelivered ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                      }`}>
                        {op.tripStatus}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{op.supplyItem} ({op.quantity} Units)</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Assigned Vehicle: <strong className="text-slate-900 dark:text-slate-200">{op.vehicleId}</strong></p>

                    {/* Step Tracker */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        <span>Depot Dispatched</span>
                        <span>En Route</span>
                        <span>Delivered</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        <div className="h-2 rounded bg-emerald-500"></div>
                        <div className={`h-2 rounded ${isOnRoute || isDelivered ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                        <div className={`h-2 rounded ${isDelivered ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                      </div>
                    </div>

                    <div className="mt-4 text-xs space-y-1 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <p><span className="text-slate-500 dark:text-slate-400">Source Depot:</span> <strong className="text-slate-800 dark:text-slate-200">{op.sourceDepot}</strong></p>
                      <p><span className="text-slate-500 dark:text-slate-400">Destination:</span> <strong className="text-slate-800 dark:text-slate-200">{op.destination}</strong></p>
                      <p><span className="text-slate-500 dark:text-slate-400">GPS Signal:</span> <span className="font-mono text-emerald-600 dark:text-emerald-400">{op.gpsStatus}</span></p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      Updated: {new Date(op.lastUpdated).toLocaleTimeString()}
                    </span>
                    {!isDelivered && (
                      <button
                        onClick={async () => {
                          await markOperationDelivered(op.operationId);
                          loadAllData();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-MODULE 6: SMART ALLOCATION ENGINE */}
      {activeTab === 'smart-alloc' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Cpu className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">SMART RELIEF ALLOCATION ENGINE</h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Matches affected North-Eastern areas with nearest operational depots and available GPS vehicles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">State (8 NER Only)</label>
                <select
                  value={allocState}
                  onChange={e => {
                    setAllocState(e.target.value);
                    const dists = NER_STATES_DISTRICTS[e.target.value] || [];
                    setAllocDistrict(dists[0] || '');
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">District</label>
                <select
                  value={allocDistrict}
                  onChange={e => setAllocDistrict(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {(NER_STATES_DISTRICTS[allocState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Affected Area / Relief Camp</label>
                <input
                  type="text"
                  value={allocArea}
                  onChange={e => setAllocArea(e.target.value)}
                  placeholder="e.g. Mangaldoi High School Camp"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Required Supply Item</label>
                <input
                  type="text"
                  value={allocSupply}
                  onChange={e => setAllocSupply(e.target.value)}
                  placeholder="e.g. Food Grain Packs"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Required Quantity (Units/Kits)</label>
                <input
                  type="number"
                  value={allocQty}
                  onChange={e => setAllocQty(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleRunSmartAllocation}
              disabled={allocLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-xl shadow-indigo-950/20 dark:shadow-indigo-950 transition flex items-center justify-center gap-2"
            >
              <Cpu className={`w-4 h-4 ${allocLoading ? 'animate-spin' : ''}`} />
              {allocLoading ? 'Calculating Optimal Match...' : 'MATCH OPTIMAL DEPOT & VEHICLE'}
            </button>

            {allocError && (
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs">
                {allocError}
              </div>
            )}

            {allocResult && (
              <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-950 border border-indigo-300 dark:border-indigo-500/40 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Recommended Allocation Plan
                  </span>
                  <span className="text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700">
                    MATCH CONFIRMED
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Source Depot Matched</span>
                    <strong className="text-slate-900 dark:text-white text-sm block">{allocResult.availableDepot}</strong>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">Stock Available: {allocResult.depotStock} Units</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Vehicle Assigned</span>
                    <strong className="text-slate-900 dark:text-white text-sm block">{allocResult.assignedVehicleId} ({allocResult.vehicleType})</strong>
                    <span className="text-amber-600 dark:text-amber-400 text-[11px]">Tracking: {allocResult.gpsStatus}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={async () => {
                      await dispatchReliefOperation({
                        depotId: allocResult.availableDepot,
                        vehicleId: allocResult.assignedVehicleId,
                        supplyItem: allocResult.requiredSupply,
                        quantity: allocResult.requiredQuantity,
                        destination: allocResult.destination
                      });
                      loadAllData();
                      setActiveTab('operations');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    Confirm & Dispatch Relief Convoy Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW SUPPLY REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Submit Relief Supply Request (NER Only)
              </h3>
              <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">State (8 NER Only)</label>
                  <select
                    value={reqState}
                    onChange={e => {
                      setReqState(e.target.value);
                      const dists = NER_STATES_DISTRICTS[e.target.value] || [];
                      setReqDistrict(dists[0] || '');
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                  >
                    {NER_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">District</label>
                  <select
                    value={reqDistrict}
                    onChange={e => setReqDistrict(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold"
                  >
                    {(NER_STATES_DISTRICTS[reqState] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Affected Area / Relief Camp</label>
                <input
                  type="text"
                  required
                  value={reqArea}
                  onChange={e => setReqArea(e.target.value)}
                  placeholder="e.g. Silchar Stadium Relief Shelter"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Disaster Type</label>
                  <select
                    value={reqDisaster}
                    onChange={e => setReqDisaster(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Heavy Rain">Heavy Rain</option>
                    <option value="Earthquake">Earthquake</option>
                    <option value="Storm/Cyclone">Storm/Cyclone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Priority</label>
                  <select
                    value={reqPriority}
                    onChange={e => setReqPriority(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Supply Item</label>
                  <input
                    type="text"
                    required
                    value={reqItem}
                    onChange={e => setReqItem(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Required Quantity</label>
                  <input
                    type="number"
                    required
                    value={reqQty}
                    onChange={e => setReqQty(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {reqSubmitMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  reqSubmitMsg.success ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                }`}>
                  {reqSubmitMsg.text}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg"
                >
                  Submit Supply Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: QR CODE & MOBILE DEVICE PAIRING */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-500/20">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">CONNECT DRIVER PHONE</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Two-Way GPS Telemetry &amp; Route Dispatch</p>
                </div>
              </div>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Code Container */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 inline-block mb-2">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(driverPortalUrl)}`}
                  alt="Driver Portal QR Code"
                  className="w-44 h-44 object-contain rounded-lg"
                />
              </div>
              <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 mt-1">
                <Compass className="w-3.5 h-3.5" /> Scan to Open Driver Portal on Phone
              </span>
            </div>

            {/* Tunnel URL (Method B HTTPS) */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                  Option A: Direct HTTPS Link (Zero Password &bull; Instant Phone GPS)
                </span>
                {copiedLink === 'tunnel' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={driverPortalUrl}
                  className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(driverPortalUrl);
                    setCopiedLink('tunnel');
                    setTimeout(() => setCopiedLink(null), 2500);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[10px] shrink-0 shadow cursor-pointer"
                >
                  Copy
                </button>
              </div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed font-semibold">
                ✓ SSL secured &bull; Works seamlessly on Safari (iOS) and Chrome (Android).
              </p>
            </div>

            {/* Direct Local Wi-Fi URL */}
            <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                  Option B: Local Wi-Fi Network
                </span>
                {copiedLink === 'local' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                )}
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={localDriverUrl}
                  className="w-full bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(localDriverUrl);
                    setCopiedLink('local');
                    setTimeout(() => setCopiedLink(null), 2500);
                  }}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[10px] shrink-0 cursor-pointer"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Quick Demo Instructions */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <strong className="block font-bold text-[11px]">Quick 3-Step Demo Guide:</strong>
              <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                <li>Scan QR or open link on phone, and keep "Prototype Demo Mode" checked.</li>
                <li>Tap <strong className="text-slate-800 dark:text-slate-200">"START LIVE DEVICE GPS TRACKING"</strong> &amp; grant location permission.</li>
                <li>On this laptop's Live Map, your phone appears as a live moving vehicle! Enter detour notes and click <strong>"Push Safe Route to Vehicle"</strong> to send guidance to your phone.</li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700 cursor-pointer transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
