import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Radio,
  UserCheck,
  Send,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { incidentStore, RescueTeam, CitizenSOS } from '../services/api/incidentStore';

export default function RescueTeamCommand() {
  const [teams, setTeams] = useState<RescueTeam[]>(incidentStore.getRescueTeams());
  const [sosList, setSosList] = useState<CitizenSOS[]>(incidentStore.getSOSAlerts());
  const activeIncident = incidentStore.getActiveIncident();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSosId, setSelectedSosId] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = incidentStore.subscribe(() => {
      setTeams(incidentStore.getRescueTeams());
      setSosList(incidentStore.getSOSAlerts());
    });
    return unsub;
  }, []);

  const handleAssignTeam = (teamId: string, sosId: string) => {
    incidentStore.assignRescueTeam(teamId, sosId, activeIncident.id);
    const team = teams.find(t => t.id === teamId);
    const sos = sosList.find(s => s.id === sosId);

    setAssignmentMessage(`ASSIGNED SUCCESS: ${team?.name} dispatched to Ticket ${sosId} (${sos?.locationName}). ETA: ${team?.etaMinutes} Mins.`);
    setSelectedTeamId(null);
    setSelectedSosId(null);
    setTimeout(() => setAssignmentMessage(null), 6000);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-black text-sky-400 border border-sky-500/40 uppercase">
                RESCUE STAGE
              </span>
              <span className="rounded bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/30">
                VERIFIED DATA COMMAND
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
              <Users className="h-7 w-7 text-sky-400" />
              <span>NDRF / SDRF Rescue Team Command & Tactical Dispatch</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Manage specialized disaster response battalions, engineer units, and medical triage teams. Assign active teams to high-priority citizen distress calls and sector zones.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-3 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Active Incident</div>
              <div className="text-amber-400 font-black text-sm">{activeIncident.id}</div>
              <div className="text-[11px] text-slate-300">{activeIncident.locationName}</div>
            </div>
          </div>
        </div>
      </div>

      {assignmentMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-400 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span className="font-bold">{assignmentMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rescue Teams Status Cards */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            <span>Deployed Response Squads ({teams.length})</span>
          </h2>

          <div className="space-y-3">
            {teams.map(team => (
              <div
                key={team.id}
                className={`rounded-2xl border p-4 space-y-3 transition-all ${
                  selectedTeamId === team.id
                    ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/40 shadow-xl ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {team.id}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{team.name}</h3>
                    <span className="rounded bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px] font-semibold border border-slate-700">
                      {team.teamType}
                    </span>
                  </div>

                  <span
                    className={`rounded px-2.5 py-0.5 text-[10px] font-black border ${
                      team.status === 'AVAILABLE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : team.status === 'EN_ROUTE'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                        : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                    }`}
                  >
                    STATUS: {team.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Current Base</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">{team.currentLocation}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Personnel</div>
                    <div className="font-bold text-sky-400">{team.personnelCount} Personnel</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Dispatch ETA</div>
                    <div className="font-bold text-emerald-400">{team.etaMinutes} Mins</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-400">Radio Contact</div>
                    <div className="font-semibold text-slate-300 text-[10px]">{team.contactNumber}</div>
                  </div>
                </div>

                {team.assignedSosId && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300 flex items-center justify-between">
                    <span>Assigned Distress Incident: <b>{team.assignedSosId}</b></span>
                    <span className="font-mono text-[10px] text-slate-400">{team.dataStatus}</span>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedTeamId(selectedTeamId === team.id ? null : team.id)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedTeamId === team.id
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>{selectedTeamId === team.id ? 'Deselect Squad' : 'Select Squad for Assignment'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Pending SOS Selection & Direct Assign Action */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Radio className="h-4 w-4 text-rose-500" />
            <span>Unassigned SOS Tickets ({sosList.filter(s => s.status !== 'ASSIGNED' && s.status !== 'RESOLVED').length})</span>
          </h2>

          <div className="space-y-3">
            {sosList
              .filter(s => s.status !== 'RESOLVED')
              .map(sos => (
                <div
                  key={sos.id}
                  onClick={() => setSelectedSosId(sos.id)}
                  className={`cursor-pointer rounded-2xl border p-4 space-y-2 transition ${
                    selectedSosId === sos.id
                      ? 'border-rose-500 bg-rose-500/10 dark:bg-rose-950/40 shadow-xl ring-2 ring-rose-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-rose-400">{sos.id}</span>
                      <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                        {sos.priority}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{sos.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">{sos.description}</p>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-rose-400" />
                    <span>{sos.locationName}</span>
                  </div>
                </div>
              ))}
          </div>

          {/* Execute Assignment Action Box */}
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/80 to-slate-900 p-5 shadow-2xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Squad Assignment Dispatch Console</span>
            </h3>

            <div className="text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Team:</span>
                <b className="text-amber-400">{selectedTeamId || 'None Selected'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target SOS Ticket:</span>
                <b className="text-rose-400">{selectedSosId || 'None Selected'}</b>
              </div>
            </div>

            <button
              disabled={!selectedTeamId || !selectedSosId}
              onClick={() => selectedTeamId && selectedSosId && handleAssignTeam(selectedTeamId, selectedSosId)}
              className={`w-full rounded-xl p-3 text-xs font-bold text-white shadow-lg transition flex items-center justify-center gap-2 ${
                selectedTeamId && selectedSosId
                  ? 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Send className="h-4 w-4" />
              <span>DISPATCH & ASSIGN SQUAD NOW</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
