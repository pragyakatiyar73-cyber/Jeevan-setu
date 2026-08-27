import React, { useState } from "react";
import { useTranslation } from "../i18n";
import {
  AlertTriangle,
  Siren,
  CloudRain,
  Zap,
  MapPin,
  Compass,
  Navigation,
  Truck,
  Send,
  Eye,
  CheckCircle2,
  Filter,
  Flame,
  Activity
} from "lucide-react";

interface ActionAlertsModuleProps {
  onNavigateToMap?: () => void;
  onNavigateTo3D?: () => void;
  onTriggerSOS?: () => void;
}

export default function ActionAlertsModule({
  onNavigateToMap,
  onNavigateTo3D,
  onTriggerSOS
}: ActionAlertsModuleProps) {
  const { t } = useTranslation();
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const incidentList = [
    {
      id: "INC-101",
      badge: "CRITICAL L1",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      title: "Landslide Debris Breach: NH-6 Km 142 (East Khasi Hills, Meghalaya)",
      description:
        "400m hillside debris flow collapsed across both carriageways. 5 civilian vehicles trapped before barrier. Sector 9 Jowai bypass active.",
      gps: "25.4200° N, 92.1500° E",
      dispatched: "BRO Task Force 34 (2 JCBs)",
      timeAgo: "12 min ago",
      actionType: "reroute",
      actionLabel: "Reroute 3D ➔"
    },
    {
      id: "INC-102",
      badge: "CRITICAL L1",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      title: "Sub-Zero Snow Slurry & Rockfall: NH-13 Sela Pass (Arunachal Pradesh)",
      description:
        "Freeze-thaw shale displacement above 3,500m MSL. Convoy tyre chains mandatory. Kalaktang low-altitude bypass recommended.",
      gps: "27.5861° N, 91.8594° E",
      dispatched: "BRO Project Vartak Snowcutters",
      timeAgo: "28 min ago",
      actionType: "airdrop",
      actionLabel: "Air-Drop SOS 🚁"
    },
    {
      id: "INC-103",
      badge: "CRITICAL L1",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/40",
      title: "Glacial River Surge & Embankment Breach: NH-10 Melli Basin (Sikkim)",
      description:
        "Teesta River velocity reached 4.2 m/s overtopping carriageway embankment. Siliguri-Gangtok arterial link severed. Lava bypass active.",
      gps: "27.0900° N, 88.4500° E",
      dispatched: "Sikkim SDRF & Melli Flood Units",
      timeAgo: "45 min ago",
      actionType: "reroute",
      actionLabel: "Reroute 3D ➔"
    },
    {
      id: "INC-104",
      badge: "MEDICAL DISTRESS",
      badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/40",
      title: "Medical Oxygen Buffer Depletion: Silchar Civil Hospital (Assam)",
      description:
        "On-site reserve down to 22% due to supply transit delays on NH-6. Relief Convoy #01 carrying 12T cylinders diverted via Green Corridor.",
      gps: "Silchar Cachar Depot",
      dispatched: "In Transit: Convoy #01 (AS-01-AB-1234)",
      timeAgo: "ETA: 3h 15m",
      actionType: "track",
      actionLabel: "Track Convoy 🚚"
    }
  ];

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-[#040814] text-slate-900 dark:text-slate-100 font-sans select-none p-5 lg:p-8 space-y-6 transition-colors duration-300">
      
      {/* 🔴 TOP PERSISTENT EMERGENCY SOS BANNER TICKER */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-900/90 via-rose-950/80 to-amber-950/90 border border-rose-500/50 p-4 shadow-2xl flex items-center justify-between gap-4 text-xs lg:text-sm">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="flex h-3.5 w-3.5 shrink-0 rounded-full bg-rose-500 animate-ping"></span>
          <div className="truncate font-semibold">
            <span className="font-black text-rose-400">ACTIVE EMERGENCY SOS:</span>{" "}
            <span className="text-white font-extrabold">NH-6 Km 142 (East Khasi Hills, Meghalaya) &bull; 5-15 Persons Trapped &bull; Triage: STANDARD_L3 &bull; Nearest 4x4 Convoy #01 Rerouting</span>
          </div>
        </div>
        <button
          onClick={onNavigateToMap}
          className="shrink-0 rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 font-extrabold text-white text-xs lg:text-sm shadow-lg transition flex items-center gap-1 cursor-pointer border border-rose-400/40"
        >
          <span>Track on Map ➔</span>
        </button>
      </div>

      {/* 📊 TOP METRIC CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: CRITICAL LEVEL 1 */}
        <div className="rounded-2xl border border-rose-500/40 bg-white dark:bg-gradient-to-br dark:from-rose-950/40 dark:to-slate-950/80 p-6 shadow-xl flex items-center justify-between transition-colors duration-300">
          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">CRITICAL (LEVEL 1)</div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">4 Active</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-600/30 animate-pulse">
            <Siren className="h-6 w-6" />
          </div>
        </div>

        {/* CARD 2: HIGH RISK LEVEL 2 */}
        <div className="rounded-2xl border border-amber-500/40 bg-white dark:bg-gradient-to-br dark:from-amber-950/40 dark:to-slate-950/80 p-6 shadow-xl flex items-center justify-between transition-colors duration-300">
          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">HIGH RISK (LEVEL 2)</div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">6 Regulated</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 shadow-lg shadow-amber-600/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* CARD 3: SURGE / WEATHER */}
        <div className="rounded-2xl border border-sky-500/40 bg-white dark:bg-gradient-to-br dark:from-sky-950/40 dark:to-slate-950/80 p-6 shadow-xl flex items-center justify-between transition-colors duration-300">
          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">SURGE / WEATHER</div>
            <div className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mt-1">4 Monitored</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600/20 border border-sky-500/40 text-sky-600 dark:text-sky-400 shadow-lg shadow-sky-600/30">
            <CloudRain className="h-6 w-6" />
          </div>
        </div>

        {/* CARD 4: AVG DISPATCH SPEED */}
        <div className="rounded-2xl border border-emerald-500/40 bg-white dark:bg-gradient-to-br dark:from-emerald-950/40 dark:to-slate-950/80 p-6 shadow-xl flex items-center justify-between transition-colors duration-300">
          <div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">AVG DISPATCH SPEED</div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">14.2 min</div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-lg shadow-emerald-600/30">
            <Zap className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* 🚨 REAL-TIME EMERGENCY INCIDENT BROADCAST FEED HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070d1e] p-6 shadow-xl dark:shadow-2xl space-y-5 transition-colors duration-300">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚨</span>
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Real-Time Emergency Incident Broadcast Feed (14 Events)
              </h2>
            </div>
            <p className="text-xs lg:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium">
              Live operational alerts across 8 NER States synchronized with NDRF, BRO & State Disaster Management Authorities (SDMAs)
            </p>
          </div>

          {/* CONTROLS RIGHT */}
          <div className="flex items-center gap-3">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs lg:text-sm font-bold text-slate-900 dark:text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              <option value="all">🔴 Critical Distress (4)</option>
              <option value="high">🟡 High Risk Regulated (6)</option>
              <option value="weather">🌧️ Weather Monitored (4)</option>
            </select>

            <button
              onClick={onTriggerSOS}
              className="rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs lg:text-sm px-4 py-2.5 shadow-lg shadow-rose-600/40 transition cursor-pointer flex items-center gap-1.5 border border-rose-400/40"
            >
              <span>🚨</span>
              <span>Broadcast SOS</span>
            </button>
          </div>
        </div>

        {/* INCIDENT BROADCAST CARDS LIST */}
        <div className="space-y-4">
          {incidentList.map((inc) => (
            <div
              key={inc.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-slate-950/70 p-6 shadow-md hover:border-slate-400 dark:hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className={`rounded-lg px-2.5 py-1 text-xs font-black tracking-wider border ${inc.badgeColor}`}>
                      {inc.badge}
                    </span>
                    <h3 className="text-base lg:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {inc.title}
                    </h3>
                  </div>
                  <p className="text-xs lg:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {inc.description}
                  </p>
                  
                  {/* METADATA ROW */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-300 font-bold">
                      <MapPin className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                      GPS: {inc.gps}
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-300 font-bold">
                      🚜 Dispatched: {inc.dispatched}
                    </span>
                    <span className="text-slate-500 font-bold">
                      ⏱️ {inc.timeAgo}
                    </span>
                  </div>
                </div>

                {/* RIGHT ACTION BUTTONS */}
                <div className="flex items-center gap-2.5 shrink-0 self-end lg:self-center">
                  {inc.actionType === "reroute" && (
                    <button
                      onClick={onNavigateTo3D}
                      className="rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-extrabold text-xs lg:text-sm px-4 py-2 shadow-md transition cursor-pointer"
                    >
                      {inc.actionLabel}
                    </button>
                  )}

                  {inc.actionType === "airdrop" && (
                    <button
                      onClick={onTriggerSOS}
                      className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs lg:text-sm px-4 py-2 shadow-md transition cursor-pointer"
                    >
                      {inc.actionLabel}
                    </button>
                  )}

                  {inc.actionType === "track" && (
                    <button
                      onClick={onNavigateToMap}
                      className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs lg:text-sm px-4 py-2 shadow-md transition cursor-pointer"
                    >
                      {inc.actionLabel}
                    </button>
                  )}

                  <button
                    onClick={onNavigateToMap}
                    className="rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs lg:text-sm font-extrabold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Map 🗺️</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
