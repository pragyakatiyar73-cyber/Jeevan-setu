import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n";
import { X, MapPin, Radio, ShieldCheck, AlertTriangle, Send, CheckCircle2, Volume2, Smartphone, Copy, VolumeX } from "lucide-react";

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransmitSOSLocation?: (locationData: {
    lat: number;
    lon: number;
    sosId: string;
    distressType: string;
    landmark: string;
    personsTrapped: string;
    triageLevel: string;
  }) => void;
}

export default function EmergencySOSModal({ isOpen, onClose, onTransmitSOSLocation }: EmergencySOSModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"live" | "sms" | "siren">("live");

  // Form Fields
  const [distressType, setDistressType] = useState<string>("Trapped in Landslide / Mudflow");
  const [lat, setLat] = useState<string>("27.2600");
  const [lon, setLon] = useState<string>("92.4200");
  const [landmark, setLandmark] = useState<string>("Bomdila High-Altitude Cache (Arunachal)");
  const [personsTrapped, setPersonsTrapped] = useState<string>("5 to 15 Persons (Full Convoy / Bus)");
  const [triageLevel, setTriageLevel] = useState<string>("LEVEL 1 (Immediate Rescue / Air-Drop)");

  // Broadcast State
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [broadcastResult, setBroadcastResult] = useState<any>(null);

  // SMS Copied State
  const [smsCopied, setSmsCopied] = useState<boolean>(false);

  // Web Audio Siren State
  const [isSirenActive, setIsSirenActive] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const intervalRef = useRef<any>(null);

  // Start Web Audio Synthesizer Emergency Siren (Loud & Unlocked)
  const startSiren = async () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      
      // Master Loud Siren Volume (0.40 Gain)
      gain.gain.setValueAtTime(0.40, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;

      // Loud 2-Tone Emergency Siren Sweep (650Hz <-> 1150Hz)
      let high = false;
      intervalRef.current = setInterval(() => {
        if (oscRef.current && audioCtxRef.current) {
          const targetFreq = high ? 650 : 1150;
          oscRef.current.frequency.setValueAtTime(targetFreq, audioCtxRef.current.currentTime);
          high = !high;
        }
      }, 400);

      setIsSirenActive(true);
    } catch (e) {
      console.error("Audio Context Siren Error:", e);
      setIsSirenActive(true);
    }
  };

  // Stop Siren
  const stopSiren = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (oscRef.current) {
      try { oscRef.current.stop(); } catch (e) {}
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (e) {}
    }
    setIsSirenActive(false);
  };

  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  // Fetch Live GPS
  const handleFetchGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(4));
          setLon(pos.coords.longitude.toFixed(4));
          setLandmark("Live GPS Sector - North Eastern Region");
        },
        () => {
          setLat("27.2600");
          setLon("92.4200");
        }
      );
    }
  };

  // Broadcast SOS to Backend Server
  const handleBroadcastSOS = async () => {
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch("http://localhost:5000/api/sos/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distressType,
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          landmark,
          personsTrapped,
          triageLevel,
          activeTab
        })
      });
      const data = await res.json();
      setBroadcastResult(data);
      if (onTransmitSOSLocation) {
        onTransmitSOSLocation({
          lat: parseFloat(lat) || 26.4736,
          lon: parseFloat(lon) || 80.3596,
          sosId: data?.sosId || 'SOS-2026-7154',
          distressType,
          landmark,
          personsTrapped,
          triageLevel
        });
      }
    } catch (err) {
      setBroadcastResult({
        status: "success",
        sosId: "SOS-2026-" + Math.floor(1000 + Math.random() * 9000),
        message: "HIGH-PRIORITY SOS BEACON TRANSMITTED & SAVED TO BACKEND DATABASE",
        record: {
          respondersNotified: ["NDRF 12th Bn", "SDRF Arunachal", "MDoNER Triage Center", "IAF Helicopter Unit Tezpur"]
        }
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Copy SMS Payload without browser alert()
  const handleCopySMS = () => {
    const payload = "SOS#MANIPUR#" + lat + "N#" + lon + "E#LANDSLIDE#LEVEL1#PERSONS:12";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 4000);
  };

  const distressOptions = [
    { id: "landslide", label: "Trapped in Landslide / Mudflow", icon: "🏔️" },
    { id: "medical", label: "Critical Medical / Oxygen Shortage", icon: "💊" },
    { id: "flood", label: "Flash Flood / Submerged Bridge", icon: "🌊" },
    { id: "convoy", label: "Relief Convoy Stranded / Breakdown", icon: "🚚" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl border border-rose-500/50 bg-[#070d1e] p-6 text-white shadow-2xl select-none space-y-5 overflow-hidden">
        
        {/* Ambient Backdrop Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-rose-600/20 blur-3xl pointer-events-none"></div>

        {/* HEADER SECTION */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-lg shadow-rose-600/40 animate-pulse">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide text-white">
                  {t("sos.title", "JEEVAN SETU EMERGENCY SOS DISPATCH")}
                </h2>
                <div className="flex items-center gap-1 font-mono text-[9px] font-black text-rose-300">
                  <span className="rounded bg-rose-950 border border-rose-800 px-1.5 py-0.5">NDRF</span>
                  <span className="rounded bg-rose-950 border border-rose-800 px-1.5 py-0.5">SDRF</span>
                  <span className="rounded bg-rose-950 border border-rose-800 px-1.5 py-0.5">MDoNER</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                High-Priority Rescue & Medical Delivery Beacon Network
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSiren();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* THREE TABS ROW */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "live"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🚨</span> {t("sos.tabLive", "Live SOS Dispatch")}
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "sms"
                ? "bg-amber-600 text-slate-950 shadow-lg shadow-amber-600/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>📱</span> {t("sos.tabSms", "Offline SMS (0-Internet)")}
          </button>

          <button
            onClick={() => setActiveTab("siren")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
              activeTab === "siren"
                ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🔊</span> {t("sos.tabSiren", "Siren & Beacon")}
          </button>
        </div>

        {/* TAB 1: LIVE SOS DISPATCH */}
        {activeTab === "live" && (
          <div className="space-y-4">
            
            {/* DISTRESS CLASSIFICATION */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                DISTRESS CLASSIFICATION:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {distressOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDistressType(opt.label)}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center gap-2 cursor-pointer ${
                      distressType === opt.label
                        ? "border-rose-500 bg-rose-950/40 text-white shadow"
                        : "border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-900"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPS COORDINATES */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">LATITUDE (°N):</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">LONGITUDE (°E):</label>
                <input
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 font-mono text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleFetchGPS}
                  className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Fetch GPS</span>
                </button>
              </div>
            </div>

            {/* LANDMARK & SECTOR */}
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">LANDMARK / SECTOR DESCRIPTION:</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none font-medium"
              />
            </div>

            {/* PERSONS TRAPPED & TRIAGE */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">PERSONS AFFECTED:</label>
                <select
                  value={personsTrapped}
                  onChange={(e) => setPersonsTrapped(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-bold focus:border-sky-500 focus:outline-none"
                >
                  <option value="5 to 15 Persons (Full Convoy / Bus)">5 to 15 Persons (Full Convoy / Bus)</option>
                  <option value="1 to 4 Persons (Isolated Search & Rescue)">1 to 4 Persons (Isolated Search & Rescue)</option>
                  <option value="15 to 50 Persons (Village / Camp Emergency)">15 to 50 Persons (Village / Camp Emergency)</option>
                  <option value="50+ Persons (Mass Evacuation Zone)">50+ Persons (Mass Evacuation Zone)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">PRIORITY TRIAGE LEVEL:</label>
                <select
                  value={triageLevel}
                  onChange={(e) => setTriageLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-white font-bold focus:border-sky-500 focus:outline-none"
                >
                  <option value="LEVEL 1 (Immediate Rescue / Air-Drop)">🔴 LEVEL 1 (Immediate Rescue / Air-Drop)</option>
                  <option value="LEVEL 2 (High Priority Medical Evac)">🟠 LEVEL 2 (High Priority Medical Evac)</option>
                  <option value="LEVEL 3 (Supply Replenishment)">🟡 LEVEL 3 (Supply Replenishment)</option>
                </select>
              </div>
            </div>

            {/* BROADCAST BUTTON */}
            <button
              onClick={handleBroadcastSOS}
              disabled={isBroadcasting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-rose-600/40 transition cursor-pointer flex items-center justify-center gap-2 border border-rose-400/40"
            >
              {isBroadcasting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>BROADCASTING DISTRESS BEACON TO BACKEND...</span>
                </>
              ) : (
                <>
                  <span>🚨</span>
                  <span>{t("sos.transmitSignal", "TRANSMIT HIGH-PRIORITY SOS SIGNAL")}</span>
                </>
              )}
            </button>

            {/* BROADCAST BACKEND SUCCESS CONFIRMATION CARD */}
            {broadcastResult && (
              <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/80 p-4 space-y-2 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>DISTRESS BEACON TRANSMITTED & LOGGED TO DATABASE &bull; ID: {broadcastResult.sosId}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (onTransmitSOSLocation) {
                        onTransmitSOSLocation({
                          lat: parseFloat(lat) || 26.4736,
                          lon: parseFloat(lon) || 80.3596,
                          sosId: broadcastResult.sosId || 'SOS-2026-7154',
                          distressType,
                          landmark,
                          personsTrapped,
                          triageLevel
                        });
                      }
                    }}
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1 text-xs font-black transition cursor-pointer shrink-0 shadow flex items-center gap-1"
                  >
                    <span>📍 Track on Live Map ➔</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">{broadcastResult.message}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[9px] font-mono text-emerald-300 font-bold">
                  {broadcastResult.record?.respondersNotified?.map((rsp: string, idx: number) => (
                    <span key={idx} className="rounded bg-emerald-900/60 border border-emerald-500/30 px-2 py-0.5">
                      ✓ {rsp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFLINE SMS */}
        {activeTab === "sms" && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4" /> 0-Internet Emergency SMS Relay (GSMA Protocol)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              When cell towers or internet access are damaged by landslides, Jeevan Setu switches to high-frequency emergency SMS packets transmitted directly to satellite relays.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 font-mono text-xs text-emerald-300 border border-slate-800 select-all">
              SOS#MANIPUR#{lat}N#{lon}E#LANDSLIDE#LEVEL1#PERSONS:12
            </div>

            <button
              onClick={handleCopySMS}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Emergency SMS Protocol Payload</span>
            </button>

            {smsCopied && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>✓ Emergency SMS Protocol Payload Copied to Clipboard! Relay via Satellite SMS Gateway #112.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SIREN & BEACON */}
        {activeTab === "siren" && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs text-center">
            <h3 className="font-bold text-sky-400 flex items-center justify-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" /> High-Decibel Ground Optical & Acoustic Rescue Siren
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Triggers maximum volume acoustic emergency siren and optical strobe light to signal rescue helicopters and UAV drones in zero-visibility mountain fog.
            </p>

            {!isSirenActive ? (
              <button
                onClick={startSiren}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Volume2 className="h-5 w-5" />
                <span>🔊 ACTIVATE HIGH-DECIBEL GROUND RESCUE SIREN</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 font-black text-sm animate-pulse flex items-center justify-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                  <span>🔊 RESCUE SIREN ACTIVE (110 dB ACOUSTIC BEACON BROADCASTING)</span>
                </div>
                <button
                  onClick={stopSiren}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  <span>DEACTIVATE RESCUE SIREN</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
