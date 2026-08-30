import React, { useState, useEffect } from 'react';
import SmartSearchInput from './common/SmartSearchInput';
import {
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  User,
  Phone,
  MapPin,
  Camera,
  Users,
  HeartPulse,
  Filter,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Mic,
  MicOff
} from 'lucide-react';
import { incidentStore, CitizenSOS, DataStatusTag } from '../services/api/incidentStore';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

export default function CitizenSOSModule() {
  const [sosList, setSosList] = useState<CitizenSOS[]>(incidentStore.getAllSOSAlerts());
  const activeIncident = incidentStore.getActiveIncident();
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [sosSearch, setSosSearch] = useState<string>('');

  // Form State
  const [reporterName, setReporterName] = useState('');
  const [distressType, setDistressType] = useState<CitizenSOS['distressType']>('Flood');
  const [locationName, setLocationName] = useState(activeIncident.locationName);
  const [personsAffected, setPersonsAffected] = useState(4);
  const [isMedicalEmergency, setIsMedicalEmergency] = useState(false);
  const [description, setDescription] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const { isListening, toggleListening, transcript } = useVoiceRecognition({
    language: 'hi-IN',
    onResult: (spokenText) => {
      setDescription(spokenText);
      const lower = spokenText.toLowerCase();
      if (lower.includes('flood') || lower.includes('baadh') || lower.includes('badh')) {
        setDistressType('Flood');
      } else if (lower.includes('landslide') || lower.includes('slope')) {
        setDistressType('Landslide');
      } else if (lower.includes('trapped')) {
        setDistressType('Trapped Person');
      } else if (lower.includes('medical') || lower.includes('aspataal') || lower.includes('hospital')) {
        setDistressType('Medical Emergency');
        setIsMedicalEmergency(true);
      }
    }
  });

  useEffect(() => {
    const unsub = incidentStore.subscribe(() => {
      setSosList(incidentStore.getAllSOSAlerts());
    });
    return unsub;
  }, []);

  const handleSubmitSOS = (e: React.FormEvent) => {
    e.preventDefault();
    
    const loc = locationName.trim() || activeIncident.locationName;
    const finalDesc = description.trim() || `${distressType} emergency broadcast reported near ${loc}. Urgent evacuation & triage requested for ${personsAffected} affected individual(s).`;

    const priority: CitizenSOS['priority'] = isMedicalEmergency
      ? 'CRITICAL'
      : personsAffected > 10
      ? 'HIGH'
      : 'MEDIUM';

    const newSos = incidentStore.addSOS({
      incidentId: activeIncident.id,
      reporterName: reporterName.trim() || 'Anonymous Citizen Reporter',
      distressType,
      locationName: loc,
      lat: activeIncident.lat + (Math.random() * 0.04 - 0.02),
      lon: activeIncident.lon + (Math.random() * 0.04 - 0.02),
      personsAffected: Number(personsAffected) || 1,
      isMedicalEmergency,
      description: finalDesc,
      priority
    });

    setSubmittedMessage(`🚨 BROADCAST SUCCESS: SOS Ticket ${newSos.id} (${newSos.priority} Priority) dispatched to NDRF Command!`);
    setDescription('');
    setReporterName('');
    setTimeout(() => setSubmittedMessage(null), 7000);
  };

  const handleQuickDemoFill = () => {
    setReporterName('Pragya Katiyar');
    setDistressType('Flood');
    setPersonsAffected(4);
    setLocationName('Shillong Sector, East Khasi Hills');
    setDescription('Severe waterlogging near low-lying culvert compound. 4 people trapped requiring urgent boat evacuation & medical triage.');
    setIsMedicalEmergency(true);
  };

  const filteredSos = sosList.filter(s => {
    if (filterPriority !== 'ALL' && s.priority !== filterPriority) return false;
    if (sosSearch) {
      const q = sosSearch.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.locationName.toLowerCase().includes(q) ||
        s.distressType.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header Banner */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/60 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-rose-500/20 px-2.5 py-0.5 text-[11px] font-black text-rose-400 border border-rose-500/40 uppercase">
                EMERGENCY RESPONSE STAGE
              </span>
              <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-mono text-sky-300 border border-sky-500/30">
                LIVE DATA BROADCAST
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-rose-500" />
              <span>Citizen SOS Emergency Reporting & Triage Grid</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Direct emergency portal for citizens and field reporters. Broadcast distress signals, trapped person coordinates, and urgent medical needs to the NDRF / MDoNER command grid.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 font-mono text-xs space-y-1">
            <div className="text-slate-400">Active Bound Incident:</div>
            <div className="text-amber-400 font-bold">{activeIncident.id} &bull; {activeIncident.title}</div>
            <div className="text-rose-400 text-[11px]">{activeIncident.severity} Severity Level</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: SOS Submission Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="h-4 w-4 text-rose-500" />
                <span>Submit Emergency SOS Broadcast</span>
              </h2>

              <button
                type="button"
                onClick={handleQuickDemoFill}
                className="rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 text-[10px] font-bold hover:bg-amber-500/30 transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>⚡ Auto-Fill Demo</span>
              </button>
            </div>

            {submittedMessage && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-400 font-bold flex items-center gap-2 animate-pulse">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{submittedMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSOS} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reporter Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pragya Katiyar / Anonymous Citizen"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Emergency Type *
                  </label>
                  <select
                    value={distressType}
                    onChange={e => setDistressType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-medium focus:border-rose-500 focus:outline-none"
                  >
                    <option value="Flood">Flood</option>
                    <option value="Landslide">Landslide</option>
                    <option value="Trapped Person">Trapped Person</option>
                    <option value="Medical Emergency">Medical Emergency</option>
                    <option value="Food/Water Shortage">Food/Water Shortage</option>
                    <option value="Infrastructure Damage">Infrastructure Damage</option>
                    <option value="Other">Other Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    People Affected *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={personsAffected}
                    onChange={e => setPersonsAffected(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Landmark / GPS Location *
                </label>
                <input
                  type="text"
                  placeholder="Location landmark or GPS coordinates"
                  value={locationName}
                  onChange={e => setLocationName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Distress Situation Description
                  </label>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/30'
                    }`}
                  >
                    {isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    <span>{isListening ? 'Stop' : '🎙️ Speak Alert'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder={isListening ? "🎙️ Listening... Speak your distress description verbally..." : "Describe trapped status, water depth, slope movement, or urgent medical requirement..."}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`w-full rounded-xl border p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none transition ${
                    isListening
                      ? 'border-rose-500 ring-2 ring-rose-500/30 bg-rose-500/10'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:border-rose-500'
                  }`}
                />
              </div>

              {/* Clean Checkbox Box */}
              <div
                onClick={() => setIsMedicalEmergency(!isMedicalEmergency)}
                className={`cursor-pointer flex items-center gap-3 rounded-xl border p-3 transition ${
                  isMedicalEmergency
                    ? 'border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/30'
                    : 'border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  id="medical"
                  checked={isMedicalEmergency}
                  onChange={e => setIsMedicalEmergency(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  className="h-4 w-4 rounded border-rose-500 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="medical" className="text-xs font-bold cursor-pointer flex items-center gap-1.5 select-none">
                  <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />
                  <span>URGENT MEDICAL EMERGENCY (Requires Oxygen / Doctor Triage)</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 p-3.5 text-xs font-extrabold text-white shadow-xl hover:from-rose-500 hover:to-amber-500 flex items-center justify-center gap-2 cursor-pointer transition transform active:scale-95"
              >
                <AlertTriangle className="h-4 w-4 animate-bounce" />
                <span>BROADCAST EMERGENCY SOS SIGNAL NOW</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live SOS Triage Queue */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-500" />
                <span>Active SOS Emergency Triage Queue ({filteredSos.length})</span>
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-48 sm:w-56">
                  <SmartSearchInput
                    placeholder="Search SOS alerts..."
                    value={sosSearch}
                    onChange={setSosSearch}
                  />
                </div>

                <div className="flex items-center gap-1">
                  {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(p => (
                    <button
                      key={p}
                      onClick={() => setFilterPriority(p)}
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                        filterPriority === p
                          ? 'bg-indigo-600 text-white shadow'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredSos.map(sos => (
                <div
                  key={sos.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-amber-500">{sos.id}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black border ${
                          sos.priority === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                            : sos.priority === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                        }`}
                      >
                        {sos.priority} PRIORITY
                      </span>
                      <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                        {sos.distressType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{sos.timestamp}</span>
                      <span className="rounded bg-emerald-500/20 text-emerald-400 px-2 py-0.5 text-[9px] font-bold border border-emerald-500/30">
                        {sos.dataStatus}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {sos.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-rose-400" />
                        <b className="text-slate-300">{sos.locationName}</b>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-sky-400" />
                        <span>{sos.personsAffected} Affected</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Status:</span>
                      <span className="font-bold text-amber-400 uppercase">{sos.status}</span>
                      {sos.assignedTeamId && (
                        <span className="rounded bg-sky-500/20 text-sky-300 px-2 py-0.5 text-[10px] font-mono">
                          Assigned: {sos.assignedTeamId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
