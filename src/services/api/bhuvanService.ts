/**
 * 🛰️ ISRO Bhuvan Geospatial Service Client
 * 
 * Provides telemetry status, layer selection, and GetCapabilities verification
 * for official NRSC / ISRO Bhuvan WMS & WMTS endpoints.
 */

export interface BhuvanLayerInfo {
  id: string;
  name: string;
  description: string;
  category: 'base' | 'administrative' | 'thematic';
  wmsLayerName: string;
  format: string;
  requiresCredentials: boolean;
}

export interface BhuvanServiceTelemetry {
  source: 'ISRO / Bhuvan';
  serviceStatus: 'OPERATIONAL' | 'DEGRADED' | 'AUTHENTICATION_REQUIRED' | 'UNAVAILABLE';
  lastFetchTime: string;
  dataLayerName: string;
  dataLayerId: string;
  wmsEndpoint: string;
  requiresCredentials: boolean;
  hasCredentials: boolean;
  latencyMs?: number;
  availableLayers: BhuvanLayerInfo[];
  error?: string;
}

export const BHUVAN_WMS_ENDPOINT = 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms';
export const BHUVAN_PORTAL_URL = 'https://bhuvan.nrsc.gov.in/';
export const BHUVAN_API_PORTAL_URL = 'https://bhuvan.nrsc.gov.in/api/';

export const DOCUMENTED_BHUVAN_LAYERS: BhuvanLayerInfo[] = [
  {
    id: 'india3',
    name: 'Bhuvan Sovereign Satellite Base (india3)',
    description: 'Official ISRO NRSC high-resolution satellite imagery hybrid overlay',
    category: 'base',
    wmsLayerName: 'india3',
    format: 'image/png',
    requiresCredentials: false
  },
  {
    id: 'india4',
    name: 'Bhuvan Vector Basemap (india4)',
    description: 'Official ISRO topographic vector road & terrain basemap',
    category: 'base',
    wmsLayerName: 'india4',
    format: 'image/png',
    requiresCredentials: false
  },
  {
    id: 'india_state',
    name: 'Bhuvan State Administrative Boundaries (india_state)',
    description: 'Official sovereign state boundaries of India',
    category: 'administrative',
    wmsLayerName: 'india_state',
    format: 'image/png',
    requiresCredentials: false
  },
  {
    id: 'basemap:INDIA_DIST',
    name: 'Bhuvan District Administrative Boundaries (INDIA_DIST)',
    description: 'District level administrative GIS boundaries',
    category: 'administrative',
    wmsLayerName: 'basemap:INDIA_DIST',
    format: 'image/png',
    requiresCredentials: false
  },
  {
    id: 'sisdpv2:AS_North_Cachar_Hills_lulc_v2',
    name: 'NER Land Use & Cover (SISDP-V2 Assam)',
    description: 'Space-based Information Support for Decentralized Planning at Panchayat Level',
    category: 'thematic',
    wmsLayerName: 'sisdpv2:AS_North_Cachar_Hills_lulc_v2',
    format: 'image/png',
    requiresCredentials: false
  },
  {
    id: 'nuis:india_transport',
    name: 'Bhuvan National Transport Infrastructure (nuis:india_transport)',
    description: 'Official ISRO NRSC national transport & arterial road network vector WMS',
    category: 'thematic',
    wmsLayerName: 'nuis:india_transport',
    format: 'image/png',
    requiresCredentials: false
  }
];

/**
 * Verifies live connectivity with official ISRO Bhuvan WMS endpoint and returns status metadata
 */
export async function getBhuvanServiceStatus(selectedLayerId: string = 'india3'): Promise<BhuvanServiceTelemetry> {
  const selectedLayer = DOCUMENTED_BHUVAN_LAYERS.find(l => l.id === selectedLayerId) || DOCUMENTED_BHUVAN_LAYERS[0];
  
  // Check if credentials exist in env
  const apiKey = ((import.meta as any).env?.VITE_BHUVAN_API_KEY as string) || '';
  const hasCredentials = Boolean(apiKey && apiKey.trim().length > 0);

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    const url = `${BHUVAN_WMS_ENDPOINT}?SERVICE=WMS&REQUEST=GetCapabilities`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      throw new Error(`Bhuvan WMS returned HTTP status ${res.status}`);
    }

    const xml = await res.text();
    if (!xml || (!xml.includes('WMT_MS_Capabilities') && !xml.includes('WMS_Capabilities'))) {
      throw new Error('Invalid GetCapabilities response from Bhuvan WMS');
    }

    const formattedTime = `${new Date().toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    return {
      source: 'ISRO / Bhuvan',
      serviceStatus: 'OPERATIONAL',
      lastFetchTime: formattedTime,
      dataLayerName: selectedLayer.name,
      dataLayerId: selectedLayer.id,
      wmsEndpoint: BHUVAN_WMS_ENDPOINT,
      requiresCredentials: false,
      hasCredentials: true,
      latencyMs,
      availableLayers: DOCUMENTED_BHUVAN_LAYERS
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('ISRO Bhuvan WMS GetCapabilities check failed:', error);
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      source: 'ISRO / Bhuvan',
      serviceStatus: 'UNAVAILABLE',
      lastFetchTime: formattedTime,
      dataLayerName: selectedLayer.name,
      dataLayerId: selectedLayer.id,
      wmsEndpoint: BHUVAN_WMS_ENDPOINT,
      requiresCredentials: false,
      hasCredentials: false,
      availableLayers: DOCUMENTED_BHUVAN_LAYERS,
      error: error?.message || 'Unable to establish live connection with ISRO Bhuvan WMS servers'
    };
  }
}
