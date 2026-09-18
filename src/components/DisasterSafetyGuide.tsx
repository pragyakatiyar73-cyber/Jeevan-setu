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
  ArrowRight,
  Globe
} from 'lucide-react';
import { useTranslation } from '../i18n';

interface DisasterSafetyGuideProps {
  onTriggerSOS?: () => void;
}

export default function DisasterSafetyGuide({ onTriggerSOS }: DisasterSafetyGuideProps) {
  const { t, language, setLanguage } = useTranslation();
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



  const safetyDataHi = {
    flood: {
      title: 'बाढ़ एवं जलभराव सुरक्षा निर्देश',
      subtitle: 'मूसलाधार बारिश, नदियों के उफान और बांध से पानी छोड़े जाने के दौरान बचाव हेतु दिशानिर्देश।',
      icon: CloudRain,
      color: 'from-blue-600 to-cyan-600',
      dos: [
        'खिड़कियों से दूर कंक्रीट की मजबूत इमारतों के ऊंचे स्थानों या ऊपरी मंजिलों पर तुरंत जाएं।',
        'आपातकालीन किट, पीने का पानी और आवश्यक दवाएं वाटरप्रूफ बैग में तैयार रखें।',
        'स्थान छोड़ने से पहले मुख्य बिजली के स्विच और गैस वाल्व बंद कर दें।',
        'बैटरी से चलने वाले रेडियो या मोबाइल पर आधिकारिक IMD/CWC मौसम चेतावनियां और अलर्ट सुनें।',
        'जलजनित बीमारियों से बचने के लिए पीने के पानी को हमेशा उबालकर ही प्रयोग करें।'
      ],
      donts: [
        'बाढ़ के बहते पानी में कभी न चलें, तैरें या वाहन न चलाएं (केवल 6 इंच बहता पानी भी आपको गिरा सकता है)।',
        'टूटे या गिरे हुए बिजली के तारों और जलमग्न बिजली के खंभों को बिल्कुल न छुएं।',
        'बाढ़ के पानी के सीधे संपर्क में आए भोजन या खाद्य पदार्थों का सेवन न करें।',
        'अफवाहें न फैलाएं; आपदा संबंधी सभी समाचारों का आधिकारिक सरकारी स्रोतों से ही सत्यापन करें।',
        'नदियों के किनारों, कमजोर पुलों या निचले जल निकासी मार्गों के पास वाहन पार्क न करें।'
      ],
      steps: [
        { title: '1. प्रारंभिक चेतावनी चरण', desc: '72-घंटे की आपातकालीन उत्तरजीविता किट पैक करें और मवेशियों को ऊंचे स्थान पर ले जाएं।' },
        { title: '2. निकासी चरण', desc: 'निकटतम सुरक्षित राहत शिविर तक पहुंचने के लिए निर्धारित ग्रीन कॉरिडोर का पालन करें।' },
        { title: '3. बाढ़ के बाद की सुरक्षा', desc: 'जब तक भवन की संरचनात्मक सुरक्षा प्रमाणित न हो, जलमग्न घरों में प्रवेश न करें।' }
      ]
    },
    landslide: {
      title: 'भूस्खलन एवं ढलान जोखिम सुरक्षा निर्देश',
      subtitle: 'पहाड़ी ढलानों के खिसकने, मलबे के बहाव और चट्टानों के गिरने से सुरक्षा के उपाय।',
      icon: ShieldAlert,
      color: 'from-amber-600 to-orange-600',
      dos: [
        'शुरुआती संकेतों पर नजर रखें: जमीन में अचानक दरारें, झुकते हुए पेड़ या मटमैला पानी का बहाव।',
        'यदि आपको पेड़ों के टूटने या पत्थरों के टकराने की असामान्य आवाजें सुनाई दें, तो तुरंत क्षेत्र खाली कर दें।',
        'भूस्खलन या मलबे के बहाव के रास्ते से जितनी जल्दी हो सके दूर चले जाएं।',
        'यदि ढलान धंसने के दौरान निकलना असंभव हो, तो शरीर को गोल मोड़कर अपने सिर और गर्दन की रक्षा करें।',
        'स्थानीय सीमा सड़क संगठन (BRO) या आपदा नियंत्रण कक्ष को ढलान खिसकने की तुरंत सूचना दें।'
      ],
      donts: [
        'मूसलाधार बारिश के दौरान घाटी के निचले हिस्सों या प्राकृतिक जल निकासी मार्गों में न ठहरें।',
        'जब तक भू-तकनीकी सुरक्षा मंजूरी न मिले, तब तक सक्रिय भूस्खलन मलबे वाले क्षेत्रों को पार न करें।',
        'खड़ी कमजोर ढलानों या कच्चे शेल तटबंधों के पास घर न बनाएं।',
        'पहाड़ी नालों में पानी के स्तर में अचानक आई कमी को नजरअंदाज न करें (यह ऊपर रुकावट का संकेत है)।',
        'भारी बारिश के दौरान रात के समय असुरक्षित पहाड़ी राजमार्गों पर वाहन न चलाएं।'
      ],
      steps: [
        { title: '1. ढलान निरीक्षण चरण', desc: 'खतरनाक ढलानों की पहचान करें और बंद जल निकासी नालियों को साफ रखें।' },
        { title: '2. तत्काल बचाव चरण', desc: 'भूस्खलन के बहाव की दिशा के समकोण (लंबवत) होकर तुरंत दूर भागें।' },
        { title: '3. रेस्क्यू अलर्ट', desc: 'BRO और रेस्क्यू टीम की मदद के लिए Jeevan Setu SOS से तुरंत जीपीएस लोकेशन भेजें।' }
      ]
    },
    earthquake: {
      title: 'भूकंप सुरक्षा निर्देश',
      subtitle: 'भूकंपीय झटकों के दौरान झुकें, ढकें और पकड़ें के नियम।',
      icon: AlertTriangle,
      color: 'from-rose-600 to-red-600',
      dos: [
        'कंपन शुरू होते ही तुरंत अपने हाथों और घुटनों के बल जमीन पर झुक जाएं।',
        'किसी मजबूत मेज या डेस्क के नीचे अपने सिर और गर्दन को अच्छी तरह ढकें।',
        'जब तक कंपन पूरी तरह बंद न हो जाए, अपनी मेज/आश्रय को कसकर पकड़े रखें।',
        'यदि आप बाहर हैं, तो ऊंची इमारतों, पेड़ों, खंभों और बिजली की लाइनों से दूर खुले मैदान में चले जाएं।',
        'बाद के झटकों के लिए तैयार रहें; गैस लीक या आग के खतरों के प्रति सतर्क रहें।'
      ],
      donts: [
        'भूकंप के दौरान या तुरंत बाद लिफ्ट/एलिवेटर का उपयोग बिल्कुल न करें।',
        'दरवाजों के चौखट के नीचे, कांच की खिड़कियों, शीशों या भारी अलमारी के पास न खड़े हों।',
        'कंपन के दौरान बाहर भागने की कोशिश न करें (गिरने वाले मलबे से सबसे ज्यादा चोटें आती हैं)।',
        'यदि गैस रिसाव का संदेह हो, तो माचिस, लाइटर न जलाएं और न ही बिजली के स्विच ऑन/ऑफ करें।',
        'जब तक संरचनात्मक इंजीनियरों द्वारा जांच न की जाए, तब तक क्षतिग्रस्त इमारतों में प्रवेश न करें।'
      ],
      steps: [
        { title: '1. कंपन अवधि नियम', desc: 'मज बूत मेज के नीचे तुरंत झुकें, सिर ढकें और कसकर पकड़ें।' },
        { title: '2. सुरक्षित निकासी', desc: 'सीढ़ियों का सावधानीपूर्वक प्रयोग करें और खुले मैदान में एकत्र हों।' },
        { title: '3. प्राथमिक चिकित्सा', desc: 'परिवार के सदस्यों की चोटों की जांच करें और तुरंत फर्स्ट एड दें।' }
      ]
    },
    cyclone: {
      title: 'चक्रवात एवं वज्रपात सुरक्षा निर्देश',
      subtitle: 'तेज चक्रवाती हवाओं, बिजली चमकने और समुद्री तूफान के खतरों से बचाव के उपाय।',
      icon: Zap,
      color: 'from-purple-600 to-indigo-600',
      dos: [
        'खिड़कियों से दूर मजबूत कंक्रीट की इमारत में सुरक्षित आश्रय लें।',
        'भारी बिजली तूफान के दौरान संवेदनशील इलेक्ट्रॉनिक उपकरणों को स्विच से अनप्लग कर दें।',
        'पर्याप्त मात्रा में सूखा भोजन, ताजा पीने का पानी और आपातकालीन बैटरियां तैयार रखें।',
        'चक्रवात का मौसम शुरू होने से पहले घर की छतों के पास की सूखी/मृत पेड़ की शाखाओं को काट दें।',
        'यदि बिजली चमकने के दौरान खुले में फंस जाएं, तो पंजों के बल नीचे झुककर बैठ जाएं।'
      ],
      donts: [
        'चक्रवात के दौरान बाहर न निकलें (हवाएं उल्टी दिशा से भयानक रूप से शुरू होंगी)।',
        'बिजली चमकने के दौरान ऊंचे अकेले पेड़ों या लोहे के खंभों के नीचे आश्रय न लें।',
        'गरज के साथ तूफान के दौरान लोहे की बाड़, टिन की छतों या पानी के पाइपों को न छुएं।',
        'उच्च समुद्री लहरों की चेतावनी सक्रिय होने पर समुद्र या तटीय क्षेत्रों में न जाएं।',
        'जिला कलेक्टर या प्रशासन द्वारा जारी तटीय निकासी आदेशों की बिल्कुल अनदेखी न करें।'
      ],
      steps: [
        { title: '1. वॉच (निगरानी) चरण', desc: 'कांच की खिड़कियों को बंद करें और छत की ढीली वस्तुओं को बांधकर सुरक्षित करें।' },
        { title: '2. तीव्र हवाओं का चरण', desc: 'खिड़कियों से दूर घर के सबसे अंदरूनी कमरे या हॉलवे में रहें।' },
        { title: '3. ऑल-क्लियर संकेत', desc: 'बाहर निकलने से पहले आधिकारिक रेडियो या मौसम बुलेटिन का इंतजार करें।' }
      ]
    }
  };

  const safetyDataEn = {
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

  const isHindi = language === 'hi';
  const safetyData = isHindi ? safetyDataHi : safetyDataEn;

  const emergencyContacts = [
    { name: isHindi ? 'NDRF राष्ट्रीय हेल्पलाइन' : 'NDRF National Helpline', number: '1078', desc: isHindi ? 'राष्ट्रीय आपदा प्रतिक्रिया बल प्रेषण कक्ष' : 'National Disaster Response Force Dispatch Control Room', icon: ShieldAlert, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { name: isHindi ? 'राष्ट्रीय आपातकालीन नंबर' : 'National Emergency Number', number: '112', desc: isHindi ? 'ऑल-इन-वन आपातकालीन सेवाएं (पुलिस/अग्नि/एम्बुलेंस)' : 'All-in-One Emergency Services (Police / Fire / Ambulance)', icon: PhoneCall, color: 'text-sky-500 bg-sky-500/10 border-sky-500/30' },
    { name: isHindi ? 'राज्य आपदा प्रबंधन प्राधिकरण (SDMA)' : 'State Disaster Management Authority (SDMA)', number: '1070', desc: isHindi ? 'राज्य नियंत्रण कक्ष एवं बाढ़ राहत केंद्र' : 'State Control Room & Flood Relief Operations', icon: Info, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { name: isHindi ? 'चिकित्सा आपातकालीन एम्बुलेंस' : 'Medical Emergency Ambulance', number: '108', desc: isHindi ? '24/7 उन्नत जीवन सहायता एम्बुलेंस सेवा' : '24/7 Advanced Life Support Ambulance Service', icon: Zap, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' }
  ];

  const checkedCount = Object.values(kitChecked).filter(Boolean).length;
  const totalCount = Object.keys(kitChecked).length;
  const kitPercentage = Math.round((checkedCount / totalCount) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 font-sans select-none">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-6 sm:p-8 lg:p-10 shadow-xl dark:shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-500/20 border border-sky-200 dark:border-sky-500/40 text-sky-700 dark:text-sky-300 text-xs font-black uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isHindi ? 'आधिकारिक आपदा उत्तरजीविता निर्देशिका' : 'OFFICIAL DISASTER SURVIVAL GUIDE'}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {isHindi ? 'आपदा तैयारी एवं सुरक्षा दिशानिर्देश' : 'Disaster Preparedness & Safety Guidelines'}
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {isHindi ? 'बाढ़, भूस्خलन, भूकंप और चक्रवात आपात स्थितियों के लिए त्वरित उत्तरजीविता नियम, आपातकालीन चेकलिस्ट, क्या करें और क्या न करें, एवं 24/7 टोल-फ्री हेल्पलाइन नंबर।' : 'Actionable survival protocols, emergency checklists, do’s and don’ts, and 24/7 toll-free helpline numbers approved for flood, landslide, earthquake, and cyclone emergencies.'}
            </p>
          </div>

          {/* Quick SOS & Feature Language Selector Toolbar */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* 🌐 Dedicated Feature Language Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-300 dark:border-slate-700/80 shadow-inner">
              <Globe className="w-4 h-4 text-sky-500 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 outline-none cursor-pointer hover:border-sky-500 transition"
                title="Select Feature Language"
              >
                <option value="en">🇬🇧 English (EN)</option>
                <option value="hi">🇮🇳 हिन्दी (Hindi)</option>
                <option value="as">🌿 असमीया (Assamese)</option>
                <option value="bn">🌸 বাংলা (Bengali)</option>
                <option value="brx">🏹 बड़ो (Bodo)</option>
                <option value="mni">🦚 মৈতৈলোন্ (Manipuri)</option>
                <option value="mzo">🌄 Mizo</option>
                <option value="kha">🏔️ Khasi</option>
                <option value="ne">🏔️ नेपाली (Nepali)</option>
                <option value="nag">🏕️ Nagamese</option>
              </select>
            </div>

            {onTriggerSOS && (
              <button
                onClick={onTriggerSOS}
                className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 border border-rose-400/30 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{isHindi ? 'आपातकालीन SOS बटन 🚨' : 'TRIGGER SOS DISTRESS 🚨'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. TOLL-FREE EMERGENCY HELPLINES CARDS */}
      <div className="space-y-3">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-sky-500" />
          <span>{isHindi ? '24/7 आपातकालीन टोल-फ्री हेल्पलाइन' : '24/7 Emergency Toll-Free Helplines'}</span>
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3.5">
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
                  <span>{isHindi ? `${contact.number} पर कॉल करें` : `Call ${contact.number} Now`}</span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DISASTER CATEGORY SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'flood', label: isHindi ? '🌊 बाढ़ सुरक्षा निर्देश' : '🌊 Flood Safety', color: 'from-blue-600 to-cyan-600' },
          { id: 'landslide', label: isHindi ? '⛰️ भूस्खलन सुरक्षा निर्देश' : '⛰️ Landslide Safety', color: 'from-amber-600 to-orange-600' },
          { id: 'earthquake', label: isHindi ? '🌋 भूकंप सुरक्षा निर्देश' : '🌋 Earthquake Safety', color: 'from-rose-600 to-red-600' },
          { id: 'cyclone', label: isHindi ? '⚡ चक्रवात सुरक्षा निर्देश' : '⚡ Cyclone & Lightning', color: 'from-purple-600 to-indigo-600' },
          { id: 'kit', label: isHindi ? '🎒 72-घंटे की उत्तरजीविता किट' : '🎒 72-Hour Survival Kit', color: 'from-emerald-600 to-teal-600' }
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
                <div className="flex flex-col xl:flex-row gap-3.5 pt-2">
                  {currentData.steps.map((step, idx) => (
                    <div key={idx} className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5 min-w-0">
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{step.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* DO's AND DONT's GRID */}
                <div className="flex flex-col xl:flex-row gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  
                  {/* DO'S COLUMN */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isHindi ? 'अनुशंसित कार्य (क्या करें)' : 'RECOMMENDED DO\'S'}</span>
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
                      <span>{isHindi ? 'महत्वपूर्ण निषेध (क्या न करें)' : 'CRITICAL DONT\'S'}</span>
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
                  {isHindi ? '72-घंटे की आपदा आपातकालीन उत्तरजीविता किट' : '72-Hour Emergency Survival Kit'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {isHindi ? 'बाढ़, भूस्खलन या आपातकालीन निकासी के समय परिवार की उत्तरजीविता के लिए आवश्यक वस्तुओं की चेकलिस्ट।' : 'Essential items checklist for family survival during flood, landslide, or emergency evacuations.'}
                </p>
              </div>
            </div>

            {/* Progress Meter Bar */}
            <div className="w-full sm:w-64 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                <span>{isHindi ? 'किट तैयारी स्थिति' : 'Kit Readiness'}</span>
                <span className="text-emerald-500">{isHindi ? `${kitPercentage}% तैयार` : `${kitPercentage}% Ready`}</span>
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3.5">
            {[
              { key: 'water', label: isHindi ? 'पीने का पानी (प्रति व्यक्ति 3 लीटर प्रतिदिन)' : 'Drinking Water (3 Liters per person/day)', desc: isHindi ? 'कम से कम 3 दिनों के लिए सीलबंद बोतलें' : 'Sealed bottles for at least 3 days' },
              { key: 'firstaid', label: isHindi ? 'फर्स्ट एड किट एवं पट्टियां' : 'First Aid Kit & Bandages', desc: isHindi ? 'एंटीसेप्टिक, गॉज, मेडिकल टेप, चिमटी' : 'Antiseptic, gauze, medical tape, tweezers' },
              { key: 'torch', label: isHindi ? 'एलईडी टॉर्च / इमरजेंसी लाइट' : 'LED Torch / Emergency Light', desc: isHindi ? 'अतिरिक्त रिचार्जेबल या ड्राई सेल बैटरियों के साथ' : 'With extra rechargeable or dry cell batteries' },
              { key: 'radio', label: isHindi ? 'बैटरी से चलने वाला / हैंड-क्रैंक रेडियो' : 'Battery-Powered / Hand-Crank Radio', desc: isHindi ? 'आधिकारिक IMD/SDMA मौसम प्रसारण सुनने के लिए' : 'To listen to official IMD/SDMA weather broadcasts' },
              { key: 'food', label: isHindi ? 'सूखा और पैक्ड गैर-खराब भोजन' : 'Non-Perishable Packaged Food', desc: isHindi ? 'एनर्जी बार, डिब्बाबंद खाना, मेवे/ड्राई फ्रूट्स' : 'Energy bars, canned food, dry fruits' },
              { key: 'documents', label: isHindi ? 'आधार / आईडी एवं भूमि दस्तावेज' : 'Aadhaar / ID & Land Documents', desc: isHindi ? 'वाटरप्रूफ जिपलॉक प्लास्टिक पाउच में सुरक्षित रखें' : 'Keep safe in waterproof ziplock plastic pouch' },
              { key: 'whistle', label: isHindi ? 'इमरजेंसी सीटी' : 'Emergency Signal Whistle', desc: isHindi ? 'खोज एवं बचाव टीमों को मदद का संकेत देने के लिए' : 'To signal rescue teams for help' },
              { key: 'powerbank', label: isHindi ? 'चार्ज्ड मोबाइल पावर बैंक' : 'Charged Mobile Power Bank', desc: isHindi ? 'आपातकालीन कॉल के लिए न्यूनतम 10,000 mAh' : 'Minimum 10,000 mAh for emergency calls' },
              { key: 'medicines', label: isHindi ? 'डॉक्टर द्वारा दी गई आवश्यक दवाएं' : 'Prescription Medicines', desc: isHindi ? '7 दिनों की दैनिक स्वास्थ्य दवाओं का स्टॉक' : 'Stock of 7 days daily health medication' },
              { key: 'warmclothes', label: isHindi ? 'रेनप्रूफ जैकेट एवं गरम कंबल' : 'Rainproof Jacket & Thermal Blanket', desc: isHindi ? 'कॉम्पेक्ट थर्मल कंबल और वाटरप्रूफ पोंचो' : 'Compact thermal blanket & waterproof poncho' }
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
