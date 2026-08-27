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

interface ThreeDigitalTwinProps {
  onNavigateToMonitoring?: () => void;
  onNavigateToImpact?: () => void;
  onNavigateToRerouting?: () => void;
  onNavigateModule?: (moduleId: string) => void;
}

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
  const [displayMode, setDisplayMode] = useState<"3d" | "2d">("3d");
  const [activeZone, setActiveZone] = useState<"breach" | "corridor">("corridor");

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

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x040814 : 0xf8fafc);
    scene.fog = new THREE.FogExp2(isDark ? 0x040814 : 0xf8fafc, 0.007);
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
    container.appendChild(renderer.domElement);

    // 4. Lighting & Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    mainLight.position.set(40, 60, 30);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0x6366f1, 1.2);
    rimLight.position.set(-40, 30, -30);
    scene.add(rimLight);

    // 5. MOUNTAIN TERRAIN MESH (3D Topography Grid)
    const terrainGeo = new THREE.PlaneGeometry(140, 140, 70, 70);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Generate mountain ridges and valleys
      const d1 = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 8;
      const d2 = Math.sin(x * 0.15 + z * 0.1) * 4;
      const d3 = Math.cos(x * 0.05) * 5;
      let y = d1 + d2 + d3;
      // Flatten central valley for road corridor
      if (Math.abs(z + 2 * x) < 25) y *= 0.25;
      posAttr.setY(i, y - 6);
    }
    terrainGeo.computeVertexNormals();

    // Solid Terrain Material
    const terrainMat = new THREE.MeshPhongMaterial({
      color: 0x081026,
      emissive: 0x030816,
      shininess: 10,
      flatShading: true
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // Wireframe Overlay for Holographic Tactical Look
    const wireframeMat = new THREE.MeshBasicMaterial({
      color: 0x1e3a8a,
      wireframe: true,
      transparent: true,
      opacity: 0.25
    });
    const wireframeMesh = new THREE.Mesh(terrainGeo, wireframeMat);
    wireframeMesh.position.y += 0.1;
    scene.add(wireframeMesh);

    // 6. CENTRAL COMMAND HUB TOWER
    const towerGroup = new THREE.Group();
    const towerGeo = new THREE.CylinderGeometry(2, 3.2, 28, 32);
    const towerMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      transparent: true,
      opacity: 0.85
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.y = 14;
    towerGroup.add(tower);

    // Rotating Holographic Satellite Dish Rings
    const ringGeo1 = new THREE.RingGeometry(6, 6.6, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 24, 0);
    towerGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(9, 9.4, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0x818cf8, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 2.2;
    ring2.position.set(0, 26, 0);
    towerGroup.add(ring2);

    scene.add(towerGroup);

    // 7. GREEN AI CORRIDOR BYPASS ROAD
    const greenCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-55, 1, -10),
      new THREE.Vector3(-30, 1.5, -24),
      new THREE.Vector3(0, 2, -18),
      new THREE.Vector3(28, 1.5, 8),
      new THREE.Vector3(55, 1, 26)
    ]);
    const greenGeo = new THREE.TubeGeometry(greenCurve, 80, 1.6, 12, false);
    const greenMat = new THREE.MeshPhongMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      shininess: 80
    });
    const greenRoad = new THREE.Mesh(greenGeo, greenMat);
    scene.add(greenRoad);

    // 8. RED DISRUPTED ROAD (Km 142 Landslide Breach)
    const redCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-55, 1, -10),
      new THREE.Vector3(-35, 1, 16),
      new THREE.Vector3(-18, 1.5, 26),
      new THREE.Vector3(5, 1, 24)
    ]);
    const redGeo = new THREE.TubeGeometry(redCurve, 80, 1.6, 12, false);
    const redMat = new THREE.MeshPhongMaterial({
      color: 0xf43f5e,
      emissive: 0xbe123c,
      shininess: 60
    });
    const redRoad = new THREE.Mesh(redGeo, redMat);
    scene.add(redRoad);

    // Landslide Debris Blockage & Pulsing Hazard Marker
    const debrisGroup = new THREE.Group();
    const debrisGeo = new THREE.DodecahedronGeometry(3.5, 1);
    const debrisMat = new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0x991b1b, flatShading: true });
    const debris = new THREE.Mesh(debrisGeo, debrisMat);
    debris.position.set(-18, 3, 26);
    debrisGroup.add(debris);

    // Hazard Alert Beacon Circle
    const alertRingGeo = new THREE.RingGeometry(5, 5.8, 48);
    const alertRingMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
    const alertRing = new THREE.Mesh(alertRingGeo, alertRingMat);
    alertRing.rotation.x = Math.PI / 2;
    alertRing.position.set(-18, 0.8, 26);
    debrisGroup.add(alertRing);

    scene.add(debrisGroup);

    // 9. HIGH-TECH 3D UAV RECON DRONE WITH SCANNING RADAR CONE
    const droneGroup = new THREE.Group();
    const droneBodyGeo = new THREE.BoxGeometry(3, 0.6, 3);
    const droneBodyMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const droneBody = new THREE.Mesh(droneBodyGeo, droneBodyMat);
    droneGroup.add(droneBody);

    // 4 Drone Rotors
    const rotorGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
    const rotorMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const rotorPositions = [[-2, 0.4, -2], [2, 0.4, -2], [-2, 0.4, 2], [2, 0.4, 2]];
    rotorPositions.forEach(p => {
      const r = new THREE.Mesh(rotorGeo, rotorMat);
      r.position.set(p[0], p[1], p[2]);
      droneGroup.add(r);
    });

    // Downward Volumetric Radar Beam Cone
    const radarConeGeo = new THREE.ConeGeometry(8, 22, 32, 1, true);
    const radarConeMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const radarCone = new THREE.Mesh(radarConeGeo, radarConeMat);
    radarCone.rotation.x = Math.PI;
    radarCone.position.set(0, -11, 0);
    droneGroup.add(radarCone);

    droneGroup.position.set(-18, 26, 26);
    scene.add(droneGroup);

    // 10. DETAILED 3D CONVOY TRUCK VEHICLE WITH HEADLIGHTS
    const truckGroup = new THREE.Group();
    // Cab
    const cabGeo = new THREE.BoxGeometry(2.8, 2.2, 2.4);
    const cabMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x0369a1 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(1.4, 1.1, 0);
    truckGroup.add(cab);

    // Tanker Body
    const tankGeo = new THREE.CylinderGeometry(1.3, 1.3, 5.5, 20);
    const tankMat = new THREE.MeshPhongMaterial({ color: 0x10b981, emissive: 0x047857 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(-2.5, 1.4, 0);
    truckGroup.add(tank);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x1e293b });
    const wheelPositions = [[2, 0.4, 1.3], [2, 0.4, -1.3], [-1.5, 0.4, 1.3], [-1.5, 0.4, -1.3], [-3.5, 0.4, 1.3], [-3.5, 0.4, -1.3]];
    wheelPositions.forEach(p => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(p[0], p[1], p[2]);
      truckGroup.add(w);
    });

    scene.add(truckGroup);

    // 11. ENERGY PARTICLE SYSTEM ALONG GREEN BYPASS ROUTE
    const particleCount = 120;
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const tVal = Math.random();
      const p = greenCurve.getPointAt(tVal);
      particlePositions[i * 3] = p.x;
      particlePositions[i * 3 + 1] = p.y + 0.8;
      particlePositions[i * 3 + 2] = p.z;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.8,
      transparent: true,
      opacity: 0.85
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

    // 12. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Rotate Satellite Rings
      ring1.rotation.z += 0.015;
      ring2.rotation.z -= 0.01;

      // Rotate Hazard Alert Ring
      alertRing.rotation.z += 0.02;
      const pulseScale = 1 + Math.sin(elapsedTime * 4) * 0.15;
      alertRing.scale.set(pulseScale, pulseScale, 1);

      // Rotate Drone & Radar Scan Beam
      droneGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.3;
      radarCone.rotation.y += 0.03;

      // Move Convoy Truck smoothly along Green Curve
      truckProgressRef.current = (truckProgressRef.current + 0.0018) % 1;
      const pos = greenCurve.getPointAt(truckProgressRef.current);
      const tangent = greenCurve.getTangentAt(truckProgressRef.current);
      truckGroup.position.copy(pos);
      truckGroup.lookAt(pos.clone().add(tangent));

      // Continuous slow camera orbit when user is not dragging
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

      // Smooth camera focus based on activeZone
      const targetLookAt = activeZone === "breach" ? new THREE.Vector3(-18, 3, 26) : new THREE.Vector3(0, 4, 0);
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
  }, [displayMode, activeZone]);

  return (
    <div className="space-y-6 select-none">
      {/* 3D SIMULATION / 2D MAP DIGITAL TWIN CONTAINER */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-5 lg:p-7 shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs lg:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 border border-emerald-500/30">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                Live Region Map &bull; Live Satellite & Radar
              </span>
              <span className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 italic hidden sm:inline font-sans font-medium">"Smart decisions today, safer tomorrow."</span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mt-1.5">North Eastern Region Accessibility & Logistics Overview</h2>
          </div>

          {/* Controls Mode Switcher */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-[#040814] p-1.5 border border-slate-200 dark:border-slate-800 text-xs lg:text-sm font-bold">
              <button
                onClick={() => setDisplayMode("3d")}
                className={"px-4 py-2 rounded-lg font-black transition flex items-center gap-2 cursor-pointer " + (
                  displayMode === "3d" ? "bg-sky-500 text-white dark:text-slate-950 shadow-lg shadow-sky-500/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                🎮 3D SIMULATION
              </button>
              <button
                onClick={() => setDisplayMode("2d")}
                className={"px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 cursor-pointer " + (
                  displayMode === "2d" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                🗺️ 2D Map
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area: 3D Simulation WebGL OR 2D GIS Leaflet Map */}
        {displayMode === "3d" ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl h-[460px] lg:h-[540px]">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Zone Status Pills Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2.5">
              <button
                onClick={() => setActiveZone("breach")}
                className={"px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer " + (
                  activeZone === "breach"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40"
                    : "bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white backdrop-blur"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                {t("dashboard.sectorBreach", "Sector 14 (Breach)")}
              </button>

              <button
                onClick={() => setActiveZone("corridor")}
                className={"px-3.5 py-2 rounded-xl text-xs lg:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer " + (
                  activeZone === "corridor"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
                    : "bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white backdrop-blur"
                )}
              >
                <Navigation className="h-4 w-4" />
                {t("dashboard.sectorBypass", "Sector 9 (Bypass)")}
              </button>

              <span className="rounded-xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 px-3.5 py-2 text-xs lg:text-sm text-sky-600 dark:text-sky-400 font-mono font-bold backdrop-blur">
                {t("dashboard.nh6Active", "NH-6 Active")}
              </span>
            </div>

            {/* Right Side HUD Cards */}
            <div className="absolute top-4 right-4 z-20 w-80 space-y-3">
              <div className="rounded-2xl border border-rose-500/40 bg-white/95 dark:bg-rose-950/85 p-4 backdrop-blur shadow-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="font-extrabold text-rose-600 dark:text-rose-300">{t("dashboard.nh6Blocked", "NH-6 Blocked (Km 142)")}</span>
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-black">4h 30m</span>
                </div>
                <p className="text-xs lg:text-sm text-slate-800 dark:text-slate-200 font-medium">{t("dashboard.nh6BlockedDesc", "Landslide debris breach. Standard vehicles barred.")}</p>
              </div>

              <div className="rounded-2xl border border-emerald-500/40 bg-white/95 dark:bg-emerald-950/85 p-4 backdrop-blur shadow-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs lg:text-sm">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{t("dashboard.greenCorridor", "Green Corridor (Jowai Bypass)")}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-black">{t("dashboard.hoursSaved", "-4.2 hours saved")}</span>
                </div>
                <p className="text-xs lg:text-sm text-slate-800 dark:text-slate-200 font-medium">{t("dashboard.activeBypassClear", "Active AI bypass clear.")}</p>
              </div>

              <div className="rounded-2xl border border-sky-500/40 bg-white/95 dark:bg-sky-950/85 p-4 backdrop-blur shadow-xl flex items-center justify-between text-xs lg:text-sm">
                <span className="text-sky-700 dark:text-sky-300 font-extrabold flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Convoy #01 (AS-01-AB-1234)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm">72%</span>
              </div>
            </div>

            {/* Bottom 3D Helper Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full border border-slate-300 dark:border-slate-700 bg-white/95 dark:bg-slate-950/85 px-5 py-1.5 text-xs lg:text-sm font-semibold text-slate-800 dark:text-slate-300 backdrop-blur shadow-lg">
              {t("dashboard.dragMouseOrbit", "Drag Mouse to Orbit 3D • Bearing: 042° N")}
            </div>
          </div>
        ) : (
          <div className="h-[460px] lg:h-[540px] rounded-2xl overflow-hidden">
            <NERLiveMapModule />
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

      {/* SECTION: SMART OPERATIONS HUB */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            SMART OPERATIONS HUB
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">MDoNER Integrated Operations Modules</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { id: 'hub', title: t('dashboard.sim3d', '3D Simulation'), desc: 'Interactive 3D terrain & convoy bypass simulation engine.', icon: '🎮' },
            { id: 'aiimpact', title: t('navigation.aiimpact', 'Smart AI Disaster Impact'), desc: 'Gemini Multimodal photo damage & AI satellite change analysis.', icon: '🤖', isNew: true },
            { id: 'road', title: t('navigation.road', 'Road & Accessibility'), desc: 'Monitor road status, blockages & accessibility in real-time.', icon: '🛣️' },
            { id: 'vehicles', title: t('navigation.vehicles', 'Vehicle & Logistics'), desc: 'Track vehicles, check status & optimize logistics operations.', icon: '🚚' },
            { id: 'drone', title: t('navigation.drone', 'UAV Drone Dispatcher'), desc: 'High-altitude aerial supply dispatch for zero-road zones.', icon: '🛸' },
            { id: 'rerouting', title: t('navigation.rerouting', 'Dynamic Rerouting'), desc: 'AI-powered smart rerouting for safe & fastest delivery.', icon: '🧭' },
            { id: 'supplies', title: t('navigation.supplies', 'Essential Supply Priority'), desc: 'Prioritize essential supplies like medicine, food & fuel.', icon: '⚙️' },
            { id: 'alerts', title: t('navigation.alerts', 'Alert & Notifications'), desc: 'Real-time alerts & notifications for critical incidents.', icon: '🔔' },
            { id: 'weather', title: t('navigation.weather', 'Weather Intelligence'), desc: 'Live weather updates & forecasts for decision making.', icon: '🌧️' },
            { id: 'customdashboard', title: t('navigation.customdashboard', 'Analytics & Reports'), desc: 'Insights, reports & dashboards for better planning.', icon: '📊' },
            { id: 'gov', title: t('navigation.gov', 'Government Dashboard'), desc: 'Administrative oversight & data-driven decision support.', icon: '🏛️' }
          ].map((card, idx) => (
            <div
              key={idx}
              onClick={() => handleNav(card.id)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-3.5 shadow-lg hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition flex flex-col justify-between group space-y-2 relative overflow-hidden"
            >
              {card.isNew && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40 text-[9px] font-black uppercase">
                  AI FEATURE
                </span>
              )}
              <div className="text-xl">{card.icon}</div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{card.title}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: BOTTOM 4-PANEL TELEMETRY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Panel 1: LIVE VEHICLE TRACKING */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              LIVE VEHICLE TRACKING
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[10px] font-bold text-sky-600 dark:text-sky-400">45 km/h</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-900 dark:text-white text-[11px]">Convoy #01: AS-01-AB-1234 (Guwahati ➔ Aizawl)</div>
            <span className="inline-block rounded bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold">
              12T Medical Oxygen Cylinders (Class 1)
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" style={{ width: '42%' }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              <span>Progress: 42%</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">ETA Aizawl: 3h 15m (NH-27)</span>
            </div>
          </div>
        </div>

        {/* Panel 2: DELIVERY STATUS (NER) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🍩</span> DELIVERY STATUS (NER)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">367 Total</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Donut Metric Visual */}
            <div className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-sky-500 border-r-amber-500 flex items-center justify-center font-black text-slate-900 dark:text-white text-sm shrink-0">
              367
            </div>

            <div className="space-y-1 text-[11px] flex-1">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Delivered:</span>
                <b>58% (213)</b>
              </div>
              <div className="flex items-center justify-between text-sky-600 dark:text-sky-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span> In Transit:</span>
                <b>29% (112)</b>
              </div>
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span> Pending:</span>
                <b>13% (48)</b>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: DISRUPTED CORRIDORS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 dark:text-amber-400" /> DISRUPTED CORRIDORS
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[9px] font-bold">4 Impacted</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">NH-6 Landslide (Km 142)</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">🔴 Critical</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">NH-13 Sela Pass (3,500m)</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-bold">🔴 Critical</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-300 font-medium">NH-10 Melli Teesta Basin</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">🟡 High</span>
            </div>
          </div>
        </div>

        {/* Panel 4: SUPPLIES IN TRANSIT */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>🏷️</span> SUPPLIES IN TRANSIT
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">745 MT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Medical Oxygen</span>
              <b className="text-slate-900 dark:text-white text-xs">120 Tons</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Food Grains</span>
              <b className="text-amber-600 dark:text-amber-400 text-xs">340 Tons</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Emergency Fuel</span>
              <b className="text-emerald-600 dark:text-emerald-400 text-xs">85 KL</b>
            </div>
            <div className="p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-0.5">
              <span className="text-slate-500 dark:text-slate-400 block text-[9px]">Shelter Kits</span>
              <b className="text-indigo-600 dark:text-indigo-300 text-xs">200 Tons</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
