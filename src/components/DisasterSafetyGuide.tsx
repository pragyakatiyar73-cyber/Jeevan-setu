import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Package,
  BookOpen,
  CloudRain,
  Flame,
  Zap,
  Info,
  ChevronRight,
  Download,
  Share2,
  CheckSquare,
  Square,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface DisasterSafetyGuideProps {
  onTriggerSOS?: () => void;
}

export default function DisasterSafetyGuide({ onTriggerSOS }: DisasterSafetyGuideProps) {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<'flood' | 'landslide' | 'earthquake' | 'cyclone' | 'kit'>('flood');
  
  // Interactive Emergency Kit Checkbox State
  const [kitChecked, setKitChecked] = useState<Record<string, boolean>>({
    water: true,
    firstaid: true,
    torch: true,
    radio: false,
    food: true,
    documents: false,
    whistle: false,
    powerbank: false,
    medicines: true,
    warmclothes: false
  });

  const toggleKitItem = (key: string) => {
    setKitChecked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const emergencyContacts = [
    { name: t('safety.ndrfHelpline', 'NDRF National Helpline'), number: '1078', desc: t('safety.ndrfDesc', 'National Disaster Response Force Dispatch'), icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { name: t('safety.nationalEmergency', 'National Emergency Number'), number: '112', desc: t('safety.nationalEmergencyDesc', 'All-in-One Emergency Services (Police/Fire/Ambulance)'), icon: PhoneCall, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
    { name: t('safety.sdma', 'State Disaster Management (SDMA)'), number: '1070', desc: t('safety.sdmaDesc', 'State Control Room & Flood Triage'), icon: Info, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { name: t('safety.ambulance', 'Medical Emergency Ambulance'), number: '108', desc: t('safety.ambulanceDesc', '24/7 Advanced Life Support Ambulance'), icon: Zap, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
  ];

  const safetyData = {
    flood: {
      title: 'Flood & Flash Flood Safety Guide',
      subtitle: 'Guidelines for heavy cloudbursts, river overtopping, and dam release warnings.',
      icon: CloudRain,
      color: 'from-blue-600 to-cyan-600',
      dos: [
        'Move immediately to higher ground or upper floors of concrete buildings.',
        'Keep emergency kit, drinking water, and essential medicines ready in waterproof bags.',
        'Turn off main electrical switches and gas valves before evacuating.',
        'Listen to official IMD/CWC weather alerts on battery-operated radios or phones.',
        'Boil drinking water before consuming to prevent waterborne diseases.'
      ],
      donts: [
        'DO NOT walk, swim, or drive through moving flood waters (even 6 inches can knock you down).',
        'DO NOT touch fallen electrical power lines or submerged electric poles.',
        'DO NOT eat food that has come into direct contact with flood water.',
        'DO NOT spread rumors; verify all disaster news via official government channels.',
        'DO NOT park vehicles near riverbanks, weak bridges, or low-lying drainage routes.'
      ],
      steps: [
        { title: '1. Early Warning Phase', desc: 'Pack 72-hour survival kit & move cattle/livestock to elevated ground.' },
        { title: '2. Evacuation Phase', desc: 'Follow designated green evacuation corridors to nearest relief camp.' },
        { title: '3. Post-Flood Safety', desc: 'Do not enter submerged homes until structural stability is certified.' }
      ]
    },
    landslide: {
      title: 'Landslide & Slope Hazard Safety Guide',
      subtitle: 'Protocols for hill slope failure, debris flows, and mountain rockfalls.',
      icon: ShieldAlert,
      color: 'from-amber-600 to-orange-600',
      dos: [
        'Watch for early warning signs: sudden soil cracks, tilting trees, or muddy water flow.',
        'Evacuate immediately if you hear unusual sounds like trees cracking or boulders knocking.',
        'Move away from the path of a landslide or slope flow as quickly as possible.',
        'Curled up into a tight ball and protect your head if escape is impossible during slope collapse.',
        'Report slope displacements to local Border Roads Organisation (BRO) or Disaster Cell.'
      ],
      donts: [
        'DO NOT stay in valley bottoms or natural drainage channels during torrential rains.',
        'DO NOT cross active landslide debris zones until geotechnical clearance is issued.',
        'DO NOT build houses near steep unreinforced slopes or loose shale embankments.',
        'DO NOT ignore sudden water level drops in mountain streams (indicates upstream blockage).',
        'DO NOT drive on unstable mountain highways at night during heavy rain.'
      ],
      steps: [
        { title: '1. Slope Inspection', desc: 'Identify steep cut slopes and clear blocked drainage channels.' },
        { title: '2. Immediate Escape', desc: 'Run perpendicular to the landslide movement direction.' },
        { title: '3. Rescue Alert', desc: 'Send GPS location via Jeevan Setu SOS for BRO excavator dispatch.' }
      ]
    },
    earthquake: {
      title: 'Earthquake Safety Guide',
      subtitle: 'Drop, Cover, and Hold On guidelines for seismic shocks and tremors.',
      icon: AlertTriangle,
      color: 'from-rose-600 to-red-600',
      dos: [
        'DROP to your hands and knees immediately when shaking starts.',
        'COVER your head and neck under a sturdy table or desk.',
        'HOLD ON to your shelter until shaking completely stops.',
        'If outdoors, move to an open area away from tall buildings, trees, and power lines.',
        'Be prepared for aftershocks; stay alert for secondary gas leaks or fires.'
      ],
      donts: [
        'DO NOT use elevators or lifts during or immediately after an earthquake.',
        'DO NOT stand under doorways or near glass windows, mirrors, or heavy furniture.',
        'DO NOT rush outside during shaking (falling masonry causes most injuries).',
        'DO NOT light matches, lighters, or operate switches if gas leaks are suspected.',
        'DO NOT enter damaged buildings until inspected by structural engineers.'
      ],
      steps: [
        { title: '1. Shaking Period', desc: 'Drop, Cover, and Hold On under heavy table or desk.' },
        { title: '2. Post-Quake Exit', desc: 'Use stairs carefully and assemble in open grounds.' },
        { title: '3. Triage Check', desc: 'Check family for injuries and provide basic first aid.' }
      ]
    },
    cyclone: {
      title: 'Cyclone & Thunderstorm Safety Guide',
      subtitle: 'Safety measures for high-velocity winds, lightning, and storm surges.',
      icon: Zap,
      color: 'from-purple-600 to-indigo-600',
      dos: [
        'Seek shelter in a well-constructed concrete building away from windows.',
        'Unplug sensitive electronic devices during severe lightning storms.',
        'Store adequate non-perishable food, fresh water, and emergency batteries.',
        'Trim dead tree branches near house roofs before cyclone season.',
        'If caught outdoors during lightning, crouch low on the balls of your feet.'
      ],
      donts: [
        'DO NOT go outside during the "Eye of the Cyclone" (winds will resume violently from opposite direction).',
        'DO NOT take shelter under tall isolated trees or metal poles during lightning.',
        'DO NOT touch metal fences, tin roofs, or plumbing pipes during thunderstorms.',
        'DO NOT venture into the sea or coastal zones when high wave alerts are active.',
        'DO NOT ignore official coastal evacuation orders issued by District Collector.'
      ],
      steps: [
        { title: '1. Watch Phase', desc: 'Board up glass windows and secure loose rooftop items.' },
        { title: '2. Severe Gusts', desc: 'Remain in innermost room or hallway away from windows.' },
        { title: '3. All-Clear Signal', desc: 'Wait for official radio broadcast before stepping outdoors.' }
      ]
    }
  };

  const checkedCount = Object.values(kitChecked).filter(Boolean).length;
  const totalCount = Object.keys(kitChecked).length;
  const kitPercentage = Math.round((checkedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 sm:p-8 lg:p-10 shadow-xl dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('safety.badge', 'OFFICIAL DISASTER SURVIVAL GUIDE')}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {t('safety.title', 'Disaster Preparedness & Safety Guidelines')}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {t('safety.subtitle', 'Actionable survival protocols, emergency checklists, do’s and don’ts, and 24/7 toll-free helpline numbers approved for flood, landslide, earthquake, and cyclone emergencies.')}
            </p>
          </div>

          {/* Quick SOS Call to Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {onTriggerSOS && (
              <button
                onClick={onTriggerSOS}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 border border-rose-400/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t('safety.triggerSos', 'TRIGGER SOS DISTRESS 🚨')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOLL-FREE EMERGENCY HELPLINES CARDS */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-sky-500" />
          <span>{t('safety.helplinesTitle', '24/7 Emergency Toll-Free Helplines')}</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {emergencyContacts.map((contact, idx) => {
            const IconComp = contact.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all duration-200 hover:shadow-lg flex flex-col justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`p-2 rounded-xl border ${contact.color}`}>
                      <IconComp className="w-4 h-4" />
                    </span>
                    <a
                      href={`tel:${contact.number}`}
                      className="text-lg font-black font-mono text-slate-900 dark:text-white hover:text-sky-500 dark:hover:text-sky-400 transition"
                    >
                      {contact.number}
                    </a>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                      {contact.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {contact.desc}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${contact.number}`}
                  className="mt-3 w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>{t('safety.callNow', 'Call')} {contact.number} {t('safety.now', 'Now')}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DISASTER CATEGORY SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'flood', label: t('safety.tabFlood', '🌊 Flood Safety'), color: 'from-blue-600 to-cyan-600' },
          { id: 'landslide', label: t('safety.tabLandslide', '⛰️ Landslide Safety'), color: 'from-amber-600 to-orange-600' },
          { id: 'earthquake', label: t('safety.tabEarthquake', '🌋 Earthquake Safety'), color: 'from-rose-600 to-red-600' },
          { id: 'cyclone', label: t('safety.tabCyclone', '⚡ Cyclone & Lightning'), color: 'from-purple-600 to-indigo-600' },
          { id: 'kit', label: t('safety.tabKit', '🎒 72-Hour Survival Kit'), color: 'from-emerald-600 to-teal-600' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 shrink-0 border ${
              activeCategory === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white border-transparent shadow-lg`
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 4. MAIN CONTENT AREA FOR SELECTED CATEGORY */}
      {activeCategory !== 'kit' ? (
        <div className="space-y-6">
          
          {/* Header Card for Active Disaster */}
          {(() => {
            const currentData = safetyData[activeCategory];
            const IconComponent = currentData.icon;
            return (
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
                
                {/* Title & Subtitle */}
                <div className="flex items-start gap-4">
                  <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${currentData.color} text-white shadow-lg shrink-0`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {currentData.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {currentData.subtitle}
                    </p>
                  </div>
                </div>

                {/* 3-Step Protocol Flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                  {currentData.steps.map((step, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-sky-500" />
                        <span>{step.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* DO's AND DONT's GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  
                  {/* DO'S COLUMN */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t('safety.recommendedDos', "RECOMMENDED DO'S (KYA KAREIN)")}</span>
                    </div>

                    <div className="space-y-2.5">
                      {currentData.dos.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DONT'S COLUMN */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm uppercase tracking-wide">
                      <XCircle className="w-5 h-5" />
                      <span>{t('safety.criticalDonts', "CRITICAL DONT'S (KYA NA KAREIN)")}</span>
                    </div>

                    <div className="space-y-2.5">
                      {currentData.donts.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed flex items-start gap-2.5">
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            );
          })()}

        </div>
      ) : (
        
        /* 5. 72-HOUR SURVIVAL KIT INTERACTIVE CHECKLIST */
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  72-Hour Disaster Emergency Survival Kit
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  Interactive checklist for essential family survival items during flood or evacuation.
                </p>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="w-full sm:w-64 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                <span>Kit Readiness</span>
                <span className="text-emerald-500">{kitPercentage}% Ready</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${kitPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* CHECKLIST ITEMS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {[
              { key: 'water', label: 'Drinking Water (3 Liters per person per day)', desc: '1-Gallon sealed bottles for min 3 days' },
              { key: 'firstaid', label: 'First Aid Kit & Bandages', desc: 'Antiseptics, gauze, medical tape, tweezers' },
              { key: 'torch', label: 'LED Flashlight / Torch', desc: 'With extra rechargeable/dry cell batteries' },
              { key: 'radio', label: 'Battery-Powered / Crank Radio', desc: 'To receive official IMD/SDMA weather broadcasts' },
              { key: 'food', label: 'Non-Perishable Packaged Food', desc: 'Energy bars, canned beans, dried fruits' },
              { key: 'documents', label: 'Aadhaar / ID & Land Documents', desc: 'Kept in a waterproof ziplock plastic pouch' },
              { key: 'whistle', label: 'Signal Whistle', desc: 'To signal for help to rescue search teams' },
              { key: 'powerbank', label: 'Charged Mobile Power Bank', desc: 'Min 10,000 mAh for emergency communication' },
              { key: 'medicines', label: 'Prescription Medicines', desc: '7-day supply of daily maintenance medications' },
              { key: 'warmclothes', label: 'Warm Rainproof Jacket & Blanket', desc: 'Compact thermal blankets and waterproof poncho' }
            ].map((item) => {
              const isChecked = kitChecked[item.key] || false;
              return (
                <div
                  key={item.key}
                  onClick={() => toggleKitItem(item.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white'
                      : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <button className="mt-0.5 shrink-0 text-emerald-500">
                    {isChecked ? <CheckSquare className="w-5 h-5 fill-emerald-500 text-white dark:text-slate-900" /> : <Square className="w-5 h-5 text-slate-400" />}
                  </button>
                  <div className="space-y-0.5">
                    <div className={`text-xs font-black ${isChecked ? 'line-through opacity-80' : ''}`}>
                      {item.label}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
