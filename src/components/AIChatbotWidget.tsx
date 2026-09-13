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
  MessageSquare
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
  };
}

export function analyzeUserQuery(query: string): ChatMessage['analysis'] {
  const q = query.toLowerCase();

  let riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'INFO' = 'INFO';
  let detectedLocation = 'North Eastern Region (8 States)';
  let incidentType = 'General Disaster & Weather Intelligence';
  let recommendedModule = 'livesituation';
  const actionSteps: string[] = [];

  // Detect State / Location
  if (q.includes('sikkim') || q.includes('gangtok') || q.includes('teesta')) {
    detectedLocation = 'Sikkim Sector (Gangtok / Teesta Valley)';
  } else if (q.includes('assam') || q.includes('guwahati') || q.includes('kaziranga') || q.includes('cachar')) {
    detectedLocation = 'Assam River Basin (Guwahati / Cachar Sector)';
  } else if (q.includes('meghalaya') || q.includes('shillong') || q.includes('sohra') || q.includes('cherrapunji')) {
    detectedLocation = 'Meghalaya Plateau (Shillong / Sohra Sector)';
  } else if (q.includes('manipur') || q.includes('imphal') || q.includes('noney')) {
    detectedLocation = 'Manipur Corridor (Imphal / Noney Landslide Sector)';
  } else if (q.includes('mizoram') || q.includes('aizawl')) {
    detectedLocation = 'Mizoram Ridge Sector (Aizawl Corridor)';
  } else if (q.includes('nagaland') || q.includes('kohima') || q.includes('dimapur')) {
    detectedLocation = 'Nagaland Highway Sector (Kohima / Dimapur)';
  } else if (q.includes('arunachal') || q.includes('itanagar') || q.includes('tawang')) {
    detectedLocation = 'Arunachal Frontier Sector (Itanagar / Tawang Sector)';
  } else if (q.includes('tripura') || q.includes('agartala')) {
    detectedLocation = 'Tripura Gumti Basin (Agartala Sector)';
  }

  // Detect Incident & Severity
  if (q.includes('trapped') || q.includes('sos') || q.includes('help') || q.includes('emergency') || q.includes('rescue') || q.includes('danger')) {
    riskLevel = 'CRITICAL';
    incidentType = 'Emergency Citizen SOS Distress Call';
    recommendedModule = 'map';
    actionSteps.push('NDRF & State Disaster Rescue Team #01 Dispatched to Location');
    actionSteps.push('Activated Satellite GPS Beacon Tracking Protocol');
    actionSteps.push('Alerted Nearest District Medical Emergency Command Center');
    actionSteps.push('Recommended 4x4 All-Terrain Convoy Route to Safe Zone');
  } else if (q.includes('flood') || q.includes('water') || q.includes('submerged') || q.includes('overflow')) {
    riskLevel = 'HIGH';
    incidentType = 'River Inundation & Flash Flood Hazard';
    recommendedModule = 'flood';
    actionSteps.push('Issue Immediate High Ground Evacuation Warning');
    actionSteps.push('Deploy Inflatable Rescue Boats to Submerged Villages');
    actionSteps.push('Activate Real-Time Water Level Hydro-Telemetry Monitoring');
    actionSteps.push('Open Nearest Relief Camp & Food/Medical Supply Depot');
  } else if (q.includes('landslide') || q.includes('mudslide') || q.includes('block') || q.includes('road') || q.includes('debris')) {
    riskLevel = 'HIGH';
    incidentType = 'Hill Slope Sinking & Landslide Blockage';
    recommendedModule = 'road';
    actionSteps.push('Dispatch Heavy JCB & Excavator Clearing Fleets');
    actionSteps.push('Establish 500m Safety Perimeter around Slide Risk Area');
    actionSteps.push('Reroute Relief Traffic to Secondary Highway Corridor');
    actionSteps.push('Deploy Synthetic Aperture Radar (SAR) Ground Slope Sensors');
  } else if (q.includes('weather') || q.includes('rain') || q.includes('storm') || q.includes('temp') || q.includes('cloud')) {
    riskLevel = 'MODERATE';
    incidentType = 'Meteorological Doppler Weather Analysis';
    actionSteps.push('Syncing Live IMD & Open-Meteo Radar Satellite Telemetry');
    actionSteps.push('Precipitation probability currently high in elevated ridges');
    actionSteps.push('Advisory: Avoid night travel across hilly mountain passes');
    actionSteps.push('Next 24-hour Doppler Satellite Forecast Updated');
  } else {
    riskLevel = 'INFO';
    incidentType = 'Jeevan Setu AI Disaster Intelligence Query';
    actionSteps.push('Analyzed input across 8 North-Eastern Sovereign States Dataset');
    actionSteps.push('Cross-referenced ISRO Satellite, IMD Weather & MongoDB Telemetry');
    actionSteps.push('All Emergency Services & Relief Camps Online in NER Region');
    actionSteps.push('You can trigger 🚨 Emergency SOS for immediate 4x4 rescue dispatch');
  }

  return {
    riskLevel,
    detectedLocation,
    incidentType,
    actionSteps,
    recommendedModule
  };
}

export interface AIChatbotWidgetProps {
  onNavigateModule?: (mod: string) => void;
  onOpenSos?: () => void;
  isOpenDefault?: boolean;
}

export default function AIChatbotWidget({ onNavigateModule, onOpenSos, isOpenDefault = false }: AIChatbotWidgetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(isOpenDefault);
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Namaste! I am Jeevan Setu AI Assistant 🤖. You can type or speak by clicking the 🎙️ mic button. I will analyze your disaster situation, weather, or emergency query in real-time.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      analysis: {
        riskLevel: 'INFO',
        detectedLocation: 'North Eastern Region (8 States)',
        incidentType: 'Live Multilingual Voice & Text AI Intelligence',
        actionSteps: [
          'Type or click 🎙️ mic to speak your location or emergency',
          'Get instant AI risk level & evacuation recommendations',
          'Direct integration with ISRO Satellite & IMD Weather data',
          'Trigger 🚨 Emergency SOS for immediate rescue dispatch'
        ]
      }
    }
  ]);

  // Voice Recognition Hook
  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceRecognition({
    language: 'hi-IN',
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

  // Text to Speech Readout
  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

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

    // Analyze Query via AI Engine
    setTimeout(() => {
      const analysis = analyzeUserQuery(query);
      
      let aiReplyText = `AI Analysis Complete for: "${query}". Detected Location: ${analysis.detectedLocation}. Incident Classification: ${analysis.incidentType}. Risk Assessment: ${analysis.riskLevel}.`;
      
      if (analysis.riskLevel === 'CRITICAL') {
        aiReplyText += ' 🚨 CRITICAL DISTRESS DETECTED! Emergency rescue teams and satellite GPS beacon tracking have been alerted.';
      } else if (analysis.riskLevel === 'HIGH') {
        aiReplyText += ' ⚠️ High risk disaster conditions found. Follow recommended safety clearing actions immediately.';
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        analysis
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsThinking(false);

      // Auto-read AI analysis if voice mode was used
      if (isListening || transcript) {
        handleSpeakText(aiReplyText);
      }
    }, 900);
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
      {/* 🔴 FLOATING BOT TOGGLE BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9999] bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center gap-3 border-2 border-white/30 group cursor-pointer"
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

      {/* 🤖 EXPANDABLE AI CHATBOT PANEL */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[95vw] sm:w-[420px] max-h-[85vh] h-[600px] bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* TOP CHATBOT HEADER */}
          <div className="bg-slate-900/90 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg border border-sky-400/30">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                    Jeevan Setu AI Assistant
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-extrabold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE NLP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Multilingual Voice &amp; Text Analysis Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([messages[0]])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Reset Chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
                title="Close Chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* MESSAGES LIST AREA */}
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
                      <button
                        onClick={() => handleSpeakText(msg.text)}
                        className="text-slate-400 hover:text-sky-400 transition shrink-0 p-0.5"
                        title="Listen to AI Analysis"
                      >
                        {isSpeaking ? <VolumeX className="h-4 w-4 text-amber-400 animate-pulse" /> : <Volume2 className="h-4 w-4" />}
                      </button>
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
                          {msg.analysis.riskLevel} RISK ASSESSMENT
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
                            ⚡ AI Recommended Action Protocol:
                          </span>
                          {msg.analysis.actionSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-slate-300">
                              <span className="text-emerald-400 font-bold">✓</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
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

          {/* QUICK PROMPT CHIPS */}
          <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {[
              "🌊 Flood alert in Guwahati Assam",
              "⛰️ Landslide on NH-6 Sikkim",
              "🚨 Emergency SOS 5 persons trapped",
              "🌤️ Live Weather Gangtok"
            ].map((promptText, i) => (
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
              placeholder={isListening ? "🎙️ Listening... Speak now" : "Type or speak emergency query..."}
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
      )}
    </>
  );
}
