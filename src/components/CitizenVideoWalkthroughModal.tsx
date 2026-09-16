import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  ShieldAlert,
  Radio,
  Navigation,
  HeartPulse,
  CloudRain,
  BookOpen,
  Compass,
  Bot,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Share2,
  PhoneCall
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface CitizenVideoWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateModule?: (module: string) => void;
  onTriggerSOS?: () => void;
}

interface Scene {
  id: number;
  titleHi: string;
  titleEn: string;
  timestampStart: number; // in seconds
  timestampEnd: number;
  moduleKey: string;
  badge: string;
  icon: any;
  color: string;
  narrationHi: string;
  narrationEn: string;
  screenHighlights: string[];
}

export const VIDEO_SCENES: Scene[] = [
  {
    id: 1,
    titleHi: '1. परिचय एवं जीवन सेतु मिशन',
    titleEn: '1. Introduction & Jeevan Setu Mission',
    timestampStart: 0,
    timestampEnd: 60,
    moduleKey: 'home',
    badge: 'MISSION',
    icon: ShieldAlert,
    color: 'from-sky-600 to-indigo-600',
    narrationHi: 'नमस्कार नागरिकों! आपदाओं जैसे बाढ़, भूस्खलन और भारी बारिश के दौरान आपकी सुरक्षा के लिए बनाया गया है जीवन सेतु प्लेटफॉर्म। यह उत्तर-पूर्वी भारत के 8 राज्यों का आधिकारिक जीवन-रक्षक कमांड नेटवर्क है।',
    narrationEn: 'Welcome citizens! Jeevan Setu is an official life-saving disaster management grid created for all 8 North Eastern states of India.',
    screenHighlights: [
      'MoDoNER / NEC Sovereign Disaster Grid',
      'Real-Time Telemetry & 24/7 Sensor Watch',
      '100% Free Life-Saving Platform for All Citizens'
    ]
  },
  {
    id: 2,
    titleHi: '2. मोबाइल व्यू एवं भाषा चुनाव',
    titleEn: '2. Mobile View & Language Customization',
    timestampStart: 60,
    timestampEnd: 120,
    moduleKey: 'launcher',
    badge: 'INTERFACE',
    icon: Navigation,
    color: 'from-purple-600 to-indigo-600',
    narrationHi: 'आप ऊपर दिए गए भाषा बटन से ऐप को तुरंत हिंदी में बदल सकते हैं। मोबाइल फोन पर उपयोग करने के लिए 18 फीचर्स बटन दबाएं, जहाँ सभी फीचर्स पूरे नाम और आइकॉन के साथ खुल जाएंगे।',
    narrationEn: 'Easily switch to Hindi using the top language selector, and tap 18 Features Menu on mobile to view all tools with full titles.',
    screenHighlights: [
      'Instant Hindi & English Bilingual Switch',
      'Full-Screen 18 Features Mobile Launcher',
      'Light Mode & Dark Mode Support'
    ]
  },
  {
    id: 3,
    titleHi: '3. 1-क्लिक इमरजेंसी SOS डिस्ट्रेस अलर्ट',
    titleEn: '3. 1-Tap Emergency SOS Distress Alert',
    timestampStart: 120,
    timestampEnd: 180,
    moduleKey: 'sos',
    badge: 'CRITICAL',
    icon: ShieldAlert,
    color: 'from-rose-600 to-red-600',
    narrationHi: 'मुसीबत में फंसने पर ऊपर दिए गए लाल इमरजेंसी SOS बटन को दबाएं। यह आपकी सटीक GPS लोकेशन अपने आप पहचानकर आपकी मदद की गुहार तुरंत NDRF, पुलिस और राज्य कंट्रोल रूम को भेज देता है।',
    narrationEn: 'When in emergency, tap the pulsing red SOS button. It automatically transmits your exact GPS location to NDRF and State Control Rooms.',
    screenHighlights: [
      'Automatic Satellite GPS Coordinates (±4m)',
      'Direct Alert Transmission to NDRF & SDMA',
      'Select Disaster Type & Trapped Persons Count'
    ]
  },
  {
    id: 4,
    titleHi: '4. 1-टू-1 लाइव GPS ट्रैकिंग एवं दोस्तों को जोड़ें',
    titleEn: '4. Smart Emergency & Invite Friends Map',
    timestampStart: 180,
    timestampEnd: 255,
    moduleKey: 'private-tracking',
    badge: '1-TO-1 GPS',
    icon: Radio,
    color: 'from-rose-500 to-amber-600',
    narrationHi: 'स्मार्ट इमरजेंसी रिस्पॉन्स में आप अपने परिजनों और दोस्तों को जोड़ सकते हैं। WhatsApp या QR कोड के माध्यम से लिंक शेयर करें और एक-दूसरे की लाइव लोकेशन, दूरी, बैट्री और सिग्नल नक्शे पर देखें।',
    narrationEn: 'Invite friends via WhatsApp or QR code. Track multiple family members on a live map with real-time distance, battery %, and signal strength.',
    screenHighlights: [
      'Multi-Friend Live GPS Location Sharing',
      'WhatsApp & QR Code Emergency Link Generator',
      'Real-Time Distance, Battery & Signal Telemetry'
    ]
  },
  {
    id: 5,
    titleHi: '5. सड़क सुगमता एवं सुरक्षित मार्ग प्लानर',
    titleEn: '5. Road Accessibility & Safe Route Planner',
    timestampStart: 255,
    timestampEnd: 315,
    moduleKey: 'rerouting',
    badge: 'OSRM ROUTE',
    icon: Navigation,
    color: 'from-teal-500 to-cyan-600',
    narrationHi: 'सुरक्षित यात्रा और निकास के लिए रोड एक्सेसिबिलिटी मॉड्यूल खोलें। यह आपको भूस्खलन और बाढ़ से बंद सड़कों की चेतावनी देता है और आपके लिए सबसे सुरक्षित हरा मार्ग कैलकुलेट करता है।',
    narrationEn: 'Check real-time highway landslide & flood blockages. Calculate alternate safe green corridors for your family evacuation.',
    screenHighlights: [
      'Live Highway Blockage & Mudslide Watch',
      'OSRM Safe Alternate Route Calculation',
      'Bridge Water Level & Transit Safety Clearance'
    ]
  },
  {
    id: 6,
    titleHi: '6. पास के अस्पताल, राहत शिविर एवं हेल्प सेंटर',
    titleEn: '6. Emergency Facilities & Rescue Points Finder',
    timestampStart: 315,
    timestampEnd: 375,
    moduleKey: 'facilities',
    badge: 'RESCUE',
    icon: HeartPulse,
    color: 'from-rose-600 to-pink-600',
    narrationHi: 'आपातकालीन सुविधाएं में आपको अपने सबसे पास उपलब्ध अस्पताल, राहत शिविर, पीने के पानी के डिपो और हेलीपैड दूरी के हिसाब से मिलेंगे। आप खाली बेड देख सकते हैं और सीधे फोन कर सकते हैं।',
    narrationEn: 'Locate nearest trauma hospitals, active relief camps with available bed capacity, drinking water depots, and emergency helipads.',
    screenHighlights: [
      'Distance-sorted Hospitals & Relief Camps',
      'Live Available ICU Beds & Relief Ration Status',
      '1-Click Direct Phone Call Helpline'
    ]
  },
  {
    id: 7,
    titleHi: '7. मौसम, बाढ़ एवं भूस्खलन जोखिम radar',
    titleEn: '7. Live Weather, Flood & Slope Hazard Radar',
    timestampStart: 375,
    timestampEnd: 435,
    moduleKey: 'weather',
    badge: 'RADAR',
    icon: CloudRain,
    color: 'from-blue-600 to-cyan-600',
    narrationHi: 'मौसम और बाढ़ इंटेलिजेंस मॉड्यूल आपको 24 घंटे पहले नदियों का जलस्तर बढ़ने, बादल फटने और पहाड़ी ढलान खिसकने की चेतावनी देते हैं ताकि आप समय रहते सुरक्षित स्थान पर चले जाएं।',
    narrationEn: 'Monitor IMD Doppler Radar, river basin water level overtopping warnings, and slope stability index 24 hours in advance.',
    screenHighlights: [
      'IMD Live Doppler Precipitation Radar',
      'Brahmaputra River Basin Flood Warning',
      'Hill District Landslide Hazard Telemetry'
    ]
  },
  {
    id: 8,
    titleHi: '8. आपदा सुरक्षा गाइड एवं 72-घंटे सरवाइवल किट',
    titleEn: '8. Disaster Safety Guide & 72-Hour Kit',
    timestampStart: 435,
    timestampEnd: 495,
    moduleKey: 'safetyguide',
    badge: 'SAFETY',
    icon: BookOpen,
    color: 'from-amber-600 to-orange-600',
    narrationHi: 'सुरक्षा गाइड में बाढ़, भूकंप और भूस्खलन के समय क्या करें और क्या न करें की सूची है। साथ ही 72-घंटे सरवाइवल किट चेकलिस्ट से आप आपातकालीन राशन, पानी और फर्स्ट ऐड की तैयारी कर सकते हैं।',
    narrationEn: 'Read approved survival Do’s and Don’ts for floods and earthquakes. Complete your 72-hour family emergency kit checklist.',
    screenHighlights: [
      'Clear Do’s and Don’ts Survival Protocols',
      'Interactive 72-Hour Family Emergency Checklist',
      '24/7 Toll-Free National Emergency Numbers'
    ]
  },
  {
    id: 9,
    titleHi: '9. स्थान बुद्धिमत्ता रिपोर्ट एवं 2-पेज PDF',
    titleEn: '9. Location Intelligence Report & 2-Page PDF',
    timestampStart: 495,
    timestampEnd: 555,
    moduleKey: 'location',
    badge: 'PDF REPORT',
    icon: Compass,
    color: 'from-sky-500 to-indigo-600',
    narrationHi: 'अपने घर या क्षेत्र का 360° आपदा रिस्क स्कोर जानने के लिए अपना पता दर्ज करें और केवल 2-पेज की संक्षिप्त व प्रामाणिक PDF रिपोर्ट डाउनलोड करके प्रशासन के साथ शेयर करें।',
    narrationEn: 'Enter any address to generate a 360° multi-hazard risk assessment and download an official shareable 2-page PDF report.',
    screenHighlights: [
      '360° Address Disaster Risk Assessment',
      'Waste-Free Downloadable 2-Page PDF Report',
      'Dynamic Shareable Verification URL'
    ]
  },
  {
    id: 10,
    titleHi: '10. वॉइस AI असिस्टेंट एवं 24/7 हेल्पलाइन नंबर',
    titleEn: '10. Universal Voice AI Assistant & Toll-Free Hub',
    timestampStart: 555,
    timestampEnd: 600,
    moduleKey: 'home',
    badge: 'AI VOICE',
    icon: Bot,
    color: 'from-indigo-600 to-purple-600',
    narrationHi: 'यदि आपको कोई भी सवाल पूछना हो तो ऊपर AI Agent बटन दबाकर हिंदी में बोलकर पूछें। जीवन सेतु आपकी और आपके परिवार की सुरक्षा के लिए 24 घंटे तत्पर है। सुरक्षित रहें!',
    narrationEn: 'Ask any question using Hindi or English voice search via AI Agent. Jeevan Setu is dedicated to protecting lives 24/7.',
    screenHighlights: [
      'Hindi & English Voice AI Emergency Assistant',
      'Toll-Free Emergency Contacts: 112 / 1078 / 1070 / 108',
      'Bookmark http://localhost:3000 Today!'
    ]
  }
];

export default function CitizenVideoWalkthroughModal({
  isOpen,
  onClose,
  onNavigateModule,
  onTriggerSOS
}: CitizenVideoWalkthroughModalProps) {
  const { language } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // 0 to 600 seconds
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  const timerRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Update scene index based on currentTime
  useEffect(() => {
    const foundIdx = VIDEO_SCENES.findIndex(
      s => currentTime >= s.timestampStart && currentTime < s.timestampEnd
    );
    if (foundIdx !== -1 && foundIdx !== currentSceneIndex) {
      setCurrentSceneIndex(foundIdx);
      if (isPlaying && !isMuted && synthRef.current) {
        speakSceneNarration(VIDEO_SCENES[foundIdx]);
      }
    }
  }, [currentTime]);

  // Speech Narration Handler
  const speakSceneNarration = (scene: Scene) => {
    if (!synthRef.current || isMuted) return;
    try {
      synthRef.current.cancel();
      const textToSpeak = language === 'hi' ? scene.narrationHi : scene.narrationEn;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      utterance.rate = 0.95;
      utteranceRef.current = utterance;
      synthRef.current.speak(utterance);
    } catch (_) {}
  };

  // Play / Pause timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 600) {
            setIsPlaying(false);
            if (synthRef.current) synthRef.current.cancel();
            return 600;
          }
          return prev + 1;
        });
      }, 1000);

      // Speak initial scene if starting
      if (currentTime === 0 && !isMuted) {
        speakSceneNarration(VIDEO_SCENES[0]);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (synthRef.current) synthRef.current.cancel();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const currentScene = VIDEO_SCENES[currentSceneIndex] || VIDEO_SCENES[0];
  const IconComponent = currentScene.icon;

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    const foundIdx = VIDEO_SCENES.findIndex(
      s => seconds >= s.timestampStart && seconds < s.timestampEnd
    );
    if (foundIdx !== -1) {
      setCurrentSceneIndex(foundIdx);
      if (isPlaying && !isMuted) {
        speakSceneNarration(VIDEO_SCENES[foundIdx]);
      }
    }
  };

  const togglePlay = () => {
    if (currentTime >= 600) setCurrentTime(0);
    setIsPlaying(prev => !prev);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/85 backdrop-blur-md flex flex-col justify-center items-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#070d1f] border border-slate-200 dark:border-slate-800 w-full max-w-5xl rounded-3xl flex flex-col overflow-hidden shadow-2xl max-h-[95vh]">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c142b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                {language === 'hi' ? '🎥 जीवन सेतु — 10-मिनट संपूर्ण नागरिक वीडियो गाइड' : '🎥 Jeevan Setu — 10-Minute Official Citizen Video Guide'}
              </h2>
              <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">
                {language === 'hi' ? 'एआई आवाज़ एवं स्टेप-बाय-स्टेप लाइव डेमो' : 'AI Voice Narration & Step-by-Step Interactive Demo'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPlaying(false);
              if (synthRef.current) synthRef.current.cancel();
              onClose();
            }}
            className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Display Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* Main Visual Stage Box */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-white p-6 sm:p-8 min-h-[340px] flex flex-col justify-between shadow-xl">
            {/* Ambient Background Glow */}
            <div className={`absolute -right-20 -top-20 w-80 h-80 bg-gradient-to-br ${currentScene.color} opacity-20 rounded-full blur-3xl pointer-events-none`} />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Stage Top Bar */}
            <div className="relative z-10 flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {currentScene.badge}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  SCENE {currentScene.id} / 10
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatTime(currentTime)} / 10:00
                </span>
              </div>
            </div>

            {/* Stage Center Content */}
            <div className="relative z-10 my-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentScene.color} text-white shadow-lg shrink-0`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {language === 'hi' ? currentScene.titleHi : currentScene.titleEn}
                </h3>
              </div>

              {/* On-screen Visual Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {currentScene.screenHighlights.map((hl, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{hl}</span>
                  </div>
                ))}
              </div>

              {/* AI Voice Narration Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-sky-500/30 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-300 tracking-wider">
                  <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                  <span>AI VOICE NARRATION (बोलकर समझा रहा है)</span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-sky-200 leading-relaxed">
                  "{language === 'hi' ? currentScene.narrationHi : currentScene.narrationEn}"
                </p>
              </div>
            </div>

            {/* Stage Bottom Direct Action Button */}
            <div className="relative z-10 pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-xs text-slate-400 font-medium">
                {language === 'hi' ? 'लाइव फीचर आजमाने के लिए क्लिक करें:' : 'Try feature live:'}
              </span>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  if (synthRef.current) synthRef.current.cancel();
                  onClose();
                  if (currentScene.moduleKey === 'sos' && onTriggerSOS) {
                    onTriggerSOS();
                  } else if (onNavigateModule) {
                    onNavigateModule(currentScene.moduleKey);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
              >
                <span>{language === 'hi' ? 'इस फीचर पर जाएं ➔' : 'Open This Feature ➔'}</span>
              </button>
            </div>
          </div>

          {/* Video Control Bar */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            {/* Scrubber Range Input */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={600}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-2 bg-slate-300 dark:bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                <span>00:00</span>
                <span>02:00 (SOS)</span>
                <span>04:15 (Safe Routes)</span>
                <span>06:15 (Radar)</span>
                <span>08:15 (PDF)</span>
                <span>10:00</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePlay}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition"
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                  <span>{isPlaying ? (language === 'hi' ? 'रोकें (Pause)' : 'Pause Video') : (language === 'hi' ? '▶️ वीडियो चलाएं (Play)' : '▶️ Play Video')}</span>
                </button>

                <button
                  onClick={() => handleSeek(0)}
                  className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
                  title="Reset to 00:00"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMuted(prev => !prev)}
                  className={`p-2.5 rounded-xl border transition cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent'
                  }`}
                  title={isMuted ? 'Unmute AI Voice' : 'Mute AI Voice'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Scene Navigation Prev/Next */}
              <div className="flex items-center gap-2">
                <button
                  disabled={currentSceneIndex === 0}
                  onClick={() => handleSeek(VIDEO_SCENES[Math.max(0, currentSceneIndex - 1)].timestampStart)}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">{language === 'hi' ? 'पिछला सीन' : 'Prev Scene'}</span>
                </button>

                <button
                  disabled={currentSceneIndex === VIDEO_SCENES.length - 1}
                  onClick={() => handleSeek(VIDEO_SCENES[Math.min(VIDEO_SCENES.length - 1, currentSceneIndex + 1)].timestampStart)}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">{language === 'hi' ? 'अगला सीन' : 'Next Scene'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Scene Playlist Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
              {language === 'hi' ? '10-मिनट वीडियो सीन सूची (Video Playlist)' : '10-Minute Video Scene Playlist'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VIDEO_SCENES.map((scene, sIdx) => {
                const isActive = currentSceneIndex === sIdx;
                const SceneIcon = scene.icon;
                return (
                  <button
                    key={scene.id}
                    onClick={() => handleSeek(scene.timestampStart)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition cursor-pointer ${
                      isActive
                        ? 'bg-sky-500/15 border-sky-500/60 ring-2 ring-sky-500/30 text-slate-900 dark:text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br ${scene.color}`}>
                      <SceneIcon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black truncate">
                          {language === 'hi' ? scene.titleHi : scene.titleEn}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {formatTime(scene.timestampStart)}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
