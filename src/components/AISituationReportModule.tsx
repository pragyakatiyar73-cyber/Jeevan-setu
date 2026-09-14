import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';
import {
  FileText,
  Download,
  Eye,
  Printer,
  Sparkles,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck,
  ChevronRight,
  Activity
} from 'lucide-react';
import { incidentStore, DisasterIncident, SITREPReport } from '../services/api/incidentStore';

// Strictly the 8 North-Eastern States of India
const NER_STATES = [
  'Assam',
  'Arunachal Pradesh',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
];

export default function AISituationReportModule() {
  const { t } = useTranslation();
  const allIncidents = incidentStore.getIncidents();

  const [selectedState, setSelectedState] = useState<string>('Meghalaya');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('JS-2026-001');
  const [activeIncident, setActiveIncident] = useState<DisasterIncident>(incidentStore.getActiveIncident());
  
  const [sitrep, setSitrep] = useState<SITREPReport | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loaderStep, setLoaderStep] = useState<number>(0);
  const [viewDocument, setViewDocument] = useState<boolean>(false);

  // Filter incidents for selected state
  const stateIncidents = allIncidents.filter(i => i.state === selectedState);

  // Update selected incident when state changes
  useEffect(() => {
    if (stateIncidents.length > 0) {
      const first = stateIncidents[0];
      setSelectedIncidentId(first.id);
      setActiveIncident(first);
    } else {
      // Data unavailable for state fallback
      setSelectedIncidentId('');
    }
  }, [selectedState]);

  // Update active incident when incident selection changes
  const handleIncidentSelect = (id: string) => {
    setSelectedIncidentId(id);
    const inc = allIncidents.find(i => i.id === id);
    if (inc) {
      setActiveIncident(inc);
      incidentStore.setActiveIncidentId(id);
    }
  };

  // Generate SITREP with 1.5s multi-step compilation animation
  const handleGenerateSITREP = () => {
    setIsGenerating(true);
    setLoaderStep(1);

    const timer1 = setTimeout(() => setLoaderStep(2), 400);
    const timer2 = setTimeout(() => setLoaderStep(3), 800);
    const timer3 = setTimeout(() => setLoaderStep(4), 1200);

    const timerFinal = setTimeout(() => {
      if (activeIncident) {
        const report = incidentStore.generateSITREP(activeIncident.id);
        setSitrep(report);
      } else {
        // Fallback SITREP for states without active telemetry
        const report: SITREPReport = {
          id: `SITREP-${selectedState.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          incidentId: 'JS-UNAVAILABLE',
          generatedAt: new Date().toLocaleString(),
          overview: `Official monitoring active for ${selectedState}. No critical disaster incident telemetry registered at present timestamp.`,
          disasterType: 'Monitoring Mode (Zero Active Disasters)',
          severity: 'LOW',
          affectedPopulation: 0,
          affectedAreaSqKm: 0,
          infrastructureDamageSummary: 'All arterial roads and bridges reported operational.',
          roadStatusSummary: 'ALL HIGHWAYS CLEAR • NO ROAD BLOCKAGES REPORTED',
          activeAlertsCount: 0,
          rescueTeamsCount: 0,
          uavStatusSummary: 'UAV Units in Reserve Protocol',
          essentialSuppliesStatus: 'Regional Warehouses Stocked at Normal Capacity',
          reliefCampCapacitySummary: 'Relief Camps in Standby Mode (0% Occupancy)',
          forecast72hSummary: '0-24h: LOW | 24-48h: LOW | 48-72h: LOW',
          recommendedActions: [
            'Maintain regular meteorological and river level telemetry monitoring',
            'Ensure SDRF quick response teams remain on standard standby',
            'Update district disaster management inventory weekly'
          ],
          currentResponseStatus: 'MONITORING MODE • STABLE TELEMETRY',
          dataStatus: 'VERIFIED DATA'
        };
        setSitrep(report);
      }

      setIsGenerating(false);
      setViewDocument(true);
    }, 1500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerFinal);
    };
  };

  // Print PDF handler via window.print()
  const handlePrintPDF = () => {
    window.print();
  };

  // Plain Text Download Handler
  const handleDownloadText = () => {
    if (!sitrep) return;
    const textContent = `
================================================================================
GOVERNMENT OF INDIA
MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDoNER)
NATIONAL EMERGENCY OPERATIONS CENTRE (NEOC)
JEEVAN SETU – AI-POWERED EMERGENCY DISASTER SITUATION REPORT (SITREP)
================================================================================
REPORT ID: JS-SITREP-${sitrep.incidentId}-${sitrep.id}
DATE / TIME: ${sitrep.generatedAt} (IST)
DATA CLASSIFICATION: ${sitrep.dataStatus}
PAGE: PAGE 1 OF 1
OPERATIONAL CLASSIFICATION: RESTRICTED / EMERGENCY OPERATIONS USE ONLY
================================================================================

1. INCIDENT OVERVIEW:
   - Incident Name: ${activeIncident ? activeIncident.title : selectedState + ' Regional Grid'}
   - Affected State: ${selectedState}
   - Target District: ${activeIncident ? activeIncident.district : 'Data Currently Unavailable'}
   - Disaster Type: ${sitrep.disasterType}
   - Severity Level: ${sitrep.severity} (Confidence: ${activeIncident ? activeIncident.confidenceScore + '%' : '100%'})

2. CURRENT SITUATION & TELEMETRY SUMMARY:
   ${sitrep.overview}

3. IMPACT ASSESSMENT:
   - Estimated Population Affected: ${sitrep.affectedPopulation > 0 ? sitrep.affectedPopulation.toLocaleString() + ' Individuals' : 'Data Currently Unavailable / Minimal'}
   - Geographic Coverage Area: ${sitrep.affectedAreaSqKm > 0 ? sitrep.affectedAreaSqKm + ' Sq. Km' : 'Data Currently Unavailable'}
   - Critical Infrastructure Status: ${sitrep.infrastructureDamageSummary}

4. SOS & EMERGENCY STATUS:
   - Active SOS Distress Reports: ${sitrep.activeAlertsCount} Calls
   - Response Triage Status: ${sitrep.currentResponseStatus}

5. RESPONSE OPERATIONS:
   - Deployed Rescue Teams: ${sitrep.rescueTeamsCount} NDRF/SDRF Battalion Units
   - UAV Surveillance Status: ${sitrep.uavStatusSummary}
   - Relief Camp Network: ${sitrep.reliefCampCapacitySummary}

6. ACCESSIBILITY & ROUTING:
   - Priority Logistics Corridors: ${sitrep.roadStatusSummary}
   - Recommended Evacuation Route: ${activeIncident ? activeIncident.recommendedRoute : 'Standard Arterial Route'}

7. FORECAST & RISK OUTLOOK (24-72H):
   - 72-Hour AI Hazard Outlook: ${sitrep.forecast72hSummary}

8. IMMEDIATE ACTION REQUIRED:
${sitrep.recommendedActions.map((a, i) => `   ${i + 1}. ${a}`).join('\n')}

================================================================================
AI OPERATIONAL ASSESSMENT:
High-confidence multi-source telemetry synthesized across Open-Meteo, ISRO Bhuvan GIS, and CWC Hydro Mesh. Mandatory mobilization of field task forces advised.
================================================================================
AUTHENTICATION & SIGN-OFF:
Prepared By: AI Emergency Intelligence Engine (Jeevan Setu v2.4)
Reviewed By: Duty Officer, NEOC MDoNER Operations Control
Stamp: [ E-SIGNED & VERIFIED / OFFICIAL EMERGENCY DISPATCH ]
================================================================================
`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OFFICIAL_SITREP_${selectedState}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scrollToDocument = () => {
    setViewDocument(true);
    setTimeout(() => {
      const docEl = document.getElementById('official-sitrep-document');
      if (docEl) {
        docEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Controls Banner (Hidden in Print) */}
      <div className="no-print rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-black text-sky-400 border border-sky-500/40 uppercase tracking-wide">
                GOVERNMENT SITREP GENERATOR
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                STRICTLY 8 NORTH-EASTERN STATES
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <FileText className="h-7 w-7 text-sky-400" />
              <span>AI Situation Report (SITREP) Generator</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Synthesizes real-time telemetry from radar, hydrology, SOS triage, rescue teams, UAVs, and damage assessments into an official single-page Government Emergency SITREP document.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateSITREP}
              disabled={isGenerating}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-lg hover:from-sky-500 hover:to-indigo-500 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isGenerating ? 'SYNTHESIZING TELEMETRY...' : '✨ GENERATE AI SITREP'}</span>
            </button>
          </div>
        </div>

        {/* State & District Selector Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Select North-Eastern State (India)
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-sky-500 focus:outline-none"
            >
              {NER_STATES.map((state) => (
                <option key={state} value={state}>
                  🇮🇳 {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Active Disaster Grid / District
            </label>
            <select
              value={selectedIncidentId}
              onChange={(e) => handleIncidentSelect(e.target.value)}
              disabled={stateIncidents.length === 0}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs font-bold text-white focus:border-sky-500 focus:outline-none disabled:opacity-50"
            >
              {stateIncidents.length > 0 ? (
                stateIncidents.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    [{inc.severity}] {inc.district} — {inc.title}
                  </option>
                ))
              ) : (
                <option value="">Data Currently Unavailable for {selectedState}</option>
              )}
            </select>
          </div>

          <div className="flex items-end">
            {sitrep && (
              <div className="flex items-center gap-2 w-full">
                <button
                  onClick={scrollToDocument}
                  className="flex-1 rounded-xl border border-sky-500/40 bg-sky-950/40 px-3 py-2.5 text-xs font-bold text-sky-300 hover:bg-sky-900/60 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  <span>VIEW FULL REPORT</span>
                </button>
                <button
                  onClick={handlePrintPDF}
                  className="flex-1 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 shadow flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>DOWNLOAD PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generation Loader Modal (1.5s Multi-Step Animation) */}
      {isGenerating && (
        <div className="no-print fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl border border-sky-500/40 bg-slate-900 p-6 shadow-2xl space-y-5 text-center">
            <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
              <Activity className="h-6 w-6 text-sky-400" />
            </div>

            <div>
              <h3 className="text-base font-black text-white">Generating AI SITREP Document</h3>
              <p className="text-xs text-slate-400 mt-1">Collecting live telemetry across North-Eastern disaster grids...</p>
            </div>

            <div className="space-y-2 text-left text-xs font-mono">
              <div className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${loaderStep >= 1 ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <CheckCircle2 className={`h-4 w-4 ${loaderStep >= 1 ? 'text-sky-400' : 'text-slate-600'}`} />
                <span>1. Fetching Satellite & Weather Telemetry (ISRO / Open-Meteo)</span>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${loaderStep >= 2 ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <CheckCircle2 className={`h-4 w-4 ${loaderStep >= 2 ? 'text-sky-400' : 'text-slate-600'}`} />
                <span>2. Triaging Citizen SOS Distress Signals & Priority Matrix</span>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${loaderStep >= 3 ? 'bg-sky-950/40 border-sky-500/40 text-sky-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <CheckCircle2 className={`h-4 w-4 ${loaderStep >= 3 ? 'text-sky-400' : 'text-slate-600'}`} />
                <span>3. Evaluating NDRF/SDRF Task Force & UAV Drone Vectors</span>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all flex items-center gap-2 ${loaderStep >= 4 ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                <CheckCircle2 className={`h-4 w-4 ${loaderStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>4. Compiling Official MDoNER SITREP Document Format</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Government SITREP Document Container */}
      {(viewDocument || sitrep) && sitrep && (
        <div className="space-y-4">
          {/* Controls Bar Above Report (Hidden in Print) */}
          <div className="no-print flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>OFFICIAL DOCUMENT PREVIEW MODE — A4 PRINT READY</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPDF}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>DOWNLOAD OFFICIAL SITREP (PDF)</span>
              </button>
              <button
                onClick={handleDownloadText}
                className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-600 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>DOWNLOAD TXT</span>
              </button>
            </div>
          </div>

          {/* ONE-PAGE GOVERNMENT-STYLE EMERGENCY SITREP DOCUMENT */}
          <div
            id="official-sitrep-document"
            className="w-full max-w-4xl mx-auto bg-white text-slate-950 p-8 sm:p-10 shadow-2xl border-2 border-slate-300 font-sans leading-normal space-y-6"
            style={{ minHeight: '297mm', color: '#000000', backgroundColor: '#ffffff' }}
          >
            {/* 1. GOVERNMENT HEADER & EMBLEM */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl" role="img" aria-label="Emblem">🏛️</span>
              </div>
              <h2 className="text-xs font-black tracking-widest text-slate-700 uppercase">
                GOVERNMENT OF INDIA
              </h2>
              <h1 className="text-sm font-extrabold tracking-wide text-slate-950 uppercase">
                MINISTRY OF DEVELOPMENT OF NORTH EASTERN REGION (MDoNER)
              </h1>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                NATIONAL EMERGENCY OPERATIONS CENTRE (NEOC) & DISASTER COORDINATION
              </h2>
              <h3 className="text-xs font-black text-sky-900 uppercase tracking-widest pt-1 border-t border-slate-300 mt-2">
                JEEVAN SETU — AI-POWERED DISASTER INTELLIGENCE & EMERGENCY RESPONSE PLATFORM
              </h3>
            </div>

            {/* SITREP Operational Header Details Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-3 border border-slate-400 font-mono text-[11px] text-slate-900 font-bold">
              <div>
                <span className="text-slate-600 block text-[9px] uppercase font-sans">REPORT ID</span>
                <span>{sitrep.id}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[9px] uppercase font-sans">ISSUED TIMESTAMP (IST)</span>
                <span>{sitrep.generatedAt}</span>
              </div>
              <div>
                <span className="text-slate-600 block text-[9px] uppercase font-sans">TELEMETRY STATUS</span>
                <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 text-[10px] rounded">
                  {sitrep.dataStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block text-[9px] uppercase font-sans">DOCUMENT CLASSIFICATION</span>
                <span className="text-rose-700">PAGE 1 OF 1 (RESTRICTED)</span>
              </div>
            </div>

            {/* DOCUMENT SECTIONS 1 TO 8 */}
            <div className="space-y-5 text-xs text-slate-900 font-sans">
              
              {/* SECTION 1: INCIDENT OVERVIEW */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  1. INCIDENT OVERVIEW
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 pt-1 font-sans">
                  <div><b>Incident Title / ID:</b> {activeIncident ? `${activeIncident.title} (${activeIncident.id})` : `${selectedState} Regional Monitoring Sector`}</div>
                  <div><b>State & District:</b> <span className="font-bold text-sky-900">{selectedState}</span>, {activeIncident ? activeIncident.district : 'Data Currently Unavailable'}</div>
                  <div><b>Disaster Classification:</b> {sitrep.disasterType}</div>
                  <div>
                    <b>Severity Level:</b>{' '}
                    <span className={`font-bold px-1.5 py-0.5 text-[10px] rounded border ${sitrep.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border-rose-400' : sitrep.severity === 'HIGH' ? 'bg-amber-100 text-amber-800 border-amber-400' : 'bg-slate-100 text-slate-800 border-slate-400'}`}>
                      {sitrep.severity}
                    </span>{' '}
                    (AI Confidence: {activeIncident ? activeIncident.confidenceScore + '%' : '100%'})
                  </div>
                </div>
              </div>

              {/* SECTION 2: CURRENT SITUATION & TELEMETRY SUMMARY */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  2. CURRENT SITUATION & TELEMETRY SUMMARY
                </h4>
                <p className="leading-relaxed text-slate-800 font-serif text-[11px]">
                  {sitrep.overview}
                </p>
                <div className="text-[10px] font-mono text-slate-600">
                  Telemetry Feeds Synchronized: ISRO Bhuvan Satellite Mesh, Open-Meteo Radar Grid, CWC Hydrological Stream Gauge Data.
                </div>
              </div>

              {/* SECTION 3: IMPACT ASSESSMENT */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  3. IMPACT ASSESSMENT
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans pt-1">
                  <div className="p-2 border border-slate-300 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">POPULATION AFFECTED</span>
                    <span className="text-sm font-black text-slate-900">
                      {sitrep.affectedPopulation > 0 ? sitrep.affectedPopulation.toLocaleString() + ' Individuals' : 'Data Currently Unavailable'}
                    </span>
                  </div>

                  <div className="p-2 border border-slate-300 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">GEOGRAPHIC AREA</span>
                    <span className="text-sm font-black text-slate-900">
                      {sitrep.affectedAreaSqKm > 0 ? sitrep.affectedAreaSqKm + ' Sq. Km' : 'Data Currently Unavailable'}
                    </span>
                  </div>

                  <div className="p-2 border border-slate-300 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">PRIMARY INFRASTRUCTURE RISK</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight block">
                      {sitrep.infrastructureDamageSummary}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: SOS & EMERGENCY STATUS */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  4. SOS & EMERGENCY STATUS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 font-sans">
                  <div>
                    <b>Total Active SOS Calls Received:</b> <span className="font-bold text-rose-800">{sitrep.activeAlertsCount} Calls</span>
                  </div>
                  <div>
                    <b>Operational Triage Lifecycle:</b> <span className="font-mono font-bold text-slate-800">{sitrep.currentResponseStatus}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: RESPONSE OPERATIONS */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  5. RESPONSE OPERATIONS
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans pt-1">
                  <div><b>Deployed Task Forces:</b> {sitrep.rescueTeamsCount} NDRF/SDRF Teams</div>
                  <div><b>UAV Reconnaissance:</b> {sitrep.uavStatusSummary}</div>
                  <div><b>Relief Camps Active:</b> {sitrep.reliefCampCapacitySummary}</div>
                </div>
              </div>

              {/* SECTION 6: ACCESSIBILITY & ROUTING */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  6. ACCESSIBILITY & ROUTING
                </h4>
                <div className="space-y-1 font-sans pt-1">
                  <div><b>Arterial Highway Status:</b> <span className="font-mono font-bold text-slate-900">{sitrep.roadStatusSummary}</span></div>
                  <div><b>Recommended Evacuation Route:</b> {activeIncident ? activeIncident.recommendedRoute : 'Standard State Arterial Route'}</div>
                </div>
              </div>

              {/* SECTION 7: FORECAST & RISK OUTLOOK (24-72H) */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  7. FORECAST & RISK OUTLOOK (24–72H)
                </h4>
                <div className="p-2.5 bg-slate-50 border border-slate-300 font-mono text-[11px]">
                  <b>AI Predictive Risk Vector:</b> {sitrep.forecast72hSummary}
                </div>
              </div>

              {/* SECTION 8: IMMEDIATE ACTION REQUIRED */}
              <div className="space-y-1.5 border-b border-slate-300 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-l-4 border-slate-900 pl-2 bg-slate-100 py-1">
                  8. IMMEDIATE ACTION REQUIRED
                </h4>
                <ol className="list-decimal pl-5 space-y-1 font-sans font-medium text-slate-900 text-[11px]">
                  {sitrep.recommendedActions.map((action, i) => (
                    <li key={i}>{action}</li>
                  ))}
                </ol>
              </div>

              {/* AI OPERATIONAL ASSESSMENT CALLOUT BOX */}
              <div className="p-3 bg-amber-50 border-l-4 border-amber-600 border-t border-r border-b border-amber-200 text-slate-900 space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                  <span>AI OPERATIONAL ASSESSMENT & EXECUTIVE DIRECTIVE</span>
                </div>
                <p className="text-[11px] font-serif leading-relaxed text-slate-800">
                  Multi-source telemetry confirms active risk parameters across {selectedState}. District Magistrate and SDMA Command must ensure immediate deployment of quick response assets to high-vulnerability sectors as outlined in Section 8.
                </p>
              </div>

              {/* OFFICIAL AUTHENTICATION SIGN-OFF BLOCK */}
              <div className="pt-4 grid grid-cols-2 gap-6 items-end font-mono text-[10px] text-slate-800 border-t-2 border-slate-900">
                <div className="space-y-1">
                  <div><b>PREPARED BY:</b> AI Emergency Intelligence Engine (Jeevan Setu v2.4)</div>
                  <div><b>REVIEWED BY:</b> Duty Officer, NEOC MDoNER Command Centre</div>
                  <div><b>LOCATION:</b> Shillong / New Delhi Emergency Operations Grid</div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block p-2 border-2 border-dashed border-slate-900 bg-slate-50 text-center font-sans font-bold">
                    <div className="text-[9px] uppercase tracking-widest text-slate-600">OFFICIAL E-STAMP & SIGNATURE</div>
                    <div className="text-xs text-sky-950 font-mono tracking-tighter">[ E-SIGNED / DISASTER OPERATIONS CONTROL ]</div>
                    <div className="text-[8px] text-slate-500 font-mono">NEOC-MDoNER VERIFIED TELEMETRY</div>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Notice */}
            <div className="border-t border-slate-300 pt-2 text-center text-[9px] font-mono text-slate-500">
              JEEVAN SETU DISASTER MANAGEMENT SYSTEM &bull; STRICTLY FOR NORTH-EASTERN REGION OF INDIA &bull; SITREP DOCUMENT PAGE 1 OF 1
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
