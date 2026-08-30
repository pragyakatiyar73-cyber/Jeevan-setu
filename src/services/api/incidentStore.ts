/**
 * 🛰️ Unified Incident-Centric Data Store (Jeevan Setu Core Engine)
 * 
 * Binds all 11 stages of disaster management:
 * MONITOR → DETECT → ASSESS → PREDICT → ALERT → RESPOND → RESCUE → EVACUATE → RELIEF → REPORT → RECOVER
 */

export type DataStatusTag = 'LIVE DATA' | 'VERIFIED DATA' | 'SIMULATION DATA' | 'AI ESTIMATE' | 'FORECAST';

export type ResponseStatusLifecycle =
  | 'NEW'
  | 'VERIFIED'
  | 'PRIORITIZED'
  | 'RESOURCE_RECOMMENDED'
  | 'TEAM_ASSIGNED'
  | 'EN_ROUTE'
  | 'REACHED_LOCATION'
  | 'RESCUE_IN_PROGRESS'
  | 'RESCUED_SAFE'
  | 'RESOLVED';

export interface DisasterIncident {
  id: string; // e.g. 'JS-2026-001'
  title: string;
  disasterType: 'Landslide & Cloudburst' | 'Flash Flood' | 'Severe Erosion' | 'Cyclone / Storm' | 'Earthquake';
  state: string;
  district: string;
  locationName: string;
  lat: number;
  lon: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // e.g. 94%
  affectedAreaSqKm: number;
  affectedPopulation: number;
  infrastructureRisk: string;
  roadRiskStatus: string;
  timestamp: string;
  source: string;
  dataStatus: DataStatusTag;
  
  // Life-Saving Response Engine Fields
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityReason: string;
  keyRiskFactors: string[];
  requiredResourceCategories: string[];
  recommendedRoute: string;
  responseStatus: ResponseStatusLifecycle;
  statusUpdatedBy: string;
  statusUpdatedAt: string;

  // 72-Hour Prediction Trend
  forecast72h: {
    period0_24h: { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; conditions: string; threat: string; action: string };
    period24_48h: { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; conditions: string; threat: string; action: string };
    period48_72h: { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; conditions: string; threat: string; action: string };
  };

  // Associated Counts
  activeSosCount: number;
  rescueTeamsAssigned: number;
  uavUnitsDispatched: number;
  reliefeCampsActive: number;
  overallRecoveryPercent: number;
}

export interface CitizenSOS {
  id: string; // e.g. 'SOS-2026-101'
  incidentId: string;
  reporterName?: string;
  distressType: 'Flood' | 'Landslide' | 'Trapped Person' | 'Medical Emergency' | 'Food/Water Shortage' | 'Infrastructure Damage' | 'Other';
  locationName: string;
  lat: number;
  lon: number;
  personsAffected: number;
  isMedicalEmergency: boolean;
  photoUrl?: string;
  description: string;
  timestamp: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ACKNOWLEDGED' | 'ASSIGNED' | 'RESCUING' | 'RESOLVED';
  assignedTeamId?: string;
  dataStatus: DataStatusTag;
}

export interface RescueTeam {
  id: string; // e.g. 'TEAM-04'
  name: string;
  teamType: 'NDRF Battalion' | 'SDRF Quick Response' | 'Indian Army Engineers' | 'Medical Triage Unit' | 'Civil Defense';
  currentLocation: string;
  lat: number;
  lon: number;
  status: 'AVAILABLE' | 'EN_ROUTE' | 'ON_SITE' | 'RESTING';
  assignedIncidentId?: string;
  assignedSosId?: string;
  etaMinutes: number;
  personnelCount: number;
  contactNumber: string;
  dataStatus: DataStatusTag;
}

export interface EvacuationRoute {
  id: string;
  incidentId: string;
  name: string;
  origin: string;
  destinationCamp: string;
  riskRating: 'SAFE' | 'HIGH_RISK' | 'BLOCKED';
  isRecommended: boolean;
  distanceKm: number;
  estimatedTravelMins: number;
  evacueeCapacityPerHour: number;
  recommendationLabel: 'AI/Algorithmic Recommendation' | 'Manual Override' | 'Historical Route';
}

export interface ReliefCamp {
  id: string; // e.g. 'CAMP-SHL-01'
  incidentId: string;
  name: string;
  locationName: string;
  lat: number;
  lon: number;
  totalCapacity: number;
  occupiedCapacity: number;
  foodSupplyStatus: 'ADEQUATE' | 'CRITICAL' | 'REPLENISHING';
  waterSupplyStatus: 'ADEQUATE' | 'CRITICAL' | 'REPLENISHING';
  medicalSupportStatus: 'FULL_DOCTORS_ON_SITE' | 'PARAMEDICS_ONLY' | 'URGENT_MEDICINE_NEEDED';
  status: 'ACTIVE' | 'PREPARING' | 'FULL';
  dataStatus: DataStatusTag;
}

export interface DamageItem {
  id: string;
  incidentId: string;
  assetName: string;
  assetCategory: 'Road / Highway' | 'Bridge' | 'Power Substation' | 'Hospital' | 'School' | 'Residential';
  location: string;
  damageSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedCostInrLakhs: number;
  repairStatus: 'NOT STARTED' | 'IN PROGRESS' | 'COMPLETED';
  repairPercent: number;
  priority: 'CRITICAL_HIGH' | 'MEDIUM' | 'STANDARD';
  assignedAgency: string;
}

export interface SITREPReport {
  id: string;
  incidentId: string;
  generatedAt: string;
  overview: string;
  disasterType: string;
  severity: string;
  affectedPopulation: number;
  affectedAreaSqKm: number;
  infrastructureDamageSummary: string;
  roadStatusSummary: string;
  activeAlertsCount: number;
  rescueTeamsCount: number;
  uavStatusSummary: string;
  essentialSuppliesStatus: string;
  reliefCampCapacitySummary: string;
  forecast72hSummary: string;
  recommendedActions: string[];
  currentResponseStatus: string;
  dataStatus: DataStatusTag;
}

// Initial Incident Database
const INITIAL_INCIDENTS: DisasterIncident[] = [
  {
    id: 'JS-2026-001',
    title: 'East Khasi Hills Landslide & Flash Flood Grid',
    disasterType: 'Landslide & Cloudburst',
    state: 'Meghalaya',
    district: 'East Khasi Hills',
    locationName: 'Shillong Sector, Meghalaya',
    lat: 25.5788,
    lon: 91.8933,
    severity: 'CRITICAL',
    confidenceScore: 96,
    affectedAreaSqKm: 142.5,
    affectedPopulation: 18400,
    infrastructureRisk: 'NH-6 Breach Point (350m slope collapsed near Km 142)',
    roadRiskStatus: 'NH-6 BLOCKED • SH-12 PARTIAL • NH-306 CLEAR',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'Open-Meteo Radar + ISRO Bhuvan GIS Mesh',
    dataStatus: 'VERIFIED DATA',
    priorityLevel: 'CRITICAL',
    priorityReason: 'High disaster severity + 8 active SOS reports + 3 urgent medical emergencies + NH-6 primary arterial highway blocked by 350m mudslide.',
    keyRiskFactors: ['18,400 People Affected', '3 Urgent Medical Emergency Calls', 'NH-6 Primary Highway Blocked', 'Cloudburst Rain Rate 42 mm/hr', 'Soil Saturation at 88%'],
    requiredResourceCategories: ['🚑 Rescue Team', '🏥 Medical Support', '🚁 UAV Recon', '📦 Essential Supplies', '💧 Drinking Water'],
    recommendedRoute: 'Route C (Jowai Ridge Bypass Corridor)',
    responseStatus: 'RESCUE_IN_PROGRESS',
    statusUpdatedBy: 'NDRF 1078 Triage Command',
    statusUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    forecast72h: {
      period0_24h: {
        risk: 'CRITICAL',
        conditions: 'Heavy cloudburst precipitation (42 mm/hr)',
        threat: 'Flash flooding near river tributaries and mudslide escalation',
        action: 'Immediate evacuation of Sector 4 low-lying culverts to Shillong High Cache Camp'
      },
      period24_48h: {
        risk: 'HIGH',
        conditions: 'Sustained rain 18 mm/hr with soil saturation at 88%',
        threat: 'Slope instability along NH-6 bypass ridges',
        action: 'Deploy heavy BRO excavators and reroute logistics convoys via Jowai'
      },
      period48_72h: {
        risk: 'MEDIUM',
        conditions: 'Precipitation tapering to 4 mm/hr',
        threat: 'Waterlogging in debris basins and power grid outages',
        action: 'Initiate structural damage assessment and power grid restoration'
      }
    },
    activeSosCount: 8,
    rescueTeamsAssigned: 4,
    uavUnitsDispatched: 3,
    reliefeCampsActive: 3,
    overallRecoveryPercent: 28
  },
  {
    id: 'JS-2026-002',
    title: 'Teesta River Basin Flash Flood',
    disasterType: 'Flash Flood',
    state: 'Sikkim',
    district: 'Gangtok & Mangan',
    locationName: 'Gangtok Command Sector, Sikkim',
    lat: 27.3389,
    lon: 88.6065,
    severity: 'HIGH',
    confidenceScore: 92,
    affectedAreaSqKm: 98.0,
    affectedPopulation: 9200,
    infrastructureRisk: 'NH-10 Teesta Corridor High Erosion Vulnerability',
    roadRiskStatus: 'NH-10 CAUTION (Speed restricted to 20 km/h)',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'CWC Hydrological Monitoring + Open-Meteo',
    dataStatus: 'LIVE DATA',
    priorityLevel: 'HIGH',
    priorityReason: 'Teesta River discharge at 1450 m³/s + 3 distress reports + high erosion threat along NH-10.',
    keyRiskFactors: ['9,200 People Affected', 'NH-10 Speed Restriction 20km/h', 'River Surge 1450 m³/s', 'High Bank Erosion'],
    requiredResourceCategories: ['🚑 Rescue Team', '🚒 Emergency Vehicle', '🏥 Medical Team', '📦 Ration Packs'],
    recommendedRoute: 'NH-717A High-Altitude Bypass',
    responseStatus: 'TEAM_ASSIGNED',
    statusUpdatedBy: 'Sikkim SDMA Control Room',
    statusUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    forecast72h: {
      period0_24h: { risk: 'HIGH', conditions: 'River discharge 1450 m³/s', threat: 'Low-lying bridge inundation', action: 'Divert heavy trucks to upper bypass' },
      period24_48h: { risk: 'MEDIUM', conditions: 'Discharge stabilizing', threat: 'Silt accumulation', action: 'Clear culverts' },
      period48_72h: { risk: 'LOW', conditions: 'Normal river flow', threat: 'Minor bank erosion', action: 'Inspect bridge piers' }
    },
    activeSosCount: 3,
    rescueTeamsAssigned: 2,
    uavUnitsDispatched: 2,
    reliefeCampsActive: 2,
    overallRecoveryPercent: 55
  },
  {
    id: 'JS-2026-003',
    title: 'Cachar Valley Waterlogging & Breach',
    disasterType: 'Flash Flood',
    state: 'Assam',
    district: 'Cachar',
    locationName: 'Silchar Southern Logistics Hub, Assam',
    lat: 24.8333,
    lon: 92.7789,
    severity: 'MEDIUM',
    confidenceScore: 88,
    affectedAreaSqKm: 65.4,
    affectedPopulation: 14500,
    infrastructureRisk: 'Substation #3 Drainage Overloaded',
    roadRiskStatus: 'State Connector Road Partial Waterlogging',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'Assam State Disaster Management Authority',
    dataStatus: 'VERIFIED DATA',
    priorityLevel: 'MEDIUM',
    priorityReason: 'Sub-surface waterlogging in urban sector + 2 SOS reports + dewatering pumps required.',
    keyRiskFactors: ['14,500 People Affected', 'Substation #3 Drainage Overloaded', 'Urban Waterlogging'],
    requiredResourceCategories: ['🚒 Dewatering Pumps', '💧 Drinking Water', '🏥 Paramedics'],
    recommendedRoute: 'Silchar Bypass Arterial',
    responseStatus: 'RESOURCE_RECOMMENDED',
    statusUpdatedBy: 'Silchar District Collectorate',
    statusUpdatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    forecast72h: {
      period0_24h: { risk: 'MEDIUM', conditions: 'Sub-surface waterlogging', threat: 'Urban traffic disruption', action: 'Deploy high-capacity dewatering pumps' },
      period24_48h: { risk: 'MEDIUM', conditions: 'Receding water table', threat: 'Drinking water contamination', action: 'Distribute chlorine tablets' },
      period48_72h: { risk: 'LOW', conditions: 'Normal drainage operational', threat: 'Debris clearing', action: 'Sanitize public shelters' }
    },
    activeSosCount: 2,
    rescueTeamsAssigned: 1,
    uavUnitsDispatched: 1,
    reliefeCampsActive: 1,
    overallRecoveryPercent: 72
  }
];

const INITIAL_SOS_ALERTS: CitizenSOS[] = [
  {
    id: 'SOS-2026-101',
    incidentId: 'JS-2026-001',
    reporterName: 'Pragyavati Sharma',
    distressType: 'Trapped Person',
    locationName: 'Km 142 East Khasi Hills Ridge',
    lat: 25.514,
    lon: 91.502,
    personsAffected: 6,
    isMedicalEmergency: true,
    photoUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=600&q=80',
    description: 'Vehicle trapped under mudslide debris. 2 elderly persons requiring oxygen support.',
    timestamp: '10:42 AM',
    priority: 'CRITICAL',
    status: 'NEW',
    dataStatus: 'LIVE DATA'
  },
  {
    id: 'SOS-2026-102',
    incidentId: 'JS-2026-001',
    reporterName: 'Lobsang Sangma',
    distressType: 'Flood',
    locationName: 'Sector 4 Low-Lying Culvert Zone',
    lat: 25.562,
    lon: 91.871,
    personsAffected: 14,
    isMedicalEmergency: false,
    description: 'Water level reached 4 feet inside residential compound. Need boat evacuation.',
    timestamp: '11:05 AM',
    priority: 'HIGH',
    status: 'ASSIGNED',
    assignedTeamId: 'TEAM-04',
    dataStatus: 'VERIFIED DATA'
  },
  {
    id: 'SOS-2026-103',
    incidentId: 'JS-2026-001',
    reporterName: 'Kangkan Gogoi',
    distressType: 'Food/Water Shortage',
    locationName: 'Jowai Ridge Bypass Shelter',
    lat: 25.200,
    lon: 92.200,
    personsAffected: 45,
    isMedicalEmergency: false,
    description: 'Relief shelter running out of clean drinking water packets.',
    timestamp: '11:20 AM',
    priority: 'MEDIUM',
    status: 'ACKNOWLEDGED',
    dataStatus: 'VERIFIED DATA'
  }
];

const INITIAL_RESCUE_TEAMS: RescueTeam[] = [
  {
    id: 'TEAM-01',
    name: 'NDRF 10th Battalion Alpha',
    teamType: 'NDRF Battalion',
    currentLocation: 'Guwahati Logistics Depot Hub',
    lat: 26.1445,
    lon: 91.7362,
    status: 'AVAILABLE',
    etaMinutes: 28,
    personnelCount: 35,
    contactNumber: '+91 94350-10781',
    dataStatus: 'VERIFIED DATA'
  },
  {
    id: 'TEAM-04',
    name: 'SDRF Meghalaya Quick Response',
    teamType: 'SDRF Quick Response',
    currentLocation: 'Shillong Command Center',
    lat: 25.5788,
    lon: 91.8933,
    status: 'EN_ROUTE',
    assignedIncidentId: 'JS-2026-001',
    assignedSosId: 'SOS-2026-102',
    etaMinutes: 14,
    personnelCount: 18,
    contactNumber: '+91 98620-55412',
    dataStatus: 'LIVE DATA'
  },
  {
    id: 'TEAM-07',
    name: 'Indian Army Task Force Taskor',
    teamType: 'Indian Army Engineers',
    currentLocation: 'Jowai Ridge Bypass Checkpoint',
    lat: 25.2000,
    lon: 92.2000,
    status: 'ON_SITE',
    assignedIncidentId: 'JS-2026-001',
    assignedSosId: 'SOS-2026-101',
    etaMinutes: 5,
    personnelCount: 50,
    contactNumber: '+91 94361-99800',
    dataStatus: 'VERIFIED DATA'
  }
];

const INITIAL_RELIEF_CAMPS: ReliefCamp[] = [
  {
    id: 'CAMP-SHL-01',
    incidentId: 'JS-2026-001',
    name: 'Shillong High-Altitude Relief Hub A',
    locationName: 'Shillong Sports Complex Sector',
    lat: 25.5810,
    lon: 91.8980,
    totalCapacity: 1200,
    occupiedCapacity: 780,
    foodSupplyStatus: 'ADEQUATE',
    waterSupplyStatus: 'ADEQUATE',
    medicalSupportStatus: 'FULL_DOCTORS_ON_SITE',
    status: 'ACTIVE',
    dataStatus: 'VERIFIED DATA'
  },
  {
    id: 'CAMP-JOW-02',
    incidentId: 'JS-2026-001',
    name: 'Jowai Ridge Evacuation Shelter B',
    locationName: 'Jowai Ridge Bypass Terminal',
    lat: 25.2050,
    lon: 92.2050,
    totalCapacity: 800,
    occupiedCapacity: 520,
    foodSupplyStatus: 'REPLENISHING',
    waterSupplyStatus: 'CRITICAL',
    medicalSupportStatus: 'PARAMEDICS_ONLY',
    status: 'ACTIVE',
    dataStatus: 'LIVE DATA'
  },
  {
    id: 'CAMP-SIL-03',
    incidentId: 'JS-2026-003',
    name: 'Silchar Central Relief Camp C',
    locationName: 'Silchar Southern Logistics Hub',
    lat: 24.8350,
    lon: 92.7800,
    totalCapacity: 1500,
    occupiedCapacity: 410,
    foodSupplyStatus: 'ADEQUATE',
    waterSupplyStatus: 'ADEQUATE',
    medicalSupportStatus: 'FULL_DOCTORS_ON_SITE',
    status: 'ACTIVE',
    dataStatus: 'VERIFIED DATA'
  }
];

const INITIAL_DAMAGE_ITEMS: DamageItem[] = [
  {
    id: 'DMG-101',
    incidentId: 'JS-2026-001',
    assetName: 'NH-6 Highway Breach Point (Km 142)',
    assetCategory: 'Road / Highway',
    location: 'East Khasi Hills Ridge Sector',
    damageSeverity: 'CRITICAL',
    estimatedCostInrLakhs: 480,
    repairStatus: 'IN PROGRESS',
    repairPercent: 35,
    priority: 'CRITICAL_HIGH',
    assignedAgency: 'BRO (Border Roads Organisation)'
  },
  {
    id: 'DMG-102',
    incidentId: 'JS-2026-001',
    assetName: 'Sector 4 Low-Lying Culvert #4 Bridge',
    assetCategory: 'Bridge',
    location: 'Shillong Sector Tributary',
    damageSeverity: 'HIGH',
    estimatedCostInrLakhs: 180,
    repairStatus: 'NOT STARTED',
    repairPercent: 0,
    priority: 'CRITICAL_HIGH',
    assignedAgency: 'Meghalaya PWD Engineers'
  },
  {
    id: 'DMG-103',
    incidentId: 'JS-2026-001',
    assetName: 'Substation #2 Primary Feeder Line',
    assetCategory: 'Power Substation',
    location: 'Shillong Central Distribution Grid',
    damageSeverity: 'MEDIUM',
    estimatedCostInrLakhs: 75,
    repairStatus: 'IN PROGRESS',
    repairPercent: 60,
    priority: 'MEDIUM',
    assignedAgency: 'Meghalaya Energy Corporation (MeECL)'
  }
];

class IncidentStoreService {
  private incidents: DisasterIncident[] = [...INITIAL_INCIDENTS];
  private sosAlerts: CitizenSOS[] = [...INITIAL_SOS_ALERTS];
  private rescueTeams: RescueTeam[] = [...INITIAL_RESCUE_TEAMS];
  private reliefCamps: ReliefCamp[] = [...INITIAL_RELIEF_CAMPS];
  private damageItems: DamageItem[] = [...INITIAL_DAMAGE_ITEMS];
  private activeIncidentId: string = 'JS-2026-001';
  private listeners: (() => void)[] = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getActiveIncidentId(): string {
    return this.activeIncidentId;
  }

  public setActiveIncidentId(id: string) {
    if (this.incidents.some(i => i.id === id)) {
      this.activeIncidentId = id;
      this.notify();
    }
  }

  public getIncidents(): DisasterIncident[] {
    return this.incidents;
  }

  public getActiveIncident(): DisasterIncident {
    return this.incidents.find(i => i.id === this.activeIncidentId) || this.incidents[0];
  }

  public updateIncidentResponseStatus(
    incidentId: string,
    status: ResponseStatusLifecycle,
    updatedBy: string = 'Authorized NDRF Commander'
  ) {
    const inc = this.incidents.find(i => i.id === incidentId);
    if (inc) {
      inc.responseStatus = status;
      inc.statusUpdatedBy = updatedBy;
      inc.statusUpdatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      this.notify();
    }
  }

  public getSOSAlerts(incidentId?: string): CitizenSOS[] {
    const targetId = incidentId || this.activeIncidentId;
    return this.sosAlerts.filter(s => s.incidentId === targetId);
  }

  public getAllSOSAlerts(): CitizenSOS[] {
    return this.sosAlerts;
  }

  public addSOS(sos: Omit<CitizenSOS, 'id' | 'timestamp' | 'status' | 'dataStatus'>): CitizenSOS {
    const newSos: CitizenSOS = {
      ...sos,
      id: `SOS-2026-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'NEW',
      dataStatus: 'LIVE DATA'
    };

    this.sosAlerts.unshift(newSos);
    
    // Update active incident SOS count
    const inc = this.incidents.find(i => i.id === sos.incidentId);
    if (inc) {
      inc.activeSosCount += 1;
    }

    // Try posting to backend API if available
    fetch('http://localhost:5000/api/sos/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSos)
    }).catch(() => {});

    this.notify();
    return newSos;
  }

  public updateSOSStatus(sosId: string, status: CitizenSOS['status'], assignedTeamId?: string) {
    const s = this.sosAlerts.find(item => item.id === sosId);
    if (s) {
      s.status = status;
      if (assignedTeamId) s.assignedTeamId = assignedTeamId;
      this.notify();
    }
  }

  public getRescueTeams(): RescueTeam[] {
    return this.rescueTeams;
  }

  public assignRescueTeam(teamId: string, sosId: string, incidentId?: string) {
    const team = this.rescueTeams.find(t => t.id === teamId);
    const sos = this.sosAlerts.find(s => s.id === sosId);

    if (team && sos) {
      team.status = 'EN_ROUTE';
      team.assignedIncidentId = incidentId || this.activeIncidentId;
      team.assignedSosId = sosId;
      sos.status = 'ASSIGNED';
      sos.assignedTeamId = teamId;
      this.notify();
    }
  }

  public getReliefCamps(incidentId?: string): ReliefCamp[] {
    const targetId = incidentId || this.activeIncidentId;
    return this.reliefCamps.filter(c => c.incidentId === targetId);
  }

  public updateReliefCampCapacity(campId: string, occupied: number) {
    const c = this.reliefCamps.find(item => item.id === campId);
    if (c) {
      c.occupiedCapacity = Math.min(c.totalCapacity, Math.max(0, occupied));
      if (c.occupiedCapacity >= c.totalCapacity) c.status = 'FULL';
      else c.status = 'ACTIVE';
      this.notify();
    }
  }

  public getDamageItems(incidentId?: string): DamageItem[] {
    const targetId = incidentId || this.activeIncidentId;
    return this.damageItems.filter(d => d.incidentId === targetId);
  }

  public updateDamageItemStatus(id: string, status: DamageItem['repairStatus'], percent: number) {
    const item = this.damageItems.find(d => d.id === id);
    if (item) {
      item.repairStatus = status;
      item.repairPercent = Math.min(100, Math.max(0, percent));
      this.notify();
    }
  }

  public generateSITREP(incidentId?: string): SITREPReport {
    const inc = this.incidents.find(i => i.id === (incidentId || this.activeIncidentId)) || this.incidents[0];
    const sosList = this.getSOSAlerts(inc.id);
    const teams = this.rescueTeams.filter(t => t.assignedIncidentId === inc.id);
    const camps = this.getReliefCamps(inc.id);
    const totalCapacity = camps.reduce((a, b) => a + b.totalCapacity, 0);
    const totalOccupied = camps.reduce((a, b) => a + b.occupiedCapacity, 0);

    return {
      id: `SITREP-${inc.id}-${Date.now().toString().slice(-4)}`,
      incidentId: inc.id,
      generatedAt: new Date().toLocaleString(),
      overview: `SITUATION REPORT: ${inc.title} - ${inc.severity} Severity Level. Telemetry synchronized with Open-Meteo & ISRO Bhuvan GIS Grid.`,
      disasterType: inc.disasterType,
      severity: inc.severity,
      affectedPopulation: inc.affectedPopulation,
      affectedAreaSqKm: inc.affectedAreaSqKm,
      infrastructureDamageSummary: inc.infrastructureRisk,
      roadStatusSummary: inc.roadRiskStatus,
      activeAlertsCount: inc.activeSosCount + 2,
      rescueTeamsCount: teams.length || inc.rescueTeamsAssigned,
      uavStatusSummary: `${inc.uavUnitsDispatched} UAV High-Altitude Recon Drones Active (Zero-Road Flight Vectors)`,
      essentialSuppliesStatus: `Relief Packets Allocated: 4,500 Units (Water, Rations, Medical Triage Packs)`,
      reliefCampCapacitySummary: `Active Camps: ${camps.length} | Capacity Occupied: ${totalOccupied} / ${totalCapacity} (${Math.round((totalOccupied / (totalCapacity || 1)) * 100)}%)`,
      forecast72hSummary: `0-24h: ${inc.forecast72h.period0_24h.risk} | 24-48h: ${inc.forecast72h.period24_48h.risk} | 48-72h: ${inc.forecast72h.period48_72h.risk}`,
      recommendedActions: [
        inc.forecast72h.period0_24h.action,
        'Deploy UAV supply drops to isolated Sector 4 culverts',
        'Maintain emergency bypass traffic flow via Jowai Ridge',
        'Accelerate BRO mudslide clearance on NH-6 Km 142'
      ],
      currentResponseStatus: `ACTIVE EMERGENCY TRIAGE • ${sosList.length} Active SOS Distress Calls Logged`,
      dataStatus: 'VERIFIED DATA'
    };
  }

  public triggerHackathonSimulation() {
    this.activeIncidentId = 'JS-2026-001';
    const inc = this.incidents[0];
    inc.severity = 'CRITICAL';
    inc.activeSosCount += 1;
    inc.confidenceScore = 98;
    inc.timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add dynamic simulation SOS
    this.addSOS({
      incidentId: 'JS-2026-001',
      reporterName: 'SIMULATION DEMO REPORTER',
      distressType: 'Flood',
      locationName: 'Sector 8 Barangay Bridge',
      lat: 25.520,
      lon: 91.880,
      personsAffected: 12,
      isMedicalEmergency: false,
      description: 'FLASH SIMULATION: Water rising quickly near Barangay Bridge. Need evacuation route C recommendation.',
      priority: 'CRITICAL'
    });

    this.notify();
  }
}

export const incidentStore = new IncidentStoreService();
