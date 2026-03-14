// Location service for the Local variant
// Manages coordinates, geolocation, and zone calculations

import { DEFAULT_COORDINATES, ZONES, type ZoneConfig } from '@/config/variants/local';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationInfo extends Coordinates {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ZoneMatch {
  zone: ZoneConfig;
  distance: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'worldmonitor-local-location';

export function saveLocation(location: LocationInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch (e) {
    console.warn('[Location] Failed to save location:', e);
  }
}

export function loadLocation(): LocationInfo {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Location] Failed to load location:', e);
  }
  // Return default coordinates
  return { ...DEFAULT_COORDINATES };
}

export function clearLocation(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[Location] Failed to clear location:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GEOLOCATION
// ═══════════════════════════════════════════════════════════════════════════

export async function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DISTANCE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate distance from the current location center
 */
export function distanceFromCenter(lat: number, lon: number): number {
  const center = loadLocation();
  return calculateDistance(center.lat, center.lon, lat, lon);
}

// ═══════════════════════════════════════════════════════════════════════════
// ZONE CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get the zone for a given distance from center
 */
export function getZoneForDistance(distanceKm: number): ZoneConfig {
  for (const zone of ZONES) {
    if (distanceKm <= zone.radiusKm) {
      return zone;
    }
  }
  // Return last zone (national) as fallback - ZONES is guaranteed to have at least one element
  return ZONES[ZONES.length - 1] as ZoneConfig;
}

/**
 * Get the zone for given coordinates
 */
export function getZoneForCoordinates(lat: number, lon: number): ZoneMatch {
  const distance = distanceFromCenter(lat, lon);
  const zone = getZoneForDistance(distance);
  return { zone, distance };
}

/**
 * Get the zone based on text content (keyword matching)
 */
export function getZoneForText(text: string): ZoneConfig | null {
  const lowerText = text.toLowerCase();
  
  for (const zone of ZONES) {
    for (const keyword of zone.keywords) {
      if (lowerText.includes(keyword)) {
        return zone;
      }
    }
  }
  
  return null;
}

/**
 * Get priority score for text content based on zone keywords
 * Higher score = more local/relevant
 */
export function getZonePriorityForText(text: string): number {
  const zone = getZoneForText(text);
  return zone?.priority ?? 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// COORDINATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse coordinates from string input
 * Supports formats: "17.43865, 78.409022" or "17.43865 78.409022"
 */
export function parseCoordinates(input: string): Coordinates | null {
  const cleaned = input.trim().replace(/[,;]/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  
  if (parts.length !== 2) return null;
  
  const latStr = parts[0];
  const lonStr = parts[1];
  if (!latStr || !lonStr) return null;
  
  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;
  
  return { lat, lon };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lon: number, precision = 5): string {
  return `${lat.toFixed(precision)}°N, ${lon.toFixed(precision)}°E`;
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  }
  return `${Math.round(distanceKm)}km`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SHODAN GEO QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Shodan geo query for a specific zone
 */
export function getShodanGeoQuery(zoneId: number): string {
  const location = loadLocation();
  const zone = ZONES.find(z => z.id === zoneId) ?? ZONES[2] ?? ZONES[0];
  const radius = zone?.radiusKm ?? 50;
  return `geo:${location.lat.toFixed(2)},${location.lon.toFixed(2)},${radius}`;
}

/**
 * Get all Shodan geo queries for progressive zone searches
 */
export function getShodanZoneQueries(): { zone: ZoneConfig; query: string }[] {
  const location = loadLocation();
  return ZONES.filter(z => z.radiusKm !== Infinity).map(zone => ({
    zone,
    query: `geo:${location.lat.toFixed(2)},${location.lon.toFixed(2)},${zone.radiusKm}`,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// GOOGLE MAPS HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate Google Maps embed URL for Street View
 */
export function getStreetViewEmbedUrl(): string {
  const location = loadLocation();
  return `https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1s!2m2!1d${location.lat}!2d${location.lon}!3f0!4f0!5f0.7820865974627469`;
}

/**
 * Generate Google Maps embed URL for Satellite View
 */
export function getSatelliteEmbedUrl(_zoom = 18): string {
  const location = loadLocation();
  return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d800!2d${location.lon}!3d${location.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1710423600000`;
}

/**
 * Generate Google Maps link for opening in new tab
 */
export function getGoogleMapsLink(): string {
  const location = loadLocation();
  return `https://www.google.com/maps?q=${location.lat},${location.lon}`;
}
