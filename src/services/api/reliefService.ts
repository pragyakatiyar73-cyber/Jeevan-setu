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
  dispatchedRoute?: {
    destination: string;
    destLat?: number;
    destLon?: number;
    routePolyline: Array<[number, number]>;
    distanceKm: number;
    etaMinutes: number;
    hazardWarning?: string;
    notes?: string;
    dispatchedAt: string;
  } | null;
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

// Baseline fallback supplies strictly within NER 8 States
export const DEFAULT_RELIEF_SUPPLIES: ReliefSupplyItem[] = [
  {
    supplyId: 'SUP-FOOD-001',
    item: 'Ready-to-Eat Emergency Meal Kits (MRE)',
    category: 'Food',
    availableQuantity: 3200,
    reservedQuantity: 600,
    unit: 'Units',
    status: 'In Stock',
    location: 'Guwahati Regional Relief Depot, Assam',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-WATR-002',
    item: 'Clean Drinking Water Packets (5L Canisters)',
    category: 'Drinking Water',
    availableQuantity: 4500,
    reservedQuantity: 1200,
    unit: 'Canisters',
    status: 'In Stock',
    location: 'Guwahati Regional Relief Depot, Assam',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-MEDS-003',
    item: 'Anti-Diarrheal & Water Purification Tablets',
    category: 'Medical Kits',
    availableQuantity: 450,
    reservedQuantity: 200,
    unit: 'Boxes',
    status: 'Critical',
    location: 'Gangtok Alpine Relief Reserve, Sikkim',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-BLNK-004',
    item: 'High-Altitude Thermal Fleece Blankets',
    category: 'Warm Clothes',
    availableQuantity: 1800,
    reservedQuantity: 400,
    unit: 'Pieces',
    status: 'In Stock',
    location: 'Shillong High-Altitude Depot, Meghalaya',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-TARP-005',
    item: 'Heavy-Duty Reinforced Shelter Tarpaulins',
    category: 'Shelter Tarps',
    availableQuantity: 2100,
    reservedQuantity: 500,
    unit: 'Tarps',
    status: 'In Stock',
    location: 'Itanagar Frontier Depot, Arunachal Pradesh',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-KITS-006',
    item: 'Family Emergency Hygiene & Sanitization Kits',
    category: 'Hygiene Kits',
    availableQuantity: 950,
    reservedQuantity: 350,
    unit: 'Kits',
    status: 'Low Stock',
    location: 'Imphal Central Relief Depot, Manipur',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-EQPM-007',
    item: 'Portable Oxygen Concentrators & First Aid Kits',
    category: 'Medical Kits',
    availableQuantity: 180,
    reservedQuantity: 50,
    unit: 'Sets',
    status: 'Critical',
    location: 'Kohima Highway Relief Terminal, Nagaland',
    lastUpdated: new Date().toISOString()
  },
  {
    supplyId: 'SUP-RESC-008',
    item: 'Inflatable Rescue Dinghies & Life Jackets',
    category: 'Heavy Rescue Tools',
    availableQuantity: 120,
    reservedQuantity: 40,
    unit: 'Sets',
    status: 'In Stock',
    location: 'Guwahati Regional Relief Depot, Assam',
    lastUpdated: new Date().toISOString()
  }
];

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
    
    const rawList: any[] = data.supplies || [];
    const normalizedSupplies: ReliefSupplyItem[] = rawList.length > 0
      ? rawList.map((s: any) => ({
          supplyId: s.supplyId,
          item: s.item,
          category: s.category === 'Medicines' || s.category === 'Medical Equipment' ? 'Medical Kits'
            : s.category === 'Blankets' ? 'Warm Clothes'
            : s.category === 'Emergency Kits' ? 'Hygiene Kits'
            : s.category === 'Rescue Equipment' ? 'Heavy Rescue Tools'
            : s.category,
          availableQuantity: Number(s.availableQuantity || 0),
          reservedQuantity: Number(s.reservedQuantity || 0),
          unit: s.unit || (s.category === 'Drinking Water' ? 'Canisters' : s.category === 'Food' ? 'Kits' : 'Units'),
          status: s.status === 'Available' ? 'In Stock' : (s.status || 'In Stock'),
          location: s.location || (s.depot ? `${s.depot}, ${s.state || 'NER'}` : `${s.state || 'NER'} Regional Depot`),
          lastUpdated: s.lastUpdated || new Date().toISOString()
        }))
      : DEFAULT_RELIEF_SUPPLIES;

    return {
      metrics: data.metrics || {
        totalAvailableSupplies: 48500,
        criticalShortage: 2,
        suppliesReserved: 12400,
        suppliesInTransit: 8500,
        deliveredSupplies: 31200
      },
      supplies: normalizedSupplies
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
      supplies: DEFAULT_RELIEF_SUPPLIES
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

export const DEFAULT_RELIEF_VEHICLES: ReliefVehicle[] = [
  {
    vehicleId: 'RT-101',
    vehicleType: '4x4 All-Terrain Convoy Truck',
    driverName: 'Bhaben Kalita',
    contact: '+91 98640 12345',
    state: 'Assam',
    currentLocationName: 'Guwahati - Mangaldoi NH-15 Corridor',
    sourceDepot: 'Guwahati Regional Relief Depot',
    sourceLat: 26.1445,
    sourceLon: 91.7362,
    destination: 'Mangaldoi Relief Camp',
    destLat: 26.4363,
    destLon: 92.0345,
    currentLatitude: 26.2650,
    currentLongitude: 91.8820,
    lat: 26.2650,
    lon: 91.8820,
    accuracy: 3.8,
    speed: 44,
    tripStatus: 'ON_ROUTE',
    trackingStatus: 'GPS_CONNECTED',
    lastLocationUpdate: new Date().toISOString(),
    assignedSupplies: [
      { item: 'Ready-to-Eat Emergency Meal Kits (MRE)', quantity: 250 },
      { item: 'Clean Drinking Water Packets (5L)', quantity: 400 }
    ]
  },
  {
    vehicleId: 'RT-102',
    vehicleType: 'Terrain 4x4 Mini Convoy',
    driverName: 'Wanlang Kharshiing',
    contact: '+91 98630 67890',
    state: 'Meghalaya',
    currentLocationName: 'Upper Shillong High-Altitude Corridor',
    sourceDepot: 'Shillong Staging Depot',
    sourceLat: 25.5788,
    sourceLon: 91.8933,
    destination: 'Sohra Mountain Pass, Meghalaya',
    destLat: 25.2700,
    destLon: 91.7300,
    currentLatitude: 25.4200,
    currentLongitude: 91.8100,
    lat: 25.4200,
    lon: 91.8100,
    accuracy: 4.5,
    speed: 36,
    tripStatus: 'ON_ROUTE',
    trackingStatus: 'GPS_CONNECTED',
    lastLocationUpdate: new Date().toISOString(),
    assignedSupplies: [
      { item: 'Thermal Fleece Blankets', quantity: 300 }
    ]
  },
  {
    vehicleId: 'RT-103',
    vehicleType: 'Alpine Disaster Rescue Vehicle',
    driverName: 'Ibomcha Singh',
    contact: '+91 98620 54321',
    state: 'Sikkim',
    currentLocationName: 'Ranipool Base, Gangtok',
    sourceDepot: 'Gangtok Alpine Relief Reserve',
    sourceLat: 27.3389,
    sourceLon: 88.6065,
    destination: 'Teesta NH-10 Pass, Sikkim',
    destLat: 27.1500,
    destLon: 88.5000,
    currentLatitude: 27.2400,
    currentLongitude: 88.5500,
    lat: 27.2400,
    lon: 88.5500,
    accuracy: 5.2,
    speed: 30,
    tripStatus: 'ON_ROUTE',
    trackingStatus: 'GPS_CONNECTED',
    lastLocationUpdate: new Date().toISOString(),
    assignedSupplies: [
      { item: 'Anti-Diarrheal & Water Tablets', quantity: 200 }
    ]
  },
  {
    vehicleId: 'RT-104',
    vehicleType: 'Heavy Relief Hauler',
    driverName: 'Toshi Ao',
    contact: '+91 98610 99887',
    state: 'Nagaland',
    currentLocationName: 'Zubza Bypass Road, Kohima',
    sourceDepot: 'Kohima Highway Relief Terminal',
    sourceLat: 25.6747,
    sourceLon: 94.1105,
    destination: 'Dimapur Flood Staging Camp',
    destLat: 25.9068,
    destLon: 93.7275,
    currentLatitude: 25.7900,
    currentLongitude: 93.9200,
    lat: 25.7900,
    lon: 93.9200,
    accuracy: 4.1,
    speed: 38,
    tripStatus: 'ON_ROUTE',
    trackingStatus: 'GPS_CONNECTED',
    lastLocationUpdate: new Date().toISOString(),
    assignedSupplies: [
      { item: 'Portable Oxygen Concentrators', quantity: 80 }
    ]
  }
];

export const DEFAULT_RELIEF_DEPOTS: ReliefDepot[] = [
  { depotId: 'DEP-GHY-01', depotName: 'Guwahati Regional Relief Depot', state: 'Assam', district: 'Kamrup Metropolitan', capacity: 10000, currentStock: 7450, utilization: 74.5, status: 'OPERATIONAL' },
  { depotId: 'DEP-SHL-02', depotName: 'Shillong High-Altitude Depot', state: 'Meghalaya', district: 'East Khasi Hills', capacity: 6000, currentStock: 4200, utilization: 70.0, status: 'OPERATIONAL' },
  { depotId: 'DEP-GTK-03', depotName: 'Gangtok Alpine Relief Reserve', state: 'Sikkim', district: 'East Sikkim', capacity: 4500, currentStock: 1800, utilization: 40.0, status: 'CRITICAL_LOW' },
  { depotId: 'DEP-IMP-04', depotName: 'Imphal Central Relief Depot', state: 'Manipur', district: 'Imphal West', capacity: 7500, currentStock: 6100, utilization: 81.3, status: 'OPERATIONAL' },
  { depotId: 'DEP-AIZ-05', depotName: 'Aizawl Ridge Logistics Depot', state: 'Mizoram', district: 'Aizawl', capacity: 5000, currentStock: 3900, utilization: 78.0, status: 'OPERATIONAL' },
  { depotId: 'DEP-KOH-06', depotName: 'Kohima Highway Relief Terminal', state: 'Nagaland', district: 'Kohima', capacity: 5500, currentStock: 2100, utilization: 38.2, status: 'CRITICAL_LOW' },
  { depotId: 'DEP-ITA-07', depotName: 'Itanagar Frontier Depot', state: 'Arunachal Pradesh', district: 'Papum Pare', capacity: 6500, currentStock: 4800, utilization: 73.8, status: 'OPERATIONAL' },
  { depotId: 'DEP-AGT-08', depotName: 'Agartala Gumti Basin Depot', state: 'Tripura', district: 'West Tripura', capacity: 5000, currentStock: 4100, utilization: 82.0, status: 'OPERATIONAL' }
];

export const DEFAULT_RELIEF_OPERATIONS: ReliefOperation[] = [
  {
    operationId: 'OP-NER-2026-001',
    sourceDepot: 'Guwahati Regional Relief Depot',
    destination: 'Mangaldoi Relief Camp',
    vehicleId: 'RT-101',
    supplyItem: 'Emergency Meal Kits & Water Canisters',
    quantity: 650,
    gpsStatus: 'GPS_CONNECTED',
    tripStatus: 'ON_ROUTE',
    lastUpdated: new Date().toISOString()
  },
  {
    operationId: 'OP-NER-2026-002',
    sourceDepot: 'Shillong Staging Depot',
    destination: 'Sohra Mountain Pass, Meghalaya',
    vehicleId: 'RT-102',
    supplyItem: 'Thermal Fleece Blankets',
    quantity: 300,
    gpsStatus: 'GPS_CONNECTED',
    tripStatus: 'ON_ROUTE',
    lastUpdated: new Date().toISOString()
  },
  {
    operationId: 'OP-NER-2026-003',
    sourceDepot: 'Gangtok Alpine Relief Reserve',
    destination: 'Teesta NH-10 Pass, Sikkim',
    vehicleId: 'RT-103',
    supplyItem: 'Water Purification Tablets',
    quantity: 200,
    gpsStatus: 'GPS_CONNECTED',
    tripStatus: 'ON_ROUTE',
    lastUpdated: new Date().toISOString()
  },
  {
    operationId: 'OP-NER-2026-004',
    sourceDepot: 'Kohima Highway Relief Terminal',
    destination: 'Dimapur Flood Staging Camp',
    vehicleId: 'RT-104',
    supplyItem: 'Portable Oxygen Concentrators',
    quantity: 80,
    gpsStatus: 'GPS_CONNECTED',
    tripStatus: 'ON_ROUTE',
    lastUpdated: new Date().toISOString()
  }
];

// Fetch live relief vehicles with tracking status
export async function fetchReliefVehicles(): Promise<ReliefVehicle[]> {
  try {
    const res = await fetch(`${API_BASE}/vehicles`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.vehicles && data.vehicles.length > 0 ? data.vehicles : DEFAULT_RELIEF_VEHICLES;
  } catch (err) {
    console.error('Error fetching relief vehicles:', err);
    return DEFAULT_RELIEF_VEHICLES;
  }
}

// Transmit real-time device GPS location to backend
export async function sendVehicleGPSLocation(payload: {
  vehicleId: string;
  lat: number;
  lon: number;
  accuracy?: number;
  speed?: number;
  demoMode?: boolean;
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
    if (!data.depots || data.depots.length === 0) return DEFAULT_RELIEF_DEPOTS;

    // Normalize API field names → ReliefDepot interface
    return data.depots.map((d: any): ReliefDepot => {
      const rawStatus = (d.status || '').toUpperCase().replace(/\s+/g, '_');
      const status: ReliefDepot['status'] =
        rawStatus === 'OPERATIONAL' ? 'OPERATIONAL'
        : rawStatus === 'FULL'        ? 'FULL'
        : 'CRITICAL_LOW';

      return {
        depotId:      d.depotId      || d.id || '',
        depotName:    d.depotName    || d.name || '',
        state:        d.state        || '',
        district:     d.district     || '',
        capacity:     d.capacity     ?? d.storageCapacity   ?? 0,
        currentStock: d.currentStock ?? 0,
        utilization:  d.utilization  ?? d.utilizationPercent ?? 0,
        status,
      };
    });
  } catch (err) {
    console.error('Error fetching relief depots:', err);
    return DEFAULT_RELIEF_DEPOTS;
  }
}

// Fetch active relief operations
export async function fetchReliefOperations(): Promise<ReliefOperation[]> {
  try {
    const res = await fetch(`${API_BASE}/operations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.operations && data.operations.length > 0 ? data.operations : DEFAULT_RELIEF_OPERATIONS;
  } catch (err) {
    console.error('Error fetching relief operations:', err);
    return DEFAULT_RELIEF_OPERATIONS;
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

// Authority Dispatches Safe Route to Driver Phone
export async function dispatchVehicleRoute(payload: {
  vehicleId: string;
  destination: string;
  destLat?: number;
  destLon?: number;
  routePolyline?: Array<[number, number]>;
  distanceKm?: number;
  etaMinutes?: number;
  hazardWarning?: string;
  notes?: string;
}): Promise<{ success: boolean; message: string; dispatchedRoute?: any }> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/dispatch-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, message: json.error || 'Failed to dispatch route' };
    }
    return { success: true, message: json.message, dispatchedRoute: json.dispatchedRoute };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error' };
  }
}

// Fetch currently dispatched route for a vehicle
export async function fetchVehicleRoute(vehicleId: string): Promise<{ hasRoute: boolean; dispatchedRoute: any }> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/route`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    return { hasRoute: json.hasRoute || false, dispatchedRoute: json.dispatchedRoute || null };
  } catch (err) {
    return { hasRoute: false, dispatchedRoute: null };
  }
}

// Clear dispatched route for vehicle (reset demo)
export async function clearVehicleRoute(vehicleId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/clear-route`, { method: 'POST' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * 🛰️ Real Device GPS Location Watcher
 * Uses navigator.geolocation.watchPosition to stream authentic hardware GPS coordinates.
 */
export function watchDeviceGPS(
  vehicleId: string,
  onLocationUpdate: (pos: { lat: number; lon: number; accuracy?: number; speed?: number; statusText: string }) => void,
  onError: (errorText: string) => void,
  demoMode: boolean = false,
  onSendError?: (errorText: string) => void   // ← non-fatal: network hiccup, GPS keeps running
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

      // Send to backend API — failure here is non-fatal (network blip, tunnel delay, etc.)
      try {
        const response = await sendVehicleGPSLocation({
          vehicleId,
          lat,
          lon,
          accuracy,
          speed,
          demoMode
        });

        if (!response.success) {
          // Use soft warning callback if provided, otherwise log quietly
          if (onSendError) {
            onSendError(response.message);
          } else {
            console.warn('[GPS] Server rejected location update:', response.message);
          }
        }
      } catch (sendErr: any) {
        // Network/fetch error — warn only, don't kill GPS
        if (onSendError) {
          onSendError(sendErr?.message || 'Location sync failed (retrying...)');
        } else {
          console.warn('[GPS] Failed to send location to server:', sendErr);
        }
      }
    },
    (err) => {
      // These are real hardware GPS errors — stop tracking
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
