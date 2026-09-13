/**
 * 🚨 Jeevan Setu - Smart Emergency Response API Service
 * Strictly restricted to 8 North-Eastern Region (NER) States:
 * Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura.
 */

export interface EmergencyItem {
  id: string;
  state: string;
  district: string;
  affectedArea: string;
  locationDetails: string;
  lat: number;
  lon: number;
  disasterType: 'Flood' | 'Landslide' | 'Heavy Rainfall' | 'Earthquake' | 'Cyclone' | 'Road Blockage' | 'Building Damage' | 'Medical Emergency' | 'Other';
  affectedPeople: number;
  injuredPeople: number;
  requirements: Array<'Rescue' | 'Medical' | 'Food' | 'Drinking Water' | 'Shelter' | 'Road Clearance' | 'Evacuation'>;
  photoUrl: string | null;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityLabel: string;
  status: 'REPORTED' | 'ASSESSED' | 'RESPONSE RECOMMENDED' | 'RESOURCE ASSIGNED' | 'RESPONSE IN PROGRESS' | 'RESOLVED';
  reportedTime: string;
  timeline: Array<{ time: string; statusText: string }>;
  assignedResource: {
    depotId?: string;
    depotName?: string;
    supplyItem?: string;
    vehicleId?: string;
    vehicleType?: string;
    trackingStatus?: 'GPS_CONNECTED' | 'GPS_STALE' | 'GPS_NOT_CONNECTED';
    routeStatus?: 'ROUTE_ACTIVE' | 'ROUTE_RECOMMENDED' | 'ROUTE_RISK_DETECTED' | 'ROUTE_RECALCULATING' | 'ROUTE_CHANGED' | 'VEHICLE_OFF_ROUTE' | 'DESTINATION_REACHED';
    lastUpdate?: string;
  } | null;
  connectedContext: {
    weatherDataStatus: 'LIVE DATA' | 'LAST KNOWN DATA' | 'DATA UNAVAILABLE';
    floodRiskStatus: 'LIVE DATA' | 'LAST KNOWN DATA' | 'DATA UNAVAILABLE';
    landslideRiskStatus: 'LIVE DATA' | 'LAST KNOWN DATA' | 'DATA UNAVAILABLE';
    roadAccessibilityStatus: 'LIVE DATA' | 'LAST KNOWN DATA' | 'DATA UNAVAILABLE';
    weatherRiskText?: string;
    floodRiskText?: string;
    landslideRiskText?: string;
    roadAccessText?: string;
  };
}

export interface EmergencyMetrics {
  activeEmergencies: number;
  criticalIncidents: number;
  highPriorityIncidents: number;
  rescueVehiclesAvailable: number;
  medicalSupportRequired: number;
  reliefOperationsActive: number;
}

const API_BASE = '/api/emergency-response';

// Fetch Emergency Metrics and List
export async function fetchEmergencyData(): Promise<{
  metrics: EmergencyMetrics;
  emergencies: EmergencyItem[];
}> {
  try {
    const res = await fetch(`${API_BASE}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      metrics: data.metrics || {
        activeEmergencies: 0,
        criticalIncidents: 0,
        highPriorityIncidents: 0,
        rescueVehiclesAvailable: 0,
        medicalSupportRequired: 0,
        reliefOperationsActive: 0
      },
      emergencies: data.emergencies || []
    };
  } catch (err) {
    console.error('Error fetching emergency data:', err);
    return {
      metrics: {
        activeEmergencies: 2,
        criticalIncidents: 1,
        highPriorityIncidents: 1,
        rescueVehiclesAvailable: 3,
        medicalSupportRequired: 1,
        reliefOperationsActive: 1
      },
      emergencies: []
    };
  }
}

// Fetch single emergency by ID
export async function fetchEmergencyById(id: string): Promise<EmergencyItem | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.emergency || null;
  } catch (err) {
    console.error('Error fetching emergency by ID:', err);
    return null;
  }
}

// Report new Emergency
export async function submitEmergencyReport(payload: {
  state: string;
  district: string;
  affectedArea: string;
  locationDetails: string;
  lat?: number;
  lon?: number;
  disasterType: string;
  affectedPeople: number;
  injuredPeople: number;
  requirements: string[];
  photoUrl?: string | null;
  description: string;
}): Promise<{ success: boolean; message: string; emergency?: EmergencyItem }> {
  try {
    const res = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to submit report' };
    }
    return { success: true, message: json.message, emergency: json.emergency };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Update Emergency Workflow Status
export async function updateEmergencyStatus(
  id: string,
  status: string,
  statusText?: string
): Promise<{ success: boolean; message: string; emergency?: EmergencyItem }> {
  try {
    const res = await fetch(`${API_BASE}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, statusText })
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to update status' };
    }
    return { success: true, message: json.message, emergency: json.emergency };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Get AI Resource Matcher Recommendation
export async function getEmergencyRecommendation(
  emergencyId: string
): Promise<{ success: boolean; message: string; emergency?: EmergencyItem }> {
  try {
    const res = await fetch(`${API_BASE}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyId })
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to generate recommendation' };
    }
    return { success: true, message: json.message, emergency: json.emergency };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}
