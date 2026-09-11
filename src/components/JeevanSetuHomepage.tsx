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
  const { t } = useTranslation();

  const handleOpenDashboard = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
    } else {
      onNavigateModule('customdashboard');
    }
  };

  // Side Panel Drawer state (report, risk, livesituation)
  const [activeSidePanel, setActiveSidePanel] = useState<'report' | 'risk' | 'livesituation' | null>(null);

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

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18
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

  // Language state
  const [currentLang, setCurrentLang] = useState('English');
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

  // Map Basemap URLs
  const getTileUrl = (type: 'satellite' | 'dark' | 'topo') => {
    switch (type) {
      case 'dark':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
      case 'topo':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      case 'satellite':
      default:
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
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
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* LEFT: Logo & Brand */}
          <div
            onClick={() => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-sky-400/60 group-hover:scale-105 transition shadow-md shadow-sky-500/20 bg-slate-900 flex items-center justify-center">
              <img
                src="/jeevan-setu-logo.jpg"
                alt="Jeevan Setu Logo"
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-sky-400 font-black text-lg">JS</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-lg font-black tracking-wider text-white leading-none font-sans group-hover:text-sky-300 transition">
                  Jeevan <span className="text-sky-400">Setu</span>
                </span>
              </div>
              <span className="text-[10px] font-semibold text-sky-400/90 tracking-wide leading-tight mt-0.5 hidden sm:block">
                AI Powered Disaster Response &amp; GIS Intelligence Platform
              </span>
            </div>
          </div>

          {/* CENTER: Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1 lg:gap-2">
            {[
              { name: 'Home', action: () => { setActiveTab('Home'); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { name: 'Live Map', action: () => { setActiveTab('Live Map'); onNavigateModule('map'); } },
              { name: 'Risk Assessment', action: () => { setActiveTab('Risk Assessment'); onNavigateModule('staterisk'); } },
              { name: 'Resources', action: () => { setActiveTab('Resources'); onNavigateModule('reliefcamps'); } },
              { name: 'About', action: () => { setActiveTab('About'); const el = document.getElementById('how-it-works'); el?.scrollIntoView({ behavior: 'smooth' }); } },
              { name: 'Contact', action: () => { setActiveTab('Contact'); setIsInfoModalOpen(true); } }
            ].map((nav) => {
              const isActive = activeTab === nav.name;
              return (
                <button
                  key={nav.name}
                  onClick={nav.action}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all relative cursor-pointer ${
                    isActive
                      ? 'text-sky-300 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {nav.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-sky-400 rounded-full shadow-sm shadow-sky-400" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Action Tools & Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Icon */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Search"
            >
              <Search className="h-4 sm:h-5 w-4 sm:w-5" />
            </button>

            {/* Red Emergency Help SOS Button */}
            <button
              onClick={onOpenSos}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-extrabold shadow-lg shadow-red-600/30 hover:shadow-red-600/50 hover:scale-105 transition flex items-center gap-1.5 cursor-pointer border border-red-400/40"
            >
              <PhoneCall className="h-3.5 sm:h-4 w-3.5 sm:w-4 animate-pulse" />
              <span>Emergency SOS</span>
            </button>

            {/* Admin Officer Pill Badge */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin Officer (OSDMA)</span>
            </div>

            {/* Language Selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer border border-slate-700/60"
              >
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                <span>{currentLang}</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-[#0B132B] dark:bg-[#070d1e] border border-slate-700 rounded-xl shadow-xl py-1 z-50 text-xs font-semibold text-slate-200">
                  {['English', 'हिन्दी (Hindi)', 'অসমীয়া (Assamese)', 'বাংলা (Bengali)', 'নেपाली (Nepali)'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setCurrentLang(lang.split(' ')[0]);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-sky-600/30 hover:text-white transition flex items-center justify-between"
                    >
                      <span>{lang}</span>
                      {currentLang === lang.split(' ')[0] && <CheckCircle2 className="h-3 w-3 text-sky-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NER Pill Badge */}
            <button
              onClick={() => onNavigateModule('gov')}
              className="px-2.5 py-1 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-400/30 hover:bg-sky-500/30 transition cursor-pointer hidden lg:flex items-center gap-1"
            >
              <span>🏛️</span>
              <span>NER</span>
            </button>

            {/* Theme Toggle Switch */}
            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-[#070d1e] border-t border-slate-800 px-4 py-4 space-y-2 text-sm font-semibold text-slate-200 shadow-2xl">
            {[
              { name: 'Home', action: () => { setActiveTab('Home'); setIsMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { name: 'Live Map', action: () => { setActiveTab('Live Map'); setIsMobileMenuOpen(false); onNavigateModule('map'); } },
              { name: 'Risk Assessment', action: () => { setActiveTab('Risk Assessment'); setIsMobileMenuOpen(false); onNavigateModule('staterisk'); } },
              { name: 'Resources', action: () => { setActiveTab('Resources'); setIsMobileMenuOpen(false); onNavigateModule('reliefcamps'); } },
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
      <section className="relative w-full min-h-[500px] lg:min-h-[550px] bg-[#070E20] text-white overflow-hidden flex items-center border-b border-slate-800">
        {/* 100% Clean Photographic Background (Zero Baked Text / Zero Misalignment) */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=2600&q=80"
            alt="Emergency Command Center Cybernetic Telemetry Grid"
            className="w-full h-full object-cover object-center filter brightness-90 contrast-105"
          />
          {/* Smooth Dark Navy Gradient Overlay for Perfect Contrast & Crisp Text */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070E20]/95 via-[#070E20]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070E20]/80 via-transparent to-transparent" />
        </div>



        <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16 flex flex-col justify-between">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            
            {/* Hero Left Content with REAL working interactive React elements */}
            <div className="max-w-2xl space-y-4">
              
              {/* Upper Small Label */}
              <div className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#38BDF8] font-sans">
                DISASTER RESPONSE &amp; GIS INTELLIGENCE
              </div>

              {/* Title with "Jeevan" in White and "Setu" in Cyan */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white font-sans leading-none drop-shadow-lg">
                Jeevan <span className="text-[#38BDF8]">Setu</span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-slate-100 tracking-tight leading-snug drop-shadow-sm">
                AI Powered Disaster Response &amp; GIS Intelligence Platform
              </p>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium max-w-xl drop-shadow-sm">
                Jeevan Setu combines AI, GIS, satellite data, weather intelligence and real-time disaster information to help people understand risks, find emergency resources and respond faster.
              </p>

              {/* TWO REAL WORKING CALL TO ACTION BUTTONS */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5 z-30">
                <button
                  type="button"
                  onClick={() => onNavigateModule('customdashboard')}
                  className="bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 font-black px-6 py-3 rounded-full shadow-lg shadow-sky-500/30 flex items-center gap-2 text-sm transition transform hover:scale-105 cursor-pointer border border-sky-300/50"
                >
                  <LayoutDashboard className="h-4 w-4 text-slate-950" />
                  <span>Explore Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateModule('map')}
                  className="bg-[#0B152A]/80 hover:bg-[#0B152A] text-white font-extrabold px-6 py-3 rounded-full border border-[#38BDF8]/60 backdrop-blur flex items-center gap-2 text-sm transition hover:border-[#38BDF8] cursor-pointer shadow-md"
                >
                  <MapPin className="h-4 w-4 text-[#38BDF8]" />
                  <span>Explore Live Map</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* 4 Feature Indicator Pills */}
              <div className="pt-3 flex flex-wrap items-center gap-2 sm:gap-3">
                {[
                  { label: 'AI Analysis', icon: Cpu },
                  { label: 'Live Data', icon: CloudRain },
                  { label: 'GIS Mapping', icon: MapPin },
                  { label: '72-hour Risk', icon: Clock }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="bg-[#0B152A]/80 backdrop-blur-md border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-200 flex items-center gap-2 shadow-sm"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Hero Right Script Accent Tagline */}
            <div className="hidden lg:flex flex-col items-end justify-center self-start pt-4 pr-12 z-20">
              <div className="relative font-serif italic text-2xl lg:text-3xl text-slate-100 font-normal tracking-wide transform -rotate-3 text-right drop-shadow-md">
                <span>Together for a</span>
                <br />
                <span className="font-semibold text-white">safer tomorrow</span>
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
      <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 py-10 bg-[#F8FAFC] dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 transition-colors duration-300">
        <div className="w-full">
          
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              What Jeevan Setu Does
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Smart tools for faster response, better preparedness and safer communities.
            </p>
          </div>

          {/* 8 FEATURE CARDS GRID (4 Columns x 2 Rows on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                title: 'Report a Disaster',
                desc: 'Upload a photo and location to report and analyze a disaster.',
                icon: Camera,
                action: () => setActiveSidePanel('report'),
                bgColor: 'bg-[#FFF5F5] dark:bg-red-950/25',
                hoverBg: 'hover:bg-[#FFEAEA] dark:hover:bg-red-900/40',
                borderColor: 'border-red-200/80 dark:border-red-900/40',
                iconBg: 'bg-[#FF4D4D] text-white',
                hoverText: 'group-hover:text-red-700 dark:group-hover:text-red-300'
              },
              {
                title: 'Check Disaster Risk',
                desc: 'Check current disaster hazards and 72-hour risk information.',
                icon: MapPin,
                action: () => setActiveSidePanel('risk'),
                bgColor: 'bg-[#F0F7FF] dark:bg-blue-950/25',
                hoverBg: 'hover:bg-[#E2F0FF] dark:hover:bg-blue-900/40',
                borderColor: 'border-blue-200/80 dark:border-blue-900/40',
                iconBg: 'bg-[#2563EB] text-white',
                hoverText: 'group-hover:text-blue-700 dark:group-hover:text-blue-300'
              },
              {
                title: 'Disaster Safety Guide & Helplines',
                desc: 'Official Do’s & Don’ts, 24/7 helplines, and 72-hour survival kit checklist.',
                icon: ShieldCheck,
                action: () => onNavigateModule('safetyguide'),
                bgColor: 'bg-[#F0FAF5] dark:bg-emerald-950/25',
                hoverBg: 'hover:bg-[#E0F7EB] dark:hover:bg-emerald-900/40',
                borderColor: 'border-emerald-200/80 dark:border-emerald-900/40',
                iconBg: 'bg-[#10B981] text-white',
                hoverText: 'group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
              },
              {
                title: 'Explore Live Situation',
                desc: 'View live disaster activity, weather and affected areas.',
                icon: MapIcon,
                action: () => setActiveSidePanel('livesituation'),
                bgColor: 'bg-[#F8F5FF] dark:bg-purple-950/25',
                hoverBg: 'hover:bg-[#EEE5FF] dark:hover:bg-purple-900/40',
                borderColor: 'border-purple-200/80 dark:border-purple-900/40',
                iconBg: 'bg-[#8B5CF6] text-white',
                hoverText: 'group-hover:text-purple-700 dark:group-hover:text-purple-300'
              },
              {
                title: 'AI Disaster Impact Assessment',
                desc: 'Analyze disaster images and estimate severity and impact.',
                icon: Cpu,
                action: () => onNavigateModule('aiimpact'),
                bgColor: 'bg-[#F5F3FF] dark:bg-indigo-950/25',
                hoverBg: 'hover:bg-[#EDE9FE] dark:hover:bg-indigo-900/40',
                borderColor: 'border-indigo-200/80 dark:border-indigo-900/40',
                iconBg: 'bg-indigo-600 text-white',
                hoverText: 'group-hover:text-indigo-700 dark:group-hover:text-indigo-300'
              },
              {
                title: 'Risk Assessment',
                desc: 'Analyze flood, landslide, rainfall and other disaster risks.',
                icon: AlertTriangle,
                action: () => onNavigateModule('staterisk'),
                bgColor: 'bg-[#FFFBEB] dark:bg-amber-950/25',
                hoverBg: 'hover:bg-[#FEF3C7] dark:hover:bg-amber-900/40',
                borderColor: 'border-amber-200/80 dark:border-amber-900/40',
                iconBg: 'bg-amber-500 text-white',
                hoverText: 'group-hover:text-amber-700 dark:group-hover:text-amber-300'
              },
              {
                title: 'Live Map',
                desc: 'View disaster locations and geographic information.',
                icon: Globe,
                action: () => onNavigateModule('map'),
                bgColor: 'bg-[#F0F9FF] dark:bg-sky-950/25',
                hoverBg: 'hover:bg-[#E0F2FE] dark:hover:bg-sky-900/40',
                borderColor: 'border-sky-200/80 dark:border-sky-900/40',
                iconBg: 'bg-sky-500 text-white',
                hoverText: 'group-hover:text-sky-700 dark:group-hover:text-sky-300'
              },
              {
                title: 'Emergency Response',
                desc: 'Get safer routes and nearby emergency resources.',
                icon: Navigation,
                action: () => onNavigateModule('lifesaving'),
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
                  className={`${card.bgColor} ${card.hoverBg} border ${card.borderColor} rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group min-h-[145px] relative overflow-hidden`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`h-10 w-10 rounded-2xl ${card.iconBg} flex items-center justify-center shadow-md group-hover:scale-110 transition duration-300`}>
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
                    <div className={`h-7 w-7 rounded-full ${card.iconBg} flex items-center justify-center shadow-sm group-hover:translate-x-1 transition`}>
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
          4. HOW JEEVAN SETU WORKS (From data to action — in just a few steps)
         ================================================== */}
      <section id="how-it-works" className="w-full px-4 sm:px-6 lg:px-8 mb-16 py-2">
        
        <div className="bg-white dark:bg-[#070d1e] p-6 sm:p-10 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-md">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              How Jeevan Setu Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              From data to action — in just a few steps.
            </p>
          </div>

          {/* 4 Horizontal Steps Process Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {[
              {
                stepNum: '1',
                title: 'Report',
                desc: 'Share photos, location and details about the disaster.',
                icon: Camera,
                color: 'bg-sky-500/10 text-sky-500 border-sky-400/30'
              },
              {
                stepNum: '2',
                title: 'AI Analysis',
                desc: 'Our AI processes data from satellites, weather and ground reports.',
                icon: Cpu,
                color: 'bg-cyan-500/10 text-cyan-500 border-cyan-400/30'
              },
              {
                stepNum: '3',
                title: 'Risk Assessment',
                desc: 'Get instant risk levels, impact analysis and 72-hour forecast.',
                icon: AlertTriangle,
                color: 'bg-amber-500/10 text-amber-500 border-amber-400/30'
              },
              {
                stepNum: '4',
                title: 'Get Help',
                desc: 'Find nearby shelters, hospitals, routes and emergency services.',
                icon: ShieldAlert,
                color: 'bg-rose-500/10 text-rose-500 border-rose-400/30'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={item.stepNum} className="flex flex-col items-center text-center group relative p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
                  
                  {/* Arrow Connector between steps (visible on medium+ screens) */}
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20 pointer-events-none">
                      <ArrowRight className="h-5 w-5 text-sky-400 opacity-70" />
                    </div>
                  )}

                  <div className={`h-14 w-14 rounded-2xl ${item.color} border flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300 mb-4 relative`}>
                    <Icon className="h-7 w-7" />
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950 font-black text-xs flex items-center justify-center shadow">
                      {item.stepNum}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
                    {item.stepNum}. {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xs">
                    {item.desc}
                  </p>
                </div>
              );
            })}

          </div>
        </div>

      </section>

      {/* ==================================================
          5 & 6. LIVE SITUATION SECTION (With Interactive Leaflet Map)
         ================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 w-full mb-16">
        <div className="bg-[#F4F7FC] dark:bg-[#070d1e] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 lg:p-8 shadow-sm transition-colors duration-300">
          
          {/* Section Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shadow-sm">
                <Radio className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  Live Situation
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Real-time updates from across India
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenDashboard}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer border border-sky-300/40"
              >
                <span>View Full Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                onClick={() => onNavigateModule('map')}
                className="bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-sky-700 dark:text-sky-400 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>View Full Map</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* LEFT COLUMN: Stats & Recent Alerts (3 Cols) */}
            <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
              {/* 4 Statistics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-start justify-center">
                  <div className="h-7 w-7 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-1 text-xs font-extrabold">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">12</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Active Incidents</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-start justify-center">
                  <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1 text-xs font-extrabold">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">04</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Critical Alerts</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-start justify-center">
                  <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 text-xs font-extrabold">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">18</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Affected Districts</span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-col items-start justify-center">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1 text-xs font-extrabold">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">27</span>
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">Rescue Teams Deployed</span>
                </div>
              </div>

              {/* Recent Alerts List */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">Recent Alerts</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  {[
                    { title: 'Landslide in Sikkim', risk: 'High Risk', riskClass: 'text-red-600 dark:text-red-400 font-extrabold', time: '2 hours ago', dot: 'bg-red-500' },
                    { title: 'Flood Alert – Assam', risk: 'Moderate Risk', riskClass: 'text-amber-600 dark:text-amber-400 font-bold', time: '4 hours ago', dot: 'bg-amber-500' },
                    { title: 'Heavy Rainfall – Meghalaya', risk: 'Monitor', riskClass: 'text-slate-500 dark:text-slate-400 font-semibold', time: '6 hours ago', dot: 'bg-emerald-500' }
                  ].map((alert, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1">
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
            <div className="lg:col-span-6 relative min-h-[420px] lg:min-h-[460px] rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 shadow-xl bg-slate-950 group">
              
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
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'satellite'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🛰️ Satellite</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('dark')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                      mapTileType === 'dark'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>🌑 Dark GIS</span>
                  </button>
                  <button
                    onClick={() => changeMapTile('topo')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
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
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold shadow-lg border transition flex items-center gap-1.5 cursor-pointer ${
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
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-2">
                    <CloudRain className="h-8 w-8 text-sky-500" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">Live Weather</span>
                  </div>

                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Current Weather</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
                    Heavy Rainfall
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Sikkim, North East India
                  </p>
                </div>

                <div className="pt-4">
                  <div className="text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
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
                className="bg-[#FFF0F0] dark:bg-[#250d11] hover:bg-[#FFE2E2] dark:hover:bg-[#341217] border border-red-200/90 dark:border-red-900/40 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-red-600 dark:text-red-400 block leading-tight">
                      High Risk in next 72 hours
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
                      Landslide &amp; Flood Risk
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-red-500 shrink-0" />
              </div>
            </div>

          </div>

        </div>
      </section>



      {/* ==================================================
          8. TRUSTED DATA SOURCES
         ================================================== */}
      <section className="w-full bg-slate-50 dark:bg-[#070d1e] border-t border-b border-slate-200/80 dark:border-slate-800 py-8 mb-12 transition-colors duration-300">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Trusted Data Sources
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Powered by reliable and verified sources for accurate information.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Radio className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>ISRO / Satellite Data</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <CloudRain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>IMD Weather Data</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Building2 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <span>Government Reports</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ground Reports</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <MapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>GIS &amp; Remote Sensing</span>
            </div>
          </div>

        </div>
      </section>

      {/* ==================================================
          EMERGENCY CTA SECTION
         ================================================== */}
      <section className="w-full px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-900 border border-red-500/30 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold px-3 py-1 rounded-full">
              <ShieldAlert className="h-3.5 w-3.5 text-red-400 animate-pulse" />
              <span>24x7 Emergency Coordination</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Need help during a disaster?</h3>
            <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
              Send distress signal, access live emergency maps, locate relief shelters, or connect with command teams.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenSos}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-red-600/40 hover:scale-105 transition flex items-center gap-2 cursor-pointer border border-red-400/50"
            >
              <PhoneCall className="h-4 w-4 animate-pulse" />
              <span>Emergency Help</span>
            </button>
            <button
              onClick={() => onNavigateModule('reliefcamps')}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur px-5 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer flex items-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Explore Resources</span>
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================
          9. FOOTER (Dark Navy matching reference)
         ================================================== */}
      <footer className="w-full bg-[#0B132B] dark:bg-[#040814] text-white pt-12 pb-8 border-t border-slate-800 transition-colors duration-300 mt-auto">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-800/80">
            
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-900 ring-2 ring-sky-400/60 overflow-hidden flex items-center justify-center">
                <img
                  src="/jeevan-setu-logo.jpg"
                  alt="Jeevan Setu Logo"
                  className="h-full w-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-sky-400 font-black text-lg">JS</span>
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white block leading-none">
                  JEEVAN SETU
                </span>
                <span className="text-[10px] font-semibold text-sky-400 block mt-0.5">
                  AI Powered Disaster Response
                </span>
              </div>
            </div>

            {/* Center Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition">Privacy Policy</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition">Terms of Use</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition">Help</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => setIsInfoModalOpen(true)} className="hover:text-white transition">Contact</button>
            </div>

            {/* Right: Follow Us */}
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-300">
              <span>Follow Us</span>
              <div className="flex items-center gap-3">
                <a
                  href="https://youtu.be/5GZvqN8GZw8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-800 hover:bg-sky-600 rounded-lg text-slate-300 hover:text-white transition"
                >
                  <Youtube className="h-4 w-4" />
                </a>
                <a href="#twitter" className="p-1.5 bg-slate-800 hover:bg-sky-600 rounded-lg text-slate-300 hover:text-white transition">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#instagram" className="p-1.5 bg-slate-800 hover:bg-sky-600 rounded-lg text-slate-300 hover:text-white transition">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#linkedin" className="p-1.5 bg-slate-800 hover:bg-sky-600 rounded-lg text-slate-300 hover:text-white transition">
                  <Linkedin className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>

          {/* Footer Bottom Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[11px] font-semibold text-slate-400 gap-4">
            <div>
              &copy; 2026 Jeevan Setu &bull; National Disaster Response &amp; GIS Intelligence Platform
            </div>
            
            <div className="font-serif italic text-sm text-slate-200 tracking-wide">
              Together we can build a safer tomorrow
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
                placeholder="Search state, hazard, hospital, or disaster alert..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="py-4 space-y-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Quick Suggestions</div>
              {[
                { label: 'Sikkim Landslide High-Risk Area', action: () => { setIsSearchOpen(false); onNavigateModule('staterisk'); } },
                { label: 'Assam Kaziranga Flood Live Map', action: () => { setIsSearchOpen(false); onNavigateModule('map'); } },
                { label: 'NDRF Relief Camps in Meghalaya', action: () => { setIsSearchOpen(false); onNavigateModule('reliefcamps'); } },
                { label: 'UAV Drone Medical Supply Routes', action: () => { setIsSearchOpen(false); onNavigateModule('drone'); } }
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
          RIGHT-SIDE SLIDING DRAWER / PANEL
         ================================================== */}
      {activeSidePanel && (
        <>
          {/* Semi-transparent Backdrop Overlay */}
          <div
            onClick={() => setActiveSidePanel(null)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[190] animate-in fade-in duration-200"
          />

          {/* Side Drawer Container */}
          <div className="fixed top-0 right-0 h-full z-[200] w-full sm:w-[480px] lg:w-[520px] bg-white dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-[#0b132b]">
              <div className="flex items-center gap-3">
                {activeSidePanel === 'report' && (
                  <div className="h-9 w-9 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center justify-center">
                    <Camera className="h-5 w-5" />
                  </div>
                )}
                {activeSidePanel === 'risk' && (
                  <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
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
                    {activeSidePanel === 'report' && 'Report a Disaster'}
                    {activeSidePanel === 'risk' && 'Check Disaster Risk'}
                    {activeSidePanel === 'livesituation' && 'Explore Live Situation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {activeSidePanel === 'report' && 'AI Incident Submission & Triage'}
                    {activeSidePanel === 'risk' && '72-Hour Environmental Risk Radar'}
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

              {/* PANEL 2: CHECK DISASTER RISK */}
              {activeSidePanel === 'risk' && (
                <div className="space-y-5 text-xs font-medium">
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
                      <span>View Full Regional Risk Matrix</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* PANEL 3: EXPLORE LIVE SITUATION */}
              {activeSidePanel === 'livesituation' && (
                <div className="space-y-5 text-xs font-medium">
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

    </div>
  );
}
