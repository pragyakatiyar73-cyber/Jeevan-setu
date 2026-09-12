import { isPointInNER, validateNERLocation } from '../../utils/nerBoundary';

export interface CrowdsourcedReportItem {
  _id?: string;
  reportId: string;
  disasterType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  description: string;
  reporterName?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  status: 'ACTIVE' | 'VERIFIED' | 'RESOLVED';
  timestamp: string;
  createdAt?: string;
}

export interface CrowdsourcedTelemetryData {
  isConnected: boolean;
  status: 'success' | 'error';
  database: string;
  coverage?: string;
  totalReports: number;
  reportsLastHour: number;
  latestReportTimestamp: string | null;
  recentReports: CrowdsourcedReportItem[];
  error?: string;
}

const BACKEND_URL = 'http://localhost:5000';

/**
 * Fetches real-time crowdsourced reports telemetry from MongoDB backend
 */
export async function getCrowdsourcedReportsTelemetry(): Promise<CrowdsourcedTelemetryData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/crowdsourced`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`MongoDB API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!data || data.isConnected === false) {
      return {
        isConnected: false,
        status: 'error',
        database: 'MongoDB (Unavailable)',
        totalReports: 0,
        reportsLastHour: 0,
        latestReportTimestamp: null,
        recentReports: [],
        error: data?.message || 'Database unavailable'
      };
    }

    const rawReports: CrowdsourcedReportItem[] = Array.isArray(data.recentReports) ? data.recentReports : [];
    // Strict geographic validation filter
    const nerFilteredReports = rawReports.filter(rep => isPointInNER(rep.latitude, rep.longitude));

    return {
      isConnected: true,
      status: 'success',
      coverage: 'Data Coverage: North Eastern Region — 8 States',
      database: data.database || 'MongoDB (jeevan_setu.crowdsourced_reports)',
      totalReports: data.totalReports ?? nerFilteredReports.length,
      reportsLastHour: data.reportsLastHour ?? 0,
      latestReportTimestamp: data.latestReportTimestamp || null,
      recentReports: nerFilteredReports
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch Crowdsourced Reports from MongoDB:', err);
    return {
      isConnected: false,
      status: 'error',
      database: 'MongoDB (Unavailable)',
      totalReports: 0,
      reportsLastHour: 0,
      latestReportTimestamp: null,
      recentReports: [],
      error: err?.message || 'Database unavailable'
    };
  }
}

/**
 * Submits a new citizen crowdsourced report directly into MongoDB
 */
export async function submitCrowdsourcedReport(reportData: {
  disasterType: string;
  locationName: string;
  latitude: number;
  longitude: number;
  state?: string;
  district?: string;
  description: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}): Promise<{ success: boolean; message: string; reportId?: string }> {
  // Pre-validate coordinates locally against NER boundary
  const geoValidation = validateNERLocation(reportData.latitude, reportData.longitude, reportData.state, reportData.district);
  if (!geoValidation.isValid) {
    return {
      success: false,
      message: geoValidation.reason || 'Report rejected: Location is outside the 8 North Eastern Region (NER) states.'
    };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/crowdsourced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || `Failed to submit report. Server status: ${res.status}`);
    }

    const data = await res.json();
    return {
      success: data.status === 'success',
      message: data.message || 'Report submitted to MongoDB successfully',
      reportId: data.reportId
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Database unavailable'
    };
  }
}

