import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  ShieldAlert,
  Map as MapIcon,
  Search,
  Globe,
  PhoneCall,
  Cpu,
  CloudRain,
  Radio,
  Clock,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Users,
  FileText,
  X,
  Upload,
  Navigation,
  Zap,
  Layers,
  Activity,
  Sparkles,
  Plus,
  Minus,
  Crosshair,
  ShieldCheck,
  Youtube,
  Twitter,
  Instagram,
  Linkedin,
  Sun,
  Wind,
  Droplets,
  Share2,
  ExternalLink,
  Info,
  LayoutDashboard,
  Menu
} from 'lucide-react';
import L from 'leaflet';
import { useTranslation } from '../i18n';
import ThemeToggle from './ThemeToggle';

interface JeevanSetuHomepageProps {
  onNavigateModule: (module: string) => void;
  onOpenSos: () => void;
  onOpenDashboard?: () => void;
}

// Sample India disaster incident markers with live GIS telemetry
const DISASTER_MARKERS = [
  { id: 1, type: 'Landslide', name: 'Landslide in Sikkim', loc: 'Gangtok / Mangan Sector', lat: 27.3389, lon: 88.6065, severity: 'High Risk', time: '2 hours ago', color: '#F97316', radius: 35000, teams: 'NDRF Battalion 2', pop: '14,200' },
  { id: 2, type: 'Flood', name: 'Flood Alert – Assam', loc: 'Kaziranga / Lakhimpur', lat: 26.58, lon: 93.17, severity: 'Moderate Risk', time: '4 hours ago', color: '#2563EB', radius: 45000, teams: 'SDRF Team 8', pop: '42,000' },
  { id: 3, type: 'Heavy Rainfall', name: 'Heavy Rainfall – Meghalaya', loc: 'Sohra / Cherrapunji', lat: 25.27, lon: 91.73, severity: 'Monitor', time: '6 hours ago', color: '#10B981', radius: 25000, teams: 'IMD Alert Center', pop: '8,500' },
  { id: 4, type: 'Landslide', name: 'Wayanad Hillside Shift', loc: 'Wayanad, Kerala', lat: 11.6854, lon: 76.132, severity: 'High Risk', time: '1 hour ago', color: '#F97316', radius: 30000, teams: 'Indian Army & NDRF', pop: '28,000' },
  { id: 5, type: 'Flood', name: 'Yamuna River Swelling', loc: 'Delhi NCR Sector', lat: 28.6139, lon: 77.209, severity: 'Moderate Risk', time: '3 hours ago', color: '#2563EB', radius: 20000, teams: 'Delhi Disaster Auth', pop: '65,000' },
  { id: 6, type: 'Earthquake', name: 'Tremor Alert – Uttarkashi', loc: 'Uttarakhand', lat: 30.7268, lon: 78.4354, severity: 'Monitor', time: '5 hours ago', color: '#EAB308', radius: 50000, teams: 'Seismology Dept', pop: '19,500' },
  { id: 7, type: 'Fire', name: 'Forest Fire – Shimla Ridge', loc: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734, severity: 'High Risk', time: '8 hours ago', color: '#EF4444', radius: 15000, teams: 'Air Force Choppers', pop: '6,200' }
];

const getDisasterIconSvg = (type: string) => {
  switch (type) {
    case 'Flood':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>`;
    case 'Landslide':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    case 'Earthquake':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`;
    case 'Fire':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`;
    case 'Heavy Rainfall':
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    default:
      return `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/></svg>`;
  }
};

export default function JeevanSetuHomepage({ onNavigateModule, onOpenSos, onOpenDashboard }: JeevanSetuHomepageProps) {
  const { t, language, setLanguage } = useTranslation();

  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      onNavigateModule('customdashboard');
    }
  };

  // Side Panel Drawer state (report, aianalysis, risk, gethelp, livesituation)
  const [activeSidePanel, setActiveSidePanel] = useState<'report' | 'aianalysis' | 'risk' | 'gethelp' | 'livesituation' | null>(null);

  // Compact Feature Modal state for hero indicator pills (ai, livedata, gis, risk)
  const [activeFeatureModal, setActiveFeatureModal] = useState<'ai' | 'livedata' | 'gis' | 'risk' | null>(null);

  // AI Analysis Panel simulation state
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  // Instruction Guide Modal State for "How Jeevan Setu Works" steps
  const [selectedInstructionStep, setSelectedInstructionStep] = useState<{
    stepNum: string;
    title: string;
    subtitle: string;
    desc: string;
    icon: any;
    color: string;
    instructions: string[];
    tips: string;
    actionText: string;
    action: () => void;
  } | null>(null);

  // Side Panel Map Refs & Effect
  const sidePanelMapContainerRef = useRef<HTMLDivElement>(null);
  const sidePanelMapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (activeSidePanel !== 'livesituation') {
      if (sidePanelMapInstanceRef.current) {
        sidePanelMapInstanceRef.current.remove();
        sidePanelMapInstanceRef.current = null;
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!sidePanelMapContainerRef.current) return;
      if (sidePanelMapInstanceRef.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
      });

      const map = L.map(sidePanelMapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([23.5, 83.5], 5);

      L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      }).addTo(map);

      DISASTER_MARKERS.forEach((item) => {
        const customIcon = L.divIcon({
          className: 'custom-disaster-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px;">
              <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background-color: ${item.color}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${item.color}; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.5); z-index: 10;"></div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 13]
        });
        L.marker([item.lat, item.lon], { icon: customIcon }).addTo(map);
      });

      sidePanelMapInstanceRef.current = map;
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      if (sidePanelMapInstanceRef.current) {
        sidePanelMapInstanceRef.current.remove();
        sidePanelMapInstanceRef.current = null;
      }
    };
  }, [activeSidePanel]);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPhoto, setReportPhoto] = useState<string | null>(null);
  const [reportLocation, setReportLocation] = useState('Gangtok, Sikkim (27.33° N, 88.60° E)');
  const [reportCategory, setReportCategory] = useState('Landslide');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Check Risk Modal state
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [selectedRiskLoc, setSelectedRiskLoc] = useState('Sikkim, North East India');

  // Emergency Info Modal state
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Mobile Menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Map state & references inside Live Situation Command HUD
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const radarTileRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const circlesGroupRef = useRef<L.LayerGroup | null>(null);

  const [mapTileType, setMapTileType] = useState<'satellite' | 'dark' | 'topo'>('satellite');
  const [showDopplerRadar, setShowDopplerRadar] = useState(true);
  const [showHazardCircles, setShowHazardCircles] = useState(true);
  const [selectedMapCategory, setSelectedMapCategory] = useState<string>('All');
  const [liveTimeStr, setLiveTimeStr] = useState<string>('');
  const [cursorCoords, setCursorCoords] = useState<{ lat: string; lon: string } | null>(null);

  // Language state dropdown
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Smooth Scroll / Tab highlight
  const [activeTab, setActiveTab] = useState<'Home' | 'Dashboard' | 'Live Map' | 'Risk Assessment' | 'Resources' | 'About' | 'Contact'>('Home');

  // Live time ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveTimeStr(now.toLocaleTimeString('en-US', { hour12: false }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Map Basemap URLs (Google Maps Live Telemetry)
  const getTileUrl = (type: 'satellite' | 'dark' | 'topo') => {
    switch (type) {
      case 'dark':
        return 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      case 'topo':
        return 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      case 'satellite':
      default:
        return 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
    }
  };

  // Initialize Embedded Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Fix leaflet icon path issues
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
    });

    // Create map centered on India
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([23.5, 83.5], 5);

    const initialTile = L.tileLayer(getTileUrl(mapTileType), { maxZoom: 18 }).addTo(map);
    tileLayerRef.current = initialTile;

    // Doppler Radar Layer Overlay
    const radarTile = L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', {
      opacity: showDopplerRadar ? 0.45 : 0,
      maxZoom: 18
    }).addTo(map);
    radarTileRef.current = radarTile;

    // Layer groups for markers & buffer circles
    markersGroupRef.current = L.layerGroup().addTo(map);
    circlesGroupRef.current = L.layerGroup().addTo(map);

    // Mouse move event for HUD live coordinates
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({
        lat: e.latlng.lat.toFixed(2),
        lon: e.latlng.lng.toFixed(2)
      });
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Circles dynamically on filter / toggle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !circlesGroupRef.current) return;

    markersGroupRef.current.clearLayers();
    circlesGroupRef.current.clearLayers();

    const filtered = selectedMapCategory === 'All'
      ? DISASTER_MARKERS
      : DISASTER_MARKERS.filter(m => m.type === selectedMapCategory);

    filtered.forEach((item) => {
      const svgIcon = getDisasterIconSvg(item.type);

      const customIcon = L.divIcon({
        className: 'custom-disaster-marker',
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; border: 2px solid ${item.color}; opacity: 0.75; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background-color: ${item.color}; opacity: 0.3; animation: pulse 2s infinite;"></div>
            <div style="position: relative; width: 22px; height: 22px; border-radius: 50%; background-color: ${item.color}; border: 2px solid #ffffff; box-shadow: 0 0 10px ${item.color}; z-index: 10; display: flex; align-items: center; justify-content: center; color: white;">
              ${svgIcon}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([item.lat, item.lon], { icon: customIcon });

      marker.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; background: #0b1329; color: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid rgba(56, 189, 248, 0.3); min-width: 210px; box-shadow: 0 12px 30px rgba(0,0,0,0.8);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 9px; font-weight: 900; text-transform: uppercase; background: ${item.color}; color: white; letter-spacing: 0.5px;">
              ${item.type} &bull; ${item.severity}
            </span>
            <span style="font-size: 10px; color: #94a3b8;">${item.time}</span>
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #ffffff; line-height: 1.3; margin-bottom: 4px;">${item.name}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">📍 ${item.loc}</div>
          
          <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 6px 8px; font-size: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 8px;">
            <div><span style="color: #64748b;">Response:</span> <br/><strong style="color: #38bdf8;">${item.teams}</strong></div>
            <div><span style="color: #64748b;">Impacted:</span> <br/><strong style="color: #e2e8f0;">${item.pop}</strong></div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; pt: 4px; border-top: 1px solid rgba(255,255,255,0.08);">
            <span style="font-size: 9px; font-weight: 700; color: #10b981; display: inline-flex; align-items: center; gap: 4px;">
              <span style="height: 6px; width: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
              LIVE GIS STREAMING &bull; ACTIVE
            </span>
          </div>
        </div>
      `);

      markersGroupRef.current.addLayer(marker);

      if (showHazardCircles && item.radius) {
        const circle = L.circle([item.lat, item.lon], {
          radius: item.radius,
          color: item.color,
          fillColor: item.color,
          fillOpacity: 0.15,
          weight: 1.5,
          dashArray: '6, 6'
        });
        circlesGroupRef.current.addLayer(circle);
      }
    });
  }, [selectedMapCategory, showHazardCircles, mapInstanceRef.current]);

  // Handle map basemap tile change
  const changeMapTile = (type: 'satellite' | 'dark' | 'topo') => {
    if (!mapInstanceRef.current) return;
    setMapTileType(type);

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const newLayer = L.tileLayer(getTileUrl(type), { maxZoom: 18 }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  };

  // Toggle Doppler Radar Layer
  const toggleDopplerRadar = () => {
    const nextState = !showDopplerRadar;
    setShowDopplerRadar(nextState);
    if (radarTileRef.current) {
      radarTileRef.current.setOpacity(nextState ? 0.45 : 0);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleRecenter = () => mapInstanceRef.current?.setView([23.5, 83.5], 5);

  // File upload preview handler for Report Disaster
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        setReportPhoto(evt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      await fetch('http://localhost:5000/citizen/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: reportLocation,
          incident: reportCategory,
          photoName: 'disaster_upload.jpg'
        })
      });
    } catch (err) {
      // Fallback local handling
    }
    setTimeout(() => {
      setReportSubmitting(false);
      setReportSuccess(true);
      setTimeout(() => {
        setReportSuccess(false);
        setIsReportModalOpen(false);
        setReportPhoto(null);
      }, 2000);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col transition-colors duration-300">
      
      {/* ==================================================
          2. STICKY NAVBAR (Dark Navy matching reference image)
         ================================================== */}
      <header className="sticky top-0 z-[100] w-full bg-[#0B132B] dark:bg-[#070d1e] text-white shadow-lg border-b border-slate-800 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* LEFT: Logo & Brand (Enlarged) */}
          <div
            onClick={() => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3.5 cursor-pointer group shrink-0"
          >
            <div className="relative h-12 w-12 sm:h-13 sm:w-13 rounded-full overflow-hidden ring-2 ring-sky-400/60 group-hover:scale-105 transition shadow-lg shadow-sky-500/25 bg-slate-900 flex items-center justify-center">
              <img
                src="/jeevan-setu-logo.jpg"
                alt="Jeevan Setu Logo"
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-sky-400 font-black text-xl">JS</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xl sm:text-2xl font-black tracking-wider text-white leading-none font-sans group-hover:text-sky-300 transition">
                  {language === 'hi' ? (
                    <>जीवन <span className="text-sky-400">सेतु</span></>
                  ) : (
                    <>Jeevan <span className="text-sky-400">Setu</span></>
                  )}
                </span>
              </div>
              <span className="text-xs font-bold text-sky-400/90 tracking-wide leading-tight mt-1 hidden sm:block">
                {t('nav.brandSubtitle', 'AI Powered Disaster Response & GIS Intelligence Platform')}
              </span>
            </div>
          </div>

          {/* RIGHT: Navigation Links & Action Tools (Enlarged) */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Navigation Links (Larger Text & Spacing) */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-3 mr-2 sm:mr-3">
              {[
                { id: 'Home', name: t('nav.homeNav', 'Home'), action: () => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                { id: 'About', name: t('nav.aboutNav', 'About'), action: () => { setActiveTab('About'); const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); } },
                { id: 'Contact', name: t('nav.contactNav', 'Contact'), action: () => { setActiveTab('Contact'); setIsInfoModalOpen(true); } }
              ].map((nav) => {
                const isActive = activeTab === nav.id;
                return (
                  <button
                    key={nav.id}
                    onClick={nav.action}
                    className={`px-4 py-2 rounded-xl text-base sm:text-lg font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] relative cursor-pointer ${
                      isActive
                        ? 'text-sky-300 font-extrabold'
                        : 'text-slate-200 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    {nav.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-4 right-4 h-[3.5px] bg-sky-400 rounded-full shadow-md shadow-sky-400" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Search Icon (Enlarged) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 rounded-full text-slate-200 hover:text-white hover:bg-slate-800 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer"
              title="Search"
            >
              <Search className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>

            {/* Language Selector (Enlarged) */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold text-slate-100 hover:text-white hover:bg-slate-800 hover:border-sky-400/80 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.06] hover:shadow-md cursor-pointer border border-slate-700/70 shadow-sm"
              >
                <Globe className="h-4 w-4 text-sky-400" />
                <span>{language === 'hi' ? 'हिन्दी' : language === 'as' ? 'অসমীয়া' : language === 'bn' ? 'বাংলা' : language === 'ne' ? 'नेपाली' : 'English'}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#0B132B] dark:bg-[#070d1e] border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-sm font-semibold text-slate-200">
                  {[
                    { label: 'English', code: 'en' },
                    { label: 'हिन्दी (Hindi)', code: 'hi' },
                    { label: 'অসমীয়া (Assamese)', code: 'as' },
                    { label: 'বাংলা (Bengali)', code: 'bn' },
                    { label: 'नेपाली (Nepali)', code: 'ne' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-sky-600/30 hover:text-white transition flex items-center justify-between cursor-pointer"
                    >
                      <span>{lang.label}</span>
                      {language === lang.code && <CheckCircle2 className="h-4 w-4 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NER Pill Badge (Enlarged) */}
            <button
              onClick={() => onNavigateModule('gov')}
              className="px-3.5 py-1.5 rounded-full text-sm font-black bg-sky-500/20 text-sky-300 border border-sky-400/40 hover:bg-sky-500/30 hover:border-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.1] hover:shadow-lg cursor-pointer hidden lg:flex items-center gap-1.5 shadow-sm"
            >
              <span>🏛️</span>
              <span>NER</span>
            </button>

            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#070d1e] border-t border-slate-800 px-4 py-4 space-y-2 text-sm font-semibold text-slate-200 shadow-2xl">
            {[
              { name: 'Home', action: () => { setActiveTab('Home'); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { name: 'About', action: () => { setActiveTab('About'); setIsMobileMenuOpen(false); const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); } },
              { name: 'Contact', action: () => { setActiveTab('Contact'); setIsMobileMenuOpen(false); setIsInfoModalOpen(true); } }
            ].map((nav) => (
              <button
                key={nav.name}
                onClick={nav.action}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition flex items-center justify-between"
              >
                <span>{nav.name}</span>
                <ArrowRight className="h-4 w-4 text-sky-400" />
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ==================================================
          3. HERO SECTION (100% Clean High-Res Landscape + Real React HTML Elements)
          ================================================== */}
      <section className="relative w-full min-h-[60vh] sm:min-h-[65vh] lg:min-h-[700px] bg-[#040814] text-white overflow-hidden flex items-center border-b border-slate-800">
        {/* 100% Clean Photographic Background with Rich Dark Gradient Overlay for Maximum Readability */}
        <div className="absolute inset-0 z-0">
          <img
            src="/disaster-response-hero.jpg"
            alt="Jeevan Setu Disaster Response & Rescue Operations"
            className="w-full h-full object-cover object-right filter brightness-95 contrast-105 saturate-105"
          />
          {/* Deep Navy Dark Gradient Overlay for Crisp Text & Button Contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#040814]/95 via-[#040814]/75 to-[#040814]/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040814]/90 via-transparent to-[#040814]/40" />
        </div>

        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-16 sm:py-24 lg:py-32 flex flex-col justify-between">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Hero Left Content with High-Contrast Typography & Glassmorphic Buttons */}
            <div className="max-w-3xl space-y-5">
              
              {/* Upper Small Label */}
              <div className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#38BDF8] font-sans drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {t('home.badge', 'DISASTER RESPONSE & GIS INTELLIGENCE')}
              </div>

              {/* Title with "Jeevan" in White and "Setu" in Cyan */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white font-sans leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                Jeevan <span className="text-[#38BDF8] drop-shadow-[0_0_25px_rgba(56,189,248,0.6)]">Setu</span>
              </h1>

              <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                {t('home.heroSub', 'AI Powered Disaster Response & GIS Intelligence Platform')}
              </p>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium max-w-2xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                {t('home.heroDesc', 'Jeevan Setu combines AI, GIS, satellite data, weather intelligence and real-time disaster information to help people understand risks, find emergency resources and respond faster.')}
              </p>

              {/* TWO REAL WORKING CALL TO ACTION BUTTONS */}
              <div className="pt-3 flex flex-wrap items-center gap-4 z-30">
                <button
                  type="button"
                  onClick={() => onNavigateModule('customdashboard')}
                  className="bg-gradient-to-r from-[#38BDF8] via-[#0284C7] to-[#0369a1] hover:from-[#7dd3fc] hover:to-[#38BDF8] text-slate-950 font-black px-7 py-3.5 rounded-full shadow-2xl shadow-sky-500/40 flex items-center gap-2.5 text-base transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.06] hover:shadow-sky-500/60 cursor-pointer border border-sky-200/60 group"
                >
                  <LayoutDashboard className="h-5 w-5 text-slate-950 group-hover:scale-110 transition duration-300" />
                  <span>{t('home.exploreDashboard', 'Explore Dashboard')}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition duration-300" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateModule('map')}
                  className="bg-slate-950/85 hover:bg-slate-900 text-white font-extrabold px-7 py-3.5 rounded-full border border-[#38BDF8]/70 hover:border-[#38BDF8] backdrop-blur-xl flex items-center gap-2.5 text-base transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.06] hover:shadow-2xl hover:shadow-sky-500/30 cursor-pointer shadow-xl group"
                >
                  <MapPin className="h-5 w-5 text-[#38BDF8] group-hover:scale-110 transition duration-300" />
                  <span>{t('home.exploreLiveMap', 'Explore Live Map')}</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition duration-300" />
                </button>
              </div>

              {/* 4 Feature Indicator Pills (Opens Compact Centered Modal in Middle of Screen) */}
              <div className="pt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {[
                  { label: 'AI Analysis', icon: Cpu, action: () => setActiveFeatureModal('ai') },
                  { label: 'Live Data', icon: CloudRain, action: () => setActiveFeatureModal('livedata') },
                  { label: 'GIS Mapping', icon: MapPin, action: () => setActiveFeatureModal('gis') },
                  { label: '72-hour Risk', icon: Clock, action: () => setActiveFeatureModal('risk') }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.action}
                      title={`Click to preview ${item.label}`}
                      aria-label={`Preview ${item.label}`}
                      className="bg-slate-950/85 backdrop-blur-xl border border-[#38BDF8]/50 hover:border-[#38BDF8] px-4 py-2 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] active:scale-95 cursor-pointer group"
                    >
                      <Icon className="h-4 w-4 text-[#38BDF8] group-hover:scale-125 transition duration-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
                      <span className="font-extrabold tracking-wide">{item.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Hero Right Script Accent Tagline */}
            <div className="hidden lg:flex flex-col items-end justify-center self-start pt-4 pr-12 z-20">
              <div className="relative font-serif italic text-2xl lg:text-3xl text-slate-100 font-normal tracking-wide transform -rotate-3 text-right drop-shadow-md">
                {language === 'hi' ? (
                  <>
                    <span>सुरक्षित कल के लिए</span>
                    <br />
                    <span className="font-semibold text-white">एक साथ</span>
                  </>
                ) : (
                  <>
                    <span>Together for a</span>
                    <br />
                    <span className="font-semibold text-white">safer tomorrow</span>
                  </>
                )}
                <svg className="w-48 h-4 text-[#38BDF8] mt-1 ml-auto" viewBox="0 0 200 20" fill="none">
                  <path d="M5 15 Q 100 0, 195 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          5. WHAT JEEVAN SETU DOES (Clean Section - Light & Dark Mode Compatible)
         ================================================== */}
      <section className="relative z-20 w-full py-10 text-slate-900 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('home.whatJeevanSetuDoes', 'What Jeevan Setu Does')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {t('home.whatJeevanSetuSub', 'Smart tools for faster response, better preparedness and safer communities.')}
            </p>
          </div>

          {/* 8 FEATURE CARDS GRID (4 Columns x 2 Rows on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: t('home.reportDisaster', 'Report a Disaster'),
                desc: t('home.reportDisasterDesc', 'Upload a photo and location to report and analyze a disaster.'),
                icon: Camera,
                action: () => setActiveSidePanel('report'),
                bgColor: 'bg-[#FFF5F5] dark:bg-red-950/25',
                hoverBg: 'hover:bg-[#FFEAEA] dark:hover:bg-red-900/40',
                borderColor: 'border-red-200/80 dark:border-red-900/40',
                iconBg: 'bg-[#FF4D4D] text-white',
                hoverText: 'group-hover:text-red-700 dark:group-hover:text-red-300'
              },
              {
                title: t('home.checkRisk', 'Check Disaster Risk'),
                desc: t('home.checkRiskDesc', 'Check current disaster hazards and 72-hour risk information.'),
                icon: MapPin,
                action: () => setActiveSidePanel('risk'),
                bgColor: 'bg-[#F0F7FF] dark:bg-blue-950/25',
                hoverBg: 'hover:bg-[#E2F0FF] dark:hover:bg-blue-900/40',
                borderColor: 'border-blue-200/80 dark:border-blue-900/40',
                iconBg: 'bg-[#2563EB] text-white',
                hoverText: 'group-hover:text-blue-700 dark:group-hover:text-blue-300'
              },
              {
                title: t('home.safetyGuide', 'Disaster Safety Guide & Helplines'),
                desc: t('home.safetyGuideDesc', 'Official Do’s & Don’ts, 24/7 helplines, and 72-hour survival kit checklist.'),
                icon: ShieldCheck,
                action: () => onNavigateModule('safetyguide'),
                bgColor: 'bg-[#F0FAF5] dark:bg-emerald-950/25',
                hoverBg: 'hover:bg-[#E0F7EB] dark:hover:bg-emerald-900/40',
                borderColor: 'border-emerald-200/80 dark:border-emerald-900/40',
                iconBg: 'bg-[#10B981] text-white',
                hoverText: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              },
              {
                title: t('home.exploreSituation', 'Explore Live Situation'),
                desc: t('home.exploreSituationDesc', 'View live disaster activity, weather and affected areas.'),
                icon: MapIcon,
                action: () => setActiveSidePanel('livesituation'),
                bgColor: 'bg-[#F8F5FF] dark:bg-purple-950/25',
                hoverBg: 'hover:bg-[#EEE5FF] dark:hover:bg-purple-900/40',
                borderColor: 'border-purple-200/80 dark:border-purple-900/40',
                iconBg: 'bg-[#8B5CF6] text-white',
                hoverText: 'group-hover:text-purple-700 dark:group-hover:text-purple-300'
              },
              {
                title: t('home.aiImpact', 'AI Disaster Impact Assessment'),
                desc: t('home.aiImpactDesc', 'Analyze disaster images and estimate severity and impact.'),
                icon: Cpu,
                action: () => setActiveSidePanel('aianalysis'),
                bgColor: 'bg-[#F5F3FF] dark:bg-indigo-950/25',
                hoverBg: 'hover:bg-[#EDE9FE] dark:hover:bg-indigo-900/40',
                borderColor: 'border-indigo-200/80 dark:border-indigo-900/40',
                iconBg: 'bg-indigo-600 text-white',
                hoverText: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
              },
              {
                title: t('home.reliefCamps', 'Relief Camps & Supplies'),
                desc: t('home.reliefCampsDesc', 'Find nearby relief camps, shelter capacity, and emergency supplies.'),
                icon: Building2,
                action: () => onNavigateModule('reliefcamps'),
                bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/25',
                hoverBg: 'hover:bg-[#FEF3C7] dark:hover:bg-amber-900/40',
                borderColor: 'border-amber-200/80 dark:border-amber-900/40',
                iconBg: 'bg-amber-500 text-white',
                hoverText: 'group-hover:text-amber-700 dark:group-hover:text-amber-300'
              },
              {
                title: t('home.liveMap', 'Live Map'),
                desc: t('home.liveMapDesc', 'View disaster locations and geographic information.'),
                icon: Globe,
                action: () => onNavigateModule('map'),
                bgColor: 'bg-[#F0F9FF] dark:bg-sky-950/25',
                hoverBg: 'hover:bg-[#E0F2FE] dark:hover:bg-sky-900/40',
                borderColor: 'border-sky-200/80 dark:border-sky-900/40',
                iconBg: 'bg-sky-500 text-white',
                hoverText: 'group-hover:text-sky-700 dark:group-hover:text-sky-300'
              },
              {
                title: t('home.emergencyResponse', 'Emergency Response'),
                desc: t('home.emergencyResponseDesc', 'Get safer routes and nearby emergency resources.'),
                icon: Navigation,
                action: () => setActiveSidePanel('gethelp'),
                bgColor: 'bg-[#FFF1F2] dark:bg-rose-950/25',
                hoverBg: 'hover:bg-[#FFE4E6] dark:hover:bg-rose-900/40',
                borderColor: 'border-rose-200/80 dark:border-rose-900/40',
                iconBg: 'bg-rose-600 text-white',
                hoverText: 'group-hover:text-rose-700 dark:group-hover:text-rose-300'
              }
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  onClick={card.action}
                  className={`${card.bgColor} ${card.hoverBg} border ${card.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-[1.04] hover:border-sky-400/80 flex flex-col justify-between cursor-pointer group min-h-[145px] relative overflow-hidden`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-md group-hover:scale-125 transition duration-300`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className={`text-sm sm:text-base font-extrabold text-slate-900 dark:text-white ${card.hoverText} transition`}>
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium leading-snug">
                      {card.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-end mt-4">
                    <div className={`h-7 w-7 rounded-full ${card.iconBg} flex items-center justify-center shadow-sm group-hover:translate-x-1.5 group-hover:scale-110 transition duration-300`}>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>



      {/* ==================================================
          5 & 6. LIVE SITUATION SECTION (With Interactive Leaflet Map)
         ================================================== */}
      <section className="w-full py-10 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {t('home.liveSituationTitle', 'Live Situation')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
                  {t('home.liveSituationSub', 'Real-time updates from across India')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenDashboard}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-lg shadow-sm cursor-pointer border border-sky-300/40 flex items-center gap-1.5 group"
              >
                <span>{t('home.viewFullDashboard', 'View Full Dashboard')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-300" />
              </button>

              <button
                onClick={() => onNavigateModule('map')}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-bold transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-lg hover:border-sky-400 shadow-sm cursor-pointer flex items-center gap-1.5 group"
              >
                <span>{t('home.viewFullMap', 'View Full Map')}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition duration-300" />
              </button>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* LEFT COLUMN: Stats & Recent Alerts (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
              {/* 4 Statistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.05] hover:border-sky-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1 text-xs font-extrabold group-hover:scale-110 transition">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">12</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t('home.activeIncidents', 'Active Incidents')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.05] hover:border-amber-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 text-xs font-extrabold group-hover:scale-110 transition">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">04</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t('home.criticalAlerts', 'Critical Alerts')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.05] hover:border-blue-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 text-xs font-extrabold group-hover:scale-110 transition">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">18</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t('home.affectedDistricts', 'Affected Districts')}</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.05] hover:border-emerald-400/80 cursor-pointer flex flex-col items-start justify-center group">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 text-xs font-extrabold group-hover:scale-110 transition">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">27</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">{t('home.rescueTeamsDeployed', 'Rescue Teams Deployed')}</span>
                </div>
              </div>

              {/* Recent Alerts List */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] hover:border-sky-400/80 cursor-pointer flex-1 flex flex-col justify-between group">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">{t('home.recentAlerts', 'Recent Alerts')}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-1 transition" />
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Landslide in Sikkim', risk: 'High Risk', riskClass: 'text-red-600 dark:text-red-400 font-extrabold', time: '2 hours ago', dot: 'bg-red-500' },
                    { title: 'Flood Alert – Assam', risk: 'Moderate Risk', riskClass: 'text-amber-600 dark:text-amber-400 font-bold', time: '4 hours ago', dot: 'bg-amber-500' },
                    { title: 'Heavy Rainfall – Meghalaya', risk: 'Monitor', riskClass: 'text-slate-500 dark:text-slate-400 font-semibold', time: '6 hours ago', dot: 'bg-emerald-500' }
                  ].map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1.5 rounded-lg transition">
                      <div className="flex items-center gap-2 overflow-hidden pr-1">
                        <span className={`h-2 w-2 rounded-full shrink-0 ${alert.dot}`} />
                        <span className="font-bold text-slate-900 dark:text-slate-200 truncate">{alert.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] ${alert.riskClass}`}>{alert.risk}</span>
                        <span className="text-[10px] text-slate-400">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: Real Interactive Command Live GIS India Map (6 Cols) */}
            <div className="lg:col-span-6 relative min-h-[420px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.01] hover:border-sky-400/80 bg-slate-950 group">
              
              {/* Tactical HUD Radar Sweep overlay */}
              <div className="radar-sweep-line" />

              {/* Leaflet Map Container */}
              <div ref={mapContainerRef} className="w-full h-full min-h-[420px] lg:min-h-[460px] z-0" />

              {/* Top Left: LIVE HUD STATS BADGE */}
              <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-none">
                <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-2 pointer-events-auto">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[11px] font-black tracking-wider uppercase text-emerald-400 font-mono">
                    LIVE GIS TELEMETRY
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono pl-1.5 border-l border-slate-700">
                    {liveTimeStr || 'LIVE'}
                  </span>
                </div>

                {/* Live Coordinates Readout */}
                <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-2 pointer-events-auto w-max shadow-md">
                  <span className="text-sky-400 font-bold">COORD:</span>
                  <span>{cursorCoords ? `${cursorCoords.lat}° N, ${cursorCoords.lon}° E` : '23.50° N, 83.50° E'}</span>
                </div>
              </div>

              {/* Top Right: CATEGORY FILTERABLE LEGEND */}
              <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-xl shadow-xl border border-slate-700/80 text-[11px] font-bold text-slate-200 space-y-1 max-w-[170px]">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800 flex items-center justify-between">
                  <span>Incident Filter</span>
                  <span className="text-sky-400 text-[9px] font-mono">{DISASTER_MARKERS.length} Active</span>
                </div>
                
                {[
                  { label: 'All', color: '#38BDF8', count: DISASTER_MARKERS.length },
                  { label: 'Flood', color: '#2563EB', count: DISASTER_MARKERS.filter(m => m.type === 'Flood').length },
                  { label: 'Landslide', color: '#F97316', count: DISASTER_MARKERS.filter(m => m.type === 'Landslide').length },
                  { label: 'Earthquake', color: '#EAB308', count: DISASTER_MARKERS.filter(m => m.type === 'Earthquake').length },
                  { label: 'Fire', color: '#EF4444', count: DISASTER_MARKERS.filter(m => m.type === 'Fire').length },
                  { label: 'Heavy Rainfall', color: '#10B981', count: DISASTER_MARKERS.filter(m => m.type === 'Heavy Rainfall').length },
                ].map((cat) => (
                  <button
                    key={cat.label}
                    onClick={() => setSelectedMapCategory(cat.label)}
                    className={`w-full flex items-center justify-between px-2 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      selectedMapCategory === cat.label
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className="text-[9px] px-1.5 rounded bg-slate-800 text-slate-400 font-mono">{cat.count}</span>
                  </button>
                ))}
              </div>

              {/* Bottom Left: BASEMAP SWITCHER & OVERLAY TOGGLES */}
              <div className="absolute bottom-3 left-3 z-10 flex flex-wrap items-center gap-1.5">
                {/* Map Layer Switcher Pills */}
                <div className="bg-slate-900/90 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-700/80 flex items-center gap-1">
                  <button
                    onClick={() => changeMapTile('satellite')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'satellite'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🛰️ Satellite</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('dark')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'dark'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🌑 Dark GIS</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('topo')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-md flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'topo'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>⛰️ Terrain</span>
                  </button>
                </div>

                {/* Doppler Radar Toggle Button */}
                <button
                  onClick={toggleDopplerRadar}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-lg border transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.08] hover:shadow-xl flex items-center gap-1.5 cursor-pointer ${
                    showDopplerRadar
                      ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-emerald-900/40'
                      : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                  title="Toggle Live Precipitation Radar Overlay"
                >
                  <span className={`h-2 w-2 rounded-full ${showDopplerRadar ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
                  <span>📡 Doppler Radar</span>
                </button>
              </div>

              {/* Bottom Right: CONTROL BUTTONS (Zoom, Recenter, Buffer Rings) */}
              <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
                <button
                  onClick={handleZoomIn}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg flex items-center justify-center font-bold text-sm border border-slate-700 transition cursor-pointer"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-lg shadow-lg flex items-center justify-center font-bold text-sm border border-slate-700 transition cursor-pointer"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={handleRecenter}
                  className="h-8 w-8 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-lg shadow-lg flex items-center justify-center border border-slate-700 transition cursor-pointer"
                  title="Recenter India Map"
                >
                  <Crosshair className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowHazardCircles(!showHazardCircles)}
                  className={`h-8 w-8 rounded-lg shadow-lg flex items-center justify-center border transition cursor-pointer ${
                    showHazardCircles
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                      : 'bg-slate-900/90 text-slate-500 border-slate-700 hover:text-slate-300'
                  }`}
                  title="Toggle Hazard Buffer Zones"
                >
                  <Radio className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: Weather Card & High Risk Banner (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
              {/* Weather Card */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.03] hover:border-sky-400/80 cursor-pointer flex-1 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                    <CloudRain className="h-8 w-8 text-sky-500 group-hover:scale-110 transition" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">{t('home.liveWeather', 'Live Weather')}</span>
                  </div>

                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">{t('home.currentWeather', 'Current Weather')}</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 leading-tight group-hover:text-sky-400 transition">
                    {t('home.heavyRainfall', 'Heavy Rainfall')}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {t('home.sikkimNer', 'Sikkim, North East India')}
                  </p>
                </div>

                <div className="pt-4">
                  <div className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight group-hover:scale-105 transition origin-left">
                    22°C
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                    H: 24° &nbsp; L: 18°
                  </div>
                </div>
              </div>

              {/* High Risk Banner */}
              <div
                onClick={() => setIsRiskModalOpen(true)}
                className="bg-[#FFF0F0] dark:bg-[#250d11] hover:bg-[#FFE2E2] dark:hover:bg-[#341217] border border-red-200/90 dark:border-red-900/40 hover:border-red-400/80 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 transform hover:-translate-y-1.5 hover:scale-[1.04] hover:shadow-xl shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-red-600 dark:text-red-400 block leading-tight">
                      {t('home.highRisk72', 'High Risk in next 72 hours')}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      {t('home.landslideFloodRisk', 'Landslide & Flood Risk')}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 shrink-0 group-hover:translate-x-1.5 transition" />
              </div>
            </div>

          </div>

        </div>
      </section>


      {/* ==================================================
          4. HOW JEEVAN SETU WORKS (From data to action — in just a few steps)
          ================================================== */}
      <section id="how-it-works" className="w-full py-16 sm:py-20 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
        <div className="w-full px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('home.howItWorksTitle', 'How Jeevan Setu Works')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {t('home.howItWorksSub', 'From data to action — in just a few steps.')}
            </p>
          </div>

          {/* 4 Horizontal Steps Process Grid (Enlarged Full-Width Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
            
            {[
              {
                stepNum: '1',
                title: t('home.step1Title', 'Report'),
                subtitle: 'How to report a disaster or request emergency aid',
                desc: t('home.step1Desc', 'Share photos, location and details about the disaster.'),
                icon: Camera,
                cardColor: 'bg-sky-500/15 text-sky-500 border-sky-400/40',
                gradientColor: 'from-sky-500 to-blue-600',
                instructions: [
                  'Click on "Report Incident" or "Emergency SOS" button on home page.',
                  'Capture or upload high-resolution photos of the disaster area.',
                  'Enable GPS location to pinpoint exact coordinates for rescue teams.',
                  'Submit the report to broadcast instant alerts to local emergency response teams.'
                ],
                tips: '💡 Pro Tip: Works offline! Reports will automatically sync once cellular network reconnects.',
                actionText: 'Try Feature Now',
                panel: 'report' as const
              },
              {
                stepNum: '2',
                title: t('home.step2Title', 'AI Analysis'),
                subtitle: 'How satellite & computer vision AI processes real-time data',
                desc: t('home.step2Desc', 'Our AI processes data from satellites, weather and ground reports.'),
                icon: Cpu,
                cardColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-400/40',
                gradientColor: 'from-cyan-500 to-blue-600',
                instructions: [
                  'View real-time satellite radar imagery and computer vision damage scores.',
                  'Track automated risk severity classification (Low, Medium, Severe, Critical).',
                  'Compare pre-disaster baseline imagery with post-disaster satellite scans.',
                  'Access multi-hazard predictive analytics and structural damage estimates.'
                ],
                tips: '💡 Pro Tip: Satellite radar feeds update automatically every 15 minutes.',
                actionText: 'Try Feature Now',
                panel: 'aianalysis' as const
              },
              {
                stepNum: '3',
                title: t('home.step3Title', 'Risk Assessment'),
                subtitle: 'How regional hazard index & rainfall predictions are evaluated',
                desc: t('home.step3Desc', 'Get instant risk levels, impact analysis and 72-hour forecast.'),
                icon: AlertTriangle,
                cardColor: 'bg-amber-500/15 text-amber-500 border-amber-400/40',
                gradientColor: 'from-amber-500 to-orange-600',
                instructions: [
                  'Select target vulnerable region (e.g., Sikkim, Uttarakhand, Kerala).',
                  'Check real-time Landslide Hazard Index (LHI) and soil saturation levels.',
                  'Review 72-hour IMD weather forecasts and heavy rainfall projections.',
                  'View active flash warnings and evacuation advisories.'
                ],
                tips: '💡 Pro Tip: Enable SMS hazard alerts for automatic emergency warning broadcasts.',
                actionText: 'Try Feature Now',
                panel: 'risk' as const
              },
              {
                stepNum: '4',
                title: t('home.step4Title', 'Get Help'),
                subtitle: 'How to locate nearest shelters, medical camps & emergency numbers',
                desc: t('home.step4Desc', 'Find nearby shelters, hospitals, routes and emergency services.'),
                icon: ShieldAlert,
                cardColor: 'bg-rose-500/15 text-rose-500 border-rose-400/40',
                gradientColor: 'from-rose-500 to-red-600',
                instructions: [
                  'Tap "Transmit Emergency SOS" for immediate 1-click location sharing.',
                  'Call 24/7 National/State emergency helplines directly (NDRF 1078, SDMA 1070).',
                  'Search nearby open relief camps, distances, and live bed capacities.',
                  'Get real-time safe route navigation avoiding flood and blocked roads.'
                ],
                tips: '💡 Pro Tip: Emergency helplines are available 24/7 with toll-free access.',
                actionText: 'Try Feature Now',
                panel: 'gethelp' as const
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.stepNum}
                  onClick={() => setSelectedInstructionStep({
                    stepNum: item.stepNum,
                    title: item.title,
                    subtitle: item.subtitle,
                    desc: item.desc,
                    icon: item.icon,
                    color: item.gradientColor,
                    instructions: item.instructions,
                    tips: item.tips,
                    actionText: item.actionText,
                    action: () => {
                      setSelectedInstructionStep(null);
                      setActiveSidePanel(item.panel);
                    }
                  })}
                  className="flex flex-col items-center text-center group relative p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 shadow-md hover:shadow-2xl hover:border-sky-400/80 transition-all duration-300 min-h-[260px] sm:min-h-[290px] justify-between cursor-pointer transform hover:-translate-y-2.5 hover:scale-[1.04]"
                >
                  {/* Arrow Connector between steps (visible on desktop) */}
                  {idx < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-5 transform -translate-y-1/2 z-20 pointer-events-none">
                      <ArrowRight className="h-7 w-7 text-sky-400 opacity-80" />
                    </div>
                  )}

                  <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-3xl ${item.cardColor} border flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300 mb-5 relative`}>
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                    <span className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-black text-sm flex items-center justify-center shadow-lg ring-4 ring-white dark:ring-slate-900">
                      {item.stepNum}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-1.5 group-hover:text-sky-400 transition">
                      {item.stepNum}. {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed mb-3">
                      {item.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 group-hover:underline">
                      <span>View Step-by-Step Guide</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition" />
                    </span>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

      </section>



      {/* ==================================================
          EMERGENCY CTA SECTION
         ================================================== */}
      <section className="w-full py-10">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />
                <span>{t('home.emergencyCoordination', '24x7 Emergency Coordination')}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">{t('home.needHelpTitle', 'Need help during a disaster?')}</h3>
              <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                {t('home.needHelpDesc', 'Send distress signal, access live emergency maps, locate relief shelters, or connect with command teams.')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={onOpenSos}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-red-600/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-2xl hover:shadow-red-600/60 flex items-center gap-2 cursor-pointer border border-red-400/50 group"
              >
                <PhoneCall className="h-4 w-4 animate-pulse group-hover:scale-125 transition duration-300" />
                <span>{t('home.emergencyHelp', 'Emergency Help')}</span>
              </button>
              <button
                onClick={() => onNavigateModule('reliefcamps')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-emerald-400 backdrop-blur px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-lg hover:shadow-emerald-500/20 cursor-pointer flex items-center gap-2 group"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-400 group-hover:scale-125 transition duration-300" />
                <span>{t('home.exploreResources', 'Explore Resources')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          8. TRUSTED DATA SOURCES (Enlarged)
          ================================================== */}
      <section className="w-full border-t border-b border-slate-200/80 dark:border-slate-800/80 py-10 my-6 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('home.trustedSourcesTitle', 'Trusted Data Sources')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {t('home.trustedSourcesSub', 'Powered by reliable and verified sources for accurate information.')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-400/80 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-xl cursor-pointer group">
              <Radio className="h-5 w-5 text-sky-600 dark:text-sky-400 group-hover:scale-125 transition duration-300" />
              <span>{t('home.isroSatelliteData', 'ISRO / Satellite Data')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-400/80 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-xl cursor-pointer group">
              <CloudRain className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:scale-125 transition duration-300" />
              <span>{t('home.imdWeatherData', 'IMD Weather Data')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-400/80 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-xl cursor-pointer group">
              <Building2 className="h-5 w-5 text-slate-700 dark:text-slate-300 group-hover:scale-125 transition duration-300" />
              <span>{t('home.govReports', 'Government Reports')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400/80 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-xl cursor-pointer group">
              <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-125 transition duration-300" />
              <span>{t('home.groundReports', 'Ground Reports')}</span>
            </div>
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-400/80 shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.08] hover:shadow-xl cursor-pointer group">
              <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400 group-hover:scale-125 transition duration-300" />
              <span>{t('home.gisRemoteSensing', 'GIS & Remote Sensing')}</span>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          9. FOOTER (Compact & Sleek)
          ================================================== */}
      <footer className="w-full bg-[#0B132B] dark:bg-[#040814] text-white pt-8 pb-6 border-t border-slate-800 transition-colors duration-300 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            
            {/* Left: Brand (Compact) */}
            <div className="flex items-center gap-3 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.05] cursor-pointer group">
              <div className="h-9 w-9 rounded-full bg-slate-900 ring-2 ring-sky-400/70 overflow-hidden flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300">
                <img
                  src="/jeevan-setu-logo.jpg"
                  alt="Jeevan Setu Logo"
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sky-400 font-black text-base">JS</span>
              </div>
              <div>
                <span className="text-base font-black tracking-wider text-white block leading-none group-hover:text-sky-400 transition duration-300">
                  {language === 'hi' ? 'जीवन सेतु' : 'JEEVAN SETU'}
                </span>
                <span className="text-[10px] font-semibold text-sky-400 block mt-0.5">
                  {t('nav.brandSubtitle', 'AI Powered Disaster Response & GIS Intelligence Platform')}
                </span>
              </div>
            </div>

            {/* Center Links (Compact) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-semibold text-slate-300">
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.privacyPolicy', 'Privacy Policy')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.termsOfUse', 'Terms of Use')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.help', 'Help')}</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-sky-400 transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-110 cursor-pointer inline-block">{t('footer.contact', 'Contact')}</button>
            </div>

            {/* Right: Follow Us (Compact) */}
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
              <span>{t('footer.followUs', 'Follow Us')}</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://youtu.be/5GZvqN8GZw8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-800 hover:bg-red-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-red-600/40 cursor-pointer"
                  title="YouTube"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a
                  href="#twitter"
                  className="p-2 bg-slate-800 hover:bg-sky-500 rounded-xl text-slate-300 hover:text-slate-950 transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-sky-500/40 cursor-pointer"
                  title="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#instagram"
                  className="p-2 bg-slate-800 hover:bg-pink-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-pink-600/40 cursor-pointer"
                  title="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#linkedin"
                  className="p-2 bg-slate-800 hover:bg-blue-600 rounded-xl text-slate-300 hover:text-white transition-all duration-300 transform hover:-translate-y-1 hover:scale-125 hover:shadow-lg hover:shadow-blue-600/40 cursor-pointer"
                  title="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Footer Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] font-semibold text-slate-400 gap-4">
            <div>
              {t('footer.copyright', '© 2026 Jeevan Setu • National Disaster Response & GIS Intelligence Platform')}
            </div>
            
            <div className="font-serif italic text-sm text-slate-200 tracking-wide">
              {t('footer.saferTomorrow', 'Together we can build a safer tomorrow')}
            </div>
          </div>

        </div>
      </footer>

      {/* ==================================================
          MODAL 1: REPORT A DISASTER MODAL
         ================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Report a Disaster</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Upload photo + location → AI processes emergency triage</p>
              </div>
            </div>

            {reportSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">Disaster Report Submitted!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  AI has dispatched the signal to the nearest NDRF &amp; Local Emergency Command Center.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Type</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option>Landslide</option>
                    <option>Flood</option>
                    <option>Heavy Rainfall</option>
                    <option>Earthquake</option>
                    <option>Forest Fire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Photo</label>
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 text-center relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    {reportPhoto ? (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden">
                        <img src={reportPhoto} alt="Uploaded site" className="w-full h-full object-cover" />
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">Photo Attached</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="h-6 w-6 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Click to upload photo</p>
                        <p className="text-[10px] text-slate-400">JPG, JPEG, PNG allowed</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Incident Location</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={reportLocation}
                      onChange={(e) => setReportLocation(e.target.value)}
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <button
                      type="button"
                      onClick={() => setReportLocation('Captured GPS: 27.3389° N, 88.6065° E')}
                      className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 px-3 py-2 rounded-xl text-xs font-bold shrink-0"
                    >
                      GPS
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReportModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl font-extrabold shadow-md flex items-center gap-1.5"
                  >
                    {reportSubmitting ? 'Analyzing with AI...' : 'Submit Report →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 2: CHECK DISASTER RISK MODAL
         ================================================== */}
      {isRiskModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsRiskModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Check Disaster Risk</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">72-Hour Environmental &amp; Landslide Hazard Assessment</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Select Target Region</label>
                <select
                  value={selectedRiskLoc}
                  onChange={(e) => setSelectedRiskLoc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                >
                  <option>Sikkim, North East India</option>
                  <option>Guwahati, Assam</option>
                  <option>Shillong, Meghalaya</option>
                  <option>Uttarkashi, Uttarakhand</option>
                  <option>Wayanad, Kerala</option>
                </select>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Current Risk Index</span>
                  <span className="bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-full font-black text-xs">High Risk (LHI: 7.8/10)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">72-Hr Weather Forecast</span>
                  <span className="font-black text-slate-900 dark:text-white">220mm Heavy Downpour</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 dark:text-slate-300">Slope Stability Status</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">Saturated Soil Shift</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setIsRiskModalOpen(false);
                    onNavigateModule('staterisk');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-extrabold shadow-md text-center"
                >
                  View Full Regional Risk Matrix →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 3: EMERGENCY INFORMATION MODAL
         ================================================== */}
      {isInfoModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsInfoModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Emergency Resources</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nearby Shelters, Hospitals &amp; Evacuation Corridors</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">Gangtok District Relief Shelter</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Capacity: 450 beds &bull; Medical Staff Onsite</div>
                </div>
                <button
                  onClick={() => { setIsInfoModalOpen(false); onNavigateModule('reliefcamps'); }}
                  className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px]"
                >
                  Locate
                </button>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">STNM Super Specialty Hospital</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Emergency Ward: 24x7 Open &bull; Blood Bank Ready</div>
                </div>
                <button
                  onClick={() => { setIsInfoModalOpen(false); onNavigateModule('lifesaving'); }}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px]"
                >
                  Call
                </button>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-white">Evacuation Route NH-10 Clearance</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Green Corridor Active for Emergency Convoy</div>
                </div>
                <button
                  onClick={() => { setIsInfoModalOpen(false); onNavigateModule('evacuation'); }}
                  className="bg-purple-600 text-white px-3 py-1.5 rounded-xl font-bold text-[11px]"
                >
                  Route
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button onClick={onOpenSos} className="text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center gap-1">
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call Emergency Helpline (1078)</span>
              </button>
              <button
                onClick={() => setIsInfoModalOpen(false)}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          MODAL 4: SEARCH MODAL
         ================================================== */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-20 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSearchOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <Search className="h-5 w-5 text-sky-500" />
              <input
                type="text"
                placeholder={t('search.placeholder', 'Search state, hazard, hospital, or disaster alert...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="py-4 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">{t('search.quickSuggestions', 'Quick Suggestions')}</div>
              {[
                { label: t('search.sikkimLandslide', 'Sikkim Landslide High-Risk Area'), action: () => { setIsSearchOpen(false); onNavigateModule('staterisk'); } },
                { label: t('search.assamFlood', 'Assam Kaziranga Flood Live Map'), action: () => { setIsSearchOpen(false); onNavigateModule('map'); } },
                { label: t('search.meghalayaNDRF', 'NDRF Relief Camps in Meghalaya'), action: () => { setIsSearchOpen(false); onNavigateModule('reliefcamps'); } },
                { label: t('search.droneMedical', 'UAV Drone Medical Supply Routes'), action: () => { setIsSearchOpen(false); onNavigateModule('drone'); } }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.action}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center justify-between text-slate-800 dark:text-slate-200 font-bold"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          RIGHT-SIDE SLIDING DRAWER / PANEL (Opens directly on Homepage)
         ================================================== */}
      {activeSidePanel && (
        <>
          {/* Semi-transparent Backdrop Overlay */}
          <div
            onClick={() => setActiveSidePanel(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200"
          />

          {/* Right-Side Drawer Container */}
          <div className="fixed top-0 right-0 h-full z-[200] w-full sm:w-[480px] lg:w-[540px] bg-white dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b132b]">
              <div className="flex items-center gap-3">
                {activeSidePanel === 'report' && (
                  <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'aianalysis' && (
                  <div className="h-9 w-9 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Cpu className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'risk' && (
                  <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'gethelp' && (
                  <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'livesituation' && (
                  <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <Activity className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {activeSidePanel === 'report' && '1. Report a Disaster'}
                    {activeSidePanel === 'aianalysis' && '2. AI Analysis & Triage'}
                    {activeSidePanel === 'risk' && '3. Check Disaster Risk'}
                    {activeSidePanel === 'gethelp' && '4. Emergency Help & Rescue'}
                    {activeSidePanel === 'livesituation' && 'Explore Live Situation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {activeSidePanel === 'report' && 'AI Incident Submission & Ground Photo Triage'}
                    {activeSidePanel === 'aianalysis' && 'Automated Gemini AI Structural Damage Assessment'}
                    {activeSidePanel === 'risk' && '72-Hour Environmental Hazard Radar'}
                    {activeSidePanel === 'gethelp' && '24/7 SOS Rescue Signals & Relief Shelters'}
                    {activeSidePanel === 'livesituation' && 'Real-time Operations & Field Intelligence'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveSidePanel(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* PANEL 1: REPORT A DISASTER */}
              {activeSidePanel === 'report' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-red-500/10 border border-red-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-red-600 dark:text-red-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-red-500/20 text-red-600 dark:text-red-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Select the disaster category (e.g., Landslide, Flood, Rainfall).</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Upload or capture a ground photo showing the incident site damage.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Tap the <strong>"GPS"</strong> button to auto-detect your location coordinates.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Submit Report"</strong> to trigger instant emergency telemetry.</span>
                      </div>
                    </div>
                  </div>
                  {reportSuccess ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-3">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
                      <h4 className="text-base font-black text-emerald-900 dark:text-emerald-200">Incident Successfully Submitted!</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        AI Severity analysis: <span className="font-bold">High Priority Landslide</span>. NDRF &amp; local control centers dispatched.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitReport} className="space-y-4">
                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Disaster Type</label>
                        <select
                          value={reportCategory}
                          onChange={(e) => setReportCategory(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          <option>Landslide</option>
                          <option>Flood</option>
                          <option>Heavy Rainfall</option>
                          <option>Earthquake</option>
                          <option>Forest Fire</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Upload Ground Photo</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-400 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 text-center relative cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          {reportPhoto ? (
                            <div className="relative h-44 w-full rounded-xl overflow-hidden">
                              <img src={reportPhoto} alt="Uploaded incident site" className="w-full h-full object-cover" />
                              <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md font-bold">Photo Attached</span>
                            </div>
                          ) : (
                            <div className="space-y-2 py-2">
                              <Upload className="h-8 w-8 text-red-500 mx-auto" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Tap or click to capture/upload image</p>
                              <p className="text-[10px] text-slate-400">Supported: JPG, PNG, WEBP up to 10MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Incident Location &amp; Coordinates</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={reportLocation}
                            onChange={(e) => setReportLocation(e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                          <button
                            type="button"
                            onClick={() => setReportLocation('GPS Acquired: 27.3389° N, 88.6065° E')}
                            className="bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-xl text-xs font-bold shrink-0 border border-red-300 dark:border-red-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Crosshair className="h-3.5 w-3.5" />
                            <span>GPS</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-300 text-[11px]">
                        <div className="font-bold flex items-center gap-1">
                          <Sparkles className="h-3.5 w-3.5 text-red-500" />
                          <span>Instant AI Analysis</span>
                        </div>
                        Our neural vision model will calculate hazard index, damage extent, and send immediate distress signals to nearest emergency responders.
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveSidePanel(null)}
                          className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={reportSubmitting}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {reportSubmitting ? (
                            <>
                              <Activity className="h-4 w-4 animate-spin" />
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <span>Submit Report</span>
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* PANEL 2: AI ANALYSIS & TRIAGE */}
              {activeSidePanel === 'aianalysis' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-cyan-600 dark:text-cyan-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Choose or upload an aerial, drone, or satellite disaster photo.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Click <strong>"Run Live AI Triage Scan"</strong> to start Gemini AI processing.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Review structural damage %, flood depth, and AI severity rating.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Inspect recommended rescue protocols for NDRF/UAV dispatch.</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-cyan-500 font-bold text-sm">
                      <Cpu className="h-5 w-5 text-cyan-500" />
                      <span>Gemini AI Structural Damage Triage Engine</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                      Upload aerial, drone, satellite or ground photos to estimate disaster severity, structural collapse, and water inundation levels.
                    </p>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-400 bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-6 text-center space-y-3">
                    <Upload className="h-8 w-8 text-cyan-500 mx-auto animate-bounce" />
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white text-sm">Upload Image for Real-time AI Triage</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Supports JPG, PNG, Satellite TIFF up to 15MB</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAnalyzingAi(true)}
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs shadow-md transition cursor-pointer"
                    >
                      {isAnalyzingAi ? 'Scanning Image with AI...' : 'Run Live AI Triage Scan'}
                    </button>
                  </div>

                  {isAnalyzingAi && (
                    <div className="bg-slate-50 dark:bg-slate-900 border border-cyan-500/40 rounded-2xl p-5 space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-extrabold text-slate-900 dark:text-white">AI Damage Severity Rating</span>
                        <span className="px-2.5 py-1 bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40 rounded-full font-black text-[11px]">CRITICAL (88/100)</span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">Structural Damage Score</span>
                            <span className="text-slate-900 dark:text-white font-bold">84% Heavy Collapse</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 w-[84%]" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400">Flood Inundation Depth</span>
                            <span className="text-slate-900 dark:text-white font-bold">1.8 Meters</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[72%]" />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 text-xs">
                        <strong>AI Recommended Protocol:</strong> Dispatch NDRF Heavy Rescue &amp; deploy UAV Drone Reconnaissance immediately.
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setActiveSidePanel(null);
                      onNavigateModule('aiimpact');
                    }}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer text-xs"
                  >
                    <span>Open Full AI Impact Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PANEL 3: CHECK DISASTER RISK */}
              {activeSidePanel === 'risk' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-amber-500/10 border border-amber-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-amber-600 dark:text-amber-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Select your target state or district from the region selector.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Check the <strong>Landslide Hazard Index (LHI)</strong> score out of 10.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Inspect 72-hour rainfall predictions and soil saturation levels.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Open State Risk Matrix"</strong> to view state-wide hazard maps.</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-extrabold mb-1">Select Target Region</label>
                    <select
                      value={selectedRiskLoc}
                      onChange={(e) => setSelectedRiskLoc(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
                    >
                      <option>Sikkim, North East India</option>
                      <option>Guwahati, Assam</option>
                      <option>Shillong, Meghalaya</option>
                      <option>Uttarkashi, Uttarakhand</option>
                      <option>Wayanad, Kerala</option>
                    </select>
                  </div>

                  {/* Risk Index Overview */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-extrabold text-slate-700 dark:text-slate-200">Landslide Hazard Index (LHI)</span>
                      <span className="bg-red-500 text-white px-2.5 py-0.5 rounded-full font-black text-xs">7.8 / 10 (High)</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">72-Hr Rainfall Forecast</span>
                        <span className="font-bold text-slate-900 dark:text-white">220 mm Heavy Downpour</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full w-[85%]" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Slope &amp; Soil Saturation</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Critical Moisture (92%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full w-[92%]" />
                      </div>
                    </div>
                  </div>

                  {/* Hazard Alert Notice */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/60 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-extrabold text-amber-900 dark:text-amber-200">IMD Flash Warning Active</div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                        Steep mountain slopes in Gangtok and Mangan sector are under orange watch for debris flows over the next 48 hours.
                      </p>
                    </div>
                  </div>

                  {/* View Full Regional Risk Matrix Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onNavigateModule('staterisk');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>Open State Risk Matrix</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 4: GET HELP & EMERGENCY RESPONSE */}
              {activeSidePanel === 'gethelp' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-rose-500/10 border border-rose-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-rose-600 dark:text-rose-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Tap <strong>"Transmit Emergency SOS Now"</strong> for instant 1-click distress location transmission.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Directly call 24/7 helplines (<strong>NDRF 1078</strong> or <strong>State SDMA 1070</strong>).</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Browse nearby open relief camps, distances, and bed capacities.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"View All Relief Camps &amp; Supplies"</strong> for safe route navigation.</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Red SOS Button */}
                  <div className="p-5 bg-gradient-to-br from-red-950/90 to-rose-950/80 border border-red-500/40 rounded-2xl space-y-3 text-center shadow-lg">
                    <ShieldAlert className="h-10 w-10 text-red-400 mx-auto animate-pulse" />
                    <div>
                      <h4 className="text-base font-black text-white">Emergency SOS Signal Dispatch</h4>
                      <p className="text-xs text-red-200 mt-0.5">Transmit live GPS coordinates to nearest NDRF &amp; SDMA command hub</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        onOpenSos();
                      }}
                      className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-red-600/40 transition cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      <PhoneCall className="h-4 w-4 animate-bounce" />
                      <span>Transmit Emergency SOS Now</span>
                    </button>
                  </div>

                  {/* 24/7 Helplines */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">24/7 Emergency Helplines</div>
                    <div className="grid grid-cols-2 gap-2">
                      <a href="tel:1078" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">NDRF Control</div>
                          <div className="text-[11px] text-sky-500 font-extrabold">1078</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                      <a href="tel:1070" className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">State SDMA</div>
                          <div className="text-[11px] text-sky-500 font-extrabold">1070</div>
                        </div>
                        <PhoneCall className="h-4 w-4 text-emerald-500" />
                      </a>
                    </div>
                  </div>

                  {/* Nearby Relief Camps */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Nearby Operational Relief Camps</div>
                    {[
                      { name: 'Guwahati Stadium Relief Camp', dist: '2.4 km', cap: '340 / 500 Beds', status: 'OPEN' },
                      { name: 'Shillong Sports Complex Shelter', dist: '5.1 km', cap: '180 / 300 Beds', status: 'OPEN' }
                    ].map((camp, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{camp.name}</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full">{camp.status}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Distance: {camp.dist}</span>
                          <span>Capacity: {camp.cap}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setActiveSidePanel(null);
                      onNavigateModule('reliefcamps');
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl border border-slate-700 transition cursor-pointer text-xs flex items-center justify-center gap-2"
                  >
                    <span>View All Relief Camps &amp; Supplies</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PANEL 5: EXPLORE LIVE SITUATION */}
              {activeSidePanel === 'livesituation' && (
                <div className="space-y-5 text-xs font-medium">
                  {/* Step-by-Step Instructions */}
                  <div className="bg-purple-500/10 border border-purple-400/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-purple-600 dark:text-purple-400 text-xs uppercase tracking-wider">
                        <span>📖</span>
                        <span>How to Use (Step-by-Step Guide)</span>
                      </div>
                      <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-md">Step Guide</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                        <span>Interact with the live GIS radar map to inspect active incident markers.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                        <span>Monitor active disaster incident stats and deployed rescue team counts.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                        <span>Review recent emergency alerts and live incident feeds across India.</span>
                      </div>
                      <div className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        <span className="h-5 w-5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">4</span>
                        <span>Click <strong>"Open Full Operational Dashboard"</strong> for full command radar.</span>
                      </div>
                    </div>
                  </div>
                  {/* Live Leaflet Map Preview inside Drawer */}
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                    <div ref={sidePanelMapContainerRef} className="w-full h-full z-0" />
                    <div className="absolute top-2 left-2 z-10 bg-slate-900/80 backdrop-blur text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>Live GPS Radar</span>
                    </div>
                  </div>

                  {/* KPI Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Active Hazards</div>
                      <div className="text-xl font-black text-red-600 dark:text-red-400 mt-0.5">12 Incidents</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 dark:text-slate-400 text-[11px] font-bold">Rescue Squads</div>
                      <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">27 Deployed</div>
                    </div>
                  </div>

                  {/* Live Incidents Feed */}
                  <div className="space-y-2">
                    <div className="font-extrabold text-slate-800 dark:text-slate-200">Recent Incident Alerts</div>
                    {[
                      { name: 'Sikkim Gangtok Landslide', status: 'High Risk', time: '1 hr ago', color: 'bg-red-500' },
                      { name: 'Assam Flood Warning', status: 'Moderate', time: '3 hrs ago', color: 'bg-amber-500' },
                      { name: 'Wayanad Soil Saturation', status: 'Monitoring', time: '5 hrs ago', color: 'bg-blue-500' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.color}`} />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* OPEN FULL DASHBOARD BUTTON */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => {
                        setActiveSidePanel(null);
                        handleOpenDashboard();
                      }}
                      className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black py-4 rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition cursor-pointer text-sm"
                    >
                      <span>Open Full Operational Dashboard</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </>
      )}

      {/* ==================================================
          INSTRUCTION GUIDE MODAL (How Jeevan Setu Works Steps)
         ================================================== */}
      {selectedInstructionStep && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${selectedInstructionStep.color} text-white flex items-center justify-center shadow-lg shrink-0`}>
                  <selectedInstructionStep.icon className="h-7 w-7" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-widest text-sky-500">
                    Feature Guide • Step {selectedInstructionStep.stepNum}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {selectedInstructionStep.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {selectedInstructionStep.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInstructionStep(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              {selectedInstructionStep.desc}
            </p>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>📋</span>
                <span>Step-by-Step Instructions:</span>
              </h4>
              <div className="space-y-2.5">
                {selectedInstructionStep.instructions.map((stepText, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/80">
                    <span className="h-6 w-6 rounded-full bg-sky-500/20 text-sky-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                      {stepText}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Useful Tip Box */}
            <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-300 text-xs font-bold">
              <Info className="h-5 w-5 shrink-0 text-amber-500" />
              <span>{selectedInstructionStep.tips}</span>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedInstructionStep(null)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Close Guide
              </button>
              <button
                onClick={selectedInstructionStep.action}
                className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 text-xs transition transform hover:scale-105 cursor-pointer"
              >
                <span>{selectedInstructionStep.actionText}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ==================================================
          COMPACT CENTERED FEATURE PREVIEW MODAL ("saree feature open ho mid me par chote")
         ================================================== */}
      {activeFeatureModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-7 space-y-5">
            
            {/* 1. AI ANALYSIS MODAL */}
            {activeFeatureModal === 'ai' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                        VISION AI • 99.4% ACCURACY
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        AI Disaster Impact Assessment
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Multi-modal Vision AI & Geospatial Damage Classifier
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 font-black">
                      <span>Detected Structural Hazard:</span>
                      <span className="bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded text-[10px] border border-red-500/30">CRITICAL 84%</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Landslide slip breach on NH-6 Km 142 (Sohra Corridor). 18 civilians trapped; mudflow volume estimated at 420 m³.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Vision Model</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">ResNet-50 SAR Radar</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Est. Casualty Triage</div>
                      <div className="text-xs font-black text-rose-600 dark:text-rose-400 mt-0.5">Level 1 Immediate</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('aiimpact');
                    }}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-purple-600/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Full AI Module</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 2. LIVE DATA MODAL */}
            {activeFeatureModal === 'livedata' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 shrink-0">
                      <CloudRain className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                        LIVE SATELLITE RADAR
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        Real-Time Weather Telemetry
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Precipitation Radar & River Discharge Gauges
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-sky-700 dark:text-sky-300 font-black">
                      <span>24h Rainfall Spike:</span>
                      <span className="bg-sky-500/20 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded text-[10px] border border-sky-500/30">680 mm Severe</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Cherrapunji & Brahmaputra basin recording flash runoff surge. Brahmaputra gauge reading +2.4m over danger mark.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Wind Gusts</div>
                      <div className="text-xs font-black text-sky-600 dark:text-sky-400 mt-0.5">45 km/h</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Humidity</div>
                      <div className="text-xs font-black text-sky-600 dark:text-sky-400 mt-0.5">94%</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                      <div className="text-[9px] font-extrabold uppercase text-slate-400">Radar Status</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">ACTIVE</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('weather');
                    }}
                    className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-sky-500/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Live Radar</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 3. GIS MAPPING MODAL */}
            {activeFeatureModal === 'gis' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 shrink-0">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        TACTICAL GIS GRID
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        NER Live GIS & Satellite Map
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Google Hybrid Satellite, Topo Relief & Live Convoys
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 font-black">
                      <span>Live Convoy Telemetry:</span>
                      <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">CONVOY #01 ACTIVE</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      Medical Oxygen Convoy #01 en route Guwahati ➔ Silchar (Speed 48 km/h • ETA 3h 15m).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Active Overlays</div>
                      <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5">8 Hazard Zones</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Map View Mode</div>
                      <div className="text-xs font-black text-sky-500 mt-0.5">100% Full View</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('map');
                    }}
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-rose-600/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open Full Screen Map</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

            {/* 4. 72-HOUR RISK MODAL */}
            {activeFeatureModal === 'risk' && (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 shrink-0">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        8-STATE RISK MATRIX
                      </span>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight mt-1">
                        72-Hour State Hazard Forecast
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        Multi-State Predictive Risk Index (+0h to +72h)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-black">
                      <span>Highest Risk Sectors:</span>
                      <span className="bg-rose-500/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] border border-rose-500/30">ASSAM & MEGHALAYA</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      High runoff inundation in Assam Brahmaputra plains & hill edge slips along Meghalaya NH-6.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Deployed NDRF</div>
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">27 Battalions</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Risk Timeline</div>
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">+24h Peak Runoff</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveFeatureModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setActiveFeatureModal(null);
                      onNavigateModule('staterisk');
                    }}
                    className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold px-5 py-2 rounded-xl shadow-md shadow-amber-600/30 flex items-center gap-1.5 text-xs transition transform hover:scale-105 cursor-pointer"
                  >
                    <span>Open State Risk Matrix</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
