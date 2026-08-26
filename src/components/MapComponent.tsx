import React, { useEffect, useRef } from "react";
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

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: false }).setView(center, zoom);
    mapInstanceRef.current = map;

    // Satellite Tile Layer (Esri World Imagery) to match uploaded mock screenshot exactly
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Esri Satellite Imagery"
    }).addTo(map);

    // Yellow Highway Polyline (NH-6 Corridor)
    const nh6Road = L.polyline([
      [25.500, 91.480],
      [25.508, 91.492],
      [25.512, 91.500],
      [25.515, 91.508],
      [25.522, 91.520]
    ], {
      color: "#eab308",
      weight: 5,
      opacity: 0.95
    }).addTo(map);

    // Red Hazard Polygon (350m Breach Zone)
    const breachPolygon = L.polygon([
      [25.515, 91.494],
      [25.518, 91.506],
      [25.510, 91.512],
      [25.505, 91.498]
    ], {
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 0.45,
      weight: 2
    }).addTo(map);

    // ROAD CLOSED Marker Badge
    const roadClosedIcon = L.divIcon({
      className: "custom-road-closed-badge",
      html: `
        <div style="
          background: #dc2626;
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.6);
          border: 1px solid #f87171;
          white-space: nowrap;
          text-align: center;
        ">
          ROAD CLOSED
        </div>
      `,
      iconSize: [110, 30],
      iconAnchor: [55, 15]
    });

    L.marker([25.514, 91.502], { icon: roadClosedIcon }).addTo(map);

    // Breach 350m label overlay inside polygon
    const breachTextIcon = L.divIcon({
      className: "custom-breach-label",
      html: `
        <div style="
          color: #ffffff;
          font-weight: 700;
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

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ height: "260px", width: "100%", borderRadius: "12px" }}
      className="shadow-xl overflow-hidden border border-slate-800"
    />
  );
};

export default MapComponent;
