/**
 * 🌧️ Weather & Radar API Client (Open-Meteo Provider for North Eastern Region)
 * 
 * Provides live meteorological telemetry, 7-day weather forecast, wind direction,
 * apparent temperature, precipitation probability, and extreme weather risk level.
 * 
 * Strict Single Source of Truth: Scoped strictly to the 8 NER States of India.
 */

import { isPointInNER } from '../../utils/nerBoundary';

export interface DailyForecastDay {
  date: string;
  dayName: string;
  weatherCode: number;
  condition: string;
  conditionIcon: string;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  elevation: number;
  temperature: number; // °C
  feelsLike: number; // °C
  relativeHumidity: number; // %
  precipitation: number; // mm
  precipitationProbability: number; // %
  rain: number; // mm
  weatherCode: number;
  condition: string; // Human readable description e.g. "Mainly Clear", "Heavy Rain"
  conditionIcon?: string;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windDirectionLabel: string; // e.g. "NE", "SSW"
  windGusts: number; // km/h
  isSevereWeather: boolean;
  severeRiskLevel: 'NONE' | 'MODERATE' | 'HIGH' | 'EXTREME';
  timestamp: string; // Formatted local time or ISO string
  isLive: boolean; // true ONLY when live API request succeeds
  forecast7Days?: DailyForecastDay[];
  error?: string; // Set when API fails ("Weather data unavailable" or "Location outside NER coverage")
}

export interface HourlyForecast {
  time: string[];
  precipitation: number[];
  temperature: number[];
  windSpeed: number[];
}

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

/**
 * Converts wind direction in degrees to cardinal compass label (e.g. 45° -> NE)
 */
export function getWindDirectionLabel(deg: number): string {
  if (typeof deg !== 'number' || isNaN(deg)) return 'N';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return directions[index] || 'N';
}

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
 * Fetches real-time meteorological metrics & 7-day forecast using Open-Meteo API
 * Enforces geographic boundary validation against the 8 NER states.
 */
export async function getLiveWeather(lat: number, lon: number): Promise<WeatherData> {
  // Reject locations outside 8 NER states
  if (!isPointInNER(lat, lon)) {
    return {
      latitude: lat,
      longitude: lon,
      elevation: 0,
      temperature: 0,
      feelsLike: 0,
      relativeHumidity: 0,
      precipitation: 0,
      precipitationProbability: 0,
      rain: 0,
      weatherCode: -1,
      condition: 'Location outside NER coverage',
      conditionIcon: 'AlertTriangle',
      windSpeed: 0,
      windDirection: 0,
      windDirectionLabel: 'N/A',
      windGusts: 0,
      isSevereWeather: false,
      severeRiskLevel: 'NONE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: false,
      forecast7Days: [],
      error: 'Location outside NER coverage'
    };
  }

  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set('latitude', lat.toString());
  url.searchParams.set('longitude', lon.toString());
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max');
  url.searchParams.set('forecast_days', '7');
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

    // Parse 7-day daily forecast
    const forecast7Days: DailyForecastDay[] = [];
    if (data.daily && Array.isArray(data.daily.time)) {
      const times: string[] = data.daily.time;
      const codes: number[] = data.daily.weather_code || [];
      const tMaxs: number[] = data.daily.temperature_2m_max || [];
      const tMins: number[] = data.daily.temperature_2m_min || [];
      const precipSums: number[] = data.daily.precipitation_sum || [];
      const rainProbs: number[] = data.daily.precipitation_probability_max || [];

      times.forEach((tStr, idx) => {
        const dObj = new Date(tStr);
        const dayName = isNaN(dObj.getTime())
          ? `Day ${idx + 1}`
          : dObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
        const wCode = codes[idx] ?? 0;
        const wInfo = getWMOWeatherCondition(wCode);

        forecast7Days.push({
          date: tStr,
          dayName,
          weatherCode: wCode,
          condition: wInfo.condition,
          conditionIcon: wInfo.icon,
          tempMax: Math.round(tMaxs[idx] ?? 0),
          tempMin: Math.round(tMins[idx] ?? 0),
          precipitationSum: Number((precipSums[idx] ?? 0).toFixed(1)),
          precipitationProbabilityMax: Math.round(rainProbs[idx] ?? 0)
        });
      });
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
        // fallback
      }
    }

    const windDirDeg = current.wind_direction_10m ?? 0;
    const precipProbCurrent = forecast7Days.length > 0 ? forecast7Days[0].precipitationProbabilityMax : Math.min(100, Math.round(precip * 8));

    return {
      latitude: data.latitude ?? lat,
      longitude: data.longitude ?? lon,
      elevation: data.elevation ?? 0,
      temperature: Math.round((current.temperature_2m ?? 0) * 10) / 10,
      feelsLike: Math.round((current.apparent_temperature ?? current.temperature_2m ?? 0) * 10) / 10,
      relativeHumidity: Math.round(current.relative_humidity_2m ?? 0),
      precipitation: Number(precip.toFixed(1)),
      precipitationProbability: precipProbCurrent,
      rain: Number((current.rain ?? 0).toFixed(1)),
      weatherCode: weatherCode,
      condition: weatherDetails.condition,
      conditionIcon: weatherDetails.icon,
      windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
      windDirection: windDirDeg,
      windDirectionLabel: getWindDirectionLabel(windDirDeg),
      windGusts: Math.round((windGust ?? 0) * 10) / 10,
      isSevereWeather: severeRiskLevel !== 'NONE',
      severeRiskLevel,
      timestamp: formattedTimestamp,
      isLive: true,
      forecast7Days
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Open-Meteo live API request failed:', error);
    return {
      latitude: lat,
      longitude: lon,
      elevation: 0,
      temperature: 0,
      feelsLike: 0,
      relativeHumidity: 0,
      precipitation: 0,
      precipitationProbability: 0,
      rain: 0,
      weatherCode: 0,
      condition: 'Weather data unavailable',
      conditionIcon: 'Cloud',
      windSpeed: 0,
      windDirection: 0,
      windDirectionLabel: 'N/A',
      windGusts: 0,
      isSevereWeather: false,
      severeRiskLevel: 'NONE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLive: false,
      forecast7Days: [],
      error: 'Weather data unavailable'
    };
  }
}

/**
 * Fetches 24-hour meteorological trend for disaster prediction modeling
 */
export async function getHourlyPrecipitationForecast(lat: number, lon: number): Promise<HourlyForecast> {
  if (!isPointInNER(lat, lon)) {
    throw new Error('Location outside NER coverage');
  }

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
