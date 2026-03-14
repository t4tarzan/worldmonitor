// LocalWeatherPanel - Weather and Air Quality for Local variant
// Uses Open-Meteo API (free, no API key required)

import { loadLocation, formatCoordinates } from '@/services/location';
import { ZONES } from '@/config/variants/local';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  weatherCode: number;
  isDay: boolean;
}

export interface AirQualityData {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  so2: number;
  co: number;
}

export interface SunData {
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface LocalWeatherState {
  weather: WeatherData | null;
  airQuality: AirQualityData | null;
  sun: SunData | null;
  lastUpdate: Date | null;
  error: string | null;
}

const WEATHER_CODES: Record<number, { icon: string; description: string }> = {
  0: { icon: '☀️', description: 'Clear sky' },
  1: { icon: '🌤️', description: 'Mainly clear' },
  2: { icon: '⛅', description: 'Partly cloudy' },
  3: { icon: '☁️', description: 'Overcast' },
  45: { icon: '🌫️', description: 'Fog' },
  48: { icon: '🌫️', description: 'Depositing rime fog' },
  51: { icon: '🌧️', description: 'Light drizzle' },
  53: { icon: '🌧️', description: 'Moderate drizzle' },
  55: { icon: '🌧️', description: 'Dense drizzle' },
  61: { icon: '🌧️', description: 'Slight rain' },
  63: { icon: '🌧️', description: 'Moderate rain' },
  65: { icon: '🌧️', description: 'Heavy rain' },
  71: { icon: '🌨️', description: 'Slight snow' },
  73: { icon: '🌨️', description: 'Moderate snow' },
  75: { icon: '❄️', description: 'Heavy snow' },
  80: { icon: '🌦️', description: 'Slight rain showers' },
  81: { icon: '🌦️', description: 'Moderate rain showers' },
  82: { icon: '⛈️', description: 'Violent rain showers' },
  95: { icon: '⛈️', description: 'Thunderstorm' },
  96: { icon: '⛈️', description: 'Thunderstorm with hail' },
  99: { icon: '⛈️', description: 'Thunderstorm with heavy hail' },
};

function getAqiLevel(aqi: number): { level: string; color: string; advice: string } {
  if (aqi <= 50) return { level: 'Good', color: '#00e400', advice: 'Air quality is satisfactory' };
  if (aqi <= 100) return { level: 'Moderate', color: '#ffff00', advice: 'Acceptable for most people' };
  if (aqi <= 150) return { level: 'Unhealthy for Sensitive', color: '#ff7e00', advice: 'Sensitive groups should limit outdoor activity' };
  if (aqi <= 200) return { level: 'Unhealthy', color: '#ff0000', advice: 'Everyone may experience health effects' };
  if (aqi <= 300) return { level: 'Very Unhealthy', color: '#8f3f97', advice: 'Health alert: everyone may experience serious effects' };
  return { level: 'Hazardous', color: '#7e0023', advice: 'Emergency conditions: everyone should avoid outdoor activity' };
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] ?? 'N';
}

export class LocalWeatherPanel {
  private container: HTMLElement;
  private state: LocalWeatherState = {
    weather: null,
    airQuality: null,
    sun: null,
    lastUpdate: null,
    error: null,
  };
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  async init(): Promise<void> {
    await this.refresh();
    // Refresh every 10 minutes
    this.refreshInterval = setInterval(() => this.refresh(), 10 * 60 * 1000);
  }

  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async refresh(): Promise<void> {
    const location = loadLocation();
    
    try {
      // Fetch weather and air quality in parallel
      const [weatherData, airQualityData] = await Promise.all([
        this.fetchWeather(location.lat, location.lon),
        this.fetchAirQuality(location.lat, location.lon),
      ]);

      this.state = {
        weather: weatherData.weather,
        sun: weatherData.sun,
        airQuality: airQualityData,
        lastUpdate: new Date(),
        error: null,
      };
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Failed to fetch weather data';
      console.error('[LocalWeatherPanel] Error:', error);
    }

    this.render();
  }

  private async fetchWeather(lat: number, lon: number): Promise<{ weather: WeatherData; sun: SunData }> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,weather_code,is_day&daily=sunrise,sunset,uv_index_max&timezone=auto`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    
    const data = await response.json();
    
    return {
      weather: {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        pressure: data.current.surface_pressure,
        weatherCode: data.current.weather_code,
        isDay: data.current.is_day === 1,
      },
      sun: {
        sunrise: data.daily.sunrise[0],
        sunset: data.daily.sunset[0],
        uvIndex: data.daily.uv_index_max[0],
      },
    };
  }

  private async fetchAirQuality(lat: number, lon: number): Promise<AirQualityData> {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Air Quality API error: ${response.status}`);
    
    const data = await response.json();
    
    return {
      aqi: data.current.us_aqi,
      pm25: data.current.pm2_5,
      pm10: data.current.pm10,
      ozone: data.current.ozone,
      no2: data.current.nitrogen_dioxide,
      so2: data.current.sulphur_dioxide,
      co: data.current.carbon_monoxide,
    };
  }

  private render(): void {
    const location = loadLocation();
    const zone = ZONES[0]; // Zone 1 - Hyperlocal
    const weatherInfo = this.state.weather ? WEATHER_CODES[this.state.weather.weatherCode] ?? { icon: '🌡️', description: 'Unknown' } : null;
    const aqiInfo = this.state.airQuality ? getAqiLevel(this.state.airQuality.aqi) : null;

    this.container.innerHTML = `
      <div class="local-weather-panel">
        <div class="local-weather-header">
          <div class="local-weather-location">
            <span class="location-icon">📍</span>
            <span class="location-name">${location.name ?? 'Unknown'}, ${location.city ?? ''}</span>
            <span class="location-zone" title="Zone ${zone?.id}: ${zone?.name}">${zone?.name ?? 'Local'}</span>
          </div>
          <div class="local-weather-coords">${formatCoordinates(location.lat, location.lon)}</div>
        </div>

        ${this.state.error ? `
          <div class="local-weather-error">
            <span class="error-icon">⚠️</span>
            <span>${this.state.error}</span>
          </div>
        ` : ''}

        ${this.state.weather ? `
          <div class="local-weather-current">
            <div class="weather-main">
              <span class="weather-icon">${weatherInfo?.icon ?? '🌡️'}</span>
              <span class="weather-temp">${Math.round(this.state.weather.temperature)}°C</span>
            </div>
            <div class="weather-desc">${weatherInfo?.description ?? 'Unknown'}</div>
            <div class="weather-details">
              <div class="weather-detail">
                <span class="detail-icon">💧</span>
                <span class="detail-value">${this.state.weather.humidity}%</span>
                <span class="detail-label">Humidity</span>
              </div>
              <div class="weather-detail">
                <span class="detail-icon">💨</span>
                <span class="detail-value">${Math.round(this.state.weather.windSpeed)} km/h ${getWindDirection(this.state.weather.windDirection)}</span>
                <span class="detail-label">Wind</span>
              </div>
              <div class="weather-detail">
                <span class="detail-icon">🌡️</span>
                <span class="detail-value">${Math.round(this.state.weather.pressure)} hPa</span>
                <span class="detail-label">Pressure</span>
              </div>
            </div>
          </div>
        ` : `
          <div class="local-weather-loading">Loading weather...</div>
        `}

        ${this.state.sun ? `
          <div class="local-weather-sun">
            <div class="sun-item">
              <span class="sun-icon">🌅</span>
              <span class="sun-time">${new Date(this.state.sun.sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span class="sun-label">Sunrise</span>
            </div>
            <div class="sun-item">
              <span class="sun-icon">🌇</span>
              <span class="sun-time">${new Date(this.state.sun.sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span class="sun-label">Sunset</span>
            </div>
            <div class="sun-item">
              <span class="sun-icon">☀️</span>
              <span class="sun-time">${this.state.sun.uvIndex}</span>
              <span class="sun-label">UV Index</span>
            </div>
          </div>
        ` : ''}

        ${this.state.airQuality && aqiInfo ? `
          <div class="local-weather-aqi">
            <div class="aqi-header">
              <span class="aqi-title">Air Quality</span>
              <span class="aqi-badge" style="background: ${aqiInfo.color}; color: ${this.state.airQuality.aqi > 100 ? '#fff' : '#000'}">
                AQI ${this.state.airQuality.aqi} - ${aqiInfo.level}
              </span>
            </div>
            <div class="aqi-advice">${aqiInfo.advice}</div>
            <div class="aqi-details">
              <div class="aqi-detail">
                <span class="aqi-label">PM2.5</span>
                <span class="aqi-value">${Math.round(this.state.airQuality.pm25)} µg/m³</span>
              </div>
              <div class="aqi-detail">
                <span class="aqi-label">PM10</span>
                <span class="aqi-value">${Math.round(this.state.airQuality.pm10)} µg/m³</span>
              </div>
              <div class="aqi-detail">
                <span class="aqi-label">O₃</span>
                <span class="aqi-value">${Math.round(this.state.airQuality.ozone)} µg/m³</span>
              </div>
              <div class="aqi-detail">
                <span class="aqi-label">NO₂</span>
                <span class="aqi-value">${Math.round(this.state.airQuality.no2)} µg/m³</span>
              </div>
            </div>
          </div>
        ` : ''}

        ${this.state.lastUpdate ? `
          <div class="local-weather-footer">
            Last updated: ${this.state.lastUpdate.toLocaleTimeString()}
          </div>
        ` : ''}
      </div>
    `;
  }
}
