import React, { useState } from 'react';
import { X, Mic, MicOff, Sparkles, Navigation, ShieldAlert, CloudRain, Building2, Camera, Volume2, ArrowRight } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onTriggerSOS: () => void;
}

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  onNavigate,
  onTriggerSOS
}: VoiceAssistantModalProps) {
  if (!isOpen) return null;

  const [selectedLang, setSelectedLang] = useState<'hi-IN' | 'en-IN' | 'as-IN' | 'bn-IN'>('hi-IN');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('माइक पर क्लिक करें और बोलें (या नीचे बने कार्ड्स दबाएँ)...');

  const processSpokenCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('sos') || lower.includes('help') || lower.includes('madad') || lower.includes('emergency') || lower.includes('मदद')) {
      setFeedbackMsg(`🚨 आपातकालीन मदद (Emergency SOS) एक्टिवेट हो रहा है...`);
      setTimeout(() => {
        onClose();
        onTriggerSOS();
      }, 1000);
    } else if (lower.includes('monitoring') || lower.includes('disaster') || lower.includes('shillong') || lower.includes('आपदा')) {
      setFeedbackMsg(`🛰️ आपदा मॉनिटरिंग सेंटर (Disaster Monitoring) पर ले जाया जा रहा है...`);
      setTimeout(() => {
        onClose();
        onNavigate('smartmonitoring');
      }, 1000);
    } else if (lower.includes('map') || lower.includes('naksha') || lower.includes('satellite') || lower.includes('नक्शा')) {
      setFeedbackMsg(`🗺️ लाइव सैटेलाइट नक्शा (Live GIS Map) खोला जा रहा है...`);
      setTimeout(() => {
        onClose();
        onNavigate('map');
      }, 1000);
    } else if (lower.includes('weather') || lower.includes('mausam') || lower.includes('rain') || lower.includes('मौसम')) {
      setFeedbackMsg(`🌧️ मौसम इंटेलिजेंस सेंटर (Weather Center) खोला जा रहा है...`);
      setTimeout(() => {
        onClose();
        onNavigate('weather');
      }, 1000);
    } else if (lower.includes('relief') || lower.includes('camp') || lower.includes('rahat') || lower.includes('राहत')) {
      setFeedbackMsg(`⛺ राहत शिविर ग्रिड (Relief Camps) खोला जा रहा है...`);
      setTimeout(() => {
        onClose();
        onNavigate('reliefcamps');
      }, 1000);
    } else if (lower.includes('damage') || lower.includes('assessment') || lower.includes('ai') || lower.includes('नुकसान')) {
      setFeedbackMsg(`🤖 AI नुकसान रिपोर्ट (AI Assessment) खोली जा रही है...`);
      setTimeout(() => {
        onClose();
        onNavigate('aiimpact');
      }, 1000);
    } else {
      setFeedbackMsg(`बोला गया: "${text}" — कमांड को ऐप में सर्च किया जा रहा है...`);
    }
  };

  const { isListening, toggleListening, transcript } = useVoiceRecognition({
    language: selectedLang,
    onResult: (text) => {
      processSpokenCommand(text);
    }
  });

  const voiceCards = [
    {
      title: "🚨 आपातकालीन मदद (Emergency SOS)",
      sub: 'बोलें: "मदद चाहिए" / "SOS Help"',
      color: "border-rose-500/50 bg-gradient-to-r from-rose-950/60 to-slate-900 text-rose-300 hover:border-rose-400",
      action: () => processSpokenCommand("Emergency SOS Help madad")
    },
    {
      title: "🛰️ आपदा मॉनिटरिंग (Disaster Monitoring)",
      sub: 'बोलें: "आपदा मॉनिटरिंग" / "Disaster"',
      color: "border-sky-500/50 bg-gradient-to-r from-sky-950/60 to-slate-900 text-sky-300 hover:border-sky-400",
      action: () => processSpokenCommand("Smart Disaster Monitoring")
    },
    {
      title: "🗺️ लाइव नक्शा (Live GIS Map)",
      sub: 'बोलें: "नक्शा खोलो" / "Live Map"',
      color: "border-indigo-500/50 bg-gradient-to-r from-indigo-950/60 to-slate-900 text-indigo-300 hover:border-indigo-400",
      action: () => processSpokenCommand("Live GIS Map satellite")
    },
    {
      title: "🌧️ मौसम रिपोर्ट (Weather Telemetry)",
      sub: 'बोलें: "मौसम जानकारी" / "Weather"',
      color: "border-cyan-500/50 bg-gradient-to-r from-cyan-950/60 to-slate-900 text-cyan-300 hover:border-cyan-400",
      action: () => processSpokenCommand("Weather report mausam")
    },
    {
      title: "⛺ राहत शिविर (Relief Camps Finder)",
      sub: 'बोलें: "राहत शिविर" / "Relief Camps"',
      color: "border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 to-slate-900 text-emerald-300 hover:border-emerald-400",
      action: () => processSpokenCommand("Relief camp rahat camp")
    },
    {
      title: "🤖 एआई नुकसान रिपोर्ट (AI Assessment)",
      sub: 'बोलें: "नुकसान रिपोर्ट" / "AI Damage"',
      color: "border-purple-500/50 bg-gradient-to-r from-purple-950/60 to-slate-900 text-purple-300 hover:border-purple-400",
      action: () => processSpokenCommand("AI damage assessment report")
    }
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl border border-sky-500/50 bg-slate-900 p-6 shadow-2xl space-y-5 text-white">
        
        {/* HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-600 to-purple-600 shadow-lg shadow-sky-500/40">
              <span className="text-2xl">🎙️</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  JEEVAN-SETU AI VOICE ASSISTANT
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  LIVE VOICE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                आवाज़ से आपातकालीन मदद माँगें या ऐप के किसी भी फ़ीचर पर जाएँ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition border border-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LANGUAGE SELECTION */}
        <div className="flex items-center justify-between text-xs bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Volume2 className="h-4 w-4 text-sky-400" />
            <span>बोली जाने वाली भाषा (Voice Language):</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { code: 'hi-IN', name: '🇮🇳 हिंदी' },
              { code: 'en-IN', name: '🇬🇧 English' },
              { code: 'as-IN', name: 'অসমীয়া' },
              { code: 'bn-IN', name: 'বাংলা' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code as any)}
                className={`px-3 py-1 rounded-xl font-bold text-xs transition cursor-pointer ${
                  selectedLang === l.code
                    ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* CENTRAL INTERACTIVE MIC DISPLAY */}
        <div className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border transition ${
          isListening
            ? 'border-rose-500 bg-gradient-to-b from-rose-950/40 via-slate-950 to-slate-950 shadow-2xl shadow-rose-600/30'
            : 'border-slate-800 bg-slate-950/80'
        }`}>
          {/* BIG MIC BUTTON */}
          <button
            onClick={toggleListening}
            className={`relative flex h-24 w-24 items-center justify-center rounded-full transition transform active:scale-95 cursor-pointer shadow-2xl mb-4 ${
              isListening
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white animate-pulse ring-8 ring-rose-500/40 scale-105'
                : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white hover:scale-105 ring-4 ring-sky-500/30'
            }`}
          >
            {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
          </button>

          {/* STATUS DISPLAY */}
          <div className="text-center space-y-1.5 max-w-md">
            <div className={`text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
              isListening ? 'text-rose-400 animate-pulse' : 'text-sky-400'
            }`}>
              <Sparkles className="h-4 w-4" />
              <span>{isListening ? '🔴 सुन रहा है... अपनी बात बोलें (LISTENING NOW)' : '🎤 माइक दबाएँ और अपनी बात बोलें'}</span>
            </div>
            
            <div className="text-xs font-mono text-slate-200 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl min-h-[38px] flex items-center justify-center text-center shadow-inner">
              {transcript ? <span className="font-bold text-sky-300">"{transcript}"</span> : feedbackMsg}
            </div>
          </div>
        </div>

        {/* 6 VISUAL INTERACTIVE FEATURE CARDS */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>💡 1-क्लिक टेस्ट (या बोलकर चलाएँ):</span>
            <span className="text-[10px] text-sky-400 font-mono">Instant Voice Command Trigger</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {voiceCards.map((card, idx) => (
              <button
                key={idx}
                onClick={card.action}
                className={`p-3 rounded-2xl border text-left transition transform hover:-translate-y-0.5 shadow-md flex items-center justify-between cursor-pointer ${card.color}`}
              >
                <div>
                  <div className="text-xs font-black tracking-wide">{card.title}</div>
                  <div className="text-[10px] opacity-80 mt-0.5 font-mono">{card.sub}</div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 opacity-70" />
              </button>
            ))}
          </div>
        </div>

        {/* EASY HOW-TO GUIDE FOOTER */}
        <div className="flex items-center justify-around text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-3">
          <span className="flex items-center gap-1">1️⃣ माइक दबाएँ</span>
          <span>➔</span>
          <span className="flex items-center gap-1">2️⃣ बोलें (कमांड / मदद)</span>
          <span>➔</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">3️⃣ 1-सेकंड में ऑटो नेविगेट</span>
        </div>

      </div>
    </div>
  );
}
