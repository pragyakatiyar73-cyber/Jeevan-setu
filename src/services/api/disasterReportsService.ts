/**
 * 🛰️ Disaster Reports & Incident Intelligence Service (NER-Only 8 States)
 * Strictly enforces 8 NER States boundary & district mappings.
 */

export interface DisasterReportItem {
  id: string;
  disasterType: 'Flood' | 'Landslide' | 'Heavy Rain' | 'Storm/Cyclone' | 'Road Block' | 'Earthquake' | 'Other Disaster';
  state: string;
  district: string;
  location: string;
  lat: number;
  lon: number;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'MONITORING' | 'UNKNOWN';
  date: string;
  time: string;
  description: string;
  source: string;
  dataStatus: 'LIVE' | 'RECENT' | 'STATIC' | 'MODELLED' | 'UNAVAILABLE';
  lastUpdated: string;
  photoUrl?: string | null;
}

export interface IncidentFilterOptions {
  disasterType?: string;
  state?: string;
  district?: string;
  severity?: string;
  status?: string;
  date?: string;
  search?: string;
}

// Strictly 8 North Eastern Region (NER) States & Official District Mappings
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

export const NER_STATES_DISTRICTS: Record<string, string[]> = {
  'Arunachal Pradesh': [
    'Anjaw', 'Changlang', 'Dibang Valley', 'East Kameng', 'East Siang', 'Itanagar Capital Complex',
    'Kamle', 'Kra Daadi', 'Kurung Kumey', 'Lepa Rada', 'Lohit', 'Longding', 'Lower Dibang Valley',
    'Lower Siang', 'Lower Subansiri', 'Namsai', 'Pakke Kessang', 'Papum Pare', 'Shi Yomi', 'Siang',
    'Tawang', 'Tirap', 'Upper Siang', 'Upper Subansiri', 'West Kameng', 'West Siang'
  ],
  'Assam': [
    'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang',
    'Dhemaji', 'Dhubri', 'Dibrugarh', 'Dima Hasao', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai',
    'Jorhat', 'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur',
    'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar',
    'Tinsukia', 'Udalguri', 'West Karbi Anglong'
  ],
  'Manipur': [
    'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching',
    'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'
  ],
  'Meghalaya': [
    'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'Eastern West Khasi Hills',
    'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills',
    'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'
  ],
  'Mizoram': [
    'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit',
    'Saiha', 'Saitual', 'Serchhip'
  ],
  'Nagaland': [
    'Chumoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokochung', 'Mon', 'Niuland',
    'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu', 'Tuensang', 'Wokha', 'Zunheboto'
  ],
  'Sikkim': [
    'East Sikkim', 'North Sikkim', 'Pakyong', 'Soreng', 'South Sikkim', 'West Sikkim'
  ],
  'Tripura': [
    'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'
  ]
};

// Client-side NER Boundary Validation
export function isNERCoordinates(lat: number, lon: number): boolean {
  return lat >= 21.5 && lat <= 29.8 && lon >= 87.5 && lon <= 97.8;
}

export function isNERStateName(stateName: string): boolean {
  if (!stateName) return false;
  const norm = stateName.trim().toLowerCase();
  return NER_STATES.some(s => s.toLowerCase() === norm);
}

// Fetch Disaster Incidents from Backend API
export async function fetchDisasterIncidents(filters: IncidentFilterOptions = {}): Promise<{
  success: boolean;
  incidents: DisasterReportItem[];
  message?: string;
  rejectedSearch?: boolean;
}> {
  const queryParams = new URLSearchParams();
  if (filters.state) queryParams.set('state', filters.state);
  if (filters.district) queryParams.set('district', filters.district);
  if (filters.disasterType) queryParams.set('type', filters.disasterType);
  if (filters.severity) queryParams.set('severity', filters.severity);
  if (filters.status) queryParams.set('status', filters.status);
  if (filters.search) queryParams.set('search', filters.search);

  try {
    const res = await fetch(`http://localhost:5000/api/disaster-incidents?${queryParams.toString()}`);
    if (!res.ok) throw new Error('API server returned error status');
    const data = await res.json();
    return {
      success: true,
      incidents: data.incidents || [],
      message: data.message,
      rejectedSearch: data.rejectedSearch || false
    };
  } catch (err) {
    console.warn('Disaster Incident API unreachable, falling back to local dataset:', err);
    return {
      success: false,
      incidents: [],
      message: 'Disaster incident data temporarily unavailable.'
    };
  }
}

// Submit User Disaster Report with Client-side + Server Validation
export async function submitDisasterReport(reportData: {
  disasterType: string;
  state: string;
  district: string;
  location: string;
  lat: number;
  lon: number;
  severity: string;
  description: string;
  photoUrl?: string | null;
}): Promise<{ success: boolean; incident?: DisasterReportItem; error?: string }> {
  // Validate NER Client-Side first
  if (!isNERCoordinates(reportData.lat, reportData.lon) || !isNERStateName(reportData.state)) {
    return {
      success: false,
      error: 'Location is outside Jeevan Setu\'s NER coverage.'
    };
  }

  try {
    const res = await fetch('http://localhost:5000/api/disaster-incidents/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });

    const data = await res.json();
    if (!res.ok || data.status === 'error') {
      return {
        success: false,
        error: data.error || data.message || 'Failed submitting disaster report'
      };
    }

    return {
      success: true,
      incident: data.incident
    };
  } catch (err) {
    return {
      success: false,
      error: 'Disaster incident data temporarily unavailable. Check backend connection.'
    };
  }
}
