import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center = [25.51, 91.50],
  zoom = 14
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<"satellite" | "topo" | "radar">("satellite");

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: true }).setView(center, zoom);
    mapInstanceRef.current = map;

    // Base Tile Layers
    let tileUrl = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    let tileAttr = "Esri Satellite Imagery";

    if (activeLayer === "topo") {
      tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      tileAttr = "&copy; OpenStreetMap contributors";
    }

    L.tileLayer(tileUrl, { attribution: tileAttr }).addTo(map);

    // Optional Weather Doppler Radar Layer Overlay
    if (activeLayer === "radar") {
      L.tileLayer("https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png", {
        opacity: 0.55,
        attribution: "NEXRAD Radar"
      }).addTo(map);
    }

    // 1. Red Disrupted Highway Polyline (NH-6 Landslide Corridor - Blocked)
    L.polyline([
      [25.500, 91.480],
      [25.508, 91.492],
      [25.512, 91.500],
      [25.515, 91.508],
      [25.522, 91.520]
    ], {
      color: "#ef4444",
      weight: 6,
      opacity: 0.95,
      dashArray: "8, 6"
    }).addTo(map);

    // 2. Green AI Bypass Polyline (Sector 9 Jowai Ridge Bypass - Clear)
    const greenBypass = L.polyline([
      [25.500, 91.480],
      [25.492, 91.498],
      [25.498, 91.518],
      [25.506, 91.528],
      [25.522, 91.520]
    ], {
      color: "#10b981",
      weight: 6,
      opacity: 0.95
    }).addTo(map);

    // 3. Red Hazard Polygon (350m Breach Zone)
    const breachPolygon = L.polygon([
      [25.515, 91.494],
      [25.518, 91.506],
      [25.510, 91.512],
      [25.505, 91.498]
    ], {
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 0.5,
      weight: 2
    }).addTo(map);

    // 4. ROAD CLOSED Marker Badge
    const roadClosedIcon = L.divIcon({
      className: "custom-road-closed-badge",
      html: `
        <div style="
          background: #dc2626;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 8px;
          font-weight: 900;
          font-size: 11px;
          box-shadow: 0 4px 14px rgba(220, 38, 38, 0.7);
          border: 1.5px solid #f87171;
          white-space: nowrap;
          text-align: center;
        ">
          🚫 ROAD CLOSED
        </div>
      `,
      iconSize: [110, 30],
      iconAnchor: [55, 15]
    });
    L.marker([25.514, 91.502], { icon: roadClosedIcon }).addTo(map);

    // 5. Breach 350m label overlay
    const breachTextIcon = L.divIcon({
      className: "custom-breach-label",
      html: `
        <div style="
          color: #ffffff;
          font-weight: 800;
          font-size: 11px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.9);
          transform: rotate(-15deg);
          white-space: nowrap;
        ">
          Breach 350m ➔
        </div>
      `,
      iconSize: [100, 20],
      iconAnchor: [30, 10]
    });
    L.marker([25.509, 91.504], { icon: breachTextIcon }).addTo(map);

    // 6. GREEN BYPASS ACTIVE Marker Badge
    const bypassBadgeIcon = L.divIcon({
      className: "custom-bypass-badge",
      html: `
        <div style="
          background: #059669;
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 10px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.6);
          border: 1px solid #34d399;
          white-space: nowrap;
        ">
          ⚡ Sector 9 AI Bypass (-4.2h)
        </div>
      `,
      iconSize: [150, 26],
      iconAnchor: [75, 13]
    });
    L.marker([25.495, 91.508], { icon: bypassBadgeIcon }).addTo(map);

    // 7. Convoy #01 Vehicle Marker on Green Bypass
    const truckIcon = L.divIcon({
      className: "custom-truck-badge",
      html: `
        <div style="
          background: #0284c7;
          color: #ffffff;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 10px;
          box-shadow: 0 3px 10px rgba(2, 132, 199, 0.8);
          border: 1px solid #38bdf8;
          white-space: nowrap;
        ">
          🚛 Convoy #01 (AS-01-AB-1234)
        </div>
      `,
      iconSize: [140, 24],
      iconAnchor: [70, 12]
    });
    const convoyMarker = L.marker([25.500, 91.480], { icon: truckIcon }).addTo(map);
    convoyMarker.bindPopup("<b>Convoy #01</b><br/>12T Medical Oxygen Cylinders (Class 1)<br/>Status: 🟢 LIVE MOVING VIA AI BYPASS");

    // Live Moving Truck Animation Loop along Green Bypass Waypoints
    const waypoints: [number, number][] = [
      [25.500, 91.480],
      [25.492, 91.498],
      [25.498, 91.518],
      [25.506, 91.528],
      [25.522, 91.520]
    ];
    let step = 0;
    let subStep = 0;

    const truckInterval = setInterval(() => {
      if (!convoyMarker) return;
      const p1 = waypoints[step];
      const p2 = waypoints[(step + 1) % waypoints.length];
      const t = subStep / 20;

      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lon = p1[1] + (p2[1] - p1[1]) * t;

      convoyMarker.setLatLng([lat, lon]);

      subStep++;
      if (subStep >= 20) {
        subStep = 0;
        step = (step + 1) % (waypoints.length - 1);
      }
    }, 200);

    return () => {
      clearInterval(truckInterval);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, activeLayer]);

  return (
    <div className="relative w-full h-full min-h-[420px] lg:min-h-[500px] overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full z-0" style={{ minHeight: "420px" }} />

      {/* Layer Switcher Controls (Top Right Overlay) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl bg-slate-950/80 p-1.5 border border-slate-800 backdrop-blur shadow-xl text-xs">
        <button
          onClick={() => setActiveLayer("satellite")}
          className={`px-2.5 py-1 rounded-lg font-bold transition ${
            activeLayer === "satellite" ? "bg-sky-500 text-slate-950 shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          🛰️ Satellite
        </button>
        <button
          onClick={() => setActiveLayer("topo")}
          className={`px-2.5 py-1 rounded-lg font-bold transition ${
            activeLayer === "topo" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          🗺️ Topo
        </button>
        <button
          onClick={() => setActiveLayer("radar")}
          className={`px-2.5 py-1 rounded-lg font-bold transition ${
            activeLayer === "radar" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-white"
          }`}
        >
          🌧️ Radar
        </button>
      </div>
    </div>
  );
};

export default MapComponent;
