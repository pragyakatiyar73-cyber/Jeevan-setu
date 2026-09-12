import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Navigation,
  Radio,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Clock,
  Compass,
  Gauge,
  Package,
  ArrowLeft,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import {
  ReliefVehicle,
  getReliefVehicles,
  getReliefVehicleById,
  sendVehicleGPSLocation,
  VehicleTrackingStatus
} from '../services/api/reliefSupplyService';

interface DriverTrackingPageProps {
  onBackToHub?: () => void;
}

export default function DriverTrackingPage({ onBackToHub }: DriverTrackingPageProps) {
  const [vehicles, setVehicles] = useState<ReliefVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('RT-101');
  const [vehicle, setVehicle] = useState<ReliefVehicle | null>(null);
  
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [trackingStatus, setTrackingStatus] = useState<VehicleTrackingStatus>('GPS_NOT_CONNECTED');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLon, setCurrentLon] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  // Fetch available vehicles list
  useEffect(() => {
    async function loadVehicles() {
      const vList = await getReliefVehicles();
      setVehicles(vList);
      if (vList.length > 0 && !selectedVehicleId) {
        setSelectedVehicleId(vList[0].vehicleId);
      }
    }
    loadVehicles();
  }, []);

  // Fetch selected vehicle info
  useEffect(() => {
    if (!selectedVehicleId) return;
    async function loadVehicleInfo() {
      const v = await getReliefVehicleById(selectedVehicleId);
      if (v) {
        setVehicle(v);
        if (v.currentLatitude && v.currentLongitude) {
          setCurrentLat(v.currentLatitude);
          setCurrentLon(v.currentLongitude);
        }
        if (v.gpsAccuracy) setAccuracy(v.gpsAccuracy);
        if (v.speed !== null && v.speed !== undefined) setSpeed(v.speed);
        if (v.heading !== null && v.heading !== undefined) setHeading(v.heading);
        if (v.trackingStatus) setTrackingStatus(v.trackingStatus);
        if (v.lastLocationUpdate) setLastUpdated(v.lastLocationUpdate);
      }
    }
    loadVehicleInfo();
  }, [selectedVehicleId]);

  // Clean up watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleStartTracking = () => {
    setPermissionError(null);
    setApiError(null);

    if (!('geolocation' in navigator)) {
      setPermissionError('Location permission is required for live vehicle tracking. Geolocation API is not supported on this browser.');
      setTrackingStatus('GPS_PERMISSION_DENIED');
      return;
    }

    setIsTracking(true);
    setTrackingStatus('GPS_CONNECTED');

    const options = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords;
        const speedKmH = speed !== null && speed >= 0 ? Math.round(speed * 3.6) : 0;
        const nowIso = new Date().toISOString();

        setCurrentLat(latitude);
        setCurrentLon(longitude);
        setAccuracy(Math.round(accuracy));
        setSpeed(speedKmH);
        setHeading(heading ? Math.round(heading) : 0);
        setLastUpdated(nowIso);
        setTrackingStatus('GPS_CONNECTED');

        // Transmit coordinates to backend MongoDB
        const res = await sendVehicleGPSLocation({
          vehicleId: selectedVehicleId,
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
          speed: speedKmH,
          heading: heading ? Math.round(heading) : 0,
          timestamp: nowIso
        });

        if (!res.success) {
          setApiError(res.message);
        } else if (res.vehicle) {
          setVehicle(res.vehicle);
        }
      },
      (error) => {
        console.warn('Geolocation Error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionError('Location permission is required for live vehicle tracking. Please grant GPS access in your browser settings.');
          setTrackingStatus('GPS_PERMISSION_DENIED');
        } else {
          setPermissionError(`GPS Signal Error: ${error.message}`);
          setTrackingStatus('GPS_STALE');
        }
        setIsTracking(false);
      },
      options
    );

    watchIdRef.current = watchId;
  };

  const handleStopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setTrackingStatus('GPS_NOT_CONNECTED');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 pb-24">
      {/* Mobile Header Bar */}
      <div className="max-w-xl mx-auto mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-white">
              <Smartphone className="w-6 h-6 text-emerald-400" />
              Driver Live GPS Tracker
            </h1>
            <p className="text-xs text-slate-400">Jeevan Setu Mobile GPS Telemetry</p>
          </div>
        </div>
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          NER Fleet 8 States
        </span>
      </div>

      <div className="max-w-xl mx-auto space-y-6">
        {/* Vehicle Selection Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
            Select Your Assigned Vehicle
          </label>
          <select
            value={selectedVehicleId}
            onChange={(e) => {
              if (isTracking) handleStopTracking();
              setSelectedVehicleId(e.target.value);
            }}
            disabled={isTracking}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
          >
            {vehicles.map((v) => (
              <option key={v.vehicleId} value={v.vehicleId}>
                {v.vehicleId} — {v.vehicleType} ({v.sourceDepot})
              </option>
            ))}
          </select>
        </div>

        {/* Live GPS Status Hero Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="flex justify-center">
            {trackingStatus === 'GPS_CONNECTED' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-sm font-bold animate-pulse">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                🟢 GPS CONNECTED & STREAMING
              </div>
            )}
            {trackingStatus === 'GPS_STALE' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-sm font-bold">
                🟠 GPS DATA STALE
              </div>
            )}
            {trackingStatus === 'GPS_NOT_CONNECTED' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-sm font-bold">
                🔴 GPS NOT CONNECTED
              </div>
            )}
            {trackingStatus === 'GPS_PERMISSION_DENIED' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950 text-rose-400 border border-rose-800 text-sm font-bold">
                ⚠️ PERMISSION DENIED
              </div>
            )}
          </div>

          {/* Action Buttons (Large Touch Targets for Mobile) */}
          <div className="pt-2">
            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-lg shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" />
                START LIVE TRACKING
              </button>
            ) : (
              <button
                onClick={handleStopTracking}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-lg shadow-lg shadow-rose-950/50 flex items-center justify-center gap-3 transition-transform active:scale-95"
              >
                <Square className="w-6 h-6 fill-current" />
                STOP LIVE TRACKING
              </button>
            )}
          </div>

          {permissionError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{permissionError}</span>
            </div>
          )}

          {apiError && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}
        </div>

        {/* Live Telemetry Display Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Latitude
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {currentLat !== null ? currentLat.toFixed(6) : '—'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Longitude
            </div>
            <div className="text-lg font-bold font-mono text-white">
              {currentLon !== null ? currentLon.toFixed(6) : '—'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Radio className="w-3.5 h-3.5 text-blue-400" />
              GPS Accuracy
            </div>
            <div className="text-lg font-bold text-white">
              {accuracy !== null ? `±${accuracy} m` : '—'}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5 mb-1">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Speed
            </div>
            <div className="text-lg font-bold text-white">
              {speed !== null ? `${speed} km/h` : '0 km/h'}
            </div>
          </div>
        </div>

        {/* Assigned Route & Supplies Card */}
        {vehicle && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Assigned Dispatch Trip
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Source Depot:</span>
                <span className="font-semibold text-white">{vehicle.sourceDepot}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Destination:</span>
                <span className="font-semibold text-amber-400">{vehicle.destination}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Trip Status:</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400">
                  {vehicle.tripStatus}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Last Updated:
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Not synced'}
                </span>
              </div>
            </div>

            {/* Assigned Cargo */}
            {vehicle.assignedSupplies && vehicle.assignedSupplies.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" /> Cargo Onboard:
                </div>
                <div className="space-y-1.5">
                  {vehicle.assignedSupplies.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-200 font-medium">{s.item}</span>
                      <span className="text-emerald-400 font-bold">{s.quantity} units</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security & Verification Footer */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Secured Mobile Geolocation Channel
          </div>
          <p>Driver contact details are protected. GPS telemetry is encrypted and bounded strictly to 8 NER states.</p>
        </div>
      </div>
    </div>
  );
}
