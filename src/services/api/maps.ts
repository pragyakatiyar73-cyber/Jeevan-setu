/**
 * 🗺️ Maps & Satellite Layer Providers (Category 1: 8 APIs)
 * 
 * Provides map layer descriptors, tile URL templates, and WMS service integrations
 * for OpenStreetMap, ISRO Bhuvan, NASA Earthdata/FIRMS, Esri World Imagery, OpenTopoMap,
 * with configurable fallback slots for Google Maps, Mapbox, HERE, TomTom, and Sentinel Hub.
 */

export interface MapLayerProvider {
  id: string;
  name: string;
  category: 'street' | 'satellite' | 'terrain' | 'disaster-wms' | 'thermal';
  url: string;
  attribution: string;
  maxZoom: number;
  isFree: boolean;
  requiresKey: boolean;
  subdomains?: string[];
  wmsParams?: Record<string, string>;
}

export const MAP_LAYERS: Record<string, MapLayerProvider> = {
  // 1. OpenStreetMap (Primary Standard)
  osm: {
    id: 'osm',
    name: 'OpenStreetMap (Standard)',
    category: 'street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    isFree: true,
    requiresKey: false,
    subdomains: ['a', 'b', 'c']
  },

  // 2. OpenTopoMap (Topological Relief for Landslide/Flood terrain)
  openTopo: {
    id: 'openTopo',
    name: 'OpenTopoMap (Topographic Relief)',
    category: 'terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OSM contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    isFree: true,
    requiresKey: false,
    subdomains: ['a', 'b', 'c']
  },

  // 3. Esri World Imagery (High-Res Aerial Sat)
  esriImagery: {
    id: 'esriImagery',
    name: 'Esri World Imagery (Satellite)',
    category: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 19,
    isFree: true,
    requiresKey: false
  },

  // 4. ISRO Bhuvan (Sovereign Indian Satellite & Disaster Service)
  isroBhuvan: {
    id: 'isroBhuvan',
    name: 'ISRO Bhuvan (Indian Satellite WMS)',
    category: 'disaster-wms',
    url: 'https://bhuvan-vec1.nrsc.gov.in/bhuvan/gwc/service/wms',
    attribution: '&copy; NRSC / ISRO Bhuvan Geospatial Portal',
    maxZoom: 18,
    isFree: true,
    requiresKey: false,
    wmsParams: {
      layers: 'india3',
      format: 'image/png',
      transparent: 'true',
      version: '1.1.1'
    }
  },

  // 5. NASA Earthdata / GIBS (Global Disaster & Thermal Observation)
  nasaFirms: {
    id: 'nasaFirms',
    name: 'NASA Earthdata / GIBS (Thermal & Disasters)',
    category: 'thermal',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg',
    attribution: '&copy; NASA Global Imagery Browse Services (GIBS) / EOSDIS',
    maxZoom: 9,
    isFree: true,
    requiresKey: false
  }
};

/**
 * Returns available active layer providers
 */
export function getAvailableMapLayers(): MapLayerProvider[] {
  return Object.values(MAP_LAYERS);
}

/**
 * Validates fallback credentials for enterprise map providers
 */
export function getEnterpriseMapStatus(): Record<string, boolean> {
  const env = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  return {
    googleMaps: Boolean(env.VITE_GOOGLE_MAPS_API_KEY),
    mapbox: Boolean(env.VITE_MAPBOX_ACCESS_TOKEN),
    here: Boolean(env.VITE_HERE_API_KEY),
    tomtom: Boolean(env.VITE_TOMTOM_API_KEY),
    sentinelHub: Boolean(env.VITE_SENTINEL_HUB_INSTANCE_ID)
  };
}
