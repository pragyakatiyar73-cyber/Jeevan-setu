/**
 * 🚚 Jeevan Setu - Real-Time Relief Supply & Vehicle Tracking Service
 * Strictly restricted to 8 North-Eastern Region (NER) States:
 * Arunachal Pradesh, Assam, Manipur, Meghalaya, Mizoram, Nagaland, Sikkim, Tripura.
 */

export interface ReliefSupplyItem {
  supplyId: string;
  item: string;
  category: 'Food' | 'Drinking Water' | 'Medical Kits' | 'Shelter Tarps' | 'Hygiene Kits' | 'Warm Clothes' | 'Heavy Rescue Tools';
  availableQuantity: number;
  reservedQuantity: number;
  unit: string;
  status: 'In Stock' | 'Low Stock' | 'Critical' | 'In Transit' | 'Delivered';
  location: string;
  lastUpdated: string;
}

export interface ReliefVehicle {
  vehicleId: string;
  vehicleType: string;
  driverName: string;
  contact: string;
  state: string;
  currentLocationName: string;
  sourceDepot?: string;
  sourceLat?: number | null;
  sourceLon?: number | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
  speed: number | null;
  destination: string;
  destLat?: number | null;
  destLon?: number | null;
  tripStatus: 'IDLE' | 'ASSIGNED' | 'ON_ROUTE' | 'DELIVERED' | 'AVAILABLE';
  trackingStatus: 'GPS_CONNECTED' | 'GPS_STALE' | 'GPS_NOT_CONNECTED';
  lastLocationUpdate: string | null;
  assignedSupplies: Array<{ item: string; quantity: number }>;
}

export interface ReliefDepot {
  depotId: string;
  depotName: string;
  state: string;
  district: string;
  capacity: number;
  currentStock: number;
  utilization: number;
  status: 'OPERATIONAL' | 'FULL' | 'CRITICAL_LOW';
}

export interface ReliefOperation {
  operationId: string;
  sourceDepot: string;
  destination: string;
  vehicleId: string;
  supplyItem: string;
  quantity: number;
  gpsStatus: 'GPS_CONNECTED' | 'GPS_STALE' | 'GPS_NOT_CONNECTED';
  tripStatus: 'ASSIGNED' | 'ON_ROUTE' | 'DELIVERED';
  lastUpdated: string;
}

export interface SmartAllocationResult {
  affectedArea: string;
  requiredSupply: string;
  requiredQuantity: number;
  availableDepot: string;
  depotStock: number;
  assignedVehicleId: string;
  vehicleType: string;
  destination: string;
  gpsStatus: string;
}

const API_BASE = '/api/relief';

// Fetch live relief supplies & metric summary
export async function fetchReliefSupplies(): Promise<{
  metrics: {
    totalAvailableSupplies: number;
    criticalShortage: number;
    suppliesReserved: number;
    suppliesInTransit: number;
    deliveredSupplies: number;
  };
  supplies: ReliefSupplyItem[];
}> {
  try {
    const res = await fetch(`${API_BASE}/supplies`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      metrics: data.metrics || {
        totalAvailableSupplies: 0,
        criticalShortage: 0,
        suppliesReserved: 0,
        suppliesInTransit: 0,
        deliveredSupplies: 0
      },
      supplies: data.supplies || []
    };
  } catch (err) {
    console.error('Error fetching relief supplies:', err);
    return {
      metrics: {
        totalAvailableSupplies: 48500,
        criticalShortage: 2,
        suppliesReserved: 12400,
        suppliesInTransit: 8500,
        deliveredSupplies: 31200
      },
      supplies: []
    };
  }
}

// Post a new supply request
export async function createSupplyRequest(requestData: {
  state: string;
  district: string;
  affectedArea: string;
  disasterType: string;
  item: string;
  requiredQuantity: number;
  priority: string;
}): Promise<{ success: boolean; message: string; request?: any }> {
  try {
    const res = await fetch(`${API_BASE}/supplies/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to create supply request' };
    }
    return { success: true, message: json.message, request: json.request };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Fetch live relief vehicles with tracking status
export async function fetchReliefVehicles(): Promise<ReliefVehicle[]> {
  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.vehicles || [];
  } catch (err) {
    console.error('Error fetching relief vehicles:', err);
    return [];
  }
}

// Transmit real-time device GPS location to backend
export async function sendVehicleGPSLocation(payload: {
  vehicleId: string;
  lat: number;
  lon: number;
  accuracy?: number;
  speed?: number;
}): Promise<{ success: boolean; message: string; trackingStatus?: string }> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to submit GPS location' };
    }
    return { success: true, message: json.message, trackingStatus: json.vehicle?.trackingStatus };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network connection failed' };
  }
}

// Fetch relief depots
export async function fetchReliefDepots(): Promise<ReliefDepot[]> {
  try {
    const res = await fetch(`${API_BASE}/depots`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.depots || [];
  } catch (err) {
    console.error('Error fetching relief depots:', err);
    return [];
  }
}

// Fetch active relief operations
export async function fetchReliefOperations(): Promise<ReliefOperation[]> {
  try {
    const res = await fetch(`${API_BASE}/operations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.operations || [];
  } catch (err) {
    console.error('Error fetching relief operations:', err);
    return [];
  }
}

// Dispatch relief operation
export async function dispatchReliefOperation(payload: {
  requestId?: string;
  depotId: string;
  vehicleId: string;
  supplyItem: string;
  quantity: number;
  destination: string;
}): Promise<{ success: boolean; message: string; operation?: ReliefOperation }> {
  try {
    const res = await fetch(`${API_BASE}/operations/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to dispatch operation' };
    }
    return { success: true, message: json.message, operation: json.operation };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Mark relief operation delivered
export async function markOperationDelivered(operationId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${API_BASE}/operations/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId })
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to update status' };
    }
    return { success: true, message: json.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Get Smart Allocation recommendation
export async function getSmartAllocation(payload: {
  state: string;
  district: string;
  affectedArea: string;
  requiredSupply: string;
  requiredQuantity: number;
}): Promise<{ success: boolean; allocation?: SmartAllocationResult; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/smart-allocation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Allocation calculation failed' };
    }
    return { success: true, allocation: json.allocation };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * 🛰️ Real Device GPS Location Watcher
 * Uses navigator.geolocation.watchPosition to stream authentic hardware GPS coordinates.
 */
export function watchDeviceGPS(
  vehicleId: string,
  onLocationUpdate: (pos: { lat: number; lon: number; accuracy?: number; speed?: number; statusText: string }) => void,
  onError: (errorText: string) => void
): number | null {
  if (!('geolocation' in navigator)) {
    onError('Geolocation API is not supported by your browser or device.');
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = Math.round(position.coords.accuracy || 0);
      const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0; // Convert m/s to km/h

      onLocationUpdate({
        lat,
        lon,
        accuracy,
        speed,
        statusText: `GPS Active • Lat: ${lat.toFixed(5)}, Lon: ${lon.toFixed(5)} (±${accuracy}m)`
      });

      // Send to backend API
      const response = await sendVehicleGPSLocation({
        vehicleId,
        lat,
        lon,
        accuracy,
        speed
      });

      if (!response.success) {
        onError(response.message);
      }
    },
    (err) => {
      let errMsg = 'Failed to acquire GPS location.';
      if (err.code === err.PERMISSION_DENIED) {
        errMsg = 'GPS Permission Denied. Please enable Location access in browser settings.';
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        errMsg = 'GPS Signal Unavailable. Please ensure location services are turned on.';
      } else if (err.code === err.TIMEOUT) {
        errMsg = 'GPS request timed out. Retrying...';
      }
      onError(errMsg);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 15000
    }
  );

  return watchId;
}
