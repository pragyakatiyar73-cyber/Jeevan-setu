import React, { useState } from 'react';
import { X, Mic, MicOff, Sparkles, Volume2, ArrowRight } from 'lucide-react';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
  onTriggerSOS: () => void;
}

type LangType = 'hi-IN' | 'en-IN' | 'as-IN' | 'bn-IN';

const translations: Record<LangType, {
  title: string;
  subtitle: string;
  langLabel: string;
  micIdle: string;
  micListening: string;
  defaultFeedback: string;
  cardsTitle: string;
  card1Title: string; card1Sub: string;
  card2Title: string; card2Sub: string;
  card3Title: string; card3Sub: string;
  card4Title: string; card4Sub: string;
  card5Title: string; card5Sub: string;
  card6Title: string; card6Sub: string;
  step1: string; step2: string; step3: string;
  sosActivating: string;
  navMonitoring: string;
  navMap: string;
  navWeather: string;
  navRelief: string;
  navDamage: string;
  recognized: string;
}> = {
  'en-IN': {
    title: "JEEVAN-SETU AI VOICE ASSISTANT",
    subtitle: "Speak emergency alert or navigate to any feature verbally",
    langLabel: "Spoken Language:",
    micIdle: "🎤 Click mic and speak command",
    micListening: "🔴 Listening... Speak command now",
    defaultFeedback: "Click mic and speak (or press quick cards below)...",
    cardsTitle: "💡 1-Click Quick Voice Commands:",
    card1Title: "🚨 Emergency SOS Dispatch", card1Sub: 'Speak: "Emergency SOS" / "Help"',
    card2Title: "🛰️ Smart Disaster Monitoring", card2Sub: 'Speak: "Disaster Monitoring"',
    card3Title: "🗺️ Live Satellite GIS Map", card3Sub: 'Speak: "Show Live Map"',
    card4Title: "🌧️ Weather Telemetry", card4Sub: 'Speak: "Weather Report"',
    card5Title: "⛺ Live Relief Camps Finder", card5Sub: 'Speak: "Relief Camps"',
    card6Title: "🤖 AI Damage Assessment", card6Sub: 'Speak: "AI Damage Report"',
    step1: "1️⃣ Click Mic", step2: "2️⃣ Speak Alert / Command", step3: "3️⃣ Auto Navigate in 1s",
    sosActivating: "🚨 Emergency SOS Command Detected! Opening SOS Dispatch Modal...",
    navMonitoring: "🛰️ Navigating to Smart Disaster Monitoring...",
    navMap: "🗺️ Opening Live Region 2D/3D GIS Map...",
    navWeather: "🌧️ Navigating to Weather Intelligence...",
    navRelief: "⛺ Opening Live Relief Camps Finder...",
    navDamage: "🤖 Opening AI Damage Assessment...",
    recognized: "Recognized: "
  },
  'hi-IN': {
    title: "जीवन-सेतु एआई वॉइस असिस्टेंट",
    subtitle: "बोलकर आपातकालीन मदद माँगें या ऐप के किसी भी फ़ीचर पर जाएँ",
    langLabel: "बोली जाने वाली भाषा:",
    micIdle: "🎤 माइक दबाएँ और अपनी बात बोलें",
    micListening: "🔴 सुन रहा है... अपनी बात बोलें",
    defaultFeedback: "माइक पर क्लिक करें और बोलें (या नीचे बने कार्ड्स दबाएँ)...",
    cardsTitle: "💡 1-क्लिक टेस्ट (या बोलकर चलाएँ):",
    card1Title: "🚨 आपातकालीन मदद (Emergency SOS)", card1Sub: 'बोलें: "मदद चाहिए" / "SOS Help"',
    card2Title: "🛰️ आपदा मॉनिटरिंग (Disaster Monitoring)", card2Sub: 'बोलें: "आपदा मॉनिटरिंग"',
    card3Title: "🗺️ लाइव नक्शा (Live GIS Map)", card3Sub: 'बोलें: "नक्शा खोलो"',
    card4Title: "🌧️ मौसम रिपोर्ट (Weather Telemetry)", card4Sub: 'बोलें: "मौसम जानकारी"',
    card5Title: "⛺ राहत शिविर (Relief Camps Finder)", card5Sub: 'बोलें: "राहत शिविर"',
    card6Title: "🤖 एआई नुकसान रिपोर्ट (AI Assessment)", card6Sub: 'बोलें: "नुकसान रिपोर्ट"',
    step1: "1️⃣ माइक दबाएँ", step2: "2️⃣ बोलें (कमांड / मदद)", step3: "3️⃣ 1-सेकंड में ऑटो नेविगेट",
    sosActivating: "🚨 आपातकालीन मदद एक्टिवेट हो रहा है... Emergency SOS Window",
    navMonitoring: "🛰️ आपदा मॉनिटरिंग सेंटर (Disaster Monitoring) पर ले जाया जा रहा है...",
    navMap: "🗺️ लाइव सैटेलाइट नक्शा (Live GIS Map) खोला जा रहा है...",
    navWeather: "🌧️ मौसम इंटेलिजेंस सेंटर (Weather Center) खोला जा रहा है...",
    navRelief: "⛺ राहत शिविर ग्रिड (Relief Camps) खोला जा रहा है...",
    navDamage: "🤖 AI नुकसान रिपोर्ट (AI Assessment) खोली जा रही है...",
    recognized: "बोला गया: "
  },
  'as-IN': {
    title: "জীৱন-সেতু এআই ভয়েচ সহায়ক",
    subtitle: "জৰুৰী কালীন সহায় বিচাৰক বা যিকোনো বৈশিষ্ট্যালৈ যাওক",
    langLabel: "কোৱা ভাষা:",
    micIdle: "🎤 মাইক টিপক আৰু কওক",
    micListening: "🔴 শুনি থকা হৈছে... এতিয়া কওক",
    defaultFeedback: "মাইক টিপক আৰু কওক (বা তলৰ কাৰ্ডসমূহ টিপক)...",
    cardsTitle: "💡 ১-ক্লিক ভয়েচ কমান্ডসমূহ:",
    card1Title: "🚨 জৰুৰী কালীন সাহায্য (Emergency SOS)", card1Sub: 'কওক: "সহায় লাগে" / "SOS Help"',
    card2Title: "🛰️ দুৰ্যোগ নিৰীক্ষণ (Disaster Monitoring)", card2Sub: 'কওক: "দুৰ্যোগ নিৰীক্ষণ"',
    card3Title: "🗺️ লাইভ মানচিত্ৰ (Live GIS Map)", card3Sub: 'কওক: "মানচিত্ৰ খোলক"',
    card4Title: "🌧️ বতৰ নিৰীক্ষণ (Weather Telemetry)", card4Sub: 'কওক: "বতৰৰ খবৰ"',
    card5Title: "⛺ সাহায্য শিবিৰ (Relief Camps Finder)", card5Sub: 'কওক: "সাহায্য শিবিৰ"',
    card6Title: "🤖 এআই ক্ষতি নিৰূপণ (AI Assessment)", card6Sub: 'কওক: "ক্ষতি নিৰূপণ"',
    step1: "১️⃣ মাইক টিপক", step2: "২️⃣ কওক (কমান্ড / সাহায্য)", step3: "৩️⃣ ১-ছেকেণ্ডত স্বয়ংক্ৰিয় নেভিগেট",
    sosActivating: "🚨 জৰুৰী কালীন সাহায্য এক্টিভেট হৈছে... Emergency SOS Window",
    navMonitoring: "🛰️ দুৰ্যোগ নিৰীক্ষণ কেন্দ্ৰলৈ লৈ যোৱা হৈছে...",
    navMap: "🗺️ লাইভ ছেটেলাইট মানচিত্ৰ খোলা হৈছে...",
    navWeather: "🌧️ বতৰ নিৰীক্ষণ কেন্দ্ৰ খোলক...",
    navRelief: "⛺ সাহায্য শিবিৰ খোলক...",
    navDamage: "🤖 এআই ক্ষতি নিৰূপণ খোলক...",
    recognized: "কোৱা হ'ল: "
  },
  'bn-IN': {
    title: "জীবন-সেতু এআই ভয়েস সহকারী",
    subtitle: "জরুরী সাহায্য চান বা যেকোনো ফিচারে যান",
    langLabel: "কথা বলার ভাষা:",
    micIdle: "🎤 মাইক টিপুন এবং কথা বলুন",
    micListening: "🔴 শুনছে... এখন কথা বলুন",
    defaultFeedback: "মাইকে ক্লিক করুন এবং বলুন (অথবা নিচের কার্ডে চাপুন)...",
    cardsTitle: "💡 ১-ক্লিক ভয়েস কমান্ড:",
    card1Title: "🚨 জরুরী সাহায্য (Emergency SOS)", card1Sub: 'বলুন: "সাহায্য চাই" / "SOS Help"',
    card2Title: "🛰️ দুর্যোগ মনিটরিং (Disaster Monitoring)", card2Sub: 'বলুন: "দুর্যোগ মনিটরিং"',
    card3Title: "🗺️ লাইভ মানচিত্র (Live GIS Map)", card3Sub: 'বলুন: "মানচিত্র খুলুন"',
    card4Title: "🌧️ আবহাওয়া রিপোর্ট (Weather Telemetry)", card4Sub: 'বলুন: "আবহাওয়া তথ্য"',
    card5Title: "⛺ ত্রাণ শিবির (Relief Camps Finder)", card5Sub: 'বলুন: "ত্রাণ শিবির"',
    card6Title: "🤖 এআই ক্ষয়ক্ষতি রিপোর্ট (AI Assessment)", card6Sub: 'বলুন: "ক্ষয়ক্ষতি রিপোর্ট"',
    step1: "১️⃣ মাইকে চাপুন", step2: "২️⃣ বলুন (কমান্ড / সাহায্য)", step3: "৩️⃣ ১-সেকেন্ডে অটো নেভিগেট",
    sosActivating: "🚨 জরুরী সাহায্য সক্রিয় হচ্ছে... Emergency SOS Window",
    navMonitoring: "🛰️ দুর্যোগ মনিটরিং সেন্টারে নেওয়া হচ্ছে...",
    navMap: "🗺️ লাইভ স্যাটেলাইট মানচিত্র খোলা হচ্ছে...",
    navWeather: "🌧️ আবহাওয়া তথ্য সেন্টারে যাওয়া হচ্ছে...",
    navRelief: "⛺ ত্রাণ শিবির তালিকা খোলা হচ্ছে...",
    navDamage: "🤖 এআই ক্ষয়ক্ষতি রিপোর্ট খোলা হচ্ছে...",
    recognized: "কথা বলা হয়েছে: "
  }
};

export default function VoiceAssistantModal({
  isOpen,
  onClose,
  onNavigate,
  onTriggerSOS
}: VoiceAssistantModalProps) {
  if (!isOpen) return null;

  const [selectedLang, setSelectedLang] = useState<LangType>('en-IN');
  const t = translations[selectedLang] || translations['en-IN'];
  const [feedbackMsg, setFeedbackMsg] = useState<string>(t.defaultFeedback);

  const processSpokenCommand = (text: string) => {
    const lower = text.toLowerCase();
    
    if (lower.includes('sos') || lower.includes('help') || lower.includes('madad') || lower.includes('emergency') || lower.includes('मदद') || lower.includes('সাহায্য')) {
      setFeedbackMsg(t.sosActivating);
      setTimeout(() => {
        onClose();
        onTriggerSOS();
      }, 1000);
    } else if (lower.includes('monitoring') || lower.includes('disaster') || lower.includes('shillong') || lower.includes('आपदा') || lower.includes('দুৰ্যোগ') || lower.includes('দুর্যোগ')) {
      setFeedbackMsg(t.navMonitoring);
      setTimeout(() => {
        onClose();
        onNavigate('smartmonitoring');
      }, 1000);
    } else if (lower.includes('map') || lower.includes('naksha') || lower.includes('satellite') || lower.includes('नक्शा') || lower.includes('মানচিত্ৰ') || lower.includes('মানচিত্র')) {
      setFeedbackMsg(t.navMap);
      setTimeout(() => {
        onClose();
        onNavigate('map');
      }, 1000);
    } else if (lower.includes('weather') || lower.includes('mausam') || lower.includes('rain') || lower.includes('मौसम') || lower.includes('বতৰ') || lower.includes('আবহাওয়া')) {
      setFeedbackMsg(t.navWeather);
      setTimeout(() => {
        onClose();
        onNavigate('weather');
      }, 1000);
    } else if (lower.includes('relief') || lower.includes('camp') || lower.includes('rahat') || lower.includes('राहत') || lower.includes('ত্রাণ')) {
      setFeedbackMsg(t.navRelief);
      setTimeout(() => {
        onClose();
        onNavigate('reliefcamps');
      }, 1000);
    } else if (lower.includes('damage') || lower.includes('assessment') || lower.includes('ai') || lower.includes('नुकसान') || lower.includes('ক্ষতি')) {
      setFeedbackMsg(t.navDamage);
      setTimeout(() => {
        onClose();
        onNavigate('aiimpact');
      }, 1000);
    } else {
      setFeedbackMsg(`${t.recognized}"${text}"`);
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
      title: t.card1Title,
      sub: t.card1Sub,
      color: "border-rose-500/50 bg-gradient-to-r from-rose-950/60 to-slate-900 text-rose-300 hover:border-rose-400",
      action: () => processSpokenCommand("Emergency SOS Help madad")
    },
    {
      title: t.card2Title,
      sub: t.card2Sub,
      color: "border-sky-500/50 bg-gradient-to-r from-sky-950/60 to-slate-900 text-sky-300 hover:border-sky-400",
      action: () => processSpokenCommand("Smart Disaster Monitoring")
    },
    {
      title: t.card3Title,
      sub: t.card3Sub,
      color: "border-indigo-500/50 bg-gradient-to-r from-indigo-950/60 to-slate-900 text-indigo-300 hover:border-indigo-400",
      action: () => processSpokenCommand("Live GIS Map satellite")
    },
    {
      title: t.card4Title,
      sub: t.card4Sub,
      color: "border-cyan-500/50 bg-gradient-to-r from-cyan-950/60 to-slate-900 text-cyan-300 hover:border-cyan-400",
      action: () => processSpokenCommand("Weather report mausam")
    },
    {
      title: t.card5Title,
      sub: t.card5Sub,
      color: "border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 to-slate-900 text-emerald-300 hover:border-emerald-400",
      action: () => processSpokenCommand("Relief camp rahat camp")
    },
    {
      title: t.card6Title,
      sub: t.card6Sub,
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
                  {t.title}
                </h3>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-extrabold text-emerald-400">
                  LIVE VOICE
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {t.subtitle}
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

        {/* LANGUAGE SELECTION BUTTONS */}
        <div className="flex items-center justify-between text-xs bg-slate-950/80 p-3 rounded-2xl border border-slate-800/90">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Volume2 className="h-4 w-4 text-sky-400" />
            <span>{t.langLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { code: 'en-IN', name: '🇬🇧 English' },
              { code: 'hi-IN', name: '🇮🇳 हिंदी' },
              { code: 'as-IN', name: 'অসমীয়া' },
              { code: 'bn-IN', name: 'বাংলা' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => {
                  const newLang = l.code as LangType;
                  setSelectedLang(newLang);
                  setFeedbackMsg(translations[newLang].defaultFeedback);
                }}
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
              <span>{isListening ? t.micListening : t.micIdle}</span>
            </div>
            
            <div className="text-xs font-mono text-slate-200 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl min-h-[38px] flex items-center justify-center text-center shadow-inner">
              {transcript ? <span className="font-bold text-sky-300">"{transcript}"</span> : feedbackMsg}
            </div>
          </div>
        </div>

        {/* 6 VISUAL INTERACTIVE FEATURE CARDS */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.cardsTitle}</span>
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

        {/* DYNAMIC HOW-TO GUIDE FOOTER */}
        <div className="flex items-center justify-around text-[11px] text-slate-400 font-mono border-t border-slate-800/80 pt-3">
          <span className="flex items-center gap-1">{t.step1}</span>
          <span>➔</span>
          <span className="flex items-center gap-1">{t.step2}</span>
          <span>➔</span>
          <span className="flex items-center gap-1 text-emerald-400 font-bold">{t.step3}</span>
        </div>

      </div>
    </div>
  );
}
