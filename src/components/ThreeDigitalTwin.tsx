import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "../i18n";
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
    scene.background = new THREE.Color(0x040814);
    scene.fog = new THREE.FogExp2(0x040814, 0.008);
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

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.4);
    dirLight1.position.set(30, 50, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x6366f1, 0.9);
    dirLight2.position.set(-30, 40, -20);
    scene.add(dirLight2);

    // 5. Grid Helper Floor
    const gridHelper = new THREE.GridHelper(120, 40, 0x1e3a8a, 0x112240);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Central Beacon Tower (Glowing Blue Cylinder)
    const towerGeo = new THREE.CylinderGeometry(2.5, 3.5, 40, 32);
    const towerMat = new THREE.MeshPhongMaterial({
      color: 0x0284c7,
      emissive: 0x0369a1,
      transparent: true,
      opacity: 0.85
    });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(0, 20, 0);
    scene.add(tower);

    // Rotating Hologram Rings
    const ringGeo = new THREE.RingGeometry(8, 8.6, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(0, 28, 0);
    scene.add(ring1);

    // 7. Terraced Buildings
    const buildings = [
      { x: -28, z: -18, w: 14, h: 22, d: 14, col: 0x0f172a },
      { x: 28, z: -22, w: 18, h: 28, d: 18, col: 0x070d1e },
      { x: -32, z: 15, w: 16, h: 18, d: 16, col: 0x0f172a },
      { x: 32, z: 20, w: 20, h: 32, d: 20, col: 0x070d1e },
      { x: 0, z: -35, w: 22, h: 25, d: 18, col: 0x0f172a }
    ];
    buildings.forEach(b => {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = new THREE.MeshPhongMaterial({ color: b.col, emissive: 0x020617 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.h / 2, b.z);
      scene.add(mesh);
    });

    // 8. GREEN AI CORRIDOR BYPASS ROAD
    const greenCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 0.5, -4),
      new THREE.Vector3(-25, 0.5, -18),
      new THREE.Vector3(0, 0.5, -15),
      new THREE.Vector3(22, 0.5, 5),
      new THREE.Vector3(45, 0.5, 20)
    ]);
    const greenGeo = new THREE.TubeGeometry(greenCurve, 64, 1.4, 8, false);
    const greenMat = new THREE.MeshPhongMaterial({ color: 0x2dd4bf, emissive: 0x0f766e });
    const greenRoad = new THREE.Mesh(greenGeo, greenMat);
    scene.add(greenRoad);

    // 9. RED DISRUPTED ROAD (Km 142 Landslide Breach)
    const redCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-45, 0.5, -4),
      new THREE.Vector3(-30, 0.5, 18),
      new THREE.Vector3(-14, 0.5, 25),
      new THREE.Vector3(2, 0.5, 24)
    ]);
    const redGeo = new THREE.TubeGeometry(redCurve, 64, 1.4, 8, false);
    const redMat = new THREE.MeshPhongMaterial({ color: 0xf87171, emissive: 0x991b1b });
    const redRoad = new THREE.Mesh(redGeo, redMat);
    scene.add(redRoad);

    // Landslide Debris Blockage
    const debrisGeo = new THREE.BoxGeometry(6, 4, 7);
    const debrisMat = new THREE.MeshPhongMaterial({ color: 0xef4444, emissive: 0xb91c1c });
    const debris = new THREE.Mesh(debrisGeo, debrisMat);
    debris.position.set(-18, 2, 20);
    debris.rotation.y = 0.5;
    scene.add(debris);

    // 10. 3D CONVOY TRUCK VEHICLE
    const truckGroup = new THREE.Group();
    const cabGeo = new THREE.BoxGeometry(2.4, 2, 2.2);
    const cabMat = new THREE.MeshPhongMaterial({ color: 0x38bdf8, emissive: 0x0284c7 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(1.2, 1, 0);
    truckGroup.add(cab);

    const tankGeo = new THREE.CylinderGeometry(1.1, 1.1, 4.5, 16);
    const tankMat = new THREE.MeshPhongMaterial({ color: 0xe2e8f0, emissive: 0x475569 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(-2, 1.2, 0);
    truckGroup.add(tank);
    scene.add(truckGroup);

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

    // 11. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      ring1.rotation.z += 0.01;

      // Move truck along green curve
      truckProgressRef.current = (truckProgressRef.current + 0.002) % 1;
      const pos = greenCurve.getPointAt(truckProgressRef.current);
      const tangent = greenCurve.getTangentAt(truckProgressRef.current);
      truckGroup.position.copy(pos);
      truckGroup.lookAt(pos.clone().add(tangent));

      // Continuous slow camera orbit when user is not dragging
      if (!isDraggingRef.current) {
        cameraAngleRef.current.alpha += 0.001;
      }

      const rad = cameraAngleRef.current.radius;
      const a = cameraAngleRef.current.alpha;
      const b = cameraAngleRef.current.beta;
      camera.position.set(
        rad * Math.sin(b) * Math.sin(a),
        rad * Math.cos(b),
        rad * Math.sin(b) * Math.cos(a)
      );

      // Focus target based on activeZone
      const targetLookAt = activeZone === "breach" ? new THREE.Vector3(-18, 2, 20) : new THREE.Vector3(0, 4, 0);
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
      <section className="rounded-2xl border border-slate-800 bg-[#070d1e] p-4 lg:p-6 shadow-2xl relative overflow-hidden">
        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 flex items-center gap-1.5 border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Region Map &bull; Live Satellite & Radar
              </span>
              <span className="text-xs text-slate-400 italic hidden sm:inline font-sans font-normal">"Smart decisions today, safer tomorrow."</span>
            </div>
            <h2 className="text-lg lg:text-xl font-black text-white mt-1">North Eastern Region Accessibility & Logistics Overview</h2>
          </div>

          {/* Controls Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-[#040814] p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setDisplayMode("3d")}
                className={"px-3.5 py-1.5 rounded-lg font-black transition flex items-center gap-1.5 " + (
                  displayMode === "3d" ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/30" : "text-slate-400 hover:text-white"
                )}
              >
                🎮 3D SIMULATION
              </button>
              <button
                onClick={() => setDisplayMode("2d")}
                className={"px-3.5 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 " + (
                  displayMode === "2d" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-400 hover:text-white"
                )}
              >
                🗺️ 2D Map
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Area: 3D Simulation WebGL OR 2D GIS Leaflet Map */}
        {displayMode === "3d" ? (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl h-[420px] lg:h-[500px]">
            <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Zone Status Pills Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
              <button
                onClick={() => setActiveZone("breach")}
                className={"px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 " + (
                  activeZone === "breach"
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/40"
                    : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("dashboard.sectorBreach", "Sector 14 (Breach)")}
              </button>

              <button
                onClick={() => setActiveZone("corridor")}
                className={"px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 " + (
                  activeZone === "corridor"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
                    : "bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <Navigation className="h-3.5 w-3.5" />
                {t("dashboard.sectorBypass", "Sector 9 (Bypass)")}
              </button>

              <span className="rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs text-sky-400 font-mono">
                {t("dashboard.nh6Active", "NH-6 Active")}
              </span>
            </div>

            {/* Right Side HUD Cards */}
            <div className="absolute top-4 right-4 z-20 w-72 space-y-2.5">
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/80 p-3 backdrop-blur shadow-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-300">{t("dashboard.nh6Blocked", "NH-6 Blocked (Km 142)")}</span>
                  <span className="text-[10px] text-rose-400 font-mono font-bold">4h 30m</span>
                </div>
                <p className="text-[11px] text-slate-300">{t("dashboard.nh6BlockedDesc", "Landslide debris breach. Standard vehicles barred.")}</p>
              </div>

              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/80 p-3 backdrop-blur shadow-xl space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-300">{t("dashboard.greenCorridor", "Green Corridor (Jowai Bypass)")}</span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">{t("dashboard.hoursSaved", "-4.2 hours saved")}</span>
                </div>
                <p className="text-[11px] text-slate-300">{t("dashboard.activeBypassClear", "Active AI bypass clear.")}</p>
              </div>

              <div className="rounded-xl border border-sky-500/40 bg-sky-950/80 p-3 backdrop-blur shadow-xl flex items-center justify-between text-xs">
                <span className="text-sky-300 font-bold flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5" /> Convoy #01 (AS-01-AB-1234)
                </span>
                <span className="text-emerald-400 font-mono font-bold">72%</span>
              </div>
            </div>

            {/* Bottom 3D Helper Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full border border-slate-700 bg-slate-950/80 px-4 py-1 text-[11px] text-slate-400 backdrop-blur shadow-lg">
              {t("dashboard.dragMouseOrbit", "Drag Mouse to Orbit 3D • Bearing: 042° N")}
            </div>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 h-[420px] lg:h-[500px] shadow-2xl">
            <NERLiveMapModule hideHeader={true} onNavigateTo3DSim={() => setDisplayMode("3d")} />
          </div>
        )}
      </section>

      {/* 3-COLUMN MIDDLE PANELS (MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Panel 1: WEATHER INTELLIGENCE */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <CloudRain className="h-4 w-4 text-sky-400" /> WEATHER INTELLIGENCE
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Open-Meteo Live</span>
            </div>

            <select className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 text-xs text-white focus:border-sky-500 focus:outline-none">
              <option>Shillong, Meghalaya</option>
              <option>Guwahati, Assam</option>
              <option>Aizawl, Mizoram</option>
              <option>Gangtok, Sikkim</option>
              <option>Imphal, Manipur</option>
            </select>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-3xl font-black text-white">21.8°C</div>
                <div className="text-xs text-slate-400">Shillong, Meghalaya</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-sky-400">16.4 mm/hr Rain</div>
                <div className="text-[10px] text-slate-500">Wind: 28 km/h</div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToMonitoring}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-sky-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            Open 5-Day Radar Forecast ➔
          </button>
        </div>

        {/* Panel 2: RECENT CRITICAL ALERTS */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-400" /> RECENT CRITICAL ALERTS
              </span>
              <span className="text-[10px] text-slate-500">Auto-refresh in 30s</span>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-300">NH-24 Submerged (Km 142)</span>
                <span className="text-[10px] text-slate-400">2 min ago</span>
              </div>
              <p className="text-[11px] text-slate-300">Water hazard barrier. Sector 9 bypass active.</p>
            </div>
          </div>

          <button
            onClick={onNavigateToMonitoring}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-sky-400 hover:text-white transition flex items-center justify-center gap-1.5"
          >
            View All 14 Alerts ➔
          </button>
        </div>

        {/* Panel 3: AI PREDICTION */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-5 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-indigo-400" /> AI PREDICTION <span className="text-[10px] text-slate-500">1 / 2</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">scikit-learn &bull; Gemini</span>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <button className="px-1 bg-slate-900 border border-slate-800 rounded">&lt;</button>
                  <button className="px-1 bg-slate-900 border border-slate-800 rounded">&gt;</button>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                <span>📍 NONKEY & IRANG VALLEY, MANIPUR</span>
                <span className="text-[9px] text-slate-400">NH-37 Imphal-Jiribam Highway</span>
              </div>
              <div className="font-semibold text-slate-200">Debris flow potential in Irang river catchment basin. Heavy silt accumulation creating localized flash damming risks.</div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Landslide Hazard (LHI):</span>
                  <span className="font-bold text-amber-400">68.4% (HIGH RISK)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: '68.4%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onNavigateToImpact}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-1.5"
          >
            Inspect Hazard Model ➔
          </button>
        </div>
      </div>

      {/* SECTION: SMART OPERATIONS HUB (10 INTERACTIVE SUBSYSTEM CARDS MATCHING SCREENSHOT) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
            SMART OPERATIONS HUB
          </h3>
          <span className="text-[10px] text-slate-400">MDoNER Integrated Operations Modules</span>
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
              className="rounded-xl border border-slate-800 bg-[#070d1e] p-3.5 shadow-lg hover:border-indigo-500/60 hover:bg-slate-900 cursor-pointer transition flex flex-col justify-between group space-y-2 relative overflow-hidden"
            >
              {card.isNew && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black uppercase">
                  AI FEATURE
                </span>
              )}
              <div className="text-xl">{card.icon}</div>
              <div>
                <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition">{card.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: BOTTOM 4-PANEL TELEMETRY GRID (MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
        {/* Panel 1: LIVE VEHICLE TRACKING */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE VEHICLE TRACKING
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] font-bold text-sky-400">45 km/h</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-white text-[11px]">Convoy #01: AS-01-AB-1234 (Guwahati ➔ Aizawl)</div>
            <span className="inline-block rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-semibold">
              12T Medical Oxygen Cylinders (Class 1)
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 rounded-full" style={{ width: '42%' }}></div>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Progress: 42%</span>
              <span className="text-emerald-400 font-bold">ETA Aizawl: 3h 15m (NH-27)</span>
            </div>
          </div>
        </div>

        {/* Panel 2: DELIVERY STATUS (NER) */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span>🍩</span> DELIVERY STATUS (NER)
            </span>
            <span className="text-[10px] text-slate-400 font-mono">367 Total</span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            {/* Donut Metric Visual */}
            <div className="h-16 w-16 rounded-full border-4 border-emerald-500 border-t-sky-500 border-r-amber-500 flex items-center justify-center font-black text-white text-sm shrink-0">
              367
            </div>

            <div className="space-y-1 text-[11px] flex-1">
              <div className="flex items-center justify-between text-emerald-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span> Delivered:</span>
                <b>58% (213)</b>
              </div>
              <div className="flex items-center justify-between text-sky-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span> In Transit:</span>
                <b>29% (112)</b>
              </div>
              <div className="flex items-center justify-between text-amber-400 font-semibold">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> Pending:</span>
                <b>13% (48)</b>
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: DISRUPTED CORRIDORS */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> DISRUPTED CORRIDORS
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold">4 Impacted</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-medium">NH-6 Landslide (Km 142)</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">🔴 Critical</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-medium">NH-13 Sela Pass (3,500m)</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[9px] font-bold">🔴 Critical</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-medium">NH-10 Melli Teesta Basin</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[9px] font-bold">🟡 High</span>
            </div>
          </div>
        </div>

        {/* Panel 4: SUPPLIES IN TRANSIT */}
        <div className="rounded-2xl border border-slate-800 bg-[#070d1e] p-4 shadow-xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[11px] font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <span>🏷️</span> SUPPLIES IN TRANSIT
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">745 MT</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[9px]">Medical Oxygen</span>
              <b className="text-white text-xs">120 Tons</b>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[9px]">Food Grains</span>
              <b className="text-amber-400 text-xs">340 Tons</b>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[9px]">Emergency Fuel</span>
              <b className="text-emerald-400 text-xs">85 KL</b>
            </div>
            <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-0.5">
              <span className="text-slate-400 block text-[9px]">Shelter Kits</span>
              <b className="text-indigo-300 text-xs">200 Tons</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
