import React, { useState } from 'react';
import { X, Mic, MicOff, Sparkles, Navigation, ShieldAlert, CloudRain, Building2, Camera, Compass } from 'lucide-react';
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
  const [feedback, setFeedback] = useState<string>('Click mic and speak your command or SOS alert...');

  const processSpokenCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('sos') || lower.includes('help') || lower.includes('madad') || lower.includes('emergency')) {
      setFeedback(`🚨 Emergency SOS Command Detected! Opening SOS Dispatch Modal...`);
      setTimeout(() => {
        onClose();
        onTriggerSOS();
      }, 1000);
    } else if (lower.includes('monitoring') || lower.includes('disaster') || lower.includes('shillong')) {
      setFeedback(`🛰️ Navigating to Smart Disaster Monitoring...`);
      setTimeout(() => {
        onClose();
        onNavigate('smartmonitoring');
      }, 1000);
    } else if (lower.includes('map') || lower.includes('naksha') || lower.includes('satellite')) {
      setFeedback(`🗺️ Opening Live Region 2D/3D GIS Map...`);
      setTimeout(() => {
        onClose();
        onNavigate('map');
      }, 1000);
    } else if (lower.includes('weather') || lower.includes('mausam') || lower.includes('rain')) {
      setFeedback(`🌧️ Navigating to Weather Intelligence...`);
      setTimeout(() => {
        onClose();
        onNavigate('weather');
      }, 1000);
    } else if (lower.includes('relief') || lower.includes('camp') || lower.includes('rahat')) {
      setFeedback(`⛺ Opening Relief Camp Grid...`);
      setTimeout(() => {
        onClose();
        onNavigate('reliefcamps');
      }, 1000);
    } else if (lower.includes('damage') || lower.includes('assessment') || lower.includes('ai')) {
      setFeedback(`🤖 Opening AI Damage Assessment...`);
      setTimeout(() => {
        onClose();
        onNavigate('aiimpact');
      }, 1000);
    } else {
      setFeedback(`Recognized: "${text}". Searching Jeevan-Setu grid...`);
    }
  };

  const { isListening, toggleListening, transcript } = useVoiceRecognition({
    language: selectedLang,
    onResult: (text) => {
      processSpokenCommand(text);
    }
  });

  const sampleCommands = [
    { label: "🚨 Emergency SOS Help", command: "Emergency SOS flood near Shillong" },
    { label: "🛰️ Smart Disaster Monitoring", command: "Open Smart Disaster Monitoring" },
    { label: "🗺️ Live Satellite GIS Map", command: "Show Live Map satellite view" },
    { label: "🌧️ Weather Intelligence", command: "Weather report in Tawang" },
    { label: "⛺ Relief Camp Grid", command: "Relief camp finder" },
    { label: "🤖 AI Damage Assessment", command: "AI damage assessment report" }
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-sky-500/40 bg-gradient-to-b from-slate-900 via-indigo-950/50 to-slate-950 p-6 shadow-2xl space-y-5 animate-fadeIn text-white">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/30">
              <span className="text-xl">🎙️</span>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">JEEVAN-SETU VOICE ASSISTANT</h3>
              <p className="text-[11px] text-slate-400 font-mono">Regional Speech Recognition & Voice Command System</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* LANGUAGE SELECTOR ROW */}
        <div className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span className="text-slate-400 font-bold">Select Voice Language:</span>
          <div className="flex items-center gap-1">
            {[
              { code: 'hi-IN', name: '🇮🇳 हिंदी' },
              { code: 'en-IN', name: '🇬🇧 English' },
              { code: 'as-IN', name: 'অসমীয়া' },
              { code: 'bn-IN', name: 'বাংলা' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => setSelectedLang(l.code as any)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                  selectedLang === l.code
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>
        </div>

        {/* CENTRAL GLOWING MIC BUTTON */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-5">
          <button
            onClick={toggleListening}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full transition transform active:scale-95 cursor-pointer shadow-2xl ${
              isListening
                ? 'bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white animate-pulse ring-8 ring-rose-500/30'
                : 'bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 text-white hover:scale-105 ring-4 ring-sky-500/20'
            }`}
          >
            {isListening ? <MicOff className="h-9 w-9" /> : <Mic className="h-9 w-9" />}
          </button>

          <div className="text-center space-y-1">
            <div className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center justify-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isListening ? 'LISTENING... SPEAK NOW' : 'CLICK MIC TO SPEAK VOICE COMMAND'}</span>
            </div>
            <div className="text-xs font-mono text-slate-300 min-h-[20px] max-w-sm px-2">
              {transcript ? `"${transcript}"` : feedback}
            </div>
          </div>
        </div>

        {/* SAMPLE VOICE COMMAND CHIPS */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            💡 Quick Sample Voice Commands (Click or Speak):
          </div>
          <div className="grid grid-cols-2 gap-2">
            {sampleCommands.map((item, idx) => (
              <button
                key={idx}
                onClick={() => processSpokenCommand(item.command)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-sky-500/40 text-left text-xs font-semibold text-slate-300 hover:text-white transition flex items-center justify-between gap-1 cursor-pointer"
              >
                <span>{item.label}</span>
                <span className="text-[10px] text-sky-400">➔</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
