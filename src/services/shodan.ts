// Shodan API service for local intelligence
// Provides device discovery, statistics, and vulnerability data for coordinates

import { getShodanZoneQueries } from './location';
import { getRuntimeConfigSnapshot } from './runtime-config';
import type { ZoneConfig } from '@/config/variants/local';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ShodanDevice {
  ip: string;
  port: number;
  org?: string;
  product?: string;
  version?: string;
  os?: string;
  hostnames?: string[];
  domains?: string[];
  lat?: number;
  lon?: number;
  city?: string;
  country?: string;
  asn?: string;
  isp?: string;
  vulns?: string[];
  hasScreenshot?: boolean;
  timestamp?: string;
}

export interface ShodanStats {
  total: number;
  ports: { value: number; count: number }[];
  orgs: { value: string; count: number }[];
  products: { value: string; count: number }[];
  os: { value: string; count: number }[];
  vulns: { value: string; count: number }[];
}

export interface ShodanZoneData {
  zone: ZoneConfig;
  query: string;
  stats: ShodanStats | null;
  devices: ShodanDevice[];
  cameras: ShodanDevice[];
  error?: string;
}

export interface ShodanState {
  apiKey: string | null;
  zones: ShodanZoneData[];
  lastUpdate: Date | null;
  loading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEY ACCESS
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_STORAGE = 'worldmonitor-shodan-cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Get Shodan API key from runtime config (environment variable)
 */
export function getShodanApiKey(): string | null {
  try {
    const config = getRuntimeConfigSnapshot();
    return config.secrets['SHODAN_API_KEY']?.value ?? null;
  } catch (e) {
    console.warn('[Shodan] Failed to get API key from runtime config:', e);
    return null;
  }
}

/**
 * Check if Shodan API key is configured
 */
export function isShodanConfigured(): boolean {
  return !!getShodanApiKey();
}

interface CachedData {
  timestamp: number;
  data: ShodanZoneData[];
}

function getCachedData(): ShodanZoneData[] | null {
  try {
    const cached = localStorage.getItem(CACHE_STORAGE);
    if (!cached) return null;
    
    const parsed: CachedData = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_STORAGE);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedData(data: ShodanZoneData[]): void {
  try {
    const cached: CachedData = {
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(CACHE_STORAGE, JSON.stringify(cached));
  } catch (e) {
    console.warn('[Shodan] Failed to cache data:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

const SHODAN_API_BASE = 'https://api.shodan.io';

/**
 * Search Shodan for devices matching a query
 */
async function searchShodan(
  apiKey: string,
  query: string,
  limit = 20
): Promise<ShodanDevice[]> {
  const url = `${SHODAN_API_BASE}/shodan/host/search?key=${apiKey}&query=${encodeURIComponent(query)}&limit=${limit}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid API key');
    if (response.status === 429) throw new Error('Rate limit exceeded');
    throw new Error(`Shodan API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return (data.matches ?? []).map((match: Record<string, unknown>) => ({
    ip: match.ip_str as string,
    port: match.port as number,
    org: match.org as string | undefined,
    product: match.product as string | undefined,
    version: match.version as string | undefined,
    os: match.os as string | undefined,
    hostnames: match.hostnames as string[] | undefined,
    domains: match.domains as string[] | undefined,
    lat: (match.location as Record<string, unknown>)?.latitude as number | undefined,
    lon: (match.location as Record<string, unknown>)?.longitude as number | undefined,
    city: (match.location as Record<string, unknown>)?.city as string | undefined,
    country: (match.location as Record<string, unknown>)?.country_name as string | undefined,
    asn: match.asn as string | undefined,
    isp: match.isp as string | undefined,
    vulns: match.vulns ? Object.keys(match.vulns as Record<string, unknown>) : undefined,
    hasScreenshot: !!match.screenshot,
    timestamp: match.timestamp as string | undefined,
  }));
}

/**
 * Get statistics for a Shodan query
 */
async function getShodanStats(
  apiKey: string,
  query: string,
  facets = 'port,org,product,os,vuln'
): Promise<ShodanStats> {
  const url = `${SHODAN_API_BASE}/shodan/host/count?key=${apiKey}&query=${encodeURIComponent(query)}&facets=${facets}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid API key');
    if (response.status === 429) throw new Error('Rate limit exceeded');
    throw new Error(`Shodan API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    total: data.total ?? 0,
    ports: (data.facets?.port ?? []).map((f: { value: number; count: number }) => ({ value: f.value, count: f.count })),
    orgs: (data.facets?.org ?? []).map((f: { value: string; count: number }) => ({ value: f.value, count: f.count })),
    products: (data.facets?.product ?? []).map((f: { value: string; count: number }) => ({ value: f.value, count: f.count })),
    os: (data.facets?.os ?? []).map((f: { value: string; count: number }) => ({ value: f.value, count: f.count })),
    vulns: (data.facets?.vuln ?? []).map((f: { value: string; count: number }) => ({ value: f.value, count: f.count })),
  };
}

/**
 * Search for cameras in the area
 */
async function searchCameras(
  apiKey: string,
  geoQuery: string,
  limit = 10
): Promise<ShodanDevice[]> {
  // Search for common camera products
  const cameraQuery = `${geoQuery} (product:webcam OR product:camera OR product:hikvision OR product:dahua OR product:panasonic OR port:554 OR port:8080)`;
  return searchShodan(apiKey, cameraQuery, limit);
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch Shodan data for all zones around the current location
 */
export async function fetchShodanData(
  apiKey: string,
  options: {
    useCache?: boolean;
    zonesLimit?: number;
  } = {}
): Promise<ShodanZoneData[]> {
  const { useCache = true, zonesLimit = 3 } = options;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData();
    if (cached) {
      console.log('[Shodan] Using cached data');
      return cached;
    }
  }
  
  const zoneQueries = getShodanZoneQueries().slice(0, zonesLimit);
  const results: ShodanZoneData[] = [];
  
  for (const { zone, query } of zoneQueries) {
    try {
      console.log(`[Shodan] Fetching Zone ${zone.id} (${zone.name}): ${query}`);
      
      // Fetch stats and devices in parallel
      const [stats, devices, cameras] = await Promise.all([
        getShodanStats(apiKey, query).catch(() => null),
        searchShodan(apiKey, query, 15).catch(() => []),
        searchCameras(apiKey, query, 5).catch(() => []),
      ]);
      
      results.push({
        zone,
        query,
        stats,
        devices,
        cameras,
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[Shodan] Error fetching Zone ${zone.id}:`, error);
      results.push({
        zone,
        query,
        stats: null,
        devices: [],
        cameras: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  
  // Cache results
  setCachedData(results);
  
  return results;
}

/**
 * Validate Shodan API key
 */
export async function validateShodanApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `${SHODAN_API_BASE}/api-info?key=${apiKey}`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get Shodan API info (credits, usage, etc.)
 */
export async function getShodanApiInfo(apiKey: string): Promise<{
  queryCredits: number;
  scanCredits: number;
  plan: string;
} | null> {
  try {
    const url = `${SHODAN_API_BASE}/api-info?key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      queryCredits: data.query_credits ?? 0,
      scanCredits: data.scan_credits ?? 0,
      plan: data.plan ?? 'unknown',
    };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get device type icon based on product/port
 */
export function getDeviceIcon(device: ShodanDevice): string {
  const product = (device.product ?? '').toLowerCase();
  const port = device.port;
  
  if (product.includes('camera') || product.includes('webcam') || product.includes('hikvision') || product.includes('dahua')) {
    return '📹';
  }
  if (product.includes('router') || product.includes('mikrotik')) {
    return '📡';
  }
  if (product.includes('nginx') || product.includes('apache') || product.includes('iis')) {
    return '🌐';
  }
  if (port === 22) return '🔐';
  if (port === 3389) return '🖥️';
  if (port === 554) return '📹';
  if (port === 1883) return '📊'; // MQTT
  if (port === 80 || port === 443) return '🌐';
  
  return '💻';
}

/**
 * Format port for display
 */
export function formatPort(port: number): string {
  const portNames: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    443: 'HTTPS',
    554: 'RTSP',
    1883: 'MQTT',
    3306: 'MySQL',
    3389: 'RDP',
    5432: 'PostgreSQL',
    5900: 'VNC',
    8080: 'HTTP-Alt',
    8443: 'HTTPS-Alt',
  };
  
  return portNames[port] ?? `${port}`;
}
