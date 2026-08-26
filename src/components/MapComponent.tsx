import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  breachDistanceMeters?: number;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center = [25.51, 91.50],
  zoom = 14,
  breachDistanceMeters = 350
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // OpenStreetMap dark/standard tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors"
    }).addTo(map);

    // 350m Danger Zone Polygon / Circle
    const circle = L.circle(center, {
      radius: breachDistanceMeters,
      color: "#ef4444",
      weight: 2,
      fillColor: "#dc2626",
      fillOpacity: 0.35
    }).addTo(map);

    circle.bindTooltip(`⚠️ 350m Breach Danger Zone`, { permanent: true, direction: "top", className: "bg-slate-900 text-rose-400 font-bold border border-rose-500 rounded px-2 py-0.5 text-xs shadow-lg" });

    // Incident breach polygon outline
    L.polygon([
      [25.513, 91.496],
      [25.515, 91.504],
      [25.507, 91.508],
      [25.506, 91.498]
    ], { color: "#f59e0b", weight: 2, dashArray: "5, 5", fillColor: "#b45309", fillOpacity: 0.25 }).addTo(map);

    // ROAD CLOSED Marker
    const marker = L.marker(center).addTo(map);

    marker.bindPopup(`
      <div style="font-family: sans-serif; font-size: 13px; color: #0f172a; padding: 4px;">
        <div style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 6px;">
          ⛔ ROAD CLOSED
        </div>
        <br/>
        <b>Location:</b> NH-6 Km 142 (East Khasi Hills)<br/>
        <b>Breach Cutoff:</b> ${breachDistanceMeters} meters danger perimeter<br/>
        <b>Status:</b> Immediate Avoidance Advised
      </div>
    `).openPopup();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, breachDistanceMeters]);

  return (
    <div
      ref={mapRef}
      style={{ height: "350px", width: "100%", borderRadius: "12px", border: "1px solid #374151" }}
      className="shadow-2xl overflow-hidden"
    />
  );
};

export default MapComponent;
