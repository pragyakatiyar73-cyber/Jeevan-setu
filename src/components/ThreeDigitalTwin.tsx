import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";
import { useTheme } from "../theme/ThemeContext";
import * as THREE from "three";
import {
  ShieldCheck,
  MapPin,
  Bot,
  Truck,
  Navigation,
  CloudRain,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Activity,
  Package,
  Sliders,
  Bell,
  FileBarChart,
  Building2,
  Compass,
  Zap,
  Layers,
  CheckCircle2,
  Clock
} from "lucide-react";
import MapComponent from "./MapComponent";
import NERLiveMapModule from "./NERLiveMapModule";
import StateRiskMatrixSection from "./StateRiskMatrixSection";

interface ThreeDigitalTwinProps {
  onNavigateToMonitoring?: () => void;
  onNavigateToImpact?: () => void;
  onNavigateToRerouting?: () => void;
  onNavigateModule?: (moduleId: string) => void;
}

// 🏔️ ALL MAJOR NORTH EASTERN 3D HIGHWAY & HILLY CORRIDORS CONFIGURATION
const HIGHWAYS_CONFIG: Record<string, {
  id: string;
  name: string;
  shortCode: string;
  state: string;
  terrainType: "rainforest" | "snow" | "river_gorge" | "pine_ridge" | "bamboo_range" | "floodplain";
  breachSector: string;
  bypassSector: string;
  blockedTitle: string;
  blockedEta: string;
  blockedDesc: string;
  bypassTitle: string;
  bypassSavings: string;
  bypassDesc: string;
  convoyName: string;
  convoyCargo: string;
  convoyRoute: string;
  convoyProgress: string;
  fogDensity: number;
  terrainHeightMod: number;
}> = {
  nh6: {
    id: "nh6",
    name: "NH-6: Meghalaya ➔ Silchar (East Khasi Hills Landslide)",
    shortCode: "NH-6 Active",
    state: "Meghalaya",
    terrainType: "rainforest",
    breachSector: "Sector 14 (Breach)",
    bypassSector: "Sector 9 (Bypass)",
    blockedTitle: "NH-6 Blocked (Km 142)",
    blockedEta: "4h 30m",
    blockedDesc: "400m landslide debris breach. Standard vehicles barred.",
    bypassTitle: "Green Corridor (Jowai Bypass)",
    bypassSavings: "-4.2 hours saved",
    bypassDesc: "Active AI bypass clear across Sector 9 ridge.",
    convoyName: "Convoy #01 (AS-01-AB-1234)",
    convoyCargo: "12T Medical Oxygen Cylinders",
    convoyRoute: "Guwahati ➔ Silchar ➔ Aizawl",
    convoyProgress: "72%",
    fogDensity: 0.006,
    terrainHeightMod: 1.0
  },
  nh13: {
    id: "nh13",
    name: "NH-13: Sela Pass ➔ Tawang (High-Altitude Snow Slurry)",
    shortCode: "NH-13 Active",
    state: "Arunachal Pradesh",
    terrainType: "snow",
    breachSector: "Sela Summit (Freeze)",
    bypassSector: "Kalaktang (Bypass)",
    blockedTitle: "NH-13 Sela Pass (3,500m MSL)",
    blockedEta: "6h 15m",
    blockedDesc: "Sub-zero blizzard snow slurry & shale rockfall.",
    bypassTitle: "Kalaktang Low-Altitude Corridor",
    bypassSavings: "-5.6 hours saved",
    bypassDesc: "Heavy 4x4 snowplow convoy route operational.",
    convoyName: "Convoy #04 (AR-01-SP-9912)",
    convoyCargo: "Emergency Rations & Cold Fuel",
    convoyRoute: "Tezpur ➔ Kalaktang ➔ Tawang",
    convoyProgress: "64%",
    fogDensity: 0.009,
    terrainHeightMod: 1.35
  },
  nh10: {
    id: "nh10",
    name: "NH-10: Teesta River Basin ➔ Gangtok (River Surge)",
    shortCode: "NH-10 Active",
    state: "Sikkim",
    terrainType: "river_gorge",
    breachSector: "Melli Basin (Surge)",
    bypassSector: "Lava Ridge (Bypass)",
    blockedTitle: "NH-10 Melli Basin Surge",
    blockedEta: "5h 00m",
    blockedDesc: "Teesta river velocity 4.2 m/s overtopping carriageway.",
    bypassTitle: "Lava High-Elevation Green Bypass",
    bypassSavings: "-3.8 hours saved",
    bypassDesc: "High-clearance medical convoy route clear.",
    convoyName: "Convoy #02 (SK-02-MD-4411)",
    convoyCargo: "Blood Plasma & Dialysis Buffer",
    convoyRoute: "Siliguri ➔ Lava ➔ Gangtok",
    convoyProgress: "81%",
    fogDensity: 0.007,
    terrainHeightMod: 1.2
  },
  nh29: {
    id: "nh29",
    name: "NH-29: Dimapur ➔ Kohima Pass (Naga Hills Ridge)",
    shortCode: "NH-29 Active",
    state: "Nagaland",
    terrainType: "pine_ridge",
    breachSector: "Pagla Pahar (Slump)",
    bypassSector: "Zubza Valley (Bypass)",
    blockedTitle: "NH-29 Pagla Pahar Mudflow",
    blockedEta: "3h 45m",
    blockedDesc: "Mudflow slump & slope subsidence blocking arterial link.",
    bypassTitle: "Zubza Valley Green Corridor",
    bypassSavings: "-2.4 hours saved",
    bypassDesc: "All-weather bypass reinforced with BRO retaining mesh.",
    convoyName: "Convoy #06 (NL-07-TR-7721)",
    convoyCargo: "Satellite Transceivers & Starlink Grid",
    convoyRoute: "Dimapur ➔ Zubza ➔ Kohima",
    convoyProgress: "58%",
    fogDensity: 0.006,
    terrainHeightMod: 0.95
  },
  nh306: {
    id: "nh306",
    name: "NH-306: Silchar ➔ Aizawl (Mizoram Bamboo Ridges)",
    shortCode: "NH-306 Active",
    state: "Mizoram",
    terrainType: "bamboo_range",
    breachSector: "Vairengte (Depression)",
    bypassSector: "Bairabi (Bypass)",
    blockedTitle: "NH-306 Vairengte Subsidence",
    blockedEta: "4h 10m",
    blockedDesc: "Heavy soil saturation & carriageway lateral crack.",
    bypassTitle: "Bairabi Railhead-Road Bypass",
    bypassSavings: "-3.1 hours saved",
    bypassDesc: "Multi-modal railhead link clear for supplies.",
    convoyName: "Convoy #03 (MZ-01-FD-3388)",
    convoyCargo: "Shelter Tarpaulins & Grain Stock",
    convoyRoute: "Silchar ➔ Bairabi ➔ Aizawl",
    convoyProgress: "69%",
    fogDensity: 0.005,
    terrainHeightMod: 0.9
  },
  nh37: {
    id: "nh37",
    name: "NH-37 / NH-715: Kaziranga Floodplain ➔ Jorhat",
    shortCode: "NH-37 Active",
    state: "Assam",
    terrainType: "floodplain",
    breachSector: "Bagori (Inundation)",
    bypassSector: "Elevated Flyover",
    blockedTitle: "NH-37 Kaziranga Flood Surge",
    blockedEta: "2h 30m",
    blockedDesc: "Brahmaputra overflow & wildlife crossing speed cap.",
    bypassTitle: "Elevated Green Flyover Corridor",
    bypassSavings: "-1.9 hours saved",
    bypassDesc: "Elevated bypass clear for rapid emergency transit.",
    convoyName: "Convoy #05 (AS-03-WP-5520)",
    convoyCargo: "Mobile Water Purifiers & Generators",
    convoyRoute: "Guwahati ➔ Bokakhat ➔ Jorhat",
    convoyProgress: "88%",
    fogDensity: 0.006,
    terrainHeightMod: 0.65
  }
};

export default function ThreeDigitalTwin({
  onNavigateToMonitoring,
  onNavigateToImpact,
  onNavigateToRerouting,
  onNavigateModule
}: ThreeDigitalTwinProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const mountRef = useRef<HTMLDivElement>(null);
  const mapSectionRef = useRef<HTMLElement | null>(null);
  const [displayMode, setDisplayMode] = useState<"3d" | "2d">("3d");
  const [focusedMapTarget, setFocusedMapTarget] = useState<{ coord: [number, number]; zoom: number } | null>(null);
  const [selectedHighwayId, setSelectedHighwayId] = useState<string>("nh6");
  const [activeZone, setActiveZone] = useState<"breach" | "corridor">("corridor");

  const currentHighway = HIGHWAYS_CONFIG[selectedHighwayId] || HIGHWAYS_CONFIG["nh6"];

  // HUD Cards Slideshow State
  const [hudSlideIndex, setHudSlideIndex] = useState<number>(0);
  const [isHudPaused, setIsHudPaused] = useState<boolean>(false);

  // Auto-cycle through the 3 HUD cards every 4.5 seconds unless paused on hover
  useEffect(() => {
    if (isHudPaused) return;
    const interval = setInterval(() => {
      setHudSlideIndex(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isHudPaused]);

  // 3D Scene Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const truckProgressRef = useRef(0);

  // Mouse orbit state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ alpha: Math.PI / 4, beta: Math.PI / 5, radius: 65 });

  const handleNav = (modId: string) => {
    if (onNavigateModule) onNavigateModule(modId);
    else if (modId === 'smartmonitoring' && onNavigateToMonitoring) onNavigateToMonitoring();
    else if (modId === 'aiimpact' && onNavigateToImpact) onNavigateToImpact();
    else if (modId === 'rerouting' && onNavigateToRerouting) onNavigateToRerouting();
  };

  useEffect(() => {
    if (!mountRef.current || displayMode !== "3d") return;

    // Helper: Generate Photorealistic Satellite Terrain Canvas Texture Based on Terrain Type
    const createPhotorealisticTerrainTexture = (terrainType: string) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const grad = ctx.createLinearGradient(0, 0, 1024, 1024);

      if (terrainType === "snow") {
        // High-Altitude Alpine Snowy Peaks (Sela Pass)
        grad.addColorStop(0, "#475569");
        grad.addColorStop(0.3, "#94a3b8");
        grad.addColorStop(0.65, "#cbd5e1");
        grad.addColorStop(0.85, "#e2e8f0");
        grad.addColorStop(1, "#f8fafc");
      } else if (terrainType === "river_gorge") {
        // Sikkim Teesta Deep River Gorge
        grad.addColorStop(0, "#0c4a6e");
        grad.addColorStop(0.25, "#0369a1");
        grad.addColorStop(0.55, "#1e3a2b");
        grad.addColorStop(0.8, "#334155");
        grad.addColorStop(1, "#1e293b");
      } else if (terrainType === "pine_ridge") {
        // Nagaland Naga Hills Pine Terraces
        grad.addColorStop(0, "#14532d");
        grad.addColorStop(0.3, "#166534");
        grad.addColorStop(0.6, "#292524");
        grad.addColorStop(0.85, "#44403c");
        grad.addColorStop(1, "#57534e");
      } else if (terrainType === "bamboo_range") {
        // Mizoram Lush Rolling Bamboo Hills
        grad.addColorStop(0, "#14532d");
        grad.addColorStop(0.35, "#15803d");
        grad.addColorStop(0.7, "#16a34a");
        grad.addColorStop(0.9, "#1e40af");
        grad.addColorStop(1, "#334155");
      } else if (terrainType === "floodplain") {
        // Assam Brahmaputra Alluvial Floodplain
        grad.addColorStop(0, "#065f46");
        grad.addColorStop(0.3, "#047857");
        grad.addColorStop(0.6, "#854d0e");
        grad.addColorStop(0.85, "#ca8a04");
        grad.addColorStop(1, "#0284c7");
      } else {
        // Meghalaya Subtropical Rainforest (NH-6 Default)
        grad.addColorStop(0, "#0a2318");
        grad.addColorStop(0.25, "#123b28");
        grad.addColorStop(0.55, "#1e4d36");
        grad.addColorStop(0.75, "#3b4538");
        grad.addColorStop(1, "#334155");
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 1024);

      // High-Density Organic Vegetation & Geological Noise
      for (let i = 0; i < 40000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = Math.random() * 2.5 + 0.8;
        const tone = Math.random();

        if (terrainType === "snow") {
          ctx.fillStyle = tone < 0.6 ? `rgba(255, 255, 255, ${Math.random() * 0.5})` : `rgba(148, 163, 184, ${Math.random() * 0.4})`;
        } else if (terrainType === "river_gorge") {
          ctx.fillStyle = tone < 0.4 ? `rgba(2, 132, 199, ${Math.random() * 0.45})` : `rgba(30, 41, 59, ${Math.random() * 0.35})`;
        } else {
          if (tone < 0.45) ctx.fillStyle = `rgba(10, 36, 24, ${Math.random() * 0.45})`;
          else if (tone < 0.8) ctx.fillStyle = `rgba(28, 75, 48, ${Math.random() * 0.35})`;
          else if (tone < 0.92) ctx.fillStyle = `rgba(110, 95, 75, ${Math.random() * 0.3})`;
          else ctx.fillStyle = `rgba(148, 163, 184, ${Math.random() * 0.25})`;
        }

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mountain River / Valley Creek Flow
      ctx.strokeStyle = terrainType === "snow" ? "rgba(186, 230, 253, 0.6)" : "rgba(56, 189, 248, 0.55)";
      ctx.lineWidth = terrainType === "river_gorge" ? 22 : 14;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(80, 0);
      ctx.bezierCurveTo(320, 260, 500, 620, 960, 1024);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 3.5;
      ctx.stroke();

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(3, 3);
      return tex;
    };

    // Helper: Procedural Bump / Normal Map for Tactile Rock Roughness
    const createTerrainBumpMap = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 20000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const val = Math.floor(Math.random() * 255);
        ctx.fillStyle = `rgb(${val},${val},${val})`;
        ctx.fillRect(x, y, 2, 2);
      }
      const bump = new THREE.CanvasTexture(canvas);
      bump.wrapS = THREE.RepeatWrapping;
      bump.wrapT = THREE.RepeatWrapping;
      bump.repeat.set(6, 6);
      return bump;
    };

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x030712 : 0xf1f5f9);
    scene.fog = new THREE.FogExp2(isDark ? 0x030712 : 0xf1f5f9, currentHighway.fogDensity);
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const radius = cameraAngleRef.current.radius;
    const alpha = cameraAngleRef.current.alpha;
    const beta = cameraAngleRef.current.beta;
    camera.position.set(
      radius * Math.sin(beta) * Math.sin(alpha),
      radius * Math.cos(beta),
      radius * Math.sin(beta) * Math.cos(alpha)
    );
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Photorealistic Sunlight & Environmental Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    sunLight.position.set(50, 75, 40);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    skyFillLight.position.set(-45, 35, -35);
    scene.add(skyFillLight);

    // 5. PHOTOREALISTIC MOUNTAIN TERRAIN (Elevation & Satellite Texture)
    const terrainGeo = new THREE.PlaneGeometry(150, 150, 80, 80);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    const heightMod = currentHighway.terrainHeightMod;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Realistic multi-frequency mountain elevation ridges
      const d1 = Math.sin(x * 0.07) * Math.cos(z * 0.07) * 9.5;
      const d2 = Math.sin(x * 0.14 + z * 0.09) * 4.2;
      const d3 = Math.cos(x * 0.04 - z * 0.03) * 5.8;
      let y = (d1 + d2 + d3) * heightMod;
      // Flatten central valley for road corridor
      if (Math.abs(z + 1.8 * x) < 28) y *= 0.22;
      posAttr.setY(i, y - 5.5);
    }
    terrainGeo.computeVertexNormals();

    const satelliteTex = createPhotorealisticTerrainTexture(currentHighway.terrainType);
    const bumpTex = createTerrainBumpMap();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: satelliteTex || undefined,
      bumpMap: bumpTex || undefined,
      bumpScale: 0.6,
      roughness: 0.7,
      metalness: 0.1,
      flatShading: false
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    scene.add(terrainMesh);

    // Subtle Tactical Contour Grid Overlay
    const contourMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const contourMesh = new THREE.Mesh(terrainGeo, contourMat);
    contourMesh.position.y += 0.08;
    scene.add(contourMesh);

    // 6. CENTRAL COMMAND DOPPLER RADAR HUB TOWER
    const towerGroup = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(2, 3.4, 30, 32);
    const towerMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      roughness: 0.3,
      metalness: 0.8
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 15;
    tower.castShadow = true;
    towerGroup.add(tower);

    // Rotating Holographic Satellite Dish Rings
    const ringGeo1 = new THREE.RingGeometry(6.5, 7.2, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 26, 0);
    towerGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(9.8, 10.3, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2.2;
    ring2.position.set(0, 28, 0);
    towerGroup.add(ring2);

    scene.add(towerGroup);

    // 7. GREEN AI CORRIDOR BYPASS ROAD (Asphalt Surface with Glowing Lane Guides)
    const greenCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-58, 1, -12),
      new THREE.Vector3(-32, 1.6, -26),
      new THREE.Vector3(0, 2.2, -20),
      new THREE.Vector3(30, 1.8, 8),
      new THREE.Vector3(58, 1.2, 28)
    ]);
    const greenGeo = new THREE.TubeGeometry(greenCurve, 90, 1.8, 16, false);
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x047857,
      roughness: 0.4,
      metalness: 0.5
    });
    const greenRoad = new THREE.Mesh(greenGeo, greenMat);
    scene.add(greenRoad);

    // 8. RED DISRUPTED ROAD (Km 142 Landslide Breach)
    const redCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-58, 1, -12),
      new THREE.Vector3(-36, 1.2, 16),
      new THREE.Vector3(-18, 1.8, 28),
      new THREE.Vector3(6, 1.2, 26)
    ]);
    const redGeo = new THREE.TubeGeometry(redCurve, 90, 1.8, 16, false);
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      roughness: 0.4,
      metalness: 0.4
    });
    const redRoad = new THREE.Mesh(redGeo, redMat);
    scene.add(redRoad);

    // 3D REALISTIC LANDSLIDE & ROCKFALL BOULDER DEBRIS CLUSTER
    const debrisGroup = new THREE.Group();
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });

    const boulderOffsets = [
      { x: -18, y: 3.2, z: 28, scale: 3.8 },
      { x: -16, y: 2.2, z: 30, scale: 2.6 },
      { x: -20, y: 2.4, z: 26, scale: 2.4 },
      { x: -17, y: 1.6, z: 26, scale: 1.8 },
      { x: -19, y: 1.8, z: 31, scale: 2.0 }
    ];

    boulderOffsets.forEach(b => {
      const rockGeo = new THREE.DodecahedronGeometry(b.scale, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(b.x, b.y, b.z);
      rock.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      rock.castShadow = true;
      debrisGroup.add(rock);
    });

    // Pulsing Hazard Radar Ring & Warning Column
    const alertRingGeo = new THREE.RingGeometry(6, 7.2, 48);
    const alertRingMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
    const alertRing = new THREE.Mesh(alertRingGeo, alertRingMat);
    alertRing.rotation.x = Math.PI / 2;
    alertRing.position.set(-18, 0.9, 28);
    debrisGroup.add(alertRing);

    scene.add(debrisGroup);

    // 9. HIGH-TECH 3D RECON UAV DRONE (With Spinning Rotors & Laser Scanner)
    const droneGroup = new THREE.Group();
    const droneBodyGeo = new THREE.BoxGeometry(3.2, 0.7, 3.2);
    const droneBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.9 });
    const droneBody = new THREE.Mesh(droneBodyGeo, droneBodyMat);
    droneGroup.add(droneBody);

    // Drone Navigation LED
    const droneLedGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const droneLedMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const droneLed = new THREE.Mesh(droneLedGeo, droneLedMat);
    droneLed.position.set(0, 0.5, 0);
    droneGroup.add(droneLed);

    // 4 High-Speed Rotor Blades
    const rotorMeshes: THREE.Mesh[] = [];
    const rotorGeo = new THREE.BoxGeometry(2.4, 0.05, 0.35);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });
    const rotorPositions = [[-2.2, 0.45, -2.2], [2.2, 0.45, -2.2], [-2.2, 0.45, 2.2], [2.2, 0.45, 2.2]];
    rotorPositions.forEach(p => {
      const r = new THREE.Mesh(rotorGeo, rotorMat);
      r.position.set(p[0], p[1], p[2]);
      droneGroup.add(r);
      rotorMeshes.push(r);
    });

    // Downward Volumetric Holographic Laser Scanning Cone
    const radarConeGeo = new THREE.ConeGeometry(9, 24, 32, 1, true);
    const radarConeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide
    });
    const radarCone = new THREE.Mesh(radarConeGeo, radarConeMat);
    radarCone.rotation.x = Math.PI;
    radarCone.position.set(0, -12, 0);
    droneGroup.add(radarCone);

    droneGroup.position.set(-18, 28, 28);
    scene.add(droneGroup);

    // 10. REALISTIC 3D RELIEF CONVOY TRUCK WITH FUNCTIONAL HEADLIGHTS
    const truckGroup = new THREE.Group();
    
    // Truck Driver Cabin
    const cabGeo = new THREE.BoxGeometry(3.0, 2.4, 2.6);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.8 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(1.5, 1.2, 0);
    cab.castShadow = true;
    truckGroup.add(cab);

    // Windshield Glass
    const glassGeo = new THREE.BoxGeometry(1.2, 1.1, 2.4);
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(2.45, 1.4, 0);
    truckGroup.add(glass);

    // Emergency Oxygen Tank Cargo Bed
    const tankGeo = new THREE.CylinderGeometry(1.4, 1.4, 6.0, 24);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.6 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(-2.8, 1.5, 0);
    tank.castShadow = true;
    truckGroup.add(tank);

    // 6 Treaded Rubber Wheels with Hubs
    const wheelMeshes: THREE.Mesh[] = [];
    const wheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.45, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const wheelPositions = [
      [2.2, 0.45, 1.4], [2.2, 0.45, -1.4],
      [-1.8, 0.45, 1.4], [-1.8, 0.45, -1.4],
      [-4.0, 0.45, 1.4], [-4.0, 0.45, -1.4]
    ];
    wheelPositions.forEach(p => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(p[0], p[1], p[2]);
      truckGroup.add(w);
      wheelMeshes.push(w);
    });

    // Dual Front Headlight Spotlights
    const headlight1 = new THREE.SpotLight(0xfef08a, 4, 35, Math.PI / 5, 0.5);
    headlight1.position.set(3.0, 1.2, 1.0);
    headlight1.target.position.set(18, 0, 1.0);
    truckGroup.add(headlight1);
    truckGroup.add(headlight1.target);

    const headlight2 = new THREE.SpotLight(0xfef08a, 4, 35, Math.PI / 5, 0.5);
    headlight2.position.set(3.0, 1.2, -1.0);
    headlight2.target.position.set(18, 0, -1.0);
    truckGroup.add(headlight2);
    truckGroup.add(headlight2.target);

    scene.add(truckGroup);

    // 11. ATMOSPHERIC MOUNTAIN VALLEY FOG & WEATHER PARTICLES
    const fogParticleCount = 80;
    const fogGeo = new THREE.BufferGeometry();
    const fogPositions = new Float32Array(fogParticleCount * 3);
    for (let i = 0; i < fogParticleCount; i++) {
      fogPositions[i * 3] = (Math.random() - 0.5) * 140;
      fogPositions[i * 3 + 1] = Math.random() * 12 + 1;
      fogPositions[i * 3 + 2] = (Math.random() - 0.5) * 140;
    }
    fogGeo.setAttribute("position", new THREE.BufferAttribute(fogPositions, 3));
    const fogMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 4.5,
      transparent: true,
      opacity: 0.28
    });
    const fogParticles = new THREE.Points(fogGeo, fogMat);
    scene.add(fogParticles);

    // 12. GREEN BYPASS ENERGY PULSE TRAIL
    const particleCount = 140;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const tVal = Math.random();
      const p = greenCurve.getPointAt(tVal);
      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = p.y + 0.9;
      particlePositions[i * 3 + 2] = p.z;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.9,
      transparent: true,
      opacity: 0.9
    });
    const particleSystem = new THREE.Points(particlesGeo, particleMat);
    scene.add(particleSystem);

    // Mouse Controls Event Listeners
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.alpha -= deltaX * 0.005;
      cameraAngleRef.current.beta = Math.max(0.1, Math.min(Math.PI / 2.2, cameraAngleRef.current.beta - deltaY * 0.005));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const domElement = renderer.domElement;
    domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // 13. High-Performance 60 FPS Render & Physics Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate Satellite Radar Rings
      ring1.rotation.z += 0.018;
      ring2.rotation.z -= 0.012;

      // Pulsing Hazard Warning Beacon
      alertRing.rotation.z += 0.025;
      const pulseScale = 1 + Math.sin(elapsedTime * 4.5) * 0.18;
      alertRing.scale.set(pulseScale, pulseScale, 1);

      // Spin Drone Propellers at High Speed & Oscillate Laser Scanner
      rotorMeshes.forEach(r => {
        r.rotation.y += 0.45;
      });
      droneGroup.position.y = 28 + Math.sin(elapsedTime * 2) * 1.2;
      radarCone.rotation.y += 0.04;

      // Move Convoy Truck Smoothly along Green Bypass Route
      truckProgressRef.current = (truckProgressRef.current + 0.0019) % 1;
      const pos = greenCurve.getPointAt(truckProgressRef.current);
      const tangent = greenCurve.getTangentAt(truckProgressRef.current);
      truckGroup.position.copy(pos);
      truckGroup.lookAt(pos.clone().add(tangent));

      // Rotate Truck Wheels in sync with driving speed
      wheelMeshes.forEach(w => {
        w.rotation.y += 0.08;
      });

      // Slowly Drift Atmospheric Valley Fog
      const fogPosAttr = fogGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < fogParticleCount; i++) {
        let fx = fogPosAttr.getX(i) + 0.04;
        if (fx > 70) fx = -70;
        fogPosAttr.setX(i, fx);
      }
      fogPosAttr.needsUpdate = true;

      // Continuous Slow Camera Orbit when User is not Dragging
      if (!isDraggingRef.current) {
        cameraAngleRef.current.alpha += 0.0008;
      }

      const rad = cameraAngleRef.current.radius;
      const a = cameraAngleRef.current.alpha;
      const b = cameraAngleRef.current.beta;
      camera.position.set(
        rad * Math.sin(b) * Math.sin(a),
        rad * Math.cos(b),
        rad * Math.sin(b) * Math.cos(a)
      );

      // Smooth Camera Focus Based on Active Zone Selection
      const targetLookAt = activeZone === "breach" ? new THREE.Vector3(-18, 3, 28) : new THREE.Vector3(0, 4, 0);
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 480;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [displayMode, activeZone, selectedHighwayId, isDark]);

  return (
    <div className="space-y-6 select-none">
      {/* 3D SIMULATION / 2D MAP DIGITAL TWIN CONTAINER */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 sm:p-5 lg:p-7 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30 shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                {t("dashboard.liveRegionMap", "Live Region Map • Live Satellite & Radar")}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 italic hidden md:inline font-sans font-medium">{t("dashboard.smartDecisions", "\"Smart decisions today, safer tomorrow.\"")}</span>
            </div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1 leading-snug">
              {t("dashboard.overviewTitle", "North Eastern Region Accessibility & Logistics Overview")}
            </h2>
          </div>

          {/* Controls Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
            <button
              onClick={() => handleNav('staterisk')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-amber-600 to-emerald-600 hover:brightness-110 text-white font-extrabold text-xs lg:text-sm shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer transition shrink-0"
              title="Open Dedicated Regional State Risk Matrix Tab"
            >
              <span>📊</span> <span>State Risk Matrix</span>
            </button>

            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#040814] p-1.5 border border-slate-200 dark:border-slate-800 text-xs lg:text-sm font-bold">
              <button
                onClick={() => setDisplayMode("3d")}
                className={"px-4 py-2 rounded-lg font-black transition flex items-center gap-2 cursor-pointer " + (
                  displayMode === "3d" ? "bg-sky-500 text-white dark:text-slate-950 shadow-lg shadow-sky-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span>🎮</span> <span>{t("dashboard.sim3d", "3D SIMULATION")}</span>
              </button>
              <button
                onClick={() => setDisplayMode("2d")}
                className={"px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer " + (
                  displayMode === "2d" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <span>🗺️</span> <span>{t("dashboard.map2d", "2D Map")}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area: 3D Simulation WebGL OR 2D GIS Leaflet Map */}
        {displayMode === "3d" ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl h-[460px] lg:h-[540px]">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Zone Status Pills Overlay & Highway Corridor Switcher */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2.5">
              {/* Highway Sector Switcher */}
              <div className="relative">
                <select
                  value={selectedHighwayId}
                  onChange={(e) => setSelectedHighwayId(e.target.value)}
                  className="rounded-xl bg-slate-900/90 text-white border border-sky-500/60 px-3.5 py-2 text-xs lg:text-sm font-black shadow-xl backdrop-blur cursor-pointer hover:border-sky-400 transition"
                >
                  <option value="nh6">🏔️ NH-6: Meghalaya ➔ Silchar</option>
                  <option value="nh13">❄️ NH-13: Sela Pass ➔ Tawang</option>
                  <option value="nh10">🌊 NH-10: Teesta Basin ➔ Gangtok</option>
                  <option value="nh29">🌲 NH-29: Dimapur ➔ Kohima</option>
                  <option value="nh306">🌄 NH-306: Silchar ➔ Aizawl</option>
                  <option value="nh37">🦏 NH-37: Kaziranga Floodplain</option>
                </select>
              </div>

              <button
                onClick={() => setActiveZone("breach")}
                className={"px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer " + (
                  activeZone === "breach"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40"
                    : "bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white backdrop-blur"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                {currentHighway.breachSector}
              </button>

              <button
                onClick={() => setActiveZone("corridor")}
                className={"px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer " + (
                  activeZone === "corridor"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
                    : "bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white backdrop-blur"
                )}
              >
                <Navigation className="h-4 w-4" />
                {currentHighway.bypassSector}
              </button>

              <span className="rounded-xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 px-3.5 py-2 text-xs lg:text-sm text-sky-600 dark:text-sky-400 font-mono font-bold backdrop-blur hidden sm:inline">
                {currentHighway.shortCode}
              </span>
            </div>

            {/* Right Side HUD Cards Slideshow */}
            <div 
              onMouseEnter={() => setIsHudPaused(true)}
              onMouseLeave={() => setIsHudPaused(false)}
              className="absolute top-4 right-4 z-20 w-80 space-y-2"
            >
              {/* Active Slide Card with Smooth Transition */}
              <div className="relative min-h-[92px]">
                {hudSlideIndex === 0 && (
                  <div className="rounded-2xl border border-rose-500/40 bg-white/95 dark:bg-rose-950/85 p-4 backdrop-blur shadow-xl space-y-1.5 animate-in fade-in zoom-in-95 duration-200 transition-all">
                    <div className="flex items-center justify-between text-xs lg:text-sm">
                      <span className="font-extrabold text-rose-600 dark:text-rose-300">{currentHighway.blockedTitle}</span>
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-black">{currentHighway.blockedEta}</span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-800 dark:text-slate-200 font-medium">{currentHighway.blockedDesc}</p>
                  </div>
                )}

                {hudSlideIndex === 1 && (
                  <div className="rounded-2xl border border-emerald-500/40 bg-white/95 dark:bg-emerald-950/85 p-4 backdrop-blur shadow-xl space-y-1.5 animate-in fade-in zoom-in-95 duration-200 transition-all">
                    <div className="flex items-center justify-between text-xs lg:text-sm">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{currentHighway.bypassTitle}</span>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-black">{currentHighway.bypassSavings}</span>
                    </div>
                    <p className="text-xs lg:text-sm text-slate-800 dark:text-slate-200 font-medium">{currentHighway.bypassDesc}</p>
                  </div>
                )}

                {hudSlideIndex === 2 && (
                  <div className="rounded-2xl border border-sky-500/40 bg-white/95 dark:bg-sky-950/85 p-4 backdrop-blur shadow-xl flex items-center justify-between text-xs lg:text-sm min-h-[92px] animate-in fade-in zoom-in-95 duration-200 transition-all">
                    <div>
                      <span className="text-sky-700 dark:text-sky-300 font-extrabold flex items-center gap-2">
                        <Truck className="h-4 w-4" /> {currentHighway.convoyName}
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">{currentHighway.convoyRoute}</p>
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-base">{currentHighway.convoyProgress}</span>
                  </div>
                )}
              </div>

              {/* Slideshow Navigation Bar (Prev / Next & Dots) */}
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur border border-slate-700/60 text-white shadow-lg">
                <button
                  onClick={() => setHudSlideIndex(prev => (prev - 1 + 3) % 3)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Previous Slide"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(idx => (
                    <button
                      key={idx}
                      onClick={() => setHudSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        hudSlideIndex === idx ? 'w-5 bg-sky-400' : 'w-1.5 bg-slate-500 hover:bg-slate-300'
                      }`}
                      title={`Go to slide ${idx + 1}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setHudSlideIndex(prev => (prev + 1) % 3)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Next Slide"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bottom 3D Helper Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-950/85 px-5 py-1.5 text-xs lg:text-sm font-semibold text-slate-800 dark:text-slate-300 backdrop-blur shadow-lg">
              {t("dashboard.dragMouseOrbit", "Drag Mouse to Orbit 3D • Bearing: 042° N")}
            </div>
          </div>
        ) : (
          <div className="h-[460px] lg:h-[540px] rounded-2xl overflow-hidden relative">
            <NERLiveMapModule 
              hideHeader={true}
              focusedTarget={focusedMapTarget}
              onNavigateTo3DSim={() => setDisplayMode("3d")} 
            />
          </div>
        )}
      </section>

      {/* 3-COLUMN MIDDLE PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: WEATHER INTELLIGENCE */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs lg:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <CloudRain className="h-4.5 w-4.5 text-sky-500 dark:text-sky-400" /> WEATHER INTELLIGENCE
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">Open-Meteo Live</span>
            </div>

            <select className="w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs lg:text-sm font-bold text-slate-900 dark:text-white focus:border-sky-500 focus:outline-none">
              <option>Shillong, Meghalaya</option>
              <option>Guwahati, Assam</option>
              <option>Aizawl, Mizoram</option>
              <option>Gangtok, Sikkim</option>
              <option>Imphal, Manipur</option>
            </select>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white">21.8°C</div>
                <div className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 font-medium">Shillong, Meghalaya</div>
              </div>
              <div className="text-right">
                <div className="text-sm lg:text-base font-bold text-sky-600 dark:text-sky-400">16.4 mm/hr Rain</div>
                <div className="text-xs text-slate-500 font-semibold">Wind: 28 km/h</div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToMonitoring}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs lg:text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Open 5-Day Radar Forecast ➔
          </button>
        </div>

        {/* Panel 2: RECENT CRITICAL ALERTS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs lg:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-500 dark:text-rose-400" /> RECENT CRITICAL ALERTS
              </span>
              <span className="text-xs text-slate-500 font-semibold">Auto-refresh in 30s</span>
            </div>

            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/20 p-4 space-y-1.5">
              <div className="flex items-center justify-between text-xs lg:text-sm">
                <span className="font-extrabold text-rose-700 dark:text-rose-300">NH-24 Submerged (Km 142)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">2 min ago</span>
              </div>
              <p className="text-xs lg:text-sm text-slate-800 dark:text-slate-200 font-medium">Water hazard barrier. Sector 9 bypass active.</p>
            </div>
          </div>

          <button
            onClick={onNavigateToMonitoring}
            className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs lg:text-sm font-bold text-sky-600 dark:text-sky-400 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center gap-2 cursor-pointer"
          >
            View All 14 Alerts ➔
          </button>
        </div>

        {/* Panel 3: AI PREDICTION */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl space-y-4 flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <span className="text-xs lg:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Bot className="h-4.5 w-4.5 text-indigo-500 dark:text-indigo-400" /> AI PREDICTION <span className="text-xs text-slate-500">1 / 2</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-black">scikit-learn &bull; Gemini</span>
              </div>
            </div>

            <div className="space-y-2 text-xs lg:text-sm">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs lg:text-sm">
                <span>📍 NONKEY & IRANG VALLEY, MANIPUR</span>
              </div>
              <div className="font-bold text-slate-800 dark:text-slate-200 leading-snug">Debris flow potential in Irang river catchment basin. Heavy silt accumulation creating localized flash damming risks.</div>
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Landslide Hazard (LHI):</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">68.4% (HIGH RISK)</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '68.4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToImpact}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs lg:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Inspect Hazard Model ➔
          </button>
        </div>
      </div>

      {/* SECTION: BOTTOM 4-PANEL TELEMETRY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Panel 1: LIVE VEHICLE TRACKING */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              {t("dashboard.liveVehicleTracking", "LIVE VEHICLE TRACKING")}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">45 km/h</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white text-[11px]">{t("dashboard.convoyRoute", "Convoy #01: AS-01-AB-1234 (Guwahati ➔ Aizawl)")}</div>
            <span className="inline-block rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold">
              {t("dashboard.convoyCargo", "12T Medical Oxygen Cylinders (Class 1)")}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" style={{ width: '42%' }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>{t("dashboard.progress", "Progress:")} 42%</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t("dashboard.eta", "ETA Aizawl: 3h 15m (NH-27)")}</span>
            </div>
          </div>
        </div>

        {/* Panel 2: DELIVERY STATUS (NER) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🍩</span> {t("dashboard.deliveryStatus", "DELIVERY STATUS (NER)")}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">367 {t("dashboard.total", "Total")}</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Donut Metric Visual */}
            <div className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-sky-500 border-r-amber-500 flex items-center justify-center font-black text-slate-900 dark:text-white text-sm shrink-0">
              367
            </div>

            <div className="space-y-1 text-[11px] flex-1">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> {t("dashboard.delivered", "Delivered:")}</span>
                <b>58% (213)</b>
              </div>
              <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span> {t("dashboard.inTransit", "In Transit:")}</span>
                <b>29% (112)</b>
              </div>
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> {t("dashboard.pending", "Pending:")}</span>
                <b>13% (48)</b>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: DISRUPTED CORRIDORS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> {t("dashboard.disruptedCorridors", "DISRUPTED CORRIDORS")}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[9px] font-bold">4 {t("dashboard.impacted", "Impacted")}</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t("dashboard.nh6Landslide", "NH-6 Landslide (Km 142)")}</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">🔴 {t("dashboard.critical", "Critical")}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t("dashboard.nh13SelaPass", "NH-13 Sela Pass (3,500m)")}</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">🔴 {t("dashboard.critical", "Critical")}</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">{t("dashboard.nh10Melli", "NH-10 Melli Teesta Basin")}</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">🟡 {t("dashboard.high", "High")}</span>
            </div>
          </div>
        </div>

        {/* Panel 4: SUPPLIES IN TRANSIT */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🏷️</span> {t("dashboard.suppliesInTransit", "SUPPLIES IN TRANSIT")}
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">745 MT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{t("dashboard.medicalOxygen", "Medical Oxygen")}</span>
              <b className="text-slate-900 dark:text-white text-xs">120 {t("dashboard.tons", "Tons")}</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{t("dashboard.foodGrains", "Food Grains")}</span>
              <b className="text-amber-600 dark:text-amber-400 text-xs">340 {t("dashboard.tons", "Tons")}</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{t("dashboard.emergencyFuel", "Emergency Fuel")}</span>
              <b className="text-emerald-600 dark:text-emerald-400 text-xs">85 KL</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">{t("dashboard.shelterKits", "Shelter Kits")}</span>
              <b className="text-indigo-600 dark:text-indigo-300 text-xs">200 {t("dashboard.tons", "Tons")}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
