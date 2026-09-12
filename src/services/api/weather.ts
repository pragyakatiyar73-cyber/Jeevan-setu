/**
 * 🌧️ Weather & Radar API Client (Category 2: Open-Meteo Provider)
 * 
 * Provides live meteorological telemetry, extreme precipitation detection,
 * wind gusts, and real-time atmospheric data via Open-Meteo API.
 */

import { isPointInNER } from '../../utils/nerBoundary';

export interface WeatherData {
  latitude: number;
  longitude: number;
  elevation: number;
  temperature: number; // °C
  relativeHumidity: number; // %
  precipitation: number; // mm
  rain: number; // mm
  weatherCode: number;
  condition: string; // Human readable description e.g. "Mainly Clear", "Heavy Rain"
  conditionIcon?: string;
  windSpeed: number; // km/h
  windGusts: number; // km/h
  isSevereWeather: boolean;
  severeRiskLevel: 'NONE' | 'MODERATE' | 'HIGH' | 'EXTREME';
  timestamp: string; // Formatted local time or ISO string
  isLive: boolean; // true ONLY when live API request succeeds
  error?: string; // Set when API fails ("Data unavailable")
}

export interface HourlyForecast {
  time: string[];
  precipitation: number[];
  temperature: number[];
  windSpeed: number[];
}

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Converts WMO Weather Code to human-readable weather condition text & icon identifier
 */
export function getWMOWeatherCondition(code: number): { condition: string; icon: string } {
  switch (code) {
    case 0: return { condition: 'Clear Sky', icon: 'Sun' };
    case 1: return { condition: 'Mainly Clear', icon: 'SunMedium' };
    case 2: return { condition: 'Partly Cloudy', icon: 'CloudSun' };
    case 3: return { condition: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48: return { condition: 'Fog / Mist', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55: return { condition: 'Drizzle', icon: 'CloudDrizzle' };
    case 56:
    case 57: return { condition: 'Freezing Drizzle', icon: 'CloudSnow' };
    case 61: return { condition: 'Slight Rain', icon: 'CloudRain' };
    case 63: return { condition: 'Moderate Rain', icon: 'CloudRain' };
    case 65: return { condition: 'Heavy Rain', icon: 'CloudRainWind' };
    case 66:
    case 67: return { condition: 'Freezing Rain', icon: 'CloudSnow' };
    case 71:
    case 73:
    case 75: return { condition: 'Snowfall', icon: 'CloudSnow' };
    case 77: return { condition: 'Snow Grains', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82: return { condition: 'Rain Showers', icon: 'CloudRain' };
    case 85:
    case 86: return { condition: 'Snow Showers', icon: 'CloudSnow' };
    case 95: return { condition: 'Thunderstorm', icon: 'CloudLightning' };
    case 96:
    case 99: return { condition: 'Thunderstorm with Hail', icon: 'CloudLightning' };
    default: return { condition: 'Moderate Weather', icon: 'Cloud' };
  }
}

/**
 * Fetches real-time meteorological metrics for any coordinate using Open-Meteo API
 */
export async function getLiveWeather(lat: number, lon: number): Promise<WeatherData> {
  // Reject locations outside 8 NER states
  if (!isPointInNER(lat, lon)) {
    return {
      latitude: lat,
      longitude: lon,
      elevation: 0,
      temperature: 0,
      relativeHumidity: 0,
      precipitation: 0,
      rain: 0,
      weatherCode: -1,
      condition: 'Data unavailable',
      windSpeed: 0,
      windGusts: 0,
      isSevereWeather: false,
      severeRiskLevel: 'NONE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: false,
      error: 'Data unavailable (Location outside North Eastern Region)'
    };
  }

  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_gusts_10m');
  url.searchParams.set('timezone', 'Asia/Kolkata');


  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Open-Meteo HTTP error ${res.status}`);
    }

    const data = await res.json();
    if (!data || !data.current) {
      throw new Error('Invalid Open-Meteo response structure');
    }

    const current = data.current;
    const precip = current.precipitation ?? 0;
    const windGust = current.wind_gusts_10m ?? 0;
    const weatherCode = current.weather_code ?? 0;
    const weatherDetails = getWMOWeatherCondition(weatherCode);

    let severeRiskLevel: WeatherData['severeRiskLevel'] = 'NONE';
    if (precip > 50 || windGust > 70) {
      severeRiskLevel = 'EXTREME';
    } else if (precip > 25 || windGust > 50) {
      severeRiskLevel = 'HIGH';
    } else if (precip > 10 || windGust > 35) {
      severeRiskLevel = 'MODERATE';
    }

    // Format last updated timestamp cleanly
    let formattedTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (current.time) {
      try {
        const d = new Date(current.time);
        if (!isNaN(d.getTime())) {
          formattedTimestamp = `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }
      } catch (e) {
        // fallback to current time
      }
    }

    return {
      latitude: data.latitude ?? lat,
      longitude: data.longitude ?? lon,
      elevation: data.elevation ?? 0,
      temperature: current.temperature_2m ?? 0,
      relativeHumidity: current.relative_humidity_2m ?? 0,
      precipitation: precip,
      rain: current.rain ?? 0,
      weatherCode: weatherCode,
      condition: weatherDetails.condition,
      conditionIcon: weatherDetails.icon,
      windSpeed: current.wind_speed_10m ?? 0,
      windGusts: windGust,
      isSevereWeather: severeRiskLevel !== 'NONE',
      severeRiskLevel,
      timestamp: formattedTimestamp,
      isLive: true
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Open-Meteo live API request failed:', error);
    // Explicit error state: isLive is false, no fake live data returned
    return {
      latitude: lat,
      longitude: lon,
      elevation: 0,
      temperature: 0,
      relativeHumidity: 0,
      precipitation: 0,
      rain: 0,
      weatherCode: 0,
      condition: 'Data unavailable',
      conditionIcon: 'Cloud',
      windSpeed: 0,
      windGusts: 0,
      isSevereWeather: false,
      severeRiskLevel: 'NONE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: false,
      error: error?.message || 'Data unavailable from weather service'
    };
  }
}

/**
 * Fetches 24-hour meteorological trend for disaster prediction modeling
 */
export async function getHourlyPrecipitationForecast(lat: number, lon: number): Promise<HourlyForecast> {
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('hourly', 'precipitation,temperature_2m,wind_speed_10m');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'Asia/Kolkata');

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Open-Meteo forecast HTTP error: ${res.status}`);
  }

  const data = await res.json();
  return {
    time: data.hourly.time,
    precipitation: data.hourly.precipitation,
    temperature: data.hourly.temperature_2m,
    windSpeed: data.hourly.wind_speed_10m
  };
}
