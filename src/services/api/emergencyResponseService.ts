// Smart Emergency Response Service for Jeevan Setu (NER-Only)
import { NERState, isNERState } from './reliefSupplyService';

export type EmergencyPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EmergencyStatus = 
  | 'REPORTED' 
  | 'ASSESSED' 
  | 'RESPONSE_RECOMMENDED' 
  | 'RESOURCE_ASSIGNED' 
  | 'RESPONSE_IN_PROGRESS' 
  | 'RESOLVED';

export type EmergencyDisasterType = 
  | 'Flood' 
  | 'Landslide' 
  | 'Heavy Rainfall' 
  | 'Earthquake' 
  | 'Cyclone' 
  | 'Road Blockage' 
  | 'Building Damage' 
  | 'Medical Emergency' 
  | 'Other';

export type EmergencyRequirement = 
  | 'Rescue' 
  | 'Medical' 
  | 'Food' 
  | 'Drinking Water' 
  | 'Shelter' 
  | 'Road Clearance' 
  | 'Evacuation';

export interface AIAssessment {
  summary: string;
  severity: EmergencyPriority;
  risks: string[];
  confidence: number;
  recommendations: string[];
}

export interface EmergencyTimelineEvent {
  timestamp: string;
  action: string;
  detail: string;
}

export interface EmergencyIncident {
  incidentId: string;
  state: NERState | string;
  district: string;
  affectedArea: string;
  latitude: number;
  longitude: number;
  disasterType: EmergencyDisasterType;
  peopleAffected: number;
  injured: number;
  requirements: EmergencyRequirement[];
  description: string;
  imageUrl?: string | null;
  priority: EmergencyPriority;
  status: EmergencyStatus;
  aiAssessment?: AIAssessment;
  assignedVehicleId?: string | null;
  assignedVehicleType?: string | null;
  assignedDepotId?: string | null;
  assignedSupplies?: Array<{ item: string; quantity: number }>;
  timeline: EmergencyTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface EmergencyReportPayload {
  state: NERState | string;
  district: string;
  affectedArea: string;
  location?: string;
  disasterType: EmergencyDisasterType;
  peopleAffected: number;
  injured: number;
  immediateRequirements: EmergencyRequirement[];
  photo?: string | null;
  description?: string;
  lat?: number;
  lon?: number;
}

export interface ConnectedTelemetry {
  weather?: any;
  highways?: any[];
  rivers?: any[];
}

const API_BASE = '/api/emergency';

// API Caller Methods
export async function getEmergencyIncidents(filters?: { state?: string; priority?: string; status?: string }): Promise<EmergencyIncident[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.state && filters.state !== 'ALL') params.append('state', filters.state);
    if (filters?.priority && filters.priority !== 'ALL') params.append('priority', filters.priority);
    if (filters?.status && filters.status !== 'ALL') params.append('status', filters.status);

    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.incidents || [];
  } catch (err) {
    console.warn('Failed to fetch emergency incidents:', err);
    return [];
  }
}

export async function getEmergencyIncidentById(id: string): Promise<{ incident: EmergencyIncident | null; telemetry?: ConnectedTelemetry }> {
  try {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) return { incident: null };
    const data = await res.json();
    return {
      incident: data.incident || null,
      telemetry: data.connectedTelemetry || {}
    };
  } catch (err) {
    return { incident: null };
  }
}

export async function submitEmergencyReport(payload: EmergencyReportPayload): Promise<{ success: boolean; message: string; incident?: EmergencyIncident }> {
  try {
    if (!isNERState(payload.state || '')) {
      return {
        success: false,
        message: 'This emergency response system is restricted to the North-Eastern Region of India.'
      };
    }

    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Submission failed' };
    return { success: true, message: data.message, incident: data.incident };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server network error' };
  }
}

export async function updateEmergencyStatus(id: string, status: EmergencyStatus, actionDetail?: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actionDetail })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Update failed' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function assignEmergencyResource(id: string, payload: { vehicleId?: string; depotId?: string; supplies?: Array<{ item: string; quantity: number }> }): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Resource assignment failed' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function reassessEmergencyWithAI(id: string): Promise<{ success: boolean; priority?: EmergencyPriority; aiAssessment?: AIAssessment; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}/assess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'AI Assessment failed' };
    return {
      success: true,
      priority: data.priority,
      aiAssessment: data.aiAssessment
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}
