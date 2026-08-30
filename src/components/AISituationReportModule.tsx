import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Printer,
  Shield,
  Clock,
  AlertTriangle,
  X
} from 'lucide-react';
import { incidentStore, SITREPReport } from '../services/api/incidentStore';

export default function AISituationReportModule() {
  const activeIncident = incidentStore.getActiveIncident();
  const [sitrep, setSitrep] = useState<SITREPReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const handleGenerateSITREP = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const report = incidentStore.generateSITREP();
      setSitrep(report);
      setIsGenerating(false);
    }, 1000);
  };

  const handleDownloadReport = () => {
    if (!sitrep) return;
    const textContent = `
================================================================================
JEEVAN SETU — EMERGENCY DISASTER SITUATION REPORT (SITREP)
================================================================================
Report ID: ${sitrep.id}
Generated At: ${sitrep.generatedAt}
Incident ID: ${sitrep.incidentId}
Disaster Title: ${activeIncident.title}
Data Status: ${sitrep.dataStatus}
================================================================================

1. INCIDENT OVERVIEW:
   ${sitrep.overview}

2. LOCATION:
   ${activeIncident.locationName} (Lat: ${activeIncident.lat}, Lon: ${activeIncident.lon})

3. DISASTER TYPE:
   ${sitrep.disasterType}

4. SEVERITY LEVEL:
   ${sitrep.severity} (Confidence: ${activeIncident.confidenceScore}%)

5. AFFECTED POPULATION:
   ${sitrep.affectedPopulation.toLocaleString()} Individuals

6. AFFECTED AREA:
   ${sitrep.affectedAreaSqKm} Sq. Km

7. INFRASTRUCTURE DAMAGE SUMMARY:
   ${sitrep.infrastructureDamageSummary}

8. ROAD ACCESSIBILITY STATUS:
   ${sitrep.roadStatusSummary}

9. ACTIVE ALERTS COUNT:
   ${sitrep.activeAlertsCount} Active Emergency Warnings

10. RESCUE TEAMS DEPLOYED:
    ${sitrep.rescueTeamsCount} NDRF/SDRF Task Forces Assigned

11. UAV DRONE STATUS:
    ${sitrep.uavStatusSummary}

12. ESSENTIAL SUPPLIES STATUS:
    ${sitrep.essentialSuppliesStatus}

13. RELIEF CAMP CAPACITY:
    ${sitrep.reliefCampCapacitySummary}

14. 72-HOUR RISK FORECAST:
    ${sitrep.forecast72hSummary}

15. RECOMMENDED ACTIONS:
${sitrep.recommendedActions.map((a, i) => `    ${i + 1}. ${a}`).join('\n')}

16. CURRENT RESPONSE STATUS:
    ${sitrep.currentResponseStatus}

================================================================================
End of Situation Report — Jeevan Setu MDoNER Command Grid
================================================================================
    `;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SITREP_${sitrep.incidentId}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-black text-sky-400 border border-sky-500/40 uppercase">
                REPORTING & SITREP STAGE
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                VERIFIED DATA SUMMARY
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <FileBarChart className="h-7 w-7 text-sky-400" />
              <span>AI Automated Situation Report (SITREP) Generator</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Consolidates real-time telemetry from all 11 stages (Monitoring, AI Assessment, 72h Forecast, SOS Triage, Rescue Teams, UAVs, Relief Camps, and Damage) into a 16-section executive situation report.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateSITREP}
              disabled={isGenerating}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'Compiling 16 Sections...' : 'GENERATE AI SITREP'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated SITREP Card */}
      {sitrep && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                <span>Report ID: <b className="text-sky-400">{sitrep.id}</b></span>
                <span>&bull;</span>
                <span>Generated At: <b>{sitrep.generatedAt}</b></span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                Executive Emergency Situation Report (SITREP) — {activeIncident.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalOpen(true)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="h-4 w-4 text-sky-400" />
                <span>VIEW FULL REPORT</span>
              </button>

              <button
                onClick={handleDownloadReport}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>DOWNLOAD REPORT (.TXT)</span>
              </button>
            </div>
          </div>

          {/* 16 Sections Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">1. Disaster & Severity</div>
              <div className="text-rose-400 font-bold">{sitrep.disasterType} ({sitrep.severity})</div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">2. Affected Population</div>
              <div className="text-amber-400 font-bold">{sitrep.affectedPopulation.toLocaleString()} People</div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">3. Active SOS Calls</div>
              <div className="text-rose-400 font-bold">{sitrep.activeAlertsCount} Distress Calls</div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-bold">4. Data Status</div>
              <div className="text-sky-400 font-bold">{sitrep.dataStatus}</div>
            </div>
          </div>
        </div>
      )}

      {/* Full Interactive SITREP Modal */}
      {modalOpen && sitrep && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-sky-400" />
                <span>16-Section Full Executive SITREP Document</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono leading-relaxed text-slate-200">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="text-amber-400 font-bold uppercase">1. Incident Overview & Location</h4>
                <p className="font-sans text-slate-300">{sitrep.overview}</p>
                <p className="text-[11px] text-slate-400">Target Location: {activeIncident.locationName} (Lat: {activeIncident.lat}, Lon: {activeIncident.lon})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sky-400 font-bold uppercase">Infrastructure Risk</h4>
                  <p className="font-sans text-slate-300 mt-1">{sitrep.infrastructureDamageSummary}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h4 className="text-sky-400 font-bold uppercase">Road Accessibility</h4>
                  <p className="font-sans text-slate-300 mt-1">{sitrep.roadStatusSummary}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-sans">
                <h4 className="text-emerald-400 font-mono font-bold uppercase">Recommended Executive Actions</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  {sitrep.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={handleDownloadReport}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-500"
              >
                DOWNLOAD SITREP (.TXT)
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
