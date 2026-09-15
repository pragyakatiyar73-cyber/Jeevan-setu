/**
 * 🚨 Jeevan Setu - Smart Emergency Response & Private Live Location Tracking Service
 * Strictly scoped to 8 North-Eastern Region (NER) States:
 * Assam, Meghalaya, Manipur, Arunachal Pradesh, Mizoram, Nagaland, Sikkim, Tripura.
 * 
 * SECURITY RULE:
 * 1-to-1 Session Authorization: Each emergency request has a private tracking session ID.
 * The requester can ONLY view their own emergency location & assigned vehicle.
 */

export type EmergencyType = 'Medical' | 'Fire' | 'Police' | 'Relief' | 'Other';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ResponseStatus = 
  | 'REQUEST_CREATED'
  | 'FINDING_VEHICLE'
  | 'VEHICLE_ASSIGNED'
  | 'DRIVER_ACCEPTED'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'COMPLETED';

export interface SmartEmergencyRequest {
  emergencyRequestId: string;
  emergencyType: EmergencyType;
  requirement: string;
  description: string;
  lat: number;
  lon: number;
  state: string;
  district: string;
  priority: PriorityLevel;
  priorityLabel: string;
  status: ResponseStatus;
  assignedVehicleId: string | null;
  trackingSessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResponseVehicle {
  vehicleId: string;
  vehicleType: string; // e.g. "Ambulance", "Fire Response Vehicle", "Police Patrol Cruiser", "Relief Convoy Truck"
  typeCategory: EmergencyType;
  driverName: string;
  contact: string;
  currentLat: number;
  currentLon: number;
  status: 'Available' | 'Assigned' | 'On the Way' | 'Busy' | 'Offline';
  state: string;
  district: string;
  verified: boolean;
  demoMode: boolean;
  lastUpdatedAt: string;
}

export interface RealLocationData {
  lat: number;
  lon: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface SessionParticipant {
  participantId: string;
  role: 'HOST' | 'PARTICIPANT';
  label: string;
  color: string;
  status: 'LIVE' | 'STALE' | 'STOPPED' | 'EXPIRED';
  location: RealLocationData | null;
  lastUpdatedAt: string;
}

export interface TrackingSessionData {
  sessionId: string;
  token?: string;
  emergencyRequestId: string;
  active: boolean;
  status?: 'WAITING_FOR_GPS' | 'LIVE' | 'STALE' | 'STOPPED' | 'EXPIRED';
  mode?: 'REAL' | 'SIMULATION';
  realLocation?: RealLocationData | null;
  participants?: SessionParticipant[];
  emergency: SmartEmergencyRequest;
  assignedVehicle: ResponseVehicle | null;
  routeCoordinates: Array<[number, number]>;
  distanceKm: number;
  etaMinutes: number;
  lastUpdated: string;
}

const API_BASE = '/api/smart-tracking';

/**
 * Calculate straight-line distance using Haversine formula (km)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Estimate ETA in minutes given distance (km) and average speed (km/h)
 */
export function calculateEstimatedETA(distanceKm: number, speedKmH: number = 35): number {
  if (distanceKm <= 0) return 0;
  const hours = distanceKm / Math.max(speedKmH, 10);
  return Math.max(1, Math.round(hours * 60));
}

// 1. Submit Emergency Request
export async function createSmartEmergencyRequest(payload: {
  emergencyType: EmergencyType;
  requirement: string;
  description: string;
  lat: number;
  lon: number;
  state?: string;
  district?: string;
}): Promise<{ success: boolean; message: string; trackingSessionId?: string; emergency?: SmartEmergencyRequest }> {
  try {
    const res = await fetch(`${API_BASE}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to submit emergency request');
    return {
      success: true,
      message: json.message,
      trackingSessionId: json.trackingSessionId,
      emergency: json.emergency
    };
  } catch (err: any) {
    console.error('Error submitting emergency request:', err);
    return { success: false, message: err.message || 'Network error' };
  }
}

// 2. Fetch Private 1-to-1 Live Tracking Session
export async function getPrivateTrackingSession(
  sessionId: string
): Promise<{ success: boolean; data?: TrackingSessionData; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/private/${sessionId}?t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Unauthorized or expired session');
    return { success: true, data: json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to load live tracking session' };
  }
}

// 3. Driver Portal - Fetch Requests
export async function getDriverRequests(): Promise<{
  success: boolean;
  emergencies: SmartEmergencyRequest[];
  vehicles: ResponseVehicle[];
}> {
  try {
    const res = await fetch(`${API_BASE}/driver/requests?t=${Date.now()}`, { cache: 'no-store' });
    const json = await res.json();
    return {
      success: true,
      emergencies: json.emergencies || [],
      vehicles: json.vehicles || []
    };
  } catch (err: any) {
    return { success: false, emergencies: [], vehicles: [] };
  }
}

// 4. Driver Accept Request
export async function acceptDriverRequest(
  emergencyRequestId: string,
  vehicleId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyRequestId, vehicleId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to accept request');
    return { success: true, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// 5. Update Driver Live GPS Coordinates
export async function updateDriverLocation(
  vehicleId: string,
  lat: number,
  lon: number
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicleId, lat, lon })
    });
    const json = await res.json();
    return { success: res.ok, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 6. Update Emergency Response Workflow Status
export async function updateEmergencyStatus(
  emergencyRequestId: string,
  status: ResponseStatus
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyRequestId, status })
    });
    const json = await res.json();
    return { success: res.ok, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 6b. Register Driver & Response Vehicle
export async function registerDriverVehicle(payload: {
  driverName: string;
  contact: string;
  vehicleType: string;
  typeCategory: EmergencyType;
  state?: string;
  district?: string;
  lat?: number;
  lon?: number;
}): Promise<{ success: boolean; vehicle?: ResponseVehicle; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to register driver');
    return { success: true, vehicle: json.vehicle, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// 6c. Driver Mark Arrived
export async function markDriverArrived(
  emergencyRequestId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/arrived`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyRequestId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to mark arrived');
    return { success: true, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 6d. Driver Mark Complete
export async function markDriverComplete(
  emergencyRequestId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/driver/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergencyRequestId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to mark complete');
    return { success: true, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 7. Demo / Simulation Step Movement
export async function simulateVehicleStep(
  sessionId: string
): Promise<{ success: boolean; data?: TrackingSessionData; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/simulate-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Simulation failed');
    return { success: true, data: json.data, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// 8. Create QR Real Phone Session
export async function createQRLiveTrackingSession(
  baseAppUrl?: string
): Promise<{ success: boolean; sessionId?: string; token?: string; trackingUrl?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/create-qr-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseAppUrl })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create QR session');
    return {
      success: true,
      sessionId: json.sessionId,
      token: json.token,
      trackingUrl: json.trackingUrl
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// 9. Send Real Mobile Phone GPS Telemetry (Multi-Participant Support)
export async function sendRealGPSUpdate(payload: {
  sessionId: string;
  token: string;
  participantId?: string;
  label?: string;
  lat: number;
  lon: number;
  accuracy: number;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}): Promise<{ success: boolean; sessionStatus?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/update-location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update GPS location');
    return { success: true, sessionStatus: json.sessionStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'GPS transmission error' };
  }
}

// 10. Stop Sharing GPS (Multi-Participant Support)
export async function stopQRLiveTrackingSession(
  sessionId: string,
  token: string,
  participantId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/stop-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, token, participantId })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to stop tracking session');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
