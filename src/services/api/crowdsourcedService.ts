/**
 * 👥 Crowdsourced Ground Reports API Service (MongoDB Integrated)
 * 
 * Provides real-time disaster reports, 1-hour count metrics, and latest report timestamps
 * directly from MongoDB database (jeevan_setu.crowdsourced_reports).
 */

export interface CrowdsourcedReportItem {
  _id?: string;
  reportId: string;
  disasterType: string;
  locationName: string;
  latitude: number;
  longitude: number;
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

    return {
      isConnected: true,
      status: 'success',
      database: data.database || 'MongoDB (jeevan_setu.crowdsourced_reports)',
      totalReports: data.totalReports ?? 0,
      reportsLastHour: data.reportsLastHour ?? 0,
      latestReportTimestamp: data.latestReportTimestamp || null,
      recentReports: Array.isArray(data.recentReports) ? data.recentReports : []
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
  description: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}): Promise<{ success: boolean; message: string; reportId?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/reports/crowdsourced`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });

    if (!res.ok) {
      throw new Error(`Failed to submit report. Server status: ${res.status}`);
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
