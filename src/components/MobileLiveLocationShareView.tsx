import React, { useState, useEffect, useRef } from 'react';
import { ShieldAlert, Compass, AlertTriangle, CheckCircle2, Shield, Radio, RefreshCw, XCircle, Share2, Copy, Check, Users, LogOut } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import QRCode from 'qrcode';
import {
  sendRealGPSUpdate,
  stopQRLiveTrackingSession,
  getPrivateTrackingSession,
  RealLocationData,
  SessionParticipant
} from '../services/api/smartTrackingService';

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

  // Multi-participant state
  const [myParticipantId] = useState<string>(() => {
    let pid = localStorage.getItem(`js_pid_${sessionId}`);
    if (!pid) {
      pid = 'P-' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem(`js_pid_${sessionId}`, pid);
    }
    return pid;
  });

  const [myLabel, setMyLabel] = useState<string>(() => {
    return localStorage.getItem(`js_plabel_${sessionId}`) || `Participant (${myParticipantId})`;
  });

  const [sessionParticipants, setSessionParticipants] = useState<SessionParticipant[]>([]);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [qrImageSrc, setQrImageSrc] = useState<string>('');
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);

  const watchIdRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const participantMarkersRef = useRef<Record<string, { marker: L.Marker; circle?: L.Circle }>>({});

  // Session polling effect to update multi-participant data from backend
  const fetchSessionParticipants = async () => {
    const res = await getPrivateTrackingSession(sessionId);
    if (res.success && res.data?.participants) {
      setSessionParticipants(res.data.participants);
    }
  };

  useEffect(() => {
    fetchSessionParticipants();
    const interval = setInterval(fetchSessionParticipants, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

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

  // Generate Invite QR Code
  useEffect(() => {
    if (showInviteModal) {
      const shareUrl = `${window.location.origin}/?shareSession=${sessionId}&token=${token}`;
      QRCode.toDataURL(shareUrl, {
        width: 260,
        margin: 2,
        color: { dark: '#10b981', light: '#0f172a' }
      })
        .then(url => setQrImageSrc(url))
        .catch(err => console.error('QR generation error:', err));
    }
  }, [showInviteModal, sessionId, token]);

  // Leaflet Mini Map Multi-Participant Rendering
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

    // Render markers for all session participants
    const activeCoords: Array<[number, number]> = [];

    sessionParticipants.forEach((part, index) => {
      if (!part.location || part.status === 'STOPPED') {
        if (participantMarkersRef.current[part.participantId]) {
          participantMarkersRef.current[part.participantId].marker.remove();
          if (participantMarkersRef.current[part.participantId].circle) {
            participantMarkersRef.current[part.participantId].circle?.remove();
          }
          delete participantMarkersRef.current[part.participantId];
        }
        return;
      }

      const { lat, lon, accuracy } = part.location;
      activeCoords.push([lat, lon]);

      const isMe = part.participantId === myParticipantId;
      const markerColor = isMe ? '#ef4444' : part.color || (index === 1 ? '#3b82f6' : '#10b981');
      const badgeIcon = isMe ? '🔴' : index === 1 ? '🔵' : '🟢';

      const icon = L.divIcon({
        className: `participant-marker-${part.participantId}`,
        html: `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full border-2 border-white shadow-2xl text-white font-black text-xs" style="background-color: ${markerColor}">
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full animate-ping" style="background-color: ${markerColor}"></span>
            ${badgeIcon}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (!participantMarkersRef.current[part.participantId]) {
        const marker = L.marker([lat, lon], { icon }).addTo(map);
        marker.bindPopup(`
          <div class="p-2 text-xs font-sans">
            <strong style="color:${markerColor}" class="font-bold text-sm block">${part.label || part.participantId} ${isMe ? '(Me)' : ''}</strong>
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
        if (entry.circle) {
          entry.circle.setLatLng([lat, lon]);
          if (accuracy) entry.circle.setRadius(accuracy);
        }
      }
    });

    if (activeCoords.length > 0) {
      if (activeCoords.length === 1) {
        map.setView(activeCoords[0], 15);
      } else {
        const bounds = L.latLngBounds(activeCoords);
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      }
      map.invalidateSize();
    }
  }, [sessionParticipants, currentLocation, myParticipantId]);

  // Start Real Mobile Phone GPS Watcher
  const handleStartSharing = () => {
    setSharingStatus('CONNECTING');
    setErrorMessage(null);

    if (!navigator.geolocation) {
      setErrorMessage('Geolocation API is not supported by your browser.');
      setSharingStatus('ERROR');
      return;
    }

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
        speed: typeof speed === 'number' ? Number((speed * 3.6).toFixed(1)) : null,
        heading: typeof heading === 'number' ? Number(heading.toFixed(1)) : null,
        timestamp
      };

      setCurrentLocation(locData);
      setLastUpdatedSecAgo(0);
      setUpdateCount(prev => prev + 1);
      setSharingStatus('LIVE');

      // Transmit REAL GPS telemetry payload to backend with participantId & label
      const res = await sendRealGPSUpdate({
        sessionId,
        token,
        participantId: myParticipantId,
        label: myLabel,
        lat: latitude,
        lon: longitude,
        accuracy: locData.accuracy,
        speed: locData.speed,
        heading: locData.heading,
        timestamp
      });

      if (res.success) {
        fetchSessionParticipants();
      } else if (res.sessionStatus === 'STOPPED') {
        handleStopSharing();
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

  // Stop Sharing GPS (Only stops my participant)
  const handleStopSharing = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharingStatus('STOPPED');
    await stopQRLiveTrackingSession(sessionId, token, myParticipantId);
    fetchSessionParticipants();
  };

  // Exit session (Stops sharing & invokes onExit)
  const handleExitSession = async () => {
    await handleStopSharing();
    if (onExit) onExit();
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3 sm:p-5 font-sans">
      {/* Header Banner */}
      <header className="max-w-md mx-auto w-full bg-slate-900 border border-slate-800 p-3.5 rounded-3xl shadow-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400">
            <Radio className="w-5 h-5 animate-pulse text-emerald-400" />
          </span>
          <div>
            <h1 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5">
              MULTI-PERSON LIVE GPS
            </h1>
            <p className="text-[10px] text-slate-400">Session {sessionId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1 shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            Invite
          </button>

          <button
            onClick={handleExitSession}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
            title="Exit Session"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto w-full my-3 space-y-3.5">
        {/* Session & Participant Label Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-xl space-y-3 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">Session Token</span>
              <strong className="text-rose-400 font-mono text-sm">{sessionId}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">My Status</span>
              {sharingStatus === 'LIVE' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-black animate-pulse">
                  ● LIVE
                </span>
              ) : sharingStatus === 'STOPPED' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-extrabold">
                  ⏹️ STOPPED
                </span>
              ) : sharingStatus === 'CONNECTING' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-extrabold">
                  <RefreshCw className="w-3 h-3 animate-spin" /> ACQUIRING...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold">
                  READY
                </span>
              )}
            </div>
          </div>

          {/* Device Participant Tag / Label */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold text-slate-400 uppercase">My Device Label:</label>
            <input
              type="text"
              value={myLabel}
              onChange={e => {
                const val = e.target.value;
                setMyLabel(val);
                localStorage.setItem(`js_plabel_${sessionId}`, val);
              }}
              placeholder="e.g. Phone A (Host) or Friend B"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
            />
          </div>

          {/* Android Location Permission Notice */}
          {sharingStatus === 'IDLE' && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1.5 text-xs text-slate-300">
              <p className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                Join Live Location Session
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Tap <strong className="text-white">"ALLOW GPS & START LIVE SHARING"</strong>. Android Chrome will ask:
                <em className="block text-emerald-300 font-sans my-1 bg-slate-900 p-2 rounded border border-slate-800 text-[10px]">
                  "Allow Jeevan Setu to access your device's location?"
                </em>
                Tap <strong className="text-emerald-400">Allow</strong> to stream your GPS location to this authorized session.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-950/90 border border-rose-800 text-rose-200 rounded-2xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          {sharingStatus !== 'LIVE' && sharingStatus !== 'CONNECTING' ? (
            <button
              onClick={handleStartSharing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-950 transition uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
            >
              <Compass className="w-4 h-4" />
              [ ALLOW GPS & START LIVE SHARING ]
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleStopSharing}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-2xl shadow-xl shadow-rose-950 transition uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95"
              >
                <XCircle className="w-4 h-4" />
                🛑 STOP SHARING
              </button>

              <button
                onClick={handleExitSession}
                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl border border-slate-700 shrink-0"
              >
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Active Session Participants List */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-400" />
              Active Session Participants ({sessionParticipants.length})
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">● Auto-Syncing 3s</span>
          </div>

          <div className="space-y-2">
            {sessionParticipants.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl">
                No active participants yet. Tap "Invite" above to share QR with Friend B.
              </div>
            ) : (
              sessionParticipants.map((part, pIdx) => {
                const isMe = part.participantId === myParticipantId;
                return (
                  <div
                    key={part.participantId}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: isMe ? '#ef4444' : part.color || '#3b82f6' }}
                        ></span>
                        <strong className="text-white text-xs">
                          {part.label || part.participantId} {isMe ? '(Me)' : ''}
                        </strong>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                          part.status === 'LIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : part.status === 'STALE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {part.status}
                        </span>
                      </div>

                      {part.location ? (
                        <div className="text-[10px] text-slate-400 space-x-2">
                          <span>Lat: <strong className="text-slate-200">{part.location.lat.toFixed(4)}</strong></span>
                          <span>Lon: <strong className="text-slate-200">{part.location.lon.toFixed(4)}</strong></span>
                          <span>Acc: <strong className="text-emerald-400">±{part.location.accuracy}m</strong></span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic block">Waiting for GPS fix...</span>
                      )}
                    </div>

                    {isMe && sharingStatus === 'LIVE' && (
                      <button
                        onClick={handleStopSharing}
                        className="px-2.5 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[10px] font-bold"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Telemetry Mini Map Card */}
        {currentLocation && (
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold uppercase text-white flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Live Multi-Participant Map
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Pings Sent: <strong className="text-emerald-400">{updateCount}</strong>
              </span>
            </div>

            <div
              ref={mapContainerRef}
              className="w-full h-48 rounded-2xl overflow-hidden border border-slate-800 relative z-0"
            ></div>
          </div>
        )}
      </main>

      {/* INVITE PARTICIPANT QR MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white">Invite Participant (Friend B)</h3>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-center flex flex-col items-center justify-center space-y-3">
              <p className="text-xs text-slate-300">Scan this QR Code on <strong>Phone B</strong> to join this SAME live session:</p>
              {qrImageSrc ? (
                <div className="p-2 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-lg">
                  <img src={qrImageSrc} alt="Invite Participant QR" className="w-52 h-52 rounded-lg" />
                </div>
              ) : (
                <div className="py-8 text-xs text-slate-400">Generating invite QR...</div>
              )}

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/?shareSession=${sessionId}&token=${token}`);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2000);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedInvite ? 'Link Copied!' : 'Copy Share Session Link'}
              </button>
            </div>

            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-slate-500 font-mono pt-1">
        <p className="flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-slate-500" />
          Protected by Jeevan Setu Session Isolation Protocol
        </p>
      </footer>
    </div>
  );
};
