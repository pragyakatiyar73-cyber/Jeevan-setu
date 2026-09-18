import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Phone,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  ShieldAlert,
  Flame,
  Shield,
  Activity,
  HeartPulse,
  Tent,
  Radio,
  ExternalLink,
  Layers,
  Filter,
  RefreshCw
} from 'lucide-react';
import L from 'leaflet';
import {
  getNEREmergencyFacilities,
  findNearestFacility,
  EmergencyFacility,
  EmergencyFacilityType,
  DataStatus
} from '../services/api/emergencyFacilitiesService';
import { NER_STATES_DISTRICTS } from '../services/api/disasterReportsService';
import { isPointInNER, NER_STATES, NERStateName, MASTER_NER_POLYGON, NER_COVERAGE_LABEL } from '../utils/nerBoundary';
import { calculateSafeNERRoute } from '../services/api/roadAccessibilityService';
import { calculateEmergencyRoute, reverseGeocode } from '../services/api/routing';
import { SearchSpellingCorrectionPrompt } from './SearchSpellingCorrectionPrompt';
import { useTranslation } from '../i18n';

interface EmergencyFacilitiesModuleProps {
  onNavigateToMap?: () => void;
  onNavigateToReroute?: (origin: string, dest: string) => void;
  onTriggerSOS?: () => void;
}

const FACILITY_TYPES: Array<EmergencyFacilityType | 'All'> = [
  'All',
  'Hospital',
  'Police',
  'Fire Station',
  'Ambulance',
  'Relief Shelter',
  'Government Emergency Facility'
];

// Presets for testing locations across the 8 NER states
const PRESET_USER_LOCATIONS = [
  { name: 'Guwahati City Center (Assam)', lat: 26.1445, lon: 91.7362, state: 'Assam' },
  { name: 'Shillong Laitumkhrah (Meghalaya)', lat: 25.5788, lon: 91.8933, state: 'Meghalaya' },
  { name: 'Itanagar Sector 01 (Arunachal Pradesh)', lat: 27.0844, lon: 93.6053, state: 'Arunachal Pradesh' },
  { name: 'Imphal Lamphelpat (Manipur)', lat: 24.8170, lon: 93.9368, state: 'Manipur' },
  { name: 'Aizawl Dawrpui (Mizoram)', lat: 23.7271, lon: 92.7176, state: 'Mizoram' },
  { name: 'Kohima PR Hill (Nagaland)', lat: 25.6751, lon: 94.1086, state: 'Nagaland' },
  { name: 'Gangtok MG Marg (Sikkim)', lat: 27.3389, lon: 88.6065, state: 'Sikkim' },
  { name: 'Agartala Secretariat (Tripura)', lat: 23.8315, lon: 91.2868, state: 'Tripura' },
  { name: 'Non-NER Rejection Test (New Delhi)', lat: 28.6139, lon: 77.2090, state: 'Delhi' }
];

export default function EmergencyFacilitiesModule({
  onNavigateToMap,
  onNavigateToReroute,
  onTriggerSOS
}: EmergencyFacilitiesModuleProps) {
  const { t, language } = useTranslation();
  const isHi = language === 'hi';
  // Filters & State
  const [selectedType, setSelectedType] = useState<EmergencyFacilityType | 'All'>('All');
  const [selectedState, setSelectedState] = useState<string>('All');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset district filter when state changes
  useEffect(() => {
    setSelectedDistrict('All');
  }, [selectedState]);

  // User location state
  const [activeUserLoc, setActiveUserLoc] = useState(PRESET_USER_LOCATIONS[0]);
  const [isLocationOutsideNER, setIsLocationOutsideNER] = useState(false);

  // Live GPS & Route Geometry State
  const [isLiveGpsActive, setIsLiveGpsActive] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [gpsAccuracyMeters, setGpsAccuracyMeters] = useState<number | null>(null);
  const [activeRoutePoints, setActiveRoutePoints] = useState<[number, number][]>([]);

  // HTML5 Browser Geolocation Detector
  const handleDetectLiveGPS = () => {
    if (!navigator.geolocation) {
      setGpsErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocatingUser(true);
    setGpsErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        setIsLocatingUser(false);
        setIsLiveGpsActive(true);
        setGpsAccuracyMeters(accuracy);

        let locName = `📍 Live GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
        try {
          const revName = await reverseGeocode(lat, lon);
          if (revName) {
            const shortName = revName.split(',').slice(0, 2).join(',');
            locName = `📍 Live GPS: ${shortName}`;
          }
        } catch (_) {}

        const userLocObj = {
          name: locName,
          lat,
          lon,
          state: 'Live GPS'
        };

        setActiveUserLoc(userLocObj);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 13);
        }
      },
      (err) => {
        setIsLocatingUser(false);
        setIsLiveGpsActive(false);
        setGpsErrorMessage("GPS permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Facilities data
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);
  const [nearestFacility, setNearestFacility] = useState<EmergencyFacility | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [dataStatusTag, setDataStatusTag] = useState<DataStatus>('VERIFIED');
  const [dataSourceSummary, setDataSourceSummary] = useState<string>('');

  // Routing preview state
  const [routeWarning, setRouteWarning] = useState<string | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [activeMapStyle, setActiveMapStyle] = useState<'dark' | 'satellite' | 'street'>('dark');

  // Fetch Real OSRM Road Route Points whenever activeUserLoc or selectedFacility changes
  useEffect(() => {
    if (!selectedFacility || isLocationOutsideNER) {
      setActiveRoutePoints([]);
      return;
    }

    let isSubscribed = true;
    const fetchOSRMGeometry = async () => {
      try {
        const osrmRes = await calculateEmergencyRoute(
          [activeUserLoc.lat, activeUserLoc.lon],
          [selectedFacility.lat, selectedFacility.lon]
        );

        if (isSubscribed && osrmRes && osrmRes.geometry && osrmRes.geometry.length > 0) {
          setActiveRoutePoints(osrmRes.geometry);
        } else if (isSubscribed) {
          setActiveRoutePoints([
            [activeUserLoc.lat, activeUserLoc.lon],
            [selectedFacility.lat, selectedFacility.lon]
          ]);
        }
      } catch (_) {
        if (isSubscribed) {
          setActiveRoutePoints([
            [activeUserLoc.lat, activeUserLoc.lon],
            [selectedFacility.lat, selectedFacility.lon]
          ]);
        }
      }
    };

    fetchOSRMGeometry();
    return () => {
      isSubscribed = false;
    };
  }, [activeUserLoc.lat, activeUserLoc.lon, selectedFacility?.id, isLocationOutsideNER]);

  // Load facilities data
  const loadFacilities = async () => {
    setLoading(true);
    setErrorNotice(null);

    // Validate active user location
    if (!isPointInNER(activeUserLoc.lat, activeUserLoc.lon)) {
      setIsLocationOutsideNER(true);
      setErrorNotice("Location is outside Jeevan Setu's NER coverage.");
      setFacilities([]);
      setNearestFacility(null);
      setLoading(false);
      return;
    }

    setIsLocationOutsideNER(false);

    try {
      const res = await getNEREmergencyFacilities({
        facilityType: selectedType,
        state: selectedState,
        district: selectedDistrict !== 'All' ? selectedDistrict : undefined,
        searchQuery: searchQuery,
        originLat: activeUserLoc.lat,
        originLon: activeUserLoc.lon
      });

      if (!res.success) {
        setErrorNotice(res.errorMessage || "Emergency facility data temporarily unavailable.");
        setFacilities([]);
        setNearestFacility(null);
      } else {
        setFacilities(res.facilities);
        setNearestFacility(res.nearestFacility || null);
        setDataStatusTag(res.dataStatus);
        setDataSourceSummary(res.dataSourceSummary);

        if (res.facilities.length > 0) {
          setSelectedFacility(prev => {
            if (!prev) return res.facilities[0];
            const exists = res.facilities.find(f => f.id === prev.id);
            return exists || res.facilities[0];
          });
        } else {
          setSelectedFacility(null);
        }
      }
    } catch (err) {
      setErrorNotice("Emergency facility data temporarily unavailable.");
      setFacilities([]);
      setNearestFacility(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, [selectedType, selectedState, selectedDistrict, searchQuery, activeUserLoc]);

  // Leaflet Map Initialization & Unmount Cleanup
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      if (!mapInstanceRef.current) {
        if ((mapContainerRef.current as any)._leaflet_id) {
          (mapContainerRef.current as any)._leaflet_id = null;
        }

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
        });

        const map = L.map(mapContainerRef.current, {
          center: [25.8, 92.5],
          zoom: 7,
          zoomControl: true
        });

        const tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';

        tileLayerRef.current = L.tileLayer(tileUrl, {
          maxZoom: 18,
          attribution: 'Jeevan Setu GIS Telemetry'
        }).addTo(map);

        // Render Master 8-State NER Boundary Polygon
        const polygonCoords: L.LatLngExpression[] = MASTER_NER_POLYGON.map(([lat, lon]) => [lat, lon]);
        L.polygon(polygonCoords, {
          color: '#0284c7',
          weight: 2,
          fillColor: '#38bdf8',
          fillOpacity: 0.08,
          dashArray: '5, 5'
        }).addTo(map).bindPopup('<b>📍 North Eastern Region (8 States Master Boundary)</b>');

        markersRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Observe map container resize so Leaflet always fits container properly
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
        }
        resizeObserverRef.current = new ResizeObserver(() => {
          if (mapInstanceRef.current) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (_) {}
          }
        });
        resizeObserverRef.current.observe(mapContainerRef.current);
      }
    } catch (e) {
      console.warn("Leaflet Map init safe catch:", e);
    }

    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (_) {}
      }
    }, 100);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (_) {}
      }
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Style Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (tileLayerRef.current) {
      try {
        mapInstanceRef.current.removeLayer(tileLayerRef.current);
      } catch (_) {}
    }

    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    const options: L.TileLayerOptions = {
      maxZoom: 18,
      attribution: 'Jeevan Setu GIS Telemetry'
    };

    if (activeMapStyle === 'satellite') {
      tileUrl = 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}';
      options.subdomains = ['mt0', 'mt1', 'mt2', 'mt3'];
    } else if (activeMapStyle === 'street') {
      tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      options.subdomains = ['a', 'b', 'c'];
    }

    tileLayerRef.current = L.tileLayer(tileUrl, options).addTo(mapInstanceRef.current);
  }, [activeMapStyle]);

  // Update Markers & Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersRef.current) return;

    markersRef.current.clearLayers();

    if (routePolylineRef.current) {
      try {
        map.removeLayer(routePolylineRef.current);
      } catch (_) {}
      routePolylineRef.current = null;
    }

    // User Location Pin Marker (Live Radar Pulse or Standard Pin)
    if (!isLocationOutsideNER) {
      const userRadarDivIcon = L.divIcon({
        className: 'custom-user-live-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 100%;
              height: 100%;
              border-radius: 50%;
              background: rgba(14, 165, 233, 0.45);
              animation: userPulse 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              position: relative;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #0284c7;
              border: 3px solid #ffffff;
              box-shadow: 0 0 14px #38bdf8;
            "></div>
          </div>
          <style>
            @keyframes userPulse {
              75%, 100% {
                transform: scale(2.2);
                opacity: 0;
              }
            }
          </style>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const userMarker = L.marker([activeUserLoc.lat, activeUserLoc.lon], { icon: userRadarDivIcon });
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 160px;">
          <b style="color: #0284c7; font-size: 13px;">📍 Active Search / User Origin</b><br/>
          <span>${activeUserLoc.name}</span><br/>
          ${isLiveGpsActive ? `<span style="color: #10b981; font-weight: bold;">📡 Live GPS Telemetry Connected</span>` : `<span style="color: #64748b;">Preset Reference Base</span>`}
        </div>
      `);
      markersRef.current.addLayer(userMarker);

      // Accuracy circle for live GPS
      if (isLiveGpsActive) {
        const accuracyCircle = L.circle([activeUserLoc.lat, activeUserLoc.lon], {
          radius: gpsAccuracyMeters || 120,
          color: '#38bdf8',
          weight: 1.5,
          fillColor: '#0284c7',
          fillOpacity: 0.12
        });
        markersRef.current.addLayer(accuracyCircle);
      }
    }

    // Render Facility Markers
    facilities.forEach(fac => {
      let iconColor = '#ef4444'; // Red default (Hospital)
      let symbol = '🏥';

      if (fac.type === 'Police') {
        iconColor = '#3b82f6';
        symbol = '👮';
      } else if (fac.type === 'Fire Station') {
        iconColor = '#f97316';
        symbol = '🚒';
      } else if (fac.type === 'Ambulance') {
        iconColor = '#a855f7';
        symbol = '🚑';
      } else if (fac.type === 'Relief Shelter') {
        iconColor = '#14b8a6';
        symbol = '⛺';
      } else if (fac.type === 'Government Emergency Facility') {
        iconColor = '#10b981';
        symbol = '🏛️';
      }

      const isSelected = selectedFacility && selectedFacility.id === fac.id;

      const customDivIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: `
          <div style="
            background: ${iconColor};
            color: #ffffff;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isSelected ? '18px' : '14px'};
            border: ${isSelected ? '3px solid #38bdf8' : '2px solid #ffffff'};
            box-shadow: ${isSelected ? `0 0 20px ${iconColor}` : '0 2px 6px rgba(0,0,0,0.4)'};
            transition: all 0.2s ease;
          ">
            ${symbol}
          </div>
        `,
        iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
        iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14]
      });

      const marker = L.marker([fac.lat, fac.lon], { icon: customDivIcon });

      marker.on('click', () => {
        setSelectedFacility(fac);
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; min-width: 180px;">
          <b style="color: #0f172a; font-size: 13px;">${fac.name}</b><br/>
          <span style="color: ${iconColor}; font-weight: bold;">● ${fac.type}</span> &bull; <span>${fac.state}</span><br/>
          <span style="color: #64748b;">Distance: <b>${fac.distanceKm !== undefined ? `${fac.distanceKm} km` : 'N/A'}</b></span><br/>
          <span style="color: #64748b;">Contact: <b>${fac.contact}</b></span>
        </div>
      `);

      markersRef.current.addLayer(marker);
    });

    // Draw Multi-Layer Glowing OSRM Road Route Polyline to Selected Facility
    if (selectedFacility && !isLocationOutsideNER) {
      const pts: L.LatLngExpression[] = activeRoutePoints.length > 0
        ? activeRoutePoints.map(p => [p[0], p[1]])
        : [
            [activeUserLoc.lat, activeUserLoc.lon],
            [selectedFacility.lat, selectedFacility.lon]
          ];

      const outerGlow = L.polyline(pts, {
        color: '#0284c7',
        weight: 8,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const mainRoute = L.polyline(pts, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });

      const pulseDash = L.polyline(pts, {
        color: '#ffffff',
        weight: 2,
        dashArray: '8, 12',
        opacity: 0.9
      });

      const routeGroup = L.layerGroup([outerGlow, mainRoute, pulseDash]);
      routeGroup.addTo(map);
      routePolylineRef.current = routeGroup as any;

      const bounds = L.latLngBounds(pts);
      map.fitBounds(bounds, { padding: [55, 55], maxZoom: 14 });
    } else if (facilities.length > 0) {
      const bounds = L.latLngBounds(facilities.map(f => [f.lat, f.lon]));
      if (!isLocationOutsideNER) {
        bounds.extend([activeUserLoc.lat, activeUserLoc.lon]);
      }
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.invalidateSize();
        } catch (_) {}
      }
    }, 200);
  }, [facilities, selectedFacility, activeUserLoc, isLocationOutsideNER, activeRoutePoints, isLiveGpsActive, gpsAccuracyMeters]);

  // Handle Safe Route Click
  const handleGetSafeRoute = async (targetFac: EmergencyFacility) => {
    setIsCalculatingRoute(true);
    setRouteWarning(null);

    try {
      const res = await calculateSafeNERRoute({
        startLat: activeUserLoc.lat,
        startLon: activeUserLoc.lon,
        destLat: targetFac.lat,
        destLon: targetFac.lon,
        startName: activeUserLoc.name,
        destName: targetFac.name
      });

      if (!res.isValidNER || res.error) {
        setRouteWarning(res.error || "Route data temporarily unavailable.");
      } else {
        if (res.hasDisasterWarning && res.warningMessage) {
          setRouteWarning(res.warningMessage);
        }
        if (onNavigateToReroute) {
          onNavigateToReroute(activeUserLoc.name, targetFac.name);
        }
      }
    } catch (e) {
      setRouteWarning("Route data temporarily unavailable.");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      
      {/* 🔴 TOP EXECUTIVE COMMAND BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 transition-colors duration-300">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              {NER_COVERAGE_LABEL}
            </span>

            <span className={`rounded-full px-3 py-1 text-xs font-black border flex items-center gap-1.5 ${
              dataStatusTag === 'LIVE' ? 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30' :
              dataStatusTag === 'VERIFIED' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' :
              'bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30'
            }`}>
              ● {dataStatusTag === 'LIVE' ? (isHi ? 'ओपनस्ट्रीटमैप लाइव POI' : 'OPENSTREETMAP LIVE POIs') : (isHi ? 'सत्यापित राज्य निर्देशिका' : 'VERIFIED STATE DIRECTORY')}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2 flex items-center gap-3">
            <HeartPulse className="h-7 w-7 text-rose-500 shrink-0" />
            {isHi ? 'आपातकालीन सुविधाएं एवं बचाव स्थल बुद्धिमत्ता' : 'Emergency Facilities & Rescue Points Intelligence'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium max-w-4xl leading-relaxed">
            {isHi ? 'सभी 8 उत्तर पूर्वी राज्यों में आपातकालीन अस्पतालों, पुलिस स्टेशनों, दमकल केंद्रों और राहत शिविरों के लिए वास्तविक समय भौगोलिक स्थान, दूरी, सत्यापित हेल्पलाइन नंबर और सुरक्षित मार्ग योजना।' : 'Real-time geospatial location, distance, verified helpline contacts, and safe route planning for emergency hospitals, police stations, fire brigades, and disaster shelters across all 8 North Eastern Region states.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadFacilities}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-extrabold cursor-pointer border border-slate-300 dark:border-slate-700 flex items-center gap-2 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {isHi ? 'डेटा सिंक करें' : 'Sync Data'}
          </button>
          <button
            onClick={onTriggerSOS}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-600/30 hover:scale-105 transition border border-rose-400/40 cursor-pointer animate-pulse"
          >
            🚨 {isHi ? 'आपातकालीन SOS' : 'Emergency SOS'}
          </button>
        </div>
      </div>

      {/* ⚠️ OUTSIDE NER WARNING NOTICE BANNER */}
      {isLocationOutsideNER && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 sm:p-5 text-rose-700 dark:text-rose-300 flex items-center gap-3 shadow-lg">
          <AlertTriangle className="h-6 w-6 shrink-0 text-rose-500 animate-bounce" />
          <div className="text-xs sm:text-sm font-bold">
            <b className="text-base font-black block">{isHi ? 'स्थान जीवन सेतु के NER कवरेज से बाहर है।' : 'Location outside Jeevan Setu\'s NER coverage.'}</b>
            {isHi ? 'जीवन सेतु विशेष रूप से 8 उत्तर पूर्वी राज्यों (असम, अरुणाचल प्रदेश, मणिपुर, मेघालय, मिजोरम, नागालैंड, सिक्किम, त्रिपुरा) के लिए बनाया गया है।' : 'Jeevan Setu is exclusively designed for the 8 North Eastern Region (NER) states: Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, and Tripura.'}
          </div>
        </div>
      )}

      {/* 🛡️ SAFETY GUIDANCE MANDATORY SECTION */}
      <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 sm:p-5 text-sky-800 dark:text-sky-200 flex items-start sm:items-center gap-3 shadow-md">
        <ShieldAlert className="h-6 w-6 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs sm:text-sm font-medium leading-relaxed">
          <b className="font-bold text-slate-900 dark:text-white">{isHi ? 'आधिकारिक आपातकालीन मार्गदर्शन सूचना:' : 'Official Emergency Guidance Notice:'}</b> {isHi ? 'किसी भी आपात स्थिति में स्थानीय अधिकारियों और आधिकारिक आपदा प्रबंधन एजेंसियों के निर्देशों का पालन करें। जीवन सेतु एक सूचना मंच है।' : 'In an emergency, follow instructions from local authorities and official disaster-management agencies. Jeevan Setu is an information platform and not a replacement for official emergency services.'}
        </div>
      </div>

      {/* 🔍 CONTROLS & SEARCH BAR GRID */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 sm:p-6 shadow-xl space-y-5 transition-colors duration-300">
        
        {/* Row 1: Location Presets & Search Bar */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          
          {/* Preset User Location Selector */}
          <div className="xl:col-span-6 space-y-1.5 min-w-0">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-sky-500" /> {isHi ? 'यूज़र स्थान (NER बेस)' : 'User Search Location (NER Base)'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <select
                value={activeUserLoc.name}
                onChange={(e) => {
                  const found = PRESET_USER_LOCATIONS.find(loc => loc.name === e.target.value);
                  if (found) {
                    setIsLiveGpsActive(false);
                    setActiveUserLoc(found);
                  }
                }}
                className="flex-1 min-w-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none truncate"
              >
                {isLiveGpsActive && (
                  <option value={activeUserLoc.name}>{activeUserLoc.name}</option>
                )}
                {PRESET_USER_LOCATIONS.map((loc, idx) => (
                  <option key={idx} value={loc.name}>
                    {loc.name} {loc.state === 'Delhi' ? '⚠️ (Non-NER Test)' : ''}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleDetectLiveGPS}
                disabled={isLocatingUser}
                className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow whitespace-nowrap ${
                  isLiveGpsActive
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-600/30'
                    : 'bg-sky-600 hover:bg-sky-500 text-white border border-sky-400 shadow-sky-600/30'
                }`}
                title="Detect your device's live GPS coordinates"
              >
                <Radio className={`h-4 w-4 ${isLocatingUser ? 'animate-spin text-sky-200' : isLiveGpsActive ? 'animate-pulse text-emerald-200' : ''}`} />
                <span>{isLocatingUser ? (isHi ? 'स्थान खोज रहे हैं...' : 'Locating...') : isLiveGpsActive ? (isHi ? 'लाइव GPS सक्रिय' : 'Live GPS Active') : (isHi ? 'ऑटो GPS खोजें' : 'Auto Detect GPS')}</span>
              </button>
            </div>
            {gpsErrorMessage && (
              <p className="text-[11px] font-bold text-rose-500 pt-0.5">{gpsErrorMessage}</p>
            )}
          </div>

          {/* Search Query Input */}
          <div className="xl:col-span-6 space-y-1.5 min-w-0">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-emerald-500" /> {isHi ? 'राज्य, ज़िला, शहर या सुविधा खोजें' : 'Search State, District, City or Facility Name'}
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={isHi ? "खोजें उदा. GMCH गुवाहाटी, NEIGRIHMS शिलोंग..." : "Search e.g. GMCH Guwahati, NEIGRIHMS Shillong, STNM Gangtok..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 💡 SPELLING CORRECTION & "DID YOU MEAN?" OPTION BANNER */}
            <SearchSpellingCorrectionPrompt
              query={searchQuery}
              onSelectSuggestion={(suggestedText) => setSearchQuery(suggestedText)}
            />
          </div>
        </div>

        {/* Row 2: Facility Type Pills */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-purple-500" /> Facility Type Filter
          </div>
          <div className="flex flex-wrap gap-2">
            {FACILITY_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer border transition ${
                  selectedType === type
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white border-sky-400 shadow-md shadow-sky-600/20'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {type === 'Hospital' && '🏥 '}
                {type === 'Police' && '👮 '}
                {type === 'Fire Station' && '🚒 '}
                {type === 'Ambulance' && '🚑 '}
                {type === 'Relief Shelter' && '⛺ '}
                {type === 'Government Emergency Facility' && '🏛️ '}
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: State & District Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Filter State (8 NER Only)</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none"
            >
              <option value="All">All 8 NER States</option>
              {NER_STATES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Filter District {selectedState !== 'All' ? `(${selectedState})` : ''}
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-sky-500 transition"
            >
              <option value="All">
                {selectedState === 'All' ? 'All NER Districts' : `All Districts in ${selectedState}`}
              </option>
              {selectedState !== 'All' && NER_STATES_DISTRICTS[selectedState] ? (
                NER_STATES_DISTRICTS[selectedState].map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))
              ) : (
                Object.entries(NER_STATES_DISTRICTS).map(([stName, distList]) => (
                  <optgroup key={stName} label={`--- ${stName} ---`}>
                    {distList.map(dist => (
                      <option key={`${stName}-${dist}`} value={dist}>{dist} ({stName})</option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* 🟢 NEAREST FACILITY CARD HIGHLIGHT (Find Nearest Emergency Facility) */}
      {nearestFacility && !isLocationOutsideNER && (
        <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-transparent p-5 sm:p-6 shadow-xl space-y-3 relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-black text-xs uppercase tracking-wide shadow flex items-center gap-1.5">
              <span>🎯</span> NEAREST EMERGENCY FACILITY FOUND
            </span>

            <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/30">
              {nearestFacility.distanceKm !== undefined ? `Distance: ${nearestFacility.distanceKm} km` : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-8 space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {nearestFacility.name}
              </h2>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                <b>Type:</b> {nearestFacility.type} &bull; <b>State:</b> {nearestFacility.state} &bull; <b>District:</b> {nearestFacility.district}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                <b>Address:</b> {nearestFacility.address}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Source: <b>{nearestFacility.dataSource}</b> &bull; Status: <b className="text-emerald-500">{nearestFacility.dataStatus}</b>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-stretch justify-center gap-2.5">
              <div className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white font-mono text-xs font-bold text-center border border-slate-800">
                📞 Contact: <span className="text-sky-400">{nearestFacility.contact}</span>
              </div>
              <button
                onClick={() => handleGetSafeRoute(nearestFacility)}
                disabled={isCalculatingRoute}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center justify-center gap-2 transition"
              >
                <Navigation className="h-4 w-4" />
                {isCalculatingRoute ? 'Calculating Safe Route...' : 'Get Safe Route ➔'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ ROUTE WARNING PANEL */}
      {routeWarning && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-bold flex items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <span>{routeWarning}</span>
        </div>
      )}

      {/* 🗺️ INTERACTIVE GIS MAP & FACILITY CARDS LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Interactive GIS Map */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[680px] sm:min-h-[720px] xl:min-h-[780px]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl flex flex-col flex-1 h-full transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🗺️</span> {isHi ? 'आपातकालीन सुविधा इंटरएक्टिव मैप' : 'Emergency Facilities Interactive Map'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isHi ? 'सुरक्षित मार्ग और दूरी देखने के लिए पिन पर क्लिक करें' : 'Click any facility pin to preview direct safe route & distance'}
                </p>
              </div>

              {/* Map Layer Controls & Quick Live Location */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleDetectLiveGPS}
                  disabled={isLocatingUser}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer border shadow ${
                    isLiveGpsActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-600/30'
                      : 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400 shadow-sky-600/30'
                  }`}
                  title="Detect live GPS coordinates"
                >
                  <Radio className={`h-3.5 w-3.5 ${isLocatingUser ? 'animate-spin' : isLiveGpsActive ? 'animate-pulse' : ''}`} />
                  <span>{isLocatingUser ? (isHi ? 'खोज रहे हैं...' : 'Locating...') : isLiveGpsActive ? (isHi ? 'लाइव GPS ON' : 'Live GPS ON') : (isHi ? '📍 लाइव लोकेशन' : '📍 Live Location')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveMapStyle('dark')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                    activeMapStyle === 'dark'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title="Dark Base Map"
                >
                  🗺️ {isHi ? 'डार्क' : 'Dark'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapStyle('satellite')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                    activeMapStyle === 'satellite'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title="Satellite Image Base Map"
                >
                  🛰️ {isHi ? 'सैटेलाइट' : 'Satellite'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapStyle('street')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border ${
                    activeMapStyle === 'street'
                      ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                  title="OpenStreetMap Street Layer"
                >
                  🌐 {isHi ? 'स्ट्रीट' : 'Street'}
                </button>
              </div>
            </div>

            {/* Quick Action Toolbar on top of map */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 my-2 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 truncate max-w-[220px]">
                  <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">{activeUserLoc.name}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                {nearestFacility && (
                  <button
                    type="button"
                    onClick={() => setSelectedFacility(nearestFacility)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    ⚡ {isHi ? 'निकटतम केंद्र' : 'Focus Nearest'} ({nearestFacility.distanceKm} km)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([activeUserLoc.lat, activeUserLoc.lon], 12);
                      mapInstanceRef.current.invalidateSize();
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  🎯 {isHi ? 'यूज़र स्थान' : 'Recenter Origin'}
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map Container - flex-1 min-h-[440px] */}
            <div className="relative flex-1 min-h-[440px] sm:min-h-[480px] w-full rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner my-1">
              <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
              
              {/* Floating Live Location Overlay Button inside map */}
              <button
                type="button"
                onClick={handleDetectLiveGPS}
                disabled={isLocatingUser}
                className="absolute bottom-3 right-3 z-[400] px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-black shadow-2xl border border-sky-500/50 backdrop-blur-md flex items-center gap-2 cursor-pointer transition hover:scale-105 active:scale-95"
              >
                <Radio className={`h-4 w-4 ${isLocatingUser ? 'animate-spin text-sky-400' : isLiveGpsActive ? 'text-emerald-400 animate-pulse' : 'text-sky-400'}`} />
                <span>{isLocatingUser ? (isHi ? 'स्थान खोज रहे हैं...' : 'Locating...') : isLiveGpsActive ? (isHi ? '📡 लाइव लोकेशन ऑन' : '📡 Live Location Active') : (isHi ? '📍 लाइव लोकेशन चालू करें' : '📍 Detect Live Location')}</span>
              </button>
            </div>

            {/* Selected Facility Interactive Route Bar */}
            {selectedFacility && (
              <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-300 shrink-0 my-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-sky-500 text-white">
                      {selectedFacility.type}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[280px]">
                      {selectedFacility.name}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[340px]">
                    {selectedFacility.address} &bull; <b className="text-sky-400">{selectedFacility.distanceKm} km {isHi ? 'दूरी' : 'away'}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {selectedFacility.contact && selectedFacility.contact !== 'Not available' ? (
                    <a
                      href={`tel:${selectedFacility.contact}`}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow transition"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{selectedFacility.contact}</span>
                    </a>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>No Phone</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleGetSafeRoute(selectedFacility)}
                    disabled={isCalculatingRoute}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>{isCalculatingRoute ? (isHi ? 'मार्ग की गणना...' : 'Calculating...') : (isHi ? 'सुरक्षित मार्ग ➔' : 'Safe Route ➔')}</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Hospital</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span> Police</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span> Fire</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span> Ambulance</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span> Shelter</span>
              </div>
              <span>Showing {facilities.length} verified points</span>
            </div>
          </div>
        </div>

        {/* Right Column: Facilities List Cards */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[680px] sm:min-h-[720px] xl:min-h-[780px]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl flex flex-col flex-1 h-full transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 shrink-0">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>🏥</span> {isHi ? 'आपदा आपातकालीन सुविधा निर्देशिका' : 'Emergency Facilities Directory'}
            </h3>
            <span className="text-xs font-mono text-slate-500 font-bold">
              {facilities.length} {isHi ? 'उपलब्ध बिंदु' : 'Available'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex-1 min-h-0 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
              <p className="text-xs font-bold">{isHi ? 'सुविधाएं लोड हो रही हैं...' : 'Loading emergency facilities across 8 NER states...'}</p>
            </div>
          ) : errorNotice ? (
            <div className="p-6 flex-1 min-h-0 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-center font-bold text-sm flex items-center justify-center">
              {errorNotice}
            </div>
          ) : facilities.length === 0 ? (
            <div className="p-6 flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-center text-slate-500 text-xs font-bold flex items-center justify-center">
              {isHi ? 'चयनित फिल्टर के लिए कोई सुविधा नहीं मिली।' : 'No facilities found matching selected filter criteria inside NER.'}
            </div>
          ) : (
            <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1.5 custom-scrollbar">
              {facilities.map(fac => {
                const isSelected = selectedFacility && selectedFacility.id === fac.id;
                return (
                  <div
                    key={fac.id}
                    onClick={() => setSelectedFacility(fac)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 space-y-2 ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/10 shadow-lg ring-1 ring-sky-500/50'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          fac.type === 'Hospital' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30' :
                          fac.type === 'Police' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' :
                          fac.type === 'Fire Station' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-500/30' :
                          fac.type === 'Ambulance' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30' :
                          'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                        }`}>
                          {fac.type}
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mt-1">
                          {fac.name}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        {fac.distanceKm !== undefined && (
                          <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {fac.distanceKm} km
                          </span>
                        )}
                        <span className="block text-[10px] font-mono text-slate-400 mt-1">
                          {fac.dataStatus}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <b>State:</b> {fac.state} &bull; <b>District:</b> {fac.district}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      📍 {fac.address}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 text-xs">
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                        📞 {fac.contact}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetSafeRoute(fac);
                        }}
                        className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-[11px] cursor-pointer shadow flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" /> Safe Route
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>

    </div>
  );
}
