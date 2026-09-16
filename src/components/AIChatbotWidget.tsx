import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RotateCcw,
  Activity,
  Zap,
  ArrowRight,
  MessageSquare,
  Copy,
  Check,
  Radio,
  Layers,
  Compass
} from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useTranslation } from '../i18n';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  analysis?: {
    riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO';
    detectedLocation?: string;
    incidentType?: string;
    actionSteps: string[];
    recommendedModule?: string;
    recommendedModuleName?: string;
  };
}

import { analyzeUserQuery as runEngineAnalyze, AIAnalysisResult } from '../services/ai/aiKnowledgeEngine';

export { runEngineAnalyze as analyzeUserQuery };
export type { AIAnalysisResult };

export interface AIChatbotWidgetProps {
  onNavigateModule?: (mod: string) => void;
  onOpenSos?: () => void;
  isOpenDefault?: boolean;
  isOpenControlled?: boolean;
  onCloseControlled?: () => void;
  onOpenControlled?: () => void;
  activeModule?: string;
  showFloatingButton?: boolean;
}

const MODULE_NAMES: Record<string, string> = {
  home: 'Jeevan Setu Homepage',
  customdashboard: 'Command Center Dashboard',
  safetyguide: 'Disaster Safety Guide',
  smartmonitoring: 'Smart Disaster Monitoring',
  incidents: 'Disaster Reports & Intelligence',
  aiimpact: 'AI Impact Assessment',
  map: 'NER Live GIS Map',
  'relief-supplies': 'Relief Supply & Vehicle Tracking',
  'private-tracking': 'Smart Emergency Response',
  rerouting: 'Road Accessibility & Safe Routes',
  facilities: 'Emergency Facilities & Rescue',
  drone: 'UAV Drone Dispatcher',
  gov: 'MDoNER Command Grid',
  weather: 'Weather & Doppler Radar',
  location: 'Location Intelligence Report'
};

export default function AIChatbotWidget({
  onNavigateModule,
  onOpenSos,
  isOpenDefault = false,
  isOpenControlled,
  onCloseControlled,
  onOpenControlled,
  activeModule = 'home',
  showFloatingButton
}: AIChatbotWidgetProps) {
  const { language, setLanguage, t } = useTranslation();
  const [internalIsOpen, setInternalIsOpen] = useState(isOpenDefault);

  const isOpen = isOpenControlled !== undefined ? isOpenControlled : internalIsOpen;
  const shouldShowFloating = showFloatingButton !== undefined ? showFloatingButton : (activeModule === 'home');

  const setIsOpen = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isOpen) : val;
    setInternalIsOpen(nextVal);
    if (!nextVal && onCloseControlled) {
      onCloseControlled();
    } else if (nextVal && onOpenControlled) {
      onOpenControlled();
    }
  };

  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'chat' | 'telemetry'>('chat');
  const [voiceLang, setVoiceLang] = useState(language === 'hi' ? 'hi-IN' : 'en-IN');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Automatically synchronize voice language with active system language
  useEffect(() => {
    if (language === 'hi') {
      setVoiceLang('hi-IN');
    } else if (language === 'bn') {
      setVoiceLang('bn-IN');
    } else if (language === 'as') {
      setVoiceLang('as-IN');
    } else if (language === 'en') {
      setVoiceLang('en-IN');
    }
  }, [language]);

  const handleVoiceLangChange = (newLang: string) => {
    setVoiceLang(newLang);
    if (newLang.startsWith('hi') && language !== 'hi') {
      setLanguage('hi');
    } else if (newLang.startsWith('en') && language !== 'en') {
      setLanguage('en');
    } else if (newLang.startsWith('bn') && language !== 'bn') {
      setLanguage('bn');
    } else if (newLang.startsWith('as') && language !== 'as') {
      setLanguage('as');
    }
  };

  const handleCopyMessage = (msgId: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const isHi = language === 'hi';
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: isHi
          ? 'नमस्ते! मैं आपका जीवन सेतु एआई सहायक (Jeevan Setu AI Assistant) हूँ 🤖।\n\nपूर्वोत्तर के 8 राज्यों (असम, अरुणाचल, मणिपुर, मेघालय, मिजोरम, नागालैंड, सिक्किम, त्रिपुरा) के लिए प्रशिक्षित। सुरक्षित रास्ते (Routes), मौसम व तापमान, आपदा स्थिति (Landslides, Floods), राहत शिविर या इमरजेंसी एसओएस (Emergency SOS) के बारे में कुछ भी पूछें। आप माइक 🎙️ से बोल भी सकते हैं!'
          : 'Namaste! I am your Jeevan Setu AI Agent 🤖.\n\nAsk me anything about the Jeevan Setu platform: live disaster status, safe routes & highway detours, weather & temperature, emergency SOS, relief camps, hospital beds, or safety guides across the 8 North Eastern States. You can type, speak using the 🎙️ microphone, or inspect Deep Telemetry!',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        analysis: {
          riskLevel: 'INFO',
          detectedLocation: 'North Eastern Region (8 States)',
          incidentType: isHi ? 'जीवन सेतु आधिकारिक आपदा इंटेलिजेंस' : 'Jeevan Setu Official Knowledge & Response Assistant',
          actionSteps: isHi ? [
            'पूछें: "गुवाहाटी से शिलांग जाने का रास्ता कैसा है?"',
            'पूछें: "सिक्किम में मौसम और तापमान क्या है?"',
            'पूछें: "इमरजेंसी एसओएस (SOS) कैसे काम करता है?"',
            'लाइव सेंसर डेटा हेतु Deep Telemetry पर स्विच करें'
          ] : [
            'Ask: "What is the route and road status from Siliguri to Gangtok?"',
            'Ask: "What is the weather and temperature in Shillong?"',
            'Ask: "How does Emergency SOS rescue dispatch work?"',
            'Switch to Deep Telemetry for real-time sensor diagnostics'
          ],
          recommendedModule: 'customdashboard',
          recommendedModuleName: isHi ? 'कमांड सेंटर डैशबोर्ड' : 'Explore Command Center Dashboard'
        }
      }
    ];
  });

  // Voice Recognition Hook
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceRecognition({
    language: voiceLang,
    onResult: (resText) => {
      if (resText && resText.trim()) {
        setInputText(resText);
      }
    }
  });

  useEffect(() => {
    if (transcript) {
      setInputText(transcript);
    }
  }, [transcript]);

  // Auto Scroll Chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isThinking]);

  // Global trigger event listener for top header button
  useEffect(() => {
    const handleOpenEvent = () => setIsOpen(prev => !prev);
    window.addEventListener('open-ai-chatbot', handleOpenEvent);
    return () => window.removeEventListener('open-ai-chatbot', handleOpenEvent);
  }, []);

  // Text to Speech Readout in User's Active Language
  const handleSpeakText = (text: string, overrideLang?: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Clean text of emojis, markdown bullets, and symbols for natural voice synthesis
    const cleanSpeechText = text
      .replace(/[*#_`~]/g, '')
      .replace(/[🚨🗺️📷🛰️🛣️🏕️🚁🌐📞⚡⛰️🎒🌊📻🏨📍➔•💡]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeechText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const targetLangCode = overrideLang || (language === 'hi' || voiceLang.startsWith('hi') ? 'hi-IN' : voiceLang || 'en-IN');
    utterance.lang = targetLangCode;

    // Pick best matching voice from browser speech synthesis
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const langPrefix = targetLangCode.split('-')[0].toLowerCase();
        const matched = voices.find(v => v.lang.toLowerCase().startsWith(langPrefix)) ||
                        voices.find(v => v.lang.toLowerCase().includes(langPrefix));
        if (matched) {
          utterance.voice = matched;
        }
      }
    } catch (e) {}

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit User Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    const userMsgId = `usr-${Date.now()}`;
    const timestampStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: timestampStr
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);

    const activeLang = (language === 'hi' || voiceLang.startsWith('hi')) ? 'hi' : 'en';

    // 1. First attempt backend /api/ai/chat (uses Gemini if configured in server environment)
    let remoteAnswer: string | null = null;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: activeLang
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.status === 'success' && data?.answerText && data.answerText.length > 15) {
          remoteAnswer = data.answerText;
        }
      }
    } catch (err) {
      // Offline fallback
    }

    // 2. Comprehensive Client-Side Disaster & Platform Knowledge Engine
    const analysis = runEngineAnalyze(query, activeLang);
    const aiReplyText = remoteAnswer || analysis.answerText;

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: aiReplyText,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      analysis: {
        riskLevel: analysis.riskLevel,
        detectedLocation: analysis.detectedLocation,
        incidentType: analysis.incidentType,
        actionSteps: analysis.actionSteps,
        recommendedModule: analysis.recommendedModule,
        recommendedModuleName: analysis.recommendedModuleName
      }
    };

    setMessages(prev => [...prev, aiMessage]);
    setIsThinking(false);

    // Auto-read AI analysis in matching language if voice mode was active
    if (isListening || transcript) {
      handleSpeakText(aiReplyText, activeLang === 'hi' ? 'hi-IN' : 'en-IN');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <>
      {/* 🔴 FLOATING BOT TOGGLE BUTTON (BOTTOM RIGHT - ONLY SHOWN ON HOMEPAGE) */}
      {!isOpen && shouldShowFloating && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[99999] bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-3 border-2 border-white/30 group cursor-pointer"
          title="Open Jeevan Setu AI Disaster Chatbot"
        >
          <div className="relative">
            <Bot className="h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-ping border border-slate-900" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border border-slate-900" />
          </div>
          <div className="hidden sm:flex flex-col items-start pr-1">
            <span className="text-xs font-black tracking-wide flex items-center gap-1">
              AI Assistant <Sparkles className="h-3 w-3 text-amber-300" />
            </span>
            <span className="text-[10px] text-sky-100 font-semibold">Type or Speak 🎙️</span>
          </div>
        </button>
      )}

      {/* 🤖 EXPANDABLE AI CHATBOT PANEL & OVERLAY */}
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[99998] transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Chatbot Window (Positioned Top Right / Below Header) */}
          <div className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[99999] w-[95vw] sm:w-[420px] max-h-[80vh] h-[580px] bg-slate-950/95 border border-slate-700/80 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* TOP CHATBOT HEADER */}
          <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg border border-sky-400/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                    Jeevan Setu AI Agent
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span>Context:</span>
                  <span className="text-sky-400 font-bold">{MODULE_NAMES[activeModule || 'home'] || '18 Modules'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                title="Reset Chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
                title="Close AI Agent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 🔴 DETAIL FEATURE TAB SWITCHER */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
              <button
                onClick={() => setActiveDetailTab('chat')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeDetailTab === 'chat'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>AI Chat</span>
              </button>

              <button
                onClick={() => setActiveDetailTab('telemetry')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                  activeDetailTab === 'telemetry'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span>Deep Telemetry</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              </button>
            </div>

            {/* Voice Language Picker */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500">VOICE:</span>
              <select
                value={voiceLang}
                onChange={(e) => handleVoiceLangChange(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-sky-400 font-bold rounded-md px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer"
              >
                <option value="en-IN">EN (English)</option>
                <option value="hi-IN">HI (हिंदी)</option>
                <option value="as-IN">AS (অসমীয়া)</option>
                <option value="bn-IN">BN (বাংলা)</option>
              </select>
            </div>
          </div>

          {activeDetailTab === 'telemetry' ? (
            /* 📊 DEEP TELEMETRY & DIAGNOSTICS DETAIL PANEL */
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs select-none">
              {/* CURRENT SECTOR CONTEXT */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950/60 to-indigo-950/60 border border-sky-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    ACTIVE SECTOR TELEMETRY
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-500/30">
                    LIVE CONTEXT
                  </span>
                </div>
                <div className="text-sm font-black text-white">
                  {MODULE_NAMES[activeModule || 'home'] || 'All 18 Modules Synchronized'}
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Real-time telemetry link active. Multi-spectral sensor fusion, ISRO NavIC satellite tracking, and NDRF battalion readiness online for the 8 North Eastern States.
                </p>
              </div>

              {/* 8 NER STATES MULTI-HAZARD MATRIX */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
                  PAN-NER SOVEREIGN TELEMETRY GRID
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">🛰️ ISRO NavIC Grid</span>
                    <span className="text-xs font-bold text-emerald-400">14 Sats Locked (99.2%)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">🌧️ Doppler Radar</span>
                    <span className="text-xs font-bold text-sky-400">Cherrapunji Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">🛣️ Highway Lifelines</span>
                    <span className="text-xs font-bold text-amber-400">NH-6 Landslide Watch</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">🏥 ICU Bed Capacity</span>
                    <span className="text-xs font-bold text-emerald-400">1,840 Beds Verified</span>
                  </div>
                </div>
              </div>

              {/* ONE-CLICK DEEP DIAGNOSTIC AUDITS */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-extrabold uppercase text-sky-400 tracking-wider block">
                  ⚡ ONE-CLICK DEEP DIAGNOSTIC ACTIONS
                </span>
                <div className="space-y-1.5">
                  {[
                    { label: "Audit Active Landslide Chokepoints (NH-6 & NH-29)", query: "Check road status and landslide chokepoints along NH-6 and NH-29" },
                    { label: "Simulate River Basin Flood Surge in Assam", query: "Show flood vulnerability assessment for Brahmaputra valley and Guwahati" },
                    { label: "Scan Verified Emergency Care & Oxygen Supplies", query: "Find emergency hospital facilities, blood banks, and ICU beds in NER" },
                    { label: "Generate Complete 8-State Location SITREP", query: "How do I generate a complete Location Intelligence Report?" }
                  ].map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveDetailTab('chat');
                        handleSendMessage(action.query);
                      }}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-900/90 hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 text-slate-200 hover:text-white transition flex items-center justify-between text-[11px] font-semibold cursor-pointer group"
                    >
                      <span className="truncate">{action.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-sky-400 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MESSAGES LIST AREA */
            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs select-text">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 shadow-md ${
                      msg.sender === 'user'
                        ? 'bg-sky-600 text-white rounded-br-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none space-y-2'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-relaxed whitespace-pre-line">{msg.text}</p>
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="text-slate-400 hover:text-sky-400 transition p-0.5 cursor-pointer"
                            title="Copy AI Briefing to Clipboard"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleSpeakText(msg.text)}
                            className="text-slate-400 hover:text-sky-400 transition shrink-0 p-0.5 cursor-pointer"
                            title="Listen to AI Analysis"
                          >
                            {isSpeaking ? <VolumeX className="h-4 w-4 text-amber-400 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                  {/* AI Structured Analysis Box */}
                  {msg.analysis && (
                    <div className="mt-2 pt-2.5 border-t border-slate-800/80 space-y-2 text-[11px]">
                      {/* Risk Badge & Location */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase border ${
                            msg.analysis.riskLevel === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                              : msg.analysis.riskLevel === 'HIGH'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                              : msg.analysis.riskLevel === 'MODERATE'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {msg.analysis.riskLevel === 'INFO' ? 'PLATFORM INTELLIGENCE' : `${msg.analysis.riskLevel} ALERT`}
                        </span>
                        {msg.analysis.detectedLocation && (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-sky-400" />
                            {msg.analysis.detectedLocation}
                          </span>
                        )}
                      </div>

                      {/* Action Steps Bullet Points */}
                      {msg.analysis.actionSteps && msg.analysis.actionSteps.length > 0 && (
                        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-wider block">
                            {msg.analysis.riskLevel === 'INFO' ? '⚡ Platform Insights & Tools:' : '⚡ Recommended Action Protocol:'}
                          </span>
                          {msg.analysis.actionSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Direct Module Jump Button */}
                      {msg.analysis.recommendedModule && onNavigateModule && (
                        <button
                          onClick={() => {
                            onNavigateModule(msg.analysis!.recommendedModule!);
                            setIsOpen(false);
                          }}
                          className="w-full mt-2 bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-95 transition cursor-pointer border border-sky-400/30"
                        >
                          <span>{msg.analysis.recommendedModuleName || `Open ${msg.analysis.recommendedModule}`}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {/* Quick Navigation Button */}
                      {msg.analysis.riskLevel === 'CRITICAL' && onOpenSos && (
                        <button
                          onClick={onOpenSos}
                          className="w-full mt-1 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer transition animate-pulse"
                        >
                          <ShieldAlert className="h-4 w-4" />
                          <span>TRIGGER 🚨 EMERGENCY SOS RESCUE NOW</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {/* AI Thinking Animation */}
            {isThinking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs bg-slate-900/60 p-3 rounded-2xl border border-slate-800 w-max">
                <Sparkles className="h-4 w-4 text-sky-400 animate-spin" />
                <span className="font-bold text-sky-300">Analyzing voice &amp; disaster telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
          )}

          {/* QUICK PROMPT CHIPS (Bilingual) */}
          <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {(language === 'hi' ? [
              "🌐 जीवन सेतु क्या है?",
              "🚨 इमरजेंसी SOS कैसे काम करता है?",
              "🛣️ सुरक्षित मार्ग और सड़क की स्थिति",
              "🌧️ मौसम और तापमान क्या है?",
              "🗺️ लाइव आपदा नक्शा दिखाएं",
              "🏕️ नजदीकी राहत शिविर",
              "📷 फोटो से नुकसान कैसे नापें?",
              "🌊 असम में बाढ़ की स्थिति",
              "⛰️ सिक्किम में भूस्खलन"
            ] : [
              "🌐 What is Jeevan Setu?",
              "🚨 How does Emergency SOS work?",
              "🛣️ Check Road Status & Safe Routes",
              "🌧️ What is the weather & temperature?",
              "🗺️ Show Live GIS Map & Hazards",
              "🏕️ Find Nearest Relief Camps",
              "📷 How does AI Damage Assessment work?",
              "🌊 Flood alert in Guwahati Assam",
              "⛰️ Landslide on NH-10 Sikkim"
            ]).map((promptText, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(promptText)}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-sky-600/30 hover:border-sky-500/50 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-white whitespace-nowrap transition cursor-pointer"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* INPUT BAR: TEXT & VOICE MIC BUTTON */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0">
            {/* 🎙️ VOICE MIC BUTTON */}
            <button
              onClick={handleMicClick}
              className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer ${
                isListening
                  ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-sky-400 border-slate-700'
              }`}
              title={isListening ? "Stop Voice Recognition" : "Speak Voice Input (Speech-to-Text)"}
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            {/* Input Text Box */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={
                isListening
                  ? (language === 'hi' ? "🎙️ सुन रहा हूँ... बोलिए" : "🎙️ Listening... Speak now")
                  : (language === 'hi' ? "आपदा या सहायता सम्बन्धी सवाल लिखें या बोलें..." : "Type or speak emergency query...")
              }
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:hover:bg-sky-600 text-white font-bold transition flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-sky-900/30"
              title="Send to AI Assistant"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>

        </div>
        </>
      )}
    </>
  );
}
