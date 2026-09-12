// Relief Supply & Real-Time Vehicle Tracking Service for Jeevan Setu (NER-Only)

export const NER_STATES = [
  'Arunachal Pradesh',
  'Assam',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Sikkim',
  'Tripura'
] as const;

export type NERState = typeof NER_STATES[number];

export const SUPPLY_CATEGORIES = [
  'Food',
  'Drinking Water',
  'Medicines',
  'Blankets',
  'Emergency Kits',
  'Medical Equipment',
  'Rescue Equipment'
] as const;

export type SupplyCategory = typeof SUPPLY_CATEGORIES[number];

export type SupplyStatus = 'Available' | 'Low Stock' | 'Critical' | 'Reserved' | 'In Transit' | 'Delivered';

export type PriorityLevel = 'Critical' | 'High' | 'Medium' | 'Low';

export type DisasterType = 'Flood' | 'Landslide' | 'Heavy Rainfall' | 'Cyclone' | 'Earthquake' | 'Other';

export type VehicleTrackingStatus = 'GPS_CONNECTED' | 'GPS_NOT_CONNECTED' | 'GPS_STALE' | 'GPS_PERMISSION_DENIED';

export type VehicleTripStatus = 'AVAILABLE' | 'LOADING' | 'ON_ROUTE' | 'DELAYED' | 'DELIVERED' | 'EMERGENCY';

export type DepotStatus = 'Operational' | 'Low Stock' | 'Overloaded' | 'Closed';

export interface ReliefSupplyItem {
  supplyId: string;
  item: string;
  category: SupplyCategory;
  state: NERState | string;
  district: string;
  depot: string;
  availableQuantity: number;
  requiredQuantity: number;
  reservedQuantity: number;
  deliveredQuantity?: number;
  priority: PriorityLevel;
  status: SupplyStatus;
  lastUpdated: string;
}

export interface SupplyInventoryStats {
  totalAvailable: number;
  criticalShortageCount: number;
  suppliesReserved: number;
  suppliesInTransit: number;
  deliveredSupplies: number;
}

export interface ReliefSupplyRequest {
  requestId: string;
  state: NERState | string;
  district: string;
  affectedArea: string;
  disasterType: DisasterType;
  item: string;
  category: SupplyCategory;
  requiredQuantity: number;
  priority: PriorityLevel;
  status: 'PENDING' | 'ALLOCATED' | 'DISPATCHED' | 'DELIVERED' | 'REJECTED';
  assignedDepotId?: string | null;
  assignedVehicleId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReliefDepot {
  depotId: string;
  depotName: string;
  state: NERState | string;
  district: string;
  location: string;
  lat: number;
  lon: number;
  storageCapacity: number;
  currentStock: number;
  utilization: number;
  status: DepotStatus;
  lastUpdated: string;
}

export interface AssignedSupply {
  item: string;
  quantity: number;
}

export interface ReliefVehicle {
  vehicleId: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
  sourceDepot: string;
  destination: string;
  destinationLat?: number;
  destinationLon?: number;
  currentLatitude: number | null;
  currentLongitude: number | null;
  gpsAccuracy: number | null;
  speed: number | null;
  heading: number | null;
  trackingStatus: VehicleTrackingStatus;
  tripStatus: VehicleTripStatus;
  lastLocationUpdate: string | null;
  assignedSupplies: AssignedSupply[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReliefOperation {
  operationId: string;
  requestId: string;
  sourceDepotId: string;
  sourceDepotName: string;
  destination: string;
  destinationLat?: number;
  destinationLon?: number;
  vehicleId: string;
  vehicleType?: string;
  supplies: AssignedSupply[];
  quantity: number;
  tripStatus: VehicleTripStatus;
  gpsStatus: VehicleTrackingStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface VehicleLocationUpdatePayload {
  vehicleId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

// API Endpoints Base URL
const API_BASE = '/api/relief';

// Helper: Check if state is in 8 NER states
export function isNERState(stateName: string): boolean {
  if (!stateName) return false;
  const norm = stateName.trim().toLowerCase();
  return NER_STATES.some(s => s.toLowerCase() === norm);
}

// API Functions
export async function getReliefSupplies(): Promise<{ stats: SupplyInventoryStats; supplies: ReliefSupplyItem[] }> {
  try {
    const res = await fetch(`${API_BASE}/supplies`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      stats: data.stats || { totalAvailable: 0, criticalShortageCount: 0, suppliesReserved: 0, suppliesInTransit: 0, deliveredSupplies: 0 },
      supplies: data.supplies || []
    };
  } catch (err) {
    console.warn('Failed to fetch relief supplies:', err);
    return {
      stats: { totalAvailable: 0, criticalShortageCount: 0, suppliesReserved: 0, suppliesInTransit: 0, deliveredSupplies: 0 },
      supplies: []
    };
  }
}

export async function addReliefSupply(supply: Partial<ReliefSupplyItem>): Promise<{ success: boolean; message: string }> {
  try {
    if (!isNERState(supply.state || '')) {
      return { success: false, message: 'Jeevan Setu Relief Operations are restricted to the North-Eastern Region of India.' };
    }
    const res = await fetch(`${API_BASE}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supply)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Error creating supply' };
    return { success: true, message: data.message || 'Supply created successfully' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server network error' };
  }
}

export async function createReliefSupplyRequest(reqData: Partial<ReliefSupplyRequest>): Promise<{ success: boolean; message: string; request?: ReliefSupplyRequest }> {
  try {
    if (!isNERState(reqData.state || '')) {
      return { success: false, message: 'Jeevan Setu Relief Operations are restricted to the North-Eastern Region of India.' };
    }
    const res = await fetch(`${API_BASE}/requests/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqData)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Request rejected' };
    return { success: true, message: data.message, request: data.request };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function getReliefSupplyRequests(): Promise<ReliefSupplyRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/requests`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.requests || [];
  } catch (err) {
    console.warn('Failed to fetch supply requests:', err);
    return [];
  }
}

export async function getReliefDepots(): Promise<ReliefDepot[]> {
  try {
    const res = await fetch(`${API_BASE}/depots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.depots || [];
  } catch (err) {
    console.warn('Failed to fetch relief depots:', err);
    return [];
  }
}

export async function getReliefVehicles(): Promise<ReliefVehicle[]> {
  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.vehicles || [];
  } catch (err) {
    console.warn('Failed to fetch relief vehicles:', err);
    return [];
  }
}

export async function getReliefVehicleById(vehicleId: string): Promise<ReliefVehicle | null> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.vehicle || null;
  } catch (err) {
    return null;
  }
}

export async function sendVehicleGPSLocation(payload: VehicleLocationUpdatePayload): Promise<{ success: boolean; message: string; vehicle?: ReliefVehicle }> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Failed to update GPS' };
    return { success: true, message: data.message, vehicle: data.vehicle };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error updating GPS' };
  }
}

export async function performSmartAllocation(requestId: string): Promise<{ success: boolean; message: string; operation?: ReliefOperation }> {
  try {
    const res = await fetch(`${API_BASE}/operations/allocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Allocation failed' };
    return { success: true, message: data.message, operation: data.operation };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function dispatchReliefOperation(operationId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/operations/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Dispatch failed' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function confirmReliefDelivery(operationId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/operations/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, message: data.message || 'Delivery confirmation failed' };
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error' };
  }
}

export async function getActiveReliefOperations(): Promise<ReliefOperation[]> {
  try {
    const res = await fetch(`${API_BASE}/operations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.operations || [];
  } catch (err) {
    console.warn('Failed to fetch operations:', err);
    return [];
  }
}

// SSE Subscription to Live Vehicle Stream
export function subscribeToVehicleLocationStream(onVehicleUpdate: (v: ReliefVehicle) => void): () => void {
  let eventSource: EventSource | null = null;
  try {
    eventSource = new EventSource(`${API_BASE}/vehicles/stream`);
    eventSource.onmessage = (event) => {
      try {
        const vehicle = JSON.parse(event.data) as ReliefVehicle;
        onVehicleUpdate(vehicle);
      } catch (e) {
        console.warn('Error parsing SSE vehicle data:', e);
      }
    };
  } catch (err) {
    console.warn('SSE subscription unavailable, falling back to polling.');
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}
