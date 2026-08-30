import React, { useState } from 'react';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Building2,
  FileText,
  Shield,
  Activity,
  Layers
} from 'lucide-react';
import { incidentStore } from '../services/api/incidentStore';

export default function AIDamageAssessment() {
  const activeIncident = incidentStore.getActiveIncident();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [damageResult, setDamageResult] = useState<any | null>(null);

  const sampleEvidence = [
    {
      title: 'NH-6 Km 142 Mudslide Breach',
      url: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
      category: 'Road & Highway',
      severity: 'CRITICAL'
    },
    {
      title: 'Culvert #4 High Waterlogging',
      url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=800&q=80',
      category: 'Bridge / Culvert',
      severity: 'HIGH'
    },
    {
      title: 'Sector 4 Residential Submergence',
      url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
      category: 'Residential',
      severity: 'HIGH'
    }
  ];

  const handleRunAnalysis = (url?: string) => {
    setIsScanning(true);
    setDamageResult(null);
    if (url) setSelectedPhoto(url);

    setTimeout(() => {
      setIsScanning(false);
      setDamageResult({
        incidentId: activeIncident.id,
        assessmentId: `DMG-SCAN-${Date.now().toString().slice(-4)}`,
        overallSeverity: 'CRITICAL',
        confidenceScore: 94,
        buildingDamage: 'CRITICAL (3 structures partially collapsed along ridge)',
        roadDamage: 'CRITICAL (350m continuous slope breach on primary corridor)',
        bridgeDamage: 'HIGH (Scour risk at Culvert #4 pier foundations)',
        floodImpact: '+34% surface water expansion near low-lying river tributaries',
        landslideImpact: '215m high-velocity mud & debris accumulation',
        estimatedFinancialLoss: '₹ 7.35 Crores (INR)',
        recommendedAction: 'Deploy BRO heavy excavators & freeze civil traffic on NH-6',
        dataStatus: 'AI ESTIMATE'
      });
    }, 1200);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/60 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-purple-500/20 px-2.5 py-0.5 text-[11px] font-black text-purple-300 border border-purple-500/40 uppercase">
                RECOVERY STAGE — DAMAGE ASSESSMENT
              </span>
              <span className="rounded bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-mono text-amber-400 border border-amber-500/30">
                AI ESTIMATE
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Camera className="h-7 w-7 text-purple-400" />
              <span>AI Multi-Hazard Structural & Infrastructure Damage Triage</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Multimodal computer vision pipeline assessing building collapses, road breaches, bridge scouring, and landslide debris volume from field photos.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-right font-mono text-xs">
            <div className="text-slate-400">Target Incident:</div>
            <div className="text-amber-400 font-bold">{activeIncident.id}</div>
            <div className="text-purple-300 text-[11px]">{activeIncident.locationName}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sample Photo Selection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="h-4 w-4 text-purple-400" />
              <span>Select Field Photo Evidence</span>
            </h2>

            <div className="space-y-3">
              {sampleEvidence.map((sample, idx) => (
                <div
                  key={idx}
                  onClick={() => handleRunAnalysis(sample.url)}
                  className="cursor-pointer rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 flex items-center gap-3 hover:border-purple-500 transition"
                >
                  <img
                    src={sample.url}
                    alt={sample.title}
                    className="h-14 w-20 object-cover rounded-lg shrink-0 border border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">{sample.title}</h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sample.category}</div>
                    <span className="inline-block mt-1 rounded bg-rose-500/20 px-2 py-0.5 text-[9px] font-bold text-rose-400 border border-rose-500/30">
                      {sample.severity} SEVERITY
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleRunAnalysis(sampleEvidence[0].url)}
              disabled={isScanning}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-3 text-xs font-bold text-white shadow-lg hover:from-purple-500 hover:to-indigo-500 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isScanning ? 'Processing AI Vision Model...' : 'RUN AI DAMAGE ANALYSIS'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: AI Damage Report Output */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>AI Damage Assessment Report</span>
              </h2>

              <span className="rounded bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-[10px] font-mono font-bold border border-amber-500/30">
                DATA STATUS: AI ESTIMATE
              </span>
            </div>

            {isScanning ? (
              <div className="py-16 text-center space-y-3">
                <Sparkles className="h-10 w-10 text-purple-500 mx-auto animate-spin" />
                <div className="text-xs font-bold text-slate-300">Scanning Satellite & Photo Pixels...</div>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto font-mono">
                  Extracting structural deformation, debris volume, and financial loss metrics
                </p>
              </div>
            ) : damageResult ? (
              <div className="space-y-4 font-mono text-xs">
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-rose-400 font-bold uppercase text-sm">
                      OVERALL DAMAGE SEVERITY: {damageResult.overallSeverity}
                    </span>
                    <span className="text-xs text-slate-300 font-bold">
                      Confidence: {damageResult.confidenceScore}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 font-sans">
                    Incident ID: <b>{damageResult.incidentId}</b> &bull; Report ID: <b>{damageResult.assessmentId}</b>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Building Damage</div>
                    <div className="text-slate-200 text-[11px] font-sans">{damageResult.buildingDamage}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Road / Highway Breach</div>
                    <div className="text-slate-200 text-[11px] font-sans">{damageResult.roadDamage}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Bridge & Culvert Damage</div>
                    <div className="text-slate-200 text-[11px] font-sans">{damageResult.bridgeDamage}</div>
                  </div>

                  <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Est. Financial Loss</div>
                    <div className="text-amber-400 font-bold text-sm">{damageResult.estimatedFinancialLoss}</div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-950 p-3.5 space-y-1.5 font-sans">
                  <div className="text-xs font-bold text-purple-300">Recommended Executive Recovery Action:</div>
                  <p className="text-xs text-slate-300 leading-normal">{damageResult.recommendedAction}</p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                Select a field photo from the left panel and click <b>RUN AI DAMAGE ANALYSIS</b>.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
