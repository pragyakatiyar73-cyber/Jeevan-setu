import { useTranslation } from "../i18n";
import React, { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Radio,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Navigation,
  Wind,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Package,
  Layers,
  Thermometer,
  RotateCcw,
  Sliders,
  Check
} from "lucide-react";

interface UAVDroneModuleProps {
  onNavigateToMonitoring?: () => void;
}

// Data Models
interface Hub {
  id: string;
  name: string;
  lat: number;
  lon: number;
  state: string;
}

interface Helipad {
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevationMsl: number;
  state: string;
}

interface Drone {
  id: string;
  name: string;
  maxPayloadKg: number;
  operatingRadiusKm: number;
  cruiseSpeedKmH: number;
  maxAltitudeMsl: number;
}

export default function UAVDroneModule({ onNavigateToMonitoring }: UAVDroneModuleProps) {
  const { t } = useTranslation();
  // Hubs Roster
  const hubs: Hub[] = [
    { id: "imphal", name: "Imphal (Manipur Center)", lat: 24.8170, lon: 93.9368, state: "Manipur" },
    { id: "guwahati", name: "Guwahati (Assam Hub)", lat: 26.1445, lon: 91.7362, state: "Assam" },
    { id: "shillong", name: "Shillong (East Khasi Hills)", lat: 25.5788, lon: 91.8933, state: "Meghalaya" },
    { id: "itanagar", name: "Itanagar (Arunachal Hub)", lat: 27.0844, lon: 93.6053, state: "Arunachal Pradesh" },
    { id: "aizawl", name: "Aizawl (Mizoram Terminal)", lat: 23.7271, lon: 92.7176, state: "Mizoram" },
    { id: "gangtok", name: "Gangtok (Sikkim Command)", lat: 27.3389, lon: 88.6065, state: "Sikkim" },
    { id: "kohima", name: "Kohima (Nagaland Center)", lat: 25.6751, lon: 94.1086, state: "Nagaland" },
    { id: "agartala", name: "Agartala (Tripura Depot)", lat: 23.8315, lon: 91.2868, state: "Tripura" }
  ];

  // Helipads Roster
  const helipads: Helipad[] = [
    { id: "LZ-SHILLONG", name: "NEIGRIHMS Shillong Trauma Rooftop [1525m MSL]", lat: 25.5890, lon: 91.9320, elevationMsl: 1525, state: "Meghalaya" },
    { id: "LZ-SELA", name: "Sela Pass Emergency Field LZ [3500m MSL]", lat: 27.5050, lon: 92.1030, elevationMsl: 3500, state: "Arunachal Pradesh" },
    { id: "LZ-AIZAWL", name: "Aizawl Civil Hospital Rooftop Helipad [1132m MSL]", lat: 23.7271, lon: 92.7176, elevationMsl: 1132, state: "Mizoram" },
    { id: "LZ-MELLI", name: "Melli Teesta Basin High-Ground Helipad [650m MSL]", lat: 27.0870, lon: 88.4630, elevationMsl: 650, state: "Sikkim" },
    { id: "LZ-ZUBZA", name: "Zubza Pass Highland Relief LZ [1400m MSL]", lat: 25.6890, lon: 94.0450, elevationMsl: 1400, state: "Nagaland" },
    { id: "LZ-NONEY", name: "Noney Valley Landslide Camp LZ [620m MSL]", lat: 24.7890, lon: 93.6540, elevationMsl: 620, state: "Manipur" }
  ];

  // Drone Fleet Roster
  const drones: Drone[] = [
    { id: "GARUDA-X15", name: "Garuda-X15 Sovereign Heavy UAV", maxPayloadKg: 18, operatingRadiusKm: 150, cruiseSpeedKmH: 95, maxAltitudeMsl: 4200 },
    { id: "PAWAN-V4", name: "Pawan-V4 Rapid Medical Carrier", maxPayloadKg: 10, operatingRadiusKm: 120, cruiseSpeedKmH: 110, maxAltitudeMsl: 3500 },
    { id: "PUSHPAK-25", name: "Pushpak-Heavy Lift Quad", maxPayloadKg: 25, operatingRadiusKm: 90, cruiseSpeedKmH: 75, maxAltitudeMsl: 2800 },
    { id: "AEROPEAK-9", name: "AeroPeak-9 Mountain Ridge Scout", maxPayloadKg: 6, operatingRadiusKm: 200, cruiseSpeedKmH: 120, maxAltitudeMsl: 4800 }
  ];

  // Configuration Form State
  const [selectedHub, setSelectedHub] = useState<Hub>(hubs[0]); // Imphal
  const [selectedLZ, setSelectedLZ] = useState<Helipad>(helipads[0]); // NEIGRIHMS Shillong
  const [selectedDrone, setSelectedDrone] = useState<Drone>(drones[0]); // Garuda-X15
  const [cargoName, setCargoName] = useState<string>("High-Altitude Emergency Blood Plasma & Dialysis Fluid");
  const [payloadKg, setPayloadKg] = useState<number>(12);

  // Mission Lifecycle State
  const [missionStatus, setMissionStatus] = useState<"IDLE" | "VALIDATING" | "READY" | "MISSION ACTIVE" | "IN TRANSIT" | "ARRIVED" | "DELIVERED" | "ABORTED">("IDLE");
  const [missionId, setMissionId] = useState<string>("");
  const [abortReason, setAbortReason] = useState<string>("");

  // Telemetry Live State
  const [progressPercent, setProgressPercent] = useState<number>(25);
  const [currentAltitude, setCurrentAltitude] = useState<number>(1850);
  const [currentSpeed, setCurrentSpeed] = useState<number>(82);
  const [currentBattery, setCurrentBattery] = useState<number>(100);
  const [currentDistanceTravelled, setCurrentDistanceTravelled] = useState<number>(0);

  // Leaflet Map Refs
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const droneMarkerRef = useRef<L.Marker | null>(null);
  const pathPolylineRef = useRef<L.Polyline | null>(null);

  // Haversine Distance Math
  const calculateHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  };

  const flightDistanceKm = calculateHaversine(selectedHub.lat, selectedHub.lon, selectedLZ.lat, selectedLZ.lon);
  const isRangeExceeded = flightDistanceKm > selectedDrone.operatingRadiusKm;
  const isPayloadOverloaded = payloadKg > selectedDrone.maxPayloadKg;
  const isMissionFeasible = !isRangeExceeded && !isPayloadOverloaded;

  const estimatedFlightDurationMins = Math.round((flightDistanceKm / selectedDrone.cruiseSpeedKmH) * 60);
  const estimatedBatteryRequired = Math.min(100, Math.round((flightDistanceKm / selectedDrone.operatingRadiusKm) * 75 + (payloadKg / selectedDrone.maxPayloadKg) * 20));

  // Initialize & Update Leaflet Map
  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: true });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "OpenStreetMap contributors"
    }).addTo(map);

    // Origin Marker
    const originIcon = L.divIcon({
      className: "custom-hub-icon",
      html: `
        <div style="background:#0284c7;color:#fff;padding:4px 8px;border-radius:6px;font-weight:800;font-size:10px;border:1px solid #38bdf8;white-space:nowrap;">
          📍 Origin: ${selectedHub.name.split(' ')[0]}
        </div>
      `,
      iconSize: [120, 24],
      iconAnchor: [60, 12]
    });
    L.marker([selectedHub.lat, selectedHub.lon], { icon: originIcon }).addTo(map).bindPopup(`<b>${selectedHub.name}</b><br/>State: ${selectedHub.state}`);

    // Destination Marker
    const destIcon = L.divIcon({
      className: "custom-lz-icon",
      html: `
        <div style="background:#dc2626;color:#fff;padding:4px 8px;border-radius:6px;font-weight:800;font-size:10px;border:1px solid #f87171;white-space:nowrap;">
          🚁 Helipad: ${selectedLZ.name.split(' ')[0]}
        </div>
      `,
      iconSize: [130, 24],
      iconAnchor: [65, 12]
    });
    L.marker([selectedLZ.lat, selectedLZ.lon], { icon: destIcon }).addTo(map).bindPopup(`<b>${selectedLZ.name}</b><br/>Elevation: ${selectedLZ.elevationMsl}m MSL`);

    // Flight Path Polyline Arc
    const flightPath = L.polyline(
      [
        [selectedHub.lat, selectedHub.lon],
        [selectedLZ.lat, selectedLZ.lon]
      ],
      {
        color: isMissionFeasible ? "#0284c7" : "#ef4444",
        weight: 4,
        dashArray: "6, 6"
      }
    ).addTo(map);
    pathPolylineRef.current = flightPath;

    // Moving Drone Marker
    const droneIcon = L.divIcon({
      className: "custom-drone-icon",
      html: `
        <div style="background:#10b981;color:#fff;padding:4px 8px;border-radius:8px;font-weight:900;font-size:11px;border:1.5px solid #34d399;box-shadow:0 0 12px #10b981;white-space:nowrap;">
          🛸 ${selectedDrone.id}
        </div>
      `,
      iconSize: [110, 26],
      iconAnchor: [55, 13]
    });

    const startPos: [number, number] = [
      selectedHub.lat + (selectedLZ.lat - selectedHub.lat) * (progressPercent / 100),
      selectedHub.lon + (selectedLZ.lon - selectedHub.lon) * (progressPercent / 100)
    ];

    const droneMarker = L.marker(startPos, { icon: droneIcon }).addTo(map);
    droneMarkerRef.current = droneMarker;

    // Fit Bounds to Flight Corridor
    map.fitBounds(flightPath.getBounds(), { padding: [40, 40] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [selectedHub, selectedLZ, selectedDrone, isMissionFeasible]);

  // Telemetry Live Loop Simulation (Updates every 1s when MISSION ACTIVE or IN TRANSIT)
  useEffect(() => {
    if (missionStatus !== "MISSION ACTIVE" && missionStatus !== "IN TRANSIT") return;

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        const next = prev >= 100 ? 0 : prev + 1;
        setCurrentDistanceTravelled(Number(((flightDistanceKm * next) / 100).toFixed(1)));
        setCurrentBattery(Math.max(15, 100 - Math.round((estimatedBatteryRequired * next) / 100)));
        setCurrentSpeed(Math.round(selectedDrone.cruiseSpeedKmH + (Math.random() * 6 - 3)));

        // Update Map Drone Marker
        if (droneMarkerRef.current) {
          const nextLat = selectedHub.lat + (selectedLZ.lat - selectedHub.lat) * (next / 100);
          const nextLon = selectedHub.lon + (selectedLZ.lon - selectedHub.lon) * (next / 100);
          droneMarkerRef.current.setLatLng([nextLat, nextLon]);
        }

        return next;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [missionStatus, flightDistanceKm, estimatedBatteryRequired, selectedHub, selectedLZ, selectedDrone]);

  // Handle Launch Mission
  const handleLaunchMission = async () => {
    if (!isMissionFeasible) return;

    setMissionStatus("VALIDATING");

    try {
      const res = await fetch("http://localhost:5000/api/uav/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: selectedHub.name,
          destination: selectedLZ.name,
          droneId: selectedDrone.id,
          cargo: cargoName,
          payloadMass: payloadKg,
          distanceKm: flightDistanceKm,
          estimatedTimeMins: estimatedFlightDurationMins,
          status: "MISSION ACTIVE"
        })
      });
      const data = await res.json();
      const mId = data?.mission?.missionId || "UAV-2026-8942";
      setMissionId(mId);
    } catch (err) {
      setMissionId("UAV-2026-8942");
    }

    setTimeout(() => {
      setMissionStatus("IN TRANSIT");
      setProgressPercent(5);
    }, 1500);
  };

  // Handle Emergency Abort Mission
  const handleAbortMission = async () => {
    const reason = "Emergency Manual Operator Abort: High-Altitude Turbulence Risk Exceeded";
    setAbortReason(reason);
    setMissionStatus("ABORTED");

    if (missionId) {
      try {
        await fetch("http://localhost:5000/api/uav/missions/" + missionId + "/abort", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });
      } catch (err) {}
    }
  };

  const distanceRemainingKm = Number((flightDistanceKm - currentDistanceTravelled).toFixed(1));
  const etaMinsRemaining = Math.max(0, Math.round((distanceRemainingKm / selectedDrone.cruiseSpeedKmH) * 60));

  return (
    <div className="h-full overflow-y-auto p-4 lg:p-6 space-y-6 select-none bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* HEADER SECTION */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-colors duration-300">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-sky-500/20 px-3 py-0.5 text-xs font-bold text-sky-700 dark:text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-400 animate-ping"></span>
              🛸 SOVEREIGN UAV LIFELINE EMERGENCY DISPATCH &bull; SIMULATION MODE ACTIVE
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
            <span>🛸</span> Fully Autonomous UAV Emergency Aerial Delivery Module
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 max-w-3xl">
            High-Altitude Medical Cargo Dispatch & Live Flight Corridor Control for Zero-Road Mountain Emergency Zones across all 8 North Eastern States.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className={"px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border " + (
            missionStatus === "IN TRANSIT" || missionStatus === "MISSION ACTIVE" ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 animate-pulse" :
            missionStatus === "ABORTED" ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40" :
            missionStatus === "VALIDATING" ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40" :
            "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800"
          )}>
            ● STATUS: {missionStatus}
          </span>

          {missionStatus === "IN TRANSIT" || missionStatus === "MISSION ACTIVE" ? (
            <button
              onClick={handleAbortMission}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-black text-white text-xs shadow-lg shadow-rose-600/40 transition animate-bounce cursor-pointer flex items-center gap-1.5"
            >
              <span>🚨</span> EMERGENCY ABORT MISSION
            </button>
          ) : null}
        </div>
      </div>

      {/* ABORTED ALERT BANNER */}
      {missionStatus === "ABORTED" && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/80 p-4 shadow-2xl space-y-1 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-rose-400 shrink-0" />
            <div>
              <h3 className="text-sm font-black text-white">MISSION ABORTED BY OPERATOR</h3>
              <p className="text-xs text-slate-300">{abortReason || "Manual emergency abort sequence executed. UAV returning to origin base."}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setMissionStatus("IDLE");
              setProgressPercent(0);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-800"
          >
            Reset Flight System
          </button>
        </div>
      )}

      {/* MAIN CONTENT GRID (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: MISSION CONFIGURATION & SAFETY PROTOCOL */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. MISSION CONFIGURATION PANEL */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚙️</span> UAV Mission Configuration
              </h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">MDoNER Direct Corridor</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Origin Hub */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">{t("uav.origin", "Origin Logistics Hub")}</label>
                <select
                  value={selectedHub.id}
                  onChange={(e) => {
                    const found = hubs.find((h) => h.id === e.target.value);
                    if (found) setSelectedHub(found);
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-bold focus:border-sky-500 focus:outline-none"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination Helipad */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">{t("uav.destination", "Destination Helipad / Emergency LZ")}</label>
                <select
                  value={selectedLZ.id}
                  onChange={(e) => {
                    const found = helipads.find((lz) => lz.id === e.target.value);
                    if (found) setSelectedLZ(found);
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-bold focus:border-sky-500 focus:outline-none"
                >
                  {helipads.map((lz) => (
                    <option key={lz.id} value={lz.id}>{lz.name}</option>
                  ))}
                </select>
              </div>

              {/* Assigned UAV Drone */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">{t("uav.drone", "Assigned Lifeline UAV Drone")}</label>
                <select
                  value={selectedDrone.id}
                  onChange={(e) => {
                    const found = drones.find((d) => d.id === e.target.value);
                    if (found) setSelectedDrone(found);
                  }}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-bold focus:border-sky-500 focus:outline-none"
                >
                  {drones.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} (Max Payload: {d.maxPayloadKg}kg, Radius: {d.operatingRadiusKm}km)</option>
                  ))}
                </select>
              </div>

              {/* Emergency Payload Cargo */}
              <div>
                <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Emergency Payload Cargo</label>
                <input
                  type="text"
                  value={cargoName}
                  onChange={(e) => setCargoName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-slate-900 dark:text-white font-bold focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Payload Mass Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">{t("uav.payloadMass", "Payload Mass (kg)")}</span>
                  <span className={"font-black text-sm " + (isPayloadOverloaded ? "text-rose-600 dark:text-rose-400" : "text-sky-600 dark:text-sky-400")}>
                    {payloadKg} kg / {selectedDrone.maxPayloadKg} kg Max
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={payloadKg}
                  onChange={(e) => setPayloadKg(Number(e.target.value))}
                  className="w-full accent-sky-500 bg-slate-200 dark:bg-slate-950 cursor-pointer"
                />
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleLaunchMission}
              disabled={!isMissionFeasible || missionStatus === "IN TRANSIT" || missionStatus === "MISSION ACTIVE"}
              className={"w-full py-3 rounded-xl font-black text-xs shadow-xl transition flex items-center justify-center gap-2 " + (
                missionStatus === "IN TRANSIT" || missionStatus === "MISSION ACTIVE" ? "bg-emerald-600 text-white cursor-default shadow-emerald-600/30" :
                missionStatus === "VALIDATING" ? "bg-amber-600 text-white animate-pulse" :
                isMissionFeasible ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white cursor-pointer shadow-sky-500/30" :
                "bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              )}
            >
              {missionStatus === "IN TRANSIT" || missionStatus === "MISSION ACTIVE" ? "⚡ Autonomous UAV Mission Active" :
               missionStatus === "VALIDATING" ? "⏳ Validating IAF Corridor & Weather..." :
               "🚀 " + t("uav.launchMission", "Launch Autonomous Drone Lifeline Mission")}
            </button>
          </div>

          {/* 2. FLIGHT TELEMETRY MATH CARD */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">FLIGHT TELEMETRY MATH</span>
              <span className={"px-2.5 py-0.5 rounded text-[10px] font-black uppercase border " + (
                isRangeExceeded || isPayloadOverloaded ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40" :
                "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
              )}>
                {isRangeExceeded ? t("uav.rangeExceeded", "RANGE EXCEEDED") : isPayloadOverloaded ? "PAYLOAD OVERLOAD" : "SAFE"}
              </span>
            </div>

            {/* Validation Message */}
            <p className={"text-xs font-semibold leading-relaxed " + (
              isRangeExceeded || isPayloadOverloaded ? "text-rose-600 dark:text-rose-300" : "text-emerald-600 dark:text-emerald-300"
            )}>
              {isRangeExceeded ? `⚠️ Flight distance (${flightDistanceKm} km) exceeds maximum operating radius (${selectedDrone.operatingRadiusKm} km) of ${selectedDrone.name}.` :
               isPayloadOverloaded ? `⚠️ Payload mass (${payloadKg} kg) exceeds maximum capacity (${selectedDrone.maxPayloadKg} kg) of ${selectedDrone.name}.` :
               `🟢 All mission flight math parameters are within safe operational limits.`}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Flight Distance</span>
                <b className="text-slate-900 dark:text-white text-sm">{flightDistanceKm} km</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Max Radius Limit</span>
                <b className="text-sky-600 dark:text-sky-400 text-sm">{selectedDrone.operatingRadiusKm} km</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Remaining Payload</span>
                <b className="text-emerald-600 dark:text-emerald-400 text-sm">{Math.max(0, selectedDrone.maxPayloadKg - payloadKg)} kg</b>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Est. Battery Required</span>
                <b className="text-indigo-600 dark:text-indigo-300 text-sm">{estimatedBatteryRequired}%</b>
              </div>
            </div>
          </div>

          {/* 3. PRE-FLIGHT SAFETY PROTOCOL (4 CARDS) */}
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">PRE-FLIGHT SAFETY PROTOCOL</div>
            <div className="grid grid-cols-2 gap-3">
              {/* Card 1: IAF Air Corridor */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] space-y-1 transition-colors duration-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-white">IAF Air Corridor</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black">PASS</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Authorized Corridor #IAF-NER-9981 Active</p>
              </div>

              {/* Card 2: Mountain Wind Check */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] space-y-1 transition-colors duration-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-white">Mountain Wind Check</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black">PASS</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Wind: 28 km/h (&lt; 55 km/h Safe)</p>
              </div>

              {/* Card 3: Helipad Receiver */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] space-y-1 transition-colors duration-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-white">Helipad Receiver</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black">PASS</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Ground Optical Beacon Operational</p>
              </div>

              {/* Card 4: Cold-Chain Pod */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] space-y-1 transition-colors duration-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900 dark:text-white">Cold-Chain Pod</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[9px] font-black">PASS</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">+4.2°C Thermal Storage Protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE MAP & LIVE TELEMETRY DASHBOARD */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. INTERACTIVE LEAFLET FLIGHT CORRIDOR MAP */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl dark:shadow-2xl space-y-3 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                {t("uav.aerialLifelineCorridor", "HIGH-ALTITUDE AERIAL LIFELINE CORRIDOR (ZERO ROAD DEPENDENCY)")}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Leaflet GIS Vector</span>
            </div>

            <div className="relative rounded-xl overflow-hidden h-[340px] border border-slate-200 dark:border-slate-800 shadow-xl">
              <div ref={mapRef} className="w-full h-full z-0" />

              {/* Overlay HUD info badge */}
              <div className="absolute top-3 left-3 z-20 rounded-lg bg-white/90 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-2 text-[10px] font-mono backdrop-blur space-y-0.5 text-sky-600 dark:text-sky-400">
                <div>MISSION ID: {missionId || "UAV-READY"}</div>
                <div>CORRIDOR: {selectedHub.name.split(' ')[0]} ➔ {selectedLZ.name.split(' ')[0]}</div>
                <div>AERIAL DISTANCE: {flightDistanceKm} km</div>
              </div>
            </div>
          </div>

          {/* 2. LIVE DRONE TELEMETRY GRID (8 METRICS) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 shadow-xl dark:shadow-2xl space-y-4 transition-colors duration-300">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <span>📡</span> Live UAV Telemetry System
              </h3>
              <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400">Updated every 1.0s</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Altitude</span>
                <b className="text-slate-900 dark:text-white text-base">{currentAltitude} m MSL</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Speed</span>
                <b className="text-sky-600 dark:text-sky-400 text-base">{currentSpeed} km/h</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Battery Level</span>
                <b className={"text-base " + (currentBattery < 30 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>{currentBattery}%</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Heading</span>
                <b className="text-amber-600 dark:text-amber-400 text-base">142° SE</b>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Dist. Travelled</span>
                <b className="text-indigo-600 dark:text-indigo-300 text-base">{currentDistanceTravelled} km</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Dist. Remaining</span>
                <b className="text-sky-600 dark:text-sky-400 text-base">{distanceRemainingKm} km</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Est. ETA</span>
                <b className="text-emerald-600 dark:text-emerald-400 text-base">00:{etaMinsRemaining < 10 ? '0' + etaMinsRemaining : etaMinsRemaining}:00</b>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase">Mission Progress</span>
                <b className="text-slate-900 dark:text-white text-base">{progressPercent}%</b>
              </div>
            </div>

            {/* Flight Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: progressPercent + "%" }}></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                <span>{selectedHub.name.split(' ')[0]}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">{progressPercent}% Trajectory Cleared</span>
                <span>{selectedLZ.name.split(' ')[0]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
