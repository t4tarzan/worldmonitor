// Zone-based content scoring and sorting service
// Prioritizes content based on proximity to the user's location

import { ZONES, type ZoneConfig } from '@/config/variants/local';
import { getZoneForText, getZoneForCoordinates, distanceFromCenter } from './location';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ScoredItem<T> {
  item: T;
  score: number;
  zone: ZoneConfig | null;
  distance?: number;
}

export interface ScoreableItem {
  title?: string;
  description?: string;
  content?: string;
  lat?: number;
  lon?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Score an item based on text content (title, description, content)
 * Returns priority score (higher = more local/relevant)
 */
export function scoreByText(item: ScoreableItem): { score: number; zone: ZoneConfig | null } {
  const textParts = [
    item.title ?? '',
    item.description ?? '',
    item.content ?? '',
  ].join(' ');

  const zone = getZoneForText(textParts);
  return {
    score: zone?.priority ?? 0,
    zone,
  };
}

/**
 * Score an item based on coordinates
 * Returns priority score and distance
 */
export function scoreByCoordinates(
  lat: number,
  lon: number
): { score: number; zone: ZoneConfig; distance: number } {
  const { zone, distance } = getZoneForCoordinates(lat, lon);
  return {
    score: zone.priority,
    zone,
    distance,
  };
}

/**
 * Score an item using both text and coordinates (if available)
 * Coordinates take precedence if available
 */
export function scoreItem<T extends ScoreableItem>(item: T): ScoredItem<T> {
  // If coordinates are available, use them
  if (typeof item.lat === 'number' && typeof item.lon === 'number') {
    const { score, zone, distance } = scoreByCoordinates(item.lat, item.lon);
    return { item, score, zone, distance };
  }

  // Fall back to text-based scoring
  const { score, zone } = scoreByText(item);
  return { item, score, zone };
}

// ═══════════════════════════════════════════════════════════════════════════
// SORTING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sort items by zone priority (highest first)
 */
export function sortByZonePriority<T extends ScoreableItem>(items: T[]): T[] {
  const scored = items.map(item => scoreItem(item));
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.item);
}

/**
 * Sort items by distance from center (closest first)
 * Only works for items with coordinates
 */
export function sortByDistance<T extends { lat: number; lon: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const distA = distanceFromCenter(a.lat, a.lon);
    const distB = distanceFromCenter(b.lat, b.lon);
    return distA - distB;
  });
}

/**
 * Group items by zone
 */
export function groupByZone<T extends ScoreableItem>(
  items: T[]
): Map<number, { zone: ZoneConfig; items: T[] }> {
  const groups = new Map<number, { zone: ZoneConfig; items: T[] }>();

  // Initialize all zones
  for (const zone of ZONES) {
    groups.set(zone.id, { zone, items: [] });
  }

  // Add unmatched zone (id: 0)
  groups.set(0, { zone: { id: 0, name: 'Other', radiusKm: Infinity, priority: 0, zoomLevel: 5, keywords: [] }, items: [] });

  // Group items
  for (const item of items) {
    const { zone } = scoreItem(item);
    const zoneId = zone?.id ?? 0;
    groups.get(zoneId)?.items.push(item);
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTERING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Filter items to only include those matching a specific zone or higher priority
 */
export function filterByMinZone<T extends ScoreableItem>(
  items: T[],
  minZoneId: number
): T[] {
  const minZone = ZONES.find(z => z.id === minZoneId);
  if (!minZone) return items;

  return items.filter(item => {
    const { zone } = scoreItem(item);
    return zone && zone.priority >= minZone.priority;
  });
}

/**
 * Filter items within a specific distance from center
 */
export function filterByDistance<T extends { lat: number; lon: number }>(
  items: T[],
  maxDistanceKm: number
): T[] {
  return items.filter(item => {
    const distance = distanceFromCenter(item.lat, item.lon);
    return distance <= maxDistanceKm;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// BOOST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Boost local items to the top while preserving relative order within zones
 * Useful for news feeds where you want local news first, then regional, then national
 */
export function boostLocalItems<T extends ScoreableItem>(
  items: T[],
  options: {
    maxBoostCount?: number;  // Max items to boost from each zone
    _preserveRecency?: boolean;  // Keep items sorted by date within zones (reserved for future use)
  } = {}
): T[] {
  const { maxBoostCount = 5 } = options;

  const groups = groupByZone(items);
  const result: T[] = [];

  // Add items from each zone in priority order
  const sortedZones = [...groups.entries()]
    .filter(([id]) => id !== 0)  // Exclude "Other" zone
    .sort(([, a], [, b]) => b.zone.priority - a.zone.priority);

  for (const [, { items: zoneItems }] of sortedZones) {
    const toAdd = maxBoostCount > 0 ? zoneItems.slice(0, maxBoostCount) : zoneItems;
    result.push(...toAdd);
  }

  // Add remaining items from "Other" zone
  const otherItems = groups.get(0)?.items ?? [];
  result.push(...otherItems);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS-SPECIFIC SCORING
// ═══════════════════════════════════════════════════════════════════════════

export interface NewsItem {
  title: string;
  description?: string;
  link?: string;
  pubDate?: string | Date;
  source?: string;
}

/**
 * Score and sort news items with zone-based priority
 * Combines zone priority with recency
 */
export function scoreNewsItems(
  items: NewsItem[],
  options: {
    recencyWeight?: number;  // 0-1, how much to weight recency vs zone
    maxAgeHours?: number;    // Items older than this get no recency boost
  } = {}
): ScoredItem<NewsItem>[] {
  const { recencyWeight = 0.3, maxAgeHours = 24 } = options;
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  return items.map(item => {
    // Zone score (0-100)
    const { score: zoneScore, zone } = scoreByText(item);

    // Recency score (0-100)
    let recencyScore = 0;
    if (item.pubDate) {
      const pubTime = new Date(item.pubDate).getTime();
      const age = now - pubTime;
      if (age < maxAgeMs) {
        recencyScore = 100 * (1 - age / maxAgeMs);
      }
    }

    // Combined score
    const score = zoneScore * (1 - recencyWeight) + recencyScore * recencyWeight;

    return { item, score, zone };
  }).sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════════════════
// DEVICE/CAMERA SCORING (for Shodan results)
// ═══════════════════════════════════════════════════════════════════════════

export interface DeviceItem {
  ip: string;
  port: number;
  lat?: number;
  lon?: number;
  org?: string;
  product?: string;
}

/**
 * Score devices by distance from center
 */
export function scoreDevices(devices: DeviceItem[]): ScoredItem<DeviceItem>[] {
  return devices.map(device => {
    if (typeof device.lat === 'number' && typeof device.lon === 'number') {
      const { score, zone, distance } = scoreByCoordinates(device.lat, device.lon);
      return { item: device, score, zone, distance };
    }
    return { item: device, score: 0, zone: null };
  }).sort((a, b) => b.score - a.score);
}
