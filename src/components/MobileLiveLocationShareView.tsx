import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Compass, AlertTriangle, CheckCircle2, Shield, Radio, RefreshCw, XCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { sendRealGPSUpdate, stopQRLiveTrackingSession, RealLocationData } from '../services/api/smartTrackingService';

interface Props {
  sessionId: string;
  token: string;
  onExit?: () => void;
}

export const MobileLiveLocationShareView: React.FC<Props> = ({ sessionId, token, onExit }) => {
  const [sharingStatus, setSharingStatus] = useState<'IDLE' | 'CONNECTING' | 'LIVE' | 'STOPPED' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<RealLocationData | null>(null);
  const [lastUpdatedSecAgo, setLastUpdatedSecAgo] = useState<number>(0);
  const [updateCount, setUpdateCount] = useState<number>(0);

  const watchIdRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // Relative timestamp ticker
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentLocation) {
        const elapsed = Math.floor((Date.now() - currentLocation.timestamp) / 1000);
        setLastUpdatedSecAgo(Math.max(0, elapsed));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLocation]);

  // Leaflet Mini Map Initialization on Phone A
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current, {
        center: [currentLocation?.lat || 26.1445, currentLocation?.lon || 91.7362],
        zoom: 15,
        zoomControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapRef.current = map;
    }

    const map = mapRef.current;

    if (currentLocation) {
      const { lat, lon, accuracy } = currentLocation;

      if (!markerRef.current) {
        const icon = L.divIcon({
          className: 'phone-a-marker',
          html: `
            <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-rose-600 border-2 border-white shadow-2xl text-white font-black">
              <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-400 animate-ping"></span>
              📱
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        markerRef.current = L.marker([lat, lon], { icon }).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lon]);
      }

      if (accuracy && accuracy > 0) {
        if (!circleRef.current) {
          circleRef.current = L.circle([lat, lon], {
            radius: accuracy,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 1
          }).addTo(map);
        } else {
          circleRef.current.setLatLng([lat, lon]);
          circleRef.current.setRadius(accuracy);
        }
      }

      map.setView([lat, lon], 15);
      map.invalidateSize();
    }
  }, [currentLocation]);

  // Start Real Mobile Phone GPS Watcher
  const handleStartSharing = () => {
    setSharingStatus('CONNECTING');
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation API is not supported by your browser.');
      setSharingStatus('ERROR');
      return;
    }

    // Clear existing watch if active
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const handlePositionSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy, speed, heading } = pos.coords;
      const timestamp = pos.timestamp || Date.now();

      const locData: RealLocationData = {
        lat: latitude,
        lon: longitude,
        accuracy: typeof accuracy === 'number' ? Number(accuracy.toFixed(1)) : 5.0,
        speed: typeof speed === 'number' ? Number((speed * 3.6).toFixed(1)) : null, // convert m/s to km/h
        heading: typeof heading === 'number' ? Number(heading.toFixed(1)) : null,
        timestamp
      };

      setCurrentLocation(locData);
      setLastUpdatedSecAgo(0);
      setUpdateCount(prev => prev + 1);
      setSharingStatus('LIVE');

      // Transmit REAL GPS telemetry payload to backend
      const res = await sendRealGPSUpdate({
        sessionId,
        token,
        lat: latitude,
        lon: longitude,
        accuracy: locData.accuracy,
        speed: locData.speed,
        heading: locData.heading,
        timestamp
      });

      if (!res.success) {
        if (res.sessionStatus === 'STOPPED') {
          handleStopSharing();
        } else {
          console.warn('GPS sync warning:', res.error);
        }
      }
    };

    const handlePositionError = (err: GeolocationPositionError) => {
      let msg = 'Failed to obtain GPS location.';
      if (err.code === err.PERMISSION_DENIED) {
        msg = 'Location permission denied by browser. Please tap the lock icon in Chrome address bar -> Site Settings -> Allow Location.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        msg = 'GPS signal unavailable. Please move outdoors with a clear view of the sky.';
      } else if (err.code === err.TIMEOUT) {
        msg = 'GPS position request timed out. Retrying high-accuracy fix...';
      }
      setErrorMessage(msg);
      if (sharingStatus !== 'LIVE') {
        setSharingStatus('ERROR');
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;
  };

  // Stop Sharing GPS (Phone A Stop Button)
  const handleStopSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingStatus('STOPPED');
    await stopQRLiveTrackingSession(sessionId, token);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header Banner */}
      <header className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h1 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
              JEEVAN SETU LIVE GPS
            </h1>
            <p className="text-[11px] text-slate-400">Android Mobile Phone Telemetry Transmitter</p>
          </div>
        </div>

        {onExit && (
          <button
            onClick={onExit}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
          >
            Exit
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full my-4 space-y-4">
        {/* Session Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Session ID</span>
              <strong className="text-rose-400 font-mono text-base">{sessionId}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Status</span>
              {sharingStatus === 'LIVE' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-black animate-pulse">
                  ● LIVE TRANSMITTING
                </span>
              ) : sharingStatus === 'STOPPED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-extrabold">
                  ⏹️ STOPPED
                </span>
              ) : sharingStatus === 'CONNECTING' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-xs font-extrabold">
                  <RefreshCw className="w-3 h-3 animate-spin" /> ACQUIRING GPS...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
                  READY TO SHARE
                </span>
              )}
            </div>
          </div>

          {/* Android Location Permission Notice */}
          {sharingStatus === 'IDLE' && (
            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-300">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-amber-400" />
                Browser Location Permission Required
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                When you tap <strong className="text-white">"ALLOW GPS & START LIVE SHARING"</strong>, Android Chrome will prompt:
                <em className="block text-emerald-300 font-sans my-1 bg-slate-900 p-2 rounded border border-slate-800">
                  "Allow Jeevan Setu to access your device's location?"
                </em>
                Tap <strong className="text-emerald-400">Allow</strong> to share your physical GPS coordinates to Jeevan Setu dashboard.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-950/90 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          {sharingStatus !== 'LIVE' && sharingStatus !== 'CONNECTING' ? (
            <button
              onClick={handleStartSharing}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950 transition uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-95"
            >
              <Compass className="w-5 h-5" />
              [ ALLOW GPS & START LIVE SHARING ]
            </button>
          ) : (
            <button
              onClick={handleStopSharing}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-rose-950 transition uppercase tracking-wider flex items-center justify-center gap-2.5 active:scale-95"
            >
              <XCircle className="w-5 h-5" />
              🛑 STOP SHARING
            </button>
          )}
        </div>

        {/* Real-time Telemetry Dashboard Card */}
        {currentLocation && (
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-white flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Telemetry Readout
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Pings Sent: <strong className="text-emerald-400">{updateCount}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Latitude</span>
                <strong className="text-white text-sm">{currentLocation.lat.toFixed(5)}°</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Longitude</span>
                <strong className="text-white text-sm">{currentLocation.lon.toFixed(5)}°</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">GPS Accuracy</span>
                <strong className="text-emerald-400 text-sm">± {currentLocation.accuracy} m</strong>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Last Update</span>
                <strong className="text-amber-300 text-sm">
                  {lastUpdatedSecAgo === 0 ? 'Just now' : `${lastUpdatedSecAgo}s ago`}
                </strong>
              </div>
            </div>

            {/* Mini Map */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Phone A Physical Position</span>
                <span className="text-emerald-400 font-bold">High Accuracy Fix</span>
              </div>
              <div
                ref={mapContainerRef}
                className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 relative z-0"
              ></div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-slate-500 font-mono pt-2">
        <p className="flex items-center justify-center gap-1">
          <Shield className="w-3.5 h-3.5 text-slate-500" />
          Protected by Jeevan Setu End-to-End Secure Telemetry Protocol
        </p>
      </footer>
    </div>
  );
};
