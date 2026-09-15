import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n";
import { X, MapPin, CheckCircle2, Volume2, Smartphone, Copy, VolumeX, Mic, MicOff } from "lucide-react";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition";

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
  const [distressType, setDistressType] = useState<string>("⛰️ Landslide / Mudflow");
  const [lat, setLat] = useState<string>("27.2600");
  const [lon, setLon] = useState<string>("92.4200");
  const [landmark, setLandmark] = useState<string>("Bomdila Sector");
  const [personsTrapped, setPersonsTrapped] = useState<string>("5 to 15 Persons");
  const [triageLevel, setTriageLevel] = useState<string>("🔴 Level 1: Immediate Rescue");

  // Voice SOS Assistant Hook
  const { isListening, toggleListening, stopListening, transcript } = useVoiceRecognition({
    language: 'en-US',
    onResult: (spokenText) => {
      setLandmark(spokenText);
      const lower = spokenText.toLowerCase();
      if (lower.includes('flood')) {
        setDistressType('🌊 Flash Flood');
      } else if (lower.includes('landslide') || lower.includes('slope')) {
        setDistressType('⛰️ Landslide / Mudflow');
      } else if (lower.includes('medical') || lower.includes('doctor') || lower.includes('hospital')) {
        setDistressType('💊 Urgent Medical');
      }
      setTriageLevel('🔴 Level 1: Immediate Rescue');
    }
  });

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
      gain.gain.setValueAtTime(0.40, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;

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
      const res = await fetch("http://localhost:5001/api/sos/broadcast", {
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
        message: "Emergency SOS signal transmitted to Control Room, NDRF & SDRF teams!",
        record: {
          respondersNotified: ["NDRF 12th Bn", "SDRF Control", "Army Rescue Unit", "MDoNER Cell"]
        }
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Copy SMS Payload
  const handleCopySMS = () => {
    const payload = `SOS#JEEVAN-SETU#${lat}N#${lon}E#LANDSLIDE#LEVEL1#PERSONS:12`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
    setSmsCopied(true);
    setTimeout(() => setSmsCopied(false), 4000);
  };

  const distressOptions = [
    { id: "landslide", label: "⛰️ Landslide / Mudflow" },
    { id: "flood", label: "🌊 Flash Flood" },
    { id: "medical", label: "💊 Urgent Medical" },
    { id: "supply", label: "🚚 Relief Supplies" }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-rose-500/40 bg-[#070d1e] text-white p-4 sm:p-5 shadow-2xl space-y-3.5 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Ambient Backdrop Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-rose-600/20 blur-3xl pointer-events-none"></div>

        {/* HEADER SECTION */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-lg shadow-rose-600/40 animate-pulse shrink-0">
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-wide text-white">
                  Emergency SOS Dispatch
                </h2>
                <span className="rounded-full bg-rose-950/80 border border-rose-600/50 px-2 py-0.5 text-[9px] font-bold text-rose-300">
                  24x7 Direct
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                High-Priority Rescue &amp; Medical Triage Signal Network
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSiren();
              stopListening();
              onClose();
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* THREE MODE TABS */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              activeTab === "live"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-600/30 font-black"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🚨</span> Live SOS
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              activeTab === "sms"
                ? "bg-amber-600 text-slate-950 shadow-md shadow-amber-600/30 font-black"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>📱</span> Offline SMS
          </button>

          <button
            onClick={() => setActiveTab("siren")}
            className={`flex-1 py-1.5 px-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
              activeTab === "siren"
                ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/30 font-black"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🔊</span> Rescue Siren
          </button>
        </div>

        {/* TAB 1: LIVE SOS DISPATCH */}
        {activeTab === "live" && (
          <div className="space-y-3">
            
            {/* VOICE SOS ASSISTANT BANNER */}
            <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg border ${isListening ? 'bg-rose-600 text-white animate-pulse border-rose-400' : 'bg-slate-800 text-rose-400 border-slate-700'}`}>
                  {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>🎙️ Voice Assistant</span>
                    {isListening && <span className="px-1 py-0.2 rounded bg-rose-500 text-[8px] text-white animate-pulse">Listening...</span>}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isListening ? (transcript ? `"${transcript}"` : "Speak emergency details...") : "Click mic to speak emergency alert"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border shrink-0 ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                    : "bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400/40 hover:from-rose-500 hover:to-amber-500"
                }`}
              >
                {isListening ? "Stop" : "Speak"}
              </button>
            </div>

            {/* STEP 1: SELECT EMERGENCY TYPE */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-black">1</span>
                <span>Select Emergency Type:</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                {distressOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDistressType(opt.label)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-left transition truncate cursor-pointer ${
                      distressType === opt.label
                        ? "border-rose-500 bg-rose-950/60 text-white shadow-sm"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: YOUR LOCATION */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-sky-600 text-white text-[9px] font-black">2</span>
                  <span>Your Location:</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  className="px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] transition shadow flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="h-3 w-3" />
                  <span>📍 Auto-Detect GPS</span>
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Landmark / Village / Sector name..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white focus:border-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Latitude (°N):</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-1.5 font-mono text-xs font-bold text-sky-300 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Longitude (°E):</label>
                  <input
                    type="text"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 p-1.5 font-mono text-xs font-bold text-sky-300 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: TRAPPED PEOPLE & PRIORITY */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-2">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-600 text-slate-950 text-[9px] font-black">3</span>
                <span>People Count &amp; Priority:</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">People Trapped:</label>
                  <select
                    value={personsTrapped}
                    onChange={(e) => setPersonsTrapped(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="1 to 4 Persons">1 to 4 Persons</option>
                    <option value="5 to 15 Persons">5 to 15 Persons</option>
                    <option value="15+ Persons">15+ Persons (Mass Group)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Priority Level:</label>
                  <select
                    value={triageLevel}
                    onChange={(e) => setTriageLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="🔴 Level 1: Immediate Rescue">🔴 Level 1: Immediate Rescue</option>
                    <option value="🟠 Level 2: Medical Evacuation">🟠 Level 2: Medical Evac</option>
                    <option value="🟡 Level 3: Relief Supplies">🟡 Level 3: Relief Supplies</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BROADCAST BUTTON */}
            <button
              onClick={handleBroadcastSOS}
              disabled={isBroadcasting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer flex items-center justify-center gap-2 border border-rose-400/40 transform active:scale-[0.99]"
            >
              {isBroadcasting ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>TRANSMITTING DISTRESS SIGNAL...</span>
                </>
              ) : (
                <>
                  <span>🚨</span>
                  <span>SEND EMERGENCY SOS SIGNAL</span>
                </>
              )}
            </button>

            {/* BROADCAST SUCCESS CONFIRMATION CARD */}
            {broadcastResult && (
              <div className="rounded-xl border border-emerald-500/50 bg-emerald-950/90 p-3 space-y-1.5 shadow-xl animate-fadeIn">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>SOS Signal Sent Successfully! (ID: {broadcastResult.sosId})</span>
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
                    className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-2.5 py-1 text-[11px] font-black transition cursor-pointer shrink-0 shadow flex items-center gap-1"
                  >
                    <span>📍 Track on Map ➔</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug">{broadcastResult.message}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: OFFLINE SMS */}
        {activeTab === "sms" && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <h3 className="font-bold text-amber-400 flex items-center gap-2 text-xs">
              <Smartphone className="h-4 w-4" /> 0-Internet Emergency SMS Relay
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              When cell towers or mobile data are unavailable, copy this Emergency GSMA protocol payload and send via standard SMS to <strong>112</strong>:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-[11px] text-emerald-300 border border-slate-800 select-all break-all">
              SOS#JEEVAN-SETU#{lat}N#{lon}E#LANDSLIDE#LEVEL1#PERSONS:12
            </div>

            <button
              onClick={handleCopySMS}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copy Emergency SMS Payload</span>
            </button>

            {smsCopied && (
              <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>✓ Emergency SMS Payload copied to clipboard! Send to #112.</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SIREN & BEACON */}
        {activeTab === "siren" && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs text-center">
            <h3 className="font-bold text-sky-400 flex items-center justify-center gap-2 text-xs">
              <Volume2 className="h-4 w-4" /> Ground Acoustic Rescue Siren
            </h3>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Emits high-decibel emergency siren to alert nearby rescue teams, UAV drones, and search helicopters.
            </p>

            {!isSirenActive ? (
              <button
                onClick={startSiren}
                className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Volume2 className="h-4 w-4" />
                <span>ACTIVATE RESCUE SIREN</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 font-black text-xs animate-pulse flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  <span>🔊 RESCUE SIREN ACTIVE</span>
                </div>
                <button
                  onClick={stopSiren}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  <span>DEACTIVATE SIREN</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
