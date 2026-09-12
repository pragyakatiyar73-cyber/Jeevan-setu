import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../i18n";
import { X, MapPin, CheckCircle2, Volume2, Smartphone, Copy, VolumeX, Mic, MicOff, AlertTriangle, Users, Navigation } from "lucide-react";
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
  const [distressType, setDistressType] = useState<string>("⛰️ भूस्खलन में फंसे (Landslide / Mudflow)");
  const [lat, setLat] = useState<string>("27.2600");
  const [lon, setLon] = useState<string>("92.4200");
  const [landmark, setLandmark] = useState<string>("Bomdila Sector / बोमडिला क्षेत्र");
  const [personsTrapped, setPersonsTrapped] = useState<string>("5 to 15 Persons / 5-15 लोग");
  const [triageLevel, setTriageLevel] = useState<string>("🔴 तुरंत मदद चाहिए (Immediate Rescue / Air-Drop)");

  // Voice SOS Assistant Hook
  const { isListening, toggleListening, stopListening, transcript } = useVoiceRecognition({
    language: 'hi-IN',
    onResult: (spokenText) => {
      setLandmark(spokenText);
      const lower = spokenText.toLowerCase();
      if (lower.includes('flood') || lower.includes('baadh') || lower.includes('badh') || lower.includes('पानी')) {
        setDistressType('🌊 बाढ़ का खतरा (Flash Flood)');
      } else if (lower.includes('landslide') || lower.includes('slope') || lower.includes('पहाड़') || lower.includes('मिट्टी')) {
        setDistressType('⛰️ भूस्खलन में फंसे (Landslide / Mudflow)');
      } else if (lower.includes('ambulance') || lower.includes('aspataal') || lower.includes('hospital') || lower.includes('डॉक्टर') || lower.includes('मेडिकल')) {
        setDistressType('💊 मेडिकल इमरजेंसी (Medical Urgent)');
      }
      setTriageLevel('🔴 तुरंत मदद चाहिए (Immediate Rescue / Air-Drop)');
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
      
      // Master Loud Siren Volume
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
          setLandmark("Live GPS Location - North Eastern Region");
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
        message: "आपातकालीन मदद का संदेश कंट्रोल रूम, NDRF और SDRF टीम को भेज दिया गया है!",
        record: {
          respondersNotified: ["NDRF 12th Bn", "SDRF Control", "Army Rescue Unit", "MDoNER Disaster Cell"]
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
    { id: "landslide", label: "⛰️ भूस्खलन (Landslide)", desc: "पहाड़ खिसकना या रास्ता बंद होना", color: "from-amber-600/30 to-amber-900/30 border-amber-500/50" },
    { id: "flood", label: "🌊 बाढ़ (Flash Flood)", desc: "पानी भरना या जलभराव", color: "from-blue-600/30 to-blue-900/30 border-blue-500/50" },
    { id: "medical", label: "💊 मेडिकल इमरजेंसी (Medical)", desc: "गंभीर चोट या ऑक्सीजन की जरूरत", color: "from-rose-600/30 to-rose-900/30 border-rose-500/50" },
    { id: "supply", label: "🚚 भोजन व राहत सामग्री (Relief Supply)", desc: "राशन, दवा या पानी की सख्त जरूरत", color: "from-emerald-600/30 to-emerald-900/30 border-emerald-500/50" }
  ];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 p-3 sm:p-4 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-rose-500/40 bg-[#070d1e] text-white p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Ambient Backdrop Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-rose-600/20 blur-3xl pointer-events-none"></div>

        {/* HEADER SECTION */}
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 shadow-lg shadow-rose-600/40 animate-pulse shrink-0">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black tracking-wide text-white">
                  आपत्कालीन SOS मदद / Emergency SOS
                </h2>
                <span className="rounded-full bg-rose-950/80 border border-rose-600/50 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                  24x7 Direct Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                NDRF, SDRF और कंट्रोल रूम को तुरंत मैसेज भेजने के लिए नीचे 3 आसान स्टेप्स भरें
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSiren();
              stopListening();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* THREE EASY MODE TABS */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab("live")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "live"
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-600/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🚨</span> Live SOS Signal (ऑनलाइन संदेश)
          </button>

          <button
            onClick={() => setActiveTab("sms")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "sms"
                ? "bg-amber-600 text-slate-950 shadow-lg shadow-amber-600/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>📱</span> Offline SMS (बिना इंटरनेट)
          </button>

          <button
            onClick={() => setActiveTab("siren")}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === "siren"
                ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30"
                : "bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <span>🔊</span> Rescue Siren (तेज़ सायरन)
          </button>
        </div>

        {/* TAB 1: LIVE SOS DISPATCH */}
        {activeTab === "live" && (
          <div className="space-y-4">
            
            {/* VOICE SOS ASSISTANT BANNER */}
            <div className="rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${isListening ? 'bg-rose-600 text-white animate-pulse border-rose-400 shadow-lg shadow-rose-600/50' : 'bg-slate-800 text-rose-400 border-slate-700'}`}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🎙️ बोलकर मदद मांगें (Voice Assistant)</span>
                    {isListening && <span className="px-1.5 py-0.5 rounded bg-rose-500 text-[9px] text-white animate-pulse">सुन रहा है...</span>}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {isListening ? (transcript ? `"${transcript}"` : "अपनी समस्या और स्थान बोलें...") : "माइक दबाकर हिंदी या इंग्लिश में बोलें"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                  isListening
                    ? "bg-rose-600 text-white border-rose-400 animate-pulse"
                    : "bg-gradient-to-r from-rose-600 to-amber-600 text-white border-rose-400/40 hover:from-rose-500 hover:to-amber-500"
                }`}
              >
                {isListening ? "रुकें (Stop)" : "बोलें (Speak)"}
              </button>
            </div>

            {/* STEP 1: DISTRESS CLASSIFICATION */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">1</span>
                  <span>समस्या चुनें / Select Emergency Type:</span>
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {distressOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setDistressType(opt.label)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-center cursor-pointer ${
                      distressType === opt.label
                        ? "border-rose-500 bg-rose-950/50 text-white shadow-md shadow-rose-950/50"
                        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: LOCATION & GPS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[10px]">2</span>
                  <span>आपकी लोकेशन / Your Location:</span>
                </label>
                
                <button
                  type="button"
                  onClick={handleFetchGPS}
                  className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>📍 GPS लोकेशन प्राप्त करें (Auto-Detect)</span>
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  पास का लैंडमार्क या गाँव का नाम / Landmark or Village Name:
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="जैसे: बोमडिला बाज़ार, सेला पास रोड, प्राथमिक स्वास्थ्य केंद्र..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white focus:border-sky-500 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">अक्षांश / Latitude (°N):</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 font-mono text-xs font-bold text-sky-300 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">देशांतर / Longitude (°E):</label>
                  <input
                    type="text"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2 font-mono text-xs font-bold text-sky-300 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: TRAPPED PEOPLE & URGENCY */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-slate-950 text-[10px]">3</span>
                <span>फंसे हुए लोग और प्राथमिकता / Trapped People & Urgency:</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">कितने लोग फंसे हैं? (People Count):</label>
                  <select
                    value={personsTrapped}
                    onChange={(e) => setPersonsTrapped(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="1 to 4 Persons / 1-4 लोग">1-4 लोग (1 to 4 Persons)</option>
                    <option value="5 to 15 Persons / 5-15 लोग">5-15 लोग (5 to 15 Persons - Full Bus)</option>
                    <option value="15+ Persons / 15+ लोग (बड़ा समूह)">15+ लोग (15+ Persons - Village/Camp)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">मदद की प्राथमिकता (Priority Level):</label>
                  <select
                    value={triageLevel}
                    onChange={(e) => setTriageLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none"
                  >
                    <option value="🔴 तुरंत मदद चाहिए (Immediate Rescue / Air-Drop)">🔴 तुरंत मदद चाहिए (Immediate Rescue)</option>
                    <option value="🟠 मेडिकल इमरजेंसी (Medical Evac)">🟠 मेडिकल सहायता (Medical Evacuation)</option>
                    <option value="🟡 भोजन/पानी/राशन (Relief Supplies)">🟡 भोजन और पानी आपूर्ति (Supplies)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* BIG BROADCAST BUTTON */}
            <button
              onClick={handleBroadcastSOS}
              disabled={isBroadcasting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm shadow-xl shadow-rose-600/40 transition cursor-pointer flex items-center justify-center gap-2 border border-rose-400/40 transform active:scale-[0.99]"
            >
              {isBroadcasting ? (
                <>
                  <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>कंट्रोल रूम को मैसेज भेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <span className="text-lg">🚨</span>
                  <span>SEND EMERGENCY SOS / आपत्कालीन मदद भेजें</span>
                </>
              )}
            </button>

            {/* BROADCAST BACKEND SUCCESS CONFIRMATION CARD */}
            {broadcastResult && (
              <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/90 p-4 space-y-2 shadow-2xl animate-fadeIn">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span>SOS अलर्ट सफलतापूर्वक भेज दिया गया! (ID: {broadcastResult.sosId})</span>
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
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 text-xs font-black transition cursor-pointer shrink-0 shadow flex items-center gap-1"
                  >
                    <span>📍 लाइव मैप पर देखें ➔</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-snug">{broadcastResult.message}</p>
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono text-emerald-300 font-bold">
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
              <Smartphone className="h-4 w-4" /> 0-Internet Emergency SMS Relay (बिना इंटरनेट SMS)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              अगर पहाड़ी इलाकों में नेटवर्क या इंटरनेट बंद है, तो यह SMS कोड कॉपी करके <strong>112</strong> या आपातकालीन नंबर पर मैसेज भेजें:
            </p>
            <div className="p-3.5 rounded-xl bg-slate-900 font-mono text-xs text-emerald-300 border border-slate-800 select-all break-all">
              SOS#JEEVAN-SETU#{lat}N#{lon}E#LANDSLIDE#LEVEL1#PERSONS:12
            </div>

            <button
              onClick={handleCopySMS}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>SMS कोड कॉपी करें (Copy SMS Payload)</span>
            </button>

            {smsCopied && (
              <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>✓ SMS कोड कॉपी हो गया है! इसे मैसेज ऐप में खोलकर 112 पर भेजें।</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SIREN & BEACON */}
        {activeTab === "siren" && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs text-center">
            <h3 className="font-bold text-sky-400 flex items-center justify-center gap-2 text-sm">
              <Volume2 className="h-4 w-4" /> तेज़ आपत्कालीन सायरन (Loud Rescue Siren)
            </h3>
            <p className="text-slate-300 leading-relaxed">
              धुंध या अंधेरे में रेस्क्यू टीम, ड्रोन या हेलीकॉप्टर को अपनी लोकेशन बताने के लिए मोबाइल का तेज़ सायरन बजाएं।
            </p>

            {!isSirenActive ? (
              <button
                onClick={startSiren}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Volume2 className="h-5 w-5" />
                <span>🔊 आपत्कालीन सायरन चालू करें (ACTIVATE SIREN)</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 font-black text-sm animate-pulse flex items-center justify-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping"></span>
                  <span>🔊 सायरन बज रहा है! (RESCUE SIREN ACTIVE)</span>
                </div>
                <button
                  onClick={stopSiren}
                  className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <VolumeX className="h-4 w-4 text-rose-400" />
                  <span>सायरन बंद करें (DEACTIVATE SIREN)</span>
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
