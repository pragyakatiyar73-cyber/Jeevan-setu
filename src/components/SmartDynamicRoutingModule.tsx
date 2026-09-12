import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Truck,
  MapPin,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Compass,
  AlertCircle,
  CornerDownRight,
  Layers,
  ChevronDown,
  ChevronUp,
  Activity,
  ShieldAlert,
  Info
} from 'lucide-react';
import L from 'leaflet';
import {
  getReliefVehicles,
  subscribeToVehicleLocationStream,
  ReliefVehicle
} from '../services/api/reliefSupplyService';
import {
  fetchRoutingDestinations,
  calculateDynamicRoute,
  DynamicRoutingDestination,
  DynamicRoutingResult,
  ScoredRoute,
  RouteStatus,
  DataFreshnessStatus
} from '../services/api/dynamicRoutingService';
import { isPointInNER, MASTER_NER_POLYGON, NER_STATES, isNERState } from '../utils/nerBoundary';

export default function SmartDynamicRoutingModule() {
  // Data states
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [destinations, setDestinations] = useState<DynamicRoutingDestination[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>('');
  
  const [activeVehicle, setActiveVehicle] = useState<ReliefVehicle | null>(null);
  const [activeDestination, setActiveDestination] = useState<DynamicRoutingDestination | null>(null);

  // Routing calculation states
  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<DynamicRoutingResult | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<'ROUTE_A' | 'ROUTE_B'>('ROUTE_B');
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('ROUTE_RECOMMENDED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState<boolean>(false);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Data Freshness helper
  const getFreshnessStatus = (vehicle: ReliefVehicle | null): DataFreshnessStatus => {
    if (!vehicle || vehicle.currentLatitude === null || vehicle.currentLongitude === null) {
      return 'DATA UNAVAILABLE';
    }
    if (vehicle.trackingStatus === 'GPS_CONNECTED') {
      return 'LIVE DATA';
    }
    if (vehicle.trackingStatus === 'GPS_STALE') {
      return 'LAST KNOWN DATA';
    }
    return 'DATA UNAVAILABLE';
  };

  // Load initial vehicle fleet and destinations
  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      try {
        const [vList, dList] = await Promise.all([
          getReliefVehicles(),
          fetchRoutingDestinations()
        ]);
        setVehicles(vList);
        setDestinations(dList);

        if (vList.length > 0) {
          setSelectedVehicleId(vList[0].vehicleId);
          setActiveVehicle(vList[0]);
        }
        if (dList.length > 0) {
          setSelectedDestinationId(dList[0].id);
          setActiveDestination(dList[0]);
        }
      } catch (err: any) {
        setErrorMsg('Failed to sync routing telemetry with server.');
      } finally {
        setLoading(false);
      }
    }
    loadInitialData();
  }, []);

  // Update active vehicle selection
  useEffect(() => {
    const found = vehicles.find((v) => v.vehicleId === selectedVehicleId);
    if (found) {
      setActiveVehicle(found);
    }
  }, [selectedVehicleId, vehicles]);

  // Update active destination selection
  useEffect(() => {
    const found = destinations.find((d) => d.id === selectedDestinationId);
    if (found) {
      setActiveDestination(found);
    }
  }, [selectedDestinationId, destinations]);

  // SSE Live Vehicle Position Stream Subscription & Route Deviation Detection
  useEffect(() => {
    const unsubscribe = subscribeToVehicleLocationStream((updatedVehicle) => {
      setVehicles((prev) => {
        const idx = prev.findIndex((v) => v.vehicleId === updatedVehicle.vehicleId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedVehicle;
          return next;
        }
        return [...prev, updatedVehicle];
      });

      // If active tracked vehicle location changed
      if (activeVehicle && activeVehicle.vehicleId === updatedVehicle.vehicleId) {
        setActiveVehicle(updatedVehicle);

        // Check for off-route deviation if active route is loaded
        if (routeResult && updatedVehicle.currentLatitude && updatedVehicle.currentLongitude) {
          const selectedRoute = routeResult.routes.find((r) => r.id === activeRouteId);
          if (selectedRoute && selectedRoute.geometry.length > 0) {
            const vehicleLat = updatedVehicle.currentLatitude;
            const vehicleLon = updatedVehicle.currentLongitude;

            // Check distance to closest route node
            let minDistanceKm = 9999;
            for (const pt of selectedRoute.geometry) {
              const d = Math.hypot(pt[0] - vehicleLat, pt[1] - vehicleLon) * 111;
              if (d < minDistanceKm) minDistanceKm = d;
            }

            // Off-route check (> 500 meters)
            if (minDistanceKm > 0.5 && routeStatus !== 'VEHICLE_OFF_ROUTE') {
              setRouteStatus('VEHICLE_OFF_ROUTE');
            }

            // Destination reached check (< 100 meters)
            if (activeDestination) {
              const dDest = Math.hypot(activeDestination.lat - vehicleLat, activeDestination.lon - vehicleLon) * 111;
              if (dDest < 0.1) {
                setRouteStatus('DESTINATION_REACHED');
              }
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, [activeVehicle, routeResult, activeRouteId, routeStatus, activeDestination]);

  // Execute Dynamic Route Calculation
  const handleCalculateRoute = async () => {
    if (!activeVehicle) {
      setErrorMsg('Please select a valid relief vehicle.');
      return;
    }
    if (!activeDestination) {
      setErrorMsg('Please select a valid destination.');
      return;
    }

    if (activeVehicle.currentLatitude === null || activeVehicle.currentLongitude === null) {
      setErrorMsg('Selected vehicle has no active GPS signal. GPS data unavailable.');
      return;
    }

    // Validate NER coordinates
    if (!isPointInNER(activeVehicle.currentLatitude, activeVehicle.currentLongitude)) {
      setErrorMsg('Dynamic routing is currently available only for the North-Eastern Region of India.');
      return;
    }
    if (!isPointInNER(activeDestination.lat, activeDestination.lon)) {
      setErrorMsg('Dynamic routing is currently available only for the North-Eastern Region of India.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setRouteStatus('ROUTE_RECALCULATING');

    try {
      const payload = {
        vehicleId: activeVehicle.vehicleId,
        startLat: activeVehicle.currentLatitude,
        startLon: activeVehicle.currentLongitude,
        destinationLat: activeDestination.lat,
        destinationLon: activeDestination.lon,
        destinationName: activeDestination.name,
        state: activeDestination.state
      };

      const result = await calculateDynamicRoute(payload);

      if (result.status === 'error') {
        setErrorMsg(result.message || 'Dynamic routing failed.');
        setRouteStatus('ROUTE_RISK_DETECTED');
      } else {
        setRouteResult(result);
        setActiveRouteId(result.recommendedRoute);
        setRouteStatus('ROUTE_RECOMMENDED');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server error calculating safe route.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize & Render Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [25.5788, 91.8933], // Default Shillong center
        zoom: 7,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> & Jeevan Setu NER',
        maxZoom: 18
      }).addTo(map);

      // Render Master NER Boundary Polygon
      const nerPoly = L.polyline(MASTER_NER_POLYGON, {
        color: '#06b6d4',
        weight: 2,
        dashArray: '6, 6',
        fillOpacity: 0.05
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;
    }

    const map = leafletMapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!layerGroup || !map) return;

    layerGroup.clearLayers();

    // Render Vehicle Marker
    if (activeVehicle && activeVehicle.currentLatitude !== null && activeVehicle.currentLongitude !== null) {
      const isLive = activeVehicle.trackingStatus === 'GPS_CONNECTED';
      const vehIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div class="relative flex items-center justify-center">
            ${isLive ? '<span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-emerald-400 opacity-75"></span>' : ''}
            <div class="relative w-9 h-9 ${isLive ? 'bg-emerald-600' : 'bg-amber-600'} text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 font-bold">
              🚚
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const vehMarker = L.marker([activeVehicle.currentLatitude, activeVehicle.currentLongitude], { icon: vehIcon })
        .bindPopup(`
          <div class="p-2 text-slate-800">
            <h4 class="font-bold text-sm text-emerald-700">${activeVehicle.vehicleId} (${activeVehicle.vehicleType})</h4>
            <p class="text-xs text-slate-600 mt-1">Driver: ${activeVehicle.driverName || 'N/A'}</p>
            <p class="text-xs text-slate-600">GPS: ${getFreshnessStatus(activeVehicle)}</p>
            <p class="text-xs text-slate-500 font-mono mt-1">${activeVehicle.currentLatitude.toFixed(4)}, ${activeVehicle.currentLongitude.toFixed(4)}</p>
          </div>
        `);
      layerGroup.addLayer(vehMarker);
    }

    // Render Destination Marker
    if (activeDestination) {
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div class="w-9 h-9 bg-rose-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white font-bold text-lg">
            🎯
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const destMarker = L.marker([activeDestination.lat, activeDestination.lon], { icon: destIcon })
        .bindPopup(`
          <div class="p-2 text-slate-800">
            <h4 class="font-bold text-sm text-rose-700">${activeDestination.name}</h4>
            <p class="text-xs text-slate-600">${activeDestination.district}, ${activeDestination.state}</p>
          </div>
        `);
      layerGroup.addLayer(destMarker);
    }

    // Render Scored Routes & Hazards
    if (routeResult && routeResult.routes.length > 0) {
      const bounds = L.latLngBounds([]);

      if (activeVehicle?.currentLatitude && activeVehicle?.currentLongitude) {
        bounds.extend([activeVehicle.currentLatitude, activeVehicle.currentLongitude]);
      }
      if (activeDestination) {
        bounds.extend([activeDestination.lat, activeDestination.lon]);
      }

      routeResult.routes.forEach((route) => {
        const isSelected = route.id === activeRouteId;
        const isRec = route.isRecommended;

        let strokeColor = '#3b82f6'; // Route A default blue
        if (route.id === 'ROUTE_B') strokeColor = '#10b981'; // Route B green
        if (route.riskLevel === 'HIGH' || route.riskLevel === 'CRITICAL') {
          if (!isRec) strokeColor = '#ef4444'; // Red if high risk non-recommended
        }

        const polyline = L.polyline(route.geometry, {
          color: strokeColor,
          weight: isSelected ? 6 : 4,
          opacity: isSelected ? 0.9 : 0.4,
          dashArray: route.id === 'ROUTE_B' ? undefined : '8, 8'
        });

        polyline.bindPopup(`
          <div class="p-2 text-slate-800 max-w-xs">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm">${route.name}</span>
              <span class="px-2 py-0.5 text-xs font-bold rounded ${
                route.riskLevel === 'LOW' ? 'bg-emerald-100 text-emerald-800' :
                route.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }">${route.riskLevel} RISK</span>
            </div>
            <p class="text-xs text-slate-600 mt-1 font-semibold">Distance: ${route.distanceKm} km | ETA: ${route.durationMinutes} mins</p>
            <div class="mt-2 text-xs grid grid-cols-2 gap-1 bg-slate-100 p-1.5 rounded">
              <div>🌊 Flood: <b>${route.breakdown.floodRisk}</b></div>
              <div>⛰️ Landslide: <b>${route.breakdown.landslideRisk}</b></div>
              <div>🚧 Road: <b>${route.breakdown.roadRisk}</b></div>
              <div>🌧️ Weather: <b>${route.breakdown.weatherRisk}</b></div>
            </div>
          </div>
        `);

        layerGroup.addLayer(polyline);

        // Fit map bounds to encompass active route
        route.geometry.forEach((pt) => bounds.extend(pt));

        // Render Hazards Overlay
        route.hazards.forEach((h) => {
          const hazMarker = L.circleMarker([h.lat, h.lon], {
            radius: 12,
            color: '#dc2626',
            fillColor: '#ef4444',
            fillOpacity: 0.6
          }).bindPopup(`
            <div class="p-2 text-slate-800">
              <span class="text-xs font-bold bg-rose-600 text-white px-2 py-0.5 rounded">HAZARD DETECTED</span>
              <h4 class="font-bold text-sm mt-1">${h.name}</h4>
              <p class="text-xs text-slate-600">${h.type} — Severity: ${h.severity}</p>
            </div>
          `);
          layerGroup.addLayer(hazMarker);
        });
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [activeVehicle, activeDestination, routeResult, activeRouteId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Navigation className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Smart Dynamic Routing
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                NER-Only
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Safer route recommendations for disaster relief operations based on live telemetry & hazard models.
          </p>
        </div>

        {/* Operational Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Coverage: 8 NER States</span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            routeStatus === 'ROUTE_RECOMMENDED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
            routeStatus === 'ROUTE_ACTIVE' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' :
            routeStatus === 'VEHICLE_OFF_ROUTE' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' :
            'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            <span>STATUS: {routeStatus.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 relative overflow-hidden">
        {/* Left Control & Inputs Panel */}
        <div className="lg:col-span-4 bg-slate-900 border-r border-slate-800 p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-65px)]">
          {/* Risk Disclaimer Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300">Operational Risk Indicator:</span>
              <p className="mt-0.5 text-amber-200/90 leading-relaxed">
                This feature evaluates live disaster, weather, and road status. This is an operational risk indicator, NOT a guaranteed prediction.
              </p>
            </div>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-300">Routing Alert:</span>
                <p className="mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Section: Relief Vehicle Input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                Select Active Relief Vehicle
              </label>

              {activeVehicle && (
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  getFreshnessStatus(activeVehicle) === 'LIVE DATA' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse' :
                  getFreshnessStatus(activeVehicle) === 'LAST KNOWN DATA' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  ● {getFreshnessStatus(activeVehicle)}
                </span>
              )}
            </div>

            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {vehicles.length === 0 ? (
                <option value="">No Active Relief Vehicles Found</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.vehicleId} value={v.vehicleId}>
                    {v.vehicleId} — {v.vehicleType} ({v.sourceDepot})
                  </option>
                ))
              )}
            </select>

            {activeVehicle && (
              <div className="bg-slate-900/90 rounded-lg p-3 text-xs space-y-1.5 border border-slate-800/80">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Driver:</span>
                  <span className="font-semibold">{activeVehicle.driverName || 'Depot Driver'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Latest GPS Coordinates:</span>
                  <span className="font-mono text-cyan-400">
                    {activeVehicle.currentLatitude !== null && activeVehicle.currentLongitude !== null
                      ? `${activeVehicle.currentLatitude.toFixed(4)}, ${activeVehicle.currentLongitude.toFixed(4)}`
                      : 'DATA UNAVAILABLE'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Trip Status:</span>
                  <span className="font-bold text-amber-400">{activeVehicle.tripStatus}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Destination Input */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-400" />
              Select Destination (8 NER States)
            </label>

            <select
              value={selectedDestinationId}
              onChange={(e) => setSelectedDestinationId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.district}, {d.state})
                </option>
              ))}
            </select>

            {activeDestination && (
              <div className="bg-slate-900/90 rounded-lg p-3 text-xs space-y-1.5 border border-slate-800/80">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">State / District:</span>
                  <span className="font-semibold text-rose-300">{activeDestination.state} / {activeDestination.district}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Destination Lat/Lon:</span>
                  <span className="font-mono text-cyan-400">{activeDestination.lat.toFixed(4)}, {activeDestination.lon.toFixed(4)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <button
            onClick={handleCalculateRoute}
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Evaluating Hazard Telemetry...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Calculate Safer Dynamic Route</span>
              </>
            )}
          </button>

          {/* Route Comparison & Recommendation Display */}
          {routeResult && routeResult.routes.length > 0 && (
            <div className="space-y-4 mt-2">
              {/* Recommendation Callout Banner */}
              <div className="bg-emerald-950/50 border-2 border-emerald-500/50 rounded-xl p-4 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded text-[11px] tracking-wider uppercase">
                    RECOMMENDED ROUTE
                  </span>
                  <span className="font-bold text-emerald-300 text-sm">
                    {routeResult.routes.find((r) => r.id === routeResult.recommendedRoute)?.name}
                  </span>
                </div>
                <p className="text-emerald-200/90 leading-relaxed">
                  {routeResult.reason}
                </p>
              </div>

              {/* Scored Routes List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available Route Options
                </h3>

                {routeResult.routes.map((route) => {
                  const isSelected = activeRouteId === route.id;
                  const isRec = route.isRecommended;

                  return (
                    <div
                      key={route.id}
                      onClick={() => setActiveRouteId(route.id)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? isRec
                            ? 'bg-emerald-950/30 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                            : 'bg-slate-800/90 border-cyan-500/80'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{route.name}</span>
                            {isRec && (
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-bold text-[10px] rounded border border-emerald-500/30">
                                SAFER CHOICE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-semibold">
                            <span>🛣️ {route.distanceKm} km</span>
                            <span>⏱️ ~{route.durationMinutes} mins</span>
                          </div>
                        </div>

                        <span className={`px-2 py-1 text-xs font-black rounded ${
                          route.riskLevel === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                          route.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {route.riskLevel} RISK
                        </span>
                      </div>

                      {/* Risk Breakdown Table */}
                      <div className="mt-3 grid grid-cols-3 gap-1.5 text-[11px] bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                        <div>Flood: <b className={route.breakdown.floodRisk === 'LOW' ? 'text-emerald-400' : 'text-rose-400'}>{route.breakdown.floodRisk}</b></div>
                        <div>Landslide: <b className={route.breakdown.landslideRisk === 'LOW' ? 'text-emerald-400' : 'text-rose-400'}>{route.breakdown.landslideRisk}</b></div>
                        <div>Road: <b className={route.breakdown.roadRisk === 'LOW' ? 'text-emerald-400' : 'text-rose-400'}>{route.breakdown.roadRisk}</b></div>
                        <div>Weather: <b className="text-slate-300">{route.breakdown.weatherRisk}</b></div>
                        <div>Incidents: <b className="text-slate-300">{route.breakdown.incidentRisk}</b></div>
                        <div>Hazards: <b className="text-amber-400">{route.hazards.length} Alert(s)</b></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right GIS Leaflet Map View */}
        <div className="lg:col-span-8 relative h-[500px] lg:h-full w-full bg-slate-950">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Map Overlay Badge */}
          <div className="absolute top-4 right-4 z-10 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs backdrop-blur-md shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-300 text-[11px]">Recommended Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
              <span className="text-slate-300 text-[11px]">Primary Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-slate-300 text-[11px]">Hazard Risk Zone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
