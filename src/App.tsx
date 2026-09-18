import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  CloudRain,
  Navigation,
  Bot,
  Activity,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Truck,
  Compass,
  Cpu,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  ShieldCheck,
  Building2,
  Package,
  Radio,
  Sliders,
  Bell,
  Check,
  TrendingUp,
  Clock,
  Gauge,
  Sparkles,
  Mountain,
  Camera,
  Upload,
  Eye,
  ShieldAlert,
  CheckSquare,
  X,
  Mic,
  MicOff,
  Home,
  BookOpen,
  HeartPulse
} from 'lucide-react';
import L from 'leaflet';
import {
  MAP_LAYERS,
  getLiveWeather,
  calculateLandslideHazardIndex,
  calculateFloodVulnerabilityIndex,
  calculateEmergencyRoute,
  getAPIEcosystemRegistry,
  WeatherData,
  HazardAssessment,
  NER_DRONE_FLEET,
  NER_EMERGENCY_LZS,
  calculateDroneFlightPlan,
  DroneFlightPlan,
  DroneSpec,
  EmergencyLZ
} from './services/api';
import Dashboard from './components/Dashboard';
import AIDisasterImpactAssessment from './components/AIDisasterImpactAssessment';
import SmartDisasterMonitoring from './components/SmartDisasterMonitoring';
import WeatherIntelligence from './components/WeatherIntelligence';
import FloodIntelligenceModule from './components/FloodIntelligenceModule';
import LandslideRiskIntelligence from './components/LandslideRiskIntelligence';
import RoadAccessibilityModule from './components/RoadAccessibilityModule';
import EmergencyFacilitiesModule from './components/EmergencyFacilitiesModule';
import UAVDroneModule from './components/UAVDroneModule';
import EmergencySOSModal from './components/EmergencySOSModal';
import MDoNERCommandModule from './components/MDoNERCommandModule';
import NERLiveMapModule from './components/NERLiveMapModule';
import RescueTeamCommand from './components/RescueTeamCommand';
import EvacuationPlanner from './components/EvacuationPlanner';
import ReliefCampManagement from './components/ReliefCampManagement';
import LifeSavingResponseEngine from './components/LifeSavingResponseEngine';
import LanguageSelector from './components/LanguageSelector';
import ThemeToggle from './components/ThemeToggle';
import JeevanSetuHomepage from './components/JeevanSetuHomepage';
import DisasterSafetyGuide from './components/DisasterSafetyGuide';

import DisasterReportsModule from './components/DisasterReportsModule';
import { ReliefSupplyTrackingModule } from './components/ReliefSupplyTrackingModule';
import { PrivateSmartEmergencyModule } from './components/PrivateSmartEmergencyModule';
import { MobileLiveLocationShareView } from './components/MobileLiveLocationShareView';
import AddressDisasterIntelligence from './components/AddressDisasterIntelligence';
import AIChatbotWidget from './components/AIChatbotWidget';
import CitizenVideoWalkthroughModal from './components/CitizenVideoWalkthroughModal';
import { useTranslation } from './i18n';
import { incidentStore } from './services/api';

// NER State Data
const NER_HUBS = [
  { id: 'guwahati', name: 'Guwahati (Assam Hub)', lat: 26.1445, lon: 91.7362, state: 'Assam', activeVehicles: 14, status: 'OPTIMAL' },
  { id: 'shillong', name: 'Shillong (East Khasi Hills)', lat: 25.5788, lon: 91.8933, state: 'Meghalaya', activeVehicles: 8, status: 'HIGH_ALERT' },
  { id: 'aizawl', name: 'Aizawl (Mizoram Terminal)', lat: 23.7271, lon: 92.7176, state: 'Mizoram', activeVehicles: 6, status: 'STABLE' },
  { id: 'itanagar', name: 'Itanagar (Arunachal Hub)', lat: 27.0844, lon: 93.6053, state: 'Arunachal Pradesh', activeVehicles: 5, status: 'CAUTION' },
  { id: 'imphal', name: 'Imphal (Manipur Center)', lat: 24.8170, lon: 93.9368, state: 'Manipur', activeVehicles: 7, status: 'STABLE' },
  { id: 'gangtok', name: 'Gangtok (Sikkim Command)', lat: 27.3389, lon: 88.6065, state: 'Sikkim', activeVehicles: 4, status: 'CAUTION' },
  { id: 'agartala', name: 'Agartala (Tripura Depot)', lat: 23.8315, lon: 91.2868, state: 'Tripura', activeVehicles: 9, status: 'OPTIMAL' },
  { id: 'kohima', name: 'Kohima (Nagaland Center)', lat: 25.6751, lon: 94.1086, state: 'Nagaland', activeVehicles: 5, status: 'STABLE' }
];

export default function App() {
  const { t, language } = useTranslation();

  // Check if opened on Phone A from QR scan (Mobile Share Route)
  const urlParams = new URLSearchParams(window.location.search);
  const shareSession = urlParams.get('shareSession') || urlParams.get('qrSession');
  const shareToken = urlParams.get('token') || '';

  if (shareSession && shareToken) {
    return (
      <MobileLiveLocationShareView
        sessionId={shareSession}
        token={shareToken}
        onExit={() => {
          window.location.href = window.location.origin;
        }}
      />
    );
  }
  const [activeModule, setActiveModuleState] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || params.get('module');
    if (tab) {
      if (tab === 'sitrep') return 'customdashboard';
      if (tab === 'driver' || tab === 'driver-portal') return 'driver-tracking';
      if (tab === 'private-tracking' || tab === 'smart-tracking' || tab === 'smart-emergency' || tab === 'smart-emergency-response' || tab === 'live-tracking' || tab === 'emergency-response') return 'private-tracking';
      return tab;
    }
    const hash = window.location.hash.replace('#', '');
    if (hash) return hash === 'sitrep' ? 'customdashboard' : hash;

    const path = window.location.pathname.toLowerCase();
    if (path.includes('/dashboard')) return 'customdashboard';
    if (path.includes('/live-map')) return 'map';
    if (path.includes('/risk-assessment')) return 'staterisk';
    if (path.includes('/resources')) return 'reliefcamps';
    if (path.includes('/flood')) return 'flood';
    if (path.includes('/weather')) return 'weather';
    if (path.includes('/landslide')) return 'landslide';
    if (path.includes('/private-tracking') || path.includes('/smart-tracking') || path.includes('/live-tracking') || path.includes('/emergency-response')) return 'private-tracking';
    if (path.includes('/facilities') || path.includes('/emergency-facilities')) return 'facilities';
    if (path.includes('/disaster-reports') || path.includes('/incidents')) return 'disaster-reports';
    if (path.includes('/relief-supplies')) return 'relief-supplies';
    if (path.includes('/vehicle-tracking')) return 'vehicle-tracking';
    if (path.includes('/driver/tracking') || path.includes('/driver-tracking')) return 'driver-tracking';
    if (path.includes('/relief-operations')) return 'relief-operations';
    if (path.includes('/relief-depots')) return 'relief-depots';
    if (path.includes('/location') || path.includes('/address-intelligence')) return 'location';
    if (path.includes('/smart-monitoring') || path.includes('/smartmonitoring')) return 'smartmonitoring';

    return 'home';
  });
  const [previousModule, setPreviousModule] = useState<string>('home');

  const setActiveModule = (mod: string) => {
    if (mod !== activeModule && activeModule !== 'map') {
      setPreviousModule(activeModule);
    }
    setActiveModuleState(mod);
    const url = new URL(window.location.href);
    if (mod === 'home') {
      url.pathname = '/';
      url.searchParams.delete('tab');
      url.searchParams.delete('module');
    } else if (mod === 'customdashboard') {
      url.pathname = '/dashboard';
      url.searchParams.set('tab', mod);
    } else if (mod === 'map') {
      url.pathname = '/live-map';
      url.searchParams.set('tab', mod);
    } else if (mod === 'staterisk') {
      url.pathname = '/risk-assessment';
      url.searchParams.set('tab', mod);
    } else if (mod === 'reliefcamps') {
      url.pathname = '/resources';
      url.searchParams.set('tab', mod);
    } else if (mod === 'disaster-reports') {
      url.pathname = '/disaster-reports';
      url.searchParams.set('tab', mod);
    } else if (mod === 'emergency-response') {
      url.pathname = '/emergency-response';
      url.searchParams.set('tab', mod);
    } else if (mod === 'relief-supplies') {
      url.pathname = '/relief-supplies';
      url.searchParams.set('tab', mod);
    } else if (mod === 'vehicle-tracking') {
      url.pathname = '/vehicle-tracking';
      url.searchParams.set('tab', mod);
    } else if (mod === 'driver-tracking') {
      url.pathname = '/driver/tracking';
      url.searchParams.set('tab', mod);
    } else if (mod === 'relief-operations') {
      url.pathname = '/relief-operations';
      url.searchParams.set('tab', mod);
    } else if (mod === 'relief-depots') {
      url.pathname = '/relief-depots';
      url.searchParams.set('tab', mod);
    } else if (mod === 'location' || mod === 'location-360' || mod === 'addressintelligence') {
      url.pathname = '/location';
      url.searchParams.set('tab', mod);
    } else if (mod === 'smartmonitoring' || mod === 'smart-monitoring') {
      url.pathname = '/smart-monitoring';
      url.searchParams.set('tab', mod);
    } else {
      url.searchParams.set('tab', mod);
    }
    window.history.pushState(null, '', url.toString());
  };

  // Listen to browser Back / Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || params.get('module');
      if (tab) {
        setActiveModuleState(tab === 'sitrep' ? 'customdashboard' : tab);
        return;
      }
      if (path.includes('/dashboard')) setActiveModuleState('customdashboard');
      else if (path.includes('/live-map')) setActiveModuleState('map');
      else if (path.includes('/risk-assessment')) setActiveModuleState('staterisk');
      else if (path.includes('/resources')) setActiveModuleState('reliefcamps');
      else if (path.includes('/emergency-response')) setActiveModuleState('emergency-response');
      else if (path.includes('/disaster-reports')) setActiveModuleState('disaster-reports');
      else if (path.includes('/relief-supplies')) setActiveModuleState('relief-supplies');
      else if (path.includes('/vehicle-tracking')) setActiveModuleState('vehicle-tracking');
      else if (path.includes('/driver/tracking') || path.includes('/driver-tracking')) setActiveModuleState('driver-tracking');
      else if (path.includes('/relief-operations')) setActiveModuleState('relief-operations');
      else if (path.includes('/relief-depots')) setActiveModuleState('relief-depots');
      else if (path.includes('/location') || path.includes('/address-intelligence')) setActiveModuleState('location');
      else if (path.includes('/smart-monitoring') || path.includes('/smartmonitoring')) setActiveModuleState('smartmonitoring');
      else setActiveModuleState('home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reset to 100% Native Pixel-Perfect Responsive Resolution
  useEffect(() => {
    (document.body.style as any).zoom = "100%";
  }, []);

  // Listen for openVideoGuide/toggleVideoGuide custom event from anywhere in the app
  useEffect(() => {
    const handleToggleVideoGuide = () => {
      setIsVideoGuideOpen(prev => !prev);
    };
    window.addEventListener('openVideoGuide', handleToggleVideoGuide);
    window.addEventListener('toggleVideoGuide', handleToggleVideoGuide);
    return () => {
      window.removeEventListener('openVideoGuide', handleToggleVideoGuide);
      window.removeEventListener('toggleVideoGuide', handleToggleVideoGuide);
    };
  }, []);

  const [sharedMonitoringLoc, setSharedMonitoringLoc] = useState<any>(null);
  const [selectedLayer, setSelectedLayer] = useState<string>('osm');
  const [mapFocusedTarget, setMapFocusedTarget] = useState<{ coord: [number, number]; zoom: number } | null>(null);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | L.TileLayer.WMS | null>(null);

  // Weather state
  const [weatherCity, setWeatherCity] = useState(NER_HUBS[1]); // Default Shillong
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // SOS Emergency Modal State
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);
  const [isVideoGuideOpen, setIsVideoGuideOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSimulated, setIsMobileSimulated] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState('');
  const [activeSosLocation, setActiveSosLocation] = useState<{
    lat: number;
    lon: number;
    sosId?: string;
    distressType?: string;
    landmark?: string;
    personsTrapped?: string;
    triageLevel?: string;
  } | null>(null);

  const ALL_FEATURE_GROUPS = [
    {
      categoryHi: 'मुख्य प्लेटफॉर्म एवं ओवरव्यू',
      categoryEn: 'Main Platform & Overview',
      items: [
        {
          id: 'home',
          nameHi: 'जीवन सेतु होमपेज',
          nameEn: 'Jeevan Setu Homepage',
          descHi: 'मुख्य कमांड सेंटर एवं ओवरव्यू',
          descEn: 'Primary Command & Overview Hub',
          icon: Home,
          iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10',
          badge: 'MAIN'
        },
        {
          id: 'customdashboard',
          nameHi: 'कमांड सेंटर डैशबोर्ड (SITREP)',
          nameEn: 'Command Center Dashboard',
          descHi: 'रियल-टाइम आपदा स्थिति रिपोर्ट एवं टेलीमेट्री',
          descEn: 'Real-time SITREP & Emergency Grid',
          icon: Gauge,
          iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10',
          badge: 'LIVE'
        },
        {
          id: 'safetyguide',
          nameHi: 'आपदा सुरक्षा एवं तैयारी गाइड',
          nameEn: 'Disaster Safety Guide',
          descHi: 'सुरक्षा नियम, क्या करें और क्या न करें',
          descEn: 'Safety Manual, Do’s & Don’ts',
          icon: BookOpen,
          iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10',
          badge: 'GUIDE'
        }
      ]
    },
    {
      categoryHi: 'AI एवं GIS इंटेलिजेंस',
      categoryEn: 'AI & GIS Intelligence',
      items: [
        {
          id: 'smartmonitoring',
          nameHi: 'स्मार्ट आपदा निगरानी (Radar)',
          nameEn: 'Smart Disaster Monitoring',
          descHi: 'AI सैटेलाइट radar एवं लाइव सेंसर',
          descEn: 'AI Satellite Radar & Live Sensors',
          icon: Cpu,
          iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10',
          badge: 'AI RADAR'
        },
        {
          id: 'incidents',
          nameHi: 'आपदा रिपोर्ट एवं इंटेलिजेंस',
          nameEn: 'Disaster Reports & Intelligence',
          descHi: 'उत्तर पूर्वी राज्यों की घटना रिपोर्ट',
          descEn: 'NER State Incidents & Heatmap',
          icon: ShieldAlert,
          iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10',
          badge: 'NER 8'
        },
        {
          id: 'aiimpact',
          nameHi: 'AI आपदा प्रभाव आकलन',
          nameEn: 'AI Impact Assessment',
          descHi: 'मल्टी-मॉडल क्षति मूल्यांकन',
          descEn: 'Multi-modal Damage & Risk Score',
          icon: Camera,
          iconColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10',
          badge: 'AI SCORE'
        },
        {
          id: 'map',
          nameHi: 'NER लाइव GIS मानचित्र',
          nameEn: 'NER Live GIS Map',
          descHi: 'मल्टी-लेयर सैटेलाइट नक्शा',
          descEn: 'Multi-Layer Satellite GIS Mapping',
          icon: MapPin,
          iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10',
          badge: 'GIS 3D'
        }
      ]
    },
    {
      categoryHi: 'संकट प्रतिक्रिया एवं लॉजिस्टिक्स',
      categoryEn: 'Crisis Response & Logistics',
      items: [
        {
          id: 'private-tracking',
          nameHi: 'स्मार्ट आपातकालीन प्रतिक्रिया (1-टू-1 GPS & Invite Friends)',
          nameEn: 'Smart Emergency Response',
          descHi: '1-टू-1 लाइव GPS ट्रैकिंग एवं मित्र साझा करें',
          descEn: 'Live GPS Track & Multi-Friend Share',
          icon: Radio,
          iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10',
          badge: '1-TO-1 GPS'
        },
        {
          id: 'relief-supplies',
          nameHi: 'राहत सामग्री एवं वाहन ट्रैकिंग',
          nameEn: 'Relief Supply & Vehicle Tracking',
          descHi: 'GPS वाहन कान्वाय एवं राहत डिपो',
          descEn: 'GPS Fleet Convoy & Supply Depots',
          icon: Truck,
          iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10',
          badge: 'LIVE FLEET'
        },
        {
          id: 'rerouting',
          nameHi: 'सड़क सुगमता एवं सुरक्षित मार्ग',
          nameEn: 'Road Accessibility & Safe Routes',
          descHi: 'OSRM मार्ग अनुकूलन एवं सड़क अलर्ट',
          descEn: 'OSRM Route Optimization & Road Watch',
          icon: Navigation,
          iconColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10',
          badge: 'OSRM'
        },
        {
          id: 'facilities',
          nameHi: 'आपातकालीन सुविधाएं एवं बचाव',
          nameEn: 'Emergency Facilities & Rescue',
          descHi: 'अस्पताल, राहत शिविर एवं हेल्प सेंटर',
          descEn: 'Hospitals, Relief Camps & LZs',
          icon: HeartPulse,
          iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10',
          badge: 'RESCUE'
        },
        {
          id: 'drone',
          nameHi: 'UAV ड्रोन डिस्पैचर',
          nameEn: 'UAV Drone Dispatcher',
          descHi: 'स्वायत्त ड्रोन बेड़ा नियंत्रण',
          descEn: 'Autonomous Drone Fleet Control',
          icon: Radio,
          iconColor: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10',
          badge: 'UAV FLEET'
        }
      ]
    },
    {
      categoryHi: 'गवर्नेंस, मौसम एवं रिपोर्ट्स',
      categoryEn: 'Governance, Weather & Reports',
      items: [
        {
          id: 'gov',
          nameHi: 'MDoNER कमांड ग्रिड',
          nameEn: 'MDoNER Command Grid',
          descHi: 'मंत्रालय एवं राज्य स्तरीय डैशबोर्ड',
          descEn: 'Ministry & Govt Analytics Grid',
          icon: Building2,
          iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10',
          badge: 'GOVT'
        },
        {
          id: 'weather',
          nameHi: 'मौसम बुद्धिमत्ता एवं डोपलर Radar',
          nameEn: 'Weather & Doppler Radar',
          descHi: 'IMD मौसम पूर्वानुमान एवं वर्षा radar',
          descEn: 'IMD Forecast & Live Doppler Radar',
          icon: CloudRain,
          iconColor: 'text-sky-400 dark:text-sky-300 bg-sky-400/10',
          badge: 'IMD LIVE'
        },
        {
          id: 'flood',
          nameHi: 'बाढ़ जोखिम बुद्धिमत्ता',
          nameEn: 'Flood Risk Intelligence',
          descHi: 'ब्रह्मपुत्र नदी बेसिन एवं जलस्तर निगरानी',
          descEn: 'Brahmaputra Basin & Inundation Watch',
          icon: CloudRain,
          iconColor: 'text-blue-500 dark:text-blue-400 bg-blue-500/10',
          badge: 'BASIN'
        },
        {
          id: 'landslide',
          nameHi: 'भूस्खलन जोखिम बुद्धिमत्ता',
          nameEn: 'Landslide Risk Intelligence',
          descHi: 'पहाड़ी ढलान स्थिरता इंडेक्स',
          descEn: 'Slope Stability Hazard Index',
          icon: Mountain,
          iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10',
          badge: 'SLOPE'
        },
        {
          id: 'location',
          nameHi: 'स्थान बुद्धिमत्ता रिपोर्ट (2-Page PDF)',
          nameEn: 'Location Intelligence Report',
          descHi: '2-पेज पीडीएफ रिपोर्ट एवं URL शेयर',
          descEn: '2-Page PDF Report & Dynamic Share',
          icon: Compass,
          iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10',
          badge: 'PDF REPORT'
        },
        {
          id: 'vehicle-tracking',
          nameHi: 'वाहन एवं चालक लाइव ट्रैकिंग',
          nameEn: 'Vehicle & Driver Live Tracking',
          descHi: 'चालक एवं वाहन लाइव स्थिति पोर्टेबल',
          descEn: 'Fleet Telemetry & Driver Portal',
          icon: Truck,
          iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10',
          badge: 'DRIVER'
        }
      ]
    }
  ];

  // Track dismissed SOS alert IDs so clicking ✕ permanently dismisses the alert
  const dismissedSosIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jeevan_dismissed_sos_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((id: string) => dismissedSosIdsRef.current.add(id));
        }
      }
    } catch (e) {}
  }, []);

  const handleDismissSosBanner = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (activeSosLocation?.sosId) {
      dismissedSosIdsRef.current.add(activeSosLocation.sosId);
      try {
        const arr = Array.from(dismissedSosIdsRef.current);
        localStorage.setItem('jeevan_dismissed_sos_ids', JSON.stringify(arr));
      } catch (err) {}
    }
    setActiveSosLocation(null);
  };

  // Real-time synchronization of SOS alerts from central DB across all devices
  useEffect(() => {
    const syncSosAlerts = async () => {
      try {
        const res = await fetch('/api/sos/alerts');
        if (res.ok) {
          const data = await res.json();
          if (data?.alerts && data.alerts.length > 0) {
            const latest = data.alerts[0];
            if (!latest || !latest.sosId) return;

            // Do not display if user has dismissed this alert
            if (dismissedSosIdsRef.current.has(latest.sosId)) {
              return;
            }

            // Freshness check: only show if created within the last 15 minutes
            const alertTime = latest.timestamp ? new Date(latest.timestamp).getTime() : 0;
            const isRecent = alertTime > 0 ? (Date.now() - alertTime < 15 * 60 * 1000) : false;
            if (!isRecent) {
              return;
            }

            setActiveSosLocation(prev => {
              if (!prev || prev.sosId !== latest.sosId) {
                return {
                  lat: Number(latest.lat) || 27.26,
                  lon: Number(latest.lon) || 92.42,
                  sosId: latest.sosId,
                  distressType: latest.distressType,
                  landmark: latest.landmark,
                  personsTrapped: latest.personsTrapped,
                  triageLevel: latest.triageLevel
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        // Silent fallback if server offline
      }
    };

    syncSosAlerts();
    const interval = setInterval(syncSosAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Rerouting state
  const [routeStart, setRouteStart] = useState('Guwahati Logistics Depot');
  const [routeDest, setRouteDest] = useState('Aizawl District Hospital');
  const [vehicleType, setVehicleType] = useState('4x4 Heavy All-Terrain Truck (Tata LPTA)');
  const [avoidBlockedSectors, setAvoidBlockedSectors] = useState(true);
  const [calculatedRoute, setCalculatedRoute] = useState<any>(null);

  // Essential Supplies List
  const [supplies, setSupplies] = useState([
    { id: 'SUP-1092', item: 'Life-saving Oxygen & Dialysis Fluids', priority: 'CRITICAL', dest: 'Aizawl Civil Hospital', status: 'IN_TRANSIT', eta: '3h 15m' },
    { id: 'SUP-1093', item: 'High-Altitude Emergency Blood Plasma', priority: 'CRITICAL', dest: 'Shillong Medical Hub', status: 'DISPATCHED', eta: '1h 45m' },
    { id: 'SUP-1094', item: 'Baby Food & Nutritional Supplements', priority: 'HIGH', dest: 'Silchar Relief Camp', status: 'IN_TRANSIT', eta: '4h 00m' },
    { id: 'SUP-1095', item: 'Disaster Emergency Diesel Generator Fuel', priority: 'HIGH', dest: 'East Khasi Hills Sub-Depot', status: 'READY', eta: '5h 30m' },
    { id: 'SUP-1096', item: 'Water Purification Tablets (10,000 units)', priority: 'MEDIUM', dest: 'Kaziranga Perimeter Hub', status: 'IN_TRANSIT', eta: '2h 10m' }
  ]);

  // UAV Drone Dispatcher state
  const [droneOrigin, setDroneOrigin] = useState(NER_HUBS[0]); // Guwahati
  const [selectedLZ, setSelectedLZ] = useState(NER_EMERGENCY_LZS[0]); // Sela Pass
  const [selectedDroneId, setSelectedDroneId] = useState('GARUDA-X15');
  const [dronePayloadKg, setDronePayloadKg] = useState(12);
  const [dronePayloadItem, setDronePayloadItem] = useState('High-Altitude Emergency Blood Plasma & Dialysis Fluid');
  const [droneFlightPlan, setDroneFlightPlan] = useState<DroneFlightPlan | null>(null);
  const [droneMissionModalOpen, setDroneMissionModalOpen] = useState(false);
  const [droneMissionStatus, setDroneMissionStatus] = useState<'IDLE' | 'LAUNCHING' | 'IN_FLIGHT'>('IDLE');

  const droneMapContainerRef = useRef<HTMLDivElement>(null);
  const droneMapInstanceRef = useRef<L.Map | null>(null);

  const rerouteMapContainerRef = useRef<HTMLDivElement>(null);
  const rerouteMapInstanceRef = useRef<L.Map | null>(null);

  const roadMapContainerRef = useRef<HTMLDivElement>(null);
  const roadMapInstanceRef = useRef<L.Map | null>(null);

  // Citizen AI Damage Triage state


  // Calculate drone flight plan dynamically
  useEffect(() => {
    const windSpeed = weatherData ? weatherData.windSpeed : 35;
    const plan = calculateDroneFlightPlan(
      droneOrigin.lat,
      droneOrigin.lon,
      selectedLZ,
      dronePayloadKg,
      windSpeed,
      selectedDroneId
    );
    setDroneFlightPlan(plan);
  }, [droneOrigin, selectedLZ, dronePayloadKg, selectedDroneId, weatherData]);

  // Drone Map Render
  useEffect(() => {
    if (activeModule === 'drone' && droneMapContainerRef.current) {
      if (droneMapInstanceRef.current) {
        droneMapInstanceRef.current.remove();
        droneMapInstanceRef.current = null;
      }

      const dmap = L.map(droneMapContainerRef.current).setView(
        [(droneOrigin.lat + selectedLZ.lat) / 2, (droneOrigin.lon + selectedLZ.lon) / 2],
        7
      );

      L.tileLayer(MAP_LAYERS.osm.url, { attribution: MAP_LAYERS.osm.attribution }).addTo(dmap);

      // Origin Hub Marker
      L.circleMarker([droneOrigin.lat, droneOrigin.lon], {
        radius: 9,
        fillColor: '#6366f1',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95
      }).addTo(dmap).bindPopup(`<b>🛫 Dispatch Hub: ${droneOrigin.name}</b><br>State: ${droneOrigin.state}`);

      // Destination LZ Marker
      L.circleMarker([selectedLZ.lat, selectedLZ.lon], {
        radius: 11,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(dmap).bindPopup(`<b>🚁 Isolated Emergency LZ: ${selectedLZ.name}</b><br>Altitude: ${selectedLZ.elevationMsl}m MSL &bull; State: ${selectedLZ.state}`);

      // Aerial Vector Polyline
      L.polyline([
        [droneOrigin.lat, droneOrigin.lon],
        [selectedLZ.lat, selectedLZ.lon]
      ], {
        color: '#38bdf8',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.9
      }).addTo(dmap).bindPopup(`<b>🚁 High-Altitude Aerial Supply Vector</b><br>Direct Distance: ${calculateDroneFlightPlan(droneOrigin.lat, droneOrigin.lon, selectedLZ, dronePayloadKg, 30, selectedDroneId).distanceKm} km &bull; Zero Road Dependency`);

      droneMapInstanceRef.current = dmap;
    }
  }, [activeModule, droneOrigin, selectedLZ, selectedDroneId, dronePayloadKg]);

  // Dynamic AI Rerouting Leaflet Map Render
  useEffect(() => {
    if (activeModule === 'rerouting' && rerouteMapContainerRef.current) {
      if (rerouteMapInstanceRef.current) {
        rerouteMapInstanceRef.current.remove();
        rerouteMapInstanceRef.current = null;
      }

      const rmap = L.map(rerouteMapContainerRef.current).setView([25.2, 92.5], 7);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Esri World Dark Gray Canvas'
      }).addTo(rmap);

      // Interconnected Waypoints (Guwahati -> Shillong -> Jowai Bypass -> Silchar -> Aizawl)
      const routePoints: [number, number][] = [
        [26.1445, 91.7362], // Guwahati Origin
        [25.5788, 91.8933], // Shillong
        [25.2000, 92.2000], // Jowai Ridge Bypass
        [24.8333, 92.7789], // Silchar
        [23.7271, 92.7176]  // Aizawl Destination
      ];

      // Origin Pin
      L.circleMarker(routePoints[0], {
        radius: 10,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(rmap).bindPopup(`<b>🛫 Origin Hub: ${routeStart || 'Guwahati Logistics Depot'}</b>`);

      // Destination Pin
      L.circleMarker(routePoints[routePoints.length - 1], {
        radius: 10,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2.5,
        fillOpacity: 0.95
      }).addTo(rmap).bindPopup(`<b>🏁 Destination Hub: ${routeDest || 'Aizawl District Hospital'}</b>`);

      // Disrupted Landslide Polygon & Evaded Corridor
      if (avoidBlockedSectors) {
        // Red Landslide Hazard Polygon Circle
        L.circle([25.495, 91.508], {
          radius: 18000,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.25,
          weight: 2
        }).addTo(rmap).bindPopup('<b>⚠️ Km 142 Landslide Sector</b><br/>High-Risk Polygon Evaded by OSRM Green Corridor');

        // Green Bypass Polyline
        L.polyline(routePoints, {
          color: '#10b981',
          weight: 5,
          opacity: 0.9,
          dashArray: '6, 6'
        }).addTo(rmap).bindPopup('<b>🟢 AI Green Corridor Bypass Route (Clear)</b>');
      } else {
        // Direct Route Polyline
        L.polyline([routePoints[0], routePoints[routePoints.length - 1]], {
          color: '#ef4444',
          weight: 4,
          opacity: 0.85
        }).addTo(rmap).bindPopup('<b>🔴 Direct Highway (Caution: Landslide Choke Points Active)</b>');
      }

      rerouteMapInstanceRef.current = rmap;
    }
  }, [activeModule, routeStart, routeDest, avoidBlockedSectors]);

  // Live Highway Accessibility Leaflet Map Render
  useEffect(() => {
    if (activeModule === 'road' && roadMapContainerRef.current) {
      if (roadMapInstanceRef.current) {
        roadMapInstanceRef.current.remove();
        roadMapInstanceRef.current = null;
      }

      const rmap = L.map(roadMapContainerRef.current).setView([26.0, 92.5], 7);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 16,
        attribution: 'Jeevan Setu Highway Telemetry &bull; Esri Dark Canvas'
      }).addTo(rmap);

      // 1. NH-6 (Pink/Red - Blocked)
      const nh6Waypoints: [number, number][] = [[26.1445, 91.7362], [25.5788, 91.8933], [24.8333, 92.7789]];
      L.polyline(nh6Waypoints, { color: '#ef4444', weight: 6, opacity: 0.9 }).addTo(rmap);
      L.marker([25.495, 91.508], {
        icon: L.divIcon({
          className: 'nh6-block-badge',
          html: `<div style="background:#dc2626;color:#fff;padding:4px 8px;border-radius:8px;font-weight:900;font-size:10px;border:1.5px solid #f87171;white-space:nowrap;box-shadow:0 0 12px #ef4444;">🔴 NH-6 Km 142 Landslide Blocked</div>`,
          iconSize: [210, 24],
          iconAnchor: [105, 12]
        })
      }).addTo(rmap);

      // 2. NH-29 (Green - Clear)
      const nh29Waypoints: [number, number][] = [[25.9060, 93.7270], [25.6751, 94.1086]];
      L.polyline(nh29Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);
      L.marker([25.7900, 93.9000], {
        icon: L.divIcon({
          className: 'nh29-clear-badge',
          html: `<div style="background:#059669;color:#fff;padding:3px 8px;border-radius:8px;font-weight:800;font-size:10px;border:1px solid #34d399;white-space:nowrap;">🟢 NH-29 Dimapur ➔ Kohima (Clear)</div>`,
          iconSize: [190, 24],
          iconAnchor: [95, 12]
        })
      }).addTo(rmap);

      // 3. NH-10 (Orange - Caution)
      const nh10Waypoints: [number, number][] = [[26.7167, 88.4333], [27.1000, 88.5000], [27.3389, 88.6065]];
      L.polyline(nh10Waypoints, { color: '#f97316', weight: 5, opacity: 0.9 }).addTo(rmap);
      L.marker([27.1000, 88.5000], {
        icon: L.divIcon({
          className: 'nh10-caution-badge',
          html: `<div style="background:#c2410c;color:#fff;padding:3px 8px;border-radius:8px;font-weight:800;font-size:10px;border:1px solid #fb923c;white-space:nowrap;">⚠️ NH-10 Teesta River Swelling</div>`,
          iconSize: [180, 24],
          iconAnchor: [90, 12]
        })
      }).addTo(rmap);

      // 4. NH-306 (Green - Clear)
      const nh306Waypoints: [number, number][] = [[24.8333, 92.7789], [23.7271, 92.7176]];
      L.polyline(nh306Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);

      // 5. NH-415 (Green - Clear)
      const nh415Waypoints: [number, number][] = [[27.0000, 93.6000], [27.1000, 93.6200]];
      L.polyline(nh415Waypoints, { color: '#10b981', weight: 5, opacity: 0.9 }).addTo(rmap);

      // 6. NH-37 (Amber - Monitored)
      const nh37Waypoints: [number, number][] = [[26.1445, 91.7362], [26.5800, 93.1700], [27.4728, 94.9120]];
      L.polyline(nh37Waypoints, { color: '#eab308', weight: 5, opacity: 0.9 }).addTo(rmap);

      roadMapInstanceRef.current = rmap;
    }
  }, [activeModule]);

  // Load weather for NER
  useEffect(() => {
    async function load() {
      setWeatherLoading(true);
      const data = await getLiveWeather(weatherCity.lat, weatherCity.lon);
      setWeatherData(data);
      setWeatherLoading(false);
    }
    load();
  }, [weatherCity]);

  // Initialize Map
  useEffect(() => {
    if ((activeModule === 'map' || activeModule === 'hub') && mapContainerRef.current && !mapInstanceRef.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([25.8, 92.5], 7); // Center of North East India (NER)

      const layer = L.tileLayer(MAP_LAYERS.osm.url, {
        attribution: MAP_LAYERS.osm.attribution,
        maxZoom: 19
      }).addTo(map);

      currentTileLayerRef.current = layer;
      mapInstanceRef.current = map;

      // Add NER Hub Markers
      NER_HUBS.forEach(hub => {
        const color = hub.status === 'HIGH_ALERT' ? '#ef4444' : hub.status === 'CAUTION' ? '#f59e0b' : '#10b981';
        const marker = L.circleMarker([hub.lat, hub.lon], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px;">
            <b style="color: #0f172a;">${hub.name}</b><br/>
            <span>State: ${hub.state}</span><br/>
            <span>Status: <b style="color:${color};">${hub.status}</b></span><br/>
            <span>Active Fleets: <b>${hub.activeVehicles}</b></span>
          </div>
        `);
      });

      // Sample Guwahati -> Aizawl Active Transit Route Corridor
      const routePolyline = L.polyline([
        [26.1445, 91.7362], // Guwahati
        [25.5788, 91.8933], // Shillong
        [24.8333, 92.7789], // Silchar
        [23.7271, 92.7176]  // Aizawl
      ], {
        color: '#6366f1',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      }).addTo(map);
      routePolyline.bindPopup('<b>🚚 Active Supply Route: Guwahati ➔ Aizawl (NH-6)</b><br>Speed: 45 km/h &bull; Carrying Critical Medical Supplies');
    }

    return () => {
      if (activeModule !== 'map' && activeModule !== 'hub' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeModule]);

  // Handle Layer switch
  useEffect(() => {
    if (mapInstanceRef.current && MAP_LAYERS[selectedLayer]) {
      if (currentTileLayerRef.current) {
        mapInstanceRef.current.removeLayer(currentTileLayerRef.current);
      }

      const layerConfig = MAP_LAYERS[selectedLayer];
      let newLayer: L.TileLayer | L.TileLayer.WMS;

      if (layerConfig.category === 'disaster-wms' && layerConfig.wmsParams) {
        newLayer = L.tileLayer.wms(layerConfig.url, {
          layers: layerConfig.wmsParams.layers,
          format: layerConfig.wmsParams.format,
          transparent: true,
          attribution: layerConfig.attribution
        });
      } else {
        newLayer = L.tileLayer(layerConfig.url, {
          attribution: layerConfig.attribution,
          maxZoom: layerConfig.maxZoom
        });
      }

      newLayer.addTo(mapInstanceRef.current);
      currentTileLayerRef.current = newLayer;
    }
  }, [selectedLayer]);

  const handleRunReroute = async () => {
    const res = await calculateEmergencyRoute([26.1445, 91.7362], [23.7271, 92.7176], avoidBlockedSectors ? [[25.4, 92.2]] : []);
    setCalculatedRoute(res);
  };

  // 🚨 Globally rendered, high-visibility Emergency SOS Floating Banner (renders on Command Center Dashboard, never on Homepage)
  const renderGlobalSosBanner = () => {
    if (!activeSosLocation || activeModule === 'home') return null;
    return (
      <aside
        aria-label="Active Emergency SOS Alert"
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] w-[95%] max-w-3xl bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-rose-300 flex items-center justify-between gap-3 animate-pulse"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-black/30 border border-white/30 flex items-center justify-center shrink-0 text-xl shadow">
            🚨
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black uppercase tracking-wider bg-rose-950/90 px-2 py-0.5 rounded text-[10px] border border-rose-400/40">
                LIVE SOS BEACON ({activeSosLocation.sosId})
              </span>
              <span className="text-[11px] font-extrabold text-amber-200">
                {activeSosLocation.triageLevel || 'Level 1: Immediate Rescue'}
              </span>
            </div>
            <p className="text-xs font-bold truncate text-white mt-0.5">
              📍 {activeSosLocation.landmark} &bull; {activeSosLocation.distressType} ({activeSosLocation.personsTrapped})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveModule('incidents');
            }}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-rose-950 font-black rounded-xl text-xs shadow-lg transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>View Incident Board</span>
            <span>➔</span>
          </button>
          <button
            type="button"
            onClick={handleDismissSosBanner}
            className="h-8 w-8 rounded-xl bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
            title="Dismiss Alert Banner"
          >
            ✕
          </button>
        </div>
      </aside>
    );
  };

  return (
    <>
      {activeModule === 'home' ? (
        <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white transition-colors duration-300">
          <JeevanSetuHomepage
            onNavigateModule={(mod) => setActiveModule(mod)}
            onOpenSos={() => {
              setActiveModule('customdashboard');
              setIsSosModalOpen(true);
            }}
            onOpenDashboard={() => setActiveModule('customdashboard')}
            onOpenAiChatbot={() => setIsAiAgentOpen(true)}
            onOpenVideoGuide={() => setIsVideoGuideOpen(prev => !prev)}
            isVideoGuideOpen={isVideoGuideOpen}
          />
        </div>
      ) : (
        <div className="flex h-screen w-full max-w-full bg-slate-100 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      {renderGlobalSosBanner()}
      
      {/* 1. LEFT SIDEBAR NAVIGATION BAR (Sleek & Perfectly Sized - Hidden in Driver & Mobile Screen View) */}
      <aside className={`${activeModule === 'driver-tracking' || isMobileSimulated ? 'hidden' : 'hidden md:flex w-60 lg:w-64'} shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] flex-col justify-between p-2.5 md:p-3 shadow-xl dark:shadow-2xl z-50 select-none transition-colors duration-300`}>
        <div className="space-y-3">
          
          {/* Logo & Brand Header (Sleek & Compact) */}
          <div
            className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group"
            onClick={() => setActiveModule('home')}
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden shadow-md shadow-sky-500/20 ring-2 ring-sky-500/40 group-hover:ring-sky-400 transition">
              <img
                src="/jeevan-setu-logo.jpg"
                alt="Jeevan Setu Logo"
                className="h-full w-full object-cover rounded-full transform group-hover:scale-105 transition duration-300"
              />
            </div>
            <div className="hidden md:block overflow-hidden">
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                {language === 'hi' ? 'जीवन सेतु' : 'Jeevan Setu'}
              </h1>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">MoDoNER / NEC Logistics Grid</p>
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-slate-800/80 mx-1" />

          {/* Navigation Items List (User-Friendly 4-Phase Command Workflow) */}
          <nav className="space-y-3 overflow-y-auto max-h-[calc(100vh-175px)] pr-0.5 custom-scrollbar">
            
            {/* 🌟 1. STANDALONE PRIMARY HOMEPAGE SECTION (Isolated from feature sections) */}
            <div className="space-y-1 pb-1.5 border-b border-slate-200 dark:border-slate-800/80">
              <div className="hidden md:flex items-center justify-between px-2.5 pt-1 pb-1 text-[10px] font-black tracking-wider uppercase text-sky-600 dark:text-sky-400 select-none">
                <span>MAIN PLATFORM</span>
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-700 dark:text-sky-300 font-black text-[9px] border border-sky-500/30">
                  PRIMARY
                </span>
              </div>

              <button
                onClick={() => setActiveModule('home')}
                title={t('navigation.home', 'Jeevan Setu Homepage')}
                aria-label={t('navigation.home', 'Jeevan Setu Homepage')}
                className={`w-full flex items-center justify-start gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold transition-all duration-200 group relative min-h-[44px] cursor-pointer ${
                  activeModule === 'home'
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400 ring-1 ring-sky-400/40'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-900 dark:text-white hover:bg-sky-500/10 hover:border-sky-500/40 border border-slate-200 dark:border-slate-700/70'
                }`}
              >
                {/* Active Indicator Bar */}
                {activeModule === 'home' && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-sm" />
                )}

                {/* Icon Container */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                    activeModule === 'home'
                      ? 'bg-white/20 text-white border border-white/30'
                      : 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 group-hover:scale-105'
                  }`}
                >
                  <Home className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                </div>

                {/* Feature Label & Subtitle */}
                <div className="hidden md:flex flex-col text-left flex-1 min-w-0">
                  <span className="text-xs font-black truncate leading-tight">
                    {t('navigation.home', 'Jeevan Setu Homepage')}
                  </span>
                  <span className={`text-[10px] font-semibold truncate ${
                    activeModule === 'home' ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    Main Command & Primary Hub
                  </span>
                </div>

                <span className={`hidden md:inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none ml-auto border transition-colors ${
                  activeModule === 'home'
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
                }`}>
                  MAIN
                </span>
              </button>
            </div>

            {/* 2. FEATURE SECTIONS (Overview, AI & GIS Intelligence, Crisis Response & Logistics, Governance) */}
            {[
              {
                category: t('sidebar.catOverview', 'Overview'),
                items: [
                  { id: 'customdashboard', label: t('navigation.customdashboard', 'Command Center Dashboard'), icon: Gauge, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { id: 'safetyguide', label: t('navigation.safetyguide', 'Disaster Safety Guide'), icon: BookOpen, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' }
                ]
              },
              {
                category: t('sidebar.catIntelligence', 'AI & GIS Intelligence'),
                items: [
                  { id: 'smartmonitoring', label: language === 'hi' ? 'स्मार्ट-आपदा निगरानी' : 'Smart Disaster Monitoring', icon: Cpu, badge: 'AI RADAR', iconColor: 'text-indigo-500 dark:text-indigo-400 bg-indigo-500/10' },
                  { id: 'incidents', label: language === 'hi' ? 'आपदा रिपोर्ट एवं इंटेलिजेंस' : 'Disaster Reports & Intelligence', icon: ShieldAlert, badge: 'NER 8', iconColor: 'text-amber-500 dark:text-amber-400 bg-amber-500/10' },
                  { id: 'aiimpact', label: language === 'hi' ? 'AI आपदा प्रभाव आकलन' : 'AI Impact Assessment', icon: Camera, iconColor: 'text-purple-500 dark:text-purple-400 bg-purple-500/10' },
                  { id: 'map', label: language === 'hi' ? 'NER लाइव मानचित्र' : 'NER Live GIS Map', icon: MapPin, iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' }
                ]
              },
              {
                category: t('sidebar.catResponse', 'Crisis Response & Logistics'),
                items: [
                  { id: 'private-tracking', label: language === 'hi' ? 'स्मार्ट आपातकालीन प्रतिक्रिया' : 'Smart Emergency Response', icon: Radio, badge: '1-TO-1 GPS', iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' },
                  { id: 'relief-supplies', label: language === 'hi' ? 'राहत सामग्री एवं वाहन ट्रैकिंग' : 'Relief Supply & Vehicle Tracking', icon: Truck, badge: 'LIVE', iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { id: 'rerouting', label: language === 'hi' ? 'सड़क सुगमता एवं सुरक्षित मार्ग' : 'Road Accessibility & Safe Routes', icon: Navigation, badge: 'OSRM ROUTE', iconColor: 'text-teal-500 dark:text-teal-400 bg-teal-500/10' },
                  { id: 'facilities', label: language === 'hi' ? 'आपातकालीन सुविधाएं एवं बचाव' : 'Emergency Facilities & Rescue', icon: HeartPulse, iconColor: 'text-rose-500 dark:text-rose-400 bg-rose-500/10' },
                  { id: 'drone', label: language === 'hi' ? 'UAV ड्रोन डिस्पैचर' : 'UAV Drone Dispatcher', icon: Radio, iconColor: 'text-cyan-500 dark:text-cyan-400 bg-cyan-500/10' }
                ]
              },
              {
                category: t('sidebar.catCommand', 'Governance & Operations'),
                items: [
                  { id: 'gov', label: language === 'hi' ? 'MDoNER कमांड' : 'MDoNER Command Grid', icon: Building2, iconColor: 'text-emerald-500 dark:text-emerald-400 bg-emerald-500/10' },
                  { id: 'weather', label: language === 'hi' ? 'मौसम बुद्धिमत्ता' : 'Weather & Doppler Radar', icon: CloudRain, iconColor: 'text-sky-400 dark:text-sky-300 bg-sky-400/10' },
                  { id: 'location', label: language === 'hi' ? 'स्थान बुद्धिमत्ता रिपोर्ट' : 'Location Intelligence Report', icon: Compass, badge: 'PDF REPORT', iconColor: 'text-sky-500 dark:text-sky-400 bg-sky-500/10' }
                ]
              }
            ].map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="hidden md:block px-2.5 pt-2 pb-1 text-[10px] font-extrabold tracking-wider uppercase text-slate-400 select-none">
                  {section.category}
                </div>

                <div className="space-y-1">
                  {section.items.map(tab => {
                    const Icon = tab.icon;
                    const active = activeModule === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveModule(tab.id as any)}
                        title={tab.label}
                        aria-label={tab.label}
                        className={`w-full flex items-center justify-start gap-2.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 group relative min-h-[42px] cursor-pointer ${
                          active
                            ? 'bg-sky-500/15 dark:bg-sky-500/20 text-sky-900 dark:text-sky-300 font-bold border border-sky-500/30 dark:border-sky-500/40 shadow-sm shadow-sky-500/10'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white border border-transparent'
                        }`}
                      >
                        {/* Active Indicator Bar */}
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-full shadow-sm shadow-sky-400" />
                        )}

                        {/* Icon Container */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                            active
                              ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                              : `border border-slate-200/80 dark:border-slate-700/50 ${tab.iconColor} group-hover:border-sky-500/40 group-hover:scale-105`
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        </div>

                        {/* Feature Label */}
                        <span className="hidden md:block flex-1 text-left text-xs font-semibold leading-snug whitespace-normal tracking-tight">
                          {tab.label}
                        </span>

                        {/* Aligned Status Badge (Only for live conditions) */}
                        {tab.badge && (
                          <span
                            className={`hidden md:inline-flex shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[9px] font-black leading-none ml-auto border transition-colors ${
                              tab.badge === 'LIVE'
                                ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/40 animate-pulse'
                                : active
                                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
                                : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CONTENT AREA */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden min-w-0 transition-all duration-300 ${isMobileSimulated ? 'max-w-[400px] mx-auto my-auto h-[95vh] rounded-[44px] border-[10px] border-slate-900 shadow-2xl shadow-sky-950/80 ring-4 ring-slate-800/80 bg-white dark:bg-[#070b14] relative z-40' : 'max-w-full'}`}>
        
        {/* iPhone Dynamic Island & Simulated Status Bar (Visible in Laptop Simulator Mode) */}
        {isMobileSimulated && (
          <div className="bg-slate-950 text-slate-200 text-[11px] font-bold px-5 py-1.5 flex items-center justify-between z-[10002] shrink-0 select-none relative">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sky-400">9:41</span>
              <span className="text-[10px] text-slate-400 font-normal">IST</span>
            </div>

            {/* Dynamic Island Notch Pill */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1.5 h-4 w-24 bg-black rounded-full border border-slate-800/80 flex items-center justify-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80 animate-pulse"></span>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-emerald-400 font-extrabold">5G</span>
              <span>📶</span>
              <span className="text-amber-400">100% 🔋</span>
            </div>
          </div>
        )}

        {/* Top Header Command Bar — Clean, Aesthetic & Perfectly Responsive */}
        <header className="relative z-[9999] h-16 shrink-0 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#070b14]/90 px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-2 sm:gap-3 backdrop-blur-xl shadow-sm transition-colors duration-300 min-w-0 max-w-full">
          {/* Mobile Left: 3-Dot Feature Launcher Menu Button */}
          <div className={`${isMobileSimulated ? 'flex' : 'md:hidden flex'} items-center gap-2 mr-auto`}>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs shadow-md shadow-sky-600/30 active:scale-95 transition cursor-pointer"
              title="Open All 18 Features Menu"
            >
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse delay-75"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse delay-150"></span>
              </div>
              <span className="whitespace-nowrap font-black">
                {language === 'hi' ? 'सभी 18 फीचर्स 🎛️' : 'All 18 Features 🎛️'}
              </span>
            </button>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 z-50 ml-auto">
            {/* 🎥 10-Minute Official Citizen Video Walkthrough Button */}
            <button
              onClick={() => setIsVideoGuideOpen(prev => !prev)}
              className={`rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black text-white shadow-md shadow-amber-500/25 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 border ${
                isVideoGuideOpen ? 'ring-2 ring-emerald-400 border-emerald-300 animate-pulse' : 'border-amber-300/40'
              }`}
              title={isVideoGuideOpen ? "नागरिक मित्र (गाइड आवाज़ रोकने के लिए क्लिक करें)" : "नागरिक मित्र — 10-मिनट संपूर्ण नागरिक वीडियो गाइड (गाइड आवाज़ शुरू करने के लिए क्लिक करें)"}
            >
              <span className="text-sm">🎥</span>
              <span className="whitespace-nowrap font-black">
                {language === 'hi' ? 'नागरिक मित्र (गाइड)' : 'Nagrik Mitra (Guide)'}
              </span>
              {isVideoGuideOpen && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping ml-0.5" />
              )}
            </button>

            {/* 🤖 Executive Jeeva AI Agent Button with Extra Detail Feature */}
            <button
              onClick={() => setIsAiAgentOpen(prev => !prev)}
              className="rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 hover:from-sky-500 hover:to-purple-500 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black text-white shadow-md shadow-indigo-600/25 flex items-center gap-1.5 sm:gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-sky-400/30 group"
              title="Open Jeeva AI Agent with Deep Telemetry & Voice Search"
            >
              <div className="relative flex items-center justify-center">
                <Sparkles className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-300 animate-pulse shrink-0" />
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              </div>
              <span className="whitespace-nowrap font-bold tracking-tight">Jeeva</span>
              <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-md border border-white/20 text-sky-100">
                <Mic className="h-2.5 w-2.5 text-sky-200 animate-pulse" />
                <span>VOICE &bull; TELEMETRY</span>
              </span>
            </button>

            {/* 🚨 Emergency SOS Refined Pill */}
            <button
              onClick={() => setIsSosModalOpen(true)}
              className="rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-rose-400 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black text-white shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Trigger Emergency SOS"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-ping shrink-0"></span>
              <span className="whitespace-nowrap">{t('navigation.sos', 'Emergency SOS')}</span>
            </button>

            {/* Live IST Clock */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 font-mono text-xs shrink-0">
              <span className="text-[10px] text-slate-400">IST</span>
              <span className="font-bold text-slate-900 dark:text-sky-400">
                {currentTime || '23:45:11'}
              </span>
            </div>

            {/* 🌐 Language Switcher */}
            <div className="shrink-0">
              <LanguageSelector />
            </div>

            {/* ☀️/🌙 Theme Toggle Switch */}
            <div className="shrink-0 pr-0.5">
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main Workspace Render */}
        <main className="flex-1 overflow-hidden">

          {/* 🌋 DISASTER REPORTS & INCIDENT INTELLIGENCE */}
        {(activeModule === 'incidents' || activeModule === 'reports') && (
          <div className="h-full overflow-y-auto">
            <DisasterReportsModule
              onNavigateToReroute={() => setActiveModule('rerouting')}
              onNavigateToMap={() => setActiveModule('map')}
              onTriggerSOS={() => setIsSosModalOpen(true)}
            />
          </div>
        )}

        {/* 📖 DISASTER SAFETY GUIDE */}
          {activeModule === 'safetyguide' && (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <DisasterSafetyGuide onTriggerSOS={() => setIsSosModalOpen(true)} />
            </div>
          )}

        {/* 🤖 AI DISASTER IMPACT ASSESSMENT */}
        {activeModule === 'aiimpact' && (
          <div className="h-full overflow-y-auto">
            <AIDisasterImpactAssessment
              initialLoc={sharedMonitoringLoc}
              onNavigateToMonitoring={(loc) => {
                setSharedMonitoringLoc({ lat: loc.lat, lon: loc.lon, displayName: loc.name, state: 'NER Sector', country: 'India' });
                setActiveModule('smartmonitoring');
              }}
            />
          </div>
        )}

        {/* 🛰️ SMART DISASTER MONITORING */}
        {activeModule === 'smartmonitoring' && (
          <div className="h-full overflow-y-auto">
            <SmartDisasterMonitoring
              initialLoc={sharedMonitoringLoc}
              onNavigateToImpactAssessment={(loc) => {
                if (loc) {
                  setSharedMonitoringLoc({ lat: loc.lat, lon: loc.lon, displayName: loc.name, state: 'NER Sector', country: 'India' });
                }
                setActiveModule('aiimpact');
              }}
            />
          </div>
        )}

        {/* 📷 AI DAMAGE ASSESSMENT */}
        {activeModule === 'damageassessment' && (
          <div className="h-full overflow-y-auto">
            <AIDisasterImpactAssessment
              initialLoc={sharedMonitoringLoc}
              onNavigateToMonitoring={(loc) => {
                setSharedMonitoringLoc({ lat: loc.lat, lon: loc.lon, displayName: loc.name, state: 'NER Sector', country: 'India' });
                setActiveModule('smartmonitoring');
              }}
            />
          </div>
        )}

        {/* 0. DISASTER RISK DASHBOARD */}
        {activeModule === 'customdashboard' && (
          <div className="h-full overflow-y-auto">
            <Dashboard
              onNavigateModule={(mod) => setActiveModule(mod)}
            />
          </div>
        )}

        {/* 0. JEEVAN SETU REFERENCE HOMEPAGE */}
        {activeModule === 'home' && (
          <div className="h-full overflow-y-auto">
            <JeevanSetuHomepage
              onNavigateModule={(mod) => setActiveModule(mod)}
              onOpenSos={() => {
                setActiveModule('customdashboard');
                setIsSosModalOpen(true);
              }}
              onOpenAiChatbot={() => setIsAiAgentOpen(true)}
              onOpenVideoGuide={() => setIsVideoGuideOpen(prev => !prev)}
              isVideoGuideOpen={isVideoGuideOpen}
            />
          </div>
        )}

        {/* 2. LIVE GIS MAP (Integrated seamlessly into Dashboard layout) */}
        {activeModule === 'map' && (
          <div className="h-full w-full flex flex-col overflow-hidden">
            <NERLiveMapModule
              hideHeader={false}
              focusedTarget={mapFocusedTarget}
              onNavigateTo3DSim={() => setActiveModule('hub')}
              onTriggerSOS={() => setIsSosModalOpen(true)}
              onBackToDashboard={() => setActiveModule(previousModule || 'home')}
            />
          </div>
        )}

        {/* 3. ROAD MONITORING & ACCESSIBILITY */}
        {activeModule === 'road' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-rose-700 dark:text-rose-400 border border-rose-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
                    EXECUTIVE HIGHWAY & BRIDGE INTEGRITY TELEMETRY
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <Activity className="h-7 w-7 text-rose-500" />
                  {t("road.title", "NER Road & Accessibility Monitoring")}
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  {t("road.subtitle", "Live telemetry on highway clearance, landslide choke points, and bridge load integrity.")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveModule('map')}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs lg:text-sm font-extrabold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer border border-indigo-400/30 transition"
                >
                  <span>🗺️</span> Open Full 2D Tactical Map
                </button>
                <span className="rounded-xl bg-rose-500/20 px-4 py-2 text-xs lg:text-sm font-black text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  2 Active Disrupted Corridors
                </span>
              </div>
            </div>

            {/* Live Interactive Highway Clearance Map Container */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-3 transition-colors duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg lg:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🛣️</span> Live Interactive Highway Telemetry & Clearance Map
                </h3>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-black bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                  ● Live Map Synchronization Active
                </span>
              </div>
              <div ref={roadMapContainerRef} className="h-72 w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner" />
            </div>

            {/* Highway Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { name: 'NH-6: Meghalaya ➔ Silchar Corridor', status: 'PARTIALLY_BLOCKED', risk: 'HIGH (Landslide at Km 142)', detour: 'Active Bypass Operational', speed: '25 km/h' },
                { name: 'NH-29: Dimapur ➔ Kohima Pass', status: 'CLEAR', risk: 'LOW (Optimal Flow)', detour: 'None Required', speed: '55 km/h' },
                { name: 'NH-10: Siliguri ➔ Gangtok Route', status: 'CAUTION', risk: 'MODERATE (Teesta River Swelling)', detour: 'Melli-Jorethang Alternate', speed: '35 km/h' },
                { name: 'NH-306: Silchar ➔ Aizawl Artery', status: 'CLEAR', risk: 'LOW (Convoy Clearance Active)', detour: 'None', speed: '48 km/h' },
                { name: 'NH-415: Banderdewa ➔ Itanagar', status: 'CLEAR', risk: 'LOW (Paved Terrain)', detour: 'None', speed: '60 km/h' },
                { name: 'NH-37: Kaziranga Flood Barrier Pass', status: 'MONITORED', risk: 'MODERATE (Wildlife + Rain)', detour: 'Speed Regulation 40 km/h', speed: '40 km/h' }
              ].map((route, i) => (
                <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 transition-colors duration-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">{route.name}</span>
                    <span className={`rounded-lg px-3 py-1 text-xs font-black shrink-0 ${
                      route.status === 'CLEAR' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30' :
                      route.status === 'CAUTION' || route.status === 'MONITORED' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                    }`}>
                      {route.status}
                    </span>
                  </div>
                  <div className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium">Risk Assessment: <span className="text-slate-900 dark:text-slate-200 font-bold">{route.risk}</span></div>
                  <div className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 font-medium">Detour Status: <span className="text-indigo-600 dark:text-indigo-300 font-bold">{route.detour}</span></div>
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-xs lg:text-sm">
                    <span className="text-slate-500 font-medium">Speed: <b className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm lg:text-base">{route.speed}</b></span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer shadow">Live Map 🗺️</button>
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D 🎮</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VEHICLE LOGISTICS TELEMETRY ROSTER (8 ACTIVE SECTOR UNITS) */}
        {activeModule === 'vehicles' && (
          <div className="h-full overflow-y-auto p-5 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs lg:text-sm font-extrabold text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                    LIVE CAN-BUS OBD-II DIAGNOSTICS & ISRO NAVIC TRACKING
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
                  <span>🚚</span> {t("vehicles.title", "Inter State Relief Convoy Telemetry Roster")} <span className="text-xs lg:text-sm font-bold text-slate-500 dark:text-slate-400">(8 Active Sector Units)</span>
                </h1>
                <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
                  {t("vehicles.subtitle", "Live satellite telemetry, CAN-bus OBD-II sensor diagnostics, cold-chain monitoring, and emergency diversion tracking across all 8 North Eastern States.")}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 font-mono text-xs lg:text-sm font-black flex items-center gap-2 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping"></span>
                  ● NavIC 14 Sats Active
                </span>
              </div>
            </div>

            {/* DATA TRANSPARENCY STATUS BANNER */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 lg:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs lg:text-sm font-mono transition-colors duration-300">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-black flex items-center gap-2 text-xs">
                  🟢 CAN-BUS & NAVIC SATELLITE LINK ONLINE
                </span>
                <span className="text-slate-600 dark:text-slate-400 font-sans">
                  Source: <b className="text-slate-900 dark:text-white font-bold">ISRO NavIC Satellite Array & Heavy Convoy OBD-II Units</b>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 font-sans">
                <span>Refreshed: <b className="text-slate-900 dark:text-slate-200 font-bold">12:49:10 AM</b></span>
              </div>
            </div>

            {/* 8 Active Convoy Cards Grid (2 cols x 4 rows) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Convoy #01 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                      PRIORITY 1
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AS-01-AB-1234 (Convoy #01)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    45 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Guwahati Central Hub (Assam) ➔ Aizawl Civil Hospital (Mizoram)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 12t Medical Oxygen Cylinders (Class 1 Urgent)
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">78%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">12 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Temp: <b className="text-slate-900 dark:text-white font-bold">21.4°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-400 font-bold">Optimal</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 42% &bull; Diverted via Sector 9 Jowai Bypass</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #02 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-black uppercase">
                      PRIORITY 2
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AS-02-CD-5678 (Convoy #02)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    52 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Nagaon Central Silos ➔ Dhemaji Forward Depot (Upper Assam)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 20t Baby Food & Fortified Grain Bags
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">84%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">14 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Temp: <b className="text-slate-900 dark:text-white font-bold">26.2°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-sky-600 dark:text-sky-300 font-bold">Clear 4-Lane</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 68% &bull; ETA: 1h 45m (NH-27 Green Corridor)</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #03 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      ESCORT ACTIVE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">AR-01-EF-9012 (Convoy #03)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-amber-600 dark:text-amber-400">
                    34 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Tezpur Military Base ➔ Sela Pass & Tawang Sector (Arunachal)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 25t Ration, Antivenom & Hypothermia Blankets
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">92%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Chains: <b className="text-slate-900 dark:text-white font-bold">Mounted</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Alt: <b className="text-slate-900 dark:text-white font-bold">2,410m</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">ITBP Fog</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 25% &bull; Kalaktang Ridge Bypass &bull; ETA: 4h 10m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('drone')} className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs lg:text-sm font-extrabold cursor-pointer">Air-Drop SOS 🚨</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #04 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      REROUTED
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">NL-01-GH-3456 (Convoy #04)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    41 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Dimapur Commercial Hub ➔ Kohima Medical Center (Nagaland)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 18 KL Emergency Diesel for Hospital Generators
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">88%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">13 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Zubza</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">35km Escort</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full" style={{ width: '55%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 55% &bull; Single-Lane Escort &bull; ETA: 2h 05m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #05 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black uppercase">
                      CLASS 1 TRAUMA
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">ML-01-IJ-7890 (Convoy #05)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-rose-600 dark:text-rose-400">
                    48 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Siliguri Staging Depot ➔ Gangtok Civil Hospital (Sikkim)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 8t Blood Plasma, Trauma Kits & Antivenom Vials
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Cold: <b className="text-cyan-600 dark:text-cyan-300 font-bold">-20°C</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">70%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Lava Pass</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">Teesta</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{ width: '79%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 79% &bull; Elevated Ridge Link &bull; ETA: 0h 40m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #06 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase">
                      PRIORITY 2
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">MN-01-KL-2345 (Convoy #06)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-emerald-600 dark:text-emerald-400">
                    58 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Silchar Logistics Base ➔ Imphal Valley Hospital (Manipur)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 14t Infant Formula & Water Purification Chem
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">66%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">11 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">Jiribam</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">All Clear</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 72% &bull; Nominal Transit &bull; ETA: 1h 20m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #07 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-black uppercase">
                      SHELTER CACHE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">TR-01-MN-6789 (Convoy #07)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-sky-600 dark:text-sky-400">
                    50 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Guwahati Central Hub ➔ Agartala Relief Depot (Tripura)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 18t Emergency Tarpaulins & Medical Tents
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">74%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">14 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">NH-8</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-emerald-600 dark:text-emerald-300 font-bold">Clear</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 87% &bull; Southern Artery Operational &bull; ETA: 0h 55m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Convoy #08 */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 relative transition-colors duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-black uppercase">
                      HILL CACHE
                    </span>
                    <span className="font-black text-base lg:text-lg text-slate-900 dark:text-white">MZ-01-OP-4567 (Convoy #08)</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 font-mono text-xs lg:text-sm font-black text-amber-600 dark:text-amber-400">
                    36 km/h
                  </span>
                </div>

                <div className="space-y-1 text-xs lg:text-sm">
                  <div className="text-slate-800 dark:text-slate-200 font-bold">
                    <b>Route:</b> Silchar Staging Depot ➔ Lunglei Hill Post (Mizoram)
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-medium">
                    <b>Consignment:</b> 10t Survival Rations & Anti-Rabies Vaccine Caches
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2.5 text-xs lg:text-sm text-slate-700 dark:text-slate-300 pt-1 font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">Fuel: <b className="text-slate-900 dark:text-white font-bold">82%</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">NavIC: <b className="text-slate-900 dark:text-white font-bold">10 Sats</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-slate-800 dark:text-slate-200 font-bold">NH-54</b></div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"><b className="text-amber-600 dark:text-amber-300 font-bold">Rain</b></div>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs lg:text-sm pt-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Progress: 45% &bull; Heavy Mud Silt Drag &bull; ETA: 3h 50m</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setActiveModule('hub')} className="px-3.5 py-2 rounded-xl bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs lg:text-sm font-extrabold cursor-pointer">Track 3D</button>
                      <button onClick={() => setActiveModule('map')} className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 text-xs lg:text-sm font-extrabold cursor-pointer">Map 🗺️</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. REAL-TIME RELIEF SUPPLY & VEHICLE TRACKING MODULE */}
        {(activeModule === 'relief-supplies' || activeModule === 'supplies' || activeModule === 'vehicle-tracking' || activeModule === 'driver-tracking' || activeModule === 'relief-operations' || activeModule === 'relief-depots') && (
          <div className="h-full overflow-y-auto">
            <ReliefSupplyTrackingModule
              initialTab={
                activeModule === 'vehicle-tracking' ? 'live-map' :
                activeModule === 'driver-tracking' ? 'driver-portal' :
                activeModule === 'relief-operations' ? 'operations' :
                activeModule === 'relief-depots' ? 'depots' :
                activeModule === 'supplies' ? 'supplies' :
                'live-map'
              }
              onNavigateHome={() => setActiveModule('home')}
            />
          </div>
        )}

        {/* PRIVATE SMART EMERGENCY LIVE TRACKING MODULE */}
        {(activeModule === 'private-tracking' || activeModule === 'smart-tracking' || activeModule === 'live-tracking' || activeModule === 'emergency-response') && (
          <div className="h-full overflow-y-auto">
            <PrivateSmartEmergencyModule
              onNavigateHome={() => setActiveModule('home')}
            />
          </div>
        )}

        {/* 5. DYNAMIC ROAD ACCESSIBILITY & SAFE ROUTE INTELLIGENCE */}
        {activeModule === 'rerouting' && (
          <RoadAccessibilityModule
            onNavigateToMap={() => setActiveModule('map')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 6. GOVERNMENT DASHBOARD & ANALYTICS */}
        {activeModule === 'gov' && (
          <MDoNERCommandModule />
        )}

        {/* UAV DRONE DISPATCHER MODULE VIEW */}
        {activeModule === 'drone' && (
          <UAVDroneModule onNavigateToMonitoring={() => setActiveModule('smartmonitoring')} />
        )}


        {/* 7. WEATHER INTELLIGENCE VIEW */}
        {activeModule === 'weather' && (
          <WeatherIntelligence
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateToReroute={() => setActiveModule('rerouting')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 7B. FLOOD INTELLIGENCE VIEW */}
        {activeModule === 'flood' && (
          <FloodIntelligenceModule
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateToReroute={() => setActiveModule('rerouting')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 7C. LANDSLIDE RISK INTELLIGENCE VIEW */}
        {activeModule === 'landslide' && (
          <LandslideRiskIntelligence
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateToReroute={() => setActiveModule('rerouting')}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* 7D. EMERGENCY FACILITIES & RESCUE POINTS INTELLIGENCE VIEW */}
        {activeModule === 'facilities' && (
          <EmergencyFacilitiesModule
            onNavigateToMap={() => setActiveModule('map')}
            onNavigateToReroute={(origin, dest) => {
              setRouteStart(origin);
              setRouteDest(dest);
              setActiveModule('rerouting');
            }}
            onTriggerSOS={() => setIsSosModalOpen(true)}
          />
        )}

        {/* LOCATION 360° INTELLIGENCE MODULE */}
        {(activeModule === 'location' || activeModule === 'location-360' || activeModule === 'addressintelligence') && (
          <div className="h-full overflow-y-auto">
            <AddressDisasterIntelligence />
          </div>
        )}




        {/* Fallback for other quick tabs */}
        {(activeModule === 'vehicles' || activeModule === 'alerts' || activeModule === 'vehicleselect' || activeModule === 'analytics') && (
          <div className="h-full overflow-y-auto p-6 space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h2 className="text-base font-bold text-white capitalize">{activeModule.replace('-', ' ')} Module</h2>
              <p className="text-xs text-slate-400 mt-1">Directly integrated with MDoNER NER Logistics database.</p>
              <div className="mt-6 flex flex-col items-center justify-center py-12 text-center text-slate-500">
                <ShieldCheck className="h-12 w-12 text-indigo-500 mb-3" />
                <p className="text-sm text-slate-300 font-semibold">Active Logistics Stream Online</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md">Data synchronizing with the central dispatch nodes across all 8 North Eastern states.</p>
              </div>
            </div>
          </div>
        )}

        {/* 🎛️ Floating Action Button on Mobile (Bottom-Right 3-Dots Button) */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`${isMobileSimulated ? 'flex' : 'md:hidden flex'} fixed bottom-6 right-5 z-[9990] items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-sky-600/50 border-2 border-sky-300/60 font-black text-xs active:scale-95 transition-transform cursor-pointer`}
          title="Choose from All 18 Features"
        >
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300 animate-ping"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300"></span>
            <span className="h-2.5 w-2.5 rounded-full bg-sky-200"></span>
          </div>
          <span className="font-black text-xs">{language === 'hi' ? '18 फीचर्स 🎛️' : '18 Features 🎛️'}</span>
        </button>

        {/* 📱 MOBILE FEATURE LAUNCHER DRAWER (FULL SCREEN ON PHONE WITH 18 FEATURES) */}
        {isMobileMenuOpen && (
          <div className={`${isMobileSimulated ? 'flex' : 'md:hidden flex'} fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-200`}>
            <div className="bg-white dark:bg-[#080e21] border border-slate-200 dark:border-slate-800 w-full h-[92vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d152d] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-600/30 ring-2 ring-sky-400/40 overflow-hidden shrink-0">
                    <img src="/jeevan-setu-logo.jpg" alt="Logo" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                      {language === 'hi' ? 'जीवन सेतु — सभी 18 फीचर्स' : 'Jeevan Setu — All 18 Features'}
                    </h2>
                    <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">
                      {language === 'hi' ? 'अपनी पसंद का फीचर चुनें (Full Screen)' : 'Select any feature for full screen view'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="h-9 w-9 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center hover:bg-rose-500 hover:text-white transition cursor-pointer shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Feature Search Bar */}
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070b16] shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={language === 'hi' ? 'फीचर का नाम खोजें (उदा: GPS, नक्शा, मौसम, अस्पताल)...' : 'Search feature name (e.g. GPS, map, weather)...'}
                    value={mobileSearchQuery}
                    onChange={(e) => setMobileSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Feature Grid List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {ALL_FEATURE_GROUPS.map((group, gIdx) => {
                  const filteredItems = group.items.filter(item => {
                    if (!mobileSearchQuery) return true;
                    const q = mobileSearchQuery.toLowerCase();
                    return (
                      item.nameHi.toLowerCase().includes(q) ||
                      item.nameEn.toLowerCase().includes(q) ||
                      item.descHi.toLowerCase().includes(q) ||
                      item.descEn.toLowerCase().includes(q)
                    );
                  });

                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={gIdx} className="space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-extrabold tracking-wider uppercase text-sky-600 dark:text-sky-400 px-1">
                        <span>{language === 'hi' ? group.categoryHi : group.categoryEn}</span>
                        <span className="text-[10px] text-slate-400">{filteredItems.length} Features</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {filteredItems.map(item => {
                          const Icon = item.icon;
                          const active = activeModule === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveModule(item.id);
                                setIsMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                active
                                  ? 'bg-gradient-to-r from-sky-600/20 to-indigo-600/20 border-sky-500/60 ring-2 ring-sky-500/40 shadow-lg'
                                  : 'bg-slate-50 dark:bg-[#0c142b] border-slate-200 dark:border-slate-800/80 hover:border-sky-500/40 hover:bg-sky-500/10'
                              }`}
                            >
                              <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center border shadow-sm ${item.iconColor}`}>
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                                    {language === 'hi' ? item.nameHi : item.nameEn}
                                  </h3>
                                  {item.badge && (
                                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 uppercase">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {language === 'hi' ? item.descHi : item.descEn}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </main>
        </div>
      </div>
    )}

      {/* 🚨 Emergency SOS Modal (Persistent across all page transitions) */}
      <EmergencySOSModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        onTransmitSOSLocation={(locationData) => {
          if (locationData.sosId) {
            dismissedSosIdsRef.current.delete(locationData.sosId);
          }
          setActiveSosLocation(locationData);
          setIsSosModalOpen(false);
          setActiveModule('customdashboard');
        }}
      />

      {/* 🤖 Universal AI Agent with Deep Telemetry & Diagnostics */}
      <AIChatbotWidget
        isOpenControlled={isAiAgentOpen}
        onOpenControlled={() => setIsAiAgentOpen(true)}
        onCloseControlled={() => setIsAiAgentOpen(false)}
        onNavigateModule={(mod) => setActiveModule(mod as any)}
        onOpenSos={() => setIsSosModalOpen(true)}
        activeModule={activeModule}
      />

      {/* 🎥 10-Minute Official Citizen Video Walkthrough Modal (Persistent playback across Dashboard/Home transitions) */}
      <CitizenVideoWalkthroughModal
        isOpen={isVideoGuideOpen}
        onClose={() => setIsVideoGuideOpen(false)}
        onNavigateModule={(mod) => setActiveModule(mod as any)}
        onTriggerSOS={() => setIsSosModalOpen(true)}
      />
    </>
  );
}
